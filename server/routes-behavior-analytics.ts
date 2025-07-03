import express from 'express';
import { z } from 'zod';
import { storage } from './storage';
import { insertUserBehaviorSchema, insertUserSuggestionSchema } from '@shared/schema';
import { authenticateUser } from './middleware/auth';
import { log } from './vite';

const router = express.Router();

// Create user behavior analytics entry
router.post('/track', authenticateUser, async (req, res) => {
  try {
    const validatedData = insertUserBehaviorSchema.parse(req.body);
    
    // Add the user ID from the session if not provided
    if (!validatedData.userId && req.session?.userId) {
      validatedData.userId = req.session.userId;
    }
    
    // Ensure we have the user ID
    if (!validatedData.userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required for behavior tracking'
      });
    }
    
    const behavior = await storage.createUserBehaviorAnalytic(validatedData);
    
    log(`Tracked user behavior: ${validatedData.behaviorType} for user ${validatedData.userId}`, 'behavior');
    
    return res.status(201).json({
      success: true,
      behavior
    });
  } catch (error) {
    console.error('Error tracking user behavior:', error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Invalid behavior data',
      error: error instanceof z.ZodError ? error.errors : undefined
    });
  }
});

// Get user behavior analytics
router.get('/user/:userId', authenticateUser, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Security check - users can only view their own behavior unless they're admin
    if (req.session?.userId !== userId && req.session?.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this user\'s behavior data'
      });
    }
    
    const behaviors = await storage.getUserBehaviorAnalytics(userId);
    
    return res.json({
      success: true,
      behaviors
    });
  } catch (error) {
    console.error('Error getting user behavior:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving user behavior data'
    });
  }
});

// Get user behavior analytics by type
router.get('/user/:userId/type/:behaviorType', authenticateUser, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { behaviorType } = req.params;
    
    // Security check - users can only view their own behavior unless they're admin
    if (req.session?.userId !== userId && req.session?.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this user\'s behavior data'
      });
    }
    
    const behaviors = await storage.getUserBehaviorAnalyticsByType(userId, behaviorType);
    
    return res.json({
      success: true,
      behaviors
    });
  } catch (error) {
    console.error('Error getting user behavior by type:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving user behavior data by type'
    });
  }
});

// Get user behavior patterns
router.get('/user/:userId/patterns', authenticateUser, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Security check - users can only view their own behavior unless they're admin
    if (req.session?.userId !== userId && req.session?.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this user\'s behavior patterns'
      });
    }
    
    const patterns = await storage.getUserBehaviorPatterns(userId);
    
    return res.json({
      success: true,
      patterns
    });
  } catch (error) {
    console.error('Error getting user behavior patterns:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving user behavior patterns'
    });
  }
});

// Get recent behaviors for admin dashboard
router.get('/recent', authenticateUser, async (req, res) => {
  try {
    // Security check - only admins can view all recent behaviors
    if (req.session?.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view recent behaviors across all users'
      });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const behaviors = await storage.getRecentUserBehaviors(limit);
    
    return res.json({
      success: true,
      behaviors
    });
  } catch (error) {
    console.error('Error getting recent behaviors:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving recent behaviors'
    });
  }
});

// Create user suggestion
router.post('/suggestions', authenticateUser, async (req, res) => {
  try {
    // Only admins and the system can create suggestions
    if (req.session?.userType !== 'admin' && req.session?.userType !== 'system') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can create user suggestions'
      });
    }
    
    const validatedData = insertUserSuggestionSchema.parse(req.body);
    const suggestion = await storage.createUserSuggestion(validatedData);
    
    log(`Created user suggestion for user ${validatedData.userId}: ${validatedData.title}`, 'suggestions');
    
    return res.status(201).json({
      success: true,
      suggestion
    });
  } catch (error) {
    console.error('Error creating user suggestion:', error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Invalid suggestion data',
      error: error instanceof z.ZodError ? error.errors : undefined
    });
  }
});

// Get user suggestions
router.get('/suggestions/user/:userId', authenticateUser, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Security check - users can only view their own suggestions unless they're admin
    if (req.session?.userId !== userId && req.session?.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this user\'s suggestions'
      });
    }
    
    const suggestions = await storage.getUserSuggestions(userId);
    
    return res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Error getting user suggestions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving user suggestions'
    });
  }
});

// Get user suggestions by type
router.get('/suggestions/user/:userId/type/:suggestionType', authenticateUser, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { suggestionType } = req.params;
    
    // Security check - users can only view their own suggestions unless they're admin
    if (req.session?.userId !== userId && req.session?.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this user\'s suggestions'
      });
    }
    
    const suggestions = await storage.getUserSuggestionsByType(userId, suggestionType);
    
    return res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Error getting user suggestions by type:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving user suggestions by type'
    });
  }
});

// Get active suggestions for a user
router.get('/suggestions/active/:userId', authenticateUser, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Security check - users can only view their own suggestions unless they're admin
    if (req.session?.userId !== userId && req.session?.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this user\'s suggestions'
      });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const suggestions = await storage.getActiveSuggestionsForUser(userId, limit);
    
    return res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Error getting active suggestions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving active suggestions'
    });
  }
});

// Mark suggestion as viewed (increment impressions)
router.post('/suggestions/:id/impression', authenticateUser, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Get the suggestion to verify ownership
    const suggestion = await storage.getUserSuggestionById(id);
    
    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }
    
    // Security check - users can only interact with their own suggestions unless they're admin
    if (req.session?.userId !== suggestion.userId && req.session?.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to interact with this suggestion'
      });
    }
    
    const updatedSuggestion = await storage.markSuggestionImpression(id);
    
    return res.json({
      success: true,
      suggestion: updatedSuggestion
    });
  } catch (error) {
    console.error('Error marking suggestion impression:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating suggestion impression'
    });
  }
});

// Mark suggestion as clicked
router.post('/suggestions/:id/click', authenticateUser, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Get the suggestion to verify ownership
    const suggestion = await storage.getUserSuggestionById(id);
    
    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }
    
    // Security check - users can only interact with their own suggestions unless they're admin
    if (req.session?.userId !== suggestion.userId && req.session?.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to interact with this suggestion'
      });
    }
    
    const updatedSuggestion = await storage.markSuggestionClicked(id);
    
    return res.json({
      success: true,
      suggestion: updatedSuggestion
    });
  } catch (error) {
    console.error('Error marking suggestion clicked:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating suggestion click'
    });
  }
});

// Dismiss suggestion
router.post('/suggestions/:id/dismiss', authenticateUser, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Get the suggestion to verify ownership
    const suggestion = await storage.getUserSuggestionById(id);
    
    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }
    
    // Security check - users can only interact with their own suggestions unless they're admin
    if (req.session?.userId !== suggestion.userId && req.session?.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to interact with this suggestion'
      });
    }
    
    const updatedSuggestion = await storage.dismissSuggestion(id);
    
    return res.json({
      success: true,
      suggestion: updatedSuggestion
    });
  } catch (error) {
    console.error('Error dismissing suggestion:', error);
    return res.status(500).json({
      success: false,
      message: 'Error dismissing suggestion'
    });
  }
});

export default router;