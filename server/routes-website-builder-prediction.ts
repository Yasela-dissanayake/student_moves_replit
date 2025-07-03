/**
 * Routes for smart suggestions and user behavior tracking in website builder
 */
import express from 'express';
import { z } from 'zod';
import { logSecurity, info, error } from './logging';
import { createSecurityContext } from './utils/security-utils';
import { authenticateUser } from './middleware/auth';
import { standardRateLimiter as rateLimiter } from './middleware/rate-limit';
import {
  trackUserAction,
  updateUserPreferences,
  getUserPreferences,
  getSuggestedTemplates,
  trackBehaviorMiddleware
} from './website-builder-prediction-service';
import { db } from './db';
import { 
  websiteBuilderUserBehavior, 
  websiteBuilderUserPreferences,
  createWebsiteBuilderUserBehaviorSchema
} from '../shared/schema';
import { eq, desc } from 'drizzle-orm';

const router = express.Router();

// Middleware to ensure user is authenticated
router.use(authenticateUser);

// Rate limiting for prediction API
// Using the standardRateLimiter imported as rateLimiter
router.use(rateLimiter);

// Apply tracking middleware to record user behavior
router.use(trackBehaviorMiddleware);

/**
 * GET /api/website-builder/suggestions
 * Get personalized template suggestions based on user behavior
 */
