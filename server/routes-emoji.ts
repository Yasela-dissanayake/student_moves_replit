/**
 * Emoji suggestions routes
 * Provides AI-powered emoji suggestions based on message content
 */

import express from 'express';
import { executeAIOperation } from './ai-service-manager';

// Define TextGenerationParams interface compatible with AI service
interface TextGenerationParams {
  prompt: string;
  text?: string;
  maxTokens?: number;
  responseFormat?: string;
  forceRefresh?: boolean;
}

// Create router
const router = express.Router();

// Middleware to check authentication
function isAuthenticated(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.session && req.session.userId) {
    return next();
  }
  
  return res.status(401).json({
    status: 'error',
    message: 'Unauthorized. Please sign in.'
  });
}

/**
 * Generate emoji suggestions based on message content
 * POST /api/chat/emoji-suggestions
 */
router.post('/emoji-suggestions', isAuthenticated, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Text is required'
      });
    }
    
    // Get emoji suggestions from AI service
    const suggestions = await getAiEmojiSuggestions(text);
    
    return res.json({
      status: 'success',
      suggestions
    });
  } catch (error) {
    console.error('Error generating emoji suggestions:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to generate emoji suggestions'
    });
  }
});

/**
 * Use AI to suggest emojis based on message content
 */
async function getAiEmojiSuggestions(text: string): Promise<string[]> {
  try {
    // Use AI service to get emoji suggestions
    // We're using the built-in AI service manager
    // Call emoji-suggestions operation which is now implemented in the AI service
    const response = await executeAIOperation('emoji-suggestions', {
      prompt: `Suggest 5 relevant emojis that would be appropriate to add to this message: "${text}"
      Return ONLY the emojis as a comma-separated list without any explanation or additional text.
      For example: "😀,👍,🎉,❤️,👋"`
    });
    
    // Parse response to get emojis
    if (response && response.trim()) {
      // Clean up response and split by commas
      const emojis = response
        .replace(/["']/g, '') // Remove quotes
        .split(',')
        .map((emoji: string) => emoji.trim())
        .filter((emoji: string) => emoji); // Remove empty strings
      
      // Take up to 5 suggestions
      return emojis.slice(0, 5);
    }
    
    // Fallback to common emojis if no suggestions
    return ["👍", "😊", "👋", "❤️", "🎉"];
  } catch (error) {
    console.error('AI emoji suggestion error:', error);
    // Return empty array on error
    return [];
  }
}

export default router;