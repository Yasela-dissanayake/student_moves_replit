/**
 * Utility functions for the server
 */
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import type { Request, Response, NextFunction } from 'express';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        isAdmin: boolean;
        userType: string;
      };
    }
  }
}

// Configure multer storage for file uploads
export const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

/**
 * Log a message with a specific source
 * @param message The message to log
 * @param source The source of the log
 */
export function log(message: string, source: string = "server") {
  console.log(`[${source}] ${message}`);
}

/**
 * Log an error with a specific source
 * @param message The error message to log
 * @param source The source of the log
 */
export function logError(message: string, source: string = "server") {
  console.error(`[${source}] ERROR: ${message}`);
}

/**
 * Send an email to a recipient
 * @param to Email recipient
 * @param subject Email subject
 * @param body Email body content
 * @returns Promise that resolves when email is sent
 */
export async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  // Mock function for email sending
  // In production, this would integrate with an email service like SendGrid or AWS SES
  console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
  console.log(`[EMAIL] Body: ${body.substring(0, 100)}${body.length > 100 ? '...' : ''}`);
  
  // Simulate email sending success
  return true;
}

/**
 * Sleep for a specified number of milliseconds
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Truncate a string to a maximum length
 * @param str String to truncate
 * @param maxLength Maximum length
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries
 * @param initialDelay Initial delay in milliseconds
 * @returns Result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const delay = initialDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} failed. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  
  throw lastError || new Error('All retries failed');
}

/**
 * Create multer storage for a specific upload directory
 * @param subdir Subdirectory name under the uploads directory
 * @returns Multer storage configuration
 */
export function createMulterStorage(subdir: string) {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(process.cwd(), 'uploads', subdir);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Generate a unique filename with timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
}

/**
 * Middleware to ensure user is authenticated
 */
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Debugging info
  console.log("Auth check:", { 
    path: req.path,
    method: req.method,
    hasSession: !!req.session,
    userId: req.session?.userId,
    userType: req.session?.userType,
    headers: req.headers
  });
  
  // Check for session or other authentication method
  if (!req.session?.userId) {
    console.log("Authentication failed: no userId in session");
    return res.status(401).json({ 
      success: false, 
      message: "Authentication required" 
    });
  }
  
  // Attach user object to request for convenience
  if (!req.user && req.session.userId) {
    req.user = { 
      id: req.session.userId,
      isAdmin: req.session.userType === 'admin',
      userType: req.session.userType
    };
  }
  
  console.log("Authentication successful for user:", req.session.userId);
  next();
}

/**
 * Middleware to ensure user is an tenant
 */
export function ensureTenant(req: Request, res: Response, next: NextFunction) {
  // First ensure authenticated
  ensureAuthenticated(req, res, () => {
    // Check if user is a tenant
    if (req.session?.userType !== 'tenant') {
      return res.status(403).json({ 
        success: false, 
        message: "Tenant access required" 
      });
    }
    next();
  });
}

/**
 * Middleware to ensure user is an admin
 */
export function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  // First ensure authenticated
  ensureAuthenticated(req, res, () => {
    // Check if user is an admin
    if (req.session?.userType !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "Admin access required" 
      });
    }
    next();
  });
}