/**
 * Script to create test properties in the database
 * Run with: node db-create-test-properties.js
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Function to generate a random price between min and max
function randomPrice(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min) * 10;
}

// Function to randomly select an item from an array
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Array of test property data
const testProperties = [
  {
    title: "4 Bed Student House in Fallowfield",
    description: "Spacious 4 bedroom student house located in the heart of Fallowfield. Fully furnished with a large living room, modern kitchen, and backyard. Perfect for a group of university friends looking to share.",
    address: "123 Wilmslow Road",
    city: "Manchester",
    postcode: "M14 6JH",
    price: randomPrice(95, 125).toString(), // per person per week
    pricePerPerson: randomPrice(90, 120).toString(),
    propertyType: "house",
    bedrooms: 4,
    bathrooms: 2,
    features: ["High-speed WiFi", "Washing machine", "Dishwasher", "Garden", "Double beds"],
    university: "University of Manchester",
    distanceToUniversity: "1.5 miles",
    furnished: true,
    billsIncluded: true,
    includedBills: ["Water", "Internet", "TV License"]
  },
  {
    title: "Modern 5 Bed Student Apartment in City Centre",
    description: "A premium 5 bedroom apartment in a purpose-built student complex. Features ensuite bathrooms, a spacious shared kitchen and living area, and 24/7 security. Located in the heart of the city centre.",
    address: "45 Oxford Street",
    city: "Manchester",
    postcode: "M1 6FQ",
    price: randomPrice(130, 160).toString(),
    pricePerPerson: randomPrice(125, 155).toString(),
    propertyType: "apartment",
    bedrooms: 5,
    bathrooms: 5,
    features: ["All ensuite", "24/7 security", "On-site gym", "Study room", "Cinema room"],
    university: "Manchester Metropolitan University",
    distanceToUniversity: "0.3 miles",
    furnished: true,
    billsIncluded: true,
    includedBills: ["All bills included"]
  },
  {
    title: "3 Bed Student Terrace in Rusholme",
    description: "Charming 3 bedroom terrace house located on the famous Curry Mile. Recently renovated with a modern kitchen and bathroom. Easy access to both universities and local amenities.",
    address: "78 Wilmslow Road",
    city: "Manchester",
    postcode: "M14 5TQ",
    price: randomPrice(85, 110).toString(),
    pricePerPerson: randomPrice(80, 105).toString(),
    propertyType: "house",
    bedrooms: 3,
    bathrooms: 1,
    features: ["Recently renovated", "Close to restaurants", "Garden", "Near public transport"],
    university: "University of Manchester",
    distanceToUniversity: "0.9 miles",
    furnished: true,
    billsIncluded: false,
    includedBills: []
  },
  {
    title: "Luxury 2 Bed Studio for Students in Northern Quarter",
    description: "High-end 2 bedroom studio apartment in the vibrant Northern Quarter. Featuring modern design, premium appliances, and a private balcony. Perfect for postgraduate students looking for quality accommodation.",
    address: "15 Tib Street",
    city: "Manchester",
    postcode: "M4 1SH",
    price: randomPrice(170, 200).toString(),
    pricePerPerson: randomPrice(165, 195).toString(),
    propertyType: "studio",
    bedrooms: 2,
    bathrooms: 1,
    features: ["Private balcony", "Designer furniture", "Smart home system", "Bike storage", "Concierge service"],
    university: "University of Manchester",
    distanceToUniversity: "1.1 miles",
    furnished: true,
    billsIncluded: true,
    includedBills: ["All bills included"]
  },
  {
    title: "6 Bed Student House Share in Victoria Park",
    description: "Large 6 bedroom house in the quiet Victoria Park area. Features a spacious living room, two bathrooms, and a large garden. Ideal for a group of friends looking for a peaceful study environment with easy access to the university.",
    address: "34 Victoria Road",
    city: "Manchester",
    postcode: "M14 5PP",
    price: randomPrice(90, 115).toString(),
    pricePerPerson: randomPrice(85, 110).toString(),
    propertyType: "house",
    bedrooms: 6,
    bathrooms: 2,
    features: ["Large garden", "Two living rooms", "Quiet neighborhood", "Parking available"],
    university: "University of Manchester",
    distanceToUniversity: "0.8 miles",
    furnished: true,
    billsIncluded: false,
    includedBills: []
  },
  {
    title: "Central 3 Bed Student Studio near LSE",
    description: "Modern 3 bedroom studio apartment located in the heart of London. Walking distance to LSE and many central London attractions. Fully equipped kitchen and comfortable living space.",
    address: "10 Portugal Street",
    city: "London",
    postcode: "WC2A 2HD",
    price: randomPrice(220, 260).toString(),
    pricePerPerson: randomPrice(215, 255).toString(),
    propertyType: "studio",
    bedrooms: 3,
    bathrooms: 2,
    features: ["Central location", "Modern design", "Security system", "Communal garden"],
    university: "London School of Economics",
    distanceToUniversity: "0.2 miles",
    furnished: true,
    billsIncluded: true,
    includedBills: ["Water", "Internet", "Electricity"]
  },
  {
    title: "4 Bed Student Flat in Camden",
    description: "Vibrant 4 bedroom flat in the heart of Camden. Close to multiple universities and surrounded by London's best markets, music venues, and restaurants. Recently refurbished to a high standard.",
    address: "25 Camden High Street",
    city: "London",
    postcode: "NW1 7JE",
    price: randomPrice(200, 240).toString(),
    pricePerPerson: randomPrice(195, 235).toString(),
    propertyType: "apartment",
    bedrooms: 4,
    bathrooms: 2,
    features: ["Recently refurbished", "Washing machine", "Dishwasher", "Close to transport links"],
    university: "University College London",
    distanceToUniversity: "1.2 miles",
    furnished: true,
    billsIncluded: false,
    includedBills: []
  },
  {
    title: "7 Bed Student House in Headingley",
    description: "Massive 7 bedroom student house in popular Headingley area. Features include multiple bathrooms, large communal spaces, and a spacious garden. Perfect for a large group of friends studying at Leeds universities.",
    address: "55 Headingley Lane",
    city: "Leeds",
    postcode: "LS6 1BL",
    price: randomPrice(85, 110).toString(),
    pricePerPerson: randomPrice(80, 105).toString(),
    propertyType: "house",
    bedrooms: 7,
    bathrooms: 3,
    features: ["Multiple bathrooms", "Large garden", "Close to Headingley stadium", "Near pubs and restaurants"],
    university: "University of Leeds",
    distanceToUniversity: "1.0 miles",
    furnished: true,
    billsIncluded: true,
    includedBills: ["Water", "Gas", "Electricity", "Internet"]
  },
  {
    title: "5 Bed Student House in Selly Oak",
    description: "Well-maintained 5 bedroom house in the popular student area of Selly Oak. Close to the University of Birmingham with excellent transport links to the city centre. Features a large kitchen and comfortable bedrooms.",
    address: "127 Bristol Road",
    city: "Birmingham",
    postcode: "B29 6LJ",
    price: randomPrice(90, 115).toString(),
    pricePerPerson: randomPrice(85, 110).toString(),
    propertyType: "house",
    bedrooms: 5,
    bathrooms: 2,
    features: ["Large kitchen", "Garden", "Close to university", "Near shops and restaurants"],
    university: "University of Birmingham",
    distanceToUniversity: "0.5 miles",
    furnished: true,
    billsIncluded: false,
    includedBills: []
  },
  {
    title: "4 Bed Student Cottage in Clifton",
    description: "Charming 4 bedroom cottage in the prestigious Clifton area of Bristol. Features period features with modern amenities. Walking distance to the University of Bristol and the famous Clifton Suspension Bridge.",
    address: "8 Clifton Road",
    city: "Bristol",
    postcode: "BS8 1AQ",
    price: randomPrice(110, 140).toString(),
    pricePerPerson: randomPrice(105, 135).toString(),
    propertyType: "house",
    bedrooms: 4,
    bathrooms: 2,
    features: ["Period features", "Garden", "Close to Clifton Village", "Near Bristol University"],
    university: "University of Bristol",
    distanceToUniversity: "0.7 miles",
    furnished: true,
    billsIncluded: true,
    includedBills: ["Water", "Internet"]
  }
];

// Function to insert properties into the database
async function insertTestProperties() {
  const client = await pool.connect();
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    for (const property of testProperties) {
      // First check if the property with this title and address already exists
      const checkQuery = {
        text: 'SELECT id FROM properties WHERE title = $1 AND address = $2',
        values: [property.title, property.address]
      };
      
      const existingProperty = await client.query(checkQuery);
      
      if (existingProperty.rows.length === 0) {
        // Insert the property if it doesn't exist
        const insertQuery = {
          text: `
            INSERT INTO properties (
              title, description, address, city, postcode, price, price_per_person,
              property_type, bedrooms, bathrooms, features, university,
              distance_to_university, furnished, bills_included, included_bills,
              available, available_date, owner_id, created_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
            ) RETURNING id
          `,
          values: [
            property.title,
            property.description,
            property.address,
            property.city,
            property.postcode,
            property.price,
            property.pricePerPerson,
            property.propertyType,
            property.bedrooms,
            property.bathrooms,
            JSON.stringify(property.features),
            property.university,
            property.distanceToUniversity,
            property.furnished,
            property.billsIncluded,
            JSON.stringify(property.includedBills || []),
            true, // available
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // available in 30 days
            Math.floor(Math.random() * 4) + 1, // Random owner ID between 1-4
            new Date()
          ]
        };
        
        const result = await client.query(insertQuery);
        console.log(`Added property: ${property.title} (ID: ${result.rows[0].id})`);
      } else {
        console.log(`Property already exists: ${property.title}`);
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Successfully added test properties to the database!');
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error adding test properties:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Run the function
insertTestProperties();