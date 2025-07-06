import OpenAI from "openai";
import { log, logError, logDebug } from "./utils/logger";

import dotenv from "dotenv";
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Module name for logging
const MODULE_NAME = "openai-document";

/**
 * Check if the OpenAI API key is valid and working
 */
export async function checkApiKey(): Promise<boolean> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      logError("OpenAI API key is not set", MODULE_NAME);
      return false;
    }

    // Try to make a minimal API call to verify the key works
    const models = await openai.models.list();
    return Array.isArray(models.data) && models.data.length > 0;
  } catch (error) {
    logError(`Error validating OpenAI API key: ${error}`, MODULE_NAME);
    return false;
  }
}

/**
 * Analyze a property document with OpenAI
 * @param base64Document Base64-encoded document image
 * @param analysisMode Analysis mode (general, lease-analysis, compliance-check, etc.)
 * @param customPrompt Optional custom prompt for custom analysis mode
 * @returns Analysis result as text
 */
export async function analyzePropertyDocument(
  base64Document: string,
  analysisMode: string = "general",
  customPrompt?: string
): Promise<string> {
  try {
    log(`Starting document analysis with mode: ${analysisMode}`, MODULE_NAME);

    // Create prompt based on analysis mode
    let prompt = "";

    switch (analysisMode) {
      case "lease-analysis":
        prompt =
          "Analyze this lease agreement in detail. Identify key terms, responsibilities of landlord and tenant, rent amount, security deposit, lease duration, renewal options, maintenance responsibilities, and any unusual or potentially unfavorable clauses for the tenant. Format your analysis under clear headings.";
        break;
      case "compliance-check":
        prompt =
          "Evaluate if this document complies with standard UK rental regulations. Check for appropriate clauses regarding deposits, notice periods, landlord's obligations for repairs and tenant safety, prohibited fees, and right-to-rent verification. Note any potential non-compliance issues.";
        break;
      case "summarization":
        prompt =
          "Provide a concise summary of this document in approximately 250 words. Highlight the main purpose, key parties involved, important dates, financial obligations, primary responsibilities, and any notable special conditions.";
        break;
      case "risk-assessment":
        prompt =
          "Perform a risk assessment on this rental document. Identify potential risks for the tenant, including financial exposures, ambiguous clauses, unbalanced responsibilities, excessive penalties, or legal vulnerabilities. Rate each risk (Low/Medium/High) and provide mitigation advice.";
        break;
      case "right-to-rent":
        prompt =
          "Analyze this document for right-to-rent verification purposes. Identify the type of document, whether it appears to be a valid right-to-rent document under UK law, the validity period if applicable, and any limitations or conditions noted.";
        break;
      case "guarantor":
        prompt =
          "Analyze this guarantor agreement. Identify the guarantor's obligations, the extent of liability, length of commitment, termination conditions, and any concerning clauses that could create excessive liability for the guarantor. Provide an assessment of whether this is a standard guarantor agreement or contains unusual terms.";
        break;
      case "contract-review":
        prompt =
          "Review this contract document in detail. Identify all parties involved, contract duration, key obligations of each party, payment terms, termination clauses, renewal options, breach remedies, and any potentially unfair or concerning terms. Conclude with a brief assessment of whether this appears to be a balanced agreement.";
        break;
      case "custom":
        prompt =
          customPrompt ||
          "Analyze this document and provide a detailed assessment.";
        break;
      case "general":
      default:
        prompt =
          "Analyze this document comprehensively. Identify the document type, main purpose, key parties involved, important terms and conditions, financial obligations, dates, and any notable or unusual provisions. Organize your analysis under clear headings.";
    }

    // Call GPT-4 Vision to analyze the document
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content:
            "You are a specialized real estate document analyzer that excels at extracting and analyzing information from property-related documents. You're helping students and landlords understand rental agreements, compliance issues, and other property documents.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Document}`,
              },
            },
          ],
        },
      ],
      max_tokens: 2500,
    });

    // Extract and return the response text
    const result = response.choices[0].message.content;
    if (!result) {
      throw new Error("Empty response from OpenAI");
    }

    log(`Document analysis completed successfully`, MODULE_NAME);
    return result;
  } catch (error) {
    logError(`Error analyzing document: ${error}`, MODULE_NAME);
    throw new Error(
      `Failed to analyze document: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Extract structured information from a document
 * @param base64Document Base64-encoded document image
 * @param documentType Type of document (lease, utility_bill, passport, etc.)
 * @returns Structured information as object
 */
export async function extractDocumentInfo(
  base64Document: string,
  documentType: string
): Promise<any> {
  try {
    log(
      `Starting information extraction for document type: ${documentType}`,
      MODULE_NAME
    );

    // Create prompt based on document type
    let prompt = "";
    let systemPrompt =
      "You are a specialized document information extractor that can accurately pull structured data from various types of documents. Extract the information in a structured JSON format.";

    switch (documentType) {
      case "lease":
        prompt =
          'Extract the following information from this lease/tenancy agreement as structured JSON data: property address, landlord name, tenant names, start date, end date, rent amount, payment frequency, deposit amount, deposit protection scheme (if mentioned), notice period, and any special conditions. Include an "otherDetails" field for any other notable information.';
        break;
      case "utility_bill":
        prompt =
          'Extract the following information from this utility bill as structured JSON data: provider name, account number, customer name, service address, billing period, amount due, due date, and payment options. Include a "services" array listing individual services and charges if available.';
        break;
      case "passport":
        prompt =
          'Extract the following information from this passport as structured JSON data: full name, nationality, passport number, date of birth, sex/gender, place of birth, issue date, expiry date, and issuing authority. Include a "documentAuthenticityIndicators" field with any visible security features.';
        break;
      case "id":
        prompt =
          'Extract the following information from this ID document as structured JSON data: document type, ID number, full name, date of birth, address (if present), issue date, expiry date, and issuing authority. Include a "documentAuthenticityIndicators" field with any visible security features.';
        break;
      case "bank_statement":
        prompt =
          'Extract the following information from this bank statement as structured JSON data: bank name, account holder name, account number (last 4 digits only for privacy), statement period, opening balance, closing balance, and total deposits and withdrawals. Include a "summary" field with any notable patterns.';
        break;
      case "reference_letter":
        prompt =
          'Extract the following information from this reference letter as structured JSON data: referee name, referee position/company, applicant name, relationship to applicant, duration of relationship, rental history details, payment reliability, property condition comments, and recommendation summary. Include a "overallAssessment" field with a brief conclusion.';
        break;
      case "right_to_rent":
        prompt =
          'Extract the following information from this right to rent document as structured JSON data: document type, holder name, nationality, document number, issue date, expiry date, visa type/conditions (if applicable), and issuing authority. Include a "rightToRentStatus" field with your assessment of the document\'s validity for right to rent purposes.';
        break;
      case "guarantor_agreement":
        prompt =
          'Extract the following information from this guarantor agreement as structured JSON data: tenant name, guarantor name, guarantor address, property address, landlord/agent name, extent of guarantee, duration of guarantee, and any limitations or conditions. Include an "obligations" field listing key guarantor responsibilities.';
        break;
      default:
        prompt =
          "Extract all relevant information from this document in a structured JSON format. Identify the document type first, then extract fields appropriate for that document type.";
    }

    // Call GPT-4 Vision to extract information
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Document}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2500,
    });

    // Extract and parse the JSON response
    const resultText = response.choices[0].message.content;
    if (!resultText) {
      throw new Error("Empty response from OpenAI");
    }

    try {
      const result = JSON.parse(resultText);
      log(`Information extraction completed successfully`, MODULE_NAME);
      return result;
    } catch (parseError) {
      logError(`Error parsing JSON response: ${parseError}`, MODULE_NAME);
      return {
        error: "Failed to parse structured information",
        rawText: resultText,
      };
    }
  } catch (error) {
    logError(`Error extracting document info: ${error}`, MODULE_NAME);
    throw new Error(
      `Failed to extract document information: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Verify right to rent document
 * @param base64Document Base64-encoded document image
 * @param documentType Type of document (passport, brp, visa, etc.)
 * @returns Verification result as an object with validity and details
 */
export async function verifyRightToRentDocument(
  base64Document: string,
  documentType: string
): Promise<any> {
  try {
    log(
      `Starting right to rent verification for document type: ${documentType}`,
      MODULE_NAME
    );

    // System prompt for right to rent verification
    const systemPrompt = `
You are a specialized right to rent verification assistant that can analyze documents for UK right to rent compliance.
You will be given an image of a document that is being used for right to rent verification.
Analyze the document carefully to determine if it appears to be a valid right to rent document.

Your response should be a JSON object with the following structure:
{
  "isValid": boolean,
  "documentType": string,
  "complianceStatus": string,
  "extractedInfo": {
    // Document-specific fields like name, nationality, dates, etc.
  },
  "issues": [
    // Array of strings describing any issues found
  ],
  "recommendations": [
    // Array of strings with recommendations
  ],
  "confidenceScore": number (0-100)
}

Important UK right to rent considerations:
1. Check if the document is on the list of acceptable documents for right to rent checks
2. Verify the document hasn't expired
3. Check for indicators that the document is genuine
4. For limited right to rent, note the expiry date
5. For biometric residence permits/cards, check restrictions
6. For passports, check if the country has visa requirements for UK residency
`;

    // Create prompt based on document type
    let prompt = `Verify if this ${documentType} is valid for UK right to rent purposes. Check the document authenticity markers, expiry date, and any restrictions or conditions. Extract all relevant information and assess if this document would satisfy UK right to rent requirements.`;

    // Call GPT-4 Vision to verify the document
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Document}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2500,
    });

    // Extract and parse the JSON response
    const resultText = response.choices[0].message.content;
    if (!resultText) {
      throw new Error("Empty response from OpenAI");
    }

    try {
      const result = JSON.parse(resultText);
      log(`Right to rent verification completed successfully`, MODULE_NAME);
      return result;
    } catch (parseError) {
      logError(`Error parsing JSON response: ${parseError}`, MODULE_NAME);
      return {
        isValid: false,
        error: "Failed to parse verification result",
        rawText: resultText,
      };
    }
  } catch (error) {
    logError(`Error verifying right to rent document: ${error}`, MODULE_NAME);
    throw new Error(
      `Failed to verify right to rent document: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
