/**
 * Test script to check Admin Dashboard accessibility
 * Run with: node test-admin-dashboard.js
 */

async function testAdminDashboard() {
  const baseUrl = 'http://localhost:5000';
  
  try {
    console.log('Testing Admin Dashboard access...');
    
    // Test 1: Check if server is running
    const response = await fetch(`${baseUrl}/dashboard/admin`);
    console.log(`Server response status: ${response.status}`);
    
    if (response.ok) {
      const html = await response.text();
      console.log('HTML response length:', html.length);
      
      // Check for specific elements
      if (html.includes('Admin Dashboard')) {
        console.log('✅ Admin Dashboard title found');
      } else {
        console.log('❌ Admin Dashboard title not found');
      }
      
      if (html.includes('AI Website Builder')) {
        console.log('✅ AI Website Builder section found');
      } else {
        console.log('❌ AI Website Builder section not found');
      }
      
      // Check for JavaScript errors in HTML
      if (html.includes('error') || html.includes('Error')) {
        console.log('⚠️ Potential errors found in HTML');
      }
      
    } else {
      console.log(`❌ Server returned error: ${response.status} ${response.statusText}`);
    }
    
    // Test 2: Check if API endpoints are working
    const apiResponse = await fetch(`${baseUrl}/api/auth/me`);
    console.log(`Auth endpoint status: ${apiResponse.status}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAdminDashboard();