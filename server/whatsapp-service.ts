import axios, { AxiosError } from 'axios';
import { MaintenanceRequest, User, Contractor } from '@shared/schema';

/**
 * WhatsApp API error response types for better error categorization
 */
interface WhatsAppErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

/**
 * WhatsApp API success response structure
 */
interface WhatsAppSuccessResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

// WhatsApp Business API service for sending notifications and handling callbacks
export class WhatsAppService {
  private apiKey: string;
  private whatsappBusinessPhoneNumberId: string;
  private whatsappVerifyToken: string;
  private baseUrl = 'https://graph.facebook.com/v17.0';
  private apiConfigured: boolean;
  private webhookConfigured: boolean;

  constructor() {
    this.apiKey = process.env.WHATSAPP_API_KEY || '';
    this.whatsappBusinessPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.whatsappVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || '';
    
    this.apiConfigured = !!(this.apiKey && this.whatsappBusinessPhoneNumberId);
    this.webhookConfigured = !!this.whatsappVerifyToken;
    
    const missingCredentials = [];
    
    if (!process.env.WHATSAPP_API_KEY) {
      missingCredentials.push('WHATSAPP_API_KEY');
    }
    
    if (!process.env.WHATSAPP_PHONE_NUMBER_ID) {
      missingCredentials.push('WHATSAPP_PHONE_NUMBER_ID');
    }
    
    if (!process.env.WHATSAPP_VERIFY_TOKEN) {
      missingCredentials.push('WHATSAPP_VERIFY_TOKEN');
    }
    
    if (missingCredentials.length > 0) {
      console.warn(`WhatsApp integration is disabled. Missing required credentials: ${missingCredentials.join(', ')}. ` +
        'Please set these environment variables to enable WhatsApp functionality.');
    } else {
      console.log('WhatsApp integration is fully configured');
    }
  }

