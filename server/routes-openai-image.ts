/**
 * Routes for the OpenAI image generation features
 * Now using Custom AI Provider as the primary fallback to eliminate subscription costs
 */

import { Router, Request, Response } from 'express';
import * as openai from './openai';
import mockOpenAI from './mock-openai';
import * as customAiProvider from './custom-ai-provider';
import { executeAIOperation } from './ai-service-manager';
import { log } from "./vite";
import { logError } from './utils/logger';

const MODULE_NAME = 'openai-image-routes';
const router = Router();

/**
 * Generate a city image using DALL-E
 * POST /api/openai-image/city
 * Body: { cityName: string, style: string (optional) }
 */
router.post('/city', async (req: Request, res: Response) => {
  try {
    const { cityName, style = 'photorealistic' } = req.body;

    if (!cityName) {
      return res.status(400).json({ error: 'City name is required' });
    }

    log(`Generating image for city: ${cityName} with style: ${style}`, MODULE_NAME);
    
    // First try to use the custom AI provider directly (zero cost solution)
    try {
      log(`Attempting city image generation with custom AI provider: ${cityName}`, MODULE_NAME);
      // Call the custom AI provider directly instead of using executeAIOperation
      const customImageUrl = await customAiProvider.generateCityImage(cityName, style);
      
      return res.json({ 
        success: true, 
        imageUrl: customImageUrl,
        city: cityName,
        style,
        provider: 'custom-ai'
      });
    } catch (customError: any) {
      logError(`Custom AI image generation failed: ${customError.message}. Trying OpenAI...`, MODULE_NAME);
      
      // If custom AI fails, try OpenAI
      try {
        const imageUrl = await openai.generateCityImage(cityName, style);
        
        return res.json({ 
          success: true, 
          imageUrl,
          city: cityName,
          style,
          provider: 'openai'
        });
      } catch (openaiError: any) {
        // If OpenAI fails (quota exceeded, etc.), fall back to mock implementation
        logError(`OpenAI image generation failed: ${openaiError.message}. Falling back to mock.`, MODULE_NAME);
        
        // Check for billing limits or API key issues
        const isBillingIssue = openaiError.message.includes('Billing') || 
                              openaiError.message.includes('API key') ||
                              openaiError.message.includes('exceeded');
        
        if (isBillingIssue) {
          // Use mock implementation as final fallback
          log(`Using mock implementation for city image: ${cityName}`, MODULE_NAME);
          const mockImageUrl = await mockOpenAI.generateImage(`A beautiful city view of ${cityName}`);
          
          return res.json({ 
            success: true, 
            imageUrl: mockImageUrl,
            city: cityName,
            style,
            note: 'Used fallback image (both custom AI and OpenAI unavailable)',
            provider: 'mock',
            mockUsed: true
          });
        } else {
          // For other errors, rethrow to be handled by the outer catch
          throw openaiError;
        }
      }
    }
  } catch (error: any) {
    logError(`Error generating city image: ${error.message}`, MODULE_NAME);
    return res.status(500).json({ 
      error: 'Error generating city image', 
      message: error.message,
      useMock: error.message.includes('API key is not configured')
    });
  }
});

/**
 * Generate a city image using DALL-E (GET endpoint for direct image URLs)
 * GET /api/openai-image/city
 * Query params: cityName, style (optional), useCache (optional)
 */
