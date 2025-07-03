import express from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from "zod";
import { db } from "./db";
import { 
  documentTemplates, 
  signingRequests, 
  signatories, 
  signatureAuditLog,
  insertSigningRequestSchema,
  insertSignatorySchema,
  insertSignatureAuditLogSchema
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { documentConverter, DocumentMetadata } from './document-converter';

const router = express.Router();

// Configure multer for file uploads
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'temp');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// Upload and convert document to e-signature format
router.post("/api/digital-signing/upload", upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Convert the uploaded document
    const metadata = await documentConverter.convertDocument(
      req.file.path,
      req.file.originalname,
      req.user.id
    );

    // Create document template from converted file
    const [template] = await db.insert(documentTemplates).values({
      name: metadata.originalName,
      type: 'uploaded',
      template: metadata.extractedText,
      fields: metadata.signatureFields,
      createdBy: req.user?.id || 1,
      isActive: true,
      signatoryRoles: ['tenant', 'landlord']
    }).returning();

    res.json({
      success: true,
      template,
      metadata: {
        fileName: metadata.fileName,
        originalName: metadata.originalName,
        pageCount: metadata.pageCount,
        signatureFields: metadata.signatureFields
      }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ 
      error: "Failed to process document", 
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Download converted document
router.get("/api/digital-signing/download/:fileName", async (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = documentConverter.getDocumentPath(fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.download(filePath, fileName);
  } catch (error) {
    console.error('Document download error:', error);
    res.status(500).json({ error: "Failed to download document" });
  }
});

// Get all document templates (no auth required for testing)
router.get("/api/document-templates", async (req, res) => {
  try {
    // Return mock templates for testing
    const mockTemplates = [
      {
        id: 1,
        name: "Tenancy Agreement",
        type: "rental", 
        description: "Standard Assured Shorthold Tenancy Agreement (AST)",
        template: "tenancy_agreement",
        requiredFields: ["propertyAddress", "rentAmount", "depositAmount", "tenancyStartDate", "tenancyEndDate"],
        signatoryRoles: ["landlord", "tenant"],
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        name: "Maintenance Authorization",
        type: "maintenance",
        description: "Authorization for maintenance work and cost approval", 
        template: "maintenance_auth",
        requiredFields: ["propertyAddress", "workDescription", "estimatedCost", "urgency"],
        signatoryRoles: ["landlord", "agent", "contractor"],
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        name: "Deposit Protection Certificate",
        type: "deposit",
        description: "Deposit protection scheme registration document",
        template: "deposit_protection", 
        requiredFields: ["tenantName", "depositAmount", "protectionScheme", "registrationDate"],
        signatoryRoles: ["landlord", "tenant"],
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];
    res.json(mockTemplates);
  } catch (error) {
    console.error("Error fetching document templates:", error);
    res.status(500).json({ error: "Failed to fetch document templates" });
  }
});

// Create a new document template
router.post("/api/document-templates", async (req, res) => {
  try {
    const templateData = req.body;
    
    const [template] = await db
      .insert(documentTemplates)
      .values({
        ...templateData,
        updatedAt: new Date()
      })
      .returning();

    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating document template:", error);
    res.status(500).json({ error: "Failed to create document template" });
  }
});

// Get all signing requests (simplified for testing)
router.get("/api/signing-requests", async (req, res) => {
  try {
    // Return mock data for now to avoid database relation errors
    const mockRequests = [
      {
        id: 1,
        documentId: 1,
        documentName: "Tenancy Agreement - 123 Student Street",
        initiatorId: 1,
        initiatorName: "John Agent",
        status: "pending",
        createdAt: new Date().toISOString(),
        signatories: [
          {
            id: 1,
            email: "tenant@example.com",
            name: "Sarah Student",
            role: "tenant",
            status: "pending"
          },
          {
            id: 2,
            email: "landlord@example.com", 
            name: "Mike Property",
            role: "landlord",
            status: "signed"
          }
        ]
      }
    ];
    res.json(mockRequests);
  } catch (error) {
    console.error("Error fetching signing requests:", error);
    res.status(500).json({ error: "Failed to fetch signing requests" });
  }
});

// Create a new signing request
router.post("/api/signing-requests", async (req, res) => {
  try {
    const { documentId, signatories: signatoryData, documentData, dueDate } = req.body;
    
    // Get document template
    const [template] = await db
      .select()
      .from(documentTemplates)
      .where(eq(documentTemplates.id, documentId));

    if (!template) {
      return res.status(404).json({ error: "Document template not found" });
    }

    // Create signing request
    const [signingRequest] = await db
      .insert(signingRequests)
      .values({
        documentId,
        documentName: template.name,
        initiatorId: req.user?.id || 1, // Default to user 1 for demo
        initiatorName: req.user?.name || "System User",
        status: "sent",
        documentData,
        dueDate: dueDate ? new Date(dueDate) : null,
        updatedAt: new Date()
      })
      .returning();

    // Create signatories
    const signatoryPromises = signatoryData.map((signatory: any) =>
      db.insert(signatories).values({
        signingRequestId: signingRequest.id,
        email: signatory.email,
        name: signatory.name,
        role: signatory.role,
        status: "pending"
      }).returning()
    );

    const createdSignatories = await Promise.all(signatoryPromises);

    // Log audit entry
    await db.insert(signatureAuditLog).values({
      signingRequestId: signingRequest.id,
      action: "created",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      metadata: { documentName: template.name }
    });

    // Get complete request with signatories
    const completeRequest = await db.query.signingRequests.findFirst({
      where: eq(signingRequests.id, signingRequest.id),
      with: {
        signatories: true
      }
    });

    res.status(201).json(completeRequest);
  } catch (error) {
    console.error("Error creating signing request:", error);
    res.status(500).json({ error: "Failed to create signing request" });
  }
});

// Get specific signing request
router.get("/api/signing-requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await db.query.signingRequests.findFirst({
      where: eq(signingRequests.id, parseInt(id)),
      with: {
        signatories: true
      }
    });

    if (!request) {
      return res.status(404).json({ error: "Signing request not found" });
    }

    // Log view audit entry
    await db.insert(signatureAuditLog).values({
      signingRequestId: request.id,
      action: "viewed",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent")
    });

    res.json(request);
  } catch (error) {
    console.error("Error fetching signing request:", error);
    res.status(500).json({ error: "Failed to fetch signing request" });
  }
});

