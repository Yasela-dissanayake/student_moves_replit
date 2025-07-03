import { Express, Request, Response } from "express";
import { storage } from "./storage";
import multer from "multer";
import { z } from "zod";
import { executeAIOperation } from "./ai-service-manager";
import * as documentGenerator from "./document-generator";
import { authenticateUser } from "./routes";

// Multer configuration for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Validation schema for Right to Rent details
const rightToRentDetailsSchema = z.object({
  nationality: z.string().min(1, "Nationality is required"),
  immigrationStatus: z.string().min(1, "Immigration status is required"),
  rightToRentExpiryDate: z.date().optional(),
  shareCode: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms to continue",
  }),
});

/**
 * Register Right to Rent verification routes
 * @param app Express application instance
 */
export function registerRightToRentRoutes(app: Express) {
  // Get Right to Rent status for the authenticated user
  app.get("/api/right-to-rent/status", authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized - User ID not found in session" });
      }
      
      // Get user from the database to check Right to Rent status
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if Right to Rent verification exists
      const verification = await storage.getVerificationByUserId(userId);
      
      // Compile Right to Rent status response
      const rightToRentStatus = {
        verified: user.rightToRentVerified || false,
        checkDate: user.rightToRentCheckDate,
        status: user.rightToRentStatus || "not-verified",
        expiryDate: user.rightToRentExpiryDate,
        nationality: verification?.metadata?.nationality,
        documentId: verification?.rightToRentDocumentId,
        followUpNeeded: verification?.rightToRentFollowUpNeeded,
        followUpDate: verification?.rightToRentFollowUpDate,
      };
      
      res.json(rightToRentStatus);
    } catch (error) {
      console.error("Error fetching Right to Rent status:", error);
      res.status(500).json({ message: "Error fetching Right to Rent status" });
    }
  });
  
  // Verify Right to Rent for a user
  app.post("/api/right-to-rent/verify", authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized - User ID not found in session" });
      }
      
      // Validate the request body against the schema
      const validationResult = rightToRentDetailsSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: validationResult.error.format()
        });
      }
      
      const rightToRentDetails = validationResult.data;
      
      // Get user from the database
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get existing verification if it exists
      const verification = await storage.getVerificationByUserId(userId);
      if (!verification) {
        return res.status(400).json({ 
          message: "ID verification not completed. Please complete ID verification first."
        });
      }
      
      // Convert ID verification result for Right to Rent verification
      const idVerificationResult = {
        verified: verification.aiVerified || verification.adminVerified,
        documentDetails: verification.metadata?.documentDetails || {}
      };
      
      // Process Right to Rent verification
      // Create a prompt to verify right to rent eligibility
      const verificationPrompt = `
        Verify the right to rent eligibility based on the following information:
        
        Identity verification: ${idVerificationResult.verified ? 'Successfully verified' : 'Not verified'}
        Document details: ${JSON.stringify(idVerificationResult.documentDetails)}
        Nationality: ${rightToRentDetails.nationality}
        Immigration status: ${rightToRentDetails.immigrationStatus}
        Right to Rent expiry date: ${rightToRentDetails.rightToRentExpiryDate ? rightToRentDetails.rightToRentExpiryDate.toISOString() : 'Not provided'}
        Share code: ${rightToRentDetails.shareCode || 'Not provided'}
        
        Determine if the person has:
        1. Unlimited right to rent
        2. Time-limited right to rent (with expiry date)
        3. No right to rent
        
        Also determine if follow-up checks are needed and when.
        
        Return the analysis in JSON format with these fields:
        - verified: boolean
        - status: "unlimited", "time-limited", or "not-eligible"
        - expiryDate: ISO date string (if time-limited)
        - confidence: number between 0 and 1
        - followUpNeeded: boolean
        - followUpDate: ISO date string (if follow-up needed)
        - notes: string with explanation
      `;
      
      // Use AI service manager to verify right to rent
      const rightToRentResponse = await executeAIOperation('generateText', {
        prompt: verificationPrompt,
        responseFormat: 'json'
      });
      
      // Parse the response
      let rightToRentResult;
      try {
        // Handle potential markdown code blocks in the response
        let jsonStr = rightToRentResponse;
        if (jsonStr.includes('```json')) {
          jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
        } else if (jsonStr.includes('```')) {
          jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
        }
        
        const parsedResult = JSON.parse(jsonStr);
        rightToRentResult = {
          verified: parsedResult.verified === true,
          status: parsedResult.status || 'not-verified',
          expiryDate: parsedResult.expiryDate ? new Date(parsedResult.expiryDate) : undefined,
          confidence: parsedResult.confidence || 0,
          followUpNeeded: parsedResult.followUpNeeded === true,
          followUpDate: parsedResult.followUpDate ? new Date(parsedResult.followUpDate) : undefined,
          notes: parsedResult.notes
        };
      } catch (error) {
        console.error("Error parsing Right to Rent verification result:", error);
        rightToRentResult = {
          verified: false,
          status: 'not-verified',
          confidence: 0,
          followUpNeeded: false,
          notes: 'Error processing verification result'
        };
      }
      
      // Generate certificate if verification is successful
      let certificateContent = null;
      let documentId = null;
      
      if (rightToRentResult.verified) {
        // Create a prompt to generate a Right to Rent certificate
        const certificatePrompt = `
          Generate a formal Right to Rent certificate with the following details:
          
          Tenant Name: ${user.name}
          Nationality: ${rightToRentDetails.nationality}
          Immigration Status: ${rightToRentDetails.immigrationStatus}
          Right to Rent Status: ${rightToRentResult.status}
          Verification Date: ${new Date().toLocaleDateString()}
          ${rightToRentResult.expiryDate ? `Expiry Date: ${rightToRentResult.expiryDate.toLocaleDateString()}` : ''}
          ${rightToRentResult.followUpNeeded ? `Follow-up Required By: ${rightToRentResult.followUpDate?.toLocaleDateString()}` : ''}
          
          Include appropriate legal disclaimers and information about the Right to Rent scheme.
          Format the certificate in a professional, official-looking layout.
        `;
        
        // Generate the certificate using AI
        certificateContent = await executeAIOperation('generateText', {
          prompt: certificatePrompt
        });
        
        // Create document record for the certificate
        const document = await storage.createDocument({
          title: "Right to Rent Certificate",
          content: certificateContent,
          documentType: "right_to_rent_certificate",
          format: "txt",
          tenantId: userId,
          createdById: userId,
          aiGenerated: true,
          customRequirements: `Right to Rent certificate for ${user.name}, ${rightToRentDetails.nationality}, ${rightToRentResult.status} status`
        });
        
        documentId = document.id;
      }
      
      // Update user's Right to Rent status
      await storage.updateUserRightToRent(userId, {
        rightToRentVerified: rightToRentResult.verified,
        rightToRentStatus: rightToRentResult.status,
        rightToRentExpiryDate: rightToRentResult.expiryDate,
        rightToRentCheckDate: new Date()
      });
      
      // Update verification record
      await storage.updateVerification(verification.id, {
        rightToRentVerified: rightToRentResult.verified,
        rightToRentStatus: rightToRentResult.status,
        rightToRentExpiryDate: rightToRentResult.expiryDate,
        rightToRentCheckDate: new Date(),
        rightToRentDocumentId: documentId?.toString(),
        rightToRentFollowUpNeeded: rightToRentResult.followUpNeeded,
        rightToRentFollowUpDate: rightToRentResult.followUpDate,
        metadata: {
          ...verification.metadata,
          rightToRentDetails: {
            nationality: rightToRentDetails.nationality,
            immigrationStatus: rightToRentDetails.immigrationStatus,
            verificationDate: new Date(),
            notes: rightToRentResult.notes
          }
        }
      });
      
      res.json({
        success: true,
        verified: rightToRentResult.verified,
        status: rightToRentResult.status,
        expiryDate: rightToRentResult.expiryDate,
        followUpNeeded: rightToRentResult.followUpNeeded,
        followUpDate: rightToRentResult.followUpDate,
        certificateId: documentId
      });
    } catch (error) {
      console.error("Error processing Right to Rent verification:", error);
      res.status(500).json({ message: "Error processing Right to Rent verification" });
    }
  });
  
  // Get Right to Rent certificate
  app.get("/api/right-to-rent/certificate/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      // Get document
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Check if user has access to this document
      if (document.tenantId !== req.session.userId && 
          document.createdById !== req.session.userId &&
          req.session.userType !== "admin" &&
          req.session.userType !== "agent" &&
          req.session.userType !== "landlord") {
        return res.status(403).json({ message: "Unauthorized access to certificate" });
      }
      
      res.json({
        id: document.id,
        title: document.title,
        content: document.content,
        createdAt: document.createdAt
      });
    } catch (error) {
      console.error("Error fetching Right to Rent certificate:", error);
      res.status(500).json({ message: "Error fetching Right to Rent certificate" });
    }
  });
  
  // Admin routes for Right to Rent management
  app.get("/api/admin/right-to-rent/pending", authenticateUser, async (req: Request, res: Response) => {
    try {
      // Check if user is admin, agent, or landlord
      if (req.session.userType !== "admin" && 
          req.session.userType !== "agent" && 
          req.session.userType !== "landlord") {
        return res.status(403).json({ message: "Unauthorized - Admin access required" });
      }
      
      // Get all pending Right to Rent verifications
      // For agents and landlords, filter by their tenants only
      const pendingVerifications = await storage.getPendingRightToRentVerifications(
        req.session.userType === "admin" ? null : req.session.userId,
        req.session.userType
      );
      
      res.json(pendingVerifications);
    } catch (error) {
      console.error("Error fetching pending Right to Rent verifications:", error);
      res.status(500).json({ message: "Error fetching pending Right to Rent verifications" });
    }
  });
  
  // Admin approval/rejection of Right to Rent verification
  app.post("/api/admin/right-to-rent/:id/review", authenticateUser, async (req: Request, res: Response) => {
    try {
      // Check if user is admin, agent, or landlord
      if (req.session.userType !== "admin" && 
          req.session.userType !== "agent" && 
          req.session.userType !== "landlord") {
        return res.status(403).json({ message: "Unauthorized - Admin access required" });
      }
      
      const verificationId = parseInt(req.params.id);
      if (isNaN(verificationId)) {
        return res.status(400).json({ message: "Invalid verification ID" });
      }
      
      const { action, notes } = req.body;
      if (action !== "approve" && action !== "reject") {
        return res.status(400).json({ message: "Invalid action. Must be 'approve' or 'reject'." });
      }
      
      // Get verification record
      const verification = await storage.getVerification(verificationId);
      if (!verification) {
        return res.status(404).json({ message: "Verification not found" });
      }
      
      // For agents and landlords, check if they have access to this tenant
      if (req.session.userType !== "admin") {
        const hasAccess = await storage.checkLandlordOrAgentHasAccessToTenant(
          req.session.userId,
          verification.userId,
          req.session.userType
        );
        
        if (!hasAccess) {
          return res.status(403).json({ message: "Unauthorized access to this verification" });
        }
      }
      
      // Update verification record
      await storage.updateVerification(verificationId, {
        adminVerified: action === "approve",
        adminVerifiedAt: new Date(),
        adminVerifiedBy: req.session.userId,
        metadata: {
          ...verification.metadata,
          adminReview: {
            action,
            notes,
            reviewedAt: new Date(),
            reviewedBy: req.session.userId
          }
        }
      });
      
      // If approved, also update the user's Right to Rent status
      if (action === "approve") {
        await storage.updateUserRightToRent(verification.userId, {
          rightToRentVerified: true,
          // Keep other Right to Rent details the same
          rightToRentStatus: verification.rightToRentStatus,
          rightToRentExpiryDate: verification.rightToRentExpiryDate,
          rightToRentCheckDate: new Date()
        });
      }
      
      res.json({
        success: true,
        action,
        verificationId
      });
    } catch (error) {
      console.error("Error reviewing Right to Rent verification:", error);
      res.status(500).json({ message: "Error reviewing Right to Rent verification" });
    }
  });
  
  // Get upcoming Right to Rent follow-ups
  app.get("/api/admin/right-to-rent/follow-ups", authenticateUser, async (req: Request, res: Response) => {
    try {
      // Check if user is admin, agent, or landlord
      if (req.session.userType !== "admin" && 
          req.session.userType !== "agent" && 
          req.session.userType !== "landlord") {
        return res.status(403).json({ message: "Unauthorized - Admin access required" });
      }
      
      // Get all Right to Rent follow-ups
      // For agents and landlords, filter by their tenants only
      const followUps = await storage.getRightToRentFollowUps(
        req.session.userType === "admin" ? null : req.session.userId,
        req.session.userType
      );
      
      res.json(followUps);
    } catch (error) {
      console.error("Error fetching Right to Rent follow-ups:", error);
      res.status(500).json({ message: "Error fetching Right to Rent follow-ups" });
    }
  });
}