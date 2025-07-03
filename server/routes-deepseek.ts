/**
 * DeepSeek AI Routes
 * API routes for DeepSeek AI integration
 */
import type { Express, Request, Response } from "express";
import * as deepseek from "./deepseek";
import { authenticateUser } from "./routes";

export default function registerDeepSeekRoutes(app: Express) {
  /**
   * Check DeepSeek API status
   * Public endpoint, no authentication required
   */
  app.get("/api/ai/deepseek/status/public", async (req: Request, res: Response) => {
    try {
      const status = await deepseek.checkDeepSeekApiStatus();
      
      res.json({
        provider: "deepseek",
        status: status.isWorking ? "operational" : "unavailable",
        message: status.isWorking 
          ? "DeepSeek AI service is operational"
          : status.errorMessage || "DeepSeek AI service is currently unavailable",
        isConfigured: status.isConfigured
      });
    } catch (error) {
      console.error("Error checking DeepSeek status:", error);
      res.status(500).json({
        provider: "deepseek",
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  /**
   * Generate property description using DeepSeek AI
   * Authenticated endpoint, requires valid session
   */
  app.post("/api/ai/deepseek/property-description", authenticateUser, async (req: Request, res: Response) => {
    try {
      const propertyDetails = req.body;
      
      if (!propertyDetails || !propertyDetails.propertyType || !propertyDetails.bedrooms) {
        return res.status(400).json({
          success: false,
          message: "Invalid property details. Required fields: propertyType, bedrooms, bathrooms, city, area"
        });
      }
      
      const description = await deepseek.generatePropertyDescription(propertyDetails);
      
      res.json({
        success: true,
        description,
        provider: "deepseek"
      });
    } catch (error) {
      console.error("Error generating property description:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate property description",
        provider: "deepseek"
      });
    }
  });

  /**
   * Answer student housing query using DeepSeek AI
   * Authenticated endpoint, requires valid session
   */
  app.post("/api/ai/deepseek/answer-query", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { query, context } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          message: "Query is required and must be a string"
        });
      }
      
      const answer = await deepseek.answerStudentHousingQuery(query, context);
      
      res.json({
        success: true,
        answer,
        provider: "deepseek"
      });
    } catch (error) {
      console.error("Error answering student housing query:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to answer query",
        provider: "deepseek"
      });
    }
  });

  /**
   * Generate marketing content using DeepSeek AI
   * Authenticated endpoint, requires valid session
   */
  app.post("/api/ai/deepseek/marketing-content", authenticateUser, async (req: Request, res: Response) => {
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
      
      const content = await deepseek.generateMarketingContent(
        propertyDetails,
        targetAudience,
        contentType as 'email' | 'social' | 'listing'
      );
      
      res.json({
        success: true,
        content,
        provider: "deepseek"
      });
    } catch (error) {
      console.error("Error generating marketing content:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate marketing content",
        provider: "deepseek"
      });
    }
  });

  /**
   * Analyze property feedback using DeepSeek AI
   * Authenticated endpoint, requires valid session
   */
  app.post("/api/ai/deepseek/analyze-feedback", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { feedback } = req.body;
      
      if (!feedback || !Array.isArray(feedback) || feedback.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Feedback must be a non-empty array of strings"
        });
      }
      
      const analysis = await deepseek.analyzePropertyFeedback(feedback);
      
      res.json({
        success: true,
        analysis,
        provider: "deepseek"
      });
    } catch (error) {
      console.error("Error analyzing property feedback:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to analyze feedback",
        provider: "deepseek"
      });
    }
  });

  /**
   * Generate HMO compliance guidance using DeepSeek AI
   * Authenticated endpoint, requires valid session
   */
  app.post("/api/ai/deepseek/hmo-compliance", authenticateUser, async (req: Request, res: Response) => {
    try {
      const propertyDetails = req.body;
      
      if (!propertyDetails || !propertyDetails.propertyType || !propertyDetails.bedrooms) {
        return res.status(400).json({
          success: false,
          message: "Invalid property details. Required fields: propertyType, bedrooms, bathrooms, city, area"
        });
      }
      
      const guidance = await deepseek.generateHmoComplianceGuidance(propertyDetails);
      
      res.json({
        success: true,
        guidance,
        provider: "deepseek"
      });
    } catch (error) {
      console.error("Error generating HMO compliance guidance:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate HMO compliance guidance",
        provider: "deepseek"
      });
    }
  });

  /**
   * Generate tenant matching insights using DeepSeek AI
   * Authenticated endpoint, requires valid session
   */
  app.post("/api/ai/deepseek/tenant-matching", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { tenantPreferences, availableProperties } = req.body;
      
      if (!tenantPreferences || !availableProperties || !Array.isArray(availableProperties)) {
        return res.status(400).json({
          success: false,
          message: "Required fields: tenantPreferences (object), availableProperties (array)"
        });
      }
      
      const insights = await deepseek.generateTenantMatchingInsights(tenantPreferences, availableProperties);
      
      res.json({
        success: true,
        insights,
        provider: "deepseek"
      });
    } catch (error) {
      console.error("Error generating tenant matching insights:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate tenant matching insights",
        provider: "deepseek"
      });
    }
  });
}