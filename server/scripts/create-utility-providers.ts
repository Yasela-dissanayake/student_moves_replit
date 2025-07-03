import { db } from "../db";
import { utilityProviders, utilityTariffs } from "@shared/schema";
import { sql } from "drizzle-orm";

async function createSampleUtilityProviders() {
  console.log("Creating sample utility providers and tariffs...");
  
  try {
    // First check if we already have providers
    const existingProviders = await db.select().from(utilityProviders);
    if (existingProviders.length > 0) {
      console.log(`${existingProviders.length} providers already exist in the database.`);
      return;
    }
    
    // Create sample utility providers
    const providersData = [
      {
        name: "British Gas",
        utilityType: "gas" as const,
        logoUrl: "https://www.britishgas.co.uk/favicon.ico",
        website: "https://www.britishgas.co.uk",
        customerServicePhone: "0333 202 9802",
        customerServiceEmail: "support@britishgas.co.uk",
        apiIntegration: false,
        active: true,
      },
      {
        name: "EDF Energy",
        utilityType: "electricity" as const,
        logoUrl: "https://www.edfenergy.com/favicon.ico",
        website: "https://www.edfenergy.com",
        customerServicePhone: "0333 200 5100",
        customerServiceEmail: "support@edfenergy.com",
        apiIntegration: false,
        active: true,
      },
      {
        name: "Thames Water",
        utilityType: "water" as const,
        logoUrl: "https://www.thameswater.co.uk/favicon.ico",
        website: "https://www.thameswater.co.uk",
        customerServicePhone: "0800 316 9800",
        customerServiceEmail: "customer.feedback@thameswater.co.uk",
        apiIntegration: false,
        active: true,
      },
      {
        name: "BT",
        utilityType: "broadband" as const,
        logoUrl: "https://www.bt.com/favicon.ico",
        website: "https://www.bt.com",
        customerServicePhone: "0800 800 150",
        customerServiceEmail: "support@bt.com",
        apiIntegration: false,
        active: true,
      },
      {
        name: "Virgin Media",
        utilityType: "broadband" as const,
        logoUrl: "https://www.virginmedia.com/favicon.ico",
        website: "https://www.virginmedia.com",
        customerServicePhone: "0345 454 1111",
        customerServiceEmail: "support@virginmedia.com",
        apiIntegration: false,
        active: true,
      },
      {
        name: "Octopus Energy",
        utilityType: "electricity" as const,
        logoUrl: "https://octopus.energy/favicon.ico",
        website: "https://octopus.energy",
        customerServicePhone: "0808 164 1088",
        customerServiceEmail: "hello@octopus.energy",
        apiIntegration: false,
        active: true,
      },
      {
        name: "Bulb",
        utilityType: "gas" as const,
        logoUrl: "https://bulb.co.uk/favicon.ico",
        website: "https://bulb.co.uk",
        customerServicePhone: "0300 30 30 635",
        customerServiceEmail: "help@bulb.co.uk",
        apiIntegration: false,
        active: true,
      },
      {
        name: "E.ON",
        utilityType: "electricity" as const,
        logoUrl: "https://www.eonenergy.com/favicon.ico",
        website: "https://www.eonenergy.com",
        customerServicePhone: "0345 052 0000",
        customerServiceEmail: "customer.service@eon.uk",
        apiIntegration: false,
        active: true,
      },
      {
        name: "Scottish Power",
        utilityType: "gas" as const,
        logoUrl: "https://www.scottishpower.co.uk/favicon.ico",
        website: "https://www.scottishpower.co.uk",
        customerServicePhone: "0800 027 0072",
        customerServiceEmail: "contactus@scottishpower.com",
        apiIntegration: false,
        active: true,
      },
      {
        name: "TV Licensing",
        utilityType: "tv_license" as const,
        logoUrl: "https://www.tvlicensing.co.uk/favicon.ico",
        website: "https://www.tvlicensing.co.uk",
        customerServicePhone: "0300 790 6071",
        customerServiceEmail: "support@tvlicensing.co.uk",
        apiIntegration: false,
        active: true,
      }
    ];
    
    for (const provider of providersData) {
      const [result] = await db.insert(utilityProviders).values(provider).returning();
      console.log(`Created provider: ${result.name} (${result.utilityType})`);
    }
    
    console.log("Sample utility providers created successfully.");
  } catch (error) {
    console.error("Error creating sample utility providers:", error);
  }
}

