/**
 * AI-Powered Fraud Monitoring Service
 * Uses AI service manager to monitor and analyze fraud patterns.
 */

import { FraudableActivity, FraudAlert, FraudAlertSeverity, detectFraud, getFraudAlerts, updateFraudAlertStatus } from './fraud-detection-service';
import { storage } from './storage';
import { User, UserActivity } from '@shared/schema';
import { executeAIOperation } from './ai-service-manager';
import { log } from './utils';

// Types for AI fraud monitoring
export interface FraudPatternAnalysis {
  patternName: string;
  description: string;
  riskScore: number; // 0 to 100
  detectedActivities: string[];
  suggestedActions: string[];
  aiConfidence: number; // 0 to 1
  timestamp: Date;
}

export interface FraudAnomalyDetectionResult {
  anomalyId: string;
  userId?: number;
  userType?: string;
  description: string;
  severity: FraudAlertSeverity;
  anomalyScore: number; // 0 to 100
  relatedActivities: UserActivity[];
  similarPastIncidents?: FraudAlert[];
  timestamp: Date;
  aiInsights: string[];
}

// Use AI service manager for fraud detection

/**
 * Performs continuous AI-powered fraud monitoring
 * @param interval Monitoring interval in milliseconds
 */
export async function startAiFraudMonitoring(interval: number = 1000 * 60 * 60) { // Default hourly
  log('Starting AI fraud monitoring service', 'fraud-monitoring');
  
  // Initial scan
  await scanForFraudPatterns();
  
  // Set up recurring monitoring
  setInterval(async () => {
    await scanForFraudPatterns();
  }, interval);
}

/**
 * Scan all recent user activities for fraud patterns
 */
export async function scanForFraudPatterns(): Promise<FraudPatternAnalysis[]> {
  log('Scanning for fraud patterns', 'fraud-monitoring');
  
  try {
    // Get all users
    const users = await getAllUsers();
    const patterns: FraudPatternAnalysis[] = [];
    
    // Analyze each user's activities
    for (const user of users) {
      const userActivities = await storage.getUserActivities(user.id);
      
      if (userActivities.length > 0) {
        // Analyze with AI
        const userPatterns = await analyzeUserActivitiesWithAI(user, userActivities);
        patterns.push(...userPatterns);
        
        // Detect anomalies
        const anomalies = await detectAnomalies(user, userActivities);
        if (anomalies.length > 0) {
          await handleDetectedAnomalies(anomalies);
        }
      }
    }
    
    return patterns;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error in AI fraud pattern scanning: ${errorMessage}`, 'fraud-monitoring');
    return [];
  }
}

/**
 * Analyze a specific user's activities using AI
 */
async function analyzeUserActivitiesWithAI(
  user: User,
  activities: UserActivity[]
): Promise<FraudPatternAnalysis[]> {
  if (activities.length === 0) return [];
  
  try {
    // Format activities data for AI analysis
    const formattedActivities = activities.map(activity => ({
      type: activity.activityType,
      timestamp: activity.timestamp,
      data: activity.activityData,
      ip: activity.ipAddress || 'unknown',
      device: activity.deviceInfo || 'unknown'
    }));
    
    // Create content for AI analysis
    const prompt = `
      Analyze the following user activities for potential fraud patterns:
      User ID: ${user.id}
      User Type: ${user.userType}
      Activities: ${JSON.stringify(formattedActivities, null, 2)}
      
      Please identify any suspicious patterns or anomalies that could indicate fraudulent behavior.
      Consider login locations, timing, unusual property interactions, document manipulations, or payment activities.
      
      Respond in JSON format with an array of patterns:
      [
        {
          "patternName": "Name of the pattern",
          "description": "Detailed description of why this is suspicious",
          "riskScore": Number between 0-100 representing risk level,
          "detectedActivities": ["Activity 1", "Activity 2"],
          "suggestedActions": ["Suggestion 1", "Suggestion 2"],
          "aiConfidence": Number between 0-1 representing AI confidence
        }
      ]
      
      If no patterns are detected, return an empty array.
    `;
    
    // Use AI service manager to generate content
    const result = await executeAIOperation('generateText', { 
      prompt,
      maxTokens: 1024,
      responseFormat: 'json'
    });
    
    try {
      let patterns: FraudPatternAnalysis[] = [];
      
      // Handle different response formats
      if (typeof result === 'string') {
        const jsonStart = result.indexOf('[');
        const jsonEnd = result.lastIndexOf(']') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonStr = result.substring(jsonStart, jsonEnd);
          patterns = JSON.parse(jsonStr);
        }
      } else if (Array.isArray(result)) {
        patterns = result;
      } else if (result && typeof result === 'object') {
        patterns = Array.isArray(result.patterns) ? result.patterns : 
                  (result.result && Array.isArray(result.result)) ? result.result : [];
      }
      
      // Add timestamp to each pattern
      patterns.forEach(pattern => {
        pattern.timestamp = new Date();
      });
      
      // If patterns detected, create fraud alerts for high-risk patterns
      for (const pattern of patterns) {
        if (pattern.riskScore > 70) { // High risk threshold
          await createFraudAlertFromPattern(user, pattern, activities);
        }
      }
      
      return patterns;
    } catch (parseError: any) {
      log(`Error parsing AI response: ${parseError.message}`, 'fraud-monitoring');
      return [];
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error analyzing user activities with AI: ${errorMessage}`, 'fraud-monitoring');
    return [];
  }
}