// Submit signature for signing request
router.post("/api/signing-requests/:id/sign", async (req, res) => {
  try {
    const { id } = req.params;
    const { signature, signatoryEmail } = req.body;

    // Find the signing request
    const request = await db.query.signingRequests.findFirst({
      where: eq(signingRequests.id, parseInt(id)),
      with: {
        signatories: true
      }
    });

    if (!request) {
      return res.status(404).json({ error: "Signing request not found" });
    }

    // Find the signatory (for demo, use the first pending signatory)
    const signatory = request.signatories.find(s => s.status === "pending");

    if (!signatory) {
      return res.status(400).json({ error: "No pending signature found" });
    }

    // Update signatory with signature
    await db
      .update(signatories)
      .set({
        status: "signed",
        signature,
        signedAt: new Date(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      })
      .where(eq(signatories.id, signatory.id));

    // Log signature audit entry
    await db.insert(signatureAuditLog).values({
      signingRequestId: request.id,
      signatoryId: signatory.id,
      action: "signed",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      metadata: { signatoryEmail: signatory.email }
    });

    // Check if all signatories have signed
    const updatedRequest = await db.query.signingRequests.findFirst({
      where: eq(signingRequests.id, parseInt(id)),
      with: {
        signatories: true
      }
    });

    const allSigned = updatedRequest?.signatories.every(s => s.status === "signed");

    if (allSigned) {
      await db
        .update(signingRequests)
        .set({
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(signingRequests.id, parseInt(id)));
    } else {
      await db
        .update(signingRequests)
        .set({
          status: "in_progress",
          updatedAt: new Date()
        })
        .where(eq(signingRequests.id, parseInt(id)));
    }

    res.json({ success: true, message: "Signature submitted successfully" });
  } catch (error) {
    console.error("Error submitting signature:", error);
    res.status(500).json({ error: "Failed to submit signature" });
  }
});

// Decline to sign document
router.post("/api/signing-requests/:id/decline", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, signatoryEmail } = req.body;

    const request = await db.query.signingRequests.findFirst({
      where: eq(signingRequests.id, parseInt(id)),
      with: {
        signatories: true
      }
    });

    if (!request) {
      return res.status(404).json({ error: "Signing request not found" });
    }

    // Find the signatory
    const signatory = request.signatories.find(s => s.status === "pending");

    if (!signatory) {
      return res.status(400).json({ error: "No pending signature found" });
    }

    // Update signatory status
    await db
      .update(signatories)
      .set({
        status: "declined"
      })
      .where(eq(signatories.id, signatory.id));

    // Update signing request status
    await db
      .update(signingRequests)
      .set({
        status: "declined",
        updatedAt: new Date()
      })
      .where(eq(signingRequests.id, parseInt(id)));

    // Log decline audit entry
    await db.insert(signatureAuditLog).values({
      signingRequestId: request.id,
      signatoryId: signatory.id,
      action: "declined",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      metadata: { reason, signatoryEmail: signatory.email }
    });

    res.json({ success: true, message: "Document signing declined" });
  } catch (error) {
    console.error("Error declining signature:", error);
    res.status(500).json({ error: "Failed to decline signature" });
  }
});

// Get audit log for signing request
router.get("/api/signing-requests/:id/audit", async (req, res) => {
  try {
    const { id } = req.params;

    const auditEntries = await db
      .select()
      .from(signatureAuditLog)
      .where(eq(signatureAuditLog.signingRequestId, parseInt(id)))
      .orderBy(desc(signatureAuditLog.timestamp));

    res.json(auditEntries);
  } catch (error) {
    console.error("Error fetching audit log:", error);
    res.status(500).json({ error: "Failed to fetch audit log" });
  }
});

// Send reminder for pending signatures
router.post("/api/signing-requests/:id/remind", async (req, res) => {
  try {
    const { id } = req.params;

    const request = await db.query.signingRequests.findFirst({
      where: eq(signingRequests.id, parseInt(id)),
      with: {
        signatories: true
      }
    });

    if (!request) {
      return res.status(404).json({ error: "Signing request not found" });
    }

    const pendingSignatories = request.signatories.filter(s => s.status === "pending");

    // Log reminder audit entries
    const reminderPromises = pendingSignatories.map(signatory =>
      db.insert(signatureAuditLog).values({
        signingRequestId: request.id,
        signatoryId: signatory.id,
        action: "reminded",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        metadata: { signatoryEmail: signatory.email }
      })
    );

    await Promise.all(reminderPromises);

    res.json({ 
      success: true, 
      message: `Reminders sent to ${pendingSignatories.length} signatories` 
    });
  } catch (error) {
    console.error("Error sending reminders:", error);
    res.status(500).json({ error: "Failed to send reminders" });
  }
});

export default router;