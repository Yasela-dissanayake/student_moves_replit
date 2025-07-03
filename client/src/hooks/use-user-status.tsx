import { useState, useEffect, useCallback, useContext, createContext, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/lib/auth';
import { UserStatus, UserStatusInfo } from '@/components/chat/UserStatusIndicator';

interface UserStatusContextType {
  // Current user status state
  currentUserStatus: UserStatus;
  customStatus: string | undefined;
  
  // Status management functions
  setStatus: (status: UserStatus, customStatus?: string) => void;
  
  // Status tracking for other users
  userStatuses: Map<number, UserStatusInfo>;
  getUserStatus: (userId: number) => UserStatusInfo | undefined;
  loadUserStatuses: (userIds: number[]) => Promise<void>;
  
  // Socket connection status
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

const defaultContext: UserStatusContextType = {
  currentUserStatus: 'offline',
  customStatus: undefined,
  setStatus: () => {},
  userStatuses: new Map(),
  getUserStatus: () => undefined,
  loadUserStatuses: async () => {},
  isConnected: false,
  isLoading: true,
  error: null
};

const UserStatusContext = createContext<UserStatusContextType>(defaultContext);

export function UserStatusProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Status states
  const [currentUserStatus, setCurrentUserStatus] = useState<UserStatus>('online');
  const [customStatus, setCustomStatus] = useState<string | undefined>(undefined);
  const [userStatuses, setUserStatuses] = useState<Map<number, UserStatusInfo>>(new Map());
  
  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }
    
    // Initialize socket
    const socketInstance = io({
      path: '/socket.io/chat'
    });
    
    setSocket(socketInstance);
    
    socketInstance.on('connect', () => {
      console.log('[status] Socket connected');
      setIsConnected(true);
      
      // Authenticate
      socketInstance.emit('authenticate', {
        userId: user.id,
        token: 'session' // Using session-based auth
      });
    });
    
    socketInstance.on('authenticated', () => {
      console.log('[status] Socket authenticated');
      setIsLoading(false);
      
      // Default to online status when connected
      setStatus('online');
    });
    
    socketInstance.on('authentication_error', (error) => {
      console.error('[status] Authentication error:', error);
      setError(error.message);
      setIsLoading(false);
    });
    
    socketInstance.on('connect_error', (err) => {
      console.error('[status] Connection error:', err);
      setError(`Connection error: ${err.message}`);
      setIsConnected(false);
      setIsLoading(false);
    });
    
    socketInstance.on('disconnect', () => {
      console.log('[status] Socket disconnected');
      setIsConnected(false);
    });
    
    // Status update handlers
    socketInstance.on('user_status_update', (statusInfo: UserStatusInfo) => {
      console.log('[status] Status update received:', statusInfo);
      setUserStatuses(prev => {
        const newMap = new Map(prev);
        newMap.set(statusInfo.userId, {
          ...statusInfo,
          lastActive: new Date(statusInfo.lastActive)
        });
        return newMap;
      });
    });
    
    socketInstance.on('users_status', ({ statuses }: { statuses: UserStatusInfo[] }) => {
      console.log('[status] Multiple statuses received:', statuses);
      setUserStatuses(prev => {
        const newMap = new Map(prev);
        statuses.forEach(status => {
          newMap.set(status.userId, {
            ...status,
            lastActive: new Date(status.lastActive)
          });
        });
        return newMap;
      });
    });
    
    socketInstance.on('status_updated', (data: { status: UserStatus, customStatus?: string }) => {
      console.log('[status] Your status updated:', data);
      setCurrentUserStatus(data.status);
      setCustomStatus(data.customStatus);
    });
    
    // Cleanup
    return () => {
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [isAuthenticated, user]);
  
  // Function to set user's status
  const setStatus = useCallback((status: UserStatus, newCustomStatus?: string) => {
    if (socket && isConnected) {
      socket.emit('set_user_status', {
        status,
        customStatus: newCustomStatus
      });
      
      // Optimistically update local state
      setCurrentUserStatus(status);
      setCustomStatus(newCustomStatus);
    }
  }, [socket, isConnected]);
  
  // Function to load statuses for multiple users
  const loadUserStatuses = useCallback(async (userIds: number[]) => {
    if (!socket || !isConnected) return;
    
    return new Promise<void>((resolve) => {
      // Filter out users we already have status for
      const neededUserIds = userIds.filter(id => !userStatuses.has(id));
      
      if (neededUserIds.length === 0) {
        resolve();
        return;
      }
      
      // Set up a one-time handler for the response
      const handleStatusResponse = ({ statuses }: { statuses: UserStatusInfo[] }) => {
        setUserStatuses(prev => {
          const newMap = new Map(prev);
          statuses.forEach(status => {
            newMap.set(status.userId, {
              ...status,
              lastActive: new Date(status.lastActive)
            });
          });
          return newMap;
        });
        
        socket.off('users_status', handleStatusResponse);
        resolve();
      };
      
      // Listen for the response
      socket.once('users_status', handleStatusResponse);
      
      // Request statuses
      socket.emit('get_users_status', { userIds: neededUserIds });
    });
  }, [socket, isConnected, userStatuses]);
  
  // Function to get status of a specific user
  const getUserStatus = useCallback((userId: number): UserStatusInfo | undefined => {
    return userStatuses.get(userId);
  }, [userStatuses]);
  
  const value = {
    currentUserStatus,
    customStatus,
    setStatus,
    userStatuses,
    getUserStatus,
    loadUserStatuses,
    isConnected,
    isLoading,
    error
  };
  
  return (
    <UserStatusContext.Provider value={value}>
      {children}
    </UserStatusContext.Provider>
  );
}

export function useUserStatus() {
  const context = useContext(UserStatusContext);
  if (context === undefined) {
    throw new Error('useUserStatus must be used within a UserStatusProvider');
  }
  return context;
}