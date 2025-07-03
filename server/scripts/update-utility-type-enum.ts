/**
 * Script to update the utility_type enum in the database
 * Run with: npx tsx server/scripts/update-utility-type-enum.ts
 */
import { sql } from "drizzle-orm";
import { db } from "../db";

async function updateUtilityTypeEnum() {
  try {
    console.log("Connecting to database...");
    
    // Get existing enum values
    const existingValues = await db.execute(sql`
      SELECT enum_range(NULL::utility_type)
    `);
    
    console.log("Current utility_type enum values:", existingValues);
    
    // Update the enum type to include 'dual_fuel'
    await db.execute(sql`
      ALTER TYPE utility_type ADD VALUE 'dual_fuel' AFTER 'electricity';
    `);
    
    console.log("Added 'dual_fuel' to utility_type enum");
    
    // Verify the updated enum values
    const updatedValues = await db.execute(sql`
      SELECT enum_range(NULL::utility_type)
    `);
    
    console.log("Updated utility_type enum values:", updatedValues);
    
    console.log("Utility type enum updated successfully!");
  } catch (error) {
    console.error("Error updating utility_type enum:", error);
  }
}

// Execute the script
(async () => {
  await updateUtilityTypeEnum();
  process.exit(0);
})();