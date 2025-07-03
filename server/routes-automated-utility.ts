/**
 * Routes for Automated Utility Registration Service
 */
import express, { Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  startAutomatedRegistration, 
  getRegistrationStatus, 
  monitorRegistrationStatus,
  uploadTenancyAgreement,
  TenantSignupData
} from './services/automated-utility-registration';
import { ensureAuthenticated, ensureTenant, ensureAdmin, createMulterStorage } from './utils';
import { db } from './db';
import * as schema from '@shared/schema';
import { and, eq, inArray } from 'drizzle-orm';

// Set up multer storage for document uploads
const upload = multer({ 
  storage: createMulterStorage('tenancy-agreements'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});

// Validation schema for tenant signup data
const tenantSignupSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  phoneNumber: z.string().min(9),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  sortCode: z.string().optional(),
  previousAddress: z.string().optional(),
  previousPostcode: z.string().optional(),
  tenancyDuration: z.number().optional()
});

// Create router
const router = express.Router();

/**
 * Start automated utility registration for a property/tenancy
 * POST /api/automated-utility/register
 */
router.post('/register', ensureAuthenticated, async (req, res) => {
  try {
    const {
      propertyId,
      tenancyId,
      utilityType,
      tenantSignupData,
      bankingDetailsId
    } = req.body;
    
    // Validate required fields
    if (!propertyId || !tenancyId || !utilityType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (propertyId, tenancyId, utilityType)"
      });
    }
    
    // Validate utility type
    const validUtilityTypes = ['gas', 'electricity', 'dual_fuel', 'water', 'broadband', 'tv_license'];
    if (!validUtilityTypes.includes(utilityType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid utility type. Must be one of: ${validUtilityTypes.join(', ')}`
      });
    }
    
    // Validate tenant signup data if provided
    let validatedTenantData: TenantSignupData;
    try {
      validatedTenantData = tenantSignupSchema.parse(tenantSignupData);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid tenant signup data",
        errors: error
      });
    }
    
    // Start automated registration
    const result = await startAutomatedRegistration(
      propertyId,
      tenancyId,
      utilityType as any, // Already validated
      validatedTenantData,
      bankingDetailsId
    );
    
    return res.json(result);
  } catch (error) {
    console.error("Error starting automated utility registration:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while starting automated utility registration."
    });
  }
});

/**
 * Get registration status for a utility contract
 * GET /api/automated-utility/status/:contractId
 */
router.get('/status/:contractId', ensureAuthenticated, async (req, res) => {
  try {
    const contractId = parseInt(req.params.contractId);
    
    if (isNaN(contractId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contract ID"
      });
    }
    
    // Check if contract belongs to user (if tenant) or any contract (if admin)
    if (!req.user?.isAdmin) {
      const contract = await db.query.propertyUtilityContracts.findFirst({
        where: eq(schema.propertyUtilityContracts.id, contractId),
        with: {
          tenancy: {
            with: {
              applications: {
                where: eq(schema.applications.tenantId, req.user!.id)
              }
            }
          }
        }
      });
      
      if (!contract || !contract.tenancy || contract.tenancy.applications.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to view this contract"
        });
      }
    }
    
    // Get registration status
    const status = await getRegistrationStatus(contractId);
    
    return res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error("Error getting registration status:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting registration status."
    });
  }
});

/**
 * Upload tenancy agreement document for verification
 * POST /api/automated-utility/upload-agreement/:contractId
 */
router.post('/upload-agreement/:contractId', 
  ensureAuthenticated,
  upload.single('document'),
  async (req, res) => {
    try {
      const contractId = parseInt(req.params.contractId);
      
      if (isNaN(contractId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid contract ID"
        });
      }
      
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No document file uploaded"
        });
      }
      
      // Get file path and convert to base64
      const filePath = path.join(req.file.destination, req.file.filename);
      const fileBuffer = fs.readFileSync(filePath);
      const base64Document = fileBuffer.toString('base64');
      
      // Upload document
      const result = await uploadTenancyAgreement(
        contractId,
        base64Document,
        req.file.originalname
      );
      
      return res.json(result);
    } catch (error) {
      console.error("Error uploading tenancy agreement:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while uploading tenancy agreement."
      });
    }
  }
);

/**
 * Admin endpoint to manually trigger registration status check
 * POST /api/automated-utility/check-status/:contractId
 */
router.post('/check-status/:contractId', ensureAdmin, async (req, res) => {
  try {
    const contractId = parseInt(req.params.contractId);
    
    if (isNaN(contractId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contract ID"
      });
    }
    
    // Trigger status check
    const status = await monitorRegistrationStatus(contractId);
    
    return res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error("Error checking registration status:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while checking registration status."
    });
  }
});

/**
 * Get all utility contracts for a property
 * GET /api/automated-utility/contracts/property/:propertyId
 */
router.get('/contracts/property/:propertyId', ensureAuthenticated, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    
    if (isNaN(propertyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID"
      });
    }
    
    // Check if user has access to the property
    const hasAccess = await checkPropertyAccess(req.user!.id, propertyId, req.user!.isAdmin || false);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access contracts for this property"
      });
    }
    
    // Get contracts
    const contracts = await db.query.propertyUtilityContracts.findMany({
      where: eq(schema.propertyUtilityContracts.propertyId, propertyId),
      orderBy: (contracts, { desc }) => [desc(contracts.createdAt)]
    });
    
    return res.json({
      success: true,
      contracts
    });
  } catch (error) {
    console.error("Error getting property utility contracts:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting property utility contracts."
    });
  }
});

/**
 * Get all utility contracts for a tenancy
 * GET /api/automated-utility/contracts/tenancy/:tenancyId
 */
router.get('/contracts/tenancy/:tenancyId', ensureAuthenticated, async (req, res) => {
  try {
    const tenancyId = parseInt(req.params.tenancyId);
    
    if (isNaN(tenancyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tenancy ID"
      });
    }
    
    // Check if user has access to the tenancy
    const hasAccess = await checkTenancyAccess(req.user!.id, tenancyId, req.user!.isAdmin || false);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access contracts for this tenancy"
      });
    }
    
    // Get contracts
    const contracts = await db.query.propertyUtilityContracts.findMany({
      where: eq(schema.propertyUtilityContracts.tenancyId, tenancyId),
      orderBy: (contracts, { desc }) => [desc(contracts.createdAt)]
    });
    
    return res.json({
      success: true,
      contracts
    });
  } catch (error) {
    console.error("Error getting tenancy utility contracts:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting tenancy utility contracts."
    });
  }
});

/**
 * Get all utility contracts for the current tenant
 * GET /api/automated-utility/contracts/tenant
 */
router.get('/contracts/tenant', ensureTenant, async (req, res) => {
  try {
    // Get tenant applications
    const applications = await db.query.applications.findMany({
      where: eq(schema.applications.tenantId, req.user!.id),
      with: {
        tenancy: true
      }
    });
    
    // Get tenancy IDs
    const tenancyIds = applications
      .filter(app => app.tenancy !== null)
      .map(app => app.tenancy?.id)
      .filter((id): id is number => id !== undefined);
    
    // Get contracts for all tenancies
    const contracts = await db.query.propertyUtilityContracts.findMany({
      where: tenancyIds.length > 0 ? inArray(schema.propertyUtilityContracts.tenancyId, tenancyIds) : undefined,
      orderBy: (contracts, { desc }) => [desc(contracts.createdAt)]
    });
    
    return res.json({
      success: true,
      contracts
    });
  } catch (error) {
    console.error("Error getting tenant utility contracts:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting tenant utility contracts."
    });
  }
});

/**
 * Helper function to check if user has access to property
 */
async function checkPropertyAccess(userId: number, propertyId: number, isAdmin: boolean): Promise<boolean> {
  // Admins have access to all properties
  if (isAdmin) return true;
  
  // Check if user is the tenant of the property
  const application = await db.query.applications.findFirst({
    where: and(
      eq(schema.applications.tenantId, userId),
      eq(schema.applications.propertyId, propertyId)
    )
  });
  
  // Check if user is the owner of the property
  const property = await db.query.properties.findFirst({
    where: and(
      eq(schema.properties.id, propertyId),
      eq(schema.properties.ownerId, userId)
    )
  });
  
  return !!application || !!property;
}

/**
 * Helper function to check if user has access to tenancy
 */
async function checkTenancyAccess(userId: number, tenancyId: number, isAdmin: boolean): Promise<boolean> {
  // Admins have access to all tenancies
  if (isAdmin) return true;
  
  // Check if user is the tenant
  const tenancy = await db.query.tenancies.findFirst({
    where: eq(schema.tenancies.id, tenancyId),
    with: {
      applications: {
        where: eq(schema.applications.tenantId, userId)
      }
    }
  });
  
  // Check if user is the landlord/owner
  const propertyTenancy = await db.query.tenancies.findFirst({
    where: eq(schema.tenancies.id, tenancyId),
    with: {
      property: {
        where: eq(schema.properties.ownerId, userId)
      }
    }
  });
  
  const isTenant = tenancy?.applications && tenancy.applications.length > 0;
  const isLandlord = propertyTenancy?.property !== undefined;
  
  return isTenant || isLandlord;
}

export default router;