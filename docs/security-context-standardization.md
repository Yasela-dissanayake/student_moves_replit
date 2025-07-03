# Security Context Standardization Documentation

## Overview
This document provides details about the standardization of security context formatting across the application. Security context is critical for maintaining consistent and comprehensive security logging that can be used for auditing, threat detection, and compliance purposes.

## Standard Security Context Format
The standard security context format includes the following fields:

```typescript
interface SecurityContext {
  userId?: number;             // User identifier (when available)
  userType?: string;           // Type of user (e.g., tenant, landlord, agent)
  sessionId?: string;          // Session identifier
  ipAddress?: string;          // Client IP address
  endpoint?: string;           // API endpoint or route being accessed
  userAgent?: string;          // Client user agent 
  action?: string;             // Action being performed
  result?: 'success' | 'failure'; // Result of the action
  filePath?: string;           // File path (for file operations)
  resourceId?: string;         // Identifier for accessed resource
  resourceType?: string;       // Type of resource being accessed
  operationType?: string;      // Type of operation (read, write, etc.)
  details?: Record<string, any>; // Additional contextual details
  timestamp?: string;          // ISO format timestamp
}
```

## Implementation Details

### Core Security Context Creation
Security context creation is centralized in the `createSecurityContext` function in `server/utils/security-utils.ts`, which extracts common security-relevant information from request objects.

### Security Logging
The `logSecurity` function in `server/logging.ts` is used throughout the application for security-related logging with the standardized context format.

### Field Standardization Rules

1. **userId Placement**:
   - The userId should always be placed within the `details` object, not at the root level of the security context.
   - Example: `details: { userId: req.session?.userId }`

2. **Action Field**:
   - The action field should be a snake_case string describing the security-relevant action.
   - Example: `action: 'favorite_template'`

3. **Result Field**:
   - The result field should be either 'success' or 'failure'.
   - Example: `result: 'success'`

4. **trackingAction Property**:
   - When tracking user behavior, the tracking action should be placed in the `details` object as `trackingAction`.
   - Example: `details: { trackingAction: 'template_viewed' }`

5. **itemDetails Typing**:
   - The itemDetails property should use `Record<string, any>` type to ensure type safety.
   - Example: `itemDetails: trackData.itemDetails ? trackData.itemDetails as Record<string, any> : undefined`

## Key Files Updated

1. **server/routes-website-builder-prediction.ts**
   - Updated all occurrences of security context to ensure proper userId placement
   - Added type safety for itemDetails property
   - Standardized trackingAction properties

2. **server/test-security-context.ts**
   - Created test endpoints to verify security context formatting
   - Provides a reference implementation of proper security context usage

## Testing
Test endpoints have been added for verifying the security context standardization:

- `GET /api/test/test-security-context-format`: Tests the standard format with the details property

## Verification Process
To verify security context standardization:

1. Start the application
2. Call the test endpoint: `curl -X GET http://localhost:5000/api/test/test-security-context-format`
3. Check the logs for properly formatted security context entries
4. Verify that userId is consistently within the details object
5. Confirm that all trackingAction properties are in the correct format

## Log Output Example
A properly formatted security log entry should look like:

```json
{
  "severity": "INFO",
  "message": "Testing security context format",
  "context": {
    "sessionId": "T9_fWfTbY1N6NaCgZ76MRnHxSfjiS9_-",
    "ipAddress": "127.0.0.1",
    "endpoint": "/api/test/test-security-context-format",
    "userAgent": "curl/8.7.1",
    "action": "test_security_context",
    "result": "success",
    "details": {
      "userId": 123,
      "testInfo": "This is a test of the security context format",
      "trackingAction": "test_action"
    },
    "timestamp": "2025-04-12T15:26:40.213Z"
  }
}
```

## Best Practices for Future Development

1. Always use the `createSecurityContext` function to generate security context objects
2. Place userId within the details object, not at the root level
3. Use consistent action names across related operations
4. Provide detailed error information in security logs to aid troubleshooting
5. Include contextual information that would be useful for security auditing
6. Use type safety for all object properties to prevent runtime errors

## Conclusion
Standardizing the security context format ensures consistent security logging across the application. This aids in security auditing, troubleshooting, and compliance with security best practices.