/**
 * Script to set up the utility management feature
 * Run with: node setup-utilities.js
 */
import { exec } from 'child_process';

// Execute our utility setup script
console.log('Setting up utility providers and tariffs...');
exec('npx tsx server/scripts/create-utility-providers.ts', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Error: ${stderr}`);
    return;
  }
  
  console.log(stdout);
  console.log('Utility management setup complete!');
});