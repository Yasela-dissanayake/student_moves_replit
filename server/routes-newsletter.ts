/**
 * Newsletter Routes for Admin
 * These routes handle newsletter template generation, sending, and management
 * with advanced AI integration and multi-provider email support
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { CustomAIService } from './ai-services';
import Mustache from 'mustache';
import { sendEmail, isConfigured, getProviderInfo, sendNewsletter } from './email-service';
import * as sendgridUtils from './sendgrid-utils';

// Configure storage for uploaded images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'newsletter-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Schema for newsletter template
const newsletterTemplateSchema = z.object({
  name: z.string(),
  subject: z.string(),
  content: z.string(),
  type: z.enum(['business', 'property', 'event', 'update']),
  imageMap: z.record(z.string(), z.string()).optional(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

// Schema for AI generation request
const aiGenerateSchema = z.object({
  type: z.enum(['business', 'property', 'event', 'update']),
  topic: z.string(),
  businessNames: z.array(z.string()).optional(),
  includedProperties: z.array(z.number()).optional(),
  eventDetails: z.string().optional(),
  tone: z.enum(['formal', 'casual', 'professional', 'friendly']).optional()
});

// Schema for sending newsletter
const sendNewsletterSchema = z.object({
  templateId: z.number(),
  recipients: z.array(z.string()),
  scheduledTime: z.string().optional(),
  testMode: z.boolean().optional()
});

// Function to generate newsletter HTML from template
function generateNewsletterHtml(template: any, imageMap: Record<string, string>) {
  let content = template.content;
  
  // Replace image placeholders with actual image URLs
  Object.keys(imageMap || {}).forEach(key => {
    const placeholder = `{{IMAGE:${key}}}`;
    const imageUrl = imageMap[key];
    
    if (content.includes(placeholder)) {
      // Enhanced email-friendly responsive image with fallback
      content = content.replace(
        placeholder,
        `<!-- Image: ${key} -->
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;">
          <tr>
            <td align="center" style="padding: 10px 0;">
              <!--[if mso]>
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="600">
                <tr>
                  <td align="center">
              <![endif]-->
              <img src="${imageUrl}" 
                   alt="${key}" 
                   title="${key}" 
                   width="600" 
                   style="display: block; height: auto; max-width: 100%; border: 0; margin: 0 auto; width: 100%;" />
              <!--[if mso]>
                  </td>
                </tr>
              </table>
              <![endif]-->
              <div style="color: #666; font-size: 12px; text-align: center; margin-top: 4px;">
                ${key}
              </div>
            </td>
          </tr>
        </table>`
      );
    }
  });
  
  // Add responsive email boilerplate wrapper
  content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="format-detection" content="telephone=no">
  <title>${template.subject || 'Newsletter'}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    img {-ms-interpolation-mode: bicubic;}
  </style>
  <![endif]-->
  <style type="text/css">
    /* Client-specific styles */
    #outlook a {padding: 0;}
    body {margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;}
    table, td {border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;}
    img {border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;}
    
    /* Responsive styles */
    @media screen and (max-width: 600px) {
      .email-container {width: 100% !important;}
      .fluid {max-width: 100% !important; height: auto !important; margin-left: auto !important; margin-right: auto !important;}
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: Arial, sans-serif;">
  <center style="width: 100%; background-color: #f7f7f7; padding: 20px 0;">
    <!--[if mso]>
    <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="600" align="center">
    <tr>
    <td align="center">
    <![endif]-->
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
      ${content}
    </div>
    <!--[if mso]>
    </td>
    </tr>
    </table>
    <![endif]-->
  </center>
</body>
</html>`;
  
  // Apply mustache templating (for future use with dynamic content)
  return Mustache.render(content, {});
}

// Main function to set up newsletter routes
export default function newsletterRoutes(dbStorage: any, aiService: CustomAIService) {
  const router = express.Router();
  
  // Middleware to authenticate admin access
  const authenticateAdmin = async (req: Request, res: Response, next: Function) => {
    try {
      if (!req.session.userId || !req.session.userType) {
        return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
      }
      
      if (req.session.userType !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin permissions required.' });
      }
      
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  };
  
  // Apply admin authentication to all routes
  router.use(authenticateAdmin);
  
  // Get all newsletter templates
  router.get('/templates', async (req: Request, res: Response) => {
    try {
      const templates = await dbStorage.query(
        'SELECT * FROM newsletter_templates ORDER BY created_at DESC',
        []
      );
      
      res.json({ success: true, templates });
    } catch (error) {
      console.error('Error fetching newsletter templates:', error);
      res.status(500).json({ error: 'Failed to retrieve newsletter templates' });
    }
  });
  
  // Get a specific newsletter template
  router.get('/templates/:id', async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);
      
      if (isNaN(templateId)) {
        return res.status(400).json({ error: 'Invalid template ID' });
      }
      
      const result = await dbStorage.query(
        'SELECT * FROM newsletter_templates WHERE id = $1',
        [templateId]
      );
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      const template = result[0];
      
      // Get associated images
      const imagesResult = await dbStorage.query(
        'SELECT * FROM newsletter_template_images WHERE template_id = $1',
        [templateId]
      );
      
      const imageMap: Record<string, string> = {};
      imagesResult.forEach((img: any) => {
        imageMap[img.image_key] = img.image_url;
      });
      
      // Combine template with image data
      const templateWithImages = {
        ...template,
        imageMap
      };
      
      res.json({ success: true, template: templateWithImages });
    } catch (error) {
      console.error('Error fetching newsletter template:', error);
      res.status(500).json({ error: 'Failed to retrieve newsletter template' });
    }
  });
  
  // Create a new newsletter template
  router.post('/templates', async (req: Request, res: Response) => {
    try {
      const { name, subject, content, type, imageMap } = req.body;
      const userId = req.session.userId;
      
      // Validate required fields
      if (!name || !subject || !content || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Insert the template
      const result = await dbStorage.query(
        `INSERT INTO newsletter_templates 
        (name, subject, content, type, created_by, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
        RETURNING *`,
        [name, subject, content, type, userId]
      );
      
      const newTemplate = result[0];
      
      // Store image mappings if provided
      if (imageMap && Object.keys(imageMap).length > 0) {
        for (const [key, url] of Object.entries(imageMap)) {
          await dbStorage.query(
            `INSERT INTO newsletter_template_images 
            (template_id, image_key, image_url, created_at) 
            VALUES ($1, $2, $3, NOW())`,
            [newTemplate.id, key, url]
          );
        }
      }
      
      res.status(201).json({ 
        success: true, 
        template: {
          ...newTemplate,
          imageMap
        }
      });
    } catch (error) {
      console.error('Error creating newsletter template:', error);
      res.status(500).json({ error: 'Failed to create newsletter template' });
    }
  });
  
  // Update a newsletter template
  router.put('/templates/:id', async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);
      const { name, subject, content, type, imageMap } = req.body;
      
      if (isNaN(templateId)) {
        return res.status(400).json({ error: 'Invalid template ID' });
      }
      
      // Verify template exists
      const existingTemplate = await dbStorage.query(
        'SELECT * FROM newsletter_templates WHERE id = $1',
        [templateId]
      );
      
      if (existingTemplate.length === 0) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      // Update the template
      const result = await dbStorage.query(
        `UPDATE newsletter_templates 
        SET name = $1, subject = $2, content = $3, type = $4, updated_at = NOW() 
        WHERE id = $5 
        RETURNING *`,
        [name, subject, content, type, templateId]
      );
      
      const updatedTemplate = result[0];
      
      // Handle image mappings
      if (imageMap) {
        // Remove existing mappings
        await dbStorage.query(
          'DELETE FROM newsletter_template_images WHERE template_id = $1',
          [templateId]
        );
        
        // Add new mappings
        for (const [key, url] of Object.entries(imageMap)) {
          await dbStorage.query(
            `INSERT INTO newsletter_template_images 
            (template_id, image_key, image_url, created_at) 
            VALUES ($1, $2, $3, NOW())`,
            [templateId, key, url]
          );
        }
      }
      
      res.json({ 
        success: true, 
        template: {
          ...updatedTemplate,
          imageMap
        }
      });
    } catch (error) {
      console.error('Error updating newsletter template:', error);
      res.status(500).json({ error: 'Failed to update newsletter template' });
    }
  });
  
  // Delete a newsletter template
  router.delete('/templates/:id', async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);
      
      if (isNaN(templateId)) {
        return res.status(400).json({ error: 'Invalid template ID' });
      }
      
      // Delete associated image mappings
      await dbStorage.query(
        'DELETE FROM newsletter_template_images WHERE template_id = $1',
        [templateId]
      );
      
      // Delete the template
      await dbStorage.query(
        'DELETE FROM newsletter_templates WHERE id = $1',
        [templateId]
      );
      
      res.json({ success: true, message: 'Template deleted successfully' });
    } catch (error) {
      console.error('Error deleting newsletter template:', error);
      res.status(500).json({ error: 'Failed to delete newsletter template' });
    }
  });
  
  // Upload an image for a newsletter template
  router.post('/upload-image', upload.single('image'), async (req: Request, res: Response) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }
      
      // Import sharp for image processing
      const sharp = await import('sharp');
      
      // Get the uploaded file path
      const uploadedFilePath = req.file.path;
      const fileExt = path.extname(req.file.filename);
      const fileName = path.basename(req.file.filename, fileExt);
      const optimizedFileName = `${fileName}-optimized${fileExt}`;
      const optimizedFilePath = path.join(
        process.cwd(), 
        'uploads', 
        'newsletter-images', 
        optimizedFileName
      );
      
      // Process the image with sharp
      await sharp.default(uploadedFilePath)
        .resize({
          width: 1200,
          height: 800,
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality: 80,
          mozjpeg: true 
        })
        .toFile(optimizedFilePath);
      
      // Generate public URL for the optimized image
      const imageUrl = `/uploads/newsletter-images/${optimizedFileName}`;
      
      // Generate a more user-friendly key
      const now = new Date();
      const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
      const imageKey = `newsletter-image-${dateStr}-${Math.floor(Math.random() * 1000)}`;
      
      res.json({
        success: true,
        imageUrl,
        imageKey,
        width: 1200,
        height: 800,
        originalName: req.file.originalname
      });
    } catch (error) {
      console.error('Error uploading and processing newsletter image:', error);
      res.status(500).json({ error: 'Failed to upload and process image' });
    }
  });
  
  // Generate newsletter content using AI
  router.post('/ai-generate', async (req: Request, res: Response) => {
    try {
      const { type, topic, businessNames, includedProperties, eventDetails, tone } = req.body;
      
      // Basic validation
      if (!type || !topic) {
        return res.status(400).json({ error: 'Type and topic are required' });
      }
      
      // Build prompt based on newsletter type
      let prompt = '';
      
      switch (type) {
        case 'business':
          // For business outreach newsletters
          prompt = `Generate a newsletter for business outreach with the following details:
            Topic: ${topic}
            ${businessNames?.length ? `Businesses to mention: ${businessNames.join(', ')}` : ''}
            Tone: ${tone || 'professional'}
            
            The newsletter should include:
            1. A compelling subject line
            2. A friendly introduction
            3. Key benefits of partnering with our student voucher platform
            4. Information about our student reach and demographic
            5. A clear call to action
            
            Format the content as HTML with appropriate sections and styling.`;
          break;
          
        case 'property':
          // For property-related newsletters
          prompt = `Generate a newsletter about student properties with the following details:
            Topic: ${topic}
            ${includedProperties?.length ? `Number of properties to highlight: ${includedProperties.length}` : ''}
            Tone: ${tone || 'professional'}
            
            The newsletter should include:
            1. A compelling subject line about student accommodation
            2. An introduction highlighting the benefits of student rentals
            3. Features of quality student accommodation
            4. Tips for students looking for properties
            5. A call to action to browse available properties
            
            Format the content as HTML with appropriate sections and styling.`;
          break;
          
        case 'event':
          // For event announcements
          prompt = `Generate a newsletter announcing an event with the following details:
            Event Topic: ${topic}
            ${eventDetails ? `Event Details: ${eventDetails}` : ''}
            Tone: ${tone || 'friendly'}
            
            The newsletter should include:
            1. An exciting subject line about the event
            2. Details about when and where the event will take place
            3. What attendees can expect and why they should attend
            4. Any special guests or activities
            5. Registration information
            
            Format the content as HTML with appropriate sections and styling.`;
          break;
          
        case 'update':
          // For general updates
          prompt = `Generate a newsletter providing updates with the following details:
            Update Topic: ${topic}
            Tone: ${tone || 'friendly'}
            
            The newsletter should include:
            1. A clear subject line about the update
            2. An overview of what's new
            3. How these changes benefit the recipients
            4. Any action items recipients should take
            5. Contact information for questions
            
            Format the content as HTML with appropriate sections and styling.`;
          break;
          
        default:
          return res.status(400).json({ error: 'Invalid newsletter type' });
      }
      
      // Call AI provider to generate content
      const aiResponse = await aiService.generateText({
        prompt,
        maxTokens: 1500,
        temperature: 0.7
      });
      
      // Extract subject line and content from AI response
      let subject = '';
      let content = aiResponse;
      
      // Try to extract subject line if present (assuming format like "Subject: Your Subject Here")
      const subjectMatch = aiResponse.match(/Subject:([^\n]+)/i);
      if (subjectMatch && subjectMatch[1]) {
        subject = subjectMatch[1].trim();
        
        // Remove subject line from content
        content = content.replace(/Subject:([^\n]+)/i, '').trim();
      } else {
        // Generate a default subject based on topic
        subject = `Newsletter: ${topic}`;
      }
      
      res.json({
        success: true,
        content: {
          subject,
          content
        }
      });
    } catch (error) {
      console.error('Error generating newsletter content with AI:', error);
      res.status(500).json({ error: 'Failed to generate newsletter content' });
    }
  });
  
  // Check email service configuration status
  router.get('/email-config-status', async (req: Request, res: Response) => {
    try {
      // Get provider information from our email service
      const providerInfo = getProviderInfo();
      
      res.json({
        success: true,
        emailConfigured: providerInfo.isConfigured,
        provider: providerInfo.provider,
        providers: {
          sendgrid: providerInfo.provider === 'SendGrid',
          custom: providerInfo.provider === 'SMTP'
        }
      });
    } catch (error) {
      console.error('Error checking email configuration:', error);
      res.status(500).json({ error: 'Failed to check email configuration' });
    }
  });
  
  // Send a newsletter (or schedule for sending)
  router.post('/send', async (req: Request, res: Response) => {
    try {
      const { templateId, recipients, scheduledTime, testMode } = req.body;
      
      // Check if email service is configured
      if (!isConfigured()) {
        return res.status(400).json({ 
          error: 'Email service not configured. Please set up email provider credentials.' 
        });
      }
      
      // Validate required fields
      if (!templateId || !recipients || recipients.length === 0) {
        return res.status(400).json({ error: 'Template ID and recipients are required' });
      }
      
      // Get template details
      const templateResult = await dbStorage.query(
        'SELECT * FROM newsletter_templates WHERE id = $1',
        [templateId]
      );
      
      if (templateResult.length === 0) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      const template = templateResult[0];
      
      // Get associated images
      const imagesResult = await dbStorage.query(
        'SELECT * FROM newsletter_template_images WHERE template_id = $1',
        [templateId]
      );
      
      const imageMap: Record<string, string> = {};
      imagesResult.forEach((img: any) => {
        imageMap[img.image_key] = img.image_url;
      });
      
      // Generate final HTML
      const htmlContent = generateNewsletterHtml(template, imageMap);
      
      // For scheduled emails, store in database
      if (scheduledTime) {
        const scheduleDate = new Date(scheduledTime);
        
        if (isNaN(scheduleDate.getTime())) {
          return res.status(400).json({ error: 'Invalid scheduled time format' });
        }
        
        // Check if the scheduled_emails table has a signature column
        let scheduledEmailsQuery = `
          INSERT INTO scheduled_emails 
          (template_id, recipients, scheduled_time, created_by, created_at, status`;
          
        if (req.body.signature) {
          scheduledEmailsQuery += `, signature) VALUES ($1, $2, $3, $4, NOW(), 'scheduled', $5)`;
        } else {
          scheduledEmailsQuery += `) VALUES ($1, $2, $3, $4, NOW(), 'scheduled')`;
        }
        
        // Store in scheduled_emails table with signature if provided
        await dbStorage.query(
          scheduledEmailsQuery,
          req.body.signature 
            ? [templateId, JSON.stringify(recipients), scheduleDate, req.session.userId, req.body.signature]
            : [templateId, JSON.stringify(recipients), scheduleDate, req.session.userId]
        );
        
        return res.json({ 
          success: true, 
          message: 'Newsletter scheduled for sending', 
          scheduledTime: scheduleDate 
        });
      }
      
      // For immediate sending or test mode
      let emailResult;
      
      // Generate unique newsletter ID for tracking
      const newsletterId = `newsletter_${template.id}_${template.type}_${Date.now()}`;
      const edition = new Date().toISOString().split('T')[0];
      
      // Use enhanced email service with SendGrid integration
      if (!testMode) {
        // Regular newsletter sending with tracking
        emailResult = await sendNewsletter({
          recipients: recipients,
          to: recipients[0], // Required by EmailParams but will be overridden
          from: 'newsletter@studentportal.com',
          subject: template.subject,
          html: htmlContent,
          signature: req.body.signature
        });
      } else {
        // Test mode - just send to first recipient
        emailResult = await sendNewsletter({
          recipients: [recipients[0]],
          to: recipients[0], // Required by EmailParams but will be overridden
          from: 'newsletter@studentportal.com',
          subject: `[TEST] ${template.subject}`,
          html: htmlContent,
          signature: req.body.signature
        });
      }
      
      // Check if signature is included
      let sentEmailsQuery = `INSERT INTO sent_emails 
        (template_id, recipients, sent_at, created_by, status, test_mode, provider`;
      
      // Add signature column if available
      const hasSignature = !!req.body.signature;
      
      if (hasSignature) {
        sentEmailsQuery += `, signature) VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7)`;
      } else {
        sentEmailsQuery += `) VALUES ($1, $2, NOW(), $3, $4, $5, $6)`;
      }
      
      // Prepare query parameters
      const queryParams = [
        templateId, 
        JSON.stringify(recipients), 
        req.session.userId, 
        emailResult.success ? 'sent' : 'failed', 
        testMode || false,
        'email-service'
      ];
      
      // Add signature if available
      if (hasSignature) {
        queryParams.push(req.body.signature);
      }
      
      // Log the email sending in the database
      await dbStorage.query(sentEmailsQuery, queryParams);
      
      if (!emailResult.success) {
        return res.status(500).json({ 
          error: 'Failed to send newsletter'
        });
      }
      
      // Include response data
      const responseData = {
        success: true, 
        message: testMode ? 'Test email sent successfully' : 'Newsletter sent successfully',
        sentCount: emailResult.sent,
        failedCount: emailResult.failed,
        recipients
      };
      
      res.json(responseData);
    } catch (error) {
      console.error('Error sending newsletter:', error);
      res.status(500).json({ error: 'Failed to send newsletter' });
    }
  });
  
  // Get sent newsletter history
  router.get('/history', async (req: Request, res: Response) => {
    try {
      const result = await dbStorage.query(
        `SELECT se.*, nt.name, nt.subject, nt.type 
        FROM sent_emails se
        JOIN newsletter_templates nt ON se.template_id = nt.id
        ORDER BY se.sent_at DESC 
        LIMIT 50`,
        []
      );
      
      res.json({ success: true, history: result });
    } catch (error) {
      console.error('Error fetching newsletter history:', error);
      res.status(500).json({ error: 'Failed to retrieve newsletter history' });
    }
  });
  
  // Get scheduled newsletters
  router.get('/scheduled', async (req: Request, res: Response) => {
    try {
      const result = await dbStorage.query(
        `SELECT se.*, nt.name, nt.subject, nt.type 
        FROM scheduled_emails se
        JOIN newsletter_templates nt ON se.template_id = nt.id
        WHERE se.status = 'scheduled' AND se.scheduled_time > NOW()
        ORDER BY se.scheduled_time ASC`,
        []
      );
      
      res.json({ success: true, scheduled: result });
    } catch (error) {
      console.error('Error fetching scheduled newsletters:', error);
      res.status(500).json({ error: 'Failed to retrieve scheduled newsletters' });
    }
  });
  
  // Cancel a scheduled newsletter
  router.delete('/scheduled/:id', async (req: Request, res: Response) => {
    try {
      const scheduleId = parseInt(req.params.id);
      
      if (isNaN(scheduleId)) {
        return res.status(400).json({ error: 'Invalid schedule ID' });
      }
      
      // Update status to cancelled instead of deleting
      await dbStorage.query(
        `UPDATE scheduled_emails 
        SET status = 'cancelled', updated_at = NOW() 
        WHERE id = $1`,
        [scheduleId]
      );
      
      res.json({ success: true, message: 'Scheduled newsletter cancelled' });
    } catch (error) {
      console.error('Error cancelling scheduled newsletter:', error);
      res.status(500).json({ error: 'Failed to cancel scheduled newsletter' });
    }
  });
  
  return router;
}

// Helper function to send email via SendGrid
async function sendEmailWithSendGrid({ from, to, subject, html, testMode = false }: {
  from: string;
  to: string[];
  subject: string;
  html: string;
  testMode?: boolean;
}): Promise<boolean> {
  try {
    // If in test mode, log instead of sending
    if (testMode) {
      console.log('TEST MODE - Would send email:');
      console.log('From:', from);
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('HTML Length:', html.length);
      return true;
    }
    
    // Check for SendGrid API key
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key is missing');
      return false;
    }
    
    // Import SendGrid here to avoid issues if API key isn't set
    const sgMail = (await import('@sendgrid/mail')).default;
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    // Prepare the message
    const msg = {
      to,
      from,
      subject,
      html,
    };
    
    // Send the email
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('SendGrid error:', error);
    return false;
  }
}