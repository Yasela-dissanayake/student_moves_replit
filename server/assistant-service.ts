/**
 * Assistant Service
 * Provides enhanced AI assistant capabilities using our AI service manager
 */
import { executeAIOperation } from "./ai-service-manager";
import { log } from "./vite";
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
 * Get contextual information about a tenant to improve assistant responses
 * @param userId Tenant's user ID
 * @returns Context object with tenant information
 */
async function getTenantContext(userId: number): Promise<TenantContext> {
  const context: TenantContext = { userId };
  
  try {
    // Get tenant's active tenancy
    const tenancy = await storage.getCurrentTenancyByTenant(userId);
    if (tenancy) {
      context.tenancyDetails = tenancy;
      context.propertyId = tenancy.propertyId;
      
      // Get property details
      const property = await storage.getPropertyById(tenancy.propertyId);
      if (property) {
        context.propertyDetails = property;
      }
      
      // Get recent maintenance requests
      const maintenance = await storage.getMaintenanceRequestsByTenant(userId, 5);
      if (maintenance && maintenance.length > 0) {
        context.recentMaintenance = maintenance;
      }
    }
    
    // Get recent conversation history
    const conversations = await storage.getRecentConversationsByUser(userId, 10);
    if (conversations && conversations.length > 0) {
      context.pastConversation = conversations.map(conv => ({
        role: conv.fromUser ? "user" : "assistant",
        content: conv.message
      }));
    }
    
    return context;
  } catch (error) {
    log(`Error getting tenant context: ${error}`, "assistant", "error");
    return context;
  }
}

/**
 * Process a tenant question and generate a contextual response
 * @param userId Tenant's user ID
 * @param question The tenant's question
 * @returns Assistant response with relevant information
 */
export async function processTenantQuestion(userId: number, question: string): Promise<AssistantResponse> {
  try {
    const context = await getTenantContext(userId);
    const defaultResponse: AssistantResponse = {
      response: "I'm sorry, I'm having trouble processing your request right now. Please try again later."
    };
    
    // Create a rich prompt with context for more relevant answers
    let prompt = `Process the following tenant question: "${question}"\n\n`;
    
    // Add relevant context
    if (context.propertyDetails) {
      prompt += `Tenant's property: ${context.propertyDetails.addressLine1}, ${context.propertyDetails.city}\n`;
      prompt += `Property type: ${context.propertyDetails.propertyType}, ${context.propertyDetails.bedrooms} bedroom(s)\n`;
    }
    
    if (context.tenancyDetails) {
      prompt += `Tenancy start date: ${new Date(context.tenancyDetails.startDate).toLocaleDateString()}\n`;
      prompt += `Tenancy end date: ${new Date(context.tenancyDetails.endDate).toLocaleDateString()}\n`;
      prompt += `Rent: £${context.tenancyDetails.rentAmount} per ${context.tenancyDetails.rentPeriod}\n`;
    }
    
    if (context.recentMaintenance && context.recentMaintenance.length > 0) {
      prompt += "Recent maintenance requests:\n";
      context.recentMaintenance.forEach((req: any) => {
        prompt += `- ${req.issueType}: ${req.description} (Status: ${req.status})\n`;
      });
    }
    
    // Add conversation history for continuity
    if (context.pastConversation && context.pastConversation.length > 0) {
      prompt += "\nRecent conversation history:\n";
      context.pastConversation.forEach(msg => {
        prompt += `${msg.role === "user" ? "Tenant" : "Assistant"}: ${msg.content}\n`;
      });
    }
    
    prompt += `\nProvide a helpful response in JSON format with the following structure:
    {
      "response": "Your detailed answer to the tenant's question",
      "relevant_links": ["URL1", "URL2"], // Optional links to relevant resources
      "maintenance_suggested": true/false, // Whether a maintenance request might be appropriate
      "suggested_actions": [
        {
          "action": "action_name",
          "description": "Description of the suggested action"
        }
      ]
    }
    
    The response should be helpful, accurate, and tailored to the tenant's situation. If the question relates to maintenance issues, suggest creating a maintenance request. If it relates to rent or payments, provide information about the tenant portal.`;
    
    // Use AI service manager to generate response
    const result = await executeAIOperation('generateText', {
      prompt,
      responseFormat: 'json',
      maxTokens: 1500
    });
    
    // Parse the result
    try {
      // Handle potential markdown code blocks in response
      let jsonStr = result as string;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }
      
      const parsedResponse = JSON.parse(jsonStr);
      
      // Save the conversation
      await storage.saveConversation({
        userId,
        fromUser: true,
        message: question,
        timestamp: new Date()
      });
      
      await storage.saveConversation({
        userId,
        fromUser: false,
        message: parsedResponse.response,
        timestamp: new Date()
      });
      
      return {
        response: parsedResponse.response,
        relevant_links: parsedResponse.relevant_links,
        maintenance_suggested: parsedResponse.maintenance_suggested === true,
        suggested_actions: parsedResponse.suggested_actions
      };
    } catch (parseError) {
      log(`Error parsing assistant response: ${parseError}`, "assistant", "error");
      return defaultResponse;
    }
  } catch (error) {
    log(`Error processing tenant question: ${error}`, "assistant", "error");
    return {
      response: "I'm sorry, I'm having trouble processing your request right now. Please try again later."
    };
  }
}

