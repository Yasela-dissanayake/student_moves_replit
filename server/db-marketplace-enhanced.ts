/**
 * Enhanced marketplace database operations
 */
import { db } from './db';
import { eq, and, or, like, ilike, desc, asc, sql, gt, lt, gte, lte, isNull } from 'drizzle-orm';
import { log } from './vite';
import { 
  marketplaceItems,
  marketplaceUsers,
  marketplaceReviews,
  marketplaceReviewReactions,
  marketplaceReviewReports,
  marketplaceFraudAlerts,
  marketplaceSearchHistory
} from '@shared/marketplace-schema';

/**
 * Database operations for enhanced marketplace features
 */
export async function searchMarketplaceItems(query: string) {
  try {
    // Search items
    const items = await db.select({
      id: marketplaceItems.id,
      title: marketplaceItems.title,
      price: marketplaceItems.price,
      category: marketplaceItems.category,
      image: sql<string>`${marketplaceItems.images}->0`,
      location: marketplaceItems.location
    })
    .from(marketplaceItems)
    .where(
      and(
        or(
          ilike(marketplaceItems.title, `%${query}%`),
          ilike(marketplaceItems.description, `%${query}%`),
          sql`${marketplaceItems.tags}::text ILIKE ${'%' + query + '%'}`
        ),
        eq(marketplaceItems.status, 'available')
      )
    )
    .limit(10);
    
    // Convert items to search result format
    const itemResults = items.map(item => ({
      id: item.id,
      title: item.title,
      type: 'item' as const,
      price: item.price?.toString(),
      image: item.image,
      category: item.category,
      location: item.location
    }));
    
    // Search categories that match the query
    const categories = await db.select({
      id: sql<number>`row_number() over ()`,
      title: sql<string>`DISTINCT ${marketplaceItems.category}`
    })
    .from(marketplaceItems)
    .where(ilike(marketplaceItems.category, `%${query}%`))
    .limit(5);
    
    // Convert categories to search result format
    const categoryResults = categories.map(category => ({
      id: category.id,
      title: category.title,
      type: 'category' as const
    }));
    
    // Search tags that match the query
    const matchingTags = await db.execute(sql`
      WITH extracted_tags AS (
        SELECT id, jsonb_array_elements_text(tags) as tag
        FROM marketplace_items
      )
      SELECT DISTINCT tag, row_number() over () as id
      FROM extracted_tags
      WHERE tag ILIKE ${'%' + query + '%'}
      LIMIT 5
    `);
    
    // Convert tags to search result format
    const tagResults = Array.isArray(matchingTags) ? 
      matchingTags.map(row => ({
        id: row.id,
        title: row.tag,
        type: 'tag' as const
      })) : [];
    
    // Save search query for trending analytics
    await db.insert(marketplaceSearchHistory).values({
      query,
      createdAt: new Date()
    }).onConflictDoUpdate({
      target: marketplaceSearchHistory.query,
      set: {
        count: sql`${marketplaceSearchHistory.count} + 1`,
        updatedAt: new Date()
      }
    });
    
    // Combine all results
    return [...itemResults, ...categoryResults, ...tagResults];
  } catch (error) {
    log(`Error searching marketplace items: ${error.message}`, 'marketplace-search');
    return [];
  }
}

/**
 * Get fraud alerts by status
 */
export async function getMarketplaceFraudAlerts(status: string = 'new') {
  try {
    const alerts = await db.select().from(marketplaceFraudAlerts)
      .where(eq(marketplaceFraudAlerts.status, status))
      .orderBy(
        status === 'new' 
          ? desc(marketplaceFraudAlerts.severity) 
          : desc(marketplaceFraudAlerts.detectedTimestamp)
      );
    
    // Enhance alerts with item and user details
    const enhancedAlerts = await Promise.all(alerts.map(async (alert) => {
      // Get item details
      const item = await db.select({
        title: marketplaceItems.title
      })
      .from(marketplaceItems)
      .where(eq(marketplaceItems.id, alert.itemId))
      .limit(1);
      
      // Get seller details
      const seller = await db.select({
        name: marketplaceUsers.name,
        avatar: marketplaceUsers.avatar
      })
      .from(marketplaceUsers)
      .where(eq(marketplaceUsers.id, alert.sellerId))
      .limit(1);
      
      // Get buyer details if applicable
      let buyer = null;
      if (alert.buyerId) {
        buyer = await db.select({
          name: marketplaceUsers.name
        })
        .from(marketplaceUsers)
        .where(eq(marketplaceUsers.id, alert.buyerId))
        .limit(1);
      }
      
      return {
        ...alert,
        itemTitle: item[0]?.title || 'Unknown Item',
        sellerName: seller[0]?.name || 'Unknown Seller',
        sellerAvatar: seller[0]?.avatar,
        buyerName: buyer ? buyer[0]?.name : undefined
      };
    }));
    
    return enhancedAlerts;
  } catch (error) {
    log(`Error getting marketplace fraud alerts: ${error.message}`, 'marketplace-fraud');
    return [];
  }
}

