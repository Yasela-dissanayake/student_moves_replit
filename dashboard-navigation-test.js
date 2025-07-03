/**
 * Dashboard Navigation Deep Testing
 * Tests all dashboard routes and components for all user types
 */

const BASE_URL = 'http://localhost:5000';

const dashboardRoutes = {
  admin: [
    '/dashboard/admin',
    '/dashboard/AdminDashboard',
    '/dashboard/admin/configuration',
    '/dashboard/admin/utilities',
    '/dashboard/admin/verification',
    '/dashboard/admin/notifications',
    '/dashboard/admin/ai-maintenance',
    '/dashboard/admin/website-builder',
    '/dashboard/admin/social-targeting',
    '/dashboard/admin/property-targeting'
  ],
  agent: [
    '/dashboard/agent',
    '/dashboard/AgentDashboard',
    '/dashboard/agent/properties',
    '/dashboard/agent/applications',
    '/dashboard/agent/verification',
    '/dashboard/agent/documents'
  ],
  landlord: [
    '/dashboard/landlord',
    '/dashboard/LandlordDashboard',
    '/dashboard/landlord/properties',
    '/dashboard/landlord/tenants',
    '/dashboard/landlord/applications',
    '/dashboard/landlord/finances'
  ],
  tenant: [
    '/dashboard/tenant',
    '/dashboard/TenantDashboard',
    '/dashboard/tenant/applications',
    '/dashboard/tenant/properties',
    '/dashboard/tenant/tenancy',
    '/dashboard/tenant/utilities'
  ]
};

async function testDashboardRoute(route) {
  try {
    const response = await fetch(`${BASE_URL}${route}`, {
      method: 'GET',
      headers: { 'Accept': 'text/html,application/xhtml+xml' }
    });
    
    return {
      route,
      status: response.status,
      success: response.status === 200,
      contentType: response.headers.get('content-type')
    };
  } catch (error) {
    return {
      route,
      status: 0,
      success: false,
      error: error.message
    };
  }
}

async function runDashboardTests() {
  console.log('🚀 STARTING DASHBOARD NAVIGATION DEEP TESTING');
  console.log('Testing all dashboard routes for all user types...\n');
  
  const results = {
    admin: { passed: 0, failed: 0, total: 0, details: [] },
    agent: { passed: 0, failed: 0, total: 0, details: [] },
    landlord: { passed: 0, failed: 0, total: 0, details: [] },
    tenant: { passed: 0, failed: 0, total: 0, details: [] }
  };
  
  for (const [userType, routes] of Object.entries(dashboardRoutes)) {
    console.log(`\n=== TESTING ${userType.toUpperCase()} DASHBOARD ROUTES ===`);
    
    for (const route of routes) {
      const result = await testDashboardRoute(route);
      results[userType].total++;
      
      if (result.success) {
        results[userType].passed++;
        console.log(`✅ ${route} - PASS (${result.status})`);
      } else {
        results[userType].failed++;
        console.log(`❌ ${route} - FAIL (${result.status}) ${result.error || ''}`);
      }
      
      results[userType].details.push(result);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 DASHBOARD NAVIGATION TEST SUMMARY');
  console.log('='.repeat(60));
  
  let totalPassed = 0, totalFailed = 0, totalTests = 0;
  
  for (const [userType, stats] of Object.entries(results)) {
    console.log(`${userType.toUpperCase()}: ${stats.passed}/${stats.total} routes working`);
    totalPassed += stats.passed;
    totalFailed += stats.failed;
    totalTests += stats.total;
  }
  
  console.log(`\nOVERALL: ${totalPassed}/${totalTests} dashboard routes functional`);
  console.log(`Success Rate: ${Math.round((totalPassed/totalTests) * 100)}%`);
  
  return results;
}

// Run the tests
runDashboardTests().catch(console.error);