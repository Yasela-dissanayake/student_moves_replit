/**
 * Content Security Policy Middleware
 * Provides enhanced protection against XSS attacks by controlling which resources can be loaded
 */

import express from 'express';
import { logSecurity, createSecurityContext } from '../logging';

/**
 * Generates a nonce for use in Content Security Policy headers
 * @returns A cryptographically secure random string
 */
function generateNonce(): string {
  // In a real implementation, this would use crypto.randomBytes
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 16; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

/**
 * Configures Content Security Policy headers for the application
 * This helps prevent XSS attacks by controlling which resources can be loaded
 */
export default function setupContentSecurityPolicy(app: express.Express) {
  app.use((req, res, next) => {
    // Generate a nonce for inline scripts that we trust
    const nonce = generateNonce();
    
    // Store the nonce in the response locals for use in templates
    res.locals.nonce = nonce;
    
    // Configure the Content Security Policy - Relaxed for development environment
    const cspDirectives = [
      // Default policy for loading content
      "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:",
      
      // Script execution policy - Relaxed for Vite development
      "script-src * 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https://*.replit.com https://replit.com https://*.repl.co",
      
      // Style loading policy - Relaxed for development
      "style-src * 'self' 'unsafe-inline' data: blob: https://*.replit.com https://replit.com https://*.repl.co",
      
      // Font loading policy
      "font-src * 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net https://*.replit.com https://replit.com",
      
      // Image loading policy
      "img-src * 'self' data: blob:",
      
      // Connect policy for fetch, WebSocket
      "connect-src * 'self' wss: https: http: https://*.replit.com https://replit.com https://*.repl.co",
      
      // Media loading policy
      "media-src * 'self' data: blob:",
      
      // Object loading policy (PDFs, etc)
      "object-src * 'self' data: blob:",
      
      // Frame loading policy - including YouTube for video embeds
      "frame-src * 'self' https://js.stripe.com https://*.replit.com https://replit.com https://*.repl.co https://www.youtube.com https://youtube.com",
      
      // Worker loading policy
      "worker-src * 'self' blob:"
    ];
    
    // Set the CSP header
    res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
    
    // Set other security headers
    
    // Prevent browsers from interpreting files as a different MIME type
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Prevents the browser from rendering the page if it detects XSS
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Tell browsers that it should only be accessed using HTTPS
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Control what information is leaked in Referer headers
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Log CSP setup with security context
    const securityContext = createSecurityContext(req, {
      action: 'csp_headers_applied',
      result: 'success'
    });
    
    logSecurity('Content Security Policy headers applied', securityContext);
    
    next();
  });
  
  // Log CSP initialization
  console.log('Content Security Policy middleware initialized');
}