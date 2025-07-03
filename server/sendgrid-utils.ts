import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not found. Email functionality may be limited.");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  categories?: string[];
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
  customArgs?: Record<string, string>;
  trackingSettings?: {
    clickTracking?: { enable?: boolean; enableText?: boolean };
    openTracking?: { enable?: boolean };
  };
}

/**
 * Send an email using SendGrid
 * @param params Email parameters
 * @returns True if sent successfully, false otherwise
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured');
      return false;
    }

    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
      templateId: params.templateId,
      dynamicTemplateData: params.dynamicTemplateData,
      categories: params.categories,
      attachments: params.attachments,
      customArgs: params.customArgs,
      trackingSettings: params.trackingSettings,
    });
    
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

/**
 * Create a campaign in SendGrid
 * @param title Campaign title
 * @param senderId ID of the sender
 * @param listIds List IDs to send to
 * @param subject Email subject
 * @param htmlContent HTML content
 * @param categories Optional categories for tracking
 * @returns Campaign ID if successful, null otherwise
 */
export async function createCampaign(
  title: string,
  senderId: number,
  listIds: number[],
  subject: string,
  htmlContent: string,
  categories: string[] = []
): Promise<string | null> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured');
      return null;
    }
    
    // This requires SendGrid Marketing Campaigns API
    // Implementation would need the REST client from SendGrid for this functionality
    // For now, we'll log that this would be implemented
    console.log('Creating campaign:', title, 'for lists:', listIds);
    
    // This would be an actual API call in production
    // const response = await client.request({
    //   method: 'POST',
    //   url: '/v3/marketing/campaigns',
    //   body: {
    //     name: title,
    //     sender_id: senderId,
    //     list_ids: listIds,
    //     subject: subject,
    //     html_content: htmlContent,
    //     categories: categories,
    //   },
    // });
    
    // Return a mock campaign ID for now
    return `campaign_${Date.now()}`;
  } catch (error) {
    console.error('SendGrid campaign error:', error);
    return null;
  }
}

/**
 * Add email tracking parameters
 * @param params Base email parameters
 * @param trackingId Unique tracking ID for this email
 * @param campaignId Optional campaign ID
 * @param enableOpenTracking Enable open tracking
 * @param enableClickTracking Enable click tracking
 * @returns Updated email parameters with tracking
 */
export function addEmailTracking(
  params: EmailParams,
  trackingId: string,
  campaignId?: string,
  enableOpenTracking = true,
  enableClickTracking = true
): EmailParams {
  const trackedParams = { ...params };
  
  // Add custom tracking args
  trackedParams.customArgs = {
    ...(params.customArgs || {}),
    tracking_id: trackingId,
  };
  
  if (campaignId) {
    trackedParams.customArgs.campaign_id = campaignId;
  }
  
  // Configure tracking settings
  trackedParams.trackingSettings = {
    openTracking: { enable: enableOpenTracking },
    clickTracking: { enable: enableClickTracking, enableText: false },
  };
  
  return trackedParams;
}

/**
 * Add newsletter specific tracking and configuration
 * @param params Base email parameters
 * @param newsletterId Newsletter ID for tracking
 * @param edition Edition number or name
 * @param signature Optional signature to append
 * @returns Updated email parameters for newsletters
 */
export function configureNewsletterEmail(
  params: EmailParams,
  newsletterId: string,
  edition: string,
  signature?: string
): EmailParams {
  const newsletterParams = { ...params };
  
  // Add newsletter tracking categories
  newsletterParams.categories = [
    ...(params.categories || []),
    'newsletter',
    `newsletter_${newsletterId}`,
    `edition_${edition}`,
  ];
  
  // We do not need to append signature here anymore as it's now
  // handled by the email-service.ts file to avoid double-appending
  // signatures. The signature is passed through the NewsletterParams
  // and properly handled by the email service.
  
  return newsletterParams;
}

/**
 * Parse SendGrid webhook event data
 * @param eventData Event data from SendGrid webhook
 * @returns Processed event information
 */
export function parseTrackingEvent(eventData: any[]): {
  events: {
    email: string;
    timestamp: number;
    event: string;
    trackingId?: string;
    campaignId?: string;
    category?: string;
    url?: string;
    userAgent?: string;
  }[];
} {
  try {
    const processedEvents = eventData.map(event => ({
      email: event.email,
      timestamp: event.timestamp,
      event: event.event,
      trackingId: event.customArgs?.tracking_id,
      campaignId: event.customArgs?.campaign_id,
      category: event.category?.[0],
      url: event.url,
      userAgent: event.useragent,
    }));
    
    return { events: processedEvents };
  } catch (error) {
    console.error('Error parsing SendGrid event:', error);
    return { events: [] };
  }
}

/**
 * Check if SendGrid is configured and available
 * @returns True if SendGrid is available, false otherwise
 */
export function isSendGridAvailable(): boolean {
  return !!process.env.SENDGRID_API_KEY;
}