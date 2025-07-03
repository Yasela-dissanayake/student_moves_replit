/**
 * Admin City Images Routes
 * Handles admin management of city images including uploads and AI generation
 */
import type { Express, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { generateCityImage } from "./openai-city-images";
import { storage } from "./storage";
import { log } from "./vite";

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Filter for valid image files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only jpeg, jpg, and png
  if (file.mimetype === "image/jpeg" || 
      file.mimetype === "image/jpg" || 
      file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
    return cb(new Error("Only .jpeg, .jpg and .png files are allowed!"));
  }
};

export function registerAdminCityImageRoutes(app: Express) {
  /**
   * Middleware to check if user is admin
   */
  const checkAdminAuth = (req: Request, res: Response, next: Function) => {
    // Check if user is authenticated and is an admin
    if (!req.session.userId || req.session.userType !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }
    next();
  };

  /**
   * Get all city images
   */
  app.get("/api/admin/city-images", checkAdminAuth, async (req: Request, res: Response) => {
    try {
      const cityImages = await storage.getAllCityImages();
      res.json(cityImages);
    } catch (error) {
      log(`Error fetching city images: ${error instanceof Error ? error.message : String(error)}`, "admin-city-images");
      res.status(500).json({ 
        message: "Failed to fetch city images", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  /**
   * Upload a new city image
   */
  app.post("/api/admin/city-images/upload", checkAdminAuth, upload.single('image'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file uploaded" });
      }

      if (!req.body.city) {
        return res.status(400).json({ message: "City name is required" });
      }

      // Create directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'city-images');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate a unique filename
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${req.body.city.toLowerCase().replace(/\s+/g, '-')}-${uuidv4()}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      // Write file to disk
      fs.writeFileSync(filePath, req.file.buffer);

      // Get relative path for storage in database
      const relativeImagePath = `/city-images/${fileName}`;

      // Save to database
      const cityImage = await storage.createCityImage({
        city: req.body.city.trim(),
        imageUrl: relativeImagePath,
        source: 'uploaded',
        lastUpdated: new Date()
      });

      res.status(201).json(cityImage);
    } catch (error) {
      log(`Error uploading city image: ${error instanceof Error ? error.message : String(error)}`, "admin-city-images");
      res.status(500).json({ 
        message: "Failed to upload city image", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  /**
   * Generate a city image using AI
   */
  app.post("/api/admin/city-images/generate", checkAdminAuth, async (req: Request, res: Response) => {
    try {
      const { city } = req.body;

      if (!city) {
        return res.status(400).json({ message: "City name is required" });
      }

      log(`Generating AI image for city: ${city}`, "admin-city-images");

      // Generate image using OpenAI
      const result = await generateCityImage(city);

      if (!result.success) {
        return res.status(500).json({ 
          message: "Failed to generate city image", 
          error: result.error 
        });
      }

      // Save to database
      const cityImage = await storage.createCityImage({
        city: city.trim(),
        imageUrl: result.imageUrl,
        source: 'ai-generated',
        lastUpdated: new Date()
      });

      res.status(201).json({
        cityImage,
        message: "City image generated successfully"
      });
    } catch (error) {
      log(`Error generating city image: ${error instanceof Error ? error.message : String(error)}`, "admin-city-images");
      res.status(500).json({ 
        message: "Failed to generate city image", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  /**
   * Delete a city image
   */
  app.delete("/api/admin/city-images/:id", checkAdminAuth, async (req: Request, res: Response) => {
    try {
      const imageId = parseInt(req.params.id);
      
      if (isNaN(imageId)) {
        return res.status(400).json({ message: "Invalid image ID" });
      }
      
      // Get image before deleting to check if it's a local file
      const image = await storage.getCityImage(imageId);
      
      if (!image) {
        return res.status(404).json({ message: "City image not found" });
      }
      
      // Delete from database
      await storage.deleteCityImage(imageId);
      
      // If it's a local uploaded file, delete from filesystem
      if (image.source === 'uploaded' && image.imageUrl.startsWith('/city-images/')) {
        const filePath = path.join(process.cwd(), 'public', image.imageUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      res.status(200).json({ message: "City image deleted successfully" });
    } catch (error) {
      log(`Error deleting city image: ${error instanceof Error ? error.message : String(error)}`, "admin-city-images");
      res.status(500).json({ 
        message: "Failed to delete city image", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
}