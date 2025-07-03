/**
 * Script to create sample marketplace items directly in the database
 * Run with: node add-marketplace-items.js
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

// Load environment variables
dotenv.config();

// Create a database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Sample marketplace item data
const sampleItems = [
  {
    title: "Economics Textbook - Principles of Microeconomics",
    description: "7th Edition, Gregory Mankiw. Excellent condition with minimal highlighting. Perfect for first-year economics students.",
    price: "45.00",
    category: "textbooks",
    condition: "very_good",
    images: [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=800"
    ],
    location: "University of Leeds",
    tags: ["economics", "textbook", "microeconomics"],
    userId: 1,
    meetInPerson: true,
    canDeliver: true,
  },
  {
    title: "MacBook Pro 2023 - M2 Chip",
    description: "13-inch MacBook Pro with M2 chip, 16GB RAM, 512GB SSD. Purchased last semester, selling because I'm upgrading. Comes with charger and protective case.",
    price: "899.99",
    category: "electronics",
    condition: "like_new",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=800"
    ],
    location: "University of Manchester",
    tags: ["laptop", "apple", "macbook", "computer"],
    userId: 2,
    meetInPerson: true,
    canDeliver: false,
  },
  {
    title: "IKEA Student Desk - White",
    description: "IKEA MICKE desk in white, perfect for students. Assembled but in excellent condition. Has a drawer for storage. Pick up only from my apartment near campus.",
    price: "50.00",
    category: "furniture",
    condition: "good",
    images: [
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=800"
    ],
    location: "London Metropolitan University",
    tags: ["desk", "furniture", "ikea", "student"],
    userId: 2,
    meetInPerson: true,
    canDeliver: false,
  },
  {
    title: "Graphing Calculator - Texas Instruments TI-84",
    description: "TI-84 Plus graphing calculator. Required for many math and science courses. Works perfectly. Includes batteries and case.",
    price: "75.00",
    category: "electronics",
    condition: "good",
    images: [
      "https://images.unsplash.com/photo-1564141857893-c8bd663e3fdf?auto=format&fit=crop&q=80&w=800"
    ],
    location: "University of Birmingham",
    tags: ["calculator", "math", "science", "engineering"],
    userId: 1,
    meetInPerson: true,
    canDeliver: true,
  },
  {
    title: "Mini Refrigerator - Perfect for Dorms",
    description: "Compact 3.2 cubic feet mini fridge. Great for dorm rooms or small spaces. Energy-efficient and quiet. Used for one year but works perfectly.",
    price: "85.00",
    category: "kitchen",
    condition: "good",
    images: [
      "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&q=80&w=800"
    ],
    location: "University of Bristol",
    tags: ["fridge", "appliance", "dorm", "kitchen"],
    userId: 1,
    meetInPerson: true,
    canDeliver: false,
  },
  {
    title: "Nike Running Shoes - Men's Size 10",
    description: "Nike Air Zoom Pegasus 38, men's size 10. Only worn a few times, still in great condition. Black with white swoosh.",
    price: "65.00",
    category: "clothing",
    condition: "very_good",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"
    ],
    location: "University of Edinburgh",
    tags: ["shoes", "nike", "running", "athletic"],
    userId: 2,
    meetInPerson: true,
    canDeliver: true,
  }
];

// Function to create a user if it doesn't exist
async function ensureUsers() {
  try {
    // Check if user 1 exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = 1');
    
    if (userCheck.rows.length === 0) {
      // Create user 1
      await pool.query(`
        INSERT INTO users (id, email, password, name, phone, user_type, verified) 
        VALUES (1, 'user1@example.com', '$2b$10$6SbCAZVTFb44NLmJux0QRO0Fvi2fxj9uzQK7LjVQY5vcOWdXgnrEu', 'User One', '07123456789', 'tenant', true)
        ON CONFLICT (id) DO NOTHING
      `);
      console.log('Created user 1');
      
      // Create user 2
      await pool.query(`
        INSERT INTO users (id, email, password, name, phone, user_type, verified)
        VALUES (2, 'user2@example.com', '$2b$10$6SbCAZVTFb44NLmJux0QRO0Fvi2fxj9uzQK7LjVQY5vcOWdXgnrEu', 'User Two', '07987654321', 'tenant', true) 
        ON CONFLICT (id) DO NOTHING
      `);
      console.log('Created user 2');
    } else {
      console.log('Users already exist');
    }
  } catch (err) {
    console.error('Error ensuring users exist:', err);
  }
}

// Function to check if the marketplace_items table exists
async function ensureMarketplaceTable() {
  try {
    // Check if marketplace_items table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_items'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Marketplace items table does not exist. You should run migrations to create it.');
      console.log('Using npm run db:push or similar command to create the table based on schema definition.');
      throw new Error('Marketplace items table does not exist');
    } else {
      console.log('Marketplace items table already exists');
    }
  } catch (err) {
    console.error('Error checking marketplace table:', err);
    throw err;
  }
}

// Function to insert marketplace items
async function insertMarketplaceItems() {
  try {
    for (const item of sampleItems) {
      const {
        title,
        description,
        price,
        category,
        condition,
        images,
        location,
        tags,
        userId,
        meetInPerson,
        canDeliver,
      } = item;
      
      // Insert the item
      const result = await pool.query(`
        INSERT INTO marketplace_items (
          title, description, price, category, condition, images, location, 
          user_id, meet_in_person, can_deliver, listing_status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active'
        ) ON CONFLICT (id) DO NOTHING
        RETURNING id;
      `, [
        title, description, price, category, condition, JSON.stringify(images), location,
        userId, meetInPerson, canDeliver
      ]);
      
      if (result.rows.length > 0) {
        console.log(`Created marketplace item: ${title} (ID: ${result.rows[0].id})`);
      } else {
        console.log(`Item already exists: ${title}`);
      }
    }
  } catch (err) {
    console.error('Error inserting marketplace items:', err);
  }
}

// Main function
async function main() {
  try {
    console.log('Starting to create marketplace items...');
    
    // Ensure users exist
    await ensureUsers();
    
    // Ensure marketplace table exists
    await ensureMarketplaceTable();
    
    // Insert marketplace items
    await insertMarketplaceItems();
    
    console.log('Marketplace items created successfully!');
  } catch (err) {
    console.error('Error creating marketplace items:', err);
  } finally {
    // Close the database connection pool
    await pool.end();
  }
}

// Run the main function
main();