/**
 * AI Service Compatibility Layer
 * Provides backward compatibility for code that used Gemini functions
 * Redirects all calls to the AI service manager for standardized processing
 */
import { executeAIOperation } from "./ai-service-manager";
import { log } from "./vite";
import { PropertyDescriptionParams } from "@shared/schema";

/**
 * COMPATIBILITY LAYER
 * 
 * This file provides backward compatibility for code that used Gemini functions.
 * These functions redirect calls to the AI service manager which will determine
 * the appropriate AI provider to use.
 */

/**
 * Backward compatibility for generating property descriptions
 * @param propertyDetails Property details to include in the description
 * @returns Generated property description
 */
export async function generatePropertyDescription(propertyDetails: PropertyDescriptionParams): Promise<string> {
  log("Using compatibility layer: generatePropertyDescription", "compatibility");
  try {
    return await executeAIOperation('generatePropertyDescription', propertyDetails) as string;
  } catch (error) {
    log(`Error in compatibility layer: ${error}`, "compatibility", "error");
    return "Unable to generate property description at this time.";
  }
}

/**
 * Backward compatibility for generating text based on a prompt
 * @param prompt Text prompt for generation
 * @param jsonFormat Whether to format output as JSON
 * @param maxTokens Maximum tokens in the response
 * @returns Generated text
 */
export async function generateText(
  prompt: string,
  jsonFormat: boolean = false,
  maxTokens: number = 1000,
  forceRefresh: boolean = false
): Promise<string> {
  log("Using compatibility layer: generateText", "compatibility");
  try {
    return await executeAIOperation('generateText', {
      prompt,
      responseFormat: jsonFormat ? 'json' : undefined,
      maxTokens,
      forceRefresh
    }) as string;
  } catch (error) {
    log(`Error in compatibility layer: ${error}`, "compatibility", "error");
    return "Error generating text response.";
  }
}

/**
 * Backward compatibility for face comparison
 * @param originalImageBase64 Base64 of the original face image
 * @param newImageBase64 Base64 of the new face image to compare
 * @returns Comparison result with similarity score
 */
export async function compareFaces(
  originalImageBase64: string,
  newImageBase64: string
): Promise<{ matched: boolean; similarity: number; message: string }> {
  log("Using compatibility layer: compareFaces", "compatibility");
  try {
    const result = await executeAIOperation('compareFaces', {
      originalImageBase64,
      newImageBase64
    });
    
    return result as { matched: boolean; similarity: number; message: string };
  } catch (error) {
    log(`Error in compatibility layer: ${error}`, "compatibility", "error");
    return {
      matched: false,
      similarity: 0,
      message: "Error comparing faces: " + (error.message || "Unknown error")
    };
  }
}

/**
 * Backward compatibility for checking API availability
 * @returns True if API is available
 */
export async function checkApiKey(): Promise<boolean> {
  log("Using compatibility layer: checkApiKey", "compatibility");
  try {
    const providers = await executeAIOperation('checkAllProviders', {});
    return Object.values(providers).some(available => available === true);
  } catch (error) {
    log(`Error in compatibility layer: ${error}`, "compatibility", "error");
    return false;
  }
}

/**
 * Backward compatibility for general-purpose Gemini responses
 * @param prompt Text prompt
 * @param jsonFormat Whether to format output as JSON
 * @returns Generated text response
 */
export async function generateGeminiResponse(
  prompt: string,
  jsonFormat: boolean = false
): Promise<string> {
  log("Using compatibility layer: generateGeminiResponse", "compatibility");
  try {
    return await executeAIOperation('generateText', {
      prompt,
      responseFormat: jsonFormat ? 'json' : undefined
    }) as string;
  } catch (error) {
    log(`Error in compatibility layer: ${error}`, "compatibility", "error");
    return "Error generating response.";
  }
}

// Exports for compatibility with gemini-id-verification
export const verifyIdentityDocument = async (
  documentImageBase64: string,
  documentType: string = "passport"
) => {
  log("Using compatibility layer: verifyIdentityDocument", "compatibility");
  try {
    return await executeAIOperation('verifyIdentity', {
      documentImageBase64,
      documentType
    });
  } catch (error) {
    log(`Error in compatibility layer: ${error}`, "compatibility", "error");
    return {
      verified: false,
      confidence: 0,
      documentDetails: {},
      errorMessage: "Error verifying document: " + (error.message || "Unknown error")
    };
  }
};

