/**
 * Chat Welcome Service
 * Handles sending welcome messages and setting up initial chat content for new users
 */
import { sendChatInvitationEmail } from './chat-email-service';

/**
 * Interface for new user data
 */
interface NewUserData {
  id: number;
  name: string;
  email: string;
  userType: string;
}

/**
 * Welcome message templates for different user types
 */
const WELCOME_MESSAGES = {
  student: [
    "👋 Welcome to Student Property App chat! I'm your virtual assistant.",
    "Here you can chat with fellow students, share study resources, and coordinate meetups.",
    "Your conversations are secured with end-to-end encryption and our AI-powered security system.",
    "Use the invitation button to invite your friends and classmates to join you here!",
    "Need help with anything? Just ask me!"
  ],
  default: [
    "👋 Welcome to Student Property App chat!",
    "This secure messaging system allows you to connect with others on the platform.",
    "All messages are end-to-end encrypted for your privacy and security.",
    "If you have any questions, feel free to contact support."
  ]
};

/**
 * Send a welcome email to a newly registered user
 */
export async function sendWelcomeEmail(user: NewUserData): Promise<boolean> {
  // Create a welcome message for the new user
  const baseUrl = process.env.APP_URL || 'http://localhost:5000';
  const chatUrl = `${baseUrl}/student/chat`;
  
  try {
    // Send a welcome email using our chat email service
    await sendChatInvitationEmail({
      to: user.email,
      inviterName: 'Student Property App Team',
      recipientName: user.name,
      invitationLink: chatUrl,
    });
    
    console.log(`[chat-welcome-service] Welcome email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('[chat-welcome-service] Error sending welcome email:', error);
    return false;
  }
}

/**
 * Create initial chat content for a new user (welcome message, sample conversation)
 * This would be called when a user registers and is added to the chat system
 */
export async function setupInitialChatContent(user: NewUserData): Promise<void> {
  try {
    // In a real implementation, this would:
    // 1. Create a welcome conversation with a system bot
    // 2. Add some initial welcome messages
    // 3. Create any default groups based on user preferences
    
    // Log the action (for now, actual implementation would depend on storage system)
    console.log(`[chat-welcome-service] Setting up chat content for new user: ${user.id} (${user.name}, ${user.userType})`);
    
    // Get appropriate welcome messages based on user type
    const welcomeMessages = WELCOME_MESSAGES[user.userType as keyof typeof WELCOME_MESSAGES] || WELCOME_MESSAGES.default;
    
    // In a production system, we would insert these into the database
    // For now, we'll just log what would happen
    console.log('[chat-welcome-service] Creating welcome conversation with messages:');
    welcomeMessages.forEach((message, i) => {
      console.log(`[chat-welcome-service] Message ${i+1}: ${message}`);
    });
    
  } catch (error) {
    console.error('[chat-welcome-service] Error setting up initial chat content:', error);
  }
}

/**
 * Main function to handle onboarding a new chat user
 */
export async function onboardNewChatUser(user: NewUserData): Promise<void> {
  // Start onboarding process in the background
  Promise.all([
    sendWelcomeEmail(user),
    setupInitialChatContent(user)
  ]).catch(err => {
    console.error('[chat-welcome-service] Error in onboarding process:', err);
  });
}