router.get('/city', async (req: Request, res: Response) => {
  try {
    const cityName = req.query.cityName as string;
    const style = (req.query.style as string) || 'photorealistic';
    const useCache = req.query.useCache === 'true';

    if (!cityName) {
      return res.status(400).json({ error: 'City name is required as a query parameter' });
    }

    log(`[GET] Generating image for city: ${cityName} with style: ${style}, useCache: ${useCache}`, MODULE_NAME);
    
    // Try to use static city images first for supported cities
    if (useCache) {
      // Check if we have a cached image for this city in the attached_assets
      const staticPath = `/attached_assets/cities/${cityName.toLowerCase()}.jpg`;
      
      log(`Checking for static city image at path: ${staticPath}`, MODULE_NAME);
      
      try {
        // We'll just return a direct reference to the static file
        return res.json({ 
          success: true, 
          imageUrl: staticPath,
          city: cityName,
          style,
          fromCache: true,
          provider: 'static'
        });
      } catch (staticError) {
        log(`No static image found for ${cityName}, will generate one`, MODULE_NAME);
      }
    }
    
    // First try the custom AI provider (zero cost solution)
    try {
      log(`Attempting city image generation with custom AI provider: ${cityName}`, MODULE_NAME);
      // Call the custom AI provider directly instead of using executeAIOperation
      const customImageUrl = await customAiProvider.generateCityImage(cityName, style);
      
      return res.json({ 
        success: true, 
        imageUrl: customImageUrl,
        city: cityName,
        style,
        provider: 'custom-ai'
      });
    } catch (customError: any) {
      logError(`Custom AI image generation failed: ${customError.message}. Trying OpenAI...`, MODULE_NAME);
      
      // Then try OpenAI if custom AI provider fails
      try {
        const imageUrl = await openai.generateCityImage(cityName, style);
        
        return res.json({ 
          success: true, 
          imageUrl,
          city: cityName,
          style,
          provider: 'openai'
        });
      } catch (openaiError: any) {
        // If OpenAI fails (quota exceeded, etc.), fall back to mock implementation
        logError(`OpenAI image generation failed: ${openaiError.message}. Falling back to mock.`, MODULE_NAME);
        
        // Check for billing limits or API key issues
        const isBillingIssue = openaiError.message.includes('Billing') || 
                              openaiError.message.includes('API key') ||
                              openaiError.message.includes('exceeded');
        
        if (isBillingIssue) {
          // Use mock implementation as final fallback
          log(`Using mock implementation for city image: ${cityName}`, MODULE_NAME);
          const mockImageUrl = await mockOpenAI.generateImage(`A beautiful city view of ${cityName}`);
          
          return res.json({ 
            success: true, 
            imageUrl: mockImageUrl,
            city: cityName,
            style,
            note: 'Used fallback image (both custom AI and OpenAI unavailable)',
            provider: 'mock',
            mockUsed: true
          });
        } else {
          // For other errors, rethrow to be handled by the outer catch
          throw openaiError;
        }
      }
    }
  } catch (error: any) {
    logError(`Error generating city image: ${error.message}`, MODULE_NAME);
    return res.status(500).json({ 
      error: 'Error generating city image', 
      message: error.message,
      useMock: error.message.includes('API key is not configured')
    });
  }
});

