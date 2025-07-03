/**
 * COMPREHENSIVE DEEP SYSTEM TEST
 * Advanced testing framework for complete platform validation
 * Tests all major components, API endpoints, database operations, and user workflows
 */

import https from 'https';
import http from 'http';
import fs from 'fs';

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_RESULTS = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function for API requests
async function apiRequest(method, endpoint, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DeepSystemTest/1.0',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null,
            raw: data
          };
          resolve(result);
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: null,
            raw: data,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Test logging function
function logTest(category, testName, status, details = '', responseTime = null) {
  const result = {
    category,
    test: testName,
    status,
    details,
    responseTime,
    timestamp: new Date().toISOString()
  };
  
  TEST_RESULTS.details.push(result);
  TEST_RESULTS.total++;
  
  if (status === 'PASS') {
    TEST_RESULTS.passed++;
    console.log(`✅ [${category}] ${testName} - ${details} ${responseTime ? `(${responseTime}ms)` : ''}`);
  } else {
    TEST_RESULTS.failed++;
    console.log(`❌ [${category}] ${testName} - ${details} ${responseTime ? `(${responseTime}ms)` : ''}`);
  }
}

// 1. Core API Endpoints Test
async function testCoreAPIEndpoints() {
  console.log('\n🔍 Testing Core API Endpoints...');
  
  const endpoints = [
    { method: 'GET', path: '/api/health', expectStatus: 200 },
    { method: 'GET', path: '/api/properties', expectStatus: 200 },
    { method: 'GET', path: '/api/users', expectStatus: 200 },
    { method: 'GET', path: '/api/auth/me', expectStatus: 401 }, // Unauthenticated
    { method: 'GET', path: '/api/marketplace/items', expectStatus: 200 },
    { method: 'GET', path: '/api/utilities/providers', expectStatus: 200 },
    { method: 'GET', path: '/api/utility/providers-public', expectStatus: 200 },
    { method: 'GET', path: '/api/documents/templates', expectStatus: 200 },
    { method: 'GET', path: '/api/admin/config', expectStatus: 401 }, // Requires auth
    { method: 'GET', path: '/api/ai/test-service', expectStatus: 200 }
  ];

  for (const endpoint of endpoints) {
    try {
      const start = Date.now();
      const response = await apiRequest(endpoint.method, endpoint.path);
      const responseTime = Date.now() - start;
      
      if (response.status === endpoint.expectStatus) {
        logTest('API', `${endpoint.method} ${endpoint.path}`, 'PASS', 
          `Status: ${response.status}`, responseTime);
      } else {
        logTest('API', `${endpoint.method} ${endpoint.path}`, 'FAIL', 
          `Expected: ${endpoint.expectStatus}, Got: ${response.status}`, responseTime);
      }
    } catch (error) {
      logTest('API', `${endpoint.method} ${endpoint.path}`, 'FAIL', 
        `Error: ${error.message}`);
    }
  }
}

