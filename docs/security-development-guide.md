# UniRent WebCraft Security Development Guide

This guide is intended for developers contributing to the UniRent WebCraft enhanced website builder. It outlines security best practices, patterns, and utilities that should be followed when making changes to the codebase.

## Security Development Principles

1. **Defense in Depth**
   - Implement multiple security controls
   - Assume each layer may be compromised
   - Design with overlapping protections

2. **Least Privilege**
   - Grant minimal permissions needed
   - Restrict sensitive operations to admin users
   - Use role-based access control consistently

3. **Input Validation**
   - Validate ALL user inputs
   - Apply validation at multiple layers
   - Use established validation utilities

4. **Security Logging**
   - Log security-related events in standardized format
   - Include context for post-incident analysis
   - Avoid logging sensitive data

## Required Security Utilities

When developing new features, always use the established security utilities:

### 1. Security Context Creation

Always create a security context for logging operations:

```typescript
// Import the utility function
import { createSecurityContext } from '../utils/security-utils';

// Create a security context from the request, with optional additional fields
const securityContext = createSecurityContext(req, { 
  action: 'operation_name',
  result: 'success'
});
```

### 2. Security Logging

Use the security logging function for all security-relevant events:

```typescript
// Import the logging functions
import { logSecurity, error } from '../logging';

// Log successful operations
logSecurity('Website builder operation completed', {
  ...securityContext,
  action: 'operation_name',
  result: 'success',
  details: { additional: 'context' }
});

// Log failures or security alerts
logSecurity('Website builder security alert', {
  ...securityContext,
  action: 'security_alert',
  result: 'failure',
  details: { alertType: 'suspicious_activity' }
});
```

### 3. Content Validation

Always use the established validation utilities:

```typescript
// Validate file paths
const pathValidation = validatePath(path);
if (!pathValidation.isValid) {
  return res.status(400).json({ 
    success: false, 
    message: pathValidation.message || 'Invalid path format' 
  });
}

// Validate code for execution or storage
const codeValidation = validateCode(code, language);
if (!codeValidation.isValid) {
  return res.status(400).json({ 
    success: false, 
    message: codeValidation.message || 'Code validation failed' 
  });
}
```

### 4. Rate Limiting

Apply appropriate rate limiting middleware to all routes:

```typescript
// For AI operations (chat, code generation)
router.post('/ai-endpoint', authenticateUser, ensureAdmin, aiOperationsRateLimiter, async (req, res) => {
  // Route handler
});

// For file operations (read, write, list)
router.get('/file-endpoint', authenticateUser, ensureAdmin, fileOperationsRateLimiter, async (req, res) => {
  // Route handler
});
```

## Route Handler Security Pattern

All route handlers should follow this security pattern:

```typescript
router.post('/endpoint', authenticateUser, ensureAdmin, appropriateRateLimiter, async (req, res) => {
  try {
    // 1. Extract and validate required parameters
    const { param1, param2 } = req.body;
    
    if (!param1 || !param2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required parameters missing' 
      });
    }
    
    // 2. Validate inputs using appropriate validation utilities
    const validation = validateInput(param1);
    if (!validation.isValid) {
      const securityContext = createSecurityContext(req, { 
        action: 'validation_failure', 
        result: 'failure' 
      });
      
      logSecurity('Input validation failed', {
        ...securityContext,
        details: { message: validation.message }
      });
      
      return res.status(400).json({ 
        success: false, 
        message: validation.message || 'Validation failed' 
      });
    }
    
    // 3. Create security context for operation logging
    const securityContext = createSecurityContext(req);
    
    // 4. Log operation attempt
    logSecurity('Operation attempt', {
      ...securityContext,
      action: 'operation_attempt',
      result: 'success'
    });
    
    // 5. Perform operation
    const result = await performOperation(param1, param2);
    
    // 6. Log successful operation
    logSecurity('Operation successful', {
      ...securityContext,
      action: 'operation_success',
      result: 'success'
    });
    
    // 7. Return success response
    res.json({
      success: true,
      result
    });
  } catch (err) {
    // 8. Create security context for error logging
    const securityContext = createSecurityContext(req);
    
    // 9. Log operation error with security context
    logSecurity('Operation error', {
      ...securityContext,
      action: 'operation_error',
      result: 'failure'
    });
    
    // 10. Standard error logging
    error('Failed to perform operation', { error: err });
    
    // 11. Return error response
    res.status(500).json({ 
      success: false, 
      message: 'Operation failed',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});
```

## Common Security Vulnerabilities to Avoid

### 1. Path Traversal

Ensure all file operations use proper path validation:

```typescript
// INCORRECT - Vulnerable to path traversal
const filePath = `./data/${req.query.filename}`;
const content = await fs.readFile(filePath, 'utf8');

// CORRECT - Validated path
const filename = req.query.filename;
const pathValidation = validatePath(filename);
if (!pathValidation.isValid) {
  // Handle error
}
const filePath = `./data/${filename}`;
const content = await fs.readFile(filePath, 'utf8');
```

### 2. Cross-Site Scripting (XSS)

Always sanitize user-provided content before rendering or storing it:

```typescript
// INCORRECT - XSS vulnerability
const template = `<div>${userProvidedContent}</div>`;

// CORRECT - Sanitized content
const sanitizedContent = sanitizeHTML(userProvidedContent);
const template = `<div>${sanitizedContent}</div>`;
```

### 3. Unsafe Code Execution

Validate code before execution:

```typescript
// INCORRECT - Unsafe execution
const result = executeCode(userProvidedCode);

// CORRECT - Validated execution
const codeValidation = validateCode(userProvidedCode, language);
if (!codeValidation.isValid) {
  // Handle error
}
const result = executeCode(userProvidedCode);
```

### 4. Inadequate Access Control

Always verify user permissions:

```typescript
// INCORRECT - Missing permission check
router.post('/sensitive-endpoint', authenticateUser, async (req, res) => {
  // Sensitive operation
});

// CORRECT - Proper permission check
router.post('/sensitive-endpoint', authenticateUser, ensureAdmin, async (req, res) => {
  // Sensitive operation
});
```

## Security Testing

### 1. Manual Testing

When implementing new features, manually test for security issues:

- Try invalid inputs to test validation
- Attempt to bypass authentication/authorization
- Test rate limiting by exceeding limits
- Verify proper error handling

### 2. Code Review

All code changes should undergo security-focused review:

- Check for proper input validation
- Verify authentication and authorization
- Ensure proper error handling
- Confirm security logging is implemented

### 3. Static Analysis

Use static analysis tools to identify security issues:

- Run linters with security rules enabled
- Use security-focused code scanning tools
- Address all security warnings

## Adding New Security Features

When adding new security features:

1. Document the feature in the security guide
2. Create appropriate utility functions for reuse
3. Update this development guide with examples
4. Apply the feature consistently across all relevant routes
5. Add appropriate logging for the feature

## Security Incident Response

If you discover a security vulnerability:

1. Document the vulnerability with steps to reproduce
2. Assess the severity and potential impact
3. Implement a fix following the security patterns in this guide
4. Add tests to prevent regression
5. Update documentation as needed
6. Consider adding detection for similar issues

## Secure Development Resources

- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top Ten](https://owasp.org/www-project-api-security/)
- [Node.js Security Best Practices](https://nodejs.org/en/security)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)