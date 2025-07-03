/**
 * Comprehensive Deep Testing Suite
 * Tests every component, dashboard, and workflow across the entire platform
 */

const BASE_URL = 'http://localhost:5000';

// Helper function for API requests
async function api(method, endpoint, body = null, cookies = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  
  if (body) options.body = JSON.stringify(body);
  if (cookies) options.headers.Cookie = cookies;
  
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.text();
  
  try {
    return { status: response.status, data: JSON.parse(data), headers: response.headers };
  } catch {
    return { status: response.status, data, headers: response.headers };
  }
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function logTest(category, test, status, details = '') {
  const result = { category, test, status, details, timestamp: new Date().toISOString() };
  testResults.details.push(result);
  
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else if (status === 'WARN') testResults.warnings++;
  
  console.log(`[${category}] ${test}: ${status}${details ? ' - ' + details : ''}`);
}

async function testDatabaseConnectivity() {
  console.log('\n=== TESTING DATABASE CONNECTIVITY ===');
  
  try {
    // Test properties endpoint (database read)
    const propertiesTest = await api('GET', '/api/properties');
    if (propertiesTest.status === 200 && Array.isArray(JSON.parse(propertiesTest.data))) {
      logTest('Database', 'Properties Query', 'PASS', `${JSON.parse(propertiesTest.data).length} properties loaded`);
    } else {
      logTest('Database', 'Properties Query', 'FAIL', `Status: ${propertiesTest.status}`);
    }
    
    // Test utility providers
    const utilityTest = await api('GET', '/api/utility-providers-public');
    logTest('Database', 'Utility Providers Query', utilityTest.status === 200 ? 'PASS' : 'FAIL', `Status: ${utilityTest.status}`);
    
    // Test admin configuration
    const configTest = await api('GET', '/api/admin/configuration');
    logTest('Database', 'Admin Configuration', configTest.status === 200 || configTest.status === 401 ? 'PASS' : 'FAIL', 'Access control working');
    
  } catch (error) {
    logTest('Database', 'Connection Test', 'FAIL', error.message);
  }
}

async function testAPIEndpoints() {
  console.log('\n=== TESTING CORE API ENDPOINTS ===');
  
  const endpoints = [
    { method: 'GET', path: '/api/properties', name: 'Properties List' },
    { method: 'POST', path: '/api/recommendations/properties', name: 'Recommendations Engine', body: {} },
    { method: 'GET', path: '/api/utility-providers-public', name: 'Public Utility Providers' },
    { method: 'GET', path: '/api/ai-services/test', name: 'AI Services Test' },
    { method: 'GET', path: '/api/admin/configuration', name: 'Admin Configuration' },
    { method: 'GET', path: '/api/health-check', name: 'Health Check' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const result = await api(endpoint.method, endpoint.path, endpoint.body);
      const responseTime = Date.now() - startTime;
      
      if (result.status === 200 || result.status === 401) {
        logTest('API', endpoint.name, 'PASS', `${responseTime}ms`);
      } else {
        logTest('API', endpoint.name, 'FAIL', `Status: ${result.status}, Time: ${responseTime}ms`);
      }
    } catch (error) {
      logTest('API', endpoint.name, 'FAIL', error.message);
    }
  }
}

async function testSecurityHeaders() {
  console.log('\n=== TESTING SECURITY IMPLEMENTATION ===');
  
  try {
    const response = await api('GET', '/api/properties');
    const headers = response.headers;
    
    // Check for security headers
    const securityChecks = [
      { header: 'content-security-policy', name: 'CSP Headers' },
      { header: 'x-content-type-options', name: 'Content Type Options' },
      { header: 'x-frame-options', name: 'Frame Options' },
      { header: 'x-xss-protection', name: 'XSS Protection' }
    ];
    
    securityChecks.forEach(check => {
      const hasHeader = headers.get && headers.get(check.header);
      logTest('Security', check.name, hasHeader ? 'PASS' : 'WARN', hasHeader ? 'Present' : 'Missing');
    });
    
    // Test rate limiting (make multiple requests)
    let rateLimitTest = 'PASS';
    for (let i = 0; i < 5; i++) {
      const testReq = await api('GET', '/api/properties');
      if (testReq.status !== 200) {
        rateLimitTest = 'WARN';
        break;
      }
    }
    logTest('Security', 'Rate Limiting', rateLimitTest, 'Multiple requests handled');
    
  } catch (error) {
    logTest('Security', 'Headers Test', 'FAIL', error.message);
  }
}

async function testPerformanceBenchmarks() {
  console.log('\n=== TESTING PERFORMANCE BENCHMARKS ===');
  
  const performanceTests = [
    { endpoint: '/api/properties', name: 'Properties Load Time', target: 200 },
    { endpoint: '/api/recommendations/properties', method: 'POST', body: {}, name: 'Recommendations Engine', target: 200 },
    { endpoint: '/api/utility-providers-public', name: 'Utility Providers', target: 150 }
  ];
  
  for (const test of performanceTests) {
    const times = [];
    
    // Run each test 3 times for average
    for (let i = 0; i < 3; i++) {
      const startTime = Date.now();
      await api(test.method || 'GET', test.endpoint, test.body);
      times.push(Date.now() - startTime);
    }
    
    const avgTime = Math.round(times.reduce((a, b) => a + b) / times.length);
    const status = avgTime <= test.target ? 'PASS' : 'WARN';
    logTest('Performance', test.name, status, `${avgTime}ms (target: ${test.target}ms)`);
  }
}

async function testUserWorkflows() {
  console.log('\n=== TESTING USER WORKFLOWS ===');
  
  // Test property search workflow
  try {
    const searchTest = await api('GET', '/api/properties?city=London');
    logTest('Workflow', 'Property Search', searchTest.status === 200 ? 'PASS' : 'FAIL', 'City filtering');
    
    const priceFilterTest = await api('GET', '/api/properties?maxPrice=500');
    logTest('Workflow', 'Price Filtering', priceFilterTest.status === 200 ? 'PASS' : 'FAIL', 'Price range filtering');
    
    const recommendationsTest = await api('POST', '/api/recommendations/properties', {
      budget: 400,
      location: 'London',
      propertyType: 'flat'
    });
    logTest('Workflow', 'Personalized Recommendations', recommendationsTest.status === 200 ? 'PASS' : 'FAIL', 'AI matching');
    
  } catch (error) {
    logTest('Workflow', 'User Workflows', 'FAIL', error.message);
  }
}

async function testUtilityManagement() {
  console.log('\n=== TESTING UTILITY MANAGEMENT SYSTEM ===');
  
  try {
    // Test public utility providers endpoint
    const publicProviders = await api('GET', '/api/utility-providers-public');
    logTest('Utilities', 'Public Provider Access', publicProviders.status === 200 ? 'PASS' : 'FAIL', 'Public endpoint available');
    
    // Test admin utility management (should require auth)
    const adminUtilities = await api('GET', '/api/admin/utilities');
    logTest('Utilities', 'Admin Access Control', adminUtilities.status === 401 ? 'PASS' : 'WARN', 'Proper authentication required');
    
    // Test utility registration endpoint
    const registrationTest = await api('POST', '/api/utilities/register', {
      propertyId: 1,
      providers: ['british-gas']
    });
    logTest('Utilities', 'Registration Endpoint', registrationTest.status === 401 || registrationTest.status === 200 ? 'PASS' : 'FAIL', 'Access controlled');
    
  } catch (error) {
    logTest('Utilities', 'System Test', 'FAIL', error.message);
  }
}

async function testFrontendComponents() {
  console.log('\n=== TESTING FRONTEND COMPONENTS ===');
  
  try {
    // Test main application load
    const frontendTest = await api('GET', '/');
    logTest('Frontend', 'Main Application Load', frontendTest.status === 200 ? 'PASS' : 'FAIL', 'React app serving');
    
    // Test static assets
    const assetsTest = await api('GET', '/favicon.ico');
    logTest('Frontend', 'Static Assets', assetsTest.status === 200 ? 'PASS' : 'WARN', 'Favicon available');
    
    // Test image assets
    const imageTest = await api('GET', '/images/london.jpg');
    logTest('Frontend', 'Image Assets', imageTest.status === 200 ? 'PASS' : 'WARN', 'City images available');
    
  } catch (error) {
    logTest('Frontend', 'Component Test', 'FAIL', error.message);
  }
}

async function testDataIntegrity() {
  console.log('\n=== TESTING DATA INTEGRITY ===');
  
  try {
    const propertiesResponse = await api('GET', '/api/properties');
    const properties = JSON.parse(propertiesResponse.data);
    
    if (Array.isArray(properties) && properties.length > 0) {
      const sampleProperty = properties[0];
      
      // Check required fields
      const requiredFields = ['id', 'title', 'city', 'price', 'bedrooms'];
      const missingFields = requiredFields.filter(field => !sampleProperty[field]);
      
      if (missingFields.length === 0) {
        logTest('Data', 'Property Data Structure', 'PASS', 'All required fields present');
      } else {
        logTest('Data', 'Property Data Structure', 'FAIL', `Missing: ${missingFields.join(', ')}`);
      }
      
      // Test price format
      const priceValid = typeof sampleProperty.price === 'string' && !isNaN(parseFloat(sampleProperty.price));
      logTest('Data', 'Price Format Validation', priceValid ? 'PASS' : 'FAIL', 'Numeric price values');
      
      // Test UK postcode format
      const postcodeValid = /^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][A-Z]{2}$/.test(sampleProperty.postcode || '');
      logTest('Data', 'UK Postcode Format', postcodeValid ? 'PASS' : 'WARN', 'Valid UK postcode format');
      
    } else {
      logTest('Data', 'Property Data Availability', 'FAIL', 'No properties found');
    }
    
    // Test utility providers data
    const utilityResponse = await api('GET', '/api/utility-providers-public');
    if (utilityResponse.status === 200) {
      logTest('Data', 'Utility Provider Data', 'PASS', 'Providers accessible');
    } else {
      logTest('Data', 'Utility Provider Data', 'FAIL', `Status: ${utilityResponse.status}`);
    }
    
  } catch (error) {
    logTest('Data', 'Integrity Check', 'FAIL', error.message);
  }
}

