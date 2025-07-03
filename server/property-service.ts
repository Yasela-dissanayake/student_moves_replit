/**
 * Property Service
 * Provides AI-powered text generation and property assistance using our AI service manager
 */
import { executeAIOperation } from "./ai-service-manager";
import { log } from "./vite";

// Log initialization
log("AI property service initialized", "property-service");

/**
 * Generate a property description based on provided details
 * @param propertyDetails Property details to include in the description
 * @returns Generated property description
 */
export async function generatePropertyDescription(propertyDetails: {
  title: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  city: string;
  area: string;
  nearbyUniversities?: string[];
  features?: string[];
  billsIncluded?: boolean;
  includedBills?: string[];
  rentPerWeek?: number;
  rentPerMonth?: number;
  securityDeposit?: number;
  availableFrom?: string;
  minimumTenancyMonths?: number;
  furnishingStatus?: string;
  petPolicy?: string;
  epcRating?: string;
  tone?: "professional" | "casual" | "luxury" | "student-focused";
}): Promise<string> {
  try {
    // Use AI service manager to generate property description
    const result = await executeAIOperation('generatePropertyDescription', propertyDetails);
    return result as string;
  } catch (error) {
    log(`Error generating property description: ${error}`, "property-service", "error");
    return "Unable to generate property description at this time.";
  }
}

/**
 * Answer student housing queries using AI
 * @param query The student's question
 * @param context Optional context to include
 * @returns AI-generated answer
 */
export async function answerStudentHousingQuery(query: string, context?: string): Promise<string> {
  try {
    // Create prompt for the AI
    const prompt = `Answer the following student housing question:
    
    Question: ${query}
    ${context ? `\nAdditional context: ${context}` : ''}
    
    Provide a helpful, informative response focusing on UK student accommodation standards, tenant rights, and best practices. Include references to relevant regulations when appropriate.`;
    
    // Use AI service manager to generate response
    const result = await executeAIOperation('generateText', {
      prompt,
      maxTokens: 1000
    });
    
    return result as string;
  } catch (error) {
    log(`Error answering student housing query: ${error}`, "property-service", "error");
    return "I'm sorry, I'm unable to answer your question at this time. Please try again later.";
  }
}

/**
 * Generate marketing content for properties
 * @param marketingRequest Marketing request details
 * @returns Generated marketing content
 */
export async function generateMarketingContent(
  marketingRequest: {
    propertyId?: number;
    propertyType: string;
    contentType: "social_media" | "email" | "listing" | "brochure" | "advertisement";
    targetAudience: "students" | "young_professionals" | "families" | "investors";
    keyFeatures?: string[];
    tone?: "professional" | "casual" | "luxury" | "urgent";
    maxLength?: number;
    includeCall?: boolean;
    customRequirements?: string;
  }
): Promise<string> {
  try {
    // Create prompt for the AI
    const prompt = `Generate marketing content for a ${marketingRequest.propertyType} property with the following specifications:
    
    Content type: ${marketingRequest.contentType}
    Target audience: ${marketingRequest.targetAudience}
    ${marketingRequest.keyFeatures?.length ? `Key features: ${marketingRequest.keyFeatures.join(', ')}` : ''}
    Tone: ${marketingRequest.tone || 'professional'}
    ${marketingRequest.maxLength ? `Maximum length: ${marketingRequest.maxLength} characters` : ''}
    ${marketingRequest.includeCall ? 'Include a call to action' : ''}
    ${marketingRequest.customRequirements ? `Additional requirements: ${marketingRequest.customRequirements}` : ''}
    
    Create compelling, engaging content that highlights the property's value proposition for ${marketingRequest.targetAudience}.`;
    
    // Use AI service manager to generate content
    const result = await executeAIOperation('generateText', {
      prompt,
      maxTokens: marketingRequest.maxLength ? Math.min(Math.ceil(marketingRequest.maxLength / 4), 1500) : 1000
    });
    
    return result as string;
  } catch (error) {
    log(`Error generating marketing content: ${error}`, "property-service", "error");
    return "Unable to generate marketing content at this time.";
  }
}

/**
 * Analyze property feedback from tenants
 * @param feedback Array of feedback strings from tenants
 * @returns Analysis of feedback with insights and recommended actions
 */