/**
 * Generate a custom image using DALL-E
 * POST /api/openai-image/generate
 * Body: { prompt: string, size: string (optional) }
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, size = '1024x1024' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    log(`Generating image with prompt: ${prompt}`, MODULE_NAME);
    
    // First try the custom AI provider (zero cost solution)
    try {
      log(`Attempting image generation with custom AI provider: ${prompt}`, MODULE_NAME);
      // Call the custom AI provider directly instead of using executeAIOperation
      const customImageUrl = await customAiProvider.generateImage(prompt, size as any);
      
      return res.json({ 
        success: true, 
        imageUrl: customImageUrl,
        prompt,
        provider: 'custom-ai'
      });
    } catch (customError: any) {
      logError(`Custom AI image generation failed: ${customError.message}. Trying OpenAI...`, MODULE_NAME);
      
      // Then try OpenAI if custom AI provider fails
      try {
        const imageUrl = await openai.generateImage(prompt, size);
        
        return res.json({ 
          success: true, 
          imageUrl,
          prompt,
          provider: 'openai'
        });
      } catch (openaiError: any) {
        // If OpenAI fails (quota exceeded, etc.), fall back to mock implementation
        logError(`OpenAI image generation failed: ${openaiError.message}. Falling back to mock.`, MODULE_NAME);
        
        // Check for billing limits or API key issues
        const isBillingIssue = openaiError.message.includes('Billing') || 
                              openaiError.message.includes('API key') ||
                              openaiError.message.includes('exceeded');
        
        if (isBillingIssue) {
          // Use mock implementation as final fallback
          log(`Using mock implementation for image prompt: ${prompt}`, MODULE_NAME);
          const mockImageUrl = await mockOpenAI.generateImage(prompt);
          
          return res.json({ 
            success: true, 
            imageUrl: mockImageUrl,
            prompt,
            note: 'Used fallback image (both custom AI and OpenAI unavailable)',
            provider: 'mock',
            mockUsed: true
          });
        } else {
          // For other errors, rethrow to be handled by the outer catch
          throw openaiError;
        }
      }
    }
  } catch (error: any) {
    logError(`Error generating image: ${error.message}`, MODULE_NAME);
    return res.status(500).json({ 
      error: 'Error generating image', 
      message: error.message,
      useMock: error.message.includes('API key is not configured')
    });
  }
});

/**
 * Generate a city image using the city name
 * POST /api/openai-image/generate-city
 * Body: { city: string, style: string (optional) }
 */
router.post('/generate-city', async (req: Request, res: Response) => {
  try {
    const { city, style = 'photorealistic' } = req.body;

    if (!city) {
      return res.status(400).json({ error: 'City name is required' });
    }

    log(`Generating image for city: ${city} with style: ${style}`, MODULE_NAME);
    
    // First try to use the custom AI provider directly (zero cost solution)
    try {
      log(`Attempting city image generation with custom AI provider: ${city}`, MODULE_NAME);
      // Call the custom AI provider directly instead of using executeAIOperation
      const customImageUrl = await customAiProvider.generateCityImage(city, style);
      
      return res.json({ 
        success: true, 
        imageUrl: customImageUrl,
        city: city,
        style,
        provider: 'custom-ai'
      });
    } catch (customError: any) {
      logError(`Custom AI image generation failed: ${customError.message}. Trying OpenAI...`, MODULE_NAME);
      
      // If custom AI fails, try OpenAI
      try {
        const imageUrl = await openai.generateCityImage(city, style);
        
        return res.json({ 
          success: true, 
          imageUrl,
          city: city,
          style,
          provider: 'openai'
        });
      } catch (openaiError: any) {
        // If OpenAI fails (quota exceeded, etc.), fall back to mock implementation
        logError(`OpenAI image generation failed: ${openaiError.message}. Falling back to mock.`, MODULE_NAME);
        
        // Check for billing limits or API key issues
        const isBillingIssue = openaiError.message.includes('Billing') || 
                              openaiError.message.includes('API key') ||
                              openaiError.message.includes('exceeded');
        
        if (isBillingIssue) {
          // Use mock implementation as final fallback
          log(`Using mock implementation for city image: ${city}`, MODULE_NAME);
          const mockImageUrl = await mockOpenAI.generateImage(`A beautiful city view of ${city}`);
          
          return res.json({ 
            success: true, 
            imageUrl: mockImageUrl,
            city: city,
            style,
            note: 'Used fallback image (both custom AI and OpenAI unavailable)',
            provider: 'mock',
            mockUsed: true
          });
        } else {
          // For other errors, rethrow to be handled by the outer catch
          throw openaiError;
        }
      }
    }
  } catch (error: any) {
    logError(`Error generating city image: ${error.message}`, MODULE_NAME);
    return res.status(500).json({ 
      error: 'Error generating city image', 
      message: error.message,
      useMock: error.message.includes('API key is not configured')
    });
  }
});

log('OpenAI image routes registered (with custom AI provider integration)', MODULE_NAME);

export default router;
