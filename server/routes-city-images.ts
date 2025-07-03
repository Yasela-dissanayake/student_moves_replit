import type { Express } from "express";
import cityImagesRoutes from "./routes/city-images-routes";

/**
 * Register city image management routes
 * @param app Express application
 */
export const registerCityImageRoutes = (app: Express) => {
  // Mount the city images routes
  app.use('/api/city-images', cityImagesRoutes);
  
  console.log('[routes] City image management routes registered');
};