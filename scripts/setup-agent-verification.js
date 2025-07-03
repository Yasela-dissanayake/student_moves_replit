/**
 * Script to set up agent verification system
 * Creates necessary tables for storing document verification data
 * Run with: node scripts/setup-agent-verification.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Create agent_verifications table
    console.log('Creating agent_verifications table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_verifications (
        id SERIAL PRIMARY KEY,
        agent_id INTEGER NOT NULL UNIQUE,
        status VARCHAR(20) NOT NULL DEFAULT 'not_submitted',
        id_document_path TEXT,
        selfie_path TEXT,
        verification_confidence FLOAT,
        face_match_score FLOAT,
        document_validity_score FLOAT,
        submitted_at TIMESTAMP,
        verified_at TIMESTAMP,
        rejection_reason TEXT,
        CONSTRAINT valid_status CHECK (status IN ('not_submitted', 'pending', 'verified', 'rejected'))
      );
    `);

    // Create verification_logs table for detailed activity tracking
    console.log('Creating verification_logs table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_logs (
        id SERIAL PRIMARY KEY,
        agent_id INTEGER NOT NULL,
        verification_id INTEGER,
        action VARCHAR(50) NOT NULL,
        details JSONB,
        ip_address VARCHAR(50),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY (verification_id) REFERENCES agent_verifications(id)
      );
    `);

    // Create uploads directory for verification documents
    const uploadsDir = path.join(__dirname, '../uploads/verification');
    if (!fs.existsSync(uploadsDir)) {
      console.log('Creating uploads directory for verification documents...');
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    console.log('Agent verification tables and directories created successfully!');
  } catch (error) {
    console.error('Error setting up agent verification tables:', error);
  } finally {
    await pool.end();
  }
}

async function updateServerRoutes() {
  console.log('Adding agent verification routes to server...');
  
  // This is just a reminder message - we'll manually add the routes in a separate step
  console.log('\nIMPORTANT: You need to manually update server/routes.ts to include:');
  console.log('1. Import the agent verification routes:');
  console.log('   import agentVerificationRoutes from \'./routes/agent-verification\';');
  console.log('2. Add the routes to the Express app:');
  console.log('   app.use(\'/api/agent/verification\', agentVerificationRoutes);');
}

async function createSampleData() {
  console.log('\nNote: No sample data created for verification system as this requires real document uploads.');
  console.log('Use the UI to upload and test verification process with real documents.');
}

async function main() {
  console.log('Setting up agent verification system...');
  await setupTables();
  await updateServerRoutes();
  await createSampleData();
  console.log('\nAgent verification setup complete!');
}

main().catch(console.error);