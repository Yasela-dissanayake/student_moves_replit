/**
 * Enhanced Website Builder Routes
 * 
 * This file contains API routes for the enhanced website builder functionality.
 * It extends the basic website builder with additional features like template libraries,
 * code testing, and more advanced AI integrations.
 */

import express from 'express';
import fs from 'fs';
import { debug, info, warn, error, logSecurity, SecurityContext, createSecurityContext } from './logging';
import { authenticateUser } from './middleware/auth';
import csrfProtection, { handleCsrfError } from './middleware/csrf-protection';
import { 
  adminRateLimiter, 
  aiOperationsRateLimiter, 
  fileOperationsRateLimiter 
} from './middleware/rate-limit';
import { 
  createOrUpdateFile, 
  getFileContent,
  executeCode,
  getFileSystemTree,
  implementFile,
  processChatMessage,
  fileExists,
  FileInfo
} from './website-builder-service';
import { filterTemplates, ComponentTemplate } from './website-builder-templates';

// Content validation utilities for security
interface ContentValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Validates file paths for security concerns
 * Prevents directory traversal attacks and ensures paths conform to expected formats
 */
function validatePath(path: string): ContentValidationResult {
  // Check for directory traversal attempts
  if (path.includes('..')) {
    return { 
      isValid: false, 
      message: 'Path contains invalid directory traversal patterns' 
    };
  }

  // Check for valid characters only
  if (!path.match(/^[a-zA-Z0-9\/\._-]+$/)) {
    return { 
      isValid: false, 
      message: 'Path contains invalid characters' 
    };
  }

  // Check for reasonable path length
  if (path.length > 255) {
    return { 
      isValid: false, 
      message: 'Path exceeds maximum length' 
    };
  }

  // Check if path is absolute when it shouldn't be
  if (path.startsWith('/') && !path.startsWith('/tmp/') && !path.startsWith('/app/')) {
    return { 
      isValid: false, 
      message: 'Path must be relative to the project root' 
    };
  }

  return { isValid: true };
}

/**
 * Validates code content for security concerns
 * Prevents dangerous patterns and command injections
 */