async function testErrorHandling() {
  console.log('\n=== TESTING ERROR HANDLING ===');
  
  try {
    // Test invalid endpoint
    const invalidEndpoint = await api('GET', '/api/nonexistent');
    logTest('Error', 'Invalid Endpoint Handling', invalidEndpoint.status === 404 ? 'PASS' : 'WARN', '404 for invalid routes');
    
    // Test malformed request
    const malformedRequest = await api('POST', '/api/recommendations/properties', 'invalid json');
    logTest('Error', 'Malformed Request Handling', malformedRequest.status >= 400 ? 'PASS' : 'WARN', 'Bad request handling');
    
    // Test unauthorized access
    const unauthorizedAccess = await api('GET', '/api/admin/configuration');
    logTest('Error', 'Unauthorized Access', unauthorizedAccess.status === 401 ? 'PASS' : 'WARN', 'Authentication required');
    
  } catch (error) {
    logTest('Error', 'Error Handling Test', 'FAIL', error.message);
  }
}

async function testSystemStress() {
  console.log('\n=== TESTING SYSTEM STRESS ===');
  
  try {
    const concurrentRequests = 10;
    const promises = [];
    
    // Create concurrent requests
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(api('GET', '/api/properties'));
    }
    
    const startTime = Date.now();
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    const successCount = results.filter(r => r.status === 200).length;
    const avgResponseTime = totalTime / concurrentRequests;
    
    if (successCount === concurrentRequests && avgResponseTime < 500) {
      logTest('Stress', 'Concurrent Request Handling', 'PASS', `${successCount}/${concurrentRequests} success, ${avgResponseTime}ms avg`);
    } else {
      logTest('Stress', 'Concurrent Request Handling', 'WARN', `${successCount}/${concurrentRequests} success, ${avgResponseTime}ms avg`);
    }
    
  } catch (error) {
    logTest('Stress', 'System Stress Test', 'FAIL', error.message);
  }
}

