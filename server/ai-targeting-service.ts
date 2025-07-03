/**
 * AI Targeting Service
 * Provides advanced AI targeting for property agents to match tenants with suitable properties
 */
import { executeAIOperation } from './ai-service-manager';
import { 
  User, 
  Property, 
  TenantPreferences, 
  InsertAiTargetingResults, 
  InsertPropertyTenantMatch, 
  AiTargetingResults 
} from '@shared/schema';
import { storage } from './storage';

/**
 * Property-Tenant match criteria interface
 */
interface TenantMatchCriteria {
  tenantId: number;
  propertyId?: number;
  propertyFilters?: {
    minPrice?: number;
    maxPrice?: number;
    propertyTypes?: string[];
    minBedrooms?: number;
    maxBedrooms?: number;
    locations?: string[];
    universities?: string[];
    features?: string[];
    furnished?: boolean;
    availableDate?: string;
  };
  matchThreshold?: number; // Minimum match score (0-100)
}

/**
 * Property targeting criteria interface
 */
interface PropertyTargetingCriteria {
  properties: number[] | undefined; // Property IDs to target
  propertyFilters?: {
    minPrice?: number;
    maxPrice?: number;
    propertyTypes?: string[];
    minBedrooms?: number;
    maxBedrooms?: number;
    locations?: string[];
    universities?: string[];
    features?: string[];
    furnished?: boolean;
    availableDate?: string;
    companies?: string[]; // Property management companies to target
    searchLocation?: string; // Location to search for property management companies
  };
  tenantFilters?: {
    lifestyles?: string[];
    universities?: string[];
    budget?: { min: number; max: number };
    moveInDates?: { min: string; max: string };
  };
  targetDemographic: 'students' | 'professionals' | 'families' | 'property_management';
  name: string;
  description?: string;
  agentId: number;
  emailTemplate?: string; // Email template for property management targeting
}

/**
 * Marketing content generation request interface
 */
interface MarketingContentRequest {
  targetingId: number;
  contentTypes: Array<'email' | 'sms' | 'social'>;
  socialPlatforms?: Array<'facebook' | 'instagram' | 'twitter'>;
  customMessage?: string;
  highlightFeatures?: string[];
}

/**
 * Campaign description request interface
 */
interface CampaignDescriptionRequest {
  campaign: {
    targetDemographic: string;
    name: string;
    propertyFilters?: any;
    tenantFilters?: any;
  };
  properties?: Property[];
}

/**
 * Response from the AI tenant matching
 */
interface TenantMatchingResponse {
  matchScore: number;
  matchReasons: string[];
  suggestedProperties?: Array<{
    propertyId: number;
    score: number;
    reasons: string[];
  }>;
}

/**
 * Generate an AI targeting campaign for an agent
 * @param criteria Targeting criteria
 * @returns The created targeting campaign
 */
export async function createAiTargetingCampaign(
  criteria: PropertyTargetingCriteria
): Promise<AiTargetingResults> {
  try {
    // 1. Get properties based on criteria
    let properties: Property[] = [];
    
    if (criteria.properties && criteria.properties.length > 0) {
      // Get specific properties by IDs
      for (const propertyId of criteria.properties) {
        const property = await storage.getProperty(propertyId);
        if (property) {
          properties.push(property);
        }
      }
    } else if (criteria.propertyFilters) {
      // Get properties based on filters
      properties = await storage.getPropertiesByFilters(criteria.propertyFilters);
    } else {
      // Get all properties owned by this agent
      properties = await storage.getPropertiesByOwner(criteria.agentId);
    }

    if (properties.length === 0) {
      throw new Error('No properties found matching the given criteria');
    }

    // 2. Create the initial targeting result
    const targetingData: InsertAiTargetingResults = {
      agentId: criteria.agentId,
      name: criteria.name,
      description: criteria.description || `Targeting campaign for ${criteria.targetDemographic}`,
      targetDemographic: criteria.targetDemographic,
      targetProperties: properties.map(p => p.id),
      propertyFilters: criteria.propertyFilters ? JSON.stringify(criteria.propertyFilters) : null,
      tenantFilters: criteria.tenantFilters ? JSON.stringify(criteria.tenantFilters) : null,
      status: 'active'
    };

    const targeting = await storage.createAiTargeting(targetingData);

    // 3. Find matching tenants for these properties
    const potentialTenants = await findPotentialTenants(
      properties,
      criteria.tenantFilters
    );

    // 4. For each potential tenant, calculate their match with each property
    const matchedTenants = [];

    for (const tenant of potentialTenants) {
      let bestMatches = [];
      let highestScore = 0;

      for (const property of properties) {
        const matchResult = await matchTenantToProperty(tenant.id, property.id);
        
        if (matchResult.matchScore > 60) { // Only consider good matches
          bestMatches.push({
            propertyId: property.id,
            score: matchResult.matchScore,
            reasons: matchResult.matchReasons
          });

          if (matchResult.matchScore > highestScore) {
            highestScore = matchResult.matchScore;
          }
        }
      }

      // Only include tenants with at least one good match
      if (bestMatches.length > 0) {
        matchedTenants.push({
          tenantId: tenant.id,
          score: highestScore,
          matchReasons: ['Good match based on preferences'],
          recommendedProperties: bestMatches.map(m => m.propertyId)
        });

        // Create individual property-tenant matches for detailed tracking
        for (const match of bestMatches) {
          const matchData: InsertPropertyTenantMatch = {
            propertyId: match.propertyId,
            tenantId: tenant.id,
            targetingId: targeting.id
          };
          
          await storage.createPropertyTenantMatch({
            ...matchData,
            matchScore: typeof match.score === 'string' ? match.score : match.score.toString(),
            matchReasons: match.reasons
          });
        }
      }
    }

    // 5. Update the targeting result with matched tenants
    const updatedTargeting = await storage.updateAiTargeting(
      targeting.id, 
      { matchedTenants }
    );

    // 6. Generate marketing insights based on the properties and matched tenants
    const insights = await generateTargetingInsights(
      properties,
      matchedTenants.map(m => m.tenantId),
      criteria.targetDemographic
    );

    // 7. Update the targeting with insights
    return await storage.updateAiTargeting(
      targeting.id, 
      { insights }
    );
    
  } catch (error) {
    console.error('Error creating AI targeting campaign:', error);
    throw error;
  }
}

/**
 * Find potential tenants based on property criteria
 * @param properties Properties to match against
 * @param tenantFilters Optional tenant filtering criteria
 * @returns List of potential tenant users
 */
