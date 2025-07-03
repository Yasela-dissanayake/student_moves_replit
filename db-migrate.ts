import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './shared/schema';

async function main() {
  // Create a connection to the database
  const connectionString = process.env.DATABASE_URL || '';
  const client = postgres(connectionString, {
    ssl: { rejectUnauthorized: false }, // Allow self-signed certificates
  });
  const db = drizzle(client, { schema });

  console.log('Starting database migration...');

  try {
    // Fix users table - add right_to_rent fields
    await client.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'right_to_rent_verified'
        ) THEN
          ALTER TABLE users ADD COLUMN right_to_rent_verified BOOLEAN;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'right_to_rent_check_date'
        ) THEN
          ALTER TABLE users ADD COLUMN right_to_rent_check_date TIMESTAMP;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'right_to_rent_status'
        ) THEN
          ALTER TABLE users ADD COLUMN right_to_rent_status TEXT;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'right_to_rent_expiry_date'
        ) THEN
          ALTER TABLE users ADD COLUMN right_to_rent_expiry_date TIMESTAMP;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'right_to_rent_notes'
        ) THEN
          ALTER TABLE users ADD COLUMN right_to_rent_notes TEXT;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'right_to_rent_follow_up_date'
        ) THEN
          ALTER TABLE users ADD COLUMN right_to_rent_follow_up_date TIMESTAMP;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'stripe_customer_id'
        ) THEN
          ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'stripe_subscription_id'
        ) THEN
          ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;
        END IF;
      END $$;
    `);
    console.log('Added Right to Rent fields to users table (if needed)');

    // Fix properties table - add videos field
    await client.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'properties' AND column_name = 'videos'
        ) THEN
          ALTER TABLE properties ADD COLUMN videos TEXT[];
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'properties' AND column_name = 'virtual_tour_url'
        ) THEN
          ALTER TABLE properties ADD COLUMN virtual_tour_url TEXT;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'properties' AND column_name = 'nearby_universities'
        ) THEN
          ALTER TABLE properties ADD COLUMN nearby_universities TEXT[];
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'properties' AND column_name = 'epc_rating'
        ) THEN
          ALTER TABLE properties ADD COLUMN epc_rating TEXT;
        END IF;
      END $$;
    `);
    console.log('Added video and virtual tour fields to properties table (if needed)');

    // Add metadata column to verifications table if it doesn't exist
    await client.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'verifications' AND column_name = 'metadata'
        ) THEN
          ALTER TABLE verifications ADD COLUMN metadata JSONB;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'verifications' AND column_name = 'ai_verified_at'
        ) THEN
          ALTER TABLE verifications ADD COLUMN ai_verified_at TIMESTAMP;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'verifications' AND column_name = 'admin_verified_at'
        ) THEN
          ALTER TABLE verifications ADD COLUMN admin_verified_at TIMESTAMP;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'verifications' AND column_name = 'admin_verified_by'
        ) THEN
          ALTER TABLE verifications ADD COLUMN admin_verified_by INTEGER;
        END IF;
      END $$;
    `);
    console.log('Added verification fields to verifications table (if needed)');

    // Add fields to payments table
    await client.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'payments' AND column_name = 'payment_method'
        ) THEN
          ALTER TABLE payments ADD COLUMN payment_method TEXT;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'payments' AND column_name = 'stripe_payment_intent_id'
        ) THEN
          ALTER TABLE payments ADD COLUMN stripe_payment_intent_id TEXT;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'payments' AND column_name = 'stripe_invoice_id'
        ) THEN
          ALTER TABLE payments ADD COLUMN stripe_invoice_id TEXT;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'payments' AND column_name = 'receipt_url'
        ) THEN
          ALTER TABLE payments ADD COLUMN receipt_url TEXT;
        END IF;
      END $$;
    `);
    console.log('Added payment fields to payments table (if needed)');

    // Add required_qualifications field to maintenance_templates table
    await client.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'maintenance_templates' AND column_name = 'required_qualifications'
        ) THEN
          ALTER TABLE maintenance_templates ADD COLUMN required_qualifications TEXT[];
        END IF;
      END $$;
    `);
    console.log('Added required_qualifications field to maintenance_templates table (if needed)');

    // Add fields to maintenance_requests table
    await client.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'maintenance_requests' AND column_name = 'internal_notes'
        ) THEN
          ALTER TABLE maintenance_requests ADD COLUMN internal_notes TEXT;
        END IF;
      END $$;
    `);
    console.log('Added internal_notes field to maintenance_requests table (if needed)');

    // Add calendar events fields
    await client.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'calendar_events' AND column_name = 'entity_type'
        ) THEN
          ALTER TABLE calendar_events ADD COLUMN entity_type TEXT;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'calendar_events' AND column_name = 'entity_id'
        ) THEN
          ALTER TABLE calendar_events ADD COLUMN entity_id INTEGER;
        END IF;
      END $$;
    `);
    console.log('Added entity fields to calendar_events table (if needed)');

    // Create documents table if it doesn't exist
    await client.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'documents'
        ) THEN
          CREATE TABLE documents (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            document_type TEXT NOT NULL,
            content TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP,
            created_by_id INTEGER NOT NULL,
            landlord_id INTEGER,
            property_id INTEGER,
            tenant_id INTEGER,
            agent_id INTEGER,
            document_url TEXT,
            signed_by_tenant BOOLEAN DEFAULT FALSE,
            signed_by_landlord BOOLEAN DEFAULT FALSE,
            signed_by_agent BOOLEAN DEFAULT FALSE,
            date_signed TIMESTAMP
          );
        END IF;
      END $$;
    `);
    console.log('Created documents table (if needed)');

    // Create property_update_notifications table if it doesn't exist
    await client.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'property_update_notifications'
        ) THEN
          CREATE TABLE property_update_notifications (
            id SERIAL PRIMARY KEY,
            property_id INTEGER NOT NULL,
            sender_user_id INTEGER NOT NULL,
            update_type TEXT NOT NULL,
            previous_value TEXT,
            new_value TEXT,
            message TEXT,
            sent_at TIMESTAMP DEFAULT NOW(),
            recipient_count INTEGER DEFAULT 0,
            successful BOOLEAN DEFAULT FALSE,
            error_message TEXT
          );
        END IF;
      END $$;
    `);
    console.log('Created property_update_notifications table (if needed)');

    // Add WhatsApp fields to users table if they don't exist
    await client.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'whatsapp_verified'
        ) THEN
          ALTER TABLE users ADD COLUMN whatsapp_verified BOOLEAN DEFAULT FALSE;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'whatsapp_verification_date'
        ) THEN
          ALTER TABLE users ADD COLUMN whatsapp_verification_date TIMESTAMP;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'whatsapp_opt_in'
        ) THEN
          ALTER TABLE users ADD COLUMN whatsapp_opt_in BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `);
    console.log('Added WhatsApp fields to users table (if needed)');

    // Create Utility Management tables if they don't exist
    await client.unsafe(`
      DO $$
      BEGIN
        -- Create utility_type enum if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM pg_type WHERE typname = 'utility_type'
        ) THEN
          CREATE TYPE utility_type AS ENUM ('gas', 'electricity', 'water', 'broadband', 'tv_license');
        END IF;
        
        -- Create utility_contract_status enum if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM pg_type WHERE typname = 'utility_contract_status'
        ) THEN
          CREATE TYPE utility_contract_status AS ENUM ('pending', 'in_progress', 'active', 'cancelled', 'expired', 'blocked');
        END IF;
        
        -- Create utility_providers table if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'utility_providers'
        ) THEN
          CREATE TABLE utility_providers (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            utility_type utility_type NOT NULL,
            logo_url TEXT,
            website TEXT,
            customer_service_phone TEXT,
            customer_service_email TEXT,
            api_integration BOOLEAN DEFAULT FALSE,
            active BOOLEAN DEFAULT TRUE,
            notes TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        END IF;
        
        -- Create admin_banking_details table if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'admin_banking_details'
        ) THEN
          CREATE TABLE admin_banking_details (
            id SERIAL PRIMARY KEY,
            account_name TEXT NOT NULL,
            account_number TEXT NOT NULL,
            sort_code TEXT NOT NULL,
            bank_name TEXT NOT NULL,
            reference TEXT,
            contact_name TEXT,
            contact_email TEXT,
            contact_phone TEXT,
            is_default BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        END IF;
        
        -- Create utility_tariffs table if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'utility_tariffs'
        ) THEN
          CREATE TABLE utility_tariffs (
            id SERIAL PRIMARY KEY,
            provider_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            utility_type utility_type NOT NULL,
            fixed_term BOOLEAN DEFAULT FALSE,
            term_length INTEGER,
            early_exit_fee NUMERIC,
            standing_charge NUMERIC,
            unit_rate NUMERIC,
            estimated_annual_cost NUMERIC,
            green_energy BOOLEAN DEFAULT FALSE,
            special_offers TEXT[],
            available_from TIMESTAMP,
            available_until TIMESTAMP,
            region TEXT,
            last_updated TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        END IF;
        
        -- Create property_utility_contracts table if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'property_utility_contracts'
        ) THEN
          CREATE TABLE property_utility_contracts (
            id SERIAL PRIMARY KEY,
            property_id INTEGER NOT NULL,
            tenancy_id INTEGER,
            utility_type utility_type NOT NULL,
            provider_id INTEGER NOT NULL,
            tariff_id INTEGER,
            account_number TEXT,
            meter_serial_number TEXT,
            meter_reading_day INTEGER,
            contract_start_date TIMESTAMP,
            contract_end_date TIMESTAMP,
            deposit_amount NUMERIC,
            deposit_paid BOOLEAN DEFAULT FALSE,
            monthly_payment_amount NUMERIC,
            payment_day INTEGER,
            payment_method TEXT,
            banking_details_id INTEGER,
            status utility_contract_status DEFAULT 'pending',
            auto_renewal BOOLEAN DEFAULT FALSE,
            tenancy_agreement_uploaded BOOLEAN DEFAULT FALSE,
            tenancy_agreement_document_id INTEGER,
            ai_processed BOOLEAN DEFAULT FALSE,
            last_ai_check_date TIMESTAMP,
            best_deal_available BOOLEAN DEFAULT TRUE,
            notes TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        END IF;
        
        -- Create utility_price_comparisons table if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'utility_price_comparisons'
        ) THEN
          CREATE TABLE utility_price_comparisons (
            id SERIAL PRIMARY KEY,
            property_id INTEGER NOT NULL,
            utility_type utility_type NOT NULL,
            search_date TIMESTAMP DEFAULT NOW(),
            search_criteria JSONB,
            results JSONB,
            cheapest_provider_id INTEGER,
            cheapest_tariff_id INTEGER,
            annual_savings NUMERIC,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        END IF;
      END $$;
    `);
    console.log('Created Utility Management tables (if needed)');

    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Close the database connection
    await client.end();
  }
}

main().catch(console.error);