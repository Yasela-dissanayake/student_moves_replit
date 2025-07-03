/**
 * OpenAI integration service
 * Provides utility functions for interacting with the OpenAI API
 * Can use a mock implementation to reduce API costs
 * 
 * IMPORTANT: This file contains a flag USE_MOCK_OPENAI that determines whether
 * to use the real OpenAI API or the mock implementation. Set it to false
 * if you want to use the actual OpenAI API.
 */
import OpenAI from "openai";
import { log } from "./utils/logger";
import mockOpenAI from "./mock-openai";

// Set to true to use the mock implementation instead of the real OpenAI API
// Set to false to use the real OpenAI API with your API key
// Automatically enable mocks if no API key is available
export const USE_MOCK_OPENAI = !process.env.OPENAI_API_KEY || false;

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = "gpt-4o";

/**
 * Parameters for generating a property description
 */
export interface PropertyDescriptionParams {
  title: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  location: string;
  university?: string;
  features: string[];
  nearbyAmenities?: string[];
  tone?: 'professional' | 'casual' | 'luxurious' | 'student-friendly';
  propertyCategory?: 'student' | 'professional' | 'family' | 'luxury';
  target?: string;
  pricePoint?: string;
  optimizeForSEO?: boolean;
  highlightUtilities?: boolean;
  maxLength?: number;
  billsIncluded?: boolean;
  furnished?: boolean;
  // Additional properties used in the implementation
  area?: string;
  price?: string;
  pricePerPerson?: string;
  distanceToUniversity?: string;
}

/**
 * Check if the configured OpenAI API key is valid
 * @returns {Promise<boolean>} True if the API key is valid, false otherwise
 */
export async function checkApiKey(): Promise<boolean> {
  try {
    // If using mock implementation, always return true
    if (USE_MOCK_OPENAI) {
      log('Using mock OpenAI implementation - API key validation skipped', 'openai');
      return mockOpenAI.checkApiKey();
    }
    
    if (!process.env.OPENAI_API_KEY) {
      log('OpenAI API key is not configured', 'openai');
      return false;
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Make a minimal API call to validate the key
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 5
    });
    
    if (response.choices && response.choices.length > 0) {
      log('OpenAI API key is valid', 'openai');
      return true;
    } else {
      log('OpenAI API key validation failed: No response choices', 'openai');
      return false;
    }
  } catch (error: any) {
    log(`OpenAI API key validation failed: ${error.message}`, 'openai');
    return false;
  }
}

/**
 * Generate a property description using OpenAI
 * @param params Property description parameters
 * @returns Generated description
 */
export async function generatePropertyDescription(params: PropertyDescriptionParams): Promise<string> {
  try {
    // If using mock implementation, use it instead
    if (USE_MOCK_OPENAI) {
      return mockOpenAI.generatePropertyDescription(params);
    }
    
    // Create a new OpenAI client with the API key from environment
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    if (!openai) {
      throw new Error("OpenAI client could not be initialized");
    }
    
    // Build the prompt for the property description
    const cityArea = params.location.split(',').map(part => part.trim());
    const city = cityArea.length > 0 ? cityArea[0] : params.location;
    const area = cityArea.length > 1 ? cityArea[1] : (params.area || '');
    
    // Calculate price per person if not provided
    const price = params.price || "";
    const pricePerPerson = params.pricePerPerson || (params.bedrooms ? 
      `${Math.round(parseInt(price) / params.bedrooms)}` : '');
    
    // Distance to university, if applicable
    const distanceToUniversityText = params.distanceToUniversity ? 
      `Only ${params.distanceToUniversity} from ${params.university || 'the university'}` : '';
    
    // Tone of the description
    const tone = params.tone || 'student-friendly';
    
    // Property category
    const category = params.propertyCategory || 'student';
    
    // Maximum length
    const maxLength = params.maxLength || 2000;
    
    // Target audience
    const target = params.target || 'students';
    
    // Create the prompt
    const prompt = `Generate a detailed and engaging property description for ${category} accommodation with the following details:
    
    Title: ${params.title}
    Location: ${params.location}
    Property Type: ${params.propertyType}
    Bedrooms: ${params.bedrooms}
    Bathrooms: ${params.bathrooms}
    Features: ${params.features.join(', ')}
    ${params.nearbyAmenities ? `Nearby Amenities: ${params.nearbyAmenities.join(', ')}` : ''}
    ${params.university ? `Nearest University: ${params.university}` : ''}
    ${distanceToUniversityText}
    Bills Included: ${params.billsIncluded ? 'Yes' : 'No'}
    Furnished: ${params.furnished ? 'Yes' : 'No'}
    
    Use a ${tone} tone and target the description to ${target}.
    ${params.optimizeForSEO ? 'Optimize the description for SEO by including relevant keywords.' : ''}
    ${params.highlightUtilities ? 'Highlight the utilities and bills included in the rent.' : ''}
    Keep the description under ${maxLength} characters.
    
    Focus on the benefits and unique selling points of this property, especially those that would appeal to ${target}.`;
    
    // Make the API call
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: Math.min(2000, Math.ceil(maxLength / 4)),
      temperature: 0.7,
    });
    
    // Extract and return the generated description
    const description = response.choices[0].message.content?.trim() || '';
    
    return description;
  } catch (error: any) {
    log(`Error generating property description: ${error.message}`, 'openai');
    throw new Error(`Failed to generate property description: ${error.message}`);
  }
}

