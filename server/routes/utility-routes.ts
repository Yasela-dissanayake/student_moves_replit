import express from 'express';
import { IStorage } from '../storage';
import { UtilityType } from '@shared/utility-schema';
import { authenticateUser, authorizeUser } from '../middlewares/auth';

export function setupUtilityRoutes(app: express.Express, storage: IStorage) {
  const router = express.Router();

  // Apply authentication middleware to all utility routes
  router.use(authenticateUser);

  // Get all utility providers
  router.get('/providers', async (req, res) => {
    try {
      const providers = await storage.getAllUtilityProviders();
      res.json({ success: true, providers });
    } catch (error) {
      console.error('Error fetching utility providers:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch utility providers' });
    }
  });

  // Get utility providers by type
  router.get('/providers/type/:utilityType', async (req, res) => {
    try {
      const { utilityType } = req.params;
      
      if (!isValidUtilityType(utilityType)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid utility type. Must be one of: electricity, gas, water, internet, tv_license, council_tax' 
        });
      }
      
      const providers = await storage.getUtilityProvidersByType(utilityType as UtilityType);
      res.json({ success: true, providers });
    } catch (error) {
      console.error(`Error fetching ${req.params.utilityType} utility providers:`, error);
      res.status(500).json({ success: false, error: `Failed to fetch ${req.params.utilityType} utility providers` });
    }
  });

  // Get a specific utility provider
  router.get('/providers/:id', async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      
      if (isNaN(providerId)) {
        return res.status(400).json({ success: false, error: 'Invalid provider ID' });
      }
      
      const provider = await storage.getUtilityProvider(providerId);
      
      if (!provider) {
        return res.status(404).json({ success: false, error: 'Utility provider not found' });
      }
      
      res.json({ success: true, provider });
    } catch (error) {
      console.error('Error fetching utility provider:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch utility provider' });
    }
  });

  // Create a new utility provider (admin only)
  router.post('/providers', authorizeUser(['admin']), async (req, res) => {
    try {
      const newProvider = req.body;
      
      const provider = await storage.createUtilityProvider(newProvider);
      res.status(201).json({ success: true, provider });
    } catch (error) {
      console.error('Error creating utility provider:', error);
      res.status(500).json({ success: false, error: 'Failed to create utility provider' });
    }
  });

  // Update a utility provider (admin only)
  router.put('/providers/:id', authorizeUser(['admin']), async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      
      if (isNaN(providerId)) {
        return res.status(400).json({ success: false, error: 'Invalid provider ID' });
      }
      
      const provider = await storage.getUtilityProvider(providerId);
      
      if (!provider) {
        return res.status(404).json({ success: false, error: 'Utility provider not found' });
      }
      
      const updatedProvider = await storage.updateUtilityProvider(providerId, req.body);
      res.json({ success: true, provider: updatedProvider });
    } catch (error) {
      console.error('Error updating utility provider:', error);
      res.status(500).json({ success: false, error: 'Failed to update utility provider' });
    }
  });

  // Delete a utility provider (admin only)
  router.delete('/providers/:id', authorizeUser(['admin']), async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      
      if (isNaN(providerId)) {
        return res.status(400).json({ success: false, error: 'Invalid provider ID' });
      }
      
      const provider = await storage.getUtilityProvider(providerId);
      
      if (!provider) {
        return res.status(404).json({ success: false, error: 'Utility provider not found' });
      }
      
      const success = await storage.deleteUtilityProvider(providerId);
      
      if (success) {
        res.json({ success: true, message: 'Utility provider deleted successfully' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to delete utility provider' });
      }
    } catch (error) {
      console.error('Error deleting utility provider:', error);
      res.status(500).json({ success: false, error: 'Failed to delete utility provider' });
    }
  });

  // Get all utility plans
  router.get('/plans', async (req, res) => {
    try {
      const plans = await storage.getAllUtilityPlans();
      res.json({ success: true, plans });
    } catch (error) {
      console.error('Error fetching utility plans:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch utility plans' });
    }
  });

  // Get utility plans by provider
  router.get('/plans/provider/:providerId', async (req, res) => {
    try {
      const providerId = parseInt(req.params.providerId);
      
      if (isNaN(providerId)) {
        return res.status(400).json({ success: false, error: 'Invalid provider ID' });
      }
      
      const plans = await storage.getUtilityPlansByProvider(providerId);
      res.json({ success: true, plans });
    } catch (error) {
      console.error(`Error fetching plans for provider ${req.params.providerId}:`, error);
      res.status(500).json({ success: false, error: 'Failed to fetch utility plans' });
    }
  });

  // Get a specific utility plan
  router.get('/plans/:id', async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      
      if (isNaN(planId)) {
        return res.status(400).json({ success: false, error: 'Invalid plan ID' });
      }
      
      const plan = await storage.getUtilityPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ success: false, error: 'Utility plan not found' });
      }
      
      res.json({ success: true, plan });
    } catch (error) {
      console.error('Error fetching utility plan:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch utility plan' });
    }
  });

  // Create a new utility plan (admin only)
  router.post('/plans', authorizeUser(['admin']), async (req, res) => {
    try {
      const newPlan = req.body;
      
      const plan = await storage.createUtilityPlan(newPlan);
      res.status(201).json({ success: true, plan });
    } catch (error) {
      console.error('Error creating utility plan:', error);
      res.status(500).json({ success: false, error: 'Failed to create utility plan' });
    }
  });

  // Update a utility plan (admin only)
  router.put('/plans/:id', authorizeUser(['admin']), async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      
      if (isNaN(planId)) {
        return res.status(400).json({ success: false, error: 'Invalid plan ID' });
      }
      
      const plan = await storage.getUtilityPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ success: false, error: 'Utility plan not found' });
      }
      
      const updatedPlan = await storage.updateUtilityPlan(planId, req.body);
      res.json({ success: true, plan: updatedPlan });
    } catch (error) {
      console.error('Error updating utility plan:', error);
      res.status(500).json({ success: false, error: 'Failed to update utility plan' });
    }
  });

  // Delete a utility plan (admin only)
  router.delete('/plans/:id', authorizeUser(['admin']), async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      
      if (isNaN(planId)) {
        return res.status(400).json({ success: false, error: 'Invalid plan ID' });
      }
      
      const plan = await storage.getUtilityPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ success: false, error: 'Utility plan not found' });
      }
      
      const success = await storage.deleteUtilityPlan(planId);
      
      if (success) {
        res.json({ success: true, message: 'Utility plan deleted successfully' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to delete utility plan' });
      }
    } catch (error) {
      console.error('Error deleting utility plan:', error);
      res.status(500).json({ success: false, error: 'Failed to delete utility plan' });
    }
  });

  // Get all utilities for a property
  router.get('/property/:propertyId', async (req, res) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ success: false, error: 'Invalid property ID' });
      }
      
      const utilities = await storage.getPropertyUtilitiesByProperty(propertyId);
      res.json({ success: true, utilities });
    } catch (error) {
      console.error(`Error fetching utilities for property ${req.params.propertyId}:`, error);
      res.status(500).json({ success: false, error: 'Failed to fetch property utilities' });
    }
  });

  // Get a specific utility for a property
  router.get('/property/:propertyId/type/:utilityType', async (req, res) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      const { utilityType } = req.params;
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ success: false, error: 'Invalid property ID' });
      }
      
      if (!isValidUtilityType(utilityType)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid utility type. Must be one of: electricity, gas, water, internet, tv_license, council_tax' 
        });
      }
      
      const utilities = await storage.getPropertyUtilitiesByType(propertyId, utilityType as UtilityType);
      res.json({ success: true, utilities });
    } catch (error) {
      console.error(`Error fetching ${req.params.utilityType} utility for property ${req.params.propertyId}:`, error);
      res.status(500).json({ success: false, error: 'Failed to fetch property utility' });
    }
  });

  // Create a new property utility (admin only)
  router.post('/property/:propertyId', authorizeUser(['admin']), async (req, res) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ success: false, error: 'Invalid property ID' });
      }
      
      // Verify if the property exists
      const property = await storage.getProperty(propertyId);
      
      if (!property) {
        return res.status(404).json({ success: false, error: 'Property not found' });
      }
      
      // For security, ensure that only the owner/manager of the property can add utilities
      if (req.session.userType !== 'admin' && property.ownerId !== req.session.userId) {
        const isAgent = req.session.userType === 'agent';
        // If it's an agent, check if they manage this property (this logic depends on your data model)
        if (isAgent) {
          // This is a placeholder logic, adjust based on your actual data model
          const hasAccess = await checkAgentHasAccessToProperty(req.session.userId, propertyId, storage);
          if (!hasAccess) {
            return res.status(403).json({ success: false, error: 'Not authorized to add utilities to this property' });
          }
        } else {
          return res.status(403).json({ success: false, error: 'Not authorized to add utilities to this property' });
        }
      }
      
      const newUtility = {
        ...req.body,
        propertyId
      };
      
      const utility = await storage.createPropertyUtility(newUtility);
      res.status(201).json({ success: true, utility });
    } catch (error) {
      console.error('Error creating property utility:', error);
      res.status(500).json({ success: false, error: 'Failed to create property utility' });
    }
  });

  // Update a property utility (admin only)
  router.put('/property/utility/:id', authorizeUser(['admin']), async (req, res) => {
    try {
      const utilityId = parseInt(req.params.id);
      
      if (isNaN(utilityId)) {
        return res.status(400).json({ success: false, error: 'Invalid utility ID' });
      }
      
      const utility = await storage.getPropertyUtility(utilityId);
      
      if (!utility) {
        return res.status(404).json({ success: false, error: 'Property utility not found' });
      }
      
      // Verify authorization to update this utility
      const property = await storage.getProperty(utility.propertyId);
      
      if (!property) {
        return res.status(404).json({ success: false, error: 'Property not found' });
      }
      
      if (req.session.userType !== 'admin' && property.ownerId !== req.session.userId) {
        const isAgent = req.session.userType === 'agent';
        if (isAgent) {
          const hasAccess = await checkAgentHasAccessToProperty(req.session.userId, utility.propertyId, storage);
          if (!hasAccess) {
            return res.status(403).json({ success: false, error: 'Not authorized to update utilities for this property' });
          }
        } else {
          return res.status(403).json({ success: false, error: 'Not authorized to update utilities for this property' });
        }
      }
      
      const updatedUtility = await storage.updatePropertyUtility(utilityId, req.body);
      res.json({ success: true, utility: updatedUtility });
    } catch (error) {
      console.error('Error updating property utility:', error);
      res.status(500).json({ success: false, error: 'Failed to update property utility' });
    }
  });

  // Delete a property utility (admin only)
  router.delete('/property/utility/:id', authorizeUser(['admin']), async (req, res) => {
    try {
      const utilityId = parseInt(req.params.id);
      
      if (isNaN(utilityId)) {
        return res.status(400).json({ success: false, error: 'Invalid utility ID' });
      }
      
      const utility = await storage.getPropertyUtility(utilityId);
      
      if (!utility) {
        return res.status(404).json({ success: false, error: 'Property utility not found' });
      }
      
      // Verify authorization to delete this utility
      const property = await storage.getProperty(utility.propertyId);
      
      if (!property) {
        return res.status(404).json({ success: false, error: 'Property not found' });
      }
      
      if (req.session.userType !== 'admin' && property.ownerId !== req.session.userId) {
        const isAgent = req.session.userType === 'agent';
        if (isAgent) {
          const hasAccess = await checkAgentHasAccessToProperty(req.session.userId, utility.propertyId, storage);
          if (!hasAccess) {
            return res.status(403).json({ success: false, error: 'Not authorized to delete utilities for this property' });
          }
        } else {
          return res.status(403).json({ success: false, error: 'Not authorized to delete utilities for this property' });
        }
      }
      
      const success = await storage.deletePropertyUtility(utilityId);
      
      if (success) {
        res.json({ success: true, message: 'Property utility deleted successfully' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to delete property utility' });
      }
    } catch (error) {
      console.error('Error deleting property utility:', error);
      res.status(500).json({ success: false, error: 'Failed to delete property utility' });
    }
  });

  // Create a utility switch request
  router.post('/switch-request', async (req, res) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      
      const switchRequest = {
        ...req.body,
        userId
      };
      
      const newRequest = await storage.createUtilitySwitchRequest(switchRequest);
      res.status(201).json({ success: true, switchRequest: newRequest });
    } catch (error) {
      console.error('Error creating utility switch request:', error);
      res.status(500).json({ success: false, error: 'Failed to create utility switch request' });
    }
  });

  // Get utility switch requests for a user
  router.get('/switch-requests', async (req, res) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      
      const requests = await storage.getUtilitySwitchRequestsByUser(userId);
      res.json({ success: true, switchRequests: requests });
    } catch (error) {
      console.error('Error fetching utility switch requests:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch utility switch requests' });
    }
  });

  // Get a specific utility switch request
  router.get('/switch-request/:id', async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      if (isNaN(requestId)) {
        return res.status(400).json({ success: false, error: 'Invalid request ID' });
      }
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      
      const request = await storage.getUtilitySwitchRequest(requestId);
      
      if (!request) {
        return res.status(404).json({ success: false, error: 'Switch request not found' });
      }
      
      // Ensure users can only see their own requests unless they're admins
      if (request.userId !== userId && req.session.userType !== 'admin') {
        return res.status(403).json({ success: false, error: 'Not authorized to view this switch request' });
      }
      
      res.json({ success: true, switchRequest: request });
    } catch (error) {
      console.error('Error fetching utility switch request:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch utility switch request' });
    }
  });

  // Update a utility switch request status (admin only)
  router.patch('/switch-request/:id/status', authorizeUser(['admin']), async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(requestId)) {
        return res.status(400).json({ success: false, error: 'Invalid request ID' });
      }
      
      if (!status) {
        return res.status(400).json({ success: false, error: 'Status is required' });
      }
      
      const request = await storage.getUtilitySwitchRequest(requestId);
      
      if (!request) {
        return res.status(404).json({ success: false, error: 'Switch request not found' });
      }
      
      const completionDate = status === 'completed' ? new Date() : undefined;
      const updatedRequest = await storage.updateUtilitySwitchRequestStatus(requestId, status, completionDate);
      
      res.json({ success: true, switchRequest: updatedRequest });
    } catch (error) {
      console.error('Error updating utility switch request status:', error);
      res.status(500).json({ success: false, error: 'Failed to update utility switch request status' });
    }
  });

  // Record utility comparison history
  router.post('/comparison-history', async (req, res) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      
      const comparisonData = {
        ...req.body,
        userId
      };
      
      const history = await storage.createUtilityComparisonHistory(comparisonData);
      res.status(201).json({ success: true, history });
    } catch (error) {
      console.error('Error recording utility comparison history:', error);
      res.status(500).json({ success: false, error: 'Failed to record utility comparison history' });
    }
  });

  // Get utility comparison history for a user
  router.get('/comparison-history', async (req, res) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      
      const history = await storage.getUtilityComparisonHistoryByUser(userId);
      res.json({ success: true, history });
    } catch (error) {
      console.error('Error fetching utility comparison history:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch utility comparison history' });
    }
  });
  
  // Update utility comparison history when a switch is completed
  router.patch('/comparison-history/:id/switch', async (req, res) => {
    try {
      const historyId = parseInt(req.params.id);
      const userId = req.session.userId;
      const { switched, selectedProviderId, selectedPlanId } = req.body;
      
      if (isNaN(historyId)) {
        return res.status(400).json({ success: false, error: 'Invalid history ID' });
      }
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      
      const history = await storage.getUtilityComparisonHistory(historyId);
      
      if (!history) {
        return res.status(404).json({ success: false, error: 'Comparison history not found' });
      }
      
      // Ensure users can only update their own history
      if (history.userId !== userId) {
        return res.status(403).json({ success: false, error: 'Not authorized to update this comparison history' });
      }
      
      const updatedHistory = await storage.updateUtilityComparisonHistorySwitchStatus(
        historyId, 
        switched, 
        selectedProviderId, 
        selectedPlanId
      );
      
      res.json({ success: true, history: updatedHistory });
    } catch (error) {
      console.error('Error updating utility comparison history switch status:', error);
      res.status(500).json({ success: false, error: 'Failed to update utility comparison history switch status' });
    }
  });

  // Public route for utility type information
  app.get('/api/utility-types', (req, res) => {
    try {
      const utilityTypes = [
        { 
          type: 'electricity', 
          displayName: 'Electricity',
          icon: 'bolt',
          description: 'Power supply for your property'
        },
        { 
          type: 'gas', 
          displayName: 'Gas',
          icon: 'flame',
          description: 'Gas supply for heating and cooking'
        },
        { 
          type: 'water', 
          displayName: 'Water',
          icon: 'droplet',
          description: 'Water supply and waste water services'
        },
        { 
          type: 'internet', 
          displayName: 'Internet',
          icon: 'wifi',
          description: 'Broadband and internet services'
        },
        { 
          type: 'tv_license', 
          displayName: 'TV License',
          icon: 'tv',
          description: 'Television licensing'
        },
        { 
          type: 'council_tax', 
          displayName: 'Council Tax',
          icon: 'building',
          description: 'Local authority council tax'
        }
      ];
      
      res.json({ success: true, utilityTypes });
    } catch (error) {
      console.error('Error fetching utility types:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch utility types' });
    }
  });

  // Register the router
  app.use('/api/utilities', router);
  console.log('[routes] Utility management routes registered');
}

// Helper function to check if utility type is valid
function isValidUtilityType(type: string): boolean {
  const validTypes = ['electricity', 'gas', 'water', 'internet', 'tv_license', 'council_tax'];
  return validTypes.includes(type);
}

// Helper function to check if agent has access to a property
// This would need to be adapted to your data model
async function checkAgentHasAccessToProperty(agentId: number, propertyId: number, storage: IStorage): Promise<boolean> {
  try {
    // This is just a placeholder. In your actual implementation, you would have
    // some kind of agent-property relationship to check.
    const property = await storage.getProperty(propertyId);
    
    // Assuming there's an agentId property on the property object
    // If your data model is different, adjust this logic accordingly
    return property?.agentId === agentId;
  } catch (error) {
    console.error('Error checking agent property access:', error);
    return false;
  }
}