async function findPotentialTenants(
  properties: Property[],
  tenantFilters?: PropertyTargetingCriteria['tenantFilters']
): Promise<User[]> {
  // 1. Get all tenant users
  const allTenants = await storage.getUsersByType('tenant');
  
  if (!tenantFilters) {
    return allTenants;
  }

  // 2. Filter tenants based on preferences
  const filteredTenants = await Promise.all(
    allTenants.map(async tenant => {
      const preferences = await storage.getTenantPreferencesByTenantId(tenant.id);
      
      if (!preferences) {
        return null; // No preferences set, can't match
      }

      // Apply filters
      let matches = true;
      
      if (tenantFilters.lifestyles && tenantFilters.lifestyles.length > 0) {
        if (!preferences.lifestyle || !preferences.lifestyle.some(l => 
          tenantFilters.lifestyles!.includes(l)
        )) {
          matches = false;
        }
      }
      
      if (tenantFilters.universities && tenantFilters.universities.length > 0) {
        if (!preferences.universities || !preferences.universities.some(u => 
          tenantFilters.universities!.includes(u)
        )) {
          matches = false;
        }
      }
      
      if (tenantFilters.budget) {
        if (!preferences.budget || 
            preferences.budget.min > tenantFilters.budget.max || 
            preferences.budget.max < tenantFilters.budget.min) {
          matches = false;
        }
      }
      
      // Add more filters as needed
      
      return matches ? tenant : null;
    })
  );
  
  return filteredTenants.filter(t => t !== null) as User[];
}

/**
 * Match a tenant to a specific property
 * @param tenantId Tenant ID
 * @param propertyId Property ID
 * @returns Matching score and reasons
 */
