/**
 * Marketplace Fraud Detection API Routes
 * Provides endpoints for fraud detection and monitoring in the student marketplace
 */
import express from 'express';
import { authenticateUser } from './middleware/auth';
import { log } from './vite';
import { storage } from './storage';
import { FraudAlert, FraudAlertSeverity, getFraudAlerts, updateFraudAlertStatus } from './fraud-detection-service';

export function createMarketplaceFraudRoutes() {
  const router = express.Router();

  /**
   * Get marketplace fraud alerts
   * Query parameters:
   * - status: Filter by alert status (new, reviewing, resolved, dismissed)
   * - severity: Filter by severity level (low, medium, high, critical)
   * - userId: Filter by user ID
   * - limit: Maximum number of alerts to return
   */
  router.get('/alerts', authenticateUser, async (req, res) => {
    try {
      // Extract query parameters
      const status = req.query.status as string | undefined;
      const severity = req.query.severity as FraudAlertSeverity | undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      
      // Get fraud alerts
      const alerts = await getFraudAlerts({
        status,
        severity,
        userId,
        limit
      });
      
      // Enhance alerts with additional information for the frontend
      const enhancedAlerts = await Promise.all(alerts.map(async (alert) => {
        let itemTitle = 'Unknown Item';
        let sellerName = 'Unknown User';
        let sellerAvatar = undefined;
        let buyerName = undefined;
        
        // Get item details if applicable
        if (alert.activityData?.itemId) {
          try {
            const item = await storage.getMarketplaceItem(alert.activityData.itemId);
            if (item) {
              itemTitle = item.title;
              
              // Get seller info
              if (item.seller_id) {
                const seller = await storage.getUser(item.seller_id);
                if (seller) {
                  sellerName = seller.name;
                  sellerAvatar = seller.profileImage || undefined;
                }
              }
            }
          } catch (error) {
            log(`Error fetching item details for alert: ${error}`, 'marketplace-fraud');
          }
        }
        
        // Get buyer info if applicable
        if (alert.activityData?.buyerId) {
          try {
            const buyer = await storage.getUser(alert.activityData.buyerId);
            if (buyer) {
              buyerName = buyer.name;
            }
          } catch (error) {
            log(`Error fetching buyer details for alert: ${error}`, 'marketplace-fraud');
          }
        }
        
        // Format the alert for the frontend
        return {
          id: alert.id,
          itemId: alert.activityData?.itemId || 0,
          itemTitle,
          sellerId: alert.activityData?.sellerId || alert.userId || 0,
          sellerName,
          sellerAvatar,
          buyerId: alert.activityData?.buyerId,
          buyerName,
          activityType: alert.activityType,
          activityTimestamp: alert.activityData?.timestamp || alert.timestamp.toISOString(),
          detectedTimestamp: alert.timestamp.toISOString(),
          severity: alert.severity,
          status: alert.status,
          aiConfidence: alert.activityData?.confidenceScore || 0.75,
          description: alert.details,
          reasons: alert.activityData?.reasonCodes || [],
          relatedAlerts: alert.activityData?.relatedAlertIds
        };
      }));
      
      return res.json(enhancedAlerts);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Error fetching fraud alerts: ${errorMessage}`, 'marketplace-fraud');
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch fraud alerts',
        error: errorMessage
      });
    }
  });
  
  /**
   * Get fraud detection statistics
   */
  router.get('/stats', authenticateUser, async (req, res) => {
    try {
      // Get all alerts for statistics calculation
      const allAlerts = await getFraudAlerts();
      
      // Calculate statistics based on available alerts
      
      // Calculate severity distribution
      const severityDistribution = {
        low: allAlerts.filter(a => a.severity === 'low').length,
        medium: allAlerts.filter(a => a.severity === 'medium').length,
        high: allAlerts.filter(a => a.severity === 'high').length,
        critical: allAlerts.filter(a => a.severity === 'critical').length
      };
      
      // Calculate AI performance metrics
      const confirmedAndDismissedAlerts = allAlerts.filter(a => 
        a.status === 'confirmed' || a.status === 'dismissed'
      );
      
      const truePositives = confirmedAndDismissedAlerts.filter(a => 
        a.status === 'confirmed'
      ).length;
      
      const falsePositives = confirmedAndDismissedAlerts.filter(a => 
        a.status === 'dismissed'
      ).length;
      
      const accuracy = confirmedAndDismissedAlerts.length > 0 
        ? truePositives / confirmedAndDismissedAlerts.length
        : 0;
      
      // Calculate top fraud categories
      const categoryCounts: Record<string, number> = {};
      allAlerts.forEach(alert => {
        const category = alert.activityType;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
      
      const topFraudCategories = Object.entries(categoryCounts)
        .map(([category, count]) => ({
          category,
          count,
          percentage: allAlerts.length > 0 ? count / allAlerts.length : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Generate weekly trend data (last 7 days)
      const weeklyTrend = [];
      const now = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const alertsOnDay = allAlerts.filter(alert => {
          const alertDate = new Date(alert.timestamp);
          return alertDate >= date && alertDate < nextDay;
        });
        
        weeklyTrend.push({
          date: date.toISOString().split('T')[0],
          count: alertsOnDay.length
        });
      }
      
      // Calculate status counts directly in the stats object below
      
      // Compile and return statistics
      const stats = {
        totalAlerts: allAlerts.length,
        newAlerts: allAlerts.filter(a => a.status === 'new').length,
        confirmedAlerts: allAlerts.filter(a => a.status === 'confirmed').length,
        dismissedAlerts: allAlerts.filter(a => a.status === 'dismissed').length,
        reviewingAlerts: allAlerts.filter(a => a.status === 'reviewing').length,
        severityDistribution,
        topFraudCategories,
        aiPerformance: {
          truePositives,
          falsePositives,
          accuracy
        },
        weeklyTrend
      };
      
      return res.json(stats);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Error fetching fraud statistics: ${errorMessage}`, 'marketplace-fraud');
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch fraud statistics',
        error: errorMessage
      });
    }
  });
  
  /**
   * Review and update a fraud alert
   * Actions: resolve or dismiss
   */
  router.post('/alerts/:id/review', authenticateUser, async (req, res) => {
    try {
      const alertId = parseInt(req.params.id, 10);
      const { action, note } = req.body;
      
      if (!alertId || isNaN(alertId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid alert ID'
        });
      }
      
      if (!action || !['resolve', 'dismiss'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Must be "resolve" or "dismiss"'
        });
      }
      
      // Map action to status
      const status = action === 'resolve' ? 'confirmed' : 'dismissed';
      
      // Update the alert status
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: User not authenticated'
        });
      }
      
      const updatedAlert = await updateFraudAlertStatus(
        alertId,
        status,
        user.id,
        note || undefined
      );
      
      if (!updatedAlert) {
        return res.status(404).json({
          success: false,
          message: 'Alert not found'
        });
      }
      
      return res.json({
        success: true,
        message: `Alert ${status} successfully`,
        alert: updatedAlert
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Error reviewing fraud alert: ${errorMessage}`, 'marketplace-fraud');
      return res.status(500).json({
        success: false,
        message: 'Failed to process fraud alert review',
        error: errorMessage
      });
    }
  });

  return router;
}