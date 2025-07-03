/**
 * Gemini Property Service
 * Provides AI-powered text generation and property assistance using Google Gemini
 */
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { log } from "./vite";

// Validate Gemini API key
const apiKey = process.env.GEMINI_API_KEY;
let isValidApiKey = false;

if (!apiKey) {
  log("WARNING: GEMINI_API_KEY is not set", "gemini-property");
} else {
  isValidApiKey = true;
  // Mask the key for logging (show first 4 chars and last 4 chars)
  const maskedKey = apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4);
  log(`Gemini API key configured: ${maskedKey}`, "gemini-property");
}

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(apiKey || "");
log("Gemini property service initialized", "gemini-property");

// Safety settings to avoid harmful content
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

/**
 * Generate a property description using Gemini AI
 * @param propertyDetails - Details about the property
 * @returns AI-generated property description
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
}): Promise<string> {
  if (!isValidApiKey) {
    console.warn('Gemini API key not configured. Using fallback description.');
    return `A spacious ${propertyDetails.bedrooms} bedroom ${propertyDetails.propertyType.toLowerCase()} located in ${propertyDetails.area}, ${propertyDetails.city}. Perfect for students.`;
  }

  const universityInfo = propertyDetails.nearbyUniversities?.length 
    ? `near ${propertyDetails.nearbyUniversities.join(', ')}` 
    : '';
  
  const billsInfo = propertyDetails.billsIncluded 
    ? `This property includes all bills (${propertyDetails.includedBills?.join(', ')}).` 
    : '';

  const featuresInfo = propertyDetails.features?.length 
    ? `Property features: ${propertyDetails.features.join(', ')}` 
    : '';

  const prompt = `
    Generate an engaging and detailed property description for a student rental property with the following details:
    - Type: ${propertyDetails.propertyType}
    - Bedrooms: ${propertyDetails.bedrooms}
    - Bathrooms: ${propertyDetails.bathrooms}
    - Location: ${propertyDetails.area}, ${propertyDetails.city} ${universityInfo}
    - Property title: ${propertyDetails.title}
    ${billsInfo}
    ${featuresInfo}

    The description should be 2-3 paragraphs, emphasize student-friendly aspects, highlight the convenient location 
    for university students, and stress the attractive features of this property.
    
    Write in a professional but appealing tone suitable for student accommodation listings.
  `;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro", 
      safetySettings,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });

    const result = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [{ 
          text: `You are a professional property description writer for a student accommodation platform. 
          Write engaging, accurate and concise property descriptions that highlight key features for student renters.
          
          ${prompt}`
        }] 
      }]
    });

    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Failed to generate property description with Gemini:', error);
    return `A spacious ${propertyDetails.bedrooms} bedroom ${propertyDetails.propertyType.toLowerCase()} located in ${propertyDetails.area}, ${propertyDetails.city}. Perfect for students.`;
  }
}

/**
 * Generate a response to a student housing query
 * @param query - The student's question
 * @param context - Additional context about the property or platform
 * @returns AI-generated response to the query
 */
export async function answerStudentHousingQuery(query: string, context?: string): Promise<string> {
  if (!isValidApiKey) {
    console.warn('Gemini API key not configured. Unable to answer query.');
    return 'I apologize, but I cannot answer your question at the moment. Please contact our support team for assistance.';
  }

  const contextInfo = context ? `\nAdditional context: ${context}` : '';

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro", 
      safetySettings,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 300,
      }
    });

    const result = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [{ 
          text: `You are a helpful assistant for a student housing platform. Provide accurate, concise, and friendly responses 
          to questions about student accommodation. ${contextInfo}
          
          Student's question: ${query}`
        }] 
      }]
    });

    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Failed to answer student housing query with Gemini:', error);
    return 'I apologize, but I cannot answer your question at the moment. Please contact our support team for assistance.';
  }
}