/**
 * Get marketplace fraud statistics
 */
export async function getMarketplaceFraudStats() {
  try {
    // Get total alerts
    const totalAlertsResult = await db.select({
      count: sql<number>`count(*)`
    })
    .from(marketplaceFraudAlerts);
    
    // Get new alerts
    const newAlertsResult = await db.select({
      count: sql<number>`count(*)`
    })
    .from(marketplaceFraudAlerts)
    .where(eq(marketplaceFraudAlerts.status, 'new'));
    
    // Get resolved alerts
    const resolvedAlertsResult = await db.select({
      count: sql<number>`count(*)`
    })
    .from(marketplaceFraudAlerts)
    .where(eq(marketplaceFraudAlerts.status, 'resolved'));
    
    // Get dismissed alerts
    const dismissedAlertsResult = await db.select({
      count: sql<number>`count(*)`
    })
    .from(marketplaceFraudAlerts)
    .where(eq(marketplaceFraudAlerts.status, 'dismissed'));
    
    // Get severity distribution
    const severityDistributionResult = await db.execute(sql`
      SELECT 
        severity,
        count(*) as count
      FROM marketplace_fraud_alerts
      GROUP BY severity
    `);
    
    // Get top fraud categories
    const topFraudCategoriesResult = await db.execute(sql`
      SELECT 
        activity_type as category,
        count(*) as count,
        (count(*) * 100.0 / (SELECT count(*) FROM marketplace_fraud_alerts)) as percentage
      FROM marketplace_fraud_alerts
      GROUP BY activity_type
      ORDER BY count DESC
      LIMIT 5
    `);
    
    // Get AI performance metrics
    const aiPerformanceResult = await db.execute(sql`
      SELECT
        sum(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as true_positives,
        sum(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) as false_positives
      FROM marketplace_fraud_alerts
      WHERE status IN ('resolved', 'dismissed')
    `);
    
    // Calculate accuracy
    const truePositives = aiPerformanceResult[0]?.true_positives || 0;
    const falsePositives = aiPerformanceResult[0]?.false_positives || 0;
    const accuracy = (truePositives + falsePositives) > 0 
      ? truePositives / (truePositives + falsePositives)
      : 0;
    
    // Get weekly trend
    const weeklyTrendResult = await db.execute(sql`
      WITH dates AS (
        SELECT generate_series(
          date_trunc('day', now()) - interval '6 days',
          date_trunc('day', now()),
          interval '1 day'
        ) as date
      )
      SELECT 
        to_char(dates.date, 'YYYY-MM-DD') as date,
        coalesce(count(alerts.id), 0) as count
      FROM dates
      LEFT JOIN marketplace_fraud_alerts alerts 
        ON date_trunc('day', alerts.detected_timestamp) = dates.date
      GROUP BY dates.date
      ORDER BY dates.date
    `);
    
    return {
      totalAlerts: totalAlertsResult[0]?.count || 0,
      newAlerts: newAlertsResult[0]?.count || 0,
      resolvedAlerts: resolvedAlertsResult[0]?.count || 0,
      dismissedAlerts: dismissedAlertsResult[0]?.count || 0,
      severityDistribution: {
        low: severityDistributionResult.find(r => r.severity === 'low')?.count || 0,
        medium: severityDistributionResult.find(r => r.severity === 'medium')?.count || 0,
        high: severityDistributionResult.find(r => r.severity === 'high')?.count || 0,
        critical: severityDistributionResult.find(r => r.severity === 'critical')?.count || 0,
      },
      topFraudCategories: topFraudCategoriesResult.map(row => ({
        category: row.category,
        count: row.count,
        percentage: row.percentage
      })),
      aiPerformance: {
        truePositives,
        falsePositives,
        accuracy
      },
      weeklyTrend: weeklyTrendResult.map(row => ({
        date: row.date,
        count: row.count
      }))
    };
  } catch (error) {
    log(`Error getting marketplace fraud stats: ${error.message}`, 'marketplace-fraud');
    return {
      totalAlerts: 0,
      newAlerts: 0,
      resolvedAlerts: 0,
      dismissedAlerts: 0,
      severityDistribution: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      topFraudCategories: [],
      aiPerformance: {
        truePositives: 0,
        falsePositives: 0,
        accuracy: 0
      },
      weeklyTrend: []
    };
  }
}

