/**
 * Test Admin Endpoints with Authentication
 * Login as admin and verify endpoints return JSON data
 */

const http = require('http');
const querystring = require('querystring');

async function api(method, endpoint, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'admin-auth-test',
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
              success: true
            });
          } else if (isHTML) {
            resolve({ 
              data, 
              statusCode: res.statusCode, 
              headers: responseHeaders,
              dataType: 'html',
              success: false,
              size: data.length
            });
          } else {
            resolve({ 
              data, 
              statusCode: res.statusCode, 
              headers: responseHeaders,
              dataType: 'other',
              success: res.statusCode === 200,
              size: data.length
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

async function testAdminEndpointsWithAuth() {
  console.log('🔐 TESTING ADMIN ENDPOINTS WITH AUTHENTICATION');
  console.log('============================================');
  
  // First, login as admin using the temporary admin login endpoint
  console.log('Logging in as admin...');
  const login = await api('POST', '/api/auth/admin-login', {});
  
  if (login.success && login.user) {
    console.log(`✅ Admin login successful: ${login.user.email}`);
    
    // Extract session cookie
    const setCookieHeader = login.headers['set-cookie'];
    let sessionCookie = '';
    if (setCookieHeader && Array.isArray(setCookieHeader)) {
      const sidCookie = setCookieHeader.find(cookie => cookie.startsWith('sid='));
      if (sidCookie) {
        sessionCookie = sidCookie.split(';')[0]; // Get just the sid=value part
      }
    }
    
    if (!sessionCookie) {
      console.log('❌ No session cookie found in login response');
      return;
    }
    
    console.log(`🍪 Using session cookie: ${sessionCookie.substring(0, 20)}...`);
    
    // Test admin endpoints with authentication
    const endpoints = [
      { path: '/api/admin/users', description: 'User management data' },
      { path: '/api/admin/analytics', description: 'Analytics dashboard data' },
      { path: '/api/admin/pending-verifications', description: 'Pending verifications' },
      { path: '/api/admin/property-stats', description: 'Property statistics' },
      { path: '/api/admin/ai-status', description: 'AI system status' },
      { path: '/api/admin/dashboard-stats', description: 'Dashboard statistics' }
    ];
    
    let successCount = 0;
    console.log('\nTesting authenticated admin endpoints:');
    
    for (const endpoint of endpoints) {
      try {
        const result = await api('GET', endpoint.path, null, {
          'Cookie': sessionCookie
        });
        
        if (result.success && result.dataType === 'json') {
          console.log(`✅ ${endpoint.path} - JSON data received`);
          if (Array.isArray(result) || (typeof result === 'object' && result.totalUsers !== undefined)) {
            console.log(`   📊 Contains valid ${endpoint.description}`);
          }
          successCount++;
        } else if (result.statusCode === 401) {
          console.log(`🔐 ${endpoint.path} - Still unauthorized (auth issue)`);
        } else if (result.dataType === 'html') {
          console.log(`❌ ${endpoint.path} - Still returning HTML (${result.size}b)`);
        } else {
          console.log(`⚠️ ${endpoint.path} - Status: ${result.statusCode}, Type: ${result.dataType}`);
        }
      } catch (error) {
        console.log(`💥 ${endpoint.path} - ERROR: ${error.message}`);
      }
    }
    
    console.log('\n============================================');
    console.log(`📊 AUTHENTICATION TEST RESULTS:`);
    console.log(`   Successful: ${successCount}/${endpoints.length} endpoints`);
    
    if (successCount === endpoints.length) {
      console.log(`🎉 ALL ADMIN ENDPOINTS WORKING WITH AUTH!`);
      console.log(`   Admin dashboard routing issue is RESOLVED`);
    } else {
      console.log(`⚠️ ${endpoints.length - successCount} endpoints still need attention`);
    }
    
  } else {
    console.log('❌ Admin login failed');
    console.log('Login response:', login);
  }
  
  console.log('\n✨ Admin authentication test completed!');
}

testAdminEndpointsWithAuth().catch(console.error);
