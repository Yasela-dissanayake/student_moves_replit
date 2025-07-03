/**
 * Gemini Property Routes
 * API routes for Gemini AI property service integration
 */
import type { Express, Request, Response } from "express";
import * as geminiProperty from "./gemini-property-service";
import { authenticateUser } from "./routes";

export function registerGeminiPropertyRoutes(app: Express) {
  /**
   * Check Gemini Property API status
   * Public endpoint, no authentication required
   */
  app.get("/api/ai/gemini/property/status/public", async (req: Request, res: Response) => {
    try {
      const status = await geminiProperty.checkGeminiPropertyApiStatus();
      
      res.json({
        provider: "gemini",
        status: status.isWorking ? "operational" : "unavailable",
        message: status.isWorking 
          ? "Gemini AI property service is operational"
          : status.errorMessage || "Gemini AI property service is currently unavailable",
        isConfigured: status.isConfigured
      });
    } catch (error) {
      console.error("Error checking Gemini property service status:", error);
      res.status(500).json({
        provider: "gemini",
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  /**
   * Generate property description using Gemini AI
   * Authenticated endpoint, requires valid session
   */
  app.post("/api/ai/gemini/property-description", authenticateUser, async (req: Request, res: Response) => {
    try {
      const propertyDetails = req.body;
      
      if (!propertyDetails || !propertyDetails.propertyType || !propertyDetails.bedrooms) {
        return res.status(400).json({
          success: false,
          message: "Invalid property details. Required fields: propertyType, bedrooms, bathrooms, city, area"
        });
      }
      
      const description = await geminiProperty.generatePropertyDescription(propertyDetails);
      
      res.json({
        success: true,
        description,
        provider: "gemini"
      });
    } catch (error) {
      console.error("Error generating property description:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate property description",
        provider: "gemini"
      });
    }
  });

  /**
   * Answer student housing query using Gemini AI
   * Authenticated endpoint, requires valid session
   */
  app.post("/api/ai/gemini/answer-query", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { query, context } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          message: "Query is required and must be a string"
        });
      }
      
      const answer = await geminiProperty.answerStudentHousingQuery(query, context);
      
      res.json({
        success: true,
        answer,
        provider: "gemini"
      });
    } catch (error) {
      console.error("Error answering student housing query:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to answer query",
        provider: "gemini"
      });
    }
  });

  /**
   * Generate marketing content using Gemini AI
   * Authenticated endpoint, requires valid session
   */
  app.post("/api/ai/gemini/marketing-content", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { propertyDetails, targetAudience, contentType } = req.body;
      
      if (!propertyDetails || !targetAudience || !contentType) {
        return res.status(400).json({
          success: false,
          message: "Required fields: propertyDetails, targetAudience, contentType"
        });
      }
      
      if (!['email', 'social', 'listing'].includes(contentType)) {
        return res.status(400).json({
          success: false,
          message: "contentType must be one of: email, social, listing"
        });
      }
      
      const content = await geminiProperty.generateMarketingContent(
        propertyDetails,
        targetAudience,
        contentType as 'email' | 'social' | 'listing'
      );
      
      res.json({
        success: true,
        content,
        provider: "gemini"
      });
    } catch (error) {
      console.error("Error generating marketing content:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate marketing content",
        provider: "gemini"
      });
    }
  });

  /**
   * Analyze property feedback using Gemini AI
   * Authenticated endpoint, requires valid session
   */
  app.post("/api/ai/gemini/analyze-feedback", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { feedback } = req.body;
      
      if (!feedback || !Array.isArray(feedback) || feedback.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Feedback must be a non-empty array of strings"
        });
      }
      
      const analysis = await geminiProperty.analyzePropertyFeedback(feedback);
      
      res.json({
        success: true,
        analysis,
        provider: "gemini"
      });
    } catch (error) {
      console.error("Error analyzing property feedback:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to analyze feedback",
        provider: "gemini"
      });
    }
  });

  /**
   * Generate HMO compliance guidance using Gemini AI
   * Authenticated endpoint, requires valid session
   */
  app.post("/api/ai/gemini/hmo-compliance", authenticateUser, async (req: Request, res: Response) => {
    try {
      const propertyDetails = req.body;
      
      if (!propertyDetails || !propertyDetails.propertyType || !propertyDetails.bedrooms) {
        return res.status(400).json({
          success: false,
          message: "Invalid property details. Required fields: propertyType, bedrooms, bathrooms, city, area"
        });
      }
      
      const guidance = await geminiProperty.generateHmoComplianceGuidance(propertyDetails);
      
      res.json({
        success: true,
        guidance,
        provider: "gemini"
      });
    } catch (error) {
      console.error("Error generating HMO compliance guidance:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate HMO compliance guidance",
        provider: "gemini"
      });
    }
  });

  /**
   * Generate tenant matching insights using Gemini AI
   * Authenticated endpoint, requires valid session
   */
  app.post("/api/ai/gemini/tenant-matching", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { tenantPreferences, availableProperties } = req.body;
      
      if (!tenantPreferences || !availableProperties || !Array.isArray(availableProperties)) {
        return res.status(400).json({
          success: false,
          message: "Required fields: tenantPreferences (object), availableProperties (array)"
        });
      }
      
      const insights = await geminiProperty.generateTenantMatchingInsights(tenantPreferences, availableProperties);
      
      res.json({
        success: true,
        insights,
        provider: "gemini"
      });
    } catch (error) {
      console.error("Error generating tenant matching insights:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate tenant matching insights",
        provider: "gemini"
      });
    }
  });
}