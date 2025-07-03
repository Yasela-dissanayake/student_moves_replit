/**
 * Setup for Voucher Partner Outreach Feature
 * This file registers the routes and initializes any services needed for the feature
 */

import express from 'express';
import { log } from './vite';
import voucherOutreachRoutes from './routes-voucher-outreach';
import { IStorage } from './storage';
import { CustomAIService } from './ai-services';

/**
 * Setup the voucher outreach feature
 * @param app Express application
 * @param storage Storage instance
 */
export function setupVoucherOutreach(app: express.Application, storage: IStorage): void {
  log('Setting up voucher partner outreach feature', 'setup');
  
  // Get AI service for personalized email generation
  let aiService: CustomAIService | null = null;
  
  try {
    // Import the customAIService singleton
    const { customAIService } = require('./ai-services');
    aiService = customAIService;
    
    if (aiService && aiService.isAvailable()) {
      log('AI service initialized for voucher outreach', 'voucher-outreach-setup');
    } else {
      log('AI service is available but not properly configured', 'voucher-outreach-setup');
    }
  } catch (error) {
    log(`Error setting up AI for voucher outreach: ${error}`, 'voucher-outreach-setup');
  }
  
  // Register the routes under /api/admin/voucher-outreach
  const router = voucherOutreachRoutes(storage, aiService);
  app.use('/api/admin/voucher-outreach', router);
  
  log('Voucher partner outreach feature successfully set up', 'setup');
}