export const verifyRightToRent = async (
  identityVerificationResult: any,
  additionalDetails: {
    nationality: string;
    immigrationStatus: string;
    rightToRentExpiryDate?: Date;
    shareCode?: string;
  }
) => {
  log("Using compatibility layer: verifyRightToRent", "compatibility");
  try {
    // Create a prompt to verify right to rent eligibility
    const verificationPrompt = `
      Verify the right to rent eligibility based on the following information:
      
      Identity verification: ${identityVerificationResult.verified ? 'Successfully verified' : 'Not verified'}
      Document details: ${JSON.stringify(identityVerificationResult.documentDetails)}
      Nationality: ${additionalDetails.nationality}
      Immigration status: ${additionalDetails.immigrationStatus}
      Right to Rent expiry date: ${additionalDetails.rightToRentExpiryDate ? additionalDetails.rightToRentExpiryDate.toISOString() : 'Not provided'}
      Share code: ${additionalDetails.shareCode || 'Not provided'}
      
      Determine if the person has:
      1. Unlimited right to rent
      2. Time-limited right to rent (with expiry date)
      3. No right to rent
      
      Also determine if follow-up checks are needed and when.
      
      Return the analysis in JSON format with these fields:
      - verified: boolean
      - status: "unlimited", "time-limited", or "not-eligible"
      - expiryDate: ISO date string (if time-limited)
      - confidence: number between 0 and 1
      - followUpNeeded: boolean
      - followUpDate: ISO date string (if follow-up needed)
      - notes: string with explanation
    `;
    
    // Use AI service manager to verify right to rent
    const rightToRentResponse = await executeAIOperation('generateText', {
      prompt: verificationPrompt,
      responseFormat: 'json'
    });
    
    // Parse the response
    // Handle potential markdown code blocks in the response
    let jsonStr = rightToRentResponse as string;
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
    }
    
    const parsedResult = JSON.parse(jsonStr);
    
    return {
      verified: parsedResult.verified === true,
      status: parsedResult.status || 'not-verified',
      expiryDate: parsedResult.expiryDate ? new Date(parsedResult.expiryDate) : undefined,
      confidence: parsedResult.confidence || 0,
      followUpNeeded: parsedResult.followUpNeeded === true,
      followUpDate: parsedResult.followUpDate ? new Date(parsedResult.followUpDate) : undefined,
      notes: parsedResult.notes
    };
  } catch (error) {
    log(`Error in compatibility layer: ${error}`, "compatibility", "error");
    return {
      verified: false,
      status: "not-verified",
      confidence: 0,
      followUpNeeded: false,
      notes: "Error processing verification: " + (error.message || "Unknown error")
    };
  }
};

export const generateRightToRentCertificate = async (
  rightToRentResult: any,
  userDetails: {
    name: string;
    nationality: string;
    [key: string]: any;
  }
) => {
  log("Using compatibility layer: generateRightToRentCertificate", "compatibility");
  try {
    // Create a prompt to generate a Right to Rent certificate
    const certificatePrompt = `
      Generate a formal Right to Rent certificate with the following details:
      
      Tenant Name: ${userDetails.name}
      Nationality: ${userDetails.nationality}
      Right to Rent Status: ${rightToRentResult.status}
      Verification Date: ${new Date().toLocaleDateString()}
      ${rightToRentResult.expiryDate ? `Expiry Date: ${rightToRentResult.expiryDate.toLocaleDateString()}` : ''}
      ${rightToRentResult.followUpNeeded ? `Follow-up Required By: ${rightToRentResult.followUpDate?.toLocaleDateString()}` : ''}
      
      Include appropriate legal disclaimers and information about the Right to Rent scheme.
      Format the certificate in a professional, official-looking layout.
    `;
    
    // Generate the certificate using AI
    return await executeAIOperation('generateText', {
      prompt: certificatePrompt
    }) as string;
  } catch (error) {
    log(`Error in compatibility layer: ${error}`, "compatibility", "error");
    return "Error generating Right to Rent certificate.";
  }
};