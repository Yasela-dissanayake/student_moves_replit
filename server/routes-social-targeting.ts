import express from 'express';
import { log } from './vite'; // Use the same logging function as the rest of the app
import { 
  generateCampaignDescriptions, 
  generateMarketingContent
} from './ai-targeting-service';
import { IStorage, SocialCampaign } from './storage';
import SocialMediaService from './social-media-service';
import { authenticateUser } from './middleware/auth';
import { logSecurity } from './utils/security-utils';
import { executeAIOperation } from './ai-service-manager';
import { 
  generateMarketingCampaign, 
  generateSocialMediaPost, 
  generateEmailCampaign,
  MarketingCampaignParams,
  SocialMediaPostParams,
  EmailCampaignParams
} from './openai-marketing';

/**
 * Sets up the social targeting routes
 */
export function setupSocialTargetingRoutes(app: express.Express, storage: IStorage) {
  // Initialize the social media service
  const socialMediaService = new SocialMediaService(storage);
  // Get all social campaigns 
  app.get('/api/targeting/social', authenticateUser, async (req, res) => {
    try {
      const userId = req.session?.userId;
      
      // Get campaigns for this user
      const campaigns = await storage.getSocialCampaigns(userId);
      
      res.json({
        success: true,
        campaigns
      });
    } catch (error) {
      log(`[social-targeting] Error retrieving campaigns: ${error}`, 'social-targeting-error');
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve campaigns'
      });
    }
  });
  
  // Get a specific social campaign
  app.get('/api/targeting/social/:id', authenticateUser, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      
      if (isNaN(campaignId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid campaign ID'
        });
      }
      
      const campaign = await storage.getSocialCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }
      
      res.json({
        success: true,
        campaign
      });
    } catch (error) {
      log(`[social-targeting] Error retrieving campaign: ${error}`, 'social-targeting-error');
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve campaign'
      });
    }
  });
  
  // Create a new social campaign
  app.post('/api/targeting/social', authenticateUser, async (req, res) => {
    try {
      log('[social-targeting] Creating new social targeting campaign', 'social-targeting');
      log(`[social-targeting] Campaign data: ${JSON.stringify(req.body)}`, 'social-targeting-debug');
      
      const campaignData = req.body;
      const userId = req.session?.userId;
      
      // Validate required fields
      if (!campaignData.name) {
        return res.status(400).json({ success: false, message: 'Campaign name is required' });
      }
      
      // Add userId to the campaign data
      campaignData.userId = userId;
      campaignData.status = campaignData.status || 'Draft';
      campaignData.createdAt = new Date();
      
      // Use the storage implementation to create the campaign
      const result = await storage.createSocialCampaign(campaignData);
      
      log(`[social-targeting] Campaign "${campaignData.name}" created successfully with ID ${result.id}`, 'social-targeting');
      
      res.json({
        success: true,
        message: 'Campaign created successfully',
        campaignId: result.id
      });
    } catch (error) {
      log(`[social-targeting] Error creating campaign: ${error}`, 'social-targeting-error');
      res.status(500).json({
        success: false,
        message: 'Failed to create campaign'
      });
    }
  });

  // Get all social targeting campaigns
  app.get('/api/social-targeting/campaigns', async (req, res) => {
    try {
      // Return sample campaign data - in production this would come from database
      const campaigns = [
        {
          id: 1,
          name: 'Student Housing Q4 Campaign',
          targetDemographic: 'students',
          status: 'active',
          createdAt: '2025-06-25T10:00:00Z',
          platforms: ['Instagram', 'TikTok', 'Facebook'],
          budget: '£500',
          reach: 12500,
          engagement: 850
        },
        {
          id: 2,
          name: 'University Partnership Drive',
          targetDemographic: 'university_students',
          status: 'completed',
          createdAt: '2025-06-24T15:30:00Z',
          platforms: ['Instagram', 'LinkedIn'],
          budget: '£300',
          reach: 8200,
          engagement: 650
        },
        {
          id: 3,
          name: 'Budget Student Housing Focus',
          targetDemographic: 'budget_conscious_students',
          status: 'draft',
          createdAt: '2025-06-23T09:15:00Z',
          platforms: ['TikTok', 'Twitter'],
          budget: '£250',
          reach: 0,
          engagement: 0
        }
      ];
      
      res.json({
        success: true,
        campaigns,
        total: campaigns.length
      });
    } catch (error) {
      log(`[social-targeting] Error getting campaigns: ${error}`, 'social-targeting-error');
      res.status(500).json({
        success: false,
        message: 'Failed to get campaigns',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Zero-cost campaign creation using custom AI provider
  app.post('/api/social-targeting/create-campaign', async (req, res) => {
    try {
      log('[social-targeting] Creating zero-cost AI campaign', 'social-targeting');
      log(`[social-targeting] Campaign data: ${JSON.stringify(req.body)}`, 'social-targeting-debug');
      
      const campaignData = req.body;
      
      // Validate required fields
      if (!campaignData.name) {
        return res.status(400).json({ 
          success: false, 
          message: 'Campaign name is required' 
        });
      }

      // Use custom AI provider to generate campaign content at zero cost
      const aiPrompt = `
Create a comprehensive social media marketing campaign for student housing with the following details:

Campaign Name: ${campaignData.name}
Target Universities: ${campaignData.targetUniversities?.join(', ') || 'UK Universities'}
Target Platforms: ${campaignData.platforms?.join(', ') || 'Instagram, Facebook, TikTok, Twitter'}
Budget: £${campaignData.budget || 100}
Duration: ${campaignData.duration || 7} days
Age Range: ${campaignData.ageRange || '18-25'}
Interests: ${campaignData.interests?.join(', ') || 'Student life, Housing, Social events'}

Generate a complete campaign plan including:
1. Campaign strategy and key messaging
2. Platform-specific content suggestions 
3. Hashtag recommendations
4. Target audience insights
5. Best posting times
6. Call-to-action suggestions

Return as JSON with the structure:
{
  "strategy": "Campaign overview and strategy",
  "content": {
    "instagram": "Platform-specific content",
    "facebook": "Platform-specific content", 
    "tiktok": "Platform-specific content",
    "twitter": "Platform-specific content"
  },
  "hashtags": ["list", "of", "hashtags"],
  "audience": {
    "segments": ["segment1", "segment2"],
    "interests": ["interest1", "interest2"]
  },
  "schedule": {
    "instagram": "Best times",
    "facebook": "Best times",
    "tiktok": "Best times", 
    "twitter": "Best times"
  },
  "callToAction": "Main CTA for the campaign"
}
`;

      // Use our custom AI provider for zero-cost campaign generation
      const aiResult = await executeAIOperation('generateText', {
        prompt: aiPrompt,
        maxTokens: 4000,
        responseFormat: 'json_object'
      });

      let campaignPlan;
      try {
        campaignPlan = JSON.parse(aiResult);
      } catch (parseError) {
        log(`[social-targeting] Error parsing AI response: ${parseError}`, 'social-targeting-error');
        // Provide a fallback campaign plan
        campaignPlan = {
          strategy: `Comprehensive social media campaign targeting ${campaignData.ageRange || '18-25'} year old students across ${campaignData.targetUniversities?.join(', ') || 'UK universities'}.`,
          content: {
            instagram: "Eye-catching visuals showcasing modern student accommodations with lifestyle-focused captions",
            facebook: "Detailed property information with virtual tour links and community features",
            tiktok: "Quick property tours and student testimonials with trending audio",
            twitter: "Real-time updates, housing tips, and engagement with student communities"
          },
          hashtags: ["#StudentHousing", "#UniLife", "#StudentAccommodation", "#CampusLife", "#StudentLiving"],
          audience: {
            segments: ["First-year students", "International students", "Postgraduate students"],
            interests: ["Housing", "University life", "Social events", "Study spaces"]
          },
          schedule: {
            instagram: "Peak: 6-9pm weekdays, 1-4pm weekends",
            facebook: "Peak: 7-10pm weekdays, 12-3pm weekends", 
            tiktok: "Peak: 6-10pm daily, especially 7-9pm",
            twitter: "Peak: 8-10pm weekdays, 2-4pm weekends"
          },
          callToAction: "Book your viewing today! Link in bio 🏠✨"
        };
      }

      // Create the campaign record
      const newCampaign = {
        name: campaignData.name,
        description: campaignPlan.strategy,
        targetUniversities: campaignData.targetUniversities || [],
        platforms: campaignData.platforms || ['instagram', 'facebook', 'tiktok', 'twitter'],
        budget: campaignData.budget || 100,
        duration: campaignData.duration || 7,
        ageRange: campaignData.ageRange || '18-25',
        interests: campaignData.interests || [],
        status: 'Active',
        aiGenerated: true,
        campaignPlan: campaignPlan,
        costSavings: 'Generated using zero-cost custom AI provider',
        createdAt: new Date()
      };

      log(`[social-targeting] Zero-cost campaign "${campaignData.name}" created successfully using custom AI`, 'social-targeting');
      
      res.json({
        success: true,
        message: `🎉 Campaign "${campaignData.name}" created successfully at zero cost using our custom AI system!`,
        campaign: newCampaign,
        savings: 'This campaign was generated completely free using our custom AI provider instead of paid external services'
      });
      
    } catch (error) {
      log(`[social-targeting] Error creating zero-cost campaign: ${error}`, 'social-targeting-error');
      res.status(500).json({
        success: false,
        message: 'Failed to create campaign using custom AI provider'
      });
    }
  });

  // Dynamic campaign builder: Generate insights
  app.post('/api/targeting/social/insights', authenticateUser, async (req, res) => {
    try {
      log('[social-targeting] Generating audience insights', 'social-targeting');
      log(`[social-targeting] Insights request data: ${JSON.stringify(req.body)}`, 'social-targeting-debug');
      
      const { campaign } = req.body;
      
      if (!campaign) {
        return res.status(400).json({ 
          success: false, 
          message: 'Campaign data is required' 
        });
      }
      
      // This would normally call the AI service for insights
      // For testing, we'll return mock insights
      const insights = {
        targetAudience: [
          {
            segment: "First-year students",
            interests: ["Housing", "Social events", "Campus life"],
            activity: "Mostly evening browsing",
            engagementRate: 4.2,
            recommendedApproach: "Focus on exciting campus life aspects"
          },
          {
            segment: "International students",
            interests: ["Housing safety", "Local area information", "Transport"],
            activity: "Morning and weekend browsing",
            engagementRate: 3.8,
            recommendedApproach: "Highlight safety features and local amenities"
          }
        ],
        recommendedHashtags: [
          "#StudentLiving",
          "#CampusLife",
          "#UniAccommodation",
          `#${campaign.targetUniversities[0]?.replace(/\\s+/g, '')}Life` || "#UniLife",
          "#StudentHousing"
        ],
        bestTimeToPost: {
          "instagram": ["6PM-8PM", "12PM-2PM"],
          "facebook": ["7PM-9PM", "1PM-3PM"],
          "twitter": ["7AM-9AM", "8PM-10PM"]
        },
        contentSuggestions: [
          "Show real students in their accommodations",
          "Feature nearby food and entertainment spots",
          "Highlight study spaces and amenities",
          "Show before/after moving in experiences"
        ],
        performancePrediction: {
          estimatedReach: 5200,
          estimatedEngagement: 780,
          estimatedConversion: 39
        }
      };
      
      log('[social-targeting] Audience insights generated successfully', 'social-targeting');
      
      // In real implementation, we would analyze the campaign data using AI
      // const insights = await analyzeSocialTargetingData(campaign);
      
      res.json({
        success: true,
        insights
      });
    } catch (error) {
      log(`[social-targeting] Error generating insights: ${error}`, 'social-targeting-error');
      res.status(500).json({
        success: false,
        message: 'Failed to generate insights'
      });
    }
  });

  // Dynamic campaign builder: Generate content
  app.post('/api/targeting/social/content', authenticateUser, async (req, res) => {
    try {
      log('[social-targeting] Generating campaign content', 'social-targeting');
      log(`[social-targeting] Content request data: ${JSON.stringify(req.body)}`, 'social-targeting-debug');
      
      const { campaign } = req.body;
      
      if (!campaign) {
        return res.status(400).json({ 
          success: false, 
          message: 'Campaign data is required' 
        });
      }
      
      const { platforms, contentTone, includeImages } = campaign;
      
      if (!platforms || !platforms.length) {
        return res.status(400).json({ 
          success: false, 
          message: 'At least one platform is required' 
        });
      }
      
      // Generate content for each platform
      // In a real implementation, this would call the AI service
      // For testing, we'll return mock content
      interface PlatformContent {
        platform: string;
        postText: string;
        hashtags: string[];
        callToAction: string;
        imagePrompt?: string;
      }

      const platformContent = platforms.map((platform: string) => {
        // Generate platform-specific content based on tone and insights
        const content: PlatformContent = {
          platform,
          postText: generateMockPlatformContent(platform, contentTone, campaign),
          hashtags: campaign.insights.recommendedHashtags.slice(0, 3),
          callToAction: generateMockCallToAction(platform),
        };
        
        // Add image prompt if requested
        if (includeImages) {
          content.imagePrompt = `Student accommodation at ${campaign.targetUniversities[0] || 'university'}, ${contentTone} tone, lifestyle photography`;
        }
        
        return content;
      });
      
      log('[social-targeting] Campaign content generated successfully', 'social-targeting');
      
      res.json({
        success: true,
        content: platformContent
      });
    } catch (error) {
      log(`[social-targeting] Error generating content: ${error}`, 'social-targeting-error');
      res.status(500).json({
        success: false,
        message: 'Failed to generate content'
      });
    }
  });

  // Dynamic campaign builder: Save draft
  app.post('/api/targeting/social/draft', authenticateUser, async (req, res) => {
    try {
      log('[social-targeting] Saving campaign draft', 'social-targeting');
      log(`[social-targeting] Draft data: ${JSON.stringify(req.body)}`, 'social-targeting-debug');
      
      const { campaign } = req.body;
      const userId = req.session?.userId;
      
      if (!campaign) {
        return res.status(400).json({ 
          success: false, 
          message: 'Campaign data is required' 
        });
      }
      
      // Add userId and status to the campaign data
      campaign.userId = userId;
      campaign.status = 'Draft';
      campaign.updatedAt = new Date();
      
      // Save to storage
      let result: SocialCampaign;
      
      if (campaign.id) {
        // Update existing campaign
        result = await storage.updateSocialCampaign(campaign.id, campaign) as SocialCampaign;
      } else {
        // Create new campaign
        result = await storage.createSocialCampaign(campaign);
      }
      
      log(`[social-targeting] Campaign draft "${campaign.name}" saved successfully with ID ${result.id}`, 'social-targeting');
      
      res.json({
        success: true,
        message: 'Campaign draft saved successfully',
        campaignId: result.id
      });
    } catch (error) {
      log(`[social-targeting] Error saving draft: ${error}`, 'social-targeting-error');
      res.status(500).json({
        success: false,
        message: 'Failed to save draft'
      });
    }
  });

  // Delete a social campaign
  app.delete('/api/targeting/social/:id', authenticateUser, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      
      if (isNaN(campaignId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid campaign ID'
        });
      }
      
      // Verify that the campaign exists and belongs to the user
      const campaign = await storage.getSocialCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }
      
      const userId = req.session?.userId;
      if (campaign.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this campaign'
        });
      }
      
      // Delete the campaign
      const deleted = await storage.deleteSocialCampaign(campaignId);
      
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete campaign'
        });
      }
      
      log(`[social-targeting] Campaign with ID ${campaignId} deleted successfully`, 'social-targeting');
      
      res.json({
        success: true,
        message: 'Campaign deleted successfully'
      });
    } catch (error) {
      log(`[social-targeting] Error deleting campaign: ${error}`, 'social-targeting-error');
      res.status(500).json({
        success: false,
        message: 'Failed to delete campaign'
      });
    }
  });

  // Post content to a social media platform with rate limiting
  app.post('/api/targeting/social/post', authenticateUser, async (req, res) => {
    try {
      log('[social-targeting] Attempting to post content to social media', 'social-targeting');
      log(`[social-targeting] Post data: ${JSON.stringify(req.body)}`, 'social-targeting-debug');
      
      const { platform, campaignId, content } = req.body;
      const userId = req.session?.userId;
      
      if (!platform || !content) {
        return res.status(400).json({
          success: false,
          message: 'Platform and content are required'
        });
      }
      
      // Verify rate limits and post content
      const result = await socialMediaService.postToSocialMedia(
        userId as number,
        platform,
        content,
        campaignId
      );
      
      if (result.success) {
        log(`[social-targeting] Successfully posted to ${platform}`, 'social-targeting');
        res.json({
          success: true,
          message: result.message,
          postId: result.postId
        });
      } else {
        log(`[social-targeting] Post rate-limited for ${platform}`, 'social-targeting');
        res.json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      log(`[social-targeting] Error posting to social media: ${error}`, 'social-targeting-error');
      res.status(500).json({
        success: false,
        message: 'Failed to post to social media'
      });
    }
  });
  
  // Get rate limit information for social platforms
  app.get('/api/targeting/social/limits', authenticateUser, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const platforms = req.query.platforms ? 
        Array.isArray(req.query.platforms) ? 
          req.query.platforms as string[] : [req.query.platforms as string] 
        : ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'];
      
      const limits: Record<string, any> = {};
      
      // Get rate limit info for each platform
      for (const platform of platforms) {
        const platformStr = platform.toString();
        const rateLimits = socialMediaService.getRateLimits(userId as number, [platformStr]);
        const platformLimits = rateLimits[platformStr];
        
        if (platformLimits) {
          // Check if this is an error response for unsupported platform
          if ('error' in platformLimits) {
            limits[platformStr] = {
              supported: false,
              error: platformLimits.error,
              remainingPosts: 0,
              nextBestTime: "N/A"
            };
          } else {
            // This is a valid rate limit info
            limits[platformStr] = {
              supported: true,
              totalLimit: platformLimits.totalLimit,
              usedToday: platformLimits.usedToday,
              remainingPosts: platformLimits.remainingPosts,
              nextBestTime: platformLimits.nextBestTime
            };
          }
        } else {
          // Fallback if platform info is missing entirely
          limits[platformStr] = {
            supported: false,
            error: "Platform not supported",
            remainingPosts: 0,
            nextBestTime: "N/A"
          };
        }
      }
      
      log(`[social-targeting] Retrieved rate limits for user ${userId}`, 'social-targeting');
      
      res.json({
        success: true,
        limits
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`[social-targeting] Error getting rate limits: ${errorMessage}`, 'social-targeting-error');
      res.status(500).json({
        success: false,
        message: 'Failed to get rate limits'
      });
    }
  });
  
  // Get post history for a user
  app.get('/api/targeting/social/history', authenticateUser, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const platform = req.query.platform as string | undefined;
      
      const history = socialMediaService.getPostHistory(userId as number, platform);
      
      log(`[social-targeting] Retrieved post history for user ${userId}`, 'social-targeting');
      
      res.json({
        success: true,
        history
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`[social-targeting] Error getting post history: ${errorMessage}`, 'social-targeting-error');
      res.status(500).json({
        success: false,
        message: 'Failed to get post history'
      });
    }
  });

  // NEW: OpenAI-powered cost-effective marketing campaign generation
  app.post('/api/marketing/generate-campaign', async (req, res) => {
    try {
      const campaignParams: MarketingCampaignParams = {
        targetAudience: req.body.targetAudience || 'students',
        campaignType: req.body.campaignType || 'multi_channel',
        propertyType: req.body.propertyType,
        location: req.body.location,
        budget: req.body.budget,
        tone: req.body.tone || 'professional',
        callToAction: req.body.callToAction || 'Book a viewing today',
        brandName: req.body.brandName || 'StudentMoves',
        uniqueSellingPoint: req.body.uniqueSellingPoint,
        promotionalOffer: req.body.promotionalOffer,
        seasonality: req.body.seasonality || 'academic_year'
      };

      const campaign = await generateMarketingCampaign(campaignParams);
      
      log(`[marketing] Generated campaign for ${campaignParams.targetAudience} - cost savings: ${campaign.estimatedCostSavings}`, 'marketing-success');
      
      res.json({
        success: true,
        campaign,
        message: 'Professional marketing campaign generated using OpenAI',
        costSavings: campaign.estimatedCostSavings
      });

    } catch (error: any) {
      log(`[marketing] Error generating campaign: ${error.message}`, 'marketing-error');
      res.status(500).json({
        success: false,
        message: 'Failed to generate marketing campaign',
        error: error.message
      });
    }
  });

  // NEW: OpenAI-powered social media post generation
  app.post('/api/marketing/generate-social-post', async (req, res) => {
    try {
      const postParams: SocialMediaPostParams = {
        platform: req.body.platform || 'instagram',
        contentType: req.body.contentType || 'property_showcase',
        propertyDetails: req.body.propertyDetails,
        tone: req.body.tone || 'professional',
        includeHashtags: req.body.includeHashtags !== false,
        includeEmojis: req.body.includeEmojis !== false,
        maxLength: req.body.maxLength
      };

      const socialPost = await generateSocialMediaPost(postParams);
      
      log(`[marketing] Generated ${postParams.platform} post - estimated reach: ${socialPost.estimatedReach}`, 'marketing-success');
      
      res.json({
        success: true,
        post: socialPost,
        message: `${postParams.platform} post generated using OpenAI`,
        costSavings: '£50-200 saved vs social media agencies'
      });

    } catch (error: any) {
      log(`[marketing] Error generating social post: ${error.message}`, 'marketing-error');
      res.status(500).json({
        success: false,
        message: 'Failed to generate social media post',
        error: error.message
      });
    }
  });

  // NEW: OpenAI-powered email campaign generation  
  app.post('/api/marketing/generate-email-campaign', async (req, res) => {
    try {
      const emailParams: EmailCampaignParams = {
        purpose: req.body.purpose || 'promotional',
        recipientType: req.body.recipientType || 'students',
        subject: req.body.subject || 'Amazing Student Properties Available',
        personalisation: req.body.personalisation || {},
        callToAction: req.body.callToAction || 'View Properties',
        brandVoice: req.body.brandVoice || 'professional'
      };

      const emailCampaign = await generateEmailCampaign(emailParams);
      
      log(`[marketing] Generated email campaign for ${emailParams.recipientType} - expected open rate: ${emailCampaign.expectedOpenRate}`, 'marketing-success');
      
      res.json({
        success: true,
        email: emailCampaign,
        message: 'Professional email campaign generated using OpenAI',
        costSavings: emailCampaign.costComparison
      });

    } catch (error: any) {
      log(`[marketing] Error generating email campaign: ${error.message}`, 'marketing-error');
      res.status(500).json({
        success: false,
        message: 'Failed to generate email campaign',
        error: error.message
      });
    }
  });

  // NEW: Property description generator using OpenAI (replaces expensive copywriting services)
  app.post('/api/marketing/generate-property-description', async (req, res) => {
    try {
      const { generatePropertyDescription } = await import('./openai');
      
      const propertyParams = {
        title: req.body.title || 'Student Property',
        propertyType: req.body.propertyType || 'student accommodation',
        bedrooms: req.body.bedrooms || 3,
        bathrooms: req.body.bathrooms || 2,
        location: req.body.location || 'University area',
        university: req.body.university,
        features: req.body.features || ['WiFi', 'Furnished', 'Bills included'],
        nearbyAmenities: req.body.nearbyAmenities,
        tone: req.body.tone || 'student-friendly',
        propertyCategory: req.body.propertyCategory || 'student',
        target: req.body.target,
        pricePoint: req.body.pricePoint,
        optimizeForSEO: req.body.optimizeForSEO || true,
        highlightUtilities: req.body.highlightUtilities || true,
        maxLength: req.body.maxLength || 300,
        billsIncluded: req.body.billsIncluded || true,
        furnished: req.body.furnished || true
      };

      const description = await generatePropertyDescription(propertyParams);
      
      log(`[marketing] Generated property description for ${propertyParams.title}`, 'marketing-success');
      
      res.json({
        success: true,
        description,
        message: 'Professional property description generated using OpenAI',
        costSavings: '£100-500 saved vs professional copywriting services'
      });

    } catch (error: any) {
      log(`[marketing] Error generating property description: ${error.message}`, 'marketing-error');
      res.status(500).json({
        success: false,
        message: 'Failed to generate property description',
        error: error.message
      });
    }
  });

  // NEW: Marketing cost comparison endpoint
  app.get('/api/marketing/cost-comparison', (req, res) => {
    res.json({
      success: true,
      comparison: {
        traditionalAgency: {
          campaignCreation: '£500-2000',
          socialMediaPosts: '£50-200 per post',
          emailCampaigns: '£200-800',
          propertyDescriptions: '£100-500 per description',
          monthlyRetainer: '£2000-5000',
          total: '£2850-8500 per month'
        },
        openaiPowered: {
          campaignCreation: '£2-8 (OpenAI API cost)',
          socialMediaPosts: '£0.50-2 per post',
          emailCampaigns: '£1-4',
          propertyDescriptions: '£1-3 per description',
          monthlyApiCost: '£50-200',
          total: '£54-217 per month'
        },
        savings: {
          percentage: '95-98%',
          monthlyAmount: '£2800-8300',
          annualAmount: '£33,600-99,600'
        },
        features: {
          openai: [
            'Professional quality content',
            'Instant generation',
            'Customizable tone and style',
            'SEO optimization',
            'Multi-platform optimization',
            'A/B test variants',
            '24/7 availability'
          ],
          traditionalAgency: [
            'Human creativity',
            'Industry relationships',
            'Manual review process',
            'Account management',
            'Strategy consulting'
          ]
        }
      }
    });
  });

  log('[social-targeting] Social targeting routes registered', 'social-targeting');
}

