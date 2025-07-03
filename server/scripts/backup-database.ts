import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the backups directory
const backupsDir = path.join(__dirname, '../../backups');

// Make the backups directory if it doesn't exist
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Current date for the backup file name
const now = new Date();
const dateString = now.toISOString().replace(/[:.]/g, '-');
const backupFileName = `backup-${dateString}.sql`;
const backupFilePath = path.join(backupsDir, backupFileName);

// Get database connection details from environment variables
const { PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT } = process.env;

if (!PGHOST || !PGUSER || !PGPASSWORD || !PGDATABASE || !PGPORT) {
  console.error('Database environment variables are not properly set');
  process.exit(1);
}

/**
 * Create a database backup using pg_dump
 */
async function backupDatabase() {
  try {
    console.log(`Creating database backup at ${backupFilePath}...`);
    
    // Create pg_dump command
    const pgDumpCommand = `PGPASSWORD="${PGPASSWORD}" pg_dump -h ${PGHOST} -U ${PGUSER} -p ${PGPORT} -d ${PGDATABASE} -F p -f "${backupFilePath}"`;
    
    // Execute pg_dump
    const execPromise = promisify(exec);
    await execPromise(pgDumpCommand);
    
    console.log(`✅ Database backup created successfully at ${backupFilePath}`);
    
    // Clean up old backups (keep only the last 5)
    await cleanupOldBackups();
    
    return backupFilePath;
  } catch (error) {
    console.error('Error creating database backup:', error);
    throw error;
  }
}

/**
 * Clean up old backups, keeping only the most recent ones
 */
async function cleanupOldBackups(keepCount = 5) {
  try {
    // Get all backup files
    const files = fs.readdirSync(backupsDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(backupsDir, file),
        time: fs.statSync(path.join(backupsDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Sort by time, newest first
    
    // Delete all but the most recent 'keepCount' backups
    if (files.length > keepCount) {
      console.log(`Cleaning up old backups, keeping the ${keepCount} most recent...`);
      
      for (let i = keepCount; i < files.length; i++) {
        fs.unlinkSync(files[i].path);
        console.log(`Deleted old backup: ${files[i].name}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
  }
}

// Run the backup function if this script is executed directly
// Using import.meta.url to check if this is the main module in ESM
if (import.meta.url === import.meta.resolve(process.argv[1])) {
  backupDatabase()
    .then(() => {
      console.log('Database backup process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database backup process failed:', error);
      process.exit(1);
    });
}

export { backupDatabase, cleanupOldBackups };