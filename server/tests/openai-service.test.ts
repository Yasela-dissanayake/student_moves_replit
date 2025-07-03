/**
 * OpenAI Service Tests
 * Basic tests for the OpenAI service functionality
 * 
 * Note: These tests require a valid OPENAI_API_KEY environment variable
 * Run with: npm test -- --testPathPattern=openai-service
 */

import * as openaiService from '../openai-service';

// Mock environment variables setup
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'dummy-api-key-for-tests';

// Skip tests if no API key available
const testIfApiKey = process.env.OPENAI_API_KEY ? describe : describe.skip;

testIfApiKey('OpenAI Service', () => {
  let isKeyValid = false;
  
  beforeAll(async () => {
    // Setup mock timers if needed
    jest.setTimeout(30000); // Increase timeout for API calls
    isKeyValid = await openaiService.checkApiKey();
  });
  
  it('should validate API key status', async () => {
    // This test should always run
    expect(typeof isKeyValid).toBe('boolean');
  });
  
  it('should analyze sentiment correctly', async () => {
    if (!isKeyValid) return; // Skip if no valid API key
    
    const result = await openaiService.analyzeSentiment(
      "I absolutely love this property! It's perfect for my needs."
    );
    
    expect(result).toHaveProperty('rating');
    expect(result).toHaveProperty('confidence');
    expect(result.rating).toBeGreaterThanOrEqual(1);
    expect(result.rating).toBeLessThanOrEqual(5);
  });
  
  it('should generate property descriptions', async () => {
    if (!isKeyValid) return; // Skip if no valid API key
    
    const result = await openaiService.generatePropertyDescriptionWithFeatures(
      "Modern Studio Apartment",
      "Central London",
      1,
      1,
      ["High-speed internet", "Washing machine", "Central heating"]
    );
    
    expect(result).toHaveProperty('shortDescription');
    expect(result).toHaveProperty('fullDescription');
    expect(result).toHaveProperty('keyFeatures');
    expect(result).toHaveProperty('targetAudience');
    expect(result).toHaveProperty('seoTags');
  });
  
  it('should summarize text content', async () => {
    if (!isKeyValid) return; // Skip if no valid API key
    
    const sampleText = `This spacious 2-bedroom apartment is located in the heart of Manchester, 
      just a 5-minute walk from the University. It features a modern kitchen, 
      large windows providing plenty of natural light, and easy access to 
      public transportation. Perfect for students looking for a convenient and comfortable living space.`;
    
    const summary = await openaiService.summarizeArticle(sampleText);
    
    expect(typeof summary).toBe('string');
    expect(summary.length).toBeGreaterThan(0);
    expect(summary.length).toBeLessThan(sampleText.length);
  });
  
  it('should handle property description with full details', async () => {
    if (!isKeyValid) return; // Skip if no valid API key
    
    const result = await openaiService.generatePropertyDescriptionWithFeatures(
      "Luxury Student Apartment",
      "Cambridge",
      3,
      2,
      [
        "High-speed internet",
        "En-suite bathroom",
        "Fully furnished",
        "Washing machine",
        "Dishwasher",
        "Study desk",
        "On-site gym",
        "24/7 security"
      ]
    );
    
    expect(result.shortDescription.length).toBeLessThan(101); // Max 100 chars
    expect(result.fullDescription.length).toBeGreaterThan(100);
    expect(Array.isArray(result.keyFeatures)).toBe(true);
    expect(result.keyFeatures.length).toBeGreaterThanOrEqual(5);
    expect(result.keyFeatures.length).toBeLessThanOrEqual(7);
    expect(typeof result.targetAudience).toBe('string');
    expect(Array.isArray(result.seoTags)).toBe(true);
    expect(result.seoTags.length).toBeGreaterThanOrEqual(5);
    expect(result.seoTags.length).toBeLessThanOrEqual(8);
  });
});