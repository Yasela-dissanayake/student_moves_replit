import express from 'express';
import { IStorage } from './storage';
import { executeAIOperation } from './ai-service-manager';
import { checkAuth } from './auth';
import { v4 as uuidv4 } from 'uuid';

// Types
interface BusinessContact {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city: string;
  businessType: string;
  website?: string;
  description?: string;
  matchScore?: number;
  status: 'new' | 'scheduled' | 'contacted' | 'responded' | 'converted' | 'rejected';
  lastContactDate?: Date | null;
  scheduledDate?: Date | null;
  notes?: string;
  isEmailValid?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  template: string;
  businessTypes: string[];
  scheduledDate: Date;
  status: 'draft' | 'scheduled' | 'sent' | 'completed';
  businessCount: number;
  createdAt: Date;
  updatedAt?: Date;
}

// In-memory storage for data
// This could be replaced with database tables in a production implementation
let businessContacts: BusinessContact[] = [];
let emailCampaigns: EmailCampaign[] = [];

// Helper function to generate example data
function generateExampleData() {
  // Only generate example data if none exists
  if (businessContacts.length === 0) {
    const cities = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Glasgow', 'Edinburgh'];
    const businessTypes = ['restaurant', 'retail', 'entertainment', 'education', 'health', 'services', 'other'];
    
    // Generate 15 example business contacts
    for (let i = 0; i < 15; i++) {
      const city = cities[Math.floor(Math.random() * cities.length)];
      const businessType = businessTypes[Math.floor(Math.random() * businessTypes.length)];
      const id = uuidv4();
      
      businessContacts.push({
        id,
        name: `Example Business ${i + 1}`,
        email: `contact${i + 1}@example${i + 1}.com`,
        phone: `+44 123 456${i + 1000}`,
        address: `${i + 1} Example Street`,
        city,
        businessType,
        website: `www.example${i + 1}.com`,
        description: `This is an example ${businessType} business in ${city}.`,
        matchScore: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
        status: 'new',
        createdAt: new Date(),
      });
    }
    
    // Generate 3 example campaigns
    const campaignTemplates = [
      { name: 'Restaurant Promotion', businessTypes: ['restaurant'] },
      { name: 'Retail Discount', businessTypes: ['retail'] },
      { name: 'Student Services', businessTypes: ['education', 'services'] }
    ];
    
    for (let i = 0; i < 3; i++) {
      const template = campaignTemplates[i];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7 + i * 3); // Schedule in the future
      
      emailCampaigns.push({
        id: uuidv4(),
        name: template.name,
        subject: `Special offer for ${template.name}`,
        template: 'default',
        businessTypes: template.businessTypes,
        scheduledDate: futureDate,
        status: 'scheduled',
        businessCount: Math.floor(Math.random() * 10) + 5, // Random between 5-15
        createdAt: new Date(),
      });
    }
  }
}

