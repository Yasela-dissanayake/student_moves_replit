/**
 * AI Market Insights Service
 * Provides AI-powered analysis of property market data
 */

import { db } from '../db';
import { getUkHousePriceIndex, getOnsRentalData, getUserContributedRentalData, getLandRegistryPricePaidData, collectMarketDashboardData } from './data-collection-service';
import { areaStats, propertyInvestmentRecommendations } from '../../shared/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

// Cache for analyzed insights to reduce API calls
const insightsCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Generate market analysis for specific area
 */
export async function generateMarketAnalysis(params: {
  area?: string;
  propertyType?: string;
  timePeriod?: 'month' | 'quarter' | 'year';
  includeNearbyAreas?: boolean;
}) {
  const cacheKey = `market-analysis-${params.area || 'all'}-${params.propertyType || 'all'}-${params.timePeriod || 'month'}-${params.includeNearbyAreas ? 'nearby' : 'exact'}`;
  
  // Check cache first
  if (insightsCache[cacheKey] && (Date.now() - insightsCache[cacheKey].timestamp) < CACHE_TTL) {
    return insightsCache[cacheKey].data;
  }
  
  try {
    // Collect data from various sources
    const marketData = await collectMarketDashboardData({
      area: params.area,
      propertyType: params.propertyType
    });
    
    // Identify nearby areas if needed
    let nearbyAreas: string[] = [];
    if (params.includeNearbyAreas && params.area && params.area !== 'all') {
      nearbyAreas = getNearbyAreas(params.area);
    }
    
    // Analyze the data to extract insights
    const insights = {
      area: params.area || 'UK',
      date: new Date().toISOString().split('T')[0],
      overallTrend: getOverallTrend(marketData),
      topPerformingAreas: getTopPerformingAreas(marketData),
      undervaluedAreas: getUndervaluedAreas(marketData),
      propertyTypeAnalysis: getPropertyTypeAnalysis(marketData, params.propertyType),
      rentalYieldInsights: getRentalYieldInsights(marketData),
      marketPredictions: generateMarketPredictions(marketData),
      investmentOpportunities: identifyInvestmentOpportunities(marketData)
    };
    
    // Add nearby area comparison if requested
    if (nearbyAreas.length > 0) {
      const nearbyData = await Promise.all(
        nearbyAreas.map(async (nearbyArea) => {
          return {
            area: nearbyArea,
            data: await collectMarketDashboardData({ area: nearbyArea })
          };
        })
      );
      
      insights.nearbyAreaComparison = compareAreas(
        params.area!,
        marketData,
        nearbyData.map(d => ({ area: d.area, data: d.data }))
      );
    }
    
    // Cache the insights
    insightsCache[cacheKey] = {
      data: insights,
      timestamp: Date.now()
    };
    
    return insights;
  } catch (error) {
    console.error('Error generating market analysis:', error);
    throw error;
  }
}

/**
 * Generate investment property recommendations for a user
 */
