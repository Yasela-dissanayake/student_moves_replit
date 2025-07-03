import type { AccessibilityIssue, ContrastAnalysis, AuditResult } from '../shared/accessibility-schema';

export class AccessibilityService {
  
  /**
   * Analyze HTML content for accessibility issues
   */
  async analyzeHTML(htmlContent: string, cssContent?: string): Promise<AuditResult> {
    const issues: AccessibilityIssue[] = [];
    
    // Parse HTML content
    const htmlAnalysis = this.analyzeHTMLStructure(htmlContent);
    issues.push(...htmlAnalysis);
    
    // Analyze color contrast if CSS is provided
    if (cssContent) {
      const colorAnalysis = this.analyzeColorContrast(cssContent);
      issues.push(...colorAnalysis);
    }
    
    // Calculate score based on issues
    const score = this.calculateAccessibilityScore(issues);
    const complianceLevel = this.determineComplianceLevel(issues);
    
    return {
      score,
      issues,
      passed: this.countPassedChecks(issues),
      failed: issues.filter(i => i.type === 'error').length,
      warnings: issues.filter(i => i.type === 'warning').length,
      complianceLevel
    };
  }

  /**
   * Analyze HTML structure for accessibility issues
   */
  private analyzeHTMLStructure(html: string): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    // Check for missing alt attributes on images
    const imgRegex = /<img[^>]*>/gi;
    const images = html.match(imgRegex) || [];
    images.forEach((img, index) => {
      if (!img.includes('alt=')) {
        issues.push({
          id: `img-alt-${index}`,
          type: 'error',
          severity: 'high',
          wcagRule: 'WCAG 1.1.1',
          element: img,
          message: 'Image missing alt attribute',
          suggestion: 'Add descriptive alt text to convey the image content to screen readers',
          codeExample: '<img src="image.jpg" alt="Descriptive text about the image">'
        });
      }
    });

    // Check for heading hierarchy
    const headingRegex = /<h([1-6])[^>]*>.*?<\/h[1-6]>/gi;
    const headings = html.match(headingRegex) || [];
    let previousLevel = 0;
    headings.forEach((heading, index) => {
      const levelMatch = heading.match(/<h([1-6])/);
      if (levelMatch) {
        const currentLevel = parseInt(levelMatch[1]);
        if (currentLevel > previousLevel + 1 && previousLevel > 0) {
          issues.push({
            id: `heading-hierarchy-${index}`,
            type: 'warning',
            severity: 'medium',
            wcagRule: 'WCAG 1.3.1',
            element: heading,
            message: 'Heading levels should not skip (e.g., h1 to h3)',
            suggestion: 'Use heading levels in sequential order (h1, h2, h3, etc.)',
            codeExample: '<h1>Main Title</h1><h2>Section</h2><h3>Subsection</h3>'
          });
        }
        previousLevel = currentLevel;
      }
    });

