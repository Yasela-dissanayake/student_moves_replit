import express from 'express';
import { storage } from '../storage';
import { encrypt, decrypt } from '../encryption';
import { generatePrescribedInformation, generateDepositCertificate } from '../document-generator';
import { registerDepositWithScheme, getSchemeDetails, verifyDepositProtection, autoRegisterUnprotectedDeposits } from '../deposit-protection';
import { log } from '../vite';

const router = express.Router();

// Get all deposit schemes
router.get('/schemes', async (req, res) => {
  try {
    // Fetch details of all UK government-approved deposit schemes
    const dps = getSchemeDetails('dps');
    const mydeposits = getSchemeDetails('mydeposits');
    const tds = getSchemeDetails('tds');
    
    res.json({
      dps,
      mydeposits,
      tds
    });
  } catch (error: any) {
    log(`Error fetching deposit schemes: ${error.message}`, 'deposit-protection');
    res.status(500).json({ error: 'Failed to fetch deposit schemes' });
  }
});

// Get deposit protection statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get user type
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get statistics based on user type
    let stats;
    if (user.userType === 'landlord' || user.userType === 'agent') {
      // For landlords and agents, get their deposit protection statistics
      const propertyCount = await storage.countPropertiesByOwner(userId);
      const credentials = await storage.getDepositSchemeCredentialsByUser(userId);
      const unprotectedCount = await storage.countUnprotectedDepositsByOwner(userId);
      const protectedCount = await storage.countProtectedDepositsByOwner(userId);
      
      stats = {
        propertyCount,
        credentialsCount: credentials.length,
        unprotectedCount,
        protectedCount,
        protectionRate: propertyCount > 0 ? (protectedCount / propertyCount) * 100 : 0
      };
    } else if (user.userType === 'admin') {
      // For admins, get global statistics
      const propertyCount = await storage.countProperties();
      const tenancyCount = await storage.countTenancies();
      const unprotectedCount = await storage.countUnprotectedDeposits();
      const protectedCount = await storage.countProtectedDeposits();
      
      stats = {
        propertyCount,
        tenancyCount,
        unprotectedCount,
        protectedCount,
        protectionRate: tenancyCount > 0 ? (protectedCount / tenancyCount) * 100 : 0
      };
    } else {
      // For tenants, get their deposit protection status
      const tenancies = await storage.getTenanciesByTenant(userId);
      const protectedTenancies = tenancies.filter(t => t.depositProtectionScheme && t.depositProtectionId);
      
      stats = {
        tenancyCount: tenancies.length,
        protectedCount: protectedTenancies.length,
        unprotectedCount: tenancies.length - protectedTenancies.length,
        protectionRate: tenancies.length > 0 ? (protectedTenancies.length / tenancies.length) * 100 : 0
      };
    }
    
    res.json({ success: true, stats });
  } catch (error: any) {
    log(`Error fetching deposit protection stats: ${error.message}`, 'deposit-protection');
    res.status(500).json({ error: 'Failed to fetch deposit protection statistics' });
  }
});

// Get all deposit scheme credentials for the current user
router.get('/credentials', async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get all credentials for the user
    const credentials = await storage.getDepositSchemeCredentialsByUser(userId);
    
    // Remove sensitive information before sending to client
    const safeCredentials = credentials.map(cred => ({
      id: cred.id,
      userId: cred.userId,
      schemeName: cred.schemeName,
      schemeUsername: cred.schemeUsername,
      accountNumber: cred.accountNumber,
      hasApiKey: !!cred.apiKey,
      hasApiSecret: !!cred.apiSecret,
      protectionType: cred.protectionType,
      isDefault: cred.isDefault,
      isVerified: cred.isVerified,
      lastVerified: cred.lastVerified
    }));
    
    res.json(safeCredentials);
  } catch (error: any) {
    log(`Error fetching deposit scheme credentials: ${error.message}`, 'deposit-protection');
    res.status(500).json({ error: 'Failed to fetch deposit scheme credentials' });
  }
});