/**
 * Process a marketplace fraud alert (resolve or dismiss)
 */
export async function processMarketplaceFraudAlert(
  alertId: number,
  action: 'resolve' | 'dismiss',
  reviewerId: number,
  note?: string
) {
  try {
    // Update alert status
    const result = await db.update(marketplaceFraudAlerts)
      .set({
        status: action === 'resolve' ? 'resolved' : 'dismissed',
        reviewerId,
        reviewedAt: new Date(),
        reviewNotes: note
      })
      .where(eq(marketplaceFraudAlerts.id, alertId))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Alert ${alertId} not found`);
    }
    
    // If resolved, update item status
    if (action === 'resolve') {
      await db.update(marketplaceItems)
        .set({
          status: 'removed',
          removedReason: 'fraud_detected',
          removedAt: new Date(),
          removedBy: reviewerId
        })
        .where(eq(marketplaceItems.id, result[0].itemId));
    }
    
    return result[0];
  } catch (error) {
    log(`Error processing marketplace fraud alert: ${error.message}`, 'marketplace-fraud');
    throw error;
  }
}

/**
 * Get reviews for an item or user
 */
export async function getMarketplaceReviews(
  targetType: 'item' | 'user',
  targetId: number,
  sort: string = 'recent',
  ratingFilter: number | null = null
) {
  try {
    // Build query conditions
    const conditions = [
      eq(marketplaceReviews.targetType, targetType),
      eq(marketplaceReviews.targetId, targetId)
    ];
    
    if (ratingFilter !== null) {
      conditions.push(eq(marketplaceReviews.rating, ratingFilter));
    }
    
    // Determine sort order
    let orderBy;
    switch (sort) {
      case 'helpful':
        orderBy = desc(marketplaceReviews.helpful);
        break;
      case 'rating_high':
        orderBy = desc(marketplaceReviews.rating);
        break;
      case 'rating_low':
        orderBy = asc(marketplaceReviews.rating);
        break;
      case 'recent':
      default:
        orderBy = desc(marketplaceReviews.createdAt);
    }
    
    // Get reviews
    const reviews = await db.select().from(marketplaceReviews)
      .where(and(...conditions))
      .orderBy(orderBy);
    
    // Get reviewer details and enhance reviews
    const enhancedReviews = await Promise.all(reviews.map(async (review) => {
      // Get reviewer details
      const reviewer = await db.select({
        name: marketplaceUsers.name,
        avatar: marketplaceUsers.avatar,
        verified: marketplaceUsers.verified
      })
      .from(marketplaceUsers)
      .where(eq(marketplaceUsers.id, review.reviewerId))
      .limit(1);
      
      return {
        ...review,
        reviewerName: reviewer[0]?.name || 'Anonymous',
        reviewerAvatar: reviewer[0]?.avatar,
        reviewerVerified: reviewer[0]?.verified || false,
        reactions: {} // Will be populated later if user is authenticated
      };
    }));
    
    // Get average rating
    const averageRatingResult = await db.select({
      avg: sql<number>`avg(rating)`,
      count: sql<number>`count(*)`
    })
    .from(marketplaceReviews)
    .where(
      and(
        eq(marketplaceReviews.targetType, targetType),
        eq(marketplaceReviews.targetId, targetId)
      )
    );
    
    // Get rating distribution
    const ratingDistributionResult = await db.execute(sql`
      SELECT
        rating,
        count(*) as count
      FROM marketplace_reviews
      WHERE target_type = ${targetType} AND target_id = ${targetId}
      GROUP BY rating
    `);
    
    // Format the rating distribution
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };
    
    ratingDistributionResult.forEach(row => {
      ratingDistribution[row.rating] = row.count;
    });
    
    return {
      reviews: enhancedReviews,
      averageRating: averageRatingResult[0]?.avg || 0,
      totalReviews: averageRatingResult[0]?.count || 0,
      ratingDistribution
    };
  } catch (error) {
    log(`Error getting marketplace reviews: ${error.message}`, 'marketplace-reviews');
    return {
      reviews: [],
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      }
    };
  }
}

/**
 * Get reviews for an item or user with user reactions
 */
export async function getMarketplaceReviewsWithUserReactions(
  targetType: 'item' | 'user',
  targetId: number,
  userId: number,
  sort: string = 'recent',
  ratingFilter: number | null = null
) {
  try {
    const reviewsData = await getMarketplaceReviews(targetType, targetId, sort, ratingFilter);
    
    // Get user reactions for these reviews
    if (userId) {
      const reviewIds = reviewsData.reviews.map(review => review.id);
      
      if (reviewIds.length > 0) {
        const reactions = await db.select().from(marketplaceReviewReactions)
          .where(
            and(
              eq(marketplaceReviewReactions.userId, userId),
              sql`${marketplaceReviewReactions.reviewId} = ANY(${reviewIds})`
            )
          );
        
        // Add reactions to reviews
        reviewsData.reviews.forEach(review => {
          const userReactions = reactions.filter(r => r.reviewId === review.id);
          
          review.reactions = {
            helpful: userReactions.some(r => r.type === 'helpful' && r.value),
            unhelpful: userReactions.some(r => r.type === 'unhelpful' && r.value),
            reported: userReactions.some(r => r.type === 'report')
          };
        });
      }
    }
    
    return reviewsData;
  } catch (error) {
    log(`Error getting marketplace reviews with reactions: ${error.message}`, 'marketplace-reviews');
    return {
      reviews: [],
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      }
    };
  }
}

/**
 * Create a marketplace review
 */
export async function createMarketplaceReview(reviewData: {
  targetId: number;
  targetType: 'item' | 'user';
  reviewerId: number;
  rating: number;
  title?: string;
  content: string;
}) {
  try {
    // Check if user has already reviewed this target
    const existingReview = await db.select({ id: marketplaceReviews.id })
      .from(marketplaceReviews)
      .where(
        and(
          eq(marketplaceReviews.targetType, reviewData.targetType),
          eq(marketplaceReviews.targetId, reviewData.targetId),
          eq(marketplaceReviews.reviewerId, reviewData.reviewerId)
        )
      )
      .limit(1);
    
    if (existingReview.length > 0) {
      throw new Error('You have already reviewed this item');
    }
    
    // For item reviews, check if user has purchased the item for verified purchase status
    let verifiedPurchase = false;
    if (reviewData.targetType === 'item') {
      // This would check a purchases or transactions table
      // For now, we'll assume it's false
      verifiedPurchase = false;
    }
    
    // Create the review
    const result = await db.insert(marketplaceReviews).values({
      targetId: reviewData.targetId,
      targetType: reviewData.targetType,
      reviewerId: reviewData.reviewerId,
      rating: reviewData.rating,
      title: reviewData.title || null,
      content: reviewData.content,
      verifiedPurchase,
      createdAt: new Date()
    }).returning();
    
    // Update target's average rating
    await updateTargetAverageRating(reviewData.targetType, reviewData.targetId);
    
    return result[0];
  } catch (error) {
    log(`Error creating marketplace review: ${error.message}`, 'marketplace-reviews');
    throw error;
  }
}

/**
 * Add images to a marketplace review
 */
export async function addImagesToMarketplaceReview(reviewId: number, imagePaths: string[]) {
  try {
    const result = await db.update(marketplaceReviews)
      .set({
        images: sql`${marketplaceReviews.images} || ${JSON.stringify(imagePaths)}::jsonb`,
        updatedAt: new Date()
      })
      .where(eq(marketplaceReviews.id, reviewId))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Review ${reviewId} not found`);
    }
    
    return result[0];
  } catch (error) {
    log(`Error adding images to marketplace review: ${error.message}`, 'marketplace-reviews');
    throw error;
  }
}

