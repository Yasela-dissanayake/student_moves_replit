/**
 * Secure Cookies Middleware
 * Ensures all cookies set by the application have appropriate security attributes
 */

import express from 'express';
import { logSecurity, createSecurityContext } from '../logging';

interface CookieOptions {
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none' | boolean;
  [key: string]: any;
}

/**
 * Configure and apply secure cookie settings
 */
export default function setupSecureCookies(app: express.Express) {
  // Use a middleware to enhance cookie security
  app.use((req, res, next) => {
    // Store the original cookie method
    const originalCookie = res.cookie;
    
    // Replace with our enhanced version
    res.cookie = function(
      name: string, 
      value: string, 
      options: CookieOptions = {}
    ) {
      // Create a new options object with security enhancements
      const secureOptions: CookieOptions = {
        // In production, always set secure flag unless explicitly disabled
        secure: process.env.NODE_ENV === 'production' ? true : options.secure,
        
        // Always set httpOnly unless explicitly disabled
        httpOnly: options.httpOnly !== false,
        
        // Set sameSite to prevent CSRF
        sameSite: options.sameSite || 'lax',
        
        // Copy all other options
        ...options
      };
      
      // Log the security enhancement
      const securityContext = createSecurityContext(req, {
        action: 'cookie_security_enhancement',
        result: 'success'
      });
      
      logSecurity('Cookie security enhancements applied', securityContext);
      
      // Call the original method
      return originalCookie.apply(res, [name, value, secureOptions]);
    };
    
    next();
  });
  
  // Log initialization
  console.log('Secure cookies middleware initialized');
}