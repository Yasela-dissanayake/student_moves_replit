/**
 * Fixed inspection of admin endpoint responses
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
        'User-Agent': 'data-inspector',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ 
            ...parsed, 
            statusCode: res.statusCode, 
            headers: res.headers,
            success: true
          });
        } catch (e) {
          resolve({ 
            data, 
            statusCode: res.statusCode, 
            headers: res.headers,
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

async function inspectAdminResponses() {
  console.log('🔍 INSPECTING ADMIN ENDPOINT RESPONSES');
  console.log('======================================');
  
  // Login first
  const login = await api('POST', '/api/auth/admin-login', {});
  
  let sessionCookie = '';
  if (login.headers && login.headers['set-cookie']) {
    const setCookieHeader = login.headers['set-cookie'];
    if (Array.isArray(setCookieHeader)) {
      const sidCookie = setCookieHeader.find(cookie => cookie.startsWith('sid='));
      if (sidCookie) {
        sessionCookie = sidCookie.split(';')[0];
      }
    }
  }
  
  if (!sessionCookie) {
    console.log('❌ No session cookie obtained');
    return;
  }
  
  console.log(`✅ Got session cookie: ${sessionCookie.substring(0, 20)}...`);
  
  const endpoints = [
    '/api/admin/users',
    '/api/admin/analytics', 
    '/api/admin/property-stats',
    '/api/admin/ai-status',
    '/api/admin/dashboard-stats'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n--- ${endpoint} ---`);
    const result = await api('GET', endpoint, null, { 'Cookie': sessionCookie });
    
    if (result.success) {
      console.log('Response status:', result.statusCode);
      console.log('Response keys:', Object.keys(result));
      console.log('Response structure:');
      
      // Create a cleaned copy without headers for display
      const cleanResult = { ...result };
      delete cleanResult.headers;
      delete cleanResult.statusCode;
      delete cleanResult.success;
      
      console.log(JSON.stringify(cleanResult, null, 2));
    } else {
      console.log(`❌ Error: ${result.statusCode}`);
      console.log(result.data);
    }
  }
}

inspectAdminResponses().catch(console.error);
