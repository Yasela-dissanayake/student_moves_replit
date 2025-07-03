/**
 * AI-Powered Fraud Detection Service
 * 
 * Uses advanced AI models to detect suspicious activities and fraud patterns in:
 * - User registrations
 * - Property applications
 * - Payment activities
 * - Login behaviors
 * - Document uploads
 */
import { executeAIOperation } from './ai-service-manager';
import { log } from './vite';
import * as schema from '../shared/schema';
import { storage } from './storage';
import { db } from './db';
import { eq, and, or, desc, sql } from 'drizzle-orm';

// Types of activities to monitor for fraud
export type FraudableActivity = 
  | 'user_registration'
  | 'property_application'
  | 'document_upload'
  | 'payment_processing'
  | 'login_attempt'
  | 'profile_update';

// Severity levels for fraud alerts
export type FraudAlertSeverity = 'low' | 'medium' | 'high' | 'critical';

// Interface for fraud alert
export interface FraudAlert {
  id?: number;
  userId?: number;
  userType?: string;
  activityType: FraudableActivity;
  severity: FraudAlertSeverity;
  details: string;
  activityData: Record<string, any>;  
  ipAddress?: string;
  deviceInfo?: string;
  timestamp: Date;
  status: 'new' | 'reviewing' | 'dismissed' | 'confirmed';
  reviewedBy?: number;
  reviewNotes?: string;
  reviewedAt?: Date;
}

// Interface for fraud detection context
interface FraudDetectionContext {
  userId?: number;
  userType?: string;
  ipAddress?: string;
  deviceInfo?: string;
  activityType: FraudableActivity;
  activityData: Record<string, any>;
  timestamp?: Date;
  previousActivities?: any[];
}

/**
 * Function to detect potential fraud based on activity context
 * @param context The fraud detection context containing activity details
 * @returns A fraud alert if suspicious activity is detected, null otherwise
 */
export async function detectFraud(context: FraudDetectionContext): Promise<FraudAlert | null> {
  try {
    log(`Analyzing activity for fraud detection: ${context.activityType}`, 'fraud-detection');
    
    // Ensure timestamp is set
    const timestamp = context.timestamp || new Date();
    
    // First get previous activities for context if not provided
    const previousActivities = context.previousActivities || 
      await getPreviousActivities(context.userId, context.activityType);
    
    // Get previous fraud alerts for this user if available
    const previousAlerts = context.userId ? 
      await getPreviousFraudAlerts(context.userId) : [];
    
    // Check for specific patterns based on activity type
    let fraudAlert: FraudAlert | null = null;
    
    switch(context.activityType) {
      case 'user_registration':
        fraudAlert = await detectRegistrationFraud(context, previousActivities, previousAlerts);
        break;
        
      case 'property_application':
        fraudAlert = await detectApplicationFraud(context, previousActivities, previousAlerts);
        break;
        
      case 'document_upload':
        fraudAlert = await detectDocumentFraud(context, previousActivities, previousAlerts);
        break;
        
      case 'payment_processing':
        fraudAlert = await detectPaymentFraud(context, previousActivities, previousAlerts);
        break;
        
      case 'login_attempt':
        fraudAlert = await detectLoginFraud(context, previousActivities, previousAlerts);
        break;
        
      case 'profile_update':
        fraudAlert = await detectProfileUpdateFraud(context, previousActivities, previousAlerts);
        break;
    }
    
    // If fraud detected, save alert to database
    if (fraudAlert) {
      log(`⚠️ Potential fraud detected: ${fraudAlert.severity} severity in ${context.activityType}`, 'fraud-detection');
      await saveFraudAlert(fraudAlert);
      return fraudAlert;
    }
    
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error in fraud detection: ${errorMessage}`, 'fraud-detection');
    return null;
  }
}

/**
 * Detect potential fraud in user registration
 */
async function detectRegistrationFraud(
  context: FraudDetectionContext,
  previousActivities: any[],
  previousAlerts: FraudAlert[]
): Promise<FraudAlert | null> {
  try {
    const registrationData = context.activityData;
    
    // Use AI to analyze registration data for suspicious patterns
    const analysisPrompt = `
      Analyze this user registration data for potential fraud indicators. 
      The registration information is: ${JSON.stringify(registrationData, null, 2)}
      
      Consider:
      - Email pattern and domain trustworthiness
      - Unusual or generated names
      - Speed of form completion
      - IP address location vs address provided
      - Device information inconsistencies
      - Multiple rapid registrations from same IP/device
      
      Previous fraudulent patterns we've seen include:
      - Temporary email domains
      - Inconsistent personal information
      - Automated form filling
      - Multiple accounts with similar details
      
      Format your response as a valid JSON object with these fields:
      {
        "isSuspicious": true/false,
        "severityLevel": "low"/"medium"/"high"/"critical",
        "reasonCodes": ["code1", "code2"], // specific reason codes
        "explanation": "detailed explanation",
        "confidenceScore": 0.75 // between 0-1
      }
    `;
    
    const aiAnalysis = await executeAIOperation('generateText', {
      prompt: analysisPrompt,
      responseFormat: 'json',
      maxTokens: 1000
    });
    
    // Parse AI response
    let analysisResult;
    
    try {
      analysisResult = typeof aiAnalysis === 'string' ? 
        JSON.parse(aiAnalysis) : aiAnalysis;
    } catch (e) {
      log(`Error parsing AI fraud analysis: ${e}`, 'fraud-detection');
      return null;
    }
    
    // If suspicious, create fraud alert
    if (analysisResult.isSuspicious && analysisResult.confidenceScore > 0.6) {
      return {
        userId: context.userId,
        userType: context.userType,
        activityType: 'user_registration',
        severity: analysisResult.severityLevel as FraudAlertSeverity,
        details: `Suspicious registration detected: ${analysisResult.explanation}`,
        activityData: context.activityData,
        ipAddress: context.ipAddress,
        deviceInfo: context.deviceInfo,
        timestamp: context.timestamp || new Date(),
        status: 'new'
      };
    }
    
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error detecting registration fraud: ${errorMessage}`, 'fraud-detection');
    return null;
  }
}

