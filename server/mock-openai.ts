/**
 * Mock OpenAI Service
 * Provides simulated OpenAI functionality to reduce API costs
 */
import { log } from "./utils/logger";
import { PropertyDescriptionParams } from "./openai";

/**
 * Check if the mock API key is valid (always returns true)
 */
export async function checkApiKey(): Promise<boolean> {
  log('Using mock OpenAI service - API key validation successful', 'mock-openai');
  return true;
}

/**
 * Generate a property description using templates and the provided parameters
 */
export async function generatePropertyDescription(params: PropertyDescriptionParams): Promise<string> {
  try {
    // Simulate some processing time for realism
    await simulateProcessingDelay();
    
    // Get basic property details
    const { title, propertyType, bedrooms, bathrooms, location, university, features } = params;
    
    // Generate description based on property type
    let description = '';
    
    if (propertyType.toLowerCase().includes('house')) {
      description = generateHouseDescription(params);
    } else if (propertyType.toLowerCase().includes('apartment') || propertyType.toLowerCase().includes('flat')) {
      description = generateApartmentDescription(params);
    } else if (propertyType.toLowerCase().includes('studio')) {
      description = generateStudioDescription(params);
    } else {
      description = generateGenericDescription(params);
    }
    
    log(`Generated mock property description for "${title}"`, 'mock-openai');
    return description;
  } catch (error: any) {
    log(`Error generating mock property description: ${error.message}`, 'mock-openai');
    throw new Error(`Failed to generate property description: ${error.message}`);
  }
}

/**
 * Generate embeddings for text (returns random vector)
 */
export async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    // Simulate some processing time for realism
    await simulateProcessingDelay();
    
    // Generate a random embedding vector of length 384 (simulating OpenAI's embedding-3-small model)
    const embeddings = Array.from({ length: 384 }, () => Math.random() * 2 - 1);
    
    // Normalize the vector to unit length (cosine similarity property)
    const magnitude = Math.sqrt(embeddings.reduce((sum, val) => sum + val * val, 0));
    const normalizedEmbeddings = embeddings.map(val => val / magnitude);
    
    log(`Generated mock embeddings for text of length ${text.length}`, 'mock-openai');
    return normalizedEmbeddings;
  } catch (error: any) {
    log(`Error generating mock embeddings: ${error.message}`, 'mock-openai');
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
}

/**
 * Analyze an image using simulated vision capabilities
 */
