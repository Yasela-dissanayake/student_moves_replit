import express from 'express';
import { info as logInfo, error as logError, debug as logDebug } from './logging';
import SocialMediaService from './social-media-service';
import { IStorage } from './storage';
import { authenticateUser } from './middleware/auth';

export function registerSocialMediaRoutes(app: express.Express, storage: IStorage) {
  const socialMediaService = new SocialMediaService(storage);
  
  // Route to get rate limits for social platforms
  app.get('/api/targeting/social/limits', authenticateUser, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }
      
      const platforms = req.query.platforms 
        ? (Array.isArray(req.query.platforms) 
          ? req.query.platforms as string[] 
          : [req.query.platforms as string])
        : undefined;
      
      // Get rate limits and transform the response for the client
      const rateLimits = socialMediaService.getRateLimits(userId as number, platforms);
      const formattedResponse: Record<string, any> = {};
      
      Object.entries(rateLimits).forEach(([platform, limitInfo]) => {
        if ('error' in limitInfo) {
          // This is an unsupported platform
          formattedResponse[platform] = {
            supported: false,
            error: limitInfo.error,
            remainingPosts: 0,
            nextBestTime: "N/A"
          };
        } else {
          // This is a valid platform with rate limit info
          formattedResponse[platform] = {
            supported: true,
            totalLimit: limitInfo.totalLimit,
            usedToday: limitInfo.usedToday,
            remainingPosts: limitInfo.remainingPosts,
            nextBestTime: limitInfo.nextBestTime
          };
        }
      });
      
      return res.json({
        success: true,
        limits: formattedResponse
      });
    } catch (error) {
      logError(`Error fetching social media rate limits: ${error}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch rate limits' 
      });
    }
  });
  
  // Route to post to social media
  app.post('/api/targeting/social/post', authenticateUser, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }
      
      const { platform, content, campaignId } = req.body;
      
      if (!platform || !content) {
        return res.status(400).json({ 
          success: false, 
          message: 'Platform and content are required' 
        });
      }
      
      const result = await socialMediaService.postToSocialMedia(
        userId as number, 
        platform, 
        content, 
        campaignId
      );
      
      return res.json(result);
    } catch (error) {
      logError(`Error posting to social media: ${error}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to post to social media' 
      });
    }
  });
  
  // Route to get posting history
  app.get('/api/targeting/social/history', authenticateUser, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }
      
      const platform = req.query.platform as string | undefined;
      const history = socialMediaService.getPostHistory(userId as number, platform);
      
      return res.json({
        success: true,
        history
      });
    } catch (error) {
      logError(`Error fetching social media post history: ${error}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch post history' 
      });
    }
  });
  
  logInfo('[routes] Social media posting routes registered');
}