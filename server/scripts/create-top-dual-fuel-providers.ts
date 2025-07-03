/**
 * Script to create top dual fuel providers and tariffs
 * Run with: npx tsx server/scripts/create-top-dual-fuel-providers.ts
 */

import { db } from "../db";
import { sql } from "drizzle-orm";
import {
  utilityProviders,
  utilityTariffs
} from "@shared/schema";

// Create top dual fuel providers
async function createTopDualFuelProviders() {
  try {
    console.log("Connecting to database...");
    
    // Top 5 providers we want to feature
    const topProviders = [
      "Octopus Energy",
      "British Gas",
      "Bulb",
      "E.ON",
      "Scottish Power"
    ];
    
    for (const providerName of topProviders) {
      // Skip if already exists
      const existingProvider = await db.execute(sql`
        SELECT * FROM utility_providers 
        WHERE name = ${providerName} AND utility_type = 'dual_fuel'
      `);
      
      if (existingProvider.length > 0) {
        console.log(`Dual fuel provider already exists for ${providerName}`);
        continue;
      }
      
      // Create details based on provider name
      let logoUrl, website, phone, email;
      
      switch(providerName) {
        case "Octopus Energy":
          logoUrl = "https://octopus.energy/favicon.ico";
          website = "https://octopus.energy";
          phone = "0808 164 1088";
          email = "hello@octopus.energy";
          break;
        case "British Gas":
          logoUrl = "https://www.britishgas.co.uk/favicon.ico";
          website = "https://www.britishgas.co.uk";
          phone = "0333 202 9802";
          email = "customerservice@britishgas.co.uk";
          break;
        case "Bulb":
          logoUrl = "https://bulb.co.uk/favicon.ico";
          website = "https://bulb.co.uk";
          phone = "0300 30 30 635";
          email = "help@bulb.co.uk";
          break;
        case "E.ON":
          logoUrl = "https://www.eonenergy.com/favicon.ico";
          website = "https://www.eonenergy.com";
          phone = "0345 052 0000";
          email = "customer.service@eon.uk";
          break;
        case "Scottish Power":
          logoUrl = "https://www.scottishpower.co.uk/favicon.ico";
          website = "https://www.scottishpower.co.uk";
          phone = "0800 027 0072";
          email = "contactus@scottishpower.com";
          break;
      }
      
      // Create new dual fuel provider
      const result = await db.execute(sql`
        INSERT INTO utility_providers (
          name, utility_type, logo_url, website, 
          customer_service_phone, customer_service_email, 
          api_integration, active, notes
        ) VALUES (
          ${providerName}, 'dual_fuel', ${logoUrl}, ${website},
          ${phone}, ${email}, false, true,
          ${`Dual fuel provider for ${providerName}`}
        ) RETURNING id
      `);
      
      if (result.length > 0) {
        console.log(`Created dual fuel provider: ${providerName} with ID ${result[0].id}`);
      }
    }
    
    console.log("Top dual fuel providers created successfully.");
  } catch (error) {
    console.error("Error creating top dual fuel providers:", error);
  }
}

// Create tariffs for the top providers
async function createTopDualFuelTariffs() {
  try {
    // Get all dual fuel providers
    const dualFuelProviders = await db.execute(sql`
      SELECT * FROM utility_providers 
      WHERE utility_type = 'dual_fuel'
    `);
    
    for (const provider of dualFuelProviders) {
      // Create fixed and variable tariffs for each provider
      
      // Fixed tariff
      await db.execute(sql`
        INSERT INTO utility_tariffs (
          provider_id, name, description, utility_type, fixed_term, 
          term_length, early_exit_fee, standing_charge, unit_rate, 
          estimated_annual_cost, green_energy, special_offers, region
        ) VALUES (
          ${provider.id}, 
          ${`${provider.name} 24 Month Fixed`}, 
          ${`Dual fuel tariff with fixed price for 24 months from ${provider.name}`}, 
          'dual_fuel', 
          true, 
          24, 
          ${50 + Math.floor(Math.random() * 30)}, 
          ${22 + Math.random() * 8}, 
          ${15 + Math.random() * 5}, 
          ${1200 + Math.random() * 300}, 
          ${Math.random() > 0.3}, 
          ARRAY['10% dual fuel discount', 'Smart meter installation', 'Energy usage insights', 'No paper bills']::text[],
          'UK'
        )
      `);
      
      console.log(`Created 24 Month Fixed tariff for ${provider.name}`);
      
      // Variable tariff
      await db.execute(sql`
        INSERT INTO utility_tariffs (
          provider_id, name, description, utility_type, fixed_term, 
          standing_charge, unit_rate, estimated_annual_cost, 
          green_energy, special_offers, region
        ) VALUES (
          ${provider.id}, 
          ${`${provider.name} Standard Variable`}, 
          ${`Standard variable dual fuel tariff from ${provider.name}`}, 
          'dual_fuel', 
          false, 
          ${25 + Math.random() * 10}, 
          ${17 + Math.random() * 6}, 
          ${1350 + Math.random() * 250}, 
          ${Math.random() > 0.5}, 
          ARRAY['Dual fuel discount', 'No exit fees', 'Online account management']::text[],
          'UK'
        )
      `);
      
      console.log(`Created Standard Variable tariff for ${provider.name}`);
      
      // Special saver tariff
      await db.execute(sql`
        INSERT INTO utility_tariffs (
          provider_id, name, description, utility_type, fixed_term, 
          term_length, early_exit_fee, standing_charge, unit_rate, 
          estimated_annual_cost, green_energy, special_offers, region
        ) VALUES (
          ${provider.id}, 
          ${`${provider.name} Dual Fuel Saver`}, 
          ${`Special dual fuel tariff with additional savings from ${provider.name}`}, 
          'dual_fuel', 
          true, 
          12, 
          ${30 + Math.floor(Math.random() * 20)}, 
          ${20 + Math.random() * 5}, 
          ${14 + Math.random() * 3}, 
          ${1100 + Math.random() * 200}, 
          ${Math.random() > 0.2}, 
          ARRAY['15% dual fuel discount', '£50 new customer reward', 'Smart home integration', 'Free energy audit']::text[],
          'UK'
        )
      `);
      
      console.log(`Created Dual Fuel Saver tariff for ${provider.name}`);
    }
    
    console.log("All dual fuel tariffs created successfully.");
  } catch (error) {
    console.error("Error creating dual fuel tariffs:", error);
  }
}

// Execute the script
(async () => {
  await createTopDualFuelProviders();
  await createTopDualFuelTariffs();
  console.log("Script completed successfully!");
  process.exit(0);
})();