async function createSampleUtilityTariffs() {
  try {
    // First check if we already have tariffs
    const existingTariffs = await db.select().from(utilityTariffs);
    if (existingTariffs.length > 0) {
      console.log(`${existingTariffs.length} tariffs already exist in the database.`);
      return;
    }
    
    // Get all providers
    const providers = await db.select().from(utilityProviders);
    
    // Create sample tariffs for each provider
    for (const provider of providers) {
      // Different tariff patterns based on utility type
      if (provider.utilityType === 'gas' || provider.utilityType === 'electricity') {
        // Create multiple tariffs for energy providers
        await createEnergyTariffs(provider);
      } else if (provider.utilityType === 'broadband') {
        // Create broadband tariffs
        await createBroadbandTariffs(provider);
      } else if (provider.utilityType === 'water') {
        // Create water tariffs
        await createWaterTariffs(provider);
      } else if (provider.utilityType === 'tv_license') {
        // Create TV license tariff
        await createTvLicenseTariff(provider);
      }
    }
    
    console.log("Sample utility tariffs created successfully.");
  } catch (error) {
    console.error("Error creating sample utility tariffs:", error);
  }
}

async function createEnergyTariffs(provider: any) {
  const tariffs = [
    {
      providerId: provider.id,
      name: `${provider.name} Standard Variable`,
      description: "Standard variable tariff with no fixed term",
      utilityType: provider.utilityType,
      fixedTerm: false,
      standingCharge: 27.5, // pence per day
      unitRate: provider.utilityType === 'gas' ? 7.5 : 29.5, // pence per kWh
      estimatedAnnualCost: provider.utilityType === 'gas' ? 950 : 1250,
      greenEnergy: false,
      specialOffers: sql`ARRAY[]::text[]`,
      region: "UK",
    },
    {
      providerId: provider.id,
      name: `${provider.name} Fixed 12`,
      description: "Fixed rate tariff for 12 months",
      utilityType: provider.utilityType,
      fixedTerm: true,
      termLength: 12,
      earlyExitFee: 30,
      standingCharge: 25.0, // pence per day
      unitRate: provider.utilityType === 'gas' ? 6.8 : 27.8, // pence per kWh
      estimatedAnnualCost: provider.utilityType === 'gas' ? 899 : 1150,
      greenEnergy: false,
      specialOffers: sql`ARRAY['£30 bill credit']::text[]`,
      region: "UK",
    },
    {
      providerId: provider.id,
      name: `${provider.name} Green 24`,
      description: "24-month fixed rate green energy tariff",
      utilityType: provider.utilityType,
      fixedTerm: true,
      termLength: 24,
      earlyExitFee: 50,
      standingCharge: 22.5, // pence per day
      unitRate: provider.utilityType === 'gas' ? 6.5 : 26.5, // pence per kWh
      estimatedAnnualCost: provider.utilityType === 'gas' ? 845 : 1100,
      greenEnergy: true,
      specialOffers: sql`ARRAY['100% renewable energy', 'Free smart meter installation']::text[]`,
      region: "UK",
    },
  ];
  
  for (const tariff of tariffs) {
    await db.insert(utilityTariffs).values(tariff).returning();
    console.log(`Created tariff: ${tariff.name} for ${provider.name}`);
  }
}

