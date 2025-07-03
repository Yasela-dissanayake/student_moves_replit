import { Express, Request, Response } from 'express';
import { storage } from "./storage";
import { executeAIOperation } from './ai-service-manager';
import { getTenantPropertyRecommendations, matchTenantToProperty } from './ai-targeting-service';
import { authenticateUser } from './routes';

/**
 * Register AI tenant routes 
 * These routes handle the AI-specific features for tenants
 */
export function registerAiTenantRoutes(app: Express) {

  /**
   * Roommate Matching API
   * Matches tenants based on compatibility of personalities, interests, and preferences
   */
  app.post('/api/tenant/roommate-match', authenticateUser, async (req, res) => {
    try {
      const { 
        personalityTraits,
        lifestyle,
        interests,
        studyHabits,
        livingPreferences
      } = req.body;
      
      // Validate inputs
      if (!personalityTraits || !lifestyle || !interests || !studyHabits || !livingPreferences) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }
      
      // Create tenant profile
      const tenantProfile = {
        personalityTraits,
        lifestyle,
        interests,
        studyHabits,
        livingPreferences,
        tenantId: req.user?.id
      };
      
      // Get all other users (potential roommates)
      const allTenants = await storage.getAllUsers();
      const otherTenants = allTenants.filter(user => user.id !== req.user?.id && user.userType === 'tenant');
      
      // Get potential matches using AI
      const result = await executeAIOperation('generateText', {
        promptTemplate: `
          You are a roommate matching expert. Analyze the compatibility between a tenant and potential roommates.
          
          Tenant profile:
          - Personality traits: ${personalityTraits.join(', ')}
          - Lifestyle: ${lifestyle}
          - Interests: ${interests}
          - Study habits: ${studyHabits}
          - Living preferences: ${livingPreferences}
          
          Potential roommates:
          ${otherTenants.map(tenant => `
            Tenant ID: ${tenant.id}
            Name: ${tenant.name}
            Email: ${tenant.email}
          `).join('\n')}
          
          Find the 3-5 most compatible roommates. For each match, provide:
          1. Tenant ID
          2. Name
          3. Compatibility score (0-100)
          4. 2-3 reasons for compatibility
          5. 3-5 shared interests (be creative based on the tenant's profile)
          6. 1-2 potential challenges they might face living together
          
          Format the response as valid JSON in this format:
          {
            "matches": [
              {
                "tenantId": number,
                "name": string,
                "compatibilityScore": number,
                "compatibilityReasons": string[],
                "sharedInterests": string[],
                "potentialChallenges": string[]
              }
            ]
          }
        `
      });
      
      // Save tenant preferences if they don't exist yet
      const existingPreferences = await storage.getTenantPreferencesByTenantId(req.user?.id);
      
      if (existingPreferences) {
        await storage.updateTenantPreferences(existingPreferences.id, {
          roommatePreferences: {
            personalityTraits,
            lifestyle,
            interests,
            studyHabits,
            livingPreferences
          }
        });
      } else {
        await storage.createTenantPreferences({
          tenantId: req.user?.id,
          roommatePreferences: {
            personalityTraits,
            lifestyle,
            interests,
            studyHabits,
            livingPreferences
          }
        });
      }
      
      return res.json({
        success: true,
        matches: JSON.parse(result).matches
      });
    } catch (error) {
      console.error('Roommate matching error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to find roommate matches'
      });
    }
  });
  
  /**
   * Budget Calculator API
   * Analyzes tenant budget and recommends affordable accommodation options
   */
  app.post('/api/tenant/budget-calculator', authenticateUser, async (req, res) => {
    try {
      const { 
        monthlyIncome,
        city,
        universityName,
        existingExpenses,
        lifestyle,
        courseType,
        savingsGoal
      } = req.body;
      
      // Validate inputs
      if (!monthlyIncome || !city) {
        return res.status(400).json({
          success: false,
          message: 'Monthly income and city are required'
        });
      }
      
      // Save tenant preferences if they don't exist yet
      const existingPreferences = await storage.getTenantPreferencesByTenantId(req.user?.id);
      
      if (existingPreferences) {
        await storage.updateTenantPreferences(existingPreferences.id, {
          budgetPreferences: {
            monthlyIncome,
            city,
            universityName,
            lifestyle,
            courseType,
            savingsGoal
          }
        });
      } else {
        await storage.createTenantPreferences({
          tenantId: req.user?.id,
          budgetPreferences: {
            monthlyIncome,
            city,
            universityName,
            lifestyle,
            courseType,
            savingsGoal
          }
        });
      }
      
      // City-specific cost of living data (for more accurate analysis)
      const cityData = {
        'Manchester': { averageRent: 550, utilities: 180, transport: 60, groceries: 200, entertainment: 150 },
        'Leeds': { averageRent: 500, utilities: 170, transport: 55, groceries: 190, entertainment: 140 },
        'Birmingham': { averageRent: 530, utilities: 175, transport: 60, groceries: 195, entertainment: 145 },
        'Liverpool': { averageRent: 490, utilities: 165, transport: 50, groceries: 185, entertainment: 135 },
        'London': { averageRent: 850, utilities: 210, transport: 150, groceries: 250, entertainment: 200 }
      };
      
      // Calculate total existing expenses
      const totalExistingExpenses = Object.values(existingExpenses || {}).reduce((total, amount) => total + amount, 0);
      
      // Get budget analysis using AI
      const result = await executeAIOperation('generateText', {
        promptTemplate: `
          You are a student financial advisor specializing in UK student accommodation budgeting.
          Analyze this student's financial situation and provide budget recommendations.
          
          Student details:
          - Monthly income: £${monthlyIncome}
          - City: ${city}
          - University: ${universityName || 'Not specified'}
          - Lifestyle preference: ${lifestyle}
          - Course type: ${courseType}
          - Monthly savings goal: £${savingsGoal || 0}
          - Existing monthly expenses: £${totalExistingExpenses || 0}
          
          City cost of living data:
          - Average rent: ${cityData[city]?.averageRent || 'Data not available'}
          - Utilities: ${cityData[city]?.utilities || 'Data not available'}
          - Transport: ${cityData[city]?.transport || 'Data not available'}
          - Groceries: ${cityData[city]?.groceries || 'Data not available'}
          - Entertainment: ${cityData[city]?.entertainment || 'Data not available'}
          
          Provide a detailed budget analysis including:
          1. Maximum affordable monthly rent
          2. Budget allocation for different expenses (rent, food, transport, utilities, entertainment, savings)
          3. Recommendations for managing finances
          4. Types of accommodation within budget with price ranges
          5. Any warning flags if the budget seems insufficient or requires adjustments
          6. Additional savings required if the budget is insufficient
          
          Format the response as valid JSON in this format:
          {
            "affordableRent": number,
            "affordableBudget": {
              "rent": number,
              "food": number,
              "transport": number,
              "utilities": number,
              "entertainment": number,
              "savings": number
            },
            "recommendations": string[],
            "accommodationTypes": [
              {
                "type": string,
                "priceRange": {
                  "min": number,
                  "max": number
                }
              }
            ],
            "warningFlags": string[],
            "savingsRequired": number
          }
        `
      });
      
      return res.json({
        success: true,
        analysis: JSON.parse(result)
      });
    } catch (error) {
      console.error('Budget calculation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to analyze budget'
      });
    }
  });
  
  /**
   * Neighborhood Safety API
   * Analyzes safety and suitability of neighborhoods for students
   */
  app.post('/api/tenant/neighborhood-safety', authenticateUser, async (req, res) => {
    try {
      const { 
        city,
        neighborhood,
        universityName,
        studentPriorities
      } = req.body;
      
      // Validate inputs
      if (!city) {
        return res.status(400).json({
          success: false,
          message: 'City is required'
        });
      }
      
      // Save tenant preferences if they don't exist yet
      const existingPreferences = await storage.getTenantPreferencesByTenantId(req.user?.id);
      
      if (existingPreferences) {
        await storage.updateTenantPreferences(existingPreferences.id, {
          locationPreferences: {
            city,
            neighborhood,
            universityName,
            studentPriorities
          }
        });
      } else {
        await storage.createTenantPreferences({
          tenantId: req.user?.id,
          locationPreferences: {
            city,
            neighborhood,
            universityName,
            studentPriorities
          }
        });
      }
      
      // Get safety analysis using AI
      const result = await executeAIOperation('generateText', {
        promptTemplate: `
          You are a neighborhood safety expert for UK student accommodation.
          Analyze this neighborhood's safety and suitability for students.
          
          Location details:
          - City: ${city}
          - Neighborhood: ${neighborhood || 'General city area'}
          - University: ${universityName || 'Not specified'}
          - Student priorities: ${studentPriorities.join(', ')}
          
          Provide a detailed safety analysis including:
          1. Overall safety rating (0-10)
          2. Safety details (crime rates, lighting, populated areas, etc)
          3. Popular student areas nearby
          4. Public transport availability rating (0-10)
          5. Local amenities rating (0-10)
          6. Student life rating (0-10)
          7. Safety tips for students in this area
          
          Format the response as valid JSON in this format:
          {
            "safety": number,
            "safetyDetails": string,
            "popularAreas": string[],
            "transport": number,
            "amenities": number,
            "studentLife": number,
            "tips": string[]
          }
        `
      });
      
      return res.json({
        success: true,
        analysis: JSON.parse(result)
      });
    } catch (error) {
      console.error('Neighborhood safety analysis error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to analyze neighborhood safety'
      });
    }
  });
  
  /**
   * Virtual Assistant API
   * Provides conversational assistance for student accommodation questions
   */
  app.post('/api/tenant/virtual-assistant', authenticateUser, async (req, res) => {
    try {
      const { query, conversationHistory } = req.body;
      
      // Validate inputs
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Query is required'
        });
      }
      
      // Format conversation history for the AI
      const formattedHistory = conversationHistory
        ? conversationHistory
            .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
            .map((msg: any) => ({ role: msg.role, content: msg.content }))
        : [];
      
      // Get assistant response using AI
      const result = await executeAIOperation('generateText', {
        promptTemplate: `
          You are UniRent Assistant, a specialized virtual assistant for UK student accommodation.
          You provide accurate, helpful information about student housing in the UK.
          
          Conversation history:
          ${formattedHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}
          
          User query: ${query}
          
          Provide a detailed, accurate response to the user's query.
          Also provide:
          1. 3-5 related topics that the user might be interested in
          2. 2-3 sources of information (UK housing websites, university resources, etc)
          
          Format the response as valid JSON in this format:
          {
            "answer": string,
            "relatedTopics": string[],
            "sources": string[]
          }
        `
      });
      
      return res.json({
        success: true,
        response: JSON.parse(result)
      });
    } catch (error) {
      console.error('Virtual assistant error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get assistant response'
      });
    }
  });
  
  /**
   * Property Search API
   * Searches properties using natural language queries
   */
  app.post('/api/tenant/voice-search', authenticateUser, async (req, res) => {
    try {
      const { query } = req.body;
      
      // Validate inputs
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }
      
      // Extract search criteria using AI
      const searchCriteriaResult = await executeAIOperation('generateText', {
        promptTemplate: `
          You are a property search expert.
          Extract search criteria from this natural language query: "${query}"
          
          Extract the following:
          - Location/city
          - Property type (flat, house, studio, etc)
          - Number of bedrooms
          - Price range
          - Distance from university
          - Special features (e.g., garden, parking, ensuite)
          - University name (if mentioned)
          
          Format the response as valid JSON in this format:
          {
            "location": string,
            "propertyType": string,
            "bedrooms": number,
            "priceMin": number,
            "priceMax": number,
            "distanceFromUniversity": number,
            "features": string[],
            "university": string
          }
          
          If any field is not specified in the query, set it to null or an empty array for features.
        `
      });
      
      const searchCriteria = JSON.parse(searchCriteriaResult);
      
      // Search properties using the criteria
      const properties = await storage.searchProperties(searchCriteria);
      
      return res.json({
        success: true,
        results: properties,
        searchCriteria
      });
    } catch (error) {
      console.error('Voice search error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to search properties'
      });
    }
  });
  
  // Authorization middleware for specific user types
  const authorizeUser = (allowedTypes: string[]) => (req: Request, res: Response, next: Function) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User is not authenticated'
      });
    }
    
    if (!allowedTypes.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'User is not authorized for this action'
      });
    }
    
    next();
  };
}