import { db } from '../db';
import { aiProviders, users, properties } from '@shared/schema';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

/**
 * Seed the database with initial data
 * Run this script with: npm run seed
 */
async function seedDatabase() {
  console.log('Seeding database...');
  
  // Seed AI providers
  const existingProviders = await db.select().from(aiProviders);
  
  if (existingProviders.length === 0) {
    console.log('Seeding AI providers...');
    
    await db.insert(aiProviders).values([
      {
        name: 'gemini',
        displayName: 'Google Gemini',
        active: true,
        priority: 1,
        status: 'active',
        capabilities: ['text', 'image'] as any,
      },
      {
        name: 'openai',
        displayName: 'OpenAI',
        active: true,
        priority: 2,
        status: 'active',
        capabilities: ['text', 'image', 'audio'] as any,
      },
      {
        name: 'huggingface',
        displayName: 'Hugging Face',
        active: false,
        priority: 3,
        status: 'inactive',
        capabilities: ['text'] as any,
      },
      {
        name: 'mistral',
        displayName: 'Mistral AI',
        active: false,
        priority: 4,
        status: 'inactive',
        capabilities: ['text'] as any,
      }
    ]);
    
    console.log('✅ AI providers seeded successfully');
  } else {
    console.log('AI providers already exist, skipping seed...');
  }
  
  // Seed admin user if it doesn't exist
  const adminEmail = 'admin@unirent.com';
  const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail));
  
  if (existingAdmin.length === 0) {
    console.log('Seeding admin user...');
    
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin User',
      userType: 'admin',
      verified: true,
    });
    
    console.log('✅ Admin user seeded successfully');
  } else {
    console.log('Admin user already exists, skipping seed...');
  }
  
  // Seed a landlord user if it doesn't exist
  const landlordEmail = 'landlord@unirent.com';
  const existingLandlord = await db.select().from(users).where(eq(users.email, landlordEmail));
  
  if (existingLandlord.length === 0) {
    console.log('Seeding landlord user...');
    
    const hashedPassword = await bcrypt.hash('Landlord123!', 10);
    
    await db.insert(users).values({
      email: landlordEmail,
      password: hashedPassword,
      name: 'Test Landlord',
      phone: '07700900000',
      userType: 'landlord',
      verified: true,
    });
    
    console.log('✅ Landlord user seeded successfully');
  } else {
    console.log('Landlord user already exists, skipping seed...');
  }
  
  // Seed an agent user if it doesn't exist
  const agentEmail = 'agent@unirent.com';
  const existingAgent = await db.select().from(users).where(eq(users.email, agentEmail));
  
  if (existingAgent.length === 0) {
    console.log('Seeding agent user...');
    
    const hashedPassword = await bcrypt.hash('Agent123!', 10);
    
    await db.insert(users).values({
      email: agentEmail,
      password: hashedPassword,
      name: 'Test Agent',
      phone: '07700900001',
      userType: 'agent',
      verified: true,
    });
    
    console.log('✅ Agent user seeded successfully');
  } else {
    console.log('Agent user already exists, skipping seed...');
  }
  
  // Seed a tenant user if it doesn't exist
  const tenantEmail = 'tenant@unirent.com';
  const existingTenant = await db.select().from(users).where(eq(users.email, tenantEmail));
  
  if (existingTenant.length === 0) {
    console.log('Seeding tenant user...');
    
    const hashedPassword = await bcrypt.hash('Tenant123!', 10);
    
    await db.insert(users).values({
      email: tenantEmail,
      password: hashedPassword,
      name: 'Test Tenant',
      phone: '07700900002',
      userType: 'tenant',
      verified: true,
    });
    
    console.log('✅ Tenant user seeded successfully');
  } else {
    console.log('Tenant user already exists, skipping seed...');
  }
  
  // Seed sample properties if none exist
  const existingProperties = await db.select().from(properties);
  const landlord = await db.select().from(users).where(eq(users.email, landlordEmail));
  
  if (existingProperties.length === 0 && landlord.length > 0) {
    console.log('Seeding sample properties...');
    
    // Get the landlord id
    const landlordId = landlord[0].id;
    
    await db.insert(properties).values([
      {
        title: '3 Bedroom Student House',
        description: 'A spacious 3 bedroom student house close to the university campus with all bills included.',
        address: '123 University Road',
        city: 'Leeds',
        postcode: 'LS1 1AA',
        price: 350,
        propertyType: 'house',
        bedrooms: 3,
        bathrooms: 1,
        available: true,
        availableDate: '1st September 2025',
        area: 'Hyde Park',
        features: ['Garden', 'Washing Machine', 'Dishwasher', 'Furnished'] as any,
        images: ['https://placehold.co/600x400?text=Student+House'] as any,
        ownerId: landlordId,
        university: 'University of Leeds',
        distanceToUniversity: '0.5 miles',
        furnished: true,
        billsIncluded: true,
        includedBills: ['Gas', 'Electricity', 'Water', 'Internet'] as any,
      },
      {
        title: '5 Bedroom Luxury Student House',
        description: 'A modern 5 bedroom student house with ensuite bathrooms and all bills included.',
        address: '45 Headingley Lane',
        city: 'Leeds',
        postcode: 'LS6 2AB',
        price: 450,
        propertyType: 'house',
        bedrooms: 5,
        bathrooms: 5,
        available: true,
        availableDate: '1st September 2025',
        area: 'Headingley',
        features: ['Garden', 'Ensuite Bathrooms', 'Washing Machine', 'Dishwasher', 'Furnished', 'High Speed WiFi'] as any,
        images: ['https://placehold.co/600x400?text=Luxury+Student+House'] as any,
        ownerId: landlordId,
        university: 'Leeds Beckett University',
        distanceToUniversity: '1 mile',
        furnished: true,
        billsIncluded: true,
        includedBills: ['Gas', 'Electricity', 'Water', 'Internet', 'TV License'] as any,
      }
    ]);
    
    console.log('✅ Sample properties seeded successfully');
  } else {
    console.log('Properties already exist or landlord not found, skipping seed...');
  }
  
  console.log('Database seeding completed');
}

// Run the seed function if this script is executed directly
// Using import.meta.url to check if this is the main module in ESM
if (import.meta.url === import.meta.resolve(process.argv[1])) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error seeding database:', error);
      process.exit(1);
    });
}

export { seedDatabase };