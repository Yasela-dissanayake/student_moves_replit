// @ts-check
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { Pool } = require('pg');

// Create a new database connection
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('Error: DATABASE_URL environment variable not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
});

async function generateQRCode(data) {
  return new Promise((resolve, reject) => {
    QRCode.toDataURL(data, (err, url) => {
      if (err) reject(err);
      else resolve(url);
    });
  });
}

async function createSampleData() {
  console.log('Creating sample voucher data...');
  
  // Ensure the directories exist
  const companyLogoDir = './public/images/companies';
  const voucherImageDir = './public/images/vouchers';
  
  if (!fs.existsSync('./public/images')) {
    fs.mkdirSync('./public/images', { recursive: true });
  }
  
  if (!fs.existsSync(companyLogoDir)) {
    fs.mkdirSync(companyLogoDir, { recursive: true });
  }
  
  if (!fs.existsSync(voucherImageDir)) {
    fs.mkdirSync(voucherImageDir, { recursive: true });
  }
  
  // Create placeholder images if they don't exist
  const createPlaceholderImage = (filepath, text) => {
    if (!fs.existsSync(filepath)) {
      // Create a simple SVG placeholder
      const svg = `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" font-family="Arial" font-size="20" text-anchor="middle" dominant-baseline="middle">${text}</text>
      </svg>`;
      fs.writeFileSync(filepath, svg);
      console.log(`Created placeholder image: ${filepath}`);
    }
  };
  
  // Create placeholder images
  createPlaceholderImage(path.join(companyLogoDir, 'pizza-logo.png'), 'Student Pizza Co');
  createPlaceholderImage(path.join(companyLogoDir, 'bookstore-logo.png'), 'Campus Bookstore');
  createPlaceholderImage(path.join(companyLogoDir, 'fitness-logo.png'), 'Student Fitness Hub');
  
  createPlaceholderImage(path.join(voucherImageDir, 'pizza-deal.jpg'), '2 for 1 Pizza Deal');
  createPlaceholderImage(path.join(voucherImageDir, 'book-discount.jpg'), '20% Off Textbooks');
  createPlaceholderImage(path.join(voucherImageDir, 'gym-pass.jpg'), 'Free 7-Day Gym Pass');
  createPlaceholderImage(path.join(voucherImageDir, 'garlic-bread.jpg'), 'Free Garlic Bread');
  
  // First, create some voucher companies
  const companies = [
    {
      name: 'Student Pizza Co',
      email: 'info@studentpizza.com',
      phone: '020 1234 5678',
      description: 'Delicious pizzas at student-friendly prices',
      address: '123 High Street',
      city: 'Leeds',
      postcode: 'LS1 1AA',
      businessType: 'restaurant',
      website: 'https://www.studentpizza.com',
      operatingHours: JSON.stringify({
        monday: '11:00-23:00',
        tuesday: '11:00-23:00',
        wednesday: '11:00-23:00',
        thursday: '11:00-23:00',
        friday: '11:00-00:00',
        saturday: '12:00-00:00',
        sunday: '12:00-22:00'
      }),
      logo: '/images/companies/pizza-logo.png',
      verified: true
    },
    {
      name: 'Campus Bookstore',
      email: 'sales@campusbooks.com',
      phone: '020 2345 6789',
      description: 'Your one-stop shop for textbooks and study materials',
      address: '45 University Road',
      city: 'Leeds',
      postcode: 'LS2 3AB',
      businessType: 'retail',
      website: 'https://www.campusbookstore.com',
      operatingHours: JSON.stringify({
        monday: '09:00-17:30',
        tuesday: '09:00-17:30',
        wednesday: '09:00-17:30',
        thursday: '09:00-19:00',
        friday: '09:00-17:30',
        saturday: '10:00-16:00',
        sunday: 'Closed'
      }),
      logo: '/images/companies/bookstore-logo.png',
      verified: true
    },
    {
      name: 'Student Fitness Hub',
      email: 'hello@studentfitness.com',
      phone: '020 3456 7890',
      description: 'Affordable gym access for students with no long-term contracts',
      address: '78 Cardigan Road',
      city: 'Leeds',
      postcode: 'LS6 1LF',
      businessType: 'fitness',
      website: 'https://www.studentfitnesshub.com',
      operatingHours: JSON.stringify({
        monday: '06:00-22:00',
        tuesday: '06:00-22:00',
        wednesday: '06:00-22:00',
        thursday: '06:00-22:00',
        friday: '06:00-21:00',
        saturday: '08:00-20:00',
        sunday: '08:00-20:00'
      }),
      logo: '/images/companies/fitness-logo.png',
      verified: true
    }
  ];
  
  // Insert companies and get their IDs
  const insertedCompanies = [];
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if companies already exist
    const existingCompanies = await client.query('SELECT * FROM voucher_companies');
    if (existingCompanies.rows.length > 0) {
      console.log('Using existing companies in the database');
      insertedCompanies.push(...existingCompanies.rows);
    } else {
      // Insert the new companies
      for (const company of companies) {
        try {
          const result = await client.query(
            `INSERT INTO voucher_companies 
            (name, email, phone, description, address, city, postcode, business_type, website, operating_hours, logo, verified) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
            RETURNING *`,
            [
              company.name, 
              company.email, 
              company.phone, 
              company.description, 
              company.address, 
              company.city, 
              company.postcode, 
              company.businessType, 
              company.website, 
              company.operatingHours, 
              company.logo, 
              company.verified
            ]
          );
          
          insertedCompanies.push(result.rows[0]);
          console.log(`Created company: ${company.name} with ID ${result.rows[0].id}`);
        } catch (error) {
          console.error(`Error creating company ${company.name}:`, error);
        }
      }
    }
    
    // Create vouchers for each company
    if (insertedCompanies.length > 0) {
      const vouchers = [
        {
          companyId: insertedCompanies[0].id, // Pizza company
          title: '2 for 1 Pizza Deal',
          description: 'Buy one pizza and get another free! Valid on all medium and large pizzas.',
          type: 'bogo',
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
          terms_and_conditions: 'Valid on medium and large pizzas only. Cannot be combined with other offers. Valid once per customer.',
          status: 'active',
          usage_limit: 100,
          user_usage_limit: 1,
          usage_count: 0,
          redemption_code: 'PIZZA2FOR1',
          discount_percentage: 100, // 100% off second pizza
          images: JSON.stringify(['/images/vouchers/pizza-deal.jpg'])
        },
        {
          companyId: insertedCompanies[1].id, // Bookstore
          title: '20% Off Textbooks',
          description: 'Save 20% on all textbooks for current semester courses.',
          type: 'discount',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          terms_and_conditions: 'Valid on new textbooks only. Must present valid student ID. Cannot be combined with other offers.',
          status: 'active',
          usage_limit: 100,
          user_usage_limit: 1,
          usage_count: 0,
          redemption_code: 'BOOK20OFF',
          discount_percentage: 20, // 20% off
          images: JSON.stringify(['/images/vouchers/book-discount.jpg'])
        },
        {
          companyId: insertedCompanies[2].id, // Fitness
          title: 'Free 7-Day Gym Pass',
          description: 'Try our fitness facilities for free for a full week!',
          type: 'freebie',
          startDate: new Date(),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
          terms_and_conditions: 'New members only. Must present valid student ID. Some peak time restrictions may apply.',
          status: 'active',
          usage_limit: 100,
          user_usage_limit: 1,
          usage_count: 0,
          redemption_code: 'FITNESS7DAY',
          discount_percentage: 100, // 100% off (free)
          images: JSON.stringify(['/images/vouchers/gym-pass.jpg'])
        },
        {
          companyId: insertedCompanies[0].id, // Pizza company
          title: 'Free Garlic Bread with £15 Order',
          description: 'Get a free garlic bread with any order over £15',
          type: 'freebie',
          startDate: new Date(),
          endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
          terms_and_conditions: 'Minimum order value £15 excluding delivery. One free garlic bread per order.',
          status: 'active',
          usage_limit: 100,
          user_usage_limit: 1,
          usage_count: 0, 
          min_purchase_amount: 15,
          redemption_code: 'FREEBREAD',
          discount_amount: 3.99, // £3.99 value of garlic bread
          currency_code: 'GBP',
          images: JSON.stringify(['/images/vouchers/garlic-bread.jpg'])
        }
      ];
      
      // Check if vouchers already exist
      const existingVouchers = await client.query('SELECT * FROM student_vouchers');
      if (existingVouchers.rows.length > 0) {
        console.log('Vouchers already exist in the database, skipping creation');
      } else {
        // Generate QR codes and insert vouchers
        for (const voucher of vouchers) {
          try {
            // Create QR code with unique verification data
            const qrData = JSON.stringify({
              id: `voucher_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
              company: voucher.companyId,
              code: voucher.redemption_code,
              expires: voucher.endDate,
              type: voucher.type
            });
            
            // Generate QR code image
            const qrCodeImage = await generateQRCode(qrData);
            
            // Add QR code data to voucher
            voucher.qr_code_data = qrData;
            voucher.qr_code_image = qrCodeImage;
            
            // Insert voucher
            const result = await client.query(
              `INSERT INTO student_vouchers 
              (company_id, title, description, type, start_date, end_date, 
               terms_and_conditions, status, usage_limit, user_usage_limit, usage_count, redemption_code, 
               discount_percentage, discount_amount, min_purchase_amount, currency_code,
               images, qr_code_data, qr_code_image) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) 
              RETURNING *`,
              [
                voucher.companyId, 
                voucher.title, 
                voucher.description, 
                voucher.type, 
                voucher.startDate, 
                voucher.endDate, 
                voucher.terms_and_conditions, 
                voucher.status, 
                voucher.usage_limit, 
                voucher.user_usage_limit, 
                voucher.usage_count, 
                voucher.redemption_code, 
                voucher.discount_percentage || null, 
                voucher.discount_amount || null, 
                voucher.min_purchase_amount || null, 
                voucher.currency_code || 'GBP',
                voucher.images, 
                voucher.qr_code_data, 
                voucher.qr_code_image
              ]
            );
            
            console.log(`Created voucher: ${voucher.title} with ID ${result.rows[0].id}`);
          } catch (error) {
            console.error(`Error creating voucher ${voucher.title}:`, error);
          }
        }
      }
    }
    
    await client.query('COMMIT');
    console.log('Sample data creation completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating sample data:', error);
  } finally {
    client.release();
    pool.end();
  }
}

createSampleData().catch(err => {
  console.error('Error creating sample data:', err);
  process.exit(1);
});