/**
 * Test script for OpenAI image generation
 * Run with Node.js: node test-openai-image.js
 */

import fetch from 'node-fetch';

// Test endpoints
async function testCityImage() {
  try {
    console.log('Testing city image generation...');
    const response = await fetch('http://localhost:5000/api/openai-image/city', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cityName: 'London',
        style: 'photorealistic'
      })
    });

    const result = await response.json();
    console.log('City image result:', result);
    return result;
  } catch (error) {
    console.error('Error testing city image generation:', error);
  }
}

// Test custom image generation
async function testCustomImage() {
  try {
    console.log('Testing custom image generation...');
    const response = await fetch('http://localhost:5000/api/openai-image/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'A beautiful university campus with modern buildings and green spaces, perfect for student life',
        size: '1024x1024'
      })
    });

    const result = await response.json();
    console.log('Custom image result:', result);
    return result;
  } catch (error) {
    console.error('Error testing custom image generation:', error);
  }
}

// Run tests
async function runTests() {
  const cityImageResult = await testCityImage();
  console.log('------------------');
  const customImageResult = await testCustomImage();
  
  console.log('\nSummary:');
  console.log('City image URL:', cityImageResult?.imageUrl || 'Failed to generate');
  console.log('Custom image URL:', customImageResult?.imageUrl || 'Failed to generate');
}

runTests();