import express from 'express';
import * as openaiEnhanced from './openai-enhanced';
import { log } from './utils/logger';

const router = express.Router();

/**
 * Enhanced OpenAI routes for the application
 * Uses the improved implementation based on the latest OpenAI best practices
 */

// Middleware to check if OpenAI API key is configured
const requireOpenAIKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(400).json({
      status: 'error',
      message: 'OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.'
    });
  }
  next();
};

// Get OpenAI status
router.get('/status', async (req, res) => {
  try {
    const isValid = await openaiEnhanced.checkApiKey();
    
    if (isValid) {
      return res.json({
        status: 'success',
        message: 'OpenAI API is configured and working correctly',
        usingMock: false
      });
    } else {
      return res.json({
        status: 'error',
        message: 'OpenAI API key is invalid or the service is unavailable',
        usingMock: false
      });
    }
  } catch (error) {
    log(`Error checking OpenAI status: ${error}`, 'routes-openai-enhanced');
    return res.status(500).json({
      status: 'error',
      message: 'Error checking OpenAI status',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Summarize text
router.post('/summarize', requireOpenAIKey, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        status: 'error',
        message: 'Text is required'
      });
    }
    
    const summary = await openaiEnhanced.summarizeArticle(text);
    
    return res.json({
      status: 'success',
      result: summary
    });
  } catch (error) {
    log(`Error summarizing text: ${error}`, 'routes-openai-enhanced');
    return res.status(500).json({
      status: 'error',
      message: 'Error summarizing text',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Analyze sentiment
router.post('/analyze-sentiment', requireOpenAIKey, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        status: 'error',
        message: 'Text is required'
      });
    }
    
    const sentiment = await openaiEnhanced.analyzeSentiment(text);
    
    return res.json({
      status: 'success',
      result: sentiment
    });
  } catch (error) {
    log(`Error analyzing sentiment: ${error}`, 'routes-openai-enhanced');
    return res.status(500).json({
      status: 'error',
      message: 'Error analyzing sentiment',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Analyze property image
router.post('/analyze-property-image', requireOpenAIKey, async (req, res) => {
  try {
    const { base64Image, analysisMode, customPrompt } = req.body;
    
    if (!base64Image) {
      return res.status(400).json({
        status: 'error',
        message: 'Base64 image data is required'
      });
    }
    
    if (!analysisMode) {
      return res.status(400).json({
        status: 'error',
        message: 'Analysis mode is required'
      });
    }
    
    const analysis = await openaiEnhanced.analyzePropertyImage(base64Image, analysisMode, customPrompt);
    
    return res.json({
      status: 'success',
      result: analysis
    });
  } catch (error) {
    log(`Error analyzing property image: ${error}`, 'routes-openai-enhanced');
    return res.status(500).json({
      status: 'error',
      message: 'Error analyzing property image',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Generate property image
router.post('/generate-property-image', requireOpenAIKey, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        status: 'error',
        message: 'Prompt is required'
      });
    }
    
    const image = await openaiEnhanced.generatePropertyImage(prompt);
    
    return res.json({
      status: 'success',
      result: image
    });
  } catch (error) {
    log(`Error generating property image: ${error}`, 'routes-openai-enhanced');
    return res.status(500).json({
      status: 'error',
      message: 'Error generating property image',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Generate floor plan data
router.post('/generate-floor-plan', requireOpenAIKey, async (req, res) => {
  try {
    const { roomImages } = req.body;
    
    if (!roomImages || !Array.isArray(roomImages) || roomImages.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Room images array is required'
      });
    }
    
    const floorPlanData = await openaiEnhanced.generateFloorPlanData(roomImages);
    
    return res.json({
      status: 'success',
      result: floorPlanData
    });
  } catch (error) {
    log(`Error generating floor plan data: ${error}`, 'routes-openai-enhanced');
    return res.status(500).json({
      status: 'error',
      message: 'Error generating floor plan data',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Analyze a document with enhanced OpenAI capabilities
router.post('/analyze-document', requireOpenAIKey, async (req, res) => {
  try {
    const { base64Document, analysisMode, customPrompt } = req.body;
    
    if (!base64Document) {
      return res.status(400).json({
        status: 'error',
        message: 'Document data is required'
      });
    }
    
    if (!analysisMode) {
      return res.status(400).json({
        status: 'error',
        message: 'Analysis mode is required'
      });
    }
    
    // Validate analysis mode
    const validModes = ['lease-analysis', 'compliance-check', 'summarization', 'risk-assessment', 'custom'];
    if (!validModes.includes(analysisMode)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid analysis mode. Must be one of: ${validModes.join(', ')}`
      });
    }
    
    // For custom mode, a custom prompt is required
    if (analysisMode === 'custom' && !customPrompt) {
      return res.status(400).json({
        status: 'error',
        message: 'Custom prompt is required for custom analysis mode'
      });
    }
    
    const result = await openaiEnhanced.analyzeDocument(
      base64Document,
      analysisMode,
      customPrompt
    );
    
    res.json({ result });
  } catch (error) {
    log(`Error analyzing document: ${error}`, 'routes-openai-enhanced');
    res.status(500).json({
      status: 'error',
      message: 'Error analyzing document',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;