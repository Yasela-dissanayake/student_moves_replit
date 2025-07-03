/**
 * WebRTC Service for Virtual Viewings
 * Handles real-time video streaming between landlords/agents and tenants
 */

import { Server } from 'socket.io';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';

// Store active viewing sessions
interface ViewingSession {
  id: string;
  hostSocketId: string;
  hostType: 'landlord' | 'agent';
  hostId: number;
  propertyId: number;
  participants: {
    socketId: string;
    userId: number | null;
    name: string;
    joined: Date;
  }[];
  created: Date;
  active: boolean;
}

// Map of active viewing sessions
const activeSessions = new Map<string, ViewingSession>();

export function setupWebRTCServer(server: http.Server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[webrtc] New connection: ${socket.id}`);

    // Host creates a new viewing session
    socket.on('create-viewing-session', (data: {
      hostType: 'landlord' | 'agent',
      hostId: number,
      propertyId: number,
      hostName: string
    }) => {
      const sessionId = uuidv4();
      
      const session: ViewingSession = {
        id: sessionId,
        hostSocketId: socket.id,
        hostType: data.hostType,
        hostId: data.hostId,
        propertyId: data.propertyId,
        participants: [{
          socketId: socket.id,
          userId: data.hostId,
          name: data.hostName,
          joined: new Date()
        }],
        created: new Date(),
        active: true
      };
      
      activeSessions.set(sessionId, session);
      
      // Join socket to room with session ID
      socket.join(sessionId);
      
      // Send session details back to host
      socket.emit('viewing-session-created', {
        sessionId,
        session
      });
      
      console.log(`[webrtc] New viewing session created: ${sessionId}`);
    });

    // Tenant joins an existing viewing session
    socket.on('join-viewing-session', (data: {
      sessionId: string,
      userId: number | null,
      name: string
    }) => {
      const { sessionId, userId, name } = data;
      const session = activeSessions.get(sessionId);
      
      if (!session) {
        socket.emit('join-error', { message: 'Session not found' });
        return;
      }
      
      if (!session.active) {
        socket.emit('join-error', { message: 'Session is no longer active' });
        return;
      }
      
      // Add participant to session
      session.participants.push({
        socketId: socket.id,
        userId,
        name,
        joined: new Date()
      });
      
      // Join socket to room with session ID
      socket.join(sessionId);
      
      // Notify host that a new participant joined
      io.to(session.hostSocketId).emit('participant-joined', {
        socketId: socket.id,
        userId,
        name,
        joined: new Date()
      });
      
      // Notify the joining participant of success
      socket.emit('viewing-session-joined', {
        sessionId,
        hostSocketId: session.hostSocketId,
        participants: session.participants
      });
      
      console.log(`[webrtc] Participant ${name} joined session: ${sessionId}`);
    });

    // WebRTC signaling: Forward signals between peers
    socket.on('signal', (data: {
      to: string,
      signal: any,
      from: string
    }) => {
      const { to, signal, from } = data;
      
      io.to(to).emit('signal', {
        from,
        signal
      });
    });

    // Host ends the viewing session
    socket.on('end-viewing-session', (data: {
      sessionId: string
    }) => {
      const { sessionId } = data;
      const session = activeSessions.get(sessionId);
      
      if (session && session.hostSocketId === socket.id) {
        session.active = false;
        
        // Notify all participants that the session has ended
        io.to(sessionId).emit('viewing-session-ended', {
          sessionId,
          message: 'Host has ended the viewing session'
        });
        
        console.log(`[webrtc] Viewing session ended: ${sessionId}`);
      }
    });

    // Participant leaves the viewing session
    socket.on('leave-viewing-session', (data: {
      sessionId: string
    }) => {
      const { sessionId } = data;
      const session = activeSessions.get(sessionId);
      
      if (session) {
        // Remove participant from session
        const participantIndex = session.participants.findIndex(
          p => p.socketId === socket.id
        );
        
        if (participantIndex !== -1) {
          const participant = session.participants[participantIndex];
          session.participants.splice(participantIndex, 1);
          
          // Notify host that a participant left
          io.to(session.hostSocketId).emit('participant-left', {
            socketId: socket.id,
            name: participant.name
          });
          
          console.log(`[webrtc] Participant ${participant.name} left session: ${sessionId}`);
        }
      }
      
      socket.leave(sessionId);
    });

    // Handle chat messages within a viewing session
    socket.on('viewing-chat-message', (data: {
      sessionId: string,
      message: string,
      sender: {
        id: number | null,
        name: string,
        isHost: boolean
      }
    }) => {
      const { sessionId, message, sender } = data;
      const session = activeSessions.get(sessionId);
      
      if (session && session.active) {
        // Broadcast message to all participants in the session
        io.to(sessionId).emit('viewing-chat-message', {
          message,
          sender,
          timestamp: new Date()
        });
      }
    });

    // Host toggles recording
    socket.on('toggle-recording', (data: {
      sessionId: string,
      isRecording: boolean
    }) => {
      const { sessionId, isRecording } = data;
      const session = activeSessions.get(sessionId);
      
      if (session && session.hostSocketId === socket.id) {
        // Notify all participants about recording status
        io.to(sessionId).emit('recording-status-changed', {
          isRecording,
          timestamp: new Date()
        });
      }
    });

    // Handle virtual pointer events
    socket.on('virtual-pointer', (data: {
      sessionId: string,
      position: { x: number, y: number }
    }) => {
      const { sessionId, position } = data;
      const session = activeSessions.get(sessionId);
      
      if (session && session.active) {
        // Only forward pointer events from the host
        if (socket.id === session.hostSocketId) {
          socket.to(sessionId).emit('virtual-pointer', {
            position,
            timestamp: new Date()
          });
        }
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`[webrtc] Disconnected: ${socket.id}`);
      
      // Find any sessions this socket is hosting and mark them inactive
      for (const [sessionId, session] of activeSessions.entries()) {
        if (session.hostSocketId === socket.id) {
          session.active = false;
          
          // Notify all participants that the session has ended
          io.to(sessionId).emit('viewing-session-ended', {
            sessionId,
            message: 'Host has disconnected'
          });
          
          console.log(`[webrtc] Host disconnected, ending session: ${sessionId}`);
        } else {
          // Check if this socket is a participant in any session
          const participantIndex = session.participants.findIndex(
            p => p.socketId === socket.id
          );
          
          if (participantIndex !== -1) {
            const participant = session.participants[participantIndex];
            session.participants.splice(participantIndex, 1);
            
            // Notify host that a participant left
            io.to(session.hostSocketId).emit('participant-left', {
              socketId: socket.id,
              name: participant.name
            });
            
            console.log(`[webrtc] Participant ${participant.name} disconnected from session: ${sessionId}`);
          }
        }
      }
    });
  });

  console.log('[webrtc] WebRTC server initialized');
  return io;
}

// Get all active sessions (for admin purposes)
export function getActiveSessions(): ViewingSession[] {
  return Array.from(activeSessions.values()).filter(session => session.active);
}

// Get active session by ID
export function getSessionById(sessionId: string): ViewingSession | undefined {
  return activeSessions.get(sessionId);
}

// Update viewing request status when a virtual viewing is completed
export async function recordVirtualViewing(
  sessionId: string,
  viewingRequestId: number,
  storage: any
): Promise<boolean> {
  const session = activeSessions.get(sessionId);
  
  if (!session) return false;
  
  try {
    // Update viewing request with virtual viewing details
    await storage.updateViewingRequest(viewingRequestId, {
      status: 'completed',
      virtualViewingUrl: `/virtual-viewing-recording/${sessionId}`,
      virtualViewingScheduledAt: session.created
    });
    
    return true;
  } catch (error) {
    console.error('[webrtc] Error recording virtual viewing:', error);
    return false;
  }
}