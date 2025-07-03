/**
 * OpenAI API Routes
 * Provides endpoints for OpenAI API functionality
 */

import express, { Express } from 'express';
import * as openai from './openai';
import { log } from './utils/logger';

const router = express.Router();

// Check if the OpenAI API key is configured
router.get('/status', async (req, res) => {
  try {
    const isAvailable = await openai.checkApiKey();
    
    // Check if we're using the mock implementation
    // This looks for the USE_MOCK_OPENAI constant in the openai module
    const usingMock = 'USE_MOCK_OPENAI' in openai && (openai as any).USE_MOCK_OPENAI === true;
    
    res.json({
      status: isAvailable ? 'success' : 'error',
      message: isAvailable 
        ? usingMock 
          ? 'OpenAI Mock Implementation is available'
          : 'OpenAI API is configured and working correctly' 
        : 'OpenAI API key is invalid or not configured',
      usingMock: usingMock
    });
  } catch (error: any) {
    log(`Error checking OpenAI API status: ${error.message}`, 'openai');
    res.status(500).json({
      status: 'error',
      message: `Error checking OpenAI API status: ${error.message}`,
    });
  }
});

// Configure the OpenAI API key
router.post('/configure', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({
        status: 'error',
        message: 'API key is required',
      });
    }
    
    // Set the API key in the environment
    process.env.OPENAI_API_KEY = apiKey;
    
    // Verify that the key works
    const isValid = await openai.checkApiKey();
    
    if (isValid) {
      // In a production environment, you would want to store this securely
      // For now, we'll just keep it in the environment variable
      log('OpenAI API key configured successfully', 'openai');
      res.json({
        status: 'success',
        message: 'OpenAI API key configured successfully',
      });
    } else {
      log('Invalid OpenAI API key provided', 'openai');
      res.status(400).json({
        status: 'error',
        message: 'Invalid API key. Please check and try again.',
      });
    }
  } catch (error: any) {
    log(`Error configuring OpenAI API key: ${error.message}`, 'openai');
    res.status(500).json({
      status: 'error',
      message: `Error configuring OpenAI API key: ${error.message}`,
    });
  }
});

// Generate text with OpenAI
router.post('/generate', async (req, res) => {
  try {
    const { operation, prompt, maxTokens } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        status: 'error',
        message: 'Prompt is required',
      });
    }
    
    let result: string;
    
    // Use the appropriate operation based on the request
    switch (operation) {
      case 'generateText':
        result = await openai.generateText(prompt, maxTokens);
        break;
        
      case 'generatePropertyDescription':
        // For property descriptions, we need to parse the prompt into the required format
        // This is a simplified version - in a real app, you'd want more structure
        const params = {
          title: prompt.includes('Title:') ? prompt.split('Title:')[1].split('\n')[0].trim() : 'Property',
          propertyType: prompt.includes('Type:') ? prompt.split('Type:')[1].split('\n')[0].trim() : 'Apartment',
          bedrooms: prompt.includes('Bedrooms:') ? parseInt(prompt.split('Bedrooms:')[1].split('\n')[0].trim()) : 2,
          bathrooms: prompt.includes('Bathrooms:') ? parseInt(prompt.split('Bathrooms:')[1].split('\n')[0].trim()) : 1,
          location: prompt.includes('Location:') ? prompt.split('Location:')[1].split('\n')[0].trim() : 'City Center',
          features: prompt.includes('Features:') 
            ? prompt.split('Features:')[1].split('\n')[0].trim().split(',').map((f: string) => f.trim())
            : ['Modern', 'Spacious'],
          maxLength: maxTokens ? maxTokens * 4 : 2000 // Rough character estimate
        };
        
        result = await openai.generatePropertyDescription(params);
        break;
        
      default:
        return res.status(400).json({
          status: 'error',
          message: `Unknown operation: ${operation}`,
        });
    }
    
    res.json({
      status: 'success',
      result,
    });
  } catch (error: any) {
    log(`Error generating text with OpenAI: ${error.message}`, 'openai');
    res.status(500).json({
      status: 'error',
      error: `Error generating text: ${error.message}`,
    });
  }
});

