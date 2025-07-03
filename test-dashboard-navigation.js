/**
 * Comprehensive Dashboard Navigation Test
 * Tests all dashboard navigation paths for all user types
 */

import http from 'http';

const baseUrl = 'http://localhost:5000';

// Define all navigation paths by user type based on DashboardLayout.tsx
const navigationPaths = {
  admin: [
    '/dashboard/admin',
    '/dashboard/admin/verification', 
    '/dashboard/admin/notifications',
    '/dashboard/admin/utilities',
    '/dashboard/admin/ai-maintenance',
    '/dashboard/admin/test-ai-service',
    '/dashboard/admin/website-builder',
    '/dashboard/admin/social-targeting',
    '/dashboard/admin/property-targeting',
    '/dashboard/admin/settings'
  ],
  agent: [
    '/dashboard/agent',
    '/dashboard/agent/properties',
    '/dashboard/agent/applications', 
    '/dashboard/agent/tenancies',
    '/dashboard/agent/tenants',
    '/dashboard/agent/landlords',
    '/dashboard/agent/maintenance',
    '/dashboard/agent/keys',
    '/dashboard/agent/compliance',
    '/dashboard/agent/targeting',
    '/dashboard/agent/settings'
  ],
  landlord: [
    '/dashboard/landlord',
    '/dashboard/landlord/properties',
    '/dashboard/landlord/tenants',
    '/dashboard/landlord/maintenance',
    '/dashboard/landlord/finances',
    '/dashboard/landlord/compliance',
    '/dashboard/landlord/documents',
    '/dashboard/landlord/settings'
  ],
  tenant: [
    '/dashboard/tenant',
    '/dashboard/tenant/applications',
    '/dashboard/tenant/tenancy',
    '/dashboard/tenant/payments',
    '/dashboard/tenant/maintenance',
    '/dashboard/tenant/documents',
    '/dashboard/tenant/groups',
    '/dashboard/tenant/settings'
  ]
};

async function testRoute(path) {
  return new Promise((resolve) => {
    const req = http.get(`${baseUrl}${path}`, (res) => {
      resolve({
        path,
        status: res.statusCode,
        success: res.statusCode === 200
      });
    });
    
    req.on('error', (error) => {
      resolve({
        path,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        path,
        status: 'TIMEOUT',
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

async function testAllNavigationPaths() {
  console.log('🔍 Testing Dashboard Navigation Paths\n');
  
  const results = {};
  let totalTests = 0;
  let passedTests = 0;
  
  for (const [userType, paths] of Object.entries(navigationPaths)) {
    console.log(`\n📋 Testing ${userType.toUpperCase()} Dashboard Navigation:`);
    console.log('=' .repeat(50));
    
    results[userType] = [];
    
    for (const path of paths) {
      const result = await testRoute(path);
      results[userType].push(result);
      totalTests++;
      
      const status = result.success ? '✅' : '❌';
      const statusCode = result.status;
      console.log(`${status} ${path} (${statusCode})`);
      
      if (result.success) {
        passedTests++;
      } else if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 NAVIGATION TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Routes Tested: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  // Show failed routes
  const failedRoutes = [];
  for (const [userType, userResults] of Object.entries(results)) {
    for (const result of userResults) {
      if (!result.success) {
        failedRoutes.push(`${userType}: ${result.path} (${result.status})`);
      }
    }
  }
  
  if (failedRoutes.length > 0) {
    console.log('\n❌ FAILED ROUTES:');
    failedRoutes.forEach(route => console.log(`   ${route}`));
  } else {
    console.log('\n🎉 ALL NAVIGATION ROUTES ARE WORKING CORRECTLY!');
  }
  
  return {
    totalTests,
    passedTests,
    failedTests: totalTests - passedTests,
    successRate: (passedTests / totalTests) * 100,
    results
  };
}

// Run the test
testAllNavigationPaths().catch(console.error);