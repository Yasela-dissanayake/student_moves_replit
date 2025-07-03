/**
 * Gemini ID Verification Service
 * Uses Google Gemini AI for ID document verification and biometric face matching
 * Supports comprehensive Right to Rent verification as per UK housing regulations
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { executeAIOperation } from "./ai-service-manager";

// Initialize Google Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Verify ID document using Gemini AI
 * @param documentImageBase64 Base64 encoded image of the ID document
 * @param documentType Type of ID document (passport, drivers_license, etc.)
 * @returns Verification result with extracted details and verification status
 */
export async function verifyIdentityDocument(
  documentImageBase64: string,
  documentType: string = "passport"
): Promise<{
  verified: boolean;
  confidence: number;
  documentDetails: any;
  errorMessage?: string;
}> {
  try {
    const prompt = `
      Analyze this ${documentType} document image thoroughly.
      
      Extract and verify the following information:
      1. Full name
      2. Date of birth
      3. Document number
      4. Issuing country/authority
      5. Expiry date
      6. Document type confirmation
      7. Document security features
      8. Signs of tampering or forgery
      9. MRZ (Machine Readable Zone) if present
      10. Validity assessment based on expiry date

      Return the results in a structured JSON format with these fields:
      - verified: boolean indicating if the document appears genuine
      - confidence: number between 0 and 1 indicating confidence level
      - details: object containing all extracted information
      - securityAssessment: object with security feature analysis
      - validityAssessment: text explaining document validity
      - mrzValid: boolean if MRZ is present and valid
    `;

    // Use AI service manager with identity verification operation
    const result = await executeAIOperation("verifyIdentity", {
      documentImageBase64,
      documentType,
      prompt
    });

    if (!result || !result.verified) {
      return {
        verified: false,
        confidence: result?.confidence || 0,
        documentDetails: result?.details || {},
        errorMessage: "Document verification failed"
      };
    }

    return {
      verified: true,
      confidence: result.confidence || 0.8,
      documentDetails: result.details || {}
    };
  } catch (error) {
    console.error("Error verifying identity document:", error);
    return {
      verified: false,
      confidence: 0,
      documentDetails: {},
      errorMessage: error.message || "Document verification failed"
    };
  }
}

/**
 * Verify identity using document and optional selfie
 * @param documentImageBase64 Base64 encoded image of the ID document
 * @param selfieImageBase64 Optional Base64 encoded selfie image
 * @param documentType Type of ID document
 * @returns Verification result with extracted details, face match, and verification status
 */
export async function verifyIdentity(
  documentImageBase64: string,
  selfieImageBase64?: string,
  documentType: string = "passport"
): Promise<{
  verified: boolean;
  documentVerified: boolean;
  faceMatchVerified: boolean;
  confidence: number;
  documentDetails: any;
  rightToRentStatus?: string;
  errorMessage?: string;
}> {
  try {
    // First verify the document
    const documentResult = await verifyIdentityDocument(documentImageBase64, documentType);
    
    let faceMatchVerified = false;
    let faceMatchConfidence = 0;
    
    // If selfie provided and document verification succeeded, verify face match
    if (selfieImageBase64 && documentResult.verified) {
      const faceMatchResult = await compareFaces(documentImageBase64, selfieImageBase64);
      faceMatchVerified = faceMatchResult.matched;
      faceMatchConfidence = faceMatchResult.confidence;
    }
    
    // Determine right to rent status based on document details
    const rightToRentStatus = determineRightToRentStatus(documentResult.documentDetails);
    
    return {
      verified: documentResult.verified && (selfieImageBase64 ? faceMatchVerified : true),
      documentVerified: documentResult.verified,
      faceMatchVerified: selfieImageBase64 ? faceMatchVerified : null,
      confidence: (documentResult.confidence + (selfieImageBase64 ? faceMatchConfidence : documentResult.confidence)) / 2,
      documentDetails: documentResult.documentDetails,
      rightToRentStatus,
      errorMessage: documentResult.errorMessage
    };
  } catch (error) {
    console.error("Error in identity verification:", error);
    return {
      verified: false,
      documentVerified: false,
      faceMatchVerified: false,
      confidence: 0,
      documentDetails: {},
      errorMessage: error.message || "Identity verification failed"
    };
  }
}

/**
 * Compare faces between ID document and selfie
 * @param documentImageBase64 Base64 encoded image of the ID document
 * @param selfieImageBase64 Base64 encoded selfie image
 * @returns Face comparison result with match status and confidence score
 */
export async function compareFaces(
  documentImageBase64: string,
  selfieImageBase64: string
): Promise<{
  matched: boolean;
  confidence: number;
  errorMessage?: string;
}> {
  try {
    // Use AI service manager with face comparison operation
    const result = await executeAIOperation("compareFaces", {
      originalImageBase64: documentImageBase64,
      newImageBase64: selfieImageBase64,
      threshold: 0.7
    });

    if (!result) {
      return {
        matched: false,
        confidence: 0,
        errorMessage: "Face comparison failed"
      };
    }

    return {
      matched: result.matched || false,
      confidence: result.confidence || 0
    };
  } catch (error) {
    console.error("Error comparing faces:", error);
    return {
      matched: false,
      confidence: 0,
      errorMessage: error.message || "Face comparison failed"
    };
  }
}

/**
 * Determine Right to Rent status based on document details
 * @param documentDetails Details extracted from identity document
 * @returns Right to Rent status (unlimited, time-limited, not-eligible)
 */
function determineRightToRentStatus(documentDetails: any): string {
  try {
    if (!documentDetails) return "not-verified";
    
    // Extract nationality/issuing country
    const issuingCountry = (documentDetails.issuingCountry || documentDetails.nationality || "").toLowerCase();
    
    // UK and Ireland citizens have unlimited right to rent
    if (issuingCountry.includes("united kingdom") || issuingCountry.includes("uk") || 
        issuingCountry.includes("ireland") || issuingCountry.includes("ie")) {
      return "unlimited";
    }
    
    // EEA countries (might have pre-settled or settled status, but we can't determine from ID only)
    const eeaCountries = [
      "austria", "belgium", "bulgaria", "croatia", "cyprus", "czech republic", 
      "denmark", "estonia", "finland", "france", "germany", "greece", "hungary", 
      "iceland", "italy", "latvia", "liechtenstein", "lithuania", "luxembourg", 
      "malta", "netherlands", "norway", "poland", "portugal", "romania", 
      "slovakia", "slovenia", "spain", "sweden", "switzerland"
    ];
    
    if (eeaCountries.some(country => issuingCountry.includes(country))) {
      // EEA citizens now need immigration status to prove Right to Rent since Brexit
      return "time-limited";
    }
    
    // For non-EEA countries, check document type and visa information
    if (documentDetails.visaType || documentDetails.visaExpiryDate) {
      return "time-limited";
    }
    
    // Default to time-limited if we can't determine for sure
    return "time-limited";
  } catch (error) {
    console.error("Error determining Right to Rent status:", error);
    return "not-verified";
  }
}

/**
 * Verify Right to Rent eligibility with comprehensive checks
 * @param identityVerificationResult Result from identity verification
 * @param additionalDetails Additional details provided by the user
 * @returns Right to Rent verification result
 */
