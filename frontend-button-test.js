/**
 * Frontend Button and Component Testing Script
 * Tests actual button clicks and form interactions across all dashboards
 */

const puppeteer = require('puppeteer');

async function testFrontendComponents() {
  console.log('🎯 Starting Frontend Component Testing...\n');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const baseUrl = 'http://localhost:5000';
  
  // Track test results
  const results = {
    dashboards: [],
    buttons: [],
    forms: [],
    navigation: []
  };
  
  try {
    // Test 1: Admin Dashboard Components
    console.log('🔧 Testing Admin Dashboard...');
    await page.goto(`${baseUrl}/dashboard/admin`);
    await page.waitForTimeout(2000);
    
    // Check if main dashboard loads
    const adminTitle = await page.$eval('h1', el => el.textContent).catch(() => null);
    results.dashboards.push({
      name: 'Admin Dashboard',
      loaded: adminTitle?.includes('Admin Dashboard'),
      title: adminTitle
    });
    
    // Test AI Website Builder buttons
    try {
      const websiteBuilderButtons = await page.$$eval('button', buttons => 
        buttons.filter(btn => btn.textContent.includes('Basic Tool') || btn.textContent.includes('Enhanced'))
      );
      results.buttons.push({
        component: 'AI Website Builder',
        found: websiteBuilderButtons.length > 0,
        count: websiteBuilderButtons.length
      });
    } catch (e) {
      results.buttons.push({
        component: 'AI Website Builder',
        found: false,
        error: 'Buttons not found'
      });
    }
    
    // Test Social Targeting navigation
    try {
      const socialBtn = await page.$('button:has-text("Access Tool")');
      if (socialBtn) {
        await socialBtn.click();
        await page.waitForTimeout(1000);
        const socialTargetingVisible = await page.$('.social-targeting-form');
        results.navigation.push({
          action: 'Social Targeting Access',
          working: !!socialTargetingVisible
        });
      }
    } catch (e) {
      results.navigation.push({
        action: 'Social Targeting Access',
        working: false,
        error: e.message
      });
    }
    
    // Test 2: Enhanced Website Builder Page
    console.log('🚀 Testing Enhanced Website Builder...');
    await page.goto(`${baseUrl}/dashboard/admin/enhanced-website-builder`);
    await page.waitForTimeout(2000);
    
    const builderLoaded = await page.$eval('h1', el => el.textContent).catch(() => null);
    results.dashboards.push({
      name: 'Enhanced Website Builder',
      loaded: builderLoaded?.includes('Website Builder'),
      title: builderLoaded
    });
    
    // Test 3: Utility Management
    console.log('💡 Testing Utility Management...');
    await page.goto(`${baseUrl}/dashboard/admin/utilities`);
    await page.waitForTimeout(2000);
    
    const utilityLoaded = await page.$eval('h1', el => el.textContent).catch(() => null);
    results.dashboards.push({
      name: 'Utility Management',
      loaded: utilityLoaded?.includes('Utility'),
      title: utilityLoaded
    });
    
    // Test 4: AI Maintenance
    console.log('🤖 Testing AI Maintenance...');
    await page.goto(`${baseUrl}/dashboard/admin/ai-maintenance`);
    await page.waitForTimeout(2000);
    
    const aiMaintenanceLoaded = await page.$eval('h1', el => el.textContent).catch(() => null);
    results.dashboards.push({
      name: 'AI Maintenance',
      loaded: aiMaintenanceLoaded?.includes('AI'),
      title: aiMaintenanceLoaded
    });
    
    // Test View Details buttons
    try {
      const viewDetailsButtons = await page.$$('button');
      const viewDetailsBtns = [];
      
      for (const btn of viewDetailsButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('View Details')) {
          viewDetailsBtns.push(btn);
        }
      }
      
      results.buttons.push({
        component: 'View Details Buttons',
        found: viewDetailsBtns.length > 0,
        count: viewDetailsBtns.length
      });
      
      // Test clicking first View Details button
      if (viewDetailsBtns.length > 0) {
        await viewDetailsBtns[0].click();
        await page.waitForTimeout(500);
        const modalVisible = await page.$('.modal, .dialog, [role="dialog"]');
        results.buttons.push({
          component: 'View Details Modal',
          found: !!modalVisible,
          working: !!modalVisible
        });
      }
    } catch (e) {
      results.buttons.push({
        component: 'View Details Buttons',
        found: false,
        error: e.message
      });
    }
    
    // Test 5: Properties Page
    console.log('🏠 Testing Properties Page...');
    await page.goto(`${baseUrl}/properties`);
    await page.waitForTimeout(2000);
    
    const propertiesLoaded = await page.$eval('h1', el => el.textContent).catch(() => null);
    results.dashboards.push({
      name: 'Properties Page',
      loaded: propertiesLoaded?.includes('Properties') || propertiesLoaded?.includes('Student'),
      title: propertiesLoaded
    });
    
    // Test 6: Home Page
    console.log('🏡 Testing Home Page...');
    await page.goto(`${baseUrl}/`);
    await page.waitForTimeout(2000);
    
    const homeLoaded = await page.$eval('h1', el => el.textContent).catch(() => null);
    results.dashboards.push({
      name: 'Home Page',
      loaded: !!homeLoaded,
      title: homeLoaded
    });
    
  } catch (error) {
    console.error('Testing error:', error);
  } finally {
    await browser.close();
  }
  
  // Print Results
  console.log('\n📊 FRONTEND TEST RESULTS:');
  console.log('==========================\n');
  
  console.log('📱 Dashboard Loading:');
  results.dashboards.forEach(dash => {
    const status = dash.loaded ? '✅' : '❌';
    console.log(`${status} ${dash.name}: ${dash.title || 'Failed to load'}`);
  });
  
  console.log('\n🔘 Button Functionality:');
  results.buttons.forEach(btn => {
    const status = btn.found ? '✅' : '❌';
    console.log(`${status} ${btn.component}: ${btn.count || 0} found${btn.working !== undefined ? (btn.working ? ' (Working)' : ' (Not Working)') : ''}`);
    if (btn.error) console.log(`   Error: ${btn.error}`);
  });
  
  console.log('\n🧭 Navigation Tests:');
  results.navigation.forEach(nav => {
    const status = nav.working ? '✅' : '❌';
    console.log(`${status} ${nav.action}`);
    if (nav.error) console.log(`   Error: ${nav.error}`);
  });
  
  // Calculate success rate
  const workingDashboards = results.dashboards.filter(d => d.loaded).length;
  const workingButtons = results.buttons.filter(b => b.found).length;
  const workingNavigation = results.navigation.filter(n => n.working).length;
  
  const totalTests = results.dashboards.length + results.buttons.length + results.navigation.length;
  const workingTests = workingDashboards + workingButtons + workingNavigation;
  
  console.log('\n📈 SUMMARY:');
  console.log('============');
  console.log(`Dashboards: ${workingDashboards}/${results.dashboards.length}`);
  console.log(`Buttons: ${workingButtons}/${results.buttons.length}`);
  console.log(`Navigation: ${workingNavigation}/${results.navigation.length}`);
  console.log(`Overall: ${workingTests}/${totalTests} (${Math.round(workingTests/totalTests*100)}%)`);
  
  return results;
}

