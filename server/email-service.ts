import { MailService } from '@sendgrid/mail';
import nodemailer from 'nodemailer';

// Initialize SendGrid if API key is available
const sendgridApiKey = process.env.SENDGRID_API_KEY;
let mailService: MailService | null = null;

if (sendgridApiKey) {
  mailService = new MailService();
  mailService.setApiKey(sendgridApiKey);
} else {
  console.log('SendGrid API key not found, email functionality will use fallback provider');
}

// Create nodemailer transporter as fallback
const fallbackTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface NewsletterParams extends EmailParams {
  recipients: string[];
  templateId?: number;
  scheduledTime?: string;
  signature?: string;
}

/**
 * Send an email using the available email provider
 * First tries SendGrid, falls back to nodemailer if SendGrid fails or isn't configured
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    // Try SendGrid first if available
    if (mailService) {
      await mailService.send({
        to: params.to,
        from: params.from,
        subject: params.subject,
        text: params.text || '',
        html: params.html || '',
      });
      console.log(`Email sent to ${params.to} via SendGrid`);
      return true;
    }
    
    // Use fallback provider if SendGrid is not available
    await fallbackTransporter.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    });
    
    console.log(`Email sent to ${params.to} via fallback provider`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    
    // If SendGrid failed, try fallback
    if (mailService) {
      try {
        await fallbackTransporter.sendMail({
          from: params.from,
          to: params.to,
          subject: params.subject,
          text: params.text || '',
          html: params.html || '',
        });
        console.log(`Email sent to ${params.to} via fallback provider after SendGrid failure`);
        return true;
      } catch (fallbackError) {
        console.error('Fallback email provider also failed:', fallbackError);
      }
    }
    
    return false;
  }
}

/**
 * Check if email service is configured
 */
export function isConfigured(): boolean {
  return !!mailService || (!!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS);
}

/**
 * Get information about the current email provider
 */
export function getProviderInfo(): { provider: string; isConfigured: boolean } {
  if (mailService) {
    return { provider: 'SendGrid', isConfigured: true };
  }
  
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return { provider: 'SMTP', isConfigured: true };
  }
  
  return { provider: 'None', isConfigured: false };
}

/**
 * Send a newsletter to multiple recipients
 */
export async function sendNewsletter(params: NewsletterParams): Promise<{ success: boolean; sent: number; failed: number }> {
  const results = {
    success: false,
    sent: 0,
    failed: 0
  };
  
  if (!params.recipients || params.recipients.length === 0) {
    console.error('No recipients provided for newsletter');
    return results;
  }
  
  try {
    // For each recipient, send an individual email
    for (const recipient of params.recipients) {
      try {
        const emailSent = await sendEmail({
          to: recipient,
          from: params.from,
          subject: params.subject,
          text: params.text || '',
          html: params.html || '',
        });
        
        if (emailSent) {
          results.sent++;
        } else {
          results.failed++;
        }
      } catch (error) {
        console.error(`Failed to send newsletter to ${recipient}:`, error);
        results.failed++;
      }
    }
    
    results.success = results.sent > 0;
    return results;
  } catch (error) {
    console.error('Newsletter sending failed:', error);
    return results;
  }
}