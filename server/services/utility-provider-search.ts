/**
 * Utility Provider Search Service
 * Uses AI and search to find utility providers 
 * and their details based on location and service type
 */

import { executeAIOperation } from '../ai-service-manager';
import { utilityProviders, utilityTariffs } from '@shared/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';

type UtilityType = 'gas' | 'electricity' | 'dual_fuel' | 'water' | 'broadband' | 'tv';
interface SearchProviderParams {
  utilityType: UtilityType;
  postcode: string;
  city?: string;
}

interface ProviderDetails {
  name: string;
  website: string;
  customerServicePhone: string;
  customerServiceEmail?: string;
  description?: string;
  averageRating?: number;
  logoUrl?: string;
  utilityType: UtilityType;
  estimatedCost?: string;
  specialOffers?: string[];
}

/**
 * Search for utility providers based on location and utility type using Google
 */
export async function searchProvidersWithAI(params: SearchProviderParams): Promise<ProviderDetails[]> {
  try {
    const { utilityType, postcode, city } = params;
    
    // Construct search query
    const locationStr = city ? `in ${city}` : `near ${postcode}`;
    const searchQuery = `What are the best ${utilityType} providers ${locationStr} in the UK? Please include name, website, customer service phone number, and any special offers.`;
    
    console.log(`Searching for providers with query: ${searchQuery}`);
    
    // Use AI to get search results
    const prompt = `
    I need a list of utility providers for ${utilityType} ${locationStr} in the UK. 
    
    Please provide the following details for each provider:
    - Name
    - Website URL
    - Customer service phone number
    - Customer service email (if available)
    - Brief description of their services
    - Any special offers currently available
    
    Format the response as a JSON array with these properties:
    [
      {
        "name": "Provider Name",
        "website": "website URL",
        "customerServicePhone": "phone number",
        "customerServiceEmail": "email address",
        "description": "brief description",
        "averageRating": 4.2,
        "logoUrl": "logo URL if available",
        "utilityType": "${utilityType}",
        "estimatedCost": "estimated monthly cost if available",
        "specialOffers": ["special offer 1", "special offer 2"]
      },
      ...
    ]
    
    Return only the JSON array, nothing else.
    `;
    
    // Generate response using AI with JSON output format
    const response = await executeAIOperation('generateText', {
      prompt,
      responseFormat: 'json'
    });
    
    if (!response) {
      console.error("No response from AI search");
      return [];
    }
    
    // Parse the response to extract provider details
    try {
      // Handle cases where the AI might wrap the JSON in markdown code blocks
      let jsonStr = response;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }
      
      const providers = JSON.parse(jsonStr) as ProviderDetails[];
      
      // Validate and clean the results
      const validProviders = providers.filter(p => p.name && p.website && p.customerServicePhone);
      console.log(`Found ${validProviders.length} providers via AI search`);
      
      // Save these providers to the database for future use
      await saveProvidersToDb(validProviders);
      
      return validProviders;
      
    } catch (error) {
      console.error("Error parsing AI search results:", error);
      console.error("Raw response:", response);
      return [];
    }
  } catch (error) {
    console.error("Error searching for providers with AI:", error);
    return [];
  }
}

/**
 * Save discovered providers to the database
 */
async function saveProvidersToDb(providers: ProviderDetails[]): Promise<void> {
  try {
    for (const provider of providers) {
      // Check if provider already exists
      const existingProvider = await db.select()
        .from(utilityProviders)
        .where(eq(utilityProviders.name, provider.name))
        .limit(1);
      
      if (existingProvider.length === 0) {
        // Insert new provider
        await db.insert(utilityProviders).values({
          name: provider.name,
          utilityType: provider.utilityType,
          website: provider.website,
          customerServicePhone: provider.customerServicePhone,
          customerServiceEmail: provider.customerServiceEmail || null,
          apiIntegration: false,
          active: true,
          logoUrl: provider.logoUrl || null,
          notes: provider.description || null
        });
        
        console.log(`Added new provider to database: ${provider.name}`);
      }
    }
  } catch (error) {
    console.error("Error saving providers to database:", error);
  }
}

/**
 * Get tariff estimates for a specific provider using AI
 */
export async function getTariffEstimatesWithAI(
  providerName: string, 
  utilityType: UtilityType
): Promise<any[]> {
  try {
    // Construct prompt for tariff estimation
    const prompt = `
    What are the current ${utilityType} tariffs offered by ${providerName} in the UK?
    
    For each tariff, please provide:
    - Tariff name
    - Brief description
    - Whether it's a fixed term contract
    - Contract length in months (if applicable)
    - Early exit fee (if applicable)
    - Standing charge
    - Unit rate
    - Estimated annual cost
    - Whether it uses green/renewable energy
    - Any special offers
    
    Format the response as a JSON array:
    [
      {
        "name": "Tariff Name",
        "description": "Brief description",
        "fixedTerm": true or false,
        "termLength": number of months,
        "earlyExitFee": "£XX",
        "standingCharge": "XX.XXp per day",
        "unitRate": "XX.XXp per kWh",
        "estimatedAnnualCost": "£XXXX",
        "greenEnergy": true or false,
        "specialOffers": ["offer 1", "offer 2"]
      },
      ...
    ]
    
    Return only the JSON array, nothing else.
    `;
    
    // Generate response using AI with JSON output format
    const response = await executeAIOperation('generateText', {
      prompt,
      responseFormat: 'json'
    });
    
    if (!response) {
      console.error("No response from AI tariff search");
      return [];
    }
    
    // Parse the response
    try {
      // Handle cases where the AI might wrap the JSON in markdown code blocks
      let jsonStr = response;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }
      
      const tariffs = JSON.parse(jsonStr);
      console.log(`Found ${tariffs.length} tariffs for ${providerName} via AI`);
      return tariffs;
      
    } catch (error) {
      console.error("Error parsing AI tariff results:", error);
      console.error("Raw response:", response);
      return [];
    }
  } catch (error) {
    console.error("Error getting tariff estimates with AI:", error);
    return [];
  }
}