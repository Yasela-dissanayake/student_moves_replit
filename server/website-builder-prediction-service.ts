/**
 * Website Builder Prediction Service
 * Provides predictive smart suggestions based on user behavior
 */
import { db } from './db';
import { 
  websiteBuilderUserBehavior, 
  websiteBuilderUserPreferences, 
  WebsiteBuilderUserBehavior,
  WebsiteBuilderUserPreferences,
  InsertWebsiteBuilderUserBehavior,
  InsertWebsiteBuilderUserPreferences
} from '../shared/schema';
import { eq, desc, and, sql, inArray, like, or } from 'drizzle-orm';
import { createSecurityContext } from './utils/security-utils';
import { logSecurity, info } from './logging';
import { RequestHandler } from 'express';

// Interface for tracking user actions
export interface TrackActionParams {
  userId: number;
  action: 'view' | 'implement' | 'search' | 'favorite';
  itemType: 'template' | 'file' | 'category';
  itemId: string;
  itemDetails?: Record<string, any>;
}

// Interface for template suggestion options
export interface SuggestionOptions {
  userId: number;
  limit?: number;
  includeComplexityLevel?: boolean;
  includeCategories?: boolean;
  includeTags?: boolean;
}

// Interface for suggestion results
export interface TemplateSuggestion {
  templateId: string;
  score: number;
  reason: string;
}

/**
 * Track a user action in the website builder
 */
export async function trackUserAction(params: TrackActionParams): Promise<boolean> {
  try {
    const insertData: InsertWebsiteBuilderUserBehavior = {
      userId: params.userId,
      action: params.action,
      itemType: params.itemType,
      itemId: params.itemId,
      itemDetails: params.itemDetails || {},
    };

    await db.insert(websiteBuilderUserBehavior).values(insertData);
    return true;
  } catch (error) {
    console.error('Error tracking user action:', error);
    return false;
  }
}

/**
 * Update user preferences based on behavior
 */
export async function updateUserPreferences(userId: number): Promise<WebsiteBuilderUserPreferences | null> {
  try {
    // Get recent user behaviors (last 50 actions)
    const recentBehaviors = await db
      .select()
      .from(websiteBuilderUserBehavior)
      .where(eq(websiteBuilderUserBehavior.userId, userId))
      .orderBy(desc(websiteBuilderUserBehavior.timestamp))
      .limit(50);

    if (recentBehaviors.length === 0) {
      return null;
    }

    // Analyze category preferences
    const categoryScores: Record<string, number> = {};
    // Analyze complexity preferences
    const complexityScores: Record<string, number> = {};
    // Analyze tag preferences
    const tagScores: Record<string, number> = {};

    // Score multipliers based on action types
    const actionWeights = {
      implement: 5,  // Implementing a template is a strong signal
      favorite: 4,   // Favoriting shows high interest
      view: 1,       // Viewing is basic interest
      search: 2      // Searching for something shows intent
    };

    // Process recent behaviors to update scores
    recentBehaviors.forEach(behavior => {
      const weight = actionWeights[behavior.action as keyof typeof actionWeights] || 1;
      
      // Parse details
      const details = behavior.itemDetails as Record<string, any>;
      
      // Process category
      if (details.category) {
        categoryScores[details.category] = (categoryScores[details.category] || 0) + weight;
      }
      
      // Process complexity
      if (details.complexity) {
        complexityScores[details.complexity] = (complexityScores[details.complexity] || 0) + weight;
      }
      
      // Process tags
      if (details.tags && Array.isArray(details.tags)) {
        details.tags.forEach((tag: string) => {
          tagScores[tag] = (tagScores[tag] || 0) + weight/details.tags.length;
        });
      }
    });
    
    // Convert scores to preferences
    const preferredCategories = Object.entries(categoryScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category]) => category);
    
    // Determine preferred complexity
    let preferredComplexity = 'beginner';
    let maxComplexityScore = 0;
    
    Object.entries(complexityScores).forEach(([complexity, score]) => {
      if (score > maxComplexityScore) {
        preferredComplexity = complexity;
        maxComplexityScore = score;
      }
    });
    
    // Convert tag scores to preferences
    const preferredTags = Object.entries(tagScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
    
    // Check if user already has preferences
    const existingPreferences = await db
      .select()
      .from(websiteBuilderUserPreferences)
      .where(eq(websiteBuilderUserPreferences.userId, userId));
    
    // Update or insert preferences
    if (existingPreferences.length > 0) {
      await db
        .update(websiteBuilderUserPreferences)
        .set({
          preferredCategories,
          preferredComplexity,
          preferredTags,
          lastActiveTimestamp: new Date()
        })
        .where(eq(websiteBuilderUserPreferences.userId, userId));
    } else {
      await db
        .insert(websiteBuilderUserPreferences)
        .values({
          userId,
          preferredCategories,
          preferredComplexity,
          preferredTags,
        });
    }
    
    // Return the updated preferences
    return {
      userId,
      preferredCategories,
      preferredComplexity,
      preferredTags,
      lastActiveTimestamp: new Date()
    };
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return null;
  }
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: number): Promise<WebsiteBuilderUserPreferences | null> {
  try {
    const preferences = await db
      .select()
      .from(websiteBuilderUserPreferences)
      .where(eq(websiteBuilderUserPreferences.userId, userId));
    
    if (preferences.length === 0) {
      return null;
    }
    
    return preferences[0];
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return null;
  }
}

