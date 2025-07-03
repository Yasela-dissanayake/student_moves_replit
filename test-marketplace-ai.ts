import { executeAIOperation } from './server/ai-service-manager';

async function testMarketplaceAiOperations() {
  console.log('Testing marketplace AI operations...');
  
  const testItem = {
    title: 'MacBook Pro 2023',
    description: 'Almost new MacBook Pro with M2 chip, 16GB RAM, 512GB SSD',
    price: '999.99',
    condition: 'like_new',
    category: 'electronics',
    images: ['base64image'],
    seller_id: 123
  };
  
  try {
    // Test item verification
    console.log('\nTesting item verification:');
    const verificationResult = await executeAIOperation('verifyMarketplaceItem', { item: testItem });
    console.log('Result:', JSON.stringify(verificationResult, null, 2));
    
    // Test fraud detection
    console.log('\nTesting fraud detection:');
    const fraudResult = await executeAIOperation('detectMarketplaceFraud', { 
      item: testItem,
      sellerData: { registrationDate: new Date('2023-01-01'), totalListings: 5 }
    });
    console.log('Result:', JSON.stringify(fraudResult, null, 2));
    
    // Test price suggestion
    console.log('\nTesting price suggestion:');
    const priceResult = await executeAIOperation('suggestMarketplaceItemPrice', { item: testItem });
    console.log('Result:', JSON.stringify(priceResult, null, 2));
    
    // Test category classification
    console.log('\nTesting category classification:');
    const categoryResult = await executeAIOperation('categorizeMarketplaceItem', { item: testItem });
    console.log('Result:', JSON.stringify(categoryResult, null, 2));
    
    // Test description generation
    console.log('\nTesting description generation:');
    const descriptionResult = await executeAIOperation('generateMarketplaceDescription', { item: testItem });
    console.log('Result:', JSON.stringify(descriptionResult, null, 2));
    
    // Test value estimation
    console.log('\nTesting value estimation:');
    const valueResult = await executeAIOperation('estimateMarketplaceItemValue', { item: testItem });
    console.log('Result:', JSON.stringify(valueResult, null, 2));
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error during tests:', error);
  }
}

testMarketplaceAiOperations();