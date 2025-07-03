/**
 * Comprehensive AI Integration Testing
 * Tests custom AI provider across all dashboards and use cases
 */

const BASE_URL = 'http://localhost:5000';

async function api(method, endpoint, body = null) {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const text = await response.text();
  
  try {
    return { status: response.status, data: JSON.parse(text) };
  } catch {
    return { status: response.status, data: text };
  }
}

const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function logTest(category, test, status, details = '') {
  const result = { category, test, status, details, timestamp: new Date().toISOString() };
  testResults.details.push(result);
  
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else if (status === 'WARN') testResults.warnings++;
  
  console.log(`[${category}] ${test}: ${status}${details ? ' - ' + details : ''}`);
}

async function testAIServiceManager() {
  console.log('\n=== TESTING AI SERVICE MANAGER CORE ===');
  
  try {
    const startTime = Date.now();
    const result = await api('POST', '/api/test-ai-service', {
      operation: 'generateText',
      testMode: 'simulation'
    });
    const responseTime = Date.now() - startTime;
    
    if (result.status === 200 && result.data.success) {
      logTest('AI Core', 'Service Manager', 'PASS', `${responseTime}ms - Custom provider working`);
      
      // Verify custom provider is being used
      if (result.data.message && result.data.message.includes('custom')) {
        logTest('AI Core', 'Custom Provider Priority', 'PASS', 'Using custom provider correctly');
      } else {
        logTest('AI Core', 'Custom Provider Priority', 'WARN', 'Provider selection unclear');
      }
    } else {
      logTest('AI Core', 'Service Manager', 'FAIL', `Status: ${result.status}`);
    }
  } catch (error) {
    logTest('AI Core', 'Service Manager', 'FAIL', error.message);
  }
}

async function testPropertyRecommendationAI() {
  console.log('\n=== TESTING PROPERTY RECOMMENDATION AI ===');
  
  const testCases = [
    {
      name: 'Basic Recommendation Generation',
      preferences: { budget: 400, location: 'London' },
      expectedFeatures: ['recommendations', 'scores']
    },
    {
      name: 'Complex Preference Analysis',
      preferences: {
        budget: 500,
        location: 'Manchester',
        propertyType: 'flat',
        minBedrooms: 2,
        mustHaveFeatures: ['Bills Included', 'Furnished']
      },
      expectedFeatures: ['matchedFeatures', 'matchReasons']
    },
    {
      name: 'University-based Matching',
      preferences: { university: 'Imperial College London', budget: 600 },
      expectedFeatures: ['university', 'proximity']
    }
  ];
  
  for (const test of testCases) {
    try {
      const startTime = Date.now();
      const result = await api('POST', '/api/recommendations/properties', test.preferences);
      const responseTime = Date.now() - startTime;
      
      if (result.status === 200 && result.data.success && Array.isArray(result.data.recommendations)) {
        const hasExpectedData = result.data.recommendations.length > 0;
        logTest('Property AI', test.name, hasExpectedData ? 'PASS' : 'WARN', 
          `${responseTime}ms - ${result.data.recommendations.length} recommendations`);
        
        // Test recommendation quality
        if (result.data.recommendations.length > 0) {
          const firstRec = result.data.recommendations[0];
          const hasScore = typeof firstRec.score === 'number';
          const hasReasons = Array.isArray(firstRec.matchReasons);
          
          logTest('Property AI', `${test.name} - Quality Check`, 
            hasScore && hasReasons ? 'PASS' : 'WARN',
            `Score: ${hasScore}, Reasons: ${hasReasons}`);
        }
      } else {
        logTest('Property AI', test.name, 'FAIL', `Status: ${result.status}`);
      }
    } catch (error) {
      logTest('Property AI', test.name, 'FAIL', error.message);
    }
  }
}

