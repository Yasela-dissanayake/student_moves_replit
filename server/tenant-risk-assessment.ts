/**
 * Tenant Risk Assessment Service
 * AI-powered risk assessment for tenant applications
 */
import { executeAIOperation } from './ai-service-manager';
import { storage } from './storage';

/**
 * Risk assessment result interface
 */
interface RiskAssessmentResult {
  tenantId: number;
  overallRiskScore: number; // 0-100, higher means higher risk
  riskLevel: 'low' | 'medium' | 'high';
  factors: Array<{
    factor: string;
    score: number;
    description: string;
  }>;
  reviews?: Array<{
    source: string;
    content: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    date?: string;
  }>;
  recommendations: string[];
  generatedAt: Date;
}

/**
 * Tenant application risk assessment parameters
 */
interface RiskAssessmentParams {
  tenantId: number;
  applicationId?: number;
  checkReviews?: boolean;
  includeRecommendations?: boolean;
}

/**
 * Review search result interface
 */
interface ReviewSearchResult {
  found: boolean;
  reviews: Array<{
    source: string;
    content: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    date?: string;
  }>;
  overallSentiment: 'positive' | 'negative' | 'neutral';
}

/**
 * Assess tenant application risk using AI
 * @param params Risk assessment parameters
 * @returns Risk assessment result
 */
export async function assessTenantRisk(params: RiskAssessmentParams): Promise<RiskAssessmentResult> {
  const { tenantId, applicationId, checkReviews = true, includeRecommendations = true } = params;
  
  try {
    // Get tenant data
    const tenant = await storage.getUser(tenantId);
    if (!tenant) {
      throw new Error(`Tenant with ID ${tenantId} not found`);
    }
    
    // Get tenant application if available
    let application = null;
    if (applicationId) {
      application = await storage.getApplication(applicationId);
    } else {
      // Get the most recent application
      const applications = await storage.getApplicationsByTenant(tenantId);
      if (applications && applications.length > 0) {
        application = applications[0]; // Most recent application
      }
    }
    
    // Get tenant references if available - temporarily use empty array as references aren't implemented yet
    const references: any[] = [];
    
    // Prepare tenant data for AI assessment
    const tenantData = {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        // Use available user properties for risk assessment
        // Note: occupation and annualIncome would be valuable here but are not in the current schema
        userType: tenant.userType,
        verified: tenant.verified,
        rightToRentVerified: tenant.rightToRentVerified,
        createdAt: tenant.createdAt
      },
      application: application,
      references: references || []
    };
    
    // Find online reviews if requested
    let reviewResults: ReviewSearchResult = {
      found: false,
      reviews: [],
      overallSentiment: 'neutral'
    };
    
    if (checkReviews && tenant.email) {
      reviewResults = await findTenantReviews(tenant.email);
    }
    
    // Generate risk assessment using AI
    const assessmentPrompt = `
      Perform a comprehensive risk assessment for a potential tenant based on the following information:
      
      Tenant Details:
      ${JSON.stringify(tenantData)}
      
      ${reviewResults.found ? `Online Reviews Found:
      ${JSON.stringify(reviewResults.reviews)}` : 'No online reviews found.'}
      
      For your risk assessment:
      1. Analyze all available information including application details, income, occupation, and references
      2. Identify risk factors that may indicate potential tenancy issues
      3. Consider UK housing regulations and compliance requirements
      4. Assign a numeric risk score (0-100, where higher means higher risk) for each identified factor
      5. Calculate an overall risk score and determine a risk level (low, medium, or high)
      ${includeRecommendations ? '6. Provide practical recommendations for the landlord/agent based on the assessment' : ''}
      
      Return a valid JSON object with these fields:
      {
        "overallRiskScore": 0-100,
        "riskLevel": "low" | "medium" | "high",
        "factors": [
          {
            "factor": "Factor name",
            "score": 0-100,
            "description": "Detailed explanation"
          }
        ],
        "recommendations": ["Recommendation 1", "Recommendation 2", ...]
      }
      
      IMPORTANT: Base your assessment only on factual information and legal compliance. Avoid discriminatory factors and ensure the assessment is fair and unbiased. The assessment should comply with UK housing regulations including the Equality Act 2010.
    `;
    
    const assessment = await executeAIOperation('generateText', {
      prompt: assessmentPrompt,
      maxTokens: 5000,
      responseFormat: 'json'
    });
    
    try {
      // Parse the assessment result
      const assessmentResult = JSON.parse(assessment);
      
      // Create the complete risk assessment result
      const result: RiskAssessmentResult = {
        tenantId: tenantId,
        overallRiskScore: assessmentResult.overallRiskScore || 50,
        riskLevel: assessmentResult.riskLevel || 'medium',
        factors: assessmentResult.factors || [],
        recommendations: assessmentResult.recommendations || [],
        generatedAt: new Date()
      };
      
      // Include reviews if found
      if (reviewResults.found && reviewResults.reviews.length > 0) {
        result.reviews = reviewResults.reviews;
      }
      
      // Store the assessment result
      await storage.createTenantRiskAssessment({
        tenantId: tenantId,
        applicationId: applicationId || null,
        assessmentData: JSON.stringify(result),
        overallRiskScore: result.overallRiskScore.toString(),
        riskLevel: result.riskLevel,
        reviewFindings: reviewResults.found ? JSON.stringify({
          found: reviewResults.found,
          reviews: reviewResults.reviews,
          overallSentiment: reviewResults.overallSentiment
        }) : null
      });
      
      return result;
    } catch (parseError) {
      console.error("Error parsing risk assessment result:", parseError);
      throw new Error("Failed to process risk assessment result");
    }
  } catch (error) {
    console.error("Error assessing tenant risk:", error);
    throw error;
  }
}

