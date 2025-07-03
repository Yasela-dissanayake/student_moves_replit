import { executeAIOperation } from './ai-service-manager';
import { verifications } from '@shared/schema';
import { db } from './db';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Document Verification Service
 * This service handles ID document verification using multiple AI providers
 * It integrates with the AI Service Manager for provider fallback support
 */

interface VerificationResult {
  verified: boolean;
  faceMatch: boolean;
  documentAuthenticity: boolean;
  liveDetection: boolean;
  confidenceScore: number;
  errorDetails?: string;
  documentData?: {
    documentType: string;
    name?: string;
    dateOfBirth?: string;
    expirationDate?: string;
    documentNumber?: string;
    nationality?: string;
    address?: string;
  };
}

/**
 * Verify a user's identity documents
 * @param verificationId The ID of the verification record
 * @returns Verification result
 */
export async function verifyIdentityDocuments(verificationId: number): Promise<VerificationResult> {
  try {
    // Get verification record
    const [verification] = await db
      .select()
      .from(verifications)
      .where(eq(verifications.id, verificationId));

    if (!verification) {
      throw new Error(`Verification record ${verificationId} not found`);
    }

    // Skip if already verified
    if (verification.aiVerified || verification.adminVerified) {
      return {
        verified: true,
        faceMatch: true,
        documentAuthenticity: true,
        liveDetection: true,
        confidenceScore: 1.0,
        documentData: verification.metadata?.documentData || undefined
      };
    }

    // Document paths
    const documentImagePath = verification.documentImage;
    const selfieImagePath = verification.selfieImage;

    if (!documentImagePath || !selfieImagePath) {
      throw new Error('Missing document or selfie image');
    }

    // Check if files exist
    const documentFullPath = path.join(process.cwd(), documentImagePath);
    const selfieFullPath = path.join(process.cwd(), selfieImagePath);

    if (!fs.existsSync(documentFullPath)) {
      throw new Error(`Document image file not found: ${documentImagePath}`);
    }

    if (!fs.existsSync(selfieFullPath)) {
      throw new Error(`Selfie image file not found: ${selfieImagePath}`);
    }

    // Convert images to base64
    let documentBase64: string;
    let selfieBase64: string;

    try {
      documentBase64 = fs.readFileSync(documentFullPath).toString('base64');
      selfieBase64 = fs.readFileSync(selfieFullPath).toString('base64');
    } catch (fileError: any) {
      throw new Error(`Error reading image files: ${fileError.message}`);
    }

    if (!documentBase64 || !selfieBase64) {
      throw new Error('Failed to convert images to base64');
    }

    // Analyze documents with AI
    const params: any = {
      documentImageBase64: documentBase64,
      selfieImageBase64: selfieBase64,
      documentType: verification.documentType
    };
    
    // Log the verification attempt
    console.log(`Attempting to verify document for verification ID: ${verificationId}`);
    console.log(`Document type: ${verification.documentType}`);
    
    let result: VerificationResult;
    
    try {
      result = await executeAIOperation('verifyIdentity', params) as VerificationResult;
    } catch (aiError: any) {
      console.error('AI service error during verification:', aiError);
      
      // Determine if it's an API key issue or service availability problem
      const errorMessage = aiError.message || '';
      let errorDetails = 'AI verification service error';
      
      if (errorMessage.includes('API key')) {
        errorDetails = 'API key configuration error. Please contact support.';
      } else if (errorMessage.includes('provider') || errorMessage.includes('service')) {
        errorDetails = 'AI verification service temporarily unavailable. Please try again later.';
      } else {
        errorDetails = `Verification error: ${errorMessage}`;
      }
      
      // Update verification record with error status
      await db
        .update(verifications)
        .set({
          status: 'failed',
          metadata: {
            errorDetails,
            aiServiceError: true,
            timestamp: new Date().toISOString()
          }
        })
        .where(eq(verifications.id, verificationId));
      
      return {
        verified: false,
        faceMatch: false,
        documentAuthenticity: false,
        liveDetection: false,
        confidenceScore: 0,
        errorDetails
      };
    }

    // Update verification record with results
    const updateData: any = {
      aiVerified: result.verified,
      aiVerifiedAt: new Date(),
      status: result.verified ? 'approved' : 'rejected',
      metadata: {
        faceMatch: result.faceMatch,
        documentAuthenticity: result.documentAuthenticity,
        liveDetection: result.liveDetection,
        confidenceScore: result.confidenceScore,
        errorDetails: result.errorDetails || null,
        documentData: result.documentData || null,
        verificationTimestamp: new Date().toISOString()
      }
    };
    
    await db
      .update(verifications)
      .set(updateData)
      .where(eq(verifications.id, verificationId));

    return result;
  } catch (error: any) {
    console.error('Error verifying identity documents:', error);
    
    // Create a structured error response with detailed information
    const errorResult: VerificationResult = {
      verified: false,
      faceMatch: false,
      documentAuthenticity: false,
      liveDetection: false,
      confidenceScore: 0,
      errorDetails: error.message || 'Unknown error occurred during verification'
    };
    
    // Update verification record with error status if possible
    try {
      if (verificationId) {
        await db
          .update(verifications)
          .set({
            status: 'failed',
            metadata: {
              errorDetails: error.message,
              errorTimestamp: new Date().toISOString()
            }
          })
          .where(eq(verifications.id, verificationId));
      }
    } catch (dbError) {
      console.error('Failed to update verification record with error status:', dbError);
    }
    
    return errorResult;
  }
}

