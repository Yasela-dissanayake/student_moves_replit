#!/usr/bin/env node
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const testResults = [];

async function api(method, endpoint, body = null, cookies = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookies && { Cookie: cookies })
    }
  };
  
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  return {
    status: response.status,
    data: await response.json().catch(() => ({})),
    cookies: response.headers.get('set-cookie')
  };
}

async function testFeature(name, testFn) {
  try {
    const result = await testFn();
    testResults.push({ name, status: 'PASS', result });
    console.log(`✓ ${name}: PASS`);
  } catch (error) {
    testResults.push({ name, status: 'FAIL', error: error.message });
    console.log(`✗ ${name}: FAIL - ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🧪 Starting Comprehensive Feature Testing\n');

  // Authentication Tests
  await testFeature('User Authentication', async () => {
    const response = await api('POST', '/api/auth/login', {
      email: 'landlord@demo.com',
      password: 'demo123'
    });
    if (response.status !== 200) throw new Error('Login failed');
    return { userType: response.data.userType };
  });

  // Property Management Tests
  await testFeature('Property Listings', async () => {
    const response = await api('GET', '/api/properties');
    if (response.status !== 200) throw new Error('Failed to fetch properties');
    return { count: Array.isArray(response.data) ? response.data.length : 0 };
  });

  await testFeature('Property Search Filters', async () => {
    const response = await api('GET', '/api/properties?city=London&bedrooms=1');
    if (response.status !== 200) throw new Error('Search failed');
    return { filteredCount: Array.isArray(response.data) ? response.data.length : 0 };
  });

  // AI Features Tests
  await testFeature('AI Recommendations Engine', async () => {
    const response = await api('POST', '/api/recommendations/properties', {
      city: 'London',
      maxPrice: 2000,
      bedrooms: 1
    });
    if (response.status !== 200) throw new Error('Recommendations failed');
    return { success: response.data.success };
  });

  // Security Features Tests
  await testFeature('Security Headers', async () => {
    const response = await fetch(`${BASE_URL}/api/properties`);
    const headers = response.headers;
    if (!headers.get('x-content-type-options')) throw new Error('Missing security headers');
    return { securityHeaders: 'Present' };
  });

  // Marketplace Tests
  await testFeature('Marketplace API', async () => {
    const response = await api('GET', '/api/marketplace');
    if (response.status !== 200) throw new Error('Marketplace unavailable');
    return { accessible: true };
  });

  // Document Management Tests
  await testFeature('Document Upload', async () => {
    const response = await api('POST', '/api/document/upload');
    // Expect 400 for missing file, not 500
    if (response.status === 500) throw new Error('Server error');
    return { endpoint: 'Functional' };
  });

  // Deployment Tests
  await testFeature('Deployment Package Generation', async () => {
    const response = await api('POST', '/api/admin/generate-deployment-package');
    if (response.status !== 200) throw new Error('Deployment generation failed');
    return { packageGenerated: true };
  });

  // Database Integrity Tests
  await testFeature('Database Connectivity', async () => {
    const response = await api('GET', '/api/properties');
    if (response.status !== 200) throw new Error('Database connection failed');
    return { dbConnected: true };
  });

  // Newsletter Tests
  await testFeature('Newsletter Subscription', async () => {
    const response = await api('POST', '/api/newsletter/subscribe', {
      email: 'test@example.com'
    });
    // Accept any non-500 response as functional
    if (response.status === 500) throw new Error('Newsletter service error');
    return { functional: true };
  });

  // Voucher System Tests
  await testFeature('Voucher System', async () => {
    const response = await api('GET', '/api/vouchers');
    if (response.status === 500) throw new Error('Voucher system error');
    return { accessible: true };
  });

  console.log('\n📊 Test Summary:');
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  
  console.log(`Total Tests: ${testResults.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed/testResults.length)*100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.filter(r => r.status === 'FAIL').forEach(test => {
      console.log(`  - ${test.name}: ${test.error}`);
    });
  }

  return { passed, failed, total: testResults.length };
}

runAllTests().catch(console.error);