/**
 * Generate marketing content for properties
 * @param propertyDetails - Details about the property
 * @param targetAudience - Target demographic (e.g., "students", "international students")
 * @param contentType - Type of content to generate (e.g., "email", "social", "listing")
 * @returns AI-generated marketing content
 */
export async function generateMarketingContent(
  propertyDetails: object,
  targetAudience: string,
  contentType: 'email' | 'social' | 'listing'
): Promise<string> {
  if (!isValidApiKey) {
    console.warn('Gemini API key not configured. Using fallback marketing content.');
    return `Check out our latest student property! Perfect for ${targetAudience}.`;
  }

  const contentTypePrompt = contentType === 'email' 
    ? 'Write an engaging email subject line and body for a property marketing email.' 
    : contentType === 'social' 
      ? 'Write a catchy social media post (under 280 characters) to advertise this property.' 
      : 'Write an attention-grabbing property listing title and description.';

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro", 
      safetySettings,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 500,
      }
    });

    const result = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [{ 
          text: `You are a property marketing specialist creating content for student accommodation. 
          Your audience is ${targetAudience}.
          
          ${contentTypePrompt}
            
          Property details:
          ${JSON.stringify(propertyDetails, null, 2)}
            
          Focus on aspects that would appeal to ${targetAudience}.`
        }] 
      }]
    });

    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Failed to generate marketing content with Gemini:', error);
    return `Check out our latest student property! Perfect for ${targetAudience}.`;
  }
}

/**
 * Generate property feedback analysis
 * @param feedback - Student feedback about properties
 * @returns Analysis of feedback with key insights
 */
export async function analyzePropertyFeedback(feedback: string[]): Promise<{
  sentimentScore: number;
  keyIssues: string[];
  positiveHighlights: string[];
  summary: string;
}> {
  if (!isValidApiKey) {
    console.warn('Gemini API key not configured. Using fallback feedback analysis.');
    return {
      sentimentScore: 0.5,
      keyIssues: ['No specific issues identified'],
      positiveHighlights: ['No specific highlights identified'],
      summary: 'Feedback analysis is not available at this time.'
    };
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro", 
      safetySettings,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      }
    });

    const prompt = `
      Analyze the following student feedback about properties:
        
      ${feedback.join('\n\n')}
        
      Provide your analysis in JSON format with the following structure:
      {
        "sentimentScore": number between 0-1,
        "keyIssues": array of strings,
        "positiveHighlights": array of strings,
        "summary": string summary of analysis
      }
    `;

    const result = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [{ text: prompt }] 
      }]
    });

    const response = result.response;
    const analysisText = response.text().trim();
    
    try {
      // Extract JSON from the response (handling potential text before/after JSON)
      const jsonMatch = analysisText.match(/({[\s\S]*})/);
      const analysisJson = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      
      if (analysisJson) {
        return {
          sentimentScore: analysisJson.sentimentScore || 0.5,
          keyIssues: analysisJson.keyIssues || ['No specific issues identified'],
          positiveHighlights: analysisJson.positiveHighlights || ['No specific highlights identified'],
          summary: analysisJson.summary || 'Feedback analysis completed.'
        };
      }
      
      throw new Error('Failed to parse JSON from Gemini response');
    } catch (parseError) {
      console.error('Failed to parse feedback analysis JSON:', parseError);
      return {
        sentimentScore: 0.5,
        keyIssues: ['Error analyzing feedback'],
        positiveHighlights: ['Error analyzing feedback'],
        summary: 'An error occurred during feedback analysis.'
      };
    }
  } catch (error) {
    console.error('Failed to analyze property feedback with Gemini:', error);
    return {
      sentimentScore: 0.5,
      keyIssues: ['Error analyzing feedback'],
      positiveHighlights: ['Error analyzing feedback'],
      summary: 'An error occurred during feedback analysis.'
    };
  }
}

/**
 * Generate HMO compliance requirements and recommendations
 * @param propertyDetails - Details about the property
 * @returns HMO compliance requirements and recommendations
 */