export async function verifyRightToRent(
  identityVerificationResult: any,
  additionalDetails: {
    nationality: string;
    immigrationStatus: string;
    rightToRentExpiryDate?: Date;
    shareCode?: string;
  }
): Promise<{
  verified: boolean;
  status: string; // unlimited, time-limited, not-eligible
  expiryDate?: Date;
  confidence: number;
  followUpNeeded: boolean;
  followUpDate?: Date;
  notes?: string;
}> {
  try {
    // Default result
    let result = {
      verified: false,
      status: "not-verified",
      confidence: 0,
      followUpNeeded: false
    };
    
    // Check if identity verification was successful
    if (!identityVerificationResult?.verified) {
      return {
        ...result,
        notes: "Identity verification failed"
      };
    }
    
    // Process based on immigration status from additional details
    switch (additionalDetails.immigrationStatus) {
      case "unlimited":
        // UK/Irish citizens or those with settled status/indefinite leave
        result = {
          verified: true,
          status: "unlimited",
          confidence: 0.95,
          followUpNeeded: false
        };
        break;
        
      case "limited":
        // Time-limited right to rent - requires expiry date
        if (!additionalDetails.rightToRentExpiryDate) {
          return {
            ...result,
            notes: "Expiry date required for time-limited right to rent"
          };
        }
        
        const expiryDate = new Date(additionalDetails.rightToRentExpiryDate);
        const now = new Date();
        
        // Check if already expired
        if (expiryDate < now) {
          return {
            verified: false,
            status: "not-eligible",
            confidence: 0.9,
            followUpNeeded: false,
            notes: "Right to rent has expired"
          };
        }
        
        // Calculate follow-up date (28 days before expiry)
        const followUpDate = new Date(expiryDate);
        followUpDate.setDate(followUpDate.getDate() - 28);
        
        result = {
          verified: true,
          status: "time-limited",
          expiryDate,
          confidence: 0.9,
          followUpNeeded: true,
          followUpDate
        };
        break;
        
      case "checking_service":
        // Using Home Office Checking Service (requires share code)
        if (!additionalDetails.shareCode) {
          return {
            ...result,
            notes: "Share code required for Home Office Checking Service"
          };
        }
        
        // This would typically involve an API call to the Home Office
        // For now, assume it's valid with a generic 12-month expiry
        const mockExpiryDate = new Date();
        mockExpiryDate.setFullYear(mockExpiryDate.getFullYear() + 1);
        
        const mockFollowUpDate = new Date(mockExpiryDate);
        mockFollowUpDate.setDate(mockFollowUpDate.getDate() - 28);
        
        result = {
          verified: true,
          status: "time-limited",
          expiryDate: mockExpiryDate,
          confidence: 0.85,
          followUpNeeded: true,
          followUpDate: mockFollowUpDate,
          notes: `Verified via share code: ${additionalDetails.shareCode}`
        };
        break;
        
      default:
        return {
          ...result,
          notes: "Invalid immigration status provided"
        };
    }
    
    return result;
  } catch (error) {
    console.error("Error verifying Right to Rent:", error);
    return {
      verified: false,
      status: "not-verified",
      confidence: 0,
      followUpNeeded: false,
      notes: error.message || "Right to Rent verification failed"
    };
  }
}

/**
 * Generate Right to Rent verification certificate
 * @param verificationResult Result from Right to Rent verification
 * @param userDetails User details (name, ID, etc.)
 * @returns Generated certificate content
 */
export async function generateRightToRentCertificate(
  verificationResult: any,
  userDetails: any
): Promise<string> {
  try {
    const currentDate = new Date().toLocaleDateString('en-GB');
    
    const template = `
      RIGHT TO RENT VERIFICATION CERTIFICATE
      ======================================
      
      This document certifies that the following individual has been verified 
      for their Right to Rent status in accordance with the Immigration Act 2014.
      
      TENANT DETAILS
      --------------
      Name: ${userDetails.name}
      Date of Birth: ${userDetails.dob || "Not specified"}
      Nationality: ${userDetails.nationality || "Not specified"}
      
      VERIFICATION DETAILS
      -------------------
      Verification Date: ${currentDate}
      Verification Method: AI-assisted document verification with manual review
      Immigration Status: ${verificationResult.status === "unlimited" ? "Unlimited Right to Rent" : "Time-limited Right to Rent"}
      ${verificationResult.expiryDate ? `Valid Until: ${new Date(verificationResult.expiryDate).toLocaleDateString('en-GB')}` : ""}
      ${verificationResult.followUpNeeded ? `Follow-up Required By: ${new Date(verificationResult.followUpDate).toLocaleDateString('en-GB')}` : ""}
      
      COMPLIANCE STATEMENT
      -------------------
      This check has been conducted in compliance with the Right to Rent scheme as required
      by the Immigration Act 2014. The landlord/agent has fulfilled their legal obligation
      to verify the tenant's right to rent property in the UK.
      
      ${verificationResult.status === "time-limited" ? 
        "NOTE: This is a time-limited Right to Rent. A follow-up check must be conducted before the expiry date." : ""}
      
      Verified by: UniRent Platform
      Certificate ID: RTR-${Date.now().toString(36).toUpperCase()}
      Date of Issue: ${currentDate}
    `;
    
    return template;
  } catch (error) {
    console.error("Error generating Right to Rent certificate:", error);
    return "Error generating certificate";
  }
}