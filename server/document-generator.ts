/**
 * Document generator module
 * Provides functionality to generate PDF documents from templates
 */

import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import Mustache from 'mustache';
import { log } from './vite';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Define document types
export type DocumentType = 
  | 'deposit_certificate' 
  | 'deposit_prescribed_info'
  | 'tenancy_agreement'
  | 'property_inventory'
  | 'maintenance_report'
  | 'safety_certificate';

// Get current file path and directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Output directory for generated documents
const OUTPUT_DIR = path.join(__dirname, '..', 'documents');

// Create the output directory if it doesn't exist
try {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
} catch (error: any) {
  log(`Error creating documents directory: ${error.message}`, 'error');
}

// Document generation options
export interface DocumentOptions {
  fontSize?: number;
  fontFamily?: string;
  margins?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  headerText?: string;
  footerText?: string;
  watermark?: string;
  showPageNumbers?: boolean;
}

/**
 * Generate a PDF document from a Mustache template
 * @param templateType Type of document template to use
 * @param data Data to populate the template with
 * @param options PDF generation options
 * @returns Path to the generated PDF
 */
export async function generatePDF(
  templateType: DocumentType,
  data: Record<string, any>,
  options: DocumentOptions = {}
): Promise<string> {
  try {
    // Load template
    const templatePath = path.join(__dirname, '..', 'templates', `${templateType}.mustache`);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templateType}`);
    }
    
    const template = fs.readFileSync(templatePath, 'utf8');
    
    // Render template with data
    const markdown = Mustache.render(template, data);
    
    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${templateType}_${timestamp}.pdf`;
    const outputPath = path.join(OUTPUT_DIR, filename);
    
    // Create PDF from markdown
    await createPDFFromMarkdown(markdown, outputPath, options);
    
    return outputPath;
  } catch (error: any) {
    log(`PDF generation error: ${error.message}`, 'error');
    throw new Error(`Failed to generate ${templateType} PDF: ${error.message}`);
  }
}

/**
 * Create a PDF document from markdown content
 * @param markdown Markdown content to convert to PDF
 * @param outputPath Path to save the PDF to
 * @param options PDF generation options
 * @returns Promise that resolves when the PDF is created
 */