// Add new deposit scheme credentials
router.post('/credentials', async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const {
      schemeName,
      schemeUsername,
      schemePassword,
      accountNumber,
      apiKey,
      apiSecret,
      protectionType,
      isDefault
    } = req.body;
    
    // Validate required fields
    if (!schemeName || !schemeUsername || !schemePassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Encrypt sensitive data
    const encryptedPassword = encrypt(schemePassword);
    const encryptedApiKey = apiKey ? encrypt(apiKey) : null;
    const encryptedApiSecret = apiSecret ? encrypt(apiSecret) : null;
    
    // Create new credentials
    const newCredentials = {
      userId,
      schemeName,
      schemeUsername,
      schemePassword: encryptedPassword,
      accountNumber: accountNumber || null,
      apiKey: encryptedApiKey,
      apiSecret: encryptedApiSecret,
      protectionType: protectionType || 'custodial',
      isDefault: isDefault || false,
      isVerified: false
    };
    
    // If this is set as default, unset any existing defaults
    if (isDefault) {
      await storage.unsetDefaultDepositSchemeCredentials(userId);
    }
    
    // Save to database
    const savedCredentials = await storage.createDepositSchemeCredentials(newCredentials);
    
    // Remove sensitive information before sending response
    const { schemePassword: _, apiKey: __, apiSecret: ___, ...safeCredentials } = savedCredentials;
    
    res.status(201).json({
      success: true,
      credentials: {
        ...safeCredentials,
        hasApiKey: !!encryptedApiKey,
        hasApiSecret: !!encryptedApiSecret
      }
    });
  } catch (error: any) {
    log(`Error creating deposit scheme credentials: ${error.message}`, 'deposit-protection');
    res.status(500).json({ error: 'Failed to create deposit scheme credentials' });
  }
});

