/**
 * Inspect actual admin endpoint responses to understand data structure issues
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
            success: true
          });
        } catch (e) {
          resolve({ 
            data, 
            statusCode: res.statusCode, 
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
  const setCookieHeader = login.headers['set-cookie'];
  let sessionCookie = '';
  if (setCookieHeader && Array.isArray(setCookieHeader)) {
    const sidCookie = setCookieHeader.find(cookie => cookie.startsWith('sid='));
    if (sidCookie) {
      sessionCookie = sidCookie.split(';')[0];
    }
  }
  
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
      console.log('Actual response structure:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`Error: ${result.statusCode}`);
      console.log(result.data);
    }
  }
}

inspectAdminResponses().catch(console.error);