/**
 * Get predictive template suggestions for a user
 */
export async function getSuggestedTemplates(options: SuggestionOptions): Promise<TemplateSuggestion[]> {
  const { userId, limit = 5 } = options;
  
  try {
    // Fetch user preferences
    let userPreferences = await getUserPreferences(userId);
    
    // If no preferences exist, update them based on behavior
    if (!userPreferences) {
      userPreferences = await updateUserPreferences(userId);
    }
    
    // Handle case where we still don't have preferences (new user)
    if (!userPreferences) {
      // Return default beginner templates as fallback
      return getDefaultTemplates('beginner');
    }
    
    // Get recently viewed and implemented templates
    const recentActivity = await db
      .select({
        itemId: websiteBuilderUserBehavior.itemId
      })
      .from(websiteBuilderUserBehavior)
      .where(
        and(
          eq(websiteBuilderUserBehavior.userId, userId),
          eq(websiteBuilderUserBehavior.itemType, 'template'),
          or(
            eq(websiteBuilderUserBehavior.action, 'view'),
            eq(websiteBuilderUserBehavior.action, 'implement')
          )
        )
      )
      .orderBy(desc(websiteBuilderUserBehavior.timestamp))
      .limit(20);
    
    const recentTemplateIds = recentActivity.map(activity => activity.itemId);
    
    // Create result array
    const suggestions: TemplateSuggestion[] = [];
    
    // Suggestion strategies
    const strategies = [
      // Strategy 1: Suggest based on preferred complexity
      async (): Promise<TemplateSuggestion[]> => {
        if (!userPreferences || !options.includeComplexityLevel) return [];
        
        // Fetch from template API based on complexity
        // This would be replaced with actual template fetching logic
        const complexitySuggestions = getDefaultTemplates(userPreferences.preferredComplexity)
          .filter(template => !recentTemplateIds.includes(template.templateId))
          .slice(0, 3);
        
        return complexitySuggestions.map(suggestion => ({
          ...suggestion,
          reason: `Based on your preferred complexity level: ${userPreferences?.preferredComplexity}`
        }));
      },
      
      // Strategy 2: Suggest based on preferred categories
      async (): Promise<TemplateSuggestion[]> => {
        if (!userPreferences || !options.includeCategories || !userPreferences.preferredCategories.length) return [];
        
        // Get top 2 categories
        const topCategories = userPreferences.preferredCategories.slice(0, 2);
        const categorySuggestions: TemplateSuggestion[] = [];
        
        // Here we would fetch templates based on the categories
        // For now using placeholders based on category
        topCategories.forEach(category => {
          // Simulate getting templates by category
          const templatesByCategory = [
            {
              templateId: `${category}-template-1`,
              score: 0.85,
              reason: `From your favorite category: ${category}`
            },
            {
              templateId: `${category}-template-2`,
              score: 0.82,
              reason: `From your favorite category: ${category}`
            }
          ];
          
          // Add to suggestions if not already viewed
          templatesByCategory
            .filter(template => !recentTemplateIds.includes(template.templateId))
            .forEach(template => categorySuggestions.push(template));
        });
        
        return categorySuggestions.slice(0, 3);
      },
      
      // Strategy 3: Suggest based on preferred tags
      async (): Promise<TemplateSuggestion[]> => {
        if (!userPreferences || !options.includeTags || !userPreferences.preferredTags.length) return [];
        
        // Get top 3 tags
        const topTags = userPreferences.preferredTags.slice(0, 3);
        const tagSuggestions: TemplateSuggestion[] = [];
        
        // Here we would fetch templates based on the tags
        // For now using placeholders based on tags
        topTags.forEach(tag => {
          // Simulate getting templates by tag
          const templatesByTag = [
            {
              templateId: `${tag}-template-1`,
              score: 0.78,
              reason: `Matches your interest in "${tag}"`
            },
            {
              templateId: `${tag}-template-2`,
              score: 0.75,
              reason: `Matches your interest in "${tag}"`
            }
          ];
          
          // Add to suggestions if not already viewed
          templatesByTag
            .filter(template => !recentTemplateIds.includes(template.templateId))
            .forEach(template => tagSuggestions.push(template));
        });
        
        return tagSuggestions.slice(0, 3);
      }
    ];
    
    // Execute strategies and collect suggestions
    for (const strategy of strategies) {
      const strategySuggestions = await strategy();
      suggestions.push(...strategySuggestions);
      
      // Break if we have enough suggestions
      if (suggestions.length >= limit) break;
    }
    
    // If we still don't have enough suggestions, add default suggestions
    if (suggestions.length < limit) {
      const defaultSuggestions = getDefaultTemplates('beginner')
        .filter(template => 
          !recentTemplateIds.includes(template.templateId) && 
          !suggestions.some(s => s.templateId === template.templateId)
        )
        .slice(0, limit - suggestions.length);
      
      suggestions.push(...defaultSuggestions);
    }
    
    // Deduplicate and limit
    const uniqueSuggestions = Array.from(
      new Map(suggestions.map(item => [item.templateId, item])).values()
    );
    
    return uniqueSuggestions.slice(0, limit);
  } catch (error) {
    console.error('Error getting suggested templates:', error);
    // Fallback to default templates
    return getDefaultTemplates('beginner').slice(0, limit);
  }
}

