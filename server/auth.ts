import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if a user is authenticated
 * Optionally restrict to specific user types
 */
export function checkAuth(allowedTypes?: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user is logged in
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to continue.'
      });
    }

    // If specific user types are required, check if the user has the right type
    if (allowedTypes && allowedTypes.length > 0) {
      if (!allowedTypes.includes(req.session.userType)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource.'
        });
      }
    }

    // User is authenticated and has the right permissions, proceed
    next();
  };
}