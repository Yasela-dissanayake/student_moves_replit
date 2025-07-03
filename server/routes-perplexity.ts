/**
 * Perplexity API Routes
 * Routes for Perplexity AI integration with the platform
 */
import { Express, Request, Response } from "express";
import * as perplexityService from "./perplexity";
import { storage } from "./storage";
import { log } from "./vite";
import { z } from "zod";
import { authenticateUser } from "./routes";

/**
 * Register Perplexity API routes
 * @param app Express application instance
 */
export function registerPerplexityRoutes(app: Express): void {
  // Schema for validating assistant query requests
  const assistantQuerySchema = z.object({
    query: z.string().min(2).max(500),
    propertyId: z.number().optional(),
    previousMessages: z.array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
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
   * Endpoint for querying the Perplexity-powered assistant
   */
  app.post("/api/perplexity/assistant", authenticateUser, async (req: Request, res: Response) => {
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

      log(`Processing Perplexity assistant query from user ${userId}: ${query.substring(0, 50)}...`, "routes-perplexity");

      // Get context data
      const contextData: any = {};

      // Add user details
      const user = await storage.getUserById(userId);
      if (user) {
        contextData.userDetails = {
          name: user.name,
          email: user.email,
          userType: user.userType
        };
      }

      // Add property details if provided
      if (propertyId) {
        const property = await storage.getProperty(propertyId);
        if (property) {
          contextData.propertyDetails = property;
        }

        // Add tenancy details if available
        const tenancies = await storage.getTenanciesByProperty(propertyId);
        if (tenancies && tenancies.length > 0) {
          // Find tenancy for this user
          const userTenancy = tenancies.find(t => t.tenantId === userId);
          if (userTenancy) {
            contextData.tenancyDetails = userTenancy;
          }
        }
      } else {
        // Try to find property from user's tenancies
        const tenancies = await storage.getTenanciesByTenant(userId);
        if (tenancies && tenancies.length > 0) {
          // Get the most recent tenancy
          const latestTenancy = tenancies.reduce((latest: any, current: any) => 
            new Date(current.startDate) > new Date(latest.startDate) ? current : latest
          );
          
          contextData.tenancyDetails = latestTenancy;
          
          if (latestTenancy.propertyId) {
            const property = await storage.getProperty(latestTenancy.propertyId);
            if (property) {
              contextData.propertyDetails = property;
            }
          }
        }
      }

      // Add conversation history
      if (previousMessages && previousMessages.length > 0) {
        contextData.previousConversation = previousMessages;
      }

      // Get response from Perplexity
      const response = await perplexityService.analyzeTenantInquiry(query, contextData);

      // Save conversation for future reference
      // This would need a proper implementation in storage
      // await storage.saveAssistantConversation(userId, query, response);

      return res.status(200).json({
        response
      });
    } catch (error) {
      log(`Error in Perplexity assistant endpoint: ${error.message}`, "routes-perplexity");
      return res.status(500).json({
        message: "An error occurred while processing your request."
      });
    }
  });

  /**
   * Endpoint for generating property descriptions
   */
  app.post("/api/perplexity/property-description", authenticateUser, async (req: Request, res: Response) => {
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

      log(`Generating property description for user ${userId}`, "routes-perplexity");

      // Generate description
      const description = await perplexityService.generatePropertyDescription(propertyDetails);

      return res.status(200).json({
        description
      });
    } catch (error) {
      log(`Error in property description endpoint: ${error.message}`, "routes-perplexity");
      return res.status(500).json({
        message: "An error occurred while generating the property description."
      });
    }
  });

  /**
   * Endpoint to check Perplexity API availability
   */
  app.get("/api/perplexity/status", authenticateUser, async (_req: Request, res: Response) => {
    try {
      const isAvailable = await perplexityService.checkApiAvailability();
      
      return res.status(200).json({
        available: isAvailable
      });
    } catch (error) {
      log(`Error checking Perplexity API availability: ${error.message}`, "routes-perplexity");
      return res.status(500).json({
        available: false,
        message: "An error occurred while checking API availability."
      });
    }
  });

  log("Perplexity API routes registered", "routes");
}