function createPDFFromMarkdown(
  markdown: string,
  outputPath: string,
  options: DocumentOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Set default options
      const fontSize = options.fontSize || 12;
      const fontFamily = options.fontFamily || 'Helvetica';
      
      const margins = {
        top: options.margins?.top || 72,    // 1 inch
        bottom: options.margins?.bottom || 72,
        left: options.margins?.left || 72,
        right: options.margins?.right || 72
      };
      
      // Create a new PDF document
      const doc = new PDFDocument({
        margins,
        size: 'A4'
      });
      
      // Pipe output to file
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      // Set default font
      doc.font(fontFamily).fontSize(fontSize);
      
      // Add watermark if specified
      if (options.watermark) {
        // Get the page dimensions directly from PDFKit's page object
        const pageWidth = doc.page.width as number;
        const pageHeight = doc.page.height as number;
        
        doc.save();
        doc.opacity(0.1);
        doc.fontSize(60);
        doc.rotate(45, { origin: [pageWidth / 2, pageHeight / 2] });
        doc.text(options.watermark, 0, 0, {
          align: 'center',
          width: pageWidth * 1.5,
          height: pageHeight
        });
        doc.restore();
      }
      
      // Add header if specified
      if (options.headerText) {
        doc.fontSize(fontSize - 2);
        doc.text(options.headerText, {
          align: 'center'
        });
        doc.moveDown(2);
      }
      
      // Register a page event handler for page numbers and footer
      if (options.showPageNumbers || options.footerText) {
        let pageNumber = 1;
        
        doc.on('pageAdded', () => {
          pageNumber++;
          
          if (options.footerText || options.showPageNumbers) {
            const footerY = doc.page.height - margins.bottom / 2;
            
            doc.switchToPage(pageNumber - 1);
            doc.fontSize(fontSize - 2);
            
            if (options.footerText) {
              doc.text(options.footerText, margins.left, footerY, {
                align: 'center',
                width: doc.page.width - margins.left - margins.right
              });
            }
            
            if (options.showPageNumbers) {
              doc.text(`Page ${pageNumber} of ${doc.bufferedPageRange().count}`, margins.left, footerY + 15, {
                align: 'center',
                width: doc.page.width - margins.left - margins.right
              });
            }
          }
        });
      }
      
      // Process markdown and render to PDF
      const lines = markdown.split('\n');
      let inCodeBlock = false;
      let inList = false;
      
      lines.forEach(line => {
        // Check for code blocks
        if (line.startsWith('```')) {
          inCodeBlock = !inCodeBlock;
          doc.moveDown();
          return;
        }
        
        if (inCodeBlock) {
          doc.font('Courier').fontSize(fontSize - 1);
          doc.text(line);
          doc.font(fontFamily).fontSize(fontSize);
          return;
        }
        
        // Handle headings
        if (line.startsWith('# ')) {
          doc.fontSize(fontSize + 8).font(`${fontFamily}-Bold`);
          doc.text(line.substring(2));
          doc.font(fontFamily).fontSize(fontSize);
          doc.moveDown();
        } else if (line.startsWith('## ')) {
          doc.fontSize(fontSize + 4).font(`${fontFamily}-Bold`);
          doc.text(line.substring(3));
          doc.font(fontFamily).fontSize(fontSize);
          doc.moveDown();
        } else if (line.startsWith('### ')) {
          doc.fontSize(fontSize + 2).font(`${fontFamily}-Bold`);
          doc.text(line.substring(4));
          doc.font(fontFamily).fontSize(fontSize);
          doc.moveDown();
        } else if (line.startsWith('- ')) {
          // List items
          doc.fontSize(fontSize);
          doc.text(`• ${line.substring(2)}`, {
            indent: 20,
            continued: false
          });
          inList = true;
        } else if (line.startsWith('---')) {
          // Horizontal rule
          doc.moveTo(margins.left, doc.y)
            .lineTo(doc.page.width - margins.right, doc.y)
            .stroke();
          doc.moveDown();
        } else if (line.trim() === '') {
          // Empty line
          if (inList) {
            inList = false;
          }
          doc.moveDown();
        } else {
          // Regular text with formatting
          doc.fontSize(fontSize);
          renderFormattedText(doc, line);
          doc.moveDown();
        }
      });
      
      // Finalize the PDF document
      doc.end();
      
      // Handle stream events
      stream.on('finish', () => {
        resolve();
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Render text with formatting (bold, italic) to PDF
 * @param doc PDFDocument to render to
 * @param text Text to render with formatting
 */
function renderFormattedText(doc: PDFKit.PDFDocument, text: string): void {
  // Process text with markdown formatting
  let processedText = text;
  
  // Handle bold text
  processedText = processedText.replace(/\*\*(.*?)\*\*/g, (match, p1) => {
    const originalFont = doc.currentLineHeight();
    doc.font('Helvetica-Bold');
    doc.text(p1, { continued: true });
    doc.font('Helvetica');
    return '';
  });
  
  // Handle italic text
  processedText = processedText.replace(/\*(.*?)\*/g, (match, p1) => {
    doc.font('Helvetica-Oblique');
    doc.text(p1, { continued: true });
    doc.font('Helvetica');
    return '';
  });
  
  // Add remaining text
  if (processedText.trim().length > 0) {
    doc.text(processedText);
  }
}

/**
 * Generate a deposit certificate
 * @param data Certificate data
 * @returns Path to the generated PDF
 */
export async function generateDepositCertificate(data: {
  title: string;
  certificateNumber: string;
  depositScheme: string;
  depositId: string;
  dateProtected: string;
  propertyAddress: string;
  depositAmount: string;
  tenancyStartDate: string;
  tenancyEndDate?: string;
  landlordName: string;
  tenantName: string;
  schemeContactInfo: string;
  date: string;
}): Promise<string> {
  const options: DocumentOptions = {
    fontSize: 12,
    fontFamily: 'Helvetica',
    margins: {
      top: 72,
      bottom: 72,
      left: 72,
      right: 72
    },
    headerText: 'DEPOSIT PROTECTION CERTIFICATE',
    footerText: `© ${new Date().getFullYear()} UniRent - Generated on ${new Date().toLocaleDateString()}`,
    showPageNumbers: true
  };
  
  return generatePDF('deposit_certificate', data, options);
}

/**
 * Generate prescribed information for deposit protection
 * @param data Prescribed information data
 * @returns Path to the generated PDF
 */
export async function generatePrescribedInformation(data: {
  title: string;
  certificateNumber: string;
  depositScheme: string;
  depositId: string;
  dateProtected: string;
  propertyAddress: string;
  depositAmount: string;
  tenancyStartDate: string;
  tenancyEndDate?: string;
  landlordName: string;
  landlordAddress: string;
  landlordPhone: string;
  landlordEmail: string;
  tenantName: string;
  tenantAddress: string;
  tenantPhone: string;
  tenantEmail: string;
  schemeContactInfo: string;
  schemeTelephoneNumber: string;
  schemeEmail: string;
  schemeWebsite: string;
  schemeDisputes: string;
  date: string;
}): Promise<string> {
  const options: DocumentOptions = {
    fontSize: 12,
    fontFamily: 'Helvetica',
    margins: {
      top: 72,
      bottom: 72,
      left: 72,
      right: 72
    },
    headerText: 'PRESCRIBED INFORMATION',
    watermark: 'PRESCRIBED INFORMATION',
    footerText: `© ${new Date().getFullYear()} UniRent - Generated on ${new Date().toLocaleDateString()}`,
    showPageNumbers: true
  };
  
  return generatePDF('deposit_prescribed_info', data, options);
}

/**
 * Generate a tenancy agreement
 * @param data Tenancy agreement data
 * @returns Path to the generated PDF
 */
export async function generateTenancyAgreement(data: Record<string, any>): Promise<string> {
  const options: DocumentOptions = {
    fontSize: 12,
    fontFamily: 'Helvetica',
    margins: {
      top: 72,
      bottom: 72,
      left: 72,
      right: 72
    },
    headerText: 'ASSURED SHORTHOLD TENANCY AGREEMENT',
    watermark: 'TENANCY AGREEMENT',
    footerText: `© ${new Date().getFullYear()} UniRent - Generated on ${new Date().toLocaleDateString()}`,
    showPageNumbers: true
  };
  
  return generatePDF('tenancy_agreement', data, options);
}

/**
 * Generate a property inventory
 * @param data Property inventory data
 * @returns Path to the generated PDF
 */
export async function generatePropertyInventory(data: Record<string, any>): Promise<string> {
  const options: DocumentOptions = {
    fontSize: 12,
    fontFamily: 'Helvetica',
    margins: {
      top: 72,
      bottom: 72,
      left: 72,
      right: 72
    },
    headerText: 'PROPERTY INVENTORY',
    watermark: 'INVENTORY',
    footerText: `© ${new Date().getFullYear()} UniRent - Generated on ${new Date().toLocaleDateString()}`,
    showPageNumbers: true
  };
  
  return generatePDF('property_inventory', data, options);
}

export default {
  generatePDF,
  generateDepositCertificate,
  generatePrescribedInformation,
  generateTenancyAgreement,
  generatePropertyInventory
};