export async function generateHmoComplianceGuidance(propertyDetails: {
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  city: string;
  area: string;
  tenantCount?: number;
  storeys?: number;
  features?: string[];
}): Promise<{
  requiresLicense: boolean;
  licenseType: string;
  requirements: string[];
  recommendations: string[];
  estimatedCost: string;
  nextSteps: string[];
}> {
  if (!isValidApiKey) {
    console.warn('Gemini API key not configured. Using fallback HMO guidance.');
    return {
      requiresLicense: propertyDetails.bedrooms >= 5,
      licenseType: propertyDetails.bedrooms >= 5 ? 'Mandatory HMO License' : 'No license required',
      requirements: ['Fire safety measures', 'Adequate living space', 'Proper sanitation'],
      recommendations: ['Regular property inspections', 'Clear tenant communication'],
      estimatedCost: '£500 - £1,000',
      nextSteps: ['Contact local council for specific requirements']
    };
  }

  const tenantCount = propertyDetails.tenantCount || propertyDetails.bedrooms;
  const storeys = propertyDetails.storeys || 2;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro", 
      safetySettings,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      }
    });

    const prompt = `
      Generate HMO compliance guidance for a property with the following details:
        
      Property Type: ${propertyDetails.propertyType}
      Bedrooms: ${propertyDetails.bedrooms}
      Bathrooms: ${propertyDetails.bathrooms}
      Location: ${propertyDetails.area}, ${propertyDetails.city}
      Expected tenant count: ${tenantCount}
      Number of storeys: ${storeys}
      Features: ${propertyDetails.features?.join(', ') || 'Not specified'}
        
      Provide your guidance in JSON format with the following structure:
      {
        "requiresLicense": boolean,
        "licenseType": string,
        "requirements": array of strings,
        "recommendations": array of strings,
        "estimatedCost": string,
        "nextSteps": array of strings
      }
        
      Base your assessment on current UK HMO regulations. A property is generally considered an HMO if at least 3 tenants live there, forming more than 1 household, and sharing toilet, bathroom, or kitchen facilities.
    `;

    const result = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [{ 
          text: `You are an expert on UK HMO (Houses in Multiple Occupation) regulations and compliance requirements. 
          Provide accurate, detailed, and helpful guidance on HMO compliance for landlords and agents.
          
          ${prompt}` 
        }] 
      }]
    });

    const response = result.response;
    const guidanceText = response.text().trim();
    
    try {
      // Extract JSON from the response (handling potential text before/after JSON)
      const jsonMatch = guidanceText.match(/({[\s\S]*})/);
      const guidanceJson = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      
      if (guidanceJson) {
        return {
          requiresLicense: guidanceJson.requiresLicense === true,
          licenseType: guidanceJson.licenseType || 'Unknown',
          requirements: guidanceJson.requirements || ['Requirements not specified'],
          recommendations: guidanceJson.recommendations || ['Recommendations not specified'],
          estimatedCost: guidanceJson.estimatedCost || 'Cost not specified',
          nextSteps: guidanceJson.nextSteps || ['Contact local council for specific requirements']
        };
      }
      
      throw new Error('Failed to parse JSON from Gemini response');
    } catch (parseError) {
      console.error('Failed to parse HMO guidance JSON:', parseError);
      return {
        requiresLicense: propertyDetails.bedrooms >= 5,
        licenseType: propertyDetails.bedrooms >= 5 ? 'Mandatory HMO License' : 'No license required',
        requirements: ['Fire safety measures', 'Adequate living space', 'Proper sanitation'],
        recommendations: ['Regular property inspections', 'Clear tenant communication'],
        estimatedCost: '£500 - £1,000',
        nextSteps: ['Contact local council for specific requirements']
      };
    }
  } catch (error) {
    console.error('Failed to generate HMO compliance guidance with Gemini:', error);
    return {
      requiresLicense: propertyDetails.bedrooms >= 5,
      licenseType: propertyDetails.bedrooms >= 5 ? 'Mandatory HMO License' : 'No license required',
      requirements: ['Fire safety measures', 'Adequate living space', 'Proper sanitation'],
      recommendations: ['Regular property inspections', 'Clear tenant communication'],
      estimatedCost: '£500 - £1,000',
      nextSteps: ['Contact local council for specific requirements']
    };
  }
}

