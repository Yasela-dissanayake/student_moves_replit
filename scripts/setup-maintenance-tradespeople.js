/**
 * Script to set up the maintenance requests and tradespeople system
 * This includes Check Traders integration for finding verified tradespeople
 * Run with: node scripts/setup-maintenance-tradespeople.js
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Set up the necessary database tables
async function setupTables() {
  console.log('Setting up maintenance and tradespeople tables...');
  try {
    // Create tradespeople table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tradespeople (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        business_name TEXT,
        phone TEXT UNIQUE,
        email TEXT,
        specialty TEXT NOT NULL,
        rating DECIMAL,
        hourly_rate DECIMAL,
        fixed_rates JSONB,
        service_areas JSONB,
        check_trader_verified BOOLEAN DEFAULT FALSE,
        check_trader_id TEXT,
        check_trader_url TEXT,
        insurance_certified BOOLEAN DEFAULT FALSE,
        insurance_expiry DATE,
        qualifications JSONB,
        available_hours JSONB,
        profile_image TEXT,
        gallery_images JSONB,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create maintenance_tradespeople link table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS maintenance_tradespeople (
        id SERIAL PRIMARY KEY,
        maintenance_id INTEGER REFERENCES maintenance_requests(id),
        tradesperson_id INTEGER REFERENCES tradespeople(id),
        is_assigned BOOLEAN DEFAULT FALSE,
        available_dates JSONB,
        quoted_price TEXT,
        quote_details TEXT,
        response_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create maintenance_appointments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS maintenance_appointments (
        id SERIAL PRIMARY KEY,
        maintenance_id INTEGER REFERENCES maintenance_requests(id),
        tradesperson_id INTEGER REFERENCES tradespeople(id),
        appointment_date DATE,
        appointment_time TEXT,
        duration INTEGER, -- minutes
        status TEXT,
        notes TEXT,
        reminder_sent BOOLEAN DEFAULT FALSE,
        reminder_time TIMESTAMP,
        follow_up_scheduled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create check_trader_verifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS check_trader_verifications (
        id SERIAL PRIMARY KEY,
        tradesperson_id INTEGER REFERENCES tradespeople(id),
        verification_date DATE,
        verification_details JSONB,
        verification_score INTEGER,
        review_count INTEGER,
        verification_expiry DATE,
        verification_status TEXT,
        last_checked_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Make sure maintenance_requests table has required fields
    await pool.query(`
      ALTER TABLE IF EXISTS maintenance_requests
      ADD COLUMN IF NOT EXISTS issue_type TEXT,
      ADD COLUMN IF NOT EXISTS tradesperson_notes TEXT,
      ADD COLUMN IF NOT EXISTS tradesperson_requirements TEXT,
      ADD COLUMN IF NOT EXISTS preferred_appointment_dates JSONB,
      ADD COLUMN IF NOT EXISTS emergency BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS check_trader_search_results JSONB
    `);
    
    console.log('Maintenance and tradespeople tables set up successfully');
  } catch (error) {
    console.error('Error setting up tables:', error);
  }
}

// Create sample tradespeople with Check Trader verification
async function createSampleTradespeople() {
  console.log('Creating sample tradespeople...');
  try {
    const tradespeople = [
      {
        name: 'Michael Johnson',
        businessName: 'Mike\'s Plumbing Solutions',
        phone: '07700900111',
        email: 'mike@plumbingsolutions.example.com',
        specialty: 'plumbing',
        rating: 4.8,
        hourlyRate: 45,
        serviceAreas: ['Leeds', 'Bradford', 'Wakefield'],
        checkTraderVerified: true,
        checkTraderId: 'CT12345678',
        checkTraderUrl: 'https://www.checkatrade.com/trades/MikesPlumbingSolutions',
        insuranceCertified: true,
        insuranceExpiry: '2026-05-15',
        qualifications: ['City & Guilds Plumbing Level 3', 'Water Regulations Certificate'],
        description: 'Experienced plumber specializing in all aspects of domestic plumbing. Fast, reliable service with no call-out fees.'
      },
      {
        name: 'Sarah Williams',
        businessName: 'Williams Electrical Services',
        phone: '07700900222',
        email: 'sarah@williamselectrical.example.com',
        specialty: 'electrical',
        rating: 4.9,
        hourlyRate: 50,
        serviceAreas: ['Manchester', 'Salford', 'Bolton'],
        checkTraderVerified: true,
        checkTraderId: 'CT23456789',
        checkTraderUrl: 'https://www.checkatrade.com/trades/WilliamsElectricalServices',
        insuranceCertified: true,
        insuranceExpiry: '2026-07-20',
        qualifications: ['City & Guilds Electrical Installation Level 3', '18th Edition Wiring Regulations'],
        description: 'NICEIC approved electrician providing high-quality electrical services. Specializing in rewiring, fault finding, and electrical installations.'
      },
      {
        name: 'David Chen',
        businessName: 'Chen Heating Solutions',
        phone: '07700900333',
        email: 'david@chenheating.example.com',
        specialty: 'heating',
        rating: 4.7,
        hourlyRate: 55,
        serviceAreas: ['Birmingham', 'Solihull', 'Sutton Coldfield'],
        checkTraderVerified: true,
        checkTraderId: 'CT34567890',
        checkTraderUrl: 'https://www.checkatrade.com/trades/ChenHeatingSolutions',
        insuranceCertified: true,
        insuranceExpiry: '2026-03-10',
        qualifications: ['Gas Safe Registered', 'Heating Engineer Certification'],
        description: 'Gas Safe registered heating engineer with over 15 years of experience. Specializing in boiler installations, servicing, and repairs.'
      },
      {
        name: 'Emma Davis',
        businessName: 'Davis Property Maintenance',
        phone: '07700900444',
        email: 'emma@davisproperties.example.com',
        specialty: 'general maintenance',
        rating: 4.6,
        hourlyRate: 40,
        serviceAreas: ['Leeds', 'York', 'Harrogate'],
        checkTraderVerified: true,
        checkTraderId: 'CT45678901',
        checkTraderUrl: 'https://www.checkatrade.com/trades/DavisPropertyMaintenance',
        insuranceCertified: true,
        insuranceExpiry: '2026-08-25',
        qualifications: ['Property Maintenance NVQ Level 3', 'Health and Safety Certification'],
        description: 'Comprehensive property maintenance services for landlords and homeowners. From fixing leaks to complete renovations.'
      },
      {
        name: 'James Wilson',
        businessName: 'Wilson\'s Locksmith Services',
        phone: '07700900555',
        email: 'james@wilsonlocksmith.example.com',
        specialty: 'locksmith',
        rating: 4.9,
        hourlyRate: 45,
        serviceAreas: ['Manchester', 'Stockport', 'Trafford'],
        checkTraderVerified: true,
        checkTraderId: 'CT56789012',
        checkTraderUrl: 'https://www.checkatrade.com/trades/WilsonsLocksmithServices',
        insuranceCertified: true,
        insuranceExpiry: '2026-06-15',
        qualifications: ['Master Locksmith Association Member', 'Advanced Lock Mechanisms Certification'],
        description: '24/7 emergency locksmith service. Specializing in lock installations, repairs, and emergency lockouts.'
      },
      {
        name: 'Olivia Patel',
        businessName: 'Patel Roofing Specialists',
        phone: '07700900666',
        email: 'olivia@patelroofing.example.com',
        specialty: 'roofing',
        rating: 4.8,
        hourlyRate: 60,
        serviceAreas: ['Birmingham', 'Coventry', 'Wolverhampton'],
        checkTraderVerified: true,
        checkTraderId: 'CT67890123',
        checkTraderUrl: 'https://www.checkatrade.com/trades/PatelRoofingSpecialists',
        insuranceCertified: true,
        insuranceExpiry: '2026-04-20',
        qualifications: ['Roofing NVQ Level 3', 'Height Safety Certification'],
        description: 'Professional roofing services including repairs, replacements, and maintenance. Free no-obligation quotes.'
      },
      {
        name: 'Thomas Brown',
        businessName: 'Brown\'s Painting & Decorating',
        phone: '07700900777',
        email: 'thomas@brownsdecorating.example.com',
        specialty: 'decoration',
        rating: 4.7,
        hourlyRate: 35,
        serviceAreas: ['Leeds', 'Wakefield', 'Huddersfield'],
        checkTraderVerified: true,
        checkTraderId: 'CT78901234',
        checkTraderUrl: 'https://www.checkatrade.com/trades/BrownsPaintingDecorating',
        insuranceCertified: true,
        insuranceExpiry: '2026-05-10',
        qualifications: ['Painting & Decorating NVQ Level 3', 'Wallpaper Installation Certificate'],
        description: 'Quality painting and decorating services for residential and commercial properties. Attention to detail and clean, professional work.'
      },
      {
        name: 'Rebecca Singh',
        businessName: 'Singh Carpentry Services',
        phone: '07700900888',
        email: 'rebecca@singhcarpentry.example.com',
        specialty: 'carpentry',
        rating: 4.9,
        hourlyRate: 45,
        serviceAreas: ['Manchester', 'Oldham', 'Bury'],
        checkTraderVerified: true,
        checkTraderId: 'CT89012345',
        checkTraderUrl: 'https://www.checkatrade.com/trades/SinghCarpentryServices',
        insuranceCertified: true,
        insuranceExpiry: '2026-07-05',
        qualifications: ['Carpentry & Joinery NVQ Level 3', 'Advanced Wood Craftsmanship'],
        description: 'Bespoke carpentry services including furniture making, fitted wardrobes, and general woodwork. Craftsmanship guaranteed.'
      }
    ];
    
    for (const person of tradespeople) {
      // Check if tradesperson already exists
      const existingPerson = await pool.query(
        'SELECT * FROM tradespeople WHERE phone = $1',
        [person.phone]
      );
      
      if (existingPerson.rows.length > 0) {
        console.log(`Tradesperson ${person.name} already exists, updating...`);
        
        await pool.query(
          `UPDATE tradespeople
           SET name = $1, business_name = $2, email = $3, specialty = $4,
               rating = $5, hourly_rate = $6, service_areas = $7,
               check_trader_verified = $8, check_trader_id = $9,
               check_trader_url = $10, insurance_certified = $11,
               insurance_expiry = $12, qualifications = $13,
               description = $14, updated_at = CURRENT_TIMESTAMP
           WHERE phone = $15`,
          [
            person.name, person.businessName, person.email, person.specialty,
            person.rating, person.hourlyRate, JSON.stringify(person.serviceAreas),
            person.checkTraderVerified, person.checkTraderId,
            person.checkTraderUrl, person.insuranceCertified,
            person.insuranceExpiry, JSON.stringify(person.qualifications),
            person.description, person.phone
          ]
        );
      } else {
        console.log(`Creating new tradesperson: ${person.name}`);
        
        const result = await pool.query(
          `INSERT INTO tradespeople (
             name, business_name, phone, email, specialty,
             rating, hourly_rate, service_areas,
             check_trader_verified, check_trader_id, check_trader_url,
             insurance_certified, insurance_expiry, qualifications,
             description
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           RETURNING id`,
          [
            person.name, person.businessName, person.phone, person.email,
            person.specialty, person.rating, person.hourlyRate,
            JSON.stringify(person.serviceAreas), person.checkTraderVerified,
            person.checkTraderId, person.checkTraderUrl,
            person.insuranceCertified, person.insuranceExpiry,
            JSON.stringify(person.qualifications), person.description
          ]
        );
        
        const tradespersonId = result.rows[0].id;
        
        // Add Check Trader verification details
        await pool.query(
          `INSERT INTO check_trader_verifications (
             tradesperson_id, verification_date, verification_score,
             review_count, verification_expiry, verification_status,
             last_checked_date
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            tradespersonId, '2025-01-15', Math.floor(Math.random() * 20) + 80,
            Math.floor(Math.random() * 100) + 50, '2026-01-15', 'verified',
            new Date()
          ]
        );
      }
    }
    
    console.log('Sample tradespeople created/updated successfully');
  } catch (error) {
    console.error('Error creating sample tradespeople:', error);
  }
}

// Set up the Check Traders integration API endpoint
async function setupCheckTradersIntegration() {
  // This would typically create API configuration, but for now we'll
  // set up a mock script that will simulate Check Traders API responses
  
  console.log('Setting up Check Traders integration...');
  
  const checkTradersApiHandlerCode = `/**
 * Mock Check Traders API Handler
 * This would be replaced with actual API integration in a production environment
 */

