import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { z } from 'zod';

// Simple logger interface
const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${message}`, ...args);
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '');
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  }
};

// Define the router
const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve('./public/images');
    // Ensure the directory exists
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Get cityId from the form data
    const cityId = req.body.cityId;
    
    // Extract file extension
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    // Validate file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!allowedExtensions.includes(fileExtension)) {
      return cb(new Error('Only .jpg, .jpeg, .png, and .webp files are allowed'), '');
    }
    
    // Create filename based on cityId
    const filename = `${cityId}${fileExtension}`;
    cb(null, filename);
  },
});

// File filter to only allow image files
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Configure upload middleware with 5MB size limit
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Path for storing city images
const CITY_IMAGES_DIR = path.resolve('./public/images');

// Data file to store image mappings
const CITY_IMAGES_DATA_FILE = path.resolve('./server/data/city-images.json');

// Interface for city image data
interface CityImageData {
  cityId: string;
  imagePath: string;
  createdAt: string;
  updatedAt: string;
}

// Initialize the data file if it doesn't exist
const initializeCityImagesData = async () => {
  try {
    // Ensure the data directory exists
    const dataDir = path.resolve('./server/data');
    await fs.ensureDir(dataDir);
    
    // Check if the data file exists
    const exists = await fs.pathExists(CITY_IMAGES_DATA_FILE);
    if (!exists) {
      // Create the data file with an empty array
      await fs.writeJson(CITY_IMAGES_DATA_FILE, [], { spaces: 2 });
    }
  } catch (error) {
    logger.error('Error initializing city images data file', error);
  }
};

// Read city images data
const readCityImagesData = async (): Promise<CityImageData[]> => {
  try {
    // Ensure data file exists
    await initializeCityImagesData();
    
    // Read the data file
    return await fs.readJson(CITY_IMAGES_DATA_FILE);
  } catch (error) {
    logger.error('Error reading city images data', error);
    return [];
  }
};

// Write city images data
const writeCityImagesData = async (data: CityImageData[]): Promise<void> => {
  try {
    await fs.writeJson(CITY_IMAGES_DATA_FILE, data, { spaces: 2 });
  } catch (error) {
    logger.error('Error writing city images data', error);
    throw error;
  }
};

// Get all city images
router.get('/', async (req, res) => {
  try {
    const cityImages = await readCityImagesData();
    res.json(cityImages);
  } catch (error) {
    logger.error('Error fetching city images', error);
    res.status(500).json({ error: 'Failed to fetch city images' });
  }
});

// Get image for a specific city
router.get('/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    const cityImages = await readCityImagesData();
    const cityImage = cityImages.find(img => img.cityId === cityId);
    
    if (!cityImage) {
      return res.status(404).json({ error: 'City image not found' });
    }
    
    res.json(cityImage);
  } catch (error) {
    logger.error(`Error fetching image for city ${req.params.cityId}`, error);
    res.status(500).json({ error: 'Failed to fetch city image' });
  }
});

// Upload a city image
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    // Validate request
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const cityIdSchema = z.string().min(1);
    const parsedCityId = cityIdSchema.safeParse(req.body.cityId);
    
    if (!parsedCityId.success) {
      return res.status(400).json({ error: 'Invalid city ID' });
    }
    
    const cityId = parsedCityId.data;
    const imagePath = `/images/${req.file.filename}`;
    
    // Read existing data
    const cityImages = await readCityImagesData();
    
    // Check if city already has an image
    const existingImageIndex = cityImages.findIndex(img => img.cityId === cityId);
    
    const now = new Date().toISOString();
    
    if (existingImageIndex !== -1) {
      // Update existing entry
      cityImages[existingImageIndex] = {
        ...cityImages[existingImageIndex],
        imagePath,
        updatedAt: now,
      };
    } else {
      // Add new entry
      cityImages.push({
        cityId,
        imagePath,
        createdAt: now,
        updatedAt: now,
      });
    }
    
    // Save updated data
    await writeCityImagesData(cityImages);
    
    res.json({
      success: true,
      message: 'City image uploaded successfully',
      cityId,
      imagePath,
    });
  } catch (error) {
    logger.error('Error uploading city image', error);
    res.status(500).json({ error: 'Failed to upload city image' });
  }
});

// Delete a city image
router.delete('/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    
    // Read existing data
    const cityImages = await readCityImagesData();
    
    // Find the city image entry
    const cityImageIndex = cityImages.findIndex(img => img.cityId === cityId);
    
    if (cityImageIndex === -1) {
      return res.status(404).json({ error: 'City image not found' });
    }
    
    const cityImage = cityImages[cityImageIndex];
    
    // Remove the image file
    const imagePath = path.resolve(`./public${cityImage.imagePath}`);
    
    if (await fs.pathExists(imagePath)) {
      await fs.unlink(imagePath);
    }
    
    // Remove the entry from data
    cityImages.splice(cityImageIndex, 1);
    
    // Save updated data
    await writeCityImagesData(cityImages);
    
    res.json({
      success: true,
      message: 'City image deleted successfully',
      cityId,
    });
  } catch (error) {
    logger.error(`Error deleting image for city ${req.params.cityId}`, error);
    res.status(500).json({ error: 'Failed to delete city image' });
  }
});

// Initialize the data file when the module is loaded
initializeCityImagesData();

export default router;