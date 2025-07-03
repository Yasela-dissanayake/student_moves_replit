/**
 * Deep analysis of admin authentication flow
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
        'User-Agent': 'deep-admin-analysis',
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

async function analyzeAdminFlow() {
  console.log('🔬 DEEP ADMIN AUTHENTICATION FLOW ANALYSIS');
  console.log('==========================================');
  
  // Step 1: Test session endpoint before login
  console.log('\n1. Testing session before login...');
  const sessionBefore = await api('GET', '/api/session-test');
  console.log('Session before login:', {
    authenticated: sessionBefore.authenticated,
    userId: sessionBefore.userId,
    userType: sessionBefore.userType
  });
  
  // Step 2: Perform admin login
  console.log('\n2. Performing admin login...');
  const loginResult = await api('POST', '/api/auth/admin-login', {});
  console.log('Login result:', {
    success: loginResult.success,
    message: loginResult.message,
    user: loginResult.user
  });
  
  // Extract session cookie
  let sessionCookie = '';
  if (loginResult.headers && loginResult.headers['set-cookie']) {
    const setCookieHeader = loginResult.headers['set-cookie'];
    if (Array.isArray(setCookieHeader)) {
      const sidCookie = setCookieHeader.find(cookie => cookie.startsWith('sid='));
      if (sidCookie) {
        sessionCookie = sidCookie.split(';')[0];
        console.log('Extracted session cookie:', sessionCookie.substring(0, 30) + '...');
      }
    }
  }
  
  // Step 3: Test session endpoint after login
  console.log('\n3. Testing session after login...');
  const sessionAfter = await api('GET', '/api/session-test', null, {
    'Cookie': sessionCookie
  });
  console.log('Session after login:', {
    authenticated: sessionAfter.authenticated,
    userId: sessionAfter.userId,
    userType: sessionAfter.userType
  });
  
  // Step 4: Test a simple admin endpoint
  console.log('\n4. Testing admin endpoint with session...');
  const adminTest = await api('GET', '/api/admin/users', null, {
    'Cookie': sessionCookie
  });
  console.log('Admin endpoint result:', {
    statusCode: adminTest.statusCode,
    success: adminTest.success,
    message: adminTest.message || 'No message',
    hasData: !!adminTest.users
  });
  
  // Step 5: Compare working vs non-working endpoints
  console.log('\n5. Testing working vs protected endpoints...');
  
  // Test a public endpoint that should work
  const publicTest = await api('GET', '/api/properties');
  console.log('Public endpoint (properties):', {
    statusCode: publicTest.statusCode,
    success: Array.isArray(publicTest) && publicTest.length > 0
  });
  
  // Test an admin endpoint that requires auth
  const adminConfigTest = await api('GET', '/api/admin/config', null, {
    'Cookie': sessionCookie
  });
  console.log('Admin config endpoint:', {
    statusCode: adminConfigTest.statusCode,
    success: adminConfigTest.success,
    hasData: !!adminConfigTest.data
  });
  
  console.log('\n📊 ANALYSIS SUMMARY');
  console.log('===================');
  console.log(`✓ Login endpoint: ${loginResult.success ? 'Working' : 'Failed'}`);
  console.log(`✓ Session creation: ${sessionCookie ? 'Working' : 'Failed'}`);
  console.log(`✓ Session recognition: ${sessionAfter.authenticated ? 'Working' : 'Failed'}`);
  console.log(`✓ Admin endpoint access: ${adminTest.statusCode === 200 ? 'Working' : 'Failed'}`);
  console.log(`✓ Admin config access: ${adminConfigTest.statusCode === 200 ? 'Working' : 'Failed'}`);
  
  // Determine root cause
  if (!loginResult.success) {
    console.log('\n🚨 ROOT CAUSE: Admin login endpoint is failing');
  } else if (!sessionCookie) {
    console.log('\n🚨 ROOT CAUSE: Session cookie not being set properly');
  } else if (!sessionAfter.authenticated) {
    console.log('\n🚨 ROOT CAUSE: Session not being recognized after login');
  } else if (adminTest.statusCode !== 200) {
    console.log('\n🚨 ROOT CAUSE: Authentication middleware rejecting valid sessions');
  } else {
    console.log('\n✅ ALL SYSTEMS WORKING: Admin authentication flow is functional');
  }
}

analyzeAdminFlow().catch(console.error);
