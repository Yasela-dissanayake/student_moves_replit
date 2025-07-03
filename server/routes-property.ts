/**
 * AI Property Routes
 * API routes for AI property service integration
 */
import type { Express, Request, Response } from "express";
import * as propertyService from "./property-service";
import { authenticateUser } from "./routes";

export function registerPropertyRoutes(app: Express) {
  /**
   * Check AI Property service status
   * Public endpoint, no authentication required
   */
  app.get("/api/ai/property/status/public", async (req: Request, res: Response) => {
    try {
      const status = await propertyService.checkPropertyServiceStatus();
      
      res.json({
        status: status.available ? "operational" : "unavailable",
        message: status.message
      });
    } catch (error) {
      console.error("Error checking AI property service status:", error);
      res.status(500).json({
        status: "error",
        message: "Error checking AI property service status"
      });
    }
  });

  /**
   * Generate AI property description
   * Authentication required
   */
  app.post("/api/ai/property/description", authenticateUser, async (req: Request, res: Response) => {
    try {
      const propertyDetails = req.body;
      
      // Validate required fields
      if (!propertyDetails.title || !propertyDetails.propertyType || 
          !propertyDetails.bedrooms || !propertyDetails.bathrooms ||
          !propertyDetails.city || !propertyDetails.area) {
        return res.status(400).json({
          error: "Missing required property details",
          required: ["title", "propertyType", "bedrooms", "bathrooms", "city", "area"]
        });
      }
      
      const description = await propertyService.generatePropertyDescription(propertyDetails);
      
      res.json({
        description,
        generated: true,
        propertyId: propertyDetails.propertyId
      });
    } catch (error) {
      console.error("Error generating property description:", error);
      res.status(500).json({
        error: "Error generating property description"
      });
    }
  });

  /**
   * Answer student housing queries
   * Authentication required
   */
  app.post("/api/ai/property/student-query", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { query, context } = req.body;
      
      if (!query || typeof query !== "string" || query.trim().length < 3) {
        return res.status(400).json({
          error: "Invalid query. Please provide a valid question."
        });
      }
      
      const answer = await propertyService.answerStudentHousingQuery(query, context);
      
      res.json({
        query,
        answer,
        generated: true
      });
    } catch (error) {
      console.error("Error answering student housing query:", error);
      res.status(500).json({
        error: "Error answering student housing query"
      });
    }
  });

  /**
   * Generate marketing content for properties
   * Authentication required
   */
  app.post("/api/ai/property/marketing", authenticateUser, async (req: Request, res: Response) => {
    try {
      const marketingRequest = req.body;
      
      // Validate required fields
      if (!marketingRequest.propertyType || !marketingRequest.contentType || !marketingRequest.targetAudience) {
        return res.status(400).json({
          error: "Missing required marketing request details",
          required: ["propertyType", "contentType", "targetAudience"]
        });
      }
      
      const marketingContent = await propertyService.generateMarketingContent(marketingRequest);
      
      res.json({
        content: marketingContent,
        generated: true,
        contentType: marketingRequest.contentType,
        propertyId: marketingRequest.propertyId
      });
    } catch (error) {
      console.error("Error generating marketing content:", error);
      res.status(500).json({
        error: "Error generating marketing content"
      });
    }
  });

  /**
   * Analyze property feedback
   * Authentication required, admin/landlord/agent only
   */
  app.post("/api/ai/property/analyze-feedback", authenticateUser, async (req: Request, res: Response) => {
    try {
      // Check authorization
      if (req.session.userType !== "admin" && req.session.userType !== "landlord" && req.session.userType !== "agent") {
        return res.status(403).json({
          error: "Unauthorized. Only admins, landlords, and agents can analyze property feedback."
        });
      }
      
      const { feedback } = req.body;
      
      if (!Array.isArray(feedback) || feedback.length === 0) {
        return res.status(400).json({
          error: "Invalid feedback. Please provide an array of feedback strings."
        });
      }
      
      const analysis = await propertyService.analyzePropertyFeedback(feedback);
      
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing property feedback:", error);
      res.status(500).json({
        error: "Error analyzing property feedback"
      });
    }
  });

  /**
   * Generate HMO compliance guidance
   * Authentication required, admin/landlord/agent only
   */
  app.post("/api/ai/property/hmo-guidance", authenticateUser, async (req: Request, res: Response) => {
    try {
      // Check authorization
      if (req.session.userType !== "admin" && req.session.userType !== "landlord" && req.session.userType !== "agent") {
        return res.status(403).json({
          error: "Unauthorized. Only admins, landlords, and agents can access HMO guidance."
        });
      }
      
      const propertyDetails = req.body;
      
      // Validate required fields
      if (!propertyDetails.bedrooms || !propertyDetails.bathrooms || !propertyDetails.city) {
        return res.status(400).json({
          error: "Missing required property details",
          required: ["bedrooms", "bathrooms", "city"]
        });
      }
      
      const guidance = await propertyService.generateHmoComplianceGuidance(propertyDetails);
      
      res.json(guidance);
    } catch (error) {
      console.error("Error generating HMO compliance guidance:", error);
      res.status(500).json({
        error: "Error generating HMO compliance guidance"
      });
    }
  });

  /**
   * Generate tenant matching insights
   * Authentication required, admin/landlord/agent only
   */
  app.post("/api/ai/property/tenant-matching", authenticateUser, async (req: Request, res: Response) => {
    try {
      // Check authorization
      if (req.session.userType !== "admin" && req.session.userType !== "landlord" && req.session.userType !== "agent") {
        return res.status(403).json({
          error: "Unauthorized. Only admins, landlords, and agents can access tenant matching."
        });
      }
      
      const matchingRequest = req.body;
      
      // Validate required fields
      if (!matchingRequest.tenantPreferences || !matchingRequest.property) {
        return res.status(400).json({
          error: "Missing required matching details",
          required: ["tenantPreferences", "property"]
        });
      }
      
      if (!matchingRequest.tenantPreferences.budget || !matchingRequest.tenantPreferences.location || 
          !matchingRequest.tenantPreferences.bedroomsNeeded) {
        return res.status(400).json({
          error: "Missing required tenant preferences",
          required: ["budget", "location", "bedroomsNeeded"]
        });
      }
      
      if (!matchingRequest.property.id || !matchingRequest.property.title || 
          !matchingRequest.property.propertyType || !matchingRequest.property.bedrooms ||
          !matchingRequest.property.location || !matchingRequest.property.rentPerMonth) {
        return res.status(400).json({
          error: "Missing required property details",
          required: ["id", "title", "propertyType", "bedrooms", "location", "rentPerMonth"]
        });
      }
      
      const insights = await propertyService.generateTenantMatchingInsights(matchingRequest);
      
      res.json(insights);
    } catch (error) {
      console.error("Error generating tenant matching insights:", error);
      res.status(500).json({
        error: "Error generating tenant matching insights"
      });
    }
  });
}