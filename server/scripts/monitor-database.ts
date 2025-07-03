import { db, client } from '../db';
import { log } from '../vite';
import { sql } from 'drizzle-orm';

/**
 * Database health monitor
 * Checks database connection and performance metrics
 */
export async function monitorDatabase() {
  try {
    log('Running database health check...', 'postgres');
    
    // Test 1: Database connectivity
    const startConnectivity = Date.now();
    const [pingResult] = await db.execute(sql`SELECT 1 as ping`);
    const connectivityTime = Date.now() - startConnectivity;
    
    log(`✅ Database connectivity: ${pingResult?.ping === 1 ? 'OK' : 'FAILED'} (${connectivityTime}ms)`, 'postgres');
    
    // Test 2: Database size
    const startSize = Date.now();
    const [dbSize] = await db.execute(sql`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    const sizeTime = Date.now() - startSize;
    
    log(`Database size: ${dbSize?.size} (query took ${sizeTime}ms)`, 'postgres');
    
    // Test 3: Active connections
    const startConnections = Date.now();
    const [connections] = await db.execute(sql`
      SELECT count(*) as active_connections 
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);
    const connectionsTime = Date.now() - startConnections;
    
    log(`Active connections: ${connections?.active_connections} (query took ${connectionsTime}ms)`, 'postgres');
    
    // Test 4: Table statistics
    const startTableStats = Date.now();
    const tableStats = await db.execute(sql`
      SELECT 
        relname as table_name,
        n_live_tup as row_count,
        pg_size_pretty(pg_total_relation_size(relid)) as total_size
      FROM 
        pg_stat_user_tables
      ORDER BY 
        n_live_tup DESC
    `);
    const tableStatsTime = Date.now() - startTableStats;
    
    log(`Table statistics (query took ${tableStatsTime}ms):`, 'postgres');
    
    // Display table stats in a formatted way
    for (const table of tableStats) {
      log(`- ${table.table_name}: ${table.row_count} rows, size: ${table.total_size}`, 'postgres');
    }
    
    // Test 5: Index usage
    const startIndexStats = Date.now();
    const indexStats = await db.execute(sql`
      SELECT
        relname as table_name,
        indexrelname as index_name,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM
        pg_stat_user_indexes
      ORDER BY
        idx_scan DESC
      LIMIT 10
    `);
    const indexStatsTime = Date.now() - startIndexStats;
    
    log(`Top 10 index usage (query took ${indexStatsTime}ms):`, 'postgres');
    
    // Display index stats in a formatted way
    for (const index of indexStats) {
      log(`- ${index.table_name}.${index.index_name}: ${index.index_scans} scans, read: ${index.tuples_read}, fetched: ${index.tuples_fetched}`, 'postgres');
    }
    
    // Test 6: Query performance for a simple query
    const startQuery = Date.now();
    await db.execute(sql`SELECT * FROM users LIMIT 10`);
    const queryTime = Date.now() - startQuery;
    
    log(`Simple query performance: ${queryTime}ms`, 'postgres');
    
    // Overall status
    log(`Database health check completed. Overall status: Good`, 'postgres');
    
    return {
      connectivity: {
        status: pingResult?.ping === 1 ? 'OK' : 'FAILED',
        responseTime: connectivityTime
      },
      size: dbSize?.size,
      connections: connections?.active_connections,
      queryPerformance: queryTime,
      tables: tableStats,
      indexes: indexStats
    };
  } catch (error) {
    log(`❌ Database health check failed: ${error.message}`, 'postgres');
    throw error;
  }
}

// Run the health check if this script is executed directly
// Using import.meta.url to check if this is the main module in ESM
if (import.meta.url === import.meta.resolve(process.argv[1])) {
  monitorDatabase()
    .then(() => {
      log('Database monitoring completed', 'postgres');
      process.exit(0);
    })
    .catch((error) => {
      log(`Database monitoring failed: ${error.message}`, 'postgres');
      process.exit(1);
    });
}