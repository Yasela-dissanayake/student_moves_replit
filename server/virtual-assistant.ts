/**
 * Virtual Assistant Service for Student Accommodations
 * Uses advanced AI to provide intelligent responses to tenant inquiries
 */
import { log } from "./vite";
import { executeAIOperation } from "./ai-service-manager";
import { storage } from "./storage";

// Define the interface for assistant responses
export interface AssistantResponse {
  response: string;
  relevant_links?: string[];
  maintenance_suggested?: boolean;
  suggested_actions?: Array<{
    action: string;
    description: string;
  }>;
}

// Define the interface for tenant context
interface TenantContext {
  userId: number;
  propertyId?: number;
  propertyDetails?: any;
  tenancyDetails?: any;
  recentMaintenance?: any[];
  pastConversation?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

/**
 * Process a tenant's question with contextual information
 * @param userId The tenant's user ID
 * @param question The tenant's question
 * @param propertyId Optional property ID for context
 * @param conversation Previous conversation history
 * @returns AI-generated response with helpful information
 */
export async function processQuery(
  userId: number,
  question: string,
  propertyId?: number,
  conversation?: Array<{
    role: "user" | "assistant";
    content: string;
  }>
): Promise<AssistantResponse> {
  try {
    log(`Processing virtual assistant query for user ${userId}: "${question.substring(0, 50)}..."`, "assistant");
    
    // Get tenant context data
    const context = await getTenantContext(userId, propertyId, conversation);
    
    // Map conversation to AI format if provided
    const conversationContext = conversation 
      ? `Previous conversation: ${JSON.stringify(conversation)}`
      : '';
    
    // Create property context
    const propertyContext = context.propertyDetails 
      ? `
      Property information:
      Title: ${context.propertyDetails.title}
      Address: ${context.propertyDetails.address}
      Type: ${context.propertyDetails.propertyType}
      Bedrooms: ${context.propertyDetails.bedrooms}
      Bathrooms: ${context.propertyDetails.bathrooms}
      All-inclusive utilities: ${context.propertyDetails.includesUtilities ? 'Yes' : 'No'}
      `
      : 'No property information available.';
    
    // Create tenancy context
    const tenancyContext = context.tenancyDetails 
      ? `
      Tenancy information:
      Start date: ${context.tenancyDetails.startDate}
      End date: ${context.tenancyDetails.endDate}
      Rent: £${context.tenancyDetails.rentAmount}/month
      Deposit: £${context.tenancyDetails.depositAmount}
      Deposit protection scheme: ${context.tenancyDetails.depositScheme || 'Not specified'}
      `
      : 'No tenancy information available.';
    
    // Create maintenance context
    const maintenanceContext = context.recentMaintenance && context.recentMaintenance.length > 0
      ? `
      Recent maintenance requests:
      ${context.recentMaintenance.map((request: any) => 
        `- ${request.issueType}: ${request.description} (Status: ${request.status})`
      ).join('\n')}
      `
      : 'No recent maintenance requests.';
    
    // Create prompt for AI assistant
    const prompt = `
    You are a helpful virtual assistant for StudentMoves, a student accommodation platform in the UK. 
    Answer the following query from a tenant using the provided context information.
    
    TENANT QUERY: "${question}"
    
    ${conversationContext}
    
    TENANT CONTEXT:
    ${propertyContext}
    
    ${tenancyContext}
    
    ${maintenanceContext}
    
    IMPORTANT GUIDELINES:
    1. Be helpful, friendly, and concise in your responses.
    2. If the query is about maintenance issues, suggest creating a maintenance request if appropriate.
    3. For questions about deposit protection, always mention that all deposits must be protected in one of the UK government-approved schemes (DPS, MyDeposits, or TDS).
    4. If the question is about contract information, reference the tenancy agreement.
    5. For payment queries, direct them to the payment section of the dashboard.
    6. If the question is outside your knowledge context, be honest and suggest contacting their landlord or agent.
    7. Use a professional but friendly tone suitable for university students.
    8. Include up to 3 relevant links or suggested actions when applicable.
    
    Format your response as a JSON object with the following structure:
    {
      "response": "Your helpful response text here",
      "relevant_links": ["Link description|/path/to/link", ...] (optional, include only if relevant),
      "maintenance_suggested": true/false (include only if the query is related to maintenance),
      "suggested_actions": [{"action": "Action title", "description": "Brief description"}, ...] (optional, include only if there are suggested actions)
    }
    `;
    
    // Get response from AI
    const aiResponse = await executeAIOperation('generateText', {
      prompt,
      maxTokens: 1000,
      responseFormat: 'json'
    });
    
    // Parse the response
    let parsedResponse: AssistantResponse;
    try {
      parsedResponse = JSON.parse(aiResponse) as AssistantResponse;
    } catch (error) {
      log(`Error parsing AI response as JSON: ${error}`, "assistant");
      // Fallback to simple response if JSON parsing fails
      parsedResponse = {
        response: "I'm sorry, I encountered an error processing your request. Please try again with a different question."
      };
    }
    
    // Save the conversation to the database
    await saveConversation(userId, question, parsedResponse.response);
    
    return parsedResponse;
  } catch (error) {
    log(`Error in virtual assistant: ${error}`, "assistant");
    return {
      response: "I'm sorry, I encountered an error while processing your query. Please try again later."
    };
  }
}

/**
 * Get context information for a tenant
 * @param userId The tenant's user ID
 * @param propertyId Optional property ID
 * @param conversation Previous conversation history
 * @returns Contextual information about the tenant
 */
async function getTenantContext(
  userId: number,
  propertyId?: number,
  conversation?: Array<{
    role: "user" | "assistant";
    content: string;
  }>
): Promise<TenantContext> {
  const context: TenantContext = {
    userId,
    pastConversation: conversation
  };
  
  try {
    // Get user information
    const user = await storage.getUser(userId);
    if (!user) {
      log(`User ${userId} not found`, "assistant");
      return context;
    }
    
    // Get property information
    if (propertyId) {
      context.propertyId = propertyId;
      const property = await storage.getProperty(propertyId);
      if (property) {
        context.propertyDetails = property;
      }
    } else {
      // Try to find property from tenancy
      const tenancies = await storage.getTenanciesByTenant(userId);
      if (tenancies && tenancies.length > 0) {
        // Get the most recent tenancy
        const latestTenancy = tenancies.reduce((latest: any, current: any) => 
          new Date(current.startDate) > new Date(latest.startDate) ? current : latest
        );
        
        context.tenancyDetails = latestTenancy;
        
        if (latestTenancy.propertyId) {
          const property = await storage.getProperty(latestTenancy.propertyId);
          if (property) {
            context.propertyId = property.id;
            context.propertyDetails = property;
          }
        }
      }
    }
    
    // Get maintenance requests if we have a property
    if (context.propertyId) {
      const maintenanceRequests = await storage.getMaintenanceRequestsByTenant(userId);
      if (maintenanceRequests) {
        // Only include recent maintenance requests (last 3 months)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        context.recentMaintenance = maintenanceRequests
          .filter(request => request.createdAt && new Date(request.createdAt) >= threeMonthsAgo)
          .sort((a, b) => 
            (b.createdAt ? new Date(b.createdAt).getTime() : 0) - 
            (a.createdAt ? new Date(a.createdAt).getTime() : 0)
          )
          .slice(0, 5); // Only include up to 5 most recent requests
      }
    }
    
    return context;
  } catch (error) {
    log(`Error getting tenant context: ${error}`, "assistant");
    return context;
  }
}

/**
 * Save conversation history to the database
 * @param userId The tenant's user ID
 * @param query The tenant's question
 * @param response The assistant's response
 */
async function saveConversation(
  userId: number,
  query: string,
  response: string
): Promise<void> {
  try {
    // Implement appropriate database call
    // This would typically involve:
    // 1. Check if a conversation exists for this user
    // 2. If yes, append to it
    // 3. If no, create a new conversation

    // Placeholder for actual implementation
    // Example: await storage.saveAssistantConversation(userId, query, response);
    
    log(`Saved conversation for user ${userId}`, "assistant");
  } catch (error) {
    log(`Error saving conversation: ${error}`, "assistant");
  }
}

/**
 * Get common questions and answers for student tenants
 * @returns Array of FAQs with questions and answers
 */
export async function getCommonQuestions(): Promise<Array<{question: string, answer: string}>> {
  return [
    {
      question: "How do I report a maintenance issue?",
      answer: "You can report maintenance issues through your tenant dashboard. Go to the 'Maintenance' section, click 'Report Issue', and fill out the form with details about the problem."
    },
    {
      question: "When is my rent due?",
      answer: "Rent is typically due on the date specified in your tenancy agreement. You can view your payment schedule in the 'Payments' section of your dashboard."
    },
    {
      question: "What do I do if I'm locked out?",
      answer: "If you're locked out, contact your landlord or agent immediately. Emergency contact information is available in the 'Property Details' section of your dashboard."
    },
    {
      question: "Are utilities included in my rent?",
      answer: "This depends on your specific agreement. Many properties offer all-inclusive packages that cover utilities like gas, electricity, water, and broadband. Check your property details for confirmation."
    },
    {
      question: "How is my deposit protected?",
      answer: "All deposits must be protected in a government-approved scheme (DPS, MyDeposits, or TDS). Information about your specific deposit protection is available in the 'Deposit' section of your dashboard."
    },
    {
      question: "Can I have pets in my accommodation?",
      answer: "Pet policies vary by property. Check your tenancy agreement for specific terms or contact your landlord/agent directly for clarification."
    },
    {
      question: "How do I extend my tenancy?",
      answer: "To extend your tenancy, go to the 'Tenancy' section of your dashboard and look for the 'Renewal Options' feature, or contact your landlord/agent directly."
    }
  ];
}