/**
 * Find online reviews for a tenant using their email address
 * @param email Tenant's email address
 * @returns Review search results
 */
async function findTenantReviews(email: string): Promise<ReviewSearchResult> {
  try {
    const searchPrompt = `
      Search for online reviews or feedback associated with the email address "${email}".
      Focus on reviews related to rental history, previous landlord reviews, property care, 
      payment reliability, and neighborly conduct.
      
      Look for:
      1. Google reviews by or about this person
      2. Rental platform reviews (Airbnb, Booking.com, etc.)
      3. Property management testimonials
      4. Social media mentions related to renting or property maintenance
      
      For each review found, provide:
      - The source platform
      - The review content
      - Sentiment analysis (positive, negative, or neutral)
      - Date of review (if available)
      
      Also provide an overall sentiment analysis based on all found reviews.
      
      Return your findings as a JSON object with this structure:
      {
        "found": true/false,
        "reviews": [
          {
            "source": "platform name",
            "content": "review text",
            "sentiment": "positive/negative/neutral",
            "date": "date if available"
          }
        ],
        "overallSentiment": "positive/negative/neutral"
      }
      
      If no reviews are found, return { "found": false, "reviews": [], "overallSentiment": "neutral" }
      
      IMPORTANT: Only include REAL reviews that you can verify. Do not fabricate or invent reviews.
      If you cannot find any reviews, it's better to return no results than to provide invented ones.
    `;
    
    const searchResults = await executeAIOperation('generateText', {
      prompt: searchPrompt,
      maxTokens: 4000,
      responseFormat: 'json'
    });
    
    try {
      // Parse the search results
      const parsedResults = JSON.parse(searchResults);
      
      return {
        found: parsedResults.found || false,
        reviews: parsedResults.reviews || [],
        overallSentiment: parsedResults.overallSentiment || 'neutral'
      };
    } catch (parseError) {
      console.error("Error parsing tenant review search results:", parseError);
      return {
        found: false,
        reviews: [],
        overallSentiment: 'neutral'
      };
    }
  } catch (error) {
    console.error("Error searching for tenant reviews:", error);
    return {
      found: false,
      reviews: [],
      overallSentiment: 'neutral'
    };
  }
}

/**
 * Get a previously generated risk assessment
 * @param tenantId The tenant ID
 * @param applicationId Optional application ID
 * @returns The most recent risk assessment or null if none exists
 */
export async function getTenantRiskAssessment(tenantId: number, applicationId?: number): Promise<RiskAssessmentResult | null> {
  try {
    const assessment = await storage.getTenantRiskAssessment(tenantId, applicationId);
    
    if (!assessment) {
      return null;
    }
    
    try {
      return JSON.parse(assessment.assessmentData);
    } catch (parseError) {
      console.error("Error parsing stored risk assessment:", parseError);
      return null;
    }
  } catch (error) {
    console.error("Error retrieving tenant risk assessment:", error);
    throw error;
  }
}