export async function analyzePropertyFeedback(feedback: string[]): Promise<{
  summary: string;
  positivePoints: string[];
  negativePoints: string[];
  commonIssues: string[];
  recommendedActions: string[];
  sentimentScore: number;
}> {
  try {
    // Default response structure
    const defaultResponse = {
      summary: "Unable to analyze feedback",
      positivePoints: [],
      negativePoints: [],
      commonIssues: [],
      recommendedActions: [],
      sentimentScore: 0
    };
    
    if (!feedback || feedback.length === 0) {
      return defaultResponse;
    }
    
    // Create prompt for the AI
    const prompt = `Analyze the following tenant feedback for a property:
    
    ${feedback.map((item, index) => `Feedback ${index + 1}: "${item}"`).join('\n')}
    
    Provide a comprehensive analysis in JSON format with the following structure:
    {
      "summary": "Brief summary of overall feedback sentiment and key themes",
      "positivePoints": ["Array of positive aspects mentioned"],
      "negativePoints": ["Array of negative aspects mentioned"],
      "commonIssues": ["Array of recurring problems identified"],
      "recommendedActions": ["Array of specific actions the landlord should take"],
      "sentimentScore": 0.5 // Number between -1 (very negative) and 1 (very positive)
    }
    
    Focus on extracting actionable insights and practical recommendations for property improvements.`;
    
    // Use AI service manager to analyze feedback
    const result = await executeAIOperation('generateText', {
      prompt,
      responseFormat: 'json',
      maxTokens: 1500
    });
    
    // Parse the result
    let jsonResult;
    try {
      // Handle potential markdown code blocks in response
      let jsonStr = result as string;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }
      
      jsonResult = JSON.parse(jsonStr);
      
      // Ensure all required fields are present
      return {
        summary: jsonResult.summary || defaultResponse.summary,
        positivePoints: jsonResult.positivePoints || defaultResponse.positivePoints,
        negativePoints: jsonResult.negativePoints || defaultResponse.negativePoints,
        commonIssues: jsonResult.commonIssues || defaultResponse.commonIssues,
        recommendedActions: jsonResult.recommendedActions || defaultResponse.recommendedActions,
        sentimentScore: jsonResult.sentimentScore || defaultResponse.sentimentScore
      };
    } catch (parseError) {
      log(`Error parsing feedback analysis result: ${parseError}`, "property-service", "error");
      return defaultResponse;
    }
  } catch (error) {
    log(`Error analyzing property feedback: ${error}`, "property-service", "error");
    return {
      summary: "Unable to analyze feedback due to an error",
      positivePoints: [],
      negativePoints: [],
      commonIssues: [],
      recommendedActions: [],
      sentimentScore: 0
    };
  }
}

/**
 * Generate HMO (Houses in Multiple Occupation) compliance guidance
 * @param propertyDetails Property details for HMO guidance
 * @returns Compliance guidance, requirements, and recommendations
 */
