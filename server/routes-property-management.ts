/**
 * Property Management B2B Email Campaign Routes
 * Handles targeting student property management companies and letting agents
 */

import express, { Request, Response } from 'express';
import { 
  searchPropertyManagementCompanies,
  createPropertyManagementCampaign,
  previewPropertyManagementCampaign
} from './property-management-campaigns.js';

const router = express.Router();

// Search for property management companies in a location
router.post('/companies/search', async (req: Request, res: Response) => {
  try {
    const { location, query } = req.body;
    
    if (!location || typeof location !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Location parameter is required' 
      });
    }
    
    console.log(`Admin searching for property companies in ${location}`);
    
    const companies = await searchPropertyManagementCompanies(location);
    
    res.json({
      success: true,
      location,
      companies,
      count: companies.length
    });
    
  } catch (error) {
    console.error('Error searching property management companies:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search for property management companies',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Preview campaign before sending
router.post('/campaigns/preview', async (req: Request, res: Response) => {
  try {
    const { 
      location,
      campaignName,
      description,
      emailTemplate,
      tone = 'professional',
      marketingGoal = 'acquisition',
      targetFeatures,
      specificPoints = [],
      senderName,
      senderEmail,
      companyName
    } = req.body;
    
    if (!location || !campaignName || !senderName || !senderEmail || !companyName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: location, campaignName, senderName, senderEmail, companyName'
      });
    }
    
    const config = {
      campaignName,
      description: description || '',
      emailTemplate,
      tone,
      marketingGoal,
      targetFeatures: targetFeatures || '',
      specificPoints: Array.isArray(specificPoints) ? specificPoints : [],
      senderName,
      senderEmail,
      companyName
    };
    
    console.log(`Admin ${req.session.userId} previewing campaign "${campaignName}" for ${location}`);
    
    const preview = await previewPropertyManagementCampaign(location, config);
    
    res.json({
      success: true,
      preview: {
        location,
        companiesFound: preview.companies.length,
        companies: preview.companies,
        sampleEmail: preview.sampleEmail,
        config
      }
    });
    
  } catch (error) {
    console.error('Error previewing property management campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview campaign',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create and execute email campaign
router.post('/campaigns/create', async (req: Request, res: Response) => {
  try {
    const { 
      location,
      campaignName,
      description,
      emailTemplate,
      tone = 'professional',
      marketingGoal = 'acquisition',
      targetFeatures,
      specificPoints = [],
      senderName,
      senderEmail,
      companyName,
      manualCompanies = [],
      executeImmediately = false
    } = req.body;
    
    if (!location || !campaignName || !senderName || !senderEmail || !companyName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: location, campaignName, senderName, senderEmail, companyName'
      });
    }
    
    const config = {
      campaignName,
      description: description || '',
      emailTemplate,
      tone,
      marketingGoal,
      targetFeatures: targetFeatures || '',
      specificPoints: Array.isArray(specificPoints) ? specificPoints : [],
      senderName,
      senderEmail,
      companyName
    };
    
    console.log(`Admin ${req.session.userId} creating B2B campaign "${campaignName}" for ${location}`);
    console.log(`Execute immediately: ${executeImmediately}`);
    
    if (!executeImmediately) {
      // Just create the campaign setup without sending emails
      const preview = await previewPropertyManagementCampaign(location, config);
      
      res.json({
        success: true,
        message: 'Campaign created successfully (not executed)',
        campaign: {
          campaignName,
          location,
          companiesFound: preview.companies.length,
          companies: preview.companies,
          sampleEmail: preview.sampleEmail,
          status: 'created',
          config
        }
      });
    } else {
      // Execute the actual email campaign
      const result = await createPropertyManagementCampaign(location, config, manualCompanies);
      
      res.json({
        success: true,
        message: `Campaign executed: ${result.emailsSent} emails sent to property management companies`,
        campaign: result
      });
    }
    
  } catch (error) {
    console.error('Error creating property management campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create campaign',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all campaigns
router.get('/campaigns', async (req: Request, res: Response) => {
  try {
    // Return sample campaign data - in production this would come from database
    const campaigns = [
      {
        id: 1,
        campaignName: 'Student Housing Partnership Q4',
        location: 'Manchester',
        emailsSent: 25,
        date: '2025-06-25',
        status: 'completed',
        responseRate: 16.0,
        companiesTargeted: 25
      },
      {
        id: 2,
        campaignName: 'Premium Property Portfolio',
        location: 'Birmingham', 
        emailsSent: 18,
        date: '2025-06-24',
        status: 'completed',
        responseRate: 14.2,
        companiesTargeted: 18
      },
      {
        id: 3,
        campaignName: 'Budget Student Accommodation Drive',
        location: 'Leeds',
        emailsSent: 32,
        date: '2025-06-23',
        status: 'active',
        responseRate: 12.5,
        companiesTargeted: 32
      }
    ];
    
    res.json({
      success: true,
      campaigns,
      total: campaigns.length
    });
  } catch (error) {
    console.error('Error getting campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get campaigns',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get campaign statistics
router.get('/campaigns/stats', async (req: Request, res: Response) => {
  try {
    // For now, return sample stats - in production this would pull from database
    const stats = {
      totalCampaigns: 12,
      emailsSent: 450,
      responseRate: 15.2,
      averageOpenRate: 32.1,
      topLocations: [
        { location: 'Manchester', campaigns: 3, emails: 87 },
        { location: 'Birmingham', campaigns: 2, emails: 65 },
        { location: 'Leeds', campaigns: 2, emails: 58 },
        { location: 'Sheffield', campaigns: 1, emails: 32 },
        { location: 'Liverpool', campaigns: 1, emails: 28 }
      ],
      recentCampaigns: [
        {
          campaignName: 'Student Housing Partnership Q4',
          location: 'Manchester',
          emailsSent: 25,
          date: '2025-06-25',
          status: 'completed'
        },
        {
          campaignName: 'Premium Property Portfolio',
          location: 'Birmingham',
          emailsSent: 18,
          date: '2025-06-24',
          status: 'completed'
        }
      ]
    };
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Error getting campaign stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get campaign statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;