export async function generateInvestmentRecommendations(criteria: {
  userId?: number;
  budgetMin?: number;
  budgetMax?: number;
  areas?: string[];
  propertyTypes?: string[];
  bedrooms?: number;
  minYield?: number;
}) {
  try {
    // Get market data for all potential areas
    const areaPromises = criteria.areas
      ? criteria.areas.map(area => collectMarketDashboardData({ area }))
      : [collectMarketDashboardData({})];
    
    const areasData = await Promise.all(areaPromises);
    
    // Identify areas that meet the yield criteria
    const promisingAreas = areasData.flatMap((data, i) => {
      const areaName = criteria.areas?.[i] || 'all';
      
      // Get property types that meet the criteria
      return data.propertyTypes
        .filter(pt => {
          // Filter by property type if specified
          if (criteria.propertyTypes && !criteria.propertyTypes.includes(pt.type)) {
            return false;
          }
          
          // Check if we have both price and rent data
          if (!pt.averageSalePrice || !pt.averageRent) {
            return false;
          }
          
          // Calculate yield
          const rentalYield = (pt.averageRent * 12) / pt.averageSalePrice * 100;
          
          // Check if it meets minimum yield criteria
          return !criteria.minYield || rentalYield >= criteria.minYield;
        })
        .map(pt => ({
          area: areaName,
          propertyType: pt.type,
          averagePrice: pt.averageSalePrice,
          averageRent: pt.averageRent,
          rentalYield: (pt.averageRent * 12) / pt.averageSalePrice * 100,
          bedrooms: undefined // We'd need to get this from additional data
        }));
    });
    
    // Sort by yield
    const sortedRecommendations = promisingAreas.sort((a, b) => b.rentalYield - a.rentalYield);
    
    // Save recommendations for this user if userId is provided
    let createdRecommendations = [];
    if (criteria.userId) {
      // Clear previous recommendations
      await db.delete(propertyInvestmentRecommendations).where(eq(propertyInvestmentRecommendations.userId, criteria.userId));
      
      // Save new recommendations
      for (const rec of sortedRecommendations.slice(0, 5)) {
        const result = await db.insert(propertyInvestmentRecommendations).values({
          userId: criteria.userId,
          area: rec.area,
          propertyType: rec.propertyType,
          averagePrice: rec.averagePrice?.toString() || '0',
          monthlyRent: rec.averageRent?.toString() || '0',
          rentalYield: rec.rentalYield,
          description: generateRecommendationDescription(rec),
          createdAt: new Date()
        });
        
        createdRecommendations.push(result);
      }
    }
    
    return {
      recommendations: sortedRecommendations.slice(0, 10),
      savedRecommendations: createdRecommendations.length
    };
  } catch (error) {
    console.error('Error generating investment recommendations:', error);
    throw error;
  }
}

/**
 * Generate rental yield calculator with comparison to market averages
 */