// 2. Authentication System Test
async function testAuthenticationSystem() {
  console.log('\n🔐 Testing Authentication System...');
  
  try {
    // Test admin login
    const start = Date.now();
    const loginResponse = await apiRequest('POST', '/api/auth/login', {
      email: 'admin@studentmoves.com',
      password: 'admin123'
    });
    const responseTime = Date.now() - start;
    
    if (loginResponse.status === 200 && loginResponse.data?.success) {
      logTest('AUTH', 'Admin Login', 'PASS', 
        `Login successful`, responseTime);
      
      // Extract session cookie
      const cookies = loginResponse.headers['set-cookie'] || [];
      const sessionCookie = cookies.find(c => c.startsWith('sid='));
      
      if (sessionCookie) {
        // Test authenticated endpoint
        const authStart = Date.now();
        const meResponse = await apiRequest('GET', '/api/auth/me', null, {
          'Cookie': sessionCookie
        });
        const authResponseTime = Date.now() - authStart;
        
        if (meResponse.status === 200 && meResponse.data?.id) {
          logTest('AUTH', 'Authenticated Request', 'PASS', 
            `User data retrieved: ${meResponse.data.email}`, authResponseTime);
        } else {
          logTest('AUTH', 'Authenticated Request', 'FAIL', 
            `Status: ${meResponse.status}`, authResponseTime);
        }
        
        // Test logout
        const logoutStart = Date.now();
        const logoutResponse = await apiRequest('GET', '/api/auth/logout', null, {
          'Cookie': sessionCookie
        });
        const logoutResponseTime = Date.now() - logoutStart;
        
        if (logoutResponse.status === 302 || logoutResponse.status === 200) {
          logTest('AUTH', 'Logout', 'PASS', 
            `Logout successful`, logoutResponseTime);
        } else {
          logTest('AUTH', 'Logout', 'FAIL', 
            `Status: ${logoutResponse.status}`, logoutResponseTime);
        }
      }
    } else {
      logTest('AUTH', 'Admin Login', 'FAIL', 
        `Status: ${loginResponse.status}, Response: ${JSON.stringify(loginResponse.data)}`, responseTime);
    }
  } catch (error) {
    logTest('AUTH', 'Authentication System', 'FAIL', 
      `Error: ${error.message}`);
  }
}

// 3. Database Connectivity Test
async function testDatabaseConnectivity() {
  console.log('\n🗄️ Testing Database Connectivity...');
  
  const dataEndpoints = [
    { path: '/api/properties', name: 'Properties Data' },
    { path: '/api/users', name: 'Users Data' },
    { path: '/api/marketplace/items', name: 'Marketplace Items' },
    { path: '/api/utilities/providers', name: 'Utility Providers' }
  ];

  for (const endpoint of dataEndpoints) {
    try {
      const start = Date.now();
      const response = await apiRequest('GET', endpoint.path);
      const responseTime = Date.now() - start;
      
      if (response.status === 200 && response.data) {
        const count = Array.isArray(response.data) ? response.data.length : 
                     (response.data.items?.length || 'N/A');
        logTest('DATABASE', endpoint.name, 'PASS', 
          `${count} records retrieved`, responseTime);
      } else {
        logTest('DATABASE', endpoint.name, 'FAIL', 
          `Status: ${response.status}`, responseTime);
      }
    } catch (error) {
      logTest('DATABASE', endpoint.name, 'FAIL', 
        `Error: ${error.message}`);
    }
  }
}

// 4. AI Services Test
async function testAIServices() {
  console.log('\n🤖 Testing AI Services...');
  
  try {
    // Test AI service manager
    const start = Date.now();
    const aiResponse = await apiRequest('GET', '/api/ai/test-service');
    const responseTime = Date.now() - start;
    
    if (aiResponse.status === 200 && aiResponse.data?.success) {
      logTest('AI', 'Service Manager', 'PASS', 
        `AI service operational`, responseTime);
    } else {
      logTest('AI', 'Service Manager', 'FAIL', 
        `Status: ${aiResponse.status}`, responseTime);
    }
    
    // Test property recommendations
    const recStart = Date.now();
    const recResponse = await apiRequest('POST', '/api/recommendations/properties', {
      preferences: { city: 'London', maxPrice: '500' }
    });
    const recResponseTime = Date.now() - recStart;
    
    if (recResponse.status === 200 && recResponse.data?.recommendations) {
      logTest('AI', 'Property Recommendations', 'PASS', 
        `${recResponse.data.recommendations.length} recommendations generated`, recResponseTime);
    } else {
      logTest('AI', 'Property Recommendations', 'FAIL', 
        `Status: ${recResponse.status}`, recResponseTime);
    }
  } catch (error) {
    logTest('AI', 'AI Services', 'FAIL', 
      `Error: ${error.message}`);
  }
}

