import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { log } from '../vite';

// Run migrations
async function runMigrations() {
  log(`Starting database migrations...`, 'migrations');
  
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  // For migrations
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);
  
  try {
    log(`Running migrations...`, 'migrations');
    await migrate(db, { migrationsFolder: 'drizzle' });
    log(`Migrations completed successfully`, 'migrations');
  } catch (error) {
    log(`Error running migrations: ${error.message}`, 'migrations');
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

runMigrations();