/**
 * Create a fraud alert from an AI-detected pattern
 */
async function createFraudAlertFromPattern(
  user: User,
  pattern: FraudPatternAnalysis,
  activities: UserActivity[]
): Promise<FraudAlert | null> {
  // Determine activity type
  let activityType: FraudableActivity = 'login_attempt'; // Default
  if (pattern.detectedActivities.length > 0) {
    const activity = pattern.detectedActivities[0].toLowerCase();
    if (activity.includes('login')) activityType = 'login_attempt';
    else if (activity.includes('document')) activityType = 'document_upload';
    else if (activity.includes('property') || activity.includes('application')) activityType = 'property_application';
    else if (activity.includes('payment')) activityType = 'payment_processing';
    else if (activity.includes('profile') || activity.includes('update')) activityType = 'profile_update';
  }
  
  // Determine severity based on risk score
  let severity: FraudAlertSeverity = 'low';
  if (pattern.riskScore >= 90) severity = 'critical';
  else if (pattern.riskScore >= 70) severity = 'high';
  else if (pattern.riskScore >= 40) severity = 'medium';
  
  // Create fraud detection context
  const context = {
    userId: user.id,
    userType: user.userType,
    activityType,
    activityData: {
      patternName: pattern.patternName,
      description: pattern.description,
      riskScore: pattern.riskScore,
      aiConfidence: pattern.aiConfidence,
      detectedActivities: pattern.detectedActivities,
      suggestedActions: pattern.suggestedActions,
      relatedActivityIds: activities.map(a => a.id)
    },
    ipAddress: activities[0]?.ipAddress,
    deviceInfo: activities[0]?.deviceInfo,
    timestamp: new Date(),
    previousActivities: activities
  };
  
  // Detect fraud using the existing detection system
  return await detectFraud(context);
}

/**
 * Detect anomalies in user activities using AI
 */
