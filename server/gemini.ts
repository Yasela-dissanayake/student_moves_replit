import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { log } from "./vite";
import { PropertyDescriptionParams } from "@shared/schema";
import * as geminiIdVerification from './gemini-id-verification';

// Validate Gemini API key
const apiKey = process.env.GEMINI_API_KEY;
let isValidApiKey = false;

if (!apiKey) {
  log("WARNING: GEMINI_API_KEY is not set", "gemini");
} else {
  isValidApiKey = true;
  // Mask the key for logging (show first 4 chars and last 4 chars)
  const maskedKey = apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4);
  log(`Gemini API key configured: ${maskedKey}`, "gemini");
}

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(apiKey || "");
log("Gemini client initialized", "gemini");

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

// Generate property description based on property details
export async function generatePropertyDescription(propertyDetails: PropertyDescriptionParams): Promise<string> {
  try {
    // Check if API key is valid before making the request
    if (!isValidApiKey) {
      log("Cannot generate property description: Invalid or missing Gemini API key", "gemini");
      return "Description generation failed: Gemini API key is invalid or missing. Please contact support to configure the API key.";
    }
    
    // Customize tone and approach based on property details
    let toneGuidance = "";
    if (propertyDetails.tone) {
      switch (propertyDetails.tone) {
        case 'professional':
          toneGuidance = "Use a professional, informative tone with clear descriptions.";
          break;
        case 'casual':
          toneGuidance = "Use a friendly, conversational tone that appeals to young renters.";
          break;
        case 'luxury':
          toneGuidance = "Use sophisticated language that highlights premium features and creates an upscale impression.";
          break;
        case 'student-focused':
          toneGuidance = "Focus on the student lifestyle, convenience, and social aspects of the property.";
          break;
      }
    } else {
      toneGuidance = "Focus on the student lifestyle, convenience, and social aspects of the property.";
    }
    
    // Property type-specific guidance
    let propertyTypeGuidance = "";
    if (propertyDetails.propertyCategory) {
      switch (propertyDetails.propertyCategory) {
        case 'hmo':
          propertyTypeGuidance = "Emphasize the communal aspects, shared facilities, and individual privacy features for this House in Multiple Occupation.";
          break;
        case 'studio':
          propertyTypeGuidance = "Highlight the efficient use of space, convenient layout, and privacy benefits of this studio accommodation.";
          break;
        case 'ensuite':
          propertyTypeGuidance = "Focus on the private bathroom facilities, included furniture, and the balance between privacy and community living.";
          break;
        case 'shared':
          propertyTypeGuidance = "Emphasize the social aspects, communal facilities, and cost-effectiveness of this shared accommodation.";
          break;
      }
    }
    
    // SEO optimization guidance
    const seoGuidance = propertyDetails.optimizeForSEO 
      ? "Include relevant keywords for student accommodation searches such as 'student housing', 'university accommodation', 'all-inclusive student property', and location-specific terms." 
      : "";
    
    // Determine word count
    const wordCount = propertyDetails.maxLength || 200;
    
    // Target audience
    const targetAudience = propertyDetails.target || 'students';
    
    // Build prompt
    const prompt = `Generate a compelling and detailed property description for ${targetAudience} accommodation with the following details:
    
    Title: ${propertyDetails.title}
    Property Type: ${propertyDetails.propertyType}
    Bedrooms: ${propertyDetails.bedrooms}
    Bathrooms: ${propertyDetails.bathrooms}
    Location: ${propertyDetails.location}
    University: ${propertyDetails.university || 'Nearby university'}
    Features: ${propertyDetails.features.join(', ')}
    ${propertyDetails.nearbyAmenities ? `Nearby Amenities: ${propertyDetails.nearbyAmenities.join(', ')}` : ''}
    ${propertyDetails.pricePoint ? `Price Range: ${propertyDetails.pricePoint}` : ''}
    
    ${propertyTypeGuidance}
    
    ${toneGuidance}
    
    ${propertyDetails.highlightUtilities !== false ? 'The description should highlight the all-inclusive utilities (gas, water, electricity, and broadband) and emphasize benefits for students.' : ''}
    
    ${seoGuidance}
    
    Create a compelling, detailed description of approximately ${wordCount} words.
    Do not include any placeholders, pricing, or fictional details not mentioned above.`;

    log("Generating property description with Gemini...", "gemini");
    
    // Using Gemini 1.5 Pro for text generation with optimized parameters
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro", 
      safetySettings,
      generationConfig: {
        temperature: 0.7,  // Higher temperature for more creative property descriptions
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1500,  // Allow for longer, more detailed descriptions
      }
    });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    const response = result.response;
    const description = response.text() || "Description could not be generated.";
    
    log(`Property description generated successfully: ${description.substring(0, 50)}...`, "gemini");
    return description;
  } catch (error: any) {
    // Handle different types of errors
    if (error.message.includes("API key")) {
      log(`Authentication error with Gemini API: ${error.message}`, "gemini");
      return "Description generation failed: Gemini API key is invalid. Please contact support to update the API key.";
    } else if (error.message.includes("rate limit") || error.message.includes("quota")) {
      log(`Rate limit exceeded with Gemini API: ${error.message}`, "gemini");
      return "Description generation failed: Gemini API rate limit exceeded. Please try again later.";
    } else if (error.message.includes("internal")) {
      log(`Gemini API server error: ${error.message}`, "gemini");
      return "Description generation failed: Gemini API service is experiencing issues. Please try again later.";
    } else {
      log(`Error generating property description: ${error.message}`, "gemini");
      return "Description could not be generated. Please try again later.";
    }
  }
}

