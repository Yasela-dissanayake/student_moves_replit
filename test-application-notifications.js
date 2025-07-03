/**
 * Test script for application notifications
 * Run with Node.js: node test-application-notifications.js
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

// Guest user data
const GUEST_USER = {
  name: 'Guest User',
  email: 'guest@example.com',
  phone: '07123456999'
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

// Test authenticated application
async function testAuthenticatedApplication() {
  console.log('\n=== Testing Authenticated Application ===');
  
  try {
    // Login as a tenant
    const tenantCookies = await login(TEST_TENANT);
    
    // Get tenant user details
    const { body: tenantUser } = await api('GET', '/api/users/me', null, tenantCookies);
    console.log(`Tenant ID: ${tenantUser.id}`);
    
    // Create test property
    const testProperty = await createTestProperty();
    
    // Create application
    const applicationData = {
      propertyId: testProperty.id,
      tenantId: tenantUser.id,
      message: 'I am interested in renting this property',
      moveInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };
    
    const { body: application } = await api('POST', '/api/applications', applicationData, tenantCookies);
    console.log(`Created application ID: ${application.id}`);
    
    // Check tenant can see own application
    const { body: tenantApplications } = await api('GET', '/api/tenant/applications', null, tenantCookies);
    
    const foundApplication = tenantApplications.find(app => app.id === application.id);
    if (foundApplication) {
      console.log('✅ SUCCESS: Tenant can view their application');
    } else {
      console.log('❌ ERROR: Tenant cannot view their application');
    }
    
    // Check landlord notifications
    const landlordCookies = await login(TEST_LANDLORD);
    
    // Get notifications for landlord
    const { body: landlordNotifications } = await api('GET', '/api/notifications/unread', null, landlordCookies);
    
    const applicationNotification = landlordNotifications.find(n => 
      n.type === 'application' && n.data?.applicationId === application.id
    );
    
    if (applicationNotification) {
      console.log('✅ SUCCESS: Landlord received notification about the application');
      console.log(`Notification: ${applicationNotification.message}`);
    } else {
      console.log('❌ ERROR: Landlord did not receive notification about the application');
    }
    
    // Landlord responds to application
    await api('PUT', `/api/applications/${application.id}/status`, 
      { status: 'approved' }, 
      landlordCookies
    );
    console.log('Landlord approved the application');
    
    // Check tenant notifications
    const { body: tenantNotifications } = await api('GET', '/api/notifications/unread', null, tenantCookies);
    
    const responseNotification = tenantNotifications.find(n => 
      n.type === 'application_status' && n.data?.applicationId === application.id
    );
    
    if (responseNotification) {
      console.log('✅ SUCCESS: Tenant received notification about the application status change');
      console.log(`Notification: ${responseNotification.message}`);
    } else {
      console.log('❌ ERROR: Tenant did not receive notification about the application status change');
    }
    
    return true;
  } catch (error) {
    console.error('Test failed with error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    return false;
  }
}

// Test guest application
async function testGuestApplication() {
  console.log('\n=== Testing Guest Application ===');
  
  try {
    // Create test property
    const testProperty = await createTestProperty();
    
    // Create guest application
    const guestApplicationData = {
      propertyId: testProperty.id,
      message: 'I am a guest interested in renting this property',
      moveInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      guestInfo: {
        name: GUEST_USER.name,
        email: GUEST_USER.email,
        phone: GUEST_USER.phone
      }
    };
    
    const { body: guestApplication } = await api('POST', '/api/applications/guest', guestApplicationData);
    console.log(`Created guest application ID: ${guestApplication.id}`);
    
    // Check landlord notifications for guest application
    const landlordCookies = await login(TEST_LANDLORD);
    
    // Get notifications for landlord
    const { body: landlordNotifications } = await api('GET', '/api/notifications/unread', null, landlordCookies);
    
    const guestApplicationNotification = landlordNotifications.find(n => 
      n.type === 'application' && 
      n.data?.applicationId === guestApplication.id &&
      n.message.includes('guest')
    );
    
    if (guestApplicationNotification) {
      console.log('✅ SUCCESS: Landlord received notification about the guest application');
      console.log(`Notification: ${guestApplicationNotification.message}`);
    } else {
      console.log('❌ ERROR: Landlord did not receive notification about the guest application');
    }
    
    // Check landlord can view guest applications
    const { body: landlordApplications } = await api('GET', '/api/landlord/applications', null, landlordCookies);
    
    const foundGuestApplication = landlordApplications.find(app => app.id === guestApplication.id);
    if (foundGuestApplication) {
      console.log('✅ SUCCESS: Landlord can view the guest application');
      if (foundGuestApplication.guestInfo && foundGuestApplication.guestInfo.email === GUEST_USER.email) {
        console.log('✅ SUCCESS: Guest information is correctly stored with the application');
      } else {
        console.log('❌ ERROR: Guest information is missing or incorrect');
      }
    } else {
      console.log('❌ ERROR: Landlord cannot view the guest application');
    }
    
    // Landlord responds to guest application
    await api('PUT', `/api/applications/${guestApplication.id}/status`, 
      { status: 'approved' }, 
      landlordCookies
    );
    console.log('Landlord approved the guest application');
    
    return true;
  } catch (error) {
    console.error('Test failed with error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    return false;
  }
}

// Test group application
async function testGroupApplication() {
  console.log('\n=== Testing Group Application ===');
  
  try {
    // Login as a tenant
    const tenantCookies = await login(TEST_TENANT);
    
    // Get tenant user details
    const { body: tenantUser } = await api('GET', '/api/users/me', null, tenantCookies);
    console.log(`Tenant ID: ${tenantUser.id}`);
    
    // Create test property
    const testProperty = await createTestProperty();
    
    // Create group application
    const groupApplicationData = {
      propertyId: testProperty.id,
      message: 'We are interested in renting this property as a group',
      moveInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      groupMembers: [
        { 
          name: 'Group Member 1', 
          email: 'groupmember1@example.com',
          phone: '07123456111'
        },
        { 
          name: 'Group Member 2', 
          email: 'groupmember2@example.com',
          phone: '07123456222'
        }
      ]
    };
    
    const { body: groupApplication } = await api(
      'POST', 
      `/api/properties/${testProperty.id}/apply-group`, 
      groupApplicationData,
      tenantCookies
    );
    
    console.log(`Created group application with group ID: ${groupApplication.groupId}`);
    
    // Check landlord notifications for group application
    const landlordCookies = await login(TEST_LANDLORD);
    
    // Get notifications for landlord
    const { body: landlordNotifications } = await api('GET', '/api/notifications/unread', null, landlordCookies);
    
    const groupApplicationNotification = landlordNotifications.find(n => 
      n.type === 'group_application' && 
      n.data?.propertyId === testProperty.id
    );
    
    if (groupApplicationNotification) {
      console.log('✅ SUCCESS: Landlord received notification about the group application');
      console.log(`Notification: ${groupApplicationNotification.message}`);
    } else {
      console.log('❌ ERROR: Landlord did not receive notification about the group application');
    }
    
    // Check tenant can see group application
    const { body: groupApplications } = await api('GET', '/api/tenant/group-applications', null, tenantCookies);
    
    if (groupApplications.length > 0) {
      console.log('✅ SUCCESS: Tenant can view their group applications');
      console.log(`Found ${groupApplications.length} group applications`);
      
      const application = groupApplications.find(app => 
        app.application.propertyId === testProperty.id && 
        app.role === 'lead'
      );
      
      if (application && application.members && application.members.length === 2) {
        console.log('✅ SUCCESS: Group members were correctly created');
      } else {
        console.log('❌ ERROR: Group members not correctly created');
      }
    } else {
      console.log('❌ ERROR: Tenant cannot view their group applications');
    }
    
    return true;
  } catch (error) {
    console.error('Test failed with error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('Starting application notification tests...');
  
  try {
    // Setup test data
    await createTestUsers();
    
    // Run test scenarios
    const authenticatedResult = await testAuthenticatedApplication();
    const guestResult = await testGuestApplication();
    const groupResult = await testGroupApplication();
    
    // Print summary
    console.log('\n=== Test Summary ===');
    console.log(`Authenticated Application Test: ${authenticatedResult ? 'PASSED' : 'FAILED'}`);
    console.log(`Guest Application Test: ${guestResult ? 'PASSED' : 'FAILED'}`);
    console.log(`Group Application Test: ${groupResult ? 'PASSED' : 'FAILED'}`);
    
    if (authenticatedResult && guestResult && groupResult) {
      console.log('\n✅ ALL TESTS PASSED');
    } else {
      console.log('\n❌ SOME TESTS FAILED');
    }
  } catch (error) {
    console.error('Tests failed with error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
  
  console.log('Tests completed');
}

// Run the tests
runTests();