async function detectAnomalies(
  user: User,
  activities: UserActivity[]
): Promise<FraudAnomalyDetectionResult[]> {
  if (activities.length < 3) return []; // Need enough activities to detect anomalies
  
  try {
    // Get user's past fraud alerts
    const pastAlerts = await storage.getFraudAlertsByUser(user.id);
    
    // Format activities for anomaly detection
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.activityType,
      timestamp: activity.timestamp,
      data: JSON.stringify(activity.activityData),
      ipAddress: activity.ipAddress,
      deviceInfo: activity.deviceInfo
    }));
    
    // Create content for AI analysis
    const prompt = `
      Analyze the following user activities for anomalies that might indicate fraud:
      User ID: ${user.id}
      User Type: ${user.userType}
      
      Activities: ${JSON.stringify(formattedActivities, null, 2)}
      
      Past Fraud Alerts: ${JSON.stringify(pastAlerts.map(a => ({
        id: a.id,
        activityType: a.activityType,
        severity: a.severity,
        details: a.details,
        status: a.status
      })), null, 2)}
      
      Detect anomalies like:
      1. Unusual access patterns
      2. Suspicious timing between activities
      3. Location/device inconsistencies
      4. Behavior deviating from user's normal patterns
      5. Activities similar to past confirmed fraud cases
      
      Respond in JSON format with an array of anomalies:
      [
        {
          "description": "Description of the anomaly",
          "severity": "low|medium|high|critical",
          "anomalyScore": Number between 0-100,
          "relatedActivityIds": [activity IDs related to this anomaly],
          "aiInsights": ["Insight 1", "Insight 2"]
        }
      ]
      
      If no anomalies are detected, return an empty array.
    `;
    
    // Use AI service manager to generate content
    const result = await executeAIOperation('generateText', { 
      prompt,
      maxTokens: 1024,
      responseFormat: 'json'
    });
    
    try {
      let anomalies: any[] = [];
      
      // Handle different response formats
      if (typeof result === 'string') {
        const jsonStart = result.indexOf('[');
        const jsonEnd = result.lastIndexOf(']') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonStr = result.substring(jsonStart, jsonEnd);
          anomalies = JSON.parse(jsonStr);
        }
      } else if (Array.isArray(result)) {
        anomalies = result;
      } else if (result && typeof result === 'object') {
        anomalies = Array.isArray(result.anomalies) ? result.anomalies : 
                  (result.result && Array.isArray(result.result)) ? result.result : [];
      }
      
      if (!anomalies || anomalies.length === 0) return [];
      
      // Process and enhance anomalies
      return anomalies.map((anomaly: any) => {
        // Find related activities
        const relatedActivities = activities.filter(act => 
          anomaly.relatedActivityIds?.includes(act.id)
        );
        
        // Find similar past incidents
        const similarIncidents = pastAlerts.filter(alert =>
          alert.activityType === (relatedActivities[0]?.activityType || '')
        );
        
        return {
          anomalyId: `anomaly-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: user.id,
          userType: user.userType,
          description: anomaly.description,
          severity: anomaly.severity as FraudAlertSeverity,
          anomalyScore: anomaly.anomalyScore,
          relatedActivities,
          similarPastIncidents: similarIncidents,
          timestamp: new Date(),
          aiInsights: anomaly.aiInsights || []
        };
      });
    } catch (parseError: any) {
      log(`Error parsing AI anomaly response: ${parseError.message}`, 'fraud-monitoring');
      return [];
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error detecting anomalies with AI: ${errorMessage}`, 'fraud-monitoring');
    return [];
  }
}

/**
 * Handle detected anomalies
 */
async function handleDetectedAnomalies(
  anomalies: FraudAnomalyDetectionResult[]
): Promise<void> {
  for (const anomaly of anomalies) {
    // Create fraud alert for high-severity anomalies
    if (['high', 'critical'].includes(anomaly.severity)) {
      // Select most appropriate activity type
      let primaryActivityType = anomaly.relatedActivities[0]?.activityType || 'login_attempt';
      if (!['user_registration', 'property_application', 'document_upload', 'payment_processing', 'login_attempt', 'profile_update'].includes(primaryActivityType)) {
        primaryActivityType = 'login_attempt';
      }
      
      const context = {
        userId: anomaly.userId,
        userType: anomaly.userType,
        activityType: primaryActivityType as FraudableActivity,
        activityData: {
          anomalyId: anomaly.anomalyId,
          description: anomaly.description,
          anomalyScore: anomaly.anomalyScore,
          aiInsights: anomaly.aiInsights,
          relatedActivityIds: anomaly.relatedActivities.map(a => a.id)
        },
        ipAddress: anomaly.relatedActivities[0]?.ipAddress,
        deviceInfo: anomaly.relatedActivities[0]?.deviceInfo,
        timestamp: new Date(),
        previousActivities: anomaly.relatedActivities
      };
      
      await detectFraud(context);
    }
  }
}

