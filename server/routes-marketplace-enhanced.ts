/**
 * Enhanced marketplace routes for improved search, fraud detection, and reviews
 */
import express, { Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateUser } from './middleware/auth';
import { IStorage } from './storage';
import { log } from './vite';

// Define enhanced user type
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    isAdmin: boolean;
    userType: string;
  };
}

const router = express.Router();

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads', 'marketplace');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per image
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

export default function configureMarketplaceEnhancedRoutes(storage: IStorage) {
  // Enhanced search endpoint with typeahead functionality
  router.get('/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.length < 2) {
        return res.json({ results: [] });
      }
      
      // Check if the storage has the required method
      if (!storage.searchMarketplaceItems) {
        log('Error: searchMarketplaceItems method not found in storage', 'marketplace');
        return res.status(500).json({
          success: false,
          message: 'Storage interface missing required marketplace search methods',
        });
      }
      
      const results = await storage.searchMarketplaceItems(query);
      
      return res.json({ results });
    } catch (error) {
      log(`Error in marketplace search: ${error.message}`, 'marketplace');
      return res.status(500).json({
        success: false,
        message: 'Failed to search marketplace items',
        error: error.message,
      });
    }
  });

  // Fraud detection routes
  
  // Get fraud alerts with filtering
  router.get('/fraud/alerts', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const status = req.query.status as string || 'new';
      
      // Check if user has admin permissions
      const user = req.user;
      if (!user || !user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Only admins can access fraud alerts',
        });
      }
      
      // Check if the storage has the required method
      if (!storage.getMarketplaceFraudAlerts) {
        log('Error: getMarketplaceFraudAlerts method not found in storage', 'marketplace-fraud');
        return res.status(500).json({
          success: false,
          message: 'Storage interface missing required marketplace fraud methods',
        });
      }
      
      const alerts = await storage.getMarketplaceFraudAlerts(status);
      
      return res.json(alerts);
    } catch (error) {
      log(`Error fetching fraud alerts: ${error.message}`, 'marketplace-fraud');
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch fraud alerts',
        error: error.message,
      });
    }
  });
  
  // Get fraud statistics
  router.get('/fraud/stats', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      // Check if user has admin permissions
      const user = req.user;
      if (!user || !user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Only admins can access fraud statistics',
        });
      }
      
      // Check if the storage has the required method
      if (!storage.getMarketplaceFraudStats) {
        log('Error: getMarketplaceFraudStats method not found in storage', 'marketplace-fraud');
        return res.status(500).json({
          success: false,
          message: 'Storage interface missing required marketplace fraud methods',
        });
      }
      
      const stats = await storage.getMarketplaceFraudStats();
      
      return res.json(stats);
    } catch (error) {
      log(`Error fetching fraud stats: ${error.message}`, 'marketplace-fraud');
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch fraud statistics',
        error: error.message,
      });
    }
  });
  
  // Process a fraud alert (resolve or dismiss)
  router.post('/fraud/alerts/:id/review', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const alertId = parseInt(req.params.id, 10);
      const { action, note } = req.body;
      
      if (!alertId || isNaN(alertId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid alert ID',
        });
      }
      
      if (!action || !['resolve', 'dismiss'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Must be "resolve" or "dismiss"',
        });
      }
      
      // Check if user has admin permissions
      const user = req.user;
      if (!user || !user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Only admins can process fraud alerts',
        });
      }
      
      // Check if the storage has the required method
      if (!storage.processMarketplaceFraudAlert) {
        log('Error: processMarketplaceFraudAlert method not found in storage', 'marketplace-fraud');
        return res.status(500).json({
          success: false,
          message: 'Storage interface missing required marketplace fraud methods',
        });
      }
      
      const result = await storage.processMarketplaceFraudAlert(alertId, action, user.id, note);
      
      return res.json({
        success: true,
        message: `Alert ${alertId} has been ${action === 'resolve' ? 'resolved' : 'dismissed'}`,
        result,
      });
    } catch (error) {
      log(`Error processing fraud alert: ${error.message}`, 'marketplace-fraud');
      return res.status(500).json({
        success: false,
        message: 'Failed to process fraud alert',
        error: error.message,
      });
    }
  });
  
  // Review and rating routes
  
  // Get reviews for an item or user
  router.get('/reviews/:targetType/:targetId', async (req, res) => {
    try {
      const targetType = req.params.targetType as 'item' | 'user';
      const targetId = parseInt(req.params.targetId, 10);
      const sort = req.query.sort as string || 'recent';
      const rating = req.query.rating ? parseInt(req.query.rating as string, 10) : null;
      
      if (!targetId || isNaN(targetId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target ID',
        });
      }
      
      if (!['item', 'user'].includes(targetType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target type. Must be "item" or "user"',
        });
      }
      
      // Check if the storage has the required method
      if (!storage.getMarketplaceReviews) {
        log('Error: getMarketplaceReviews method not found in storage', 'marketplace-reviews');
        return res.status(500).json({
          success: false,
          message: 'Storage interface missing required marketplace review methods',
        });
      }
      
      const reviews = await storage.getMarketplaceReviews(targetType, targetId, sort, rating);
      
      return res.json(reviews);
    } catch (error) {
      log(`Error fetching reviews: ${error.message}`, 'marketplace-reviews');
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch reviews',
        error: error.message,
      });
    }
  });
  
  // Create a new review
  router.post('/reviews', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const { targetId, targetType, rating, title, content } = req.body;
      
      if (!targetId || !targetType || !rating || !content) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
      }
      
      if (!['item', 'user'].includes(targetType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target type. Must be "item" or "user"',
        });
      }
      
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Invalid rating. Must be between 1 and 5',
        });
      }
      
      // Check if the storage has the required method
      if (!storage.createMarketplaceReview) {
        log('Error: createMarketplaceReview method not found in storage', 'marketplace-reviews');
        return res.status(500).json({
          success: false,
          message: 'Storage interface missing required marketplace review methods',
        });
      }
      
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: User not authenticated',
        });
      }
      
      const review = await storage.createMarketplaceReview({
        targetId,
        targetType: targetType as 'item' | 'user',
        reviewerId: user.id,
        rating,
        title,
        content,
      });
      
      return res.json({
        success: true,
        message: 'Review created successfully',
        id: review.id,
      });
    } catch (error) {
      log(`Error creating review: ${error.message}`, 'marketplace-reviews');
      return res.status(500).json({
        success: false,
        message: 'Failed to create review',
        error: error.message,
      });
    }
  });
  
  // Upload images for a review
  router.post('/reviews/images', authenticateUser, upload.array('images', 5), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const reviewId = req.body.reviewId;
      
      if (!reviewId) {
        return res.status(400).json({
          success: false,
          message: 'Missing review ID',
        });
      }
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No images uploaded',
        });
      }
      
      // Check if the storage has the required method
      if (!storage.addImagesToMarketplaceReview) {
        log('Error: addImagesToMarketplaceReview method not found in storage', 'marketplace-reviews');
        return res.status(500).json({
          success: false,
          message: 'Storage interface missing required marketplace review methods',
        });
      }
      
      // Extract paths for storage
      const imagePaths = files.map(file => `/uploads/marketplace/${file.filename}`);
      
      // Store image paths in database
      await storage.addImagesToMarketplaceReview(parseInt(reviewId, 10), imagePaths);
      
      return res.json({
        success: true,
        message: 'Images uploaded successfully',
        images: imagePaths,
      });
    } catch (error) {
      log(`Error uploading review images: ${error.message}`, 'marketplace-reviews');
      return res.status(500).json({
        success: false,
        message: 'Failed to upload images',
        error: error.message,
      });
    }
  });
  
  // React to a review (helpful/unhelpful)
  router.post('/reviews/:id/reaction', authenticateUser, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id, 10);
      const { type, value } = req.body;
      
      if (!reviewId || isNaN(reviewId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid review ID',
        });
      }
      
      if (!type || !['helpful', 'unhelpful'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reaction type. Must be "helpful" or "unhelpful"',
        });
      }
      
      // Check if the storage has the required method
      if (!storage.reactToMarketplaceReview) {
        log('Error: reactToMarketplaceReview method not found in storage', 'marketplace-reviews');
        return res.status(500).json({
          success: false,
          message: 'Storage interface missing required marketplace review methods',
        });
      }
      
      const user = req.user;
      const result = await storage.reactToMarketplaceReview(reviewId, user.id, type, !!value);
      
      return res.json({
        success: true,
        message: `Reaction ${value ? 'added' : 'removed'} successfully`,
        result,
      });
    } catch (error) {
      log(`Error reacting to review: ${error.message}`, 'marketplace-reviews');
      return res.status(500).json({
        success: false,
        message: 'Failed to react to review',
        error: error.message,
      });
    }
  });
  
  // Report a review
  router.post('/reviews/:id/report', authenticateUser, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id, 10);
      const { reason } = req.body;
      
      if (!reviewId || isNaN(reviewId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid review ID',
        });
      }
      
      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Report reason is required',
        });
      }
      
      // Check if the storage has the required method
      if (!storage.reportMarketplaceReview) {
        log('Error: reportMarketplaceReview method not found in storage', 'marketplace-reviews');
        return res.status(500).json({
          success: false,
          message: 'Storage interface missing required marketplace review methods',
        });
      }
      
      const user = req.user;
      const result = await storage.reportMarketplaceReview(reviewId, user.id, reason);
      
      return res.json({
        success: true,
        message: 'Review reported successfully',
        result,
      });
    } catch (error) {
      log(`Error reporting review: ${error.message}`, 'marketplace-reviews');
      return res.status(500).json({
        success: false,
        message: 'Failed to report review',
        error: error.message,
      });
    }
  });

  return router;
}