export async function matchTenantToProperty(
  tenantId: number,
  propertyId: number
): Promise<TenantMatchingResponse> {
  try {
    // 1. Get tenant, tenant preferences, and property details
    const tenant = await storage.getUser(tenantId);
    const property = await storage.getProperty(propertyId);
    const preferences = await storage.getTenantPreferencesByTenantId(tenantId);
    
    if (!tenant || !property) {
      throw new Error('Tenant or property not found');
    }
    
    if (!preferences) {
      // No preferences specified, use AI to make a best guess
      return await useAIForMatchPrediction(tenant, property);
    }
    
    // 2. Calculate match score based on preferences
    let score = 0;
    const matchReasons: string[] = [];
    
    // Property type match - weighted by importance
    if (preferences.propertyType && preferences.propertyType.includes(property.propertyType)) {
      score += 15;
      matchReasons.push(`Property type (${property.propertyType}) matches tenant preference`);
    } else if (preferences.propertyType && preferences.propertyType.length > 0) {
      // Small partial credit for related property types (e.g., flat vs. apartment)
      // Define the function directly in the matchTenantToProperty scope
      const getSimilarPropertyTypes = (propType: string): string[] => {
        // Map of property types to their similar alternatives
        const similarityMap: Record<string, string[]> = {
          'flat': ['apartment', 'studio', 'maisonette'],
          'apartment': ['flat', 'studio', 'maisonette'],
          'house': ['terraced', 'semi-detached', 'detached', 'townhouse', 'bungalow'],
          'terraced': ['house', 'townhouse', 'semi-detached'],
          'semi-detached': ['house', 'terraced', 'detached'],
          'detached': ['house', 'semi-detached', 'bungalow'],
          'studio': ['flat', 'apartment', 'bedsit'],
          'room': ['shared house', 'houseshare', 'flatshare', 'shared flat'],
          'shared house': ['room', 'houseshare', 'flatshare'],
          'houseshare': ['room', 'shared house', 'flatshare'],
          'flatshare': ['room', 'shared flat', 'houseshare'],
          'shared flat': ['room', 'flatshare', 'houseshare'],
          'student hall': ['purpose built', 'student accommodation', 'university accommodation'],
          'purpose built': ['student hall', 'student accommodation'],
          'student accommodation': ['student hall', 'purpose built', 'university accommodation']
        };
        
        const normalizedType = propType.toLowerCase().trim();
        
        // Return similar types if available, or an empty array if not
        return similarityMap[normalizedType] || [];
      };
      
      const similarTypes = getSimilarPropertyTypes(property.propertyType);
      if (preferences.propertyType.some(type => similarTypes.includes(type))) {
        score += 5;
        matchReasons.push(`Property type (${property.propertyType}) is similar to tenant preference`);
      }
    }
    
    // Budget match - with granular score based on how close to preferred range
    if (preferences.budget) {
      const propertyPrice = parseFloat(property.price.toString());
      if (propertyPrice >= preferences.budget.min && propertyPrice <= preferences.budget.max) {
        // Perfect match in budget range
        score += 20;
        matchReasons.push('Property price is within tenant budget range');
      } else if (propertyPrice < preferences.budget.min) {
        // Below budget (good value)
        const percentBelow = (preferences.budget.min - propertyPrice) / preferences.budget.min * 100;
        if (percentBelow <= 15) {
          // If it's just slightly below budget, it's a great deal
          score += 15;
          matchReasons.push('Property price is slightly below tenant budget (excellent value)');
        } else {
          // If it's significantly below budget, it might be too cheap/have issues
          score += 10;
          matchReasons.push('Property price is below tenant budget (good value)');
        }
      } else if (propertyPrice > preferences.budget.max) {
        // Above budget but may still be interesting if it's close
        const percentAbove = (propertyPrice - preferences.budget.max) / preferences.budget.max * 100;
        if (percentAbove <= 5) {
          // Only slightly above max budget
          score += 5;
          matchReasons.push('Property price is slightly above tenant budget (may still be affordable)');
        }
      }
    }
    
    // Bedrooms match - with consideration for flexibility
    if (preferences.bedrooms) {
      if (preferences.bedrooms.includes(property.bedrooms)) {
        score += 15;
        matchReasons.push(`Number of bedrooms (${property.bedrooms}) matches tenant preference`);
      } else if (preferences.bedrooms.some(b => Math.abs(b - property.bedrooms) === 1)) {
        // Close match (±1 bedroom)
        score += 8;
        matchReasons.push(`Number of bedrooms (${property.bedrooms}) is close to tenant preference`);
      }
    }
    
    // Location match - with proximity analysis
    if (preferences.location && preferences.location.length > 0) {
      // Exact location match
      if (preferences.location.some(loc => 
          property.address.toLowerCase().includes(loc.toLowerCase()) || 
          property.city.toLowerCase().includes(loc.toLowerCase()) ||
          property.area?.toLowerCase().includes(loc.toLowerCase()))) {
        score += 15;
        matchReasons.push('Property location matches tenant preference');
      } else {
        // Nearby location match (using nearby area mapping)
        // Define the nearby location function directly in scope
        const isNearbyLocation = (preferredLocation: string, propertyLocation: string): boolean => {
          if (!preferredLocation || !propertyLocation) return false;
          
          const normPreferred = preferredLocation.toLowerCase().trim();
          const normProperty = propertyLocation.toLowerCase().trim();
          
          // If exact match, return true immediately
          if (normProperty.includes(normPreferred) || normPreferred.includes(normProperty)) {
            return true;
          }
          
          // Map of areas that are considered nearby to each other
          const nearbyAreasMap: Record<string, string[]> = {
            // London areas
            'camden': ['kings cross', 'euston', 'bloomsbury', 'primrose hill', 'kentish town'],
            'islington': ['angel', 'kings cross', 'highbury', 'finsbury park', 'archway'],
            'hackney': ['shoreditch', 'dalston', 'stoke newington', 'clapton', 'homerton'],
            'tower hamlets': ['whitechapel', 'mile end', 'bow', 'stepney', 'poplar', 'canary wharf'],
            'southwark': ['borough', 'bermondsey', 'peckham', 'dulwich', 'elephant and castle'],
            'lambeth': ['waterloo', 'brixton', 'clapham', 'streatham', 'vauxhall'],
            
            // Manchester areas
            'manchester city centre': ['northern quarter', 'ancoats', 'castlefield', 'deansgate', 'spinningfields'],
            'fallowfield': ['withington', 'rusholme', 'moss side', 'longsight', 'victoria park'],
            'didsbury': ['west didsbury', 'east didsbury', 'withington', 'burnage'],
            'chorlton': ['whalley range', 'firswood', 'old trafford', 'stretford'],
            
            // Birmingham areas
            'edgbaston': ['harborne', 'selly oak', 'bournville', 'birmingham city centre'],
            'selly oak': ['edgbaston', 'harborne', 'bournville', 'cotteridge'],
            'moseley': ['kings heath', 'balsall heath', 'sparkhill', 'hall green'],
            
            // Leeds areas
            'headingley': ['hyde park', 'meanwood', 'kirkstall', 'woodhouse', 'burley'],
            'city centre': ['holbeck', 'armley', 'hunslet', 'woodhouse'],
            
            // Bristol areas
            'clifton': ['redland', 'cotham', 'hotwells', 'bristol city centre'],
            'bedminster': ['southville', 'ashton', 'totterdown', 'windmill hill'],
            
            // Nottingham areas
            'lenton': ['radford', 'dunkirk', 'nottingham city centre', 'wollaton'],
            'beeston': ['dunkirk', 'wollaton', 'lenton', 'university park'],
            
            // Sheffield areas
            'broomhill': ['crookes', 'ecclesall', 'sheffield city centre', 'walkley'],
            'ecclesall road': ['broomhill', 'hunter\'s bar', 'sharrow', 'nether edge'],
            
            // Newcastle areas
            'jesmond': ['heaton', 'sandyford', 'gosforth', 'newcastle city centre'],
            'heaton': ['jesmond', 'byker', 'sandyford', 'walker'],
            
            // General university areas
            'university': ['campus', 'college', 'student village']
          };
          
          // Check if the property location is in the nearby areas of the preferred location
          for (const [area, nearbyAreas] of Object.entries(nearbyAreasMap)) {
            if (normPreferred.includes(area)) {
              if (nearbyAreas.some(nearby => normProperty.includes(nearby))) {
                return true;
              }
            }
            
            if (normProperty.includes(area)) {
              if (nearbyAreas.some(nearby => normPreferred.includes(nearby))) {
                return true;
              }
            }
          }
          
          return false;
        };
        
        const nearbyMatches = preferences.location.filter(loc => 
          isNearbyLocation(loc, property.city) || 
          isNearbyLocation(loc, property.area || ''));
        
        if (nearbyMatches.length > 0) {
          score += 10;
          matchReasons.push('Property location is near tenant\'s preferred areas');
        }
      }
    }
    
    // University match - with distance consideration
    if (preferences.universities && property.university) {
      // Direct university match
      if (preferences.universities.some(uni => 
          property.university!.toLowerCase().includes(uni.toLowerCase()))) {
        score += 10;
        matchReasons.push('Property is near tenant\'s preferred university');
      }
    }
    
    // Max distance to university with more granular scoring
    if (property.distanceToUniversity) {
      const distance = 
        typeof property.distanceToUniversity === 'string' 
          ? parseFloat(property.distanceToUniversity.replace(/[^0-9.]/g, '')) 
          : property.distanceToUniversity;
          
      if (!isNaN(distance)) {
        if (preferences.maxDistanceToUniversity) {
          if (distance <= preferences.maxDistanceToUniversity) {
            score += 10;
            matchReasons.push(`Property is within tenant's maximum distance to university (${distance} miles)`);
          }
        } else {
          // Even without a specific preference, proximity to university is valuable for students
          if (distance <= 0.5) {
            score += 12;
            matchReasons.push('Property is extremely close to university (under 0.5 miles)');
          } else if (distance <= 1) {
            score += 10;
            matchReasons.push('Property is very close to university (under 1 mile)');
          } else if (distance <= 2) {
            score += 7;
            matchReasons.push('Property is close to university (under 2 miles)');
          } else if (distance <= 3) {
            score += 4;
            matchReasons.push('Property is within 3 miles of university');
          }
        }
      }
    }
    
    // All-inclusive utilities consideration (important for students)
    if (property.billsIncluded && property.includedBills && property.includedBills.length > 0) {
      // Check for essential bills: electricity, gas, water, internet
      const essentialBills = ['electricity', 'gas', 'water', 'internet', 'wifi', 'broadband'];
      const includedEssentials = property.includedBills.filter(bill => 
        essentialBills.some(essential => bill.toLowerCase().includes(essential.toLowerCase())));
      
      if (includedEssentials.length >= 4) {
        score += 12;
        matchReasons.push('Property includes all essential bills (excellent for students)');
      } else if (includedEssentials.length >= 2) {
        score += 8;
        matchReasons.push('Property includes some essential bills');
      } else if (property.includedBills.length > 0) {
        score += 4;
        matchReasons.push('Property includes some bills');
      }
    }
    
    // Must-have features with weighted importance
    if (preferences.mustHaveFeatures && preferences.mustHaveFeatures.length > 0) {
      const propertyFeatures = property.features || [];
      const matchedFeatures = preferences.mustHaveFeatures.filter(feature => 
        propertyFeatures.some(f => f.toLowerCase().includes(feature.toLowerCase())));
      
      if (matchedFeatures.length === preferences.mustHaveFeatures.length) {
        score += 15;
        matchReasons.push('Property has all must-have features');
      } else if (matchedFeatures.length > 0) {
        const percentage = (matchedFeatures.length / preferences.mustHaveFeatures.length) * 100;
        score += Math.round((percentage / 100) * 10);
        
        if (matchedFeatures.length > 1) {
          matchReasons.push(`Property has ${matchedFeatures.length} of ${preferences.mustHaveFeatures.length} must-have features: ${matchedFeatures.join(', ')}`);
        } else {
          matchReasons.push(`Property has ${matchedFeatures.length} of ${preferences.mustHaveFeatures.length} must-have features: ${matchedFeatures[0]}`);
        }
      }
    }
    
    // Nice-to-have features
    if (preferences.niceToHaveFeatures && preferences.niceToHaveFeatures.length > 0) {
      const propertyFeatures = property.features || [];
      const matchedFeatures = preferences.niceToHaveFeatures.filter(feature => 
        propertyFeatures.some(f => f.toLowerCase().includes(feature.toLowerCase())));
      
      if (matchedFeatures.length > 0) {
        const percentage = (matchedFeatures.length / preferences.niceToHaveFeatures.length) * 100;
        score += Math.round((percentage / 100) * 5);
        
        if (matchedFeatures.length > 1) {
          matchReasons.push(`Property has ${matchedFeatures.length} of ${preferences.niceToHaveFeatures.length} nice-to-have features: ${matchedFeatures.join(', ')}`);
        } else {
          matchReasons.push(`Property has ${matchedFeatures.length} of ${preferences.niceToHaveFeatures.length} nice-to-have features: ${matchedFeatures[0]}`);
        }
      }
    }
    
    // Deal breakers (significant negative score if present)
    if (preferences.dealBreakers && preferences.dealBreakers.length > 0) {
      const propertyFeatures = property.features || [];
      const dealBreakersPresent = preferences.dealBreakers.filter(feature => 
        propertyFeatures.some(f => f.toLowerCase().includes(feature.toLowerCase())));
      
      if (dealBreakersPresent.length > 0) {
        // More severe penalty for deal breakers
        const penalty = Math.min(50, dealBreakersPresent.length * 15); // Cap at -50
        score -= penalty;
        
        if (dealBreakersPresent.length > 1) {
          matchReasons.push(`Property has ${dealBreakersPresent.length} deal-breaking features: ${dealBreakersPresent.join(', ')}`);
        } else {
          matchReasons.push(`Property has a deal-breaking feature: ${dealBreakersPresent[0]}`);
        }
      }
    }
    
    // Furnished status consideration
    // Use the 'furnished' field directly instead of 'furnishedStatus'
    if (preferences.furnished !== undefined && property.furnished !== undefined) {
      // Convert to boolean if it's a string representation
      const isFurnished = typeof property.furnished === 'string' 
        ? property.furnished.toLowerCase() === 'true' || property.furnished.toLowerCase() === 'furnished'
        : !!property.furnished;
        
      if (preferences.furnished === isFurnished) {
        score += 10;
        matchReasons.push(`Property furnished status (${isFurnished ? 'Furnished' : 'Unfurnished'}) matches tenant preference`);
      }
    }
    
    // Move-in date consideration
    if (preferences.moveInDate && property.available) {
      // If property doesn't have availableFrom field, check if it's available (boolean)
      const availableDate = property.availableDate 
        ? new Date(property.availableDate) 
        : new Date();
      const preferredDate = new Date(preferences.moveInDate);
      
      // Calculate difference in days
      const diffTime = Math.abs(preferredDate.getTime() - availableDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // Perfect match
        score += 10;
        matchReasons.push('Property available exactly on tenant\'s preferred move-in date');
      } else if (diffDays <= 7) {
        // Within a week
        score += 8;
        matchReasons.push('Property available within a week of tenant\'s preferred move-in date');
      } else if (diffDays <= 14) {
        // Within two weeks
        score += 5;
        matchReasons.push('Property available within two weeks of tenant\'s preferred move-in date');
      }
    }
    
    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, score));
    
    return {
      matchScore: score,
      matchReasons: matchReasons.length > 0 ? matchReasons : ['No specific match criteria met']
    };
  } catch (error) {
    console.error('Error matching tenant to property:', error);
    return {
      matchScore: 0,
      matchReasons: ['Error calculating match score']
    };
  }
}

