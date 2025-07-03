import express from 'express';
import { z } from 'zod';
import { sendEmail } from './email-service';
import { sendChatInvitationEmail } from './chat-email-service';

// Define a simple validation middleware for this route
function validateRequest(schema: z.ZodType<any, any>) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Internal server error during validation',
      });
    }
  };
}

const router = express.Router();

// Schema for validating invitation request
const inviteSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  inviterName: z.string().optional(),
  recipientName: z.string().optional(),
  inviterId: z.number().optional(),
  inviteLink: z.string().url({ message: "Invalid invitation URL" }),
});

/**
 * Send invitation email to a friend
 * POST /api/invite/send-email
 */
router.post('/send-email', validateRequest(inviteSchema), async (req, res) => {
  const { email, inviterName, recipientName, inviterId, inviteLink } = req.body;
  
  try {
    // Use our enhanced chat email service
    const success = await sendChatInvitationEmail({
      to: email,
      inviterName: inviterName || 'A fellow student',
      recipientName: recipientName,
      invitationLink: inviteLink,
    });
    
    if (!success) {
      // Fallback to the regular email service if the chat service fails
      console.log('[routes-invite] Falling back to standard email service');
      
      // Generate HTML email content
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #075E54; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Student Property App Chat</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <p>Hello${recipientName ? ' ' + recipientName : ''}!</p>
            <p>${inviterName || 'Someone'} has invited you to join the Student Property App Chat platform.</p>
            <p>Connect with other students, share resources, and make new friends through our secure messaging platform.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Join Student Chat
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">All messages are end-to-end encrypted and protected by our AI security system.</p>
          </div>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>&copy; ${new Date().getFullYear()} Student Property App. All rights reserved.</p>
          </div>
        </div>
      `;
      
      // Send the email using the standard email service
      await sendEmail({
        to: email,
        from: 'notifications@studentpropertyapp.com',
        subject: `${inviterName || 'Someone'} invited you to Student Property App Chat`,
        html: html,
        text: `${inviterName || 'Someone'} has invited you to join the Student Property App Chat platform. Join now: ${inviteLink}`,
      });
    }
    
    // Record this invitation in the database (in a production system)
    // const inviteRecord = await db.invitations.create({...})
    
    return res.status(200).json({
      success: true,
      message: 'Invitation email sent successfully',
    });
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send invitation email',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Send new message notification to a friend
 * POST /api/invite/message-notification
 */
router.post('/message-notification', async (req, res) => {
  const { recipientEmail, recipientName, senderName, messagePreview, conversationLink } = req.body;
  
  try {
    // Validate required fields
    if (!recipientEmail || !senderName || !messagePreview || !conversationLink) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }
    
    // Import dynamically to avoid circular dependencies
    const { sendNewMessageNotification } = await import('./chat-email-service');
    
    // Send notification using the specialized service
    const success = await sendNewMessageNotification({
      to: recipientEmail,
      recipientName,
      senderName,
      messagePreview,
      conversationLink,
    });
    
    return res.status(200).json({
      success: true,
      message: 'Message notification sent successfully',
    });
  } catch (error) {
    console.error('Failed to send message notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message notification',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;