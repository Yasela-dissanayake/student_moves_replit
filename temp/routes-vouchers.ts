import express from 'express';
import { IStorage } from './storage';
import { checkAuth } from './auth';
import { z } from 'zod';
import { insertVoucherCompanySchema, insertStudentVoucherSchema, insertVoucherRedemptionSchema, insertVoucherBookingSchema, insertSavedVoucherSchema } from '@shared/schema';
import * as CustomAIProvider from './custom-ai-provider';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';

// Set up multer storage for voucher images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/vouchers';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'voucher-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WEBP are allowed.') as any);
    }
  }
});

export default function setupVoucherRoutes(app: express.Application, storage: IStorage, customAI: typeof CustomAIProvider) {
  const router = express.Router();

  // === VOUCHER COMPANY ROUTES ===
  
  // Get all voucher companies (public)
  router.get('/companies/public', async (req, res) => {
    try {
      const companies = await storage.getVoucherCompanies({
        verified: true
      });
      
      return res.json({
        success: true,
        companies
      });
    } catch (error) {
      console.error('Error getting voucher companies:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching voucher companies.'
      });
    }
  });

  // Get all voucher companies (admin)
  router.get('/companies', checkAuth(['admin']), async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const filter = status ? { status } : {};
      
      const companies = await storage.getVoucherCompanies(filter);
      
      return res.json({
        success: true,
        companies
      });
    } catch (error) {
      console.error('Error getting voucher companies:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching voucher companies.'
      });
    }
  });

  // Get a specific voucher company
  router.get('/companies/:id', async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      if (isNaN(companyId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid company ID.'
        });
      }

      const company = await storage.getVoucherCompanyById(companyId);
      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Voucher company not found.'
        });
      }

      // For public requests, only return verified companies
      if (!req.session.userId && !company.verified) {
        return res.status(404).json({
          success: false,
          message: 'Voucher company not found.'
        });
      }

      return res.json({
        success: true,
        company
      });
    } catch (error) {
      console.error('Error getting voucher company:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching the voucher company.'
      });
    }
  });

  // Create a new voucher company
  router.post('/companies', checkAuth(), upload.single('logo'), async (req, res) => {
    try {
      // Parse and validate request body
      const parsedData = insertVoucherCompanySchema.safeParse({
        ...req.body,
        categories: req.body.categories ? JSON.parse(req.body.categories) : [],
        operatingHours: req.body.operatingHours ? JSON.parse(req.body.operatingHours) : null
      });

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid data provided.',
          errors: parsedData.error.errors
        });
      }

      // Add file path if logo was uploaded
      const logoPath = req.file ? `/uploads/vouchers/${req.file.filename}` : undefined;
      const companyData = {
        ...parsedData.data,
        logo: logoPath,
        ownerId: req.session.userId
      };

      // Verify company using AI
      if (customAI.isAvailable()) {
        try {
          // Perform AI verification of the company details
          const verificationData = {
            name: companyData.name,
            description: companyData.description,
            businessType: companyData.businessType,
            website: companyData.website,
            companyNumber: companyData.companyNumber,
            establishedYear: companyData.establishedYear
          };

          const verificationResult = await customAI.analyzeText({
            text: JSON.stringify(verificationData),
            task: 'verify_business',
            maxLength: 500
          });

          // Parse AI result
          const aiResult = JSON.parse(verificationResult);
          
          companyData.aiVerified = aiResult.verified;
          companyData.aiVerificationScore = aiResult.confidenceScore;
          companyData.aiVerificationDetails = aiResult;
          
          // If high confidence score, auto-verify
          if (aiResult.confidenceScore > 0.85) {
            companyData.verified = true;
          }
        } catch (aiError) {
          console.error('AI verification error:', aiError);
          // Continue without AI verification if it fails
        }
      }

      // Create the company
      const newCompany = await storage.createVoucherCompany(companyData);

      return res.status(201).json({
        success: true,
        company: newCompany,
        message: 'Voucher company created successfully.'
      });
    } catch (error) {
      console.error('Error creating voucher company:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while creating the voucher company.'
      });
    }
  });

  // Update a voucher company
  router.patch('/companies/:id', checkAuth(), upload.single('logo'), async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      if (isNaN(companyId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid company ID.'
        });
      }

      // Check if company exists
      const existingCompany = await storage.getVoucherCompanyById(companyId);
      if (!existingCompany) {
        return res.status(404).json({
          success: false,
          message: 'Voucher company not found.'
        });
      }

      // Check ownership or admin status
      if (existingCompany.ownerId !== req.session.userId && req.session.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this company.'
        });
      }

      // Parse request data
      const updateData: any = { ...req.body };
      
      // Parse JSON fields if they're provided as strings
      if (typeof updateData.categories === 'string') {
        updateData.categories = JSON.parse(updateData.categories);
      }
      
      if (typeof updateData.operatingHours === 'string') {
        updateData.operatingHours = JSON.parse(updateData.operatingHours);
      }

      // Add logo path if uploaded
      if (req.file) {
        updateData.logo = `/uploads/vouchers/${req.file.filename}`;
      }

      // Update timestamp
      updateData.updatedAt = new Date();

      // Update company
      const updatedCompany = await storage.updateVoucherCompany(companyId, updateData);

      return res.json({
        success: true,
        company: updatedCompany,
        message: 'Voucher company updated successfully.'
      });
    } catch (error) {
      console.error('Error updating voucher company:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while updating the voucher company.'
      });
    }
  });

  // Admin verify a voucher company
  router.post('/companies/:id/verify', checkAuth(['admin']), async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      if (isNaN(companyId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid company ID.'
        });
      }

      // Check if company exists
      const existingCompany = await storage.getVoucherCompanyById(companyId);
      if (!existingCompany) {
        return res.status(404).json({
          success: false,
          message: 'Voucher company not found.'
        });
      }

      // Update verification status
      const updatedCompany = await storage.updateVoucherCompany(companyId, {
        verified: true,
        adminVerified: true,
        adminVerifiedBy: req.session.userId,
        adminVerifiedAt: new Date(),
        updatedAt: new Date()
      });

      return res.json({
        success: true,
        company: updatedCompany,
        message: 'Voucher company verified successfully.'
      });
    } catch (error) {
      console.error('Error verifying voucher company:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while verifying the voucher company.'
      });
    }
  });

  // Create a dedicated public API endpoint for vouchers
  app.get('/api/public-vouchers', async (req, res) => {
    try {
      // Set content type to application/json
      res.setHeader('Content-Type', 'application/json');
      
      // Filter for active vouchers only
      const filters = { status: 'active' };
      
      // Get current date for valid vouchers
      const now = new Date();
      
      // Fetch vouchers
      const vouchers = await storage.getStudentVouchers(filters);
      
      console.log(`Public API: Found ${vouchers.length} initial vouchers`);
      
      // Prepare an array to hold the enhanced vouchers
      const validVouchers = [];
      
      // Process each voucher sequentially to avoid any issues with async mapping
      for (const voucher of vouchers) {
        // Skip expired vouchers
        if (new Date(voucher.endDate) <= now) {
          continue;
        }
        
        try {
          // Get company info
          const company = await storage.getVoucherCompanyById(voucher.companyId);
          
          // Add to valid vouchers
          validVouchers.push({
            id: voucher.id,
            title: voucher.title,
            description: voucher.description,
            type: voucher.type,
            discountPercentage: voucher.discountPercentage,
            discountAmount: voucher.discountAmount,
            startDate: voucher.startDate,
            endDate: voucher.endDate,
            images: voucher.images,
            qrCodeImage: voucher.qrCodeImage,
            company: company ? {
              id: company.id,
              name: company.name,
              logo: company.logo,
              businessType: company.businessType
            } : null
          });
        } catch (err) {
          console.error(`Error processing voucher ${voucher.id}:`, err);
        }
      }
      
      console.log(`API Endpoint: Returning ${validVouchers.length} public vouchers`);
      
      // Return JSON data
      return res.json({
        success: true,
        vouchers: validVouchers
      });
    } catch (error) {
      console.error('Error in public API vouchers endpoint:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching vouchers.'
      });
    }
  });
  
  // === STUDENT VOUCHER ROUTES ===

  // Get all vouchers (public)
  router.get('/public', async (req, res) => {
    try {
      // Set the content type
      res.setHeader('Content-Type', 'application/json');
      
      // Filter options
      const filters: any = {
        status: 'active', // Only active vouchers for public
        ...(req.query.type && { type: req.query.type }),
        ...(req.query.company && { companyId: parseInt(req.query.company as string) })
      };

      // Get current date for valid vouchers
      const now = new Date();
      
      // Fetch vouchers with their company details
      const vouchers = await storage.getStudentVouchers(filters);
      
      // Filter out expired vouchers and enrich with company data
      const validVouchers = await Promise.all(
        vouchers
          .filter(v => new Date(v.endDate) > now)
          .map(async (voucher) => {
            const company = await storage.getVoucherCompanyById(voucher.companyId);
            return {
              ...voucher,
              company: company ? {
                id: company.id,
                name: company.name,
                logo: company.logo,
                businessType: company.businessType,
                categories: company.categories,
                allowsBookings: company.allowsBookings
              } : null
            };
          })
      );

      // Log the response for debugging
      console.log(`Returning ${validVouchers.length} vouchers in public endpoint`);
      
      return res.json({
        success: true,
        vouchers: validVouchers
      });
    } catch (error) {
      console.error('Error getting vouchers:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching vouchers.'
      });
    }
  });

  // Get all vouchers (admin)
  router.get('/', checkAuth(['admin']), async (req, res) => {
    try {
      // Filter options
      const filters: any = {
        ...(req.query.status && { status: req.query.status }),
        ...(req.query.type && { type: req.query.type }),
        ...(req.query.company && { companyId: parseInt(req.query.company as string) })
      };
      
      // Fetch vouchers
      const vouchers = await storage.getStudentVouchers(filters);
      
      // Enrich with company data
      const enrichedVouchers = await Promise.all(
        vouchers.map(async (voucher) => {
          const company = await storage.getVoucherCompanyById(voucher.companyId);
          return {
            ...voucher,
            company: company ? {
              id: company.id,
              name: company.name,
              logo: company.logo
            } : null
          };
        })
      );

      return res.json({
        success: true,
        vouchers: enrichedVouchers
      });
    } catch (error) {
      console.error('Error getting vouchers:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching vouchers.'
      });
    }
  });

  // Get a specific voucher
  router.get('/:id', async (req, res) => {
    try {
      const voucherId = parseInt(req.params.id);
      if (isNaN(voucherId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid voucher ID.'
        });
      }

      const voucher = await storage.getStudentVoucherById(voucherId);
      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: 'Voucher not found.'
        });
      }

      // For public requests, only return active vouchers
      if (!req.session.userId && voucher.status !== 'active') {
        return res.status(404).json({
          success: false,
          message: 'Voucher not found.'
        });
      }

      // Get company details
      const company = await storage.getVoucherCompanyById(voucher.companyId);

      return res.json({
        success: true,
        voucher: {
          ...voucher,
          company: company ? {
            id: company.id,
            name: company.name,
            logo: company.logo,
            address: company.address,
            city: company.city,
            postcode: company.postcode,
            phone: company.phone,
            email: company.email,
            website: company.website,
            businessType: company.businessType,
            categories: company.categories,
            allowsBookings: company.allowsBookings,
            operatingHours: company.operatingHours,
            averageRating: company.averageRating
          } : null
        }
      });
    } catch (error) {
      console.error('Error getting voucher:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching the voucher.'
      });
    }
  });

  // Create a new voucher
  router.post('/', checkAuth(), upload.array('images', 5), async (req, res) => {
    try {
      const companyId = parseInt(req.body.companyId);
      if (isNaN(companyId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid company ID.'
        });
      }

      // Check if company exists and user has permission
      const company = await storage.getVoucherCompanyById(companyId);
      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Voucher company not found.'
        });
      }

      // Check if user owns the company or is an admin
      if (company.ownerId !== req.session.userId && req.session.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to create vouchers for this company.'
        });
      }

      // Parse and validate request body
      const parsedData = insertStudentVoucherSchema.safeParse({
        ...req.body,
        exclusiveTo: req.body.exclusiveTo ? JSON.parse(req.body.exclusiveTo) : [],
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate)
      });

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid data provided.',
          errors: parsedData.error.errors
        });
      }

      // Add image paths if images were uploaded
      const imagePaths = (req.files as Express.Multer.File[]).map(file => `/uploads/vouchers/${file.filename}`);
      
      // Generate QR code data
      const qrData = {
        id: uuidv4(),
        voucherId: 0, // Will be updated after voucher is created
        companyId,
        type: parsedData.data.type,
        discountPercentage: parsedData.data.discountPercentage,
        discountAmount: parsedData.data.discountAmount,
        validUntil: parsedData.data.endDate.toISOString()
      };
      
      // Generate QR code image
      const qrCodePath = `/uploads/vouchers/qr-${qrData.id}.png`;
      const qrCodeFullPath = path.join(process.cwd(), 'uploads', 'vouchers', `qr-${qrData.id}.png`);
      
      // Ensure directory exists
      const dir = path.dirname(qrCodeFullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      await QRCode.toFile(qrCodeFullPath, JSON.stringify(qrData));

      // Create voucher data
      const voucherData = {
        ...parsedData.data,
        images: imagePaths,
        qrCodeData: JSON.stringify(qrData),
        qrCodeImage: qrCodePath,
        // Set initial status based on company verification
        status: company.verified ? 'active' : 'pending_verification'
      };

      // Verify voucher using AI
      if (customAI.isAvailable() && req.session.userType !== 'admin') {
        try {
          // Perform AI verification of the voucher
          const verificationData = {
            companyName: company.name,
            voucherTitle: voucherData.title,
            voucherDescription: voucherData.description,
            voucherType: voucherData.type,
            discountAmount: voucherData.discountAmount,
            discountPercentage: voucherData.discountPercentage,
            termsAndConditions: voucherData.termsAndConditions
          };

          const verificationResult = await customAI.analyzeText({
            text: JSON.stringify(verificationData),
            task: 'verify_voucher',
            maxLength: 500
          });

          // Parse AI result
          const aiResult = JSON.parse(verificationResult);
          
          voucherData.aiVerified = aiResult.verified;
          voucherData.aiVerificationScore = aiResult.confidenceScore;
          voucherData.aiVerificationDetails = aiResult;
          
          // If high confidence score and company is verified, auto-verify
          if (aiResult.confidenceScore > 0.85 && company.verified) {
            voucherData.status = 'active';
          }
        } catch (aiError) {
          console.error('AI verification error:', aiError);
          // Continue without AI verification if it fails
        }
      } else if (req.session.userType === 'admin') {
        // Admins can create pre-verified vouchers
        voucherData.aiVerified = true;
        voucherData.adminVerified = true;
        voucherData.status = 'active';
      }

      // Create the voucher
      const newVoucher = await storage.createStudentVoucher(voucherData);
      
      // Update QR code with the actual voucher ID
      qrData.voucherId = newVoucher.id;
      await storage.updateStudentVoucher(newVoucher.id, {
        qrCodeData: JSON.stringify(qrData)
      });

      return res.status(201).json({
        success: true,
        voucher: newVoucher,
        message: 'Voucher created successfully.'
      });
    } catch (error) {
      console.error('Error creating voucher:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while creating the voucher.'
      });
    }
  });

  // Update a voucher
  router.patch('/:id', checkAuth(), upload.array('images', 5), async (req, res) => {
    try {
      const voucherId = parseInt(req.params.id);
      if (isNaN(voucherId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid voucher ID.'
        });
      }

      // Check if voucher exists
      const existingVoucher = await storage.getStudentVoucherById(voucherId);
      if (!existingVoucher) {
        return res.status(404).json({
          success: false,
          message: 'Voucher not found.'
        });
      }

      // Check ownership or admin status
      const company = await storage.getVoucherCompanyById(existingVoucher.companyId);
      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Voucher company not found.'
        });
      }

      if (company.ownerId !== req.session.userId && req.session.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this voucher.'
        });
      }

      // Parse request data
      const updateData: any = { ...req.body };
      
      // Parse date fields if provided
      if (updateData.startDate) {
        updateData.startDate = new Date(updateData.startDate);
      }
      
      if (updateData.endDate) {
        updateData.endDate = new Date(updateData.endDate);
      }
      
      // Parse JSON fields if they're provided as strings
      if (typeof updateData.exclusiveTo === 'string') {
        updateData.exclusiveTo = JSON.parse(updateData.exclusiveTo);
      }

      // Add image paths if uploaded
      if (req.files && (req.files as Express.Multer.File[]).length > 0) {
        const newImagePaths = (req.files as Express.Multer.File[]).map(file => `/uploads/vouchers/${file.filename}`);
        
        // Combine with existing images or replace if indicated
        if (updateData.replaceImages === 'true') {
          updateData.images = newImagePaths;
        } else {
          updateData.images = [...(existingVoucher.images || []), ...newImagePaths];
        }
      }

      // Update timestamp
      updateData.updatedAt = new Date();

      // Update voucher
      const updatedVoucher = await storage.updateStudentVoucher(voucherId, updateData);

      return res.json({
        success: true,
        voucher: updatedVoucher,
        message: 'Voucher updated successfully.'
      });
    } catch (error) {
      console.error('Error updating voucher:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while updating the voucher.'
      });
    }
  });

  // Verify a voucher (admin)
  router.post('/:id/verify', checkAuth(['admin']), async (req, res) => {
    try {
      const voucherId = parseInt(req.params.id);
      if (isNaN(voucherId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid voucher ID.'
        });
      }

      // Check if voucher exists
      const existingVoucher = await storage.getStudentVoucherById(voucherId);
      if (!existingVoucher) {
        return res.status(404).json({
          success: false,
          message: 'Voucher not found.'
        });
      }

      // Update verification status
      const updatedVoucher = await storage.updateStudentVoucher(voucherId, {
        status: 'active',
        adminVerified: true,
        updatedAt: new Date()
      });

      return res.json({
        success: true,
        voucher: updatedVoucher,
        message: 'Voucher verified successfully.'
      });
    } catch (error) {
      console.error('Error verifying voucher:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while verifying the voucher.'
      });
    }
  });

  // Reject a voucher (admin)
  router.post('/:id/reject', checkAuth(['admin']), async (req, res) => {
    try {
      const voucherId = parseInt(req.params.id);
      if (isNaN(voucherId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid voucher ID.'
        });
      }

      // Check if voucher exists
      const existingVoucher = await storage.getStudentVoucherById(voucherId);
      if (!existingVoucher) {
        return res.status(404).json({
          success: false,
          message: 'Voucher not found.'
        });
      }

      // Update verification status
      const updatedVoucher = await storage.updateStudentVoucher(voucherId, {
        status: 'rejected',
        updatedAt: new Date()
      });

      return res.json({
        success: true,
        voucher: updatedVoucher,
        message: 'Voucher rejected successfully.'
      });
    } catch (error) {
      console.error('Error rejecting voucher:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while rejecting the voucher.'
      });
    }
  });

  // === VOUCHER REDEMPTION ROUTES ===

  // Redeem a voucher
  router.post('/:id/redeem', checkAuth(), async (req, res) => {
    try {
      const voucherId = parseInt(req.params.id);
      if (isNaN(voucherId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid voucher ID.'
        });
      }

      // Check if voucher exists and is active
      const voucher = await storage.getStudentVoucherById(voucherId);
      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: 'Voucher not found.'
        });
      }

      if (voucher.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'This voucher is not active and cannot be redeemed.'
        });
      }

      // Check for usage limits
      if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
        return res.status(400).json({
          success: false,
          message: 'This voucher has reached its usage limit.'
        });
      }

      // Check if user has already used this voucher up to its limit
      const userRedemptions = await storage.getVoucherRedemptionsByUser(req.session.userId, voucherId);
      if (voucher.userUsageLimit && userRedemptions.length >= voucher.userUsageLimit) {
        return res.status(400).json({
          success: false,
          message: `You have already redeemed this voucher the maximum number of times (${voucher.userUsageLimit}).`
        });
      }

      // Check if voucher has expired
      const now = new Date();
      if (new Date(voucher.endDate) < now) {
        return res.status(400).json({
          success: false,
          message: 'This voucher has expired.'
        });
      }

      // Parse and validate request body
      const parsedData = insertVoucherRedemptionSchema.safeParse({
        ...req.body,
        voucherId,
        userId: req.session.userId
      });

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid data provided.',
          errors: parsedData.error.errors
        });
      }

      // Create redemption record
      const redemptionData = {
        ...parsedData.data,
        verified: req.body.verificationMethod === 'qr_code' || req.session.userType === 'admin'
      };

      const redemption = await storage.createVoucherRedemption(redemptionData);

      // Update voucher usage count
      await storage.updateStudentVoucher(voucherId, {
        usageCount: (voucher.usageCount || 0) + 1,
        updatedAt: new Date()
      });

      return res.status(201).json({
        success: true,
        redemption,
        message: 'Voucher redeemed successfully.'
      });
    } catch (error) {
      console.error('Error redeeming voucher:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while redeeming the voucher.'
      });
    }
  });

  // Get user's voucher redemptions
  router.get('/redemptions', checkAuth(), async (req, res) => {
    try {
      const redemptions = await storage.getVoucherRedemptionsByUser(req.session.userId);
      
      // Enrich with voucher and company data
      const enrichedRedemptions = await Promise.all(
        redemptions.map(async (redemption) => {
          const voucher = await storage.getStudentVoucherById(redemption.voucherId);
          let company = null;
          
          if (voucher) {
            company = await storage.getVoucherCompanyById(voucher.companyId);
          }
          
          return {
            ...redemption,
            voucher: voucher ? {
              id: voucher.id,
              title: voucher.title,
              type: voucher.type,
              discountPercentage: voucher.discountPercentage,
              discountAmount: voucher.discountAmount,
              endDate: voucher.endDate
            } : null,
            company: company ? {
              id: company.id,
              name: company.name,
              logo: company.logo
            } : null
          };
        })
      );

      return res.json({
        success: true,
        redemptions: enrichedRedemptions
      });
    } catch (error) {
      console.error('Error getting redemptions:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching redemptions.'
      });
    }
  });

  // === VOUCHER BOOKING ROUTES ===

  // Create a booking for a voucher
  router.post('/:id/book', checkAuth(), async (req, res) => {
    try {
      const voucherId = parseInt(req.params.id);
      if (isNaN(voucherId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid voucher ID.'
        });
      }

      // Check if voucher exists and is active
      const voucher = await storage.getStudentVoucherById(voucherId);
      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: 'Voucher not found.'
        });
      }

      if (voucher.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'This voucher is not active and cannot be booked.'
        });
      }

      // Check if company allows bookings
      const company = await storage.getVoucherCompanyById(voucher.companyId);
      if (!company || !company.allowsBookings) {
        return res.status(400).json({
          success: false,
          message: 'This company does not accept bookings.'
        });
      }

      // Parse and validate request body
      const parsedData = insertVoucherBookingSchema.safeParse({
        ...req.body,
        voucherId,
        userId: req.session.userId,
        bookingDate: new Date(req.body.bookingDate)
      });

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid data provided.',
          errors: parsedData.error.errors
        });
      }

      // Check if booking date is valid (after current date + lead time)
      const now = new Date();
      const minimumBookingTime = new Date(now.getTime() + (company.bookingLeadHours || 24) * 60 * 60 * 1000);
      
      if (parsedData.data.bookingDate < minimumBookingTime) {
        return res.status(400).json({
          success: false,
          message: `Bookings must be made at least ${company.bookingLeadHours || 24} hours in advance.`
        });
      }

      // Check if party size is within limits
      if (company.maxBookingsPerDay && parsedData.data.partySize > company.maxBookingsPerDay) {
        return res.status(400).json({
          success: false,
          message: `Maximum party size is ${company.maxBookingsPerDay}.`
        });
      }

      // Create booking
      const bookingData = {
        ...parsedData.data
      };

      const booking = await storage.createVoucherBooking(bookingData);

      return res.status(201).json({
        success: true,
        booking,
        message: 'Booking created successfully.'
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while creating the booking.'
      });
    }
  });

  // Get user's voucher bookings
  router.get('/bookings', checkAuth(), async (req, res) => {
    try {
      const bookings = await storage.getVoucherBookingsByUser(req.session.userId);
      
      // Enrich with voucher and company data
      const enrichedBookings = await Promise.all(
        bookings.map(async (booking) => {
          const voucher = await storage.getStudentVoucherById(booking.voucherId);
          let company = null;
          
          if (voucher) {
            company = await storage.getVoucherCompanyById(voucher.companyId);
          }
          
          return {
            ...booking,
            voucher: voucher ? {
              id: voucher.id,
              title: voucher.title,
              type: voucher.type,
              discountPercentage: voucher.discountPercentage,
              discountAmount: voucher.discountAmount
            } : null,
            company: company ? {
              id: company.id,
              name: company.name,
              logo: company.logo,
              address: company.address,
              city: company.city,
              phone: company.phone
            } : null
          };
        })
      );

      return res.json({
        success: true,
        bookings: enrichedBookings
      });
    } catch (error) {
      console.error('Error getting bookings:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching bookings.'
      });
    }
  });

  // Cancel a booking
  router.post('/bookings/:id/cancel', checkAuth(), async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      if (isNaN(bookingId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid booking ID.'
        });
      }

      // Check if booking exists
      const booking = await storage.getVoucherBookingById(bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found.'
        });
      }

      // Check ownership or admin status
      if (booking.userId !== req.session.userId && req.session.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to cancel this booking.'
        });
      }

      // Check if booking is already completed or cancelled
      if (booking.status === 'completed' || booking.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: `This booking is already ${booking.status}.`
        });
      }

      // Update booking
      const updatedBooking = await storage.updateVoucherBooking(bookingId, {
        status: 'cancelled',
        cancellationReason: req.body.reason || 'Cancelled by user',
        cancelledByUserId: req.session.userId,
        cancellationDate: new Date(),
        updatedAt: new Date()
      });

      return res.json({
        success: true,
        booking: updatedBooking,
        message: 'Booking cancelled successfully.'
      });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while cancelling the booking.'
      });
    }
  });

  // === SAVED VOUCHERS ROUTES ===

  // Save a voucher
  router.post('/:id/save', checkAuth(), async (req, res) => {
    try {
      const voucherId = parseInt(req.params.id);
      if (isNaN(voucherId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid voucher ID.'
        });
      }

      // Check if voucher exists
      const voucher = await storage.getStudentVoucherById(voucherId);
      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: 'Voucher not found.'
        });
      }

      // Check if voucher is already saved
      const existingSaved = await storage.getSavedVoucherByUserAndVoucher(req.session.userId, voucherId);
      if (existingSaved) {
        return res.status(400).json({
          success: false,
          message: 'You have already saved this voucher.'
        });
      }

      // Save voucher
      const savedVoucher = await storage.createSavedVoucher({
        userId: req.session.userId,
        voucherId
      });

      return res.status(201).json({
        success: true,
        savedVoucher,
        message: 'Voucher saved successfully.'
      });
    } catch (error) {
      console.error('Error saving voucher:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while saving the voucher.'
      });
    }
  });

  // Unsave a voucher
  router.delete('/:id/save', checkAuth(), async (req, res) => {
    try {
      const voucherId = parseInt(req.params.id);
      if (isNaN(voucherId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid voucher ID.'
        });
      }

      // Check if voucher is saved
      const savedVoucher = await storage.getSavedVoucherByUserAndVoucher(req.session.userId, voucherId);
      if (!savedVoucher) {
        return res.status(404).json({
          success: false,
          message: 'Saved voucher not found.'
        });
      }

      // Delete saved voucher
      await storage.deleteSavedVoucher(savedVoucher.id);

      return res.json({
        success: true,
        message: 'Voucher unsaved successfully.'
      });
    } catch (error) {
      console.error('Error unsaving voucher:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while unsaving the voucher.'
      });
    }
  });

  // Get user's saved vouchers
  router.get('/saved', checkAuth(), async (req, res) => {
    try {
      const savedVouchers = await storage.getSavedVouchersByUser(req.session.userId);
      
      // Enrich with voucher and company data
      const enrichedSavedVouchers = await Promise.all(
        savedVouchers.map(async (saved) => {
          const voucher = await storage.getStudentVoucherById(saved.voucherId);
          let company = null;
          
          if (voucher) {
            company = await storage.getVoucherCompanyById(voucher.companyId);
          }
          
          return {
            id: saved.id,
            createdAt: saved.createdAt,
            voucher: voucher ? {
              id: voucher.id,
              title: voucher.title,
              description: voucher.description,
              type: voucher.type,
              status: voucher.status,
              discountPercentage: voucher.discountPercentage,
              discountAmount: voucher.discountAmount,
              startDate: voucher.startDate,
              endDate: voucher.endDate,
              images: voucher.images
            } : null,
            company: company ? {
              id: company.id,
              name: company.name,
              logo: company.logo,
              businessType: company.businessType
            } : null
          };
        })
      );

      return res.json({
        success: true,
        savedVouchers: enrichedSavedVouchers
      });
    } catch (error) {
      console.error('Error getting saved vouchers:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching saved vouchers.'
      });
    }
  });

  app.use('/api/vouchers', router);
}