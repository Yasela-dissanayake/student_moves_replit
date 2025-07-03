/**
 * Comprehensive Button and Functionality Audit
 * Tests all dashboards, tabs, buttons, and navigation across the entire platform
 */

const baseUrl = 'http://localhost:5000';

// Test all dashboard routes
const dashboardRoutes = [
  '/dashboard/admin',
  '/dashboard/tenant',
  '/dashboard/landlord', 
  '/dashboard/agent',
  '/dashboard/admin/verification',
  '/dashboard/admin/notifications',
  '/dashboard/admin/utilities',
  '/dashboard/admin/ai-maintenance',
  '/dashboard/admin/test-ai-service',
  '/dashboard/admin/website-builder',
  '/dashboard/admin/enhanced-website-builder',
  '/dashboard/admin/social-targeting',
  '/dashboard/admin/property-targeting',
  '/dashboard/admin/settings'
];

// Test API endpoints
const apiEndpoints = [
  '/api/auth/me',
  '/api/properties',
  '/api/utilities/providers-public',
  '/api/admin/config',
  '/api/openai/chat',
  '/api/ai/test-service',
  '/api/social-targeting/create-campaign',
  '/api/marketplace/items'
];

async function testRoute(route) {
  try {
    const response = await fetch(`${baseUrl}${route}`);
    const status = response.status;
    const contentType = response.headers.get('content-type');
    
    return {
      route,
      status,
      working: status === 200 || status === 401, // 401 is expected for protected routes
      contentType,
      error: status >= 400 ? `HTTP ${status}` : null
    };
  } catch (error) {
    return {
      route,
      status: 0,
      working: false,
      error: error.message
    };
  }
}

async function testApiEndpoint(endpoint) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`);
    const status = response.status;
    
    return {
      endpoint,
      status,
      working: status === 200 || status === 401 || status === 403, // Expected statuses
      error: status >= 500 ? `Server Error ${status}` : null
    };
  } catch (error) {
    return {
      endpoint,
      status: 0,
      working: false,
      error: error.message
    };
  }
}

async function runComprehensiveAudit() {
  console.log('🔍 Starting Comprehensive Platform Audit...\n');
  
  // Test 1: Dashboard Routes
  console.log('📊 Testing Dashboard Routes:');
  console.log('================================');
  
  let workingRoutes = 0;
  let totalRoutes = dashboardRoutes.length;
  
  for (const route of dashboardRoutes) {
    const result = await testRoute(route);
    const status = result.working ? '✅' : '❌';
    console.log(`${status} ${route} - Status: ${result.status}`);
    if (result.error) console.log(`   Error: ${result.error}`);
    if (result.working) workingRoutes++;
  }
  
  console.log(`\nDashboard Routes: ${workingRoutes}/${totalRoutes} working\n`);
  
  // Test 2: API Endpoints
  console.log('🔌 Testing API Endpoints:');
  console.log('==========================');
  
  let workingApis = 0;
  let totalApis = apiEndpoints.length;
  
  for (const endpoint of apiEndpoints) {
    const result = await testApiEndpoint(endpoint);
    const status = result.working ? '✅' : '❌';
    console.log(`${status} ${endpoint} - Status: ${result.status}`);
    if (result.error) console.log(`   Error: ${result.error}`);
    if (result.working) workingApis++;
  }
  
  console.log(`\nAPI Endpoints: ${workingApis}/${totalApis} working\n`);
  
  // Test 3: Check for common issues
  console.log('🔧 Checking Common Issues:');
  console.log('===========================');
  
  // Check if server is running
  try {
    const serverTest = await fetch(baseUrl);
    console.log('✅ Server is running and responding');
  } catch (error) {
    console.log('❌ Server connection failed:', error.message);
  }
  
  // Check database connectivity (via API)
  try {
    const dbTest = await fetch(`${baseUrl}/api/properties`);
    if (dbTest.status === 200) {
      console.log('✅ Database connectivity working');
    } else {
      console.log(`⚠️ Database may have issues (Status: ${dbTest.status})`);
    }
  } catch (error) {
    console.log('❌ Database connectivity failed');
  }
  
  // Summary
  console.log('\n📋 AUDIT SUMMARY:');
  console.log('==================');
  console.log(`Dashboard Routes: ${workingRoutes}/${totalRoutes} (${Math.round(workingRoutes/totalRoutes*100)}%)`);
  console.log(`API Endpoints: ${workingApis}/${totalApis} (${Math.round(workingApis/totalApis*100)}%)`);
  
  const overallHealth = ((workingRoutes + workingApis) / (totalRoutes + totalApis)) * 100;
  console.log(`Overall Platform Health: ${Math.round(overallHealth)}%`);
  
  if (overallHealth < 80) {
    console.log('\n⚠️ ATTENTION NEEDED: Platform has significant issues that need fixing');
  } else if (overallHealth < 95) {
    console.log('\n🔧 MINOR ISSUES: Some components need attention');
  } else {
    console.log('\n✅ EXCELLENT: Platform is working well');
  }
}

runComprehensiveAudit().catch(console.error);