/**
 * Detect potential fraud in property applications
 */
async function detectApplicationFraud(
  context: FraudDetectionContext,
  previousActivities: any[],
  previousAlerts: FraudAlert[]
): Promise<FraudAlert | null> {
  try {
    const applicationData = context.activityData;
    
    // AI analysis for application fraud
    const analysisPrompt = `
      Analyze this property application for potential fraud indicators.
      The application data is: ${JSON.stringify(applicationData, null, 2)}
      
      Consider:
      - Multiple applications in short timeframe
      - Applications for high-value properties from new accounts
      - Inconsistencies in application details
      - Unusual application timing (very late night, etc.)
      - Application details that don't match user profile
      
      Previous fraudulent patterns:
      - Applications for multiple high-value properties simultaneously
      - Applications with fabricated references
      - Group applications with suspicious member patterns
      - Applications with unrealistic financial information
      
      Format your response as a valid JSON object with these fields:
      {
        "isSuspicious": true/false,
        "severityLevel": "low"/"medium"/"high"/"critical",
        "reasonCodes": ["code1", "code2"], 
        "explanation": "detailed explanation",
        "confidenceScore": 0.75 // between 0-1
      }
    `;
    
    const aiAnalysis = await executeAIOperation('generateText', {
      prompt: analysisPrompt,
      responseFormat: 'json',
      maxTokens: 1000
    });
    
    let analysisResult;
    
    try {
      analysisResult = typeof aiAnalysis === 'string' ? 
        JSON.parse(aiAnalysis) : aiAnalysis;
    } catch (e) {
      log(`Error parsing AI application fraud analysis: ${e}`, 'fraud-detection');
      return null;
    }
    
    if (analysisResult.isSuspicious && analysisResult.confidenceScore > 0.65) {
      return {
        userId: context.userId,
        userType: context.userType,
        activityType: 'property_application',
        severity: analysisResult.severityLevel as FraudAlertSeverity,
        details: `Suspicious application detected: ${analysisResult.explanation}`,
        activityData: context.activityData,
        ipAddress: context.ipAddress,
        deviceInfo: context.deviceInfo,
        timestamp: context.timestamp || new Date(),
        status: 'new'
      };
    }
    
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error detecting application fraud: ${errorMessage}`, 'fraud-detection');
    return null;
  }
}

/**
 * Detect potential fraud in document uploads
 */
async function detectDocumentFraud(
  context: FraudDetectionContext,
  previousActivities: any[],
  previousAlerts: FraudAlert[]
): Promise<FraudAlert | null> {
  try {
    const documentData = context.activityData;
    
    // AI analysis for document fraud
    const analysisPrompt = `
      Analyze this document upload for potential fraud indicators.
      The document data is: ${JSON.stringify(documentData, null, 2)}
      
      Consider:
      - Document metadata inconsistencies
      - Unusual document modification timestamps
      - Patterns suggesting document tampering
      - Document content vs. user profile mismatches
      - Multiple similar documents with small variations
      
      Previous fraudulent patterns:
      - Edited ID documents
      - Falsified proof of income documents
      - Multiple similar references with template patterns
      - Documents with suspicious digital alteration markers
      
      Format your response as a valid JSON object with these fields:
      {
        "isSuspicious": true/false,
        "severityLevel": "low"/"medium"/"high"/"critical",
        "reasonCodes": ["code1", "code2"], 
        "explanation": "detailed explanation",
        "confidenceScore": 0.75 // between 0-1
      }
    `;
    
    const aiAnalysis = await executeAIOperation('generateText', {
      prompt: analysisPrompt,
      responseFormat: 'json',
      maxTokens: 1000
    });
    
    let analysisResult;
    
    try {
      analysisResult = typeof aiAnalysis === 'string' ? 
        JSON.parse(aiAnalysis) : aiAnalysis;
    } catch (e) {
      log(`Error parsing AI document fraud analysis: ${e}`, 'fraud-detection');
      return null;
    }
    
    if (analysisResult.isSuspicious && analysisResult.confidenceScore > 0.7) {
      return {
        userId: context.userId,
        userType: context.userType,
        activityType: 'document_upload',
        severity: analysisResult.severityLevel as FraudAlertSeverity,
        details: `Suspicious document detected: ${analysisResult.explanation}`,
        activityData: context.activityData,
        ipAddress: context.ipAddress,
        deviceInfo: context.deviceInfo,
        timestamp: context.timestamp || new Date(),
        status: 'new'
      };
    }
    
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error detecting document fraud: ${errorMessage}`, 'fraud-detection');
    return null;
  }
}

