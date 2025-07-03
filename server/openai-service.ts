/**
 * OpenAI Service
 * Provides access to OpenAI API functionality
 */

import OpenAI from "openai";
import logger from "./utils/logger";
import fs from "fs";
import path from "path";

const logModule = "openai-service";

// SVG templates and utilities for floor plan generation
const svgHeader = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <style>
    .room { fill: #f0f4f8; stroke: #1a3d5c; stroke-width: 3; }
    .door { fill: none; stroke: #666; stroke-width: 2; }
    .window { fill: #d6eaf8; stroke: #3498db; stroke-width: 2; }
    .text { font-family: Arial; font-size: 14px; fill: #333; }
    .dimension { font-family: Arial; font-size: 12px; fill: #777; }
  </style>
  <rect width="100%" height="100%" fill="white" />
`

const svgFooter = `</svg>`;

// Environment API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Check for API key
export function hasSystemApiKey(): boolean {
  return !!OPENAI_API_KEY;
}

/**
 * Create an OpenAI client with the provided API key
 * @param apiKey API key to use (falls back to env var)
 * @returns OpenAI client
 */
export function createOpenAIClient(apiKey?: string): OpenAI {
  const key = apiKey || OPENAI_API_KEY;
  
  if (!key) {
    throw new Error("No OpenAI API key provided");
  }
  
  return new OpenAI({ apiKey: key });
}

/**
 * Validate an OpenAI API key by making a simple model list request
 * @param apiKey API key to validate
 * @returns true if valid, false otherwise
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    if (!apiKey || apiKey.trim() === "") {
      return false;
    }
    
    const client = createOpenAIClient(apiKey);
    const response = await client.models.list();
    
    return !!response.data && response.data.length > 0;
  } catch (error) {
    logger.logError("Error validating OpenAI API key:", logModule, error);
    return false;
  }
}

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
  tone?: "professional" | "casual" | "enthusiastic" | "luxury";
  length?: "short" | "medium" | "long";
  highlightStudentFeatures?: boolean;
  includeSEO?: boolean;
  includeTransportation?: boolean;
  includeUniversityDistance?: boolean;
  furnished: boolean;
}

/**
 * Generate a property description using OpenAI
 * @param params Property description parameters
 * @param apiKey Optional custom API key
 * @returns Generated description
 */
export async function generatePropertyDescription(
  params: PropertyDescriptionParams,
  apiKey?: string
): Promise<string> {
  try {
    const openai = createOpenAIClient(apiKey);
    
    // Construct prompt
    let prompt = `Generate a ${params.length || 'medium'} length, ${params.tone || 'professional'} description for a ${params.bedrooms} bedroom, ${params.bathrooms} bathroom ${params.propertyType} in ${params.location}.`;
    
    if (params.title) {
      prompt += ` The property title is: "${params.title}".`;
    }
    
    if (params.furnished) {
      prompt += ` The property is fully furnished.`;
    } else {
      prompt += ` The property is unfurnished.`;
    }
    
    if (params.features && params.features.length > 0) {
      prompt += ` Key features include: ${params.features.join(", ")}.`;
    }
    
    if (params.nearbyAmenities && params.nearbyAmenities.length > 0) {
      prompt += ` Nearby amenities include: ${params.nearbyAmenities.join(", ")}.`;
    }
    
    if (params.university && params.includeUniversityDistance) {
      prompt += ` The property is near ${params.university}.`;
    }
    
    if (params.highlightStudentFeatures) {
      prompt += ` Highlight features that would be attractive to students.`;
    }
    
    if (params.includeTransportation) {
      prompt += ` Include information about transportation options.`;
    }
    
    if (params.includeSEO) {
      prompt += ` Include relevant SEO keywords for student property rentals.`;
    }
    
    prompt += ` Write the description in a way that would appeal to potential renters, especially students.`;
    
    // Request description from OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { 
          role: "system", 
          content: "You are a professional property description writer specializing in student accommodations. Your descriptions are engaging, accurate, and highlight the best features of a property. Avoid exaggeration or misleading statements."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: params.length === "short" ? 250 : params.length === "long" ? 750 : 500,
    });
    
    return response.choices[0].message.content || "Unable to generate description";
  } catch (error) {
    logger.logError("Error generating property description:", logModule, error);
    throw new Error(`Failed to generate property description: ${error.message}`);
  }
}

/**
 * Analyze an image using OpenAI Vision
 * @param base64Image Base64 encoded image
 * @param prompt Prompt for image analysis
 * @param apiKey Optional custom API key
 * @returns Analysis result
 */
export async function analyzeImage(
  base64Image: string,
  prompt: string = "Analyze this property image in detail. What are the key features, condition issues, and staging suggestions?",
  apiKey?: string
): Promise<string> {
  try {
    const openai = createOpenAIClient(apiKey);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });
    
    return response.choices[0].message.content || "Unable to analyze image";
  } catch (error) {
    logger.logError("Error analyzing image:", logModule, error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

/**
 * Generate an image using OpenAI DALL-E
 * @param prompt Image generation prompt
 * @param apiKey Optional custom API key
 * @returns URL of generated image
 */
export async function generateImage(
  prompt: string,
  apiKey?: string
): Promise<string> {
  try {
    const openai = createOpenAIClient(apiKey);
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
    });
    
    return response.data[0].url || "";
  } catch (error) {
    logger.logError("Error generating image:", logModule, error);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}

/**
 * Interface for room details in floor plan generation
 */
export interface RoomDetails {
  name: string;
  dimensions?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  doors?: { x: number; y: number; length: number; direction: string }[];
  windows?: { x: number; y: number; length: number; direction: string }[];
}

/**
 * Interface for floor plan generation parameters
 */
export interface FloorPlanGenerationParams {
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  images?: string[]; // Base64 encoded images
  existingRoomData?: RoomDetails[];
  kitchen?: boolean;
  livingRoom?: boolean;
  diningRoom?: boolean;
  garden?: boolean;
  balcony?: boolean;
  additionalRooms?: string[];
  floorNumber?: number;
  customInstructions?: string;
}

/**
 * Interface for floor plan generation result
 */
export interface FloorPlanGenerationResult {
  svgContent: string;
  roomLabels: RoomDetails[];
  accuracy: number;
  imageCount: number;
}

/**
 * Generate a property floor plan using OpenAI Vision and GPT-4o
 * @param params Floor plan generation parameters
 * @param apiKey Optional custom API key
 * @returns Generated floor plan as SVG with room data
 */
export async function generateFloorPlan(
  params: FloorPlanGenerationParams,
  apiKey?: string
): Promise<FloorPlanGenerationResult> {
  try {
    const openai = createOpenAIClient(apiKey);
    
    // Create an array of messages to send to OpenAI
    const messages = [];
    
    // System message with detailed instructions
    messages.push({
      role: "system",
      content: `You are an expert architectural floor plan designer. Your task is to create accurate, detailed SVG floor plans based on property descriptions and images. 
      
      Analyze all available information and produce a coherent floor plan that follows these guidelines:
      1. Create the SVG as a comprehensive floor plan with room dimensions in proper scale
      2. Add appropriate room labels, doors, windows and fixtures
      3. Draw walls as 3px solid lines (#1a3d5c)
      4. Use consistent scale throughout the plan
      5. Draw rooms with the "room" CSS class
      6. Draw doors with the "door" CSS class
      7. Draw windows with the "window" CSS class
      8. Add text labels using the "text" CSS class
      9. Add room dimensions using the "dimension" CSS class
      10. Return only the SVG elements that should go inside the main <svg> tag, not the full SVG with header and footer`
    });
    
    // Create a detailed prompt based on the parameters
    let prompt = `Create a detailed floor plan for a ${params.propertyType} with ${params.bedrooms} bedroom(s) and ${params.bathrooms} bathroom(s).`;
    
    if (params.kitchen) prompt += " Include a kitchen.";
    if (params.livingRoom) prompt += " Include a living room.";
    if (params.diningRoom) prompt += " Include a dining room.";
    if (params.garden) prompt += " Include a garden area.";
    if (params.balcony) prompt += " Include a balcony.";
    
    if (params.additionalRooms && params.additionalRooms.length > 0) {
      prompt += ` Additional rooms: ${params.additionalRooms.join(", ")}.`;
    }
    
    if (params.floorNumber !== undefined) {
      prompt += ` This is floor ${params.floorNumber} of the building.`;
    }
    
    if (params.customInstructions) {
      prompt += ` ${params.customInstructions}`;
    }
    
    prompt += " Create a realistic and proportional floor plan that would make sense for this type of property.";
    
    // Add base text prompt
    messages.push({
      role: "user", 
      content: prompt
    });
    
    // If we have images, add them to the messages
    if (params.images && params.images.length > 0) {
      // Create a new message that includes the images
      const imageMessageContent = [
        {
          type: "text",
          text: "Here are some images of the property to help you create an accurate floor plan:"
        }
      ];
      
      // Add each image to the content
      params.images.forEach(base64Image => {
        imageMessageContent.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`
          }
        });
      });
      
      // Add the message with images
      messages.push({
        role: "user",
        content: imageMessageContent
      });
      
      // Add a final instruction after images
      messages.push({
        role: "user",
        content: "Based on these images and the property details, create a detailed SVG floor plan. Return ONLY the SVG elements (not the full SVG with header and footer) and information about the room dimensions and layout in JSON format."
      });
    }
    
    // If we have existing room data, provide it
    if (params.existingRoomData && params.existingRoomData.length > 0) {
      messages.push({
        role: "user",
        content: `Here is existing room layout data. Incorporate this into your plan but improve it if needed: ${JSON.stringify(params.existingRoomData)}`
      });
    }
    
    // Completion request with JSON response format
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: messages,
      temperature: 0.2, // Lower temperature for more consistent results
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });
    
    // Parse the response
    const content = response.choices[0].message.content;
    let result;
    
    try {
      // Try to parse the response as JSON
      result = JSON.parse(content);
      
      // Validate that we have the necessary data
      if (!result.svgContent) {
        throw new Error("Missing SVG content in response");
      }
      
      // Construct the full SVG
      const fullSvg = svgHeader + result.svgContent + svgFooter;
      
      // Return the result
      return {
        svgContent: fullSvg,
        roomLabels: result.roomLabels || [],
        accuracy: result.accuracy || 70,
        imageCount: params.images?.length || 0
      };
    } catch (parseError) {
      // If we can't parse the JSON, attempt to extract the SVG content
      logger.logError("Error parsing floor plan JSON:", logModule, parseError);
      
      // Look for SVG content between markers or tags
      const svgMatch = content.match(/<g.*>[\s\S]*<\/g>/);
      if (svgMatch) {
        const extractedSvg = svgMatch[0];
        const fullSvg = svgHeader + extractedSvg + svgFooter;
        
        return {
          svgContent: fullSvg,
          roomLabels: [],
          accuracy: 50,
          imageCount: params.images?.length || 0
        };
      }
      
      throw new Error("Failed to parse floor plan response");
    }
  } catch (error) {
    logger.logError("Error generating floor plan:", logModule, error);
    throw new Error(`Failed to generate floor plan: ${error.message}`);
  }
}