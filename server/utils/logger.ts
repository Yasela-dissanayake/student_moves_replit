/**
 * Logger utility for the application
 * Provides consistent logging format with optional categories
 */

/**
 * Log a message with optional category
 * @param message The message to log
 * @param category Optional category to categorize the log
 */
export function log(message: string, category?: string): void {
  const timestamp = new Date().toISOString();
  const categoryStr = category ? `[${category}]` : '';
  console.log(`${timestamp} ${categoryStr} ${message}`);
}

/**
 * Log an error with optional category
 * @param message The error message
 * @param error Optional error object
 * @param category Optional category to categorize the log
 */
export function logError(message: string, error?: any, category?: string): void {
  const timestamp = new Date().toISOString();
  const categoryStr = category ? `[${category}]` : '';
  
  console.error(`${timestamp} ${categoryStr} ERROR: ${message}`);
  
  if (error) {
    if (error instanceof Error) {
      console.error(`${timestamp} ${categoryStr} ERROR DETAILS: ${error.message}`);
      if (error.stack) {
        console.error(`${timestamp} ${categoryStr} STACK: ${error.stack}`);
      }
    } else {
      console.error(`${timestamp} ${categoryStr} ERROR DETAILS:`, error);
    }
  }
}

/**
 * Log a warning with optional category
 * @param message The warning message
 * @param category Optional category to categorize the log
 */
export function logWarning(message: string, category?: string): void {
  const timestamp = new Date().toISOString();
  const categoryStr = category ? `[${category}]` : '';
  console.warn(`${timestamp} ${categoryStr} WARNING: ${message}`);
}

/**
 * Log a debug message (only in development)
 * @param message The debug message
 * @param category Optional category to categorize the log
 */
export function logDebug(message: string, category?: string): void {
  // Only log in development environment
  if (process.env.NODE_ENV !== 'production') {
    const timestamp = new Date().toISOString();
    const categoryStr = category ? `[${category}]` : '';
    console.debug(`${timestamp} ${categoryStr} DEBUG: ${message}`);
  }
}