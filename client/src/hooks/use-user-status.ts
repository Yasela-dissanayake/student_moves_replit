import { useState, useEffect, useRef } from 'react';

export type UserStatus = 'online' | 'away' | 'busy' | 'offline';

interface UserStatusData {
  userId: number;
  status: UserStatus;
  activity?: string;
  location?: string;
  lastSeen?: Date;
}

interface UseUserStatusReturn {
  userStatuses: Map<number, UserStatusData>;
  isConnected: boolean;
  updateStatus: (status: UserStatus, activity?: string, location?: string) => void;
  getUserStatus: (userId: number) => UserStatusData | null;
}

export function useUserStatus(currentUserId?: number): UseUserStatusReturn {
  const [userStatuses, setUserStatuses] = useState<Map<number, UserStatusData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!currentUserId) return;

    const connect = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/status-ws`;
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[user-status] Connected to status WebSocket');
          setIsConnected(true);
          
          // Authenticate with the server
          ws.send(JSON.stringify({
            type: 'auth',
            userId: currentUserId,
            userAgent: navigator.userAgent
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'auth_success':
                console.log('[user-status] Authentication successful');
                break;
              
              case 'status_update':
                setUserStatuses(prev => {
                  const newMap = new Map(prev);
                  newMap.set(data.userId, {
                    userId: data.userId,
                    status: data.status,
                    activity: data.activity,
                    location: data.location,
                    lastSeen: data.timestamp ? new Date(data.timestamp) : new Date()
                  });
                  return newMap;
                });
                break;
              
              case 'ping':
                // Respond to ping
                ws.send(JSON.stringify({ type: 'pong' }));
                break;
            }
          } catch (error) {
            console.error('[user-status] Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('[user-status] WebSocket connection closed');
          setIsConnected(false);
          
          // Attempt to reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[user-status] Attempting to reconnect...');
            connect();
          }, 3000);
        };

        ws.onerror = (error) => {
          console.error('[user-status] WebSocket error:', error);
          setIsConnected(false);
        };

      } catch (error) {
        console.error('[user-status] Error creating WebSocket connection:', error);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [currentUserId]);

  const updateStatus = (status: UserStatus, activity?: string, location?: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && currentUserId) {
      wsRef.current.send(JSON.stringify({
        type: 'status_update',
        userId: currentUserId,
        status,
        activity,
        location
      }));
    }
  };

  const getUserStatus = (userId: number): UserStatusData | null => {
    return userStatuses.get(userId) || null;
  };

  return {
    userStatuses,
    isConnected,
    updateStatus,
    getUserStatus
  };
}

