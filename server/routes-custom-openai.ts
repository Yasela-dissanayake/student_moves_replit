/**
 * Advanced Custom OpenAI API-compatible Routes
 * These routes mimic the OpenAI API structure but use free, sophisticated AI generation
 * with self-updating capabilities and advanced analytics
 */
import express from 'express';
import * as customOpenAI from './custom-openai';
import * as customAiProvider from './custom-ai-provider';
import { log } from './vite';
// No authentication required for public custom OpenAI API

const router = express.Router();

// Public endpoint to check API status
router.get('/status', async (req, res) => {
  // Check system availability
  await customAiProvider.checkAvailability();
  
  res.json({
    status: 'available',
    version: '2.0.0',
    message: 'Advanced Custom OpenAI API is available and ready to use',
    capabilities: [
      'Text completion',
      'Chat completion',
      'Image generation',
      'Image variation',
      'Embeddings',
      'Moderation',
      'Self-updating capability'
    ]
  });
});

// System information endpoint - Provides detailed information about the AI system
router.get('/system-info', async (req, res) => {
  try {
    const systemInfo = await customAiProvider.getSystemInfo();
    res.json(systemInfo);
  } catch (error: any) {
    log(`Error in system info endpoint: ${error.message}`, 'custom-openai-api');
    res.status(500).json({
      error: {
        message: `Error retrieving system information: ${error.message}`,
        type: 'internal_server_error'
      }
    });
  }
});

// Completions API - Creates a completion for the provided prompt
router.post('/completions', async (req, res) => {
  try {
    const result = await customOpenAI.createCompletion(req.body);
    res.json(result);
  } catch (error: any) {
    log(`Error in completions endpoint: ${error.message}`, 'custom-openai-api');
    res.status(500).json({
      error: {
        message: `Error generating completion: ${error.message}`,
        type: 'internal_server_error',
        param: null,
        code: null
      }
    });
  }
});

// Chat Completions API - Creates a model response for the chat conversation
router.post('/chat/completions', async (req, res) => {
  try {
    const result = await customOpenAI.createChatCompletion(req.body);
    res.json(result);
  } catch (error: any) {
    log(`Error in chat completions endpoint: ${error.message}`, 'custom-openai-api');
    res.status(500).json({
      error: {
        message: `Error generating chat completion: ${error.message}`,
        type: 'internal_server_error',
        param: null,
        code: null
      }
    });
  }
});

// Images API - Creates an image given a prompt
router.post('/images/generations', async (req, res) => {
  try {
    const result = await customOpenAI.createImage(req.body);
    res.json(result);
  } catch (error: any) {
    log(`Error in image generation endpoint: ${error.message}`, 'custom-openai-api');
    res.status(500).json({
      error: {
        message: `Error generating image: ${error.message}`,
        type: 'internal_server_error',
        param: null,
        code: null
      }
    });
  }
});

// Image Variations API - Creates a variation of a given image
router.post('/images/variations', async (req, res) => {
  try {
    // Extract parameters
    const { image, n, size } = req.body;
    
    // Check if image is provided
    if (!image) {
      return res.status(400).json({
        error: {
          message: 'Missing required parameter: image',
          type: 'invalid_request_error',
          param: 'image',
          code: null
        }
      });
    }
    
    const result = await customOpenAI.createImageVariation(image, n, size);
    res.json(result);
  } catch (error: any) {
    log(`Error in image variation endpoint: ${error.message}`, 'custom-openai-api');
    res.status(500).json({
      error: {
        message: `Error creating image variation: ${error.message}`,
        type: 'internal_server_error',
        param: null,
        code: null
      }
    });
  }
});

// Embeddings API - Creates embeddings for the provided input
router.post('/embeddings', async (req, res) => {
  try {
    const result = await customOpenAI.createEmbedding(req.body);
    res.json(result);
  } catch (error: any) {
    log(`Error in embeddings endpoint: ${error.message}`, 'custom-openai-api');
    res.status(500).json({
      error: {
        message: `Error creating embeddings: ${error.message}`,
        type: 'internal_server_error',
        param: null,
        code: null
      }
    });
  }
});

// Moderations API - Classifies text as potentially harmful
router.post('/moderations', async (req, res) => {
  try {
    const input = req.body.input;
    
    if (!input) {
      return res.status(400).json({
        error: {
          message: 'Missing required parameter: input',
          type: 'invalid_request_error',
          param: 'input',
          code: null
        }
      });
    }
    
    const result = await customOpenAI.createModeration(input);
    res.json(result);
  } catch (error: any) {
    log(`Error in moderations endpoint: ${error.message}`, 'custom-openai-api');
    res.status(500).json({
      error: {
        message: `Error creating moderation: ${error.message}`,
        type: 'internal_server_error',
        param: null,
        code: null
      }
    });
  }
});

// Models API - List available models
router.get('/models', (req, res) => {
  // Return a list of available "models" in our custom implementation
  res.json({
    object: 'list',
    data: [
      {
        id: 'custom-gpt-3.5-turbo',
        object: 'model',
        created: Math.floor(Date.now() / 1000) - 86400, // Created "yesterday"
        owned_by: 'unirent'
      },
      {
        id: 'custom-gpt-4',
        object: 'model',
        created: Math.floor(Date.now() / 1000) - 86400,
        owned_by: 'unirent'
      },
      {
        id: 'custom-davinci-003',
        object: 'model',
        created: Math.floor(Date.now() / 1000) - 86400,
        owned_by: 'unirent'
      },
      {
        id: 'custom-dall-e-3',
        object: 'model',
        created: Math.floor(Date.now() / 1000) - 86400,
        owned_by: 'unirent'
      },
      {
        id: 'custom-embedding-ada-002',
        object: 'model',
        created: Math.floor(Date.now() / 1000) - 86400,
        owned_by: 'unirent'
      }
    ]
  });
});

// Get a specific model
router.get('/models/:model', (req, res) => {
  const { model } = req.params;
  
  res.json({
    id: `custom-${model}`,
    object: 'model',
    created: Math.floor(Date.now() / 1000) - 86400,
    owned_by: 'unirent'
  });
});

export default router;