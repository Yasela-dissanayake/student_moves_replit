import { executeAIOperation } from './ai-service-manager';

/**
 * Document Parser Service
 * 
 * Uses AI to extract information from different document types and
 * structure them into standardized formats
 */

// Document Types
export type DocumentType = 
  | 'tenancy_agreement'
  | 'lease_contract'
  | 'maintenance_request'
  | 'property_inspection'
  | 'receipt'
  | 'invoice'
  | 'deposit_certificate'
  | 'reference_letter'
  | 'right_to_rent'
  | 'guarantor_form'
  | 'identification'
  | 'utility_bill'
  | 'epc_certificate'
  | 'gas_safety'
  | 'electrical_safety'
  | 'inventory_report'
  | 'hmo_license'
  | 'insurance_policy'
  | 'eviction_notice'
  | 'letter'
  | 'email'
  | 'other';

// Main interfaces
interface ExtractedDocumentInfo {
  documentType: DocumentType | string;
  title: string;
  extractedText: string;
  keyDetails: Record<string, any>;
  confidence: number;
  fileType?: string;
  pageCount?: number;
  metadata?: Record<string, any>;
  suggestedActions?: string[];
}

interface StructuredDocument {
  title: string;
  content: string;
  documentType: DocumentType | string;
  keyDetails: Record<string, any>;
  recommendation?: string;
  summaryPoints?: string[];
  importantDates?: Record<string, string>;
  parties?: Record<string, any>[];
  highlightedTerms?: Array<{term: string, explanation: string}>;
}

// Property document specific interfaces
interface TenancyAgreementDetails {
  propertyAddress: string;
  tenantNames: string[];
  landlordNames: string[];
  agentName?: string;
  startDate: string;
  endDate: string;
  rentAmount: string;
  depositAmount: string;
  depositScheme?: string;
  paymentFrequency: string;
  specialConditions?: string[];
  breakClause?: string;
}

interface MaintenanceRequestDetails {
  propertyAddress: string;
  reportingTenant: string;
  issueDescription: string;
  dateReported: string;
  priority?: 'low' | 'medium' | 'high' | 'emergency';
  roomsAffected: string[];
  requestedSolution?: string;
  accessInstructions?: string;
}

interface PropertyInspectionDetails {
  propertyAddress: string;
  inspectionDate: string;
  inspector: string;
  overallCondition: string;
  rooms: Array<{name: string, condition: string, issues?: string[]}>;
  maintenanceRequired: boolean;
  recommendedActions?: string[];
  photosIncluded?: boolean;
}

interface DepositCertificateDetails {
  tenantNames: string[];
  landlordNames: string[];
  propertyAddress: string;
  depositAmount: string;
  protectionScheme: string;
  protectionDate: string;
  certificateNumber: string;
  protectionType: 'custodial' | 'insurance';
  disputeService?: string;
}

interface RightToRentDetails {
  tenantName: string;
  nationality: string;
  documentType: string;
  documentNumber: string;
  validFrom?: string;
  validTo?: string;
  checkPerformedBy: string;
  checkDate: string;
  result: 'pass' | 'fail';
}

/**
 * Extracts information from a document using AI
 * 
 * @param fileBuffer The document file as a buffer
 * @param fileName Original filename
 * @param contentType MIME type of the file (optional)
 * @param options Advanced extraction options
 * @returns Extracted document information
 */
