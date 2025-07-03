import { db } from '../db';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the migrations directory
const migrationsDir = path.join(__dirname, '../../migrations');

/**
 * Apply all migrations in the migrations directory
 */
async function applyMigrations() {
  console.log('Applying migrations...');
  
  try {
    // Read the journal file
    const journalPath = path.join(migrationsDir, 'meta', '_journal.json');
    if (!fs.existsSync(journalPath)) {
      console.error('No migration journal found at', journalPath);
      return;
    }
    
    const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
    
    // Apply each migration in order
    for (const entry of journal.entries) {
      console.log(`Applying migration: ${entry.tag}`);
      const migrationPath = path.join(migrationsDir, entry.tag, 'migration.sql');
      
      if (!fs.existsSync(migrationPath)) {
        console.error(`Migration file not found at ${migrationPath}`);
        continue;
      }
      
      const migrationSql = fs.readFileSync(migrationPath, 'utf8');
      
      // Apply the migration
      await db.execute(migrationSql);
      
      console.log(`✅ Migration ${entry.tag} applied successfully`);
    }
    
    console.log('All migrations applied successfully');
  } catch (error) {
    console.error('Error applying migrations:', error);
    process.exit(1);
  }
}

// Run the migration function if this script is executed directly
// Using import.meta.url to check if this is the main module in ESM
if (import.meta.url === import.meta.resolve(process.argv[1])) {
  applyMigrations()
    .then(() => {
      console.log('Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

export { applyMigrations };