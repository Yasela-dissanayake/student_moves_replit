/**
 * Test script for deposit protection functionality
 * Run with Node.js: node test-deposit-protection.js
 */

import axios from 'axios';
import fs from 'fs';

// Base URL for the API
const baseUrl = 'https://workspace.replit.dev';

// Store cookies between requests
let cookieJar = '';

/**
 * Helper function for making API requests
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @param {object} body - Request body
 * @param {string} cookies - Cookies to send with request
 * @returns {Promise<object>} - Response data
 */
async function api(method, endpoint, body = null, cookies = null) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (cookies) {
      headers.Cookie = cookies;
    }

    const response = await axios({
      method,
      url: `${baseUrl}${endpoint}`,
      data: body,
      headers,
      withCredentials: true,
    });

    // Save cookies for subsequent requests
    if (response.headers['set-cookie']) {
      cookieJar = response.headers['set-cookie'][0];
    }

    return response.data;
  } catch (error) {
    console.error(`API Error (${method} ${endpoint}):`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Login with user credentials
 * @param {object} user - User credentials
 * @returns {Promise<object>} - Response data
 */
async function login(user) {
  console.log(`Logging in as ${user.email}...`);
  const result = await api('POST', '/api/auth/login', user);
  return result;
}

/**
 * Test deposit protection credentials
 */
async function testDepositCredentials() {
  try {
    console.log('\n=== Testing Deposit Protection Credentials ===');
    
    // Log in as agent
    await login({
      email: 'agent@unirent.com',
      password: 'agent123'
    });
    
    // Fetch credential list
    console.log('Fetching deposit scheme credentials...');
    const credentials = await api('GET', '/api/deposit-protection/credentials', null, cookieJar);
    console.log(`Found ${credentials?.length || 0} credentials`);
    
    // Create a test credential if none exist
    if (!credentials || credentials.length === 0) {
      console.log('Creating a test deposit scheme credential...');
      const newCredential = {
        schemeName: 'dps',
        schemeUsername: 'test_user',
        schemePassword: 'test_password',
        accountNumber: 'ACC12345',
        apiKey: 'key123',
        apiSecret: 'secret123',
        protectionType: 'custodial',
        isDefault: true
      };
      
      const createResult = await api('POST', '/api/deposit-protection/credentials', newCredential, cookieJar);
      console.log('Credential created:', createResult);
    } else {
      console.log('Credentials found:', credentials.map(c => ({ 
        id: c.id, 
        schemeName: c.schemeName,
        username: c.schemeUsername,
        isDefault: c.isDefault
      })));
    }
    
    // Fetch updated credential list
    const updatedCredentials = await api('GET', '/api/deposit-protection/credentials', null, cookieJar);
    
    // If we have credentials, test verify functionality
    if (updatedCredentials && updatedCredentials.length > 0) {
      const credentialId = updatedCredentials[0].id;
      console.log(`Testing verification for credential ID ${credentialId}...`);
      try {
        const verifyResult = await api('POST', `/api/deposit-protection/credentials/${credentialId}/verify`, null, cookieJar);
        console.log('Verification result:', verifyResult);
      } catch (verifyError) {
        console.log('Verification failed (expected in test environment):', verifyError.response?.data);
      }
    }
    
    console.log('Deposit credentials test completed');
  } catch (error) {
    console.error('Error in testDepositCredentials:', error);
  }
}

/**
 * Test deposit registrations
 */
async function testDepositRegistrations() {
  try {
    console.log('\n=== Testing Deposit Protection Registrations ===');
    
    // Fetch registrations
    console.log('Fetching deposit registrations...');
    const registrations = await api('GET', '/api/deposit-protection/registrations', null, cookieJar);
    console.log(`Found ${registrations?.length || 0} registrations`);
    
    if (registrations && registrations.length > 0) {
      console.log('Registrations found:', registrations.map(r => ({
        id: r.id,
        tenancyId: r.tenancyId,
        schemeName: r.schemeName,
        status: r.status
      })));
      
      // Test prescribed info generation for first registration
      if (registrations[0].status === 'registered') {
        const regId = registrations[0].id;
        console.log(`Testing prescribed info generation for registration ID ${regId}...`);
        try {
          const infoResult = await api('POST', `/api/deposit-protection/registrations/${regId}/prescribed-info`, null, cookieJar);
          console.log('Prescribed info generation result:', infoResult);
        } catch (infoError) {
          console.log('Prescribed info generation failed:', infoError.response?.data);
        }
      }
    } else {
      // Find a tenancy to test deposit registration with
      console.log('Looking for active tenancies to test deposit registration...');
      try {
        const tenancies = await api('GET', '/api/tenancies/agent', null, cookieJar);
        
        if (tenancies && tenancies.length > 0) {
          const tenancyId = tenancies[0].id;
          console.log(`Testing deposit registration for tenancy ID ${tenancyId}...`);
          
          // Fetch credentials to use
          const credentials = await api('GET', '/api/deposit-protection/credentials', null, cookieJar);
          
          if (credentials && credentials.length > 0) {
            const credentialId = credentials[0].id;
            
            try {
              const regData = {
                scheme: credentials[0].schemeName,
                credentialId: credentialId
              };
              
              const registerResult = await api('POST', `/api/deposit-protection/register/${tenancyId}`, regData, cookieJar);
              console.log('Registration result:', registerResult);
            } catch (regError) {
              console.log('Registration failed (expected in test environment):', regError.response?.data);
            }
          } else {
            console.log('No credentials available for testing registration');
          }
        } else {
          console.log('No active tenancies found for testing');
        }
      } catch (tenancyError) {
        console.log('Failed to fetch tenancies:', tenancyError.response?.data);
      }
    }
    
    console.log('Deposit registrations test completed');
  } catch (error) {
    console.error('Error in testDepositRegistrations:', error);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    await testDepositCredentials();
    await testDepositRegistrations();
    console.log('\nAll deposit protection tests completed');
  } catch (error) {
    console.error('Test execution failed:', error);
  }
}

// Execute tests
runTests();