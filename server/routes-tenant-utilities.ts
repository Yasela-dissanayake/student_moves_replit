import express from 'express';
import { authMiddleware } from './middleware';

const router = express.Router();

// Tenant-specific utility providers - only show what tenants can register with
const TENANT_UTILITY_PROVIDERS = [
  {
    id: 'octopus-energy',
    name: 'Octopus Energy',
    type: 'energy',
    available: true,
    description: 'Green energy supplier with competitive rates',
    icon: 'zap'
  },
  {
    id: 'tv-licensing',
    name: 'TV Licensing',
    type: 'tv',
    available: true,
    description: 'BBC TV License for watching live TV',
    icon: 'tv'
  },
  {
    id: 'thames-water',
    name: 'Thames Water',
    type: 'water',
    available: true,
    description: 'Water and sewerage services',
    icon: 'droplet',
    manualSetup: true
  }
];

// Get utility providers available to tenants
router.get('/api/tenant/utility-providers', authMiddleware, (req, res) => {
  try {
    // Only return providers that admin has made available to tenants
    const availableProviders = TENANT_UTILITY_PROVIDERS.filter(provider => provider.available);
    
    res.json({
      success: true,
      providers: availableProviders,
      message: 'Available utility providers for tenant registration'
    });
  } catch (error) {
    console.error('Error fetching tenant utility providers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch utility providers'
    });
  }
});

// Get tenant's registered utilities
router.get('/api/tenant/registered-utilities', authMiddleware, (req, res) => {
  try {
    // Mock data for registered utilities - in production this would come from database
    const registeredUtilities = [
      {
        id: 'octopus-energy',
        name: 'Octopus Energy',
        accountNumber: 'OE99371077',
        status: 'active',
        monthlyEstimate: 85,
        contactPhone: '0800 326 5454',
        contactEmail: 'hello@octopusenergy.com',
        setupDate: '2025-06-24',
        nextSteps: 'Account is active and ready to use'
      },
      {
        id: 'tv-licensing',
        name: 'TV Licensing',
        accountNumber: 'TV99396047',
        status: 'active',
        monthlyEstimate: 13,
        contactPhone: '0300 790 6165',
        contactEmail: 'support@tvlicensing.co.uk',
        setupDate: '2025-06-24',
        nextSteps: 'License is valid and active'
      },
      {
        id: 'thames-water',
        name: 'Thames Water',
        accountNumber: null,
        status: 'manual_setup_required',
        monthlyEstimate: 35,
        contactPhone: '0800 980 8800',
        contactEmail: 'customer.services@thameswater.co.uk',
        setupDate: null,
        nextSteps: 'Call to complete registration with your property details'
      }
    ];

    res.json({
      success: true,
      utilities: registeredUtilities,
      totalMonthlyEstimate: registeredUtilities.reduce((sum, utility) => sum + utility.monthlyEstimate, 0)
    });
  } catch (error) {
    console.error('Error fetching registered utilities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch registered utilities'
    });
  }
});

export default router;