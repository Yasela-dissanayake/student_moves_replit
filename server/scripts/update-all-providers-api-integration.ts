/**
 * Script to update ALL utility providers with API integration capabilities
 * Run with: npx tsx server/scripts/update-all-providers-api-integration.ts
 */

import { db } from "../db";
import { sql } from "drizzle-orm";
import { utilityProviders } from "@shared/schema";

// Update all utility providers to have API integration
async function updateAllProvidersAPIIntegration() {
  try {
    console.log("Updating all utility providers with API integration...");
    
    // Get all providers that don't have API integration
    const providersToUpdate = await db.execute(sql`
      SELECT * FROM utility_providers 
      WHERE api_integration = false
    `);
    
    if (providersToUpdate.length === 0) {
      console.log("All providers already have API integration enabled.");
      return;
    }
    
    console.log(`Found ${providersToUpdate.length} providers to update.`);
    
    // API endpoints mapping by provider name
    const apiEndpoints = {
      // Gas
      "British Gas": "https://api.britishgas.co.uk/v2",
      "Bulb": "https://api.bulb.co.uk/v1",
      "Scottish Power": "https://api.scottishpower.co.uk/v1",
      
      // Electricity
      "E.ON": "https://api.eonenergy.com/v1",
      "EDF Energy": "https://api.edfenergy.com/v1",
      "Octopus Energy": "https://api.octopus.energy/v1",
      
      // Water
      "Thames Water": "https://api.thameswater.co.uk/v1",
      
      // Broadband
      "BT": "https://api.bt.com/v1",
      "Virgin Media": "https://api.virginmedia.com/v1",
      
      // TV License
      "TV Licensing": "https://api.tvlicensing.co.uk/v1"
    };
    
    // Update each provider
    for (const provider of providersToUpdate) {
      const apiEndpoint = apiEndpoints[provider.name] || 
        `https://api.${provider.name.toLowerCase().replace(/\s+/g, '')}.com/v1`;
      
      // Update the provider with API integration
      const updateResult = await db.execute(sql`
        UPDATE utility_providers 
        SET 
          api_integration = true,
          api_endpoint = ${apiEndpoint},
          api_key = ${`test_api_key_${provider.name.toLowerCase().replace(/\s+/g, '_')}_${provider.utility_type}`}
        WHERE 
          id = ${provider.id}
      `);
      
      console.log(`Updated ${provider.name} (${provider.utility_type}) with API integration`);
    }
    
    console.log("All utility providers updated with API integration successfully!");
  } catch (error) {
    console.error("Error updating utility providers:", error);
  }
}

// Execute the script
(async () => {
  await updateAllProvidersAPIIntegration();
  console.log("Script completed!");
  process.exit(0);
})();