export async function extractDocumentInfo(
  fileBuffer: Buffer,
  fileName: string,
  contentType?: string,
  options?: {
    detectDocumentType?: boolean;
    extractMetadata?: boolean;
    extractAllText?: boolean;
    suggestActions?: boolean;
    confidenceThreshold?: number;
  }
): Promise<ExtractedDocumentInfo> {
  try {
    // Set default options
    const extractionOptions = {
      detectDocumentType: true,
      extractMetadata: true,
      extractAllText: true,
      suggestActions: true,
      confidenceThreshold: 0.6,
      ...options
    };
    
    // Convert buffer to base64 for AI processing
    const base64File = fileBuffer.toString('base64');
    
    // Determine file type from contentType or fileName extension
    const fileType = contentType ? 
      contentType.split('/')[1] : 
      fileName.split('.').pop()?.toLowerCase() || 'unknown';
    
    // Build a more detailed extraction prompt
    let extractionPrompt = '';
    
    if (extractionOptions.detectDocumentType) {
      extractionPrompt += `First, analyze this document and identify its type from these categories:
        - tenancy_agreement: Contracts between landlords and tenants for property rental
        - lease_contract: Similar to tenancy agreements but may have different terms
        - maintenance_request: Forms requesting repairs or maintenance for properties
        - property_inspection: Reports documenting property condition
        - receipt: Payment receipts for property-related expenses
        - invoice: Bills for property-related services
        - deposit_certificate: Documents confirming deposit protection
        - reference_letter: Letters vouching for tenant reliability
        - right_to_rent: Documents verifying tenant's legal right to rent in the UK
        - guarantor_form: Documents where someone guarantees rent payment
        - identification: ID documents like passports or driving licenses
        - utility_bill: Bills for utilities like gas, electricity, water
        - epc_certificate: Energy Performance Certificate documents
        - gas_safety: Gas safety inspection certificates
        - electrical_safety: Electrical safety certificates
        - inventory_report: Detailed listings of items in a property
        - hmo_license: House in Multiple Occupation license documents
        - insurance_policy: Property insurance documents
        - eviction_notice: Notices requiring tenants to vacate
        - letter: General correspondence
        - email: Email printouts
        - other: Documents not fitting categories above
        
        Then extract key information appropriate for that document type.`;
    }
    
    // Process with AI service manager using analyzeDocument operation
    const extractionResult = await executeAIOperation('analyzeDocument', {
      base64File,
      fileName,
      contentType,
      extractionMode: 'full',
      prompt: extractionPrompt,
      responseFormat: 'json_object'
    });
    
    // Get page count estimate if it's a PDF
    const pageCount = fileType === 'pdf' ? 
      estimatePageCount(fileBuffer) : 
      (extractionResult.pageCount || 1);
    
    // Create metadata
    const metadata: Record<string, any> = {
      fileName,
      fileType,
      fileSize: fileBuffer.length,
      extractedAt: new Date().toISOString(),
      pageCount,
      ...extractionResult.metadata
    };
    
    // Generate suggested actions based on document type if requested
    let suggestedActions: string[] = [];
    if (extractionOptions.suggestActions && extractionResult.documentType) {
      suggestedActions = generateSuggestedActions(extractionResult.documentType as DocumentType);
    }
    
    // Structure and return the result
    return {
      documentType: extractionResult.documentType || 'other',
      title: extractionResult.title || fileName,
      extractedText: extractionResult.text || '',
      keyDetails: extractionResult.keyDetails || {},
      confidence: extractionResult.confidence || 0.7,
      fileType,
      pageCount,
      metadata,
      suggestedActions: extractionResult.suggestedActions || suggestedActions
    };
  } catch (error) {
    console.error('Error extracting document info:', error);
    throw new Error('Failed to extract document information: ' + (error as Error).message);
  }
}

/**
 * Estimates the number of pages in a PDF buffer
 * Simple heuristic-based approach for estimation
 */
function estimatePageCount(buffer: Buffer): number {
  // Count occurrences of "<<\n/Type /Page" or similar pattern in PDFs
  const content = buffer.toString('utf-8', 0, Math.min(buffer.length, 1000000));
  const pageMatches = content.match(/<<\s*\/Type\s*\/Page/g);
  const pageCount = pageMatches ? pageMatches.length : 1;
  
  // Safety limit and minimum page count
  return Math.max(1, Math.min(pageCount, 1000));
}

/**
 * Generates suggested actions based on document type
 */
function generateSuggestedActions(documentType: DocumentType): string[] {
  switch(documentType) {
    case 'tenancy_agreement':
      return [
        'Review the terms and conditions thoroughly',
        'Check all dates and payment amounts are correct',
        'Verify deposit protection arrangements',
        'Sign and return the agreement to all parties',
        'Store a copy securely'
      ];
    case 'maintenance_request':
      return [
        'Assign to appropriate maintenance personnel',
        'Schedule inspection if needed',
        'Communicate with tenant about timeframe',
        'Document the problem with photos if possible',
        'Track progress in the maintenance system'
      ];
    case 'deposit_certificate':
      return [
        'Verify all tenant details are correct',
        'Check deposit amount matches agreement',
        'Ensure certificate has been shared with tenants',
        'Store with related tenancy documentation',
        'Set reminder for end-of-tenancy procedures'
      ];
    case 'right_to_rent':
      return [
        'Verify all identification details are valid',
        'Check expiry dates on right to rent documentation',
        'Store securely with tenancy documents',
        'Set reminder for follow-up checks if visa expiry',
        'Ensure compliance with immigration regulations'
      ];
    case 'property_inspection':
      return [
        'Address any maintenance issues identified',
        'Communicate findings with relevant parties',
        'Schedule follow-up inspections if needed',
        'Update property condition records',
        'Document any tenant communications about findings'
      ];
    default:
      return [
        'Review the document contents',
        'Store it in the appropriate location',
        'Share with relevant parties if needed',
        'Take any required actions based on content',
        'Set reminders for any important dates mentioned'
      ];
  }
}

