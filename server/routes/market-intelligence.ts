/**
 * Market Intelligence API Routes
 */

import { Request, Response, NextFunction, Router } from 'express';
import { db } from '../db';
import { z } from 'zod';
import { 
  collectMarketDashboardData, 
  storeUserContributedRentalData,
  getUserContributedRentalData 
} from '../services/data-collection-service';
import { 
  generateMarketAnalysis, 
  generateInvestmentRecommendations,
  calculateRentalYield,
  getCompetitorAnalysis
} from '../services/ai-market-insights-service';

// Validation schemas
const contributedRentalDataSchema = z.object({
  postcode: z.string().min(5).max(8),
  propertyType: z.enum(['flat', 'terraced', 'semi-detached', 'detached', 'other']),
  bedrooms: z.coerce.number().min(0).max(10),
  monthlyRent: z.coerce.number().min(1),
  isAnonymous: z.boolean().default(true),
  billsIncluded: z.boolean().default(false),
  includedBills: z.array(z.string()).optional(),
  propertyFeatures: z.array(z.string()).optional(),
  notes: z.string().optional()
});

const calculateYieldSchema = z.object({
  purchasePrice: z.coerce.number().min(1),
  monthlyRent: z.coerce.number().min(1),
  area: z.string().optional()
});

/**
 * Returns router with market intelligence routes
 */
export function registerMarketIntelligenceRoutes(router: Router, authenticateUser: Function) {
  // Get market dashboard data
  router.get('/api/market-intelligence/dashboard-data', async (req: Request, res: Response) => {
    try {
      const { area, propertyType, bedrooms } = req.query;
      
      const filters: any = {};
      if (area) filters.area = area as string;
      if (propertyType) filters.propertyType = propertyType as string;
      if (bedrooms) filters.bedrooms = parseInt(bedrooms as string);
      
      const data = await collectMarketDashboardData(filters);
      
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Error getting market dashboard data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get market dashboard data'
      });
    }
  });
  
  // Contribute rental data
  router.post('/api/market-intelligence/contribute-rental-data', authenticateUser, async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const validatedData = contributedRentalDataSchema.parse(req.body);
      
      // Add user ID if available and not anonymous
      const userId = req.user?.id;
      const data = {
        ...validatedData,
        userId: validatedData.isAnonymous ? null : userId
      };
      
      // Store the rental data
      const result = await storeUserContributedRentalData(data);
      
      res.json({
        success: true,
        message: 'Rental data contribution received',
        id: result.id
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid data provided',
          details: error.errors
        });
      } else {
        console.error('Error contributing rental data:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to store rental data'
        });
      }
    }
  });
  
  // Calculate rental yield
  router.post('/api/market-intelligence/calculate-yield', async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const validatedData = calculateYieldSchema.parse(req.body);
      
      // Calculate yield
      const result = await calculateRentalYield(validatedData);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid data provided',
          details: error.errors
        });
      } else {
        console.error('Error calculating rental yield:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to calculate rental yield'
        });
      }
    }
  });
  
  // Get market analysis
  router.get('/api/market-intelligence/market-analysis', authenticateUser, async (req: Request, res: Response) => {
    try {
      const { area, propertyType, timePeriod, includeNearbyAreas } = req.query;
      
      const analysisParams = {
        area: area as string | undefined,
        propertyType: propertyType as string | undefined,
        timePeriod: timePeriod as 'month' | 'quarter' | 'year' | undefined,
        includeNearbyAreas: includeNearbyAreas === 'true'
      };
      
      const analysis = await generateMarketAnalysis(analysisParams);
      
      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error('Error getting market analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate market analysis'
      });
    }
  });
  
  // Get investment recommendations
  router.get('/api/market-intelligence/user-recommendations', authenticateUser, async (req: Request, res: Response) => {
    try {
      const {
        budgetMin,
        budgetMax,
        areas,
        propertyTypes,
        bedrooms,
        minYield
      } = req.query;
      
      const userId = req.user?.id;
      
      // Convert query parameters to appropriate types
      const criteria: any = { userId };
      if (budgetMin) criteria.budgetMin = parseInt(budgetMin as string);
      if (budgetMax) criteria.budgetMax = parseInt(budgetMax as string);
      if (areas) criteria.areas = (areas as string).split(',');
      if (propertyTypes) criteria.propertyTypes = (propertyTypes as string).split(',');
      if (bedrooms) criteria.bedrooms = parseInt(bedrooms as string);
      if (minYield) criteria.minYield = parseFloat(minYield as string);
      
      const recommendations = await generateInvestmentRecommendations(criteria);
      
      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      console.error('Error generating investment recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate investment recommendations'
      });
    }
  });
  
  // Get competitor analysis
  router.get('/api/market-intelligence/competitor-analysis', authenticateUser, async (req: Request, res: Response) => {
    try {
      const { area, propertyType, bedrooms } = req.query;
      
      const analysis = await getCompetitorAnalysis(
        area as string | undefined,
        propertyType as string | undefined,
        bedrooms ? parseInt(bedrooms as string) : undefined
      );
      
      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error('Error getting competitor analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate competitor analysis'
      });
    }
  });
  
  // Get user-contributed rental data (admin only)
  router.get('/api/market-intelligence/contributed-data', authenticateUser, async (req: Request, res: Response) => {
    try {
      // Check if user is admin or landlord
      if (req.user?.userType !== 'admin' && req.user?.userType !== 'landlord') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access'
        });
      }
      
      const { area, propertyType, bedrooms, postcode } = req.query;
      
      const filters: any = {};
      if (area) filters.area = area as string;
      if (propertyType) filters.propertyType = propertyType as string;
      if (bedrooms) filters.bedrooms = parseInt(bedrooms as string);
      if (postcode) filters.postcode = postcode as string;
      
      const data = await getUserContributedRentalData(filters);
      
      // Remove user IDs for non-admin users
      const sanitizedData = req.user?.userType === 'admin' 
        ? data 
        : data.map(item => ({ ...item, userId: null }));
      
      res.json({
        success: true,
        data: sanitizedData
      });
    } catch (error) {
      console.error('Error getting contributed rental data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get contributed rental data'
      });
    }
  });
  
  return router;
}

