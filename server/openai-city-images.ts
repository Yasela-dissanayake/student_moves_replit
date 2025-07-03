/**
 * OpenAI City Image Generator
 * Generates images of cities using OpenAI's DALL-E 3 model
 */
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";
import { log } from "./vite";
import axios from "axios";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate an image of a city using OpenAI DALL-E 3
 * @param city The name of the city
 * @returns Object containing success status, image URL, and errors if any
 */
export async function generateCityImage(city: string): Promise<{
  success: boolean;
  imageUrl?: string;
  error?: string;
}> {
  try {
    // Ensure city is clean for prompt
    const cleanCity = city.trim();
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not set. Please set OPENAI_API_KEY environment variable.");
    }
    
    log(`Starting image generation for ${cleanCity} with DALL-E 3`, "openai-city-images");
    
    // Create prompt for the image generation
    const prompt = `Generate a beautiful aerial daytime photograph of the city center of ${cleanCity}, England. 
    Show iconic landmarks, architecture, and city features. The image should be realistic, high quality, 
    and look like a professional photograph taken on a clear day with good lighting. 
    Do not include any text overlay or watermarks.`;
    
    // Call OpenAI API to generate image
    const response = await openai.images.generate({
      model: "dall-e-3", // the newest OpenAI image model is "dall-e-3" which was released October 2023
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural", // For more photorealistic images
    });
    
    // Get the generated image URL
    const imageUrl = response.data[0].url;
    
    if (!imageUrl) {
      throw new Error("Failed to generate image - no URL returned from OpenAI");
    }
    
    // Save the image locally
    const imagePath = await saveImageLocally(imageUrl, cleanCity);
    
    return {
      success: true,
      imageUrl: imagePath,
    };
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Unknown error occurred during image generation";
    
    log(`Error generating city image for ${city}: ${errorMessage}`, "openai-city-images");
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Save an image from a URL to the local filesystem
 * @param imageUrl URL of the image to download
 * @param cityName Name of the city (used to create filename)
 * @returns Path to the saved image (relative to public directory)
 */
async function saveImageLocally(imageUrl: string, cityName: string): Promise<string> {
  try {
    // Create directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'city-images');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Generate unique filename
    const fileName = `${cityName.toLowerCase().replace(/\s+/g, '-')}-${uuidv4()}.jpg`;
    const filePath = path.join(uploadsDir, fileName);
    
    // Download image
    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'arraybuffer'
    });
    
    // Save image to disk
    fs.writeFileSync(filePath, response.data);
    
    // Return relative path for database storage
    return `/city-images/${fileName}`;
  } catch (error) {
    log(`Error saving image locally: ${error instanceof Error ? error.message : String(error)}`, "openai-city-images");
    throw error;
  }
}