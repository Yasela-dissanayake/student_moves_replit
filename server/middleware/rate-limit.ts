/**
 * Rate limiting middleware for API request protection
 * Provides configurable rate limiting to protect against brute force and DoS attacks
 */

import rateLimit from 'express-rate-limit';
import { createSecurityContext, logSecurity } from '../logging';

// Standard rate limiter for general API endpoints
export const standardRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, _, options) => {
    // Log rate limit exceedance with security context
    const securityContext = createSecurityContext(req, {
      action: 'rate_limit_exceeded',
      result: 'failure'
    });
    
    logSecurity('API rate limit exceeded', securityContext);
    
    res.status(options.statusCode).json({
      success: false,
      message: options.message || 'Too many requests, please try again later.'
    });
  }
});

// Stricter rate limiter for sensitive operations (login, password reset, etc.)
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false, 
  handler: (req, res, _, options) => {
    // Log rate limit exceedance with security context
    const securityContext = createSecurityContext(req, {
      action: 'strict_rate_limit_exceeded',
      result: 'failure'
    });
    
    logSecurity('Sensitive operation rate limit exceeded', securityContext);
    
    res.status(options.statusCode).json({
      success: false,
      message: 'Too many attempts. Please try again later.'
    });
  }
});

// Very strict rate limiter for security-critical endpoints (admin operations)
export const adminRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 20, // limit each IP to 20 admin requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use a combined key of IP and user ID for better tracking
    return `${req.ip}_${req.session?.userId || 'anonymous'}`;
  },
  handler: (req, res, _, options) => {
    // Log rate limit exceedance with security context
    const securityContext = createSecurityContext(req, {
      action: 'admin_rate_limit_exceeded',
      result: 'failure'
    });
    
    logSecurity('Admin operation rate limit exceeded', securityContext);
    
    res.status(options.statusCode).json({
      success: false,
      message: 'Administrative operation rate limit exceeded. Please try again later.'
    });
  }
});

// AI operations rate limiter (chat, code generation)
export const aiOperationsRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 AI operations per hour
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use a combined key of IP and user ID for better tracking
    return `${req.ip}_${req.session?.userId || 'anonymous'}`;
  },
  handler: (req, res, _, options) => {
    // Log rate limit exceedance with security context
    const securityContext = createSecurityContext(req, {
      action: 'ai_rate_limit_exceeded',
      result: 'failure'
    });
    
    logSecurity('AI operation rate limit exceeded', securityContext);
    
    res.status(options.statusCode).json({
      success: false,
      message: 'AI operation rate limit exceeded. Please try again later.'
    });
  }
});

// File operations rate limiter
export const fileOperationsRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 file operations per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _, options) => {
    // Log rate limit exceedance with security context
    const securityContext = createSecurityContext(req, {
      action: 'file_operation_rate_limit_exceeded',
      result: 'failure'
    });
    
    logSecurity('File operation rate limit exceeded', securityContext);
    
    res.status(options.statusCode).json({
      success: false,
      message: 'File operation rate limit exceeded. Please try again later.'
    });
  }
});