/**
 * Generate embeddings for text using OpenAI
 * @param text Text to generate embeddings for
 * @returns Embeddings as an array of numbers
 */
export async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    // If using mock implementation, use it instead
    if (USE_MOCK_OPENAI) {
      return mockOpenAI.generateEmbeddings(text);
    }
    
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });
    
    return response.data[0].embedding;
  } catch (error: any) {
    log(`Error generating embeddings: ${error.message}`, 'openai');
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
}

/**
 * Analyze an image using OpenAI's vision capabilities
 * @param base64Image Base64-encoded image data
 * @param prompt Prompt for the image analysis
 * @returns Analysis result
 */
export async function analyzeImage(base64Image: string, prompt: string): Promise<string> {
  try {
    // If using mock implementation, use it instead
    if (USE_MOCK_OPENAI) {
      return mockOpenAI.analyzeImage(base64Image, prompt);
    }
    
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
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
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });
    
    return response.choices[0].message.content || '';
  } catch (error: any) {
    log(`Error analyzing image: ${error.message}`, 'openai');
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

/**
 * Compare two face images for identity verification
 * @param originalImageBase64 Base64-encoded original face image
 * @param newImageBase64 Base64-encoded new face image to compare
 * @param threshold Similarity threshold (0-1) for considering a match
 * @returns Comparison result
 */
export async function compareFaces(
  originalImageBase64: string,
  newImageBase64: string,
  threshold: number = 0.7
): Promise<{
  aboveThreshold: boolean;
  confidenceScore: number;
  analysis: string;
}> {
  try {
    // If using mock implementation, use it instead
    if (USE_MOCK_OPENAI) {
      return mockOpenAI.compareFaces(originalImageBase64, newImageBase64, threshold);
    }
    
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const prompt = `Compare these two face images for identity verification purposes. 
    Determine if they show the same person. 
    Analyze facial features, proportions, and any distinguishing characteristics.
    Consider lighting and angle differences.
    Provide a detailed analysis and a confidence score between 0 and 1, where 1 is absolute certainty they are the same person.
    Format your response as JSON with these fields:
    {
      "confidenceScore": number between 0 and 1,
      "analysis": "detailed explanation of your reasoning",
      "samePerson": boolean indicating if you think it's the same person
    }`;
    
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
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
                url: `data:image/jpeg;base64,${originalImageBase64}`,
              },
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${newImageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });
    
    const resultText = response.choices[0].message.content || '{}';
    const result = JSON.parse(resultText);
    
    return {
      aboveThreshold: (result.confidenceScore || 0) >= threshold && (result.samePerson || false),
      confidenceScore: result.confidenceScore || 0,
      analysis: result.analysis || 'No analysis provided',
    };
  } catch (error: any) {
    log(`Error comparing faces: ${error.message}`, 'openai');
    throw new Error(`Failed to compare faces: ${error.message}`);
  }
}

/**
 * Generate text using OpenAI
 * @param prompt The prompt to generate text from
 * @param maxTokens Maximum number of tokens to generate
 * @param forceRefresh Whether to force a refresh instead of using cached results
 * @returns Generated text
 */
export async function generateText(
  prompt: string, 
  maxTokens?: number,
  forceRefresh?: boolean
): Promise<string> {
  try {
    // If using mock implementation, use it instead
    if (USE_MOCK_OPENAI) {
      return mockOpenAI.generateText(prompt, maxTokens, forceRefresh);
    }
    
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Calculate an appropriate max_tokens value if not provided
    const calculatedMaxTokens = maxTokens || Math.min(2000, Math.ceil(prompt.length / 3));
    
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: calculatedMaxTokens,
      temperature: 0.7,
    });
    
    return response.choices[0].message.content || '';
  } catch (error: any) {
    log(`Error generating text: ${error.message}`, 'openai');
    throw new Error(`Failed to generate text: ${error.message}`);
  }
}