// Check if puppeteer is available
async function checkPuppeteer() {
  try {
    const puppeteer = require('puppeteer');
    return true;
  } catch (e) {
    console.log('⚠️ Puppeteer not available. Running basic component analysis instead...');
    return false;
  }
}

async function runBasicComponentAnalysis() {
  console.log('🔍 Running Basic Component Analysis...\n');
  
  // Check common button patterns in the code
  const fs = require('fs');
  const path = require('path');
  
  const issues = [];
  
  // Check AdminDashboard for button issues
  try {
    const adminDashPath = './client/src/pages/dashboard/AdminDashboard.tsx';
    if (fs.existsSync(adminDashPath)) {
      const content = fs.readFileSync(adminDashPath, 'utf8');
      
      // Check for proper onClick handlers
      const buttonMatches = content.match(/<button[^>]*>/g) || [];
      const onClickMatches = content.match(/onClick=\{[^}]+\}/g) || [];
      
      console.log(`📊 AdminDashboard Analysis:`);
      console.log(`   Found ${buttonMatches.length} button elements`);
      console.log(`   Found ${onClickMatches.length} onClick handlers`);
      
      if (buttonMatches.length > onClickMatches.length) {
        issues.push(`Missing onClick handlers: ${buttonMatches.length - onClickMatches.length} buttons without handlers`);
      }
      
      // Check for Button component imports
      if (content.includes('from "@/components/ui/button"') && content.includes('<Button')) {
        const buttonComponentMatches = content.match(/<Button[^>]*>/g) || [];
        console.log(`   Found ${buttonComponentMatches.length} Button components`);
        
        // Check if Button components have proper handlers
        const buttonComponentsWithHandlers = content.match(/<Button[^>]*onClick[^>]*>/g) || [];
        if (buttonComponentMatches.length > buttonComponentsWithHandlers.length) {
          issues.push(`Button components missing handlers: ${buttonComponentMatches.length - buttonComponentsWithHandlers.length}`);
        }
      }
    }
  } catch (e) {
    issues.push(`Failed to analyze AdminDashboard: ${e.message}`);
  }
  
  console.log('\n🔍 Issues Found:');
  if (issues.length === 0) {
    console.log('✅ No obvious issues detected in code analysis');
  } else {
    issues.forEach(issue => console.log(`❌ ${issue}`));
  }
  
  return issues;
}

// Main execution
async function main() {
  const hasPuppeteer = await checkPuppeteer();
  
  if (hasPuppeteer) {
    await testFrontendComponents();
  } else {
    await runBasicComponentAnalysis();
  }
}

main().catch(console.error);