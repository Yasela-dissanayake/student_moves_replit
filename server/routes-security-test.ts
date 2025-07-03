/**
 * Security Test Routes
 * Provides endpoints for testing security features implemented in the application.
 */

import express, { Request, Response, NextFunction } from 'express';
import { info as logInfo, logSecurity, createSecurityContext, SecurityContext } from './logging';

interface CSRFTestResult {
  success: boolean;
  message: string;
}

interface CSPTestResult {
  success: boolean;
  message: string;
  policy?: string;
}

interface SecureHeadersTestResult {
  success: boolean;
  message: string;
  headers?: Record<string, string>;
}

interface CookieTestResult {
  success: boolean;
  message: string;
  cookies?: Record<string, string>;
}

interface SecurityContext {
  userId?: number;
  userType?: string;
  sessionId?: string;
  ipAddress?: string;
  endpoint?: string;
  userAgent?: string;
  action?: string;
  result?: 'success' | 'failure';
  filePath?: string;           
  resourceId?: string;         
  resourceType?: string;       
  operationType?: string;      
  details?: Record<string, any>; 
}

/**
 * Registers all security test routes
 */
export function registerSecurityTestRoutes(app: express.Express) {
  logInfo('[security] Registering security test routes');

  /**
   * Test endpoint for CSRF protection
   * This endpoint should only be accessible with a valid CSRF token
   */
  app.post('/api/security-test/csrf', (req: Request, res: Response) => {
    const context = createSecurityContext(req);
    logSecurity('CSRF test request received', context);
    
    const result: CSRFTestResult = {
      success: true,
      message: 'CSRF protection is working correctly. Valid token provided.'
    };
    
    res.json(result);
  });

  /**
   * Test endpoint for CSRF attack simulation
   * This endpoint is designed to fail the CSRF check for testing purposes
   */
  app.post('/api/security-test/csrf-attack', (req: Request, res: Response, next: NextFunction) => {
    const context = createSecurityContext(req);
    logSecurity('CSRF attack simulation request received', context);
    
    // This should be blocked by CSRF middleware, but we'll handle it anyway
    const result: CSRFTestResult = {
      success: false,
      message: 'CSRF protection is not working correctly. This request should have been blocked.'
    };
    
    res.status(403).json(result);
  });

  /**
   * Test endpoint for Content Security Policy
   * Verifies that CSP headers are being applied correctly
   */
  app.get('/api/security-test/csp', (req: Request, res: Response) => {
    const context = createSecurityContext(req);
    logSecurity('CSP test request received', context);
    
    // Get CSP from response headers
    const cspHeader = res.getHeader('Content-Security-Policy');
    
    const result: CSPTestResult = {
      success: !!cspHeader,
      message: cspHeader 
        ? 'Content Security Policy is properly configured' 
        : 'Content Security Policy header is missing',
      policy: cspHeader ? cspHeader.toString() : undefined
    };
    
    res.json(result);
  });

  /**
   * Test endpoint for secure headers
   * Returns all security-related headers that are set
   */
  app.get('/api/security-test/secure-headers', (req: Request, res: Response) => {
    const context = createSecurityContext(req);
    logSecurity('Secure headers test request received', context);
    
    // Get all headers
    const headers: Record<string, string> = {};
    const headerNames = [
      'Content-Security-Policy',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Strict-Transport-Security',
      'Referrer-Policy',
      'Feature-Policy',
      'Permissions-Policy'
    ];
    
    headerNames.forEach(name => {
      const value = res.getHeader(name);
      if (value) {
        headers[name] = value.toString();
      }
    });
    
    const result: SecureHeadersTestResult = {
      success: Object.keys(headers).length > 0,
      message: Object.keys(headers).length > 0 
        ? 'Security headers are properly configured' 
        : 'No security headers found',
      headers
    };
    
    res.json(result);
  });

  /**
   * Test endpoint for secure cookies
   * Sets a test cookie with secure attributes and returns its configuration
   */
  app.get('/api/security-test/cookie', (req: Request, res: Response) => {
    const context = createSecurityContext(req);
    logSecurity('Cookie security test request received', context);
    
    // Set a test cookie with secure attributes
    res.cookie('security_test_cookie', 'test_value', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60000 // 1 minute
    });
    
    // Get cookie details
    const cookieDetails: Record<string, string> = {
      'HttpOnly': 'true',
      'Secure': 'true',
      'SameSite': 'strict',
      'Max-Age': '60000'
    };
    
    const result: CookieTestResult = {
      success: true,
      message: 'Secure cookie has been set with appropriate security attributes',
      cookies: cookieDetails
    };
    
    res.json(result);
  });

  /**
   * Test endpoint for rate limiting
   * This endpoint is rate limited to demonstrate rate limiting protection
   */
  app.get('/api/security-test/rate-limit', (req: Request, res: Response) => {
    const context = createSecurityContext(req);
    logSecurity('Rate limit test request received', context);
    
    res.json({
      success: true,
      message: 'Rate limiting test request successful',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Test endpoint for input validation
   * Validates input and returns success or error
   */
  app.post('/api/security-test/validate', (req: Request, res: Response) => {
    const context = createSecurityContext(req, { details: { input: req.body } });
    logSecurity('Input validation test request received', context);
    
    const { name, email } = req.body;
    
    // Simple validation
    const nameValid = typeof name === 'string' && name.length > 0 && name.length < 100 && !name.includes(';');
    const emailValid = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    if (nameValid && emailValid) {
      res.json({
        success: true,
        message: 'Input validation passed',
        validated: { name, email }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Input validation failed',
        errors: {
          name: !nameValid ? 'Invalid name format or potential injection attempt' : undefined,
          email: !emailValid ? 'Invalid email format' : undefined
        }
      });
    }
  });

  const registrationContext: SecurityContext = {
    action: 'routes_registration',
    result: 'success',
    resourceType: 'security_test_routes'
  };
  logSecurity('Security test routes registered successfully', registrationContext);
}