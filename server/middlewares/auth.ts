import { Request, Response } from 'express';

// Define SessionData to ensure TypeScript recognizes session properties
declare module 'express-session' {
  interface SessionData {
    userId: number;
    userType: string;
    lastActive?: number;
    ipAddress?: string;
  }
}

// Authentication middleware to verify user is logged in
export const authenticateUser = async (req: Request, res: Response, next: Function) => {
  try {
    // Enhanced debugging for all session-related issues
    const requestInfo = {
      userId: req.session?.userId,
      userType: req.session?.userType,
      sessionID: req.sessionID,
      hasSessionObj: !!req.session,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent']?.substring(0, 100) // Truncate long user agents
    };
    
    console.log(`AUTH CHECK: ${JSON.stringify(requestInfo)}`);
    
    // Verify session exists
    if (!req.session) {
      console.error("No session object found in request");
      return res.status(401).json({ 
        message: "Your session is invalid. Please sign in again.", 
        error: "SESSION_MISSING" 
      });
    }
    
    // Update last active timestamp
    if (req.session.lastActive) {
      req.session.lastActive = Date.now();
    }
    
    // If session exists but userId is missing, try several recovery approaches
    if (!req.session.userId) {
      console.log(`Missing userId in session ${req.sessionID}, attempting recovery`);
      
      // First try to reload the session from store
      if (req.sessionID) {
        try {
          console.log(`Attempting to reload session ${req.sessionID}`);
          
          await new Promise<void>((resolve, reject) => {
            req.session.reload((err) => {
              if (err) {
                console.error(`Session reload error: ${err.message}`);
                reject(err);
              } else {
                console.log(`Session reloaded - userId: ${req.session.userId}, userType: ${req.session.userType}`);
                resolve();
              }
            });
          });
          
          // Check if reload restored the userId
          if (req.session.userId) {
            console.log(`Session restored through reload - userId: ${req.session.userId}`);
          } else {
            console.error("Session reload completed but userId still missing");
            return res.status(401).json({ 
              message: "Your session has expired. Please sign in again.", 
              error: "SESSION_EXPIRED" 
            });
          }
        } catch (reloadError) {
          console.error(`Failed to reload session: ${reloadError instanceof Error ? reloadError.message : String(reloadError)}`);
          return res.status(401).json({ 
            message: "Your session could not be verified. Please sign in again.", 
            error: "SESSION_RELOAD_FAILED" 
          });
        }
      } else {
        console.error("No sessionID available for recovery");
        return res.status(401).json({ 
          message: "Your session has expired. Please sign in again.", 
          error: "SESSION_ID_MISSING" 
        });
      }
    }
    
    // Security check - verify IP if we have it stored
    if (req.session.ipAddress && req.session.ipAddress !== req.ip) {
      console.warn(`IP address changed for user ${req.session.userId}: ${req.session.ipAddress} -> ${req.ip}`);
      // We're just logging this for now, not failing the request
    }
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error(`Authentication error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ 
      message: "An error occurred during authentication", 
      error: "AUTH_ERROR" 
    });
  }
};

// Authorization middleware to restrict access based on user type
export const authorizeUser = (allowedTypes: string[]) => (req: Request, res: Response, next: Function) => {
  try {
    // Check if user type exists and is allowed
    if (!req.session?.userType) {
      return res.status(403).json({ 
        message: "User role not found in session", 
        error: "ROLE_MISSING" 
      });
    }
    
    if (!allowedTypes.includes(req.session.userType)) {
      console.warn(`Unauthorized access attempt: User ${req.session.userId} with role ${req.session.userType} tried to access ${req.path}`);
      return res.status(403).json({ 
        message: "You don't have permission to access this resource", 
        error: "UNAUTHORIZED_ROLE" 
      });
    }
    
    // User is authorized, continue
    next();
  } catch (error) {
    console.error(`Authorization error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ 
      message: "An error occurred during authorization", 
      error: "AUTH_ERROR" 
    });
  }
};