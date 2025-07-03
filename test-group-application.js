/**
 * Test script for group applications
 * Run with Node.js: node test-group-application.js
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';

// Configuration
const API_BASE = 'http://localhost:5000'; // Remove the /api since we add it to each endpoint
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
        description: 'A test property for application notifications',
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

// Main test function
async function runTest() {
  console.log('Starting group application test...');
  
  try {
    // Setup test data
    await createTestUsers();
    const testProperty = await createTestProperty();
    console.log(`Using property ID ${testProperty.id} for group application test`);
    
    // Step 1: Login as a tenant
    console.log('Logging in as tenant...');
    const tenantCookies = await login(TEST_TENANT);
    
    // Get tenant user details
    const { body: tenantUser } = await api('GET', '/api/users/me', null, tenantCookies);
    console.log(`Tenant ID: ${tenantUser.id}`);
    
    // Step 2: Create a group application
    console.log(`Creating group application for property ID ${testProperty.id}...`);
    const groupApplicationData = {
      message: 'Test group application',
      moveInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      groupMembers: [
        { 
          name: 'Test Member 1', 
          email: 'testmember1@example.com',
          phone: '07123456111'
        },
        { 
          name: 'Test Member 2', 
          email: 'testmember2@example.com',
          phone: '07123456222'
        }
      ]
    };
    
    // Add a slight delay to ensure the session is properly saved
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { body: groupApplication } = await api(
      'POST', 
      `/api/properties/${testProperty.id}/apply-group`, 
      groupApplicationData,
      tenantCookies
    );
    
    console.log(`Created group application with group ID: ${groupApplication.groupId}`);
    
    // Step 3: Fetch group applications to verify
    console.log('Fetching group applications...');
    const { body: applications } = await api(
      'GET',
      '/api/tenant/group-applications',
      null,
      tenantCookies
    );
    
    console.log('Group applications fetched successfully:', JSON.stringify(applications, null, 2));
    
    // Check if the newly created application is in the results
    const application = applications.find(app => 
      app.application.propertyId === testProperty.id && 
      app.role === 'lead'
    );
    
    if (application) {
      console.log('✅ SUCCESS: Found created group application in results');
      console.log('Group application details:', application);
      
      // Verify group members were created
      if (application.members && application.members.length === 2) {
        console.log('✅ SUCCESS: Group members were correctly created');
        application.members.forEach(member => {
          console.log('Group member:', member);
        });
      } else {
        console.error('❌ ERROR: Group members not correctly created');
      }
    } else {
      console.error('❌ ERROR: Created group application not found in results');
    }
    
    // Check landlord notifications
    console.log('\nChecking for landlord notifications...');
    const landlordCookies = await login(TEST_LANDLORD);
    
    const { body: landlordNotifications } = await api('GET', '/api/notifications/unread', null, landlordCookies);
    console.log(`Landlord has ${landlordNotifications.length} unread notifications`);
    
    const applicationNotification = landlordNotifications.find(n => 
      n.type === 'application' && n.data && n.data.propertyId === testProperty.id
    );
    
    if (applicationNotification) {
      console.log('✅ SUCCESS: Landlord received application notification');
      console.log('Notification details:', applicationNotification);
    } else {
      console.log('❌ WARNING: No application notification found for landlord');
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
runTest();