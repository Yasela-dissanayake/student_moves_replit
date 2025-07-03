import fs from 'fs';
import path from 'path';
import { PDFDocument, PDFPage, rgb } from 'pdf-lib';
import mammoth from 'mammoth';
import { storage } from './storage';

export interface DocumentMetadata {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  pageCount?: number;
  extractedText: string;
  signatureFields: SignatureField[];
}

export interface SignatureField {
  id: string;
  type: 'signature' | 'initial' | 'date' | 'text';
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
  placeholder?: string;
}

export class DocumentConverter {
  private uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
  
  constructor() {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Convert uploaded document to e-signature format
   */
  async convertDocument(filePath: string, originalName: string, userId: number): Promise<DocumentMetadata> {
    const fileExtension = path.extname(originalName).toLowerCase();
    const fileName = `${Date.now()}_${path.basename(originalName, fileExtension)}.pdf`;
    const outputPath = path.join(this.uploadsDir, fileName);
    
    let extractedText = '';
    let pdfDoc: PDFDocument;
    
    try {
      if (fileExtension === '.pdf') {
        // Handle PDF files
        const pdfBuffer = fs.readFileSync(filePath);
        pdfDoc = await PDFDocument.load(pdfBuffer);
        extractedText = await this.extractTextFromPDF(pdfDoc);
      } else if (fileExtension === '.docx' || fileExtension === '.doc') {
        // Handle Word documents
        const result = await this.convertWordToPDF(filePath);
        extractedText = result.text;
        pdfDoc = result.pdfDoc;
      } else {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      // Auto-detect signature fields in the document
      const signatureFields = this.detectSignatureFields(extractedText, pdfDoc.getPageCount());
      
      // Save the converted PDF
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(outputPath, pdfBytes);
      
      // Get file stats
      const stats = fs.statSync(outputPath);
      
      const metadata: DocumentMetadata = {
        fileName,
        originalName,
        mimeType: 'application/pdf',
        size: stats.size,
        pageCount: pdfDoc.getPageCount(),
        extractedText,
        signatureFields
      };

      // Store document metadata in database
      await this.storeDocumentMetadata(metadata, userId);
      
      return metadata;
      
    } catch (error: any) {
      console.error('Document conversion error:', error);
      throw new Error(`Failed to convert document: ${error.message}`);
    } finally {
      // Clean up original file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  /**
   * Convert Word document to PDF
   */
  private async convertWordToPDF(filePath: string): Promise<{ text: string; pdfDoc: PDFDocument }> {
    try {
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.convertToHtml({ buffer });
      const text = await mammoth.extractRawText({ buffer });
      
      // Create PDF from HTML content
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const { height } = page.getSize();
      
      // Split text into lines and add to PDF
      const lines = text.value.split('\n');
      let yPosition = height - 50;
      const fontSize = 12;
      const lineHeight = fontSize + 4;
      
      for (const line of lines) {
        if (yPosition < 50) {
          // Add new page if needed
          const newPage = pdfDoc.addPage([595.28, 841.89]);
          yPosition = newPage.getSize().height - 50;
        }
        
        if (line.trim()) {
          page.drawText(line.trim(), {
            x: 50,
            y: yPosition,
            size: fontSize,
            color: rgb(0, 0, 0),
          });
        }
        yPosition -= lineHeight;
      }
      
      return {
        text: text.value,
        pdfDoc
      };
      
    } catch (error: any) {
      throw new Error(`Failed to convert Word document: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF document
   */
  private async extractTextFromPDF(pdfDoc: PDFDocument): Promise<string> {
    try {
      // For now, return placeholder text since pdf-lib doesn't have built-in text extraction
      // In production, you'd use a library like pdf-parse or pdf2json
      return 'PDF content extracted (placeholder - implement with pdf-parse library)';
    } catch (error) {
      console.error('PDF text extraction error:', error);
      return '';
    }
  }

  /**
   * Auto-detect signature fields based on text patterns
   */
  private detectSignatureFields(text: string, pageCount: number): SignatureField[] {
    const fields: SignatureField[] = [];
    const signaturePatterns = [
      /signature\s*:/i,
      /sign\s*here/i,
      /signed\s*by/i,
      /\s*_+\s*$/m, // Lines for signatures
      /date\s*:/i,
      /initial\s*:/i,
      /tenant\s*signature/i,
      /landlord\s*signature/i,
      /agent\s*signature/i,
      /witness\s*signature/i
    ];

    let fieldId = 1;
    
    signaturePatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        // Distribute fields across pages if multiple pages
        const targetPage = Math.min(Math.floor(index / 3) + 1, pageCount);
        
        fields.push({
          id: `field_${fieldId++}`,
          type: pattern.source.includes('date') ? 'date' : 
                pattern.source.includes('initial') ? 'initial' : 'signature',
          page: targetPage,
          x: 100 + (index % 3) * 150, // Distribute horizontally
          y: 100 + Math.floor(index / 3) * 80, // Distribute vertically
          width: 120,
          height: 40,
          required: true,
          placeholder: pattern.source.includes('date') ? 'Date' :
                      pattern.source.includes('initial') ? 'Initial' : 'Signature'
        });
      }
    });

    // Add default signature field if none detected
    if (fields.length === 0) {
      fields.push({
        id: 'default_signature',
        type: 'signature',
        page: pageCount,
        x: 100,
        y: 100,
        width: 150,
        height: 50,
        required: true,
        placeholder: 'Signature'
      });
    }

    return fields;
  }

  /**
   * Store document metadata in database
   */
  private async storeDocumentMetadata(metadata: DocumentMetadata, userId: number): Promise<void> {
    try {
      // Document template will be created by the route handler
      console.log('Document metadata prepared for storage:', {
        fileName: metadata.fileName,
        originalName: metadata.originalName,
        pageCount: metadata.pageCount,
        fieldsDetected: metadata.signatureFields.length
      });
    } catch (error: any) {
      console.error('Failed to store document metadata:', error);
    }
  }

  /**
   * Get document file path
   */
  getDocumentPath(fileName: string): string {
    return path.join(this.uploadsDir, fileName);
  }

  /**
   * Delete document file
   */
  deleteDocument(fileName: string): void {
    const filePath = this.getDocumentPath(fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

export const documentConverter = new DocumentConverter();