/**
 * Process a landlord question about property management
 * @param userId Landlord's user ID
 * @param question The landlord's question
 * @param propertyId Optional property ID for context
 * @returns Assistant response with relevant information
 */
export async function processLandlordQuestion(
  userId: number, 
  question: string, 
  propertyId?: number
): Promise<AssistantResponse> {
  try {
    const defaultResponse: AssistantResponse = {
      response: "I'm sorry, I'm having trouble processing your request right now. Please try again later."
    };
    
    // Build context for the landlord
    let context = "";
    
    if (propertyId) {
      try {
        // Get property details
        const property = await storage.getPropertyById(propertyId);
        if (property) {
          context += `Property: ${property.addressLine1}, ${property.city}\n`;
          context += `Property type: ${property.propertyType}, ${property.bedrooms} bedroom(s)\n`;
          
          // Get current tenants if any
          const tenancies = await storage.getCurrentTenanciesByProperty(propertyId);
          if (tenancies && tenancies.length > 0) {
            context += "Current tenants:\n";
            for (const tenancy of tenancies) {
              const tenant = await storage.getUserById(tenancy.tenantId);
              if (tenant) {
                context += `- ${tenant.name} (since ${new Date(tenancy.startDate).toLocaleDateString()})\n`;
              }
            }
          } else {
            context += "Property is currently vacant\n";
          }
          
          // Get recent maintenance requests
          const maintenance = await storage.getMaintenanceRequestsByProperty(propertyId, 5);
          if (maintenance && maintenance.length > 0) {
            context += "Recent maintenance requests:\n";
            maintenance.forEach((req: any) => {
              context += `- ${req.issueType}: ${req.description} (Status: ${req.status})\n`;
            });
          }
        }
      } catch (contextError) {
        log(`Error building landlord context: ${contextError}`, "assistant", "error");
      }
    }
    
    // Create prompt for the AI
    const prompt = `Process the following landlord property management question: "${question}"
    
    ${context ? `Context information:\n${context}\n` : ''}
    
    Provide a helpful response in JSON format with the following structure:
    {
      "response": "Your detailed answer to the landlord's question",
      "relevant_links": ["URL1", "URL2"], // Optional links to relevant resources
      "suggested_actions": [
        {
          "action": "action_name",
          "description": "Description of the suggested action"
        }
      ]
    }
    
    The response should be professional, focus on UK property laws and regulations, and provide actionable advice where appropriate. Include information about landlord legal obligations if relevant.`;
    
    // Use AI service manager to generate response
    const result = await executeAIOperation('generateText', {
      prompt,
      responseFormat: 'json',
      maxTokens: 1500
    });
    
    // Parse the result
    try {
      // Handle potential markdown code blocks in response
      let jsonStr = result as string;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }
      
      const parsedResponse = JSON.parse(jsonStr);
      
      // Save the conversation
      await storage.saveConversation({
        userId,
        fromUser: true,
        message: question,
        timestamp: new Date()
      });
      
      await storage.saveConversation({
        userId,
        fromUser: false,
        message: parsedResponse.response,
        timestamp: new Date()
      });
      
      return {
        response: parsedResponse.response,
        relevant_links: parsedResponse.relevant_links,
        suggested_actions: parsedResponse.suggested_actions
      };
    } catch (parseError) {
      log(`Error parsing landlord assistant response: ${parseError}`, "assistant", "error");
      return defaultResponse;
    }
  } catch (error) {
    log(`Error processing landlord question: ${error}`, "assistant", "error");
    return {
      response: "I'm sorry, I'm having trouble processing your request right now. Please try again later."
    };
  }
}

