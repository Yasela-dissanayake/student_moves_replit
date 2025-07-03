import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { db } from './db';
import { userStatus, userActivity, activeConnections } from '../shared/user-status-schema';
import { eq, and, gte } from 'drizzle-orm';

interface UserConnection {
  socket: WebSocket;
  userId: number;
  lastPing: Date;
}

class UserStatusService {
  private connections = new Map<string, UserConnection>();
  private wss: WebSocketServer | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/status-ws',
      verifyClient: (info) => {
        // Basic verification - in production, add proper auth
        return true;
      }
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.startPingInterval();

    console.log('[user-status] Real-time user status service initialized');
  }

  private handleConnection(socket: WebSocket, request: any) {
    const socketId = this.generateSocketId();
    
    socket.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleMessage(socketId, socket, message);
      } catch (error) {
        console.error('[user-status] Error handling message:', error);
      }
    });

    socket.on('close', () => {
      this.handleDisconnection(socketId);
    });

    socket.on('error', (error) => {
      console.error('[user-status] Socket error:', error);
      this.handleDisconnection(socketId);
    });
  }

  private async handleMessage(socketId: string, socket: WebSocket, message: any) {
    switch (message.type) {
      case 'auth':
        await this.handleAuth(socketId, socket, message.userId, message.userAgent, message.ipAddress);
        break;
      case 'status_update':
        await this.handleStatusUpdate(message.userId, message.status, message.activity, message.location);
        break;
      case 'activity':
        await this.trackActivity(message.userId, message.activityType, message.activityData);
        break;
      case 'ping':
        await this.handlePing(socketId);
        break;
    }
  }

  private async handleAuth(socketId: string, socket: WebSocket, userId: number, userAgent?: string, ipAddress?: string) {
    // Store connection
    this.connections.set(socketId, {
      socket,
      userId,
      lastPing: new Date()
    });

    // Update database
    await db.insert(activeConnections).values({
      userId,
      socketId,
      userAgent,
      ipAddress
    });

    // Set user as online
    await this.updateUserStatus(userId, 'online');

    // Notify about user coming online
    this.broadcastStatusUpdate(userId, 'online');

    socket.send(JSON.stringify({
      type: 'auth_success',
      userId
    }));
  }

  private async handleStatusUpdate(userId: number, status: string, activity?: string, location?: string) {
    await this.updateUserStatus(userId, status, activity, location);
    this.broadcastStatusUpdate(userId, status, activity, location);
  }

  private async updateUserStatus(userId: number, status: string, activity?: string, location?: string) {
    // Check if user status exists
    const existingStatus = await db.select()
      .from(userStatus)
      .where(eq(userStatus.userId, userId))
      .limit(1);

    if (existingStatus.length > 0) {
      // Update existing status
      await db.update(userStatus)
        .set({
          status,
          currentActivity: activity,
          location,
          isActive: status === 'online',
          lastSeen: new Date(),
          updatedAt: new Date()
        })
        .where(eq(userStatus.userId, userId));
    } else {
      // Create new status
      await db.insert(userStatus).values({
        userId,
        status,
        currentActivity: activity,
        location,
        isActive: status === 'online',
        lastSeen: new Date()
      });
    }
  }

  private async trackActivity(userId: number, activityType: string, activityData?: string) {
    await db.insert(userActivity).values({
      userId,
      activityType,
      activityData
    });
  }

  private async handlePing(socketId: string) {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.lastPing = new Date();
      
      // Update database
      await db.update(activeConnections)
        .set({ lastPing: new Date() })
        .where(eq(activeConnections.socketId, socketId));
    }
  }

  private handleDisconnection(socketId: string) {
    const connection = this.connections.get(socketId);
    if (connection) {
      // Update user status to offline
      this.updateUserStatus(connection.userId, 'offline');
      this.broadcastStatusUpdate(connection.userId, 'offline');
      
      // Remove from active connections
      db.delete(activeConnections)
        .where(eq(activeConnections.socketId, socketId));
      
      this.connections.delete(socketId);
    }
  }

  private broadcastStatusUpdate(userId: number, status: string, activity?: string, location?: string) {
    const message = JSON.stringify({
      type: 'status_update',
      userId,
      status,
      activity,
      location,
      timestamp: new Date().toISOString()
    });

    this.connections.forEach(connection => {
      if (connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.send(message);
      }
    });
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      const now = new Date();
      const timeout = 30000; // 30 seconds

      this.connections.forEach((connection, socketId) => {
        const timeSinceLastPing = now.getTime() - connection.lastPing.getTime();
        
        if (timeSinceLastPing > timeout) {
          // Connection timed out
          this.handleDisconnection(socketId);
        } else if (connection.socket.readyState === WebSocket.OPEN) {
          // Send ping
          connection.socket.send(JSON.stringify({ type: 'ping' }));
        }
      });
    }, 15000); // Ping every 15 seconds
  }

  async getUserStatus(userId: number) {
    const status = await db.select()
      .from(userStatus)
      .where(eq(userStatus.userId, userId))
      .limit(1);

    return status[0] || { status: 'offline', isActive: false };
  }

  async getActiveUsers() {
    const activeUsers = await db.select()
      .from(userStatus)
      .where(eq(userStatus.isActive, true));

    return activeUsers;
  }

  async getUsersStatus(userIds: number[]) {
    const statuses = await db.select()
      .from(userStatus)
      .where(and(
        eq(userStatus.isActive, true),
        // userIds.length > 0 ? inArray(userStatus.userId, userIds) : undefined
      ));

    return statuses;
  }

  private generateSocketId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  shutdown() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    if (this.wss) {
      this.wss.close();
    }

    // Set all users offline
    db.update(userStatus)
      .set({ status: 'offline', isActive: false, updatedAt: new Date() });
    
    // Clear active connections
    db.delete(activeConnections);
  }
}

export const userStatusService = new UserStatusService();