/**
 * Test Data Population Script
 * 
 * This script populates the database with test data for:
 * - Properties
 * - Users (Landlords, Agents, Tenants, Admin)
 * - Maintenance Requests
 * - Certificates
 * - Applications
 * - Tenancies
 */

import { db } from "../db";
import { properties, users, maintenanceRequests, safetyCertificates, applications, tenancies } from "@shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Helper function to hash passwords
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Cities and areas for properties
const cities = [
  "Leeds",
  "Manchester",
  "Birmingham",
  "London",
  "Sheffield",
  "Liverpool",
  "Nottingham",
  "Bristol",
  "Newcastle",
  "Cardiff"
];

const areas = {
  "Leeds": ["Headingley", "Hyde Park", "Woodhouse", "City Centre", "Burley"],
  "Manchester": ["Fallowfield", "Withington", "Rusholme", "City Centre", "Didsbury"],
  "Birmingham": ["Selly Oak", "Edgbaston", "Harborne", "City Centre", "Moseley"],
  "London": ["Camden", "Islington", "Shoreditch", "Brixton", "Clapham"],
  "Sheffield": ["Broomhill", "Ecclesall Road", "City Centre", "Crookes", "Walkley"],
  "Liverpool": ["City Centre", "Wavertree", "Smithdown Road", "Toxteth", "Aigburth"],
  "Nottingham": ["Lenton", "Dunkirk", "City Centre", "Beeston", "The Park"],
  "Bristol": ["Clifton", "Redland", "City Centre", "Stokes Croft", "Cotham"],
  "Newcastle": ["Jesmond", "Heaton", "City Centre", "Sandyford", "Fenham"],
  "Cardiff": ["Cathays", "Roath", "City Centre", "Heath", "Canton"]
};

// Property types
const propertyTypes = ["house", "flat", "apartment", "studio", "student hall"];

// Certificate types
const certificateTypes = ["Gas Safety", "EPC", "Electrical Safety", "HMO License", "Fire Safety"];

// Maintenance request types
const maintenanceRequestPriorities = ["low", "medium", "high", "emergency"];
const maintenanceRequestStatuses = ["new", "assigned", "in progress", "completed"];
const maintenanceRequestTitles = [
  "Broken boiler", 
  "Leaking tap", 
  "Faulty shower", 
  "Broken window", 
  "Electrical issue",
  "Broken door lock",
  "Mold in bathroom",
  "Blocked toilet",
  "Heating not working",
  "Pest control needed"
];

// Application statuses
const applicationStatuses = ["pending", "approved", "rejected", "on hold"];

// Tenancy statuses
const tenancyStatuses = ["active", "upcoming", "ended", "cancelled"];

// Random item selection
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Random date within a range
function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  // Ensure this is a valid Date object
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.warn("Invalid date provided:", date);
    return new Date().toISOString().split('T')[0]; // Return current date as fallback
  }
  return date.toISOString().split('T')[0];
}