/**
 * Structures document content into a standardized format based on document type
 * 
 * @param extractedText Text content extracted from document
 * @param documentType Type of document
 * @returns Structured document
 */
export async function structureDocument(
  extractedText: string,
  documentType: string
): Promise<StructuredDocument> {
  try {
    // Process with AI service manager
    const structureResult = await executeAIOperation('generateLegalDocument', {
      text: extractedText,
      documentType: documentType
    });
    
    return {
      title: structureResult.title || 'Structured Document',
      content: structureResult.content || extractedText,
      documentType: documentType,
      keyDetails: structureResult.keyDetails || {},
      recommendation: structureResult.recommendation
    };
  } catch (error) {
    console.error('Error structuring document:', error);
    throw new Error('Failed to structure document: ' + (error as Error).message);
  }
}

/**
 * Analyzes a document image to extract structured information
 * 
 * @param imageBuffer The document image as a buffer
 * @param documentType Optional type of document to guide analysis
 * @param extractionMethod Optional method for extraction ('general', 'ocr', 'form', 'receipt', 'id')
 * @returns Structured document analysis
 */
export async function analyzeDocumentImage(
  imageBuffer: Buffer, 
  documentType?: DocumentType,
  extractionMethod: 'general' | 'ocr' | 'form' | 'receipt' | 'id' = 'general'
): Promise<{
  documentType: string;
  extractedText: string;
  structuredData: Record<string, any>;
  confidence: number;
  warnings?: string[];
}> {
  const base64Image = imageBuffer.toString('base64');
  
  try {
    // Build prompt based on document type and extraction method
    let analysisPrompt = "Analyze this document image in detail.";
    
    if (documentType) {
      analysisPrompt += ` This is a ${documentType.replace('_', ' ')} document. `;
      
      // Add specific extraction instructions for known document types
      switch(documentType) {
        case 'tenancy_agreement':
          analysisPrompt += "Extract key details like property address, tenant names, landlord names, start date, end date, rent amount, deposit amount.";
          break;
        case 'maintenance_request':
          analysisPrompt += "Extract details like property address, reporting tenant, issue description, date reported, priority level.";
          break;
        case 'identification':
          analysisPrompt += "Extract person name, document type, document number, date of birth, issuing authority, expiry date while preserving privacy.";
          break;
        case 'receipt':
        case 'invoice':
          analysisPrompt += "Extract vendor name, date, amount, items, payment method, and any reference numbers.";
          break;
        case 'deposit_certificate':
          analysisPrompt += "Extract deposit scheme name, certificate number, property address, tenant names, deposit amount, protection date.";
          break;
        case 'right_to_rent':
          analysisPrompt += "Extract tenant name, nationality, document type, document number, check date, result status.";
          break;
        default:
          analysisPrompt += "Extract all relevant information and organize it into structured data.";
      }
    }
    
    // Add extraction method-specific instructions
    switch(extractionMethod) {
      case 'ocr':
        analysisPrompt += " Focus on accurately extracting all visible text from the document.";
        break;
      case 'form':
        analysisPrompt += " Identify form fields and their corresponding values, treating it as a structured form.";
        break;
      case 'receipt':
        analysisPrompt += " Extract receipt details including vendor, date, items, prices, totals, and payment method.";
        break;
      case 'id':
        analysisPrompt += " Carefully extract identification details while respecting privacy considerations.";
        break;
    }
    
    // Add instructions for structured response format
    analysisPrompt += " Return results in JSON format with fields: documentType, extractedText, structuredData, confidence, and warnings (if any).";
    
    // Process through AI service
    const result = await executeAIOperation('analyzeDocumentImage', {
      base64Image,
      prompt: analysisPrompt
    });
    
    // Ensure result has the expected structure
    return {
      documentType: result.documentType || (documentType || 'unknown'),
      extractedText: result.extractedText || '',
      structuredData: result.structuredData || {},
      confidence: result.confidence || 0.7,
      warnings: result.warnings || []
    };
  } catch (error) {
    console.error('Error analyzing document image:', error);
    throw new Error('Failed to analyze document image: ' + (error as Error).message);
  }
}

/**
 * Extracts specific information based on document type
 * 
 * @param extractedInfo General extracted document information
 * @returns Type-specific document details
 */