/**
 * Detect potential fraud in payment processing
 */
async function detectPaymentFraud(
  context: FraudDetectionContext,
  previousActivities: any[],
  previousAlerts: FraudAlert[]
): Promise<FraudAlert | null> {
  try {
    const paymentData = context.activityData;
    
    // AI analysis for payment fraud
    const analysisPrompt = `
      Analyze this payment activity for potential fraud indicators.
      The payment data is: ${JSON.stringify(paymentData, null, 2)}
      
      Consider:
      - Unusual payment amounts or patterns
      - Multiple payment method changes
      - Geographical inconsistencies (IP vs payment method country)
      - Payment velocity (multiple quick attempts)
      - Card testing patterns (small test amounts followed by larger ones)
      
      Previous fraudulent patterns:
      - Multiple failed payment attempts with different cards
      - Payments from high-risk countries
      - Unusual payment timing
      - Card BIN patterns known for fraud
      
      Format your response as a valid JSON object with these fields:
      {
        "isSuspicious": true/false,
        "severityLevel": "low"/"medium"/"high"/"critical",
        "reasonCodes": ["code1", "code2"], 
        "explanation": "detailed explanation",
        "confidenceScore": 0.75 // between 0-1
      }
    `;
    
    const aiAnalysis = await executeAIOperation('generateText', {
      prompt: analysisPrompt,
      responseFormat: 'json',
      maxTokens: 1000
    });
    
    let analysisResult;
    
    try {
      analysisResult = typeof aiAnalysis === 'string' ? 
        JSON.parse(aiAnalysis) : aiAnalysis;
    } catch (e) {
      log(`Error parsing AI payment fraud analysis: ${e}`, 'fraud-detection');
      return null;
    }
    
    if (analysisResult.isSuspicious && analysisResult.confidenceScore > 0.65) {
      return {
        userId: context.userId,
        userType: context.userType,
        activityType: 'payment_processing',
        severity: analysisResult.severityLevel as FraudAlertSeverity,
        details: `Suspicious payment detected: ${analysisResult.explanation}`,
        activityData: context.activityData,
        ipAddress: context.ipAddress,
        deviceInfo: context.deviceInfo,
        timestamp: context.timestamp || new Date(),
        status: 'new'
      };
    }
    
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error detecting payment fraud: ${errorMessage}`, 'fraud-detection');
    return null;
  }
}

/**
 * Detect potential fraud in login attempts
 */
async function detectLoginFraud(
  context: FraudDetectionContext,
  previousActivities: any[],
  previousAlerts: FraudAlert[]
): Promise<FraudAlert | null> {
  try {
    const loginData = context.activityData;
    
    // AI analysis for login fraud
    const analysisPrompt = `
      Analyze this login attempt for potential fraud indicators.
      The login data is: ${JSON.stringify(loginData, null, 2)}
      
      Consider:
      - Login location changes (significant geographical shifts)
      - Unusual login times compared to user patterns
      - Multiple failed login attempts
      - Device switching patterns
      - Browser/device fingerprint inconsistencies
      - Login velocity (multiple accounts from same IP)
      
      Previous fraudulent patterns:
      - Logins from known VPN/proxy services
      - Automated login attempts
      - Unusual session behaviors after login
      - Access from countries with high fraud rates
      
      Format your response as a valid JSON object with these fields:
      {
        "isSuspicious": true/false,
        "severityLevel": "low"/"medium"/"high"/"critical",
        "reasonCodes": ["code1", "code2"], 
        "explanation": "detailed explanation",
        "confidenceScore": 0.75 // between 0-1
      }
    `;
    
    const aiAnalysis = await executeAIOperation('generateText', {
      prompt: analysisPrompt,
      responseFormat: 'json',
      maxTokens: 1000
    });
    
    let analysisResult;
    
    try {
      analysisResult = typeof aiAnalysis === 'string' ? 
        JSON.parse(aiAnalysis) : aiAnalysis;
    } catch (e) {
      log(`Error parsing AI login fraud analysis: ${e}`, 'fraud-detection');
      return null;
    }
    
    if (analysisResult.isSuspicious && analysisResult.confidenceScore > 0.65) {
      return {
        userId: context.userId,
        userType: context.userType,
        activityType: 'login_attempt',
        severity: analysisResult.severityLevel as FraudAlertSeverity,
        details: `Suspicious login detected: ${analysisResult.explanation}`,
        activityData: context.activityData,
        ipAddress: context.ipAddress,
        deviceInfo: context.deviceInfo,
        timestamp: context.timestamp || new Date(),
        status: 'new'
      };
    }
    
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error detecting login fraud: ${errorMessage}`, 'fraud-detection');
    return null;
  }
}

