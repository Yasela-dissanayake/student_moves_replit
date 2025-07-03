/**
 * Routes for the OpenAI document analysis features
 */

import { Router, Request as ExpressRequest, Response } from 'express';
import multer from 'multer';
import * as openaiDocument from './openai-document';
import { log, logError } from './utils/logger';

// Add file property to Express Request
interface Request extends ExpressRequest {
  file?: Express.Multer.File;
}

const MODULE_NAME = 'openai-document-routes';
const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Base64 encode the buffer from a file upload
function encodeFileToBase64(file: Express.Multer.File): string {
  return file.buffer.toString('base64');
}

// Create routes on the router
// Route: Analyze document using OpenAI
router.post('/analyze-document', upload.single('document'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided' });
    }

    const analysisMode = req.body.analysisMode || 'general';
    const customPrompt = req.body.customPrompt || '';
    const base64Document = encodeFileToBase64(req.file);

    log(`Starting document analysis with mode: ${analysisMode}`, MODULE_NAME);
    
    const result = await openaiDocument.analyzePropertyDocument(
      base64Document,
      analysisMode,
      customPrompt
    );

    return res.json({ result });
  } catch (error) {
    logError(`Error in analyze-document route: ${error}`, MODULE_NAME);
    return res.status(500).json({ 
      error: 'Failed to analyze document',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Route: Extract structured information from document
router.post('/extract-info', upload.single('document'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided' });
    }

    const documentType = req.body.documentType || 'general';
    const base64Document = encodeFileToBase64(req.file);

    log(`Starting information extraction for document type: ${documentType}`, MODULE_NAME);
    
    const result = await openaiDocument.extractDocumentInfo(
      base64Document,
      documentType
    );

    return res.json({ result });
  } catch (error) {
    logError(`Error in extract-info route: ${error}`, MODULE_NAME);
    return res.status(500).json({ 
      error: 'Failed to extract document information',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Route: Verify right to rent document
router.post('/verify-right-to-rent', upload.single('document'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided' });
    }

    const documentType = req.body.documentType || 'passport';
    const base64Document = encodeFileToBase64(req.file);

    log(`Starting right to rent verification for document type: ${documentType}`, MODULE_NAME);
    
    const result = await openaiDocument.verifyRightToRentDocument(
      base64Document,
      documentType
    );

    return res.json({ result });
  } catch (error) {
    logError(`Error in verify-right-to-rent route: ${error}`, MODULE_NAME);
    return res.status(500).json({ 
      error: 'Failed to verify right to rent document',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Route: Check if OpenAI API key is working
router.get('/check-api', async (req: Request, res: Response) => {
  try {
    const isWorking = await openaiDocument.checkApiKey();
    return res.json({ 
      working: isWorking,
      message: isWorking ? 'OpenAI API key is valid and working' : 'OpenAI API key is invalid or not working'
    });
  } catch (error) {
    logError(`Error checking API key: ${error}`, MODULE_NAME);
    return res.status(500).json({ 
      working: false,
      error: 'Error checking API key',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

log('OpenAI document routes registered', MODULE_NAME);

export default router;