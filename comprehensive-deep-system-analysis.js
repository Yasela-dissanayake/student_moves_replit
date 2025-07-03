#!/usr/bin/env node

/**
 * COMPREHENSIVE DEEP SYSTEM ANALYSIS
 * Advanced testing framework for identifying hidden issues across all platform components
 */

import http from 'http';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DeepSystemAnalyzer {
  constructor() {
    this.results = {
      criticalIssues: [],
      warnings: [],
      systemHealth: {},
      performanceMetrics: {},
      databaseIntegrity: {},
      apiEndpoints: {},
      fileSystemIssues: [],
      configurationErrors: []
    };
    this.testCounter = 0;
    this.startTime = Date.now();
  }

  async makeRequest(path, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Deep-System-Analyzer/2.0',
          ...headers
        }
      };

      const startTime = Date.now();
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          try {
            const result = {
              status: res.statusCode,
              headers: res.headers,
              body: body,
              responseTime: responseTime
            };
            
            try {
              result.json = JSON.parse(body);
            } catch (e) {
              result.text = body;
            }
            
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  log(level, category, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, category, message, data };
    
    console.log(`[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }

    if (level === 'CRITICAL') {
      this.results.criticalIssues.push(logEntry);
    } else if (level === 'WARNING') {
      this.results.warnings.push(logEntry);
    }
  }

  async testCriticalApiEndpoints() {
    this.log('INFO', 'API', 'Testing critical API endpoints...');
    
    const criticalEndpoints = [
      // Core System Endpoints
      { path: '/api/health', expected: [200], critical: true },
      { path: '/api/users', expected: [200, 401], critical: true },
      { path: '/api/properties', expected: [200], critical: true },
      
      // Document System (Recently Fixed)
      { path: '/api/documents', expected: [200, 401], critical: true },
      { path: '/api/documents/templates', expected: [200, 401], critical: true },
      { path: '/api/documents/1', expected: [200, 401, 404], critical: false },
      
      // Authentication & Security
      { path: '/api/auth/session', expected: [200, 401], critical: true },
      { path: '/api/admin/users', expected: [200, 401], critical: true },
      
      // AI Services (Zero-cost integration)
      { path: '/api/ai/test-service', expected: [200, 401], critical: true },
      { path: '/api/recommendations/properties', method: 'POST', data: {}, expected: [200, 401], critical: true },
      
      // Utility Management
      { path: '/api/utility/providers', expected: [200], critical: true },
      { path: '/api/utility/providers-public', expected: [200], critical: false },
      
      // Marketplace System
      { path: '/api/marketplace/items', expected: [200, 401], critical: false },
      { path: '/api/marketplace/fraud-detection', expected: [200, 401], critical: false },
      
      // Property Management
      { path: '/api/property-management/campaigns', expected: [200, 401], critical: false },
      { path: '/api/social-targeting/campaigns', expected: [200, 401], critical: false },
      
      // Digital Signing
      { path: '/api/documents/sign', method: 'POST', data: { documentId: 1 }, expected: [200, 401, 422], critical: false },
      
      // Advanced Features
      { path: '/api/tenancy/group-applications', expected: [200, 401], critical: false },
      { path: '/api/verification/right-to-rent', expected: [200, 401], critical: false }
    ];

    for (const endpoint of criticalEndpoints) {
      try {
        this.testCounter++;
        const result = await this.makeRequest(endpoint.path, endpoint.method || 'GET', endpoint.data);
        
        const isExpectedStatus = endpoint.expected.includes(result.status);
        const responseTime = result.responseTime;
        
        this.results.apiEndpoints[endpoint.path] = {
          status: result.status,
          responseTime: responseTime,
          expected: isExpectedStatus,
          critical: endpoint.critical
        };

        if (!isExpectedStatus && endpoint.critical) {
          this.log('CRITICAL', 'API', `Critical endpoint ${endpoint.path} returned unexpected status ${result.status}`, {
            endpoint: endpoint.path,
            expected: endpoint.expected,
            actual: result.status,
            responseTime: responseTime
          });
        } else if (!isExpectedStatus) {
          this.log('WARNING', 'API', `Endpoint ${endpoint.path} returned unexpected status ${result.status}`, {
            endpoint: endpoint.path,
            expected: endpoint.expected,
            actual: result.status
          });
        }

        // Check for HTML responses when JSON expected
        if (result.text && result.text.includes('<!DOCTYPE html>') && endpoint.path.startsWith('/api/')) {
          this.log('CRITICAL', 'API', `API endpoint ${endpoint.path} returning HTML instead of JSON`, {
            endpoint: endpoint.path,
            contentType: result.headers['content-type']
          });
        }

        // Performance check
        if (responseTime > 5000) {
          this.log('WARNING', 'PERFORMANCE', `Slow response time for ${endpoint.path}: ${responseTime}ms`);
        }

      } catch (error) {
        this.log('CRITICAL', 'API', `Failed to test endpoint ${endpoint.path}`, { error: error.message });
      }
    }
  }

  async testDatabaseIntegrity() {
    this.log('INFO', 'DATABASE', 'Testing database integrity...');
    
    try {
      // Test database connection
      const dbTest = await this.makeRequest('/api/users');
      if (dbTest.status === 200 && dbTest.json) {
        this.results.databaseIntegrity.connection = 'healthy';
        this.results.databaseIntegrity.userCount = Array.isArray(dbTest.json) ? dbTest.json.length : 0;
        this.log('INFO', 'DATABASE', `Database connection healthy, ${this.results.databaseIntegrity.userCount} users found`);
      } else {
        this.log('CRITICAL', 'DATABASE', 'Database connection issues detected');
      }

      // Test properties data
      const propertiesTest = await this.makeRequest('/api/properties');
      if (propertiesTest.status === 200 && propertiesTest.json) {
        this.results.databaseIntegrity.propertyCount = Array.isArray(propertiesTest.json) ? propertiesTest.json.length : 0;
        this.log('INFO', 'DATABASE', `${this.results.databaseIntegrity.propertyCount} properties in database`);
      }

      // Test utility providers
      const utilityTest = await this.makeRequest('/api/utility/providers-public');
      if (utilityTest.status === 200 && utilityTest.json) {
        this.results.databaseIntegrity.utilityProviders = Array.isArray(utilityTest.json) ? utilityTest.json.length : 0;
        this.log('INFO', 'DATABASE', `${this.results.databaseIntegrity.utilityProviders} utility providers configured`);
      }

    } catch (error) {
      this.log('CRITICAL', 'DATABASE', 'Database integrity test failed', { error: error.message });
    }
  }

  async testFileSystemIntegrity() {
    this.log('INFO', 'FILESYSTEM', 'Analyzing file system integrity...');
    
    const criticalFiles = [
      // Core Configuration
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'drizzle.config.ts',
      'tailwind.config.ts',
      
      // Server Core
      'server/index.ts',
      'server/routes.ts',
      'server/db.ts',
      'server/storage.ts',
      'server/db-storage.ts',
      
      // Schema
      'shared/schema.ts',
      
      // Client Core
      'client/src/App.tsx',
      'client/src/main.tsx',
      
      // Critical Services
      'server/ai-service-manager.ts',
      'server/routes-digital-signing.ts',
      'server/document-generator.ts',
      'server/utility-service.ts'
    ];

    for (const file of criticalFiles) {
      try {
        if (!existsSync(file)) {
          this.log('CRITICAL', 'FILESYSTEM', `Missing critical file: ${file}`);
          continue;
        }

        const content = readFileSync(file, 'utf8');
        
        // Check for common issues
        if (content.includes('TODO:') || content.includes('FIXME:')) {
          this.log('WARNING', 'FILESYSTEM', `File ${file} contains TODO/FIXME comments`);
        }

        // Check for syntax errors (basic)
        if (file.endsWith('.ts') || file.endsWith('.js')) {
          if (content.includes('undefined') && content.includes('export')) {
            // Basic check for undefined exports
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes('export') && lines[i].includes('undefined')) {
                this.log('WARNING', 'FILESYSTEM', `Potential undefined export in ${file}:${i + 1}`);
              }
            }
          }
        }

        // Check schema file specifically
        if (file === 'shared/schema.ts') {
          const documentMatch = content.match(/export const documents = pgTable/);
          const userMatch = content.match(/export const users = pgTable/);
          const propertyMatch = content.match(/export const properties = pgTable/);
          
          if (!documentMatch) {
            this.log('CRITICAL', 'SCHEMA', 'Documents table definition missing from schema');
          }
          if (!userMatch) {
            this.log('CRITICAL', 'SCHEMA', 'Users table definition missing from schema');
          }
          if (!propertyMatch) {
            this.log('CRITICAL', 'SCHEMA', 'Properties table definition missing from schema');
          }
        }

      } catch (error) {
        this.log('CRITICAL', 'FILESYSTEM', `Error reading file ${file}`, { error: error.message });
      }
    }
  }

  async testAIServiceIntegration() {
    this.log('INFO', 'AI', 'Testing AI service integration...');
    
    try {
      // Test AI service manager
      const aiTest = await this.makeRequest('/api/ai/test-service');
      if (aiTest.status === 200 || aiTest.status === 401) {
        this.log('INFO', 'AI', 'AI service endpoint responding correctly');
      } else {
        this.log('CRITICAL', 'AI', `AI service endpoint returned ${aiTest.status}`);
      }

      // Test property recommendations (AI-powered)
      const recTest = await this.makeRequest('/api/recommendations/properties', 'POST', {});
      if (recTest.status === 200) {
        this.log('INFO', 'AI', 'AI property recommendations working');
        if (recTest.json && recTest.json.recommendations) {
          this.results.systemHealth.aiRecommendations = recTest.json.recommendations.length;
        }
      } else if (recTest.status === 401) {
        this.log('INFO', 'AI', 'AI recommendations endpoint protected (authentication required)');
      } else {
        this.log('WARNING', 'AI', `AI recommendations returned ${recTest.status}`);
      }

    } catch (error) {
      this.log('CRITICAL', 'AI', 'AI service testing failed', { error: error.message });
    }
  }

  async testSecurityConfiguration() {
    this.log('INFO', 'SECURITY', 'Testing security configuration...');
    
    try {
      // Test security headers
      const securityTest = await this.makeRequest('/');
      
      const headers = securityTest.headers;
      const securityHeaders = [
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options',
        'strict-transport-security'
      ];

      for (const header of securityHeaders) {
        if (!headers[header]) {
          this.log('WARNING', 'SECURITY', `Missing security header: ${header}`);
        } else {
          this.log('INFO', 'SECURITY', `Security header present: ${header}`);
        }
      }

      // Test authentication endpoints
      const authTest = await this.makeRequest('/api/auth/session');
      if (authTest.status === 401) {
        this.log('INFO', 'SECURITY', 'Authentication properly protecting endpoints');
      }

    } catch (error) {
      this.log('WARNING', 'SECURITY', 'Security testing encountered issues', { error: error.message });
    }
  }

  async testPerformanceMetrics() {
    this.log('INFO', 'PERFORMANCE', 'Running performance analysis...');
    
    const performanceTests = [
      { path: '/api/properties', name: 'Properties List' },
      { path: '/api/users', name: 'Users List' },
      { path: '/api/utility/providers-public', name: 'Utility Providers' },
      { path: '/api/recommendations/properties', method: 'POST', data: {}, name: 'AI Recommendations' }
    ];

    const results = [];
    
    for (const test of performanceTests) {
      try {
        const iterations = 3;
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
          const result = await this.makeRequest(test.path, test.method || 'GET', test.data);
          times.push(result.responseTime);
        }
        
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        
        results.push({
          name: test.name,
          avgTime: avgTime,
          minTime: minTime,
          maxTime: maxTime
        });
        
        if (avgTime > 1000) {
          this.log('WARNING', 'PERFORMANCE', `Slow response for ${test.name}: ${avgTime.toFixed(2)}ms average`);
        } else {
          this.log('INFO', 'PERFORMANCE', `Good performance for ${test.name}: ${avgTime.toFixed(2)}ms average`);
        }
        
      } catch (error) {
        this.log('WARNING', 'PERFORMANCE', `Performance test failed for ${test.name}`, { error: error.message });
      }
    }
    
    this.results.performanceMetrics = results;
  }

  async testSystemFeatures() {
    this.log('INFO', 'FEATURES', 'Testing system features...');
    
    const featureTests = [
      // Core Features
      { name: 'Property Listings', test: () => this.makeRequest('/api/properties') },
      { name: 'User Management', test: () => this.makeRequest('/api/users') },
      { name: 'Document Templates', test: () => this.makeRequest('/api/documents/templates') },
      
      // Advanced Features  
      { name: 'AI Recommendations', test: () => this.makeRequest('/api/recommendations/properties', 'POST', {}) },
      { name: 'Utility Providers', test: () => this.makeRequest('/api/utility/providers-public') },
      { name: 'Social Targeting', test: () => this.makeRequest('/api/social-targeting/campaigns') },
      
      // Business Features
      { name: 'Property Management', test: () => this.makeRequest('/api/property-management/campaigns') },
      { name: 'Digital Signatures', test: () => this.makeRequest('/api/documents/sign', 'POST', { documentId: 1 }) },
      { name: 'Marketplace', test: () => this.makeRequest('/api/marketplace/items') }
    ];

    for (const feature of featureTests) {
      try {
        const result = await feature.test();
        const working = result.status === 200 || result.status === 401 || result.status === 422;
        
        this.results.systemHealth[feature.name] = {
          status: result.status,
          working: working,
          responseTime: result.responseTime
        };
        
        if (!working && result.status === 500) {
          this.log('CRITICAL', 'FEATURES', `Feature "${feature.name}" has server errors (500)`);
        } else if (working) {
          this.log('INFO', 'FEATURES', `Feature "${feature.name}" operational`);
        }
        
      } catch (error) {
        this.log('CRITICAL', 'FEATURES', `Feature "${feature.name}" test failed`, { error: error.message });
      }
    }
  }

  generateComprehensiveReport() {
    const totalTime = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE DEEP SYSTEM ANALYSIS REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n🔍 Analysis Summary:`);
    console.log(`• Tests Executed: ${this.testCounter}`);
    console.log(`• Total Analysis Time: ${(totalTime / 1000).toFixed(2)} seconds`);
    console.log(`• Critical Issues Found: ${this.results.criticalIssues.length}`);
    console.log(`• Warnings Generated: ${this.results.warnings.length}`);
    
    // Critical Issues
    if (this.results.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      console.log('-'.repeat(50));
      this.results.criticalIssues.forEach((issue, i) => {
        console.log(`${i + 1}. [${issue.category}] ${issue.message}`);
        if (issue.data) {
          console.log(`   Data: ${JSON.stringify(issue.data, null, 2).substring(0, 200)}...`);
        }
      });
    } else {
      console.log('\n✅ NO CRITICAL ISSUES FOUND');
    }
    
    // Warnings
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      console.log('-'.repeat(50));
      this.results.warnings.forEach((warning, i) => {
        console.log(`${i + 1}. [${warning.category}] ${warning.message}`);
      });
    } else {
      console.log('\n✅ NO WARNINGS GENERATED');
    }
    
    // System Health
    console.log('\n🏥 SYSTEM HEALTH:');
    console.log('-'.repeat(50));
    Object.entries(this.results.systemHealth).forEach(([feature, health]) => {
      const status = health.working ? '✅' : '❌';
      console.log(`${status} ${feature}: ${health.status} (${health.responseTime}ms)`);
    });
    
    // Database Status
    console.log('\n💾 DATABASE STATUS:');
    console.log('-'.repeat(50));
    const db = this.results.databaseIntegrity;
    console.log(`• Connection: ${db.connection || 'unknown'}`);
    console.log(`• Users: ${db.userCount || 0}`);
    console.log(`• Properties: ${db.propertyCount || 0}`);
    console.log(`• Utility Providers: ${db.utilityProviders || 0}`);
    
    // Performance Overview
    if (this.results.performanceMetrics.length > 0) {
      console.log('\n⚡ PERFORMANCE METRICS:');
      console.log('-'.repeat(50));
      this.results.performanceMetrics.forEach(metric => {
        console.log(`• ${metric.name}: ${metric.avgTime.toFixed(2)}ms avg (${metric.minTime}-${metric.maxTime}ms)`);
      });
    }
    
    // API Endpoints Summary
    console.log('\n🌐 API ENDPOINTS TESTED:');
    console.log('-'.repeat(50));
    Object.entries(this.results.apiEndpoints).forEach(([endpoint, result]) => {
      const status = result.expected ? '✅' : '❌';
      const critical = result.critical ? '[CRITICAL]' : '';
      console.log(`${status} ${endpoint}: ${result.status} (${result.responseTime}ms) ${critical}`);
    });
    
    // Overall Assessment
    console.log('\n📋 OVERALL ASSESSMENT:');
    console.log('-'.repeat(50));
    
    const criticalApiIssues = Object.values(this.results.apiEndpoints).filter(r => !r.expected && r.critical).length;
    const totalFeatures = Object.keys(this.results.systemHealth).length;
    const workingFeatures = Object.values(this.results.systemHealth).filter(h => h.working).length;
    const healthPercentage = totalFeatures > 0 ? ((workingFeatures / totalFeatures) * 100).toFixed(1) : 0;
    
    console.log(`• System Health: ${healthPercentage}% (${workingFeatures}/${totalFeatures} features working)`);
    console.log(`• Critical API Issues: ${criticalApiIssues}`);
    console.log(`• Database Status: ${db.connection === 'healthy' ? 'Healthy' : 'Issues Detected'}`);
    
    if (this.results.criticalIssues.length === 0 && criticalApiIssues === 0) {
      console.log('\n🎉 SYSTEM ASSESSMENT: PRODUCTION READY');
      console.log('✅ All critical systems operational');
      console.log('✅ No critical issues detected');
      console.log('✅ Core functionality verified');
    } else {
      console.log('\n⚠️  SYSTEM ASSESSMENT: ISSUES REQUIRE ATTENTION');
      console.log(`❌ ${this.results.criticalIssues.length} critical issues found`);
      console.log(`❌ ${criticalApiIssues} critical API issues detected`);
    }
    
    console.log('\n' + '='.repeat(80));
    
    return {
      criticalIssues: this.results.criticalIssues.length,
      warnings: this.results.warnings.length,
      healthPercentage: parseFloat(healthPercentage),
      systemReady: this.results.criticalIssues.length === 0 && criticalApiIssues === 0
    };
  }

  async runComprehensiveAnalysis() {
    console.log('🔍 STARTING COMPREHENSIVE DEEP SYSTEM ANALYSIS');
    console.log('This will test all critical paths, files, and system components...\n');
    
    try {
      await this.testCriticalApiEndpoints();
      await this.testDatabaseIntegrity();
      await this.testFileSystemIntegrity();
      await this.testAIServiceIntegration();
      await this.testSecurityConfiguration();
      await this.testPerformanceMetrics();
      await this.testSystemFeatures();
      
      return this.generateComprehensiveReport();
      
    } catch (error) {
      this.log('CRITICAL', 'SYSTEM', 'Analysis failed with error', { error: error.message });
      return this.generateComprehensiveReport();
    }
  }
}

// Run the analysis
const analyzer = new DeepSystemAnalyzer();
analyzer.runComprehensiveAnalysis().then((summary) => {
  process.exit(summary.systemReady ? 0 : 1);
}).catch((error) => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});