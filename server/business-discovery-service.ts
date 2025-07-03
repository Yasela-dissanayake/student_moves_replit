/**
 * Business Discovery Service
 * Manages the discovery and storage of potential voucher partner businesses
 */

import { log } from './vite';
import pg from 'pg';
import { BusinessType, OSMBusiness, findBusinessesInCity, enrichBusinessData, formatBusinessForDisplay } from './osm-service';
import { CustomAIService } from './ai-services';

const { Pool } = pg;

// Get database pool from environment
let pool: pg.Pool | null = null;

// Initialize the connection pool
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
}

// Database table structure for cached businesses
export interface DiscoveredBusiness {
  id: number;
  osm_id: number;
  name: string;
  business_type: string;
  category: string;
  street: string | null;
  house_number: string | null;
  city: string;
  postcode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  opening_hours: string | null;
  lat: number | null;
  lon: number | null;
  raw_data: any;
  contacted: boolean;
  contact_date: Date | null;
  contact_status: string | null;
  created_at: Date;
}

// Ensure the business discovery table exists
async function ensureBusinessTable() {
  if (!pool) {
    log('No database pool available for business discovery service');
    return false;
  }

  try {
    const query = `
      CREATE TABLE IF NOT EXISTS discovered_businesses (
        id SERIAL PRIMARY KEY,
        osm_id BIGINT NOT NULL,
        name VARCHAR(255) NOT NULL,
        business_type VARCHAR(50) NOT NULL,
        category VARCHAR(50),
        street VARCHAR(255),
        house_number VARCHAR(50),
        city VARCHAR(100) NOT NULL,
        postcode VARCHAR(20),
        phone VARCHAR(50),
        email VARCHAR(255),
        website VARCHAR(255),
        opening_hours TEXT,
        lat DECIMAL(10, 8),
        lon DECIMAL(11, 8),
        raw_data JSONB,
        contacted BOOLEAN DEFAULT FALSE,
        contact_date TIMESTAMP,
        contact_status VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Add index on city and business_type for quick lookups
      CREATE INDEX IF NOT EXISTS idx_discovered_businesses_city ON discovered_businesses(city);
      CREATE INDEX IF NOT EXISTS idx_discovered_businesses_type ON discovered_businesses(business_type);
      CREATE INDEX IF NOT EXISTS idx_discovered_businesses_status ON discovered_businesses(contact_status);
      
      -- Add unique constraint on osm_id to prevent duplicates
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM pg_constraint 
          WHERE conname = 'discovered_businesses_osm_id_key'
        ) THEN
          ALTER TABLE discovered_businesses ADD CONSTRAINT discovered_businesses_osm_id_key UNIQUE (osm_id);
        END IF;
      END $$;
    `;
    
    await pool.query(query);
    log('Ensured discovered_businesses table exists');
    return true;
  } catch (error) {
    log(`Error ensuring business table: ${error}`);
    return false;
  }
}

/**
 * Find businesses in a city with optional type filter
 * First checks the cache, then falls back to OpenStreetMap
 */
export async function findBusinesses(
  city: string,
  businessType: BusinessType = 'all',
  includePreviouslyContacted: boolean = false,
  aiService?: CustomAIService
): Promise<any[]> {
  // Ensure table exists
  await ensureBusinessTable();
  
  // Normalize city name - capitalize first letter of each word
  const normalizedCity = city
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  log(`Finding businesses in ${normalizedCity} of type ${businessType}`);
  
  // First check our database cache
  const cachedBusinesses = await getCachedBusinesses(normalizedCity, businessType, includePreviouslyContacted);
  
  // If we have sufficient cached results, return them
  if (cachedBusinesses.length > 5) {
    log(`Found ${cachedBusinesses.length} cached businesses for ${normalizedCity}`);
    return cachedBusinesses;
  }
  
  log(`Insufficient cached businesses for ${normalizedCity}, fetching from OSM`);
  
  // Otherwise, fetch from OpenStreetMap
  const osmBusinesses = await findBusinessesInCity(normalizedCity, businessType);
  
  if (osmBusinesses.length === 0) {
    log(`No businesses found in OSM for ${normalizedCity}`);
    return cachedBusinesses; // Return whatever we have in cache
  }
  
  // Process and enrich OpenStreetMap businesses
  const enrichedBusinesses: OSMBusiness[] = [];
  
  for (const business of osmBusinesses) {
    try {
      // Enrich with AI if available
      const enriched = aiService 
        ? await enrichBusinessData(business, aiService)
        : business;
      
      enrichedBusinesses.push(enriched);
    } catch (error) {
      log(`Error enriching business: ${error}`);
      enrichedBusinesses.push(business);
    }
  }
  
  // Cache the businesses in our database
  await cacheBusinesses(enrichedBusinesses, normalizedCity);
  
  // Get all businesses from cache now that we've added new ones
  return await getCachedBusinesses(normalizedCity, businessType, includePreviouslyContacted);
}

/**
 * Get cached businesses from the database
 */
