/**
 * Chat Service Integration
 * This module provides integration points for connecting the chat functionality
 * with other parts of the application (auth, user registration, etc.)
 */
import { onboardNewChatUser } from './chat-welcome-service';

/**
 * Integrate chat service with user registration
 * Call this function when a new user is registered
 * 
 * @param user The newly registered user
 */
export async function handleNewUserRegistration(user: {
  id: number;
  name: string;
  email: string;
  userType: string;
}): Promise<void> {
  // Only student users get full chat onboarding
  if (user.userType === 'student') {
    console.log(`[chat-service-integration] Starting chat onboarding for student: ${user.name} (${user.id})`);
    onboardNewChatUser(user);
  } else {
    console.log(`[chat-service-integration] Skipping chat onboarding for non-student user: ${user.userType}`);
  }
}

/**
 * Register a user login to update chat status
 * Call this function when a user logs in
 * 
 * @param userId The ID of the user who logged in
 */
export async function handleUserLogin(userId: number): Promise<void> {
  // This could update user online status, etc.
  console.log(`[chat-service-integration] User logged in: ${userId}`);
  
  // In a real implementation, we would:
  // 1. Update the user's online status
  // 2. Notify friends/contacts
  // 3. Clear any unread message counts
}

/**
 * Register a user logout to update chat status
 * Call this function when a user logs out
 * 
 * @param userId The ID of the user who logged out
 */
export async function handleUserLogout(userId: number): Promise<void> {
  // This could update user offline status, etc.
  console.log(`[chat-service-integration] User logged out: ${userId}`);
  
  // In a real implementation, we would:
  // 1. Update the user's offline status
  // 2. Record last seen timestamp
}

/**
 * Utility for importing all integration functions in one line
 * This makes it easier to add to existing code
 */
export const chatServiceIntegration = {
  handleNewUserRegistration,
  handleUserLogin,
  handleUserLogout
};