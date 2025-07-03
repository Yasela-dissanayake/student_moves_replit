import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';
import { log } from './vite';

// Initialize database connection with connection pooling
export function initDB() {
  try {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    log(`Connecting to database...`, 'postgres');
    
    // Optimized connection pooling configuration for 100/100 performance
    const poolOptions = {
      max: 20, // Increased maximum connections for better concurrency
      idle_timeout: 20, // Reduced idle timeout for faster recycling
      connect_timeout: 5, // Faster connect timeout
      max_lifetime: 60 * 30, // 30 minute max connection lifetime
      ssl: { rejectUnauthorized: false }, // Enable SSL with self-signed certificates allowed
      transform: postgres.camel, // Automatic camelCase transformation
      prepare: false, // Disable prepared statements for faster simple queries
    };
    
    // Create PostgreSQL client with connection pooling
    const client = postgres(connectionString, poolOptions);
    
    // Create Drizzle ORM instance
    const db = drizzle(client, { schema });
    
    log(`Database connection established`, 'postgres');
    
    return { db, client };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Database connection error: ${errorMessage}`, 'postgres');
    throw error;
  }
}

// Helper function to create a transaction
export async function transaction<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  const { client, db } = initDB();
  // Type assertion needed because postgres.js provides this functionality
  // but TypeScript doesn't recognize it properly
  const result = await (client as any).transaction(async (tx: any) => {
    const transactionDb = drizzle(tx, { schema });
    return callback(transactionDb);
  });
  
  return result;
}

// Create a PostgreSQL pool for session storage
export const pool = {
  query: async (text: string, params?: any[]) => {
    try {
      // Make sure params is an array and all values are properly handled
      const processedParams = params && Array.isArray(params) 
        ? params.map(p => typeof p === 'object' && !(p instanceof Date) && !(p instanceof Buffer) ? JSON.stringify(p) : p)
        : params;
      
      return await client.unsafe(text, processedParams);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Database query error: ${errorMessage}`, 'postgres');
      throw error;
    }
  },
  connect: async () => client,
  // Add properties needed by connect-pg-simple
  totalCount: 0,
  idleCount: 0,
  waitingCount: 0,
  end: async () => {},
};

// Function to create session table if it doesn't exist
export async function ensureSessionTable() {
  try {
    // SQL to create session table needed by connect-pg-simple
    const createSessionTableSQL = `
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `;
    
    await client.unsafe(createSessionTableSQL);
    log("Session table created or verified", "postgres");
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error creating session table: ${errorMessage}`, "postgres");
    return false;
  }
}

// Database singleton to be used throughout the app
const { db, client } = initDB();
// Ensure session table exists
ensureSessionTable().catch(err => {
  const errorMessage = err instanceof Error ? err.message : String(err);
  log(`Session table error: ${errorMessage}`, "postgres");
});
export { db, client };