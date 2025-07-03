import express from 'express';
import { IStorage } from './storage';
import { pool } from './db';

// Public endpoints for voucher data without authentication
export default function setupPublicVoucherRoutes(app: express.Application, storage: IStorage) {
  // Create a dedicated public API endpoint for vouchers
  app.get('/api/public-vouchers', async (req, res) => {
    try {
      // Set content type to application/json
      res.setHeader('Content-Type', 'application/json');
      
      // Filter for active vouchers only
      const filters = { status: 'active' };
      
      // Get current date for valid vouchers
      const now = new Date();
      
      // Fetch vouchers directly from the database
      const vouchersQuery = await pool.query(
        'SELECT * FROM student_vouchers WHERE status = $1 AND end_date > $2',
        ['active', now]
      );
      
      // The actual rows are in the rows property
      const vouchers = vouchersQuery.rows || [];
      console.log(`Public API: Found ${vouchers.length} initial vouchers`);
      
      // Prepare an array to hold the enhanced vouchers
      const validVouchers = [];
      
      // Process each voucher sequentially to avoid any issues with async mapping
      for (const voucher of vouchers) {
        try {
          // Add to valid vouchers without company info for now
          const voucherData: any = {
            id: voucher.id,
            title: voucher.title,
            description: voucher.description,
            type: voucher.type,
            discountPercentage: voucher.discount_percentage,
            discountAmount: voucher.discount_amount,
            startDate: voucher.start_date,
            endDate: voucher.end_date,
            images: voucher.images,
            qrCodeImage: voucher.qr_code_image,
            company: null
          };
          
          // We'll add company info using a direct query instead
          try {
            // Get company directly from database
            const companyQuery = await pool.query(
              'SELECT id, name, logo, business_type as "businessType" FROM voucher_companies WHERE id = $1',
              [voucher.company_id]
            );
            
            // Handle the result as a typesafe array
            const companyRows = companyQuery.rows || [];
            if (companyRows.length > 0) {
              const company = companyRows[0];
              voucherData.company = {
                id: company.id,
                name: company.name,
                logo: company.logo,
                businessType: company.businessType
              };
            }
          } catch (companyErr) {
            console.error(`Error fetching company ${voucher.company_id}:`, companyErr);
          }
          
          validVouchers.push(voucherData);
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
}