async function getCachedBusinesses(
  city: string,
  businessType: BusinessType,
  includePreviouslyContacted: boolean
): Promise<any[]> {
  if (!pool) return [];
  
  try {
    let query = `
      SELECT * FROM discovered_businesses 
      WHERE city = $1
    `;
    
    const values: any[] = [city];
    
    // Add business type filter if not 'all'
    if (businessType !== 'all') {
      query += ` AND business_type = $2`;
      values.push(businessType);
    }
    
    // Filter out previously contacted businesses if requested
    if (!includePreviouslyContacted) {
      query += ` AND (contacted = FALSE OR contacted IS NULL)`;
    }
    
    // Add order to prioritize businesses with contact info
    query += ` ORDER BY 
      CASE WHEN phone IS NOT NULL AND phone != '' THEN 0 ELSE 1 END,
      CASE WHEN email IS NOT NULL AND email != '' THEN 0 ELSE 1 END,
      CASE WHEN website IS NOT NULL AND website != '' THEN 0 ELSE 1 END,
      name ASC
    `;
    
    const result = await pool.query(query, values);
    
    return result.rows.map(formatDatabaseBusiness);
  } catch (error) {
    log(`Error getting cached businesses: ${error}`);
    return [];
  }
}

/**
 * Cache businesses from OpenStreetMap to the database
 */
async function cacheBusinesses(businesses: OSMBusiness[], city: string): Promise<void> {
  if (!pool || businesses.length === 0) return;
  
  try {
    log(`Caching ${businesses.length} businesses from OSM for ${city}`);
    
    // Use batch insertion for performance
    const insertQuery = `
      INSERT INTO discovered_businesses
        (osm_id, name, business_type, category, street, house_number, city, 
        postcode, phone, email, website, opening_hours, lat, lon, raw_data)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (osm_id) DO UPDATE SET
        name = EXCLUDED.name,
        business_type = EXCLUDED.business_type,
        category = EXCLUDED.category,
        street = EXCLUDED.street,
        house_number = EXCLUDED.house_number,
        postcode = EXCLUDED.postcode,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        website = EXCLUDED.website,
        opening_hours = EXCLUDED.opening_hours,
        lat = EXCLUDED.lat,
        lon = EXCLUDED.lon,
        raw_data = EXCLUDED.raw_data
    `;
    
    // Process in batches to avoid overwhelming the database
    const batchSize = 50;
    const batches = Math.ceil(businesses.length / batchSize);
    
    log(`Processing ${businesses.length} businesses in ${batches} batches`);
    
    for (let i = 0; i < batches; i++) {
      const batchStart = i * batchSize;
      const batchEnd = Math.min((i + 1) * batchSize, businesses.length);
      const batch = businesses.slice(batchStart, batchEnd);
      
      log(`Processing batch ${i + 1} with ${batch.length} businesses`);
      
      // Use Promise.all to parallelize the insertions
      await Promise.all(batch.map(async (business) => {
        try {
          const values = [
            business.id, // osm_id
            business.name,
            business.type,
            business.category || null,
            business.address?.street || null,
            business.address?.houseNumber || null,
            city,
            business.address?.postcode || null,
            business.contact?.phone || null,
            business.contact?.email || null,
            business.contact?.website || null,
            business.openingHours || null,
            business.coordinates.lat,
            business.coordinates.lon,
            JSON.stringify(business.rawTags)
          ];
          
          await pool!.query(insertQuery, values);
        } catch (insertError) {
          log(`Error inserting business ${business.name}: ${insertError}`);
        }
      }));
      
      log(`Cached batch ${i + 1}/${batches} of businesses for ${city}`);
    }
    
    log(`Successfully cached ${businesses.length} businesses for ${city}`);
  } catch (error) {
    log(`Error caching businesses: ${error}`);
  }
}

/**
 * Mark a business as contacted
 */
export async function markBusinessAsContacted(
  businessId: number,
  status: string
): Promise<boolean> {
  if (!pool) return false;
  
  try {
    log(`Marking business ${businessId} as contacted with status ${status}`);
    
    const query = `
      UPDATE discovered_businesses
      SET 
        contacted = TRUE,
        contact_date = NOW(),
        contact_status = $1
      WHERE id = $2
    `;
    
    await pool.query(query, [status, businessId]);
    log(`Successfully marked business ${businessId} as contacted`);
    
    return true;
  } catch (error) {
    log(`Error marking business as contacted: ${error}`);
    return false;
  }
}

/**
 * Format a database business for the frontend
 */
function formatDatabaseBusiness(business: DiscoveredBusiness): any {
  return {
    id: business.id,
    osmId: business.osm_id,
    name: business.name,
    type: business.business_type,
    category: formatCategory(business.category || business.business_type),
    address: formatDbAddress(business),
    phone: business.phone,
    email: business.email,
    website: business.website,
    openingHours: business.opening_hours,
    coordinates: business.lat && business.lon ? {
      lat: business.lat,
      lon: business.lon
    } : null,
    contacted: business.contacted,
    contactDate: business.contact_date,
    contactStatus: business.contact_status,
    createdAt: business.created_at
  };
}

/**
 * Format the address from database business
 */
function formatDbAddress(business: DiscoveredBusiness): string {
  const parts = [];
  
  if (business.house_number) {
    parts.push(business.house_number);
  }
  
  if (business.street) {
    parts.push(business.street);
  }
  
  if (business.city) {
    parts.push(business.city);
  }
  
  if (business.postcode) {
    parts.push(business.postcode);
  }
  
  return parts.join(', ');
}

/**
 * Format a business category for display
 */
function formatCategory(category: string): string {
  if (!category) return 'Business';
  
  // Capitalize first letter and replace underscores with spaces
  return category.charAt(0).toUpperCase() + 
         category.slice(1).replace(/_/g, ' ');
}