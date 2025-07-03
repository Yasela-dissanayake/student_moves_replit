/**
 * Add named person fields to property_utility_contracts table
 * This script is used to update the database with new named person fields
 * without losing existing data
 */
import { db } from "../db";
import * as schema from "../../shared/schema";
import { sql } from "drizzle-orm";

async function addNamedPersonFields() {
  console.log("Checking if named person fields exist...");
  
  try {
    // Check if namedPersonFullName column exists
    const checkQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='property_utility_contracts' 
        AND column_name='named_person_full_name'
    `;
    
    const result = await db.execute(checkQuery);
    
    if (result.length === 0) {
      console.log("Named person fields don't exist. Adding them...");
      
      // Add new columns to the property_utility_contracts table
      await db.execute(sql`
        ALTER TABLE property_utility_contracts 
        ADD COLUMN named_person_full_name TEXT,
        ADD COLUMN named_person_email TEXT,
        ADD COLUMN named_person_phone TEXT,
        ADD COLUMN named_person_date_of_birth TEXT,
        ADD COLUMN named_person_tenant_id INTEGER
      `);
      
      console.log("Named person fields added successfully.");
    } else {
      console.log("Named person fields already exist. No changes needed.");
    }
  } catch (error) {
    console.error("Error while adding named person fields:", error);
    throw error;
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  addNamedPersonFields()
    .then(() => {
      console.log("Operation completed successfully.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Operation failed:", error);
      process.exit(1);
    });
}

export { addNamedPersonFields };