/**
 * Website Builder Routes
 * 
 * This file contains API routes for the website builder functionality.
 */

import express from 'express';
import { debug, info, warn, error } from './logging';
import { 
  createOrUpdateFile, 
  getFileContent,
  executeCode,
  getFileSystemTree,
  implementFile,
  processChatMessage,
  FileInfo
} from './website-builder-service';

const router = express.Router();

// Get file system tree
router.get('/files', async (req, res) => {
  try {
    const basePath = req.query.basePath as string || '';
    const tree = await getFileSystemTree(basePath);
    res.json({ success: true, tree });
  } catch (err) {
    error('Failed to get file system tree', { error: err });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get file system tree',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

// Get file content
router.get('/file', async (req, res) => {
  try {
    const filePath = req.query.path as string;
    
    if (!filePath) {
      return res.status(400).json({ 
        success: false, 
        message: 'File path is required' 
      });
    }

    const result = await getFileContent(filePath);
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (err) {
    error('Failed to get file content', { error: err });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get file content',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

// Create or update file
router.post('/file', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    
    if (!filePath || content === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'File path and content are required' 
      });
    }

    const result = await createOrUpdateFile(filePath, content);
    res.json(result);
  } catch (err) {
    error('Failed to create/update file', { error: err });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create/update file',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

// Execute code
router.post('/execute', async (req, res) => {
  try {
    const { code, filePath, language } = req.body;
    
    if (!code && !filePath) {
      return res.status(400).json({ 
        success: false, 
        message: 'Either code or file path is required' 
      });
    }

    const result = await executeCode(code, filePath, language);
    res.json({
      success: result.executionSuccess,
      output: result.output
    });
  } catch (err) {
    error('Failed to execute code', { error: err });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to execute code',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

// Process chat message
router.post('/chat', async (req, res) => {
  try {
    const { messages, currentFile } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Messages array is required' 
      });
    }

    // Log the incoming request
    info('Chat request received', { 
      messagesCount: messages.length,
      hasCurrentFile: !!currentFile
    });

    const result = await processChatMessage(messages, currentFile);
    res.json(result);
  } catch (err) {
    error('Failed to process chat message', { error: err });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process chat message',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

// Implement file from AI generated code
router.post('/implement', async (req, res) => {
  try {
    const { path, code, language } = req.body;
    
    if (!path || !code || !language) {
      return res.status(400).json({ 
        success: false, 
        message: 'Path, code, and language are required' 
      });
    }

    const result = await implementFile(path, code, language);
    res.json(result);
  } catch (err) {
    error('Failed to implement file', { error: err });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to implement file',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

// Export function to register routes
export function registerWebsiteBuilderRoutes(app: express.Express): void {
  app.use('/api/website-builder', router);
}

export default router;