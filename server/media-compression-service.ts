/**
 * Media Compression Service
 * 
 * Handles compression of images and videos using Sharp and FFmpeg
 */
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs-extra';
import path from 'path';
import { promisify } from 'util';
import { log } from './vite';

// Create necessary directories
const uploadsDir = path.join(process.cwd(), 'uploads');
const tempDir = path.join(uploadsDir, 'temp');
const compressedDir = path.join(uploadsDir, 'compressed');

// Ensure directories exist
fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(tempDir);
fs.ensureDirSync(compressedDir);

// Set size thresholds (in bytes)
const IMAGE_SIZE_THRESHOLD = 2 * 1024 * 1024; // 2MB
const VIDEO_SIZE_THRESHOLD = 20 * 1024 * 1024; // 20MB

// Configuration defaults
const DEFAULT_IMAGE_QUALITY = 80;
const DEFAULT_IMAGE_MAX_WIDTH = 1920;
const DEFAULT_VIDEO_CRF = 28; // Higher = more compression, lower quality
const DEFAULT_VIDEO_PRESET = 'medium'; // Options: ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow

/**
 * Media type identification
 */
export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  UNKNOWN = 'unknown'
}

/**
 * Media compression options
 */
export interface CompressionOptions {
  imageQuality?: number; // 1-100
  maxWidth?: number;
  videoCRF?: number; // 0-51 (lower is higher quality)
  videoPreset?: string;
  maintainAspectRatio?: boolean;
}

/**
 * Media compression result
 */
export interface CompressionResult {
  success: boolean;
  originalPath: string;
  compressedPath: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  type: MediaType;
  width?: number;
  height?: number;
  duration?: number;
  error?: string;
}

/**
 * Determine media type from file extension
 * @param filePath Path to the file
 * @returns MediaType enum value
 */
export function getMediaType(filePath: string): MediaType {
  const ext = path.extname(filePath).toLowerCase();
  
  // Image formats
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'].includes(ext)) {
    return MediaType.IMAGE;
  }
  
  // Video formats
  if (['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v'].includes(ext)) {
    return MediaType.VIDEO;
  }
  
  // Document formats
  if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'].includes(ext)) {
    return MediaType.DOCUMENT;
  }
  
  return MediaType.UNKNOWN;
}

/**
 * Check if file size exceeds threshold for compression
 * @param filePath Path to the file
 * @param mediaType Type of media
 * @returns Boolean indicating if compression is needed
 */
export function needsCompression(filePath: string, mediaType: MediaType): boolean {
  try {
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    
    switch (mediaType) {
      case MediaType.IMAGE:
        return fileSize > IMAGE_SIZE_THRESHOLD;
      case MediaType.VIDEO:
        return fileSize > VIDEO_SIZE_THRESHOLD;
      default:
        return false;
    }
  } catch (error) {
    log(`Error checking file size: ${error}`, 'media-compression');
    return false;
  }
}

/**
 * Get image dimensions
 * @param filePath Path to the image file
 * @returns Promise with width and height
 */
async function getImageDimensions(filePath: string): Promise<{width: number, height: number}> {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0
    };
  } catch (error) {
    log(`Error getting image dimensions: ${error}`, 'media-compression');
    return { width: 0, height: 0 };
  }
}

/**
 * Get video dimensions and duration
 * @param filePath Path to the video file
 * @returns Promise with width, height, and duration
 */
function getVideoInfo(filePath: string): Promise<{width: number, height: number, duration: number}> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      
      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      
      if (!videoStream) {
        reject(new Error('No video stream found'));
        return;
      }
      
      resolve({
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        duration: metadata.format.duration || 0
      });
    });
  });
}

/**
 * Compress an image file
 * @param inputPath Path to the input image file
 * @param options Compression options
 * @returns Promise with compression result
 */