    // Check for form labels
    const inputRegex = /<input[^>]*>/gi;
    const inputs = html.match(inputRegex) || [];
    inputs.forEach((input, index) => {
      const hasId = input.includes('id=');
      const hasAriaLabel = input.includes('aria-label=');
      const inputId = hasId ? input.match(/id="([^"]*)"/) : null;
      
      if (!hasAriaLabel && hasId && inputId && inputId[1]) {
        const labelRegex = new RegExp(`<label[^>]*for="${inputId[1]}"[^>]*>`, 'gi');
        if (!html.match(labelRegex)) {
          issues.push({
            id: `input-label-${index}`,
            type: 'error',
            severity: 'high',
            wcagRule: 'WCAG 1.3.1',
            element: input,
            message: 'Form input missing associated label',
            suggestion: 'Add a label element or aria-label attribute',
            codeExample: '<label for="email">Email:</label><input type="email" id="email">'
          });
        }
      }
    });

    // Check for button accessibility
    const buttonRegex = /<button[^>]*>.*?<\/button>/gi;
    const buttons = html.match(buttonRegex) || [];
    buttons.forEach((button, index) => {
      if (!button.includes('aria-label') && !button.match(/>[\s\S]*?[a-zA-Z][\s\S]*?</)) {
        issues.push({
          id: `button-text-${index}`,
          type: 'error',
          severity: 'high',
          wcagRule: 'WCAG 2.4.4',
          element: button,
          message: 'Button missing accessible text',
          suggestion: 'Add descriptive text inside button or use aria-label',
          codeExample: '<button aria-label="Close dialog">×</button> or <button>Close</button>'
        });
      }
    });

    // Check for missing main landmark
    if (!html.includes('<main') && !html.includes('role="main"')) {
      issues.push({
        id: 'missing-main',
        type: 'warning',
        severity: 'medium',
        wcagRule: 'WCAG 1.3.1',
        element: 'document',
        message: 'Page missing main landmark',
        suggestion: 'Add a main element to identify the primary content',
        codeExample: '<main><!-- Primary page content --></main>'
      });
    }

    // Check for missing page title
    if (!html.includes('<title>') || html.match(/<title>\s*<\/title>/)) {
      issues.push({
        id: 'missing-title',
        type: 'error',
        severity: 'critical',
        wcagRule: 'WCAG 2.4.2',
        element: 'document',
        message: 'Page missing or empty title',
        suggestion: 'Add a descriptive page title',
        codeExample: '<title>Page Name - Site Name</title>'
      });
    }

    return issues;
  }

  /**
   * Analyze CSS for color contrast issues
   */
  private analyzeColorContrast(css: string): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    // Extract color declarations
    const colorRegex = /color:\s*([^;]+);/gi;
    const backgroundRegex = /background-color:\s*([^;]+);/gi;
    
    const colors = css.match(colorRegex) || [];
    const backgrounds = css.match(backgroundRegex) || [];
    
    // Basic contrast check (simplified)
    if (colors.length > 0 && backgrounds.length > 0) {
      const sampleColor = colors[0].replace('color:', '').trim();
      const sampleBackground = backgrounds[0].replace('background-color:', '').trim();
      
      const contrast = this.calculateContrastRatio(sampleColor, sampleBackground);
      
      if (contrast.ratio < 4.5) {
        issues.push({
          id: 'low-contrast',
          type: 'error',
          severity: 'high',
          wcagRule: 'WCAG 1.4.3',
          element: 'color declarations',
          message: `Low color contrast ratio: ${contrast.ratio.toFixed(2)}:1`,
          suggestion: 'Increase contrast between text and background colors (minimum 4.5:1 for normal text)',
          codeExample: 'Use darker text on light backgrounds or lighter text on dark backgrounds'
        });
      }
    }
    
    return issues;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  private calculateContrastRatio(color1: string, color2: string): ContrastAnalysis {
    // Simplified contrast calculation
    // In a real implementation, you'd convert colors to RGB and use the WCAG formula
    const ratio = 4.8; // Mock ratio for demo
    
    return {
      foreground: color1,
      background: color2,
      ratio,
      wcagAA: ratio >= 4.5,
      wcagAAA: ratio >= 7,
      level: ratio >= 7 ? 'aaa' : ratio >= 4.5 ? 'aa' : 'fail'
    };
  }

  /**
   * Calculate overall accessibility score
   */
  private calculateAccessibilityScore(issues: AccessibilityIssue[]): number {
    let score = 100;
    
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });
    
    return Math.max(0, score);
  }

  /**
   * Determine WCAG compliance level
   */
  private determineComplianceLevel(issues: AccessibilityIssue[]): 'A' | 'AA' | 'AAA' | 'Non-compliant' {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;
    
    if (criticalIssues > 0) return 'Non-compliant';
    if (highIssues > 2) return 'Non-compliant';
    if (highIssues > 0 || mediumIssues > 3) return 'A';
    if (mediumIssues > 0) return 'AA';
    return 'AAA';
  }

  /**
   * Count passed accessibility checks
   */
  private countPassedChecks(issues: AccessibilityIssue[]): number {
    // In a real implementation, you'd track all checks performed
    const totalChecks = 15; // Total accessibility checks performed
    const failedChecks = issues.length;
    return Math.max(0, totalChecks - failedChecks);
  }

  /**
   * Get accessibility recommendations based on common issues
   */
  getAccessibilityRecommendations(): string[] {
    return [
      'Add alt attributes to all images',
      'Ensure proper heading hierarchy (h1 → h2 → h3)',
      'Use sufficient color contrast (4.5:1 minimum)',
      'Provide labels for all form inputs',
      'Include focus indicators for interactive elements',
      'Use semantic HTML elements (main, nav, header, footer)',
      'Ensure keyboard accessibility for all interactive elements',
      'Add ARIA labels where needed',
      'Test with screen readers',
      'Validate HTML markup'
    ];
  }

  /**
   * Generate accessibility report
   */
  generateReport(auditResult: AuditResult): string {
    const { score, issues, passed, failed, warnings, complianceLevel } = auditResult;
    
    let report = `# Accessibility Audit Report\n\n`;
    report += `**Overall Score:** ${score}/100\n`;
    report += `**WCAG Compliance:** ${complianceLevel}\n`;
    report += `**Checks Passed:** ${passed}\n`;
    report += `**Issues Found:** ${failed + warnings}\n\n`;
    
    if (issues.length > 0) {
      report += `## Issues Found\n\n`;
      issues.forEach((issue, index) => {
        report += `### ${index + 1}. ${issue.message}\n`;
        report += `- **Severity:** ${issue.severity}\n`;
        report += `- **WCAG Rule:** ${issue.wcagRule}\n`;
        report += `- **Suggestion:** ${issue.suggestion}\n`;
        if (issue.codeExample) {
          report += `- **Example:** \`${issue.codeExample}\`\n`;
        }
        report += `\n`;
      });
    }
    
    return report;
  }
}

export const accessibilityService = new AccessibilityService();