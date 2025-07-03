/**
 * AI Assistant API Routes
 * Routes for enhanced AI assistant functionality
 */
import { Express, Request, Response } from "express";
import * as assistantService from "./assistant-service";
import { storage } from "./storage";
import { log } from "./vite";
import { z } from "zod";
import { authenticateUser } from "./routes";

/**
 * Register AI Assistant API routes
 * @param app Express application instance
 */
export function registerAssistantRoutes(app: Express): void {
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

  // Schema for validating maintenance troubleshooting requests
  const troubleshootingRequestSchema = z.object({
    issueType: z.string().min(2),
    description: z.string().min(5)
  });

  // Tenant assistant query endpoint
  app.post("/api/assistant/tenant/query", authenticateUser, async (req: Request, res: Response) => {
    try {
      // Validate request
      const validationResult = assistantQuerySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request format",
          details: validationResult.error.format()
        });
      }

      const { query } = validationResult.data;
      const userId = req.session.userId as number;

      // Check user type
      if (req.session.userType !== "tenant") {
        return res.status(403).json({
          error: "Forbidden - This endpoint is only available for tenants"
        });
      }

      // Process tenant question
      const assistantResponse = await assistantService.processTenantQuestion(userId, query);
      
      res.json(assistantResponse);
    } catch (error) {
      log(`Error in tenant assistant query: ${error}`, "assistant-routes", "error");
      res.status(500).json({
        error: "An error occurred while processing your request"
      });
    }
  });

  // Landlord/agent assistant query endpoint
  app.post("/api/assistant/landlord/query", authenticateUser, async (req: Request, res: Response) => {
    try {
      // Validate request
      const validationResult = assistantQuerySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request format",
          details: validationResult.error.format()
        });
      }

      const { query, propertyId } = validationResult.data;
      const userId = req.session.userId as number;

      // Check user type
      if (req.session.userType !== "landlord" && req.session.userType !== "agent" && req.session.userType !== "admin") {
        return res.status(403).json({
          error: "Forbidden - This endpoint is only available for landlords, agents, and admins"
        });
      }

      // Process landlord question
      const assistantResponse = await assistantService.processLandlordQuestion(userId, query, propertyId);
      
      res.json(assistantResponse);
    } catch (error) {
      log(`Error in landlord assistant query: ${error}`, "assistant-routes", "error");
      res.status(500).json({
        error: "An error occurred while processing your request"
      });
    }
  });

  // Maintenance troubleshooting endpoint
  app.post("/api/assistant/maintenance/troubleshoot", authenticateUser, async (req: Request, res: Response) => {
    try {
      // Validate request
      const validationResult = troubleshootingRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request format",
          details: validationResult.error.format()
        });
      }

      const { issueType, description } = validationResult.data;

      // Generate troubleshooting steps
      const troubleshootingGuide = await assistantService.generateMaintenanceTroubleshooting(
        issueType,
        description
      );
      
      res.json(troubleshootingGuide);
    } catch (error) {
      log(`Error in maintenance troubleshooting: ${error}`, "assistant-routes", "error");
      res.status(500).json({
        error: "An error occurred while generating troubleshooting steps"
      });
    }
  });

  // Assistant status endpoint
  app.get("/api/assistant/status", async (_req: Request, res: Response) => {
    try {
      const status = await assistantService.checkAssistantStatus();
      res.json(status);
    } catch (error) {
      log(`Error checking assistant status: ${error}`, "assistant-routes", "error");
      res.status(500).json({
        error: "An error occurred while checking assistant status"
      });
    }
  });
}