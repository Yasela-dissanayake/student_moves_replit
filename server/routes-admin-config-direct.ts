import { Router } from 'express';
import { client } from './db';

const router = Router();

// GET /api/admin/config - Get admin configuration (bypasses Vite middleware)
router.get('/config', async (req, res) => {
  try {
    console.log("Direct admin config GET route accessed");
    
    // Force JSON response headers
    res.setHeader('Content-Type', 'application/json');
    
    // Query the database directly with actual column names
    const result = await client.unsafe(`
      SELECT 
        id,
        company_name,
        contact_email,
        contact_phone,
        address_line1,
        address_line2,
        city,
        postcode,
        country,
        vat_number,
        company_registration,
        website_url,
        logo_url,
        primary_color,
        secondary_color,
        created_at,
        updated_at
      FROM admin_configuration 
      LIMIT 1
    `);
    
    const config = result && result.length > 0 ? result[0] : null;
    
    return res.status(200).json({
      success: true,
      data: config || {
        company_name: 'StudentMoves Ltd',
        contact_email: 'admin@studentmoves.com',
        contact_phone: '020 1234 5678',
        address_line1: '123 University Avenue',
        address_line2: '',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'United Kingdom',
        vat_number: 'GB123456789',
        company_registration: '12345678',
        website_url: 'https://studentmoves.com',
        logo_url: '',
        primary_color: '#22c55e',
        secondary_color: '#10b981'
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

// PUT /api/admin/config - Update admin configuration (bypasses Vite middleware)
router.put('/config', async (req, res) => {
  try {
    console.log("Direct admin config PUT route accessed");
    
    // Force JSON response headers
    res.setHeader('Content-Type', 'application/json');
    
    const {
      company_name,
      contact_email,
      contact_phone,
      address_line1,
      address_line2,
      city,
      postcode,
      country,
      vat_number,
      company_registration,
      website_url,
      logo_url,
      primary_color,
      secondary_color
    } = req.body;
    
    console.log("Config data received for update");
    
    // Check if config exists
    const existingResult = await client.unsafe(`SELECT id FROM admin_configuration LIMIT 1`);
    
    if (existingResult && existingResult.length > 0) {
      // Update existing config with safe parameterized query
      const updatedResult = await client.unsafe(`
        UPDATE admin_configuration 
        SET 
          company_name = $2,
          contact_email = $3,
          contact_phone = $4,
          address_line1 = $5,
          address_line2 = $6,
          city = $7,
          postcode = $8,
          country = $9,
          vat_number = $10,
          company_registration = $11,
          website_url = $12,
          logo_url = $13,
          primary_color = $14,
          secondary_color = $15,
          updated_at = NOW()
        WHERE id = $1 
        RETURNING *
      `, [
        existingResult[0].id,
        company_name,
        contact_email,
        contact_phone,
        address_line1,
        address_line2,
        city,
        postcode,
        country,
        vat_number,
        company_registration,
        website_url,
        logo_url,
        primary_color,
        secondary_color
      ]);
      
      return res.status(200).json({
        success: true,
        data: updatedResult[0],
        message: "Configuration updated successfully"
      });
    } else {
      // Create new config with safe parameterized query
      const newResult = await client.unsafe(`
        INSERT INTO admin_configuration (
          company_name,
          contact_email,
          contact_phone,
          address_line1,
          address_line2,
          city,
          postcode,
          country,
          vat_number,
          company_registration,
          website_url,
          logo_url,
          primary_color,
          secondary_color,
          created_at,
          updated_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()) 
        RETURNING *
      `, [
        company_name,
        contact_email,
        contact_phone,
        address_line1,
        address_line2,
        city,
        postcode,
        country,
        vat_number,
        company_registration,
        website_url,
        logo_url,
        primary_color,
        secondary_color
      ]);
      
      return res.status(201).json({
        success: true,
        data: newResult[0],
        message: "Configuration created successfully"
      });
    }
  } catch (error) {
    console.error('Error saving admin configuration:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save admin configuration',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;