// 5. Security Headers Test
async function testSecurityHeaders() {
  console.log('\n🛡️ Testing Security Headers...');
  
  try {
    const start = Date.now();
    const response = await apiRequest('GET', '/api/health');
    const responseTime = Date.now() - start;
    
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'content-security-policy'
    ];
    
    let headerCount = 0;
    for (const header of securityHeaders) {
      if (response.headers[header]) {
        headerCount++;
      }
    }
    
    if (headerCount >= 3) {
      logTest('SECURITY', 'Security Headers', 'PASS', 
        `${headerCount}/${securityHeaders.length} security headers present`, responseTime);
    } else {
      logTest('SECURITY', 'Security Headers', 'FAIL', 
        `Only ${headerCount}/${securityHeaders.length} security headers present`, responseTime);
    }
  } catch (error) {
    logTest('SECURITY', 'Security Headers', 'FAIL', 
      `Error: ${error.message}`);
  }
}

// 6. Performance Benchmarks
async function testPerformanceBenchmarks() {
  console.log('\n⚡ Testing Performance Benchmarks...');
  
  const performanceTests = [
    { path: '/api/properties', name: 'Properties Load Time', maxTime: 1000 },
    { path: '/api/marketplace/items', name: 'Marketplace Load Time', maxTime: 1000 },
    { path: '/api/utilities/providers', name: 'Utilities Load Time', maxTime: 500 }
  ];
  
  for (const test of performanceTests) {
    try {
      const start = Date.now();
      const response = await apiRequest('GET', test.path);
      const responseTime = Date.now() - start;
      
      if (response.status === 200 && responseTime < test.maxTime) {
        logTest('PERFORMANCE', test.name, 'PASS', 
          `Completed in ${responseTime}ms (under ${test.maxTime}ms limit)`, responseTime);
      } else if (response.status === 200) {
        logTest('PERFORMANCE', test.name, 'WARN', 
          `Completed in ${responseTime}ms (over ${test.maxTime}ms limit)`, responseTime);
      } else {
        logTest('PERFORMANCE', test.name, 'FAIL', 
          `Status: ${response.status}`, responseTime);
      }
    } catch (error) {
      logTest('PERFORMANCE', test.name, 'FAIL', 
        `Error: ${error.message}`);
    }
  }
}

// 7. Zero-Cost AI Integration Test
async function testZeroCostAI() {
  console.log('\n💰 Testing Zero-Cost AI Integration...');
  
  try {
    // Test custom AI provider (zero cost)
    const start = Date.now();
    const aiResponse = await apiRequest('POST', '/api/openai/custom', {
      prompt: 'Test prompt for zero-cost AI',
      type: 'text'
    });
    const responseTime = Date.now() - start;
    
    if (aiResponse.status === 200 && aiResponse.data?.success) {
      logTest('ZERO_COST_AI', 'Custom AI Provider', 'PASS', 
        `Zero-cost AI response generated`, responseTime);
    } else {
      logTest('ZERO_COST_AI', 'Custom AI Provider', 'FAIL', 
        `Status: ${aiResponse.status}`, responseTime);
    }
  } catch (error) {
    logTest('ZERO_COST_AI', 'Zero-Cost AI', 'FAIL', 
      `Error: ${error.message}`);
  }
}

// 8. Admin Dashboard Test
async function testAdminDashboard() {
  console.log('\n👑 Testing Admin Dashboard...');
  
  // Test admin-specific endpoints
  const adminEndpoints = [
    { path: '/api/admin/users', name: 'Admin Users List' },
    { path: '/api/admin/system-stats', name: 'System Statistics' },
    { path: '/api/marketplace/fraud-alerts', name: 'Fraud Alerts' }
  ];
  
  for (const endpoint of adminEndpoints) {
    try {
      const start = Date.now();
      const response = await apiRequest('GET', endpoint.path);
      const responseTime = Date.now() - start;
      
      // Most admin endpoints should return 401 without authentication
      if (response.status === 401 || response.status === 200) {
        logTest('ADMIN', endpoint.name, 'PASS', 
          `Endpoint accessible (Status: ${response.status})`, responseTime);
      } else {
        logTest('ADMIN', endpoint.name, 'FAIL', 
          `Unexpected status: ${response.status}`, responseTime);
      }
    } catch (error) {
      logTest('ADMIN', endpoint.name, 'FAIL', 
        `Error: ${error.message}`);
    }
  }
}