/**
 * Get default template suggestions when no user data is available
 * This is a placeholder implementation that would be replaced with actual template data
 */
function getDefaultTemplates(complexity: string): TemplateSuggestion[] {
  switch (complexity) {
    case 'beginner':
      return [
        {
          templateId: 'simple-card-component',
          score: 0.95,
          reason: 'Popular beginner template'
        },
        {
          templateId: 'basic-form',
          score: 0.92,
          reason: 'Recommended for new users'
        },
        {
          templateId: 'profile-card',
          score: 0.90,
          reason: 'Easy to implement'
        },
        {
          templateId: 'notification-banner',
          score: 0.88,
          reason: 'Simple but useful component'
        },
        {
          templateId: 'button-set',
          score: 0.85,
          reason: 'Fundamental UI element'
        }
      ];
    case 'intermediate':
      return [
        {
          templateId: 'data-table-sortable',
          score: 0.93,
          reason: 'Popular intermediate component'
        },
        {
          templateId: 'multi-step-form',
          score: 0.91,
          reason: 'Builds on form basics'
        },
        {
          templateId: 'chart-dashboard',
          score: 0.89,
          reason: 'Visualize your data'
        },
        {
          templateId: 'file-uploader',
          score: 0.86,
          reason: 'Useful for content management'
        },
        {
          templateId: 'kanban-board',
          score: 0.84,
          reason: 'Interactive drag-and-drop UI'
        }
      ];
    case 'advanced':
      return [
        {
          templateId: 'authentication-system',
          score: 0.94,
          reason: 'Complete auth workflow'
        },
        {
          templateId: 'real-time-dashboard',
          score: 0.92,
          reason: 'Advanced data visualization'
        },
        {
          templateId: 'e-commerce-product-page',
          score: 0.90,
          reason: 'Complex interactive component'
        },
        {
          templateId: 'image-editor',
          score: 0.87,
          reason: 'Advanced user interaction'
        },
        {
          templateId: 'chat-interface',
          score: 0.85,
          reason: 'Real-time messaging UI'
        }
      ];
    default:
      return [
        {
          templateId: 'simple-card-component',
          score: 0.95,
          reason: 'Popular template'
        },
        {
          templateId: 'basic-form',
          score: 0.92,
          reason: 'Essential component'
        },
        {
          templateId: 'profile-card',
          score: 0.90,
          reason: 'Commonly used UI element'
        },
        {
          templateId: 'data-table-sortable',
          score: 0.88,
          reason: 'Useful data component'
        },
        {
          templateId: 'notification-banner',
          score: 0.85,
          reason: 'Effective user alert'
        }
      ];
  }
}

