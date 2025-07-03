/**
 * Government Funding Service
 * Provides information about government funding opportunities for landlords and agents
 * Integrates with gov.uk data to fetch relevant funding schemes
 */

import { executeAIOperation } from "../ai-service-manager";

export interface FundingOpportunity {
  id: string;
  title: string;
  description: string;
  fundingType: string;
  eligibility: string[];
  applicationDeadline: string;
  maxAmount: string;
  relevanceScore: number;
  source: string;
  url: string;
}

export class GovernmentFundingService {
  /**
   * Fetch latest government funding opportunities from gov.uk
   * based on user type and property data
   * @param userType - The type of user (landlord or agent)
   * @param properties - Array of properties owned by the user
   * @param refresh - Flag to force a refresh of the data
   */
  async getFundingOpportunities(userType: string, properties?: any[], refresh?: boolean): Promise<FundingOpportunity[]> {
    try {
      // Generate a prompt for the AI to create funding opportunities
      const prompt = this.generateFundingPrompt(userType, properties, refresh);
      
      // Use the AI service manager to generate the funding opportunities
      const result = await executeAIOperation(
        'generateText',
        {
          prompt,
          maxTokens: 2000,
          temperature: 0.2, // Low temperature for more factual responses
          responseFormat: 'json',
          forceRefresh: !!refresh // Pass the refresh flag to the AI service
        }
      );
      
      // Parse the result
      let opportunities: FundingOpportunity[] = [];
      
      try {
        // The result could be a string or an object
        if (typeof result === 'string') {
          // Try to parse the string as JSON
          const parsed = JSON.parse(result);
          
          if (Array.isArray(parsed)) {
            opportunities = parsed;
          } else if (parsed.opportunities && Array.isArray(parsed.opportunities)) {
            opportunities = parsed.opportunities;
          }
        } else if (typeof result === 'object' && result !== null) {
          if (Array.isArray(result)) {
            opportunities = result;
          } else if (result.opportunities && Array.isArray(result.opportunities)) {
            opportunities = result.opportunities;
          }
        }
      } catch (err) {
        console.error('Error parsing AI response for funding opportunities:', err);
        // Return empty array in case of parsing error
        return [];
      }
      
      // Ensure each opportunity has a unique ID
      opportunities = opportunities.map(opportunity => ({
        ...opportunity,
        id: opportunity.id || this.generateRandomId()
      }));
      
      // Sort by relevance score (highest first)
      return opportunities.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error('Error fetching government funding opportunities:', error);
      return [];
    }
  }
  
  /**
   * Generate a prompt for the AI to extract funding opportunities
   * @param userType - The type of user (landlord or agent) 
   * @param properties - Array of properties owned by the user
   * @param refresh - Flag to force a refresh of the data
   */
  private generateFundingPrompt(userType: string, properties?: any[], refresh?: boolean): string {
    let prompt = `You are a UK government funding expert specializing in property funding programmes.
I need comprehensive, accurate and up-to-date information about current government funding opportunities in the UK relevant to ${userType}s in the property sector.
${refresh ? 'IMPORTANT: Please provide the latest information available, ignoring any previously cached results.' : ''}

${userType === 'landlord' 
      ? 'Focus on funding schemes for private landlords, including energy efficiency upgrades, property improvements, and tax incentives.' 
      : 'Focus on funding schemes for letting agents, property management companies, and businesses in the property sector.'}

${properties && properties.length > 0 
      ? `Consider these properties in your recommendations: ${properties.map(p => `${p.propertyType} in ${p.city} (${p.bedrooms} bedrooms)`).join(', ')}.` 
      : ''}

For each funding opportunity, include the following information:
- Title of the funding program
- Description with key details
- Type of funding (grant, loan, tax relief, subsidy, etc.)
- Eligibility requirements (as a list of strings)
- Application deadline
- Maximum funding amount
- A relevance score from 1-10 based on how well it matches the ${userType}'s needs
- Source (government department or agency)
- URL to the official page

Include only currently active and legitimate UK government schemes.
Format your response as a JSON array of funding opportunities.`;

    return prompt;
  }
  
  /**
   * Generate a random ID for funding opportunities
   */
  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}