/**
 * Detect potential fraud in profile updates
 */
async function detectProfileUpdateFraud(
  context: FraudDetectionContext,
  previousActivities: any[],
  previousAlerts: FraudAlert[]
): Promise<FraudAlert | null> {
  try {
    const profileData = context.activityData;
    
    // AI analysis for profile update fraud
    const analysisPrompt = `
      Analyze this profile update for potential fraud indicators.
      The profile update data is: ${JSON.stringify(profileData, null, 2)}
      
      Consider:
      - Significant changes to core identity information
      - Frequency of changes to contact information
      - Changes to payment details shortly after registration
      - Pattern of gradual identity changes
      - Updates that contradict previous information
      
      Previous fraudulent patterns:
      - Email changes followed by payment method changes
      - Identity information that conflicts with documents
      - Multiple small changes that transform an account
      - Address changes that don't match IP location
      
      Format your response as a valid JSON object with these fields:
      {
        "isSuspicious": true/false,
        "severityLevel": "low"/"medium"/"high"/"critical",
        "reasonCodes": ["code1", "code2"], 
        "explanation": "detailed explanation",
        "confidenceScore": 0.75 // between 0-1
      }
    `;
    
    const aiAnalysis = await executeAIOperation('generateText', {
      prompt: analysisPrompt,
      responseFormat: 'json',
      maxTokens: 1000
    });
    
    let analysisResult;
    
    try {
      analysisResult = typeof aiAnalysis === 'string' ? 
        JSON.parse(aiAnalysis) : aiAnalysis;
    } catch (e) {
      log(`Error parsing AI profile update fraud analysis: ${e}`, 'fraud-detection');
      return null;
    }
    
    if (analysisResult.isSuspicious && analysisResult.confidenceScore > 0.7) {
      return {
        userId: context.userId,
        userType: context.userType,
        activityType: 'profile_update',
        severity: analysisResult.severityLevel as FraudAlertSeverity,
        details: `Suspicious profile update detected: ${analysisResult.explanation}`,
        activityData: context.activityData,
        ipAddress: context.ipAddress,
        deviceInfo: context.deviceInfo,
        timestamp: context.timestamp || new Date(),
        status: 'new'
      };
    }
    
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error detecting profile update fraud: ${errorMessage}`, 'fraud-detection');
    return null;
  }
}

/**
 * Get previous activities for context
 */
async function getPreviousActivities(userId?: number, activityType?: FraudableActivity): Promise<any[]> {
  if (!userId) return [];
  
  try {
    // Fetch user activity logs from database
    // If activityType is specified, filter by that type
    if (activityType) {
      return await storage.getUserActivitiesByType(userId, activityType);
    } else {
      return await storage.getUserActivities(userId);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error retrieving previous activities: ${errorMessage}`, 'fraud-detection');
    return [];
  }
}