function validateCode(code: string, language: string): ContentValidationResult {
  // Validate language
  const allowedLanguages = ['javascript', 'typescript', 'python', 'node', 'html', 'css'];
  if (!allowedLanguages.includes(language.toLowerCase())) {
    return { 
      isValid: false, 
      message: 'Unsupported language specified' 
    };
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /process\.env/i,
    /require\s*\(\s*['"]child_process['"]\s*\)/i,
    /import\s*\(\s*['"]child_process['"]\s*\)/i,
    /exec\s*\(/i,
    /spawn\s*\(/i, 
    /eval\s*\(/i,
    /Function\s*\(/i,
    /fs\.(write|append|unlink|mkdir|rmdir|chown|chmod)/i,
    /require\s*\(\s*["']fs["']\s*\)/i,
    /import\s*\(\s*["']fs["']\s*\)/i,
    /require\s*\(\s*["']http["']\s*\)/i,
    /import\s*\(\s*["']http["']\s*\)/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      return { 
        isValid: false, 
        message: 'Code contains potentially unsafe operations' 
      };
    }
  }

  // Check for reasonable code length
  if (code.length > 100000) {
    return { 
      isValid: false, 
      message: 'Code exceeds maximum length' 
    };
  }

  return { isValid: true };
}

// Create router
const router = express.Router();

// Middleware to ensure user is admin
function ensureAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Create security context for enhanced logging using our utility function
  const securityContext = createSecurityContext(req);
  
  // Log admin access attempt with security context
  logSecurity('Admin access attempt to website builder', {
    ...securityContext,
    action: 'admin_access_attempt'
  });
  
  // Legacy access info for backward compatibility
  const accessInfo = { 
    userId: req.session?.userId, 
    userType: req.session?.userType, 
    endpoint: req.originalUrl, 
    method: req.method, 
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.headers['user-agent'] 
  };
  
  if (!req.session?.userType || req.session.userType !== 'admin') {
    // Log unauthorized attempt with security context
    logSecurity('Unauthorized admin access attempt', {
      ...securityContext,
      action: 'admin_access_denied',
      result: 'failure'
    });
    
    // Legacy error logging
    error(`Unauthorized access attempt to website builder`, accessInfo);
    
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
  
  // Log successful admin access with security context
  logSecurity('Admin access authorized', {
    ...securityContext,
    action: 'admin_access_granted',
    result: 'success'
  });
  
  // Legacy info logging
  info(`Admin access to website builder`, { 
    ...accessInfo, 
    action: `${req.method} ${req.originalUrl}` 
  });
  
  next();
}

// Get templates route
router.get('/templates', authenticateUser, ensureAdmin, fileOperationsRateLimiter, async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const tagsParam = req.query.tags as string | undefined;
    const tags = tagsParam ? tagsParam.split(',') : undefined;
    const complexity = req.query.complexity as 'beginner' | 'intermediate' | 'advanced' | undefined;
    const includeMetadata = req.query.includeMetadata === 'true';
    
    // Validate category if provided
    if (category && typeof category === 'string' && category !== 'all') {
      // Only allow alphanumeric characters and basic punctuation in category
      if (!category.match(/^[a-zA-Z0-9\-_\s]+$/)) {
        const securityContext = createSecurityContext(req, { 
          action: 'category_validation_failure', 
          result: 'failure' 
        });
        
        logSecurity('Website builder security alert: Invalid category format', {
          ...securityContext,
          details: { category }
        });
        
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid category format' 
        });
      }
    }
    
    // Validate complexity if provided
    if (complexity && !['beginner', 'intermediate', 'advanced'].includes(complexity)) {
      const securityContext = createSecurityContext(req, { 
        action: 'complexity_validation_failure', 
        result: 'failure' 
      });
      
      logSecurity('Website builder security alert: Invalid complexity value', {
        ...securityContext,
        details: { complexity }
      });
      
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid complexity value' 
      });
    }
    
    // Validate tags if provided
    if (tags && Array.isArray(tags)) {
      // Check for excessive number of tags
      if (tags.length > 20) {
        const securityContext = createSecurityContext(req, { 
          action: 'tags_validation_failure', 
          result: 'failure' 
        });
        
        logSecurity('Website builder security alert: Excessive number of tags', {
          ...securityContext,
          details: { count: tags.length }
        });
        
        return res.status(400).json({ 
          success: false, 
          message: 'Too many tags specified (maximum 20)' 
        });
      }
      
      // Validate individual tag format
      for (const tag of tags) {
        if (!tag.match(/^[a-zA-Z0-9\-_\s]+$/)) {
          const securityContext = createSecurityContext(req, { 
            action: 'tag_validation_failure', 
            result: 'failure' 
          });
          
          logSecurity('Website builder security alert: Invalid tag format', {
            ...securityContext,
            details: { tag }
          });
          
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid tag format' 
          });
        }
      }
    }
    
    // Create security context for enhanced logging
    const securityContext = createSecurityContext(req);
    
    // Log template filtering request
    logSecurity('Website builder template filtering request', {
      ...securityContext,
      action: 'template_search',
      result: 'success',
      details: { category, complexity, tagCount: tags?.length }
    });
    
    // Get templates based on filters
    const templates = filterTemplates(category, tags, complexity);
    
    // Prepare response with metadata if requested
    let response: any = {
      success: true,
      templates
    };
    
    // Include metadata if requested
    if (includeMetadata) {
      // Import these dynamically to avoid circular dependencies
      const { getTemplateCategories, getTemplateTags } = require('./website-builder-templates');
      
      response.metadata = {
        categories: getTemplateCategories(),
        allTags: getTemplateTags(),
        total: templates.length,
        // Group templates by complexity for stats
        complexityStats: {
          beginner: templates.filter(t => t.complexity === 'beginner' || !t.complexity).length,
          intermediate: templates.filter(t => t.complexity === 'intermediate').length,
          advanced: templates.filter(t => t.complexity === 'advanced').length
        }
      };
    }
    
    // Log successful templates retrieval
    logSecurity('Website builder templates retrieved', {
      ...securityContext,
      action: 'templates_retrieved',
      result: 'success',
      details: { 
        count: templates.length,
        filters: { category, complexity, tagCount: tags?.length }
      }
    });
    
    res.json(response);
  } catch (err) {
    // Create security context for error logging
    const securityContext = createSecurityContext(req);
    
    // Log template fetch error
    logSecurity('Website builder templates fetch error', {
      ...securityContext,
      action: 'templates_fetch_error',
      result: 'failure'
    });
    
    // Legacy error logging
    error('Failed to fetch templates', { error: err });
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch templates',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

// Get a single template by ID
router.get('/templates/:id', authenticateUser, ensureAdmin, fileOperationsRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate template ID format
    if (!id.match(/^[a-zA-Z0-9\-_]+$/)) {
      const securityContext = createSecurityContext(req, { 
        action: 'template_id_validation_failure', 
        result: 'failure' 
      });
      
      logSecurity('Website builder security alert: Invalid template ID format', {
        ...securityContext,
        details: { id }
      });
      
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid template ID format' 
      });
    }
    
    // Create security context for enhanced logging
    const securityContext = createSecurityContext(req);
    
    // Log template access attempt
    logSecurity('Website builder template access', {
      ...securityContext,
      action: 'template_access',
      result: 'success',
      details: { templateId: id }
    });
    
    const templates = filterTemplates();
    const template = templates.find(t => t.id === id);
    
    if (!template) {
      // Log template not found
      logSecurity('Website builder template not found', {
        ...securityContext,
        action: 'template_not_found',
        result: 'failure',
        details: { templateId: id }
      });
      
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    // Log successful template retrieval
    logSecurity('Website builder template retrieved', {
      ...securityContext,
      action: 'template_retrieved',
      result: 'success',
      details: { templateId: id, templateName: template.name }
    });
    
    res.json({
      success: true,
      template
    });
  } catch (err) {
    // Create security context for error logging
    const securityContext = createSecurityContext(req);
    
    // Log template fetch error
    logSecurity('Website builder template fetch error', {
      ...securityContext,
      action: 'template_fetch_error',
      result: 'failure',
      details: { templateId: req.params?.id }
    });
    
    // Legacy error logging
    error('Failed to fetch template', { error: err });
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch template',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

// Process chat request
router.post('/chat', authenticateUser, ensureAdmin, aiOperationsRateLimiter, async (req, res) => {
  try {
    const { messages, currentFile } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid messages array is required' 
      });
    }
    
    // Validate message array size to prevent payload attacks
    if (messages.length > 100) {
      const securityContext = createSecurityContext(req, { 
        action: 'chat_message_validation_failure', 
        result: 'failure' 
      });
      
      logSecurity('Website builder security alert: Excessive message count detected', {
        ...securityContext,
        details: { count: messages.length }
      });
      
      return res.status(400).json({ 
        success: false, 
        message: 'Message count exceeds allowed limit' 
      });
    }
    
    // Validate messages contents
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      
      // Check for required properties
      if (!message.role || !message.content || typeof message.content !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: 'Each message must have valid role and content properties' 
        });
      }
      
      // Check for allowed roles
      if (!['system', 'user', 'assistant'].includes(message.role)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Message roles must be one of: system, user, assistant' 
        });
      }
      
      // Check for message size limits
      if (message.content.length > 50000) {
        const securityContext = createSecurityContext(req, { 
          action: 'chat_content_validation_failure', 
          result: 'failure' 
        });
        
        logSecurity('Website builder security alert: Excessive message content length', {
          ...securityContext,
          details: { index: i, length: message.content.length }
        });
        
        return res.status(400).json({ 
          success: false, 
          message: 'Message content exceeds allowed length limit' 
        });
      }
    }
    
    // Validate currentFile path if provided
    if (currentFile) {
      const pathValidation = validatePath(currentFile);
      if (!pathValidation.isValid) {
        const securityContext = createSecurityContext(req, { 
          action: 'path_validation_failure', 
          result: 'failure' 
        });
        
        logSecurity('Website builder security alert: Invalid current file path', {
          ...securityContext,
          details: { message: pathValidation.message }
        });
        
        return res.status(400).json({ 
          success: false, 
          message: pathValidation.message || 'Invalid current file path format' 
        });
      }
    }
    
    // Create security context for enhanced logging using our utility function
    const securityContext = createSecurityContext(req);
    
    // Log AI chat request with security context
    logSecurity('Website builder AI chat request initiated', {
      ...securityContext,
      action: 'ai_chat_request',
      result: 'success'
    });
    
    // Legacy logging for backward compatibility
    info('Processing enhanced website builder chat request', { 
      messagesCount: messages.length,
      ...securityContext
    });
    
    const result = await processChatMessage(messages, currentFile, securityContext);
    
    // Log successful AI chat response
    logSecurity('Website builder AI chat response generated', {
      ...securityContext,
      action: 'ai_chat_response',
      result: 'success'
    });
    
    res.json(result);
  } catch (err) {
    // Log AI chat error with security context using our utility function
    const securityContext = createSecurityContext(req);
    
    logSecurity('Website builder AI chat error', {
      ...securityContext,
      action: 'ai_chat_error',
      result: 'failure'
    });
    
    // Legacy error logging
    error('Failed to process chat message', { 
      error: err instanceof Error ? err.message : String(err),
      userId: req.session?.userId,
      sessionId: req.sessionID
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process chat message',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

// Implement file from AI generated code
router.post('/implement', authenticateUser, ensureAdmin, aiOperationsRateLimiter, async (req, res) => {
  try {
    const { path, code, language } = req.body;
    
    if (!path || !code || !language) {
      return res.status(400).json({ 
        success: false, 
        message: 'Path, code, and language are required' 
      });
    }
    
    // Validate path using our utility function
    const pathValidation = validatePath(path);
    if (!pathValidation.isValid) {
      const securityContext = createSecurityContext(req, { 
        action: 'path_validation_failure', 
        result: 'failure' 
      });
      
      logSecurity('Website builder security alert: Invalid path pattern detected', {
        ...securityContext,
        details: { message: pathValidation.message }
      });
      
      return res.status(400).json({ 
        success: false, 
        message: pathValidation.message || 'Invalid path format' 
      });
    }
    
    // Validate code using our utility function
    const codeValidation = validateCode(code, language);
    if (!codeValidation.isValid) {
      const securityContext = createSecurityContext(req, { 
        action: 'code_validation_failure', 
        result: 'failure' 
      });
      
      logSecurity('Website builder security alert: Code validation failed', {
        ...securityContext,
        details: { message: codeValidation.message }
      });
      
      return res.status(400).json({ 
        success: false, 
        message: codeValidation.message || 'Code validation failed' 
      });
    }
    
    // Create security context for enhanced logging using our utility function
    const securityContext = createSecurityContext(req);
    
    // Log file implementation attempt with security context
    logSecurity('Website builder file implementation attempt', {
      ...securityContext,
      action: 'implement_file_attempt',
      result: 'success'
    });

    const result = await implementFile(path, code, language);
    
    // Log successful file implementation
    logSecurity('Website builder file implementation success', {
      ...securityContext,
      action: 'implement_file_success',
      result: 'success'
    });
    
    res.json(result);
  } catch (err) {
    // Create security context for error logging using our utility function
    const securityContext = createSecurityContext(req);
    
    // Log file implementation error with security context
    logSecurity('Website builder file implementation error', {
      ...securityContext,
      action: 'implement_file_error',
      result: 'failure'
    });
    
    // Legacy error logging
    error('Failed to implement file', { error: err });
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to implement file',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

// Get file system tree
router.get('/files', authenticateUser, ensureAdmin, fileOperationsRateLimiter, async (req, res) => {
  try {
    // Create security context for enhanced logging using our utility function
    const securityContext = createSecurityContext(req);
    
    // Log file system access with security context
    logSecurity('Website builder file system access', {
      ...securityContext,
      action: 'file_system_access',
      result: 'success'
    });
    
    const files = await getFileSystemTree();
    
    // Log successful retrieval
    logSecurity('Website builder file system retrieved', {
      ...securityContext,
      action: 'file_system_retrieved',
      result: 'success'
    });
    
    res.json({ 
      success: true, 
      files 
    });
  } catch (err) {
    // Create security context for error logging using our utility function
    const securityContext = createSecurityContext(req);
    
    // Log file system access error with security context
    logSecurity('Website builder file system access error', {
      ...securityContext,
      action: 'file_system_access_error',
      result: 'failure'
    });
    
    // Legacy error logging
    error('Failed to get file system tree', { error: err });
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get file system tree',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

// Get file content
router.get('/file', authenticateUser, ensureAdmin, fileOperationsRateLimiter, async (req, res) => {
  try {
    const { path } = req.query;
    
    if (!path || typeof path !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid path parameter is required' 
      });
    }
    
    // Validate path using our utility function
    const pathValidation = validatePath(path);
    if (!pathValidation.isValid) {
      const securityContext = createSecurityContext(req, { 
        action: 'path_validation_failure', 
        result: 'failure' 
      });
      
      logSecurity('Website builder security alert: Invalid path pattern detected', {
        ...securityContext,
        details: { message: pathValidation.message }
      });
      
      return res.status(400).json({ 
        success: false, 
        message: pathValidation.message || 'Invalid path format' 
      });
    }
    
    // Create security context for enhanced logging using our utility function
    const securityContext = createSecurityContext(req);
    
    // Log file access with security context
    logSecurity('Website builder file access', {
      ...securityContext,
      action: 'file_access',
      result: 'success',
      filePath: path
    });
    
    const fileContent = await getFileContent(path);
    
    // Log successful file retrieval
    logSecurity('Website builder file content retrieved', {
      ...securityContext,
      action: 'file_content_retrieved',
      result: 'success',
      filePath: path
    });
    
    res.json({ 
      success: true, 
      content: fileContent.content,
      language: fileContent.language
    });
  } catch (err) {
    // Create security context for error logging using our utility function
    const securityContext = createSecurityContext(req);
    
    // Log file access error with security context
    logSecurity('Website builder file access error', {
      ...securityContext,
      action: 'file_access_error',
      result: 'failure',
      filePath: req.query.path as string
    });
    
    // Legacy error logging
    error('Failed to get file content', { error: err });
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get file content',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

// Create or update file
router.post('/file', authenticateUser, ensureAdmin, fileOperationsRateLimiter, async (req, res) => {
  try {
    const { path, content } = req.body;
    
    if (!path || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Path and content are required' 
      });
    }
    
    // Validate content size to prevent excessive file uploads
    if (typeof content === 'string' && content.length > 10 * 1024 * 1024) { // 10MB limit
      const securityContext = createSecurityContext(req, { 
        action: 'content_size_validation_failure', 
        result: 'failure' 
      });
      
      logSecurity('Website builder security alert: Excessive content size', {
        ...securityContext,
        details: { size: content.length }
      });
      
      return res.status(400).json({ 
        success: false, 
        message: 'Content size exceeds allowed limit (10MB maximum)' 
      });
    }
    
    // Validate path using our utility function
    const pathValidation = validatePath(path);
    if (!pathValidation.isValid) {
      const securityContext = createSecurityContext(req, { 
        action: 'path_validation_failure', 
        result: 'failure' 
      });
      
      logSecurity('Website builder security alert: Invalid path pattern detected', {
        ...securityContext,
        details: { message: pathValidation.message }
      });
      
      return res.status(400).json({ 
        success: false, 
        message: pathValidation.message || 'Invalid path format' 
      });
    }
    
    // Create security context for enhanced logging using our utility function
    const securityContext = createSecurityContext(req);
    
    // Determine if this is a create or update operation using our secure utility
    const fileExistsCheck = await fileExists(path);
    const operationType = !fileExistsCheck ? 'create' : 'update';
    
    // Log file modification attempt with security context
    logSecurity(`Website builder file ${operationType} attempt`, {
      ...securityContext,
      action: `file_${operationType}_attempt`,
      result: 'success',
      filePath: path
    });
    
    const result = await createOrUpdateFile(path, content);
    
    // Log successful file modification
    logSecurity(`Website builder file ${operationType} complete`, {
      ...securityContext,
      action: `file_${operationType}_success`,
      result: 'success',
      filePath: path
    });
    
    res.json(result);
  } catch (err) {
    // Create security context for error logging using our utility function
    const securityContext = createSecurityContext(req);
    
    // Log file modification error with security context
    logSecurity('Website builder file modification error', {
      ...securityContext,
      action: 'file_modification_error',
      result: 'failure',
      filePath: req.body?.path
    });
    
    // Legacy error logging
    error('Failed to create or update file', { error: err });
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create or update file',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

// Execute code
router.post('/execute', authenticateUser, ensureAdmin, aiOperationsRateLimiter, async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ 
        success: false, 
        message: 'Code and language are required' 
      });
    }
    
    // Validate code using our utility function
    const codeValidation = validateCode(code, language);
    if (!codeValidation.isValid) {
      const securityContext = createSecurityContext(req, { 
        action: 'code_validation_failure', 
        result: 'failure' 
      });
      
      logSecurity('Website builder security alert: Code validation failed', {
        ...securityContext,
        details: { message: codeValidation.message }
      });
      
      return res.status(400).json({ 
        success: false, 
        message: codeValidation.message || 'Code validation failed' 
      });
    }
    
    // Create security context for enhanced logging using our utility function
    const securityContext = createSecurityContext(req);
    
    // Log code execution attempt with security context
    logSecurity('Website builder code execution attempt', {
      ...securityContext,
      action: 'execute_code_attempt',
      result: 'success'
    });
    
    const result = await executeCode(code, language);
    
    // Log successful code execution
    logSecurity('Website builder code execution complete', {
      ...securityContext,
      action: 'execute_code_success',
      result: 'success'
    });
    
    res.json(result);
  } catch (err) {
    // Create security context for error logging using our utility function
    const securityContext = createSecurityContext(req);
    
    // Log code execution error with security context
    logSecurity('Website builder code execution error', {
      ...securityContext,
      action: 'execute_code_error',
      result: 'failure'
    });
    
    // Legacy error logging
    error('Failed to execute code', { error: err });
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to execute code',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

// Export function to register routes
export function registerEnhancedWebsiteBuilderRoutes(app: express.Express): void {
  app.use('/api/enhanced-website-builder', router);
}

export default router;