/**
 * React to a marketplace review
 */
export async function reactToMarketplaceReview(
  reviewId: number,
  userId: number,
  type: 'helpful' | 'unhelpful',
  value: boolean
) {
  try {
    // Check if reaction already exists
    const existingReaction = await db.select({ id: marketplaceReviewReactions.id })
      .from(marketplaceReviewReactions)
      .where(
        and(
          eq(marketplaceReviewReactions.reviewId, reviewId),
          eq(marketplaceReviewReactions.userId, userId),
          eq(marketplaceReviewReactions.type, type)
        )
      )
      .limit(1);
    
    if (existingReaction.length > 0) {
      // Update existing reaction
      await db.update(marketplaceReviewReactions)
        .set({
          value,
          updatedAt: new Date()
        })
        .where(eq(marketplaceReviewReactions.id, existingReaction[0].id));
    } else if (value) {
      // Only create if value is true
      await db.insert(marketplaceReviewReactions).values({
        reviewId,
        userId,
        type,
        value,
        createdAt: new Date()
      });
      
      // If adding a helpful/unhelpful reaction, remove the opposite reaction if it exists
      const oppositeType = type === 'helpful' ? 'unhelpful' : 'helpful';
      await db.delete(marketplaceReviewReactions)
        .where(
          and(
            eq(marketplaceReviewReactions.reviewId, reviewId),
            eq(marketplaceReviewReactions.userId, userId),
            eq(marketplaceReviewReactions.type, oppositeType)
          )
        );
    }
    
    // Update review's helpful/unhelpful counts
    await updateReviewReactionCounts(reviewId);
    
    // Get updated review
    const updatedReview = await db.select().from(marketplaceReviews)
      .where(eq(marketplaceReviews.id, reviewId))
      .limit(1);
    
    if (updatedReview.length === 0) {
      throw new Error(`Review ${reviewId} not found`);
    }
    
    return updatedReview[0];
  } catch (error) {
    log(`Error reacting to marketplace review: ${error.message}`, 'marketplace-reviews');
    throw error;
  }
}