// Analyze an image with OpenAI
router.post('/analyze-image', async (req, res) => {
  try {
    const { base64Image, prompt } = req.body;
    
    if (!base64Image) {
      return res.status(400).json({
        status: 'error',
        message: 'Image data is required',
      });
    }
    
    if (!prompt) {
      return res.status(400).json({
        status: 'error',
        message: 'Prompt is required',
      });
    }
    
    // Remove data URL prefix if present
    const imageData = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;
    
    const result = await openai.analyzeImage(imageData, prompt);
    
    res.json({
      status: 'success',
      result,
    });
  } catch (error: any) {
    log(`Error analyzing image with OpenAI: ${error.message}`, 'openai');
    res.status(500).json({
      status: 'error',
      message: `Error analyzing image: ${error.message}`,
    });
  }
});

// Generate embeddings for text
router.post('/embeddings', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        status: 'error',
        message: 'Text is required',
      });
    }
    
    const embeddings = await openai.generateEmbeddings(text);
    
    res.json({
      status: 'success',
      embeddings,
    });
  } catch (error: any) {
    log(`Error generating embeddings: ${error.message}`, 'openai');
    res.status(500).json({
      status: 'error',
      message: `Error generating embeddings: ${error.message}`,
    });
  }
});

// Generate a floor plan from property images
router.post('/generate-floor-plan', async (req, res) => {
  try {
    const { images } = req.body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'At least one image is required',
      });
    }
    
    // Process the images
    // Each image should have a base64 string and a room label
    const processedImages = images.map(img => {
      // Extract the base64 data if it's a data URL
      const base64Data = img.base64Image.includes('base64,')
        ? img.base64Image.split('base64,')[1]
        : img.base64Image;
        
      // Convert base64 to Buffer
      const buffer = Buffer.from(base64Data, 'base64');
      
      return {
        buffer,
        roomLabel: img.roomLabel || '',
      };
    });
    
    // Generate the floor plan
    const floorPlan = await openai.generateFloorPlan(processedImages);
    
    res.json({
      status: 'success',
      floorPlan,
    });
  } catch (error: any) {
    log(`Error generating floor plan: ${error.message}`, 'openai');
    res.status(500).json({
      status: 'error',
      message: `Error generating floor plan: ${error.message}`,
    });
  }
});

// Generate an image using DALL-E
router.post('/generate-image', async (req, res) => {
  try {
    const { prompt, size } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        status: 'error',
        message: 'Prompt is required',
      });
    }
    
    // Validate size parameter if provided
    const validSizes = ['1024x1024', '1024x1792', '1792x1024'];
    const imageSize = size && validSizes.includes(size) 
      ? size as '1024x1024' | '1024x1792' | '1792x1024'
      : '1024x1024';
    
    const imageUrl = await openai.generateImage(prompt, imageSize);
    
    res.json({
      status: 'success',
      imageUrl,
    });
  } catch (error: any) {
    log(`Error generating image: ${error.message}`, 'openai');
    res.status(500).json({
      status: 'error',
      message: `Error generating image: ${error.message}`,
    });
  }
});

// Analyze document (PDF, lease agreement, contract, etc.)
router.post('/analyze-document', async (req, res) => {
  try {
    const { base64File, analysisMode, fileName, customPrompt } = req.body;
    
    if (!base64File) {
      return res.status(400).json({
        status: 'error',
        message: 'Document file data is required',
      });
    }
    
    if (!analysisMode) {
      return res.status(400).json({
        status: 'error',
        message: 'Analysis mode is required',
      });
    }
    
    // Validate analysis mode
    const validModes = ['extract_info', 'summarize', 'risk_assessment', 'compliance_check', 'lease_review', 'contract_highlights', 'custom'];
    if (!validModes.includes(analysisMode)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid analysis mode. Must be one of: ${validModes.join(', ')}`,
      });
    }
    
    // For custom mode, a custom prompt is required
    if (analysisMode === 'custom' && !customPrompt) {
      return res.status(400).json({
        status: 'error',
        message: 'Custom prompt is required for custom analysis mode',
      });
    }
    
    const analysisResult = await openai.analyzeDocument(
      base64File,
      analysisMode,
      fileName,
      customPrompt
    );
    
    res.json({
      status: 'success',
      result: analysisResult,
    });
  } catch (error: any) {
    log(`Error analyzing document: ${error.message}`, 'openai');
    res.status(500).json({
      status: 'error',
      message: `Error analyzing document: ${error.message}`,
    });
  }
});

/**
 * Register OpenAI routes with the Express application
 * @param app Express application
 */
export function registerOpenAIRoutes(app: Express) {
  log('Registering OpenAI API routes', 'openai');
  app.use('/api/openai', router);
  log('OpenAI API routes registered', 'openai');
}

export default router;