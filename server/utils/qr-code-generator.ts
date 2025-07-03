import QRCode from 'qrcode';
import { promises as fs } from 'fs';
import path from 'path';
import { StudentVoucher } from '@shared/schema';

// Make sure upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'qrcodes');

/**
 * Ensures the uploads directory exists
 */
async function ensureUploadsDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating uploads directory:', error);
    throw error;
  }
}

/**
 * Generates a unique filename for a QR code
 */
function generateQrFilename(voucherId: number): string {
  return `voucher_${voucherId}_${Date.now()}.png`;
}

/**
 * Generates QR code data for a voucher
 * The data includes voucher ID, code, and a validation token
 */
export function generateQrData(voucher: StudentVoucher): string {
  // Create a data object with voucher details
  const data = {
    id: voucher.id,
    code: voucher.redemptionCode || `V-${voucher.id}`,
    title: voucher.title,
    companyId: voucher.companyId,
    // Add a timestamp for validation
    timestamp: Date.now(),
  };
  
  // Convert to JSON string
  return JSON.stringify(data);
}

/**
 * Generates and saves a QR code image for a voucher
 * @returns URL path to the saved QR code
 */
export async function generateQrCode(voucher: StudentVoucher): Promise<{ qrCodeData: string, qrCodeImageUrl: string }> {
  await ensureUploadsDir();
  
  // Generate QR code data
  const qrData = generateQrData(voucher);
  
  // Generate filename and full path
  const filename = generateQrFilename(voucher.id);
  const filepath = path.join(UPLOAD_DIR, filename);
  
  // Generate QR code image
  try {
    await QRCode.toFile(filepath, qrData, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#000',
        light: '#fff'
      }
    });
    
    // Return both the data and URL to the image
    return {
      qrCodeData: qrData,
      qrCodeImageUrl: `/uploads/qrcodes/${filename}`
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Validates a QR code by verifying the data inside it
 * @param qrData The data extracted from the QR code
 * @returns True if the QR code is valid
 */
export function validateQrCode(qrData: string): { isValid: boolean, voucherId?: number, errorMessage?: string } {
  try {
    // Parse the QR data
    const data = JSON.parse(qrData);
    
    // Check if required fields exist
    if (!data.id || !data.timestamp) {
      return { isValid: false, errorMessage: 'Invalid QR code format' };
    }
    
    // Check if the QR code is expired (e.g., QR codes valid for 5 minutes)
    const now = Date.now();
    const maxAgeMs = 5 * 60 * 1000; // 5 minutes
    
    if (now - data.timestamp > maxAgeMs) {
      return { isValid: false, errorMessage: 'QR code has expired' };
    }
    
    // QR code is valid
    return { isValid: true, voucherId: data.id };
  } catch (error) {
    console.error('Error validating QR code:', error);
    return { isValid: false, errorMessage: 'Invalid QR code' };
  }
}