// Generic text generation function
export async function generateText(
  prompt: string, 
  maxTokens?: number, 
  responseFormat?: 'json_object' | boolean
): Promise<string> {
  try {
    // Check if API key is valid before making the request
    if (!isValidApiKey) {
      log("Cannot generate text: Invalid or missing Gemini API key", "gemini");
      return "Text generation failed: Gemini API key is invalid or missing. Please contact support to configure the API key.";
    }
    
    // Log if we're requesting JSON output
    if (responseFormat === 'json_object') {
      log(`Generating JSON response with Gemini using prompt: ${prompt.substring(0, 50)}...`, "gemini");
    } else {
      log(`Generating text with Gemini using prompt: ${prompt.substring(0, 50)}...`, "gemini");
    }
    
    // Using Gemini 1.5 Pro for text generation
    // The newest version is gemini-1.5-pro as of April 2025
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      safetySettings,
      generationConfig: {
        maxOutputTokens: maxTokens || 8192,
        // Lower temperature for JSON responses to ensure valid syntax
        temperature: responseFormat === 'json_object' ? 0.2 : 0.3,
        // Note: Gemini API doesn't support the response_format field like OpenAI
        // We'll modify the prompt instead to request JSON
      }
    });
    
    // Modify the prompt if JSON format is requested
    let updatedPrompt = prompt;
    
    // Add JSON format request to the prompt since Gemini doesn't support response_format
    if (responseFormat === 'json_object') {
      updatedPrompt = `${updatedPrompt}\n\nIMPORTANT: Return the response ONLY as a valid JSON object or array without any additional text, explanations, or markdown formatting. The response should be a properly formatted JSON that can be parsed directly. Do not wrap the JSON in code blocks or add any other text before or after the JSON.`;
    }
    
    // Add a small randomization element for boolean refresh to ensure new content
    if (responseFormat === true) {
      updatedPrompt = `${updatedPrompt}\n\n(Generating fresh content at timestamp: ${Date.now()})`;
    }
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: updatedPrompt }] }]
    });
    const response = result.response;
    const generatedText = response.text() || "Text could not be generated.";
    
    log(`Text generated successfully: ${generatedText.substring(0, 50)}...`, "gemini");
    return generatedText;
  } catch (error: any) {
    // Handle different types of errors
    if (error.message.includes("API key")) {
      log(`Authentication error with Gemini API: ${error.message}`, "gemini");
      return "Text generation failed: Gemini API key is invalid. Please contact support to update the API key.";
    } else if (error.message.includes("rate limit") || error.message.includes("quota")) {
      log(`Rate limit exceeded with Gemini API: ${error.message}`, "gemini");
      return "Text generation failed: Gemini API rate limit exceeded. Please try again later.";
    } else if (error.message.includes("internal")) {
      log(`Gemini API server error: ${error.message}`, "gemini");
      return "Text generation failed: Gemini API service is experiencing issues. Please try again later.";
    } else {
      log(`Error generating text: ${error.message}`, "gemini");
      return "Text could not be generated. Please try again later.";
    }
  }
}

