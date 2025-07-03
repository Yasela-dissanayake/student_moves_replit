import { useState } from 'react';
import { useAuth } from '@/lib/auth';

// Define the supported user types
export type UserType = 'tenant' | 'landlord' | 'agent' | 'admin' | 'student';

export function useAuthLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();

  const loginWithUserType = async (
    email: string, 
    password: string, 
    userType: UserType
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Pass the userType parameter to the login function
      // We'll consider a login successful if it doesn't throw an error
      await auth.login(email, password, userType);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    loginWithUserType,
    isLoading,
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    logout: auth.logout,
    error: auth.error
  };
}