export async function extractTypeSpecificInfo(
  extractedInfo: ExtractedDocumentInfo
): Promise<any> {
  try {
    let typeSpecificPrompt = '';
    const documentType = extractedInfo.documentType as DocumentType;
    
    switch(documentType) {
      case 'tenancy_agreement':
        typeSpecificPrompt = `Extract the following details from this tenancy agreement:
          - Property address
          - Tenant names (list all)
          - Landlord names (list all)
          - Agent name (if any)
          - Start date of tenancy
          - End date of tenancy
          - Rent amount
          - Deposit amount
          - Deposit protection scheme (if mentioned)
          - Payment frequency (weekly/monthly)
          - Special conditions
          - Break clause details
          
          Format the response as a structured JSON object.`;
        break;
        
      case 'maintenance_request':
        typeSpecificPrompt = `Extract these details from this maintenance request:
          - Property address
          - Reporting tenant name
          - Issue description
          - Date reported
          - Priority level
          - Rooms affected
          - Requested solution
          - Access instructions
          
          Format the response as a structured JSON object.`;
        break;
        
      case 'property_inspection':
        typeSpecificPrompt = `Extract these details from this property inspection report:
          - Property address
          - Inspection date
          - Inspector name
          - Overall property condition
          - Details for each room (name, condition, issues)
          - Whether maintenance is required
          - Recommended actions
          - Whether photos are included
          
          Format the response as a structured JSON object.`;
        break;
        
      case 'deposit_certificate':
        typeSpecificPrompt = `Extract these details from this deposit protection certificate:
          - Tenant names
          - Landlord names
          - Property address
          - Deposit amount
          - Protection scheme name
          - Date deposit was protected
          - Certificate/reference number
          - Protection type (custodial or insurance)
          - Dispute service information
          
          Format the response as a structured JSON object.`;
        break;
        
      case 'right_to_rent':
        typeSpecificPrompt = `Extract these details from this Right to Rent check document:
          - Tenant name
          - Nationality
          - Document type used for verification
          - Document number
          - Valid from date (if shown)
          - Valid to date (if shown)
          - Name of person who performed the check
          - Date check was performed
          - Result (pass/fail)
          
          Format the response as a structured JSON object.`;
        break;
        
      default:
        typeSpecificPrompt = `Extract the key information from this ${documentType} document as a structured JSON object.`;
    }
    
    // Process with AI service manager
    const result = await executeAIOperation('generateText', {
      prompt: typeSpecificPrompt,
      text: extractedInfo.extractedText,
      responseFormat: 'json_object'
    });
    
    return result;
  } catch (error) {
    console.error('Error extracting type-specific info:', error);
    throw new Error('Failed to extract type-specific information: ' + (error as Error).message);
  }
}

/**
 * Analyzes a document to identify potential compliance issues
 * 
 * @param documentText Extracted text from document
 * @param documentType Type of document being analyzed
 * @returns Compliance issues and recommendations
 */
export async function analyzeComplianceIssues(
  documentText: string,
  documentType: DocumentType
): Promise<{
  compliant: boolean;
  issues: string[];
  recommendations: string[];
  requiredActions: string[];
}> {
  try {
    // Create prompt based on document type
    let compliancePrompt = '';
    
    switch(documentType) {
      case 'tenancy_agreement':
        compliancePrompt = `Analyze this tenancy agreement for compliance with UK housing regulations including:
          - Tenant Fees Act 2019
          - Housing Act 2004
          - Landlord and Tenant Act 1985
          - Deregulation Act 2015
          - Deposit protection requirements
          - Right to Rent requirements
          - Energy Performance Certificate requirements
          - Gas Safety Certificate requirements
          - Electrical Safety Standards requirements
          
          Identify any compliance issues, make recommendations, and list required actions.`;
        break;
        
      case 'hmo_license':
        compliancePrompt = `Analyze this HMO license document for compliance with UK HMO licensing requirements including:
          - Housing Act 2004 requirements
          - Local authority specific requirements
          - Fire safety regulations
          - Room size requirements
          - Amenities requirements
          - Maximum occupancy compliance
          
          Identify any compliance issues, make recommendations, and list required actions.`;
        break;
        
      case 'deposit_certificate':
        compliancePrompt = `Analyze this deposit protection certificate for compliance with UK deposit protection requirements including:
          - Compliance with 30-day protection deadline
          - Proper scheme registration
          - Required tenant information
          - Prescribed information provision
          
          Identify any compliance issues, make recommendations, and list required actions.`;
        break;
        
      case 'gas_safety':
      case 'electrical_safety':
      case 'epc_certificate':
        compliancePrompt = `Analyze this ${documentType.replace('_', ' ')} for compliance with UK regulations including:
          - Valid certification period
          - Required inspection items
          - Inspector qualifications
          - Required action items
          
          Identify any compliance issues, make recommendations, and list required actions.`;
        break;
        
      default:
        compliancePrompt = `Analyze this ${documentType.replace('_', ' ')} document for compliance with relevant UK property regulations. Identify any compliance issues, make recommendations, and list required actions.`;
    }
    
    // Add instructions for structured response
    compliancePrompt += `\n\nRespond with a JSON object containing these fields:
      - compliant: boolean indicating if the document appears fully compliant
      - issues: array of identified compliance issues (empty if compliant)
      - recommendations: array of recommendations to improve compliance
      - requiredActions: array of actions that must be taken to achieve compliance`;
    
    // Process with AI service manager
    const result = await executeAIOperation('generateText', {
      prompt: compliancePrompt,
      text: documentText,
      responseFormat: 'json_object'
    });
    
    return result;
  } catch (error) {
    console.error('Error analyzing compliance issues:', error);
    return {
      compliant: false,
      issues: ['Failed to analyze compliance: ' + (error as Error).message],
      recommendations: ['Have the document manually reviewed by a compliance expert'],
      requiredActions: ['Perform manual compliance review']
    };
  }
}

