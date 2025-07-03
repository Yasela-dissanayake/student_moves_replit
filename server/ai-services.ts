/**
 * Custom AI Service for generating content
 * This service provides a unified interface to interact with various AI models and providers.
 */

import OpenAI from 'openai';
import { z } from 'zod';

// Base interface for text generation parameters
export interface TextGenerationParams {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

// Base interface for image generation parameters
export interface ImageGenerationParams {
  prompt: string;
  size?: string;
  n?: number;
  format?: 'url' | 'b64_json';
}

// Custom AI Service class
export class CustomAIService {
  private openai: OpenAI | null = null;
  
  constructor() {
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * Generate text using OpenAI service
   */
  async generateText(params: TextGenerationParams): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const model = params.model || 'gpt-3.5-turbo';
      const maxTokens = params.maxTokens || 500;
      const temperature = params.temperature || 0.7;

      // In the new OpenAI API, we only use chat completions
      const chatCompletion = await this.openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: params.prompt }],
        max_tokens: maxTokens,
        temperature,
      });

      return chatCompletion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error generating text with AI:', error);
      throw new Error('Failed to generate text content with AI');
    }
  }

  /**
   * Generate images using OpenAI DALL-E
   */
  async generateImage(params: ImageGenerationParams): Promise<string[]> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const size = params.size || '1024x1024';
      const n = params.n || 1;
      const format = params.format || 'url';

      const response = await this.openai.images.generate({
        prompt: params.prompt,
        n,
        size: size as '256x256' | '512x512' | '1024x1024',
        response_format: format as 'url' | 'b64_json',
      });

      // Return array of image URLs or base64 data
      if (format === 'url') {
        return response.data.map(item => item.url || '');
      } else {
        return response.data.map(item => item.b64_json || '');
      }
    } catch (error) {
      console.error('Error generating image with AI:', error);
      throw new Error('Failed to generate image with AI');
    }
  }

  /**
   * Check if the AI service is configured and available
   */
  isAvailable(): boolean {
    return !!this.openai;
  }

  /**
   * Get information about the current AI provider
   */
  getProviderInfo(): { name: string; isConfigured: boolean } {
    return {
      name: 'OpenAI',
      isConfigured: !!this.openai
    };
  }
}

// Create a singleton instance
export const customAIService = new CustomAIService();