export async function compressImage(
  inputPath: string, 
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  try {
    const originalSize = fs.statSync(inputPath).size;
    const extension = path.extname(inputPath);
    const fileName = path.basename(inputPath, extension);
    const outputPath = path.join(compressedDir, `${fileName}-compressed${extension}`);
    
    // Get image dimensions
    const dimensions = await getImageDimensions(inputPath);
    
    // Determine target width and quality
    const quality = options.imageQuality || DEFAULT_IMAGE_QUALITY;
    const maxWidth = options.maxWidth || DEFAULT_IMAGE_MAX_WIDTH;
    
    // Setup resize options
    const resizeOptions: sharp.ResizeOptions = {
      fit: 'inside',
      withoutEnlargement: true
    };
    
    // Process the image
    let image = sharp(inputPath);
    
    // Resize if needed
    if (dimensions.width > maxWidth) {
      image = image.resize(maxWidth, null, resizeOptions);
    }
    
    // Compress based on format
    if (['.jpg', '.jpeg'].includes(extension.toLowerCase())) {
      await image.jpeg({ quality }).toFile(outputPath);
    } else if (extension.toLowerCase() === '.png') {
      await image.png({ quality: Math.min(Math.max(quality / 10, 1), 10) }).toFile(outputPath);
    } else if (extension.toLowerCase() === '.webp') {
      await image.webp({ quality }).toFile(outputPath);
    } else {
      // For other formats, convert to JPEG
      await image.jpeg({ quality }).toFile(outputPath.replace(extension, '.jpg'));
    }
    
    // Get compressed size
    const compressedSize = fs.statSync(outputPath).size;
    const compressionRatio = originalSize / compressedSize;
    
    // Get final dimensions
    const finalDimensions = await getImageDimensions(outputPath);
    
    return {
      success: true,
      originalPath: inputPath,
      compressedPath: outputPath,
      originalSize,
      compressedSize,
      compressionRatio,
      type: MediaType.IMAGE,
      width: finalDimensions.width,
      height: finalDimensions.height
    };
  } catch (error) {
    log(`Error compressing image: ${error}`, 'media-compression');
    return {
      success: false,
      originalPath: inputPath,
      compressedPath: '',
      originalSize: fs.statSync(inputPath).size,
      compressedSize: 0,
      compressionRatio: 1,
      type: MediaType.IMAGE,
      error: `Failed to compress image: ${error.message}`
    };
  }
}

/**
 * Compress a video file
 * @param inputPath Path to the input video file
 * @param options Compression options
 * @returns Promise with compression result
 */
