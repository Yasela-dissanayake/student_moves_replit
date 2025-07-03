import { Router } from "express";
import { z } from "zod";
import { registerWithUtilityProvider, REAL_UTILITY_PROVIDERS, type CustomerDetails } from "./utility-providers";

const registrationRoutes = Router();

// Schema for customer registration
const CustomerRegistrationSchema = z.object({
  utilityType: z.enum(['dual_fuel', 'gas', 'electricity', 'water', 'broadband', 'tv']),
  customerDetails: z.object({
    title: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    dateOfBirth: z.string(),
    moveInDate: z.string()
  }),
  property: z.object({
    address: z.string(),
    postcode: z.string(),
    city: z.string()
  })
});

// Register with real utility provider
registrationRoutes.post('/register-real', async (req, res) => {
  try {
    const validatedData = CustomerRegistrationSchema.parse(req.body);
    const { utilityType, customerDetails, property } = validatedData;
    
    console.log('Real utility registration request:', { utilityType, customerDetails, property });
    
    // Determine the best provider for this utility type
    let providerId: string;
    
    switch (utilityType) {
      case 'dual_fuel':
        providerId = 'octopus_energy'; // User specifically wants Octopus Energy
        break;
      case 'water':
        // Determine water company based on postcode area
        const postcodeArea = property.postcode.split(' ')[0].toUpperCase();
        providerId = ['SW', 'SE', 'E', 'EC', 'WC', 'W', 'NW', 'N'].some(area => 
          postcodeArea.startsWith(area)) ? 'thames_water' : 'severn_trent';
        break;
      case 'broadband':
        providerId = 'bt_broadband'; // Default to BT for broad coverage
        break;
      case 'tv':
        providerId = 'tv_licensing';
        break;
      default:
        throw new Error(`Unsupported utility type: ${utilityType}`);
    }
    
    // Prepare customer details with property address
    const fullCustomerDetails: CustomerDetails = {
      ...customerDetails,
      address: {
        line1: property.address,
        city: property.city,
        postcode: property.postcode
      },
      moveInDate: customerDetails.moveInDate
    };
    
    // Attempt registration with the selected provider
    const registrationResult = await registerWithUtilityProvider(
      providerId,
      fullCustomerDetails,
      property
    );
    
    // Log the registration attempt
    console.log('Registration result:', registrationResult);
    
    // Return standardized response
    res.json({
      success: registrationResult.success,
      utilityType,
      provider: registrationResult.provider,
      accountNumber: registrationResult.accountNumber,
      referenceNumber: registrationResult.referenceNumber,
      estimatedSetupDate: registrationResult.estimatedSetupDate,
      nextSteps: registrationResult.nextSteps,
      contactInfo: registrationResult.contactInfo,
      error: registrationResult.error,
      // Additional UI-friendly fields
      startDate: registrationResult.estimatedSetupDate || new Date().toISOString().split('T')[0],
      estimatedMonthlyCost: utilityType === 'dual_fuel' ? 85 : 
                          utilityType === 'water' ? 35 :
                          utilityType === 'broadband' ? 30 :
                          utilityType === 'tv' ? 13 : 50
    });
    
  } catch (error) {
    console.error('Utility registration error:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
      nextSteps: [
        'Please try again later',
        'Contact customer support if the issue persists',
        'Consider manual registration with the provider'
      ]
    });
  }
});

// Get available providers for a utility type
registrationRoutes.get('/providers/:utilityType', (req, res) => {
  const { utilityType } = req.params;
  
  const providers = REAL_UTILITY_PROVIDERS.filter(p => 
    p.type === utilityType || 
    (utilityType === 'gas' && p.type === 'dual_fuel') ||
    (utilityType === 'electricity' && p.type === 'dual_fuel')
  );
  
  res.json({
    success: true,
    providers: providers.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      registrationUrl: p.registrationUrl,
      customerServicePhone: p.customerServicePhone,
      averageSetupTime: p.averageSetupTime
    }))
  });
});

// Get registration status and next steps
registrationRoutes.get('/registration-status/:referenceNumber', (req, res) => {
  const { referenceNumber } = req.params;
  
  // In a real system, this would check the actual registration status
  // For now, return a mock status
  res.json({
    success: true,
    referenceNumber,
    status: 'processing',
    estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    nextSteps: [
      'Registration is being processed',
      'You will receive confirmation within 24 hours',
      'Setup will be completed within 7 days'
    ]
  });
});

export default registrationRoutes;