/**
 * Get all users for activity analysis
 */
async function getAllUsers(): Promise<User[]> {
  try {
    // Check if the function exists in storage
    if (typeof storage.getAllUsers === 'function') {
      return await storage.getAllUsers();
    } else {
      // Fallback to getting users from a specific query or returning an empty array
      log('getAllUsers function not available in storage, returning empty array', 'fraud-monitoring');
      return [];
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error retrieving users for fraud analysis: ${errorMessage}`, 'fraud-monitoring');
    return [];
  }
}

/**
 * Smart AI review of fraud alerts to reduce false positives
 * @param status Current review status
 */
export async function performSmartReviewOfAlerts(status: 'new' | 'reviewing' = 'new'): Promise<number> {
  try {
    // Get pending alerts
    const alerts = await getFraudAlerts({ status });
    let reviewedCount = 0;
    
    for (const alert of alerts) {
      // Skip alerts that don't have AI insights
      if (!alert.activityData || typeof alert.activityData !== 'object') continue;
      
      // Get more context for the alert
      const userId = alert.userId;
      if (!userId) continue;
      
      const user = await storage.getUser(userId);
      if (!user) continue;
      
      // Get user's recent activities
      const recentActivities = await storage.getUserActivities(userId);
      
      // Use AI to determine if this is a false positive
      const result = await analyzeAlertWithAI(alert, user, recentActivities);
      
      if (result.recommendation) {
        // Update alert status based on AI recommendation
        const newStatus = result.isLikelyFalsePositive ? 'dismissed' : (result.confidence > 0.8 ? 'confirmed' : 'reviewing');
        
        await updateFraudAlertStatus(
          alert.id!, 
          newStatus, 
          null, // No reviewer for AI reviews
          `AI review: ${result.explanation}. Confidence: ${result.confidence}`
        );
        
        reviewedCount++;
      }
    }
    
    return reviewedCount;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error in smart review of alerts: ${errorMessage}`, 'fraud-monitoring');
    return 0;
  }
}

/**
 * Analyze a fraud alert with AI to determine if it's a false positive
 */
