/**
 * Voice Search Service
 * Processes natural language property search queries using Gemini AI
 */

import { executeAIOperation } from './ai-service-manager';

interface VoiceSearchRequest {
  transcript: string;
}

type SearchAction = 'search' | 'navigate' | 'info';

interface SearchFilterParams {
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  bedrooms?: number;      // Exact number of bedrooms (when specified exactly)
  propertyType?: string;
  city?: string;
  area?: string;
  university?: string;
  furnished?: boolean;
  billsIncluded?: boolean;
  includedBills?: string[];
  availableFrom?: string;
  keyword?: string;
}

interface VoiceSearchResponse {
  action: SearchAction;
  message: string;
  searchParams?: SearchFilterParams;
  path?: string;
  resultCount?: number;
  error?: string;
}

/**
 * Process a voice search request using natural language processing
 * @param request The voice search request
 * @returns The processed search parameters and action
 */
export async function processVoiceSearch(request: VoiceSearchRequest): Promise<VoiceSearchResponse> {
  try {
    // Skip processing if transcript is empty
    if (!request.transcript.trim()) {
      return {
        action: 'info',
        message: 'Please provide a search query.',
      };
    }

    const prompt = `
      You are a property search assistant for a student accommodation website with all-inclusive utilities. 
      Parse the following voice command and extract relevant search parameters.
      
      Voice command: "${request.transcript}"
      
      Return a JSON object with the following structure:
      {
        "action": "search" or "navigate" or "info",
        "message": "Human-readable explanation of what you understood",
        "searchParams": {
          "minPrice": number or null,
          "maxPrice": number or null,
          "minBedrooms": number or null,
          "maxBedrooms": number or null,
          "bedrooms": number or null, // Exact number of bedrooms (when specified exactly)
          "propertyType": string or null, // e.g., "house", "flat", "apartment", "studio"
          "city": string or null,
          "area": string or null, // Area within a city, e.g., "Hyde Park" in Leeds
          "university": string or null,
          "furnished": boolean or null,
          "billsIncluded": boolean or null,
          "availableFrom": string or null
        },
        "path": string or null // Only for "navigate" action
      }
      
      Examples:
      - "Find 3 bedroom houses in Leeds" → Set action to "search", city to "Leeds", bedrooms to 3, propertyType to "house"
      - "Show me properties near University of Manchester" → Set action to "search", university to "University of Manchester"
      - "I want to see all available properties" → Set action to "navigate", path to "/properties"
      - "I'm looking for properties under £500 per week" → Set action to "search", maxPrice to 500
      - "I need a place with bills included" → Set action to "search", billsIncluded to true
      - "Show me properties in Hyde Park area in Leeds" → Set action to "search", city to "Leeds", area to "Hyde Park"
      - "I need a place with at least 2 bedrooms but no more than 4" → Set action to "search", minBedrooms to 2, maxBedrooms to 4
      - "Looking for furnished student apartments in Headingley" → Set action to "search", furnished to true, propertyType to "apartment", area to "Headingley"
      - "Find properties that cost between £350 and £600 per week" → Set action to "search", minPrice to 350, maxPrice to 600
      - "Show me exactly 4 bedroom properties in Leeds" → Set action to "search", city to "Leeds", bedrooms to 4
      - "I want exactly 5 bedroom houses" → Set action to "search", propertyType to "house", bedrooms to 5
      - "Find exactly 3 bedroom flats with bills included" → Set action to "search", propertyType to "flat", bedrooms to 3, billsIncluded to true
      
      Important: 
      - EXACT BEDROOM MATCHING: This is a critical feature our users need. When someone asks for a specific number of bedrooms using any of these phrases:
        1. "exactly X bedrooms"
        2. "X bedroom house/flat/apartment/property"
        3. "properties with X bedrooms"
        4. "show me X bedroom properties"
        ALWAYS set the "bedrooms" parameter (not minBedrooms or maxBedrooms) for precise matching.
      
      - Only use minBedrooms and maxBedrooms for ranges (e.g., "2-4 bedrooms", "at least 3 bedrooms", "up to 5 bedrooms").
      
      - All student properties on our platform have all-inclusive utilities (gas, water, electricity, broadband), so when users mention this, set billsIncluded to true.
      
      - For price values, always use the weekly price in GBP (£).
      
      - Consider both areas within cities and neighborhoods as valid values for the "area" parameter.
      
      - Only extract parameters that are explicitly mentioned or can be clearly inferred from context.
    `;

    // Use Gemini AI to interpret the natural language query
    const result = await executeAIOperation('generateText', {
      prompt,
      responseFormat: 'json',
      maxTokens: 1000
    });

    // Parse the generated response
    const parsedResult = JSON.parse(result);
    
    // Make sure we have the required fields
    const response: VoiceSearchResponse = {
      action: parsedResult.action || 'info',
      message: parsedResult.message || 'I processed your request.',
      searchParams: parsedResult.searchParams || {},
      path: parsedResult.path || null,
    };

    // If there are search parameters but no explicit action, default to search
    if (Object.keys(response.searchParams || {}).length > 0 && response.action === 'info') {
      response.action = 'search';
    }

    // For navigate actions, make sure we have a path
    if (response.action === 'navigate' && !response.path) {
      response.path = '/properties';
      response.message = 'Showing all properties.';
    }

    return response;
  } catch (error) {
    console.error('Error processing voice search:', error);
    return {
      action: 'info',
      message: 'Sorry, I had trouble processing your request.',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Search properties based on the extracted search parameters
 * @param searchParams The search parameters extracted from voice command
 * @returns The count of matching properties
 */
export async function searchPropertiesFromVoice(searchParams: SearchFilterParams): Promise<number> {
  try {
    // This function is now just used for retrieving a count of matching properties
    // The actual property retrieval is done in the route handler
    // Import storage dynamically to avoid circular dependencies
    const { storage } = await import('./storage');
    
    // Convert to filters format expected by storage
    const filters = {
      city: searchParams.city,
      university: searchParams.university,
      propertyType: searchParams.propertyType,
      maxPrice: searchParams.maxPrice,
      minPrice: searchParams.minPrice,
      minBedrooms: searchParams.minBedrooms,
      maxBedrooms: searchParams.maxBedrooms,
      bedrooms: searchParams.bedrooms,     // For exact bedroom matching
      furnished: searchParams.furnished,
      billsIncluded: searchParams.billsIncluded,
      area: searchParams.area
    };
    
    // Get filtered properties
    const properties = await storage.getPropertiesByFilters(filters);
    
    // Return the count of properties
    return properties.length;
  } catch (error) {
    console.error('Error in searchPropertiesFromVoice:', error);
    return 0;
  }
}