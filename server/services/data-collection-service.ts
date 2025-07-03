/**
 * Data Collection Service
 * 
 * This service collects property market data from various free sources including:
 * - UK Land Registry data
 * - Office for National Statistics (ONS) rental data
 * - Web scraping of public property listings
 * - User-contributed rental data
 */

import axios from 'axios';
import { db } from '../db';
import { contributedRentalData, areaStats } from '../../shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

// Base URLs for data sources
const UK_LAND_REGISTRY_BASE_URL = 'https://landregistry.data.gov.uk/data/ukhpi/region';
const ONS_DATA_BASE_URL = 'https://api.ons.gov.uk/dataset';

// Cache for collected data to minimize API calls
const dataCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get UK House Price Index data from Land Registry
 */
export async function getUkHousePriceIndex(region: string = 'england', period: string = 'latest') {
  const cacheKey = `ukhpi-${region}-${period}`;
  
  // Check cache first
  if (dataCache[cacheKey] && (Date.now() - dataCache[cacheKey].timestamp) < CACHE_TTL) {
    return dataCache[cacheKey].data;
  }
  
  try {
    // For now, simulate data as this would normally be fetched from the API
    // In production, this would call the actual Land Registry API
    const data = simulateUkHpiData(region);
    
    // Cache the data
    dataCache[cacheKey] = {
      data,
      timestamp: Date.now()
    };
    
    return data;
  } catch (error) {
    console.error('Error fetching UK House Price Index data:', error);
    throw error;
  }
}

/**
 * Get ONS private rental market statistics
 */
export async function getOnsRentalData(region: string = 'england', period: string = 'latest') {
  const cacheKey = `ons-rental-${region}-${period}`;
  
  // Check cache first
  if (dataCache[cacheKey] && (Date.now() - dataCache[cacheKey].timestamp) < CACHE_TTL) {
    return dataCache[cacheKey].data;
  }
  
  try {
    // For now, simulate data as this would normally be fetched from the API
    // In production, this would call the actual ONS API
    const data = simulateOnsRentalData(region);
    
    // Cache the data
    dataCache[cacheKey] = {
      data,
      timestamp: Date.now()
    };
    
    return data;
  } catch (error) {
    console.error('Error fetching ONS rental data:', error);
    throw error;
  }
}

/**
 * Get Land Registry price paid data
 * This data shows actual property sales
 */
export async function getLandRegistryPricePaidData(area: string, period: { from: string; to: string }) {
  const cacheKey = `price-paid-${area}-${period.from}-${period.to}`;
  
  // Check cache first
  if (dataCache[cacheKey] && (Date.now() - dataCache[cacheKey].timestamp) < CACHE_TTL) {
    return dataCache[cacheKey].data;
  }
  
  try {
    // For now, simulate data as this would normally be fetched from the API
    // In production, this would call the actual Land Registry Price Paid API
    const data = simulatePricePaidData(area);
    
    // Cache the data
    dataCache[cacheKey] = {
      data,
      timestamp: Date.now()
    };
    
    return data;
  } catch (error) {
    console.error('Error fetching Land Registry price paid data:', error);
    throw error;
  }
}

/**
 * Get user-contributed rental data from our database
 */
export async function getUserContributedRentalData(
  filters: { 
    area?: string; 
    propertyType?: string; 
    bedrooms?: number;
    postcode?: string;
  } = {}
) {
  try {
    let query = db.select().from(contributedRentalData);
    
    // Apply filters
    if (filters.area) {
      query = query.where(eq(contributedRentalData.postcode, filters.area));
      // Note: The postcode is used instead of area since the area is extracted from the postcode
    }
    
    if (filters.propertyType) {
      query = query.where(eq(contributedRentalData.propertyType, filters.propertyType));
    }
    
    if (filters.bedrooms !== undefined) {
      query = query.where(eq(contributedRentalData.bedrooms, filters.bedrooms));
    }
    
    if (filters.postcode) {
      // Use LIKE for partial postcode matching
      query = query.where(contributedRentalData.postcode.like(`%${filters.postcode}%`));
    }
    
    const results = await query;
    return results;
  } catch (error) {
    console.error('Error fetching user-contributed rental data:', error);
    throw error;
  }
}

/**
 * Store user-contributed rental data
 */
