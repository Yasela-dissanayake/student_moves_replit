import { Request, Response, NextFunction } from 'express';
import { log } from '../vite';
import { logSecurity, SecurityContext, createSecurityContext } from '../logging';

/**
 * Authentication middleware that checks if the user is logged in
 * This is extracted to its own file to avoid circular dependencies
 */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Create security context for enhanced logging using our utility function
    const securityContext = createSecurityContext(req);
    
    // Additional request context for legacy logging
    const requestInfo = {
      ...securityContext,
      hasSessionObj: !!req.session,
      method: req.method,
      path: req.path
    };
    
    // Log authentication attempt with security context
    logSecurity(`Authentication attempt for ${req.originalUrl}`, {
      ...securityContext,
      action: 'authentication_attempt'
    });
    
    log(`Session auth check on ${req.path}`, "auth");
    
    // Verify session exists
    if (!req.session) {
      console.error("No session object found in request");
      log("Authentication failed: No session object", "auth");
      
      // Log authentication failure with security context
      logSecurity('Authentication failed: No session object', {
        ...securityContext,
        action: 'authentication_failure',
        result: 'failure'
      });
      
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No session found. Please log in.',
        code: 'SESSION_NOT_FOUND'
      });
    }
    
    // Check if user is logged in
    if (!req.session.userId) {
      log("Authentication failed: No user ID in session", "auth");
      
      // Log authentication failure with security context
      logSecurity('Authentication failed: No user ID in session', {
        ...securityContext,
        action: 'authentication_failure',
        result: 'failure'
      });
      
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    // Log successful authentication
    logSecurity('Authentication successful', {
      ...securityContext,
      action: 'authentication_success',
      result: 'success'
    });
    
    // User is authenticated, proceed
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    log(`Authentication error: ${error instanceof Error ? error.message : String(error)}`, "auth");
    
    // Log authentication error with security context using our utility function
    logSecurity('Authentication error', {
      ...createSecurityContext(req),
      action: 'authentication_error',
      result: 'failure'
    });
    
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'An error occurred during authentication',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Authorization middleware that checks if the user has the required role
 * @param allowedRoles Array of allowed user types
 */
export const authorizeUser = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Create security context for enhanced logging using our utility function
      const securityContext = createSecurityContext(req);
      
      // Log authorization attempt with security context
      logSecurity(`Authorization attempt for ${req.originalUrl}`, {
        ...securityContext,
        action: 'authorization_attempt',
        result: 'success' // Initial attempt logged as success, will be updated if it fails
      });
      
      // Check user type
      const userType = req.session?.userType;
      
      if (!userType || !allowedRoles.includes(userType)) {
        log(`Authorization failed: User type ${userType} not in allowed roles: [${allowedRoles.join(', ')}]`, "auth");
        
        // Log authorization failure with security context
        logSecurity('Authorization failed: Insufficient permissions', {
          ...securityContext,
          action: 'authorization_failure',
          result: 'failure'
        });
        
        return res.status(403).json({ 
          error: 'Unauthorized',
          message: 'You do not have permission to access this resource',
          code: 'NOT_AUTHORIZED'
        });
      }
      
      // Log successful authorization
      logSecurity('Authorization successful', {
        ...securityContext,
        action: 'authorization_success',
        result: 'success'
      });
      
      // User is authorized, proceed
      next();
    } catch (error) {
      console.error("Authorization middleware error:", error);
      log(`Authorization error: ${error instanceof Error ? error.message : String(error)}`, "auth");
      
      // Log authorization error with security context using our utility function
      logSecurity('Authorization error', {
        ...createSecurityContext(req),
        action: 'authorization_error',
        result: 'failure'
      });
      
      return res.status(500).json({ 
        error: 'Authorization error',
        message: 'An error occurred during authorization',
        code: 'AUTH_ERROR'
      });
    }
  };
};