/**
 * Save document and selfie images from form data
 * @param files The uploaded files
 * @param userId The user ID
 * @param documentType The type of document
 * @returns Paths to saved files
 */
export async function saveVerificationImages(
  documentImage: Express.Multer.File,
  selfieImage: Express.Multer.File,
  userId: number,
  documentType: string
): Promise<{ documentPath: string, selfiePath: string }> {
  const uploadsDir = path.join(process.cwd(), 'uploads', 'verifications');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Generate unique filenames
  const documentFilename = `${userId}_${documentType}_${uuidv4()}${path.extname(documentImage.originalname)}`;
  const selfieFilename = `${userId}_selfie_${uuidv4()}${path.extname(selfieImage.originalname)}`;
  
  // Save files
  const documentPath = path.join(uploadsDir, documentFilename);
  const selfiePath = path.join(uploadsDir, selfieFilename);
  
  fs.writeFileSync(documentPath, documentImage.buffer);
  fs.writeFileSync(selfiePath, selfieImage.buffer);
  
  return {
    documentPath: `/uploads/verifications/${documentFilename}`,
    selfiePath: `/uploads/verifications/${selfieFilename}`
  };
}

/**
 * Manually approve a verification
 * @param verificationId The ID of the verification record
 * @param adminId The ID of the admin approving the verification
 * @returns Updated verification record
 */
export async function approveVerification(verificationId: number, adminId: number) {
  const updateData: any = {
    adminVerified: true,
    adminVerifiedAt: new Date(),
    adminVerifiedBy: adminId,
    status: 'approved'
  };

  const [updatedVerification] = await db
    .update(verifications)
    .set(updateData)
    .where(eq(verifications.id, verificationId))
    .returning();
    
  return updatedVerification;
}

/**
 * Manually reject a verification
 * @param verificationId The ID of the verification record
 * @param adminId The ID of the admin rejecting the verification
 * @param reason The reason for rejection
 * @returns Updated verification record
 */
export async function rejectVerification(
  verificationId: number, 
  adminId: number,
  reason: string
) {
  const updateData: any = {
    adminVerified: false,
    adminVerifiedAt: new Date(),
    adminVerifiedBy: adminId,
    status: 'rejected',
    metadata: {
      rejectionReason: reason
    }
  };

  const [updatedVerification] = await db
    .update(verifications)
    .set(updateData)
    .where(eq(verifications.id, verificationId))
    .returning();
    
  return updatedVerification;
}