/**
 * Summarizes a document for quick understanding
 * 
 * @param documentText Full document text
 * @param maxLength Optional maximum summary length in characters
 * @returns Document summary
 */
export async function summarizeDocument(
  documentText: string,
  maxLength: number = 500
): Promise<{
  summary: string;
  keyPoints: string[];
  importantDates: Record<string, string>;
}> {
  try {
    const summaryPrompt = `Summarize this document concisely (maximum ${maxLength} characters). 
      Identify 3-5 key points and extract any important dates mentioned.
      
      Respond with a JSON object containing these fields:
      - summary: concise summary of the document
      - keyPoints: array of 3-5 key points from the document
      - importantDates: object mapping date descriptions to date values`;
    
    // Process with AI service manager
    const result = await executeAIOperation('generateText', {
      prompt: summaryPrompt,
      text: documentText,
      responseFormat: 'json_object'
    });
    
    return result;
  } catch (error) {
    console.error('Error summarizing document:', error);
    return {
      summary: 'Failed to generate summary: ' + (error as Error).message,
      keyPoints: ['Document summary not available due to processing error'],
      importantDates: {}
    };
  }
}

/**
 * Parses a document for AI-driven document management
 * 
 * @param fileBuffer Document file buffer
 * @param fileName Original filename
 * @param contentType MIME type
 * @returns Comprehensive document analysis
 */
export async function parseDocument(
  fileBuffer: Buffer,
  fileName: string,
  contentType?: string
): Promise<{
  basicInfo: ExtractedDocumentInfo;
  typeSpecificInfo: any;
  summary: {
    summary: string;
    keyPoints: string[];
    importantDates: Record<string, string>;
  };
  compliance?: {
    compliant: boolean;
    issues: string[];
    recommendations: string[];
    requiredActions: string[];
  };
  suggestedActions: string[];
}> {
  try {
    // Step 1: Extract basic document info
    const basicInfo = await extractDocumentInfo(fileBuffer, fileName, contentType);
    
    // Step 2: Generate document summary
    const summary = await summarizeDocument(basicInfo.extractedText);
    
    // Step 3: Extract type-specific information
    const typeSpecificInfo = await extractTypeSpecificInfo(basicInfo);
    
    // Step 4: Analyze compliance if relevant document type
    let compliance = undefined;
    const complianceDocTypes: DocumentType[] = [
      'tenancy_agreement', 'hmo_license', 'deposit_certificate', 
      'gas_safety', 'electrical_safety', 'epc_certificate'
    ];
    
    if (complianceDocTypes.includes(basicInfo.documentType as DocumentType)) {
      compliance = await analyzeComplianceIssues(
        basicInfo.extractedText, 
        basicInfo.documentType as DocumentType
      );
    }
    
    // Step 5: Generate suggested actions based on document type and content
    const suggestedActionsPrompt = `Based on this ${basicInfo.documentType} document, suggest 3-5 specific actions that the user should take. 
      Return only an array of action strings.`;
    
    const suggestedActions = await executeAIOperation('generateText', {
      prompt: suggestedActionsPrompt,
      text: basicInfo.extractedText,
      responseFormat: 'json_object'
    });
    
    return {
      basicInfo,
      typeSpecificInfo,
      summary,
      compliance,
      suggestedActions: Array.isArray(suggestedActions) ? suggestedActions : 
        (suggestedActions.actions || suggestedActions.suggestedActions || [])
    };
  } catch (error) {
    console.error('Error parsing document:', error);
    throw new Error('Failed to parse document: ' + (error as Error).message);
  }
}