router.get('/suggestions', async (req, res) => {
  const securityContext = createSecurityContext(req);
  
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      logSecurity('Unauthorized access to suggestions API', {
        ...securityContext,
        action: 'get_suggestions',
        result: 'failure',
        details: { reason: 'User not authenticated' }
      });
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Parse options
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
    const includeComplexity = req.query.includeComplexity === 'true';
    const includeCategories = req.query.includeCategories === 'true';
    const includeTags = req.query.includeTags === 'true';
    
    const suggestions = await getSuggestedTemplates({
      userId,
      limit,
      includeComplexityLevel: includeComplexity,
      includeCategories,
      includeTags
    });
    
    logSecurity('Template suggestions retrieved', {
      ...securityContext,
      action: 'get_suggestions',
      result: 'success',
      details: { 
        userId,
        count: suggestions.length 
      }
    });
    
    return res.json({
      suggestions,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    error('Error retrieving template suggestions', { 
      error: errorMessage,
      userId: req.session?.userId
    });
    
    logSecurity('Failed to retrieve template suggestions', {
      ...securityContext,
      action: 'get_suggestions',
      result: 'failure',
      details: { error: errorMessage }
    });
    
    return res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

/**
 * GET /api/website-builder/preferences
 * Get user preferences
 */
router.get('/preferences', async (req, res) => {
  const securityContext = createSecurityContext(req);
  
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      logSecurity('Unauthorized access to preferences API', {
        ...securityContext,
        action: 'get_preferences',
        result: 'failure',
        details: { reason: 'User not authenticated' }
      });
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const preferences = await getUserPreferences(userId);
    
    // If no preferences exist, calculate them from behavior
    if (!preferences) {
      const newPreferences = await updateUserPreferences(userId);
      
      if (!newPreferences) {
        return res.json({
          preferences: {
            userId,
            preferredCategories: [],
            preferredComplexity: 'beginner',
            preferredTags: [],
            lastActiveTimestamp: new Date().toISOString()
          },
          isNew: true
        });
      }
      
      return res.json({
        preferences: newPreferences,
        isNew: true
      });
    }
    
    logSecurity('User preferences retrieved', {
      ...securityContext,
      action: 'get_preferences',
      result: 'success',
      details: { userId }
    });
    
    return res.json({
      preferences,
      isNew: false
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    error('Error retrieving user preferences', { 
      error: errorMessage,
      userId: req.session?.userId
    });
    
    logSecurity('Failed to retrieve user preferences', {
      ...securityContext,
      action: 'get_preferences',
      result: 'failure',
      details: { error: errorMessage }
    });
    
    return res.status(500).json({ error: 'Failed to get user preferences' });
  }
});

/**
 * POST /api/website-builder/track
 * Manually track user action
 */
router.post('/track', async (req, res) => {
  const securityContext = createSecurityContext(req);
  
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      logSecurity('Unauthorized access to track API', {
        ...securityContext,
        action: 'track_action',
        result: 'failure',
        details: { reason: 'User not authenticated' }
      });
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Validate request body
    const schema = createWebsiteBuilderUserBehaviorSchema
      .extend({
        userId: z.number().optional() // We'll use the session userId
      });
    
    const validationResult = schema.safeParse(req.body);
    
    if (!validationResult.success) {
      logSecurity('Invalid track action request', {
        ...securityContext,
        action: 'track_action',
        result: 'failure',
        details: { 
          reason: 'Invalid request data',
          validationErrors: validationResult.error.format()
        }
      });
      
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: validationResult.error.format()
      });
    }
    
    const trackData = validationResult.data;
    
    const success = await trackUserAction({
      userId,
      action: trackData.action as any,
      itemType: trackData.itemType as any,
      itemId: trackData.itemId,
      itemDetails: trackData.itemDetails ? trackData.itemDetails as Record<string, any> : undefined
    });
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to track action' });
    }
    
    logSecurity('User action tracked', {
      ...securityContext,
      action: 'track_action',
      result: 'success',
      details: {
        userId,
        trackingAction: trackData.action,
        itemType: trackData.itemType
      }
    });
    
    return res.json({ success: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    error('Error tracking user action', { 
      error: errorMessage,
      userId: req.session?.userId
    });
    
    logSecurity('Failed to track user action', {
      ...securityContext,
      action: 'track_action',
      result: 'failure',
      details: { error: errorMessage }
    });
    
    return res.status(500).json({ error: 'Failed to track action' });
  }
});

/**
 * POST /api/website-builder/favorite
 * Track a template as favorited
 */
router.post('/favorite', async (req, res) => {
  const securityContext = createSecurityContext(req);
  
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      logSecurity('Unauthorized access to favorite API', {
        ...securityContext,
        action: 'favorite_template',
        result: 'failure',
        details: { reason: 'User not authenticated' }
      });
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Validate request
    const schema = z.object({
      templateId: z.string().min(1),
      category: z.string().optional(),
      complexity: z.string().optional(),
      tags: z.array(z.string()).optional()
    });
    
    const validationResult = schema.safeParse(req.body);
    
    if (!validationResult.success) {
      logSecurity('Invalid favorite template request', {
        ...securityContext,
        action: 'favorite_template',
        result: 'failure',
        details: { 
          reason: 'Invalid request data',
          validationErrors: validationResult.error.format()
        }
      });
      
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: validationResult.error.format()
      });
    }
    
    const { templateId, category, complexity, tags } = validationResult.data;
    
    const success = await trackUserAction({
      userId,
      action: 'favorite',
      itemType: 'template',
      itemId: templateId,
      itemDetails: {
        category,
        complexity,
        tags
      }
    });
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to favorite template' });
    }
    
    // Update preferences after favoriting
    await updateUserPreferences(userId);
    
    logSecurity('Template favorited', {
      ...securityContext,
      action: 'favorite_template',
      result: 'success',
      details: {
        userId,
        templateId 
      }
    });
    
    return res.json({ success: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    error('Error favoriting template', { 
      error: errorMessage,
      userId: req.session?.userId
    });
    
    logSecurity('Failed to favorite template', {
      ...securityContext,
      action: 'favorite_template',
      result: 'failure',
      details: { error: errorMessage }
    });
    
    return res.status(500).json({ error: 'Failed to favorite template' });
  }
});

/**
 * GET /api/website-builder/history
 * Get user action history
 */
router.get('/history', async (req, res) => {
  const securityContext = createSecurityContext(req);
  
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      logSecurity('Unauthorized access to history API', {
        ...securityContext,
        action: 'get_history',
        result: 'failure',
        details: { reason: 'User not authenticated' }
      });
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get limit from query params
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    
    // Get user behavior history
    const history = await db
      .select()
      .from(websiteBuilderUserBehavior)
      .where(eq(websiteBuilderUserBehavior.userId, userId))
      .orderBy(desc(websiteBuilderUserBehavior.timestamp))
      .limit(limit);
    
    logSecurity('User history retrieved', {
      ...securityContext,
      action: 'get_history',
      result: 'success',
      details: { 
        userId,
        count: history.length
      }
    });
    
    return res.json({
      history,
      count: history.length
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    error('Error retrieving user history', { 
      error: errorMessage,
      userId: req.session?.userId
    });
    
    logSecurity('Failed to retrieve user history', {
      ...securityContext,
      action: 'get_history',
      result: 'failure',
      details: { error: errorMessage }
    });
    
    return res.status(500).json({ error: 'Failed to get user history' });
  }
});

export default router;