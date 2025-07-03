import { Router } from 'express';
import { db } from './db';
import { adminConfiguration, type AdminConfiguration, type InsertAdminConfiguration } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { insertAdminConfigurationSchema } from '@shared/schema';
import { checkAuth } from './auth';

const router = Router();

// GET /api/utilities/admin-config - Get admin configuration
router.get('/admin-config', async (req, res) => {
  try {
    console.log("Admin config route accessed - getting configuration");
    
    // Force JSON response headers
    res.setHeader('Content-Type', 'application/json');
    
    const [config] = await db.select().from(adminConfiguration).limit(1);
    
    return res.status(200).json({
      success: true,
      data: config || {
        business_name: 'StudentMoves Ltd',
        business_email: 'admin@studentmoves.com',
        business_phone: '020 1234 5678',
        business_address: '123 University Avenue',
        business_city: 'London',
        business_postcode: 'SW1A 1AA',
        contact_first_name: 'John',
        contact_last_name: 'Smith',
        contact_title: 'Mr',
        company_number: '12345678',
        vat_number: 'GB123456789',
        business_type: 'property_management',
        preferred_contact_method: 'email'
      },
      message: config ? "Configuration loaded" : "Default configuration loaded"
    });
  } catch (error) {
    console.error('Error fetching admin configuration:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin configuration',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// POST /api/utilities/admin-config - Create or update admin configuration
router.post('/admin-config', async (req, res) => {
  try {
    console.log("Admin config POST route accessed - saving configuration");
    
    // Force JSON response headers
    res.setHeader('Content-Type', 'application/json');
    
    const configData = {
      businessName: req.body.businessName || req.body.companyName || '',
      contactFirstName: req.body.contactFirstName || 'John',
      contactLastName: req.body.contactLastName || 'Smith',
      contactTitle: req.body.contactTitle || 'Mr',
      businessEmail: req.body.businessEmail || req.body.contactEmail || '',
      businessPhone: req.body.businessPhone || req.body.contactPhone || '',
      businessAddress: req.body.businessAddress || req.body.addressLine1 || '',
      businessCity: req.body.businessCity || req.body.city || '',
      businessPostcode: req.body.businessPostcode || req.body.postcode || '',
      companyNumber: req.body.companyNumber || req.body.companyRegistration || '',
      vatNumber: req.body.vatNumber || '',
      businessType: req.body.businessType || 'property_management',
      preferredContactMethod: req.body.preferredContactMethod || 'email'
    };

    // Check if configuration already exists
    const [existingConfig] = await db.select().from(adminConfiguration).limit(1);
    
    let result;
    if (existingConfig) {
      // Update existing configuration
      [result] = await db
        .update(adminConfiguration)
        .set({
          businessName: configData.businessName,
          contactFirstName: configData.contactFirstName,
          contactLastName: configData.contactLastName,
          contactTitle: configData.contactTitle,
          businessEmail: configData.businessEmail,
          businessPhone: configData.businessPhone,
          businessAddress: configData.businessAddress,
          businessCity: configData.businessCity,
          businessPostcode: configData.businessPostcode,
          companyNumber: configData.companyNumber,
          vatNumber: configData.vatNumber,
          businessType: configData.businessType,
          preferredContactMethod: configData.preferredContactMethod,
          updatedAt: new Date()
        })
        .where(eq(adminConfiguration.id, existingConfig.id))
        .returning();
    } else {
      // Create new configuration
      [result] = await db
        .insert(adminConfiguration)
        .values({
          businessName: configData.businessName,
          contactFirstName: configData.contactFirstName,
          contactLastName: configData.contactLastName,
          contactTitle: configData.contactTitle,
          businessEmail: configData.businessEmail,
          businessPhone: configData.businessPhone,
          businessAddress: configData.businessAddress,
          businessCity: configData.businessCity,
          businessPostcode: configData.businessPostcode,
          companyNumber: configData.companyNumber,
          vatNumber: configData.vatNumber,
          businessType: configData.businessType,
          preferredContactMethod: configData.preferredContactMethod,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
    }
    
    return res.status(200).json({
      success: true,
      data: result,
      message: existingConfig ? 'Configuration updated successfully' : 'Configuration created successfully'
    });
  } catch (error) {
    console.error('Error saving admin configuration:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save admin configuration',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// PUT /api/utilities/admin-config/:id - Update admin configuration
router.put('/admin-config/:id', async (req, res) => {
  try {
    const configId = parseInt(req.params.id);
    
    if (isNaN(configId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration ID'
      });
    }
    
    // Validate request body
    const validatedData = insertAdminConfigurationSchema.parse(req.body);
    
    // Update configuration
    const [updatedConfig] = await db
      .update(adminConfiguration)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(adminConfiguration.id, configId))
      .returning();
    
    if (!updatedConfig) {
      return res.status(404).json({
        success: false,
        message: 'Admin configuration not found'
      });
    }
    
    res.json({
      success: true,
      config: updatedConfig,
      message: 'Admin configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating admin configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin configuration',
      error: error.message
    });
  }
});

// DELETE /api/utilities/admin-config/:id - Delete admin configuration
router.delete('/admin-config/:id', async (req, res) => {
  try {
    const configId = parseInt(req.params.id);
    
    if (isNaN(configId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration ID'
      });
    }
    
    // Delete configuration
    const [deletedConfig] = await db
      .delete(adminConfiguration)
      .where(eq(adminConfiguration.id, configId))
      .returning();
    
    if (!deletedConfig) {
      return res.status(404).json({
        success: false,
        message: 'Admin configuration not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Admin configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admin configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete admin configuration'
    });
  }
});

export default router;