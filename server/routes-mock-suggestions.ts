/**
 * Mock routes for template suggestions while developing the UI
 */
import express from 'express';
import { logSecurity, info } from './logging';
import { createSecurityContext } from './utils/security-utils';

const router = express.Router();

// Mock template data
const mockTemplates = [
  {
    id: 'responsive-hero-section',
    name: 'Responsive Hero Section',
    description: 'A modern, responsive hero section with animated text and call-to-action buttons.',
    category: 'UI Components',
    tags: ['responsive', 'hero', 'animation'],
    complexity: 'intermediate',
    code: '// Responsive Hero Section component...'
  },
  {
    id: 'data-dashboard',
    name: 'Data Dashboard',
    description: 'Complete dashboard with charts, statistics, and filters for data visualization.',
    category: 'Dashboards',
    tags: ['dashboard', 'charts', 'data'],
    complexity: 'advanced',
    code: '// Data Dashboard component...'
  },
  {
    id: 'authentication-forms',
    name: 'Authentication Forms',
    description: 'Sign in and sign up forms with validation and social login options.',
    category: 'Authentication',
    tags: ['forms', 'auth', 'validation'],
    complexity: 'intermediate',
    code: '// Authentication Forms component...'
  },
  {
    id: 'product-card',
    name: 'Product Card',
    description: 'Elegant product card with hover effects and add-to-cart functionality.',
    category: 'E-commerce',
    tags: ['card', 'product', 'hover'],
    complexity: 'beginner',
    code: '// Product Card component...'
  },
  {
    id: 'blog-layout',
    name: 'Blog Layout',
    description: 'Clean and modern blog layout with featured images and category tags.',
    category: 'Content',
    tags: ['blog', 'layout', 'responsive'],
    complexity: 'intermediate',
    code: '// Blog Layout component...'
  },
  {
    id: 'contact-form',
    name: 'Contact Form',
    description: 'Responsive contact form with validation and submission handling.',
    category: 'Forms',
    tags: ['form', 'contact', 'validation'],
    complexity: 'beginner',
    code: '// Contact Form component...'
  },
  {
    id: 'pricing-table',
    name: 'Pricing Table',
    description: 'Comparison pricing table with hover effects and feature lists.',
    category: 'E-commerce',
    tags: ['pricing', 'table', 'comparison'],
    complexity: 'beginner',
    code: '// Pricing Table component...'
  },
  {
    id: 'testimonial-carousel',
    name: 'Testimonial Carousel',
    description: 'Animated testimonial carousel with pagination and auto-play.',
    category: 'UI Components',
    tags: ['carousel', 'testimonial', 'animation'],
    complexity: 'intermediate',
    code: '// Testimonial Carousel component...'
  }
];

// Mock suggestion reasons
const suggestionReasons = [
  'Based on your recent activity',
  'Matches your interest in UI design',
  'Popular with users like you',
  'Complements your recent template choices',
  'Trending in your preferred categories',
  'Fits your skill level'
];

/**
 * GET /api/website-builder/suggestions
 * Mock endpoint for personalized template suggestions
 */
router.get('/suggestions', (req, res) => {
  const securityContext = createSecurityContext(req);
  
  try {
    // Get query parameters
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 4;
    
    // Create mock suggestions with scores and reasons
    const suggestions = mockTemplates
      .slice(0, limit * 2) // Get more than we need so we can randomize
      .map(template => {
        // Generate random score between 0.7 and 0.95
        const score = (Math.random() * 0.25 + 0.7).toFixed(2);
        
        // Pick a random reason
        const reason = suggestionReasons[Math.floor(Math.random() * suggestionReasons.length)];
        
        return {
          templateId: template.id,
          score: parseFloat(score),
          reason
        };
      })
      .sort(() => Math.random() - 0.5) // Shuffle
      .slice(0, limit); // Take requested number
    
    logSecurity('Mock template suggestions retrieved', {
      ...securityContext,
      action: 'get_mock_suggestions',
      result: 'success',
      details: { 
        count: suggestions.length 
      }
    });
    
    // Add slight delay to simulate API call
    setTimeout(() => {
      res.json({
        suggestions,
        timestamp: new Date().toISOString()
      });
    }, 500);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    logSecurity('Failed to retrieve mock template suggestions', {
      ...securityContext,
      action: 'get_mock_suggestions',
      result: 'failure',
      details: { error: errorMessage }
    });
    
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

/**
 * GET /api/enhanced-website-builder/templates
 * Mock endpoint for templates list
 */
router.get('/templates', (req, res) => {
  const securityContext = createSecurityContext(req);
  
  try {
    // Get query parameters
    const category = req.query.category as string;
    const complexity = req.query.complexity as string;
    const tags = req.query.tags ? (req.query.tags as string).split(',') : [];
    const includeMetadata = req.query.includeMetadata === 'true';
    
    // Filter templates based on query params
    let filteredTemplates = [...mockTemplates];
    
    if (category && category !== 'all') {
      filteredTemplates = filteredTemplates.filter(t => t.category === category);
    }
    
    if (complexity && complexity !== 'all') {
      filteredTemplates = filteredTemplates.filter(t => t.complexity === complexity);
    }
    
    if (tags.length > 0) {
      filteredTemplates = filteredTemplates.filter(t => 
        tags.some(tag => t.tags.includes(tag))
      );
    }
    
    // Generate metadata if requested
    let metadata = null;
    if (includeMetadata) {
      // Get all unique categories from all templates
      const categories = [...new Set(mockTemplates.map(t => t.category))];
      
      // Get all unique tags from all templates
      const allTags = [...new Set(mockTemplates.flatMap(t => t.tags))];
      
      // Count templates by complexity
      const complexityStats = {
        beginner: mockTemplates.filter(t => t.complexity === 'beginner').length,
        intermediate: mockTemplates.filter(t => t.complexity === 'intermediate').length,
        advanced: mockTemplates.filter(t => t.complexity === 'advanced').length
      };
      
      metadata = {
        total: mockTemplates.length,
        categories,
        allTags,
        complexityStats
      };
    }
    
    logSecurity('Mock templates retrieved', {
      ...securityContext,
      action: 'get_mock_templates',
      result: 'success',
      details: { 
        count: filteredTemplates.length,
        filters: { category, complexity, tagsCount: tags.length }
      }
    });
    
    // Add slight delay to simulate API call
    setTimeout(() => {
      res.json({
        templates: filteredTemplates,
        metadata,
        timestamp: new Date().toISOString()
      });
    }, 300);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    logSecurity('Failed to retrieve mock templates', {
      ...securityContext,
      action: 'get_mock_templates',
      result: 'failure',
      details: { error: errorMessage }
    });
    
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

export default router;