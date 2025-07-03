/**
 * Perplexity API Service
 * Provides functions for generating text and analyzing data using Perplexity's advanced LLMs
 */
import axios from 'axios';
import { log } from './vite';

// Constants
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
// Default model - using the latest llama-3.1-sonar model
const DEFAULT_MODEL = 'llama-3.1-sonar-small-128k-online';

// Available models
export enum PerplexityModel {
  LLAMA_SMALL = 'llama-3.1-sonar-small-128k-online',
  LLAMA_LARGE = 'llama-3.1-sonar-large-128k-online', 
  LLAMA_HUGE = 'llama-3.1-sonar-huge-128k-online'
}

// Message type for chat API
export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Parameters for text generation
export interface TextGenerationParams {
  model?: PerplexityModel;
  messages: PerplexityMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  search_domain_filter?: string[];
  search_recency_filter?: 'day' | 'week' | 'month' | 'year';
  return_related_questions?: boolean;
  system_prompt?: string;
}

// Response format from Perplexity API
export interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  choices: {
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta?: {
      role: string;
      content: string;
    };
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: string[];
}

/**
 * Generate text using Perplexity API
 * @param params Text generation parameters
 * @returns Generated text
 */
export async function generateText(params: TextGenerationParams): Promise<string> {
  try {
    // Ensure API key is available
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY environment variable is not set');
    }

    // Prepare system message if provided
    if (params.system_prompt && !params.messages.some(m => m.role === 'system')) {
      params.messages.unshift({
        role: 'system',
        content: params.system_prompt
      });
    }

    // Ensure the messages array follows the proper pattern (user and assistant alternating, ending with user)
    validateMessagePattern(params.messages);

    // Prepare request payload
    const payload = {
      model: params.model || DEFAULT_MODEL,
      messages: params.messages,
      max_tokens: params.max_tokens || 1024,
      temperature: params.temperature !== undefined ? params.temperature : 0.2,
      top_p: params.top_p || 0.9,
      frequency_penalty: params.frequency_penalty || 1,
      search_domain_filter: params.search_domain_filter,
      search_recency_filter: params.search_recency_filter,
      return_related_questions: params.return_related_questions || false,
      stream: false
    };

    log(`Calling Perplexity API with model: ${payload.model}`, 'perplexity');
    
    // Make API request to Perplexity
    const response = await axios.post<PerplexityResponse>(
      PERPLEXITY_API_URL,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
        }
      }
    );

    if (!response.data.choices || response.data.choices.length === 0) {
      throw new Error('No response from Perplexity API');
    }

    // Return the generated text
    const generatedText = response.data.choices[0].message.content;
    
    // Log tokens usage for monitoring
    log(`Perplexity API usage: ${response.data.usage.total_tokens} tokens (${response.data.usage.prompt_tokens} prompt, ${response.data.usage.completion_tokens} completion)`, 'perplexity');
    
    return generatedText;
  } catch (error) {
    log(`Error generating text with Perplexity API: ${error.message}`, 'perplexity');
    throw error;
  }
}

/**
 * Generate JSON output from Perplexity AI
 * @param params Text generation parameters
 * @returns Generated JSON as an object
 */
export async function generateJsonResponse<T>(params: TextGenerationParams): Promise<T> {
  try {
    // Add instruction to return JSON in the system message
    const systemPrompt = 'You are a helpful assistant. Always respond with valid JSON, no additional text or explanation. Format your responses as a JSON object.';
    
    // Update or add the system message
    if (params.messages.some(m => m.role === 'system')) {
      params.messages = params.messages.map(m => 
        m.role === 'system' ? { ...m, content: `${m.content}\n${systemPrompt}` } : m
      );
    } else {
      params.messages.unshift({ role: 'system', content: systemPrompt });
    }
    
    // Get text response
    const textResponse = await generateText({
      ...params,
      temperature: params.temperature || 0.1, // Lower temperature for more deterministic JSON
    });
    
    // Parse JSON response
    try {
      return JSON.parse(textResponse) as T;
    } catch (parseError) {
      // Try to extract JSON from text if parsing fails
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }
      throw new Error(`Failed to parse JSON response: ${parseError.message}`);
    }
  } catch (error) {
    log(`Error generating JSON with Perplexity API: ${error.message}`, 'perplexity');
    throw error;
  }
}

/**
 * Analyze a tenant's inquiry and generate a helpful response
 * @param inquiry The tenant's inquiry message
 * @param context Additional context information
 * @returns Helpful response for the tenant
 */