async function createBroadbandTariffs(provider: any) {
  const tariffs = [
    {
      providerId: provider.id,
      name: `${provider.name} Fibre Essential`,
      description: "Basic fibre broadband with average speeds of 36Mbps",
      utilityType: provider.utilityType,
      fixedTerm: true,
      termLength: 18,
      earlyExitFee: 15,
      standingCharge: 0, // No daily charge for broadband
      unitRate: 0, // No unit rate for broadband
      estimatedAnnualCost: 359.4, // £29.95 per month
      greenEnergy: false,
      specialOffers: sql`ARRAY['No setup fee']::text[]`,
      region: "UK",
    },
    {
      providerId: provider.id,
      name: `${provider.name} Fibre 1`,
      description: "Fast fibre broadband with average speeds of 50Mbps",
      utilityType: provider.utilityType,
      fixedTerm: true,
      termLength: 18,
      earlyExitFee: 25,
      standingCharge: 0,
      unitRate: 0,
      estimatedAnnualCost: 419.4, // £34.95 per month
      greenEnergy: false,
      specialOffers: sql`ARRAY['Free router', '£50 reward card']::text[]`,
      region: "UK",
    },
    {
      providerId: provider.id,
      name: `${provider.name} Fibre 2`,
      description: "Superfast fibre broadband with average speeds of 74Mbps",
      utilityType: provider.utilityType,
      fixedTerm: true,
      termLength: 18,
      earlyExitFee: 30,
      standingCharge: 0,
      unitRate: 0,
      estimatedAnnualCost: 479.4, // £39.95 per month
      greenEnergy: false,
      specialOffers: sql`ARRAY['Free router', '£75 reward card', 'Free weekend calls']::text[]`,
      region: "UK",
    },
  ];
  
  for (const tariff of tariffs) {
    await db.insert(utilityTariffs).values(tariff).returning();
    console.log(`Created tariff: ${tariff.name} for ${provider.name}`);
  }
}

async function createWaterTariffs(provider: any) {
  const tariffs = [
    {
      providerId: provider.id,
      name: `${provider.name} Metered`,
      description: "Standard metered water supply",
      utilityType: provider.utilityType,
      fixedTerm: false,
      standingCharge: 0, // Water uses a different pricing structure
      unitRate: 0,
      estimatedAnnualCost: 450,
      greenEnergy: false,
      specialOffers: sql`ARRAY['Free water-saving devices']::text[]`,
      region: "UK",
    },
    {
      providerId: provider.id,
      name: `${provider.name} Unmetered`,
      description: "Standard unmetered water supply based on rateable value",
      utilityType: provider.utilityType,
      fixedTerm: false,
      standingCharge: 0,
      unitRate: 0,
      estimatedAnnualCost: 600,
      greenEnergy: false,
      specialOffers: sql`ARRAY[]::text[]`,
      region: "UK",
    },
  ];
  
  for (const tariff of tariffs) {
    await db.insert(utilityTariffs).values(tariff).returning();
    console.log(`Created tariff: ${tariff.name} for ${provider.name}`);
  }
}

async function createTvLicenseTariff(provider: any) {
  const tariffs = [
    {
      providerId: provider.id,
      name: "TV License Standard",
      description: "Standard TV license covering all devices",
      utilityType: provider.utilityType,
      fixedTerm: true,
      termLength: 12,
      earlyExitFee: 0,
      standingCharge: 0,
      unitRate: 0,
      estimatedAnnualCost: 159, // Current TV license fee
      greenEnergy: false,
      specialOffers: sql`ARRAY[]::text[]`,
      region: "UK",
    },
    {
      providerId: provider.id,
      name: "TV License Quarterly",
      description: "TV license paid quarterly",
      utilityType: provider.utilityType,
      fixedTerm: true,
      termLength: 3,
      earlyExitFee: 0,
      standingCharge: 0,
      unitRate: 0,
      estimatedAnnualCost: 169, // Slightly more expensive for quarterly payments
      greenEnergy: false,
      specialOffers: sql`ARRAY[]::text[]`,
      region: "UK",
    },
  ];
  
  for (const tariff of tariffs) {
    await db.insert(utilityTariffs).values(tariff).returning();
    console.log(`Created tariff: ${tariff.name} for ${provider.name}`);
  }
}

// Execute the script
(async () => {
  await createSampleUtilityProviders();
  await createSampleUtilityTariffs();
  console.log("Database setup complete!");
  process.exit(0);
})();