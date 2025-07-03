/**
 * Script to set up deposit registration system
 * Creates necessary tables and sample data for deposit protection
 * Run with: node scripts/setup-deposit-registrations.js
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
  console.log('Setting up deposit registration tables...');
  try {
    // Create deposit_protection_schemes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deposit_protection_schemes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        website TEXT,
        api_endpoint TEXT,
        api_key_name TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        description TEXT,
        logo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create deposit_protections table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deposit_protections (
        id SERIAL PRIMARY KEY,
        tenancy_id INTEGER REFERENCES tenancies(id),
        deposit_amount TEXT,
        deposit_protection_scheme TEXT,
        deposit_protection_id TEXT,
        protected_date DATE,
        certificate_url TEXT,
        protection_expiry_date DATE,
        is_renewed BOOLEAN DEFAULT FALSE,
        renewal_date DATE,
        dispute_raised BOOLEAN DEFAULT FALSE,
        dispute_details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create deposit_protection_log table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deposit_protection_log (
        id SERIAL PRIMARY KEY,
        protection_id INTEGER REFERENCES deposit_protections(id),
        action TEXT,
        performed_by INTEGER,
        performed_by_type TEXT,
        action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        details TEXT,
        success BOOLEAN,
        api_response TEXT
      )
    `);
    
    console.log('Deposit registration tables set up successfully');
  } catch (error) {
    console.error('Error setting up tables:', error);
  }
}

// Create sample deposit protection schemes
async function createSampleSchemes() {
  console.log('Creating sample deposit protection schemes...');
  try {
    const schemes = [
      {
        name: 'Deposit Protection Service',
        website: 'https://www.depositprotection.com',
        apiEndpoint: 'https://api.depositprotection.com/v1',
        apiKeyName: 'DPS_API_KEY',
        description: 'The DPS is a government-approved scheme that protects tenancy deposits.',
        logoUrl: '/images/dps-logo.png'
      },
      {
        name: 'mydeposits',
        website: 'https://www.mydeposits.co.uk',
        apiEndpoint: 'https://api.mydeposits.co.uk/v1',
        apiKeyName: 'MYDEPOSITS_API_KEY',
        description: 'mydeposits is a government-approved tenancy deposit protection scheme.',
        logoUrl: '/images/mydeposits-logo.png'
      },
      {
        name: 'Tenancy Deposit Scheme',
        website: 'https://www.tenancydepositscheme.com',
        apiEndpoint: 'https://api.tenancydepositscheme.com/v1',
        apiKeyName: 'TDS_API_KEY',
        description: 'The Tenancy Deposit Scheme is an insurance-backed, government-approved deposit protection scheme.',
        logoUrl: '/images/tds-logo.png'
      }
    ];
    
    for (const scheme of schemes) {
      // Check if scheme already exists
      const existingScheme = await pool.query(
        'SELECT * FROM deposit_protection_schemes WHERE name = $1',
        [scheme.name]
      );
      
      if (existingScheme.rows.length > 0) {
        console.log(`Scheme ${scheme.name} already exists, updating...`);
        
        await pool.query(
          `UPDATE deposit_protection_schemes
           SET website = $1, api_endpoint = $2, api_key_name = $3,
               description = $4, logo_url = $5, updated_at = CURRENT_TIMESTAMP
           WHERE name = $6`,
          [
            scheme.website, scheme.apiEndpoint, scheme.apiKeyName,
            scheme.description, scheme.logoUrl, scheme.name
          ]
        );
      } else {
        console.log(`Creating new scheme: ${scheme.name}`);
        
        await pool.query(
          `INSERT INTO deposit_protection_schemes (
             name, website, api_endpoint, api_key_name,
             description, logo_url
           )
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            scheme.name, scheme.website, scheme.apiEndpoint,
            scheme.apiKeyName, scheme.description, scheme.logoUrl
          ]
        );
      }
    }
    
    console.log('Sample deposit protection schemes created/updated successfully');
  } catch (error) {
    console.error('Error creating sample schemes:', error);
  }
}

// Create deposit registration service
async function createDepositRegistrationService() {
  console.log('Creating deposit registration service...');
  
  const depositRegistrationServiceCode = `/**
 * Deposit Registration Service
 * Handles deposit protection and registration with external schemes
 */

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Register a deposit with a protection scheme
export async function registerDeposit(tenancyId, schemeId, depositDetails) {
  try {
    // Get the tenancy details
    const tenancyResult = await pool.query(
      \`SELECT t.*, p.address, p.city, p.postcode, l.name as landlord_name,
        tn.name as tenant_name, tn.email as tenant_email
       FROM tenancies t
       JOIN properties p ON t.property_id = p.id
       JOIN users l ON p.landlordId = l.id
       JOIN users tn ON t.tenant_id = tn.id
       WHERE t.id = $1\`,
      [tenancyId]
    );
    
    if (tenancyResult.rows.length === 0) {
      throw new Error('Tenancy not found');
    }
    
    const tenancy = tenancyResult.rows[0];
    
    // Get the scheme details
    const schemeResult = await pool.query(
      'SELECT * FROM deposit_protection_schemes WHERE id = $1',
      [schemeId]
    );
    
    if (schemeResult.rows.length === 0) {
      throw new Error('Deposit protection scheme not found');
    }
    
    const scheme = schemeResult.rows[0];
    
    // In a real implementation, this would make an API call to the selected scheme
    // For this demo, we'll simulate a successful registration
    
    // Generate a unique protection ID
    const schemePrefix = scheme.name.split(' ').map(word => word[0]).join('');
    const protectionId = \`\${schemePrefix}-\${Math.floor(10000000 + Math.random() * 90000000)}\`;
    
    // Calculate protection expiry date (typically end of tenancy)
    const protectionExpiry = tenancy.end_date;
    
    // Store the deposit protection details
    const protectionResult = await pool.query(
      \`INSERT INTO deposit_protections (
         tenancy_id, deposit_amount, deposit_protection_scheme,
         deposit_protection_id, protected_date, certificate_url,
         protection_expiry_date
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id\`,
      [
        tenancyId, tenancy.deposit_amount, scheme.name,
        protectionId, new Date(), generateCertificateUrl(tenancyId, protectionId),
        protectionExpiry
      ]
    );
    
    const protectionId2 = protectionResult.rows[0].id;
    
    // Log the registration
    await pool.query(
      \`INSERT INTO deposit_protection_log (
         protection_id, action, performed_by, performed_by_type,
         details, success
       )
       VALUES ($1, $2, $3, $4, $5, $6)\`,
      [
        protectionId2, 'registration', depositDetails.userId,
        depositDetails.userType, 
        \`Deposit of \${tenancy.deposit_amount} registered with \${scheme.name}\`,
        true
      ]
    );
    
    return {
      success: true,
      protectionId: protectionId,
      scheme: scheme.name,
      protectedDate: new Date(),
      certificateUrl: generateCertificateUrl(tenancyId, protectionId),
      expiryDate: protectionExpiry
    };
  } catch (error) {
    console.error('Error registering deposit:', error);
    
    // Log the failed registration if possible
    try {
      if (tenancyId && depositDetails && depositDetails.userId) {
        await pool.query(
          \`INSERT INTO deposit_protection_log (
             protection_id, action, performed_by, performed_by_type,
             details, success
           )
           VALUES ($1, $2, $3, $4, $5, $6)\`,
          [
            null, 'registration', depositDetails.userId,
            depositDetails.userType, 
            \`Failed to register deposit: \${error.message}\`,
            false
          ]
        );
      }
    } catch (logError) {
      console.error('Error logging failed deposit registration:', logError);
    }
    
    throw error;
  }
}

// Generate a certificate URL
function generateCertificateUrl(tenancyId, protectionId) {
  return \`/certificates/deposit/\${tenancyId}_\${protectionId}.pdf\`;
}

// Renew a deposit protection
export async function renewDepositProtection(protectionId, userId, userType) {
  try {
    // Get the protection details
    const protectionResult = await pool.query(
      \`SELECT dp.*, t.end_date
       FROM deposit_protections dp
       JOIN tenancies t ON dp.tenancy_id = t.id
       WHERE dp.id = $1\`,
      [protectionId]
    );
    
    if (protectionResult.rows.length === 0) {
      throw new Error('Deposit protection not found');
    }
    
    const protection = protectionResult.rows[0];
    
    // In a real implementation, this would make an API call to the scheme
    // For now, we'll simulate a successful renewal
    
    // Calculate new expiry date (typically one year from now or end of tenancy)
    const newExpiryDate = new Date(protection.end_date);
    if (new Date(newExpiryDate) < new Date()) {
      // If tenancy has ended, extend by 1 year
      newExpiryDate.setFullYear(new Date().getFullYear() + 1);
    }
    
    // Update the protection
    await pool.query(
      \`UPDATE deposit_protections
       SET is_renewed = true, renewal_date = $1,
           protection_expiry_date = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3\`,
      [new Date(), newExpiryDate, protectionId]
    );
    
    // Log the renewal
    await pool.query(
      \`INSERT INTO deposit_protection_log (
         protection_id, action, performed_by, performed_by_type,
         details, success
       )
       VALUES ($1, $2, $3, $4, $5, $6)\`,
      [
        protectionId, 'renewal', userId, userType,
        \`Deposit protection renewed until \${newExpiryDate.toISOString().split('T')[0]}\`,
        true
      ]
    );
    
    return {
      success: true,
      renewalDate: new Date(),
      newExpiryDate: newExpiryDate
    };
  } catch (error) {
    console.error('Error renewing deposit protection:', error);
    throw error;
  }
}

// Raise a deposit dispute
export async function raiseDepositDispute(protectionId, disputeDetails, userId, userType) {
  try {
    // Get the protection details
    const protectionResult = await pool.query(
      'SELECT * FROM deposit_protections WHERE id = $1',
      [protectionId]
    );
    
    if (protectionResult.rows.length === 0) {
      throw new Error('Deposit protection not found');
    }
    
    // In a real implementation, this would make an API call to the scheme
    // For now, we'll simulate a successful dispute creation
    
    // Update the protection
    await pool.query(
      \`UPDATE deposit_protections
       SET dispute_raised = true, dispute_details = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2\`,
      [JSON.stringify(disputeDetails), protectionId]
    );
    
    // Log the dispute
    await pool.query(
      \`INSERT INTO deposit_protection_log (
         protection_id, action, performed_by, performed_by_type,
         details, success
       )
       VALUES ($1, $2, $3, $4, $5, $6)\`,
      [
        protectionId, 'dispute', userId, userType,
        \`Deposit dispute raised: \${disputeDetails.reason}\`,
        true
      ]
    );
    
    return {
      success: true,
      disputeId: \`DISP-\${Math.floor(10000 + Math.random() * 90000)}\`,
      disputeDate: new Date(),
      status: 'pending'
    };
  } catch (error) {
    console.error('Error raising deposit dispute:', error);
    throw error;
  }
}

// Get all deposit protection schemes
export async function getDepositProtectionSchemes() {
  try {
    const result = await pool.query(
      'SELECT * FROM deposit_protection_schemes WHERE is_active = true'
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting deposit protection schemes:', error);
    throw error;
  }
}

// Get deposit protection details
export async function getDepositProtection(tenancyId) {
  try {
    const result = await pool.query(
      \`SELECT dp.*, t.deposit_amount AS tenancy_deposit_amount,
         p.address, p.city, p.postcode,
         l.name AS landlord_name, tn.name AS tenant_name,
         dps.website AS scheme_website, dps.logo_url AS scheme_logo_url
       FROM deposit_protections dp
       JOIN tenancies t ON dp.tenancy_id = t.id
       JOIN properties p ON t.property_id = p.id
       JOIN users l ON p.landlordId = l.id
       JOIN users tn ON t.tenant_id = tn.id
       LEFT JOIN deposit_protection_schemes dps ON dp.deposit_protection_scheme = dps.name
       WHERE dp.tenancy_id = $1\`,
      [tenancyId]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting deposit protection:', error);
    throw error;
  }
}

// Get deposit protection history
export async function getDepositProtectionHistory(protectionId) {
  try {
    const result = await pool.query(
      \`SELECT dpl.*, u.name AS performed_by_name
       FROM deposit_protection_log dpl
       LEFT JOIN users u ON dpl.performed_by = u.id
       WHERE dpl.protection_id = $1
       ORDER BY dpl.action_date DESC\`,
      [protectionId]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting deposit protection history:', error);
    throw error;
  }
}
`;
  
  // Write the deposit registration service file
  fs.writeFileSync('./server/deposit-registration-service.js', depositRegistrationServiceCode);
  console.log('Deposit registration service created at server/deposit-registration-service.js');
  
  // Create deposit API routes
  const depositRegistrationRoutesCode = `/**
 * Express routes for deposit registration operations
 */

import { 
  registerDeposit, 
  renewDepositProtection, 
  raiseDepositDispute,
  getDepositProtectionSchemes,
  getDepositProtection,
  getDepositProtectionHistory
} from './deposit-registration-service.js';

export function registerDepositRoutes(app, storage) {
  // Register a deposit with a protection scheme
  app.post('/api/deposits/register', async (req, res) => {
    try {
      const { tenancyId, schemeId, userId, userType } = req.body;
      
      if (!tenancyId || !schemeId) {
        return res.status(400).json({ 
          success: false,
          error: 'Tenancy ID and scheme ID are required'
        });
      }
      
      const result = await registerDeposit(tenancyId, schemeId, {
        userId: userId || req.session.userId,
        userType: userType || req.session.userType
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error registering deposit:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to register deposit'
      });
    }
  });
  
  // Renew a deposit protection
  app.post('/api/deposits/:id/renew', async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, userType } = req.body;
      
      const result = await renewDepositProtection(
        id,
        userId || req.session.userId,
        userType || req.session.userType
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error renewing deposit protection:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to renew deposit protection'
      });
    }
  });
  
  // Raise a deposit dispute
  app.post('/api/deposits/:id/dispute', async (req, res) => {
    try {
      const { id } = req.params;
      const { disputeDetails, userId, userType } = req.body;
      
      if (!disputeDetails || !disputeDetails.reason) {
        return res.status(400).json({ 
          success: false,
          error: 'Dispute details with reason are required'
        });
      }
      
      const result = await raiseDepositDispute(
        id,
        disputeDetails,
        userId || req.session.userId,
        userType || req.session.userType
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error raising deposit dispute:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to raise deposit dispute'
      });
    }
  });
  
  // Get all deposit protection schemes
  app.get('/api/deposits/schemes', async (req, res) => {
    try {
      const schemes = await getDepositProtectionSchemes();
      
      res.json({
        success: true,
        schemes
      });
    } catch (error) {
      console.error('Error getting deposit protection schemes:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get deposit protection schemes'
      });
    }
  });
  
  // Get deposit protection details for a tenancy
  app.get('/api/deposits/tenancy/:tenancyId', async (req, res) => {
    try {
      const { tenancyId } = req.params;
      
      const protection = await getDepositProtection(tenancyId);
      
      if (!protection) {
        return res.status(404).json({
          success: false,
          error: 'Deposit protection not found'
        });
      }
      
      res.json({
        success: true,
        protection
      });
    } catch (error) {
      console.error('Error getting deposit protection:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get deposit protection'
      });
    }
  });
  
  // Get deposit protection history
  app.get('/api/deposits/:id/history', async (req, res) => {
    try {
      const { id } = req.params;
      
      const history = await getDepositProtectionHistory(id);
      
      res.json({
        success: true,
        history
      });
    } catch (error) {
      console.error('Error getting deposit protection history:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get deposit protection history'
      });
    }
  });
}
`;
  
  // Write the deposit registration routes file
  fs.writeFileSync('./server/deposit-registration-routes.js', depositRegistrationRoutesCode);
  console.log('Deposit registration routes created at server/deposit-registration-routes.js');
}

// Update the server/routes.js file to include deposit registration routes
async function updateServerRoutes() {
  console.log('Updating server routes to include deposit registration routes...');
  
  try {
    // Read the current server/routes.js file
    const routesPath = './server/routes.ts';
    let routesContent = fs.readFileSync(routesPath, 'utf8');
    
    // Check if deposit routes are already registered
    if (routesContent.includes('registerDepositRoutes')) {
      console.log('Deposit routes already registered, skipping update');
      return;
    }
    
    // Add import for deposit routes
    let importLine = `import { registerDepositRoutes } from './deposit-registration-routes.js';\n`;
    routesContent = importLine + routesContent;
    
    // Find the end of the routes registration section
    const registerLinesPattern = /export default function registerRoutes\((.*?)\) {[\s\S]*?}/;
    const match = routesContent.match(registerLinesPattern);
    
    if (match) {
      // Add registration of deposit routes
      const insertText = `  
  // Register deposit registration routes
  registerDepositRoutes(app, storage);
  
  console.log('Deposit registration routes registered');`;
      
      const insertPosition = match.index + match[0].length - 1;
      routesContent = routesContent.slice(0, insertPosition) + insertText + routesContent.slice(insertPosition);
      
      // Write the updated file
      fs.writeFileSync(routesPath, routesContent);
      console.log('Server routes updated to include deposit registration routes');
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
    await createSampleSchemes();
    await createDepositRegistrationService();
    await updateServerRoutes();
    
    console.log('Deposit registration system setup completed successfully!');
  } catch (error) {
    console.error('Error setting up deposit registration system:', error);
  } finally {
    await pool.end();
  }
}

// Start execution
main();