/**
 * Get previous fraud alerts for a user
 */
async function getPreviousFraudAlerts(userId: number): Promise<FraudAlert[]> {
  try {
    // Query storage for previous fraud alerts for this user
    return await storage.getFraudAlertsByUser(userId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error retrieving previous fraud alerts: ${errorMessage}`, 'fraud-detection');
    return [];
  }
}

/**
 * Save a fraud alert to the database
 */
async function saveFraudAlert(alert: FraudAlert): Promise<FraudAlert> {
  try {
    // Save fraud alert to storage
    log(`Saving fraud alert: ${alert.severity} - ${alert.details}`, 'fraud-detection');
    return await storage.createFraudAlert(alert);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error saving fraud alert: ${errorMessage}`, 'fraud-detection');
    throw error;
  }
}

/**
 * Get all fraud alerts with optional filtering
 */
export async function getFraudAlerts(options?: {
  userId?: number;
  activityType?: FraudableActivity;
  severity?: FraudAlertSeverity;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<FraudAlert[]> {
  try {
    // Query storage for fraud alerts with optional filtering
    return await storage.getFraudAlerts(options);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error retrieving fraud alerts: ${errorMessage}`, 'fraud-detection');
    return [];
  }
}

/**
 * Update a fraud alert status
 */
export async function updateFraudAlertStatus(
  alertId: number, 
  status: 'reviewing' | 'dismissed' | 'confirmed',
  reviewedBy: number,
  reviewNotes?: string
): Promise<boolean> {
  try {
    // Update fraud alert status in the database
    const updated = await storage.updateFraudAlertStatus(alertId, status, reviewedBy, reviewNotes);
    if (updated) {
      log(`Fraud alert ${alertId} status updated to ${status}`, 'fraud-detection');
      return true;
    }
    return false;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error updating fraud alert: ${errorMessage}`, 'fraud-detection');
    return false;
  }
}

/**
 * Get fraud statistics
 */
export async function getFraudStats(timeframe: 'day' | 'week' | 'month' | 'year'): Promise<any> {
  try {
    // Get fraud statistics from database
    return await storage.getFraudStats(timeframe);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error retrieving fraud stats: ${errorMessage}`, 'fraud-detection');
    return {};
  }
}

/**
 * Track user activity for fraud detection analysis
 * This function logs user activities to be used in fraud detection
 * @param userId The ID of the user performing the activity
 * @param activityType The type of activity being performed
 * @param activityData Additional data about the activity
 * @param ipAddress Optional IP address of the user
 * @param deviceInfo Optional device information
 */
export async function trackUserActivity(
  userId: number,
  activityType: FraudableActivity,
  activityData: Record<string, any>,
  ipAddress?: string,
  deviceInfo?: string
): Promise<void> {
  try {
    // Prepare activity data to include contextual information
    const enrichedActivityData = {
      ...activityData,
      ipAddress,
      deviceInfo,
      timestamp: new Date()
    };
    
    // Log the activity for future fraud analysis
    await storage.logUserActivity(userId, activityType, enrichedActivityData);
    
    // Also check for potential fraud in this activity
    await detectFraud({
      userId,
      activityType,
      activityData: enrichedActivityData,
      ipAddress,
      deviceInfo,
      timestamp: new Date()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error tracking user activity: ${errorMessage}`, 'fraud-detection');
  }
}

// End of file