export async function generateHmoComplianceGuidance(propertyDetails: {
  bedrooms: number;
  bathrooms: number;
  city: string;
  hasFireSafety?: boolean;
  hasGasCertificate?: boolean;
  hasElectricalSafety?: boolean;
  lastInspectionDate?: string;
}): Promise<{
  isLikelyHmo: boolean;
  requiredLicenses: string[];
  complianceRequirements: string[];
  recommendedImprovements: string[];
  riskAreas: string[];
  estimatedCosts: {
    licenses: string;
    improvements: string;
    annual: string;
  };
  localAuthorityInfo: string;
}> {
  try {
    // Default response structure
    const defaultResponse = {
      isLikelyHmo: false,
      requiredLicenses: [],
      complianceRequirements: [],
      recommendedImprovements: [],
      riskAreas: [],
      estimatedCosts: {
        licenses: "Unknown",
        improvements: "Unknown",
        annual: "Unknown"
      },
      localAuthorityInfo: ""
    };
    
    // Create prompt for the AI
    const prompt = `Generate HMO (Houses in Multiple Occupation) compliance guidance for a property with the following details:
    
    Number of bedrooms: ${propertyDetails.bedrooms}
    Number of bathrooms: ${propertyDetails.bathrooms}
    City: ${propertyDetails.city}
    Fire safety measures installed: ${propertyDetails.hasFireSafety ? 'Yes' : 'No or Unknown'}
    Gas safety certificate: ${propertyDetails.hasGasCertificate ? 'Yes' : 'No or Unknown'}
    Electrical safety certificate: ${propertyDetails.hasElectricalSafety ? 'Yes' : 'No or Unknown'}
    Last inspection date: ${propertyDetails.lastInspectionDate || 'Unknown'}
    
    Provide a comprehensive analysis in JSON format with the following structure:
    {
      "isLikelyHmo": true/false,
      "requiredLicenses": ["License types required"],
      "complianceRequirements": ["List of legal requirements"],
      "recommendedImprovements": ["Recommendations to ensure compliance"],
      "riskAreas": ["Areas of potential non-compliance"],
      "estimatedCosts": {
        "licenses": "Cost estimate for licenses",
        "improvements": "Cost estimate for recommended improvements",
        "annual": "Annual compliance costs"
      },
      "localAuthorityInfo": "Information about local authority requirements specific to the city"
    }
    
    Focus on UK HMO regulations and provide accurate, up-to-date guidance.`;
    
    // Use AI service manager to generate guidance
    const result = await executeAIOperation('generateText', {
      prompt,
      responseFormat: 'json',
      maxTokens: 1500
    });
    
    // Parse the result
    let jsonResult;
    try {
      // Handle potential markdown code blocks in response
      let jsonStr = result as string;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }
      
      jsonResult = JSON.parse(jsonStr);
      
      // Ensure all required fields are present
      return {
        isLikelyHmo: jsonResult.isLikelyHmo ?? defaultResponse.isLikelyHmo,
        requiredLicenses: jsonResult.requiredLicenses || defaultResponse.requiredLicenses,
        complianceRequirements: jsonResult.complianceRequirements || defaultResponse.complianceRequirements,
        recommendedImprovements: jsonResult.recommendedImprovements || defaultResponse.recommendedImprovements,
        riskAreas: jsonResult.riskAreas || defaultResponse.riskAreas,
        estimatedCosts: {
          licenses: jsonResult.estimatedCosts?.licenses || defaultResponse.estimatedCosts.licenses,
          improvements: jsonResult.estimatedCosts?.improvements || defaultResponse.estimatedCosts.improvements,
          annual: jsonResult.estimatedCosts?.annual || defaultResponse.estimatedCosts.annual
        },
        localAuthorityInfo: jsonResult.localAuthorityInfo || defaultResponse.localAuthorityInfo
      };
    } catch (parseError) {
      log(`Error parsing HMO guidance result: ${parseError}`, "property-service", "error");
      return defaultResponse;
    }
  } catch (error) {
    log(`Error generating HMO compliance guidance: ${error}`, "property-service", "error");
    return {
      isLikelyHmo: false,
      requiredLicenses: [],
      complianceRequirements: [],
      recommendedImprovements: [],
      riskAreas: [],
      estimatedCosts: {
        licenses: "Unable to estimate due to an error",
        improvements: "Unable to estimate due to an error",
        annual: "Unable to estimate due to an error"
      },
      localAuthorityInfo: "Unable to provide information due to an error"
    };
  }
}

/**
 * Generate insights for matching tenants to properties
 * @param matchingRequest Details for tenant-property matching
 * @returns Matching insights and compatibility analysis
 */
