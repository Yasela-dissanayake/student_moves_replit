import { MailService } from '@sendgrid/mail';
import * as fs from 'fs';
import * as path from 'path';
import Mustache from 'mustache';
import { v4 as uuidv4 } from 'uuid';

// Initialize SendGrid
const mailService = new MailService();

// Check if SendGrid API key is set
if (!process.env.SENDGRID_API_KEY) {
  console.warn('WARNING: SENDGRID_API_KEY is not set. Email functionality will be limited.');
} else {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// Email template paths
const TEMPLATE_DIR = path.join(__dirname, '../templates');
let INVITE_TEMPLATE = '';
let NOTIFICATION_TEMPLATE = '';
let WELCOME_TEMPLATE = '';

// Load templates when needed
try {
  if (fs.existsSync(path.join(TEMPLATE_DIR, 'chat-invite.html'))) {
    INVITE_TEMPLATE = fs.readFileSync(path.join(TEMPLATE_DIR, 'chat-invite.html'), 'utf-8');
  }
  if (fs.existsSync(path.join(TEMPLATE_DIR, 'chat-notification.html'))) {
    NOTIFICATION_TEMPLATE = fs.readFileSync(path.join(TEMPLATE_DIR, 'chat-notification.html'), 'utf-8');
  }
  if (fs.existsSync(path.join(TEMPLATE_DIR, 'chat-welcome.html'))) {
    WELCOME_TEMPLATE = fs.readFileSync(path.join(TEMPLATE_DIR, 'chat-welcome.html'), 'utf-8');
  }
} catch (error) {
  console.error('Error loading email templates:', error);
}

// Interfaces
interface ChatInviteData {
  inviterName: string;
  inviterEmail?: string;
  personalNote?: string;
  inviteLink: string;
  recipientName?: string;
  recipientEmail: string;
  universityName?: string;
}

interface ChatNotificationData {
  recipientName: string;
  recipientEmail: string;
  conversationName: string;
  conversationLink: string;
  senderName: string;
  messagePreview?: string;
  messageCount?: number;
  messageType?: 'text' | 'image' | 'file' | 'voice' | 'location';
  unreadCount?: number;
}

interface WelcomeData {
  userName: string;
  userEmail: string;
  activationLink?: string;
  verificationCode?: string;
}

/**
 * Send a chat invitation email
 * @param data Invitation data
 * @returns Promise that resolves to success status
 */
export async function sendChatInvitation(data: ChatInviteData): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key is not set. Cannot send invitation.');
      return false;
    }

    const templateData = {
      ...data,
      currentYear: new Date().getFullYear(),
      universityName: data.universityName || 'your university',
      recipientName: data.recipientName || 'there',
      trackingId: uuidv4(),
    };

    // If template not loaded, use fallback HTML
    const templateHtml = INVITE_TEMPLATE || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
        <div style="background-color: #128C7E; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">Chat Invitation</h1>
        </div>
        <div style="padding: 20px;">
          <p>Hi {{recipientName}},</p>
          <p><strong>{{inviterName}}</strong> has invited you to chat on the student chat platform!</p>
          {{#personalNote}}
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="font-style: italic;">"{{personalNote}}"</p>
          </div>
          {{/personalNote}}
          <div style="text-align: center; margin: 25px 0;">
            <a href="{{inviteLink}}" style="background-color: #25D366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join the Conversation</a>
          </div>
          <p>This secure messaging platform is designed exclusively for students at {{universityName}}.</p>
          <p>Best regards,<br/>The Student Chat Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 10px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666;">
          <p>© {{currentYear}} Student Property Platform. All rights reserved.</p>
        </div>
      </div>
    `;

    const htmlContent = Mustache.render(templateHtml, templateData);

    const msg = {
      to: data.recipientEmail,
      from: {
        email: 'noreply@studentpropertyplatform.com',
        name: `${data.inviterName} via Student Chat`
      },
      subject: `${data.inviterName} invited you to chat!`,
      html: htmlContent,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
      },
      customArgs: {
        trackingId: templateData.trackingId,
      },
    };

    await mailService.send(msg);
    return true;
  } catch (error) {
    console.error('Failed to send chat invitation:', error);
    return false;
  }
}

/**
 * Send a notification about new chat messages
 * @param data Notification data
 * @returns Promise that resolves to success status
 */
export async function sendChatNotification(data: ChatNotificationData): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key is not set. Cannot send notification.');
      return false;
    }

    const templateData = {
      ...data,
      currentYear: new Date().getFullYear(),
      messageCount: data.messageCount || 1,
      unreadCount: data.unreadCount || data.messageCount || 1,
      messagePreview: data.messagePreview ? `"${data.messagePreview}"` : 'a new message',
      messageTypeText: getMessageTypeText(data.messageType || 'text'),
      trackingId: uuidv4(),
    };

    // If template not loaded, use fallback HTML
    const templateHtml = NOTIFICATION_TEMPLATE || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
        <div style="background-color: #128C7E; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">New Message</h1>
        </div>
        <div style="padding: 20px;">
          <p>Hi {{recipientName}},</p>
          <p>You have {{#messageCount}}{{messageCount}}{{/messageCount}}{{^messageCount}}a{{/messageCount}} new {{messageTypeText}} {{#messageCount}}messages{{/messageCount}}{{^messageCount}}message{{/messageCount}} from <strong>{{senderName}}</strong> in <strong>{{conversationName}}</strong>.</p>
          
          {{#messagePreview}}
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="font-style: italic;">{{messagePreview}}</p>
          </div>
          {{/messagePreview}}
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="{{conversationLink}}" style="background-color: #25D366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reply Now</a>
          </div>
          
          <p>You currently have {{unreadCount}} unread message(s) in this conversation.</p>
          <p>Best regards,<br/>The Student Chat Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 10px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666;">
          <p>© {{currentYear}} Student Property Platform. All rights reserved.</p>
          <p>You can change your notification settings in your chat preferences.</p>
        </div>
      </div>
    `;

    const htmlContent = Mustache.render(templateHtml, templateData);

    const msg = {
      to: data.recipientEmail,
      from: {
        email: 'notifications@studentpropertyplatform.com',
        name: 'Student Chat'
      },
      subject: `New message from ${data.senderName} in ${data.conversationName}`,
      html: htmlContent,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
      },
      customArgs: {
        trackingId: templateData.trackingId,
      },
    };

    await mailService.send(msg);
    return true;
  } catch (error) {
    console.error('Failed to send chat notification:', error);
    return false;
  }
}

