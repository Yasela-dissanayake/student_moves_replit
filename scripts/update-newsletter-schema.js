/**
 * Script to update the newsletter database schema
 * Adds signature column to scheduled_emails and sent_emails tables
 * 
 * Run with: node scripts/update-newsletter-schema.js
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Configure environment
dotenv.config();
const { Client } = pg;

async function main() {
  // Create a database client
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to the database');

    // Check if the signature column exists in scheduled_emails
    const checkScheduledEmailsColumnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'scheduled_emails' AND column_name = 'signature'
    `);
    
    // Add the column if it doesn't exist
    if (checkScheduledEmailsColumnExists.rows.length === 0) {
      console.log('Adding signature column to scheduled_emails table...');
      await client.query(`
        ALTER TABLE scheduled_emails 
        ADD COLUMN signature TEXT
      `);
      console.log('Added signature column to scheduled_emails table');
    } else {
      console.log('signature column already exists in scheduled_emails table');
    }

    // Check if the signature column exists in sent_emails
    const checkSentEmailsColumnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sent_emails' AND column_name = 'signature'
    `);
    
    // Add the column if it doesn't exist
    if (checkSentEmailsColumnExists.rows.length === 0) {
      console.log('Adding signature column to sent_emails table...');
      await client.query(`
        ALTER TABLE sent_emails 
        ADD COLUMN signature TEXT
      `);
      console.log('Added signature column to sent_emails table');
    } else {
      console.log('signature column already exists in sent_emails table');
    }

    // Check if tracking_id column exists in sent_emails
    const checkTrackingIdColumnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sent_emails' AND column_name = 'tracking_id'
    `);
    
    // Add the column if it doesn't exist
    if (checkTrackingIdColumnExists.rows.length === 0) {
      console.log('Adding tracking_id column to sent_emails table...');
      await client.query(`
        ALTER TABLE sent_emails 
        ADD COLUMN tracking_id TEXT
      `);
      console.log('Added tracking_id column to sent_emails table');
    } else {
      console.log('tracking_id column already exists in sent_emails table');
    }

    console.log('Database schema update completed successfully');
  } catch (error) {
    console.error('Error updating database schema:', error);
  } finally {
    // Close the connection
    await client.end();
    console.log('Database connection closed');
  }
}

main();