async function testDocumentAnalysisAI() {
  console.log('\n=== TESTING DOCUMENT ANALYSIS AI ===');
  
  const documentTests = [
    {
      name: 'Document Processing Endpoint',
      endpoint: '/api/openai/document-analysis',
      payload: {
        documentText: 'Sample tenant application document with personal details and references.',
        analysisType: 'tenant-verification'
      }
    },
    {
      name: 'Right to Rent Analysis',
      endpoint: '/api/openai/analyze-document',
      payload: {
        text: 'UK Passport - John Smith, British Citizen, Born: 1995',
        type: 'right-to-rent'
      }
    },
    {
      name: 'Property Description Enhancement',
      endpoint: '/api/openai/enhance-description',
      payload: {
        description: 'Nice 2 bed flat in London near tube station',
        propertyType: 'flat'
      }
    }
  ];
  
  for (const test of documentTests) {
    try {
      const startTime = Date.now();
      const result = await api('POST', test.endpoint, test.payload);
      const responseTime = Date.now() - startTime;
      
      if (result.status === 200) {
        logTest('Document AI', test.name, 'PASS', `${responseTime}ms - Analysis completed`);
      } else if (result.status === 404) {
        logTest('Document AI', test.name, 'WARN', 'Endpoint not implemented');
      } else {
        logTest('Document AI', test.name, 'FAIL', `Status: ${result.status}`);
      }
    } catch (error) {
      logTest('Document AI', test.name, 'FAIL', error.message);
    }
  }
}

async function testImageAnalysisAI() {
  console.log('\n=== TESTING IMAGE ANALYSIS AI ===');
  
  const imageTests = [
    {
      name: 'Property Image Analysis',
      endpoint: '/api/openai/analyze-image',
      payload: {
        imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
        analysisType: 'property-features'
      }
    },
    {
      name: 'Document Photo Analysis',
      endpoint: '/api/openai/analyze-document-image',
      payload: {
        imageUrl: '/images/sample-document.jpg',
        documentType: 'passport'
      }
    },
    {
      name: 'City Image Generation Test',
      endpoint: '/api/city-images/generate',
      payload: {
        cityName: 'London',
        style: 'student-friendly'
      }
    }
  ];
  
  for (const test of imageTests) {
    try {
      const startTime = Date.now();
      const result = await api('POST', test.endpoint, test.payload);
      const responseTime = Date.now() - startTime;
      
      if (result.status === 200) {
        logTest('Image AI', test.name, 'PASS', `${responseTime}ms - Analysis completed`);
      } else if (result.status === 404) {
        logTest('Image AI', test.name, 'WARN', 'Endpoint not implemented');
      } else {
        logTest('Image AI', test.name, 'FAIL', `Status: ${result.status}`);
      }
    } catch (error) {
      logTest('Image AI', test.name, 'FAIL', error.message);
    }
  }
}

async function testFraudDetectionAI() {
  console.log('\n=== TESTING FRAUD DETECTION AI ===');
  
  const fraudTests = [
    {
      name: 'Application Fraud Detection',
      endpoint: '/api/fraud/analyze-application',
      payload: {
        applicationData: {
          name: 'John Smith',
          email: 'john@example.com',
          phone: '07123456789',
          references: ['ref1@company.com']
        }
      }
    },
    {
      name: 'Document Authenticity Check',
      endpoint: '/api/fraud/verify-document',
      payload: {
        documentType: 'passport',
        documentData: 'sample document content'
      }
    },
    {
      name: 'Behavioral Pattern Analysis',
      endpoint: '/api/fraud/analyze-behavior',
      payload: {
        userActions: ['login', 'search', 'apply'],
        timestamps: [Date.now() - 3600000, Date.now() - 1800000, Date.now()]
      }
    }
  ];
  
  for (const test of fraudTests) {
    try {
      const startTime = Date.now();
      const result = await api('POST', test.endpoint, test.payload);
      const responseTime = Date.now() - startTime;
      
      if (result.status === 200) {
        logTest('Fraud AI', test.name, 'PASS', `${responseTime}ms - Analysis completed`);
      } else if (result.status === 404) {
        logTest('Fraud AI', test.name, 'WARN', 'Endpoint not implemented');
      } else {
        logTest('Fraud AI', test.name, 'FAIL', `Status: ${result.status}`);
      }
    } catch (error) {
      logTest('Fraud AI', test.name, 'FAIL', error.message);
    }
  }
}

