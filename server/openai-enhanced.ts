import OpenAI from "openai";
import { log } from "./utils/logger";

/*
Implementation based on the latest OpenAI standards:
1. Using "gpt-4o" which is the newest OpenAI model released May 13, 2024. 
   // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
2. Using response_format: { type: "json_object" } option for structured responses
3. Requesting output in JSON format in the prompt for consistency
*/

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Basic text analysis example
export async function summarizeArticle(text: string): Promise<string> {
  const prompt = `Please summarize the following text concisely while maintaining key points:\n\n${text}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content || "No summary generated";
}

export async function analyzeSentiment(text: string): Promise<{
  rating: number,
  confidence: number
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a sentiment analysis expert. Analyze the sentiment of the text and provide a rating from 1 to 5 stars and a confidence score between 0 and 1. Respond with JSON in this format: { 'rating': number, 'confidence': number }",
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      rating: Math.max(1, Math.min(5, Math.round(result.rating || 3))),
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
    };
  } catch (error) {
    log(`Error analyzing sentiment: ${error}`, "openai-enhanced");
    throw new Error("Failed to analyze sentiment: " + (error instanceof Error ? error.message : String(error)));
  }
}

// Enhanced image analysis example with more detailed processing
export async function analyzePropertyImage(base64Image: string, analysisMode: string, customPrompt?: string): Promise<string> {
  let prompt = "Analyze this property image in detail.";
  
  // Generate appropriate prompt based on analysis mode
  switch (analysisMode) {
    case "general":
      prompt = "Analyze this property image in detail. What are the key features visible, overall style, and notable aspects of this space?";
      break;
    case "features":
      prompt = "Identify all features visible in this property image. List all amenities, fixtures, and notable elements with bullet points.";
      break;
    case "condition":
      prompt = "Assess the condition of this property based on the image. Identify any visible maintenance issues, wear and tear, or areas that may need attention.";
      break;
    case "risk-assessment":
      prompt = "Perform a detailed risk assessment of this property image. Identify potential hazards, compliance issues, and safety concerns. Categorize risks by severity (high/medium/low) and provide recommendations for remediation.";
      break;
    case "custom":
      prompt = customPrompt || prompt;
      break;
  }

  try {
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      max_tokens: 1000,
    });

    return visionResponse.choices[0].message.content || "No analysis generated";
  } catch (error) {
    log(`Error analyzing property image: ${error}`, "openai-enhanced");
    throw new Error("Failed to analyze property image: " + (error instanceof Error ? error.message : String(error)));
  }
}

// Enhanced document analysis for property documents
export async function analyzeDocument(base64Document: string, analysisMode: string, customPrompt?: string): Promise<string> {
  let prompt = "Analyze this property document in detail.";
  
  // Generate appropriate prompt based on analysis mode
  switch (analysisMode) {
    case "lease-analysis":
      prompt = "Analyze this lease document in detail. Identify key terms, obligations, potential issues or unfavorable clauses for tenants, and important dates. Structure your response with clear sections and bullet points where appropriate.";
      break;
    case "compliance-check":
      prompt = "Review this property document for compliance with typical rental regulations. Identify any potentially problematic clauses, missing required sections, or language that may not meet current housing standards.";
      break;
    case "summarization":
      prompt = "Summarize this property document concisely, extracting the most important information a tenant should know. Focus on financial obligations, key dates, restrictions, and termination conditions.";
      break;
    case "risk-assessment":
      prompt = "Perform a detailed risk assessment of this document from a tenant's perspective. Identify potential financial, legal, or practical risks. Categorize risks by severity (high/medium/low) and provide recommendations for negotiation or mitigation.";
      break;
    case "custom":
      prompt = customPrompt || prompt;
      break;
  }

  try {
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Document}`
              }
            }
          ],
        },
      ],
      max_tokens: 2000, // Document analysis may need more tokens
    });

    return visionResponse.choices[0].message.content || "No analysis generated";
  } catch (error) {
    log(`Error analyzing property document: ${error}`, "openai-enhanced");
    throw new Error("Failed to analyze property document: " + (error instanceof Error ? error.message : String(error)));
  }
}

// Image generation example with updated implementation
export async function generatePropertyImage(prompt: string): Promise<{ url: string }> {
  try {
    const enhancedPrompt = `High-quality real estate photography of a property: ${prompt}. Professional lighting, wide angle, staged interior, clean composition.`;
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return { url: response.data[0].url || "" };
  } catch (error) {
    log(`Error generating property image: ${error}`, "openai-enhanced");
    throw new Error("Failed to generate property image: " + (error instanceof Error ? error.message : String(error)));
  }
}

// Floor plan generation - structured analysis of room images
export async function generateFloorPlanData(roomImages: Array<{base64: string, label: string}>): Promise<any> {
  try {
    // Extract room dimensions, features, and layout information from each room image
    const roomsAnalysis = await Promise.all(roomImages.map(async (room) => {
      const prompt = `Analyze this image of a room labeled "${room.label}". Provide the following information in JSON format:
      1. Estimated dimensions (length and width)
      2. Key features and fixtures visible
      3. Doorway and window positions
      4. Any notable architectural elements`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${room.base64}`
                }
              }
            ],
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        roomName: room.label,
        ...result
      };
    }));

    // Now create a structured floor plan layout description
    const floorPlanResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional architect creating floor plan layouts."
        },
        {
          role: "user",
          content: `Based on the following room analysis data, generate a comprehensive floor plan description and suggest how the rooms might connect to each other. Rooms: ${JSON.stringify(roomsAnalysis)}`
        }
      ],
      response_format: { type: "json_object" },
    });

    return {
      roomsData: roomsAnalysis,
      floorPlanLayout: JSON.parse(floorPlanResponse.choices[0].message.content || "{}")
    };
  } catch (error) {
    log(`Error generating floor plan data: ${error}`, "openai-enhanced");
    throw new Error("Failed to generate floor plan data: " + (error instanceof Error ? error.message : String(error)));
  }
}

// Check if API key is valid and connectivity is working
export async function checkApiKey(): Promise<boolean> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Test connection" }],
      max_tokens: 5
    });
    
    return response.choices && response.choices.length > 0;
  } catch (error) {
    log(`OpenAI API key validation failed: ${error}`, "openai-enhanced");
    return false;
  }
}