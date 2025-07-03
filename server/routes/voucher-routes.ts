import express from 'express';
import { IStorage } from '../storage';
import { generateQrCode, validateQrCode } from '../utils/qr-code-generator';
import { insertStudentVoucherSchema, insertVoucherRedemptionSchema } from '@shared/schema';
import { zodResolver } from '@hookform/resolvers/zod';

export default function registerVoucherRoutes(app: express.Express, storage: IStorage) {
  const router = express.Router();

  // Get all vouchers
  router.get('/vouchers', async (req, res) => {
    try {
      const filters = req.query;
      const vouchers = await storage.getStudentVouchers(filters);
      res.json({ success: true, vouchers });
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch vouchers' });
    }
  });

  // Get a single voucher by ID
  router.get('/vouchers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const voucher = await storage.getStudentVoucherById(parseInt(id));
      
      if (!voucher) {
        return res.status(404).json({ success: false, error: 'Voucher not found' });
      }
      
      res.json({ success: true, voucher });
    } catch (error) {
      console.error(`Error fetching voucher ${req.params.id}:`, error);
      res.status(500).json({ success: false, error: 'Failed to fetch voucher' });
    }
  });

  // Get vouchers by company
  router.get('/companies/:companyId/vouchers', async (req, res) => {
    try {
      const { companyId } = req.params;
      const vouchers = await storage.getStudentVouchersByCompany(parseInt(companyId));
      res.json({ success: true, vouchers });
    } catch (error) {
      console.error(`Error fetching vouchers for company ${req.params.companyId}:`, error);
      res.status(500).json({ success: false, error: 'Failed to fetch vouchers for company' });
    }
  });

  // Get vouchers for current user
  router.get('/users/:userId/vouchers', async (req, res) => {
    try {
      const { userId } = req.params;
      const vouchers = await storage.getStudentVouchersByUser(parseInt(userId));
      res.json({ success: true, vouchers });
    } catch (error) {
      console.error(`Error fetching vouchers for user ${req.params.userId}:`, error);
      res.status(500).json({ success: false, error: 'Failed to fetch vouchers for user' });
    }
  });

  // Create a new voucher
  router.post('/vouchers', async (req, res) => {
    try {
      // Validate request body
      const validationResult = insertStudentVoucherSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid voucher data', 
          details: validationResult.error.errors 
        });
      }
      
      // Create voucher
      const newVoucher = await storage.createStudentVoucher(validationResult.data);
      
      // Generate QR code for the voucher
      try {
        const { qrCodeData, qrCodeImageUrl } = await generateQrCode(newVoucher);
        
        // Update voucher with QR code data
        const updatedVoucher = await storage.updateStudentVoucher(newVoucher.id, {
          qrCodeData,
          qrCodeImage: qrCodeImageUrl
        });
        
        res.status(201).json({ success: true, voucher: updatedVoucher });
      } catch (qrError) {
        console.error('Error generating QR code:', qrError);
        // Still return the voucher even if QR generation failed
        res.status(201).json({ 
          success: true, 
          voucher: newVoucher,
          warning: 'Voucher created but QR code generation failed'
        });
      }
    } catch (error) {
      console.error('Error creating voucher:', error);
      res.status(500).json({ success: false, error: 'Failed to create voucher' });
    }
  });

  // Update a voucher
  router.patch('/vouchers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const voucherId = parseInt(id);
      
      // Get existing voucher
      const existingVoucher = await storage.getStudentVoucherById(voucherId);
      if (!existingVoucher) {
        return res.status(404).json({ success: false, error: 'Voucher not found' });
      }
      
      // Update voucher
      const updatedVoucher = await storage.updateStudentVoucher(voucherId, req.body);
      
      // Regenerate QR code if essential details have changed
      if (
        req.body.title || 
        req.body.description || 
        req.body.redemptionCode ||
        req.body.startDate ||
        req.body.endDate
      ) {
        try {
          const { qrCodeData, qrCodeImageUrl } = await generateQrCode(updatedVoucher!);
          
          // Update voucher with new QR code
          const voucherWithQr = await storage.updateStudentVoucher(voucherId, {
            qrCodeData,
            qrCodeImage: qrCodeImageUrl
          });
          
          res.json({ success: true, voucher: voucherWithQr });
        } catch (qrError) {
          console.error('Error regenerating QR code:', qrError);
          res.json({ 
            success: true, 
            voucher: updatedVoucher,
            warning: 'Voucher updated but QR code regeneration failed'
          });
        }
      } else {
        res.json({ success: true, voucher: updatedVoucher });
      }
    } catch (error) {
      console.error(`Error updating voucher ${req.params.id}:`, error);
      res.status(500).json({ success: false, error: 'Failed to update voucher' });
    }
  });

  // Delete a voucher
  router.delete('/vouchers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteStudentVoucher(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ success: false, error: 'Voucher not found or deletion failed' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error(`Error deleting voucher ${req.params.id}:`, error);
      res.status(500).json({ success: false, error: 'Failed to delete voucher' });
    }
  });

  // Redeem a voucher using QR code
  router.post('/vouchers/redeem', async (req, res) => {
    try {
      const { qrData, userId, redemptionLocation, verificationMethod } = req.body;
      
      if (!qrData || !userId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }
      
      // Validate QR code
      const validationResult = validateQrCode(qrData);
      
      if (!validationResult.isValid) {
        return res.status(400).json({ 
          success: false, 
          error: validationResult.errorMessage || 'Invalid QR code'
        });
      }
      
      // Get voucher
      const voucherId = validationResult.voucherId!;
      const voucher = await storage.getStudentVoucherById(voucherId);
      
      if (!voucher) {
        return res.status(404).json({ success: false, error: 'Voucher not found' });
      }
      
      // Check if voucher is active
      if (voucher.status !== 'active') {
        return res.status(400).json({ 
          success: false, 
          error: `Voucher is not active. Current status: ${voucher.status}`
        });
      }
      
      // Check if voucher has expired
      const now = new Date();
      if (voucher.endDate < now) {
        // Update voucher status to expired
        await storage.updateStudentVoucher(voucherId, { status: 'expired' });
        return res.status(400).json({ success: false, error: 'Voucher has expired' });
      }
      
      // Check if voucher has reached usage limit
      if (voucher.usageLimit && (voucher.usageCount || 0) >= voucher.usageLimit) {
        // Update voucher status to expired
        await storage.updateStudentVoucher(voucherId, { status: 'expired' });
        return res.status(400).json({ success: false, error: 'Voucher has reached its usage limit' });
      }
      
      // Create redemption record
      const redemptionData = {
        voucherId,
        userId,
        redemptionLocation,
        verificationMethod: verificationMethod || 'qr_code',
        verificationCode: JSON.parse(qrData).code || '',
        verified: true
      };
      
      const redemption = await storage.createVoucherRedemption(redemptionData);
      
      // Increment voucher usage count
      const currentUsageCount = voucher.usageCount || 0;
      await storage.updateStudentVoucher(voucherId, { 
        usageCount: currentUsageCount + 1,
        // If the voucher has reached its limit, update status
        ...(voucher.usageLimit && (currentUsageCount + 1 >= voucher.usageLimit) ? 
          { status: 'limited' } : {})
      });
      
      res.json({ 
        success: true, 
        redemption,
        message: 'Voucher successfully redeemed'
      });
    } catch (error) {
      console.error('Error redeeming voucher:', error);
      res.status(500).json({ success: false, error: 'Failed to redeem voucher' });
    }
  });

  // Verify a voucher (without redeeming)
  router.post('/vouchers/verify', async (req, res) => {
    try {
      const { qrData } = req.body;
      
      if (!qrData) {
        return res.status(400).json({ success: false, error: 'Missing QR data' });
      }
      
      // Validate QR code
      const validationResult = validateQrCode(qrData);
      
      if (!validationResult.isValid) {
        return res.status(400).json({ 
          success: false, 
          error: validationResult.errorMessage || 'Invalid QR code'
        });
      }
      
      // Get voucher
      const voucherId = validationResult.voucherId!;
      const voucher = await storage.getStudentVoucherById(voucherId);
      
      if (!voucher) {
        return res.status(404).json({ success: false, error: 'Voucher not found' });
      }
      
      // Check if voucher is active
      if (voucher.status !== 'active') {
        return res.status(400).json({ 
          success: false, 
          error: `Voucher is not active. Current status: ${voucher.status}`
        });
      }
      
      // Check if voucher has expired
      const now = new Date();
      if (voucher.endDate < now) {
        return res.status(400).json({ success: false, error: 'Voucher has expired' });
      }
      
      // Check if voucher has reached usage limit
      if (voucher.usageLimit && (voucher.usageCount || 0) >= voucher.usageLimit) {
        return res.status(400).json({ success: false, error: 'Voucher has reached its usage limit' });
      }
      
      // Return voucher details
      res.json({ 
        success: true, 
        voucher,
        message: 'Voucher is valid and can be redeemed'
      });
    } catch (error) {
      console.error('Error verifying voucher:', error);
      res.status(500).json({ success: false, error: 'Failed to verify voucher' });
    }
  });

  // Save a voucher for a user
  router.post('/users/:userId/saved-vouchers', async (req, res) => {
    try {
      const { userId } = req.params;
      const { voucherId } = req.body;
      
      if (!voucherId) {
        return res.status(400).json({ success: false, error: 'Missing voucher ID' });
      }
      
      // Save voucher
      const savedVoucher = await storage.createSavedVoucher({
        userId: parseInt(userId),
        voucherId: parseInt(voucherId)
      });
      
      res.status(201).json({ success: true, savedVoucher });
    } catch (error) {
      console.error('Error saving voucher:', error);
      res.status(500).json({ success: false, error: 'Failed to save voucher' });
    }
  });

  // Remove a saved voucher
  router.delete('/users/:userId/saved-vouchers/:voucherId', async (req, res) => {
    try {
      const { userId, voucherId } = req.params;
      
      const success = await storage.deleteSavedVoucher({
        userId: parseInt(userId), 
        voucherId: parseInt(voucherId)
      });
      
      if (!success) {
        return res.status(404).json({ success: false, error: 'Saved voucher not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing saved voucher:', error);
      res.status(500).json({ success: false, error: 'Failed to remove saved voucher' });
    }
  });

  // Get saved vouchers for a user
  router.get('/users/:userId/saved-vouchers', async (req, res) => {
    try {
      const { userId } = req.params;
      
      const savedVouchers = await storage.getSavedVouchersByUser(parseInt(userId));
      
      res.json({ success: true, savedVouchers });
    } catch (error) {
      console.error(`Error fetching saved vouchers for user ${req.params.userId}:`, error);
      res.status(500).json({ success: false, error: 'Failed to fetch saved vouchers' });
    }
  });

  // Register router
  app.use('/api', router);
  console.log('[routes] Student voucher routes registered');
}