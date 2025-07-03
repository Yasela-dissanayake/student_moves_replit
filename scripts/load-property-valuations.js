/**
 * Script to load property valuation data for existing properties
 * This will add detailed financial and market data for properties
 * Run with: node scripts/load-property-valuations.js
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create property valuations for existing properties
async function loadPropertyValuations() {
  console.log('Loading property valuation data...');
  try {
    // Get all properties that don't have valuation data yet
    const propertiesResult = await pool.query(`
      SELECT p.id, p.title, p.address, p.rent, p.city
      FROM properties p
      LEFT JOIN property_valuations pv ON p.id = pv.property_id
      WHERE pv.id IS NULL
    `);
    
    const properties = propertiesResult.rows;
    console.log(`Found ${properties.length} properties without valuation data`);
    
    if (properties.length === 0) {
      console.log('All properties already have valuation data');
      return;
    }
    
    // Check if the valuations table exists
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS property_valuations (
          id SERIAL PRIMARY KEY,
          property_id INTEGER REFERENCES properties(id),
          purchase_price DECIMAL,
          current_value DECIMAL,
          last_valuation_date DATE,
          rental_yield DECIMAL,
          comparable_properties JSONB,
          improvement_opportunities JSONB,
          historical_values JSONB,
          market_trends JSONB,
          value_factors JSONB,
          mortgage_details JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Property valuations table exists or was created');
    } catch (error) {
      console.error('Error checking or creating property_valuations table:', error);
      return;
    }
    
    for (const property of properties) {
      // Generate property valuation data
      const valuation = generateValuationData(property);
      
      try {
        await pool.query(
          `INSERT INTO property_valuations (
            property_id, purchase_price, current_value, last_valuation_date,
            rental_yield, comparable_properties, improvement_opportunities,
            historical_values, market_trends, value_factors, mortgage_details
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            property.id, valuation.purchasePrice, valuation.currentValue,
            valuation.lastValuationDate, valuation.rentalYield,
            JSON.stringify(valuation.comparableProperties),
            JSON.stringify(valuation.improvementOpportunities),
            JSON.stringify(valuation.historicalValues),
            JSON.stringify(valuation.marketTrends),
            JSON.stringify(valuation.valueFactors),
            JSON.stringify(valuation.mortgageDetails)
          ]
        );
        
        console.log(`Added valuation data for property: ${property.title} (${property.address})`);
      } catch (error) {
        console.error(`Error adding valuation data for property ${property.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error('Error loading property valuations:', error);
  }
}

// Helper function to generate realistic valuation data
function generateValuationData(property) {
  // Base purchase price depends on city
  const cityPriceMap = {
    'Leeds': { base: 200000, range: 150000 },
    'Manchester': { base: 250000, range: 200000 },
    'Birmingham': { base: 220000, range: 180000 },
    'London': { base: 450000, range: 300000 },
    'Edinburgh': { base: 280000, range: 200000 }
  };
  
  const cityData = cityPriceMap[property.city] || { base: 200000, range: 150000 };
  
  // Generate purchase price
  const purchasePrice = Math.round((cityData.base + Math.random() * cityData.range) / 5000) * 5000;
  
  // Calculate monthly rent in numerical form
  const monthlyRent = parseFloat(property.rent) * 12;
  
  // Generate current value with appreciation
  const appreciationFactor = 1 + (Math.random() * 0.25 + 0.05); // 5-30% appreciation
  const currentValue = Math.round(purchasePrice * appreciationFactor / 5000) * 5000;
  
  // Calculate rental yield
  const rentalYield = parseFloat(((monthlyRent / currentValue) * 100).toFixed(2));
  
  // Generate last valuation date
  const lastValuationDate = generateRecentDate();
  
  // Generate historical values
  const historicalValues = [];
  let historicalDate = new Date();
  let historicalValue = currentValue;
  
  for (let i = 0; i < 5; i++) {
    historicalDate.setFullYear(historicalDate.getFullYear() - 1);
    historicalValue = Math.round(historicalValue / (1 + Math.random() * 0.08 + 0.02) / 1000) * 1000;
    
    historicalValues.push({
      date: new Date(historicalDate).toISOString().split('T')[0],
      value: historicalValue
    });
  }
  
  // Generate comparable properties
  const comparableProperties = [];
  for (let i = 0; i < 3; i++) {
    comparableProperties.push({
      address: generateNearbyAddress(property.address),
      soldPrice: Math.round((currentValue * (0.9 + Math.random() * 0.2)) / 1000) * 1000,
      soldDate: generateRecentDate(365),
      bedrooms: Math.floor(Math.random() * 3) + 1,
      bathrooms: Math.floor(Math.random() * 2) + 1,
      squareFootage: Math.floor(Math.random() * 500) + 600
    });
  }
  
  // Generate improvement opportunities
  const improvementTypes = [
    { type: 'Kitchen renovation', costFactor: 0.05, valueFactor: 0.08 },
    { type: 'Bathroom renovation', costFactor: 0.04, valueFactor: 0.06 },
    { type: 'Loft conversion', costFactor: 0.15, valueFactor: 0.2 },
    { type: 'Extension', costFactor: 0.2, valueFactor: 0.25 },
    { type: 'Garden landscaping', costFactor: 0.02, valueFactor: 0.03 },
    { type: 'Energy efficiency upgrade', costFactor: 0.03, valueFactor: 0.04 },
    { type: 'New windows', costFactor: 0.03, valueFactor: 0.04 },
    { type: 'Smart home integration', costFactor: 0.02, valueFactor: 0.03 },
    { type: 'New flooring', costFactor: 0.02, valueFactor: 0.03 },
    { type: 'Exterior painting/rendering', costFactor: 0.01, valueFactor: 0.02 }
  ];
  
  const selectedImprovements = [];
  const improvementCount = Math.floor(Math.random() * 3) + 1; // 1-3 improvements
  
  for (let i = 0; i < improvementCount; i++) {
    const improvement = improvementTypes[Math.floor(Math.random() * improvementTypes.length)];
    const estimatedCost = Math.round((currentValue * improvement.costFactor) / 100) * 100;
    const estimatedValueIncrease = Math.round((currentValue * improvement.valueFactor) / 100) * 100;
    
    selectedImprovements.push({
      type: improvement.type,
      estimatedCost,
      estimatedValueIncrease,
      roi: parseFloat(((estimatedValueIncrease / estimatedCost) * 100 - 100).toFixed(1))
    });
  }
  
  // Generate market trends
  const marketTrends = {
    areaGrowth: {
      oneYear: parseFloat((Math.random() * 6 + 2).toFixed(1)),
      threeYear: parseFloat((Math.random() * 15 + 8).toFixed(1)),
      fiveYear: parseFloat((Math.random() * 25 + 15).toFixed(1))
    },
    localDemand: Math.floor(Math.random() * 100),
    averageDaysOnMarket: Math.floor(Math.random() * 30) + 15,
    pricePerSquareFoot: Math.floor(Math.random() * 100) + 200,
    affordabilityIndex: parseFloat((Math.random() * 5 + 5).toFixed(1)),
    rentalDemand: Math.floor(Math.random() * 30) + 70
  };
  
  // Generate value factors
  const valueFactors = {
    location: {
      score: Math.floor(Math.random() * 30) + 70,
      impact: 'high',
      notes: 'Proximity to university and local amenities adds significant value'
    },
    propertyCondition: {
      score: Math.floor(Math.random() * 40) + 60,
      impact: 'medium',
      notes: 'Overall good condition with some modernization opportunities'
    },
    transportLinks: {
      score: Math.floor(Math.random() * 30) + 70,
      impact: 'medium',
      notes: 'Good bus connections and walking distance to train station'
    },
    schools: {
      score: Math.floor(Math.random() * 50) + 50,
      impact: 'low',
      notes: 'Several good schools in the catchment area'
    },
    localAmenities: {
      score: Math.floor(Math.random() * 30) + 70,
      impact: 'medium',
      notes: 'Good selection of shops, restaurants and parks nearby'
    }
  };
  
  // Generate mortgage details (if applicable)
  const mortgageDetails = {
    originalAmount: Math.round(purchasePrice * 0.75 / 1000) * 1000,
    currentBalance: Math.round(purchasePrice * 0.75 * (0.7 + Math.random() * 0.2) / 1000) * 1000,
    interestRate: parseFloat((Math.random() * 2 + 3).toFixed(2)),
    monthlyPayment: Math.round((purchasePrice * 0.75 * (0.04 + Math.random() * 0.01)) / 12 / 10) * 10,
    term: 25,
    lender: generateLenderName(),
    fixedUntil: generateFutureDate(365 * 2),
    ltv: parseFloat(((Math.random() * 15 + 65).toFixed(1)))
  };
  
  return {
    purchasePrice,
    currentValue,
    lastValuationDate,
    rentalYield,
    comparableProperties,
    improvementOpportunities: selectedImprovements,
    historicalValues,
    marketTrends,
    valueFactors,
    mortgageDetails
  };
}

// Helper function to generate a nearby address
function generateNearbyAddress(address) {
  const streetNumbers = [1, 2, 3, 5, 7, 8, 9, 10, 11, 12, 15, 17, 20, 22, 25, 27, 30];
  const streetNames = [
    'Park Avenue', 'Church Street', 'Victoria Road', 'Station Road', 'Main Street',
    'High Street', 'Windsor Road', 'Queens Road', 'Albert Street', 'King Street',
    'Manor Road', 'The Grove', 'Springfield Road', 'Mill Lane', 'School Lane'
  ];
  
  // Extract existing city and postcode if possible
  const addressParts = address.split(',');
  const existingCity = addressParts.length > 1 ? addressParts[addressParts.length - 2].trim() : '';
  const existingPostcode = addressParts.length > 0 ? addressParts[addressParts.length - 1].trim() : '';
  
  // Generate new address
  const newNumber = streetNumbers[Math.floor(Math.random() * streetNumbers.length)];
  const newStreet = streetNames[Math.floor(Math.random() * streetNames.length)];
  
  return `${newNumber} ${newStreet}, ${existingCity}, ${existingPostcode}`;
}

// Helper function to generate a recent date
function generateRecentDate(maxDaysAgo = 180) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * maxDaysAgo));
  return date.toISOString().split('T')[0];
}

// Helper function to generate a future date
function generateFutureDate(maxDaysAhead = 180) {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * maxDaysAhead) + 30); // At least 30 days in future
  return date.toISOString().split('T')[0];
}

// Helper function to generate a lender name
function generateLenderName() {
  const lenders = [
    'Nationwide', 'Halifax', 'Barclays', 'NatWest', 'Santander',
    'HSBC', 'Lloyds Bank', 'Yorkshire Building Society', 'Virgin Money',
    'TSB', 'Coventry Building Society', 'Metro Bank'
  ];
  
  return lenders[Math.floor(Math.random() * lenders.length)];
}

// Main function
async function main() {
  try {
    await loadPropertyValuations();
    console.log('Property valuation data loading completed successfully!');
  } catch (error) {
    console.error('Error loading property valuation data:', error);
  } finally {
    await pool.end();
  }
}

// Start execution
main();