/**
 * Report a marketplace review
 */
export async function reportMarketplaceReview(
  reviewId: number,
  reporterId: number,
  reason: string
) {
  try {
    // Check if user has already reported this review
    const existingReport = await db.select({ id: marketplaceReviewReports.id })
      .from(marketplaceReviewReports)
      .where(
        and(
          eq(marketplaceReviewReports.reviewId, reviewId),
          eq(marketplaceReviewReports.reporterId, reporterId)
        )
      )
      .limit(1);
    
    if (existingReport.length > 0) {
      throw new Error('You have already reported this review');
    }
    
    // Create the report
    const result = await db.insert(marketplaceReviewReports).values({
      reviewId,
      reporterId,
      reason,
      status: 'pending',
      createdAt: new Date()
    }).returning();
    
    // Also add a reaction record of type 'report'
    await db.insert(marketplaceReviewReactions).values({
      reviewId,
      userId: reporterId,
      type: 'report',
      value: true,
      createdAt: new Date()
    }).onConflictDoNothing({
      target: [
        marketplaceReviewReactions.reviewId,
        marketplaceReviewReactions.userId,
        marketplaceReviewReactions.type
      ]
    });
    
    return result[0];
  } catch (error) {
    log(`Error reporting marketplace review: ${error.message}`, 'marketplace-reviews');
    throw error;
  }
}

/**
 * Helper function to update a target's average rating
 */
async function updateTargetAverageRating(targetType: 'item' | 'user', targetId: number) {
  try {
    // Calculate average rating
    const avgRatingResult = await db.select({
      avg: sql<number>`avg(rating)`,
      count: sql<number>`count(*)`
    })
    .from(marketplaceReviews)
    .where(
      and(
        eq(marketplaceReviews.targetType, targetType),
        eq(marketplaceReviews.targetId, targetId)
      )
    );
    
    const avgRating = avgRatingResult[0]?.avg || 0;
    const ratingCount = avgRatingResult[0]?.count || 0;
    
    // Update target's rating based on type
    if (targetType === 'item') {
      await db.update(marketplaceItems)
        .set({
          averageRating: avgRating,
          ratingCount
        })
        .where(eq(marketplaceItems.id, targetId));
    } else if (targetType === 'user') {
      await db.update(marketplaceUsers)
        .set({
          averageRating: avgRating,
          ratingCount
        })
        .where(eq(marketplaceUsers.id, targetId));
    }
  } catch (error) {
    log(`Error updating target average rating: ${error.message}`, 'marketplace-reviews');
  }
}

/**
 * Helper function to update a review's reaction counts
 */
async function updateReviewReactionCounts(reviewId: number) {
  try {
    // Count helpful reactions
    const helpfulCountResult = await db.select({
      count: sql<number>`count(*)`
    })
    .from(marketplaceReviewReactions)
    .where(
      and(
        eq(marketplaceReviewReactions.reviewId, reviewId),
        eq(marketplaceReviewReactions.type, 'helpful'),
        eq(marketplaceReviewReactions.value, true)
      )
    );
    
    // Count unhelpful reactions
    const unhelpfulCountResult = await db.select({
      count: sql<number>`count(*)`
    })
    .from(marketplaceReviewReactions)
    .where(
      and(
        eq(marketplaceReviewReactions.reviewId, reviewId),
        eq(marketplaceReviewReactions.type, 'unhelpful'),
        eq(marketplaceReviewReactions.value, true)
      )
    );
    
    // Update review
    await db.update(marketplaceReviews)
      .set({
        helpful: helpfulCountResult[0]?.count || 0,
        unhelpful: unhelpfulCountResult[0]?.count || 0
      })
      .where(eq(marketplaceReviews.id, reviewId));
  } catch (error) {
    log(`Error updating review reaction counts: ${error.message}`, 'marketplace-reviews');
  }
}