/**
 * Extract information from a document image
 * @param base64Image Base64-encoded image data
 * @param prompt Prompt for information extraction
 * @returns Extracted information
 */
export async function extractDocumentInfo(
  base64Image: string,
  prompt: string
): Promise<any> {
  try {
    // If using mock implementation, use it instead
    if (USE_MOCK_OPENAI) {
      return mockOpenAI.extractDocumentInfo(base64Image, prompt);
    }
    
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${prompt}. Extract the information in JSON format.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });
    
    const resultText = response.choices[0].message.content || '{}';
    try {
      return JSON.parse(resultText);
    } catch (parseError: any) {
      log(`Error parsing JSON from OpenAI response: ${parseError.message}`, 'openai');
      return { rawResponse: resultText };
    }
  } catch (error: any) {
    log(`Error extracting document info: ${error.message}`, 'openai');
    throw new Error(`Failed to extract document info: ${error.message}`);
  }
}

/**
 * Analyze document using OpenAI vision capabilities
 * @param base64File Base64-encoded file data
 * @param analysisMode Type of analysis to perform
 * @param fileName Optional filename for context
 * @param customPrompt Optional custom prompt for analysis
 * @returns Analysis result as text
 */
export async function analyzeDocument(
  base64File: string,
  analysisMode: string,
  fileName?: string,
  customPrompt?: string
): Promise<string> {
  try {
    // If using mock implementation, use it instead
    if (USE_MOCK_OPENAI) {
      return mockOpenAI.analyzeDocument(base64File, analysisMode, fileName, customPrompt);
    }
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Generate appropriate prompt based on analysis mode
    let prompt = "Analyze this document in detail.";
    
    switch (analysisMode) {
      case "extract_info":
        prompt = "Extract all key information from this property document. Include details such as property address, parties involved, dates, financial terms, and any other significant information. Format the information in a structured way.";
        break;
      case "summarize":
        prompt = "Provide a comprehensive summary of this property document. Capture the main purpose, key agreements, obligations of each party, and important dates or deadlines.";
        break;
      case "risk_assessment":
        prompt = "Analyze this property document and identify potential risks or issues. Flag any concerning clauses, ambiguous language, missing information, or terms that may be disadvantageous to a tenant or buyer.";
        break;
      case "compliance_check":
        prompt = "Review this property document for compliance with standard regulations. Identify any terms that may not comply with typical housing regulations, tenant rights, or fair housing practices.";
        break;
      case "lease_review":
        prompt = "Analyze this lease agreement in detail. Extract key terms including rent amount, lease duration, security deposit, maintenance responsibilities, renewal terms, and any unusual clauses or restrictions. Flag any concerning items.";
        break;
      case "contract_highlights":
        prompt = "Extract and highlight the most important clauses and terms from this property contract. Focus on financial obligations, deadlines, contingencies, and any unusual terms that parties should be aware of.";
        break;
      case "custom":
        prompt = customPrompt || prompt;
        break;
    }
    
    // Add filename context if provided
    if (fileName) {
      prompt += `\nDocument filename: ${fileName}`;
    }
    
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
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
                url: `data:application/pdf;base64,${base64File}`,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });
    
    return response.choices[0].message.content || 'No analysis generated';
  } catch (error: any) {
    log(`Error analyzing document: ${error.message}`, 'openai');
    throw new Error(`Failed to analyze document: ${error.message}`);
  }
}

/**
 * Analyze compliance issues in a document
 * @param base64Image Base64-encoded image data
 * @param documentType Type of document being analyzed
 * @returns Compliance analysis
 */
export async function analyzeComplianceIssues(
  base64Image: string,
  documentType: string
): Promise<any> {
  try {
    // If using mock implementation, use it instead
    if (USE_MOCK_OPENAI) {
      return mockOpenAI.analyzeComplianceIssues(base64Image, documentType);
    }
    
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const prompt = `Analyze this ${documentType} for any compliance issues, missing information, or potential red flags. 
    Identify any areas that might fail regulatory checks or verification.
    Return your analysis in JSON format with the following structure:
    {
      "complianceStatus": "compliant", "minor_issues", or "major_issues",
      "issues": [list of specific issues found],
      "missingElements": [required elements that are missing],
      "recommendations": [suggestions to fix issues]
    }`;
    
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
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
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });
    
    const resultText = response.choices[0].message.content || '{}';
    try {
      return JSON.parse(resultText);
    } catch (parseError: any) {
      log(`Error parsing JSON from OpenAI response: ${parseError.message}`, 'openai');
      return { rawResponse: resultText, error: parseError.message };
    }
  } catch (error: any) {
    log(`Error analyzing compliance issues: ${error.message}`, 'openai');
    throw new Error(`Failed to analyze compliance issues: ${error.message}`);
  }
}

