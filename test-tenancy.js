/**
 * Test script for tenancy creation
 * Run with Node.js: node test-tenancy.js
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';

// Configuration
const API_BASE = 'http://localhost:5000';
const COOKIES_FILE = './cookies.txt';

// Initialize empty cookies file if it doesn't exist
try {
  await fs.access(COOKIES_FILE);
} catch (error) {
  // File doesn't exist, create it
  await fs.writeFile(COOKIES_FILE, '');
  console.log('Created empty cookies file');
}

// Test users
const TEST_TENANT = {
  email: 'test-tenant@example.com',
  password: 'test-password123',
  name: 'Test Tenant',
  phone: '07123456789',
  userType: 'tenant'
};

const TEST_LANDLORD = {
  email: 'test-landlord@example.com',
  password: 'test-password123',
  name: 'Test Landlord',
  phone: '07987654321',
  userType: 'landlord'
};

// Helper function for API calls
async function api(method, endpoint, body = null, cookies = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (cookies) {
    headers['Cookie'] = cookies;
  }
  
  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  };
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    
    // Extract cookies from response for session management
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      await fs.writeFile(COOKIES_FILE, setCookieHeader);
      console.log('Cookies saved');
    }
    
    if (response.status >= 400) {
      const error = await response.json();
      throw new Error(`API Error ${response.status}: ${JSON.stringify(error)}`);
    }
    
    // Return both response object and parsed body
    return {
      response,
      body: response.headers.get('content-type')?.includes('application/json') 
        ? await response.json()
        : await response.text()
    };
  } catch (error) {
    console.error(`API Error: ${error.message}`);
    throw error;
  }
}

// Login and get session cookies
async function login(user) {
  const { response, body } = await api('POST', '/api/auth/login', {
    email: user.email,
    password: user.password
  });
  
  console.log(`Logged in as ${user.email}`);
  // Read cookies from file
  return await fs.readFile(COOKIES_FILE, 'utf8');
}

// Create test users if they don't exist
async function createTestUsers() {
  try {
    console.log('Creating test users...');
    
    // Try to create tenant
    try {
      await api('POST', '/api/auth/register', {
        ...TEST_TENANT,
        passwordConfirm: TEST_TENANT.password
      });
      console.log(`Created test tenant: ${TEST_TENANT.email}`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`Test tenant already exists: ${TEST_TENANT.email}`);
      } else {
        throw error;
      }
    }
    
    // Try to create landlord
    try {
      await api('POST', '/api/auth/register', {
        ...TEST_LANDLORD,
        passwordConfirm: TEST_LANDLORD.password
      });
      console.log(`Created test landlord: ${TEST_LANDLORD.email}`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`Test landlord already exists: ${TEST_LANDLORD.email}`);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error(`Failed to create test users: ${error.message}`);
    throw error;
  }
}

// Create a test property if needed
async function createTestProperty() {
  try {
    console.log('Creating test property...');
    
    // Login as landlord first
    const landlordCookies = await login(TEST_LANDLORD);
    
    // Get landlord properties to check if they already have one
    const { body: properties } = await api('GET', '/api/properties', null, landlordCookies);
    
    if (properties && properties.length > 0) {
      // Set the first property to be available
      const property = properties[0];
      console.log(`Using existing property: ${property.id} - ${property.title}`);
      
      // Update property to make sure it's available
      if (!property.available) {
        await api('PUT', `/api/properties/${property.id}`, {
          ...property,
          available: true,
          availableDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        }, landlordCookies);
        console.log(`Updated property ${property.id} to be available`);
      }
      
      return property;
    } else {
      // Create a new property
      const testProperty = {
        title: 'Test Student Property',
        description: 'A test property for tenancy',
        address: '123 Test Street',
        city: 'London',
        postcode: 'E1 6LT',
        price: '1200',
        pricePerPerson: '400',
        propertyType: 'flat',
        bedrooms: 3,
        bathrooms: 1,
        available: true,
        availableDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        furnished: true,
        features: ['wifi', 'washing_machine', 'dishwasher'],
        university: 'University of London',
        distanceToUniversity: '0.5 miles'
      };
      
      const { body: newProperty } = await api('POST', '/api/properties', testProperty, landlordCookies);
      console.log(`Created new test property: ${newProperty.id} - ${newProperty.title}`);
      return newProperty;
    }
  } catch (error) {
    console.error(`Failed to create test property: ${error.message}`);
    throw error;
  }
}

// Create a test application if needed
async function createTestApplication(propertyId) {
  try {
    console.log('Creating test application...');
    
    // Login as tenant first
    const tenantCookies = await login(TEST_TENANT);
    
    // Get tenant user details
    const { body: tenantUser } = await api('GET', '/api/users/me', null, tenantCookies);
    console.log(`Tenant ID: ${tenantUser.id}`);
    
    // Check if a test application already exists
    const { body: applications } = await api('GET', '/api/tenant/applications', null, tenantCookies);
    
    // Filter for application to this specific property
    const existingApplication = applications.find(app => app.propertyId === propertyId);
    
    if (existingApplication) {
      console.log(`Using existing application: ${existingApplication.id}`);
      return existingApplication;
    }
    
    // Create a new application
    const applicationData = {
      propertyId: propertyId,
      tenantId: tenantUser.id,
      message: 'Test application for tenancy creation',
      moveInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };
    
    const { body: newApplication } = await api('POST', '/api/applications', applicationData, tenantCookies);
    console.log(`Created application ID: ${newApplication.id}`);
    
    // Login as landlord to approve the application
    const landlordCookies = await login(TEST_LANDLORD);
    
    // Approve the application
    await api('PUT', `/api/applications/${newApplication.id}/status`, 
      { status: 'approved' }, 
      landlordCookies
    );
    
    console.log(`Approved application ID: ${newApplication.id}`);
    
    return newApplication;
  } catch (error) {
    console.error(`Failed to create test application: ${error.message}`);
    throw error;
  }
}

// Main test function
async function testTenancyCreation() {
  console.log('Starting tenancy creation test...');
  
  try {
    // Setup test data
    await createTestUsers();
    const testProperty = await createTestProperty();
    const testApplication = await createTestApplication(testProperty.id);
    
    // Login as a landlord to create the tenancy
    const landlordCookies = await login(TEST_LANDLORD);
    
    // Tenancy data
    const tenancyData = {
      propertyId: testProperty.id,
      tenantId: testApplication.tenantId,
      applicationId: testApplication.id,
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      endDate: new Date(Date.now() + 395 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 395 days (approx 13 months) from now
      rentAmount: testProperty.price,
      depositAmount: (Number(testProperty.price) * 1.5).toString(), // 1.5 months rent
      paymentFrequency: 'monthly',
      status: 'pending_signature'
    };
    
    // Create tenancy
    const { body: tenancy } = await api('POST', '/api/tenancies', tenancyData, landlordCookies);
    console.log('✅ SUCCESS: Created new tenancy:', tenancy);
    
    // Test getting the tenancy details
    const { body: tenancyDetails } = await api('GET', `/api/tenancies/${tenancy.id}`, null, landlordCookies);
    console.log('Retrieved tenancy details:', tenancyDetails);
    
    // Check if property availability updated
    const { body: updatedProperty } = await api('GET', `/api/properties/${testProperty.id}`, null, landlordCookies);
    if (!updatedProperty.available) {
      console.log('✅ SUCCESS: Property marked as unavailable after tenancy creation');
    } else {
      console.log('❌ WARNING: Property still marked as available after tenancy creation');
    }
    
    // Test landlord listing tenancies
    const { body: landlordTenancies } = await api('GET', '/api/landlord/tenancies', null, landlordCookies);
    console.log(`Landlord has ${landlordTenancies.length} tenancies`);
    
    // Test tenant listing tenancies
    const tenantCookies = await login(TEST_TENANT);
    const { body: tenantTenancies } = await api('GET', '/api/tenant/tenancies', null, tenantCookies);
    console.log(`Tenant has ${tenantTenancies.length} tenancies`);
    
    // Test tenant signing the tenancy agreement
    const signData = { signed: true };
    await api('PUT', `/api/tenancies/${tenancy.id}/tenant-signature`, signData, tenantCookies);
    console.log('✅ SUCCESS: Tenant signed the tenancy agreement');
    
    // Test landlord signing the tenancy agreement
    await api('PUT', `/api/tenancies/${tenancy.id}/landlord-signature`, signData, landlordCookies);
    console.log('✅ SUCCESS: Landlord signed the tenancy agreement');
    
    // Check the final tenancy status
    const { body: finalTenancy } = await api('GET', `/api/tenancies/${tenancy.id}`, null, landlordCookies);
    console.log(`Final tenancy status: ${finalTenancy.status}`);
    
    if (finalTenancy.status === 'active') {
      console.log('✅ SUCCESS: Tenancy is now active');
    } else {
      console.log(`❌ WARNING: Tenancy is not active, current status: ${finalTenancy.status}`);
    }
    
  } catch (error) {
    console.error('Test failed with error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
  
  console.log('Test completed');
}

// Run the test
testTenancyCreation();