/**
 * DeepSeek AI Integration Service
 * Provides AI-powered text generation and property assistance
 */
import axios from 'axios';

// DeepSeek API Configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Check if DeepSeek API key is configured
const isDeepSeekConfigured = !!DEEPSEEK_API_KEY;

// Available DeepSeek models
export const DEEPSEEK_MODELS = {
  CHAT: 'deepseek-chat',
  CODER: 'deepseek-coder',
  LITE: 'deepseek-lite'
};

// Model to use for property descriptions and features
const DEFAULT_MODEL = DEEPSEEK_MODELS.CHAT;

/**
 * Interface for DeepSeek API request
 */
export interface DeepSeekRequest {
  model: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * Interface for DeepSeek API response
 */
export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Generate a property description using DeepSeek AI
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
  if (!isDeepSeekConfigured) {
    console.warn('DeepSeek API key not configured. Using fallback description.');
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
    const response = await callDeepSeekAPI({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a professional property description writer for a student accommodation platform. Write engaging, accurate and concise property descriptions that highlight key features for student renters.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Failed to generate property description with DeepSeek:', error);
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
  if (!isDeepSeekConfigured) {
    console.warn('DeepSeek API key not configured. Unable to answer query.');
    return 'I apologize, but I cannot answer your question at the moment. Please contact our support team for assistance.';
  }

  const contextInfo = context ? `\nAdditional context: ${context}` : '';

  try {
    const response = await callDeepSeekAPI({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant for a student housing platform. Provide accurate, concise, and friendly responses to questions about student accommodation. ${contextInfo}`
        },
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.5,
      max_tokens: 300
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Failed to answer student housing query with DeepSeek:', error);
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
  if (!isDeepSeekConfigured) {
    console.warn('DeepSeek API key not configured. Using fallback marketing content.');
    return `Check out our latest student property! Perfect for ${targetAudience}.`;
  }

  const contentTypePrompt = contentType === 'email' 
    ? 'Write an engaging email subject line and body for a property marketing email.' 
    : contentType === 'social' 
      ? 'Write a catchy social media post (under 280 characters) to advertise this property.' 
      : 'Write an attention-grabbing property listing title and description.';

  try {
    const response = await callDeepSeekAPI({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a property marketing specialist creating content for student accommodation. Your audience is ${targetAudience}.`
        },
        {
          role: 'user',
          content: `${contentTypePrompt}
            
            Property details:
            ${JSON.stringify(propertyDetails, null, 2)}
            
            Focus on aspects that would appeal to ${targetAudience}.`
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Failed to generate marketing content with DeepSeek:', error);
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
  if (!isDeepSeekConfigured) {
    console.warn('DeepSeek API key not configured. Using fallback feedback analysis.');
    return {
      sentimentScore: 0.5,
      keyIssues: ['No specific issues identified'],
      positiveHighlights: ['No specific highlights identified'],
      summary: 'Feedback analysis is not available at this time.'
    };
  }

  try {
    const response = await callDeepSeekAPI({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a property feedback analyst. Analyze student feedback about properties and provide a structured analysis with sentiment score (0-1), key issues, positive highlights, and a summary.'
        },
        {
          role: 'user',
          content: `Analyze the following student feedback about properties:
            
            ${feedback.join('\n\n')}
            
            Provide your analysis in JSON format with the following structure:
            {
              "sentimentScore": number between 0-1,
              "keyIssues": array of strings,
              "positiveHighlights": array of strings,
              "summary": string summary of analysis
            }`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    try {
      const analysisText = response.choices[0].message.content.trim();
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
      
      throw new Error('Failed to parse JSON from DeepSeek response');
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
    console.error('Failed to analyze property feedback with DeepSeek:', error);
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
  if (!isDeepSeekConfigured) {
    console.warn('DeepSeek API key not configured. Using fallback HMO guidance.');
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
    const response = await callDeepSeekAPI({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert on UK HMO (Houses in Multiple Occupation) regulations and compliance requirements. Provide accurate, detailed, and helpful guidance on HMO compliance for landlords and agents.'
        },
        {
          role: 'user',
          content: `Generate HMO compliance guidance for a property with the following details:
            
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
            
            Base your assessment on current UK HMO regulations. A property is generally considered an HMO if at least 3 tenants live there, forming more than 1 household, and sharing toilet, bathroom, or kitchen facilities.`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    try {
      const guidanceText = response.choices[0].message.content.trim();
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
      
      throw new Error('Failed to parse JSON from DeepSeek response');
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
    console.error('Failed to generate HMO compliance guidance with DeepSeek:', error);
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
  if (!isDeepSeekConfigured) {
    console.warn('DeepSeek API key not configured. Using fallback matching insights.');
    return {
      topMatches: [],
      recommendedFeatures: ['Location near university', 'All-inclusive bills'],
      considerationFactors: ['Budget constraints', 'Transportation options']
    };
  }

  try {
    const response = await callDeepSeekAPI({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a student housing expert who specializes in matching students with ideal properties. Analyze tenant preferences and available properties to provide matching insights.'
        },
        {
          role: 'user',
          content: `Generate tenant matching insights based on these tenant preferences and available properties:
            
            Tenant Preferences:
            ${JSON.stringify(tenantPreferences, null, 2)}
            
            Available Properties:
            ${JSON.stringify(availableProperties, null, 2)}
            
            Provide your insights in JSON format with the following structure:
            {
              "topMatches": [
                {
                  "propertyId": number,
                  "matchScore": number between 0-100,
                  "matchReasons": array of strings
                }
              ],
              "recommendedFeatures": array of strings,
              "considerationFactors": array of strings
            }`
        }
      ],
      temperature: 0.4,
      max_tokens: 1000
    });

    try {
      const insightsText = response.choices[0].message.content.trim();
      // Extract JSON from the response (handling potential text before/after JSON)
      const jsonMatch = insightsText.match(/({[\s\S]*})/);
      const insightsJson = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      
      if (insightsJson) {
        return {
          topMatches: insightsJson.topMatches || [],
          recommendedFeatures: insightsJson.recommendedFeatures || ['Location near university', 'All-inclusive bills'],
          considerationFactors: insightsJson.considerationFactors || ['Budget constraints', 'Transportation options']
        };
      }
      
      throw new Error('Failed to parse JSON from DeepSeek response');
    } catch (parseError) {
      console.error('Failed to parse tenant matching insights JSON:', parseError);
      return {
        topMatches: [],
        recommendedFeatures: ['Location near university', 'All-inclusive bills'],
        considerationFactors: ['Budget constraints', 'Transportation options']
      };
    }
  } catch (error) {
    console.error('Failed to generate tenant matching insights with DeepSeek:', error);
    return {
      topMatches: [],
      recommendedFeatures: ['Location near university', 'All-inclusive bills'],
      considerationFactors: ['Budget constraints', 'Transportation options']
    };
  }
}

/**
 * Call the DeepSeek API with the provided request
 * @param request - The DeepSeek API request
 * @returns The DeepSeek API response
 */
async function callDeepSeekAPI(request: DeepSeekRequest): Promise<DeepSeekResponse> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key not configured');
  }

  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );

    return response.data as DeepSeekResponse;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('DeepSeek API error:', {
        status: error.response.status,
        data: error.response.data
      });
      throw new Error(`DeepSeek API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * Check if DeepSeek API is configured and working
 * @returns True if DeepSeek API is configured and working, false otherwise
 */
export async function checkDeepSeekApiStatus(): Promise<{
  isConfigured: boolean;
  isWorking: boolean;
  errorMessage?: string;
}> {
  if (!isDeepSeekConfigured) {
    return {
      isConfigured: false,
      isWorking: false,
      errorMessage: 'DeepSeek API key not configured'
    };
  }

  try {
    await callDeepSeekAPI({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'user',
          content: 'Hello, this is a test message.'
        }
      ],
      max_tokens: 10
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