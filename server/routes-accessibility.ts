import express from 'express';
import { accessibilityService } from './accessibility-service';
import type { 
  AccessibilityIssue, 
  ContrastAnalysis, 
  AuditResult,
  InsertPreviewSession 
} from '../shared/accessibility-schema';

const router = express.Router();

// Analyze HTML content for accessibility
router.post('/api/accessibility/analyze', async (req, res) => {
  try {
    const { htmlContent, cssContent } = req.body;
    
    if (!htmlContent) {
      return res.status(400).json({ 
        success: false, 
        error: 'HTML content is required' 
      });
    }

    const auditResult = await accessibilityService.analyzeHTML(htmlContent, cssContent);
    
    res.json({
      success: true,
      auditResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing accessibility:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze accessibility' 
    });
  }
});

// Get accessibility recommendations
router.get('/api/accessibility/recommendations', async (req, res) => {
  try {
    const recommendations = accessibilityService.getAccessibilityRecommendations();
    
    res.json({
      success: true,
      recommendations,
      count: recommendations.length
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get recommendations' 
    });
  }
});

// Generate accessibility report
router.post('/api/accessibility/report', async (req, res) => {
  try {
    const { auditResult } = req.body;
    
    if (!auditResult) {
      return res.status(400).json({ 
        success: false, 
        error: 'Audit result is required' 
      });
    }

    const report = accessibilityService.generateReport(auditResult);
    
    res.json({
      success: true,
      report,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate report' 
    });
  }
});

// Create or update preview session
router.post('/api/accessibility/preview', async (req, res) => {
  try {
    const { sessionId, htmlContent, cssContent, settings } = req.body;
    
    if (!sessionId || !htmlContent) {
      return res.status(400).json({ 
        success: false, 
        error: 'Session ID and HTML content are required' 
      });
    }

    // Analyze the content
    const auditResult = await accessibilityService.analyzeHTML(htmlContent, cssContent);
    
    // In a real implementation, you'd save this to the database
    const previewSession = {
      sessionId,
      htmlContent,
      cssContent: cssContent || '',
      accessibilityScore: auditResult.score,
      issues: auditResult.issues,
      settings: settings || {},
      updatedAt: new Date()
    };

    res.json({
      success: true,
      session: previewSession,
      auditResult
    });
  } catch (error) {
    console.error('Error creating preview session:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create preview session' 
    });
  }
});