export async function analyzeTenantInquiry(
  inquiry: string, 
  context: {
    propertyDetails?: any;
    tenancyDetails?: any;
    userDetails?: any;
    previousConversation?: PerplexityMessage[];
  }
): Promise<string> {
  try {
    // Create contextual prompt
    let contextString = '';
    
    if (context.propertyDetails) {
      contextString += `\nProperty Details:\n${JSON.stringify(context.propertyDetails, null, 2)}`;
    }
    
    if (context.tenancyDetails) {
      contextString += `\nTenancy Details:\n${JSON.stringify(context.tenancyDetails, null, 2)}`;
    }
    
    if (context.userDetails) {
      contextString += `\nUser Details:\n${JSON.stringify(context.userDetails, null, 2)}`;
    }
    
    // Prepare messages array
    const messages: PerplexityMessage[] = [
      {
        role: 'system',
        content: `You are a helpful assistant for StudentMoves, a student accommodation platform in the UK. 
        Answer tenant inquiries with accurate, helpful information. Be concise but thorough.
        For maintenance issues, recommend using the maintenance reporting system.
        For payment questions, explain the payment process clearly.
        For contract questions, reference the specific tenancy agreement terms.
        
        When responding, focus on UK housing laws and regulations, particularly those relevant to student housing.
        Always mention that deposits must be protected in government-approved schemes.
        
        ${contextString}`
      }
    ];
    
    // Add conversation history if available
    if (context.previousConversation && context.previousConversation.length > 0) {
      messages.push(...context.previousConversation);
    }
    
    // Add the current inquiry
    messages.push({
      role: 'user',
      content: inquiry
    });
    
    // Generate response
    return await generateText({
      model: PerplexityModel.LLAMA_SMALL,
      messages,
      temperature: 0.3,
      search_recency_filter: 'month' // Keep information relatively current
    });
  } catch (error) {
    log(`Error analyzing tenant inquiry: ${error.message}`, 'perplexity');
    return "I'm sorry, but I encountered an issue while processing your question. Please try asking again, or contact your property manager for immediate assistance.";
  }
}

/**
 * Generate property descriptions using Perplexity
 * @param propertyDetails Property details to include in description
 * @returns AI-generated property description
 */
export async function generatePropertyDescription(propertyDetails: {
  title: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  location: string;
  university?: string;
  features: string[];
  nearbyAmenities?: string[];
  furnished: boolean;
  garden?: boolean;
  parking?: boolean;
  billsIncluded: boolean;
  includedBills?: string[];
  additionalDetails?: string;
  tone?: 'professional' | 'casual' | 'luxury' | 'student-focused';
}): Promise<string> {
  try {
    // Prepare instruction prompt
    const prompt = `Create an engaging property description for this student accommodation:
    
    Property: ${propertyDetails.title}
    Type: ${propertyDetails.propertyType}
    Bedrooms: ${propertyDetails.bedrooms}
    Bathrooms: ${propertyDetails.bathrooms}
    Location: ${propertyDetails.location}
    ${propertyDetails.university ? `Nearby University: ${propertyDetails.university}` : ''}
    Features: ${propertyDetails.features.join(', ')}
    ${propertyDetails.nearbyAmenities ? `Nearby Amenities: ${propertyDetails.nearbyAmenities.join(', ')}` : ''}
    Furnished: ${propertyDetails.furnished ? 'Yes' : 'No'}
    ${propertyDetails.garden ? 'Garden available' : ''}
    ${propertyDetails.parking ? 'Parking available' : ''}
    Bills Included: ${propertyDetails.billsIncluded ? 'Yes' : 'No'}
    ${propertyDetails.includedBills ? `Included Bills: ${propertyDetails.includedBills.join(', ')}` : ''}
    ${propertyDetails.additionalDetails ? `Additional Details: ${propertyDetails.additionalDetails}` : ''}
    
    Tone: ${propertyDetails.tone || 'student-focused'}
    
    Guidelines:
    - Highlight the all-inclusive utilities package clearly
    - Emphasize features that appeal to university students
    - Mention the location relative to university and city center
    - Create a compelling, marketable description between 150-300 words
    - Break into paragraphs for readability
    - Focus on selling points like convenience, lifestyle, and value
    - Use UK English spelling and terminology`;
    
    // Generate description
    const messages: PerplexityMessage[] = [
      { role: 'user', content: prompt }
    ];
    
    return await generateText({
      model: PerplexityModel.LLAMA_SMALL,
      messages,
      temperature: 0.7, // More creative for marketing content
      max_tokens: 500
    });
  } catch (error) {
    log(`Error generating property description: ${error.message}`, 'perplexity');
    throw error;
  }
}

/**
 * Check if the Perplexity API is available
 * @returns True if API is available, false otherwise
 */
export async function checkApiAvailability(): Promise<boolean> {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      log('PERPLEXITY_API_KEY environment variable is not set', 'perplexity');
      return false;
    }
    
    // Simple test query
    const response = await generateText({
      messages: [
        { role: 'user', content: 'Hello, are you available?' }
      ],
      max_tokens: 10
    });
    
    return !!response;
  } catch (error) {
    log(`Perplexity API check failed: ${error.message}`, 'perplexity');
    return false;
  }
}

/**
 * Validate message pattern for Perplexity API
 * Ensures messages alternate correctly with user/assistant roles
 * @param messages Array of messages to validate
 */
function validateMessagePattern(messages: PerplexityMessage[]): void {
  // Filter out system messages for this check
  const nonSystemMessages = messages.filter(m => m.role !== 'system');
  
  // There should be at least one user message
  if (nonSystemMessages.length === 0 || nonSystemMessages[0].role !== 'user') {
    throw new Error('Messages must start with a user message after any system messages');
  }
  
  // Check alternating pattern
  for (let i = 1; i < nonSystemMessages.length; i++) {
    if (nonSystemMessages[i].role === nonSystemMessages[i-1].role) {
      throw new Error('Messages must alternate between user and assistant roles');
    }
  }
  
  // Last message must be from user
  if (nonSystemMessages[nonSystemMessages.length - 1].role !== 'user') {
    throw new Error('The last message must be from the user');
  }
}