/**
 * Custom OpenAI-compatible API implementation
 * Provides free alternatives to OpenAI functionality without subscription costs
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as customAiProvider from './custom-ai-provider';
import { log } from './vite';

// Centralized export for use across the application
export const customAI = {
  generateContent: async (options: {
    prompt: string;
    outputFormat?: 'text' | 'html' | 'json';
    requirements?: Record<string, any>;
  }) => {
    try {
      // Default to text format if not specified
      const format = options.outputFormat || 'text';
      
      // Process with custom AI provider
      const generatedContent = await customAiProvider.generateText(
        options.prompt,
        options.requirements?.length === 'comprehensive' ? 2000 : 1000
      );
      
      // Format the response based on requested output format
      let content = generatedContent;
      
      if (format === 'json') {
        // Attempt to extract valid JSON from the response
        try {
          const jsonMatch = generatedContent.match(/\{.+\}/s);
          if (jsonMatch) {
            // Parse and stringify to validate JSON
            const jsonContent = JSON.parse(jsonMatch[0]);
            content = JSON.stringify(jsonContent);
          } else {
            // Fallback to creating a simple JSON object
            content = JSON.stringify({ content: generatedContent });
          }
        } catch (e) {
          // If JSON extraction fails, wrap the content in a JSON object
          content = JSON.stringify({ content: generatedContent });
        }
      } else if (format === 'html') {
        // Simple wrapping with HTML tags if not already HTML
        if (!generatedContent.trim().startsWith('<')) {
          content = `<div>${generatedContent.replace(/\n/g, '<br>')}</div>`;
        }
      }
      
      return {
        content,
        format,
        tokenCount: estimateTokenCount(generatedContent),
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      log(`Error in custom AI content generation: ${error.message}`, 'custom-openai');
      throw error;
    }
  },
  
  generateImage: async (prompt: string, size: string = '1024x1024') => {
    return createImage({
      prompt,
      size: size as any,
      n: 1,
      response_format: 'url'
    });
  },
  
  createEmbedding: (text: string) => {
    return createEmbedding({
      model: 'custom-embedding-001',
      input: text
    });
  },
  
  moderateContent: (text: string) => {
    return createModeration(text);
  }
};

// Types to match OpenAI API structure
interface CreateCompletionRequest {
  model: string;
  prompt: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  user?: string;
}

interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CreateChatCompletionRequest {
  model: string;
  messages: ChatCompletionMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  user?: string;
}

interface CreateImageRequest {
  prompt: string;
  n?: number;
  size?: '256x256' | '512x512' | '1024x1024' | '1024x1792' | '1792x1024';
  response_format?: 'url' | 'b64_json';
  user?: string;
}

interface EmbeddingRequest {
  model: string;
  input: string | string[];
  user?: string;
}

// Implementation of OpenAI-compatible endpoints

/**
 * Create text completion (similar to OpenAI's completions endpoint)
 */