// Test data population
async function populateTestData() {
  try {
    console.log("Starting test data population...");

    // Check if we already have data
    const existingProperties = await db.select().from(properties);
    console.log("Data exists in the database. Found", existingProperties.length, "properties.");
    if (existingProperties.length >= 20) {
      console.log("There are already at least 20 properties in the database. Skipping data population to avoid duplicates.");
      return { landlords: [], agents: [], tenants: [], properties: existingProperties };
    }
    
    console.log("Adding more properties to the database...");
    // Continue with data population to add more properties

    // Clear existing data (uncomment if needed)
    // Warning: This will delete all existing data
    /*
    await db.delete(tenancies);
    await db.delete(applications);
    await db.delete(maintenanceRequests);
    await db.delete(safetyCertificates);
    await db.delete(properties);
    await db.delete(users);
    */

    // Create test users
    console.log("Creating test users...");
    
    // Check if admin user exists
    let adminUser = await db.select().from(users).where(eq(users.email, "admin@studentmoves.com"));
    
    if (adminUser.length === 0) {
      // Admin user doesn't exist, create one
      adminUser = await db.insert(users).values({
        name: "Admin User",
        email: "admin@studentmoves.com",
        phone: "07123456789",
        password: await hashPassword("Admin123!"),
        userType: "admin",
        verified: true,
        createdAt: new Date(),
        billingAddress: "123 Admin Street, London"
      }).returning();
    } else {
      console.log("Admin user already exists, skipping creation");
    }
    
    // Load existing users
    const existingLandlords = await db.select().from(users).where(eq(users.userType, "landlord"));
    const existingAgents = await db.select().from(users).where(eq(users.userType, "agent"));
    const existingTenants = await db.select().from(users).where(eq(users.userType, "tenant"));
    
    console.log(`Found ${existingLandlords.length} existing landlords, ${existingAgents.length} existing agents, and ${existingTenants.length} existing tenants`);
    
    // Landlords
    const landlords = [...existingLandlords];
    if (existingLandlords.length === 0) {
      for (let i = 1; i <= 5; i++) {
        try {
          const landlord = await db.insert(users).values({
            name: `Landlord ${i}`,
            email: `landlord${i}@example.com`,
            phone: `0712345${i}000`,
            password: await hashPassword("Landlord123!"),
            userType: "landlord",
            verified: true,
            createdAt: new Date(),
            billingAddress: `${100 + i} Landlord Street, ${getRandomItem(cities)}`,
            whatsappVerified: i % 2 === 0
          }).returning();
          
          landlords.push(landlord[0]);
        } catch (error: any) {
          console.log(`Error creating landlord ${i}, skipping:`, error.message);
        }
      }
    }
    
    // Agents
    const agents = [...existingAgents];
    if (existingAgents.length === 0) {
      for (let i = 1; i <= 3; i++) {
        try {
          const agent = await db.insert(users).values({
            name: `Agent ${i}`,
            email: `agent${i}@example.com`,
            phone: `0712345${i}500`,
            password: await hashPassword("Agent123!"),
            userType: "agent",
            verified: true,
            createdAt: new Date(),
            billingAddress: `${200 + i} Agent Street, ${getRandomItem(cities)}`,
            whatsappVerified: i % 2 === 0
          }).returning();
          
          agents.push(agent[0]);
        } catch (error: any) {
          console.log(`Error creating agent ${i}, skipping:`, error.message);
        }
      }
    }
    
    // Tenants
    const tenants = [...existingTenants];
    if (existingTenants.length === 0) {
      for (let i = 1; i <= 15; i++) {
        try {
          const tenant = await db.insert(users).values({
            name: `Tenant ${i}`,
            email: `tenant${i}@example.com`,
            phone: `0712345${i}999`,
            password: await hashPassword("Tenant123!"),
            userType: "tenant",
            verified: true,
            createdAt: new Date(),
            billingAddress: i <= 5 ? `${300 + i} Tenant Street, ${getRandomItem(cities)}` : null,
            whatsappVerified: i % 3 === 0
          }).returning();
          
          tenants.push(tenant[0]);
        } catch (error: any) {
          console.log(`Error creating tenant ${i}, skipping:`, error.message);
        }
      }
    }
    
    // Create test properties
    console.log("Creating test properties...");
    const testProperties = [];
    
    for (let i = 1; i <= 20; i++) {
      const city = getRandomItem(cities);
      const area = getRandomItem(areas[city as keyof typeof areas]);
      const bedrooms = Math.floor(Math.random() * 6) + 1;
      const bathrooms = Math.floor(Math.random() * 3) + 1;
      const propertyType = getRandomItem(propertyTypes);
      const available = Math.random() > 0.3; // 70% available
      // Generate and validate available date
      const availableDateObj = getRandomDate(new Date(), new Date(new Date().setMonth(new Date().getMonth() + 6)));
      const availableDate = formatDate(availableDateObj);
      const furnished = Math.random() > 0.2; // 80% furnished
      
      // Calculate price based on bedrooms and city
      const basePrice = 85 + (bedrooms * 10); // Base weekly price per person
      const cityMultiplier = city === "London" ? 1.5 : (city === "Manchester" || city === "Birmingham" ? 1.2 : 1);
      const weeklyPrice = Math.round(basePrice * cityMultiplier);
      
      // Create property title
      const titles = [
        `${bedrooms} Bedroom ${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)} in ${area}`,
        `Modern ${bedrooms} Bed ${propertyType} near ${area} ${city} University`,
        `Spacious ${bedrooms} Bedroom ${propertyType} in ${area}`,
        `${bedrooms} Bed Student ${propertyType} in ${area}, ${city}`,
        `Luxury ${bedrooms} Bedroom ${propertyType} in ${area}`
      ];
      
      // Determine owner (landlord or agent)
      const selectedLandlord = getRandomItem(landlords);
      const useAgent = Math.random() > 0.5; // 50% have agents
      const selectedAgent = useAgent ? getRandomItem(agents) : null;
      // Owner will be the agent if property is managed by agent, otherwise the landlord
      const ownerId = selectedAgent ? selectedAgent.id : selectedLandlord.id;
      
      const property = await db.insert(properties).values({
        title: getRandomItem(titles),
        description: `A fantastic ${bedrooms} bedroom ${propertyType} located in the popular student area of ${area}, ${city}. This property features ${bathrooms} bathroom${bathrooms > 1 ? 's' : ''}, a modern kitchen, and spacious living areas. All bills included - gas, electricity, water, and high-speed broadband. Perfect for students at nearby universities.`,
        address: `${i} ${["Park", "University", "College", "Student", "Campus"][Math.floor(Math.random() * 5)]} ${["Road", "Street", "Avenue", "Lane", "Drive"][Math.floor(Math.random() * 5)]}`,
        area: area,
        city: city,
        postcode: `${city.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 10)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
        price: (weeklyPrice * bedrooms).toString(),
        pricePerPerson: weeklyPrice.toString(),
        propertyType: propertyType,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        available: available,
        availableDate: availableDate,
        furnished: furnished,
        createdAt: getRandomDate(new Date(new Date().setMonth(new Date().getMonth() - 6)), new Date()),
        updatedAt: new Date(),
        ownerId: ownerId,
        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267", "https://images.unsplash.com/photo-1560185127-6ed189bf02f4", "https://images.unsplash.com/photo-1560448205-4d9b3e6bb6db"].map(url => `${url}?w=800`),
        depositAmount: (weeklyPrice * bedrooms * 4).toString(), // 4 weeks rent as deposit
        depositProtectionScheme: "Deposit Protection Service",
        depositProtectionId: `DPS${Math.floor(10000000 + Math.random() * 90000000)}`,
        billsIncluded: true,
        features: ["Dishwasher", "Washer/Dryer", "High-Speed Internet", "Central Heating", "Double Glazing", "Security Alarm"].filter(() => Math.random() > 0.5),
        hmoLicensed: bedrooms > 4 ? true : false,
        smokingAllowed: false,
        parkingAvailable: Math.random() > 0.7, // 30% parking available
        university: getRandomItem(["University of Leeds", "Manchester University", "University of Birmingham", "UCL", "University of Sheffield"]),
        distanceToUniversity: `${Math.floor(Math.random() * 20) + 1} minutes`, // 1-20 minutes to university
        epcRating: getRandomItem(["A", "B", "C", "D"]),
        virtualTourUrl: Math.random() > 0.7 ? "https://example.com/virtual-tour" : null,
        petsAllowed: Math.random() > 0.8, // 20% pet friendly
        includedBills: ["gas", "electricity", "water", "broadband"]
      }).returning();
      
      testProperties.push(property[0]);
      
      // Create certificates for this property
      for (const certType of certificateTypes) {
        if (Math.random() > 0.3) { // 70% chance to create each certificate type
          try {
            const issueDate = getRandomDate(new Date(new Date().setFullYear(new Date().getFullYear() - 2)), new Date());
            let expiryDate = new Date(issueDate);
            expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Certificates valid for 1 year
            
            const expired = Math.random() > 0.7; // 30% chance of being expired
            if (expired) {
              expiryDate = getRandomDate(issueDate, new Date()); // Expired date between issue date and today
            }
            
            // Convert dates to strings in YYYY-MM-DD format directly
            const issueDateStr = issueDate instanceof Date ? issueDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            const expiryDateStr = expiryDate instanceof Date ? expiryDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            
            await db.insert(safetyCertificates).values({
              propertyId: property[0].id,
              type: certType,
              issueDate: issueDateStr,
              expiryDate: expiryDateStr,
              certificateNumber: `CERT-${certType.substring(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`,
              issuedBy: certType === "EPC" ? "Energy Authority" : certType === "HMO License" ? "Local Council" : "Qualified Engineer",
              status: expired ? "expired" : "valid",
              documentUrl: "https://example.com/certificate.pdf",
              createdAt: new Date(),
              updatedAt: new Date()
            });
          } catch (error: any) {
            console.error(`Error creating certificate ${certType} for property ${property[0].id}:`, error.message);
          }
        }
      }
      
      // Create maintenance requests for this property
      const numRequests = Math.floor(Math.random() * 4); // 0-3 maintenance requests per property
      for (let j = 0; j < numRequests; j++) {
        try {
          const status = getRandomItem(maintenanceRequestStatuses);
          const createdDate = getRandomDate(new Date(new Date().setMonth(new Date().getMonth() - 3)), new Date());
          let completedDate = null;
          if (status === "completed") {
            completedDate = getRandomDate(createdDate, new Date());
          }
          
          // Convert dates to strings in YYYY-MM-DD format directly
          const reportedDateStr = createdDate instanceof Date ? createdDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          const completedDateStr = completedDate instanceof Date ? completedDate.toISOString().split('T')[0] : null;
          
          await db.insert(maintenanceRequests).values({
            propertyId: property[0].id,
            title: getRandomItem(maintenanceRequestTitles),
            description: `This is a detailed description of the maintenance issue. ${status === "completed" ? "This issue has been resolved." : "Please address this issue as soon as possible."}`,
            priority: getRandomItem(maintenanceRequestPriorities),
            status: status,
            reportedDate: reportedDateStr,
            completedDate: completedDateStr,
            tenantId: Math.random() > 0.5 ? getRandomItem(tenants).id : null,
            assignedAgentId: status !== "new" ? getRandomItem([...landlords, ...agents]).id : null,
            images: Math.random() > 0.5 ? ["https://images.unsplash.com/photo-1520013817300-1f4c1cb245ef?w=500"] : [],
            notes: status !== "new" ? "Contractor has been notified and will attend to this issue." : null
          });
        } catch (error: any) {
          console.error(`Error creating maintenance request for property ${property[0].id}:`, error.message);
        }
      }
      
      // Create applications for this property
      if (available && Math.random() > 0.5) { // 50% chance for available properties
        const numApplications = Math.floor(Math.random() * 3) + 1; // 1-3 applications
        for (let j = 0; j < numApplications; j++) {
          try {
            const tenant = getRandomItem(tenants);
            const applicationStatus = getRandomItem(applicationStatuses);
            const createdDate = getRandomDate(new Date(new Date().setMonth(new Date().getMonth() - 2)), new Date());
            
            // Convert dates to strings in YYYY-MM-DD format directly
            const createdDateStr = createdDate instanceof Date ? createdDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            const moveInDateObj = new Date(availableDate);
            const moveInDateStr = moveInDateObj instanceof Date && !isNaN(moveInDateObj.getTime()) 
              ? moveInDateObj.toISOString().split('T')[0] 
              : new Date().toISOString().split('T')[0];
            
            await db.insert(applications).values({
              propertyId: property[0].id,
              tenantId: tenant.id,
              status: applicationStatus,
              message: `I am interested in renting this property. I am a student and looking for accommodation for the upcoming academic year.`,
              createdAt: createdDateStr,
              moveInDate: moveInDateStr,
              isGroupApplication: Math.random() > 0.7, // 30% group applications
              numBedroomsRequested: Math.min(bedrooms, Math.floor(Math.random() * 3) + 1)
            });
          } catch (error: any) {
            console.error(`Error creating application for property ${property[0].id}:`, error.message);
          }
        }
      }
      
      // Create active tenancies for some properties
      if (!available && Math.random() > 0.3) { // 70% chance for unavailable properties
        const numTenants = Math.min(bedrooms, Math.floor(Math.random() * 5) + 1); // Up to bedrooms count
        const startDate = getRandomDate(new Date(new Date().setMonth(new Date().getMonth() - 6)), new Date());
        
        // End date is either in the past (ended) or future (active)
        let endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 12); // 12-month tenancy
        
        const status = new Date() > endDate ? "ended" : "active";
        
        for (let j = 0; j < numTenants; j++) {
          const tenant = tenants[j % tenants.length]; // Cycle through tenants
          
          try {
            // Convert dates to strings in YYYY-MM-DD format directly
            const startDateStr = startDate instanceof Date ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            const endDateStr = endDate instanceof Date ? endDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            const createdAtDate = new Date(startDate.getTime() - 1000 * 60 * 60 * 24 * 14); // 2 weeks before start
            const createdAtStr = createdAtDate instanceof Date ? createdAtDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            
            await db.insert(tenancies).values({
              propertyId: property[0].id,
              tenantId: tenant.id,
              startDate: startDateStr,
              endDate: endDateStr,
              rentAmount: property[0].pricePerPerson,
              depositAmount: property[0].depositAmount,
              depositProtectionScheme: property[0].depositProtectionScheme,
              depositProtectionId: `${property[0].depositProtectionId}-T${j+1}`,
              signedByTenant: true,
              signedByOwner: true,
              active: status === "active",
              createdAt: createdAtStr
            });
          } catch (error: any) {
            console.error(`Error creating tenancy for property ${property[0].id}, tenant ${tenant.id}:`, error.message);
          }
        }
      }
    }
    
    console.log("Test data population completed successfully!");
    console.log(`Created:
    - ${landlords.length} landlords
    - ${agents.length} agents
    - ${tenants.length} tenants
    - ${testProperties.length} properties with maintenance requests, certificates, applications, and tenancies`);
    
    return { landlords, agents, tenants, properties: testProperties };
    
  } catch (error: any) {
    console.error("Error populating test data:", error.message || error);
    throw error;
  }
}

// Execute if this script is run directly
// Run script directly when executed
// In ES modules, we can't check 'require.main === module', so we'll always run it
// when this file is executed directly
populateTestData()
  .then(() => {
    console.log("Script execution completed. Exiting...");
    process.exit(0);
  })
  .catch((error: any) => {
    console.error("Script execution failed:", error.message || error);
    process.exit(1);
  });

export { populateTestData };