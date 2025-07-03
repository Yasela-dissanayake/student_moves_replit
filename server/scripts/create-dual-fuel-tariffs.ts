/**
 * Script to create dual fuel tariffs for existing utility providers
 * Run with: npx tsx server/scripts/create-dual-fuel-tariffs.ts
 */
import { db } from "../db";
import { sql } from "drizzle-orm";
import {
  utilityProviders,
  utilityTariffs
} from "@shared/schema";
import { eq } from "drizzle-orm";

// Connect to PostgreSQL
console.log("Connecting to database...");

// Fix the type definitions for the utility tariffs to match the schema
type UtilityProvider = {
  id: number;
  name: string;
  utilityType: 'gas' | 'electricity' | 'dual_fuel' | 'water' | 'broadband' | 'tv_license';
  logoUrl: string | null;
  website: string | null;
  customerServicePhone: string | null;
  customerServiceEmail: string | null;
  apiIntegration: boolean;
  apiEndpoint: string | null;
  apiKey: string | null;
  active: boolean;
  notes: string | null;
};

// Create dual fuel providers first from existing gas and electricity providers
async function createDualFuelProviders() {
  try {
    // Get existing electricity providers
    const electricityProviders = await db.select().from(utilityProviders)
      .where(eq(utilityProviders.utilityType, 'electricity'));
    
    // Create dual fuel providers for each electricity provider
    // (In real life, not all electricity providers offer dual fuel, but for this example we'll assume they do)
    for (const provider of electricityProviders) {
      // Check if a dual fuel provider with this name already exists
      const existingProvider = await db.select().from(utilityProviders)
        .where(eq(utilityProviders.name, provider.name))
        .where(eq(utilityProviders.utilityType, 'dual_fuel'))
        .then(results => results[0]);
      
      if (existingProvider) {
        console.log(`Dual fuel provider already exists for ${provider.name}`);
        continue;
      }
      
      // Create a new dual fuel provider based on the electricity provider
      const [dualFuelProvider] = await db.insert(utilityProviders).values({
        name: provider.name,
        utilityType: 'dual_fuel',
        logoUrl: provider.logoUrl,
        website: provider.website,
        customerServicePhone: provider.customerServicePhone,
        customerServiceEmail: provider.customerServiceEmail,
        apiIntegration: provider.apiIntegration,
        apiEndpoint: provider.apiEndpoint,
        apiKey: provider.apiKey,
        active: provider.active,
        notes: `Dual fuel provider created based on ${provider.name} electricity provider.`,
      }).returning();
      
      console.log(`Created dual fuel provider: ${dualFuelProvider.name}`);
    }
    
    console.log("Dual fuel providers created successfully.");
  } catch (error) {
    console.error("Error creating dual fuel providers:", error);
  }
}

