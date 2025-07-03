# UniRent WebCraft Security Guide

This documentation outlines the security features and best practices implemented in the UniRent WebCraft enhanced website builder to ensure secure operation.

## Security Overview

UniRent WebCraft implements multiple layers of security to protect against common web vulnerabilities and attacks:

1. **Authentication and Authorization**
   - Session-based authentication with secure session configuration
   - Role-based access control for all website builder features
   - Admin-only access to sensitive operations

2. **Input Validation and Sanitization**
   - Comprehensive validation for all user inputs
   - Path validation to prevent directory traversal attacks
   - Code validation to prevent dangerous pattern execution
   - Content size limits to prevent resource exhaustion

3. **Rate Limiting**
   - Specialized rate limiters for different operation types
   - Protection against brute force attacks
   - AI operation rate limiting to prevent resource abuse

4. **Logging and Monitoring**
   - Comprehensive security logging system
   - Detailed security contexts for all operations
   - Standardized logging format for better analysis
   - Tracking of all sensitive operations

5. **Secure Development Practices**
   - Code execution sandboxing
   - Secure file operations
   - Protection against common web vulnerabilities

## Authentication Security

### User Session Management

- Sessions are managed securely with proper configuration
- Session cookies use HttpOnly and Secure flags
- Session IDs are regenerated on privilege level changes
- Inactivity timeout implemented to prevent session hijacking

### Admin Access Control

- All website builder routes enforce admin-level access
- Authentication middleware checks both user authentication and role
- Security context tracks user information for all operations

## Input Validation

### Path Validation

The system implements strict path validation to prevent directory traversal attacks:

```javascript
function validatePath(path: string): ContentValidationResult {
  // Prevent paths with directory traversal
  if (path.includes('..')) {
    return {
      isValid: false,
      message: 'Path contains forbidden patterns (..)' 
    };
  }
  
  // Only allow alphanumeric, slash, dot, hyphen, and underscore
  if (!path.match(/^[a-zA-Z0-9\/\._-]+$/)) {
    return {
      isValid: false,
      message: 'Path contains invalid characters'
    };
  }
  
  // Prevent absolute paths or references to system directories
  if (path.startsWith('/') || path.startsWith('~') || path.includes('/etc/') || path.includes('/var/')) {
    return {
      isValid: false,
      message: 'Path uses forbidden system references'
    };
  }
  
  return { isValid: true };
}
```

### Code Validation

Code that users attempt to execute or save is validated to prevent dangerous patterns:

```javascript
function validateCode(code: string, language: string): ContentValidationResult {
  // Detect potentially dangerous patterns
  const dangerousPatterns = [
    /process\.exit/i,
    /require\s*\(\s*['"]child_process['"]\s*\)/i,
    /exec\s*\(/i,
    /spawn\s*\(/i,
    /eval\s*\(/i,
    /Function\s*\(/i,
    /new\s+Function/i,
    /require\s*\(\s*['"]fs['"]\s*\)/i,
    /fs\.(write|append|unlink|rm|rmdir)/i,
    /\/__proto__/i,
    /constructor\.constructor/i
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      return {
        isValid: false,
        message: `Code contains potentially unsafe patterns: ${pattern.toString()}`
      };
    }
  }
  
  return { isValid: true };
}
```

### Content Size Validation

To prevent denial of service attacks through excessive content size:

- Chat messages are limited to 50,000 characters each
- Maximum 100 messages per chat request
- File content limited to 10MB maximum size
- Template and tag counts are restricted to reasonable limits

## Rate Limiting

Different rate limiting strategies are applied to various operations:

### AI Operations Rate Limiting

```javascript
const aiOperationsRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.session?.userId?.toString() || req.ip,
  message: { success: false, message: 'Too many AI operations. Please try again later.' }
});
```

### File Operations Rate Limiting

```javascript
const fileOperationsRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // 100 requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.session?.userId?.toString() || req.ip,
  message: { success: false, message: 'Too many file operations. Please try again later.' }
});
```

## Security Logging System

### Security Context

Every operation creates a security context with standardized information:

```javascript
interface SecurityContext {
  userId?: number;
  sessionId?: string;
  userType?: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: Date;
  action?: string;
  result?: 'success' | 'failure';
  details?: Record<string, any>;
}
```

### Security Logging Function

Security events are logged with consistent formatting:

```javascript
function logSecurity(message: string, context: SecurityContext): void {
  logger.log({
    level: 'info',
    message: `[SECURITY] ${message}`,
    securityContext: context,
    timestamp: new Date().toISOString()
  });
}
```

## Secure File Operations

### File System Access

- All file system operations use relative paths
- Path existence checks are performed securely
- File operations track create vs. update operations
- All file modifications are logged with security context

### Ensuring File Existence Safely

```javascript
async function fileExists(path: string): Promise<boolean> {
  try {
    // Normalize the path to prevent directory traversal
    const normalizedPath = path.replace(/\.\./g, '').replace(/\/+/g, '/');
    
    // Use fs.stat which doesn't follow symbolic links
    await fs.stat(normalizedPath);
    return true;
  } catch (err) {
    return false;
  }
}
```

## Security Recommendations for Users

1. **Regular Updates**
   - Keep all website builder dependencies updated
   - Apply security patches promptly

2. **Access Control**
   - Only grant admin access to trusted users
   - Use strong passwords for all accounts
   - Enable multi-factor authentication if available

3. **Monitoring**
   - Regularly review security logs
   - Monitor for unusual activity patterns
   - Set up alerts for security events

4. **Backups**
   - Implement regular backups of website data
   - Test backup restoration procedures
   - Store backups securely

5. **Code Review**
   - Review generated code before implementation
   - Verify AI-generated code follows security best practices
   - Implement a code review process for all website changes

## Reporting Security Issues

If you discover a security vulnerability in UniRent WebCraft, please report it through the following channels:

- Email: security@unirent.example.com
- Submit a detailed report through the admin dashboard
- Contact the system administrator directly

Do not disclose security vulnerabilities publicly until they have been addressed.