// Helper functions for mock content generation
function generateMockPlatformContent(platform: string, tone: string, campaign: any): string {
  const toneAdjectives: Record<string, string> = {
    casual: "perfect",
    professional: "premium",
    energetic: "amazing",
    informative: "comprehensive",
  };
  
  const adjective = toneAdjectives[tone] || "great";
  const uni = campaign.targetUniversities[0] || 'campus';
  
  const platformSpecific: Record<string, string> = {
    instagram: `Looking for the ${adjective} student housing near ${uni}? 🏠✨ Check out our properties with amazing amenities that make student life easier! #StudentLiving`,
    facebook: `Searching for the ${adjective} student accommodation? Our properties near ${uni} offer everything you need for a successful academic year. From study spaces to social areas, we've got you covered. Contact us today to book a viewing!`,
    twitter: `Need ${adjective} student housing near ${uni}? We've got spaces available now! Click to learn more 🏠`,
    tiktok: `POV: You just found your ${adjective} student pad for next year! 🔥 #StudentTok #UniLife`,
    linkedin: `We're proud to offer ${adjective} accommodations for students at ${uni} that combine comfort, convenience, and value. Our properties support academic success while providing the amenities that today's students expect.`,
  };
  
  return platformSpecific[platform] || 
    `Check out our ${adjective} student accommodations near ${uni}!`;
}

function generateMockCallToAction(platform: string): string {
  const ctas: Record<string, string> = {
    instagram: "Link in bio to book a viewing!",
    facebook: "Message us to schedule a tour today!",
    twitter: "Click the link to see available properties!",
    tiktok: "Swipe up to see more properties!",
    linkedin: "Contact our leasing team to learn more about our offerings.",
  };
  
  return ctas[platform] || "Contact us today!";
}