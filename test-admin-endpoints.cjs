/**
 * Test Admin Endpoints Functionality
 * Quick verification that admin endpoints now return JSON instead of HTML
 */

const http = require('http');

async function api(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'admin-test-bot',
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

async function testAdminEndpoints() {
  console.log('🔧 TESTING ADMIN ENDPOINT FIXES');
  console.log('======================================');
  
  const endpoints = [
    '/api/admin/users',
    '/api/admin/analytics', 
    '/api/admin/pending-verifications',
    '/api/admin/property-stats',
    '/api/admin/ai-status',
    '/api/admin/dashboard-stats'
  ];
  
  let fixedCount = 0;
  let totalCount = endpoints.length;
  
  for (const endpoint of endpoints) {
    try {
      const result = await api('GET', endpoint);
      
      if (result.success && result.dataType === 'json') {
        console.log(`✅ ${endpoint} - FIXED (JSON response)`);
        fixedCount++;
      } else if (result.dataType === 'html') {
        console.log(`❌ ${endpoint} - STILL HTML (${result.size}b)`);
      } else if (result.statusCode === 401) {
        console.log(`🔐 ${endpoint} - AUTH REQUIRED (expected)`);
        fixedCount++; // This is expected behavior
      } else {
        console.log(`⚠️ ${endpoint} - UNKNOWN (${result.statusCode}, ${result.dataType})`);
      }
    } catch (error) {
      console.log(`💥 ${endpoint} - ERROR: ${error.message}`);
    }
  }
  
  console.log('\n======================================');
  console.log(`📊 ADMIN ENDPOINT FIX RESULTS:`);
  console.log(`   Fixed: ${fixedCount}/${totalCount} endpoints`);
  
  if (fixedCount === totalCount) {
    console.log(`🎉 ALL ADMIN ENDPOINTS FIXED!`);
    console.log(`   Admin dashboard should now receive JSON data instead of HTML`);
  } else {
    console.log(`⚠️ ${totalCount - fixedCount} endpoints still need attention`);
  }
  
  console.log('\n✨ Admin endpoint verification completed!');
}

testAdminEndpoints().catch(console.error);
