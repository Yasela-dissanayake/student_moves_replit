/**
 * Script to create comprehensive sample data for the UniRent system
 * Including landlords, agents, properties, tenants, maintenance requests,
 * deposit registrations, and property valuations
 * 
 * Run with: node scripts/create-sample-data-fixed.js
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
        
        // Add agent-specific info in a separate table if needed
        await pool.query(
          `INSERT INTO agent_details (agent_id, agency_name, specialization, years_of_experience)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (agent_id) DO UPDATE 
           SET agency_name = $2, specialization = $3, years_of_experience = $4`,
          [userId.rows[0].id, agent.agency, agent.specialization, agent.yearsOfExperience]
        );
        
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
        
        // Add landlord-specific info in a separate table if needed
        await pool.query(
          `INSERT INTO landlord_details (landlord_id, portfolio_size, preferred_contact_method, account_manager)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (landlord_id) DO UPDATE 
           SET portfolio_size = $2, preferred_contact_method = $3, account_manager = $4`,
          [userId.rows[0].id, landlord.portfolioSize, landlord.preferredContactMethod, landlord.accountManager]
        );
        
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
          `INSERT INTO users (name, email, password, user_type, phone, verified, studentUniversityEmail, studentVerificationStatus)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [tenant.name, tenant.email, hashedPassword, 'tenant', tenant.phone, true, tenant.email, 'verified']
        );
        
        // Add tenant-specific info in a separate table if needed
        await pool.query(
          `INSERT INTO tenant_details (tenant_id, university, course_year, study_field)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (tenant_id) DO UPDATE 
           SET university = $2, course_year = $3, study_field = $4`,
          [userId.rows[0].id, tenant.university, tenant.courseYear, tenant.studyField]
        );
        
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
        propertyType: 'house',
        bedrooms: 3,
        bathrooms: 2,
        furnished: true,
        rent: '420',
        rentPeriod: 'per room per month',
        deposit: '1260',
        location: 'Hyde Park, Leeds',
        address: '15 Woodhouse Lane, Leeds, LS2 3AP',
        city: 'Leeds',
        postcode: 'LS2 3AP',
        nearestUniversity: 'University of Leeds',
        distanceToUniversity: 0.5,
        availableFrom: '2025-09-01',
        minTenancyLength: 12,
        billsIncluded: true,
        includedBills: ['water', 'internet', 'electricity'],
        features: ['garden', 'washing machine', 'dishwasher', 'central heating'],
        images: ['/images/property1_1.jpg', '/images/property1_2.jpg'],
        energyRating: 'B',
        councilTaxBand: 'C',
        petFriendly: false,
        smokingAllowed: false,
        parkingAvailable: true,
        epcCertificateUrl: '/documents/epc_property1.pdf',
        landlordId: landlords[0].id,
        agentId: agents[0].id,
        managed_by: 'agent',
        valuation: {
          purchasePrice: 280000,
          currentValue: 325000,
          lastValuationDate: '2025-01-15',
          rentalYield: 6.5,
          comparableProperties: [
            { address: '17 Woodhouse Lane', soldPrice: 310000, soldDate: '2024-10-15' },
            { address: '21 Woodhouse Lane', soldPrice: 325000, soldDate: '2024-11-02' }
          ],
          improvementOpportunities: [
            { type: 'Kitchen renovation', estimatedCost: 15000, estimatedValueIncrease: 25000 },
            { type: 'Energy efficiency upgrade', estimatedCost: 8000, estimatedValueIncrease: 12000 }
          ]
        }
      },
      {
        title: 'Luxury 2-Bed Apartment in Manchester City Centre',
        description: 'Modern 2-bedroom apartment in the heart of Manchester. High-spec finishes throughout with stunning city views. Perfect for professionals or postgraduate students.',
        propertyType: 'apartment',
        bedrooms: 2,
        bathrooms: 2,
        furnished: true,
        rent: '1500',
        rentPeriod: 'per month',
        deposit: '1500',
        location: 'City Centre, Manchester',
        address: '45 Deansgate, Manchester, M3 2AY',
        city: 'Manchester',
        postcode: 'M3 2AY',
        nearestUniversity: 'Manchester University',
        distanceToUniversity: 1.2,
        availableFrom: '2025-07-15',
        minTenancyLength: 6,
        billsIncluded: false,
        features: ['balcony', 'concierge', 'gym', 'parking', 'furnished'],
        images: ['/images/property2_1.jpg', '/images/property2_2.jpg'],
        energyRating: 'A',
        councilTaxBand: 'D',
        petFriendly: true,
        smokingAllowed: false,
        parkingAvailable: true,
        epcCertificateUrl: '/documents/epc_property2.pdf',
        landlordId: landlords[1].id,
        agentId: agents[1].id,
        managed_by: 'agent',
        valuation: {
          purchasePrice: 350000,
          currentValue: 380000,
          lastValuationDate: '2025-02-10',
          rentalYield: 5.2,
          comparableProperties: [
            { address: '50 Deansgate', soldPrice: 375000, soldDate: '2024-09-20' },
            { address: '32 Deansgate', soldPrice: 385000, soldDate: '2024-12-05' }
          ],
          improvementOpportunities: [
            { type: 'Smart home integration', estimatedCost: 5000, estimatedValueIncrease: 10000 }
          ]
        }
      },
      {
        title: '5-Bed Student House with Garden in Birmingham',
        description: 'Large 5-bedroom student house in Selly Oak. Ideal for group of friends wanting to live together. Spacious garden and common areas.',
        propertyType: 'house',
        bedrooms: 5,
        bathrooms: 2,
        furnished: true,
        rent: '380',
        rentPeriod: 'per room per month',
        deposit: '1900',
        location: 'Selly Oak, Birmingham',
        address: '28 Bristol Road, Birmingham, B29 6BJ',
        city: 'Birmingham',
        postcode: 'B29 6BJ',
        nearestUniversity: 'University of Birmingham',
        distanceToUniversity: 0.8,
        availableFrom: '2025-09-01',
        minTenancyLength: 12,
        billsIncluded: false,
        features: ['large garden', 'driveway', 'washing machine', 'dishwasher', 'high-speed internet'],
        images: ['/images/property3_1.jpg', '/images/property3_2.jpg'],
        energyRating: 'C',
        councilTaxBand: 'C',
        petFriendly: false,
        smokingAllowed: false,
        parkingAvailable: true,
        epcCertificateUrl: '/documents/epc_property3.pdf',
        landlordId: landlords[2].id,
        agentId: agents[2].id,
        managed_by: 'agent',
        valuation: {
          purchasePrice: 320000,
          currentValue: 350000,
          lastValuationDate: '2025-01-05',
          rentalYield: 7.2,
          comparableProperties: [
            { address: '30 Bristol Road', soldPrice: 335000, soldDate: '2024-08-15' },
            { address: '22 Bristol Road', soldPrice: 340000, soldDate: '2024-11-20' }
          ],
          improvementOpportunities: [
            { type: 'Bathroom renovation', estimatedCost: 12000, estimatedValueIncrease: 20000 },
            { type: 'Loft conversion', estimatedCost: 35000, estimatedValueIncrease: 60000 }
          ]
        }
      },
      {
        title: 'Modern Studio Apartment for Students',
        description: 'Contemporary studio apartment perfect for individual students or couples. All-inclusive bills with high-speed internet and on-site facilities.',
        propertyType: 'studio',
        bedrooms: 1,
        bathrooms: 1,
        furnished: true,
        rent: '850',
        rentPeriod: 'per month',
        deposit: '850',
        location: 'Headingley, Leeds',
        address: '5 Otley Road, Leeds, LS6 3AA',
        city: 'Leeds',
        postcode: 'LS6 3AA',
        nearestUniversity: 'Leeds Beckett University',
        distanceToUniversity: 1.5,
        availableFrom: '2025-08-15',
        minTenancyLength: 9,
        billsIncluded: true,
        includedBills: ['water', 'electricity', 'gas', 'internet', 'council tax'],
        features: ['on-site gym', 'study spaces', 'communal areas', 'bike storage', '24/7 security'],
        images: ['/images/property4_1.jpg', '/images/property4_2.jpg'],
        energyRating: 'A',
        councilTaxBand: 'A',
        petFriendly: false,
        smokingAllowed: false,
        parkingAvailable: false,
        epcCertificateUrl: '/documents/epc_property4.pdf',
        landlordId: landlords[3].id,
        agentId: agents[0].id,
        managed_by: 'agent',
        valuation: {
          purchasePrice: 120000,
          currentValue: 135000,
          lastValuationDate: '2025-03-01',
          rentalYield: 7.5,
          comparableProperties: [
            { address: '8 Otley Road', soldPrice: 128000, soldDate: '2024-10-05' },
            { address: '12 Otley Road', soldPrice: 132000, soldDate: '2024-12-12' }
          ],
          improvementOpportunities: [
            { type: 'Bathroom upgrade', estimatedCost: 4000, estimatedValueIncrease: 8000 }
          ]
        }
      }
    ];
    
    for (const property of properties) {
      // Check if property already exists
      const checkProperty = await pool.query(
        'SELECT * FROM properties WHERE address = $1',
        [property.address]
      );
      
      if (checkProperty.rows.length === 0) {
        const propertyId = await pool.query(
          `INSERT INTO properties (
            title, description, propertyType, bedrooms, bathrooms, furnished,
            rent, rentPeriod, deposit, location, address, city, postcode,
            nearestUniversity, distanceToUniversity, availableFrom, minTenancyLength,
            billsIncluded, features, images, energyRating, councilTaxBand,
            petFriendly, smokingAllowed, parkingAvailable, epcCertificateUrl,
            landlordId, agentId, managed_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
          RETURNING id`,
          [
            property.title, property.description, property.propertyType, 
            property.bedrooms, property.bathrooms, property.furnished,
            property.rent, property.rentPeriod, property.deposit, property.location, 
            property.address, property.city, property.postcode,
            property.nearestUniversity, property.distanceToUniversity, 
            property.availableFrom, property.minTenancyLength,
            property.billsIncluded, JSON.stringify(property.features), 
            JSON.stringify(property.images), property.energyRating, 
            property.councilTaxBand, property.petFriendly, property.smokingAllowed,
            property.parkingAvailable, property.epcCertificateUrl,
            property.landlordId, property.agentId, property.managed_by
          ]
        );
        
        // Insert property valuation
        if (property.valuation) {
          await pool.query(
            `INSERT INTO property_valuations (
              property_id, purchase_price, current_value, last_valuation_date,
              rental_yield, comparable_properties, improvement_opportunities
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              propertyId.rows[0].id, property.valuation.purchasePrice, 
              property.valuation.currentValue, property.valuation.lastValuationDate,
              property.valuation.rentalYield, JSON.stringify(property.valuation.comparableProperties),
              JSON.stringify(property.valuation.improvementOpportunities)
            ]
          );
        }
        
        // Insert utility information if bills are included
        if (property.billsIncluded && property.includedBills) {
          for (const bill of property.includedBills) {
            await pool.query(
              `INSERT INTO property_utilities (
                property_id, utility_type, provider_name, plan_name, monthly_cost, 
                contract_end_date, auto_renewal, notes, included_in_rent
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                propertyId.rows[0].id, bill, 
                `Sample ${bill.charAt(0).toUpperCase() + bill.slice(1)} Provider`,
                `Standard ${bill.charAt(0).toUpperCase() + bill.slice(1)} Plan`,
                getRandomCost(bill), getRandomFutureDate(), true,
                `${bill.charAt(0).toUpperCase() + bill.slice(1)} included in rent`,
                true
              ]
            );
          }
        }
        
        console.log(`Created property: ${property.title} (${property.address})`);
      } else {
        console.log(`Property ${property.address} already exists, skipping creation`);
      }
    }
  } catch (error) {
    console.error('Error creating properties:', error);
  }
}

// Helper function to get random costs for utilities
function getRandomCost(utilityType) {
  const costs = {
    'water': 30,
    'electricity': 60,
    'gas': 50,
    'internet': 35,
    'council tax': 120
  };
  
  return costs[utilityType] || 40;
}

// Helper function to get random future date
function getRandomFutureDate() {
  const date = new Date();
  date.setMonth(date.getMonth() + Math.floor(Math.random() * 24) + 6);
  return date.toISOString().split('T')[0];
}

// Create sample tenancies and deposit registrations
async function createSampleTenancies() {
  console.log('Creating sample tenancies and deposit registrations...');
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
        propertyId: properties[0].id,
        tenant: tenants[0],
        startDate: '2024-09-01',
        endDate: '2025-08-31',
        rent: '420',
        depositAmount: '1260',
        depositProtected: true,
        depositProtectionScheme: 'Deposit Protection Service',
        depositProtectionId: 'DPS-12345678',
        status: 'active',
        signedByTenant: true,
        signedByLandlord: true,
        notes: 'First year student tenancy'
      },
      {
        propertyId: properties[1].id,
        tenant: tenants[1],
        startDate: '2024-07-15',
        endDate: '2025-01-14',
        rent: '1500',
        depositAmount: '1500',
        depositProtected: true,
        depositProtectionScheme: 'mydeposits',
        depositProtectionId: 'MYD-87654321',
        status: 'active',
        signedByTenant: true,
        signedByLandlord: true,
        notes: 'Short-term professional let'
      },
      {
        propertyId: properties[2].id,
        tenant: tenants[2],
        startDate: '2024-09-01',
        endDate: '2025-08-31',
        rent: '380',
        depositAmount: '1900',
        depositProtected: true,
        depositProtectionScheme: 'Tenancy Deposit Scheme',
        depositProtectionId: 'TDS-23456789',
        status: 'active',
        signedByTenant: true,
        signedByLandlord: true,
        notes: 'Group of 5 students sharing'
      }
    ];
    
    for (const tenancy of tenancies) {
      // Check if tenancy already exists
      const checkTenancy = await pool.query(
        'SELECT * FROM tenancies WHERE property_id = $1 AND tenant_id = $2',
        [tenancy.propertyId, tenancy.tenant.id]
      );
      
      if (checkTenancy.rows.length === 0) {
        const tenancyId = await pool.query(
          `INSERT INTO tenancies (
            property_id, tenant_id, start_date, end_date, rent_amount,
            deposit_amount, status, notes, signed_by_tenant, signed_by_landlord
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id`,
          [
            tenancy.propertyId, tenancy.tenant.id, tenancy.startDate,
            tenancy.endDate, tenancy.rent, tenancy.depositAmount,
            tenancy.status, tenancy.notes, tenancy.signedByTenant,
            tenancy.signedByLandlord
          ]
        );
        
        // Add deposit protection info
        if (tenancy.depositProtected) {
          await pool.query(
            `INSERT INTO deposit_protections (
              tenancy_id, deposit_amount, deposit_protection_scheme,
              deposit_protection_id, protected_date, certificate_url
            )
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              tenancyId.rows[0].id, tenancy.depositAmount,
              tenancy.depositProtectionScheme, tenancy.depositProtectionId,
              new Date().toISOString().split('T')[0],
              `/documents/deposit_certificate_${tenancyId.rows[0].id}.pdf`
            ]
          );
        }
        
        console.log(`Created tenancy for property: ${tenancy.propertyId} and tenant: ${tenancy.tenant.name}`);
      } else {
        console.log(`Tenancy for property: ${tenancy.propertyId} and tenant: ${tenancy.tenant.name} already exists, skipping creation`);
      }
    }
  } catch (error) {
    console.error('Error creating tenancies:', error);
  }
}

// Create sample maintenance requests
async function createSampleMaintenanceRequests() {
  console.log('Creating sample maintenance requests...');
  try {
    // Get properties with tenancies
    const tenanciesResult = await pool.query(
      `SELECT t.id as tenancy_id, t.property_id, t.tenant_id, p.address 
       FROM tenancies t
       JOIN properties p ON t.property_id = p.id
       WHERE t.status = 'active'`
    );
    const tenancies = tenanciesResult.rows;
    
    if (tenancies.length === 0) {
      console.log('No active tenancies found, cannot create maintenance requests');
      return;
    }
    
    const maintenanceRequests = [
      {
        tenancy: tenancies[0],
        title: 'Broken Boiler',
        description: 'The boiler is not working, no hot water or heating.',
        status: 'pending',
        priority: 'high',
        category: 'plumbing',
        reported_date: '2025-02-01',
        images: ['/images/maintenance_boiler.jpg'],
        contractor_assigned: false
      },
      {
        tenancy: tenancies[0],
        title: 'Leaking Kitchen Tap',
        description: 'The kitchen tap is constantly dripping and wasting water.',
        status: 'in-progress',
        priority: 'medium',
        category: 'plumbing',
        reported_date: '2025-01-15',
        scheduled_date: '2025-01-20',
        images: ['/images/maintenance_tap.jpg'],
        contractor_assigned: true,
        contractor_name: 'Leeds Plumbing Services',
        contractor_phone: '07700900123',
        notes: 'Needs replacement washer or new tap'
      },
      {
        tenancy: tenancies[1],
        title: 'Damaged Wall Socket',
        description: 'The wall socket in the living room appears to be damaged and has burn marks.',
        status: 'scheduled',
        priority: 'high',
        category: 'electrical',
        reported_date: '2025-01-25',
        scheduled_date: '2025-01-28',
        images: ['/images/maintenance_socket.jpg'],
        contractor_assigned: true,
        contractor_name: 'Manchester Electrical Contractors',
        contractor_phone: '07700900456',
        notes: 'Potentially dangerous, requires urgent attention'
      },
      {
        tenancy: tenancies[2],
        title: 'Window Won\'t Close Properly',
        description: 'The bedroom window has a faulty mechanism and won\'t close properly, causing drafts.',
        status: 'completed',
        priority: 'medium',
        category: 'windows/doors',
        reported_date: '2024-12-10',
        scheduled_date: '2024-12-15',
        completion_date: '2024-12-15',
        images: ['/images/maintenance_window.jpg'],
        contractor_assigned: true,
        contractor_name: 'Birmingham Window Repairs',
        contractor_phone: '07700900789',
        notes: 'Replaced handle and adjusted hinges',
        cost: '85'
      }
    ];
    
    for (const request of maintenanceRequests) {
      // Check if maintenance request already exists
      const checkRequest = await pool.query(
        'SELECT * FROM maintenance_requests WHERE title = $1 AND property_id = $2',
        [request.title, request.tenancy.property_id]
      );
      
      if (checkRequest.rows.length === 0) {
        await pool.query(
          `INSERT INTO maintenance_requests (
            property_id, tenant_id, title, description, status,
            priority, category, reported_date, scheduled_date, completion_date,
            images, contractor_assigned, contractor_name, contractor_phone,
            notes, cost
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [
            request.tenancy.property_id, request.tenancy.tenant_id, 
            request.title, request.description, request.status,
            request.priority, request.category, request.reported_date,
            request.scheduled_date || null, request.completion_date || null,
            JSON.stringify(request.images || []), request.contractor_assigned,
            request.contractor_name || null, request.contractor_phone || null,
            request.notes || null, request.cost || null
          ]
        );
        
        console.log(`Created maintenance request: ${request.title} for property ID: ${request.tenancy.property_id}`);
      } else {
        console.log(`Maintenance request "${request.title}" for property ID: ${request.tenancy.property_id} already exists, skipping creation`);
      }
    }
  } catch (error) {
    console.error('Error creating maintenance requests:', error);
  }
}

// Ensure tables exist before adding data
async function ensureTablesExist() {
  console.log('Checking if required tables exist...');
  try {
    // Check users table
    const userTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!userTableCheck.rows[0].exists) {
      await pool.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          user_type TEXT NOT NULL,
          phone TEXT,
          verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Users table created');
    }
    
    // Check agent_details table
    const agentTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'agent_details'
      );
    `);
    
    if (!agentTableCheck.rows[0].exists) {
      await pool.query(`
        CREATE TABLE agent_details (
          agent_id INTEGER PRIMARY KEY REFERENCES users(id),
          agency_name TEXT,
          specialization TEXT,
          years_of_experience INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Agent details table created');
    }
    
    // Check landlord_details table
    const landlordTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'landlord_details'
      );
    `);
    
    if (!landlordTableCheck.rows[0].exists) {
      await pool.query(`
        CREATE TABLE landlord_details (
          landlord_id INTEGER PRIMARY KEY REFERENCES users(id),
          portfolio_size INTEGER,
          preferred_contact_method TEXT,
          account_manager TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Landlord details table created');
    }
    
    // Check tenant_details table
    const tenantTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tenant_details'
      );
    `);
    
    if (!tenantTableCheck.rows[0].exists) {
      await pool.query(`
        CREATE TABLE tenant_details (
          tenant_id INTEGER PRIMARY KEY REFERENCES users(id),
          university TEXT,
          course_year INTEGER,
          study_field TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Tenant details table created');
    }
    
    // Check properties table
    const propertiesTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'properties'
      );
    `);
    
    if (!propertiesTableCheck.rows[0].exists) {
      await pool.query(`
        CREATE TABLE properties (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          propertyType TEXT,
          bedrooms INTEGER,
          bathrooms INTEGER,
          furnished BOOLEAN,
          rent TEXT,
          rentPeriod TEXT,
          deposit TEXT,
          location TEXT,
          address TEXT UNIQUE NOT NULL,
          city TEXT,
          postcode TEXT,
          nearestUniversity TEXT,
          distanceToUniversity FLOAT,
          availableFrom DATE,
          minTenancyLength INTEGER,
          billsIncluded BOOLEAN,
          features JSONB,
          images JSONB,
          energyRating TEXT,
          councilTaxBand TEXT,
          petFriendly BOOLEAN,
          smokingAllowed BOOLEAN,
          parkingAvailable BOOLEAN,
          epcCertificateUrl TEXT,
          landlordId INTEGER REFERENCES users(id),
          agentId INTEGER REFERENCES users(id),
          managed_by TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Properties table created');
    } else {
      // Check if managed_by column exists
      const managedByCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'properties'
          AND column_name = 'managed_by'
        );
      `);
      
      if (!managedByCheck.rows[0].exists) {
        await pool.query(`
          ALTER TABLE properties 
          ADD COLUMN managed_by TEXT,
          ADD COLUMN agent_id INTEGER REFERENCES users(id);
        `);
        console.log('Added managed_by and agent_id columns to properties table');
      }
    }
    
    // Check property_valuations table
    const valuationsTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'property_valuations'
      );
    `);
    
    if (!valuationsTableCheck.rows[0].exists) {
      await pool.query(`
        CREATE TABLE property_valuations (
          id SERIAL PRIMARY KEY,
          property_id INTEGER REFERENCES properties(id),
          purchase_price INTEGER,
          current_value INTEGER,
          last_valuation_date DATE,
          rental_yield FLOAT,
          comparable_properties JSONB,
          improvement_opportunities JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Property valuations table created');
    }
    
    // Check property_utilities table
    const utilitiesTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'property_utilities'
      );
    `);
    
    if (!utilitiesTableCheck.rows[0].exists) {
      await pool.query(`
        CREATE TABLE property_utilities (
          id SERIAL PRIMARY KEY,
          property_id INTEGER REFERENCES properties(id),
          utility_type TEXT,
          provider_name TEXT,
          plan_name TEXT,
          monthly_cost FLOAT,
          contract_end_date DATE,
          auto_renewal BOOLEAN,
          notes TEXT,
          included_in_rent BOOLEAN,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Property utilities table created');
    }
    
    // Check tenancies table
    const tenanciesTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tenancies'
      );
    `);
    
    if (!tenanciesTableCheck.rows[0].exists) {
      await pool.query(`
        CREATE TABLE tenancies (
          id SERIAL PRIMARY KEY,
          property_id INTEGER REFERENCES properties(id),
          tenant_id INTEGER REFERENCES users(id),
          start_date DATE,
          end_date DATE,
          rent_amount TEXT,
          deposit_amount TEXT,
          status TEXT,
          notes TEXT,
          signed_by_tenant BOOLEAN,
          signed_by_landlord BOOLEAN,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Tenancies table created');
    }
    
    // Check deposit_protections table
    const depositProtectionsTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'deposit_protections'
      );
    `);
    
    if (!depositProtectionsTableCheck.rows[0].exists) {
      await pool.query(`
        CREATE TABLE deposit_protections (
          id SERIAL PRIMARY KEY,
          tenancy_id INTEGER REFERENCES tenancies(id),
          deposit_amount TEXT,
          deposit_protection_scheme TEXT,
          deposit_protection_id TEXT,
          protected_date DATE,
          certificate_url TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Deposit protections table created');
    }
    
    // Check maintenance_requests table
    const maintenanceRequestsTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'maintenance_requests'
      );
    `);
    
    if (!maintenanceRequestsTableCheck.rows[0].exists) {
      await pool.query(`
        CREATE TABLE maintenance_requests (
          id SERIAL PRIMARY KEY,
          property_id INTEGER REFERENCES properties(id),
          tenant_id INTEGER REFERENCES users(id),
          title TEXT NOT NULL,
          description TEXT,
          status TEXT,
          priority TEXT,
          category TEXT,
          reported_date DATE,
          scheduled_date DATE,
          completion_date DATE,
          images JSONB,
          contractor_assigned BOOLEAN,
          contractor_name TEXT,
          contractor_phone TEXT,
          notes TEXT,
          cost TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Maintenance requests table created');
    }
    
    console.log('All required tables exist or have been created');
  } catch (error) {
    console.error('Error ensuring tables exist:', error);
  }
}

// Main function to create sample data
async function main() {
  try {
    console.log('Starting sample data creation...');
    
    // Ensure all required tables exist
    await ensureTablesExist();
    
    // Create users with different roles
    await createSampleAgents();
    await createSampleLandlords();
    await createSampleTenants();
    
    // Create properties and related data
    await createSampleProperties();
    await createSampleTenancies();
    await createSampleMaintenanceRequests();
    
    console.log('Sample data creation completed successfully!');
  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    await pool.end();
  }
}

// Execute main function
main();