/**
 * Logging Utility
 * 
 * This module provides standardized logging functions for the application.
 */

// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// Current log level from environment or default to INFO
const currentLogLevel = process.env.LOG_LEVEL || LogLevel.INFO;

// Determine if a log level should be displayed based on current level
function shouldLog(level: LogLevel): boolean {
  const levels = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3
  };

  return levels[level] >= levels[currentLogLevel as LogLevel];
}

// Get timestamp for log message
function getTimestamp(): string {
  return new Date().toISOString();
}

// Log message with level, timestamp, and optional context
function log(level: LogLevel, message: string, context: Record<string, any> = {}, category?: string): void {
  if (!shouldLog(level)) return;

  const timestamp = getTimestamp();
  const contextStr = Object.keys(context).length ? JSON.stringify(context) : '';
  const categoryStr = category ? `[${category}]` : '';
  
  console.log(`[${timestamp}] [${level}] ${categoryStr} ${message} ${contextStr}`);
}

// Export a public version of the log function that can be called directly
export function logWithCategory(message: string, category: string, context: Record<string, any> = {}): void {
  log(LogLevel.INFO, message, context, category);
}

// Specific log level functions
export function debug(message: string, context: Record<string, any> = {}): void {
  log(LogLevel.DEBUG, message, context);
}

export function info(message: string, context: Record<string, any> = {}): void {
  log(LogLevel.INFO, message, context);
}

export function warn(message: string, context: Record<string, any> = {}): void {
  log(LogLevel.WARN, message, context);
}

export function error(message: string, context: Record<string, any> = {}): void {
  log(LogLevel.ERROR, message, context);
}

// Create a logger for a specific module
export function createLogger(module: string) {
  return {
    debug: (message: string, context: Record<string, any> = {}) => {
      debug(`[${module}] ${message}`, context);
    },
    info: (message: string, context: Record<string, any> = {}) => {
      info(`[${module}] ${message}`, context);
    },
    warn: (message: string, context: Record<string, any> = {}) => {
      warn(`[${module}] ${message}`, context);
    },
    error: (message: string, context: Record<string, any> = {}) => {
      error(`[${module}] ${message}`, context);
    },
    security: (message: string, context: Record<string, any> = {}) => {
      logWithCategory(`[${module}] ${message}`, 'SECURITY', context);
    }
  };
}

/**
 * Security context interface for detailed security logging
 */
export interface SecurityContext {
  userId?: number;
  userType?: string;
  sessionId?: string;
  ipAddress?: string;
  endpoint?: string;
  userAgent?: string;
  action?: string;
  result?: 'success' | 'failure';
  filePath?: string;           // Path to file for file operations
  resourceId?: string;         // ID of the resource being accessed
  resourceType?: string;       // Type of resource being accessed
  operationType?: string;      // Type of operation being performed
  details?: Record<string, any>; // Additional details specific to the operation
}

/**
 * Create a security context object from an Express request
 * This utility function standardizes security context creation across the application
 */
export function createSecurityContext(req: any, extraProps: Partial<SecurityContext> = {}): SecurityContext {
  return {
    userId: req.session?.userId,
    userType: req.session?.userType,
    sessionId: req.sessionID,
    ipAddress: req.ip || req.connection?.remoteAddress,
    endpoint: req.originalUrl,
    userAgent: req.headers['user-agent'] as string,
    ...extraProps
  };
}

/**
 * Log security-related events with standardized context
 */
export function logSecurity(
  message: string, 
  context: SecurityContext
): void {
  // Add timestamp for all security logs
  const timestampedContext = {
    ...context,
    timestamp: new Date().toISOString()
  };
  
  logWithCategory(message, 'SECURITY', timestampedContext);
}