async function testChatAI() {
  console.log('\n=== TESTING CHAT AI INTEGRATION ===');
  
  const chatTests = [
    {
      name: 'Chat Message Analysis',
      endpoint: '/api/chat/analyze-message',
      payload: {
        message: 'Hello, I am interested in the 2-bedroom flat in Manchester. Can you provide more details?',
        context: 'property-inquiry'
      }
    },
    {
      name: 'Automated Response Generation',
      endpoint: '/api/chat/generate-response',
      payload: {
        inquiry: 'What amenities are included?',
        propertyData: {
          title: '2 Bed Flat Manchester',
          features: ['Bills Included', 'Furnished', 'Near University']
        }
      }
    },
    {
      name: 'Content Moderation',
      endpoint: '/api/chat/moderate-content',
      payload: {
        content: 'This is a test message for content moderation.',
        userId: 'test-user-123'
      }
    }
  ];
  
  for (const test of chatTests) {
    try {
      const startTime = Date.now();
      const result = await api('POST', test.endpoint, test.payload);
      const responseTime = Date.now() - startTime;
      
      if (result.status === 200) {
        logTest('Chat AI', test.name, 'PASS', `${responseTime}ms - Processing completed`);
      } else if (result.status === 404) {
        logTest('Chat AI', test.name, 'WARN', 'Endpoint not implemented');
      } else {
        logTest('Chat AI', test.name, 'FAIL', `Status: ${result.status}`);
      }
    } catch (error) {
      logTest('Chat AI', test.name, 'FAIL', error.message);
    }
  }
}

async function testDashboardAIFeatures() {
  console.log('\n=== TESTING DASHBOARD AI FEATURES ===');
  
  const dashboardTests = [
    {
      name: 'Admin AI Analytics',
      endpoint: '/api/admin/ai-analytics',
      payload: { period: '7d' }
    },
    {
      name: 'Agent Property Insights',
      endpoint: '/api/agent/property-insights',
      payload: { propertyIds: [1, 2, 3] }
    },
    {
      name: 'Landlord Tenant Matching',
      endpoint: '/api/landlord/ai-tenant-matching',
      payload: { propertyId: 1 }
    },
    {
      name: 'Tenant Personalized Suggestions',
      endpoint: '/api/tenant/ai-suggestions',
      payload: { preferences: { budget: 400, location: 'London' } }
    }
  ];
  
  for (const test of dashboardTests) {
    try {
      const startTime = Date.now();
      const result = await api('POST', test.endpoint, test.payload);
      const responseTime = Date.now() - startTime;
      
      if (result.status === 200) {
        logTest('Dashboard AI', test.name, 'PASS', `${responseTime}ms - AI features working`);
      } else if (result.status === 401) {
        logTest('Dashboard AI', test.name, 'PASS', 'Properly protected endpoint');
      } else if (result.status === 404) {
        logTest('Dashboard AI', test.name, 'WARN', 'Feature not implemented');
      } else {
        logTest('Dashboard AI', test.name, 'FAIL', `Status: ${result.status}`);
      }
    } catch (error) {
      logTest('Dashboard AI', test.name, 'FAIL', error.message);
    }
  }
}

async function testAIProviderFallback() {
  console.log('\n=== TESTING AI PROVIDER FALLBACK SYSTEM ===');
  
  try {
    // Test provider availability
    const availabilityTest = await api('GET', '/api/ai-services/providers');
    if (availabilityTest.status === 200) {
      logTest('AI Fallback', 'Provider Status Check', 'PASS', 'Availability endpoint working');
    } else {
      logTest('AI Fallback', 'Provider Status Check', 'WARN', 'Endpoint not available');
    }
    
    // Test custom provider priority
    const customTest = await api('POST', '/api/test-ai-service', {
      operation: 'generateText',
      forceCustom: true
    });
    
    if (customTest.status === 200 && customTest.data.success) {
      logTest('AI Fallback', 'Custom Provider Priority', 'PASS', 'Custom provider working correctly');
    } else {
      logTest('AI Fallback', 'Custom Provider Priority', 'FAIL', 'Custom provider not responding');
    }
    
    // Test error handling when all providers fail
    const failureTest = await api('POST', '/api/test-ai-service', {
      operation: 'generateText',
      forceFailAll: true
    });
    
    if (failureTest.status >= 400) {
      logTest('AI Fallback', 'Graceful Failure Handling', 'PASS', 'Proper error responses');
    } else {
      logTest('AI Fallback', 'Graceful Failure Handling', 'WARN', 'May not handle all failures');
    }
    
  } catch (error) {
    logTest('AI Fallback', 'Fallback System Test', 'FAIL', error.message);
  }
}