export default function setupBusinessOutreachRoutes(app: express.Application, storage: IStorage) {
  const router = express.Router();
  
  // Generate example data for development purposes
  generateExampleData();
  
  // Middleware to ensure only admins can access these routes
  router.use(checkAuth(['admin']));
  
  // Get business contacts with optional filtering
  router.get('/contacts', async (req, res) => {
    try {
      const city = req.query.city as string | undefined;
      const businessType = req.query.businessType as string | undefined;
      const status = req.query.status as string | undefined;
      
      // Filter based on query parameters
      let filteredContacts = [...businessContacts];
      
      if (city) {
        filteredContacts = filteredContacts.filter(c => 
          c.city.toLowerCase().includes(city.toLowerCase())
        );
      }
      
      if (businessType && businessType !== 'all') {
        filteredContacts = filteredContacts.filter(c => 
          c.businessType === businessType
        );
      }
      
      if (status && status !== 'all') {
        filteredContacts = filteredContacts.filter(c => 
          c.status === status
        );
      }
      
      // Sort by last update or created date
      filteredContacts.sort((a, b) => {
        const dateA = a.updatedAt || a.createdAt || new Date(0);
        const dateB = b.updatedAt || b.createdAt || new Date(0);
        return dateB.getTime() - dateA.getTime(); // Most recent first
      });
      
      return res.json({
        success: true,
        contacts: filteredContacts
      });
    } catch (error) {
      console.error('Error getting business contacts:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching business contacts.'
      });
    }
  });
  
  // Get a single business contact by ID
  router.get('/contacts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const contact = businessContacts.find(c => c.id === id);
      
      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Business contact not found.'
        });
      }
      
      return res.json({
        success: true,
        contact
      });
    } catch (error) {
      console.error('Error getting business contact:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching the business contact.'
      });
    }
  });
  
  // Create a new business contact
  router.post('/create-contact', async (req, res) => {
    try {
      const contactData = req.body as BusinessContact;
      
      if (!contactData.name || !contactData.email || !contactData.city) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and city are required fields.'
        });
      }
      
      // Check if email already exists
      const existingContact = businessContacts.find(c => 
        c.email.toLowerCase() === contactData.email.toLowerCase()
      );
      
      if (existingContact) {
        return res.status(400).json({
          success: false,
          message: 'A business with this email already exists.'
        });
      }
      
      const newContact: BusinessContact = {
        ...contactData,
        id: uuidv4(),
        status: contactData.status || 'new',
        matchScore: contactData.matchScore || 70,
        createdAt: new Date(),
      };
      
      businessContacts.push(newContact);
      
      return res.json({
        success: true,
        contact: newContact,
        message: 'Business contact created successfully.'
      });
    } catch (error) {
      console.error('Error creating business contact:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while creating the business contact.'
      });
    }
  });
  
  // Update a business contact
  router.post('/update-contact', async (req, res) => {
    try {
      const contactData = req.body as BusinessContact;
      
      if (!contactData.id) {
        return res.status(400).json({
          success: false,
          message: 'Contact ID is required for updates.'
        });
      }
      
      const contactIndex = businessContacts.findIndex(c => c.id === contactData.id);
      
      if (contactIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Business contact not found.'
        });
      }
      
      // Update the contact
      const updatedContact: BusinessContact = {
        ...businessContacts[contactIndex],
        ...contactData,
        updatedAt: new Date()
      };
      
      businessContacts[contactIndex] = updatedContact;
      
      return res.json({
        success: true,
        contact: updatedContact,
        message: 'Business contact updated successfully.'
      });
    } catch (error) {
      console.error('Error updating business contact:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while updating the business contact.'
      });
    }
  });
  
  // Delete a business contact
  router.delete('/contacts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const contactIndex = businessContacts.findIndex(c => c.id === id);
      
      if (contactIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Business contact not found.'
        });
      }
      
      // Remove the contact
      businessContacts.splice(contactIndex, 1);
      
      return res.json({
        success: true,
        message: 'Business contact deleted successfully.'
      });
    } catch (error) {
      console.error('Error deleting business contact:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while deleting the business contact.'
      });
    }
  });
  
  // Import business contacts
  router.post('/import-contacts', async (req, res) => {
    try {
      const { businesses } = req.body;
      
      if (!Array.isArray(businesses) || businesses.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid business contacts provided.'
        });
      }
      
      const existingEmails = new Set(businessContacts.map(c => c.email.toLowerCase()));
      const newContacts: BusinessContact[] = [];
      const duplicates: string[] = [];
      
      for (const business of businesses) {
        if (!business.name || !business.email || !business.city) {
          continue; // Skip invalid entries
        }
        
        const email = business.email.toLowerCase();
        
        if (existingEmails.has(email)) {
          duplicates.push(business.name);
          continue;
        }
        
        const newContact: BusinessContact = {
          ...business,
          id: uuidv4(),
          status: business.status || 'new',
          matchScore: business.matchScore || 70,
          createdAt: new Date(),
        };
        
        newContacts.push(newContact);
        existingEmails.add(email);
      }
      
      // Add the new contacts
      businessContacts = [...businessContacts, ...newContacts];
      
      return res.json({
        success: true,
        imported: newContacts.length,
        duplicates: duplicates.length,
        message: `Imported ${newContacts.length} business contacts. ${duplicates.length} duplicates were skipped.`
      });
    } catch (error) {
      console.error('Error importing business contacts:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while importing business contacts.'
      });
    }
  });
  
  // Get email campaigns
  router.get('/campaigns', async (req, res) => {
    try {
      // Sort by scheduled date
      const sortedCampaigns = [...emailCampaigns].sort((a, b) => {
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      });
      
      return res.json({
        success: true,
        campaigns: sortedCampaigns
      });
    } catch (error) {
      console.error('Error getting email campaigns:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching email campaigns.'
      });
    }
  });
  
  // Create a new email campaign
  router.post('/create-campaign', async (req, res) => {
    try {
      const { name, businessTypes, scheduledDate } = req.body;
      
      if (!name || !scheduledDate) {
        return res.status(400).json({
          success: false,
          message: 'Campaign name and scheduled date are required.'
        });
      }
      
      // Count businesses that match the types
      let businessCount = 0;
      if (Array.isArray(businessTypes) && businessTypes.length > 0) {
        businessCount = businessContacts.filter(c => 
          businessTypes.includes(c.businessType) && 
          (c.status === 'new' || c.status === 'scheduled')
        ).length;
      } else {
        businessCount = businessContacts.filter(c => 
          c.status === 'new' || c.status === 'scheduled'
        ).length;
      }
      
      const newCampaign: EmailCampaign = {
        id: uuidv4(),
        name,
        subject: `Special offer for ${name}`,
        template: 'default',
        businessTypes: Array.isArray(businessTypes) ? businessTypes : [],
        scheduledDate: new Date(scheduledDate),
        status: 'scheduled',
        businessCount,
        createdAt: new Date(),
      };
      
      emailCampaigns.push(newCampaign);
      
      // Update matching business contacts to 'scheduled' status
      if (businessCount > 0) {
        businessContacts = businessContacts.map(contact => {
          if (
            (Array.isArray(businessTypes) && businessTypes.length > 0 
              ? businessTypes.includes(contact.businessType)
              : true) && 
            (contact.status === 'new' || contact.status === 'scheduled')
          ) {
            return {
              ...contact,
              status: 'scheduled',
              scheduledDate: new Date(scheduledDate),
              updatedAt: new Date()
            };
          }
          return contact;
        });
      }
      
      return res.json({
        success: true,
        campaign: newCampaign,
        message: `Campaign created successfully with ${businessCount} targeted businesses.`
      });
    } catch (error) {
      console.error('Error creating email campaign:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while creating the email campaign.'
      });
    }
  });
  
  // Find businesses using Google Places API simulation with AI
  router.post('/find-businesses', async (req, res) => {
    try {
      const { city, businessType, count = 10 } = req.body;
      
      if (!city) {
        return res.status(400).json({
          success: false,
          message: 'City is required to find businesses.'
        });
      }
      
      // Use AI to simulate Google Places API results
      const prompt = `
        Generate a list of ${count} real local businesses in ${city}${businessType ? ` in the ${businessType} category` : ''}.
        
        For each business, provide the following information in JSON format:
        - name: The actual business name (use real businesses that would be found in ${city})
        - email: A professional email for the business (generally using their domain name)
        - phone: A properly formatted UK phone number
        - address: A realistic physical address in ${city}
        - city: ${city}
        - businessType: ${businessType || 'The appropriate category'} (one of: restaurant, retail, entertainment, education, health, services, other)
        - website: The business website URL
        - description: A brief, realistic description of the business offerings
        
        Return ONLY a JSON array without any additional text, formatted as follows:
        [
          {
            "name": "Business Name",
            "email": "contact@business.com",
            "phone": "+44 20 1234 5678",
            "address": "123 Any Street, ${city}",
            "city": "${city}",
            "businessType": "restaurant",
            "website": "www.business.com",
            "description": "Brief description of business offerings"
          },
          ...
        ]
      `;
      
      const aiResponse = await executeAIOperation('generateText', {
        prompt,
        responseFormat: 'json'
      });
      
      try {
        // Process AI response
        let parsedResponse;
        
        try {
          // Try to parse directly first
          parsedResponse = JSON.parse(aiResponse);
        } catch (parseError) {
          // If direct parsing fails, look for array pattern in the text
          const jsonMatch = aiResponse.match(/\[\s*\{.*\}\s*\]/s);
          if (jsonMatch) {
            parsedResponse = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Could not extract valid JSON from AI response');
          }
        }
        
        if (!Array.isArray(parsedResponse)) {
          throw new Error('AI response is not an array');
        }
        
        const businesses = parsedResponse as BusinessContact[];
        
        // Validate and enhance the businesses
        const validBusinesses = businesses
          .filter(b => b.name && b.email && b.city)
          .map(b => ({
            ...b,
            id: uuidv4(),
            status: 'new' as const,
            matchScore: Math.floor(Math.random() * 31) + 70, // Random score between 70-100
            createdAt: new Date(),
          }));
        
        // Filter out existing businesses by email
        const existingEmails = new Set(businessContacts.map(c => c.email.toLowerCase()));
        const newBusinesses = validBusinesses.filter(b => 
          !existingEmails.has(b.email.toLowerCase())
        );
        
        // Add the new businesses
        businessContacts = [...businessContacts, ...newBusinesses];
        
        return res.json({
          success: true,
          businesses: newBusinesses,
          total: newBusinesses.length,
          message: `Found ${newBusinesses.length} new businesses in ${city}.`
        });
      } catch (parseError) {
        console.error('Error parsing AI business search response:', parseError);
        return res.status(500).json({
          success: false,
          message: 'Error processing AI response for business search.'
        });
      }
    } catch (error) {
      console.error('Error finding businesses:', error);
      return res.status(500).json({
        success: false, 
        message: 'An error occurred while searching for businesses.'
      });
    }
  });
  
  // Generate targeted email content
  router.post('/generate-email', async (req, res) => {
    try {
      const { businessId, businessType, businessName, city } = req.body;
      
      if (!businessType || !businessName) {
        return res.status(400).json({
          success: false,
          message: 'Business type and name are required.'
        });
      }
      
      // Use AI to generate personalized email content
      const prompt = `
        Write a personalized outreach email to a ${businessType} business called "${businessName}" in ${city || 'the local area'}.
        
        The email should:
        1. Invite them to join our student voucher platform
        2. Explain how they can offer discounts to students
        3. Highlight the benefits:
           - Increased student customer base
           - No upfront costs (we take a small commission on redeemed vouchers)
           - Enhanced visibility in the student community
           - Data on customer preferences and usage patterns
        
        The tone should be professional but friendly, and the email should be tailored specifically 
        to a ${businessType} business. Make sure to mention how this type of business specifically
        can benefit from student promotions.
        
        Format the response as JSON with 'subject' and 'body' fields:
        {
          "subject": "The email subject line",
          "body": "The full email body text with proper paragraph breaks"
        }
      `;
      
      const aiResponse = await executeAIOperation('generateText', {
        prompt,
        responseFormat: 'json'
      });
      
      try {
        // Process AI response
        let emailContent;
        
        try {
          // Try to parse directly first
          emailContent = JSON.parse(aiResponse);
        } catch (parseError) {
          // If direct parsing fails, look for object pattern in the text
          const jsonMatch = aiResponse.match(/\{\s*"subject".*\}/s);
          if (jsonMatch) {
            emailContent = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Could not extract valid JSON from AI response');
          }
        }
        
        if (!emailContent.subject || !emailContent.body) {
          throw new Error('AI response missing required fields');
        }
        
        // If business ID is provided, update the business status
        if (businessId) {
          const businessIndex = businessContacts.findIndex(b => b.id === businessId);
          if (businessIndex !== -1) {
            businessContacts[businessIndex] = {
              ...businessContacts[businessIndex],
              status: 'contacted',
              lastContactDate: new Date(),
              updatedAt: new Date()
            };
          }
        }
        
        return res.json({
          success: true,
          subject: emailContent.subject,
          body: emailContent.body
        });
      } catch (parseError) {
        console.error('Error parsing AI email response:', parseError);
        return res.status(500).json({
          success: false,
          message: 'Error processing AI response for email generation.'
        });
      }
    } catch (error) {
      console.error('Error generating email content:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while generating email content.'
      });
    }
  });
  
  // Register routes
  app.use('/api/admin/business-outreach', router);
  console.log('Business outreach routes registered');
  
  return app;
}