// Simulate searching for Check Traders verified tradespeople
export async function searchCheckTradersPeople(issueType, location, radius = 10) {
  try {
    // In a real implementation, this would make an API call to Check Traders
    // For now, we'll fetch from our local database and simulate API behavior
    
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Map issue type to specialty
    const specialtyMap = {
      'plumbing': 'plumbing',
      'electrical': 'electrical',
      'heating': 'heating',
      'general': 'general maintenance',
      'locksmith': 'locksmith',
      'roofing': 'roofing',
      'decoration': 'decoration',
      'carpentry': 'carpentry',
      'mold/damp': 'general maintenance',
      'pest control': 'pest control',
      'appliance': 'appliance repair',
      'garden': 'landscaping'
    };
    
    const specialty = specialtyMap[issueType] || issueType;
    
    // Query our local database for matching tradespeople
    const result = await pool.query(
      \`SELECT t.*, ct.verification_score, ct.review_count 
       FROM tradespeople t
       LEFT JOIN check_trader_verifications ct ON t.id = ct.tradesperson_id
       WHERE t.check_trader_verified = true
       AND t.specialty = $1
       AND t.service_areas @> $2
       ORDER BY t.rating DESC, ct.verification_score DESC
       LIMIT 5\`,
      [specialty, JSON.stringify([location])]
    );
    
    // Simulate API response format
    return {
      success: true,
      results: result.rows.map(person => ({
        id: person.check_trader_id,
        name: person.name,
        business_name: person.business_name,
        specialty: person.specialty,
        phone: person.phone,
        email: person.email,
        rating: person.rating,
        verification_score: person.verification_score,
        review_count: person.review_count,
        hourly_rate: person.hourly_rate,
        url: person.check_trader_url,
        insurance_certified: person.insurance_certified,
        qualifications: person.qualifications
      })),
      location: location,
      radius: radius,
      count: result.rows.length
    };
  } catch (error) {
    console.error('Error in Check Traders search:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Simulate getting Check Trader verification details
export async function getCheckTraderVerification(checkTraderId) {
  try {
    // In a real implementation, this would make an API call to Check Traders
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const result = await pool.query(
      \`SELECT t.*, ct.*
       FROM tradespeople t
       LEFT JOIN check_trader_verifications ct ON t.id = ct.tradesperson_id
       WHERE t.check_trader_id = $1\`,
      [checkTraderId]
    );
    
    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Verification not found'
      };
    }
    
    const person = result.rows[0];
    
    // Simulate API response format
    return {
      success: true,
      verification: {
        id: person.check_trader_id,
        business_name: person.business_name,
        verification_date: person.verification_date,
        verification_score: person.verification_score,
        review_count: person.review_count,
        verification_expiry: person.verification_expiry,
        verification_status: person.verification_status,
        last_checked_date: person.last_checked_date,
        qualifications: person.qualifications,
        insurance_certified: person.insurance_certified,
        insurance_expiry: person.insurance_expiry
      }
    };
  } catch (error) {
    console.error('Error getting Check Trader verification:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
`;
  
  // Write the Check Traders API handler file
  fs.writeFileSync('./server/check-traders-api.js', checkTradersApiHandlerCode);
  console.log('Check Traders API handler created at server/check-traders-api.js');
  
  // Create a maintenance request handler service
  const maintenanceRequestHandlerCode = `/**
 * Maintenance Request Handler Service
 * Handles maintenance requests and finding appropriate tradespeople
 */

import { searchCheckTradersPeople, getCheckTraderVerification } from './check-traders-api.js';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Process a new maintenance request and find appropriate tradespeople
export async function processMaintenanceRequest(maintenanceRequest) {
  try {
    const { propertyId, issueType, priority, description } = maintenanceRequest;
    
    // Get property location
    const propertyResult = await pool.query(
      'SELECT city FROM properties WHERE id = $1',
      [propertyId]
    );
    
    if (propertyResult.rows.length === 0) {
      throw new Error('Property not found');
    }
    
    const location = propertyResult.rows[0].city;
    
    // Search for appropriate tradespeople via Check Traders API
    const radius = priority === 'emergency' ? 20 : 10;
    const tradespeople = await searchCheckTradersPeople(issueType, location, radius);
    
    // Save the search results to the maintenance request
    if (maintenanceRequest.id) {
      await pool.query(
        \`UPDATE maintenance_requests 
         SET check_trader_search_results = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2\`,
        [JSON.stringify(tradespeople), maintenanceRequest.id]
      );
    }
    
    // Store the tradesperson options for this maintenance request
    if (tradespeople.success && tradespeople.results.length > 0 && maintenanceRequest.id) {
      for (const person of tradespeople.results) {
        // Find the tradesperson in our database by Check Trader ID
        const tradesPersonResult = await pool.query(
          'SELECT id FROM tradespeople WHERE check_trader_id = $1',
          [person.id]
        );
        
        if (tradesPersonResult.rows.length > 0) {
          const tradespersonId = tradesPersonResult.rows[0].id;
          
          // Add to maintenance_tradespeople link table
          await pool.query(
            \`INSERT INTO maintenance_tradespeople (
               maintenance_id, tradesperson_id, is_assigned
             )
             VALUES ($1, $2, $3)
             ON CONFLICT (maintenance_id, tradesperson_id) 
             DO UPDATE SET updated_at = CURRENT_TIMESTAMP\`,
            [maintenanceRequest.id, tradespersonId, false]
          );
        }
      }
    }
    
    return tradespeople;
  } catch (error) {
    console.error('Error processing maintenance request:', error);
    throw error;
  }
}

// Get tradespeople for a maintenance request
export async function getTradespeopleFprMaintenanceRequest(maintenanceId) {
  try {
    const result = await pool.query(
      \`SELECT t.*, mt.is_assigned, mt.available_dates, mt.quoted_price
       FROM maintenance_tradespeople mt
       JOIN tradespeople t ON mt.tradesperson_id = t.id
       WHERE mt.maintenance_id = $1
       ORDER BY mt.is_assigned DESC, t.rating DESC\`,
      [maintenanceId]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting tradespeople for maintenance request:', error);
    throw error;
  }
}

// Assign a tradesperson to a maintenance request
export async function assignTradespersonToRequest(maintenanceId, tradespersonId, appointmentDetails) {
  try {
    // Update the maintenance_tradespeople table
    await pool.query(
      \`UPDATE maintenance_tradespeople
       SET is_assigned = true,
           updated_at = CURRENT_TIMESTAMP
       WHERE maintenance_id = $1 AND tradesperson_id = $2\`,
      [maintenanceId, tradespersonId]
    );
    
    // Create an appointment
    if (appointmentDetails) {
      await pool.query(
        \`INSERT INTO maintenance_appointments (
           maintenance_id, tradesperson_id, appointment_date,
           appointment_time, duration, status
         )
         VALUES ($1, $2, $3, $4, $5, $6)\`,
        [
          maintenanceId, tradespersonId, 
          appointmentDetails.date, appointmentDetails.time,
          appointmentDetails.duration || 60, 'scheduled'
        ]
      );
    }
    
    // Update the maintenance request status
    await pool.query(
      \`UPDATE maintenance_requests
       SET status = 'in-progress',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1\`,
      [maintenanceId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error assigning tradesperson to request:', error);
    throw error;
  }
}
`;
  
  // Write the maintenance request handler file
  fs.writeFileSync('./server/maintenance-request-handler.js', maintenanceRequestHandlerCode);
  console.log('Maintenance request handler created at server/maintenance-request-handler.js');
  
  // Create an Express route handler for the Check Traders integration
  const checkTradersRouteCode = `/**
 * Express routes for maintenance and tradesperson operations
 */

import { searchCheckTradersPeople, getCheckTraderVerification } from './check-traders-api.js';
import { processMaintenanceRequest, getTradespeopleFprMaintenanceRequest, assignTradespersonToRequest } from './maintenance-request-handler.js';

export function registerMaintenanceRoutes(app, storage) {
  // Search for tradespeople via Check Traders API
  app.get('/api/tradespeople/search', async (req, res) => {
    try {
      const { issueType, location, radius } = req.query;
      
      if (!issueType || !location) {
        return res.status(400).json({ 
          success: false,
          error: 'Issue type and location are required'
        });
      }
      
      const result = await searchCheckTradersPeople(
        issueType, 
        location, 
        radius ? parseInt(radius) : 10
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error searching for tradespeople:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to search for tradespeople'
      });
    }
  });
  
  // Get Check Trader verification details
  app.get('/api/tradespeople/verification/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await getCheckTraderVerification(id);
      
      res.json(result);
    } catch (error) {
      console.error('Error getting tradesperson verification:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get tradesperson verification'
      });
    }
  });
  
  // Process a new maintenance request
  app.post('/api/maintenance/process', async (req, res) => {
    try {
      const maintenanceRequest = req.body;
      
      if (!maintenanceRequest.propertyId || !maintenanceRequest.issueType) {
        return res.status(400).json({ 
          success: false,
          error: 'Property ID and issue type are required'
        });
      }
      
      const result = await processMaintenanceRequest(maintenanceRequest);
      
      res.json(result);
    } catch (error) {
      console.error('Error processing maintenance request:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to process maintenance request'
      });
    }
  });
  
  // Get tradespeople for a maintenance request
  app.get('/api/maintenance/:id/tradespeople', async (req, res) => {
    try {
      const { id } = req.params;
      
      const tradespeople = await getTradespeopleFprMaintenanceRequest(id);
      
      res.json({
        success: true,
        tradespeople
      });
    } catch (error) {
      console.error('Error getting tradespeople for maintenance request:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get tradespeople for maintenance request'
      });
    }
  });
  
  // Assign a tradesperson to a maintenance request
  app.post('/api/maintenance/:id/assign', async (req, res) => {
    try {
      const { id } = req.params;
      const { tradespersonId, appointmentDetails } = req.body;
      
      if (!tradespersonId) {
        return res.status(400).json({ 
          success: false,
          error: 'Tradesperson ID is required'
        });
      }
      
      const result = await assignTradespersonToRequest(
        id, 
        tradespersonId, 
        appointmentDetails
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error assigning tradesperson to request:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to assign tradesperson to request'
      });
    }
  });
}
`;
  
  // Write the Check Traders route file
  fs.writeFileSync('./server/maintenance-routes.js', checkTradersRouteCode);
  console.log('Maintenance routes created at server/maintenance-routes.js');
}

// Add integration code to the server/routes.js file
async function updateServerRoutes() {
  console.log('Updating server routes to include maintenance and tradespeople routes...');
  
  try {
    // Read the current server/routes.js file
    const routesPath = './server/routes.ts';
    let routesContent = fs.readFileSync(routesPath, 'utf8');
    
    // Check if maintenance routes are already registered
    if (routesContent.includes('registerMaintenanceRoutes')) {
      console.log('Maintenance routes already registered, skipping update');
      return;
    }
    
    // Add import for maintenance routes
    let importLine = `import { registerMaintenanceRoutes } from './maintenance-routes.js';\n`;
    routesContent = importLine + routesContent;
    
    // Find the end of the routes registration section
    const registerLinesPattern = /export default function registerRoutes\((.*?)\) {[\s\S]*?}/;
    const match = routesContent.match(registerLinesPattern);
    
    if (match) {
      // Add registration of maintenance routes
      const insertText = `  
  // Register maintenance and tradespeople routes
  registerMaintenanceRoutes(app, storage);
  
  console.log('Maintenance and tradespeople routes registered');`;
      
      const insertPosition = match.index + match[0].length - 1;
      routesContent = routesContent.slice(0, insertPosition) + insertText + routesContent.slice(insertPosition);
      
      // Write the updated file
      fs.writeFileSync(routesPath, routesContent);
      console.log('Server routes updated to include maintenance and tradespeople routes');
    } else {
      console.log('Could not find appropriate location to update server routes');
    }
  } catch (error) {
    console.error('Error updating server routes:', error);
  }
}

// Main function to run all setup operations
async function main() {
  try {
    await setupTables();
    await createSampleTradespeople();
    await setupCheckTradersIntegration();
    await updateServerRoutes();
    
    console.log('Maintenance and tradespeople system setup completed successfully!');
  } catch (error) {
    console.error('Error setting up maintenance and tradespeople system:', error);
  } finally {
    await pool.end();
  }
}

// Start execution
main();