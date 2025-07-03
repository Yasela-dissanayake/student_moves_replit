/**
 * Test script for agent-related API endpoints
 * Tests both legacy and new standardized endpoints with proper userId type handling
 * Run with: node test-agent-endpoints.js
 */

import fetch from 'node-fetch';
const baseUrl = 'http://localhost:3000';
let cookies = null;

async function api(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookies ? { Cookie: cookies } : {})
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${endpoint}`, options);
  
  // Save cookies for session management
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    cookies = setCookie;
  }
  
  if (response.status === 204) {
    return null;
  }
  
  return await response.json();
}

async function login() {
  console.log('Logging in as agent...');
  const loginResponse = await api('POST', '/api/auth/login', {
    email: 'agent@unirent.com',
    password: 'agent123'
  });
  
  if (!loginResponse.success) {
    throw new Error(`Login failed: ${JSON.stringify(loginResponse)}`);
  }
  
  console.log('Login successful!');
  return loginResponse.user;
}

async function testEndpoints() {
  try {
    const agent = await login();
    console.log(`Logged in as agent ID: ${agent.id}`);
    
    // Test properties endpoints
    console.log('\nTesting properties endpoints:');
    
    console.log('1. Testing new standardized endpoint: /api/properties/agent');
    const propertiesNewEndpoint = await api('GET', '/api/properties/agent');
    console.log(`Found ${propertiesNewEndpoint.length} properties using new endpoint`);
    
    console.log('2. Testing legacy endpoint: /api/agent/properties');
    const propertiesLegacyEndpoint = await api('GET', '/api/agent/properties');
    console.log(`Found ${propertiesLegacyEndpoint.length} properties using legacy endpoint`);
    
    // Test applications endpoints
    console.log('\nTesting applications endpoints:');
    
    console.log('1. Testing new standardized endpoint: /api/applications/agent');
    const applicationsNewEndpoint = await api('GET', '/api/applications/agent');
    console.log(`Found ${applicationsNewEndpoint.length} applications using new endpoint`);
    
    console.log('2. Testing legacy endpoint: /api/agent/applications');
    const applicationsLegacyEndpoint = await api('GET', '/api/agent/applications');
    console.log(`Found ${applicationsLegacyEndpoint.length} applications using legacy endpoint`);
    
    // Test tenancies endpoints
    console.log('\nTesting tenancies endpoints:');
    
    console.log('1. Testing new standardized endpoint: /api/tenancies/agent');
    const tenanciesNewEndpoint = await api('GET', '/api/tenancies/agent');
    console.log(`Found ${tenanciesNewEndpoint.length} tenancies using new endpoint`);
    
    console.log('2. Testing legacy endpoint: /api/agent/tenancies');
    const tenanciesLegacyEndpoint = await api('GET', '/api/agent/tenancies');
    console.log(`Found ${tenanciesLegacyEndpoint.length} tenancies using legacy endpoint`);
    
    // Test maintenance requests endpoints
    console.log('\nTesting maintenance requests endpoints:');
    
    console.log('1. Testing new standardized endpoint: /api/maintenance-requests/agent');
    const maintenanceNewEndpoint = await api('GET', '/api/maintenance-requests/agent');
    console.log(`Found ${maintenanceNewEndpoint.length} maintenance requests using new endpoint`);
    
    console.log('2. Testing legacy endpoint: /api/agent/maintenance-requests');
    const maintenanceLegacyEndpoint = await api('GET', '/api/agent/maintenance-requests');
    console.log(`Found ${maintenanceLegacyEndpoint.length} maintenance requests using legacy endpoint`);
    
    console.log('\nEndpoint tests completed successfully!');
    
    // Data validation check - endpoints should return the same data regardless of which URL pattern used
    const propertyMatch = JSON.stringify(propertiesNewEndpoint) === JSON.stringify(propertiesLegacyEndpoint);
    const applicationMatch = JSON.stringify(applicationsNewEndpoint) === JSON.stringify(applicationsLegacyEndpoint);
    const tenancyMatch = JSON.stringify(tenanciesNewEndpoint) === JSON.stringify(tenanciesLegacyEndpoint);
    const maintenanceMatch = JSON.stringify(maintenanceNewEndpoint) === JSON.stringify(maintenanceLegacyEndpoint);
    
    console.log('\nData consistency check:');
    console.log(`Properties data consistency: ${propertyMatch ? 'PASSED ✓' : 'FAILED ✗'}`);
    console.log(`Applications data consistency: ${applicationMatch ? 'PASSED ✓' : 'FAILED ✗'}`);
    console.log(`Tenancies data consistency: ${tenancyMatch ? 'PASSED ✓' : 'FAILED ✗'}`);
    console.log(`Maintenance requests data consistency: ${maintenanceMatch ? 'PASSED ✓' : 'FAILED ✗'}`);
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testEndpoints();