/**
 * Prepare dashboard data for client consumption
 */
function prepareDashboardData(areas, marketData) {
  // Transform data for frontend consumption
  const preparedData = {
    // Overall market summary
    overallStats: {
      averageSalePrice: calculateAverage(areas.map(area => area.averagePrice)),
      averageRent: calculateAverage(areas.map(area => 
        area.median_rent || area.averageRent)),
      rentGrowth: calculateAverage(areas.map(area => 
        area.rent_growth || area.rentGrowth)),
      priceGrowth: calculateAverage(areas.map(area => 
        area.price_growth || area.priceGrowth)),
      trendingAreas: areas
        .filter(area => area.trend === 'rising' || area.trend === 'rising_fast')
        .slice(0, 3),
      topYieldAreas: areas
        .filter(area => area.yield > 4)
        .sort((a, b) => b.yield - a.yield)
        .slice(0, 3)
    },
    
    // Area breakdown
    areaBreakdown: areas.map(area => ({
      name: area.name,
      averagePrice: area.averagePrice,
      medianRent: area.median_rent,
      priceGrowth: area.price_growth,
      rentGrowth: area.rent_growth,
      yield: area.yield,
      trend: area.trend,
      propertyStats: area.property_stats || []
    })),
    
    // Property type breakdown
    propertyTypeBreakdown: marketData.property_types.map(type => ({
      type: type.name,
      averagePrice: type.average_price,
      averageRent: type.average_rent,
      trend: type.trend,
      yield: type.yield
    })),
    
    // Price bands
    priceBands: marketData.price_bands,
    
    // Additional insights
    insights: marketData.insights || []
  };
  
  return preparedData;
}

/**
 * Calculate average from array of values, handling nulls
 */
function calculateAverage(values) {
  const validValues = values.filter(v => v !== null && v !== undefined);
  if (validValues.length === 0) return null;
  
  const sum = validValues.reduce((sum, val) => sum + val, 0);
  return sum / validValues.length;
}

// Default export for routes registration
export default {
  registerMarketIntelligenceRoutes
};