/**
 * Generate a guided troubleshooting session for maintenance issues
 * @param issueType Type of maintenance issue
 * @param initialDescription Initial description of the problem
 * @returns Step-by-step troubleshooting guide
 */
export async function generateMaintenanceTroubleshooting(
  issueType: string,
  initialDescription: string
): Promise<{
  troubleshootingSteps: Array<{
    step: number;
    instruction: string;
    question?: string;
  }>;
  possibleCauses: string[];
  emergencyAdvice?: string;
  isEmergency: boolean;
}> {
  try {
    const defaultResponse = {
      troubleshootingSteps: [
        { step: 1, instruction: "Contact your landlord or property manager to report the issue." }
      ],
      possibleCauses: ["Multiple factors could cause this issue"],
      isEmergency: false
    };
    
    // Create prompt for the AI
    const prompt = `Generate a maintenance troubleshooting guide for a tenant reporting the following issue:
    
    Issue type: ${issueType}
    Description: ${initialDescription}
    
    Provide a comprehensive troubleshooting guide in JSON format with the following structure:
    {
      "troubleshootingSteps": [
        {
          "step": 1,
          "instruction": "Clear instruction for the tenant to follow",
          "question": "Optional follow-up question to gather more information"
        },
        ...
      ],
      "possibleCauses": ["List of potential causes for this issue"],
      "emergencyAdvice": "Advice if this is an emergency situation",
      "isEmergency": true/false
    }
    
    The guide should help the tenant diagnose common issues before submitting a maintenance request. Include safety warnings where appropriate, and clearly indicate if the issue requires emergency attention (e.g., gas leaks, major water leaks, electrical dangers).`;
    
    // Use AI service manager to generate troubleshooting guide
    const result = await executeAIOperation('generateText', {
      prompt,
      responseFormat: 'json',
      maxTokens: 1500
    });
    
    // Parse the result
    try {
      // Handle potential markdown code blocks in response
      let jsonStr = result as string;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }
      
      const parsedResponse = JSON.parse(jsonStr);
      
      return {
        troubleshootingSteps: parsedResponse.troubleshootingSteps || defaultResponse.troubleshootingSteps,
        possibleCauses: parsedResponse.possibleCauses || defaultResponse.possibleCauses,
        emergencyAdvice: parsedResponse.emergencyAdvice,
        isEmergency: parsedResponse.isEmergency === true
      };
    } catch (parseError) {
      log(`Error parsing troubleshooting guide: ${parseError}`, "assistant", "error");
      return defaultResponse;
    }
  } catch (error) {
    log(`Error generating maintenance troubleshooting: ${error}`, "assistant", "error");
    return {
      troubleshootingSteps: [
        { step: 1, instruction: "Contact your landlord or property manager to report the issue." }
      ],
      possibleCauses: ["Unable to analyze the issue at this time"],
      isEmergency: false
    };
  }
}

/**
 * Check if the assistant service is operational
 * @returns Service status information
 */
export async function checkAssistantStatus(): Promise<{
  available: boolean;
  message: string;
}> {
  try {
    // Test the AI service with a simple query
    const testResult = await executeAIOperation('generateText', {
      prompt: "Generate a single word response: 'available'",
      maxTokens: 50
    });
    
    const isWorking = typeof testResult === 'string' && 
                      testResult.toLowerCase().includes('available');
    
    return {
      available: isWorking,
      message: isWorking 
        ? "Assistant service is operational" 
        : "Assistant service is available but may not be functioning correctly"
    };
  } catch (error) {
    log(`Error checking assistant service status: ${error}`, "assistant", "error");
    return {
      available: false,
      message: `Assistant service is not available: ${error.message || "Unknown error"}`
    };
  }
}