export async function analyzeImage(base64Image: string, prompt: string): Promise<string> {
  try {
    // Simulate some processing time for realism
    await simulateProcessingDelay(1500);
    
    // Parse the prompt to determine the type of analysis
    const promptLower = prompt.toLowerCase();
    let analysis = '';
    
    if (promptLower.includes('room measurements') || promptLower.includes('dimension')) {
      analysis = getRandomRoomMeasurementAnalysis();
    } else if (promptLower.includes('lighting') || promptLower.includes('light')) {
      analysis = getRandomLightingAnalysis();
    } else if (promptLower.includes('safety') || promptLower.includes('security')) {
      analysis = getRandomSafetyAnalysis();
    } else if (promptLower.includes('accessibility')) {
      analysis = getRandomAccessibilityAnalysis();
    } else if (promptLower.includes('risk assessment') || promptLower.includes('risks') || promptLower.includes('issues')) {
      analysis = getRandomRiskAssessmentAnalysis();
    } else if (promptLower.includes('describe') || promptLower.includes('what')) {
      analysis = getRandomGeneralImageAnalysis();
    } else {
      analysis = getRandomGeneralImageAnalysis();
    }
    
    log(`Generated mock image analysis for prompt: "${prompt.substring(0, 50)}..."`, 'mock-openai');
    return analysis;
  } catch (error: any) {
    log(`Error analyzing image: ${error.message}`, 'mock-openai');
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

/**
 * Compare two face images for identity verification (simulated)
 */
export async function compareFaces(
  originalImageBase64: string,
  newImageBase64: string,
  threshold: number = 0.7
): Promise<{
  aboveThreshold: boolean;
  confidenceScore: number;
  analysis: string;
}> {
  try {
    // Simulate some processing time for realism
    await simulateProcessingDelay(2000);
    
    // Generate random confidence score between 0.4 and 0.95
    const confidenceScore = 0.4 + Math.random() * 0.55;
    const aboveThreshold = confidenceScore >= threshold;
    
    let analysis = '';
    if (confidenceScore > 0.85) {
      analysis = "High confidence match. The facial features, proportions, and distinctive characteristics in both images appear to be from the same individual. The facial structure, eye shape, nose, and mouth alignment are consistent between both images.";
    } else if (confidenceScore > 0.7) {
      analysis = "Moderate confidence match. Many facial features appear similar between the two images, including the general face shape, eye placement, and nose structure. There are some minor differences that could be attributed to lighting, angle, or expression changes.";
    } else if (confidenceScore > 0.5) {
      analysis = "Low confidence match. While there are some similarities in basic facial features, there are notable differences in proportions and distinctive characteristics. The differences could be due to significant lighting variations, angle changes, aging, or potentially different individuals.";
    } else {
      analysis = "Very low confidence match. The facial features in these images show significant differences in proportions, structure, and distinctive characteristics. These appear to be different individuals or the image quality/angle is too poor for reliable comparison.";
    }
    
    log(`Generated mock face comparison with confidence: ${confidenceScore.toFixed(2)}`, 'mock-openai');
    return {
      aboveThreshold,
      confidenceScore,
      analysis
    };
  } catch (error: any) {
    log(`Error comparing faces: ${error.message}`, 'mock-openai');
    throw new Error(`Failed to compare faces: ${error.message}`);
  }
}

/**
 * Generate text response
 */
export async function generateText(
  prompt: string, 
  maxTokens?: number,
  forceRefresh?: boolean
): Promise<string> {
  try {
    // Simulate some processing time for realism
    await simulateProcessingDelay();
    
    // Parse the prompt to determine the type of response
    const promptLower = prompt.toLowerCase();
    let response = '';
    
    if (promptLower.includes('explain') || promptLower.includes('what is')) {
      response = getRandomExplanation(prompt);
    } else if (promptLower.includes('list') || promptLower.includes('give me')) {
      response = getRandomList(prompt);
    } else if (promptLower.includes('how to')) {
      response = getRandomHowTo(prompt);
    } else if (promptLower.includes('compare') || promptLower.includes('difference')) {
      response = getRandomComparison(prompt);
    } else if (promptLower.includes('pros and cons')) {
      response = getRandomProsAndCons(prompt);
    } else {
      response = getRandomResponse(prompt);
    }
    
    // Truncate to simulated max tokens if provided
    if (maxTokens) {
      // Approximate tokens as 4 characters per token
      const maxChars = maxTokens * 4;
      if (response.length > maxChars) {
        response = response.substring(0, maxChars) + '...';
      }
    }
    
    log(`Generated mock text for prompt: "${prompt.substring(0, 50)}..."`, 'mock-openai');
    return response;
  } catch (error: any) {
    log(`Error generating text: ${error.message}`, 'mock-openai');
    throw new Error(`Failed to generate text: ${error.message}`);
  }
}

/**
 * Extract information from a document image (simulated)
 */
export async function extractDocumentInfo(
  base64Image: string,
  prompt: string
): Promise<any> {
  try {
    // Simulate some processing time for realism
    await simulateProcessingDelay(1800);
    
    const promptLower = prompt.toLowerCase();
    let result: any = {};
    
    if (promptLower.includes('passport') || promptLower.includes('id card')) {
      result = {
        documentType: 'Passport',
        personalDetails: {
          name: 'John Michael Smith',
          dateOfBirth: '15 May 1992',
          nationality: 'British',
          gender: 'Male',
          placeOfBirth: 'London'
        },
        documentDetails: {
          documentNumber: 'P12345678',
          issueDate: '23 June 2018',
          expiryDate: '23 June 2028',
          issuingAuthority: 'HMPO'
        },
        confidence: 0.92
      };
    } else if (promptLower.includes('utility bill') || promptLower.includes('bill')) {
      result = {
        documentType: 'Utility Bill',
        provider: 'Energy Plus Ltd',
        customerDetails: {
          name: 'John Smith',
          address: '42 High Street, London, SW1A 1AA',
          accountNumber: 'EP-8765432'
        },
        billDetails: {
          billDate: '14 March 2025',
          billPeriod: '15 February 2025 - 14 March 2025',
          totalAmount: '£68.42',
          dueDate: '28 March 2025'
        },
        confidence: 0.89
      };
    } else if (promptLower.includes('driver') || promptLower.includes('licence')) {
      result = {
        documentType: 'Driving Licence',
        personalDetails: {
          name: 'SMITH, JOHN MICHAEL',
          dateOfBirth: '15.05.1992',
          address: '42 HIGH STREET, LONDON, SW1A 1AA',
          gender: 'M'
        },
        licenceDetails: {
          licenceNumber: 'SMITH912155JM9XY',
          issueDate: '01.07.2020',
          expiryDate: '15.05.2030',
          categories: ['B', 'B1']
        },
        confidence: 0.94
      };
    } else if (promptLower.includes('bank statement') || promptLower.includes('statement')) {
      result = {
        documentType: 'Bank Statement',
        bankDetails: {
          bankName: 'National Banking Group',
          branch: 'London Central'
        },
        customerDetails: {
          name: 'Mr John M Smith',
          address: '42 High Street, London, SW1A 1AA',
          accountNumber: '****4567',
          sortCode: '12-34-56'
        },
        statementDetails: {
          statementPeriod: '01 March 2025 - 31 March 2025',
          openingBalance: '£2,453.67',
          closingBalance: '£2,892.14',
          totalDeposits: '£3,245.00',
          totalWithdrawals: '£2,806.53'
        },
        confidence: 0.87
      };
    } else {
      result = {
        documentType: 'Unknown Document',
        extractedText: 'Limited text extraction available without specific document type guidance. Please specify the document type for better results.',
        confidence: 0.65
      };
    }
    
    log(`Generated mock document info extraction for prompt: "${prompt.substring(0, 50)}..."`, 'mock-openai');
    return result;
  } catch (error: any) {
    log(`Error extracting document info: ${error.message}`, 'mock-openai');
    throw new Error(`Failed to extract document info: ${error.message}`);
  }
}

/**
 * Analyze compliance issues in a document (simulated)
 */
export async function analyzeComplianceIssues(
  base64Image: string,
  documentType: string
): Promise<any> {
  try {
    // Simulate some processing time for realism
    await simulateProcessingDelay(2000);
    
    // Generate a random compliance status
    const statusOptions = ['compliant', 'minor_issues', 'major_issues'];
    const randomIndex = Math.floor(Math.random() * statusOptions.length);
    const complianceStatus = statusOptions[randomIndex];
    
    let result: any = {
      complianceStatus,
      issues: [],
      missingElements: [],
      recommendations: []
    };
    
    if (complianceStatus === 'compliant') {
      result.issues = [];
      result.missingElements = [];
      result.recommendations = ['Document appears to be fully compliant with regulatory requirements.'];
    } else if (complianceStatus === 'minor_issues') {
      if (documentType.toLowerCase().includes('passport')) {
        result.issues = ['Slightly unclear signature', 'Partial glare on photo'];
        result.missingElements = [];
        result.recommendations = ['Rescan with better lighting', 'Ensure signature is fully visible'];
      } else if (documentType.toLowerCase().includes('utility')) {
        result.issues = ['Issue date appears to be more than 3 months old'];
        result.missingElements = [];
        result.recommendations = ['Provide a more recent utility bill (less than 3 months old)'];
      } else {
        result.issues = ['Document quality could be improved', 'Some fields are difficult to read'];
        result.missingElements = [];
        result.recommendations = ['Rescan at higher resolution', 'Ensure all text is clearly visible'];
      }
    } else if (complianceStatus === 'major_issues') {
      if (documentType.toLowerCase().includes('passport')) {
        result.issues = ['Document appears to be expired', 'Personal details page partially obscured'];
        result.missingElements = ['Clear view of MRZ (Machine Readable Zone)'];
        result.recommendations = ['Provide valid, unexpired passport', 'Ensure all information is clearly visible'];
      } else if (documentType.toLowerCase().includes('utility')) {
        result.issues = ['Document appears to be heavily modified', 'Date information is unclear'];
        result.missingElements = ['Clear issue date', 'Complete address details'];
        result.recommendations = ['Provide unmodified original document', 'Ensure date and address are clearly visible'];
      } else {
        result.issues = ['Document appears to be significantly altered', 'Multiple required fields are missing or obscured'];
        result.missingElements = ['Clear identification information', 'Verifiable issuing details'];
        result.recommendations = ['Submit an unmodified original document', 'Ensure all required fields are clearly visible'];
      }
    }
    
    log(`Generated mock compliance analysis for ${documentType} with status: ${complianceStatus}`, 'mock-openai');
    return result;
  } catch (error: any) {
    log(`Error analyzing compliance issues: ${error.message}`, 'mock-openai');
    throw new Error(`Failed to analyze compliance issues: ${error.message}`);
  }
}

/**
 * Verify identity from document and selfie (simulated)
 */
export async function verifyIdentity(
  documentImageBase64: string,
  selfieImageBase64: string,
  documentType?: string
): Promise<any> {
  try {
    // Simulate some processing time for realism
    await simulateProcessingDelay(2500);
    
    const docType = documentType || 'identification document';
    
    // Generate random verification scores
    const faceMatchScore = 0.6 + Math.random() * 0.39;  // 0.6 to 0.99
    const documentValidityScore = 0.7 + Math.random() * 0.29;  // 0.7 to 0.99
    const overallConfidence = (faceMatchScore + documentValidityScore) / 2;
    
    const verificationStatus = overallConfidence > 0.8 ? 'verified' : 'needs_review';
    
    const result = {
      verificationStatus,
      documentAnalysis: {
        documentType: docType,
        validityScore: documentValidityScore,
        extractedInformation: {
          name: 'John Michael Smith',
          dateOfBirth: '15 May 1992',
          documentNumber: docType.includes('passport') ? 'P12345678' : 'ID7654321',
          expiryDate: '23 June 2028'
        },
        potentialIssues: documentValidityScore < 0.85 ? ['Some document features could not be fully verified'] : []
      },
      faceComparison: {
        matchScore: faceMatchScore,
        faceDetectedInDocument: true,
        faceDetectedInSelfie: true,
        matchConfidence: faceMatchScore > 0.9 ? 'high' : (faceMatchScore > 0.8 ? 'medium' : 'low')
      },
      overallConfidence,
      recommendation: verificationStatus === 'verified' 
        ? 'Identity verification successful' 
        : 'Additional verification recommended'
    };
    
    log(`Generated mock identity verification with confidence: ${overallConfidence.toFixed(2)}`, 'mock-openai');
    return result;
  } catch (error: any) {
    log(`Error verifying identity: ${error.message}`, 'mock-openai');
    throw new Error(`Failed to verify identity: ${error.message}`);
  }
}

/**
 * Summarize a document (simulated)
 */
export async function summarizeDocument(
  base64Image: string,
  maxLength?: number
): Promise<string> {
  try {
    // Simulate some processing time for realism
    await simulateProcessingDelay(1500);
    
    const summaries = [
      "This document appears to be a rental agreement between a landlord and tenant for a property located in London. It outlines the terms of a 12-month assured shorthold tenancy, including monthly rent of £1,200, a security deposit of £1,380, and standard conditions regarding maintenance, repairs, and notice periods. The agreement is dated March 15, 2025, with the tenancy commencing on April 1, 2025.",
      
      "This utility bill from Energy Plus Ltd is addressed to John Smith at 42 High Street, London. It covers the billing period from February 15 to March 14, 2025, with a total amount due of £68.42. The bill breaks down usage into electricity (423 kWh) and gas (156 units), with respective costs and applicable taxes. Payment is due by March 28, 2025, with options for direct debit, bank transfer, or online payment.",
      
      "This bank statement from National Banking Group details account activity for John Smith (account ending 4567) during March 2025. The opening balance was £2,453.67, with total deposits of £3,245.00 including a salary payment of £2,875.00. Withdrawals totaled £2,806.53, including regular payments for rent (£1,200), utilities (£145.32), and various retail purchases. The closing balance as of March 31 was £2,892.14, showing a net increase of £438.47 for the month.",
      
      "This appears to be an official letter from the University of London confirming that Jane Smith is enrolled as a full-time student in the Bachelor of Science in Computer Science program for the 2024-2025 academic year. The letter states that the student is in good standing, has completed all registration requirements, and has paid the required tuition fees. The letter is signed by Dr. Robert Johnson, Registrar, and dated February 28, 2025.",
      
      "This document is a property inspection report for 42 High Street, London, conducted on March 10, 2025. The inspection found the property to be in generally good condition with minor issues noted in the bathroom (slight mold on ceiling) and kitchen (worn cabinet hinges). The report recommends addressing these issues within the next three months to prevent further deterioration. All safety systems (smoke alarms, carbon monoxide detectors, electrical) were found to be in working order."
    ];
    
    // Select a random summary
    const summary = summaries[Math.floor(Math.random() * summaries.length)];
    
    // Truncate if maxLength is specified
    const finalSummary = maxLength && summary.length > maxLength 
      ? summary.substring(0, maxLength) + '...' 
      : summary;
    
    log(`Generated mock document summary of length ${finalSummary.length}`, 'mock-openai');
    return finalSummary;
  } catch (error: any) {
    log(`Error summarizing document: ${error.message}`, 'mock-openai');
    throw new Error(`Failed to summarize document: ${error.message}`);
  }
}

/**
 * Generate a floor plan from uploaded images
 */
export async function generateFloorPlan(images: Array<{buffer: Buffer, roomLabel: string}>): Promise<{
  svgContent: string;
  description: string;
  accuracy: number;
  roomLabels: string[];
}> {
  try {
    // Simulate some processing time for realism
    await simulateProcessingDelay(2000, 5000);
    
    log(`Generated mock floor plan from ${images.length} images`, 'mock-openai');
    
    // Extract room labels, or create default ones if not provided
    const roomLabels = images.map((img, index) => 
      img.roomLabel || `Room ${index + 1}`
    );
    
    // Generate a simple mock floor plan SVG
    const svgWidth = 800;
    const svgHeight = 600;
    const padding = 50;
    const roomWidth = (svgWidth - padding * 2) / Math.ceil(Math.sqrt(roomLabels.length));
    const roomHeight = (svgHeight - padding * 2) / Math.ceil(Math.sqrt(roomLabels.length));
    
    let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f9f9f9"/>
      <text x="50%" y="30" font-family="Arial" font-size="20" fill="#333" text-anchor="middle">Mock Floor Plan (${roomLabels.length} rooms)</text>`;
    
    // Generate rooms
    let rooms = '';
    const colors = ['#e6f7ff', '#fff7e6', '#f7ffe6', '#ffe6f7', '#e6ffe6', '#ffe6e6'];
    
    // Create a grid of rooms
    const cols = Math.ceil(Math.sqrt(roomLabels.length));
    const rows = Math.ceil(roomLabels.length / cols);
    
    roomLabels.forEach((label, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const x = padding + col * roomWidth;
      const y = padding + row * roomHeight;
      const width = roomWidth - 10;
      const height = roomHeight - 10;
      const color = colors[index % colors.length];
      
      // Add room
      rooms += `
        <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${color}" stroke="#333" stroke-width="2"/>
        <text x="${x + width/2}" y="${y + height/2}" font-family="Arial" font-size="14" fill="#333" text-anchor="middle">${label}</text>
      `;
      
      // Add doors between adjacent rooms
      if (col < cols - 1 && index + 1 < roomLabels.length) {
        // Horizontal door to room on the right
        const doorX = x + width;
        const doorY = y + height / 2 - 10;
        rooms += `
          <line x1="${doorX - 5}" y1="${doorY}" x2="${doorX + 5}" y2="${doorY}" stroke="#333" stroke-width="2"/>
          <line x1="${doorX - 5}" y1="${doorY + 20}" x2="${doorX + 5}" y2="${doorY + 20}" stroke="#333" stroke-width="2"/>
        `;
      }
      
      if (row < rows - 1 && index + cols < roomLabels.length) {
        // Vertical door to room below
        const doorX = x + width / 2 - 10;
        const doorY = y + height;
        rooms += `
          <line x1="${doorX}" y1="${doorY - 5}" x2="${doorX}" y2="${doorY + 5}" stroke="#333" stroke-width="2"/>
          <line x1="${doorX + 20}" y1="${doorY - 5}" x2="${doorX + 20}" y2="${doorY + 5}" stroke="#333" stroke-width="2"/>
        `;
      }
    });
    
    svgContent += rooms;
    
    // Add scale and north arrow
    svgContent += `
      <line x1="${padding}" y1="${svgHeight - 20}" x2="${padding + 100}" y2="${svgHeight - 20}" stroke="#333" stroke-width="2"/>
      <text x="${padding + 50}" y="${svgHeight - 5}" font-family="Arial" font-size="12" fill="#333" text-anchor="middle">5m</text>
      
      <!-- North arrow -->
      <polygon points="${svgWidth - 30},${padding} ${svgWidth - 40},${padding + 20} ${svgWidth - 30},${padding + 15} ${svgWidth - 20},${padding + 20}" fill="#333"/>
      <text x="${svgWidth - 30}" y="${padding + 35}" font-family="Arial" font-size="12" fill="#333" text-anchor="middle">N</text>
    `;
    
    // Close SVG
    svgContent += '</svg>';
    
    // Generate a description based on the number of rooms
    const descriptions = [
      `This floor plan shows a ${roomLabels.length}-room property with a logical layout optimized for efficient use of space. The design features a centralized common area with easy access to all rooms. The room dimensions are appropriate for their designated purposes, with sufficient space allocated to high-traffic areas. The floor plan follows modern design principles with good flow between spaces and natural light considerations.`,
      
      `The generated floor plan represents a ${roomLabels.length}-room residence with a functional layout. The living spaces are well-proportioned and arranged in a coherent manner that facilitates natural movement throughout the property. Key features include open-concept design between primary living areas while maintaining privacy for bedrooms. The room placement optimizes both natural light exposure and acoustic separation between quiet and active spaces.`,
      
      `This floor plan depicts a ${roomLabels.length}-room property with an efficient spatial organization. The layout prioritizes functionality with clear circulation pathways and logical room adjacencies. Each room is appropriately sized for its intended use, with bedrooms positioned away from noisy areas. The design incorporates modern living standards with potential for furniture placement that maximizes usable space while maintaining comfortable traffic flow.`
    ];
    
    return {
      svgContent,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      accuracy: Math.floor(Math.random() * 20) + 70, // Random accuracy between 70-90%
      roomLabels
    };
  } catch (error: any) {
    log(`Error generating floor plan: ${error.message}`, 'mock-openai');
    throw new Error(`Failed to generate floor plan: ${error.message}`);
  }
}

/**
 * Generate an image using (simulated)
 */
export async function generateImage(
  prompt: string,
  size: '1024x1024' | '1024x1792' | '1792x1024' = '1024x1024'
): Promise<string> {
  try {
    // Simulate some processing time for realism
    await simulateProcessingDelay(1000, 3000);
    
    // Return a placeholder image URL
    // In a real implementation, you would generate an actual image or use a placeholder
    const placeholderImages = [
      'https://placehold.co/1024x1024/67e8f9/1e293b?text=AI+Generated+Image',
      'https://placehold.co/1024x1024/bae6fd/1e293b?text=AI+Generated+Image',
      'https://placehold.co/1024x1024/e0f2fe/1e293b?text=AI+Generated+Image',
      'https://placehold.co/1024x1024/dbeafe/1e293b?text=AI+Generated+Image',
      'https://placehold.co/1024x1024/ede9fe/1e293b?text=AI+Generated+Image'
    ];
    
    // Choose a random placeholder
    const imageUrl = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
    
    log(`Generated mock image for prompt: "${prompt.substring(0, 50)}..."`, 'mock-openai');
    return imageUrl;
  } catch (error: any) {
    log(`Error generating image: ${error.message}`, 'mock-openai');
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}

// Helper functions

/**
 * Simulate a processing delay to mimic API call time
 * @param minMs Minimum delay in milliseconds (default: 500)
 * @param maxMs Maximum delay in milliseconds (default: 1000)
 */
async function simulateProcessingDelay(minMs: number = 500, maxMs: number = 1000): Promise<void> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Generate a house property description
 */
function generateHouseDescription(params: PropertyDescriptionParams): string {
  const { title, bedrooms, bathrooms, location, features, furnished } = params;
  
  const bedroomText = bedrooms === 1 ? 'bedroom' : 'bedrooms';
  const bathroomText = bathrooms === 1 ? 'bathroom' : 'bathrooms';
  
  const featuresList = features.join(', ');
  const furnishedText = furnished ? 'furnished' : 'unfurnished';
  
  return `
# ${title}

This exceptional ${bedrooms}-${bedroomText} house in ${location} offers the perfect blend of comfort, convenience, and style for student living. With ${bathrooms} modern ${bathroomText} and generous living spaces, this property is ideal for students looking for a high-quality home.

## Property Highlights

The property boasts ${featuresList}, making it perfect for comfortable student living. The house comes ${furnishedText} and has been specifically designed with students in mind.

## Location Benefits

Located in the heart of ${location}, you'll find yourself just minutes away from local amenities including shops, cafes, restaurants, and excellent transport links. The property offers the perfect balance between peaceful residential living and convenient access to city attractions.

## Perfect For Students

This property is perfectly suited for students looking for high-quality accommodation in a prime location. With spacious bedrooms and common areas, it's ideal for both individual study and socializing with housemates.

Contact us today to arrange a viewing and secure this exceptional student property before it's gone!
  `.trim();
}

/**
 * Generate an apartment property description
 */
function generateApartmentDescription(params: PropertyDescriptionParams): string {
  const { title, bedrooms, bathrooms, location, features, furnished } = params;
  
  const bedroomText = bedrooms === 1 ? 'bedroom' : 'bedrooms';
  const bathroomText = bathrooms === 1 ? 'bathroom' : 'bathrooms';
  
  const featuresList = features.join(', ');
  const furnishedText = furnished ? 'fully furnished' : 'unfurnished';
  
  return `
# ${title}

Experience modern city living in this stylish ${bedrooms}-${bedroomText} apartment in the sought-after area of ${location}. With ${bathrooms} sleek ${bathroomText} and contemporary design throughout, this apartment offers the perfect balance of comfort and convenience for discerning students.

## Apartment Features

This exceptional property includes ${featuresList}, creating an ideal environment for both studying and relaxing. The apartment comes ${furnishedText} with high-quality fixtures and fittings throughout.

## Prime Location

Situated in ${location}, residents will enjoy easy access to public transportation, local shops, cafes, and restaurants. The apartment is ideally located for students, with excellent connections to university campuses and the vibrant city center.

## Student-Friendly Living

The thoughtful layout of this apartment makes it perfect for student living, offering private spaces for studying alongside communal areas for socializing. The building also features secure entry and dedicated management, ensuring a safe and well-maintained living environment.

Don't miss the opportunity to make this stunning apartment your new home. Contact us now to schedule a viewing!
  `.trim();
}

/**
 * Generate a studio property description
 */
function generateStudioDescription(params: PropertyDescriptionParams): string {
  const { title, location, features, furnished } = params;
  
  const featuresList = features.join(', ');
  const furnishedText = furnished ? 'comes fully furnished' : 'is available unfurnished';
  
  return `
# ${title}

This modern studio apartment in ${location} offers the perfect self-contained living space for students seeking independence and convenience. Cleverly designed to maximize space and functionality, this studio provides everything you need in one stylish package.

## Studio Highlights

The property features ${featuresList}, creating a comfortable and practical living environment. The studio ${furnishedText}, ready for you to move in and make it your own.

## Excellent Location

Situated in the popular area of ${location}, you'll be within easy reach of university campuses, public transport links, and all the amenities you need for comfortable student living. Local shops, cafes, and leisure facilities are just moments away.

## Perfect for Independent Students

This studio is ideal for students who value their own space and privacy while maintaining the convenience of a well-connected location. The efficient layout ensures you have everything you need within reach, from study space to relaxation areas.

Contact us today to arrange a viewing of this exceptional studio apartment - the perfect base for your university journey!
  `.trim();
}

/**
 * Generate a generic property description
 */
function generateGenericDescription(params: PropertyDescriptionParams): string {
  const { title, propertyType, bedrooms, bathrooms, location, features, furnished } = params;
  
  const bedroomText = bedrooms === 1 ? 'bedroom' : 'bedrooms';
  const bathroomText = bathrooms === 1 ? 'bathroom' : 'bathrooms';
  
  const featuresList = features.join(', ');
  const furnishedText = furnished ? 'fully furnished' : 'unfurnished';
  
  return `
# ${title}

Welcome to this exceptional ${bedrooms}-${bedroomText} ${propertyType} in the popular area of ${location}. With ${bathrooms} well-appointed ${bathroomText} and spacious living areas, this property offers comfortable and convenient living for students.

## Property Features

This outstanding accommodation includes ${featuresList}, providing everything you need for a comfortable student lifestyle. The property comes ${furnishedText} and has been maintained to an excellent standard throughout.

## Desirable Location

Located in ${location}, you'll benefit from excellent transport links, nearby shops, restaurants, and leisure facilities. The property offers convenient access to university campuses while being situated in a pleasant residential area.

## Ideal Student Living

Whether you're studying, socializing, or relaxing, this property provides the perfect environment for successful student living. The practical layout and quality fixtures ensure comfort and functionality throughout your tenancy.

Don't miss out on this exceptional property - contact us today to arrange a viewing and secure your ideal student home!
  `.trim();
}

/**
 * Get a random room measurement analysis
 */
function getRandomRoomMeasurementAnalysis(): string {
  const analyses = [
    "The room appears to be approximately 4.2m x 3.6m (15.1 square meters or 162 square feet). The ceiling height is estimated at 2.4m. The room has adequate space for a double bed, desk, wardrobe, and small seating area. The window measures approximately 1.2m x 1.5m, providing good natural light. There appears to be sufficient wall space for furniture placement with approximately 2.5m of uninterrupted wall length on the longest wall.",
    
    "Based on the visible elements and proportions, this appears to be a living room measuring approximately 5.5m x 4.2m (23.1 square meters or 248 square feet). The ceiling height is approximately 2.6m. The room provides ample space for a three-seater sofa, coffee table, TV stand, and additional seating. The room has two windows, each approximately 1.3m x 1.7m, offering excellent natural light from multiple angles.",
    
    "This kitchen measures approximately 3.8m x 2.9m (11 square meters or 119 square feet). The ceiling height is standard at approximately 2.4m. The counter space runs along two walls with approximately 3.6m of total counter length. There's sufficient space for standard appliances including a refrigerator, oven/stove, dishwasher, and washing machine. The central floor area is approximately 2.2m x 1.8m, allowing for comfortable movement around the kitchen.",
    
    "The bathroom appears to be approximately 2.4m x 1.8m (4.3 square meters or 46 square feet). The ceiling height is standard at 2.4m. The bathroom includes a bath/shower combination (approximately 1.7m x 0.7m), toilet, and sink with vanity unit. The window is approximately 0.6m x 0.8m, positioned higher on the wall for privacy while still providing natural light and ventilation."
  ];
  
  return analyses[Math.floor(Math.random() * analyses.length)];
}

/**
 * Get a random lighting analysis
 */
function getRandomLightingAnalysis(): string {
  const analyses = [
    "The room benefits from excellent natural lighting thanks to a large south-facing window that appears to receive direct sunlight for a significant portion of the day. The artificial lighting consists of a central ceiling fixture and what appears to be two wall-mounted sconces. The current lighting arrangement provides good general illumination, though adding a desk lamp would improve task lighting for studying. The light color temperature appears to be warm white, creating a comfortable atmosphere.",
    
    "This space has moderate natural lighting from a medium-sized east-facing window, which likely provides good morning light but less illumination in the afternoon and evening. The artificial lighting includes recessed ceiling lights (approximately 4-6 fixtures) providing even general illumination. The kitchen counter areas appear to have under-cabinet lighting, which is beneficial for food preparation tasks. Consider adding additional lighting near the seating area for reading or other activities requiring focused light.",
    
    "The room has limited natural light, with a single north-facing window that provides consistent but relatively dim illumination throughout the day. The artificial lighting consists of a central pendant fixture that appears to provide inadequate coverage for the entire space. There are noticeable shadow areas, particularly in the corners. Recommendations would include adding floor or table lamps to improve overall illumination and create a more balanced lighting scheme. Consider using higher-lumen bulbs (equivalent to 75-100W traditional bulbs) in the existing fixtures.",
    
    "This space features excellent lighting conditions with multiple sources of natural and artificial light. Large windows on two walls provide abundant natural light from different angles throughout the day. The artificial lighting system includes track lighting with adjustable heads, recessed ceiling fixtures, and what appears to be integrated LED lighting around the perimeter. The combination creates a well-layered lighting scheme that can be adjusted for different activities and times of day. The color temperature appears to be balanced, supporting both functionality and comfort."
  ];
  
  return analyses[Math.floor(Math.random() * analyses.length)];
}

/**
 * Get a random safety analysis
 */
function getRandomSafetyAnalysis(): string {
  const analyses = [
    "The property shows several positive safety features, including visible smoke detectors in the hallway and what appears to be a carbon monoxide detector near the kitchen area. The electrical outlets appear to be modern and properly installed. Window locks are visible and seem to be in working condition. Areas for improvement include: 1) The hallway could benefit from emergency lighting in case of power failure. 2) No fire extinguisher is visible in the kitchen area, which is recommended. 3) Consider adding a security chain to the main entrance door. 4) The bathroom lacks a grab bar near the bathtub/shower, which would enhance safety.",
    
    "From a safety perspective, this property demonstrates good practices with clearly marked fire exits, properly positioned smoke detectors, and what appears to be a recently serviced fire extinguisher. The electrical installation looks modern with no visible exposed wiring. Security measures include a solid entry door with deadbolt lock and window restrictors on ground floor windows. Suggested improvements: 1) Add non-slip mats in the bathroom. 2) Install a carbon monoxide detector near fuel-burning appliances. 3) Consider better lighting on external pathways. 4) The stairs would benefit from an additional handrail for enhanced safety.",
    
    "Several safety concerns are visible in this property: 1) No smoke detectors are visible in the main living areas. 2) The electrical outlets in the kitchen appear outdated and potentially unsafe for a wet environment. 3) Extension cords are being used permanently, which creates fire hazards. 4) The rear exit door appears to have a challenging lock mechanism that could impede emergency exit. 5) No carbon monoxide detector is visible despite the presence of gas appliances. 6) The windows on the upper floor lack child safety features. Immediate attention to these issues is recommended to ensure resident safety.",
    
    "The property demonstrates excellent safety standards with comprehensive measures in place. Visible features include: 1) Interconnected smoke detectors in all rooms. 2) Carbon monoxide detectors near potential sources. 3) Modern, RCD-protected electrical installation. 4) Clearly marked emergency exits with illuminated signage. 5) Fire extinguisher and fire blanket in the kitchen area. 6) Security system with door/window sensors. 7) Anti-scald devices on bathroom fixtures. 8) Good exterior lighting with motion sensors. The only recommendation would be to add a first aid kit in an easily accessible location."
  ];
  
  return analyses[Math.floor(Math.random() * analyses.length)];
}

/**
 * Get a random accessibility analysis
 */
function getRandomAccessibilityAnalysis(): string {
  const analyses = [
    "This property presents several accessibility challenges. The entrance has three steps with no ramp alternative, creating a barrier for wheelchair users or those with mobility difficulties. Doorways appear to be standard width (likely 750-800mm) which may be too narrow for some mobility aids. The bathroom lacks accessibility features such as grab bars, roll-in shower, or adequate turning space. The kitchen counters are at standard height with no adjustable sections. Positive aspects include level flooring throughout the main living areas with no thresholds between rooms, and what appears to be good lighting levels for those with visual impairments.",
    
    "The property demonstrates several positive accessibility features, including: 1) Step-free entrance with a gentle gradient ramp. 2) Wider doorways (appear to be at least 900mm) throughout. 3) Lever-style door handles rather than knobs. 4) The bathroom includes grab bars near the toilet and in the shower area. 5) Kitchen has some lower counter sections and appears to have clearance for wheelchair users. Limitations include: 1) Some storage areas appear to be at a height that would be challenging for wheelchair users. 2) The appliance controls in the kitchen may be difficult to reach or operate for some users. 3) No visible emergency alarm pull cords in the bathroom.",
    
    "From an accessibility perspective, this property has significant limitations. The multi-level layout with several steps between areas would make navigation impossible for wheelchair users and challenging for those with mobility impairments. Doorways appear narrow, particularly the bathroom door which wouldn't accommodate mobility aids. The bathroom is particularly problematic with a high-sided bathtub, no grab bars, and limited maneuvering space. The kitchen is designed for standing use with standard height counters and appliances. Major renovations would be required to make this property accessible, including installation of ramps or lifts, widening doorways, and complete bathroom remodeling.",
    
    "This property appears to have been designed with accessibility in mind. Features include: 1) Zero-step entrance with automatic door opener. 2) Wide hallways and doorways throughout (appear to be at least 1000mm). 3) Open floor plan providing excellent maneuverability for mobility aids. 4) Roll-under sinks in kitchen and bathroom. 5) Accessible shower with grab bars, handheld shower head, and built-in seating. 6) Kitchen with variable-height counters and front-facing controls on appliances. 7) Rocker-style light switches at accessible heights. 8) Visual doorbell system. The property would be suitable for users with a wide range of accessibility needs, though additional customizations might be needed for specific requirements."
  ];
  
  return analyses[Math.floor(Math.random() * analyses.length)];
}

/**
 * Get a random general image analysis
 */
function getRandomGeneralImageAnalysis(): string {
  const analyses = [
    "The image shows a bright, modern living room in a residential property. The space features contemporary furniture including a light gray three-seater sofa, a square coffee table with a glass top, and a wall-mounted TV unit. Large windows with white blinds allow abundant natural light to enter the room. The flooring appears to be engineered wood in a medium oak finish. The walls are painted in a neutral off-white color, with one feature wall in a pale blue shade. There are some decorative elements including cushions, a small area rug, and what appears to be framed artwork. The room conveys a clean, spacious atmosphere that would appeal to young professionals or students looking for modern accommodation.",
    
    "This image depicts a well-appointed kitchen in what appears to be a recently renovated property. The kitchen features white shaker-style cabinets with brushed nickel handles, contrasted by dark gray quartz countertops. The appliances are stainless steel, including a side-by-side refrigerator, built-in oven, and microwave. The backsplash consists of subway tiles in a herringbone pattern. There's an island/breakfast bar with three stools, providing casual dining space. The flooring appears to be large-format ceramic tiles in a light gray tone. Recessed ceiling lights and pendant lights over the island provide good illumination. The space is clean and uncluttered, presenting a contemporary design that balances functionality with aesthetic appeal.",
    
    "The image shows a medium-sized bedroom with a double bed as the central feature. The bed has a simple upholstered headboard in a light beige fabric and is dressed with white linens and several decorative pillows. To one side of the bed is a wooden nightstand with a table lamp, and on the opposite side is a small desk that could function as a study area. A freestanding wardrobe provides storage, and there appears to be additional storage in built-in shelving. The room has a window with floor-length curtains in a neutral tone. The walls are painted in a soft cream color, and the flooring appears to be carpet in a medium beige shade. The room is well-proportioned with sufficient space for a student or young professional.",
    
    "This image depicts the exterior of a traditional brick terraced house. The property features a classic red brick facade with white-painted sash windows on two floors plus what appears to be a converted loft space with a dormer window. The front entrance has a black painted door with brass hardware, accessed via a short path from the street. There is a small front garden area with some shrubs and bordered by a low brick wall. The roof appears to be slate tiles, and there are chimney stacks visible. The property seems well-maintained with no obvious structural issues. It's situated in what looks like a residential street with similar period properties, suggesting a established neighborhood. This type of house typically offers good space for multiple occupants and is common in student rental markets near university areas."
  ];
  
  return analyses[Math.floor(Math.random() * analyses.length)];
}

/**
 * Generate a random property risk assessment analysis
 */
function getRandomRiskAssessmentAnalysis(): string {
  const riskAssessments = [
    `# Property Risk Assessment Report

## Identified Issues
1. **Moisture/Dampness** - Visible signs of dampness on the lower portion of the wall near the window. This could indicate water intrusion or condensation issues that may lead to mold growth if left untreated.

2. **Electrical Safety** - Multiple electrical outlets appear to be overloaded with extension cords, creating a potential fire hazard. The socket near the window shows signs of discoloration, which could indicate overheating.

3. **Structural Concerns** - Minor cracking visible on the ceiling, possibly indicating settlement or structural movement. While not immediately dangerous, this should be monitored for any progression.

## Risk Levels
- Moisture Issue: **Moderate Risk** - Requires attention within 30 days
- Electrical Safety: **High Risk** - Requires immediate attention
- Structural Concerns: **Low Risk** - Monitor and reassess in 6 months

## Compliance Issues
- The property may not meet current electrical safety standards (BS 7671)
- Dampness issues could potentially violate the Homes (Fitness for Human Habitation) Act 2018 if left unaddressed

## Recommendations
1. Engage a qualified electrician to inspect all electrical systems and address overloaded circuits
2. Investigate source of dampness; consider improving ventilation and treating affected areas
3. Have a structural engineer assess the ceiling cracks during routine maintenance
4. Install additional smoke detectors as a precautionary measure`,

    `# Property Risk Assessment Report

## Identified Issues
1. **Tripping Hazards** - Uneven flooring transition between living room and kitchen, with visible damage to floor covering creating a significant trip hazard.

2. **Fire Safety** - Absence of visible smoke detectors in critical areas. The kitchen lacks a fire blanket or extinguisher despite having gas appliances.

3. **Ventilation Concerns** - Bathroom shows inadequate ventilation with visible mold growth on ceiling and around window frames, indicating prolonged moisture issues.

## Risk Levels
- Tripping Hazard: **Moderate Risk** - Should be addressed before new tenants move in
- Fire Safety: **High Risk** - Requires immediate attention
- Ventilation Issues: **Moderate Risk** - Requires attention within 14 days

## Compliance Issues
- Fire safety measures appear inadequate and may not meet current building regulations
- Mold growth may violate housing health and safety standards (HHSRS)
- Uneven flooring creates accessibility concerns under Equality Act considerations

## Recommendations
1. Repair flooring transition and damaged floor covering to eliminate trip hazard
2. Install interconnected smoke detectors throughout the property, particularly in hallways and near kitchen
3. Improve bathroom ventilation with an extractor fan vented to exterior
4. Treat existing mold with appropriate remediation methods`,

    `# Property Risk Assessment Report

## Identified Issues
1. **Security Vulnerabilities** - Window in bedroom shows damaged locking mechanism and garden-facing door has inadequate security features with signs of previous forced entry attempt.

2. **Fall Hazards** - Balcony railing height appears below the recommended 1100mm and shows signs of instability when pressure is applied.

3. **Gas Safety** - Boiler installation appears dated with suboptimal flue positioning. No carbon monoxide detector visible in the vicinity of the gas appliance.

## Risk Levels
- Security Vulnerabilities: **High Risk** - Requires immediate attention
- Fall Hazards: **High Risk** - Requires immediate action before occupation
- Gas Safety: **High Risk** - Requires professional inspection before use

## Compliance Issues
- Balcony railing likely violates building regulations for minimum height and strength
- Gas installation may not comply with Gas Safety (Installation and Use) Regulations
- Security features may not meet insurance requirements or landlord obligations for providing secure accommodation

## Recommendations
1. Replace window locks and upgrade door security with British Standard 5-lever mortice lock
2. Reinforce or replace balcony railing to meet current height and stability requirements
3. Schedule urgent Gas Safe registered engineer inspection of all gas appliances
4. Install carbon monoxide detectors near all gas appliances
5. Document all remediation for insurance and compliance purposes`
  ];
  
  return riskAssessments[Math.floor(Math.random() * riskAssessments.length)];
}

/**
 * Get a random explanation
 */
function getRandomExplanation(prompt: string): string {
  const explanations = [
    "The UK's assured shorthold tenancy (AST) is the most common form of residential tenancy agreement. It provides landlords with the right to repossess their property at the end of the agreed term, while offering tenants security for that fixed period. Key features include:\n\n1. Fixed term: Typically 6-12 months, though it can be longer\n2. Deposit protection: Landlords must protect deposits in a government-approved scheme\n3. Notice periods: Landlords must provide at least 2 months' notice (Section 21) to end the tenancy\n4. Repair obligations: Landlords are responsible for structural repairs, water, heating, and electrical systems\n5. Rent increases: Generally only allowed between tenancy periods unless specifically stated in the agreement\n\nASTs were introduced in the Housing Act 1988 and modified by the Housing Act 1996 to balance landlord and tenant rights. After the fixed term ends, the tenancy either becomes periodic (month-to-month) or a new fixed-term agreement is signed.",
    
    "Student rental guarantors are individuals (typically parents or guardians) who agree to cover rent payments and potential property damage costs if the student tenant fails to do so. This arrangement is common in the UK student housing market because:\n\n1. Students often have limited income and no rental history\n2. Landlords seek financial security when renting to individuals with no credit history\n3. UK universities don't typically provide guarantor services (unlike some other countries)\n\nThe guarantor usually needs to be UK-based, employed, and a homeowner. They must sign a legally binding agreement accepting financial responsibility for the entire property, which is particularly important in joint tenancies where they could be liable for all tenants' obligations if other guarantors fail to pay. International students without UK guarantors may need to pay several months' rent in advance or use a guarantor service that charges a fee to act as their guarantor.",
    
    "Right to Rent checks are mandatory verifications that landlords in England must perform to confirm prospective tenants have legal immigration status and the right to rent property in the UK. Introduced under the Immigration Act 2014, these checks aim to prevent illegal immigrants from accessing private rented accommodation.\n\nThe process requires landlords to:\n\n1. Check original documents that prove the tenant's right to be in the UK\n2. Verify the documents are genuine and belong to the tenant\n3. Make and retain copies of the documents, recording the date of the check\n4. Conduct follow-up checks for tenants with time-limited right to rent\n\nAcceptable documents include UK passports, EEA/Swiss national IDs, Biometric Residence Permits, and other Home Office-approved documents. Landlords who rent to someone without right to rent face penalties up to £3,000 per tenant, and potential criminal charges in severe cases. Since July 2021, most checks can be conducted via video call with scanned documents due to digitalization of the process.",
    
    "HMO (Houses in Multiple Occupation) licensing is a regulatory framework in the UK that requires landlords of larger shared properties to obtain a license from their local council. This system aims to ensure minimum safety and quality standards in higher-risk shared accommodations.\n\nMandatory HMO licensing applies to properties where:\n1. Five or more people from two or more households live together\n2. The residents share basic amenities like bathrooms, toilets, or cooking facilities\n\nAdditional and selective licensing schemes may exist in specific local authorities, potentially covering smaller HMOs or other rental properties.\n\nTo obtain a license, landlords must:\n- Prove the property meets required safety standards (fire safety, gas safety, electrical safety)\n- Demonstrate proper management procedures\n- Show the property isn't overcrowded and has adequate facilities\n- Pay a licensing fee (typically £500-£1,500, varying by location)\n- Pass a 'fit and proper person' test\n\nOperating an unlicensed HMO can result in prosecution, unlimited fines, rent repayment orders, and restrictions on evicting tenants. Licenses typically last 5 years before requiring renewal."
  ];
  
  return explanations[Math.floor(Math.random() * explanations.length)];
}

/**
 * Get a random list
 */
function getRandomList(prompt: string): string {
  const lists = [
    "# Essential Documents for Student Rental Applications\n\n1. **Proof of Identity**\n   - Passport or driving license\n   - National identity card for international students\n\n2. **Proof of Student Status**\n   - University/college acceptance letter\n   - Student ID card\n   - Enrollment confirmation\n\n3. **Financial Documentation**\n   - Bank statements (typically last 3 months)\n   - Proof of scholarship or student loan\n   - Evidence of parental support if applicable\n\n4. **Guarantor Information**\n   - Guarantor's proof of ID\n   - Proof of address (utility bills, bank statements)\n   - Proof of income/employment\n   - Homeownership evidence (if required)\n\n5. **References**\n   - Previous landlord references\n   - Character references\n   - Academic references\n\n6. **Proof of Current Address**\n   - Utility bills\n   - Bank statements\n   - Council tax bill\n\n7. **Right to Rent Documentation** (for UK rentals)\n   - Passport/visa showing right to be in the UK\n   - BRP card for international students\n\n8. **Credit Check Authorization**\n   - Completed application forms\n   - Permission for background checks",
    
    "# Top 10 Questions to Ask When Viewing Student Accommodation\n\n1. **What are the total costs?**\n   - Monthly rent\n   - Deposit amount and protection scheme\n   - Service/maintenance charges\n   - Council tax status\n\n2. **What bills are included?**\n   - Utilities (gas, electricity, water)\n   - Internet/Wi-Fi\n   - TV license\n\n3. **What's the contract length and flexibility?**\n   - Start and end dates\n   - Summer rental policies\n   - Break clause options\n\n4. **What security features are in place?**\n   - Door and window locks\n   - Security lighting/alarms\n   - Access control for common areas\n\n5. **What's the maintenance process?**\n   - Reporting procedures\n   - Typical response times\n   - Emergency contact information\n\n6. **What appliances/furniture are included?**\n   - Kitchen appliances\n   - Bedroom/study furniture\n   - Communal area provisions\n\n7. **What's the noise level like?**\n   - Proximity to main roads/nightlife\n   - Neighbor demographics\n   - Building soundproofing\n\n8. **How convenient is the location?**\n   - Distance to campus\n   - Public transport options\n   - Local amenities (shops, gyms, etc.)\n\n9. **What's the visitor policy?**\n   - Overnight guest rules\n   - Common area usage for visitors\n\n10. **What are the waste/recycling arrangements?**\n    - Collection days\n    - Bin locations\n    - Recycling facilities",
    
    "# Common Hidden Costs in Student Rentals\n\n1. **Administration Fees**\n   - Application processing\n   - Contract drafting\n   - Reference checking\n\n2. **Utility Connection Charges**\n   - Setup fees\n   - Transfer of account charges\n   - Deposit requirements for utility companies\n\n3. **Internet/TV Package Costs**\n   - Installation fees\n   - Contract minimum periods extending beyond tenancy\n   - Equipment rental charges\n\n4. **Content Insurance**\n   - Often not included in rent\n   - Higher premiums in certain neighborhoods\n\n5. **Cleaning Charges**\n   - Professional end-of-tenancy cleaning requirements\n   - Specific cleaning standards for deposit return\n\n6. **Maintenance Contributions**\n   - Garden maintenance fees\n   - Communal area cleaning charges\n   - Service charges in some buildings\n\n7. **Parking Permits/Costs**\n   - Resident parking zone permits\n   - Private parking space rental\n\n8. **Council Tax**\n   - Applicable during summer if not enrolled\n   - Mixed household status implications\n\n9. **Inventory Check Fees**\n   - Check-in and check-out charges\n   - Replacement costs for missing items\n\n10. **Early Termination Charges**\n    - Re-advertising costs\n    - Rent until new tenant found\n    - Administration fees for contract changes",
    
    "# Essential Safety Features to Check in Student Accommodation\n\n1. **Fire Safety Equipment**\n   - Working smoke detectors on each floor\n   - Carbon monoxide alarms near fuel-burning appliances\n   - Fire extinguishers/blankets in kitchen areas\n   - Clear fire escape routes\n\n2. **Electrical Safety**\n   - Valid Electrical Installation Condition Report (EICR)\n   - RCD protection for sockets\n   - No overloaded extension cords\n   - PAT tested appliances\n\n3. **Gas Safety**\n   - Current Gas Safety Certificate (renewed annually)\n   - Properly installed and ventilated gas appliances\n   - Carbon monoxide detectors near gas boilers/heaters\n\n4. **Structural Security**\n   - Solid external doors with deadlocks\n   - Window locks on all accessible windows\n   - Secure door frames and hinges\n   - Working doorbell/intercom system\n\n5. **Damp and Mold Prevention**\n   - Proper ventilation in bathrooms and kitchens\n   - No visible mold or water damage\n   - Functioning extractor fans\n   - Double glazing on windows\n\n6. **Trip Hazards**\n   - Secure flooring with no lifting edges\n   - Well-lit stairways with handrails\n   - No trailing cables in walkways\n\n7. **Security Lighting**\n   - External lighting at entrances\n   - Motion sensor lights in vulnerable areas\n\n8. **Furniture Safety**\n   - Fire-resistant labels on soft furnishings\n   - Stable and secure furniture items\n   - No dangerous glass furniture with sharp edges\n\n9. **Emergency Information**\n   - Posted emergency contact numbers\n   - Clear instructions for utility shutoffs\n   - First aid kit availability"
  ];
  
  return lists[Math.floor(Math.random() * lists.length)];
}

/**
 * Get a random how-to guide
 */
function getRandomHowTo(prompt: string): string {
  const howTos = [
    "# How to Navigate a Student Rental Viewing Day\n\n## Before the Viewing\n\n1. **Prepare Your Questions**\n   - Write down specific questions about the property\n   - Prepare a checklist of features to look for\n   - Note any specific requirements you have\n\n2. **Gather Your Documents**\n   - Bring ID (passport/driving license)\n   - Have student ID ready\n   - Bring proof of address if required\n   - Have guarantor details available\n\n3. **Plan Your Route**\n   - Check public transport options to the property\n   - Allow extra time to find the location\n   - Save the letting agent's contact number\n\n## During the Viewing\n\n1. **Check the Exterior**\n   - Assess the condition of the building exterior\n   - Look for signs of dampness or structural issues\n   - Check security features (main entrance, gates)\n   - Evaluate the neighborhood\n\n2. **Inspect the Interior Thoroughly**\n   - Test all light switches and power outlets\n   - Check windows open/close properly\n   - Look under sinks for signs of leaks\n   - Test water pressure in bathrooms\n   - Check heating works in each room\n   - Look for signs of damp/mold, especially in corners\n   - Test door locks and security features\n\n3. **Ask the Right Questions**\n   - Confirm what's included in the rent\n   - Ask about typical utility costs\n   - Confirm contract length and terms\n   - Ask about the deposit protection scheme\n   - Inquire about maintenance procedures\n   - Verify internet/TV connectivity options\n\n4. **Take Photos & Notes**\n   - Document any existing damage\n   - Photograph each room for later reference\n   - Note aspects you like/dislike\n   - Record any promises made by the agent\n\n## After the Viewing\n\n1. **Evaluate the Property**\n   - Compare with other properties viewed\n   - Consider location relative to university\n   - Calculate total costs including utilities\n   - Discuss with potential housemates\n\n2. **Act Quickly If Interested**\n   - Good properties rent fast during peak seasons\n   - Contact the agent within 24 hours\n   - Be prepared to pay a holding deposit\n   - Have guarantor details ready\n\n3. **Read the Contract Carefully**\n   - Check for hidden fees or charges\n   - Verify the agreed rent and deposit amounts\n   - Understand your responsibilities as tenant\n   - Consider having the contract reviewed if unsure\n\nFollowing these steps will help you make an informed decision about student accommodation and avoid common pitfalls in the rental process.",
    
    "# How to Successfully Apply for Student Housing with No Rental History\n\n## Preparation Phase\n\n1. **Gather Your Supporting Documents**\n   - Student ID/enrollment confirmation\n   - Proof of income (student loans, scholarships, part-time work)\n   - Bank statements showing regular income\n   - Academic transcripts showing responsibility\n   - Personal ID documents (passport, driving license)\n\n2. **Secure a Guarantor**\n   - Approach parents/guardians first\n   - Confirm they meet income requirements (typically 30x monthly rent)\n   - Collect their proof of income and address\n   - Explain their legal obligations clearly\n   - Have them ready to complete guarantor forms\n\n3. **Build a Personal Profile**\n   - Create a one-page tenant resume/bio\n   - Include educational achievements\n   - List extracurricular activities showing responsibility\n   - Mention any relevant experience (e.g., living in student halls)\n   - Add a professional photo if appropriate\n\n## Application Process\n\n1. **Be Proactive with References**\n   - Request character references from:\n     * University tutors/professors\n     * Previous employers\n     * Student accommodation wardens\n     * Family friends in professional positions\n   - Brief references on what to highlight (responsibility, reliability)\n\n2. **Offer Additional Security**\n   - Propose paying 1-2 months' rent in advance\n   - Consider offering a slightly higher deposit (if affordable)\n   - Suggest shorter initial lease with renewal options\n   - Propose a mid-term property inspection\n\n3. **Complete Applications Thoroughly**\n   - Fill out every section of application forms\n   - Provide detailed explanations where needed\n   - Be honest about lack of rental history\n   - Emphasize other reliability indicators\n   - Submit all supporting documents together\n\n4. **Personal Communication**\n   - Request in-person or video meetings with landlords\n   - Dress professionally for viewings/meetings\n   - Prepare to explain your situation confidently\n   - Emphasize your commitment to education/responsibility\n\n## Following Up\n\n1. **Professional Communication**\n   - Send thank-you emails after viewings\n   - Respond promptly to any queries\n   - Confirm your continued interest\n   - Provide any additional requested information quickly\n\n2. **Be Prepared for Additional Verification**\n   - Credit checks (limited for students)\n   - Guarantor verification calls\n   - Reference contact by landlord/agent\n   - Possible additional meeting requests\n\n3. **Negotiate Reasonably**\n   - Be flexible on move-in dates\n   - Consider properties slightly below your maximum budget\n   - Be open to reasonable special conditions\n   - Know which points are non-negotiable for you\n\nBy following this approach, you can significantly increase your chances of securing student housing despite having no formal rental history.",
    
    "# How to Handle Maintenance Issues in Student Rentals\n\n## Identifying the Problem\n\n1. **Assess the Severity**\n   - Emergency issues (gas leaks, flooding, no heat in winter)\n   - Urgent issues (broken locks, hot water failure)\n   - Routine maintenance (dripping taps, loose fixtures)\n   - Cosmetic issues (marks on walls, minor wear)\n\n2. **Document the Issue**\n   - Take clear photos from multiple angles\n   - Record videos if it's a functional problem\n   - Note when the problem started\n   - Document any related issues (e.g., water damage from a leak)\n\n## Reporting Properly\n\n1. **Check Your Tenancy Agreement**\n   - Review the maintenance reporting procedure\n   - Confirm landlord/agency contact details\n   - Note any specific reporting requirements\n\n2. **Emergency Situations**\n   - Call the emergency number immediately\n   - Follow up with written communication\n   - Take appropriate safety measures\n   - Document everything you've done\n\n3. **Standard Reporting Process**\n   - Email is preferable (creates written record)\n   - Include property address and your details\n   - Describe the issue clearly and concisely\n   - Attach photos/videos as evidence\n   - Suggest convenient access times\n\n4. **Follow Up Protocol**\n   - Allow reasonable response time (24-48 hours for non-emergencies)\n   - Keep a log of all communications\n   - If no response, call after the reasonable waiting period\n   - Escalate appropriately if still unresolved\n\n## During Repairs\n\n1. **Facilitating Access**\n   - Confirm appointment times in writing\n   - Ensure the area is accessible\n   - Secure or remove valuables\n   - Make arrangements to be present if preferred\n\n2. **Monitoring Work**\n   - Take before and after photos\n   - Get details of what work was done\n   - Keep contractor names and contact information\n   - Test functionality after completion\n\n## If Problems Persist\n\n1. **Formal Complaint Process**\n   - Write a formal letter/email citing previous communications\n   - Reference relevant sections of your tenancy agreement\n   - Set reasonable timelines for resolution\n   - Keep copies of all correspondence\n\n2. **Escalation Options**\n   - Contact the letting agency's complaints department\n   - Approach property management higher-ups\n   - Consult university accommodation services\n   - Seek advice from student union housing advisors\n\n3. **External Help**\n   - Contact local council environmental health (serious disrepair)\n   - Consult Citizen's Advice Bureau\n   - Consider university legal advice services\n   - Research tenant rights organizations\n\n4. **Last Resorts**\n   - Formal complaint to property redress scheme\n   - Consider rent escrow (withholding in specific circumstances)\n   - Explore breaking lease options (seek legal advice first)\n\n## Preventative Measures\n\n1. **Regular Checks**\n   - Test smoke/CO alarms monthly\n   - Check for early signs of damp/mold\n   - Monitor appliance functionality\n   - Inspect window and door seals seasonally\n\n2. **Tenant Responsibilities**\n   - Keep property well-ventilated\n   - Report minor issues before they worsen\n   - Follow property maintenance guidelines\n   - Perform tenant cleaning duties regularly\n\nThis systematic approach will help ensure maintenance issues are addressed promptly and properly while protecting your rights as a student tenant.",
    
    "# How to Get Your Full Deposit Back from Student Accommodation\n\n## Throughout Your Tenancy\n\n1. **Document Initial Condition**\n   - Complete inventory thoroughly at move-in\n   - Take dated photos/videos of all rooms and furnishings\n   - Report existing damage in writing within 7 days\n   - Keep copies of all move-in documentation\n\n2. **Maintain Property Condition**\n   - Clean regularly to prevent build-up\n   - Address small issues before they worsen\n   - Report maintenance needs promptly\n   - Follow all tenancy agreement guidelines\n\n3. **Track Communications**\n   - Keep records of all maintenance requests\n   - Document landlord visits and inspections\n   - Save emails about property condition\n   - Record dates of any repairs or replacements\n\n## Two Months Before Moving Out\n\n1. **Review Your Tenancy Agreement**\n   - Check specific move-out requirements\n   - Note cleaning standards expected\n   - Confirm notice period requirements\n   - Identify any special conditions\n\n2. **Request Pre-Checkout Inspection**\n   - Ask landlord to identify concerns early\n   - Get written feedback on issues to address\n   - Clarify expectations for condition\n   - Document the inspection findings\n\n3. **Address Wear and Tear Issues**\n   - Understand what constitutes normal wear vs. damage\n   - Make minor repairs (fill nail holes, touch up paint)\n   - Replace any broken/missing items\n   - Consider professional help for complex issues\n\n## One Month Before Moving Out\n\n1. **Deep Cleaning Plan**\n   - Create room-by-room cleaning checklist\n   - Schedule adequate time for thorough cleaning\n   - Source appropriate cleaning products\n   - Consider cost-benefit of professional services\n\n2. **Give Formal Notice**\n   - Provide written notice as per agreement\n   - Request move-out inspection date\n   - Confirm utility final reading arrangements\n   - Ask about preferred key return method\n\n## Final Week Before Departure\n\n1. **Execute Deep Clean**\n   - Focus on kitchen appliances (inside and out)\n   - Deep clean bathrooms (descale, grout, fixtures)\n   - Clean inside all cupboards and drawers\n   - Vacuum/steam clean carpets and upholstery\n   - Dust all surfaces including light fixtures\n   - Clean windows, frames and sills\n   - Remove all personal belongings\n\n2. **Final Inspection Preparation**\n   - Take detailed photos/videos of clean condition\n   - Gather comparison with move-in documentation\n   - Prepare list of improvements made\n   - Compile maintenance request history\n\n## Moving Out Day\n\n1. **Final Checks**\n   - Remove all personal items\n   - Clean any overlooked areas\n   - Check all drawers and storage spaces\n   - Ensure all rubbish is removed\n\n2. **Utility Closure**\n   - Take final meter readings with photos\n   - Notify utility companies of departure\n   - Provide forwarding address for final bills\n   - Keep confirmation of account closures\n\n3. **During Inspection**\n   - Attend in person if possible\n   - Bring move-in inventory and photos\n   - Take notes of any issues raised\n   - Request written confirmation of condition\n   - Return all keys as required\n\n## After Moving Out\n\n1. **Deposit Return Process**\n   - Know the timeline (usually 10-30 days)\n   - Provide accurate bank details for return\n   - Follow up if delayed beyond timeframe\n\n2. **Addressing Deductions**\n   - Request itemized list of any deductions\n   - Compare with check-out documentation\n   - Challenge unfair deductions in writing\n   - Provide evidence supporting your position\n\n3. **Dispute Resolution**\n   - Use deposit protection scheme dispute service\n   - Submit comprehensive evidence package\n   - Respond promptly to any queries\n   - Consider university advice services\n\nBy following these steps methodically, you maximize your chances of receiving your full deposit back from your student accommodation."
  ];
  
  return howTos[Math.floor(Math.random() * howTos.length)];
}

/**
 * Get a random comparison
 */
function getRandomComparison(prompt: string): string {
  const comparisons = [
    "# University Accommodation vs. Private Rentals: A Comprehensive Comparison\n\n## Cost Factors\n\n### University Accommodation\n- **All-inclusive pricing**: Usually includes utilities, internet, and sometimes cleaning services\n- **Predictable budgeting**: Fixed costs throughout the academic year\n- **Shorter contracts**: Typically align with academic terms (30-40 weeks)\n- **No summer charges**: Often don't pay when not in residence during holidays\n- **No hidden fees**: Maintenance and facilities costs included\n\n### Private Rentals\n- **Variable total costs**: Base rent plus utilities, internet, sometimes council tax\n- **Potentially lower base rent**: Especially for shared houses in less central areas\n- **12-month contracts**: Standard, often paying during summer regardless of occupancy\n- **Deposit requirements**: Typically 4-5 weeks' rent held in protection scheme\n- **Additional fees**: Possible charges for agency services, reference checks\n\n## Living Experience\n\n### University Accommodation\n- **Community environment**: Easier to meet other students\n- **Structured support**: Residential advisors, security staff on-site\n- **Organized social events**: University-run activities and communities\n- **Proximity to campus**: Often within walking distance to facilities\n- **Purpose-built facilities**: Study spaces, communal areas, laundry\n\n### Private Rentals\n- **Greater independence**: Less oversight and regulations\n- **Choice of housemates**: Select your own living companions\n- **More space**: Often larger rooms and living areas\n- **Neighborhood integration**: Experience living in the wider community\n- **Customization**: More freedom to personalize living space\n\n## Convenience & Services\n\n### University Accommodation\n- **Maintenance services**: Rapid response to issues\n- **Security provisions**: Controlled access, sometimes 24/7 reception\n- **Cleaning services**: Often included for communal areas\n- **Simple administration**: One payment to university\n- **Furnished completely**: No need to purchase furniture\n\n### Private Rentals\n- **Greater amenities control**: Choose your own internet provider, energy company\n- **More appliances**: Often full kitchen facilities, sometimes washing machines\n- **Flexible visitor policies**: Set your own rules about guests\n- **Parking options**: More likely to have car parking available\n- **Privacy levels**: Generally more private living arrangements\n\n## Academic Considerations\n\n### University Accommodation\n- **Study-conducive environment**: Policies supporting academic focus\n- **University Wi-Fi**: Usually reliable academic-grade internet\n- **Proximity to resources**: Closer to libraries, labs, study spaces\n- **Academic community**: Surrounded by other students with similar priorities\n- **Integration with university**: Easier participation in campus activities\n\n### Private Rentals\n- **Controlled study environment**: Create your ideal study space\n- **Distance considerations**: Potentially longer commute to campus\n- **Varied neighbors**: May not be in student-focused environment\n- **Year-round access**: Consistent access to your living space\n- **Work-life separation**: Clear boundary between academic and home life\n\n## Suitability Factors\n\n### University Accommodation Best For:\n- First-year students new to university life\n- International students seeking simplified arrangements\n- Those prioritizing campus integration\n- Students wanting predictable, hassle-free living\n- Those without established friend groups for house-sharing\n\n### Private Rentals Best For:\n- Students seeking more independence\n- Established friend groups wanting to live together\n- Those requiring more space or specific facilities\n- Students with specific location preferences\n- Those looking for potentially lower costs (in shared houses)\n\nThe right choice depends on individual priorities regarding cost, convenience, social experience, and academic needs. Many students start in university accommodation and transition to private rentals in later years of study.",
    
    "# Professional Landlords vs. Individual Landlords: Student Housing Comparison\n\n## Property Management & Maintenance\n\n### Professional Landlords\n- **Systematic maintenance**: Established procedures for repairs\n- **Property management teams**: Multiple staff handling different aspects\n- **Online reporting systems**: Formal processes for maintenance requests\n- **Regular inspection schedules**: Structured property checks\n- **Contracted maintenance crews**: Dedicated repair staff or companies\n\n### Individual Landlords\n- **Personal approach**: Direct communication with property owner\n- **Variable response times**: Can be very quick or significantly delayed\n- **DIY repairs**: Often handle minor issues themselves\n- **Local contractor networks**: Established relationships with local tradespeople\n- **Flexible inspection arrangements**: Often more negotiable on timing\n\n## Cost Structure\n\n### Professional Landlords\n- **Market-rate pricing**: Usually aligned with local maximums\n- **Standardized fees**: Consistent application of charges and deposits\n- **Formal rent collection**: Automated systems and strict deadlines\n- **Annual increases**: Systematic rent reviews and regular increases\n- **Corporate billing systems**: Professional invoicing and payment tracking\n\n### Individual Landlords\n- **Negotiable rates**: Sometimes below market for good tenants\n- **Flexible payment arrangements**: May accommodate irregular payment dates\n- **Personalized fee structure**: Sometimes waive certain fees for reliable tenants\n- **Variable rent increases**: May keep rent static for valued tenants\n- **Simple payment methods**: Often direct bank transfers\n\n## Documentation & Legalities\n\n### Professional Landlords\n- **Comprehensive contracts**: Detailed, legally-reviewed agreements\n- **Strict compliance**: Up-to-date with all regulations and requirements\n- **Professional inventory services**: Detailed property condition reports\n- **Deposit protection**: Systematic use of protection schemes\n- **Formal check-in/out procedures**: Structured processes\n\n### Individual Landlords\n- **Variable contract detail**: May use standard templates with personalization\n- **Compliance knowledge varies**: Some very informed, others less so\n- **Self-conducted inventories**: Often less formal documentation\n- **Legal knowledge varies**: May rely more on letting agents for compliance\n- **Simplified processes**: Less paperwork but potentially less protection\n\n## Property Quality & Facilities\n\n### Professional Landlords\n- **Standardized properties**: Consistent quality across portfolio\n- **Contemporary fixtures**: Often newer or regularly updated\n- **Purpose-designed spaces**: Properties tailored to student needs\n- **Amenity packages**: May include gyms, study spaces, social areas\n- **Utility packages**: Often include bills within rent\n\n### Individual Landlords\n- **Unique properties**: More character and individual features\n- **Variable quality**: Can range from basic to premium\n- **Personalized touches**: Sometimes include additional comforts\n- **Evolving facilities**: May improve property based on tenant feedback\n- **Utilities typically separate**: Usually responsible for own utility accounts\n\n## Relationship & Flexibility\n\n### Professional Landlords\n- **Professional boundaries**: Clear landlord-tenant relationship\n- **Consistent policies**: Uniform application of rules\n- **Limited negotiation scope**: Standardized procedures and policies\n- **Impersonal communication**: Often through property managers\n- **Rule enforcement**: Systematic approach to tenancy terms\n\n### Individual Landlords\n- **Personal relationship**: Often know tenants individually\n- **Flexibility on rules**: May accommodate special requests\n- **Negotiable terms**: Room for discussion on various aspects\n- **Direct communication**: Immediate access to decision-maker\n- **Discretionary approach**: May overlook minor issues\n\n## Ideal For:\n\n### Professional Landlords Best For:\n- Students valuing consistent service and clear procedures\n- Those wanting purpose-built student facilities\n- International students needing straightforward processes\n- Those preferring online systems for payments and maintenance\n- Students seeking inclusive billing packages\n\n### Individual Landlords Best For:\n- Students seeking more personal connection with landlord\n- Those valuing flexibility and negotiation potential\n- Students looking for unique properties with character\n- Those who might need flexibility with payment timing\n- Students wanting to avoid corporate bureaucracy\n\nBoth landlord types have distinct advantages, with the best choice depending on individual preferences for formality, flexibility, property type, and relationship dynamics.",
    
    "# Student House vs. Purpose-Built Student Accommodation (PBSA): Comprehensive Comparison\n\n## Living Environment & Atmosphere\n\n### Traditional Student House\n- **Homely atmosphere**: Residential feel with domestic layout\n- **Shared intimacy**: Closer relationships with fewer housemates (typically 3-6)\n- **Community integration**: Located within residential neighborhoods\n- **Character properties**: Often older buildings with unique features\n- **Shared responsibility**: Collective house management develops life skills\n\n### Purpose-Built Student Accommodation\n- **Contemporary environment**: Modern, hotel-like atmosphere\n- **Larger community**: Extended social network across many units\n- **Student-centered location**: Often in student districts or near campus\n- **Uniform design**: Standardized, functional layouts and features\n- **Managed living**: Professional oversight of all building aspects\n\n## Facilities & Amenities\n\n### Traditional Student House\n- **Full kitchen facilities**: Complete cooking setup for shared use\n- **Generous common spaces**: Larger living rooms and dining areas\n- **Residential bathrooms**: Often shared but home-like facilities\n- **Outdoor space**: Gardens or yards in many properties\n- **Storage capacity**: More room for belongings and equipment\n\n### Purpose-Built Student Accommodation\n- **Dedicated study areas**: Designed workspaces and quiet zones\n- **Social facilities**: Games rooms, cinema rooms, lounges\n- **Fitness amenities**: Often include gyms or exercise spaces\n- **Laundry services**: On-site washing facilities\n- **Reception services**: Package handling, security, information\n\n## Privacy & Independence\n\n### Traditional Student House\n- **Greater autonomy**: Less oversight and regulation\n- **Flexible living**: Create your own house rules and culture\n- **Visitor freedom**: Typically no restrictions on guests\n- **Personal space**: Often larger individual rooms\n- **Independence**: Real-world experience managing a household\n\n### Purpose-Built Student Accommodation\n- **Private facilities**: Often en-suite bathrooms\n- **Personal security**: Secure access to individual units\n- **Noise management**: Better soundproofing between units\n- **Defined personal space**: Clear boundaries between residents\n- **Balanced regulation**: Structured environment with necessary privacy\n\n## Cost Considerations\n\n### Traditional Student House\n- **Lower base rent**: Generally cheaper per room\n- **Variable utilities**: Responsible for all household bills\n- **Council tax issues**: Potential liability if mixed occupancy\n- **Separate contracts**: Individual management of multiple services\n- **Transportation costs**: May be located further from campus\n\n### Purpose-Built Student Accommodation\n- **Premium pricing**: Higher all-inclusive rates\n- **Predictable budgeting**: Single payment covers most costs\n- **Inclusive utilities**: Internet, water, electricity often included\n- **No council tax**: Designed for student exemption\n- **Location economy**: Often walking distance to campus\n\n## Management & Support\n\n### Traditional Student House\n- **Variable landlord quality**: Wide range of management styles\n- **Self-reliance**: Greater responsibility for problem-solving\n- **Maintenance challenges**: Potentially slower issue resolution\n- **Limited security**: Standard residential security measures\n- **Property-specific issues**: Particular quirks and maintenance needs\n\n### Purpose-Built Student Accommodation\n- **Professional management**: Dedicated staff on site\n- **24/7 support**: Often round-the-clock assistance available\n- **Rapid maintenance**: Systems for prompt issue resolution\n- **Enhanced security**: Controlled access, often with CCTV\n- **Structured support**: Designed systems for student needs\n\n## Academic Considerations\n\n### Traditional Student House\n- **Study environment control**: Create your own study atmosphere\n- **Space for academic materials**: Room for books and equipment\n- **Quieter settings**: Often in residential neighborhoods\n- **Separate work/social spaces**: Mental division between activities\n- **Year-round accessibility**: Usually 12-month contracts\n\n### Purpose-Built Student Accommodation\n- **Academic facilities**: Dedicated study rooms and resources\n- **University proximity**: Often closer to academic buildings\n- **Academic community**: Environment focused on student needs\n- **Internet reliability**: High-speed connections for study\n- **Term-time contracts**: Often aligned with academic year\n\n## Best Suited For:\n\n### Traditional Student House Ideal For:\n- Students prioritizing independence and life skills development\n- Those seeking lower rental costs and flexible living\n- Students who want to live with a specific group of friends\n- Those valuing space, gardens, and traditional home features\n- Students preferring integration into local communities\n\n### Purpose-Built Student Accommodation Ideal For:\n- First-year and international students seeking structured support\n- Those prioritizing convenience and hassle-free living\n- Students valuing modern facilities and social opportunities\n- Those preferring all-inclusive billing and managed services\n- Students concerned about security and building quality\n\nThe best choice depends on personal priorities regarding independence, budget, social preferences, and desired living experience during university years.",
    
    "# Studio vs. Shared Student Accommodation: Detailed Comparison\n\n## Personal Space & Privacy\n\n### Studio Accommodation\n- **Complete privacy**: Self-contained living without shared spaces\n- **Personal control**: Total authority over your entire living environment\n- **Undisturbed study**: Create your ideal academic workspace\n- **Sleep schedule freedom**: No adjustment to others' routines\n- **Personal bathroom**: Private en-suite facilities\n\n### Shared Accommodation\n- **Partial privacy**: Private bedroom with communal living areas\n- **Shared facilities**: Common kitchens, living rooms, sometimes bathrooms\n- **Negotiated spaces**: Compromise on noise, cleanliness, and usage\n- **Room sanctuary**: Bedroom as personal retreat space\n- **Presence awareness**: Other people always nearby\n\n## Social Dynamics\n\n### Studio Accommodation\n- **Visitor control**: Complete authority over guest invitation\n- **Intentional socializing**: Interaction by choice, not circumstance\n- **Social effort required**: Must actively seek connections\n- **Relationship intensity**: Fewer but potentially deeper connections\n- **Dating privacy**: Complete freedom for romantic relationships\n\n### Shared Accommodation\n- **Built-in community**: Ready-made social circle from day one\n- **Passive interaction**: Regular contact through daily activities\n- **Diverse relationships**: Connections with different personality types\n- **Shared experiences**: Natural bonding through living together\n- **Support network**: Immediate help and company during challenges\n\n## Financial Considerations\n\n### Studio Accommodation\n- **Premium pricing**: Significantly higher per-person cost\n- **All-inclusive options**: Often available with single payment covering utilities\n- **Single-person consumption**: Lower overall utility usage\n- **Self-catering efficiency**: Cook exactly what you need\n- **Personal item investment**: Need all household essentials yourself\n\n### Shared Accommodation\n- **Cost efficiency**: Lower rent per person\n- **Shared utilities**: Split bills across multiple residents\n- **Communal resources**: Share kitchen equipment, cleaning supplies\n- **Food sharing potential**: Reduce costs through communal meals\n- **Bulk buying advantages**: Group purchases of household items\n\n## Daily Living Experience\n\n### Studio Accommodation\n- **Space limitations**: Everything in one room (except bathroom)\n- **Cleaning simplicity**: Only your own space to maintain\n- **Food flexibility**: Eat whenever and whatever you prefer\n- **Compact living**: Need for space optimization and organization\n- **Quick tidying**: Small area means fast cleanup\n\n### Shared Accommodation\n- **Spatial variety**: Different rooms for different activities\n- **Cleaning coordination**: Shared responsibility for common areas\n- **Kitchen scheduling**: Potential competition for cooking space\n- **Generous living areas**: More spacious communal zones\n- **Environmental variety**: Move between different spaces\n\n## Academic Impact\n\n### Studio Accommodation\n- **Controlled study environment**: Complete authority over noise and lighting\n- **Extended study hours**: Work at any time without disturbing others\n- **Focus optimization**: Design space for maximum concentration\n- **Distraction management**: Limited unexpected interruptions\n- **Resource availability**: All study materials in one location\n\n### Shared Accommodation\n- **Collaborative potential**: Easy access to peer academic support\n- **Knowledge sharing**: Learn from housemates' different subjects\n- **Study motivation**: Social accountability for academic effort\n- **Space variation**: Different study locations within the house\n- **Academic boundaries**: Need to establish study-time respect\n\n## Psychological Aspects\n\n### Studio Accommodation\n- **Solitude management**: Need to handle extended alone time\n- **Self-reliance development**: Complete independence in problem-solving\n- **Emotional self-regulation**: Less immediate support during difficulties\n- **Introspection opportunity**: Space for self-reflection and personal growth\n- **Social battery control**: Choose when to engage with others\n\n### Shared Accommodation\n- **Conflict resolution practice**: Develop negotiation and compromise skills\n- **Constant companionship**: Rarely experience unwanted isolation\n- **Emotional support access**: Immediate help during difficult times\n- **Diverse perspective exposure**: Regular contact with different viewpoints\n- **Social skill development**: Daily practice in interpersonal communication\n\n## Best Suited For:\n\n### Studio Accommodation Ideal For:\n- Students highly valuing privacy and personal space\n- Those with established social networks outside accommodation\n- Mature students with independent living experience\n- Individuals with specific study or lifestyle requirements\n- Students willing to pay premium for complete autonomy\n\n### Shared Accommodation Ideal For:\n- First-year students seeking social integration\n- Those prioritizing affordability over privacy\n- Students valuing built-in social interaction\n- Individuals who thrive in collaborative environments\n- Those wanting more spacious living areas at lower cost\n\nThe optimal choice depends on individual preferences regarding privacy, social dynamics, budget constraints, and personal living style priorities."
  ];
  
  return comparisons[Math.floor(Math.random() * comparisons.length)];
}

/**
 * Get a random pros and cons list
 */
function getRandomProsAndCons(prompt: string): string {
  const prosAndCons = [
    "# Pros and Cons of Choosing University-Managed Accommodation\n\n## Pros\n\n### Convenience & Simplicity\n- **All-Inclusive Packages**: Utilities, internet, and basic services included in one payment\n- **On-Campus Location**: Minimal commuting time to classes and facilities\n- **Maintenance Support**: Dedicated staff for repairs and facility management\n- **Academic-Year Leases**: Contracts aligned with term times, no summer payments\n- **Furnishing Included**: Fully equipped rooms without furniture investment\n\n### Security & Support\n- **Dedicated Security**: Card access, security staff, and safety measures\n- **Residential Support**: Advisors and staff available for assistance\n- **Emergency Response**: Systems for rapid response to problems\n- **Accommodation Managers**: Professional oversight of building operations\n- **University Integration**: Direct connection to university support services\n\n### Social Benefits\n- **Built-In Community**: Immediate access to peer network\n- **Organized Events**: Structured social activities and integration programs\n- **Common Spaces**: Dedicated areas for socializing and group activities\n- **Student Demographics**: Surrounded by fellow students\n- **Residential Programs**: Educational and recreational activities\n\n### Academic Advantages\n- **Study-Friendly Environment**: Policies supporting academic focus\n- **University Wi-Fi**: Reliable internet for academic work\n- **Study Spaces**: Dedicated areas for quiet work\n- **Faculty Proximity**: Easier access to academic buildings and resources\n- **Peer Study Groups**: Convenient formation of academic support networks\n\n## Cons\n\n### Financial Considerations\n- **Premium Pricing**: Generally more expensive than private rentals\n- **Standardized Costs**: Limited ability to reduce expenses through conservation\n- **Inflexible Payment Structures**: Set payment schedules\n- **Limited Negotiation**: Fixed pricing without discount opportunities\n- **Additional Services Costs**: Extra charges for optional amenities\n\n### Lifestyle Limitations\n- **Rule Restrictions**: University policies governing behavior and guests\n- **Limited Personalization**: Constraints on decorating and modifying spaces\n- **Room Size Constraints**: Typically smaller than private accommodation\n- **Noise Issues**: Higher density living with potential disturbances\n- **Privacy Challenges**: Increased oversight and community proximity\n\n### Administrative Challenges\n- **Bureaucratic Processes**: Formal procedures for requests and changes\n- **Impersonal Management**: Corporate approach to resident relations\n- **Break Period Policies**: Potential restrictions during holidays\n- **Room Assignment Limitations**: Less control over location and roommates\n- **Inspection Schedules**: Regular room checks and evaluations\n\n### Independence Factors\n- **Developmental Limitations**: Fewer opportunities for independent living skills\n- **Community Conformity**: Pressure to adapt to institutional expectations\n- **Limited Cooking Facilities**: Often restricted kitchen access and capabilities\n- **Visitor Restrictions**: Policies limiting overnight guests\n- **Infantilization Concerns**: Treatment sometimes less adult-oriented\n\n## Particularly Suitable For:\n\n- **First-Year Students**: Transitioning to university life\n- **International Students**: Seeking straightforward accommodation solutions\n- **Those Prioritizing Convenience**: Valuing simplified living arrangements\n- **Students Without Established Groups**: Seeking built-in community\n- **Those Focused on Campus Integration**: Wanting full university experience\n\n## Less Suitable For:\n\n- **Budget-Conscious Students**: Seeking lowest possible housing costs\n- **Independent-Minded Individuals**: Preferring minimal oversight\n- **Students with Established Friends**: Planning to live with specific people\n- **Those with Specific Living Requirements**: Needing particular accommodations\n- **Students Seeking Real-World Experience**: Wanting to develop independent living skills\n\nThe optimal choice depends on priorities regarding convenience, cost, independence, and social preferences during university years.",
    
    "# Pros and Cons of Signing a Joint Tenancy vs. Individual Contracts\n\n## Joint Tenancy Agreement\n\n### Pros\n\n#### Financial Aspects\n- **Potentially Lower Rent**: Often more economical per person\n- **Unified Billing**: Single rent payment and utility accounts\n- **Collective Bargaining**: Group negotiation power with landlord\n- **Shared Deposits**: Lower individual financial commitment upfront\n- **Bulk Purchase Savings**: Shared household items and groceries\n\n#### Social Benefits\n- **Communal Responsibility**: Shared investment in property condition\n- **Household Autonomy**: Freedom to create own house culture and rules\n- **Friend Selection**: Complete control over who you live with\n- **Unified Communication**: Direct group interaction with landlord\n- **Flexible Space Usage**: Collective decisions on common areas\n\n#### Practical Advantages\n- **Wider Property Selection**: Access to entire houses and larger flats\n- **Consistent Housemates**: Stable living group throughout tenancy\n- **Simplified Agreement**: One contract covering all aspects\n- **Preferred Locations**: Often available in popular residential areas\n- **Extended Contracts**: Typically full-year agreements for stability\n\n### Cons\n\n#### Financial Risks\n- **Joint Liability**: Legally responsible for others' unpaid rent\n- **Collective Damages**: Potential to lose deposit for others' actions\n- **Payment Dependencies**: Reliant on everyone's financial reliability\n- **Bill Management Challenges**: Coordination of shared expenses\n- **Early Departure Complications**: Continuing liability if you leave early\n\n#### Relationship Considerations\n- **Conflict Intensity**: Friendship stress through financial interdependence\n- **Limited Recourse**: Fewer options if housemates become problematic\n- **Forced Proximity**: Difficulty distancing from challenging relationships\n- **Group Decision Requirements**: Need consensus on household matters\n- **Power Dynamic Issues**: Potential for dominant personalities \n\n#### Administrative Challenges\n- **Replacement Difficulties**: Complicated process if someone leaves\n- **Contract Rigidity**: All tenants typically needed for any changes\n- **All-or-Nothing Renewal**: Difficult partial group continuation\n- **References Affected**: Your rental history impacted by others' behavior\n- **Credit Risk**: Potential credit impact from others' non-payment\n\n## Individual Contracts\n\n### Pros\n\n#### Financial Security\n- **Personal Liability Only**: Responsible solely for your own payments\n- **Protected Deposits**: Your deposit covers only your actions\n- **Independent Credit Impact**: Only your payment history affects you\n- **Defined Financial Obligation**: Clear personal cost boundaries\n- **Early Departure Options**: Ability to leave without ongoing liability\n\n#### Relationship Benefits\n- **Reduced Friendship Risk**: Less financial entanglement with friends\n- **Conflict Mitigation**: Fewer money-related disagreements\n- **Individual Negotiation**: Personal arrangement with landlord/agent\n- **Simplified Dynamics**: Clearer boundaries between housemates\n- **Exit Flexibility**: Easier to remove yourself from difficult situations\n\n#### Administrative Advantages\n- **Personal References**: Individual rental history\n- **Replacement Simplicity**: Others can leave without affecting you\n- **Renewal Flexibility**: Continue individually regardless of others\n- **Direct Landlord Relationship**: Individual communication channel\n- **Personalized Terms**: Potential for individual room arrangements\n\n### Cons\n\n#### Financial Aspects\n- **Higher Per-Person Cost**: Usually more expensive individually\n- **Limited Negotiation Power**: Less leverage as individual tenant\n- **Separate Administrative Fees**: Individual charges for services\n- **Utility Complications**: Complex arrangements for shared services\n- **Additional Contract Costs**: Higher administrative fees overall\n\n#### Living Experience\n- **Less Control Over Housemates**: Landlord may fill vacancies\n- **Uncertain Household Composition**: Potential for stranger placement\n- **Common Space Ambiguity**: Less clear ownership of shared areas\n- **Variable House Rules**: Difficulty establishing consistent standards\n- **Reduced Group Identity**: Less cohesive household community\n\n#### Practical Limitations\n- **Property Type Restrictions**: Primarily available in purpose-built accommodations\n- **Limited Availability**: Fewer options in traditional housing markets\n- **Less Authentic Experience**: More managed, less independent living\n- **Term-Time Limitations**: Often academic year rather than full-year contracts\n- **Location Constraints**: Typically in student-dense areas only\n\n## Best Suited For:\n\n### Joint Tenancy Ideal For:\n- Established friend groups with high trust\n- Budget-conscious students prioritizing lower costs\n- Those wanting authentic independent living experience\n- Students seeking wider property options and locations\n- People comfortable with interdependent financial arrangements\n\n### Individual Contracts Ideal For:\n- Those prioritizing financial security over cost savings\n- Students without established housing groups\n- People concerned about friendship impacts of money issues\n- Those wanting flexibility to leave without ongoing liability\n- Students preferring managed accommodation environments\n\nThe optimal choice depends on trust levels, financial situation, risk tolerance, and personal priorities regarding student living arrangements.",
    
    "# Pros and Cons of 12-Month vs. Academic-Year Student Tenancies\n\n## 12-Month Tenancies\n\n### Pros\n\n#### Accommodation Security\n- **Year-Round Home**: Continuous access to your accommodation\n- **Storage Convenience**: No need to move belongings during summer\n- **Address Stability**: Consistent postal address for all correspondence\n- **Return Certainty**: Guaranteed housing for next academic year\n- **Settled Environment**: Continuous feeling of being established\n\n#### Practical Benefits\n- **Summer Study Option**: Space for dissertation/project work in summer\n- **Local Employment Access**: Ability to work locally during vacation periods\n- **Internship Compatibility**: Accommodation for summer work placements\n- **Gradual Moving**: No rush to vacate at end of academic year\n- **Term Preparation**: Early return before term starts\n\n#### Financial Aspects\n- **Lower Monthly Rent**: Often reduced rate compared to shorter tenancies\n- **Incentive Potential**: Landlords may offer benefits for full-year commitment\n- **Stability Discounts**: Possible rent reductions for longer commitment\n- **Subletting Potential**: Option to recoup costs during absences\n- **Furnishing Investment Return**: Longer use of any personal items purchased\n\n#### Location Advantages\n- **Wider Property Selection**: Most private rentals operate on 12-month terms\n- **Prime Location Options**: Better areas often only available on full-year terms\n- **Property Quality Choice**: More options across quality spectrum\n- **Housing Type Variety**: Houses, flats, converted properties all available\n- **Preferred Room Selection**: Priority choice in established properties\n\n### Cons\n\n#### Financial Considerations\n- **Vacation Payment**: Paying for accommodation when potentially not using it\n- **Higher Total Cost**: Greater annual expenditure on housing\n- **Double Accommodation**: Potential double payment if returning home\n- **Utility Commitments**: Ongoing bills even during absence\n- **Property Maintenance**: Responsibility continues during holidays\n\n#### Practical Challenges\n- **Property Responsibility**: Continuous obligation for security and maintenance\n- **Travel Limitations**: Housing commitment may restrict extended travel\n- **Home Time Reduction**: Financial pressure to use accommodation you're paying for\n- **Holiday Period Isolation**: Potentially limited student community during breaks\n- **Subletting Complications**: Administrative and legal considerations\n\n#### Future Planning\n- **End-of-Study Overlap**: Paying rent after course completion\n- **Limited Flexibility**: Difficulty adjusting to changing circumstances\n- **Early Termination Challenges**: Financial penalties for breaking contract\n- **Next-Year Commitment**: Early decision required for following year\n- **Relocation Difficulty**: Barriers to changing accommodation mid-year\n\n## Academic-Year Tenancies (Typically 39-42 weeks)\n\n### Pros\n\n#### Financial Benefits\n- **Reduced Total Cost**: No payment for unused summer months\n- **Home Return Savings**: Ability to live cost-free with family during breaks\n- **Strategic Fund Allocation**: Money available for summer experiences\n- **Travel Budget**: Financial flexibility for vacation period activities\n- **Work Location Flexibility**: Freedom to take summer jobs anywhere\n\n#### Practical Advantages\n- **Aligned Schedules**: Housing matches academic calendar\n- **Simplified Vacations**: No property responsibilities during breaks\n- **Storage Services Integration**: Often connected to vacation storage options\n- **Fresh Start Opportunity**: Annual chance to change accommodation\n- **Managed Departure**: Organized end-of-year move-out process\n\n#### University Integration\n- **Institution Alignment**: Synchronized with university calendar\n- **Formal Support**: Often includes university-backed management\n- **Vacation Service Reduction**: No payment for reduced services during breaks\n- **Community Consistency**: Others on same schedule\n- **Transportation Coordination**: Often aligned with university transit options\n\n#### Future Flexibility\n- **Annual Reassessment**: Yearly opportunity to change living situation\n- **Friend Group Adjustment**: Ability to modify housing groups annually\n- **Location Variation**: Experience different areas each year\n- **Accommodation Improvement**: Progression to better housing by year\n- **Post-Graduation Freedom**: No housing commitment after completion\n\n### Cons\n\n#### Accommodation Concerns\n- **Vacation Housing Gaps**: No automatic accommodation during breaks\n- **Storage Requirements**: Need solutions for belongings during summer\n- **Annual Moving Stress**: Regular packing, transport, and settling\n- **Property Competition**: Annual rush for next year's housing\n- **Quality Limitations**: Sometimes restricted to purpose-built options\n\n#### Practical Challenges\n- **Address Instability**: Regular changes to official address\n- **Belongings Management**: Repeated transport or storage requirements\n- **Summer Project Complications**: No guaranteed study space for dissertations\n- **Early Return Difficulties**: Limited access before official start dates\n- **Contract Timing Issues**: Potential gaps between consecutive tenancies\n\n#### Financial Aspects\n- **Higher Monthly Rate**: Increased per-month cost despite shorter period\n- **Repeated Setup Costs**: Annual connection fees for utilities\n- **Multiple Deposits**: New security deposits before previous ones returned\n- **Moving Expenses**: Regular costs for transportation and storage\n- **Summer Accommodation Costs**: Additional expense if summer housing needed\n\n## Best Suited For:\n\n### 12-Month Tenancies Ideal For:\n- Students planning to work locally during summer\n- Those with summer study requirements (final year projects, etc.)\n- Students seeking wider property choices and preferred locations\n- Those prioritizing stability and settled living environment\n- International students who may not return home during breaks\n\n### Academic-Year Tenancies Ideal For:\n- Students returning to family homes during vacations\n- Those planning extensive summer travel or distant internships\n- Budget-conscious students minimizing total annual housing costs\n- Students wanting annual flexibility to change accommodation\n- Those preferring university-aligned contracts and support\n\nThe best choice depends on summer plans, financial situation, stability preferences, and personal priorities regarding university living arrangements.",
    
    "# Pros and Cons of City Center vs. Suburban Student Housing\n\n## City Center Accommodation\n\n### Pros\n\n#### Location Convenience\n- **Campus Proximity**: Often walking distance to university buildings\n- **Reduced Commute**: Minimal travel time and transportation costs\n- **Amenity Access**: Immediate reach to shops, cafes, restaurants\n- **Entertainment Hub**: Close to cinemas, theaters, music venues\n- **Service Availability**: Easy access to banks, post offices, medical facilities\n\n#### Social Advantages\n- **Vibrant Atmosphere**: Bustling environment with constant activity\n- **Social Opportunity**: Higher density of events and gatherings\n- **Diverse Community**: Exposure to varied cultural experiences\n- **Nightlife Access**: Easy and safe return from bars and clubs\n- **Spontaneous Meetups**: Ability to connect with friends on short notice\n\n#### Study Benefits\n- **Library Proximity**: Quick access to university resources\n- **Study Space Options**: Various cafes and public work environments\n- **Late-Night Facilities**: 24-hour study locations often available\n- **Between-Class Convenience**: Easy return to accommodation during gaps\n- **Group Work Facilitation**: Central meeting points for projects\n\n#### Lifestyle Factors\n- **Urban Experience**: Immersion in city culture and diversity\n- **Pedestrian Lifestyle**: Less reliance on public transport\n- **Contemporary Living**: Often newer, purpose-built accommodations\n- **Time Efficiency**: Reduced travel time throughout day\n- **Food Variety**: Extensive dining and takeaway options\n\n### Cons\n\n#### Financial Considerations\n- **Premium Pricing**: Significantly higher rent for central locations\n- **Smaller Space**: Less square footage for the cost\n- **Limited Amenities**: Fewer inclusions (like parking, outdoor space)\n- **Higher Living Expenses**: Increased prices at local shops and services\n- **Entertainment Cost**: Temptation for constant social spending\n\n#### Living Environment\n- **Noise Pollution**: Higher ambient sound levels day and night\n- **Limited Privacy**: Greater population density and overlooking\n- **Space Constraints**: Smaller rooms and communal areas\n- **Outdoor Limitation**: Minimal gardens or private external space\n- **Air Quality Concerns**: Typically higher pollution levels\n\n#### Practical Challenges\n- **Parking Difficulties**: Limited and expensive vehicle accommodation\n- **Storage Constraints**: Restricted space for belongings\n- **Visitor Limitations**: Challenging for guests to visit and park\n- **Delivery Complications**: Sometimes difficult access for services\n- **Moving Logistics**: More challenging transport of belongings\n\n#### Lifestyle Impact\n- **Constant Stimulation**: Potential for focus and relaxation difficulties\n- **FOMO Pressure**: Social expectations and activity awareness\n- **Work-Life Blurring**: Less separation between academic and leisure environments\n- **Sensory Overload**: Continuous environmental stimulation\n- **Green Space Deficit**: Limited access to nature and open areas\n\n## Suburban Accommodation\n\n### Pros\n\n#### Living Environment\n- **Larger Properties**: More space both indoor and outdoor\n- **Better Value**: More square footage for your rental budget\n- **Garden Access**: Often includes yards, patios or shared gardens\n- **Noise Reduction**: Quieter surroundings, especially at night\n- **Air Quality**: Typically lower pollution levels\n\n#### Financial Benefits\n- **Reduced Rent**: Significantly lower monthly housing costs\n- **Lower Utility Bills**: Often cheaper services and council tax bands\n- **Economical Local Services**: More affordable shops and amenities\n- **Parking Inclusion**: Free or low-cost vehicle accommodation\n- **Reduced Temptation**: Less exposure to spending opportunities\n\n#### Living Quality\n- **Privacy Levels**: More personal space and separation\n- **Traditional Housing**: Character properties with unique features\n- **Shared Houses**: More authentic independent living experience\n- **Community Integration**: Connection with non-student residents\n- **Relaxation Environment**: Better separation from academic stresses\n\n#### Practical Advantages\n- **Storage Capacity**: More room for belongings and equipment\n- **Visitor Accommodation**: Space for friends and family to stay\n- **Parking Availability**: Easier vehicle ownership and visitor parking\n- **Delivery Convenience**: Better access for services and deliveries\n- **Moving Simplicity**: Easier transport and unloading of belongings\n\n### Cons\n\n#### Location Challenges\n- **Commute Requirements**: Daily travel time to campus\n- **Transportation Costs**: Bus/train passes or fuel expenses\n- **Limited Night Transport**: Reduced late service options\n- **Weather Exposure**: Greater impact of poor conditions on travel\n- **Time Management**: Need for better planning around travel times\n\n#### Social Considerations\n- **Isolation Risk**: Reduced spontaneous social interaction\n- **Event Distance**: Further from entertainment venues and activities\n- **Visit Coordination**: More planning required for social connections\n- **FOMO Potential**: Missing impromptu campus activities\n- **Split Social Groups**: Separation between house and university friends\n\n#### Practical Limitations\n- **Amenity Distance**: Further from shops and services\n- **Evening Return Concerns**: Safety considerations for late travel\n- **Internet Variability**: Sometimes less reliable connectivity\n- **Between-Class Returns**: Difficulty going home during short breaks\n- **Service Limitations**: Fewer delivery options and hours\n\n#### Academic Impact\n- **Campus Resource Distance**: Limited quick access to libraries\n- **Group Work Complications**: More challenging team meetups\n- **Schedule Constraints**: Less flexibility for irregular timetables\n- **Evening Classes**: Complications with later academic sessions\n- **University Integration**: Reduced immersion in campus culture\n\n## Best Suited For:\n\n### City Center Ideal For:\n- Students prioritizing academic integration and convenience\n- Those with heavily scheduled timetables with irregular hours\n- Students valuing vibrant social life and cultural immersion\n- International students wanting maximum university experience\n- Those without vehicles seeking minimal transportation needs\n\n### Suburban Areas Ideal For:\n- Budget-conscious students prioritizing value for money\n- Those seeking quiet study environments with fewer distractions\n- Students with vehicles or good public transport connections\n- Those valuing space, gardens, and larger living areas\n- Students preferring separation between academic and home life\n\nThe optimal choice depends on priorities regarding convenience, budget, space requirements, and preferred lifestyle during university years."
  ];
  
  return prosAndCons[Math.floor(Math.random() * prosAndCons.length)];
}

/**
 * Get a random generic response
 */
function getRandomResponse(prompt: string): string {
  const responses = [
    "As requested, I've analyzed the current student housing market trends for 2025. The data shows several emerging patterns:\n\n1. Sustainability features are now commanding 15-20% premium in student accommodations, with properties offering energy monitoring systems, renewable energy sources, and green certification seeing highest demand.\n\n2. Technology integration has become essential rather than optional, with 87% of students ranking high-speed internet above location in priority factors. Smart home systems controlling lighting, heating and security are expected in higher-end accommodations.\n\n3. Micro-living solutions continue gaining popularity, with cleverly designed studios of 20-25 square meters attracting premium rates when they include transformable furniture and multifunctional spaces.\n\n4. Mental wellbeing features including dedicated quiet zones, meditation spaces, and natural light optimization are driving selection decisions for 64% of incoming students.\n\n5. Flexible contracts are becoming standard, with 9-month terms aligning to academic calendars and options for monthly extensions during summer seeing higher occupancy rates throughout the year.\n\nLooking forward, the most successful student housing providers will be those balancing technological integration with sustainability and wellbeing features, while maintaining the community aspects that students consistently value in their living experience.",
    
    "Based on my assessment of effective student housing management strategies, I recommend implementing the following system for maintenance requests in your properties:\n\n1. Implement a three-tier response system:\n   - Emergency issues (no heat, water leaks, security breaches): 2-4 hour response\n   - Urgent issues (appliance failures, limited plumbing problems): 24-hour response\n   - Routine maintenance: 3-5 business day response\n\n2. Create a digital reporting platform with these key features:\n   - Mobile-friendly interface with photo/video upload capability\n   - Automated status updates and tracking numbers\n   - Two-way communication channel between tenants and maintenance team\n   - Scheduling functionality for tenant to select convenient time slots\n\n3. Establish a preventative maintenance calendar:\n   - Quarterly HVAC system checks (critical before seasonal changes)\n   - Bi-annual plumbing and electrical inspections\n   - Monthly common area and security feature testing\n   - Annual deep-cleaning and assessment of all properties\n\n4. Develop a preferred contractor network with:\n   - Pre-negotiated rates and service level agreements\n   - Background-checked and verified professionals\n   - Clear understanding of student housing context and needs\n   - 24/7 availability for emergency situations\n\n5. Implement tenant education programs:\n   - Move-in orientation covering basic maintenance and prevention\n   - Seasonal reminders about common issues (frozen pipes, condensation)\n   - Clear guides on tenant vs. management responsibilities\n   - Incentive program for reporting potential issues early\n\nThis structured approach will significantly reduce emergency callouts, improve tenant satisfaction, and provide better budget predictability while extending the lifespan of your property assets.",
    
    "Your request for information about the legal requirements for student accommodation in the UK reveals several critical compliance areas:\n\n1. Safety Certification Requirements:\n   - Gas Safety Certificate: Annual inspection by Gas Safe registered engineer\n   - Electrical Safety Condition Report (EICR): Required every 5 years\n   - Energy Performance Certificate (EPC): Minimum E rating required, valid for 10 years\n   - Fire safety: Working smoke alarms on each floor, carbon monoxide detectors where required\n\n2. HMO Licensing:\n   - Mandatory for properties with 5+ tenants from 2+ households\n   - Additional/Selective licensing schemes vary by local authority\n   - Requirements typically include minimum room sizes, amenity standards, and safety measures\n   - Significant penalties (unlimited fines) for non-compliance\n\n3. Deposit Protection:\n   - All deposits must be protected in government-approved scheme within 30 days\n   - Prescribed information must be provided to tenants\n   - Failure can result in penalties of 1-3x deposit amount\n\n4. Right to Rent Checks:\n   - Legal obligation to verify immigration status of all adult occupants\n   - Original document verification required (or digital checks via government scheme)\n   - Records must be maintained throughout tenancy\n   - Civil and criminal penalties for non-compliance\n\n5. Repairs and Housing Standards:\n   - Homes (Fitness for Human Habitation) Act 2018 requires properties to be fit for habitation\n   - Responsibility for structural elements, heating, water, gas/electricity, sanitation\n   - Reasonable timeframes for repairs (varying by urgency)\n\n6. Information Provision:\n   - How to Rent Guide must be provided at tenancy start\n   - Energy Performance Certificate\n   - Gas Safety Certificate\n   - Deposit protection information\n\nCompliance requirements are subject to change, and additional local regulations may apply in specific university cities or under local authority schemes.",
    
    "After reviewing the data from your student accommodation portfolio, I've identified several key opportunities to enhance income and reduce operational costs:\n\n1. Tiered Service Packaging\n   - Implement Bronze/Silver/Gold service tiers with clear value distinctions\n   - Current market analysis shows willingness to pay 12-18% premium for enhanced packages\n   - Focus premium features on high-demand, low-cost additions (priority maintenance, upgraded WiFi, additional cleaning)\n\n2. Operational Efficiency Improvements\n   - Transition to smart utility monitoring (estimated 14% reduction in energy costs)\n   - Implement centralized procurement for maintenance supplies (potential 22% savings)\n   - Standardize inventory across properties to reduce replacement stock variety\n   - Schedule preventative maintenance during low-occupancy periods\n\n3. Revenue Diversification\n   - Develop summer accommodation packages for conferences/tourism (potential £175-250 per room/week)\n   - Implement fee-based services: storage, early arrival, late departure (£50-120 per service)\n   - Partner with local businesses for commission-based referrals (6-10% typical commission rate)\n   - Monetize common spaces during off-peak hours for community events\n\n4. Technology Implementation\n   - Automate check-in/check-out processes (reducing 28 staff hours per week)\n   - Deploy tenant self-service portal for basic maintenance and information (15% reduction in administrative queries)\n   - Implement dynamic pricing algorithms for non-contracted rooms (potential 8-12% revenue increase)\n\n5. Sustainability Initiatives with ROI\n   - LED lighting conversion (ROI within 14 months)\n   - Water-saving fixtures (ROI within 20 months)\n   - Improved insulation in older properties (ROI within 2-3 heating seasons)\n   - Solar panel installation where appropriate (ROI within 6-8 years with grants)\n\nBased on these findings, I recommend prioritizing the tiered service packages and operational efficiency improvements as they offer the strongest immediate return with minimal capital investment."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Analyze document using OpenAI vision capabilities (mock implementation)
 * @param base64File Base64-encoded file data
 * @param analysisMode Type of analysis to perform
 * @param fileName Optional filename for context
 * @param customPrompt Optional custom prompt for analysis
 * @returns Analysis result as text
 */
export async function analyzeDocument(
  base64File: string,
  analysisMode: string,
  fileName?: string,
  customPrompt?: string
): Promise<string> {
  // Simulate delay for realism
  await simulateProcessingDelay(2000);
  
  // Generate simulated analysis based on mode
  switch (analysisMode) {
    case "extract_info":
      return `# Property Document Information

## Property Details
- Address: 123 Maple Street, Cambridge, MA 02138
- Property Type: Single-family home
- Lot Size: 0.25 acres
- Year Built: 1986
- Property ID: PRO-2025-78542

## Financial Information
- Purchase Price: $625,000
- Monthly Rent: $2,800
- Security Deposit: $5,600 (two months' rent)
- Application Fee: $50 (non-refundable)

## Parties Involved
- Landlord/Owner: Cambridge Real Estate Management LLC
- Property Manager: Sarah Johnson (contact: 555-123-4567)
- Tenant(s): John Smith and Emily Chen
- Real Estate Agent: Michael Rodriguez, Boston Realty Group

## Important Dates
- Lease Start Date: May 1, 2025
- Lease End Date: April 30, 2026
- Signing Date: March 15, 2025
- Move-in Inspection Date: April 28, 2025

## Utilities & Services
- Tenant Responsibility: Electricity, gas, internet, cable
- Landlord Responsibility: Water, sewer, trash collection, lawn maintenance

## Key Terms
- Pets: Allowed with $300 non-refundable pet deposit per pet (max 2 pets)
- Late Fee: $100 if rent not received by the 5th of the month
- Renewal Terms: 60-day notice required for renewal intention
- Early Termination: 2 months' rent penalty unless replacement tenant found`;

    case "summarize":
      return `This document is a 12-month residential lease agreement between Cambridge Real Estate Management LLC (Landlord) and John Smith and Emily Chen (Tenants) for the property at 123 Maple Street, Cambridge, MA. The lease runs from May 1, 2025, to April 30, 2026, with monthly rent of $2,800 due on the 1st of each month.

The agreement specifies a security deposit of $5,600 (two months' rent) and outlines utility responsibilities: tenants pay for electricity, gas, internet, and cable, while the landlord covers water, sewer, trash collection, and lawn maintenance.

Key provisions include:
- Pets allowed with a $300 non-refundable deposit per pet (maximum 2)
- $100 late fee for rent paid after the 5th of the month
- 60-day notice required for lease renewal
- Early termination penalty of two months' rent unless a replacement tenant is found
- Landlord right of entry with 24-hour notice except in emergencies
- Maintenance protocols and tenant responsibilities for property upkeep

The document appears to be a standard residential lease with fairly typical terms for the Cambridge area, signed by all parties on March 15, 2025.`;

    case "risk_assessment":
      return `## Risk Assessment of Lease Agreement

### High-Risk Items
1. **Security Deposit Amount**: The security deposit of $5,600 (two months' rent) exceeds the legal limit in Massachusetts, which caps security deposits at one month's rent. This violates state law and could expose the landlord to penalties.

2. **Maintenance Responsibility Language**: Section 8.3 includes overly broad language making the tenant responsible for "all repairs," which contradicts Massachusetts law requiring landlords to maintain habitable premises.

3. **Automatic Renewal Clause**: The lease contains an automatic renewal provision without clear opt-out instructions, which may be unenforceable and potentially misleads tenants about their rights.

### Medium-Risk Items
1. **Late Fee Structure**: The $100 late fee may be considered excessive if challenged in court. Massachusetts courts generally look for reasonable relation to actual damages.

2. **Entry Provisions**: While 24-hour notice is specified, the language allows for "inspections as needed," which is too vague and could enable excessive landlord entry.

3. **Subleasing Prohibition**: Complete prohibition of subleasing without any possibility for reasonable accommodation may face challenges, particularly for longer-term leases.

### Low-Risk Items
1. **Pet Policy**: The pet deposit and limitations appear reasonable, though should be clearly distinguished from the security deposit in accounting.

2. **Utility Responsibility**: Division of utilities is clearly stated, reducing potential disputes.

3. **Noise Restrictions**: Standard quiet hours provisions are included and appear reasonable.

### Recommendations
1. **Immediately Revise**: Reduce security deposit to one month's rent to comply with Massachusetts law.
2. **Clarify Maintenance**: Rewrite maintenance section to properly allocate responsibilities according to state law.
3. **Modify Renewal**: Replace automatic renewal with explicit renewal option requiring affirmative tenant action.
4. **Review Late Fees**: Consider tiered or percentage-based late fees that better align with actual damages.

This assessment is based on the document provided and general knowledge of Massachusetts residential tenancy law as of April 2025.`;

    case "compliance_check":
      return `# Compliance Analysis: Residential Lease Agreement

## Non-Compliant Elements
1. **Security Deposit (MAJOR)**: The security deposit of two months' rent ($5,600) exceeds Massachusetts state law limit of one month's rent. This violates M.G.L. c. 186, § 15B.

2. **Lead Paint Disclosure (MAJOR)**: Missing required lead paint disclosure for this pre-1978 property, violating both state law and federal Title X requirements.

3. **Tenant's Right to Repair and Deduct (MAJOR)**: The lease explicitly prohibits tenant-initiated repairs, contradicting Massachusetts law that allows tenants to repair and deduct costs for certain habitability issues (M.G.L. c. 111, § 127L).

## Potentially Problematic Elements
1. **Attorney's Fees Provision**: One-sided attorney fee provision favoring only the landlord may be deemed unconscionable.

2. **Broad Indemnification Clause**: Section 14 contains overly broad tenant indemnification that may improperly shift landlord's statutory responsibilities.

3. **Waiver of Jury Trial**: Clause waiving right to jury trial may be unenforceable in Massachusetts for residential tenancies.

4. **Entry Notice Period**: While 24-hour notice is specified, Massachusetts courts generally prefer "reasonable notice" which may require more time depending on circumstances.

## Missing Required Elements
1. **Statement of Tenant Rights**: Missing the required summary of tenant rights and resources under Massachusetts law.

2. **Security Deposit Receipt**: No mention of providing required security deposit receipt.

3. **Information on Bank Account**: Missing required information about where security deposit will be held.

4. **Heat and Utilities Statement**: No clear statement regarding heating season temperature requirements.

## Recommendations
1. **Immediate Correction Needed**: Reduce security deposit to one month's rent and add lead paint disclosure.

2. **Add Required Disclosures**: Include all missing disclosures and statements required by Massachusetts law.

3. **Remove Unenforceable Provisions**: Remove or modify clauses that improperly limit tenant rights or shift landlord responsibilities.

4. **Legal Review**: Have agreement reviewed by an attorney specializing in Massachusetts landlord-tenant law before execution.

This document requires significant revision to comply with Massachusetts residential tenancy laws.`;

    case "lease_review":
      return `# Lease Agreement Review

## Key Terms Summary
- **Property**: 123 Maple Street, Cambridge, MA 02138 (3BR/2BA single-family home)
- **Monthly Rent**: $2,800 due on the 1st of each month
- **Term**: Fixed 12-month lease (May 1, 2025 - April 30, 2026)
- **Security Deposit**: $5,600 (two months' rent)
- **Late Fee**: $100 if paid after 5th of month
- **Utilities**: Tenant pays electric, gas, internet, cable; Landlord pays water, sewer, trash

## Concerning Terms Identified
🚩 **Security Deposit Amount**: At two months' rent, this exceeds Massachusetts legal maximum of one month's rent.

🚩 **Maintenance Provisions**: Section 8 makes tenant responsible for repairs that are legally landlord's responsibility under Massachusetts law.

🚩 **Entry Rights**: While 24-hour notice is provided, the "regular inspections" provision lacks specificity and could enable excessive landlord access.

🚩 **Penalty Clause**: $500 penalty for any lease violation appears excessive and potentially unenforceable.

## Missing Elements
- No lead paint disclosure (required for pre-1978 properties)
- No bed bug disclosure (required in Cambridge)
- No information on security deposit interest payment
- No clear process for addressing maintenance requests

## Favorable Terms
✓ Reasonable pet policy with clear deposit requirements
✓ Clear parking allocation (2 designated spaces)
✓ Detailed move-out inspection process
✓ Explicit permission for minor decorating (nail holes, removable fixtures)

## Recommendation
This lease contains multiple provisions that likely violate Massachusetts tenant protection laws. Significant revision is needed before signing, particularly regarding the security deposit amount and maintenance responsibilities. Consider having the lease reviewed by a tenant rights attorney or requesting landlord modifications.`;

    case "contract_highlights":
      return `# Property Contract Highlights

## 📝 Key Contract Information
- **Contract Type**: Residential Purchase Agreement
- **Date**: March 10, 2025
- **Property**: 123 Maple Street, Cambridge, MA 02138
- **Parties**: John Smith & Emily Chen (Buyers), Cambridge Real Estate LLC (Seller)

## 💰 Financial Terms
- **Purchase Price**: $625,000
- **Earnest Money Deposit**: $12,500 (held in escrow by Boston Title Company)
- **Financing Contingency**: Buyers must secure financing within 30 days
- **Closing Costs**: Split according to standard Cambridge practices, with Buyer responsible for loan origination fees

## ⚠️ Critical Deadlines
- **Inspection Period**: 10 days from acceptance (expires March 20, 2025)
- **Financing Contingency**: 30 days from acceptance (expires April 9, 2025)
- **Title Review Period**: 15 days from acceptance (expires March 25, 2025)
- **Closing Date**: May 15, 2025 (or within 7 days of mortgage approval if later)

## 🏠 Property Condition
- **Sold As-Is**: Yes, but with inspection contingency
- **Seller Disclosures**: Lead paint (pre-1978 property), previous water damage in basement (2023)
- **Included Items**: All appliances, window treatments, lighting fixtures
- **Excluded Items**: Dining room chandelier, garden shed, basement refrigerator

## ⚖️ Notable Conditions & Contingencies
- **Home Inspection**: Buyer may terminate if inspection reveals defects costing >$5,000 to repair
- **Appraisal**: If appraisal comes in below purchase price, Buyer may terminate or renegotiate
- **Sale of Buyer's Property**: This contract is NOT contingent on Buyers selling their current home
- **Final Walk-Through**: Scheduled for May 14, 2025 (day before closing)

## 📋 Special Provisions
- Sellers permitted to rent back property for up to 14 days after closing at $150/day
- Early occupancy by Buyers not permitted under any circumstances
- Specific repair contingency for replacement of water heater before closing

This document contains legally binding obligations. All deadlines are firm unless modified in writing and signed by all parties.`;

    case "custom":
      if (customPrompt && customPrompt.toLowerCase().includes('rent')) {
        return `# Rent Increase Analysis

Based on the document provided (Rent Increase Notice dated February 15, 2025), I've analyzed the key details:

## Current Rent Structure
- Current monthly rent: $2,400
- Current lease expiration: April 30, 2025

## Proposed Changes
- New monthly rent: $2,800 (+$400 or 16.7% increase)
- Effective date: May 1, 2025
- Lease term: 12 months (through April 30, 2026)

## Legal Compliance Assessment
The notice was provided 75 days before the effective date, which exceeds the minimum 60-day notice requirement for rent increases exceeding 5% in Cambridge, MA.

## Market Context
The provided justification cites:
- 12% average rent increase in the Cambridge market
- Recent property tax increase of 8%
- Building renovation costs of $45,000 completed in January 2025
- No rent increases in the previous 24 months

## Comparative Market Analysis
The document includes data showing similar units in the building rent for $2,750-$2,950, and comparable units in the neighborhood rent for $2,700-$3,100.

## Options Presented to Tenant
1. Accept new 12-month lease at $2,800/month
2. Accept month-to-month tenancy at $3,000/month
3. Decline renewal with move-out by April 30, 2025

## Conclusion
While the increase is substantial at 16.7%, it appears to be:
- Legally compliant with local notice requirements
- Generally aligned with stated market conditions
- Supported by documentation of building improvements
- Within range of comparable units in the building and neighborhood

The tenant should carefully consider the options based on their financial situation and whether the property continues to meet their needs at the increased price point.`;
      } else {
        return `I've analyzed the document as requested.

The document appears to be a ${fileName || 'property-related document'} containing information relevant to a real estate transaction or agreement. 

Based on my analysis, the document contains several key sections with important information that should be carefully reviewed. The language used is formal and legal in nature, with specific terms and conditions that establish the rights and obligations of the parties involved.

Without more specific instructions about what aspects to focus on, I've provided a general analysis. The document appears to be complete and properly structured, though as with any legal document, having it reviewed by a qualified legal professional would be advisable before taking any binding actions based on its contents.

If you need a more specific analysis, please provide more detailed instructions about what aspects of the document you'd like me to focus on.`;
      }
    default:
      return `Document Analysis Results

I've examined the ${fileName || 'uploaded document'} and can provide the following analysis:

The document appears to be a property-related document containing standard terms and conditions typical for real estate transactions. Key elements include property details, financial terms, and responsibilities of involved parties.

Without more specific instructions on what to analyze, I've conducted a general review. The document follows standard formatting and structure for its type, with clearly delineated sections covering the main aspects of the agreement.

Several important dates are mentioned throughout, including effective dates and deadlines for various actions. The financial terms appear to be clearly stated, though as with any financial agreement, these should be carefully reviewed by all parties.

For a more detailed analysis, consider specifying what particular aspects of the document you'd like examined more closely.`;
  }
}

/**
 * Generate a city image using mock implementation
 * @param cityName Name of the city to generate an image for
 * @param style Optional style parameter (architectural, modern, historic, etc.)
 * @returns URL of the mock city image
 */
export async function generateCityImage(
  cityName: string, 
  style: string = 'photorealistic'
): Promise<string> {
  try {
    log(`Mock generating city image for ${cityName} (${style})`, 'mock-openai');
    
    // Simulate some processing time for realism
    await simulateProcessingDelay(2000, 4000);
    
    // Return city-specific placeholder images
    const cityPlaceholders: Record<string, string> = {
      'london': 'https://placehold.co/1024x1024/bae6fd/1e293b?text=London+City+Image',
      'manchester': 'https://placehold.co/1024x1024/e0f2fe/1e293b?text=Manchester+City+Image',
      'birmingham': 'https://placehold.co/1024x1024/dbeafe/1e293b?text=Birmingham+City+Image',
      'leeds': 'https://placehold.co/1024x1024/ede9fe/1e293b?text=Leeds+City+Image',
      'liverpool': 'https://placehold.co/1024x1024/67e8f9/1e293b?text=Liverpool+City+Image'
    };
    
    // Get the city placeholder or a generic one if the city is not found
    const cityNameLower = cityName.toLowerCase();
    const imageUrl = cityPlaceholders[cityNameLower] || 
      `https://placehold.co/1024x1024/67e8f9/1e293b?text=${cityName}+City+Image`;
    
    return imageUrl;
  } catch (error: any) {
    log(`Mock error generating city image: ${error.message}`, 'mock-openai');
    throw error;
  }
}

export default {
  checkApiKey,
  generatePropertyDescription,
  generateEmbeddings,
  analyzeImage,
  compareFaces,
  generateText,
  extractDocumentInfo,
  analyzeComplianceIssues,
  verifyIdentity,
  summarizeDocument,
  generateImage,
  generateCityImage,
  generateFloorPlan,
  analyzeDocument,
};