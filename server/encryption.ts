/**
 * Encryption utility for securely storing sensitive data
 * Used primarily for protecting API credentials for deposit protection schemes
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { log } from './vite';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define secure storage settings
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;  // 256 bits
const IV_LENGTH = 16;   // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const MASTER_KEY_PATH = path.join(__dirname, '..', 'secure', 'master.key');
const SECURE_DIR = path.join(__dirname, '..', 'secure');

// Ensure the secure directory exists
try {
  if (!fs.existsSync(SECURE_DIR)) {
    fs.mkdirSync(SECURE_DIR, { recursive: true, mode: 0o700 });
    log('Created secure directory for storing encryption keys', 'info');
  }
} catch (error: any) {
  log(`Failed to create secure directory: ${error.message}`, 'error');
}

/**
 * Generate a cryptographically secure master key
 * @returns The master key as a Buffer
 */
function generateMasterKey(): Buffer {
  try {
    const masterKey = crypto.randomBytes(KEY_LENGTH);
    fs.writeFileSync(MASTER_KEY_PATH, masterKey, { mode: 0o600 });
    log('Generated new master encryption key', 'info');
    return masterKey;
  } catch (error: any) {
    log(`Failed to generate master key: ${error.message}`, 'error');
    throw new Error('Failed to initialize encryption system');
  }
}

/**
 * Get the master encryption key, generating it if it doesn't exist
 * @returns The master key as a Buffer
 */
function getMasterKey(): Buffer {
  try {
    if (fs.existsSync(MASTER_KEY_PATH)) {
      return fs.readFileSync(MASTER_KEY_PATH);
    } else {
      return generateMasterKey();
    }
  } catch (error: any) {
    log(`Failed to access master key: ${error.message}`, 'error');
    throw new Error('Encryption system is not properly configured');
  }
}

/**
 * Derive an encryption key from the master key and a salt
 * @param salt Salt for key derivation
 * @returns Derived key as a Buffer
 */
function deriveKey(salt: Buffer): Buffer {
  const masterKey = getMasterKey();
  return crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt data using AES-256-GCM with a derived key
 * @param data Data to encrypt
 * @returns Encrypted data object with all components needed for decryption
 */
export function encrypt(data: string): string {
  try {
    // Generate a random salt for key derivation
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Derive encryption key from master key and salt
    const key = deriveKey(salt);
    
    // Generate a random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher with key and IV
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    // Encrypt data
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine components for storage
    // Format: salt:iv:authTag:encryptedData
    return Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]).toString('base64');
  } catch (error: any) {
    log(`Encryption error: ${error.message}`, 'error');
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256-GCM with a derived key
 * @param encryptedData Encrypted data string in the format: salt:iv:authTag:encryptedData
 * @returns Decrypted data as a string
 */
export function decrypt(encryptedData: string): string {
  try {
    // Parse the components
    const buffer = Buffer.from(encryptedData, 'base64');
    
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH).toString('hex');
    
    // Derive key using same salt
    const key = deriveKey(salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    // Set auth tag
    decipher.setAuthTag(authTag);
    
    // Decrypt data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error: any) {
    log(`Decryption error: ${error.message}`, 'error');
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt an object by serializing it to JSON and encrypting the result
 * @param obj Object to encrypt
 * @returns Encrypted object as a string
 */
export function encryptObject(obj: any): string {
  try {
    const serialized = JSON.stringify(obj);
    return encrypt(serialized);
  } catch (error: any) {
    log(`Object encryption error: ${error.message}`, 'error');
    throw new Error('Failed to encrypt object');
  }
}

/**
 * Decrypt an encrypted object string and parse it as JSON
 * @param encryptedObj Encrypted object string
 * @returns Decrypted object
 */
export function decryptObject(encryptedObj: string): any {
  try {
    const serialized = decrypt(encryptedObj);
    return JSON.parse(serialized);
  } catch (error: any) {
    log(`Object decryption error: ${error.message}`, 'error');
    throw new Error('Failed to decrypt object');
  }
}

/**
 * Check if the encryption system is properly set up
 * @returns True if encryption is ready, false otherwise
 */
export function isEncryptionReady(): boolean {
  try {
    getMasterKey();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Initialize the encryption system
 * @returns True if initialized successfully, false otherwise
 */
export function initializeEncryption(): boolean {
  try {
    if (!isEncryptionReady()) {
      generateMasterKey();
    }
    return isEncryptionReady();
  } catch (error) {
    return false;
  }
}

export default {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  isEncryptionReady,
  initializeEncryption
};