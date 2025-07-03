/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks by requiring a valid token for state-changing operations
 */

import csurf from 'csurf';
import express from 'express';
import { logSecurity, error, createSecurityContext } from '../logging';
import fs from 'fs';

// Define a security error interface
interface SecurityError extends Error {
  code?: string;
}

// Configure CSRF protection with secure defaults
const csrfProtection = csurf({
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Only secure in production
    httpOnly: true,   // Not accessible via JavaScript
    sameSite: 'lax',  // Provides some CSRF protection by default
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});

/**
 * CSRF error handler middleware
 * Provides standardized error response when CSRF validation fails
 */
export const handleCsrfError = (err: SecurityError, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }

  // Create security context for the CSRF failure
  const securityContext = createSecurityContext(req, {
    action: 'csrf_validation_failure',
    result: 'failure'
  });

  // Log the CSRF validation failure
  logSecurity('Website builder security alert: CSRF validation failed', {
    ...securityContext,
    details: { 
      path: req.path,
      method: req.method,
      referrer: req.headers.referer || 'unknown'
    }
  });

  // Standard error logging
  error('CSRF validation failed', { 
    path: req.path, 
    method: req.method,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Return a standardized error response
  res.status(403).json({
    success: false,
    message: 'CSRF validation failed. Please reload the page and try again.'
  });
};

/**
 * Generate CSRF Token middleware
 * Adds a route to generate and provide a CSRF token to the client
 */
export const setupCsrfRoutes = (app: express.Express) => {
  // Route to get a CSRF token
  app.get('/api/csrf-token', csrfProtection, (req: express.Request & { csrfToken: () => string }, res) => {
    const securityContext = createSecurityContext(req, {
      action: 'csrf_token_generation',
      result: 'success'
    });

    // Log token generation for auditing
    logSecurity('CSRF token generated', securityContext);

    res.json({ 
      success: true,
      csrfToken: req.csrfToken() 
    });
  });
};

export default csrfProtection;