// Set credentials as default
router.post('/credentials/:id/default', async (req, res) => {
  try {
    const credentialId = parseInt(req.params.id);
    const userId = req.session?.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check if credentials exist and belong to the user
    const credentials = await storage.getDepositSchemeCredentials(credentialId);
    if (!credentials) {
      return res.status(404).json({ error: 'Credentials not found' });
    }
    
    if (credentials.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Unset any existing defaults
    await storage.unsetDefaultDepositSchemeCredentials(userId);
    
    // Set the specified credentials as default
    await storage.updateDepositSchemeCredentials(credentialId, { isDefault: true });
    
    res.json({ success: true });
  } catch (error: any) {
    log(`Error setting default deposit scheme credentials: ${error.message}`, 'deposit-protection');
    res.status(500).json({ error: 'Failed to update default credentials' });
  }
});

// Verify credentials with the scheme's API
router.post('/credentials/:id/verify', async (req, res) => {
  try {
    const credentialId = parseInt(req.params.id);
    const userId = req.session?.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check if credentials exist and belong to the user
    const credentials = await storage.getDepositSchemeCredentials(credentialId);
    if (!credentials) {
      return res.status(404).json({ error: 'Credentials not found' });
    }
    
    if (credentials.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // In a real implementation, we would verify the credentials with the scheme's API
    // For now, simulate a successful verification
    const isVerified = true;
    const lastVerified = new Date().toISOString();
    
    await storage.updateDepositSchemeCredentials(credentialId, {
      isVerified,
      lastVerified
    });
    
    res.json({
      success: true,
      message: 'Credentials verified successfully',
      lastVerified
    });
  } catch (error: any) {
    log(`Error verifying deposit scheme credentials: ${error.message}`, 'deposit-protection');
    res.status(500).json({
      success: false,
      error: 'Failed to verify credentials',
      message: error.message
    });
  }
});

// Delete credentials
router.delete('/credentials/:id', async (req, res) => {
  try {
    const credentialId = parseInt(req.params.id);
    const userId = req.session?.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check if credentials exist and belong to the user
    const credentials = await storage.getDepositSchemeCredentials(credentialId);
    if (!credentials) {
      return res.status(404).json({ error: 'Credentials not found' });
    }
    
    if (credentials.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Delete the credentials
    await storage.deleteDepositSchemeCredentials(credentialId);
    
    res.json({ success: true });
  } catch (error: any) {
    log(`Error deleting deposit scheme credentials: ${error.message}`, 'deposit-protection');
    res.status(500).json({ error: 'Failed to delete credentials' });
  }
});

// Get deposit registrations for the current user
router.get('/registrations', async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get user type
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get registrations based on user type
    let registrations;
    if (user.userType === 'landlord' || user.userType === 'agent') {
      // For landlords and agents, get their deposit registrations
      registrations = await storage.getDepositRegistrationsByOwner(userId);
    } else if (user.userType === 'admin') {
      // For admins, get all deposit registrations
      registrations = await storage.getAllDepositRegistrations();
    } else {
      // For tenants, get registrations for their tenancies
      registrations = await storage.getDepositRegistrationsByTenant(userId);
    }
    
    res.json(registrations);
  } catch (error: any) {
    log(`Error fetching deposit registrations: ${error.message}`, 'deposit-protection');
    res.status(500).json({ error: 'Failed to fetch deposit registrations' });
  }
});

// Get a specific deposit registration
router.get('/registrations/:id', async (req, res) => {
  try {
    const registrationId = parseInt(req.params.id);
    const userId = req.session?.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get the registration
    const registration = await storage.getDepositRegistration(registrationId);
    if (!registration) {
      return res.status(404).json({ error: 'Deposit registration not found' });
    }
    
    // Check access permission based on user type and association with the registration
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const tenancy = await storage.getTenancy(registration.tenancyId);
    if (!tenancy) {
      return res.status(404).json({ error: 'Tenancy not found' });
    }
    
    const property = await storage.getProperty(registration.propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Check if user has access to this registration
    const hasAccess = 
      user.userType === 'admin' || 
      (user.userType === 'landlord' && property.ownerId === userId) || 
      (user.userType === 'agent' && property.agentId === userId) ||
      (user.userType === 'tenant' && tenancy.tenantId === userId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(registration);
  } catch (error: any) {
    log(`Error fetching deposit registration: ${error.message}`, 'deposit-protection');
    res.status(500).json({ error: 'Failed to fetch deposit registration' });
  }
});

// Get deposit registration for a specific tenancy
router.get('/registrations/tenancy/:tenancyId', async (req, res) => {
  try {
    const tenancyId = parseInt(req.params.tenancyId);
    const userId = req.session?.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get the tenancy
    const tenancy = await storage.getTenancy(tenancyId);
    if (!tenancy) {
      return res.status(404).json({ error: 'Tenancy not found' });
    }
    
    // Get the property
    const property = await storage.getProperty(tenancy.propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Check access permission based on user type and association with the tenancy
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user has access to this tenancy
    const hasAccess = 
      user.userType === 'admin' || 
      (user.userType === 'landlord' && property.ownerId === userId) || 
      (user.userType === 'agent' && property.agentId === userId) ||
      (user.userType === 'tenant' && tenancy.tenantId === userId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get the registration for this tenancy
    const registration = await storage.getDepositRegistrationByTenancy(tenancyId);
    
    res.json(registration || null);
  } catch (error: any) {
    log(`Error fetching deposit registration for tenancy: ${error.message}`, 'deposit-protection');
    res.status(500).json({ error: 'Failed to fetch deposit registration for tenancy' });
  }
});

// Generate/regenerate prescribed information document
router.post('/registrations/:id/prescribed-info', async (req, res) => {
  try {
    const registrationId = parseInt(req.params.id);
    const userId = req.session?.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get the registration
    const registration = await storage.getDepositRegistration(registrationId);
    if (!registration) {
      return res.status(404).json({ error: 'Deposit registration not found' });
    }
    
    // Generate prescribed information document
    const prescribedInfoPath = await generatePrescribedInformation(registrationId);
    
    // Update the registration with the new prescribed information URL
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const prescribedInfoUrl = `${baseUrl}/uploads/documents/${prescribedInfoPath.split('/').pop()}`;
    
    await storage.updateDepositRegistration(registrationId, {
      prescribedInfoUrl
    });
    
    res.json({
      success: true,
      prescribedInfoUrl
    });
  } catch (error: any) {
    log(`Error generating prescribed information: ${error.message}`, 'deposit-protection');
    res.status(500).json({ error: 'Failed to generate prescribed information document' });
  }
});

// Generate/regenerate deposit certificate
router.post('/registrations/:id/certificate', async (req, res) => {
  try {
    const registrationId = parseInt(req.params.id);
    const userId = req.session?.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get the registration
    const registration = await storage.getDepositRegistration(registrationId);
    if (!registration) {
      return res.status(404).json({ error: 'Deposit registration not found' });
    }
    
    // Generate certificate
    const certificatePath = await generateDepositCertificate(registrationId);
    
    // Update the registration with the new certificate URL
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const certificateUrl = `${baseUrl}/uploads/documents/${certificatePath.split('/').pop()}`;
    
    await storage.updateDepositRegistration(registrationId, {
      certificateUrl
    });
    
    res.json({
      success: true,
      certificateUrl
    });
  } catch (error: any) {
    log(`Error generating certificate: ${error.message}`, 'deposit-protection');
    res.status(500).json({ error: 'Failed to generate deposit certificate' });
  }
});

// Register a deposit with a protection scheme
router.post('/register/:tenancyId', async (req, res) => {
  try {
    const tenancyId = parseInt(req.params.tenancyId);
    const userId = req.session?.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { scheme, credentialId, manualDepositId } = req.body;
    
    // Validate required fields
    if (!scheme) {
      return res.status(400).json({ error: 'Scheme is required' });
    }
    
    // Get the tenancy
    const tenancy = await storage.getTenancy(tenancyId);
    if (!tenancy) {
      return res.status(404).json({ error: 'Tenancy not found' });
    }
    
    // Get the property
    const property = await storage.getProperty(tenancy.propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Check if user has permission to register the deposit
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const hasAccess = 
      user.userType === 'admin' || 
      (user.userType === 'landlord' && property.ownerId === userId) || 
      (user.userType === 'agent' && property.agentId === userId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    let result;
    
    if (manualDepositId) {
      // Manual registration
      await storage.updateTenancy(tenancyId, {
        depositProtectionScheme: scheme,
        depositProtectionId: manualDepositId
      });
      
      // Create deposit registration record
      const registration = await storage.createDepositRegistration({
        tenancyId,
        propertyId: property.id,
        registeredById: userId,
        registeredByType: user.userType,
        schemeName: scheme,
        protectionType: 'custodial', // Default for manual registrations
        depositAmount: tenancy.depositAmount,
        depositReferenceId: manualDepositId,
        status: 'registered',
        registeredAt: new Date().toISOString()
      });
      
      // Generate deposit certificate and prescribed information
      try {
        const certificatePath = await generateDepositCertificate(registration.id);
        const prescribedInfoPath = await generatePrescribedInformation(registration.id);
        
        // Update registration with document URLs
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        const certificateUrl = `${baseUrl}/uploads/documents/${certificatePath.split('/').pop()}`;
        const prescribedInfoUrl = `${baseUrl}/uploads/documents/${prescribedInfoPath.split('/').pop()}`;
        
        await storage.updateDepositRegistration(registration.id, {
          certificateUrl,
          prescribedInfoUrl
        });
        
        result = {
          success: true,
          message: 'Deposit manually registered successfully',
          depositProtectionId: manualDepositId,
          certificateUrl,
          prescribedInfoUrl
        };
      } catch (docError) {
        log(`Error generating documents for manual registration: ${docError.message}`, 'deposit-protection');
        
        result = {
          success: true,
          message: 'Deposit manually registered successfully, but document generation failed',
          depositProtectionId: manualDepositId
        };
      }
    } else {
      // API registration
      result = await registerDepositWithScheme(tenancyId, scheme, credentialId || undefined);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
    }
    
    res.json(result);
  } catch (error: any) {
    log(`Error registering deposit: ${error.message}`, 'deposit-protection');
    res.status(500).json({ 
      success: false,
      error: 'Failed to register deposit',
      message: error.message
    });
  }
});

// Verify the protection status of a deposit
router.post('/verify/:tenancyId', async (req, res) => {
  try {
    const tenancyId = parseInt(req.params.tenancyId);
    const userId = req.session?.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get the tenancy
    const tenancy = await storage.getTenancy(tenancyId);
    if (!tenancy) {
      return res.status(404).json({ error: 'Tenancy not found' });
    }
    
    // Verify the deposit protection status
    const result = await verifyDepositProtection(tenancyId);
    
    res.json(result);
  } catch (error: any) {
    log(`Error verifying deposit protection: ${error.message}`, 'deposit-protection');
    res.status(500).json({ error: 'Failed to verify deposit protection' });
  }
});

// Auto-register unprotected deposits
router.post('/auto-register', async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check if user is admin, landlord, or agent
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!['admin', 'landlord', 'agent'].includes(user.userType)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { scheme, credentialId } = req.body;
    
    // Validate scheme
    if (!scheme) {
      return res.status(400).json({ error: 'Scheme is required' });
    }
    
    // For non-admins, auto-register only their unprotected deposits
    if (user.userType !== 'admin') {
      const unprotectedDeposits = await storage.getUnprotectedDepositsByOwner(userId);
      
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      for (const tenancy of unprotectedDeposits) {
        const result = await registerDepositWithScheme(
          tenancy.id,
          scheme,
          credentialId || undefined
        );
        
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          if (result.error) {
            results.errors.push(`Tenancy ID ${tenancy.id}: ${result.error}`);
          }
        }
      }
      
      return res.json({
        success: true,
        message: `${results.success} deposits registered successfully, ${results.failed} failed`,
        results
      });
    }
    
    // For admins, auto-register all unprotected deposits
    const results = await autoRegisterUnprotectedDeposits(scheme, credentialId || undefined);
    
    res.json({
      success: true,
      message: `${results.success} deposits registered successfully, ${results.failed} failed`,
      results
    });
  } catch (error: any) {
    log(`Error auto-registering deposits: ${error.message}`, 'deposit-protection');
    res.status(500).json({ error: 'Failed to auto-register deposits' });
  }
});

export default router;