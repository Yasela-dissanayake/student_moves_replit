/**
 * Water Utilities API Routes
 * Handles water company registration and tariff management with geo-location matching
 */

import express from 'express';
import { 
  UK_WATER_COMPANIES, 
  getWaterCompanyForLocation, 
  getWaterCompaniesByType,
  calculateWaterBill,
  WaterCompany 
} from './uk-water-companies.js';
import { db } from './db.js';
import { eq, and } from 'drizzle-orm';
import { waterRegistrations, properties } from '../shared/schema.js';

const router = express.Router();

/**
 * Get water company for specific property location
 */
router.get('/api/water/company-for-property/:propertyId', async (req, res) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    
    // Get property details
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId));
      
    if (!property) {
      return res.status(404).json({ 
        success: false, 
        error: 'Property not found' 
      });
    }
    
    // Find appropriate water company
    const waterCompany = getWaterCompanyForLocation(property.city, property.postcode);
    
    if (!waterCompany) {
      return res.status(404).json({ 
        success: false, 
        error: 'No water company found for this location',
        location: { city: property.city, postcode: property.postcode }
      });
    }
    
    // Calculate estimated bill
    const estimatedAnnualBill = calculateWaterBill(waterCompany);
    const estimatedMonthlyBill = Math.round((estimatedAnnualBill / 12) * 100) / 100;
    
    res.json({
      success: true,
      property: {
        id: property.id,
        address: property.address,
        city: property.city,
        postcode: property.postcode
      },
      waterCompany: {
        ...waterCompany,
        estimatedBills: {
          monthly: estimatedMonthlyBill,
          annual: estimatedAnnualBill
        }
      }
    });
    
  } catch (error) {
    console.error('Error finding water company:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to find water company' 
    });
  }
});

/**
 * Get all available water companies by region
 */
router.get('/api/water/companies', async (req, res) => {
  try {
    const { type, region, city } = req.query;
    
    let companies = UK_WATER_COMPANIES;
    
    if (type && (type === 'water_only' || type === 'water_and_sewerage')) {
      companies = getWaterCompaniesByType(type as 'water_only' | 'water_and_sewerage');
    }
    
    if (region) {
      companies = companies.filter(company => 
        company.regions.some(r => r.toLowerCase().includes((region as string).toLowerCase()))
      );
    }
    
    if (city) {
      const waterCompany = getWaterCompanyForLocation(city as string);
      companies = waterCompany ? [waterCompany] : [];
    }
    
    // Add estimated bills to each company
    const companiesWithBills = companies.map(company => ({
      ...company,
      estimatedBills: {
        monthly: Math.round((calculateWaterBill(company) / 12) * 100) / 100,
        annual: calculateWaterBill(company)
      }
    }));
    
    res.json({
      success: true,
      companies: companiesWithBills,
      total: companiesWithBills.length
    });
    
  } catch (error) {
    console.error('Error fetching water companies:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch water companies' 
    });
  }
});

/**
 * Register tenant with water company
 */
