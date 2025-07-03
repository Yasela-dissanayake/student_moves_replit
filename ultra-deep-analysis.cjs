/**
 * Ultra-deep session store analysis and session validation
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
        'User-Agent': 'ultra-deep-analysis',
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

async function ultraDeepAnalysis() {
  console.log('🎯 ULTRA-DEEP SESSION STORE ANALYSIS');
  console.log('====================================');
  
  // Step 1: Test the session store is working at all
  console.log('\n1. Testing basic session functionality...');
  
  // Test demo login (which should use the same session middleware)
  const demoLoginResult = await api('POST', '/api/auth/demo-login', { role: 'admin' });
  console.log('Demo login result:', {
    statusCode: demoLoginResult.statusCode,
    success: demoLoginResult.success
  });
  
  // Extract session cookie from demo login
  let demoSessionCookie = '';
  if (demoLoginResult.headers && demoLoginResult.headers['set-cookie']) {
    const setCookieHeader = demoLoginResult.headers['set-cookie'];
    if (Array.isArray(setCookieHeader)) {
      const sidCookie = setCookieHeader.find(cookie => cookie.startsWith('sid='));
      if (sidCookie) {
        demoSessionCookie = sidCookie.split(';')[0];
        console.log('Demo session cookie extracted successfully');
      }
    }
  }
  
  // Test session with demo cookie
  const demoSessionTest = await api('GET', '/api/session-test', null, {
    'Cookie': demoSessionCookie
  });
  console.log('Demo session test:', {
    authenticated: demoSessionTest.authenticated,
    userId: demoSessionTest.userId
  });
  
  // Step 2: Test admin login with detailed tracking
  console.log('\n2. Testing admin login with detailed tracking...');
  
  const adminLoginResult = await api('POST', '/api/auth/admin-login', {});
  console.log('Admin login detailed result:', {
    statusCode: adminLoginResult.statusCode,
    success: adminLoginResult.success,
    message: adminLoginResult.message
  });
  
  // Extract admin session cookie
  let adminSessionCookie = '';
  if (adminLoginResult.headers && adminLoginResult.headers['set-cookie']) {
    const setCookieHeader = adminLoginResult.headers['set-cookie'];
    if (Array.isArray(setCookieHeader)) {
      const sidCookie = setCookieHeader.find(cookie => cookie.startsWith('sid='));
      if (sidCookie) {
        adminSessionCookie = sidCookie.split(';')[0];
        console.log('Admin session cookie extracted successfully');
      }
    }
  }
  
  // Step 3: Compare session behaviors
  console.log('\n3. Comparing session behaviors...');
  
  const adminSessionTest = await api('GET', '/api/session-test', null, {
    'Cookie': adminSessionCookie
  });
  console.log('Admin session test:', {
    authenticated: adminSessionTest.authenticated,
    userId: adminSessionTest.userId
  });
  
  // Step 4: Test immediate endpoint access after login
  console.log('\n4. Testing immediate endpoint access...');
  
  // Test with demo session (should work)
  const demoAdminTest = await api('GET', '/api/admin/users', null, {
    'Cookie': demoSessionCookie
  });
  console.log('Demo session admin access:', {
    statusCode: demoAdminTest.statusCode,
    message: demoAdminTest.message || 'Success'
  });
  
  // Test with admin session (currently failing)
  const adminAdminTest = await api('GET', '/api/admin/users', null, {
    'Cookie': adminSessionCookie
  });
  console.log('Admin session admin access:', {
    statusCode: adminAdminTest.statusCode,
    message: adminAdminTest.message || 'Success'
  });
  
  console.log('\n📊 ULTRA-DEEP ANALYSIS RESULTS');
  console.log('===============================');
  console.log(`Demo login creates working session: ${demoSessionTest.authenticated ? 'YES' : 'NO'}`);
  console.log(`Admin login creates working session: ${adminSessionTest.authenticated ? 'YES' : 'NO'}`);
  console.log(`Demo session allows admin access: ${demoAdminTest.statusCode === 200 ? 'YES' : 'NO'}`);
  console.log(`Admin session allows admin access: ${adminAdminTest.statusCode === 200 ? 'YES' : 'NO'}`);
  
  if (demoSessionTest.authenticated && !adminSessionTest.authenticated) {
    console.log('\n🎯 DIAGNOSIS: Admin login endpoint session saving issue');
    console.log('   - Demo login works (session middleware is functional)');
    console.log('   - Admin login fails (specific endpoint problem)');
    console.log('   - Solution: Fix session save in admin login endpoint');
  } else if (!demoSessionTest.authenticated && !adminSessionTest.authenticated) {
    console.log('\n🎯 DIAGNOSIS: Session middleware completely broken');
    console.log('   - Both demo and admin login fail');
    console.log('   - Solution: Fix session middleware configuration');
  } else if (demoSessionTest.authenticated && adminSessionTest.authenticated && adminAdminTest.statusCode !== 200) {
    console.log('\n🎯 DIAGNOSIS: Authentication middleware issue');
    console.log('   - Both sessions work');
    console.log('   - Admin endpoint auth check failing');
    console.log('   - Solution: Fix admin endpoint authentication logic');
  } else {
    console.log('\n✅ All systems working properly');
  }
}

ultraDeepAnalysis().catch(console.error);