/**
 * Send a welcome email to new chat users
 * @param data Welcome data
 * @returns Promise that resolves to success status
 */
export async function sendChatWelcome(data: WelcomeData): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key is not set. Cannot send welcome email.');
      return false;
    }

    const templateData = {
      ...data,
      currentYear: new Date().getFullYear(),
      trackingId: uuidv4(),
    };

    // If template not loaded, use fallback HTML
    const templateHtml = WELCOME_TEMPLATE || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
        <div style="background-color: #128C7E; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to Student Chat</h1>
        </div>
        <div style="padding: 20px;">
          <p>Hi {{userName}},</p>
          <p>Welcome to the Student Chat platform! You're now ready to connect with classmates and friends in a secure chat environment.</p>
          
          <h3>Key Features:</h3>
          <ul>
            <li>End-to-end encrypted messaging for security</li>
            <li>Group chats for study groups and projects</li>
            <li>Share files, images, and voice messages</li>
            <li>Connect via QR codes or email invites</li>
          </ul>
          
          {{#activationLink}}
          <div style="text-align: center; margin: 25px 0;">
            <a href="{{activationLink}}" style="background-color: #25D366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Activate Your Account</a>
          </div>
          {{/activationLink}}
          
          {{#verificationCode}}
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center;">
            <p>Your verification code:</p>
            <h2 style="letter-spacing: 5px; font-family: monospace;">{{verificationCode}}</h2>
          </div>
          {{/verificationCode}}
          
          <p>Best regards,<br/>The Student Chat Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 10px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666;">
          <p>© {{currentYear}} Student Property Platform. All rights reserved.</p>
        </div>
      </div>
    `;

    const htmlContent = Mustache.render(templateHtml, templateData);

    const msg = {
      to: data.userEmail,
      from: {
        email: 'welcome@studentpropertyplatform.com',
        name: 'Student Chat'
      },
      subject: 'Welcome to Student Chat!',
      html: htmlContent,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
      },
      customArgs: {
        trackingId: templateData.trackingId,
      },
    };

    await mailService.send(msg);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

/**
 * Get friendly text for message type
 */
function getMessageTypeText(type: string): string {
  switch (type) {
    case 'image': return 'photo';
    case 'file': return 'file';
    case 'voice': return 'voice message';
    case 'location': return 'location';
    case 'text':
    default:
      return 'text message';
  }
}

/**
 * Create the templates directory and sample templates if they don't exist
 */
export async function ensureEmailTemplates(): Promise<void> {
  try {
    // Create templates directory if it doesn't exist
    if (!fs.existsSync(TEMPLATE_DIR)) {
      fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
      console.log('Created templates directory');
    }

    // Create sample template files if they don't exist
    const templates = [
      { 
        filename: 'chat-invite.html', 
        content: INVITE_TEMPLATE || '<html><body><h1>Chat Invitation</h1><p>Default template - please customize</p></body></html>' 
      },
      { 
        filename: 'chat-notification.html', 
        content: NOTIFICATION_TEMPLATE || '<html><body><h1>New Message Notification</h1><p>Default template - please customize</p></body></html>' 
      },
      { 
        filename: 'chat-welcome.html', 
        content: WELCOME_TEMPLATE || '<html><body><h1>Welcome to Student Chat</h1><p>Default template - please customize</p></body></html>' 
      }
    ];

    for (const template of templates) {
      const templatePath = path.join(TEMPLATE_DIR, template.filename);
      if (!fs.existsSync(templatePath)) {
        fs.writeFileSync(templatePath, template.content);
        console.log(`Created template file: ${template.filename}`);
      }
    }
  } catch (error) {
    console.error('Error creating email templates:', error);
  }
}

// Call this function to ensure templates exist when the module is loaded
ensureEmailTemplates().catch(console.error);