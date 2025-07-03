/**
 * Tradesman Finder Service
 * Provides integration with Checkatrade-like functionality to find local tradespeople for maintenance
 * Service uses AI to simulate a real API integration with local trade directories
 */

import { executeAIOperation } from "../ai-service-manager";

export interface TradesmanSearchCriteria {
  tradeType: string;
  location: string;
  propertyId?: string;
  radius: number;
  urgency: 'immediate' | 'within_week' | 'within_month' | 'not_urgent';
}

export interface Tradesman {
  id: string;
  name: string;
  company: string;
  trade: string;
  rating: number;
  reviews: number;
  distance: number;
  location: string;
  profileImage: string;
  availability: string;
  phone: string;
  email: string;
  website: string;
  yearsInBusiness: number;
  certifications: string[];
  estimatedCalloutFee: string;
  verified: boolean;
}

export class TradesmanFinderService {
  /**
   * Search for tradespeople based on criteria
   */
  async findTradespeople(criteria: TradesmanSearchCriteria): Promise<Tradesman[]> {
    try {
      // Generate a prompt for the AI to create tradespeople results
      const prompt = this.generateTradesmanSearchPrompt(criteria);
      
      // Use the AI service manager to simulate a Checkatrade API
      const result = await executeAIOperation(
        'generateText',
        {
          prompt,
          maxTokens: 2000,
          temperature: 0.2, // Low temperature for more realistic results
          responseFormat: 'json'
        }
      );
      
      // Parse the result
      let tradespeople: Tradesman[] = [];
      
      try {
        // The result could be a string or an object
        if (typeof result === 'string') {
          // Try to parse the string as JSON
          const parsed = JSON.parse(result);
          
          if (Array.isArray(parsed)) {
            tradespeople = parsed;
          } else if (parsed.tradespeople && Array.isArray(parsed.tradespeople)) {
            tradespeople = parsed.tradespeople;
          }
        } else if (typeof result === 'object' && result !== null) {
          if (Array.isArray(result)) {
            tradespeople = result;
          } else if (result.tradespeople && Array.isArray(result.tradespeople)) {
            tradespeople = result.tradespeople;
          }
        }
      } catch (err) {
        console.error('Error parsing AI response for tradespeople:', err);
        // Return empty array in case of parsing error
        return [];
      }
      
      // Ensure each tradesperson has the required fields
      tradespeople = tradespeople.map(tradesperson => ({
        ...tradesperson,
        id: tradesperson.id || this.generateRandomId(),
        profileImage: tradesperson.profileImage || this.getDefaultProfileImage(criteria.tradeType),
        availability: tradesperson.availability || this.getAvailabilityFromUrgency(criteria.urgency),
        verified: tradesperson.verified !== undefined ? tradesperson.verified : Math.random() > 0.3 // 70% chance of being verified
      }));
      
      // Sort by rating and distance (highest rated and closest first)
      return tradespeople.sort((a, b) => {
        // First sort by rating
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        // Then by distance
        return a.distance - b.distance;
      });
    } catch (error) {
      console.error('Error finding tradespeople:', error);
      return [];
    }
  }
  
  /**
   * Generate a prompt for the AI to simulate Checkatrade API results
   */
  private generateTradesmanSearchPrompt(criteria: TradesmanSearchCriteria): string {
    let prompt = `You are a UK-based trade directory API (like Checkatrade) specializing in connecting property managers with qualified tradespeople. 

I need realistic, detailed information about tradespeople available in the UK for the following search criteria:
- Trade type: ${criteria.tradeType}
- Location: ${criteria.location}
- Search radius: ${criteria.radius} miles
- Urgency level: ${criteria.urgency}

For each tradesperson, include the following information:
- A unique ID
- Full name (realistic UK name)
- Company name (realistic UK business name)
- Trade type (specific, matching the requested trade)
- Rating (1-5 scale with one decimal place)
- Number of reviews (realistic count)
- Distance from the search location (in miles, within the specified radius)
- Specific location (real UK town/city name near the search location)
- A profile image URL (leave empty, will be generated)
- Availability (matching the urgency level)
- Phone number (realistic UK format)
- Email address (business email)
- Website (business website URL)
- Years in business (integer)
- Certifications (relevant UK trade qualifications and certifications)
- Estimated callout fee (in £)
- Whether they're verified on the platform (boolean)

Provide between 5-10 tradespeople who match these criteria, with varying ratings, availability, and proximity.
Format your response as a JSON array of tradespeople.`;

    return prompt;
  }
  
  /**
   * Generate a default profile image URL based on trade type
   */
  private getDefaultProfileImage(tradeType: string): string {
    const tradeTypeFormatted = tradeType.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `/images/tradespeople/${tradeTypeFormatted}.jpg`;
  }
  
  /**
   * Map urgency to availability text
   */
  private getAvailabilityFromUrgency(urgency: string): string {
    switch (urgency) {
      case 'immediate':
        return 'Available today or tomorrow';
      case 'within_week':
        return 'Available this week';
      case 'within_month':
        return 'Available within 2-3 weeks';
      case 'not_urgent':
      default:
        return 'Available for booking';
    }
  }
  
  /**
   * Generate a random ID for tradesperson
   */
  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}