/**
 * Button and Component Analysis Script
 * Analyzes code for button functionality issues
 */

const fs = require('fs');
const path = require('path');

function analyzeFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { error: 'File not found' };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Count different button patterns
  const htmlButtons = (content.match(/<button[^>]*>/g) || []).length;
  const buttonComponents = (content.match(/<Button[^>]*>/g) || []).length;
  const onClickHandlers = (content.match(/onClick=\{[^}]+\}/g) || []).length;
  const setActiveSection = (content.match(/setActiveSection/g) || []).length;
  
  // Check for problematic patterns
  const buttonWithoutOnClick = content.match(/<Button[^>]*>(?![^<]*onClick)/g) || [];
  const htmlButtonWithoutOnClick = content.match(/<button(?![^>]*onClick)[^>]*>/g) || [];
  
  return {
    file: path.basename(filePath),
    htmlButtons,
    buttonComponents,
    onClickHandlers,
    setActiveSection,
    issues: {
      buttonComponentsWithoutOnClick: buttonWithoutOnClick.length,
      htmlButtonsWithoutOnClick: htmlButtonWithoutOnClick.length
    }
  };
}

function findButtonIssues() {
  console.log('🔍 Analyzing Button Functionality Across Platform...\n');
  
  const filesToCheck = [
    './client/src/pages/dashboard/AdminDashboard.tsx',
    './client/src/pages/admin/AdminDashboard.tsx',
    './client/src/pages/admin/AdminAIMaintenance.tsx',
    './client/src/pages/admin/AdminWebsiteBuilder.tsx',
    './client/src/pages/dashboard/admin/EnhancedWebsiteBuilder.tsx',
    './client/src/components/dashboard/DashboardLayout.tsx'
  ];
  
  const results = [];
  let totalIssues = 0;
  
  filesToCheck.forEach(file => {
    const analysis = analyzeFile(file);
    if (!analysis.error) {
      results.push(analysis);
      totalIssues += analysis.issues.buttonComponentsWithoutOnClick + analysis.issues.htmlButtonsWithoutOnClick;
      
      console.log(`📄 ${analysis.file}:`);
      console.log(`   HTML Buttons: ${analysis.htmlButtons}`);
      console.log(`   Button Components: ${analysis.buttonComponents}`);
      console.log(`   onClick Handlers: ${analysis.onClickHandlers}`);
      console.log(`   State Updates: ${analysis.setActiveSection}`);
      
      if (analysis.issues.buttonComponentsWithoutOnClick > 0) {
        console.log(`   ❌ Button components without onClick: ${analysis.issues.buttonComponentsWithoutOnClick}`);
      }
      if (analysis.issues.htmlButtonsWithoutOnClick > 0) {
        console.log(`   ❌ HTML buttons without onClick: ${analysis.issues.htmlButtonsWithoutOnClick}`);
      }
      if (analysis.issues.buttonComponentsWithoutOnClick === 0 && analysis.issues.htmlButtonsWithoutOnClick === 0) {
        console.log(`   ✅ All buttons have handlers`);
      }
      console.log('');
    } else {
      console.log(`❌ ${file}: ${analysis.error}\n`);
    }
  });
  
  console.log('📊 ANALYSIS SUMMARY:');
  console.log('====================');
  console.log(`Total files analyzed: ${results.length}`);
  console.log(`Total button issues found: ${totalIssues}`);
  
  if (totalIssues === 0) {
    console.log('✅ No button functionality issues detected');
  } else {
    console.log(`⚠️ ${totalIssues} buttons may need onClick handlers`);
  }
  
  // Check for common routing issues
  console.log('\n🧭 Checking Navigation Issues:');
  console.log('==============================');
  
  const appTsxPath = './client/src/App.tsx';
  if (fs.existsSync(appTsxPath)) {
    const appContent = fs.readFileSync(appTsxPath, 'utf8');
    
    // Check for duplicate routes
    const routeMatches = appContent.match(/<Route path="[^"]*"/g) || [];
    const routes = routeMatches.map(match => match.match(/path="([^"]*)"/)[1]);
    const duplicates = routes.filter((route, index) => routes.indexOf(route) !== index);
    
    if (duplicates.length > 0) {
      console.log(`❌ Duplicate routes found: ${duplicates.join(', ')}`);
    } else {
      console.log('✅ No duplicate routes found');
    }
    
    // Check for import consistency
    const adminDashImport = appContent.match(/import AdminDashboard from "([^"]*)"/) || [];
    if (adminDashImport[1]) {
      console.log(`✅ AdminDashboard imported from: ${adminDashImport[1]}`);
    }
  }
  
  return { results, totalIssues };
}

// Check specific known problem areas
function checkKnownIssues() {
  console.log('\n🎯 Checking Known Problem Areas:');
  console.log('=================================');
  
  const adminDashPath = './client/src/pages/dashboard/AdminDashboard.tsx';
  if (fs.existsSync(adminDashPath)) {
    const content = fs.readFileSync(adminDashPath, 'utf8');
    
    // Check AI Website Builder buttons
    const websiteBuilderSection = content.includes('AI Website Builder');
    const basicToolButton = content.includes('Basic Tool');
    const enhancedButton = content.includes('Enhanced (UniRent WebCraft)');
    const launchCampaignFunction = content.includes('launchCampaign');
    
    console.log(`AI Website Builder section: ${websiteBuilderSection ? '✅' : '❌'}`);
    console.log(`Basic Tool button: ${basicToolButton ? '✅' : '❌'}`);
    console.log(`Enhanced button: ${enhancedButton ? '✅' : '❌'}`);
    console.log(`Launch Campaign function: ${launchCampaignFunction ? '✅' : '❌'}`);
    
    // Check Social Targeting functionality
    const socialTargetingSection = content.includes('socialTargeting');
    const setActiveSection = content.includes('setActiveSection("socialTargeting")');
    
    console.log(`Social Targeting section: ${socialTargetingSection ? '✅' : '❌'}`);
    console.log(`Social Targeting navigation: ${setActiveSection ? '✅' : '❌'}`);
    
  } else {
    console.log('❌ AdminDashboard.tsx not found in expected location');
  }
}

// Main execution
const analysis = findButtonIssues();
checkKnownIssues();

console.log('\n🔧 RECOMMENDATIONS:');
console.log('===================');

if (analysis.totalIssues > 0) {
  console.log('1. Add onClick handlers to buttons without functionality');
  console.log('2. Replace non-functional Button components with native HTML buttons');
  console.log('3. Ensure all navigation buttons use setActiveSection or proper routing');
} else {
  console.log('✅ Button functionality appears to be working correctly');
  console.log('If users report button issues, check:');
  console.log('  - JavaScript errors in browser console');
  console.log('  - Network connectivity');
  console.log('  - Authentication state');
}

module.exports = { analyzeFile, findButtonIssues };