/**
 * Generate tenant matching insights
 * @param tenantPreferences - Tenant preferences
 * @param availableProperties - Available properties
 * @returns Tenant-property match insights
 */
export async function generateTenantMatchingInsights(
  tenantPreferences: object,
  availableProperties: object[]
): Promise<{
  topMatches: Array<{
    propertyId: number;
    matchScore: number;
    matchReasons: string[];
  }>;
  recommendedFeatures: string[];
  considerationFactors: string[];
}> {
  if (!isValidApiKey) {
    console.warn('Gemini API key not configured. Using fallback matching insights.');
    return {
      topMatches: [],
      recommendedFeatures: ['Proximity to university', 'Included bills', 'Furnished'],
      considerationFactors: ['Budget', 'Location', 'Number of bedrooms']
    };
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro", 
      safetySettings,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1500,
      }
    });

    const prompt = `
      Analyze the tenant preferences and available properties to find the best matches.
      
      Tenant Preferences:
      ${JSON.stringify(tenantPreferences, null, 2)}
      
      Available Properties (${availableProperties.length} properties):
      ${JSON.stringify(availableProperties, null, 2)}
      
      Provide JSON output with:
      1. Top 3 matching properties with property IDs, match scores (0-100), and reasons for each match
      2. Recommended features the tenant should consider
      3. Important factors that should be considered when making a decision
      
      Format your response as a JSON object with these exact fields:
      {
        "topMatches": [
          { "propertyId": number, "matchScore": number, "matchReasons": [string] }
        ],
        "recommendedFeatures": [string],
        "considerationFactors": [string]
      }
    `;

    const result = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [{ 
          text: `You are a student accommodation specialist helping match tenants with appropriate properties.
          
          ${prompt}` 
        }] 
      }]
    });

    const response = result.response;
    const insightsText = response.text().trim();
    
    try {
      // Extract JSON from the response
      const jsonMatch = insightsText.match(/({[\s\S]*})/);
      const matchJson = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      
      if (matchJson) {
        return {
          topMatches: matchJson.topMatches || [],
          recommendedFeatures: matchJson.recommendedFeatures || ['Proximity to university', 'Included bills', 'Furnished'],
          considerationFactors: matchJson.considerationFactors || ['Budget', 'Location', 'Number of bedrooms']
        };
      }
      
      throw new Error('Failed to parse JSON from Gemini response');
    } catch (parseError) {
      console.error('Failed to parse tenant matching insights JSON:', parseError);
      return {
        topMatches: [],
        recommendedFeatures: ['Proximity to university', 'Included bills', 'Furnished'],
        considerationFactors: ['Budget', 'Location', 'Number of bedrooms']
      };
    }
  } catch (error) {
    console.error('Failed to generate tenant matching insights with Gemini:', error);
    return {
      topMatches: [],
      recommendedFeatures: ['Proximity to university', 'Included bills', 'Furnished'],
      considerationFactors: ['Budget', 'Location', 'Number of bedrooms']
    };
  }
}

/**
 * Check if Gemini API is configured and working
 * @returns Status of the Gemini API
 */
export async function checkGeminiPropertyApiStatus(): Promise<{
  isConfigured: boolean;
  isWorking: boolean;
  errorMessage?: string;
}> {
  if (!isValidApiKey) {
    return {
      isConfigured: false,
      isWorking: false,
      errorMessage: 'Gemini API key not configured'
    };
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro", 
      safetySettings,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 10,
      }
    });

    await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [{ text: 'Hello, this is a test message.' }] 
      }]
    });

    return {
      isConfigured: true,
      isWorking: true
    };
  } catch (error) {
    return {
      isConfigured: true,
      isWorking: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}