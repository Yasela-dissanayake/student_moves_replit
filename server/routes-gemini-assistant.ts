/**
 * Gemini Assistant API Routes
 * Routes for enhanced Gemini AI assistant functionality
 */
import { Express, Request, Response } from "express";
import * as geminiAssistant from "./gemini-assistant";
import { storage } from "./storage";
import { log } from "./vite";
import { z } from "zod";
import { authenticateUser } from "./routes";

/**
 * Register Gemini Assistant API routes
 * @param app Express application instance
 */
export function registerGeminiAssistantRoutes(app: Express): void {
  // Schema for validating assistant query requests
  const assistantQuerySchema = z.object({
    query: z.string().min(2).max(500),
    propertyId: z.number().optional(),
    previousMessages: z.array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string()
      })
    ).optional()
  });

  // Schema for validating property description generation requests
  const propertyDescriptionSchema = z.object({
    title: z.string(),
    propertyType: z.string(),
    bedrooms: z.number(),
    bathrooms: z.number(),
    location: z.string(),
    university: z.string().optional(),
    features: z.array(z.string()),
    nearbyAmenities: z.array(z.string()).optional(),
    furnished: z.boolean(),
    garden: z.boolean().optional(),
    parking: z.boolean().optional(),
    billsIncluded: z.boolean(),
    includedBills: z.array(z.string()).optional(),
    additionalDetails: z.string().optional(),
    tone: z.enum(['professional', 'casual', 'luxury', 'student-focused']).optional()
  });

  /**
   * Endpoint for advanced AI assistant queries
   */
  app.post("/api/assistant/enhanced", authenticateUser, async (req: Request, res: Response) => {
    try {
      // Validate request
      const validation = assistantQuerySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid input",
          errors: validation.error.errors
        });
      }

      const { query, propertyId, previousMessages } = validation.data;
      const userId = (req as any).user.id;

      log(`Processing Gemini enhanced assistant query from user ${userId}: ${query.substring(0, 50)}...`, "routes-gemini-assistant");

      // Get response from Gemini assistant
      const response = await geminiAssistant.processAdvancedQuery(
        userId, 
        query,
        propertyId,
        previousMessages
      );

      res.status(200).json(response);
    } catch (error) {
      log(`Error in Gemini assistant endpoint: ${error.message}`, "routes-gemini-assistant");
      return res.status(500).json({
        message: "An error occurred while processing your request."
      });
    }
  });

  /**
   * Endpoint for generating enhanced property descriptions
   * with student-focused details
   */
  app.post("/api/assistant/property-description", authenticateUser, async (req: Request, res: Response) => {
    try {
      // Validate request
      const validation = propertyDescriptionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid input",
          errors: validation.error.errors
        });
      }

      const propertyDetails = validation.data;
      const userId = (req as any).user.id;

      log(`Generating enhanced property description for user ${userId}`, "routes-gemini-assistant");

      // Generate description
      const description = await geminiAssistant.generateEnhancedPropertyDescription(propertyDetails);

      return res.status(200).json({
        description
      });
    } catch (error) {
      log(`Error in enhanced property description endpoint: ${error.message}`, "routes-gemini-assistant");
      return res.status(500).json({
        message: "An error occurred while generating the property description."
      });
    }
  });

  /**
   * Endpoint to get common questions specific to property type
   */
  app.get("/api/assistant/common-questions", authenticateUser, async (req: Request, res: Response) => {
    try {
      const propertyType = req.query.propertyType as string;
      
      // Get common questions, potentially customized for property type
      const questions = await geminiAssistant.getEnhancedCommonQuestions(propertyType);
      
      return res.status(200).json({
        questions
      });
    } catch (error) {
      log(`Error fetching common questions: ${error.message}`, "routes-gemini-assistant");
      return res.status(500).json({
        message: "An error occurred while retrieving common questions."
      });
    }
  });

  /**
   * Endpoint to check assistant API availability
   */
  app.get("/api/assistant/status", authenticateUser, async (_req: Request, res: Response) => {
    try {
      const isAvailable = await geminiAssistant.checkApiAvailability();
      
      return res.status(200).json({
        available: isAvailable
      });
    } catch (error) {
      log(`Error checking Gemini assistant API availability: ${error.message}`, "routes-gemini-assistant");
      return res.status(500).json({
        available: false,
        message: "An error occurred while checking API availability."
      });
    }
  });

  log("Gemini enhanced assistant routes registered", "routes");
}