router.post('/api/water/register', async (req, res) => {
  try {
    const { 
      propertyId, 
      waterCompanyId, 
      tenantDetails, 
      moveInDate, 
      accountPreferences 
    } = req.body;
    
    // Validate required fields
    if (!propertyId || !waterCompanyId || !tenantDetails || !moveInDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }
    
    // Find the water company
    const waterCompany = UK_WATER_COMPANIES.find(company => company.id === waterCompanyId);
    if (!waterCompany) {
      return res.status(404).json({ 
        success: false, 
        error: 'Water company not found' 
      });
    }
    
    // Get property details
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId));
      
    if (!property) {
      return res.status(404).json({ 
        success: false, 
        error: 'Property not found' 
      });
    }
    
    // Verify water company serves this location
    const correctCompany = getWaterCompanyForLocation(property.city, property.postcode);
    if (!correctCompany || correctCompany.id !== waterCompanyId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Selected water company does not serve this location',
        correctCompany: correctCompany?.name || 'Unknown'
      });
    }
    
    // Generate account details
    const accountNumber = `${waterCompany.id.toUpperCase().replace('-', '')}-${Date.now().toString().slice(-6)}`;
    const customerReference = `WTR${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    // Create registration record
    const registration = {
      propertyId: propertyId,
      waterCompanyId: waterCompanyId,
      waterCompanyName: waterCompany.name,
      accountNumber: accountNumber,
      customerReference: customerReference,
      tenantName: `${tenantDetails.firstName} ${tenantDetails.lastName}`,
      tenantEmail: tenantDetails.email,
      tenantPhone: tenantDetails.phone,
      moveInDate: new Date(moveInDate),
      registrationStatus: 'active' as const,
      monthlyDirectDebit: Math.round((calculateWaterBill(waterCompany) / 12) * 100) / 100,
      paperlessBilling: accountPreferences?.paperlessBilling || false,
      autoMeterReading: accountPreferences?.autoMeterReading || false,
      registeredAt: new Date()
    };
    
    const [newRegistration] = await db
      .insert(waterRegistrations)
      .values(registration)
      .returning();
    
    res.json({
      success: true,
      registration: {
        ...newRegistration,
        waterCompany: {
          name: waterCompany.name,
          website: waterCompany.website,
          customerService: waterCompany.customerService,
          emergencyNumber: waterCompany.emergencyNumber
        },
        estimatedBills: {
          monthly: registration.monthlyDirectDebit,
          annual: calculateWaterBill(waterCompany)
        }
      }
    });
    
  } catch (error) {
    console.error('Error registering with water company:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to register with water company' 
    });
  }
});

/**
 * Get tenant's water registrations
 */
router.get('/api/water/registrations/:tenantId', async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    
    const registrations = await db
      .select()
      .from(waterRegistrations)
      .where(eq(waterRegistrations.tenantId, tenantId));
    
    // Enrich with water company details
    const enrichedRegistrations = registrations.map(registration => {
      const waterCompany = UK_WATER_COMPANIES.find(company => 
        company.id === registration.waterCompanyId
      );
      
      return {
        ...registration,
        waterCompany: waterCompany ? {
          name: waterCompany.name,
          type: waterCompany.type,
          website: waterCompany.website,
          customerService: waterCompany.customerService,
          emergencyNumber: waterCompany.emergencyNumber
        } : null
      };
    });
    
    res.json({
      success: true,
      registrations: enrichedRegistrations
    });
    
  } catch (error) {
    console.error('Error fetching water registrations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch water registrations' 
    });
  }
});

/**
 * Update water registration
 */
router.patch('/api/water/registrations/:registrationId', async (req, res) => {
  try {
    const registrationId = parseInt(req.params.registrationId);
    const updates = req.body;
    
    const [updatedRegistration] = await db
      .update(waterRegistrations)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(waterRegistrations.id, registrationId))
      .returning();
    
    if (!updatedRegistration) {
      return res.status(404).json({ 
        success: false, 
        error: 'Registration not found' 
      });
    }
    
    res.json({
      success: true,
      registration: updatedRegistration
    });
    
  } catch (error) {
    console.error('Error updating water registration:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update water registration' 
    });
  }
});

/**
 * Cancel water registration
 */
router.delete('/api/water/registrations/:registrationId', async (req, res) => {
  try {
    const registrationId = parseInt(req.params.registrationId);
    const { moveOutDate, reason } = req.body;
    
    const [cancelledRegistration] = await db
      .update(waterRegistrations)
      .set({
        registrationStatus: 'cancelled',
        moveOutDate: moveOutDate ? new Date(moveOutDate) : new Date(),
        cancellationReason: reason,
        updatedAt: new Date()
      })
      .where(eq(waterRegistrations.id, registrationId))
      .returning();
    
    if (!cancelledRegistration) {
      return res.status(404).json({ 
        success: false, 
        error: 'Registration not found' 
      });
    }
    
    res.json({
      success: true,
      registration: cancelledRegistration
    });
    
  } catch (error) {
    console.error('Error cancelling water registration:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to cancel water registration' 
    });
  }
});

/**
 * Get water tariff comparison for location
 */
router.get('/api/water/tariffs/compare/:city', async (req, res) => {
  try {
    const city = req.params.city;
    const { postcode } = req.query;
    
    const waterCompany = getWaterCompanyForLocation(city, postcode as string);
    
    if (!waterCompany) {
      return res.status(404).json({ 
        success: false, 
        error: 'No water company found for this location' 
      });
    }
    
    // Get comparison with national averages
    const allCompanies = UK_WATER_COMPANIES;
    const averageBill = allCompanies.reduce((sum, company) => 
      sum + calculateWaterBill(company), 0) / allCompanies.length;
    
    const localBill = calculateWaterBill(waterCompany);
    const savingsVsAverage = Math.round((averageBill - localBill) * 100) / 100;
    
    res.json({
      success: true,
      location: { city, postcode },
      localProvider: {
        ...waterCompany,
        estimatedBills: {
          monthly: Math.round((localBill / 12) * 100) / 100,
          annual: localBill
        }
      },
      comparison: {
        nationalAverage: Math.round(averageBill * 100) / 100,
        localBill: localBill,
        savingsVsAverage: savingsVsAverage,
        percentageDifference: Math.round(((localBill - averageBill) / averageBill) * 100 * 100) / 100
      }
    });
    
  } catch (error) {
    console.error('Error comparing water tariffs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to compare water tariffs' 
    });
  }
});

export default router;