// Get preview session
router.get('/api/accessibility/preview/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // In a real implementation, you'd fetch from database
    // For now, return a mock session
    const mockSession = {
      sessionId,
      htmlContent: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <title>Sample Preview</title>
          </head>
          <body>
            <h1>Welcome to Accessibility Preview</h1>
            <p>This is a sample preview session.</p>
          </body>
        </html>
      `,
      cssContent: 'body { font-family: Arial, sans-serif; }',
      accessibilityScore: 85,
      issues: [],
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.json({
      success: true,
      session: mockSession
    });
  } catch (error) {
    console.error('Error getting preview session:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get preview session' 
    });
  }
});

// Get accessibility design tokens
router.get('/api/accessibility/tokens', async (req, res) => {
  try {
    // Sample accessibility design tokens
    const tokens = [
      {
        id: 1,
        name: 'primary-text',
        category: 'color',
        value: '#2D3748',
        wcagCompliant: true,
        contrastRatio: '7.2:1',
        description: 'Primary text color with AAA contrast',
        usage: 'Use for main body text and headings'
      },
      {
        id: 2,
        name: 'secondary-text',
        category: 'color',
        value: '#4A5568',
        wcagCompliant: true,
        contrastRatio: '5.8:1',
        description: 'Secondary text color with AA+ contrast',
        usage: 'Use for secondary text and captions'
      },
      {
        id: 3,
        name: 'focus-ring',
        category: 'focus',
        value: '2px solid #3182CE',
        wcagCompliant: true,
        contrastRatio: '4.6:1',
        description: 'Focus indicator with sufficient contrast',
        usage: 'Apply to interactive elements on focus'
      },
      {
        id: 4,
        name: 'heading-large',
        category: 'typography',
        value: 'font-size: 2rem; line-height: 1.2; font-weight: 600;',
        wcagCompliant: true,
        description: 'Large heading with proper line height',
        usage: 'Use for main page headings (h1)'
      },
      {
        id: 5,
        name: 'spacing-touch',
        category: 'spacing',
        value: '44px',
        wcagCompliant: true,
        description: 'Minimum touch target size',
        usage: 'Apply to buttons and clickable elements'
      },
      {
        id: 6,
        name: 'success-color',
        category: 'color',
        value: '#38A169',
        wcagCompliant: true,
        contrastRatio: '4.7:1',
        description: 'Success color with AA contrast',
        usage: 'Use for success messages and positive states'
      },
      {
        id: 7,
        name: 'error-color',
        category: 'color',
        value: '#E53E3E',
        wcagCompliant: true,
        contrastRatio: '5.1:1',
        description: 'Error color with AA+ contrast',
        usage: 'Use for error messages and negative states'
      },
      {
        id: 8,
        name: 'warning-color',
        category: 'color',
        value: '#D69E2E',
        wcagCompliant: true,
        contrastRatio: '4.8:1',
        description: 'Warning color with AA contrast',
        usage: 'Use for warning messages and caution states'
      }
    ];

    res.json({
      success: true,
      tokens,
      count: tokens.length,
      categories: ['color', 'typography', 'spacing', 'focus']
    });
  } catch (error) {
    console.error('Error getting accessibility tokens:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get accessibility tokens' 
    });
  }
});

// Get accessibility guidelines
router.get('/api/accessibility/guidelines', async (req, res) => {
  try {
    const { category, wcagLevel } = req.query;
    
    // Sample accessibility guidelines
    let guidelines = [
      {
        id: 1,
        title: 'Provide text alternatives for images',
        category: 'images',
        wcagLevel: 'A',
        description: 'All images must have appropriate alternative text that describes their content or function.',
        implementation: 'Add alt attributes to img elements. Use empty alt="" for decorative images.',
        examples: [
          { good: '<img src="chart.png" alt="Sales increased 25% from Q1 to Q2">' },
          { bad: '<img src="chart.png" alt="chart">' },
          { decorative: '<img src="decoration.png" alt="">' }
        ],
        priority: 'critical'
      },
      {
        id: 2,
        title: 'Ensure sufficient color contrast',
        category: 'color',
        wcagLevel: 'AA',
        description: 'Text and background colors must have sufficient contrast for readability.',
        implementation: 'Use a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text.',
        examples: [
          { good: 'Black text (#000000) on white background (#FFFFFF) = 21:1' },
          { bad: 'Light gray text (#CCCCCC) on white background = 1.6:1' }
        ],
        priority: 'high'
      },
      {
        id: 3,
        title: 'Make all functionality keyboard accessible',
        category: 'keyboard',
        wcagLevel: 'A',
        description: 'All interactive elements must be operable via keyboard navigation.',
        implementation: 'Ensure proper tab order, focus indicators, and keyboard event handlers.',
        examples: [
          { good: '<button tabindex="0" onKeyDown={handleKeyDown}>Submit</button>' },
          { bad: '<div onClick={handleClick}>Submit</div>' }
        ],
        priority: 'critical'
      },
      {
        id: 4,
        title: 'Use proper heading hierarchy',
        category: 'structure',
        wcagLevel: 'A',
        description: 'Organize content with a logical heading structure (h1, h2, h3, etc.).',
        implementation: 'Use headings in sequential order without skipping levels.',
        examples: [
          { good: '<h1>Main Title</h1><h2>Section</h2><h3>Subsection</h3>' },
          { bad: '<h1>Main Title</h1><h3>Subsection</h3>' }
        ],
        priority: 'medium'
      },
      {
        id: 5,
        title: 'Provide labels for form controls',
        category: 'forms',
        wcagLevel: 'A',
        description: 'All form inputs must have accessible labels or descriptions.',
        implementation: 'Use label elements or aria-label attributes for all form controls.',
        examples: [
          { good: '<label for="email">Email Address</label><input type="email" id="email">' },
          { bad: '<input type="email" placeholder="Email">' }
        ],
        priority: 'critical'
      }
    ];

    // Filter by category if provided
    if (category) {
      guidelines = guidelines.filter(g => g.category === category);
    }

    // Filter by WCAG level if provided
    if (wcagLevel) {
      guidelines = guidelines.filter(g => g.wcagLevel === wcagLevel);
    }

    res.json({
      success: true,
      guidelines,
      count: guidelines.length,
      categories: ['images', 'color', 'keyboard', 'structure', 'forms'],
      wcagLevels: ['A', 'AA', 'AAA']
    });
  } catch (error) {
    console.error('Error getting guidelines:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get guidelines' 
    });
  }
});

// Quick accessibility check for common issues
router.post('/api/accessibility/quick-check', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        success: false, 
        error: 'URL is required' 
      });
    }

    // Mock quick check results
    const quickCheck = {
      url,
      score: 78,
      issues: [
        {
          type: 'Missing alt text',
          count: 3,
          severity: 'high'
        },
        {
          type: 'Low color contrast',
          count: 2,
          severity: 'medium'
        },
        {
          type: 'Missing form labels',
          count: 1,
          severity: 'high'
        }
      ],
      recommendations: [
        'Add alt attributes to 3 images',
        'Increase contrast for 2 color combinations',
        'Add label to email input field'
      ],
      checkedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      quickCheck
    });
  } catch (error) {
    console.error('Error performing quick check:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to perform quick check' 
    });
  }
});

export default router;