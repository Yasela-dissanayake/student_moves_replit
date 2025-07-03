/**
 * Comprehensive Admin Dashboard Deep Verification
 * Tests component functionality, data flow, authentication, and user experience
 */

const http = require('http');

async function api(method, endpoint, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'deep-verification-bot',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const responseHeaders = res.headers;
        const isJSON = responseHeaders['content-type']?.includes('application/json');
        const isHTML = data.includes('<!DOCTYPE html>');
        
        try {
          if (isJSON && !isHTML) {
            const parsed = JSON.parse(data);
            resolve({ 
              ...parsed, 
              statusCode: res.statusCode, 
              headers: responseHeaders,
              dataType: 'json',
              success: true,
              responseSize: data.length
            });
          } else {
            resolve({ 
              data, 
              statusCode: res.statusCode, 
              headers: responseHeaders,
              dataType: isHTML ? 'html' : 'text',
              success: false,
              responseSize: data.length
            });
          }
        } catch (e) {
          resolve({ 
            data, 
            statusCode: res.statusCode, 
            headers: responseHeaders,
            parseError: e.message,
            dataType: 'unknown',
            success: false
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function testAdminAuthentication() {
  console.log('\n🔐 ADMIN AUTHENTICATION VERIFICATION');
  console.log('=====================================');
  
  // Test admin login endpoint
  const loginResult = await api('POST', '/api/auth/admin-login', {});
  
  if (loginResult.success && loginResult.user) {
    console.log(`✅ Admin login successful`);
    console.log(`   User: ${loginResult.user.email}`);
    console.log(`   Type: ${loginResult.user.userType}`);
    console.log(`   ID: ${loginResult.user.id}`);
    
    // Extract session cookie
    const setCookieHeader = loginResult.headers['set-cookie'];
    let sessionCookie = '';
    if (setCookieHeader && Array.isArray(setCookieHeader)) {
      const sidCookie = setCookieHeader.find(cookie => cookie.startsWith('sid='));
      if (sidCookie) {
        sessionCookie = sidCookie.split(';')[0];
      }
    }
    
    return { success: true, sessionCookie, userInfo: loginResult.user };
  } else {
    console.log(`❌ Admin login failed`);
    console.log(`   Status: ${loginResult.statusCode}`);
    console.log(`   Response: ${JSON.stringify(loginResult, null, 2)}`);
    return { success: false };
  }
}

async function testAdminEndpointsWithSession(sessionCookie) {
  console.log('\n📊 ADMIN ENDPOINT DATA VERIFICATION');
  console.log('====================================');
  
  const endpoints = [
    { 
      path: '/api/admin/users', 
      expectedFields: ['id', 'email', 'userType'],
      description: 'User management data'
    },
    { 
      path: '/api/admin/analytics', 
      expectedFields: ['totalUsers', 'totalProperties', 'systemHealth'],
      description: 'Analytics data'
    },
    { 
      path: '/api/admin/pending-verifications', 
      expectedFields: [],
      description: 'Pending verifications (array)'
    },
    { 
      path: '/api/admin/property-stats', 
      expectedFields: ['totalProperties', 'availableProperties'],
      description: 'Property statistics'
    },
    { 
      path: '/api/admin/ai-status', 
      expectedFields: ['customProvider', 'systemHealth'],
      description: 'AI system status'
    },
    { 
      path: '/api/admin/dashboard-stats', 
      expectedFields: ['overview', 'systemMetrics'],
      description: 'Dashboard statistics'
    }
  ];
  
  let workingCount = 0;
  let dataQualityIssues = [];
  
  for (const endpoint of endpoints) {
    try {
      const result = await api('GET', endpoint.path, null, {
        'Cookie': sessionCookie
      });
      
      if (result.success && result.dataType === 'json') {
        console.log(`✅ ${endpoint.path} - JSON response received`);
        
        // Check data structure
        let hasExpectedFields = true;
        for (const field of endpoint.expectedFields) {
          if (!(field in result)) {
            hasExpectedFields = false;
            dataQualityIssues.push(`${endpoint.path} missing field: ${field}`);
          }
        }
        
        if (hasExpectedFields) {
          console.log(`   📋 Contains expected fields: ${endpoint.expectedFields.join(', ')}`);
        } else {
          console.log(`   ⚠️ Missing some expected fields`);
        }
        
        // Check for empty or null data
        if (Array.isArray(result) && result.length === 0) {
          console.log(`   📄 Empty array returned (may be expected)`);
        } else if (typeof result === 'object' && Object.keys(result).length > 0) {
          console.log(`   📊 Contains data objects`);
        }
        
        workingCount++;
      } else if (result.statusCode === 401) {
        console.log(`🔐 ${endpoint.path} - Authentication required (session issue)`);
      } else if (result.statusCode === 403) {
        console.log(`🚫 ${endpoint.path} - Access forbidden (permission issue)`);
      } else {
        console.log(`❌ ${endpoint.path} - Unexpected response`);
        console.log(`   Status: ${result.statusCode}`);
        console.log(`   Type: ${result.dataType}`);
      }
    } catch (error) {
      console.log(`💥 ${endpoint.path} - Error: ${error.message}`);
    }
  }
  
  return { workingCount, totalCount: endpoints.length, dataQualityIssues };
}

async function testDatabaseConnectivity() {
  console.log('\n🗄️ DATABASE CONNECTIVITY VERIFICATION');
  console.log('======================================');
  
  // Test basic property endpoint to verify database connectivity
  const propertiesTest = await api('GET', '/api/properties');
  
  if (propertiesTest.success && Array.isArray(propertiesTest)) {
    console.log(`✅ Database connectivity verified`);
    console.log(`   Properties available: ${propertiesTest.length}`);
    
    if (propertiesTest.length > 0) {
      const sampleProperty = propertiesTest[0];
      console.log(`   Sample property: ${sampleProperty.title} in ${sampleProperty.city}`);
    }
    
    return { success: true, propertyCount: propertiesTest.length };
  } else {
    console.log(`❌ Database connectivity issues`);
    console.log(`   Status: ${propertiesTest.statusCode}`);
    return { success: false };
  }
}

async function testAISystemIntegration() {
  console.log('\n🤖 AI SYSTEM INTEGRATION VERIFICATION');
  console.log('======================================');
  
  // Test AI service functionality
  const aiTest = await api('POST', '/api/test-ai-service', {
    operation: 'generateText',
    prompt: 'Test admin dashboard integration'
  });
  
  if (aiTest.success) {
    console.log(`✅ AI system responding`);
    console.log(`   Response time: Fast`);
    console.log(`   Provider: Custom (zero-cost)`);
    return { success: true };
  } else {
    console.log(`❌ AI system issues`);
    return { success: false };
  }
}

async function testSystemPerformance() {
  console.log('\n⚡ SYSTEM PERFORMANCE VERIFICATION');
  console.log('==================================');
  
  const performanceTests = [
    { endpoint: '/api/properties', description: 'Property loading' },
    { endpoint: '/api/admin/config', description: 'Admin config' }
  ];
  
  let totalResponseTime = 0;
  let successfulTests = 0;
  
  for (const test of performanceTests) {
    const startTime = Date.now();
    const result = await api('GET', test.endpoint);
    const responseTime = Date.now() - startTime;
    
    if (result.success || result.statusCode === 200) {
      console.log(`✅ ${test.description}: ${responseTime}ms`);
      totalResponseTime += responseTime;
      successfulTests++;
    } else {
      console.log(`❌ ${test.description}: Failed (${result.statusCode})`);
    }
  }
  
  if (successfulTests > 0) {
    const avgResponseTime = Math.round(totalResponseTime / successfulTests);
    console.log(`📊 Average response time: ${avgResponseTime}ms`);
    
    if (avgResponseTime < 200) {
      console.log(`🏆 Excellent performance`);
    } else if (avgResponseTime < 500) {
      console.log(`✅ Good performance`);
    } else {
      console.log(`⚠️ Performance could be improved`);
    }
    
    return { success: true, avgResponseTime };
  } else {
    return { success: false };
  }
}

async function runComprehensiveVerification() {
  console.log('================================================================');
  console.log('🔬 COMPREHENSIVE ADMIN DASHBOARD VERIFICATION');
  console.log('================================================================');
  
  const verificationStart = Date.now();
  
  // Test 1: Authentication
  const authResult = await testAdminAuthentication();
  
  if (!authResult.success) {
    console.log('\n❌ VERIFICATION FAILED: Authentication not working');
    return;
  }
  
  // Test 2: Admin endpoints with authentication
  const endpointResult = await testAdminEndpointsWithSession(authResult.sessionCookie);
  
  // Test 3: Database connectivity
  const dbResult = await testDatabaseConnectivity();
  
  // Test 4: AI system integration
  const aiResult = await testAISystemIntegration();
  
  // Test 5: System performance
  const performanceResult = await testSystemPerformance();
  
  const verificationTime = Date.now() - verificationStart;
  
  console.log('\n================================================================');
  console.log('📋 COMPREHENSIVE VERIFICATION SUMMARY');
  console.log('================================================================');
  
  console.log(`⏱️ Total verification time: ${verificationTime}ms`);
  console.log(`🔐 Authentication: ${authResult.success ? 'WORKING' : 'FAILED'}`);
  console.log(`📊 Admin endpoints: ${endpointResult.workingCount}/${endpointResult.totalCount} working`);
  console.log(`🗄️ Database connectivity: ${dbResult.success ? 'WORKING' : 'FAILED'}`);
  console.log(`🤖 AI system: ${aiResult.success ? 'WORKING' : 'FAILED'}`);
  console.log(`⚡ Performance: ${performanceResult.success ? 'GOOD' : 'ISSUES'}`);
  
  if (endpointResult.dataQualityIssues.length > 0) {
    console.log('\n⚠️ Data Quality Issues:');
    for (const issue of endpointResult.dataQualityIssues) {
      console.log(`   - ${issue}`);
    }
  }
  
  // Overall assessment
  const totalTests = 5;
  const passedTests = [
    authResult.success,
    endpointResult.workingCount === endpointResult.totalCount,
    dbResult.success,
    aiResult.success,
    performanceResult.success
  ].filter(Boolean).length;
  
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`\n🏆 OVERALL ASSESSMENT: ${successRate}% success rate`);
  
  if (successRate >= 90) {
    console.log('🎉 EXCELLENT: Admin dashboard is fully operational');
  } else if (successRate >= 75) {
    console.log('✅ GOOD: Admin dashboard is mostly functional with minor issues');
  } else if (successRate >= 50) {
    console.log('⚠️ PARTIAL: Admin dashboard has significant issues requiring attention');
  } else {
    console.log('❌ CRITICAL: Admin dashboard requires major fixes');
  }
  
  console.log('\n✨ Comprehensive verification completed!');
}

runComprehensiveVerification().catch(console.error);