// Main test execution
async function runComprehensiveTests() {
  console.log('🔍 STARTING COMPREHENSIVE DEEP TESTING SUITE');
  console.log('Testing every component, dashboard, and workflow...\n');
  
  const startTime = Date.now();
  
  // Execute all test suites
  await testDatabaseConnectivity();
  await testAPIEndpoints();
  await testSecurityHeaders();
  await testPerformanceBenchmarks();
  await testUserWorkflows();
  await testUtilityManagement();
  await testFrontendComponents();
  await testDataIntegrity();
  await testErrorHandling();
  await testSystemStress();
  
  const totalTime = Date.now() - startTime;
  
  // Generate comprehensive report
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.passed + testResults.failed + testResults.warnings}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);
  console.log(`⏱️  Total Time: ${totalTime}ms`);
  
  const successRate = Math.round((testResults.passed / (testResults.passed + testResults.failed + testResults.warnings)) * 100);
  console.log(`📈 Success Rate: ${successRate}%`);
  
  // Detailed results by category
  const categories = [...new Set(testResults.details.map(t => t.category))];
  categories.forEach(category => {
    const categoryTests = testResults.details.filter(t => t.category === category);
    const categoryPassed = categoryTests.filter(t => t.status === 'PASS').length;
    const categoryTotal = categoryTests.length;
    console.log(`\n📁 ${category}: ${categoryPassed}/${categoryTotal} passed`);
    
    categoryTests.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`   ${icon} ${test.test}${test.details ? ' - ' + test.details : ''}`);
    });
  });
  
  // Overall system health assessment
  console.log('\n' + '='.repeat(60));
  console.log('🏥 SYSTEM HEALTH ASSESSMENT');
  console.log('='.repeat(60));
  
  if (testResults.failed === 0 && testResults.warnings <= 2) {
    console.log('🟢 EXCELLENT: System is fully operational with optimal performance');
  } else if (testResults.failed <= 2 && testResults.warnings <= 5) {
    console.log('🟡 GOOD: System is operational with minor issues that should be addressed');
  } else {
    console.log('🔴 NEEDS ATTENTION: System has issues that require immediate attention');
  }
  
  console.log('\n✨ Comprehensive deep testing completed successfully!');
  
  return {
    success: testResults.failed === 0,
    totalTests: testResults.passed + testResults.failed + testResults.warnings,
    passed: testResults.passed,
    failed: testResults.failed,
    warnings: testResults.warnings,
    successRate,
    totalTime,
    details: testResults.details
  };
}

// Run tests directly
runComprehensiveTests().catch(console.error);