export async function storeUserContributedRentalData(data: any) {
  try {
    // Insert the rental data into the database
    const result = await db.insert(contributedRentalData).values({
      userId: data.userId || null,
      postcode: data.postcode,
      area: data.area || extractAreaFromPostcode(data.postcode),
      propertyType: data.propertyType,
      bedrooms: data.bedrooms,
      monthlyRent: data.monthlyRent,
      billsIncluded: data.billsIncluded || false,
      isAnonymous: data.isAnonymous !== false, // Default to true
      notes: data.notes || null,
      createdAt: new Date(),
    });
    
    // Update area statistics based on new data
    await updateAreaStatistics(data.area || extractAreaFromPostcode(data.postcode));
    
    return { success: true, id: result.insertId };
  } catch (error) {
    console.error('Error storing user-contributed rental data:', error);
    throw error;
  }
}

/**
 * Update area statistics based on rental data
 */
async function updateAreaStatistics(area: string) {
  try {
    // Get all rental data for this area
    const areaRentalData = await getUserContributedRentalData({ area });
    
    if (areaRentalData.length === 0) {
      return;
    }
    
    // Calculate average rents
    const totalRent = areaRentalData.reduce((sum, item) => sum + item.monthlyRent, 0);
    const averageRent = totalRent / areaRentalData.length;
    
    // Calculate average by property type
    const byPropertyType: Record<string, { total: number, count: number }> = {};
    areaRentalData.forEach(item => {
      if (!byPropertyType[item.propertyType]) {
        byPropertyType[item.propertyType] = { total: 0, count: 0 };
      }
      byPropertyType[item.propertyType].total += item.monthlyRent;
      byPropertyType[item.propertyType].count += 1;
    });
    
    const propertyTypeAverages = Object.entries(byPropertyType).map(([type, data]) => ({
      type,
      averageRent: data.total / data.count
    }));
    
    // Check if we already have stats for this area
    const existingStats = await db.select().from(areaStats).where(eq(areaStats.area, area));
    
    if (existingStats.length > 0) {
      // Update existing stats
      await db.update(areaStats)
        .set({
          averageRent,
          propertyTypeAverages: JSON.stringify(propertyTypeAverages),
          dataPointCount: areaRentalData.length,
          updatedAt: new Date()
        })
        .where(eq(areaStats.area, area));
    } else {
      // Insert new stats
      await db.insert(areaStats).values({
        area,
        averageRent,
        propertyTypeAverages: JSON.stringify(propertyTypeAverages),
        dataPointCount: areaRentalData.length,
        updatedAt: new Date()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error updating area statistics:', error);
    throw error;
  }
}

/**
 * Get area statistics
 */
export async function getAreaStatistics(area?: string) {
  try {
    if (area) {
      return await db.select().from(areaStats).where(eq(areaStats.area, area));
    } else {
      return await db.select().from(areaStats);
    }
  } catch (error) {
    console.error('Error fetching area statistics:', error);
    throw error;
  }
}

/**
 * Extract area from postcode (simplified version)
 * In production, this would use a proper geocoding service
 */
function extractAreaFromPostcode(postcode: string): string {
  // This is a simplified version - in production would use a proper postcode database
  const postcodePrefix = postcode.trim().split(' ')[0];
  
  // Map common postcode prefixes to areas (very simplified)
  const areaMappings: Record<string, string> = {
    'N': 'North London',
    'NW': 'North West London',
    'W': 'West London',
    'SW': 'South West London',
    'SE': 'South East London',
    'E': 'East London',
    'EC': 'East Central London',
    'WC': 'West Central London',
    'M': 'Manchester',
    'B': 'Birmingham',
    'L': 'Liverpool',
    'G': 'Glasgow',
    'EH': 'Edinburgh',
    'CF': 'Cardiff',
    'BS': 'Bristol',
    'LS': 'Leeds',
    'S': 'Sheffield',
    'NG': 'Nottingham'
  };
  
  for (const [prefix, area] of Object.entries(areaMappings)) {
    if (postcodePrefix.startsWith(prefix)) {
      return area;
    }
  }
  
  // Default fallback
  return 'Other';
}

// Simulation functions for development without API access
// These would be replaced with actual API calls in production

function simulateUkHpiData(region: string) {
  // Simulate UK HPI data structure
  const areas = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Edinburgh'];
  const data = {
    region,
    date: new Date().toISOString().split('T')[0],
    data: areas.map(area => ({
      area,
      averagePrice: Math.round(150000 + Math.random() * 450000),
      detachedPrice: Math.round(250000 + Math.random() * 550000),
      semiDetachedPrice: Math.round(200000 + Math.random() * 350000),
      terracedPrice: Math.round(180000 + Math.random() * 250000),
      flatPrice: Math.round(120000 + Math.random() * 200000),
      annualChange: (Math.random() * 10 - 3).toFixed(1), // -3% to +7%
      monthlyChange: (Math.random() * 2 - 0.5).toFixed(1), // -0.5% to +1.5%
    }))
  };
  
  return data;
}

function simulateOnsRentalData(region: string) {
  // Simulate ONS rental data structure
  const areas = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Edinburgh'];
  const data = {
    region,
    date: new Date().toISOString().split('T')[0],
    data: areas.map(area => ({
      area,
      medianRent: Math.round(800 + Math.random() * 1200),
      lowerQuartileRent: Math.round(600 + Math.random() * 600),
      upperQuartileRent: Math.round(1100 + Math.random() * 1400),
      oneBedroomRent: Math.round(600 + Math.random() * 700),
      twoBedroomRent: Math.round(800 + Math.random() * 900),
      threeBedroomRent: Math.round(1000 + Math.random() * 1200),
      fourPlusBedroomRent: Math.round(1300 + Math.random() * 1700),
      annualChange: (Math.random() * 8 - 1).toFixed(1), // -1% to +7%
    }))
  };
  
  return data;
}

function simulatePricePaidData(area: string) {
  // Simulate Land Registry price paid data structure
  const propertyTypes = ['detached', 'semi-detached', 'terraced', 'flat'];
  const transactions = [];
  
  // Generate 20-30 random transactions
  const transactionCount = Math.floor(20 + Math.random() * 10);
  
  for (let i = 0; i < transactionCount; i++) {
    const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    const price = Math.round((
      propertyType === 'detached' ? 300000 + Math.random() * 500000 :
      propertyType === 'semi-detached' ? 220000 + Math.random() * 300000 :
      propertyType === 'terraced' ? 180000 + Math.random() * 250000 :
      120000 + Math.random() * 200000 // flat
    ));
    
    transactions.push({
      transactionId: `TX${Math.floor(Math.random() * 1000000)}`,
      propertyType,
      price,
      date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random date in last 90 days
      address: `${Math.floor(Math.random() * 100) + 1} Test Street, ${area}`,
      postcode: `${area.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 10)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`
    });
  }
  
  return {
    area,
    count: transactions.length,
    transactions
  };
}

/**
 * Collect all market data for a dashboard view
 */
export async function collectMarketDashboardData(
  filters: { 
    area?: string; 
    propertyType?: string; 
    bedrooms?: number;
  } = {}
) {
  try {
    // Collect data from multiple sources
    const [
      hpiData,
      onsRentalData,
      userContributedData,
      areaStatistics
    ] = await Promise.all([
      getUkHousePriceIndex(filters.area === 'all' ? 'england' : filters.area),
      getOnsRentalData(filters.area === 'all' ? 'england' : filters.area),
      getUserContributedRentalData(filters),
      getAreaStatistics()
    ]);
    
    // Process and combine the data
    const dashboard = processDashboardData(
      hpiData, 
      onsRentalData, 
      userContributedData, 
      areaStatistics,
      filters
    );
    
    return dashboard;
  } catch (error) {
    console.error('Error collecting market dashboard data:', error);
    throw error;
  }
}

/**
 * Process and combine data from multiple sources into a unified dashboard format
 */
function processDashboardData(
  hpiData: any, 
  onsRentalData: any, 
  userContributedData: any, 
  areaStatistics: any,
  filters: any
) {
  // Process property type data
  const propertyTypes = [
    { type: 'flat', label: 'Flat/Apartment' },
    { type: 'terraced', label: 'Terraced' },
    { type: 'semi-detached', label: 'Semi-Detached' },
    { type: 'detached', label: 'Detached' }
  ].map(pt => {
    // Find sale price for this property type
    const salePrice = hpiData.data.reduce((avg, area) => {
      const price = pt.type === 'flat' ? area.flatPrice :
                     pt.type === 'terraced' ? area.terracedPrice :
                     pt.type === 'semi-detached' ? area.semiDetachedPrice :
                     area.detachedPrice;
      return avg + (price / hpiData.data.length);
    }, 0);
    
    // Find rental data for this property type
    const rentData = userContributedData.filter(d => d.propertyType === pt.type);
    const rentAvg = rentData.length > 0
      ? rentData.reduce((sum, d) => sum + d.monthlyRent, 0) / rentData.length
      : null;
    
    return {
      type: pt.type,
      label: pt.label,
      averageSalePrice: salePrice,
      averageRent: rentAvg,
      dataPoints: rentData.length
    };
  });
  
  // Process area data
  const areaData = hpiData.data.map(area => {
    // Find matching ONS data
    const onsArea = onsRentalData.data.find(a => a.area === area.area);
    
    // Find matching user data
    const userData = userContributedData.filter(d => 
      d.area && d.area.toLowerCase().includes(area.area.toLowerCase())
    );
    
    const userRentAvg = userData.length > 0
      ? userData.reduce((sum, d) => sum + d.monthlyRent, 0) / userData.length
      : null;
    
    return {
      name: area.area,
      averageSalePrice: area.averagePrice,
      // Use user-contributed data if available, otherwise fallback to ONS
      averageRent: userRentAvg || (onsArea ? onsArea.medianRent : null),
      rentalYield: (userRentAvg || (onsArea ? onsArea.medianRent : 0)) * 12 / area.averagePrice * 100,
      saleTrend: getSaleTrend(parseFloat(area.annualChange)),
      rentTrend: onsArea ? getRentTrend(parseFloat(onsArea.annualChange)) : 'unknown',
    };
  });
  
  // Calculate overall stats
  const overallStats = {
    averageSalePrice: hpiData.data.reduce((sum, area) => sum + area.averagePrice, 0) / hpiData.data.length,
    averageRent: onsRentalData.data.reduce((sum, area) => sum + area.medianRent, 0) / onsRentalData.data.length,
    rentalYield: (onsRentalData.data.reduce((sum, area) => sum + area.medianRent, 0) / onsRentalData.data.length) * 12 / (hpiData.data.reduce((sum, area) => sum + area.averagePrice, 0) / hpiData.data.length) * 100,
    userContributionCount: userContributedData.length,
    trendingSaleAreas: getTrendingAreas(hpiData.data, 'sale'),
    trendingRentalAreas: getTrendingAreas(onsRentalData.data, 'rental')
  };
  
  return {
    overallStats,
    propertyTypes,
    areaBreakdown: areaData
  };
}

/**
 * Determine sale price trend based on annual change
 */
function getSaleTrend(annualChange: number): string {
  if (annualChange > 5) return 'rising_fast';
  if (annualChange > 1) return 'rising';
  if (annualChange > -1) return 'stable';
  if (annualChange > -5) return 'falling';
  return 'falling_fast';
}

/**
 * Determine rental price trend based on annual change
 */
function getRentTrend(annualChange: number): string {
  if (annualChange > 4) return 'rising_fast';
  if (annualChange > 1) return 'rising';
  if (annualChange > -1) return 'stable';
  if (annualChange > -4) return 'falling';
  return 'falling_fast';
}

/**
 * Get trending areas based on price changes
 */
function getTrendingAreas(data: any[], type: 'sale' | 'rental') {
  if (!data || data.length === 0) return [];
  
  // Sort areas by annual change
  const sortedAreas = [...data].sort((a, b) => {
    const changeA = type === 'sale' ? parseFloat(a.annualChange) : parseFloat(a.annualChange);
    const changeB = type === 'sale' ? parseFloat(b.annualChange) : parseFloat(b.annualChange);
    return changeB - changeA; // Descending order
  });
  
  // Return top 3 trending areas
  return sortedAreas.slice(0, 3).map(area => ({
    name: area.area,
    averagePrice: type === 'sale' ? area.averagePrice : undefined,
    averageRent: type === 'rental' ? area.medianRent : undefined,
    trend: parseFloat(area.annualChange) > 4 ? 'rising_fast' : 'rising'
  }));
}