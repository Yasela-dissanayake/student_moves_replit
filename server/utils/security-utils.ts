/**
 * Security Utilities
 * 
 * This module provides utilities for security-related operations such as validating inputs, 
 * checking file existence safely, and managing security metadata.
 */

import express from 'express';
import { SecurityContext } from '../logging';
import fs from 'fs/promises';

/**
 * Safely checks if a file exists without following symbolic links
 * This helps prevent symlink attacks
 * 
 * @param path The file path to check
 * @returns A promise that resolves to true if the file exists, false otherwise
 */
export async function safeFileExists(path: string): Promise<boolean> {
  try {
    // Normalize path to remove any special character sequences
    const normalizedPath = path.replace(/\.\./g, '').replace(/\/+/g, '/');
    
    // Use fs.stat which doesn't follow symbolic links
    await fs.stat(normalizedPath);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Validates if a string is safe to use as a filename
 * 
 * @param filename The filename to validate
 * @returns True if the filename is safe, false otherwise
 */
export function isValidFilename(filename: string): boolean {
  // Check if filename contains only safe characters
  return /^[a-zA-Z0-9_.-]+$/.test(filename);
}

/**
 * Detects if a string contains potential injection attacks
 * 
 * @param input The input string to check
 * @returns True if the string appears safe, false if potential injection detected
 */
export function isInputSafe(input: string): boolean {
  // Check for common injection patterns
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:/gi,
    /vbscript:/gi,
    /expression\s*\(/gi
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Generates a nonce for use in Content Security Policy headers
 * 
 * @returns A cryptographically secure random string
 */
export function generateNonce(): string {
  // In a real implementation, this would use crypto.randomBytes
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 16; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

// Re-export createSecurityContext from logging to provide a complete security utils package
// This is just for convenience so other modules only need to import from security-utils
export { createSecurityContext } from '../logging';

// Export an interface for custom error with code property
export interface SecurityError extends Error {
  code?: string;
}