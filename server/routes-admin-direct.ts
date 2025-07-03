import { Router, Request, Response } from 'express';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { adminConfiguration, insertAdminConfigurationSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Middleware to ensure JSON responses and bypass all other middleware
router.use((req: Request, res: Response, next) => {
  res.setHeader('Content-Type', 'application/json');
  console.log(`Direct admin route accessed: ${req.method} ${req.path}`);
  next();
});

// GET admin configuration
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log("Getting admin configuration directly from database");
    const [config] = await db.select().from(adminConfiguration).limit(1);
    
    if (!config) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No configuration found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error("Error getting admin configuration:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve admin configuration",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// POST create admin configuration
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log("Creating admin configuration:", req.body);
    
    // Validate request body
    const validatedData = insertAdminConfigurationSchema.parse(req.body);
    
    // Check if configuration already exists
    const existingConfig = await db.select().from(adminConfiguration).limit(1);
    
    if (existingConfig.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Configuration already exists. Use PUT to update."
      });
    }
    
    // Create new configuration
    const [newConfig] = await db.insert(adminConfiguration)
      .values(validatedData)
      .returning();
    
    res.status(201).json({
      success: true,
      data: newConfig,
      message: "Admin configuration created successfully"
    });
  } catch (error) {
    console.error("Error creating admin configuration:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided",
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to create admin configuration",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// PUT update admin configuration
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const configId = parseInt(req.params.id);
    console.log("Updating admin configuration:", configId, req.body);
    
    if (isNaN(configId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid configuration ID"
      });
    }
    
    // Validate request body (partial update allowed)
    const updateSchema = insertAdminConfigurationSchema.partial();
    const validatedData = updateSchema.parse(req.body);
    
    // Update configuration
    const [updatedConfig] = await db.update(adminConfiguration)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(adminConfiguration.id, configId))
      .returning();
    
    if (!updatedConfig) {
      return res.status(404).json({
        success: false,
        message: "Configuration not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedConfig,
      message: "Admin configuration updated successfully"
    });
  } catch (error) {
    console.error("Error updating admin configuration:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided",
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to update admin configuration",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;