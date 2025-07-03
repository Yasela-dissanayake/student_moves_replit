/**
 * Script to update dual fuel providers with API integration capabilities
 * Run with: npx tsx server/scripts/update-dual-fuel-api-integration.ts
 */

import { db } from "../db";
import { sql } from "drizzle-orm";
import { utilityProviders } from "@shared/schema";

// Update dual fuel providers to have API integration
async function updateDualFuelAPIIntegration() {
  try {
    console.log("Updating dual fuel providers with API integration...");
    
    // Get all dual fuel providers
    const dualFuelProviders = await db.execute(sql`
      SELECT * FROM utility_providers 
      WHERE utility_type = 'dual_fuel'
    `);
    
    if (dualFuelProviders.length === 0) {
      console.log("No dual fuel providers found. Please run create-dual-fuel-tariffs.ts first.");
      return;
    }
    
    console.log(`Found ${dualFuelProviders.length} dual fuel providers to update.`);
    
    // API endpoints for the providers
    const apiEndpoints = {
      "Octopus Energy": "https://api.octopus.energy/v1",
      "British Gas": "https://api.britishgas.co.uk/v2",
      "Bulb": "https://api.bulb.co.uk/v1",
      "E.ON": "https://api.eonenergy.com/v1",
      "Scottish Power": "https://api.scottishpower.co.uk/v1",
      "EDF Energy": "https://api.edfenergy.com/v1",
      "SSE": "https://api.sse.co.uk/v1",
      "npower": "https://api.npower.com/v1",
      "Shell Energy": "https://api.shellenergy.co.uk/v1",
      "Ovo Energy": "https://api.ovoenergy.com/v1"
    };
    
    // Update each provider
    for (const provider of dualFuelProviders) {
      const apiEndpoint = apiEndpoints[provider.name] || `https://api.${provider.name.toLowerCase().replace(/\s+/g, '')}.com/v1`;
      
      // Update the provider with API integration
      const updateResult = await db.execute(sql`
        UPDATE utility_providers 
        SET 
          api_integration = true,
          api_endpoint = ${apiEndpoint},
          api_key = ${`test_api_key_${provider.name.toLowerCase().replace(/\s+/g, '_')}`}
        WHERE 
          id = ${provider.id}
      `);
      
      console.log(`Updated ${provider.name} with API integration`);
    }
    
    console.log("All dual fuel providers updated with API integration successfully!");
  } catch (error) {
    console.error("Error updating dual fuel providers:", error);
  }
}

// Execute the script
(async () => {
  await updateDualFuelAPIIntegration();
  console.log("Script completed!");
  process.exit(0);
})();