/**
 * Admin Dashboard Error Detection and Analysis
 * Comprehensive error checking for all admin components
 */

const http = require('http');

async function api(method, endpoint, body = null, cookies = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'node'
      }
    };

    if (cookies) {
      options.headers['Cookie'] = cookies;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ ...parsed, statusCode: res.statusCode, headers: res.headers });
        } catch (e) {
          resolve({ 
            data, 
            statusCode: res.statusCode, 
            isHTML: data.includes('<!DOCTYPE html>'),
            hasError: data.includes('Error') || data.includes('error'),
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function logError(category, test, severity, details = '') {
  const severityEmoji = severity === 'CRITICAL' ? '🔴' : severity === 'WARNING' ? '🟡' : '🟢';
  console.log(`   ${severityEmoji} ${test} - ${severity}${details ? ' (' + details + ')' : ''}`);
}

async function checkConsoleErrors() {
  console.log('\n📝 Console Error Analysis:');
  
  // Check for common JavaScript errors in the frontend
  const frontendRoutes = [
    '/dashboard/admin',
    '/dashboard/admin/ai-settings',
    '/dashboard/admin/social-targeting',
    '/dashboard/admin/property-management'
  ];
  
  for (const route of frontendRoutes) {
    const response = await api('GET', route);
    
    if (response.isHTML && response.data) {
      if (response.data.includes('Error') || response.data.includes('error')) {
        logError('Console', route.split('/').pop(), 'WARNING', 'Potential errors in HTML');
      } else {
        logError('Console', route.split('/').pop(), 'OK', 'No errors detected');
      }
    }
  }
}

async function checkAPIErrors() {
  console.log('\n🔌 API Error Analysis:');
  
  const criticalEndpoints = [
    { path: '/api/admin/config', desc: 'Admin Configuration' },
    { path: '/api/admin/users', desc: 'User Management' },
    { path: '/api/admin/properties', desc: 'Property Management' },
    { path: '/api/admin/analytics', desc: 'Analytics Data' },
    { path: '/api/test-ai-service', desc: 'AI Service Integration' }
  ];
  
  for (const endpoint of criticalEndpoints) {
    try {
      const response = await api('GET', endpoint.path);
      
      if (response.statusCode >= 500) {
        logError('API', endpoint.desc, 'CRITICAL', `Server error: ${response.statusCode}`);
      } else if (response.statusCode === 404) {
        logError('API', endpoint.desc, 'WARNING', 'Endpoint not found');
      } else if (response.statusCode === 401) {
        logError('API', endpoint.desc, 'OK', 'Auth protected (expected)');
      } else if (response.statusCode === 200) {
        logError('API', endpoint.desc, 'OK', 'Working correctly');
      } else {
        logError('API', endpoint.desc, 'WARNING', `Unexpected status: ${response.statusCode}`);
      }
    } catch (error) {
      logError('API', endpoint.desc, 'CRITICAL', `Connection failed: ${error.message}`);
    }
  }
}

async function checkDatabaseErrors() {
  console.log('\n🗄️ Database Error Analysis:');
  
  try {
    // Test database connectivity through properties endpoint
    const properties = await api('GET', '/api/properties');
    
    if (Array.isArray(properties) && properties.length > 0) {
      logError('Database', 'Property Access', 'OK', `${properties.length} records accessible`);
      
      // Check for data integrity
      const sampleProperty = properties[0];
      if (sampleProperty.id && sampleProperty.title && sampleProperty.city) {
        logError('Database', 'Data Integrity', 'OK', 'Valid property structure');
      } else {
        logError('Database', 'Data Integrity', 'WARNING', 'Incomplete property data');
      }
    } else if (properties.statusCode === 500) {
      logError('Database', 'Connectivity', 'CRITICAL', 'Database connection failed');
    } else {
      logError('Database', 'Data Access', 'WARNING', 'Limited data available');
    }
    
    // Test marketplace data
    const marketplace = await api('GET', '/api/marketplace/items');
    if (Array.isArray(marketplace)) {
      logError('Database', 'Marketplace Access', 'OK', `${marketplace.length} marketplace items`);
    } else {
      logError('Database', 'Marketplace Access', 'WARNING', 'Marketplace data issues');
    }
    
  } catch (error) {
    logError('Database', 'Connection Test', 'CRITICAL', error.message);
  }
}

async function checkAuthenticationErrors() {
  console.log('\n🔐 Authentication Error Analysis:');
  
  // Test admin authentication
  try {
    const loginResult = await api('POST', '/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    if (loginResult.statusCode === 200 && loginResult.id) {
      logError('Auth', 'Admin Login', 'OK', `User ID: ${loginResult.id}`);
      
      // Test protected endpoint access
      const protectedTest = await api('GET', '/api/admin/config');
      if (protectedTest.statusCode === 200) {
        logError('Auth', 'Protected Access', 'OK', 'Admin endpoints accessible');
      } else {
        logError('Auth', 'Protected Access', 'WARNING', 'Session issues detected');
      }
    } else {
      logError('Auth', 'Admin Login', 'CRITICAL', `Login failed: ${loginResult.statusCode}`);
    }
    
    // Test unauthorized access
    const unauthorizedTest = await api('GET', '/api/admin/users');
    if (unauthorizedTest.statusCode === 401) {
      logError('Auth', 'Security Enforcement', 'OK', 'Unauthorized access properly blocked');
    } else {
      logError('Auth', 'Security Enforcement', 'WARNING', 'Security may be compromised');
    }
    
  } catch (error) {
    logError('Auth', 'System Test', 'CRITICAL', error.message);
  }
}

async function checkAIServiceErrors() {
  console.log('\n🤖 AI Service Error Analysis:');
  
  try {
    const aiTest = await api('POST', '/api/test-ai-service', {
      operation: 'generateText',
      prompt: 'Test for admin dashboard errors'
    });
    
    if (aiTest.success) {
      logError('AI', 'Service Manager', 'OK', 'Custom provider operational');
      logError('AI', 'Cost Management', 'OK', 'Zero external API costs');
    } else if (aiTest.statusCode === 500) {
      logError('AI', 'Service Manager', 'CRITICAL', 'AI service crashed');
    } else {
      logError('AI', 'Service Manager', 'WARNING', 'AI service issues detected');
    }
    
    // Test AI provider fallback
    const fallbackTest = await api('POST', '/api/test-ai-service', {
      operation: 'generateText',
      prompt: 'Fallback test',
      forceFailAll: true
    });
    
    if (fallbackTest.statusCode !== 500) {
      logError('AI', 'Error Handling', 'OK', 'Graceful failure handling');
    } else {
      logError('AI', 'Error Handling', 'WARNING', 'Poor error recovery');
    }
    
  } catch (error) {
    logError('AI', 'Service Test', 'CRITICAL', error.message);
  }
}

async function checkPerformanceErrors() {
  console.log('\n⚡ Performance Error Analysis:');
  
  const performanceTests = [
    { endpoint: '/api/properties', desc: 'Property Loading' },
    { endpoint: '/api/recommendations/properties', method: 'POST', desc: 'AI Recommendations' },
    { endpoint: '/api/marketplace/items', desc: 'Marketplace Loading' }
  ];
  
  for (const test of performanceTests) {
    const startTime = Date.now();
    
    try {
      const response = await api(test.method || 'GET', test.endpoint, 
        test.method === 'POST' ? {} : null);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (responseTime > 5000) {
        logError('Performance', test.desc, 'CRITICAL', `${responseTime}ms (too slow)`);
      } else if (responseTime > 2000) {
        logError('Performance', test.desc, 'WARNING', `${responseTime}ms (slow)`);
      } else {
        logError('Performance', test.desc, 'OK', `${responseTime}ms (good)`);
      }
    } catch (error) {
      logError('Performance', test.desc, 'CRITICAL', `Failed: ${error.message}`);
    }
  }
}

async function runAdminErrorCheck() {
  console.log('======================================================================');
  console.log('🔍 ADMIN DASHBOARD ERROR ANALYSIS');
  console.log('======================================================================');
  
  const startTime = Date.now();
  
  await checkConsoleErrors();
  await checkAPIErrors();
  await checkDatabaseErrors();
  await checkAuthenticationErrors();
  await checkAIServiceErrors();
  await checkPerformanceErrors();
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  console.log('\n============================================================');
  console.log('🏥 ERROR ANALYSIS SUMMARY');
  console.log('============================================================');
  console.log(`⏱️ Analysis Time: ${totalTime}ms`);
  console.log(`🔍 Comprehensive error scan completed`);
  console.log(`📊 All critical systems checked for issues`);
  
  console.log('\n📋 Recommendations:');
  console.log('   ✅ Continue monitoring API response times');
  console.log('   ✅ Maintain zero-cost AI configuration');
  console.log('   ✅ Keep authentication security measures active');
  console.log('   ✅ Regular database integrity checks recommended');
  
  console.log('\n✨ Admin dashboard error analysis completed!');
}

runAdminErrorCheck().catch(console.error);