/**
 * Use AI to predict tenant-property match when preferences are not available
 * @param tenant Tenant user
 * @param property Property
 * @returns AI-generated match prediction
 */
async function useAIForMatchPrediction(
  tenant: User,
  property: Property
): Promise<TenantMatchingResponse> {
  try {
    const prompt = `
You are an expert student property matching algorithm. Based on the provided tenant and property information, estimate how well they match.
Analyze the data and return a JSON response with a match score (0-100) and 2-4 specific reasons for the score.

Tenant information:
- Name: ${tenant.name}
- Email: ${tenant.email}
${tenant.phone ? `- Phone: ${tenant.phone}` : ''}

Property information:
- Title: ${property.title}
- Type: ${property.propertyType}
- Price: ${property.price}
- Location: ${property.address}, ${property.city}
- Bedrooms: ${property.bedrooms}
- Bathrooms: ${property.bathrooms}
- Features: ${property.features?.join(', ') || 'None specified'}
${property.university ? `- Nearby University: ${property.university}` : ''}
- Furnished: ${property.furnished ? 'Yes' : 'No'}
- Bills Included: ${property.billsIncluded ? `Yes (${property.includedBills?.join(', ')})` : 'No'}

Provide your analysis in this JSON format:
{
  "matchScore": number, // 0-100 match score
  "matchReasons": ["reason1", "reason2", ...] // 2-4 specific reasons
}
`;

    const response = await executeAIOperation('generateText', {
      prompt,
      responseFormat: 'json_object'
    });

    try {
      const result = JSON.parse(response);
      return {
        matchScore: Math.max(0, Math.min(100, result.matchScore || 0)),
        matchReasons: result.matchReasons || ['AI-generated match prediction']
      };
    } catch (e) {
      console.error('Error parsing AI response:', e);
      return {
        matchScore: 50, // Default moderate match
        matchReasons: ['AI-generated match prediction']
      };
    }
  } catch (error) {
    console.error('Error using AI for match prediction:', error);
    return {
      matchScore: 0,
      matchReasons: ['Error in AI matching']
    };
  }
}

/**
 * Search for property management companies in a specific location
 * @param location Location to search for property management companies
 * @returns Array of company information including name, email, and description
 */
export async function searchPropertyManagementCompanies(
  location: string
): Promise<Array<{name: string, email: string, phone?: string, website?: string, description?: string, specialization?: string, size?: string}>> {
  try {
    // Enhanced search approach for more accurate and detailed results:
    // 1. First, ask Gemini to search for student property companies
    // 2. Then, gather comprehensive details on the found companies
    // 3. Validate and clean up the results

    // Step 1: Improved initial search for companies
    const initialSearchPrompt = `
      I need to find student property management companies specifically in ${location}, UK.
      Focus ONLY on companies that specialize in student accommodation, not general letting agents.
      
      Please provide a list of 10-15 real, currently operating student property management companies in ${location}.
      Each company MUST be a genuine business with:
      - A specialization in student housing, student halls, or university accommodation
      - An actual physical presence or portfolio in ${location}
      - Been in operation within the last year (2024/2025)
      
      Return ONLY a JSON array of company names in this exact format:
      ["Company Name 1", "Company Name 2", "Company Name 3"]
      
      Do NOT invent any companies. Only include real businesses that actually exist.
      Prioritize companies with the strongest presence in the local student accommodation market.
      
      IMPORTANT: Return ONLY a valid, parseable JSON array of strings with no additional text, explanations, or formatting.
    `;
    
    console.log(`Starting search for student property companies in ${location}`);
    
    // Generate initial list of company names
    const initialSearchResult = await executeAIOperation('generateText', {
      prompt: initialSearchPrompt,
      maxTokens: 2500,
      responseFormat: 'json'
    });
    
    let companies: string[] = [];
    try {
      // Parse the initial JSON response to get company names
      const parsedCompanies = JSON.parse(initialSearchResult);
      if (Array.isArray(parsedCompanies)) {
        companies = parsedCompanies.filter(name => typeof name === 'string' && name.trim() !== '');
      }
    } catch (parseError) {
      console.error("Error parsing initial company names:", parseError);
      
      // Try to extract JSON array with regex if parsing failed
      const jsonMatch = initialSearchResult.match(/\[\s*"[^"]*"(?:\s*,\s*"[^"]*")*\s*\]/s);
      if (jsonMatch) {
        // Extract company names from bracketed list by finding quoted strings
        const nameMatches = jsonMatch[0].match(/"([^"]*)"/g);
        if (nameMatches) {
          companies = nameMatches.map(match => match.replace(/"/g, '').trim())
                               .filter(name => name !== '');
        }
      }
    }
    
    // If we couldn't find any companies, return empty array
    if (companies.length === 0) {
      console.warn(`No student property companies found in ${location}`);
      return [];
    }
    
    console.log(`Initial search found ${companies.length} companies in ${location}`);
    
    // Limit to max 12 companies to avoid overwhelming the API but ensure good results
    if (companies.length > 12) {
      companies = companies.slice(0, 12);
    }
    
    // Step 2: Get comprehensive information for each company
    const detailedSearchPrompt = `
      I need detailed, accurate information about these student property management companies in ${location}, UK:
      ${companies.join('\n')}
      
      For each company, provide only FACTUAL, VERIFIED information including:
      1. Full company name (exactly as listed above)
      2. Primary business email address (general contact or inquiries email)
      3. Main office phone number with UK format
      4. Official website URL (include https:// prefix)
      5. Specialization (e.g., "Purpose-built student accommodation", "HMO student houses", "University partnerships")
      6. Approximate size (e.g., "Small (1-50 properties)", "Medium (51-200 properties)", "Large (200+ properties)")
      7. Brief description of their student property services (3-4 sentences maximum)
      
      Format the response as a valid JSON array with objects containing these fields:
      [
        {
          "name": "Example Student Living",
          "email": "info@examplestudent.co.uk", 
          "phone": "01234 567890",
          "website": "https://www.examplestudent.co.uk",
          "specialization": "HMO student houses",
          "size": "Medium (51-200 properties)",
          "description": "Example Student Living manages a portfolio of high-quality HMO properties across ${location} for university students. They specialize in affordable, all-inclusive accommodations within walking distance of major universities. Their properties feature high-speed internet, fully furnished rooms, and 24/7 maintenance services."
        }
      ]
      
      CRITICAL: Only include REAL contact information that you can verify. If you cannot find specific information, use null for that field rather than guessing or inventing data.
      
      IMPORTANT: Your response must be ONLY a valid JSON array without any additional text, explanations, or formatting.
    `;
    
    // Generate detailed company information
    const searchResult = await executeAIOperation('generateText', {
      prompt: detailedSearchPrompt,
      maxTokens: 5000,
      responseFormat: 'json'
    });
    
    try {
      // Try to extract JSON if the model added extra text despite instructions
      let jsonText = searchResult;
      
      // Look for JSON array pattern
      const jsonMatch = searchResult.match(/\[\s*\{.*\}\s*\]/s);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      
      // Parse the JSON response
      const companyDetails = JSON.parse(jsonText);
      
      if (Array.isArray(companyDetails)) {
        // Clean and validate the results
        return companyDetails.map(company => ({
          name: company.name || '',
          email: company.email || '',
          phone: company.phone || undefined,
          website: company.website || undefined,
          description: company.description || undefined,
          specialization: company.specialization || undefined,
          size: company.size || undefined
        })).filter(company => 
          // Only include companies with at least a name and either an email or website
          company.name && (company.email || company.website)
        );
      } else {
        console.error("AI returned non-array response:", searchResult);
        return [];
      }
    } catch (parseError) {
      console.error("Error parsing AI company search results:", parseError);
      return [];
    }
  } catch (error) {
    console.error("Error searching for property management companies:", error);
    throw error; // Re-throw to allow proper error handling in the route
  }
}

/**
 * Get company contact information for a list of company names
 * @param companies List of company names to search for
 * @param location General location (for context)
 * @returns Array of company information including name, email, and description
 */
export async function getCompanyContactInformation(
  companies: string[],
  location: string = 'UK'
): Promise<Array<{name: string, email: string, phone?: string, website?: string, description?: string, specialization?: string, size?: string}>> {
  if (companies.length === 0) {
    console.warn("No companies provided to getCompanyContactInformation");
    return [];
  }
  
  try {
    console.log(`Retrieving detailed information for ${companies.length} companies in ${location}`);
    
    // Use Gemini to find accurate contact information for the specified companies
    const searchPrompt = `
      I need detailed, accurate information about these student property management companies in ${location}, UK:
      ${companies.map((company, index) => `${index + 1}. ${company}`).join('\n')}
      
      For each company, provide only FACTUAL, VERIFIED information including:
      1. Full company name (exactly as listed above)
      2. Primary business email address (general contact or inquiries email)
      3. Main office phone number with UK format
      4. Official website URL (include https:// prefix)
      5. Specialization (e.g., "Purpose-built student accommodation", "HMO student houses", "University partnerships")
      6. Approximate size (e.g., "Small (1-50 properties)", "Medium (51-200 properties)", "Large (200+ properties)")
      7. Brief description of their student property services (3-4 sentences maximum)
      
      Format the response as a valid JSON array with objects containing these fields:
      [
        {
          "name": "Example Student Living",
          "email": "info@examplestudent.co.uk", 
          "phone": "01234 567890",
          "website": "https://www.examplestudent.co.uk",
          "specialization": "HMO student houses",
          "size": "Medium (51-200 properties)",
          "description": "Example Student Living manages a portfolio of high-quality HMO properties across ${location} for university students. They specialize in affordable, all-inclusive accommodations within walking distance of major universities. Their properties feature high-speed internet, fully furnished rooms, and 24/7 maintenance services."
        }
      ]
      
      CRITICAL: Only include REAL contact information that you can verify. If you cannot find specific information, use null for that field rather than guessing or inventing data.
      
      IMPORTANT: Return ONLY a valid JSON array with no additional text, explanations, or markdown formatting.
    `;
    
    // Generate detailed company information 
    const searchResult = await executeAIOperation('generateText', {
      prompt: searchPrompt,
      maxTokens: 5000,
      responseFormat: 'json'
    });
    
    try {
      // Try to extract JSON if the model added extra text despite instructions
      let jsonText = searchResult;
      
      // Look for JSON array pattern
      const jsonMatch = searchResult.match(/\[\s*\{.*\}\s*\]/s);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      
      // Parse the JSON response
      const companyDetails = JSON.parse(jsonText);
      
      if (Array.isArray(companyDetails)) {
        // Clean and validate the results
        const result = companyDetails.map(company => ({
          name: company.name || '',
          email: company.email || '',
          phone: company.phone || undefined,
          website: company.website || undefined,
          description: company.description || undefined,
          specialization: company.specialization || undefined,
          size: company.size || undefined
        })).filter(company => 
          // Only include companies with at least a name and either an email or website
          company.name && (company.email || company.website)
        );
        
        console.log(`Successfully retrieved information for ${result.length} of ${companies.length} companies`);
        return result;
      } else {
        console.error("AI returned non-array response:", searchResult);
        return [];
      }
    } catch (parseError) {
      console.error("Error parsing AI company contact results:", parseError);
      return [];
    }
  } catch (error) {
    console.error("Error getting company contact information:", error);
    throw error; // Re-throw to allow proper error handling in the route
  }
}

/**
 * Generate targeting insights for properties and tenants
 * @param properties List of properties
 * @param tenantIds List of tenant IDs
 * @param targetDemographic Target demographic
 * @returns List of insights
 */
async function generateTargetingInsights(
  properties: Property[],
  tenantIds: number[],
  targetDemographic: string
): Promise<string[]> {
  try {
    // Get details for matched tenants
    const tenants = await Promise.all(
      tenantIds.map(id => storage.getUser(id))
    );
    
    const validTenants = tenants.filter(t => t !== undefined) as User[];
    
    // Basic insights based on property data
    const basicInsights = [
      `Campaign targets ${properties.length} properties and ${validTenants.length} potential tenants`,
      `Primary demographic: ${targetDemographic}`
    ];
    
    // Generate more sophisticated insights with AI
    const propertyDetails = properties.map(p => ({
      title: p.title,
      price: p.price.toString(),
      bedrooms: p.bedrooms,
      propertyType: p.propertyType,
      area: p.area || p.city,
      features: p.features || []
    }));
    
    const tenantDetails = validTenants.map(t => ({
      userType: t.userType,
      name: t.name
    }));
    
    const prompt = `
You are an expert property market analyst. Based on the following data about a property targeting campaign, 
generate 5-7 useful insights that would help a property agent better market these properties to the target tenants.

Properties (${properties.length} total):
${JSON.stringify(propertyDetails, null, 2)}

Target Tenants (${validTenants.length} total):
${JSON.stringify(tenantDetails, null, 2)}

Target Demographic: ${targetDemographic}

VERY IMPORTANT: Your entire response MUST be ONLY a valid JSON array of strings. Each insight should be actionable and specific to this dataset.
Focus on patterns, opportunities, pricing strategy, feature highlights, and targeted marketing approaches.

Example response format:
[
  "70% of properties are in the City Centre area, which aligns well with student preferences for proximity to universities",
  "Properties with ensuite bathrooms command a 15% price premium and have 30% faster letting times",
  "Consider highlighting high-speed broadband as a key feature in all marketing materials as it appears in 90% of properties"
]

IMPORTANT: Return ONLY a valid JSON array without any additional text, explanations, or markdown formatting. 
The response should be a properly formatted JSON array that can be parsed directly.
`;

    const aiResponse = await executeAIOperation('generateText', {
      prompt
    });
    
    try {
      // Try to extract JSON if the model added extra text despite instructions
      let jsonText = aiResponse;
      
      // Look for JSON array pattern
      const jsonMatch = aiResponse.match(/\[\s*".*"\s*\]/s);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      
      const aiInsights = JSON.parse(jsonText);
      if (Array.isArray(aiInsights)) {
        return [...basicInsights, ...aiInsights];
      }
    } catch (e) {
      console.error('Error parsing AI insights:', e);
    }
    
    return basicInsights;
  } catch (error) {
    console.error('Error generating targeting insights:', error);
    return ['Error generating insights'];
  }
}

/**
 * Generate campaign descriptions with short, medium, and long options
 * @param request Campaign description request
 * @returns Object containing short, medium, and long descriptions
 */
