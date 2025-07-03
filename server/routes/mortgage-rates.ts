/**
 * Mortgage Rates API Routes
 */

import express from 'express';
import { getBuyToLetMortgageRates, getAverageMortgageRates } from '../services/mortgage-rates-service';

export const mortgageRatesRouter = express.Router();

// Get all available buy-to-let mortgage rates
mortgageRatesRouter.get('/buy-to-let', async (req, res) => {
  try {
    const rates = await getBuyToLetMortgageRates();
    res.json({
      success: true,
      data: rates
    });
  } catch (error) {
    console.error('Error fetching mortgage rates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mortgage rates'
    });
  }
});

// Get average mortgage rates by category (LTV and fixed period)
mortgageRatesRouter.get('/averages', async (req, res) => {
  try {
    const averages = await getAverageMortgageRates();
    res.json({
      success: true,
      data: averages
    });
  } catch (error) {
    console.error('Error fetching mortgage rate averages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mortgage rate averages'
    });
  }
});