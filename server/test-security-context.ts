/**
 * Test script for security context standardization
 * 
 * This script adds a dedicated test endpoint to ensure security contexts are properly formatted
 */
import express from 'express';
import { logSecurity } from './logging';
import { createSecurityContext } from './utils/security-utils';

const router = express.Router();

// Test endpoint to validate security context format
router.get('/test-security-context-format', (req, res) => {
  const securityContext = createSecurityContext(req);
  
  const testUserId = 123;
  
  // Test standard format with details property
  logSecurity('Testing security context format', {
    ...securityContext,
    action: 'test_security_context',
    result: 'success',
    details: {
      userId: testUserId,
      testInfo: 'This is a test of the security context format',
      trackingAction: 'test_action'
    }
  });
  
  // Return success response
  return res.json({
    success: true,
    message: 'Security context format test completed',
    timestamp: new Date().toISOString()
  });
});

export default router;