// Generate comprehensive report
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE DEEP SYSTEM TEST REPORT');
  console.log('='.repeat(80));
  
  const successRate = ((TEST_RESULTS.passed / TEST_RESULTS.total) * 100).toFixed(1);
  const categories = {};
  
  // Group results by category
  TEST_RESULTS.details.forEach(result => {
    if (!categories[result.category]) {
      categories[result.category] = { passed: 0, total: 0, avgTime: 0 };
    }
    categories[result.category].total++;
    if (result.status === 'PASS') {
      categories[result.category].passed++;
    }
    if (result.responseTime) {
      categories[result.category].avgTime += result.responseTime;
    }
  });
  
  console.log(`\n📈 OVERALL RESULTS:`);
  console.log(`   Total Tests: ${TEST_RESULTS.total}`);
  console.log(`   Passed: ${TEST_RESULTS.passed}`);
  console.log(`   Failed: ${TEST_RESULTS.failed}`);
  console.log(`   Success Rate: ${successRate}%`);
  
  console.log(`\n📊 CATEGORY BREAKDOWN:`);
  for (const [category, stats] of Object.entries(categories)) {
    const categorySuccess = ((stats.passed / stats.total) * 100).toFixed(1);
    const avgTime = stats.avgTime > 0 ? `${Math.round(stats.avgTime / stats.total)}ms avg` : '';
    console.log(`   ${category}: ${stats.passed}/${stats.total} (${categorySuccess}%) ${avgTime}`);
  }
  
  // Production readiness assessment
  console.log(`\n🎯 PRODUCTION READINESS ASSESSMENT:`);
  if (successRate >= 90) {
    console.log(`   ✅ EXCELLENT - Platform ready for production deployment`);
  } else if (successRate >= 80) {
    console.log(`   ⚠️  GOOD - Minor issues identified, mostly production ready`);
  } else if (successRate >= 70) {
    console.log(`   ⚠️  FAIR - Several issues need addressing before production`);
  } else {
    console.log(`   ❌ POOR - Significant issues require resolution`);
  }
  
  // Failed tests summary
  const failedTests = TEST_RESULTS.details.filter(t => t.status === 'FAIL');
  if (failedTests.length > 0) {
    console.log(`\n❌ FAILED TESTS SUMMARY:`);
    failedTests.forEach(test => {
      console.log(`   [${test.category}] ${test.test}: ${test.details}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`Deep System Test completed at ${new Date().toISOString()}`);
  console.log('='.repeat(80));
  
  return {
    summary: {
      total: TEST_RESULTS.total,
      passed: TEST_RESULTS.passed,
      failed: TEST_RESULTS.failed,
      successRate: parseFloat(successRate),
      categories
    },
    details: TEST_RESULTS.details,
    timestamp: new Date().toISOString()
  };
}

// Main test execution
async function runDeepSystemTest() {
  console.log('🚀 Starting Comprehensive Deep System Test...');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}\n`);
  
  try {
    await testCoreAPIEndpoints();
    await testAuthenticationSystem();
    await testDatabaseConnectivity();
    await testAIServices();
    await testSecurityHeaders();
    await testPerformanceBenchmarks();
    await testZeroCostAI();
    await testAdminDashboard();
    
    const report = generateReport();
    
    // Save detailed report
    fs.writeFileSync('deep-system-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: deep-system-test-report.json');
    
    return report;
  } catch (error) {
    console.error('❌ Deep system test failed:', error.message);
    process.exit(1);
  }
}

// Execute the test
runDeepSystemTest()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });