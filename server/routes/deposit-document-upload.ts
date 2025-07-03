/**
 * Deposit Protection Document Upload Routes
 * Provides endpoints for uploading and analyzing deposit protection scheme documents
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { log } from '../vite';
import { extractDepositProtectionInfo, generatePrescribedInfoFromExtractedData } from '../document-analysis';
// Import authentication middleware
import authenticateUser from '../middleware';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set up multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads/deposit-documents');
// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with timestamp to avoid overwriting
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Only allow PDF uploads
const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(null, false);
    return cb(new Error('Only PDF files are allowed'));
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});

// Create router
const router = express.Router();

/**
 * Route to upload and analyze a deposit protection scheme document
 * POST /api/deposit-protection/documents/upload
 */
router.post('/upload', authenticateUser, upload.single('depositDocument'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or file type not allowed' });
    }

    const depositRegistrationId = req.body.depositRegistrationId;
    if (!depositRegistrationId) {
      return res.status(400).json({ error: 'Deposit registration ID is required' });
    }

    // Log upload
    log(`Deposit document uploaded: ${req.file.filename}`, 'info');

    // Extract information from the PDF
    const filePath = req.file.path;
    const extractedInfo = await extractDepositProtectionInfo(filePath);

    if (!extractedInfo) {
      return res.status(400).json({ error: 'Failed to extract information from the document' });
    }

    // Get the deposit registration data
    const storage = req.app.locals.storage;
    const depositRegistration = await storage.getDepositRegistration(parseInt(depositRegistrationId, 10));

    if (!depositRegistration) {
      return res.status(404).json({ error: 'Deposit registration not found' });
    }

    // Prepare data for generating prescribed information
    const depositData = {
      depositProtectionId: depositRegistration.depositProtectionId,
      depositProtectionDate: depositRegistration.depositProtectionDate,
      propertyAddress: depositRegistration.propertyAddress,
      landlordName: depositRegistration.landlordName,
      landlordAddress: depositRegistration.landlordAddress,
      landlordPhone: depositRegistration.landlordPhone,
      landlordEmail: depositRegistration.landlordEmail,
      tenantName: depositRegistration.tenantName,
      tenantPhone: depositRegistration.tenantPhone,
      tenantEmail: depositRegistration.tenantEmail,
      depositAmount: depositRegistration.depositAmount,
      tenancyStartDate: depositRegistration.tenancyStartDate,
      tenancyEndDate: depositRegistration.tenancyEndDate
    };

    // Generate prescribed information document
    const prescribedInfoPath = await generatePrescribedInfoFromExtractedData(depositData, extractedInfo);

    if (!prescribedInfoPath) {
      return res.status(500).json({ error: 'Failed to generate prescribed information document' });
    }

    // Update deposit registration with extracted information
    const depositUpdates = {
      depositProtectionScheme: extractedInfo.schemeName,
      prescribedInfoPath: prescribedInfoPath,
      uploadedDocumentPath: filePath,
      lastUpdated: new Date()
    };

    await storage.updateDepositRegistration(parseInt(depositRegistrationId, 10), depositUpdates);

    // Return success response with extracted information
    res.status(200).json({
      message: 'Document successfully uploaded and analyzed',
      extractedInfo,
      prescribedInfoPath
    });
  } catch (error: any) {
    log(`Error in deposit document upload: ${error.message}`, 'error');
    res.status(500).json({ error: 'Failed to process document upload', details: error.message });
  }
});

/**
 * Route to get the prescribed information document for a deposit registration
 * GET /api/deposit-protection/documents/prescribed-info/:id
 */
router.get('/prescribed-info/:id', authenticateUser, async (req, res) => {
  try {
    const depositRegistrationId = parseInt(req.params.id, 10);
    const storage = req.app.locals.storage;
    
    const depositRegistration = await storage.getDepositRegistration(depositRegistrationId);
    
    if (!depositRegistration) {
      return res.status(404).json({ error: 'Deposit registration not found' });
    }
    
    if (!depositRegistration.prescribedInfoPath) {
      return res.status(404).json({ error: 'Prescribed information document not found' });
    }
    
    // Return the document
    res.download(depositRegistration.prescribedInfoPath);
  } catch (error: any) {
    log(`Error retrieving prescribed info document: ${error.message}`, 'error');
    res.status(500).json({ error: 'Failed to retrieve document', details: error.message });
  }
});

/**
 * Route to get the uploaded deposit document
 * GET /api/deposit-protection/documents/uploaded/:id
 */
router.get('/uploaded/:id', authenticateUser, async (req, res) => {
  try {
    const depositRegistrationId = parseInt(req.params.id, 10);
    const storage = req.app.locals.storage;
    
    const depositRegistration = await storage.getDepositRegistration(depositRegistrationId);
    
    if (!depositRegistration) {
      return res.status(404).json({ error: 'Deposit registration not found' });
    }
    
    if (!depositRegistration.uploadedDocumentPath) {
      return res.status(404).json({ error: 'Uploaded document not found' });
    }
    
    // Return the document
    res.download(depositRegistration.uploadedDocumentPath);
  } catch (error: any) {
    log(`Error retrieving uploaded deposit document: ${error.message}`, 'error');
    res.status(500).json({ error: 'Failed to retrieve document', details: error.message });
  }
});

export default router;