export function compressVideo(
  inputPath: string,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  return new Promise(async (resolve) => {
    try {
      const originalSize = fs.statSync(inputPath).size;
      const extension = path.extname(inputPath);
      const fileName = path.basename(inputPath, extension);
      const outputPath = path.join(compressedDir, `${fileName}-compressed.mp4`);
      
      // Get video info
      let videoInfo;
      try {
        videoInfo = await getVideoInfo(inputPath);
      } catch (error) {
        log(`Error getting video info: ${error}`, 'media-compression');
        videoInfo = { width: 0, height: 0, duration: 0 };
      }
      
      // Configure compression options
      const crf = options.videoCRF || DEFAULT_VIDEO_CRF;
      const preset = options.videoPreset || DEFAULT_VIDEO_PRESET;
      
      // Use FFmpeg to compress the video
      const ffmpegCommand = ffmpeg(inputPath)
        .output(outputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .addOption('-crf', crf.toString())
        .addOption('-preset', preset);
      
      // Process the video
      ffmpegCommand
        .on('end', () => {
          try {
            const compressedSize = fs.statSync(outputPath).size;
            const compressionRatio = originalSize / compressedSize;
            
            resolve({
              success: true,
              originalPath: inputPath,
              compressedPath: outputPath,
              originalSize,
              compressedSize,
              compressionRatio,
              type: MediaType.VIDEO,
              width: videoInfo.width,
              height: videoInfo.height,
              duration: videoInfo.duration
            });
          } catch (error) {
            log(`Error getting compressed video info: ${error}`, 'media-compression');
            resolve({
              success: false,
              originalPath: inputPath,
              compressedPath: '',
              originalSize,
              compressedSize: 0,
              compressionRatio: 1,
              type: MediaType.VIDEO,
              error: `Failed to get compressed video info: ${error.message}`
            });
          }
        })
        .on('error', (err) => {
          log(`Error compressing video: ${err}`, 'media-compression');
          resolve({
            success: false,
            originalPath: inputPath,
            compressedPath: '',
            originalSize,
            compressedSize: 0,
            compressionRatio: 1,
            type: MediaType.VIDEO,
            error: `Failed to compress video: ${err.message}`
          });
        })
        .run();
    } catch (error) {
      log(`Error setting up video compression: ${error}`, 'media-compression');
      resolve({
        success: false,
        originalPath: inputPath,
        compressedPath: '',
        originalSize: fs.existsSync(inputPath) ? fs.statSync(inputPath).size : 0,
        compressedSize: 0,
        compressionRatio: 1,
        type: MediaType.VIDEO,
        error: `Failed to set up video compression: ${error.message}`
      });
    }
  });
}

/**
 * Process and compress media file if it exceeds size thresholds
 * @param filePath Path to the media file
 * @param options Compression options
 * @returns Promise with compression result
 */
export async function compressMediaIfNeeded(
  filePath: string,
  options: CompressionOptions = {}
): Promise<CompressionResult | null> {
  try {
    const mediaType = getMediaType(filePath);
    
    // Skip compression for documents and unknown types
    if (mediaType === MediaType.DOCUMENT || mediaType === MediaType.UNKNOWN) {
      return null;
    }
    
    // Check if the file needs compression
    if (!needsCompression(filePath, mediaType)) {
      log(`No compression needed for ${filePath}`, 'media-compression');
      return null;
    }
    
    // Compress based on media type
    if (mediaType === MediaType.IMAGE) {
      log(`Compressing image: ${filePath}`, 'media-compression');
      return await compressImage(filePath, options);
    } else if (mediaType === MediaType.VIDEO) {
      log(`Compressing video: ${filePath}`, 'media-compression');
      return await compressVideo(filePath, options);
    }
    
    return null;
  } catch (error) {
    log(`Error in compressMediaIfNeeded: ${error}`, 'media-compression');
    return null;
  }
}

/**
 * Get readable file size in KB, MB, etc
 * @param bytes Number of bytes
 * @returns Formatted string with appropriate unit
 */
export function getReadableFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Clean up temporary files older than a certain age
 * @param ageHours Age in hours (default: 24)
 */
export function cleanupTempFiles(ageHours: number = 24): void {
  try {
    const cutoffTime = Date.now() - (ageHours * 60 * 60 * 1000);
    
    // Clean temp directory
    fs.readdirSync(tempDir).forEach(file => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && stats.mtimeMs < cutoffTime) {
        fs.unlinkSync(filePath);
        log(`Cleaned up temp file: ${file}`, 'media-compression');
      }
    });
    
    // Clean compressed directory
    fs.readdirSync(compressedDir).forEach(file => {
      const filePath = path.join(compressedDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && stats.mtimeMs < cutoffTime) {
        fs.unlinkSync(filePath);
        log(`Cleaned up compressed file: ${file}`, 'media-compression');
      }
    });
  } catch (error) {
    log(`Error cleaning up temp files: ${error}`, 'media-compression');
  }
}

// Run cleanup on startup and then every 12 hours
cleanupTempFiles();
setInterval(() => cleanupTempFiles(), 12 * 60 * 60 * 1000);

export default {
  compressImage,
  compressVideo,
  compressMediaIfNeeded,
  getMediaType,
  needsCompression,
  getReadableFileSize,
  cleanupTempFiles
};