  /**
   * Send a WhatsApp verification message to verify a user's phone number
   */
  async sendVerificationMessage(phoneNumber: string, verificationCode: string): Promise<{ 
    success: boolean; 
    messageId?: string; 
    error?: any; 
    errorDetails?: any;
    configurationMissing?: boolean 
  }> {
    if (!this.isConfigured()) {
      return { 
        success: false, 
        error: 'WhatsApp API not configured: Missing API credentials. Please contact the administrator to set up WhatsApp integration.',
        configurationMissing: true 
      };
    }

    if (!phoneNumber) {
      return { 
        success: false, 
        error: 'Invalid phone number provided' 
      };
    }

    if (!verificationCode) {
      return { 
        success: false, 
        error: 'Verification code is required' 
      };
    }

    try {
      // Format phone number to international format (remove spaces, dashes, etc.)
      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);
      
      console.log(`Sending WhatsApp verification code to ${formattedPhoneNumber.replace(/\d(?=\d{4})/g, '*')}`);
      
      const response = await axios.post(
        `${this.baseUrl}/${this.whatsappBusinessPhoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedPhoneNumber,
          type: 'template',
          template: {
            name: 'verification_code',
            language: {
              code: 'en_GB'
            },
            components: [
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: verificationCode
                  },
                  {
                    type: 'text',
                    text: '30 minutes'
                  }
                ]
              }
            ]
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Validate the response using the WhatsAppSuccessResponse interface
      if (this.isValidWhatsAppResponse(response.data)) {
        console.log(`Successfully sent WhatsApp verification message: ${response.data.messages[0].id}`);
        return {
          success: true,
          messageId: response.data.messages[0].id
        };
      }
      
      console.warn('Invalid response format from WhatsApp API:', this.formatInvalidResponse(response.data));
      return { 
        success: false, 
        error: 'Invalid response format from WhatsApp API',
        errorDetails: this.formatInvalidResponse(response.data)
      };
    } catch (error: any) {
      const processedError = this.processWhatsAppError(error);
      console.error('Error sending WhatsApp verification message:', processedError.message, processedError.details || '');
      
      return {
        success: false,
        error: processedError.message,
        errorDetails: processedError.details
      };
    }
  }

  /**
   * Send a maintenance request notification to a contractor
   */
  async sendMaintenanceRequest(
    maintenanceRequest: MaintenanceRequest, 
    contractor: Contractor,
    propertyAddress: string
  ): Promise<{ success: boolean; messageId?: string; error?: any; errorDetails?: any; configurationMissing?: boolean }> {
    if (!this.isConfigured()) {
      return { 
        success: false, 
        error: 'WhatsApp API not configured: Missing API credentials. Please contact the administrator to set up WhatsApp integration.',
        configurationMissing: true 
      };
    }

    if (!contractor.phone) {
      return { success: false, error: 'Contractor does not have a phone number' };
    }
    
    if (!maintenanceRequest) {
      return { success: false, error: 'Invalid maintenance request data provided' };
    }
    
    if (!propertyAddress) {
      return { success: false, error: 'Property address is required' };
    }

    try {
      const formattedPhoneNumber = this.formatPhoneNumber(contractor.phone);
      
      // Calculate priority text with appropriate emoji
      let priorityEmoji = '🟢'; // Low priority
      if (maintenanceRequest.priority === 'medium') {
        priorityEmoji = '🟠'; // Medium priority
      } else if (maintenanceRequest.priority === 'high') {
        priorityEmoji = '🔴'; // High priority
      } else if (maintenanceRequest.priority === 'emergency') {
        priorityEmoji = '‼️'; // Emergency priority
      }

      // Format scheduled date if available
      const scheduledDate = maintenanceRequest.scheduledDate 
        ? new Date(maintenanceRequest.scheduledDate).toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric', 
            month: 'long',
            year: 'numeric'
          })
        : 'To be scheduled';
      
      console.log(`Sending maintenance request notification to contractor: ${formattedPhoneNumber.replace(/\d(?=\d{4})/g, '*')}`);
      console.log(`Maintenance ID: ${maintenanceRequest.id}, Priority: ${maintenanceRequest.priority}`);

      const response = await axios.post(
        `${this.baseUrl}/${this.whatsappBusinessPhoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedPhoneNumber,
          type: 'template',
          template: {
            name: 'maintenance_request',
            language: {
              code: 'en_GB'
            },
            components: [
              {
                type: 'header',
                parameters: [
                  {
                    type: 'text',
                    text: `${priorityEmoji} ${maintenanceRequest.title}`
                  }
                ]
              },
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: maintenanceRequest.category || 'General Maintenance'
                  },
                  {
                    type: 'text',
                    text: propertyAddress
                  },
                  {
                    type: 'text',
                    text: scheduledDate
                  },
                  {
                    type: 'text',
                    text: maintenanceRequest.description
                  }
                ]
              }
            ]
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Validate the response using the WhatsAppSuccessResponse interface
      if (this.isValidWhatsAppResponse(response.data)) {
        console.log(`Successfully sent maintenance request notification: ${response.data.messages[0].id}`);
        return {
          success: true,
          messageId: response.data.messages[0].id
        };
      }
      
      console.warn('Invalid response format from WhatsApp API:', this.formatInvalidResponse(response.data));
      return { 
        success: false, 
        error: 'Invalid response format from WhatsApp API',
        errorDetails: this.formatInvalidResponse(response.data)
      };
    } catch (error: any) {
      const processedError = this.processWhatsAppError(error);
      console.error('Error sending WhatsApp maintenance request:', processedError.message, processedError.details || '');
      
      return {
        success: false,
        error: processedError.message,
        errorDetails: processedError.details
      };
    }
  }

  /**
   * Send a reminder message for a maintenance request
   */
  async sendMaintenanceReminder(
    maintenanceRequest: MaintenanceRequest,
    contractor: Contractor,
    propertyAddress: string
  ): Promise<{ success: boolean; messageId?: string; error?: any; errorDetails?: any; configurationMissing?: boolean }> {
    if (!this.isConfigured()) {
      return { 
        success: false, 
        error: 'WhatsApp API not configured: Missing API credentials. Please contact the administrator to set up WhatsApp integration.',
        configurationMissing: true 
      };
    }

    if (!contractor.phone) {
      return { success: false, error: 'Contractor does not have a phone number' };
    }
    
    if (!maintenanceRequest) {
      return { success: false, error: 'Invalid maintenance request data provided' };
    }
    
    if (!propertyAddress) {
      return { success: false, error: 'Property address is required' };
    }
    
    if (!maintenanceRequest.scheduledDate) {
      return { success: false, error: 'Maintenance request does not have a scheduled date' };
    }

    try {
      const formattedPhoneNumber = this.formatPhoneNumber(contractor.phone);
      
      console.log(`Sending maintenance reminder to contractor: ${formattedPhoneNumber.replace(/\d(?=\d{4})/g, '*')}`);
      console.log(`Maintenance ID: ${maintenanceRequest.id}, Scheduled for: ${new Date(maintenanceRequest.scheduledDate).toLocaleDateString()}`);
      
      const response = await axios.post(
        `${this.baseUrl}/${this.whatsappBusinessPhoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedPhoneNumber,
          type: 'template',
          template: {
            name: 'maintenance_reminder',
            language: {
              code: 'en_GB'
            },
            components: [
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: maintenanceRequest.title
                  },
                  {
                    type: 'text',
                    text: propertyAddress
                  },
                  {
                    type: 'text',
                    text: maintenanceRequest.scheduledDate 
                      ? new Date(maintenanceRequest.scheduledDate).toLocaleDateString('en-GB', {
                          weekday: 'long',
                          day: 'numeric', 
                          month: 'long',
                          year: 'numeric'
                        })
                      : 'To be scheduled'
                  }
                ]
              }
            ]
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Validate the response using the WhatsAppSuccessResponse interface
      if (this.isValidWhatsAppResponse(response.data)) {
        console.log(`Successfully sent maintenance reminder: ${response.data.messages[0].id}`);
        return {
          success: true,
          messageId: response.data.messages[0].id
        };
      }
      
      console.warn('Invalid response format from WhatsApp API:', this.formatInvalidResponse(response.data));
      return { 
        success: false, 
        error: 'Invalid response format from WhatsApp API',
        errorDetails: this.formatInvalidResponse(response.data)
      };
    } catch (error: any) {
      const processedError = this.processWhatsAppError(error);
      console.error('Error sending WhatsApp maintenance reminder:', processedError.message, processedError.details || '');
      
      return {
        success: false,
        error: processedError.message,
        errorDetails: processedError.details
      };
    }
  }

  /**
   * Process a WhatsApp message callback (for receiving completion photos and confirmation)
   */
  processMessageCallback(data: any): { 
    success: boolean; 
    messageType?: string; 
    fromPhone?: string; 
    messageId?: string;
    mediaId?: string;
    mediaType?: string;
    maintenanceId?: number;
    text?: string;
    error?: string;
  } {
    try {
      // Check if required webhook data exists
      if (!data) {
        console.error('Empty webhook data received');
        return { success: false, error: 'Empty webhook data received' };
      }
      
      // Detailed validation of webhook data structure
      if (!data.entry || !Array.isArray(data.entry) || data.entry.length === 0) {
        console.error('Invalid webhook data: missing or empty entry array');
        return { success: false, error: 'Invalid webhook data structure: missing entries' };
      }
      
      if (!data.entry[0].changes || !Array.isArray(data.entry[0].changes) || data.entry[0].changes.length === 0) {
        console.error('Invalid webhook data: missing or empty changes array');
        return { success: false, error: 'Invalid webhook data structure: missing changes' };
      }

      const change = data.entry[0].changes[0];
      
      // Check if this is a status update rather than a message
      if (change.value && change.value.statuses) {
        console.log('Received status update webhook');
        return {
          success: true,
          messageType: 'status_update',
          messageId: change.value.statuses[0]?.id
        };
      }
      
      if (!change.value || !change.value.messages || !Array.isArray(change.value.messages) || change.value.messages.length === 0) {
        console.error('Invalid webhook data: missing or empty messages array');
        return { success: false, error: 'Invalid webhook data structure: missing messages' };
      }

      const message = change.value.messages[0];
      
      // Validate message has required properties
      if (!message.from || !message.id || !message.type) {
        console.error('Invalid message format: missing required properties');
        return { success: false, error: 'Invalid message format' };
      }
      
      const fromPhone = message.from;
      const messageId = message.id;
      
      console.log(`Received WhatsApp message of type ${message.type} from ${fromPhone.replace(/\d(?=\d{4})/g, '*')}`);
      
      // Check if it's a media message (photo, video, document)
      if (message.type === 'image' || message.type === 'video' || message.type === 'document') {
        // Validate media ID exists
        if (!message[message.type] || !message[message.type].id) {
          console.error(`Invalid ${message.type} message: missing media ID`);
          return { 
            success: false, 
            messageType: message.type,
            fromPhone,
            messageId,
            error: `Invalid ${message.type} message: missing media ID` 
          };
        }
        
        console.log(`Received media with ID: ${message[message.type].id}`);
        return {
          success: true,
          messageType: message.type,
          fromPhone,
          messageId,
          mediaId: message[message.type].id,
          mediaType: message.type
        };
      }
      
      // If it's a text message
      if (message.type === 'text') {
        if (!message.text || !message.text.body) {
          console.error('Invalid text message: missing body');
          return { 
            success: false, 
            messageType: 'text',
            fromPhone,
            messageId,
            error: 'Invalid text message: missing body' 
          };
        }
        
        const text = message.text.body;
        console.log(`Received text message: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
        
        // Check if the message refers to a maintenance ID
        const maintenanceIdMatch = text.match(/maintenance[:\s-]*(\d+)/i);
        const maintenanceId = maintenanceIdMatch ? parseInt(maintenanceIdMatch[1]) : undefined;
        
        if (maintenanceId) {
          console.log(`Detected maintenance ID reference: ${maintenanceId}`);
        }
        
        return {
          success: true,
          messageType: 'text',
          fromPhone,
          messageId,
          text,
          maintenanceId
        };
      }
      
      // For other message types (location, contacts, etc.)
      console.log(`Received unsupported message type: ${message.type}`);
      return { 
        success: true,
        messageType: message.type,
        fromPhone,
        messageId
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      console.error('Error processing WhatsApp callback:', errorMessage, error.stack);
      return { 
        success: false, 
        error: `Error processing webhook: ${errorMessage}`
      };
    }
  }

  /**
   * Retrieve media from WhatsApp API
   */
  async retrieveMedia(mediaId: string): Promise<{ 
    success: boolean; 
    data?: Buffer; 
    mimeType?: string; 
    fileName?: string;
    fileSize?: number;
    error?: any; 
    errorDetails?: any;
    configurationMissing?: boolean 
  }> {
    if (!this.isConfigured()) {
      return { 
        success: false, 
        error: 'WhatsApp API not configured: Missing API credentials. Please contact the administrator to set up WhatsApp integration.', 
        configurationMissing: true 
      };
    }
    
    if (!mediaId) {
      return { 
        success: false, 
        error: 'Media ID is required' 
      };
    }
    
    console.log(`Retrieving WhatsApp media with ID: ${mediaId}`);

    try {
      // First, get the media URL
      console.log(`Fetching media information for ID: ${mediaId}`);
      const mediaInfoResponse = await axios.get(`${this.baseUrl}/${mediaId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!mediaInfoResponse.data) {
        console.error('Empty response when fetching media information');
        return { 
          success: false, 
          error: 'Empty response when fetching media information' 
        };
      }
      
      if (!mediaInfoResponse.data.url) {
        console.error('Media URL not found in response:', mediaInfoResponse.data);
        return { 
          success: false, 
          error: 'Media URL not found in the response',
          errorDetails: this.formatInvalidResponse(mediaInfoResponse.data)
        };
      }
      
      console.log(`Media URL obtained, downloading content`);
      // Extract any available metadata
      const fileType = mediaInfoResponse.data.mime_type || null;
      const fileName = mediaInfoResponse.data.filename || `whatsapp_media_${Date.now()}`;
      
      // Then download the media
      const mediaResponse = await axios.get(mediaInfoResponse.data.url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        responseType: 'arraybuffer'
      });
      
      if (!mediaResponse.data) {
        console.error('Failed to download media: Empty response');
        return { 
          success: false, 
          error: 'Failed to download media: Empty response' 
        };
      }
      
      const fileSize = mediaResponse.data.length;
      console.log(`Successfully downloaded ${fileSize} bytes of media data`);
      
      const mimeType = mediaResponse.headers['content-type'] || fileType || 'application/octet-stream';

      return {
        success: true,
        data: Buffer.from(mediaResponse.data),
        mimeType,
        fileName,
        fileSize
      };
    } catch (error: any) {
      const processedError = this.processWhatsAppError(error);
      console.error('Error retrieving WhatsApp media:', processedError.message, processedError.details || '');
      
      return {
        success: false,
        error: processedError.message,
        errorDetails: processedError.details
      };
    }
  }

  /**
   * Generate a random verification code
   */
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  /**
   * Send a property update notification via WhatsApp
   * @param user The user to receive the notification
   * @param property The property that was updated
   * @param updateType Type of update (e.g., 'price', 'availability', 'description', etc.)
   * @param previousValue Previous value (if applicable)
   * @param newValue New value (if applicable)
   * @returns Object with success flag and message ID or error
   */
  async sendPropertyUpdateNotification(
    user: User,
    property: any,
    updateType: 'price' | 'availability' | 'description' | 'features' | 'images' | 'general',
    previousValue?: string,
    newValue?: string
  ): Promise<{ 
    success: boolean; 
    messageId?: string; 
    error?: any; 
    errorDetails?: any;
    configurationMissing?: boolean 
  }> {
    if (!this.isConfigured()) {
      return { 
        success: false, 
        error: 'WhatsApp API not configured: Missing API credentials. Please contact the administrator to set up WhatsApp integration.',
        configurationMissing: true 
      };
    }

    if (!user || !user.phone) {
      return { success: false, error: 'User does not have a phone number' };
    }
    
    if (!user.whatsappVerified) {
      return { success: false, error: 'User has not verified their WhatsApp number' };
    }
    
    if (!property || !property.id) {
      return { success: false, error: 'Invalid property data' };
    }

    try {
      const formattedPhoneNumber = this.formatPhoneNumber(user.phone);
      
      console.log(`Sending property update notification to user: ${formattedPhoneNumber.replace(/\d(?=\d{4})/g, '*')}`);
      console.log(`Property ID: ${property.id}, Update type: ${updateType}`);
      
      // Format the update message based on the update type
      let updateMessage = '';
      
      switch (updateType) {
        case 'price':
          updateMessage = `The price has been updated from ${previousValue || 'previous price'} to ${newValue || 'new price'}`;
          break;
        case 'availability':
          updateMessage = `The availability has changed to: ${newValue || 'updated availability'}`;
          break;
        case 'description':
          updateMessage = `The property description has been updated`;
          break;
        case 'features':
          updateMessage = `Property features have been updated: ${newValue || 'new features available'}`;
          break;
        case 'images':
          updateMessage = `New images have been added to the property`;
          break;
        case 'general':
          updateMessage = `The property has been updated: ${newValue || 'General update'}`;
          break;
      }
      
      // Create dynamic text for property details
      const propertyDetails = `${property.title}\n${property.address}, ${property.city}\n${property.postcode}`;
      
      // Determine appropriate template based on update type and available data
      const templateName = 'property_update_notification';
      
      const response = await axios.post(
        `${this.baseUrl}/${this.whatsappBusinessPhoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedPhoneNumber,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: 'en_GB'
            },
            components: [
              {
                type: 'header',
                parameters: [
                  {
                    type: 'text',
                    text: `Property Update: ${property.title}`
                  }
                ]
              },
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: propertyDetails
                  },
                  {
                    type: 'text',
                    text: updateMessage
                  },
                  {
                    type: 'text',
                    text: `View details at: ${process.env.BASE_URL || 'our website'}/properties/${property.id}`
                  }
                ]
              }
            ]
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Validate the response
      if (this.isValidWhatsAppResponse(response.data)) {
        console.log(`Successfully sent property update notification: ${response.data.messages[0].id}`);
        
        // Log the notification in user activity for tracking
        try {
          // This would normally call a method like:
          // await storage.createUserActivity({
          //   userId: user.id,
          //   activityType: 'notification_sent',
          //   details: {
          //     channel: 'whatsapp',
          //     propertyId: property.id,
          //     updateType,
          //     messageId: response.data.messages[0].id
          //   }
          // });
          console.log(`Logged WhatsApp notification activity for user ${user.id}`);
        } catch (logError) {
          console.error('Error logging notification activity:', logError);
          // Continue anyway as this is not critical
        }
        
        return {
          success: true,
          messageId: response.data.messages[0].id
        };
      }
      
      console.warn('Invalid response format from WhatsApp API:', this.formatInvalidResponse(response.data));
      return { 
        success: false, 
        error: 'Invalid response format from WhatsApp API',
        errorDetails: this.formatInvalidResponse(response.data)
      };
    } catch (error: any) {
      const processedError = this.processWhatsAppError(error);
      console.error('Error sending WhatsApp property update notification:', processedError.message, processedError.details || '');
      
      return {
        success: false,
        error: processedError.message,
        errorDetails: processedError.details
      };
    }
  }

  /**
   * Send a custom WhatsApp message
   * @param options Message options including recipient, message text, and preview URL flag
   */
  async sendMessage(options: { 
    to: string; 
    message: string; 
    preview_url?: boolean 
  }): Promise<{ 
    success: boolean; 
    messageId?: string; 
    error?: any; 
    errorDetails?: any;
    configurationMissing?: boolean 
  }> {
    if (!this.isConfigured()) {
      return { 
        success: false, 
        error: 'WhatsApp API not configured: Missing API credentials. Please contact the administrator to set up WhatsApp integration.',
        configurationMissing: true 
      };
    }

    if (!options.to) {
      return { success: false, error: 'Recipient phone number is required' };
    }
    
    if (!options.message) {
      return { success: false, error: 'Message text is required' };
    }

    try {
      const formattedPhoneNumber = this.formatPhoneNumber(options.to);
      
      console.log(`Sending custom WhatsApp message to: ${formattedPhoneNumber.replace(/\d(?=\d{4})/g, '*')}`);
      
      const response = await axios.post(
        `${this.baseUrl}/${this.whatsappBusinessPhoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhoneNumber,
          type: 'text',
          text: {
            preview_url: options.preview_url === true,
            body: options.message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Validate the response using the WhatsAppSuccessResponse interface
      if (this.isValidWhatsAppResponse(response.data)) {
        console.log(`Successfully sent WhatsApp message: ${response.data.messages[0].id}`);
        return {
          success: true,
          messageId: response.data.messages[0].id
        };
      }
      
      console.warn('Invalid response format from WhatsApp API:', this.formatInvalidResponse(response.data));
      return { 
        success: false, 
        error: 'Invalid response format from WhatsApp API',
        errorDetails: this.formatInvalidResponse(response.data)
      };
    } catch (error: any) {
      const processedError = this.processWhatsAppError(error);
      console.error('Error sending WhatsApp message:', processedError.message, processedError.details || '');
      
      return {
        success: false,
        error: processedError.message,
        errorDetails: processedError.details
      };
    }
  }

  /**
   * Format phone number to international format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // If it doesn't start with a plus sign, add UK country code by default
    if (!phoneNumber.startsWith('+')) {
      // If already starts with country code (44), add +
      if (digitsOnly.startsWith('44')) {
        return '+' + digitsOnly;
      }
      // If it starts with 0, replace with +44
      if (digitsOnly.startsWith('0')) {
        return '+44' + digitsOnly.substring(1);
      }
      // Otherwise assume UK and add +44
      return '+44' + digitsOnly;
    }
    
    // If it already has a plus sign, just return the digits with a plus
    return '+' + digitsOnly;
  }

  /**
   * Check if WhatsApp API is configured
   */
  isConfigured(): boolean {
    return this.apiConfigured;
  }
  
  /**
   * Verify webhook for WhatsApp API integration
   * @param mode The mode from the query parameter 
   * @param token The token from the query parameter
   * @param challenge The challenge from the query parameter
   * @returns Object with verification result
   */
  verifyWebhook(mode: string, token: string, challenge: string): { 
    success: boolean; 
    message?: string; 
    challenge?: string;
  } {
    console.log(`Verifying WhatsApp webhook: mode=${mode}, token=${token ? 'provided' : 'missing'}`);
    
    if (!this.isConfigured()) {
      console.error('Cannot verify webhook: WhatsApp API not configured');
      return { 
        success: false, 
        message: 'WhatsApp API not configured' 
      };
    }
    
    // Verify mode is subscribe
    if (mode !== 'subscribe') {
      console.error(`Invalid hub.mode: ${mode}`);
      return { 
        success: false, 
        message: 'Invalid hub.mode, expected "subscribe"' 
      };
    }
    
    // Verify token matches the configured verify token
    if (token !== this.whatsappVerifyToken) {
      console.error('Token verification failed - incorrect verify_token');
      return { 
        success: false, 
        message: 'Token verification failed' 
      };
    }
    
    // If verification is successful, return the challenge
    console.log('WhatsApp webhook verification successful');
    return {
      success: true,
      message: 'Webhook verified successfully',
      challenge
    };
  }
  
  /**
   * Validate a WhatsApp API response
   * @param response The response data to validate
   * @returns True if the response is valid, false otherwise
   */
  private isValidWhatsAppResponse(response: any): response is WhatsAppSuccessResponse {
    return (
      response &&
      typeof response === 'object' &&
      response.messaging_product === 'whatsapp' &&
      Array.isArray(response.messages) &&
      response.messages.length > 0 &&
      response.messages[0].id &&
      typeof response.messages[0].id === 'string'
    );
  }
  
  /**
   * Format an invalid response for logging and error reporting
   * @param response The invalid response data
   * @returns A string representation of the response for debugging
   */
  private formatInvalidResponse(response: any): string {
    if (!response) {
      return 'Empty response received';
    }
    
    try {
      // If it's an object, summarize its structure
      if (typeof response === 'object') {
        const keys = Object.keys(response);
        return `Response keys: ${keys.join(', ')}. Missing required fields for a valid WhatsApp response.`;
      }
      
      // Otherwise just stringify it
      return `Unexpected response format: ${JSON.stringify(response)}`;
    } catch (error) {
      return 'Unable to format response data for logging';
    }
  }
  
  /**
   * Process WhatsApp error responses
   * @param error The error object from axios catch block
   * @returns A structured error object for consistent error handling
   */
  private processWhatsAppError(error: any): { 
    message: string; 
    code?: number; 
    type?: string; 
    details?: any;
    originalError: any;
  } {
    // Check if it's an AxiosError with a response
    if (error.response && error.response.data) {
      const errorData = error.response.data;
      
      // Check if it matches our WhatsAppErrorResponse interface
      if (errorData.error && errorData.error.message) {
        return {
          message: errorData.error.message,
          code: errorData.error.code,
          type: errorData.error.type,
          details: errorData.error.error_subcode ? 
            `Subcode: ${errorData.error.error_subcode}, Trace ID: ${errorData.error.fbtrace_id}` : 
            `Trace ID: ${errorData.error.fbtrace_id}`,
          originalError: error
        };
      }
      
      // Otherwise return a generic error with the data
      return {
        message: 'WhatsApp API error',
        code: error.response.status,
        details: JSON.stringify(errorData),
        originalError: error
      };
    }
    
    // If it's not an API response error, return the original message
    return {
      message: error.message || 'Unknown error',
      originalError: error
    };
  }
}

export const whatsappService = new WhatsAppService();