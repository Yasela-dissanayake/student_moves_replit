/**
 * Script to create comprehensive sample data for the UniRent system
 * Including landlords, agents, properties, tenants, maintenance requests
 * 
 * Run with: node scripts/create-sample-data-improved.js
 */

import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper function to hash passwords
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Create sample agents
async function createSampleAgents() {
  console.log('Creating sample agents...');
  try {
    const hashedPassword = await hashPassword('agent123');
    
    // Main test agent already exists
    const checkMainAgent = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['agent@unirent.com']
    );
    
    if (checkMainAgent.rows.length === 0) {
      await pool.query(
        `INSERT INTO users (name, email, password, user_type, phone, verified)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['Sarah Johnson', 'agent@unirent.com', hashedPassword, 'agent', '07700900123', true]
      );
      console.log('Created main agent: Sarah Johnson (agent@unirent.com)');
    } else {
      console.log('Main agent already exists, skipping creation');
    }
    
    // Additional agents
    const agents = [
      {
        name: 'James Wilson',
        email: 'james.wilson@unirent.com',
        phone: '07700900456',
        agency: 'UniRent Leeds',
        specialization: 'Student Properties',
        yearsOfExperience: 8
      },
      {
        name: 'Emma Davies',
        email: 'emma.davies@unirent.com',
        phone: '07700900789',
        agency: 'UniRent Manchester',
        specialization: 'Luxury Apartments',
        yearsOfExperience: 5
      },
      {
        name: 'Michael Chen',
        email: 'michael.chen@unirent.com',
        phone: '07700900234',
        agency: 'UniRent Birmingham',
        specialization: 'House Shares',
        yearsOfExperience: 10
      }
    ];
    
    for (const agent of agents) {
      const checkAgent = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [agent.email]
      );
      
      if (checkAgent.rows.length === 0) {
        const userId = await pool.query(
          `INSERT INTO users (name, email, password, user_type, phone, verified)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [agent.name, agent.email, hashedPassword, 'agent', agent.phone, true]
        );
        
        // Check if agent_details table exists
        const tableCheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'agent_details'
          );
        `);
        
        if (tableCheck.rows[0].exists) {
          // Add agent-specific info in a separate table if needed
          await pool.query(
            `INSERT INTO agent_details (agent_id, agency_name, specialization, years_of_experience)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (agent_id) DO UPDATE 
             SET agency_name = $2, specialization = $3, years_of_experience = $4`,
            [userId.rows[0].id, agent.agency, agent.specialization, agent.yearsOfExperience]
          );
        }
        
        console.log(`Created agent: ${agent.name} (${agent.email})`);
      } else {
        console.log(`Agent ${agent.name} already exists, skipping creation`);
      }
    }
  } catch (error) {
    console.error('Error creating agents:', error);
  }
}

// Create sample landlords
async function createSampleLandlords() {
  console.log('Creating sample landlords...');
  try {
    const hashedPassword = await hashPassword('landlord123');
    
    const landlords = [
      {
        name: 'Robert Thompson',
        email: 'robert.thompson@example.com',
        phone: '07700900111',
        portfolioSize: 12,
        preferredContactMethod: 'email',
        accountManager: 'Sarah Johnson'
      },
      {
        name: 'Amina Patel',
        email: 'amina.patel@example.com',
        phone: '07700900222',
        portfolioSize: 5,
        preferredContactMethod: 'phone',
        accountManager: 'James Wilson'
      },
      {
        name: 'David Williams',
        email: 'david.williams@example.com',
        phone: '07700900333',
        portfolioSize: 8,
        preferredContactMethod: 'email',
        accountManager: 'Emma Davies'
      },
      {
        name: 'Sophie Zhang',
        email: 'sophie.zhang@example.com',
        phone: '07700900444',
        portfolioSize: 15,
        preferredContactMethod: 'whatsapp',
        accountManager: 'Michael Chen'
      }
    ];
    
    for (const landlord of landlords) {
      const checkLandlord = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [landlord.email]
      );
      
      if (checkLandlord.rows.length === 0) {
        const userId = await pool.query(
          `INSERT INTO users (name, email, password, user_type, phone, verified)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [landlord.name, landlord.email, hashedPassword, 'landlord', landlord.phone, true]
        );
        
        // Check if landlord_details table exists
        const tableCheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'landlord_details'
          );
        `);
        
        if (tableCheck.rows[0].exists) {
          // Add landlord-specific info in a separate table if needed
          await pool.query(
            `INSERT INTO landlord_details (landlord_id, portfolio_size, preferred_contact_method, account_manager)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (landlord_id) DO UPDATE 
             SET portfolio_size = $2, preferred_contact_method = $3, account_manager = $4`,
            [userId.rows[0].id, landlord.portfolioSize, landlord.preferredContactMethod, landlord.accountManager]
          );
        }
        
        console.log(`Created landlord: ${landlord.name} (${landlord.email})`);
      } else {
        console.log(`Landlord ${landlord.name} already exists, skipping creation`);
      }
    }
  } catch (error) {
    console.error('Error creating landlords:', error);
  }
}

// Create sample tenants
async function createSampleTenants() {
  console.log('Creating sample tenants...');
  try {
    const hashedPassword = await hashPassword('tenant123');
    
    const tenants = [
      {
        name: 'Alex Johnson',
        email: 'alex.johnson@student.example.ac.uk',
        phone: '07700900555',
        university: 'University of Leeds',
        courseYear: 2,
        studyField: 'Computer Science'
      },
      {
        name: 'Olivia Brown',
        email: 'olivia.brown@student.example.ac.uk',
        phone: '07700900666',
        university: 'Manchester University',
        courseYear: 3,
        studyField: 'Business Administration'
      },
      {
        name: 'Mohammed Khan',
        email: 'mohammed.khan@student.example.ac.uk',
        phone: '07700900777',
        university: 'University of Birmingham',
        courseYear: 1,
        studyField: 'Engineering'
      },
      {
        name: 'Emily Davis',
        email: 'emily.davis@student.example.ac.uk',
        phone: '07700900888',
        university: 'University of Leeds',
        courseYear: 4,
        studyField: 'Medicine'
      },
      {
        name: 'Thomas Wilson',
        email: 'thomas.wilson@student.example.ac.uk',
        phone: '07700900999',
        university: 'Manchester University',
        courseYear: 2,
        studyField: 'Psychology'
      }
    ];
    
    for (const tenant of tenants) {
      const checkTenant = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [tenant.email]
      );
      
      if (checkTenant.rows.length === 0) {
        const userId = await pool.query(
          `INSERT INTO users (name, email, password, user_type, phone, verified, student_university_email, student_verification_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [tenant.name, tenant.email, hashedPassword, 'tenant', tenant.phone, true, tenant.email, 'verified']
        );
        
        // Check if tenant_details table exists
        const tableCheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'tenant_details'
          );
        `);
        
        if (tableCheck.rows[0].exists) {
          // Add tenant-specific info in a separate table if needed
          await pool.query(
            `INSERT INTO tenant_details (tenant_id, university, course_year, study_field)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (tenant_id) DO UPDATE 
             SET university = $2, course_year = $3, study_field = $4`,
            [userId.rows[0].id, tenant.university, tenant.courseYear, tenant.studyField]
          );
        }
        
        console.log(`Created tenant: ${tenant.name} (${tenant.email})`);
      } else {
        console.log(`Tenant ${tenant.name} already exists, skipping creation`);
      }
    }
  } catch (error) {
    console.error('Error creating tenants:', error);
  }
}

// Create sample properties
async function createSampleProperties() {
  console.log('Creating sample properties...');
  try {
    // First get agent IDs
    const agentsResult = await pool.query(
      "SELECT id, name FROM users WHERE user_type = 'agent'"
    );
    const agents = agentsResult.rows;
    
    // Get landlord IDs
    const landlordsResult = await pool.query(
      "SELECT id, name FROM users WHERE user_type = 'landlord'"
    );
    const landlords = landlordsResult.rows;
    
    if (agents.length === 0 || landlords.length === 0) {
      console.log('No agents or landlords found, cannot create properties');
      return;
    }
    
    const properties = [
      {
        title: '3-Bed Student House near Leeds University',
        description: 'Spacious 3-bedroom house perfect for students. Recently renovated with modern kitchen and bathrooms. Close to campus and local amenities.',
        property_type: 'house',
        bedrooms: 3,
        bathrooms: 2,
        furnished: true,
        price: 1260,
        price_per_person: 420,
        deposit_amount: 1260,
        area: 'Hyde Park',
        address: '15 Woodhouse Lane, Leeds, LS2 3AP',
        city: 'Leeds',
        postcode: 'LS2 3AP',
        university: 'University of Leeds',
        distance_to_university: '0.5 miles',
        available_date: '2025-09-01',
        available: true,
        bills_included: true,
        included_bills: ['water', 'internet', 'electricity'],
        features: ['garden', 'washing machine', 'dishwasher', 'central heating'],
        images: ['/images/property1_1.jpg', '/images/property1_2.jpg'],
        epc_rating: 'B',
        pets_allowed: false,
        smoking_allowed: false,
        parking_available: true,
        landlord_id: landlords[0].id,
        agent_id: agents[0].id,
        managed_by: 'agent'
      },
      {
        title: 'Luxury 2-Bed Apartment in Manchester City Centre',
        description: 'Modern 2-bedroom apartment in the heart of Manchester. High-spec finishes throughout with stunning city views. Perfect for professionals or postgraduate students.',
        property_type: 'apartment',
        bedrooms: 2,
        bathrooms: 2,
        furnished: true,
        price: 1500,
        price_per_person: 750,
        deposit_amount: 1500,
        area: 'City Centre',
        address: '45 Deansgate, Manchester, M3 2AY',
        city: 'Manchester',
        postcode: 'M3 2AY',
        university: 'Manchester University',
        distance_to_university: '1.2 miles',
        available_date: '2025-07-15',
        available: true,
        bills_included: false,
        features: ['balcony', 'concierge', 'gym', 'parking', 'furnished'],
        images: ['/images/property2_1.jpg', '/images/property2_2.jpg'],
        epc_rating: 'A',
        pets_allowed: true,
        smoking_allowed: false,
        parking_available: true,
        landlord_id: landlords[1].id,
        agent_id: agents[1].id,
        managed_by: 'agent'
      },
      {
        title: '5-Bed Student House with Garden in Birmingham',
        description: 'Large 5-bedroom student house in Selly Oak. Ideal for group of friends wanting to live together. Spacious garden and common areas.',
        property_type: 'house',
        bedrooms: 5,
        bathrooms: 2,
        furnished: true,
        price: 1900,
        price_per_person: 380,
        deposit_amount: 1900,
        area: 'Selly Oak',
        address: '28 Bristol Road, Birmingham, B29 6BJ',
        city: 'Birmingham',
        postcode: 'B29 6BJ',
        university: 'University of Birmingham',
        distance_to_university: '0.8 miles',
        available_date: '2025-09-01',
        available: true,
        bills_included: false,
        features: ['large garden', 'driveway', 'washing machine', 'dishwasher', 'high-speed internet'],
        images: ['/images/property3_1.jpg', '/images/property3_2.jpg'],
        epc_rating: 'C',
        pets_allowed: false,
        smoking_allowed: false,
        parking_available: true,
        landlord_id: landlords[2].id,
        agent_id: agents[2].id,
        managed_by: 'agent'
      },
      {
        title: 'Modern Studio Apartment for Students',
        description: 'Contemporary studio apartment perfect for individual students or couples. All-inclusive bills with high-speed internet and on-site facilities.',
        property_type: 'studio',
        bedrooms: 1,
        bathrooms: 1,
        furnished: true,
        price: 850,
        price_per_person: 850,
        deposit_amount: 850,
        area: 'Headingley',
        address: '5 Otley Road, Leeds, LS6 3AA',
        city: 'Leeds',
        postcode: 'LS6 3AA',
        university: 'Leeds Beckett University',
        distance_to_university: '1.5 miles',
        available_date: '2025-08-15',
        available: true,
        bills_included: true,
        included_bills: ['water', 'electricity', 'gas', 'internet', 'council tax'],
        features: ['on-site gym', 'study spaces', 'communal areas', 'bike storage', '24/7 security'],
        images: ['/images/property4_1.jpg', '/images/property4_2.jpg'],
        epc_rating: 'A',
        pets_allowed: false,
        smoking_allowed: false,
        parking_available: false,
        landlord_id: landlords[3].id,
        agent_id: agents[0].id,
        managed_by: 'agent'
      }
    ];
    
    for (const property of properties) {
      // Check if property already exists
      const checkProperty = await pool.query(
        'SELECT * FROM properties WHERE address = $1',
        [property.address]
      );
      
      if (checkProperty.rows.length === 0) {
        // Convert arrays and objects to JSON for database storage
        const featuresJson = JSON.stringify(property.features);
        const imagesJson = JSON.stringify(property.images);
        const includedBillsJson = property.included_bills ? JSON.stringify(property.included_bills) : null;
        
        await pool.query(
          `INSERT INTO properties (
            title, description, property_type, bedrooms, bathrooms, furnished,
            price, price_per_person, deposit_amount, area, address, city, postcode,
            university, distance_to_university, available_date, available,
            bills_included, features, images, epc_rating,
            pets_allowed, smoking_allowed, parking_available,
            landlord_id, agent_id, managed_by, included_bills, owner_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)`,
          [
            property.title, property.description, property.property_type, 
            property.bedrooms, property.bathrooms, property.furnished,
            property.price, property.price_per_person, property.deposit_amount, property.area, 
            property.address, property.city, property.postcode,
            property.university, property.distance_to_university, 
            property.available_date, property.available,
            property.bills_included, featuresJson, 
            imagesJson, property.epc_rating, 
            property.pets_allowed, property.smoking_allowed,
            property.parking_available, 
            property.landlord_id, property.agent_id, property.managed_by,
            includedBillsJson, property.landlord_id // Use landlord_id for owner_id as well
          ]
        );
        
        console.log(`Created property: ${property.title} (${property.address})`);
      } else {
        console.log(`Property ${property.address} already exists, skipping creation`);
      }
    }
  } catch (error) {
    console.error('Error creating properties:', error);
  }
}

// Create sample tenancies
async function createSampleTenancies() {
  console.log('Creating sample tenancies...');
  try {
    // Get properties
    const propertiesResult = await pool.query('SELECT id, title, address FROM properties');
    const properties = propertiesResult.rows;
    
    // Get tenants
    const tenantsResult = await pool.query("SELECT id, name FROM users WHERE user_type = 'tenant'");
    const tenants = tenantsResult.rows;
    
    if (properties.length === 0 || tenants.length === 0) {
      console.log('No properties or tenants found, cannot create tenancies');
      return;
    }
    
    const tenancies = [
      {
        property_id: properties[0].id,
        tenant_id: tenants[0].id,
        start_date: '2024-09-01',
        end_date: '2025-08-31',
        rent_amount: 420,
        deposit_amount: 1260,
        deposit_protection_scheme: 'Deposit Protection Service',
        deposit_protection_id: 'DPS-12345678',
        active: true,
        signed_by_tenant: true,
        signed_by_owner: true
      },
      {
        property_id: properties[1].id,
        tenant_id: tenants[1].id,
        start_date: '2024-07-15',
        end_date: '2025-01-14',
        rent_amount: 1500,
        deposit_amount: 1500,
        deposit_protection_scheme: 'mydeposits',
        deposit_protection_id: 'MYD-87654321',
        active: true,
        signed_by_tenant: true,
        signed_by_owner: true
      },
      {
        property_id: properties[2].id,
        tenant_id: tenants[2].id,
        start_date: '2024-09-01',
        end_date: '2025-08-31',
        rent_amount: 380,
        deposit_amount: 1900,
        deposit_protection_scheme: 'Tenancy Deposit Scheme',
        deposit_protection_id: 'TDS-23456789',
        active: true,
        signed_by_tenant: true,
        signed_by_owner: true
      }
    ];
    
    for (const tenancy of tenancies) {
      // Check if tenancy already exists
      const checkTenancy = await pool.query(
        'SELECT * FROM tenancies WHERE property_id = $1 AND tenant_id = $2',
        [tenancy.property_id, tenancy.tenant_id]
      );
      
      if (checkTenancy.rows.length === 0) {
        await pool.query(
          `INSERT INTO tenancies (
            property_id, tenant_id, start_date, end_date, rent_amount,
            deposit_amount, deposit_protection_scheme, deposit_protection_id, 
            active, signed_by_tenant, signed_by_owner
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            tenancy.property_id, tenancy.tenant_id, tenancy.start_date,
            tenancy.end_date, tenancy.rent_amount, tenancy.deposit_amount,
            tenancy.deposit_protection_scheme, tenancy.deposit_protection_id,
            tenancy.active, tenancy.signed_by_tenant, tenancy.signed_by_owner
          ]
        );
        
        console.log(`Created tenancy for property: ${properties.find(p => p.id === tenancy.property_id).title} and tenant: ${tenants.find(t => t.id === tenancy.tenant_id).name}`);
      } else {
        console.log(`Tenancy for property: ${properties.find(p => p.id === tenancy.property_id).title} and tenant: ${tenants.find(t => t.id === tenancy.tenant_id).name} already exists, skipping creation`);
      }
    }
  } catch (error) {
    console.error('Error creating tenancies:', error);
  }
}

// Main function to create sample data
async function main() {
  try {
    console.log('Starting sample data creation...');
    
    // Create users with different roles
    await createSampleAgents();
    await createSampleLandlords();
    await createSampleTenants();
    
    // Create properties and related data
    await createSampleProperties();
    await createSampleTenancies();
    
    console.log('Sample data creation completed successfully!');
  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    await pool.end();
  }
}

// Execute main function
main();