async function analyzeAlertWithAI(
  alert: FraudAlert,
  user: User,
  recentActivities: UserActivity[]
): Promise<{
  recommendation: boolean;
  isLikelyFalsePositive: boolean;
  confidence: number;
  explanation: string;
}> {
  try {
    // Format activities for AI
    const formattedActivities = recentActivities.map(activity => ({
      id: activity.id,
      type: activity.activityType,
      timestamp: activity.timestamp,
      data: JSON.stringify(activity.activityData),
      ipAddress: activity.ipAddress,
      deviceInfo: activity.deviceInfo
    }));
    
    // Create content for AI analysis
    const prompt = `
      Analyze the following fraud alert and determine if it's likely a false positive:
      
      Fraud Alert:
      - ID: ${alert.id}
      - User: ${user.id} (${user.userType})
      - Activity: ${alert.activityType}
      - Severity: ${alert.severity}
      - Details: ${alert.details}
      - Activity Data: ${JSON.stringify(alert.activityData)}
      - IP Address: ${alert.ipAddress || 'unknown'}
      - Device: ${alert.deviceInfo || 'unknown'}
      - Timestamp: ${alert.timestamp}
      
      Recent User Activities:
      ${JSON.stringify(formattedActivities, null, 2)}
      
      User Profile:
      - Email: ${user.email}
      - User Type: ${user.userType}
      - Verified: ${user.verified}
      
      Analyze the alert in context of the user's recent activity. Determine if this is likely a false positive or a genuine fraud concern.
      
      Respond in JSON format:
      {
        "isLikelyFalsePositive": true/false,
        "confidence": number between 0-1,
        "explanation": "Detailed explanation of your reasoning"
      }
    `;
    
    // Use AI service manager to generate content
    const result = await executeAIOperation('generateText', { 
      prompt,
      maxTokens: 1024,
      responseFormat: 'json'
    });
    
    try {
      let analysis: any = {};
      
      // Handle different response formats
      if (typeof result === 'string') {
        const jsonStart = result.indexOf('{');
        const jsonEnd = result.lastIndexOf('}') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonStr = result.substring(jsonStart, jsonEnd);
          analysis = JSON.parse(jsonStr);
        }
      } else if (result && typeof result === 'object') {
        analysis = result;
      }
      
      // Check if we got a valid analysis
      if (analysis && 'isLikelyFalsePositive' in analysis && 'confidence' in analysis && 'explanation' in analysis) {
        return {
          recommendation: true,
          isLikelyFalsePositive: analysis.isLikelyFalsePositive,
          confidence: analysis.confidence,
          explanation: analysis.explanation
        };
      }
      
      return {
        recommendation: false,
        isLikelyFalsePositive: false,
        confidence: 0,
        explanation: 'Unable to analyze alert'
      };
    } catch (parseError: any) {
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      log(`Error parsing AI analysis response: ${errorMessage}`, 'fraud-monitoring');
      return {
        recommendation: false,
        isLikelyFalsePositive: false,
        confidence: 0,
        explanation: 'Error parsing AI response'
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error analyzing alert with AI: ${errorMessage}`, 'fraud-monitoring');
    return {
      recommendation: false,
      isLikelyFalsePositive: false,
      confidence: 0,
      explanation: `Error: ${errorMessage}`
    };
  }
}

/**
 * Generate embedding using AI service
 */
async function generateTextEmbedding(text: string): Promise<number[] | null> {
  try {
    // This is a simplified implementation
    // In a real system, you would use the AI service to generate proper embeddings
    // For now, we'll just generate a random embedding for demonstration
    const embeddingSize = 128;
    const embedding = Array(embeddingSize).fill(0).map(() => Math.random() * 2 - 1);
    
    // In the future, this would be replaced with a real embedding API call:
    // const result = await executeAIOperation('generateEmbedding', { text });
    // return result.embedding;
    
    return embedding;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error generating embedding: ${errorMessage}`, 'fraud-monitoring');
    return null;
  }
}

/**
 * Generate AI embeddings for user activities to enable similarity search
 */
export async function generateActivityEmbeddings(): Promise<Map<number, number[]>> {
  const embeddingMap = new Map<number, number[]>();
  
  try {
    // Get all users
    const users = await getAllUsers();
    
    for (const user of users) {
      // Skip users without an ID
      if (!user.id) continue;
      
      const activities = await storage.getUserActivities(user.id);
      
      for (const activity of activities) {
        // Create a description of the activity for embedding
        const activityDescription = `
          User ${user.id} (${user.userType}) performed ${activity.activityType} 
          at ${activity.timestamp} from ${activity.ipAddress || 'unknown IP'} 
          on ${activity.deviceInfo || 'unknown device'}.
          Activity data: ${JSON.stringify(activity.activityData)}
        `;
        
        // Generate embedding
        const embedding = await generateTextEmbedding(activityDescription);
        if (embedding) {
          embeddingMap.set(activity.id, embedding);
        }
      }
    }
    
    return embeddingMap;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error generating activity embeddings: ${errorMessage}`, 'fraud-monitoring');
    return embeddingMap;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have same dimension");
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}