// Gemini Vision API for face comparison - using dedicated implementation from gemini-id-verification.ts

export async function compareFaces(
  originalImageBase64: string,
  newImageBase64: string,
  threshold: number = 0.7
): Promise<any> {
  try {
    // Check if API key is valid before making the request
    if (!isValidApiKey) {
      log("Cannot compare faces: Invalid or missing Gemini API key", "gemini");
      throw new Error("Gemini API key is invalid or missing");
    }
    
    log("Comparing facial images with Gemini Vision (using dedicated implementation)...", "gemini");
    
    // Use the dedicated implementation in gemini-id-verification.ts
    const result = await geminiIdVerification.compareFaces(
      originalImageBase64, 
      newImageBase64, 
      threshold
    );
    
    log(`Face comparison completed with confidence score: ${result.confidenceScore.toFixed(2)}`, "gemini");
    
    return result;
  } catch (error: any) {
    // Handle different types of errors
    if (error.message.includes("API key")) {
      log(`Authentication error with Gemini API: ${error.message}`, "gemini");
      throw new Error("Gemini API key is invalid");
    } else if (error.message.includes("rate limit") || error.message.includes("quota")) {
      log(`Rate limit exceeded with Gemini API: ${error.message}`, "gemini");
      throw new Error("Gemini API rate limit exceeded");
    } else if (error.message.includes("internal")) {
      log(`Gemini API server error: ${error.message}`, "gemini");
      throw new Error("Gemini API service is experiencing issues");
    } else {
      log(`Error comparing faces: ${error.message}`, "gemini");
      throw new Error("Face comparison failed: " + error.message);
    }
  }
}

// Check if Gemini API key is valid
export async function checkApiKey(): Promise<boolean> {
  if (!apiKey) {
    return false;
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "hello" }] }],
    });
    log("Gemini API key verified successfully", "gemini");
    return true;
  } catch (error) {
    log(`Error checking Gemini API key: ${error}`, "gemini");
    return false;
  }
}

// Function specifically for utility-provider-search.ts
export async function generateGeminiResponse(
  prompt: string,
  outputAsJson: boolean = false
): Promise<string> {
  try {
    // Check if API key is valid before making the request
    if (!isValidApiKey) {
      log("Cannot generate response: Invalid or missing Gemini API key", "gemini");
      return JSON.stringify({
        error: "Gemini API key is invalid or missing. Please contact support to configure the API key."
      });
    }
    
    log(`Generating utility provider data with Gemini using prompt: ${prompt.substring(0, 50)}...`, "gemini");
    
    // Using Gemini 1.5 Pro for text generation
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      safetySettings,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: outputAsJson ? 0.2 : 0.4, // Lower temperature for JSON responses
      }
    });
    
    // Modify the prompt if JSON format is requested
    let updatedPrompt = prompt;
    
    if (outputAsJson) {
      updatedPrompt = `${updatedPrompt}\n\nIMPORTANT: Return the response ONLY as a valid JSON object or array without any additional text, explanations, or markdown formatting. The response should be a properly formatted JSON that can be parsed directly.`;
    }
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: updatedPrompt }] }]
    });
    const response = result.response;
    const generatedText = response.text() || "Response could not be generated.";
    
    log(`Utility provider data generated successfully: ${generatedText.substring(0, 50)}...`, "gemini");
    
    if (outputAsJson) {
      try {
        // Verify that the response is valid JSON
        JSON.parse(generatedText);
        return generatedText;
      } catch (jsonError) {
        log(`Generated text is not valid JSON: ${jsonError}`, "gemini");
        return JSON.stringify({ 
          error: "Generated content is not valid JSON. Please try again." 
        });
      }
    }
    
    return generatedText;
  } catch (error: any) {
    // Handle different types of errors
    const errorMessage = error.message || "Unknown error";
    log(`Error generating utility provider data: ${errorMessage}`, "gemini");
    
    if (outputAsJson) {
      return JSON.stringify({ 
        error: `Failed to generate data: ${errorMessage}`
      });
    }
    
    return `Failed to generate data: ${errorMessage}`;
  }
}