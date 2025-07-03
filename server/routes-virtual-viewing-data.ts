import { Router } from 'express';
import { storage } from './storage';

export function createVirtualViewingDataRoutes() {
  const router = Router();

  // Generate sample virtual viewing session data
  router.post('/generate-sessions', async (req, res) => {
    try {
      // Default to 5 sessions, but allow customization
      const count = req.body.count ? parseInt(req.body.count, 10) : 5;
      
      // Validate count
      if (isNaN(count) || count < 1 || count > 20) {
        return res.status(400).json({
          success: false,
          error: 'Invalid count. Must be a number between 1 and 20.'
        });
      }
      
      const sessions = await storage.generateSampleVirtualViewingSessions(count);
      
      return res.json({
        success: true,
        message: `Successfully generated ${sessions.length} virtual viewing sessions`,
        count: sessions.length,
        sessions: sessions.map(s => ({
          id: s.id,
          propertyId: s.propertyId,
          status: s.status,
          participantCount: s.participants?.length || 0,
          feedbackRequested: s.feedbackRequested
        }))
      });
    } catch (error) {
      console.error('Error generating virtual viewing sessions:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate virtual viewing sessions'
      });
    }
  });

  // Get viewing feedback statistics for a property
  router.get('/property-feedback-stats/:propertyId', async (req, res) => {
    try {
      const propertyId = parseInt(req.params.propertyId, 10);
      
      if (isNaN(propertyId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid property ID'
        });
      }
      
      const stats = await storage.getPropertyFeedbackStats(propertyId);
      
      return res.json({
        success: true,
        propertyId,
        stats
      });
    } catch (error) {
      console.error('Error getting property feedback stats:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get property feedback statistics'
      });
    }
  });

  return router;
}