export async function calculateRentalYield(params: {
  purchasePrice: number;
  monthlyRent: number;
  area?: string;
}) {
  try {
    // Calculate basic rental yield
    const annualRent = params.monthlyRent * 12;
    const rentalYield = (annualRent / params.purchasePrice) * 100;
    
    // Prepare result object
    const result = {
      purchasePrice: params.purchasePrice,
      monthlyRent: params.monthlyRent,
      annualRent,
      yield: rentalYield,
      marketComparison: null as any
    };
    
    // If area is provided, add comparison with market averages
    if (params.area) {
      const marketData = await collectMarketDashboardData({ area: params.area });
      
      // Find averages for the area
      const areaData = marketData.areaBreakdown.find(a => 
        a.name.toLowerCase() === params.area?.toLowerCase()
      );
      
      if (areaData) {
        const areaAverageRent = areaData.averageRent || 0;
        const areaAverageSalePrice = areaData.averageSalePrice || 0;
        const areaAverageYield = (areaAverageRent * 12 / areaAverageSalePrice) * 100;
        
        result.marketComparison = {
          areaName: areaData.name,
          areaAverageRent,
          areaAverageSalePrice,
          areaAverageYield,
          comparisonToAverage: rentalYield - areaAverageYield
        };
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error calculating rental yield:', error);
    throw error;
  }
}

/**
 * Get competitor analysis data from available market sources
 */
export async function getCompetitorAnalysis(area?: string, propertyType?: string, bedrooms?: number) {
  try {
    // Get data from various sources
    const [
      marketData,
      userContributedData
    ] = await Promise.all([
      collectMarketDashboardData({ area, propertyType }),
      getUserContributedRentalData({ area, propertyType, bedrooms })
    ]);
    
    // Filter to properties matching criteria
    let comparableProperties = userContributedData.filter(p => {
      if (propertyType && p.propertyType !== propertyType) return false;
      if (bedrooms !== undefined && p.bedrooms !== bedrooms) return false;
      return true;
    });
    
    // Calculate ranges
    const rentPrices = comparableProperties.map(p => p.monthlyRent);
    const minRent = Math.min(...rentPrices);
    const maxRent = Math.max(...rentPrices);
    const avgRent = rentPrices.reduce((sum, rent) => sum + rent, 0) / rentPrices.length;
    
    // Split into price bands
    const lowPriceBand = minRent;
    const mediumPriceBand = avgRent;
    const highPriceBand = maxRent;
    
    const propertiesByPriceBand = {
      low: comparableProperties.filter(p => p.monthlyRent < mediumPriceBand * 0.9),
      medium: comparableProperties.filter(p => p.monthlyRent >= mediumPriceBand * 0.9 && p.monthlyRent <= mediumPriceBand * 1.1),
      high: comparableProperties.filter(p => p.monthlyRent > mediumPriceBand * 1.1)
    };
    
    // Get market trends for context
    const areaTrends = marketData.areaBreakdown.find(a => 
      area ? a.name.toLowerCase() === area.toLowerCase() : a.name === 'London'
    );
    
    return {
      overview: {
        totalComparableProperties: comparableProperties.length,
        averageRent: avgRent,
        minRent,
        maxRent,
        medianRent: getMedian(rentPrices),
        rentRange: maxRent - minRent,
        priceDistribution: {
          low: propertiesByPriceBand.low.length,
          medium: propertiesByPriceBand.medium.length,
          high: propertiesByPriceBand.high.length
        },
        marketTrend: areaTrends?.rentTrend || 'unknown'
      },
      pricePoints: {
        budget: lowPriceBand,
        standard: mediumPriceBand,
        premium: highPriceBand
      },
      competitiveAdvantage: analyzeCompetitiveAdvantage(comparableProperties),
      marketGaps: identifyMarketGaps(comparableProperties, area)
    };
  } catch (error) {
    console.error('Error getting competitor analysis:', error);
    throw error;
  }
}

// Helper functions

/**
 * Get market stats for a specific area
 */
async function getAreaMarketStats(area?: string, propertyType?: string, bedrooms?: number) {
  try {
    // Get data from various sources
    const [
      marketData,
      userContributedData
    ] = await Promise.all([
      collectMarketDashboardData({ area, propertyType }),
      getUserContributedRentalData({ area, propertyType, bedrooms })
    ]);
    
    // Get area-specific statistics
    const areaStats = marketData.areaBreakdown.find(a => 
      area ? a.name.toLowerCase() === area.toLowerCase() : true
    ) || marketData.areaBreakdown[0];
    
    // Get property-type statistics
    const propertyTypeStats = marketData.propertyTypes.find(pt => 
      propertyType ? pt.type === propertyType : true
    ) || marketData.propertyTypes[0];
    
    return {
      areaName: areaStats.name,
      averageSalePrice: areaStats.averageSalePrice,
      averageRent: areaStats.averageRent,
      rentalYield: areaStats.rentalYield,
      saleTrend: areaStats.saleTrend,
      rentTrend: areaStats.rentTrend,
      propertyTypeName: propertyTypeStats.type,
      propertyTypeAveragePrice: propertyTypeStats.averageSalePrice,
      propertyTypeAverageRent: propertyTypeStats.averageRent,
      userContributionsCount: userContributedData.length
    };
  } catch (error) {
    console.error('Error getting area market stats:', error);
    throw error;
  }
}

/**
 * Integrate multiple data sources for comprehensive market view
 */
function integrateMarketData(areas: any, marketData: any, contributedData: any) {
  const integratedData = [];
  
  // Integrate data for each area
  for (const area of areas) {
    const areaData = {
      name: area,
      officialStats: {},
      userContributed: {},
      combined: {}
    };
    
    // Add official market data
    for (const data of marketData) {
      if (data.areaPrefix && area.startsWith(data.areaPrefix)) {
        areaData.officialStats[data.source] = data.data;
      }
    }
    
    // Add user-contributed data
    const areaUserData = contributedData.filter(d => 
      d.area && d.area.toLowerCase().includes(area.toLowerCase())
    );
    
    if (areaUserData.length > 0) {
      areaData.userContributed = {
        count: areaUserData.length,
        averageRent: areaUserData.reduce((sum, d) => sum + d.monthlyRent, 0) / areaUserData.length,
        byPropertyType: {}
      };
      
      // Group by property type
      for (const d of areaUserData) {
        if (!areaData.userContributed.byPropertyType[d.propertyType]) {
          areaData.userContributed.byPropertyType[d.propertyType] = {
            count: 0,
            total: 0
          };
        }
        
        areaData.userContributed.byPropertyType[d.propertyType].count++;
        areaData.userContributed.byPropertyType[d.propertyType].total += d.monthlyRent;
      }
      
      // Calculate averages
      for (const [type, data] of Object.entries(areaData.userContributed.byPropertyType)) {
        areaData.userContributed.byPropertyType[type].average = 
          data.total / data.count;
      }
    }
    
    // Combine data
    areaData.combined = combineDataSources(areaData.officialStats, areaData.userContributed);
    
    integratedData.push(areaData);
  }
  
  return integratedData;
}

/**
 * Prepare market data summary for AI analysis
 */
function prepareMarketSummary(areas: any, marketData: any, contributedData: any) {
  // Get the integrated data
  const integratedData = integrateMarketData(areas, marketData, contributedData);
  
  // Extract key insights for each area
  const areaSummaries = integratedData.map(area => {
    return {
      area: area.name,
      averageSalePrice: area.combined.averageSalePrice || 
                        area.officialStats.landRegistry?.averagePrice ||
                        'No data',
      averageRent: area.combined.averageRent || 
                  area.userContributed.averageRent || 
                  area.officialStats.ons?.medianRent ||
                  'No data',
      rentalYield: area.combined.rentalYield || 
                  (area.userContributed.averageRent && area.officialStats.landRegistry?.averagePrice) 
                    ? ((area.userContributed.averageRent * 12) / area.officialStats.landRegistry.averagePrice) * 100
                    : 'No data',
      trend: area.officialStats.landRegistry?.yearlyChange || 
            area.officialStats.ons?.yearlyChange || 
            'Unknown',
      propertyTypes: Object.keys(area.userContributed.byPropertyType || {})
    };
  });
  
  // Identify top areas by different metrics
  const topAreas = {
    byPrice: [...areaSummaries].sort((a, b) => 
      typeof a.averageSalePrice === 'number' && typeof b.averageSalePrice === 'number'
        ? b.averageSalePrice - a.averageSalePrice
        : 0
    ).slice(0, 3),
    byRent: [...areaSummaries].sort((a, b) => 
      typeof a.averageRent === 'number' && typeof b.averageRent === 'number'
        ? b.averageRent - a.averageRent
        : 0
    ).slice(0, 3),
    byYield: [...areaSummaries].sort((a, b) => 
      typeof a.rentalYield === 'number' && typeof b.rentalYield === 'number'
        ? b.rentalYield - a.rentalYield
        : 0
    ).slice(0, 3),
    byGrowth: [...areaSummaries].sort((a, b) => 
      typeof a.trend === 'number' && typeof b.trend === 'number'
        ? b.trend - a.trend
        : 0
    ).slice(0, 3)
  };
  
  // Generate overall market summary
  return {
    areas: areaSummaries,
    topAreas,
    totalContributions: contributedData.length,
    dataQuality: contributedData.length > 10 ? 'Good' : 'Limited',
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Process AI insights into structured format
 */
function processAiInsights(aiOutput: any, marketData: any) {
  // Convert the AI output into a structured format
  
  // Example structured format
  return {
    summary: {
      marketTrend: aiOutput.summary?.marketTrend || 'Mixed',
      highlights: aiOutput.summary?.highlights || [
        'Limited data available',
        'Based on user contributions and public data'
      ],
      risks: aiOutput.summary?.risks || [
        'Market volatility',
        'Regional variations'
      ]
    },
    areaInsights: aiOutput.areaInsights || [],
    investmentStrategies: aiOutput.investmentStrategies || [
      {
        strategy: 'Yield focus',
        description: 'Focus on areas with higher rental yields',
        targetAreas: marketData.areaBreakdown
          .filter(a => a.rentalYield > 5)
          .map(a => a.name)
          .slice(0, 3)
      }
    ],
    propertyTypes: aiOutput.propertyTypes || []
  };
}

/**
 * Create property investment recommendations from AI output
 */
async function createRecommendationsFromAiOutput(userId: any, aiRecommendations: any, marketStats: any) {
  // Generate specific property recommendations
  try {
    // Clear previous recommendations
    await db.delete(propertyInvestmentRecommendations).where(eq(propertyInvestmentRecommendations.userId, userId));
    
    // Save new recommendations from AI
    for (const area of aiRecommendations.recommendedAreas || []) {
      // Find market stats for this area
      const areaStats = marketStats.find(a => 
        a.name.toLowerCase() === area.name.toLowerCase()
      );
      
      if (!areaStats) continue;
      
      // Save recommendation
      await db.insert(propertyInvestmentRecommendations).values({
        userId,
        area: area.name,
        propertyType: area.propertyType || 'flat',
        averagePrice: areaStats.averageSalePrice?.toString() || '0',
        monthlyRent: areaStats.averageRent?.toString() || '0',
        rentalYield: areaStats.rentalYield || 0,
        description: area.reason || generateRecommendationDescription({
          area: area.name,
          propertyType: area.propertyType || 'flat',
          averagePrice: areaStats.averageSalePrice,
          averageRent: areaStats.averageRent,
          rentalYield: areaStats.rentalYield
        }),
        createdAt: new Date()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error creating recommendations from AI output:', error);
    throw error;
  }
}

function or(...conditions: any[]) {
  return conditions.filter(Boolean).length > 0;
}

function inArray(column: any, values: any[]) {
  return values.map(v => eq(column, v));
}

/**
 * Find nearby areas based on geography
 */
function getNearbyAreas(area: string): string[] {
  // This is a very simplified implementation
  // In production, would use a proper geographic database
  
  const areaMap: Record<string, string[]> = {
    'London': ['Croydon', 'Bromley', 'Barnet', 'Enfield', 'Harrow'],
    'Manchester': ['Salford', 'Stockport', 'Bolton', 'Oldham', 'Rochdale'],
    'Birmingham': ['Solihull', 'Wolverhampton', 'Walsall', 'Dudley', 'Coventry'],
    'Leeds': ['Bradford', 'Wakefield', 'York', 'Harrogate', 'Huddersfield'],
    'Edinburgh': ['Glasgow', 'Dundee', 'Stirling', 'Perth', 'Falkirk']
  };
  
  return areaMap[area] || [];
}

/**
 * Get median value from array
 */
function getMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// Analysis helper functions

function getOverallTrend(marketData: any) {
  const trendMap: Record<string, number> = {
    'rising_fast': 2,
    'rising': 1,
    'stable': 0,
    'falling': -1,
    'falling_fast': -2
  };
  
  // Calculate average trend score
  let totalScore = 0;
  let count = 0;
  
  for (const area of marketData.areaBreakdown) {
    if (area.saleTrend && trendMap[area.saleTrend] !== undefined) {
      totalScore += trendMap[area.saleTrend];
      count++;
    }
    
    if (area.rentTrend && trendMap[area.rentTrend] !== undefined) {
      totalScore += trendMap[area.rentTrend];
      count++;
    }
  }
  
  const avgScore = count > 0 ? totalScore / count : 0;
  
  // Convert score back to trend label
  if (avgScore > 1.5) return 'Strongly Rising';
  if (avgScore > 0.5) return 'Rising';
  if (avgScore > -0.5) return 'Stable';
  if (avgScore > -1.5) return 'Falling';
  return 'Strongly Falling';
}

function getTopPerformingAreas(marketData: any) {
  // Sort areas by price growth
  return marketData.areaBreakdown
    .filter((a: any) => a.saleTrend === 'rising' || a.saleTrend === 'rising_fast')
    .sort((a: any, b: any) => {
      // Prioritize areas with both rising sales and rental prices
      const aScore = (a.saleTrend === 'rising_fast' ? 2 : 1) + 
                    (a.rentTrend === 'rising_fast' ? 2 : a.rentTrend === 'rising' ? 1 : 0);
      const bScore = (b.saleTrend === 'rising_fast' ? 2 : 1) + 
                    (b.rentTrend === 'rising_fast' ? 2 : b.rentTrend === 'rising' ? 1 : 0);
      return bScore - aScore;
    })
    .slice(0, 3)
    .map((a: any) => ({
      name: a.name,
      averagePrice: a.averageSalePrice,
      annualGrowth: a.saleTrend === 'rising_fast' ? 'High' : 'Moderate',
      rentalTrend: a.rentTrend
    }));
}

function getUndervaluedAreas(marketData: any) {
  // Find areas with high rental yields
  return marketData.areaBreakdown
    .filter((a: any) => a.rentalYield > 4.5) // Areas with above-average rental yield
    .sort((a: any, b: any) => b.rentalYield - a.rentalYield)
    .slice(0, 3)
    .map((a: any) => ({
      name: a.name,
      averagePrice: a.averageSalePrice,
      rentalYield: a.rentalYield,
      potentialUpside: a.saleTrend === 'rising' || a.saleTrend === 'rising_fast' ? 'High' : 'Moderate'
    }));
}

function getPropertyTypeAnalysis(marketData: any, propertyType?: string) {
  const propertyTypes = propertyType 
    ? marketData.propertyTypes.filter((pt: any) => pt.type === propertyType)
    : marketData.propertyTypes;
  
  return propertyTypes.map((pt: any) => ({
    type: pt.type,
    averagePrice: pt.averageSalePrice,
    averageRent: pt.averageRent,
    rentalYield: pt.averageRent ? (pt.averageRent * 12 / pt.averageSalePrice) * 100 : null,
    demandLevel: getDemandLevel(pt, marketData)
  }));
}

function getRentalYieldInsights(marketData: any) {
  // Calculate average yield across all areas
  const yields = marketData.areaBreakdown
    .filter((a: any) => a.rentalYield)
    .map((a: any) => a.rentalYield);
  
  const avgYield = yields.reduce((sum: number, y: number) => sum + y, 0) / yields.length;
  
  // Find highest and lowest yield areas
  const highestYieldArea = [...marketData.areaBreakdown]
    .filter((a: any) => a.rentalYield)
    .sort((a: any, b: any) => b.rentalYield - a.rentalYield)[0];
  
  const lowestYieldArea = [...marketData.areaBreakdown]
    .filter((a: any) => a.rentalYield)
    .sort((a: any, b: any) => a.rentalYield - b.rentalYield)[0];
  
  return {
    averageYield: avgYield,
    yieldRange: {
      highest: {
        area: highestYieldArea?.name,
        yield: highestYieldArea?.rentalYield
      },
      lowest: {
        area: lowestYieldArea?.name,
        yield: lowestYieldArea?.rentalYield
      }
    },
    insights: [
      `The average rental yield across analyzed areas is ${avgYield.toFixed(2)}%`,
      highestYieldArea 
        ? `${highestYieldArea.name} offers the highest yield at ${highestYieldArea.rentalYield.toFixed(2)}%` 
        : 'No yield data available for areas',
      yields.length > 3
        ? `There is a ${(highestYieldArea?.rentalYield - lowestYieldArea?.rentalYield).toFixed(2)}% difference between highest and lowest yield areas`
        : 'Limited yield data available'
    ]
  };
}

function generateMarketPredictions(marketData: any) {
  // This would ideally use time-series data and actual predictive models
  // Here we're making simple extrapolations based on current trends
  
  const predictions = marketData.areaBreakdown.map((area: any) => {
    const priceGrowthMap: Record<string, number> = {
      'rising_fast': 7,
      'rising': 4,
      'stable': 1,
      'falling': -2,
      'falling_fast': -5
    };
    
    const rentGrowthMap: Record<string, number> = {
      'rising_fast': 6,
      'rising': 3,
      'stable': 1,
      'falling': -1,
      'falling_fast': -3
    };
    
    const priceTrend = area.saleTrend && priceGrowthMap[area.saleTrend] 
      ? priceGrowthMap[area.saleTrend]
      : 1; // Default to slight growth
    
    const rentTrend = area.rentTrend && rentGrowthMap[area.rentTrend]
      ? rentGrowthMap[area.rentTrend]
      : 1; // Default to slight growth
    
    // Predict prices for 1 year ahead
    const predictedPrice = area.averageSalePrice * (1 + (priceTrend / 100));
    const predictedRent = area.averageRent * (1 + (rentTrend / 100));
    const predictedYield = (predictedRent * 12 / predictedPrice) * 100;
    
    return {
      area: area.name,
      currentPrice: area.averageSalePrice,
      predictedPrice,
      priceChange: priceTrend,
      currentRent: area.averageRent,
      predictedRent,
      rentChange: rentTrend,
      currentYield: area.rentalYield,
      predictedYield
    };
  });
  
  return {
    timeframe: '12 months',
    predictions: predictions.sort((a: any, b: any) => b.priceChange - a.priceChange),
    disclaimer: 'Predictions are based on current trends and should not be used as the sole basis for investment decisions'
  };
}

function identifyInvestmentOpportunities(marketData: any) {
  // Find areas with good yield and rising prices
  const yieldFocus = marketData.areaBreakdown
    .filter((a: any) => a.rentalYield > 5)
    .sort((a: any, b: any) => b.rentalYield - a.rentalYield)
    .slice(0, 3);
  
  // Find areas with strong price growth
  const capitalGrowthFocus = marketData.areaBreakdown
    .filter((a: any) => a.saleTrend === 'rising' || a.saleTrend === 'rising_fast')
    .sort((a: any, b: any) => {
      const aTrend = a.saleTrend === 'rising_fast' ? 2 : 1;
      const bTrend = b.saleTrend === 'rising_fast' ? 2 : 1;
      return bTrend - aTrend;
    })
    .slice(0, 3);
  
  // Find balanced opportunities
  const balancedApproach = marketData.areaBreakdown
    .filter((a: any) => a.rentalYield > 4 && (a.saleTrend === 'rising' || a.saleTrend === 'stable'))
    .sort((a: any, b: any) => {
      // Score based on yield and growth
      const aScore = a.rentalYield + (a.saleTrend === 'rising' ? 1 : 0);
      const bScore = b.rentalYield + (b.saleTrend === 'rising' ? 1 : 0);
      return bScore - aScore;
    })
    .slice(0, 3);
  
  return {
    strategies: [
      {
        name: 'Yield Focus',
        description: 'Areas with high rental yields for income-focused investors',
        opportunities: yieldFocus.map((a: any) => ({
          area: a.name,
          yield: a.rentalYield,
          averagePrice: a.averageSalePrice,
          monthlyRent: a.averageRent
        }))
      },
      {
        name: 'Capital Growth Focus',
        description: 'Areas with strong price growth potential',
        opportunities: capitalGrowthFocus.map((a: any) => ({
          area: a.name,
          priceGrowthPotential: a.saleTrend === 'rising_fast' ? 'High' : 'Moderate',
          averagePrice: a.averageSalePrice,
          monthlyRent: a.averageRent
        }))
      },
      {
        name: 'Balanced Approach',
        description: 'Areas offering both decent yields and some growth potential',
        opportunities: balancedApproach.map((a: any) => ({
          area: a.name,
          yield: a.rentalYield,
          growthPotential: a.saleTrend === 'rising' ? 'Moderate' : 'Stable',
          averagePrice: a.averageSalePrice,
          monthlyRent: a.averageRent
        }))
      }
    ]
  };
}

function compareAreas(mainArea: string, mainData: any, nearbyAreas: any[]) {
  const mainAreaData = mainData.areaBreakdown.find((a: any) => 
    a.name.toLowerCase() === mainArea.toLowerCase()
  );
  
  if (!mainAreaData) return [];
  
  return nearbyAreas.map(nearby => {
    const nearbyAreaData = nearby.data.areaBreakdown.find((a: any) => 
      a.name.toLowerCase() === nearby.area.toLowerCase()
    );
    
    if (!nearbyAreaData) return null;
    
    const priceDiff = nearbyAreaData.averageSalePrice - mainAreaData.averageSalePrice;
    const rentDiff = nearbyAreaData.averageRent - mainAreaData.averageRent;
    const yieldDiff = nearbyAreaData.rentalYield - mainAreaData.rentalYield;
    
    return {
      area: nearby.area,
      distanceFromMain: '< 10 miles', // Would use actual geographic data in production
      priceComparison: {
        value: priceDiff,
        percentage: (priceDiff / mainAreaData.averageSalePrice) * 100,
        direction: priceDiff > 0 ? 'higher' : 'lower'
      },
      rentComparison: {
        value: rentDiff,
        percentage: (rentDiff / mainAreaData.averageRent) * 100,
        direction: rentDiff > 0 ? 'higher' : 'lower'
      },
      yieldComparison: {
        value: yieldDiff,
        direction: yieldDiff > 0 ? 'higher' : 'lower'
      },
      summary: generateAreaComparisonSummary(mainArea, nearby.area, priceDiff, rentDiff, yieldDiff)
    };
  }).filter(Boolean);
}

function generateAreaComparisonSummary(mainArea: string, nearbyArea: string, priceDiff: number, rentDiff: number, yieldDiff: number) {
  const priceDirection = priceDiff > 0 ? 'higher' : 'lower';
  const rentDirection = rentDiff > 0 ? 'higher' : 'lower';
  const yieldDirection = yieldDiff > 0 ? 'higher' : 'lower';
  
  return `${nearbyArea} has ${Math.abs(priceDiff) > 50000 ? 'significantly' : 'slightly'} ${priceDirection} property prices (${Math.abs(Math.round(priceDiff / 1000))}k ${priceDirection}) and ${Math.abs(rentDiff) > 200 ? 'significantly' : 'slightly'} ${rentDirection} rents (£${Math.abs(Math.round(rentDiff))} ${rentDirection} per month) compared to ${mainArea}. Rental yields are ${Math.abs(yieldDiff).toFixed(1)}% ${yieldDirection}.`;
}

function getDemandLevel(propertyType: any, marketData: any) {
  // This would use more metrics in production
  if (!propertyType.averageRent) return 'Unknown';
  
  // Calculate rental demand based on contributed data
  const demandLevels = ['Low', 'Moderate', 'High', 'Very High'];
  
  // Simple logic - more data points = higher demand
  if (propertyType.dataPoints > 20) return demandLevels[3];
  if (propertyType.dataPoints > 10) return demandLevels[2];
  if (propertyType.dataPoints > 5) return demandLevels[1];
  return demandLevels[0];
}

function combineDataSources(officialStats: any, userContributed: any) {
  // Simple combination logic, would be more sophisticated in production
  return {
    averageSalePrice: officialStats.landRegistry?.averagePrice,
    averageRent: userContributed.averageRent || officialStats.ons?.medianRent,
    rentalYield: userContributed.averageRent && officialStats.landRegistry?.averagePrice
      ? ((userContributed.averageRent * 12) / officialStats.landRegistry.averagePrice) * 100
      : null,
    contributedDataPoints: userContributed.count || 0
  };
}

function analyzeCompetitiveAdvantage(properties: any[]) {
  // Very simple implementation
  const rentWithBills = properties.filter(p => p.billsIncluded);
  const rentWithoutBills = properties.filter(p => !p.billsIncluded);
  
  const avgRentWithBills = rentWithBills.length > 0
    ? rentWithBills.reduce((sum, p) => sum + p.monthlyRent, 0) / rentWithBills.length
    : 0;
  
  const avgRentWithoutBills = rentWithoutBills.length > 0
    ? rentWithoutBills.reduce((sum, p) => sum + p.monthlyRent, 0) / rentWithoutBills.length
    : 0;
  
  const billsPrevalence = rentWithBills.length / (properties.length || 1);
  
  return {
    billsIncluded: {
      prevalence: `${Math.round(billsPrevalence * 100)}%`,
      priceDifference: avgRentWithBills - avgRentWithoutBills,
      recommendation: billsPrevalence > 0.6 
        ? 'Consider offering bills included to remain competitive'
        : 'Bills included is not common in this area'
    },
    // Would add more factors in production
    propertyFeatures: 'Analysis would be based on property features data'
  };
}

function identifyMarketGaps(properties: any[], area?: string) {
  // Group properties by type and bedrooms
  const segments: Record<string, any[]> = {};
  
  properties.forEach(p => {
    const key = `${p.propertyType}-${p.bedrooms}`;
    if (!segments[key]) segments[key] = [];
    segments[key].push(p);
  });
  
  // Find underserved segments
  const segmentCounts = Object.entries(segments).map(([key, props]) => {
    const [type, bedrooms] = key.split('-');
    return {
      segment: `${type} with ${bedrooms} bedroom${bedrooms !== '1' ? 's' : ''}`,
      count: props.length,
      averageRent: props.reduce((sum, p) => sum + p.monthlyRent, 0) / props.length
    };
  });
  
  // Sort by count (ascending) to find least served segments
  const sortedSegments = segmentCounts.sort((a, b) => a.count - b.count);
  
  return {
    underservedSegments: sortedSegments.slice(0, 3),
    opportunities: sortedSegments.length > 0
      ? `The ${sortedSegments[0].segment} segment appears underserved with only ${sortedSegments[0].count} properties in the dataset`
      : 'Insufficient data to identify market gaps'
  };
}

// Generate a human-readable recommendation description
function generateRecommendationDescription(rec: any): string {
  const propertyTypeMap: Record<string, string> = {
    'flat': 'flats/apartments',
    'terraced': 'terraced houses',
    'semi-detached': 'semi-detached houses',
    'detached': 'detached houses'
  };
  
  const propertyTypeDesc = propertyTypeMap[rec.propertyType] || rec.propertyType;
  
  return `${rec.area} offers good investment potential for ${propertyTypeDesc} with an average rental yield of ${rec.rentalYield?.toFixed(1)}%. The average property price is £${Math.round(rec.averagePrice || 0).toLocaleString()} with monthly rental income around £${Math.round(rec.averageRent || 0).toLocaleString()}.`;
}