/**
 * Express middleware to track user behavior
 */
export const trackBehaviorMiddleware: RequestHandler = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(body) {
    // Only track successful responses
    if (res.statusCode >= 200 && res.statusCode < 300 && req.session?.userId) {
      // Extract action type from path
      const path = req.path;
      let action: TrackActionParams['action'] = 'view';
      let itemType: TrackActionParams['itemType'] = 'template';
      let itemId = '';
      let itemDetails = {};
      
      // Determine action and item type based on path and method
      if (path.includes('/templates') && req.method === 'GET') {
        action = 'view';
        itemType = 'template';
        // Extract templateId from query params or path
        itemId = req.query.id?.toString() || 'template-list';
        itemDetails = {
          category: req.query.category,
          complexity: req.query.complexity,
          tags: req.query.tags?.toString().split(',') || []
        };
      } else if (path.includes('/implement') && req.method === 'POST') {
        action = 'implement';
        itemType = 'template';
        // Extract from body
        const body = JSON.parse(typeof body === 'string' ? body : JSON.stringify(body));
        itemId = body.templateId || body.path || 'unknown';
        itemDetails = {
          path: body.path,
          language: body.language,
          category: body.category,
          complexity: body.complexity,
          tags: body.tags || []
        };
      } else if (path.includes('/search') && req.method === 'GET') {
        action = 'search';
        itemType = 'file';
        itemId = req.query.query?.toString() || 'unknown-search';
        itemDetails = {
          query: req.query.query
        };
      } else if (path.includes('/favorite') && req.method === 'POST') {
        action = 'favorite';
        itemType = 'template';
        // Extract from body
        const body = JSON.parse(typeof body === 'string' ? body : JSON.stringify(body));
        itemId = body.templateId || 'unknown';
        itemDetails = body;
      }
      
      // Track the action asynchronously without blocking the response
      if (itemId && req.session.userId) {
        trackUserAction({
          userId: req.session.userId,
          action,
          itemType,
          itemId,
          itemDetails
        }).catch(err => console.error('Error tracking behavior:', err));
      }
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};