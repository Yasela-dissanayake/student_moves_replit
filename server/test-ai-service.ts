/**
 * Test script for AI Service Manager
 * Verifies the implementation of OpenAI as a fallback provider
 */
import { checkAllProviders, executeAIOperation } from './ai-service-manager';
import express from 'express';

// Register the test route
export function registerTestAiServiceRoutes(app: express.Express) {
  console.log('Registering AI service test routes...');
  
  // Main test endpoint for AI service fallback testing
  app.post('/api/test-ai-service', async (req, res) => {
    try {
      console.log('Testing AI service manager...');
      
      // Get test parameters from request
      const forceFailGemini = req.body.forceFailGemini === true;
      const forceFailOpenAI = req.body.forceFailOpenAI === true;
      const forceFailAll = req.body.forceFailAll === true;
      const testMode = req.body.testMode || 'normal';
      const operation = req.body.operation || 'generateText';
      
      // First check the status of all providers
      const providerStatus = await checkAllProviders();
      console.log('Provider status:', providerStatus);
      
      // Build parameters based on test mode
      const params: any = {
        prompt: 'Test message for AI provider fallback. Please respond briefly to confirm.',
        maxTokens: 50,
        forceRefresh: true,
        testMode
      };
      
      // Configure failure simulation based on request
      if (forceFailGemini) {
        params.simulateGeminiFailure = true;
        console.log('Simulating Gemini failure to test OpenAI fallback');
      }
      
      if (forceFailOpenAI) {
        params.simulateOpenAIFailure = true;
        console.log('Simulating OpenAI failure');
      }
      
      if (forceFailAll) {
        params.simulateAllFailures = true;
        console.log('Simulating all providers failing');
      }
      
      // Add specific test mode parameters
      if (testMode === 'document') {
        params.analysisType = 'simple';
        params.prompt = 'Describe what you see in this document.';
        // We would add a sample base64 image, but for this test we'll just simulate
      } else if (testMode === 'property') {
        params.prompt = 'Generate a description for a student property.';
        params.bedrooms = 4;
        params.bathrooms = 2;
        params.propertyType = 'house';
        params.location = 'Manchester';
        params.features = ['garden', 'modern kitchen', 'high-speed internet'];
      }
      
      // Log the test parameters
      console.log('Test parameters:', { 
        testMode, 
        operation,
        forceFailGemini,
        forceFailOpenAI,
        forceFailAll
      });
      
      // Test the AI fallback mechanism with the specified operation
      const testResult = await executeAIOperation(operation as any, params);
      
      console.log('Test successful with result:', testResult);
      
      res.json({
        success: true,
        message: 'AI service test completed successfully',
        providerStatus,
        testResponse: testResult,
        testMode,
        operation,
        simulationSettings: {
          simulateGeminiFailure: forceFailGemini,
          simulateOpenAIFailure: forceFailOpenAI,
          simulateAllFailures: forceFailAll
        }
      });
    } catch (error: any) {
      console.error('Error testing AI service:', error);
      
      // Return more detailed error information
      res.status(500).json({
        success: false,
        message: 'AI service test failed',
        error: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        providerStatus: await checkAllProviders().catch(e => ({ error: e.message }))
      });
    }
  });
  
  // Additional endpoint for testing different failure scenarios
  app.post('/api/test-ai-fallback-scenarios', async (req, res) => {
    try {
      const scenario = req.body.scenario || 'gemini-to-openai';
      const operation = req.body.operation || 'generateText';
      const params: any = {
        prompt: 'Test of AI provider fallback mechanism.',
        maxTokens: 50,
        forceRefresh: true,
        testMode: 'simulation'
      };
      
      let result;
      
      switch (scenario) {
        case 'gemini-to-openai':
          console.log('Testing Gemini failure with OpenAI fallback...');
          params.simulateGeminiFailure = true;
          result = await executeAIOperation(operation as any, params);
          break;
          
        case 'openai-failure':
          console.log('Testing OpenAI failure (should use Gemini)...');
          params.simulateOpenAIFailure = true;
          result = await executeAIOperation(operation as any, {...params, preferredProvider: 'openai'});
          break;
          
        case 'all-fail':
          console.log('Testing all providers failing...');
          params.simulateAllFailures = true;
          try {
            result = await executeAIOperation(operation as any, params);
          } catch (error: any) {
            result = { error: error.message, simulatedFailure: true };
          }
          break;
          
        case 'normal':
        default:
          console.log('Testing normal operation (no simulated failures)...');
          result = await executeAIOperation(operation as any, params);
          break;
      }
      
      res.json({
        success: true,
        scenario,
        operation,
        result
      });
    } catch (error: any) {
      console.error('Error testing fallback scenario:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  
  // Add an endpoint to check all AI providers status
  app.get('/api/ai-service/providers/status', async (req, res) => {
    try {
      const providerStatus = await checkAllProviders();
      
      // Arrange providers in priority order
      const priorityOrder = [
        'custom-ai',
        'gemini',
        'openai',
        'deepseek',
        'perplexity'
      ];
      
      res.json({
        success: true,
        providerStatus,
        priorityOrder,
        message: 'AI provider status retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error checking provider status:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Unknown error'
      });
    }
  });
  
  console.log('AI service test routes registered');
}

// Test function for direct script execution
export async function testAiServiceManager() {
  try {
    console.log('Testing AI Service Manager...');
    
    // Check all AI providers
    const providerStatus = await checkAllProviders();
    console.log('Provider Status:', providerStatus);
    
    // Test text generation with fallback
    const testResult = await executeAIOperation('generateText', {
      prompt: 'Hello, this is a test of the AI service manager. Please confirm if you received this message.',
      maxTokens: 100,
      forceRefresh: true
    });
    
    console.log('Test Result:', testResult);
    
    return {
      success: true,
      providerStatus,
      testResult
    };
  } catch (error: any) {
    console.error('Test Failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Allow direct execution via node
if (process.argv[1].includes('test-ai-service.ts')) {
  console.log('Running test-ai-service.ts directly...');
  testAiServiceManager()
    .then(result => {
      console.log('Test completed with result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Test failed with error:', err);
      process.exit(1);
    });
}