export async function generateTenantMatchingInsights(
  matchingRequest: {
    tenantPreferences: {
      budget: number;
      location: string;
      propertyType?: string;
      bedroomsNeeded: number;
      amenities?: string[];
      moveInDate?: string;
      tenancyLength?: number;
      lifestyle?: string[];
    };
    property: {
      id: number;
      title: string;
      propertyType: string;
      bedrooms: number;
      bathrooms: number;
      location: string;
      area: string;
      rentPerMonth: number;
      availableFrom: string;
      furnishingStatus?: string;
      features?: string[];
      nearbyUniversities?: string[];
      billsIncluded?: boolean;
      includedBills?: string[];
    };
  }
): Promise<{
  compatibilityScore: number;
  matchStrengths: string[];
  potentialIssues: string[];
  recommendations: string[];
  analysis: string;
}> {
  try {
    // Default response structure
    const defaultResponse = {
      compatibilityScore: 0,
      matchStrengths: [],
      potentialIssues: [],
      recommendations: [],
      analysis: "Unable to generate matching insights"
    };
    
    // Create prompt for the AI
    const prompt = `Analyze the compatibility between a tenant and property with the following details:
    
    TENANT PREFERENCES:
    Budget: £${matchingRequest.tenantPreferences.budget} per month
    Location: ${matchingRequest.tenantPreferences.location}
    Property type preferred: ${matchingRequest.tenantPreferences.propertyType || 'Not specified'}
    Bedrooms needed: ${matchingRequest.tenantPreferences.bedroomsNeeded}
    Desired amenities: ${matchingRequest.tenantPreferences.amenities?.join(', ') || 'Not specified'}
    Move-in date: ${matchingRequest.tenantPreferences.moveInDate || 'Flexible'}
    Tenancy length: ${matchingRequest.tenantPreferences.tenancyLength ? matchingRequest.tenantPreferences.tenancyLength + ' months' : 'Not specified'}
    Lifestyle factors: ${matchingRequest.tenantPreferences.lifestyle?.join(', ') || 'Not specified'}
    
    PROPERTY DETAILS:
    Property ID: ${matchingRequest.property.id}
    Title: ${matchingRequest.property.title}
    Type: ${matchingRequest.property.propertyType}
    Bedrooms: ${matchingRequest.property.bedrooms}
    Bathrooms: ${matchingRequest.property.bathrooms}
    Location: ${matchingRequest.property.location}
    Area: ${matchingRequest.property.area}
    Rent: £${matchingRequest.property.rentPerMonth} per month
    Available from: ${matchingRequest.property.availableFrom}
    Furnishing: ${matchingRequest.property.furnishingStatus || 'Not specified'}
    Features: ${matchingRequest.property.features?.join(', ') || 'None listed'}
    Nearby universities: ${matchingRequest.property.nearbyUniversities?.join(', ') || 'None listed'}
    Bills included: ${matchingRequest.property.billsIncluded ? 'Yes' : 'No'}
    ${matchingRequest.property.billsIncluded ? `Included bills: ${matchingRequest.property.includedBills?.join(', ') || 'Not specified'}` : ''}
    
    Provide a comprehensive analysis in JSON format with the following structure:
    {
      "compatibilityScore": 85, // 0-100 score
      "matchStrengths": ["List of strong compatibility points"],
      "potentialIssues": ["List of potential mismatches or concerns"],
      "recommendations": ["Suggested actions or points to discuss"],
      "analysis": "Detailed paragraph analyzing the overall match quality"
    }
    
    Focus on practical insights that would help a letting agent or landlord determine if this is a good match.`;
    
    // Use AI service manager to generate matching insights
    const result = await executeAIOperation('generateText', {
      prompt,
      responseFormat: 'json',
      maxTokens: 1500
    });
    
    // Parse the result
    let jsonResult;
    try {
      // Handle potential markdown code blocks in response
      let jsonStr = result as string;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }
      
      jsonResult = JSON.parse(jsonStr);
      
      // Ensure all required fields are present
      return {
        compatibilityScore: jsonResult.compatibilityScore ?? defaultResponse.compatibilityScore,
        matchStrengths: jsonResult.matchStrengths || defaultResponse.matchStrengths,
        potentialIssues: jsonResult.potentialIssues || defaultResponse.potentialIssues,
        recommendations: jsonResult.recommendations || defaultResponse.recommendations,
        analysis: jsonResult.analysis || defaultResponse.analysis
      };
    } catch (parseError) {
      log(`Error parsing tenant matching result: ${parseError}`, "property-service", "error");
      return defaultResponse;
    }
  } catch (error) {
    log(`Error generating tenant matching insights: ${error}`, "property-service", "error");
    return defaultResponse;
  }
}

/**
 * Check if the AI property service is available
 * @returns Status object with availability and message
 */
export async function checkPropertyServiceStatus(): Promise<{
  available: boolean;
  message: string;
}> {
  try {
    // Test the AI service with a simple query
    const testResult = await executeAIOperation('generateText', {
      prompt: "Generate a single word response: 'working'",
      maxTokens: 50
    });
    
    const isWorking = typeof testResult === 'string' && 
                      testResult.toLowerCase().includes('working');
    
    return {
      available: isWorking,
      message: isWorking 
        ? "AI property service is operational" 
        : "AI property service is available but may not be functioning correctly"
    };
  } catch (error) {
    log(`Error checking property service status: ${error}`, "property-service", "error");
    return {
      available: false,
      message: `AI property service is not available: ${error.message || "Unknown error"}`
    };
  }
}