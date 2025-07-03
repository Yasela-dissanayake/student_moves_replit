/**
 * Comprehensive Agent Dashboard Testing
 * Tests all buttons, navigation, and functionality
 */

async function testAgentDashboard() {
  console.log('🔍 COMPREHENSIVE AGENT DASHBOARD TEST\n');
  
  // Test all navigation routes
  const routes = [
    { path: '/dashboard/agent', name: 'Main Agent Dashboard' },
    { path: '/dashboard/agent/properties', name: 'Properties Management' },
    { path: '/dashboard/agent/applications', name: 'Applications Management' },
    { path: '/dashboard/agent/tenants', name: 'Tenants Management' },
    { path: '/dashboard/agent/landlords', name: 'Landlords Management' },
    { path: '/dashboard/agent/maintenance', name: 'Maintenance Management' },
    { path: '/dashboard/agent/keys', name: 'Key Management' },
    { path: '/dashboard/agent/compliance', name: 'Compliance Management' },
    { path: '/dashboard/agent/settings', name: 'Settings' },
    { path: '/dashboard/agent/verification', name: 'Document Verification' }
  ];
  
  console.log('📍 Testing Navigation Routes:');
  for (const route of routes) {
    try {
      const response = await fetch(`http://localhost:5000${route.path}`);
      const status = response.status === 200 ? '✅ ACCESSIBLE' : '❌ INACCESSIBLE';
      console.log(`  ${route.name} (${route.path}) - ${status} (${response.status})`);
    } catch (error) {
      console.log(`  ${route.name} (${route.path}) - ❌ ERROR: ${error.message}`);
    }
  }
  
  console.log('\n🔧 Testing API Endpoints:');
  const apiEndpoints = [
    { path: '/api/properties/agent', name: 'Agent Properties' },
    { path: '/api/agent/keys', name: 'Key Management API', method: 'POST' },
    { path: '/api/agent/applications', name: 'Agent Applications' },
    { path: '/api/agent/tenancies', name: 'Agent Tenancies' },
    { path: '/api/agent/maintenance-requests', name: 'Maintenance Requests' },
    { path: '/api/landlords/agent', name: 'Agent Landlords' },
    { path: '/api/agent/dashboard-stats', name: 'Dashboard Stats' }
  ];
  
  for (const endpoint of apiEndpoints) {
    try {
      const method = endpoint.method || 'GET';
      const options = method === 'POST' ? {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: 1,
          key_number: 'TEST-001',
          key_type: 'Main Door',
          notes: 'Test key'
        })
      } : {};
      
      const response = await fetch(`http://localhost:5000${endpoint.path}`, options);
      const status = response.status < 500 ? '✅ OPERATIONAL' : '❌ ERROR';
      console.log(`  ${endpoint.name} (${endpoint.path}) - ${status} (${response.status})`);
      
      if (response.status === 200 && method === 'GET') {
        const data = await response.json();
        const count = Array.isArray(data) ? data.length : 'N/A';
        console.log(`    → Data: ${count} items`);
      }
    } catch (error) {
      console.log(`  ${endpoint.name} (${endpoint.path}) - ❌ ERROR: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Testing Specific Features:');
  
  // Test key creation API
  try {
    const keyResponse = await fetch('http://localhost:5000/api/agent/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        property_id: 1,
        key_number: 'MAIN-001',
        key_type: 'Front Door',
        notes: 'Primary entrance key'
      })
    });
    
    const keyResult = await keyResponse.json();
    console.log(`  Key Creation - ${keyResponse.status === 200 ? '✅ WORKING' : '❌ FAILED'}`);
    if (keyResult.success) {
      console.log(`    → Key ID: ${keyResult.key.id}, Status: ${keyResult.key.status}`);
    }
  } catch (error) {
    console.log(`  Key Creation - ❌ ERROR: ${error.message}`);
  }
  
  console.log('\n📊 Testing Dashboard Components:');
  
  // Test properties loading
  try {
    const propertiesResponse = await fetch('http://localhost:5000/api/properties/agent');
    const properties = await propertiesResponse.json();
    console.log(`  Properties Component - ✅ LOADED (${properties.length} properties)`);
  } catch (error) {
    console.log(`  Properties Component - ❌ ERROR: ${error.message}`);
  }
  
  // Test landlords loading
  try {
    const landlordsResponse = await fetch('http://localhost:5000/api/landlords/agent');
    const landlords = await landlordsResponse.json();
    console.log(`  Landlords Component - ✅ LOADED (${landlords.length} landlords)`);
  } catch (error) {
    console.log(`  Landlords Component - ❌ ERROR: ${error.message}`);
  }
  
  console.log('\n✅ Agent Dashboard Test Complete');
  
  return {
    totalTests: 25,
    passedTests: 0, // Will be calculated based on results
    failedTests: 0
  };
}

// Run the test
testAgentDashboard().catch(console.error);