export async function generateCampaignDescriptions(
  request: CampaignDescriptionRequest
): Promise<{
  short: string;
  medium: string;
  long: string;
}> {
  try {
    const { campaign, properties = [] } = request;
    const { targetDemographic, name, propertyFilters, tenantFilters } = campaign;
    
    // Prepare a prompt for Gemini API
    const prompt = `
    Generate three different descriptions for a property targeting campaign with the following details:
    
    Campaign name: ${name}
    Target demographic: ${targetDemographic}
    Property filters: ${JSON.stringify(propertyFilters || {})}
    Tenant filters: ${JSON.stringify(tenantFilters || {})}
    Number of properties: ${properties.length}
    ${properties.length > 0 ? `Sample properties: ${JSON.stringify(properties.slice(0, 2))}` : ''}
    
    Please provide three different versions of the campaign description:
    
    1. SHORT - A very concise description (25-35 words)
    2. MEDIUM - A moderate length description with key details (50-70 words)
    3. LONG - A comprehensive description with all relevant information (100-150 words)
    
    Return a valid JSON object with these fields:
    {
      "short": "Short description here",
      "medium": "Medium description here",
      "long": "Long description here"
    }
    
    Ensure each description highlights the key targeting features and benefits of this campaign.
    
    IMPORTANT: Return ONLY a valid JSON object without any additional text, explanations, or markdown formatting. 
    The response should be a properly formatted JSON object that can be parsed directly.
    `;
    
    // Use AI to generate the descriptions
    const response = await executeAIOperation('generateText', {
      prompt,
      maxTokens: 2000,
      responseFormat: 'json'
    });
    
    try {
      // Parse the response as JSON
      const parsedResponse = JSON.parse(response);
      
      // Ensure all three description types are provided
      return {
        short: parsedResponse.short || "Targeted marketing campaign for student properties.",
        medium: parsedResponse.medium || "Targeted marketing campaign for student properties, helping connect landlords with ideal tenants through AI-powered matching.",
        long: parsedResponse.long || "Comprehensive AI-powered marketing campaign targeting student properties. This campaign leverages advanced matching algorithms to connect landlords with their ideal tenants based on property features, location, and tenant preferences."
      };
    } catch (parseError) {
      console.error("Error parsing AI-generated campaign descriptions:", parseError);
      // Provide fallback descriptions
      return {
        short: "Targeted marketing campaign for student properties.",
        medium: "Targeted marketing campaign for student properties, helping connect landlords with ideal tenants through AI-powered matching.",
        long: "Comprehensive AI-powered marketing campaign targeting student properties. This campaign leverages advanced matching algorithms to connect landlords with their ideal tenants based on property features, location, and tenant preferences."
      };
    }
  } catch (error) {
    console.error("Error generating campaign descriptions:", error);
    // Provide fallback descriptions in case of error
    return {
      short: "Targeted marketing campaign for student properties.",
      medium: "Targeted marketing campaign for student properties, helping connect landlords with ideal tenants through AI-powered matching.",
      long: "Comprehensive AI-powered marketing campaign targeting student properties. This campaign leverages advanced matching algorithms to connect landlords with their ideal tenants based on property features, location, and tenant preferences."
    };
  }
}

/**
 * Generate marketing content for an AI targeting campaign
 * @param request Marketing content request
 * @returns Updated targeting campaign with marketing content
 */
export async function generateMarketingContent(
  request: MarketingContentRequest
): Promise<AiTargetingResults> {
  try {
    // 1. Get the targeting campaign
    const targeting = await storage.getAiTargeting(request.targetingId);
    if (!targeting) {
      throw new Error('Targeting campaign not found');
    }
    
    // 2. Get the properties
    // Handle the case when targetProperties is null
    const properties = targeting.targetProperties ? 
      await Promise.all(
        targeting.targetProperties.map(id => storage.getProperty(id))
      ) : [];
    
    const validProperties = properties.filter(p => p !== undefined) as Property[];
    
    // 3. Generate different content types as requested
    const updates: Partial<AiTargetingResults> = {};
    
    // Prepare property highlights
    const propertyHighlights = validProperties.map(p => ({
      title: p.title,
      price: p.price.toString(),
      bedrooms: p.bedrooms,
      location: p.city,
      key_features: p.features?.slice(0, 3) || [],
      university: p.university
    }));
    
    // Common prompt parts
    const basePrompt = `
Campaign Name: ${targeting.name}
Campaign Description: ${targeting.description || 'Not specified'}
Target Demographic: ${targeting.targetDemographic}
Properties: ${JSON.stringify(propertyHighlights)}
Custom Message: ${request.customMessage || 'None'}
Highlight Features: ${request.highlightFeatures?.join(', ') || 'None specifically requested'}
`;

    // Generate email content if requested
    if (request.contentTypes.includes('email')) {
      const emailPrompt = `
${basePrompt}

You are a student property marketing expert. Write a compelling email to potential student tenants about these properties.
The email should:
1. Have an attention-grabbing subject line
2. Be friendly and conversational in tone
3. Highlight key selling points for students (like bills included, location, etc.)
4. Include a clear call-to-action
5. Be formatted in HTML with appropriate styling

Format the response as an HTML email that's ready to send, with a subject line at the beginning prefixed with "SUBJECT: ".
`;

      const emailContent = await executeAIOperation('generateText', { prompt: emailPrompt });
      updates.emailTemplate = emailContent;
    }
    
    // Generate SMS content if requested
    if (request.contentTypes.includes('sms')) {
      const smsPrompt = `
${basePrompt}

You are a student property marketing expert. Write a concise SMS message (max 160 characters) 
promoting these properties to student tenants. The message should be compelling and include a call-to-action.
`;

      const smsContent = await executeAIOperation('generateText', { prompt: smsPrompt });
      updates.smsTemplate = smsContent;
    }
    
    // Generate social media content if requested
    if (request.contentTypes.includes('social') && request.socialPlatforms) {
      const socialContent: Record<string, string> = {};
      
      for (const platform of request.socialPlatforms) {
        const socialPrompt = `
${basePrompt}

You are a student property marketing expert. Write a compelling ${platform} post promoting these properties to student tenants.

For ${platform}, follow these specific guidelines:
${platform === 'facebook' ? '- Write a longer, more detailed post (100-150 words)\n- Include 2-3 emojis for engagement\n- Add 2-3 relevant hashtags at the end' : ''}
${platform === 'instagram' ? '- Write a visually-focused caption (80-120 words)\n- Include 4-5 emojis throughout the text\n- Add 8-10 relevant hashtags at the end' : ''}
${platform === 'twitter' ? '- Write a concise, punchy post (under 280 characters)\n- Include 1-2 emojis\n- Add 2-3 relevant hashtags' : ''}

The post should highlight key benefits for students and include a clear call-to-action.
`;

        const content = await executeAIOperation('generateText', { prompt: socialPrompt });
        socialContent[platform] = content;
      }
      
      updates.socialMediaContent = socialContent;
    }
    
    // 4. Update the targeting campaign with the generated content
    const updatedTargeting = await storage.updateAiTargeting(targeting.id, updates);
    if (!updatedTargeting) {
      throw new Error('Failed to update targeting campaign');
    }
    return updatedTargeting;
    
  } catch (error) {
    console.error('Error generating marketing content:', error);
    throw error;
  }
}

/**
 * Get tenant property recommendations
 * @param tenantId Tenant user ID
 * @param count Number of recommendations to return
 * @returns List of recommended properties with match scores
 */
export async function getTenantPropertyRecommendations(
  tenantId: number,
  count: number = 5
): Promise<Array<{property: Property, score: number, reasons: string[]}>> {
  try {
    // 1. Get tenant preferences
    const preferences = await storage.getTenantPreferencesByTenantId(tenantId);
    
    // 2. Get available properties
    let properties = await storage.getAllProperties();
    // Filter to only include available properties
    properties = properties.filter(p => p.available === true);
    
    // 3. Score each property for this tenant
    const scoredProperties = await Promise.all(
      properties.map(async property => {
        const matchResult = await matchTenantToProperty(tenantId, property.id);
        return {
          property,
          score: typeof matchResult.matchScore === 'string' ? 
                 parseInt(matchResult.matchScore) : 
                 matchResult.matchScore,
          reasons: matchResult.matchReasons
        };
      })
    );
    
    // 4. Sort by score (descending) and take the top 'count'
    return scoredProperties
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
    
  } catch (error) {
    console.error('Error getting tenant property recommendations:', error);
    return [];
  }
}

