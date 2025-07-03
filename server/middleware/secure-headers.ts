/**
 * Secure Headers Middleware
 * Sets additional security-related HTTP headers beyond Content Security Policy
 */

import express from 'express';
import { logSecurity, createSecurityContext } from '../logging';

/**
 * Configure and apply security headers to enhance application security
 */
export default function setupSecureHeaders(app: express.Express) {
  app.use((req, res, next) => {
    // X-Content-Type-Options prevents browsers from interpreting files as a different MIME type
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // X-XSS-Protection enables the browser's built-in XSS filtering
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Strict-Transport-Security tells browsers to only access using HTTPS
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Referrer-Policy controls what information is sent in Referer headers
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // X-Frame-Options prevents clickjacking attacks by controlling if the site can be framed
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // Permissions Policy controls browser features that may be used by the page
    res.setHeader('Permissions-Policy', 'geolocation=self, camera=self, microphone=self');
    
    // Cache-Control prevents sensitive information from being cached
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    
    // Feature-Policy restricts which browser features can be used on your site
    // This is the older version of Permissions-Policy but still good to include for broader browser support
    res.setHeader('Feature-Policy', 'geolocation self; camera self; microphone self');
    
    // Clear-Site-Data header can be used to clear browsing data - good for logout routes
    // Not setting it here as it would be too aggressive for all routes

    // Log headers application with security context
    const securityContext = createSecurityContext(req, {
      action: 'security_headers_applied',
      result: 'success'
    });
    
    logSecurity('Security headers applied', securityContext);
    
    next();
  });
  
  // Log initialization
  console.log('Secure headers middleware initialized');
}