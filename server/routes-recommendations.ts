/**
 * Recommendation API Routes
 * Provides endpoints for property recommendations
 */

import express, { Express } from 'express';
import { storage } from './storage';
import { generatePropertyRecommendations, UserPreferences } from './recommendation-service';
import { log } from './vite';

const router = express.Router();

// GET endpoint to retrieve recommendations for a specific user
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : null;
    const count = req.query.count ? parseInt(req.query.count as string, 10) : 4;
    
    // Get available properties
    const allProperties = await storage.getAllProperties();
    
    // Filter to only include available properties
    const availableProperties = allProperties.filter(p => p.available === true);
    
    if (availableProperties.length === 0) {
      return res.json({
        success: true,
        recommendations: []
      });
    }
    
    let userPreferences: UserPreferences = {};
    
    // If userId is provided, try to get their preferences
    if (userId) {
      try {
        const user = await storage.getUserById(userId);
        if (user && user.preferences) {
          // Try to parse preferences if stored as string
          if (typeof user.preferences === 'string') {
            try {
              userPreferences = JSON.parse(user.preferences);
            } catch (e) {
              log(`Could not parse user preferences: ${e.message}`, 'recommendations');
            }
          } else if (typeof user.preferences === 'object') {
            userPreferences = user.preferences;
          }
        }
      } catch (err) {
        log(`Error retrieving user preferences: ${err.message}`, 'recommendations');
        // Continue with empty preferences if user not found
      }
    }
    
    // Generate recommendations using the recommendation service
    const recommendations = generatePropertyRecommendations({
      userPreferences,
      allProperties: availableProperties,
      count
    });
    
    res.json({
      success: true,
      recommendations
    });
  } catch (error: any) {
    log(`Error generating property recommendations: ${error.message}`, 'recommendations');
    res.status(500).json({
      success: false,
      error: `Error generating recommendations: ${error.message}`
    });
  }
});

// Get personalized property recommendations based on user preferences
router.post('/properties', async (req, res) => {
  try {
    const { userPreferences = {}, count = 4 } = req.body;
    
    log(`Generating recommendations for user preferences: ${JSON.stringify(userPreferences)}`, 'recommendations');
    
    // Get available properties
    const allProperties = await storage.getAllProperties();
    
    // Filter to only include available properties
    const availableProperties = allProperties.filter(p => p.available === true);
    
    if (availableProperties.length === 0) {
      return res.json({
        success: true,
        recommendations: []
      });
    }
    
    // Generate recommendations using the recommendation service
    const recommendations = generatePropertyRecommendations({
      userPreferences: userPreferences as UserPreferences,
      allProperties: availableProperties,
      count: count || 4
    });
    
    log(`Generated ${recommendations.length} recommendations`, 'recommendations');
    
    res.json({
      success: true,
      recommendations
    });
  } catch (error: any) {
    log(`Error generating property recommendations: ${error.message}`, 'recommendations');
    res.status(500).json({
      success: false,
      error: `Error generating recommendations: ${error.message}`
    });
  }
});

/**
 * Register recommendation routes with the Express application
 * @param app Express application
 */
export function registerRecommendationRoutes(app: Express) {
  log('Registering recommendation API routes', 'recommendations');
  app.use('/api/recommendations', router);
  log('Recommendation API routes registered', 'recommendations');
}

export default router;