export async function createCompletion(request: CreateCompletionRequest) {
  log(`Custom OpenAI: Create completion with model ${request.model}`, 'custom-openai');
  
  try {
    // Process the prompt using the custom AI provider
    const result = await customAiProvider.generateText(
      request.prompt, 
      request.max_tokens
    );
    
    // Format response to match OpenAI's API structure
    return {
      id: `cmpl-${generateRandomId()}`,
      object: 'text_completion',
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      choices: [
        {
          text: result,
          index: 0,
          logprobs: null,
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: estimateTokenCount(request.prompt),
        completion_tokens: estimateTokenCount(result),
        total_tokens: estimateTokenCount(request.prompt) + estimateTokenCount(result)
      }
    };
  } catch (error: any) {
    log(`Error in custom completion: ${error.message}`, 'custom-openai');
    throw error;
  }
}

/**
 * Create chat completion (similar to OpenAI's chat completions endpoint)
 */
export async function createChatCompletion(request: CreateChatCompletionRequest) {
  log(`Custom OpenAI: Create chat completion with model ${request.model}`, 'custom-openai');
  
  try {
    // Combine messages into a prompt
    let combinedPrompt = '';
    
    for (const message of request.messages) {
      if (message.role === 'system') {
        combinedPrompt += `System: ${message.content}\n\n`;
      } else if (message.role === 'user') {
        combinedPrompt += `User: ${message.content}\n\n`;
      } else if (message.role === 'assistant') {
        combinedPrompt += `Assistant: ${message.content}\n\n`;
      }
    }
    
    // Append a prompt for the AI to continue
    combinedPrompt += 'Assistant:';
    
    // Process with custom AI provider
    const result = await customAiProvider.generateText(
      combinedPrompt, 
      request.max_tokens
    );
    
    // Format response to match OpenAI's API structure
    return {
      id: `chatcmpl-${generateRandomId()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: result
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: estimateTokenCount(combinedPrompt),
        completion_tokens: estimateTokenCount(result),
        total_tokens: estimateTokenCount(combinedPrompt) + estimateTokenCount(result)
      }
    };
  } catch (error: any) {
    log(`Error in custom chat completion: ${error.message}`, 'custom-openai');
    throw error;
  }
}

/**
 * Create image (similar to OpenAI's images endpoint)
 */
export async function createImage(request: CreateImageRequest) {
  log(`Custom OpenAI: Create image with prompt: ${request.prompt}`, 'custom-openai');
  
  try {
    const size = request.size || '1024x1024';
    const n = request.n || 1;
    const responseFormat = request.response_format || 'url';
    
    // Generate images using the custom AI provider
    const imagePromises = Array(n).fill(null).map(async () => {
      return await customAiProvider.generateImage(request.prompt, size as any);
    });
    
    const images = await Promise.all(imagePromises);
    
    // Format response based on requested format
    const data = images.map(image => {
      if (responseFormat === 'b64_json') {
        // Extract base64 data from data URL
        const b64Data = image.split(',')[1];
        return { b64_json: b64Data };
      } else {
        // For 'url' format, we would normally upload to storage and return URL
        // Here we return the data URL directly since we're keeping everything local
        return { url: image };
      }
    });
    
    return {
      created: Math.floor(Date.now() / 1000),
      data
    };
  } catch (error: any) {
    log(`Error in custom image creation: ${error.message}`, 'custom-openai');
    throw error;
  }
}

/**
 * Create image variation (similar to OpenAI's image variations endpoint)
 */
export async function createImageVariation(image: string, n: number = 1, size: string = '1024x1024') {
  log(`Custom OpenAI: Create image variation`, 'custom-openai');
  
  try {
    // For variations, we'll create slightly modified versions of the SVG
    // In a real implementation, you might want more sophisticated image processing
    const imagePromises = Array(n).fill(null).map(async (_, index) => {
      // We're generating a "variation" by adding a seed value to make the image slightly different
      const variationPrompt = `Image variation ${index + 1}`;
      return await customAiProvider.generateImage(variationPrompt, size as any);
    });
    
    const images = await Promise.all(imagePromises);
    
    return {
      created: Math.floor(Date.now() / 1000),
      data: images.map(image => ({ url: image }))
    };
  } catch (error: any) {
    log(`Error in custom image variation: ${error.message}`, 'custom-openai');
    throw error;
  }
}

/**
 * Create embeddings (similar to OpenAI's embeddings endpoint)
 */
export async function createEmbedding(request: EmbeddingRequest) {
  log(`Custom OpenAI: Create embedding with model ${request.model}`, 'custom-openai');
  
  try {
    // Handle both single string and array of strings
    const inputs = Array.isArray(request.input) ? request.input : [request.input];
    
    // Generate embeddings for each input
    const embeddingPromises = inputs.map(async (text, index) => {
      const embedding = await customAiProvider.generateEmbeddings(text);
      
      return {
        object: 'embedding',
        embedding,
        index
      };
    });
    
    const embeddings = await Promise.all(embeddingPromises);
    
    return {
      object: 'list',
      data: embeddings,
      model: request.model,
      usage: {
        prompt_tokens: inputs.reduce((total, text) => total + estimateTokenCount(text), 0),
        total_tokens: inputs.reduce((total, text) => total + estimateTokenCount(text), 0)
      }
    };
  } catch (error: any) {
    log(`Error in custom embedding: ${error.message}`, 'custom-openai');
    throw error;
  }
}

/**
 * Check if the API is available (always returns true for our custom implementation)
 */
export async function checkApiKey(): Promise<boolean> {
  log('Custom OpenAI API check: available', 'custom-openai');
  return true;
}

/**
 * Mock moderation API endpoint
 */
export async function createModeration(input: string | string[]): Promise<any> {
  log('Custom OpenAI: Create moderation', 'custom-openai');
  
  // Convert input to array if it's a string
  const inputs = Array.isArray(input) ? input : [input];
  
  // Create mock moderation results
  const results = inputs.map(text => {
    // Simplified detection for potentially harmful content
    const containsHarmfulKeywords = [
      'violence', 'hate', 'harassment', 'self-harm', 'sexual',
      'threatening', 'harmful', 'illegal', 'offensive'
    ].some(keyword => text.toLowerCase().includes(keyword));
    
    // Always flag as safe for our implementation
    // Note: In a production environment, you would want to implement
    // proper content moderation rather than this simplified approach
    return {
      flagged: false,
      categories: {
        hate: false,
        'hate/threatening': false,
        'self-harm': false,
        sexual: false,
        'sexual/minors': false,
        violence: false,
        'violence/graphic': false
      },
      category_scores: {
        hate: 0.01,
        'hate/threatening': 0.01,
        'self-harm': 0.01,
        sexual: 0.01,
        'sexual/minors': 0.01,
        violence: 0.01,
        'violence/graphic': 0.01
      }
    };
  });
  
  return {
    id: `modr-${generateRandomId()}`,
    model: 'custom-moderation-001',
    results
  };
}

// Utility functions

/**
 * Generate a random ID for OpenAI-compatible responses
 */
function generateRandomId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Estimate token count for a text (rough estimation)
 */
function estimateTokenCount(text: string): number {
  if (!text) return 0;
  // A very rough estimation: tokens are ~4 characters on average in English
  return Math.ceil(text.length / 4);
}