// Create dual fuel tariffs for the providers
async function createDualFuelTariffs() {
  try {
    // Get dual fuel providers
    const dualFuelProviders = await db.select().from(utilityProviders)
      .where(eq(utilityProviders.utilityType, 'dual_fuel'));
    
    for (const provider of dualFuelProviders) {
      // Find corresponding electricity provider to base tariffs on
      const electricityProvider = await db.select().from(utilityProviders)
        .where(eq(utilityProviders.name, provider.name))
        .where(eq(utilityProviders.utilityType, 'electricity'))
        .then(results => results[0]);
      
      if (!electricityProvider) {
        console.log(`No electricity provider found for ${provider.name}`);
        continue;
      }
      
      // Get electricity tariffs for this provider
      const electricityTariffs = await db.select().from(utilityTariffs)
        .where(eq(utilityTariffs.providerId, electricityProvider.id));
      
      // Create dual fuel tariffs based on electricity tariffs but with bundled discounts
      for (const electricityTariff of electricityTariffs) {
        // Skip if not a fixed term or standard variable tariff
        if (!electricityTariff.name.includes('Fixed') && !electricityTariff.name.includes('Standard')) {
          continue;
        }
        
        // Create a dual fuel version with a discount
        const annualCost = electricityTariff.estimatedAnnualCost ? Number(electricityTariff.estimatedAnnualCost) * 1.8 : 1800; // Roughly 80% more for gas+electric vs electric only
        const discountedAnnualCost = annualCost * 0.9; // 10% dual fuel discount
        const standingCharge = electricityTariff.standingCharge ? Number(electricityTariff.standingCharge) * 1.7 : 30; // Higher standing charge for dual fuel
        
        // Create the dual fuel tariff with special offers directly as SQL array
        const [dualFuelTariff] = await db.insert(utilityTariffs).values({
          providerId: provider.id,
          name: electricityTariff.name.replace('Electricity', 'Dual Fuel'),
          description: `Dual fuel tariff for both gas and electricity, based on ${electricityTariff.name}`,
          utilityType: 'dual_fuel',
          fixedTerm: electricityTariff.fixedTerm,
          termLength: electricityTariff.termLength,
          earlyExitFee: electricityTariff.earlyExitFee ? Number(electricityTariff.earlyExitFee) * 1.5 : 60, // Higher exit fee for dual fuel
          standingCharge: standingCharge,
          unitRate: electricityTariff.unitRate,
          estimatedAnnualCost: discountedAnnualCost,
          greenEnergy: electricityTariff.greenEnergy,
          specialOffers: sql`ARRAY['10% dual fuel discount', 'Single bill convenience']::text[]`,
          region: electricityTariff.region,
        }).returning();
        
        console.log(`Created dual fuel tariff: ${dualFuelTariff.name} for ${provider.name}`);
      }
    }
    
    console.log("Dual fuel tariffs created successfully.");
  } catch (error) {
    console.error("Error creating dual fuel tariffs:", error);
  }
}

// Create 5 cheapest dual fuel tariffs for comparison
async function createCheapestDualFuelTariffs() {
  try {
    const dualFuelProviders = await db.select().from(utilityProviders)
      .where(eq(utilityProviders.utilityType, 'dual_fuel'));
    
    // Top 5 providers we want to feature
    const topProviders = [
      "Octopus Energy",
      "British Gas",
      "Bulb",
      "E.ON",
      "Scottish Power"
    ];
    
    for (const providerName of topProviders) {
      // Find the provider
      const provider = dualFuelProviders.find(p => p.name === providerName);
      if (!provider) {
        console.log(`Provider ${providerName} not found in dual fuel providers`);
        continue;
      }
      
      // Create a special cheap tariff for this provider
      const [cheapTariff] = await db.insert(utilityTariffs).values({
        providerId: provider.id,
        name: `${provider.name} Dual Fuel Saver`,
        description: `Special dual fuel tariff for both gas and electricity from ${provider.name} with additional savings`,
        utilityType: 'dual_fuel',
        fixedTerm: true,
        termLength: 24,
        earlyExitFee: 60,
        standingCharge: 25 + Math.random() * 10, // Random standing charge between 25-35p
        unitRate: 15 + Math.random() * 5, // Random unit rate between 15-20p
        estimatedAnnualCost: 1200 + Math.random() * 300, // Random annual cost between £1200-£1500
        greenEnergy: Math.random() > 0.5, // 50% chance of being green energy
        specialOffers: sql`ARRAY['10% dual fuel discount', 'Online account management', 'No paper bills', '£50 new customer reward']::text[]`,
        region: "UK",
      }).returning();
      
      console.log(`Created cheap dual fuel tariff: ${cheapTariff.name} for ${provider.name}`);
    }
    
    console.log("Top 5 cheapest dual fuel tariffs created successfully.");
  } catch (error) {
    console.error("Error creating cheapest dual fuel tariffs:", error);
  }
}

// Execute the script
(async () => {
  await createDualFuelProviders();
  await createDualFuelTariffs();
  await createCheapestDualFuelTariffs();
  console.log("All dual fuel providers and tariffs created successfully!");
  process.exit(0);
})();