/**
 * Verify identity from document and selfie
 * @param documentImageBase64 Base64-encoded document image
 * @param selfieImageBase64 Base64-encoded selfie image
 * @param documentType Type of document
 * @returns Identity verification result
 */
export async function verifyIdentity(
  documentImageBase64: string,
  selfieImageBase64: string,
  documentType?: string
): Promise<any> {
  try {
    // If using mock implementation, use it instead
    if (USE_MOCK_OPENAI) {
      return mockOpenAI.verifyIdentity(documentImageBase64, selfieImageBase64, documentType);
    }
    
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // First step: Extract information from the ID document
    const docType = documentType || 'identification document';
    const documentPrompt = `Analyze this ${docType} and extract all personal information including name, date of birth, document number, expiry date, and any other relevant details. Return the information in JSON format.`;
    
    const documentResponse = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: documentPrompt,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${documentImageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });
    
    const documentInfo = JSON.parse(documentResponse.choices[0].message.content || '{}');
    
    // Second step: Compare the document photo with the selfie
    const comparisonPrompt = `Compare the face in this ID document with the selfie. 
    Determine if they show the same person.
    Consider aging, lighting, and angle differences.
    Provide a detailed analysis and a confidence score between 0 and 1.
    Format your response as JSON with these fields:
    {
      "isSamePerson": boolean,
      "confidenceScore": number between 0 and 1,
      "analysis": "detailed explanation of your reasoning"
    }`;
    
    const comparisonResponse = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: comparisonPrompt,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${documentImageBase64}`,
              },
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${selfieImageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });
    
    const comparisonResult = JSON.parse(comparisonResponse.choices[0].message.content || '{}');
    
    // Combine the results
    return {
      documentInfo,
      faceComparison: comparisonResult,
      verificationTimestamp: new Date().toISOString(),
      overallResult: {
        identityVerified: comparisonResult.isSamePerson && comparisonResult.confidenceScore >= 0.7,
        confidenceScore: comparisonResult.confidenceScore,
      }
    };
  } catch (error: any) {
    log(`Error verifying identity: ${error.message}`, 'openai');
    throw new Error(`Failed to verify identity: ${error.message}`);
  }
}

/**
 * Summarize a document
 * @param base64Image Base64-encoded document image
 * @param maxLength Maximum length of the summary
 * @returns Document summary
 */
export async function summarizeDocument(
  base64Image: string,
  maxLength: number = 300
): Promise<string> {
  try {
    // If using mock implementation, use it instead
    if (USE_MOCK_OPENAI) {
      return mockOpenAI.summarizeDocument(base64Image);
    }
    
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const prompt = `Summarize this document concisely in about ${maxLength} characters. Capture the key points, purpose, and important details.`;
    
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
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
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: Math.ceil(maxLength / 3),
    });
    
    return response.choices[0].message.content || '';
  } catch (error: any) {
    log(`Error summarizing document: ${error.message}`, 'openai');
    throw new Error(`Failed to summarize document: ${error.message}`);
  }
}

/**
 * Generate a floor plan from uploaded images
 * @param images Array of images with room labels
 * @returns Floor plan SVG and description
 */
export async function generateFloorPlan(images: Array<{buffer: Buffer, roomLabel: string}>): Promise<{
  svgContent: string;
  description: string;
  accuracy: number;
  roomLabels: string[];
}> {
  try {
    // If using mock implementation, use it instead
    if (USE_MOCK_OPENAI) {
      return mockOpenAI.generateFloorPlan(images);
    }
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    // Create OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // In a real implementation, we would:
    // 1. Process images to extract room features and dimensions
    // 2. Use GPT-4 Vision to analyze the images
    // 3. Generate SVG floor plan based on the analysis
    
    // For now, we'll just use the mock implementation
    log(`OpenAI floor plan generation is not yet implemented - using mock`, 'openai');
    return mockOpenAI.generateFloorPlan(images);
    
  } catch (error: any) {
    log(`Error generating floor plan: ${error.message}`, 'openai');
    throw new Error(`Failed to generate floor plan: ${error.message}`);
  }
}

/**
 * Generate an image using DALL-E
 * @param prompt Image generation prompt
 * @param size Size of the image (default: 1024x1024)
 * @returns Image data URL
 */
export async function generateImage(
  prompt: string,
  size: '1024x1024' | '1024x1792' | '1792x1024' = '1024x1024'
): Promise<string> {
  try {
    // If using mock implementation, use it instead
    if (USE_MOCK_OPENAI) {
      return mockOpenAI.generateImage(prompt);
    }
    
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size,
      quality: "standard",
    });
    
    return response.data[0].url || '';
  } catch (error: any) {
    log(`Error generating image: ${error.message}`, 'openai');
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}

/**
 * Generate a city image using DALL-E
 * @param cityName Name of the city to generate an image for
 * @param style Optional style parameter (architectural, modern, historic, etc.)
 * @returns URL of the generated image
 */
export async function generateCityImage(
  cityName: string, 
  style: string = 'photorealistic'
): Promise<string> {
  try {
    // Create a detailed prompt for the city
    let prompt = "";
    
    switch (cityName.toLowerCase()) {
      case 'london':
        prompt = `A beautiful aerial panorama of ${cityName}, UK, featuring iconic landmarks like Big Ben, Tower Bridge, and the London Eye. ${style} style with clear blue sky and Thames river view.`;
        break;
      case 'manchester':
        prompt = `A stunning cityscape of ${cityName}, UK, featuring modern buildings, historic architecture, and the iconic Manchester Town Hall. ${style} style with vibrant city atmosphere.`;
        break;
      case 'birmingham':
        prompt = `A panoramic view of ${cityName}, UK, showcasing the Library of Birmingham, Bullring shopping center, and canal network. ${style} style with urban vibrancy.`;
        break;
      case 'leeds':
        prompt = `A scenic view of ${cityName}, UK, highlighting the university campus, Leeds Town Hall, and modern city center. ${style} style with beautiful architecture.`;
        break;
      case 'liverpool':
        prompt = `A striking waterfront view of ${cityName}, UK, featuring the Royal Liver Building, Albert Dock, and the famous Three Graces buildings. ${style} style with historical maritime elements.`;
        break;
      default:
        prompt = `A beautiful city panorama of ${cityName}, UK, showing the distinctive character of this British university city. ${style} style with urban landscape elements.`;
    }
    
    // Add student housing context
    prompt += " Perfect for student housing website, showing a welcoming environment for university students.";
    
    // Generate and return the image
    return await generateImage(prompt, '1024x1024');
  } catch (error: any) {
    log(`Error generating city image: ${error.message}`, 'openai');
    throw new Error(`Failed to generate city image: ${error.message}`);
  }
}

/**
 * Verify a job listing for legitimacy and safety
 * @param job The job listing data to verify
 * @param employer Optional employer information for context
 * @returns Analysis results including safety score and issues
 */
export async function verifyJobListing(
  job: any,
  employer?: any
): Promise<{
  verified: boolean;
  safetyScore: number;
  issues: string[];
  recommendations: string[];
  flags: {
    potentialScam: boolean;
    unrealisticSalary: boolean;
    suspiciousRequirements: boolean;
    dataConcerns: boolean;
    suspiciousPaymentMethods: boolean;
  }
}> {
  if (USE_MOCK_OPENAI) {
    return getMockJobVerification();
  }
  
  try {
    const { title, description, salary, requirements, company } = job;
    
    // Combine all data into a single analysis string
    const jobData = JSON.stringify({ 
      title, 
      description, 
      salary, 
      requirements, 
      company,
      employerInfo: employer || {} 
    });
    
    const prompt = `You are an AI job safety validator analyzing this job for potential risks, scams, or inappropriate content.
    
Job data: ${jobData}

Analyze the job listing for safety concerns and provide a thorough assessment with the following structure:
1. Safety score (0-100)
2. List of potential issues (empty array if none found)
3. Recommendations to improve the listing (empty array if perfect)
4. Flags for specific concerns: potential scam, unrealistic salary, suspicious requirements, data privacy concerns, suspicious payment methods

Format your response as a valid JSON object with these fields:
{
  "safetyScore": number,
  "issues": string[],
  "recommendations": string[],
  "flags": {
    "potentialScam": boolean,
    "unrealisticSalary": boolean,
    "suspiciousRequirements": boolean,
    "dataConcerns": boolean,
    "suspiciousPaymentMethods": boolean
  }
}`;

    const response = await generateText(prompt, 2000);
    
    try {
      // Extract the JSON from the response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                          response.match(/```\n([\s\S]*?)\n```/) ||
                          response.match(/({[\s\S]*?})/);
                          
      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      const result = JSON.parse(jsonStr);
      
      return {
        verified: result.safetyScore >= 70,
        safetyScore: result.safetyScore,
        issues: result.issues || [],
        recommendations: result.recommendations || [],
        flags: result.flags || {
          potentialScam: false,
          unrealisticSalary: false,
          suspiciousRequirements: false,
          dataConcerns: false,
          suspiciousPaymentMethods: false
        }
      };
    } catch (parseError) {
      log(`Error parsing job verification response: ${parseError}`, 'openai');
      return getMockJobVerification();
    }
  } catch (error: any) {
    log(`Error verifying job listing: ${error.message}`, 'openai');
    throw new Error(`Failed to verify job listing: ${error.message}`);
  }
}

/**
 * Analyze a student's resume to extract skills and job compatibility
 * @param studentProfile The student profile data
 * @returns Analysis of skills and job compatibility
 */
export async function analyzeStudentResume(
  studentProfile: any
): Promise<{
  extractedSkills: string[];
  suggestedJobTypes: string[];
  educationLevel: string;
  experienceLevel: string;
  strengthAreas: string[];
  improvementAreas: string[];
  keywordDensity: Record<string, number>;
}> {
  if (USE_MOCK_OPENAI) {
    return getMockResumeAnalysis();
  }
  
  try {
    const { resume, education, experience, skills } = studentProfile;
    
    // Format the student data
    const studentData = JSON.stringify({
      resume, education, experience, skills
    });
    
    const prompt = `You are an AI resume analyzer. Analyze this student profile data to extract skills and determine job compatibility.

Student profile data: ${studentData}

Analyze the resume for skills, education level, experience level, strengths, and areas for improvement.
Format your response as a valid JSON object with these fields:
{
  "extractedSkills": string[],
  "suggestedJobTypes": string[],
  "educationLevel": string,
  "experienceLevel": string,
  "strengthAreas": string[],
  "improvementAreas": string[],
  "keywordDensity": { "keyword1": number, "keyword2": number, ... }
}`;

    const response = await generateText(prompt, 2000);
    
    try {
      // Extract the JSON from the response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                          response.match(/```\n([\s\S]*?)\n```/) ||
                          response.match(/({[\s\S]*?})/);
                          
      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      const result = JSON.parse(jsonStr);
      
      return {
        extractedSkills: result.extractedSkills || [],
        suggestedJobTypes: result.suggestedJobTypes || [],
        educationLevel: result.educationLevel || 'Undergraduate',
        experienceLevel: result.experienceLevel || 'Entry Level',
        strengthAreas: result.strengthAreas || [],
        improvementAreas: result.improvementAreas || [],
        keywordDensity: result.keywordDensity || {}
      };
    } catch (parseError) {
      log(`Error parsing resume analysis response: ${parseError}`, 'openai');
      return getMockResumeAnalysis();
    }
  } catch (error: any) {
    log(`Error analyzing student resume: ${error.message}`, 'openai');
    throw new Error(`Failed to analyze student resume: ${error.message}`);
  }
}

/**
 * Match student to jobs based on profile and available positions
 * @param studentProfile The student profile
 * @param availableJobs Array of available jobs to match against
 * @returns Ranked job matches with compatibility scores
 */
export async function matchStudentToJobs(
  studentProfile: any,
  availableJobs: any[]
): Promise<{
  matches: Array<{
    jobId: number;
    compatibility: number;
    matchReasons: string[];
    mismatchReasons: string[];
  }>;
  recommendedSkillsToAcquire: string[];
  suggestedSearchTerms: string[];
}> {
  if (USE_MOCK_OPENAI) {
    return getMockJobMatches(availableJobs);
  }
  
  try {
    // Format the student and jobs data
    const studentData = JSON.stringify(studentProfile);
    const jobsData = JSON.stringify(availableJobs.map(job => ({
      id: job.id,
      title: job.title,
      description: job.description,
      requiredSkills: job.requiredSkills,
      preferredSkills: job.preferredSkills,
      location: job.location,
      salary: job.salary,
      type: job.type
    })));
    
    const prompt = `You are an AI job matcher. Match this student profile data to available jobs based on compatibility.

Student profile: ${studentData}

Available jobs: ${jobsData}

Analyze the compatibility between the student profile and each job, providing a compatibility score (0-100), match reasons, and mismatch reasons for each job.
Also provide a list of recommended skills the student should acquire and suggested search terms.
Format your response as a valid JSON object with these fields:
{
  "matches": [
    {
      "jobId": number,
      "compatibility": number,
      "matchReasons": string[],
      "mismatchReasons": string[]
    },
    ...
  ],
  "recommendedSkillsToAcquire": string[],
  "suggestedSearchTerms": string[]
}`;

    const response = await generateText(prompt, 3000);
    
    try {
      // Extract the JSON from the response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                          response.match(/```\n([\s\S]*?)\n```/) ||
                          response.match(/({[\s\S]*?})/);
                          
      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      const result = JSON.parse(jsonStr);
      
      // Sort by compatibility score
      const sortedMatches = result.matches ? 
        result.matches.sort((a: any, b: any) => b.compatibility - a.compatibility) : 
        [];
      
      return {
        matches: sortedMatches,
        recommendedSkillsToAcquire: result.recommendedSkillsToAcquire || [],
        suggestedSearchTerms: result.suggestedSearchTerms || []
      };
    } catch (parseError) {
      log(`Error parsing job matching response: ${parseError}`, 'openai');
      return getMockJobMatches(availableJobs);
    }
  } catch (error: any) {
    log(`Error matching student to jobs: ${error.message}`, 'openai');
    throw new Error(`Failed to match student to jobs: ${error.message}`);
  }
}

/**
 * Generate an enhanced job description based on basic details
 * @param job The job details to enhance
 * @returns Enhanced job description and formatting
 */
export async function generateJobDescription(
  job: any
): Promise<{
  enhancedDescription: string;
  bulletPoints: string[];
  keySellingPoints: string[];
  suggestedTitle: string;
  suggestedTags: string[];
}> {
  if (USE_MOCK_OPENAI) {
    return getMockJobDescription(job);
  }
  
  try {
    // Format the job data
    const jobData = JSON.stringify({
      title: job.title,
      description: job.description,
      requiredSkills: job.requiredSkills,
      preferredSkills: job.preferredSkills,
      company: job.company,
      location: job.location,
      salary: job.salary,
      type: job.type
    });
    
    const prompt = `You are an AI job description writer. Enhance this job posting to make it more appealing and informative.

Job data: ${jobData}

Create an enhanced job description with compelling content.
Format your response as a valid JSON object with these fields:
{
  "enhancedDescription": string,
  "bulletPoints": string[],
  "keySellingPoints": string[],
  "suggestedTitle": string,
  "suggestedTags": string[]
}`;

    const response = await generateText(prompt, 2000);
    
    try {
      // Extract the JSON from the response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                          response.match(/```\n([\s\S]*?)\n```/) ||
                          response.match(/({[\s\S]*?})/);
                          
      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      const result = JSON.parse(jsonStr);
      
      return {
        enhancedDescription: result.enhancedDescription || job.description || '',
        bulletPoints: result.bulletPoints || [],
        keySellingPoints: result.keySellingPoints || [],
        suggestedTitle: result.suggestedTitle || job.title || '',
        suggestedTags: result.suggestedTags || []
      };
    } catch (parseError) {
      log(`Error parsing job description generation response: ${parseError}`, 'openai');
      return getMockJobDescription(job);
    }
  } catch (error: any) {
    log(`Error generating job description: ${error.message}`, 'openai');
    throw new Error(`Failed to generate job description: ${error.message}`);
  }
}

/**
 * Detect potential fraud in job listings
 * @param job The job details to analyze
 * @param employer Optional employer information
 * @returns Fraud detection results
 */
export async function detectJobFraud(
  job: any,
  employer?: any
): Promise<{
  fraudScore: number;
  fraudDetected: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  suspiciousElements: string[];
  recommendations: string[];
  flags: Record<string, boolean>;
}> {
  if (USE_MOCK_OPENAI) {
    return getMockFraudDetection();
  }
  
  try {
    // Format the job data
    const jobData = JSON.stringify({
      title: job.title,
      description: job.description,
      salary: job.salary,
      contactEmail: job.contactEmail,
      company: job.company,
      requiredSkills: job.requiredSkills,
      employerInfo: employer || {}
    });
    
    const prompt = `You are an AI fraud detection system analyzing job listings for potential scams or fraud.

Job data: ${jobData}

Thoroughly analyze the job listing for signs of fraud or suspicious elements.
Format your response as a valid JSON object with these fields:
{
  "fraudScore": number,
  "riskLevel": "low" | "medium" | "high" | "critical",
  "suspiciousElements": string[],
  "recommendations": string[],
  "flags": {
    "suspiciousSalary": boolean,
    "paymentUpfront": boolean,
    "personalInfoRequested": boolean,
    "vagueBenefits": boolean,
    "tooEasyQualifications": boolean,
    "unprofessionalLanguage": boolean,
    "suspiciousContact": boolean,
    "mismatchedEmployerInfo": boolean
  }
}`;

    const response = await generateText(prompt, 2000);
    
    try {
      // Extract the JSON from the response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                          response.match(/```\n([\s\S]*?)\n```/) ||
                          response.match(/({[\s\S]*?})/);
                          
      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      const result = JSON.parse(jsonStr);
      
      return {
        fraudScore: result.fraudScore || 0,
        fraudDetected: result.fraudScore >= 40,
        riskLevel: result.riskLevel || 'low',
        suspiciousElements: result.suspiciousElements || [],
        recommendations: result.recommendations || [],
        flags: result.flags || {}
      };
    } catch (parseError) {
      log(`Error parsing fraud detection response: ${parseError}`, 'openai');
      return getMockFraudDetection();
    }
  } catch (error: any) {
    log(`Error detecting job fraud: ${error.message}`, 'openai');
    throw new Error(`Failed to detect job fraud: ${error.message}`);
  }
}

/**
 * Mock implementation for job listing verification
 */
function getMockJobVerification() {
  return {
    verified: true,
    safetyScore: 85,
    issues: [],
    recommendations: [
      'Job listing appears legitimate based on automated checks',
      'Consider adding more specific details about responsibilities'
    ],
    flags: {
      potentialScam: false,
      unrealisticSalary: false,
      suspiciousRequirements: false,
      dataConcerns: false,
      suspiciousPaymentMethods: false
    }
  };
}

/**
 * Mock implementation for student resume analysis
 */
function getMockResumeAnalysis() {
  return {
    extractedSkills: ['JavaScript', 'React', 'Node.js', 'Communication', 'Problem Solving'],
    suggestedJobTypes: ['Software Developer', 'Web Developer', 'Frontend Developer'],
    educationLevel: 'Bachelor\'s',
    experienceLevel: 'Entry Level',
    strengthAreas: ['Technical skills', 'Project experience'],
    improvementAreas: ['Professional experience', 'Leadership roles'],
    keywordDensity: {
      'javascript': 3,
      'react': 2,
      'node': 1,
      'programming': 2
    }
  };
}

/**
 * Mock implementation for job matching
 */
function getMockJobMatches(availableJobs: any[]) {
  // Generate mock matches based on actual job IDs
  const mockMatches = availableJobs.slice(0, 3).map((job, index) => ({
    jobId: job.id,
    compatibility: 90 - (index * 10),
    matchReasons: ['Skills match job requirements', 'Location preference matches'],
    mismatchReasons: index === 0 ? [] : ['Some required skills missing']
  }));
  
  return {
    matches: mockMatches,
    recommendedSkillsToAcquire: ['Python', 'Data Analysis', 'SQL'],
    suggestedSearchTerms: ['developer', 'junior', 'technology']
  };
}

/**
 * Mock implementation for job description generation
 */
function getMockJobDescription(job: any) {
  const title = job.title || 'Software Developer';
  
  return {
    enhancedDescription: `This is an exciting opportunity to join our team as a ${title}. The role offers excellent growth opportunities and competitive compensation.`,
    bulletPoints: ['Competitive salary', 'Flexible working hours', 'Professional development opportunities'],
    keySellingPoints: ['Great work environment', 'Cutting-edge technology', 'Career advancement'],
    suggestedTitle: `${title} - Great Opportunity for Students`,
    suggestedTags: ['Technology', 'Developer', 'Student Friendly']
  };
}

/**
 * Mock implementation for job fraud detection
 */
function getMockFraudDetection(): {
  fraudScore: number;
  fraudDetected: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  suspiciousElements: string[];
  recommendations: string[];
  flags: Record<string, boolean>;
} {
  return {
    fraudScore: 5,
    fraudDetected: false,
    riskLevel: 'low' as const,
    suspiciousElements: [],
    recommendations: ['Job appears legitimate based on automated checks'],
    flags: {
      suspiciousSalary: false,
      paymentUpfront: false,
      personalInfoRequested: false,
      vagueBenefits: false,
      tooEasyQualifications: false,
      unprofessionalLanguage: false,
      suspiciousContact: false,
      mismatchedEmployerInfo: false
    }
  };
}

export default {
  checkApiKey,
  generatePropertyDescription,
  generateEmbeddings,
  analyzeImage,
  compareFaces,
  generateText,
  extractDocumentInfo,
  analyzeComplianceIssues,
  verifyIdentity,
  summarizeDocument,
  generateFloorPlan,
  generateImage,
  generateCityImage,
  verifyJobListing,
  analyzeStudentResume,
  matchStudentToJobs,
  generateJobDescription,
  detectJobFraud,
};