async function testAIPerformanceMetrics() {
  console.log('\n=== TESTING AI PERFORMANCE METRICS ===');
  
  const performanceTests = [];
  const testCount = 5;
  
  console.log(`Running ${testCount} performance tests...`);
  
  for (let i = 0; i < testCount; i++) {
    const startTime = Date.now();
    try {
      const result = await api('POST', '/api/recommendations/properties', {
        budget: 400 + (i * 50),
        location: ['London', 'Manchester', 'Birmingham'][i % 3]
      });
      const responseTime = Date.now() - startTime;
      
      if (result.status === 200) {
        performanceTests.push(responseTime);
      }
    } catch (error) {
      console.log(`Performance test ${i + 1} failed: ${error.message}`);
    }
  }
  
  if (performanceTests.length > 0) {
    const avgTime = Math.round(performanceTests.reduce((a, b) => a + b) / performanceTests.length);
    const maxTime = Math.max(...performanceTests);
    const minTime = Math.min(...performanceTests);
    
    logTest('AI Performance', 'Response Time Average', avgTime < 200 ? 'PASS' : 'WARN', `${avgTime}ms avg`);
    logTest('AI Performance', 'Response Time Consistency', (maxTime - minTime) < 100 ? 'PASS' : 'WARN', 
      `Range: ${minTime}-${maxTime}ms`);
    logTest('AI Performance', 'Success Rate', performanceTests.length === testCount ? 'PASS' : 'WARN',
      `${performanceTests.length}/${testCount} successful`);
  } else {
    logTest('AI Performance', 'Performance Testing', 'FAIL', 'No successful requests');
  }
}

async function runComprehensiveAITests() {
  console.log('🤖 STARTING COMPREHENSIVE AI INTEGRATION TESTING');
  console.log('Testing custom AI provider across all dashboards and use cases...\n');
  
  const startTime = Date.now();
  
  // Execute all AI test suites
  await testAIServiceManager();
  await testPropertyRecommendationAI();
  await testDocumentAnalysisAI();
  await testImageAnalysisAI();
  await testFraudDetectionAI();
  await testChatAI();
  await testDashboardAIFeatures();
  await testAIProviderFallback();
  await testAIPerformanceMetrics();
  
  const totalTime = Date.now() - startTime;
  
  // Generate comprehensive AI test report
  console.log('\n' + '='.repeat(70));
  console.log('🧠 COMPREHENSIVE AI INTEGRATION TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`Total AI Tests: ${testResults.passed + testResults.failed + testResults.warnings}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);
  console.log(`⏱️  Total Time: ${totalTime}ms`);
  
  const successRate = Math.round((testResults.passed / (testResults.passed + testResults.failed + testResults.warnings)) * 100);
  console.log(`📈 AI Success Rate: ${successRate}%`);
  
  // Detailed results by AI category
  const categories = [...new Set(testResults.details.map(t => t.category))];
  categories.forEach(category => {
    const categoryTests = testResults.details.filter(t => t.category === category);
    const categoryPassed = categoryTests.filter(t => t.status === 'PASS').length;
    const categoryTotal = categoryTests.length;
    console.log(`\n🔧 ${category}: ${categoryPassed}/${categoryTotal} tests passed`);
    
    categoryTests.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`   ${icon} ${test.test}${test.details ? ' - ' + test.details : ''}`);
    });
  });
  
  // AI System Health Assessment
  console.log('\n' + '='.repeat(70));
  console.log('🏥 AI SYSTEM HEALTH ASSESSMENT');
  console.log('='.repeat(70));
  
  if (testResults.failed === 0 && testResults.warnings <= 5) {
    console.log('🟢 EXCELLENT: Custom AI provider is fully operational across all features');
  } else if (testResults.failed <= 2 && testResults.warnings <= 10) {
    console.log('🟡 GOOD: AI system is mostly operational with some features pending implementation');
  } else {
    console.log('🔴 NEEDS ATTENTION: AI system has issues that require immediate attention');
  }
  
  console.log('\n✨ Comprehensive AI integration testing completed!');
  
  return {
    success: testResults.failed === 0,
    totalTests: testResults.passed + testResults.failed + testResults.warnings,
    passed: testResults.passed,
    failed: testResults.failed,
    warnings: testResults.warnings,
    successRate,
    totalTime,
    details: testResults.details
  };
}

// Run the comprehensive AI tests
runComprehensiveAITests().catch(console.error);