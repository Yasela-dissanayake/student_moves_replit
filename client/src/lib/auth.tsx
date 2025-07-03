import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, logout as apiLogout, getCurrentUser, register as apiRegister } from './api';
import { UserType } from './types';

interface AuthContextType {
  user: UserType | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  userType: string | null;
  login: (email: string, password: string, userType?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  register: (userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if the user is logged in when the app loads
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        // getCurrentUser now returns the JSON data directly because of apiRequest
        const userData = await getCurrentUser();
        
        // If there's a _isErrorResponse flag from apiRequest, user is not authenticated
        if (userData && !userData._isErrorResponse) {
          setUser(userData);
        } else {
          // Not logged in, or error occurred
          setUser(null);
        }
      } catch (err) {
        // Not logged in, or error occurred
        console.error("Auth check failed:", err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string, userType: string = 'tenant'): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      // apiLogin now returns the JSON data directly because of apiRequest
      const userData = await apiLogin(email, password, userType);
      
      if (userData && !userData._isErrorResponse) {
        setUser(userData);
        return true;
      } else {
        const errorMessage = userData.message || `Login failed with status: ${userData.statusCode}`;
        setError(errorMessage);
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);
    
    // Clear user state immediately to update UI
    setUser(null);
    
    try {
      // Call logout API to destroy session on server
      await apiLogout();
    } catch (err: any) {
      // Log error but continue with client cleanup
      console.error('Logout API failed:', err);
    }
    
    // Always clear local data regardless of API success
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear all cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
    } catch (err) {
      console.error('Error clearing local data:', err);
    }
    
    setIsLoading(false);
    
    // Use setTimeout to ensure state updates have processed
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  const refreshUser = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // getCurrentUser now returns the JSON data directly because of apiRequest
      const userData = await getCurrentUser();
      
      if (userData && !userData._isErrorResponse) {
        setUser(userData);
      } else {
        setUser(null);
        if (userData.statusCode !== 401) { // Ignore 401 Unauthorized as it's expected for logged out users
          const errorMessage = userData.message || `Failed to refresh user data: ${userData.statusCode}`;
          setError(errorMessage);
          throw new Error(errorMessage);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to refresh user data');
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const register = async (userData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // apiRegister now returns the JSON data directly because of apiRequest
      const registeredUser = await apiRegister(userData);
      
      if (registeredUser && !registeredUser._isErrorResponse) {
        setUser(registeredUser);
        return registeredUser;
      } else {
        const errorMessage = registeredUser.message || `Registration failed with status: ${registeredUser.statusCode}`;
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to register');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    userType: user?.userType || null,
    login,
    logout,
    refreshUser,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}