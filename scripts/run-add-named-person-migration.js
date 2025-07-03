/**
 * Script to execute the migration for adding named person fields
 * Run with: node scripts/run-add-named-person-migration.js
 */

import { spawn } from 'child_process';

console.log('Running database migration to add named person fields...');

const childProcess = spawn('npx', ['tsx', 'server/scripts/add-named-person-fields.ts']);

childProcess.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

childProcess.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

childProcess.on('close', (code) => {
  if (code === 0) {
    console.log('Migration completed successfully!');
  } else {
    console.error(`Migration process exited with code ${code}`);
  }
});