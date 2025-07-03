import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { pool as db } from '../db';

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/verification');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.id;
    const fileExt = path.extname(file.originalname);
    const timestamp = Date.now();
    const documentType = file.fieldname; // 'idDocument' or 'selfie'
    
    cb(null, `${userId}-${documentType}-${timestamp}${fileExt}`);
  }
});

// File filter to allow only image and PDF files
const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedFileTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and PDF files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

const router = express.Router();

// Get verification status
router.get('/status', async (req, res) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Check if user is an agent
  if (req.user.userType !== 'agent') {
    return res.status(403).json({ message: 'Forbidden: Only agents can access this resource' });
  }
  try {
    const agentId = req.user?.id;
    
    // Query verification status from database
    const verificationStatus = await db.query(
      'SELECT * FROM agent_verifications WHERE agent_id = $1',
      [agentId]
    );
    
    if (verificationStatus.rows.length === 0) {
      return res.json({
        status: 'not_submitted',
        idDocumentPath: null,
        selfiePath: null,
        verifiedAt: null,
        submittedAt: null,
        rejectionReason: null,
        verificationConfidence: null,
        faceMatchScore: null,
        documentValidityScore: null
      });
    }
    
    // Transform the result to ensure field naming is consistent
    const result = {
      ...verificationStatus.rows[0],
      // Ensure the status matches what the frontend expects
      status: verificationStatus.rows[0].status
    };
    
    return res.json(result);
  } catch (error) {
    console.error('Error fetching verification status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Upload verification documents
router.post(
  '/documents',
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]),
  async (req, res) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Check if user is an agent
    if (req.user.userType !== 'agent') {
      return res.status(403).json({ message: 'Forbidden: Only agents can access this resource' });
    }
    try {
      const agentId = req.user?.id;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files.idDocument || !files.selfie) {
        return res.status(400).json({ message: 'Both ID document and selfie are required' });
      }
      
      const idDocumentPath = files.idDocument[0].path;
      const selfiePath = files.selfie[0].path;
      
      // Store relative paths
      const idDocumentRelativePath = idDocumentPath.split('uploads/')[1];
      const selfieRelativePath = selfiePath.split('uploads/')[1];
      
      // Check if agent already has a verification record
      const existingVerification = await db.query(
        'SELECT id FROM agent_verifications WHERE agent_id = $1',
        [agentId]
      );
      
      if (existingVerification.rows.length > 0) {
        // Update existing record
        await db.query(
          `UPDATE agent_verifications 
           SET status = 'pending', 
               id_document_path = $1, 
               selfie_path = $2, 
               submitted_at = NOW(),
               verified_at = NULL,
               rejection_reason = NULL
           WHERE agent_id = $3`,
          [idDocumentRelativePath, selfieRelativePath, agentId]
        );
      } else {
        // Create new record
        await db.query(
          `INSERT INTO agent_verifications 
           (agent_id, status, id_document_path, selfie_path, submitted_at)
           VALUES ($1, 'pending', $2, $3, NOW())`,
          [agentId, idDocumentRelativePath, selfieRelativePath]
        );
      }
      
      // Schedule AI verification process here (simulated for now)
      // In a production environment, you would trigger an async job or call an AI verification service
      
      return res.json({
        message: 'Documents uploaded successfully',
        status: 'pending'
      });
    } catch (error) {
      console.error('Error uploading verification documents:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;