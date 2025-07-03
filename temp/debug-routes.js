/**
 * Debug file to trace variable references in storage
 */

console.log('Starting variable reference debug...');

// Test variable reference retention
function testStorageVariables(storage) {
  console.log('Test function received storage reference', typeof storage);
  
  // Create a local copy with a different name
  const storage2 = storage;
  console.log('Created storage2 reference', typeof storage2);
  
  // Test both references
  console.log('Original storage has getVoucherCompanyById:', 
              typeof storage.getVoucherCompanyById === 'function');
  
  console.log('storage2 reference has getVoucherCompanyById:', 
              typeof storage2.getVoucherCompanyById === 'function');
              
  // Access method on storage2
  try {
    console.log('Attempting to access method through storage2');
    const result = storage2.getVoucherCompanyById ? 'Method exists' : 'Method missing';
    console.log('Result:', result);
  } catch (err) {
    console.error('Error accessing method through storage2:', err);
  }
  
  return storage2;
}

// Export the test function
module.exports = { testStorageVariables };