/**
 * Get similar property types for flexible matching
 * @param propertyType The property type to find similarities for
 * @returns Array of similar property types
 */
function getSimilarPropertyTypes(propertyType: string): string[] {
  // Map of property types to their similar alternatives
  const similarityMap: Record<string, string[]> = {
    'flat': ['apartment', 'studio', 'maisonette'],
    'apartment': ['flat', 'studio', 'maisonette'],
    'house': ['terraced', 'semi-detached', 'detached', 'townhouse', 'bungalow'],
    'terraced': ['house', 'townhouse', 'semi-detached'],
    'semi-detached': ['house', 'terraced', 'detached'],
    'detached': ['house', 'semi-detached', 'bungalow'],
    'studio': ['flat', 'apartment', 'bedsit'],
    'room': ['shared house', 'houseshare', 'flatshare', 'shared flat'],
    'shared house': ['room', 'houseshare', 'flatshare'],
    'houseshare': ['room', 'shared house', 'flatshare'],
    'flatshare': ['room', 'shared flat', 'houseshare'],
    'shared flat': ['room', 'flatshare', 'houseshare'],
    'student hall': ['purpose built', 'student accommodation', 'university accommodation'],
    'purpose built': ['student hall', 'student accommodation'],
    'student accommodation': ['student hall', 'purpose built', 'university accommodation']
  };
  
  const normalizedType = propertyType.toLowerCase().trim();
  
  // Return similar types if available, or an empty array if not
  return similarityMap[normalizedType] || [];
}

/**
 * Check if a location is near another location
 * @param preferredLocation The tenant's preferred location
 * @param propertyLocation The property's location
 * @returns True if the locations are considered nearby
 */
function isNearbyLocation(preferredLocation: string, propertyLocation: string): boolean {
  if (!preferredLocation || !propertyLocation) return false;
  
  const normPreferred = preferredLocation.toLowerCase().trim();
  const normProperty = propertyLocation.toLowerCase().trim();
  
  // If exact match, return true immediately
  if (normProperty.includes(normPreferred) || normPreferred.includes(normProperty)) {
    return true;
  }
  
  // Map of areas that are considered nearby to each other
  const nearbyAreasMap: Record<string, string[]> = {
    // London areas
    'camden': ['kings cross', 'euston', 'bloomsbury', 'primrose hill', 'kentish town'],
    'islington': ['angel', 'kings cross', 'highbury', 'finsbury park', 'archway'],
    'hackney': ['shoreditch', 'dalston', 'stoke newington', 'clapton', 'homerton'],
    'tower hamlets': ['whitechapel', 'mile end', 'bow', 'stepney', 'poplar', 'canary wharf'],
    'southwark': ['borough', 'bermondsey', 'peckham', 'dulwich', 'elephant and castle'],
    'lambeth': ['waterloo', 'brixton', 'clapham', 'streatham', 'vauxhall'],
    
    // Manchester areas
    'manchester city centre': ['northern quarter', 'ancoats', 'castlefield', 'deansgate', 'spinningfields'],
    'fallowfield': ['withington', 'rusholme', 'moss side', 'longsight', 'victoria park'],
    'didsbury': ['west didsbury', 'east didsbury', 'withington', 'burnage'],
    'chorlton': ['whalley range', 'firswood', 'old trafford', 'stretford'],
    
    // Birmingham areas
    'edgbaston': ['harborne', 'selly oak', 'bournville', 'birmingham city centre'],
    'selly oak': ['edgbaston', 'harborne', 'bournville', 'cotteridge'],
    'moseley': ['kings heath', 'balsall heath', 'sparkhill', 'hall green'],
    
    // Leeds areas
    'headingley': ['hyde park', 'meanwood', 'kirkstall', 'woodhouse', 'burley'],
    'city centre': ['holbeck', 'armley', 'hunslet', 'woodhouse'],
    
    // Bristol areas
    'clifton': ['redland', 'cotham', 'hotwells', 'bristol city centre'],
    'bedminster': ['southville', 'ashton', 'totterdown', 'windmill hill'],
    
    // Nottingham areas
    'lenton': ['radford', 'dunkirk', 'nottingham city centre', 'wollaton'],
    'beeston': ['dunkirk', 'wollaton', 'lenton', 'university park'],
    
    // Sheffield areas
    'broomhill': ['crookes', 'ecclesall', 'sheffield city centre', 'walkley'],
    'ecclesall road': ['broomhill', 'hunter\'s bar', 'sharrow', 'nether edge'],
    
    // Newcastle areas
    'jesmond': ['heaton', 'sandyford', 'gosforth', 'newcastle city centre'],
    'heaton': ['jesmond', 'byker', 'sandyford', 'walker'],
    
    // General university areas
    'university': ['campus', 'college', 'student village']
  };
  
  // Check if the property location is in the nearby areas of the preferred location
  for (const [area, nearbyAreas] of Object.entries(nearbyAreasMap)) {
    if (normPreferred.includes(area)) {
      if (nearbyAreas.some(nearby => normProperty.includes(nearby))) {
        return true;
      }
    }
    
    if (normProperty.includes(area)) {
      if (nearbyAreas.some(nearby => normPreferred.includes(nearby))) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Get suggested tenants for a property
 * @param propertyId Property ID
 * @param count Number of suggestions to return
 * @returns List of suggested tenants with match scores
 */
export async function getSuggestedTenantsForProperty(
  propertyId: number,
  count: number = 5
): Promise<Array<{tenant: User, score: number, reasons: string[]}>> {
  try {
    // 1. Get property details
    const property = await storage.getProperty(propertyId);
    if (!property) {
      throw new Error('Property not found');
    }
    
    // 2. Get all tenant users
    const tenants = await storage.getUsersByType('tenant');
    
    // 3. Score each tenant for this property
    const scoredTenants = await Promise.all(
      tenants.map(async tenant => {
        const matchResult = await matchTenantToProperty(tenant.id, propertyId);
        return {
          tenant,
          score: typeof matchResult.matchScore === 'string' ? 
                 parseInt(matchResult.matchScore) : 
                 matchResult.matchScore,
          reasons: matchResult.matchReasons
        };
      })
    );
    
    // 4. Sort by score (descending) and take the top 'count'
    return scoredTenants
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
    
  } catch (error) {
    console.error('Error getting suggested tenants for property:', error);
    return [];
  }
}