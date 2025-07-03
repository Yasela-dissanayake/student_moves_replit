import { info as logInfo, error as logError, debug as logDebug } from './logging';
import fs from 'fs';
import path from 'path';
import { IStorage } from './storage';

// Rate limits for each platform (posts per day)
const PLATFORM_RATE_LIMITS = {
  instagram: 5,
  facebook: 25,
  twitter: 50,
  linkedin: 3,
  youtube: 2,
  tiktok: 8
};

// Default rate limit if platform is not recognized but we want to allow posting
const DEFAULT_RATE_LIMIT = 3;

// Optimal posting times for each platform (24-hour format)
const OPTIMAL_POSTING_TIMES = {
  instagram: ['08:00', '12:00', '15:00', '19:00', '21:00'],
  facebook: ['09:00', '13:00', '15:00', '19:00', '20:30'],
  twitter: ['08:00', '10:00', '12:00', '15:00', '17:00', '20:00'],
  linkedin: ['08:00', '10:00', '17:00'],
  youtube: ['15:00', '20:00'],
  tiktok: ['09:00', '12:00', '15:00', '19:00', '21:00']
};

interface PostHistory {
  id: number;
  userId: number;
  platform: string;
  content: string;
  status: string;
  errorMessage?: string;
  createdAt: string;
  campaignId?: number;
}

interface SocialMediaCredentials {
  userId: number;
  platform: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  username?: string;
  isActive: boolean;
}

/**
 * Rate limit information type for supported platforms
 * The 'supported: true' property acts as a discriminant
 * for TypeScript's discriminated union pattern
 */
interface RateLimit {
  supported: true;
  platformName: string;
  totalLimit: number;
  usedToday: number;
  remainingPosts: number;
  nextBestTime: string;
}

/**
 * Error response type for unsupported platforms
 * The 'supported: false' property acts as a discriminant
 * that pairs with the RateLimit type to create a type-safe union
 * 
 * This ensures consistent fields between both supported and
 * unsupported platforms to make client-side handling easier
 */
interface UnsupportedPlatform {
  supported: false;
  error: string;
  remainingPosts: number;
  nextBestTime: string;
}

class SocialMediaService {
  private storage: IStorage;
  private postHistoryPath: string;
  private postCounter: number = 0;
  private postHistory: PostHistory[] = [];
  private platformUsage: Record<string, Record<string, number>> = {}; // userId -> platform -> count

  constructor(storage: IStorage) {
    this.storage = storage;
    this.postHistoryPath = path.join(process.cwd(), 'temp', 'social-post-history.json');
    this.loadPostHistory();
    this.initializePlatformUsage();
  }

  // Initialize platform usage tracking
  private initializePlatformUsage() {
    // We'll track daily usage
    const resetUsage = () => {
      this.platformUsage = {};
      
      // Save current date as last reset
      const lastReset = new Date().toISOString();
      fs.writeFileSync(
        path.join(process.cwd(), 'temp', 'social-rate-limit-reset.json'),
        JSON.stringify({ lastReset })
      );
    };

    // Check if we need to reset based on day change
    try {
      const resetFilePath = path.join(process.cwd(), 'temp', 'social-rate-limit-reset.json');
      
      if (fs.existsSync(resetFilePath)) {
        const { lastReset } = JSON.parse(fs.readFileSync(resetFilePath, 'utf-8'));
        const lastResetDate = new Date(lastReset);
        const currentDate = new Date();
        
        if (lastResetDate.getDate() !== currentDate.getDate() || 
            lastResetDate.getMonth() !== currentDate.getMonth() ||
            lastResetDate.getFullYear() !== currentDate.getFullYear()) {
          resetUsage();
        }
      } else {
        resetUsage();
      }
    } catch (error) {
      logError(`Error initializing platform usage: ${error}`);
      resetUsage();
    }

    // Calculate current usage from today's history
    const today = new Date().toISOString().split('T')[0];
    this.postHistory.forEach(post => {
      if (post.createdAt.startsWith(today) && post.status === 'success') {
        const { userId, platform } = post;
        if (!this.platformUsage[userId]) {
          this.platformUsage[userId] = {};
        }
        if (!this.platformUsage[userId][platform]) {
          this.platformUsage[userId][platform] = 0;
        }
        this.platformUsage[userId][platform]++;
      }
    });
  }

  // Load post history from file or initialize if it doesn't exist
  private loadPostHistory() {
    try {
      if (!fs.existsSync(path.dirname(this.postHistoryPath))) {
        fs.mkdirSync(path.dirname(this.postHistoryPath), { recursive: true });
      }
      
      if (fs.existsSync(this.postHistoryPath)) {
        this.postHistory = JSON.parse(fs.readFileSync(this.postHistoryPath, 'utf-8'));
        // Set post counter to max id + 1
        this.postCounter = Math.max(...this.postHistory.map(p => p.id), 0) + 1;
      } else {
        this.postHistory = [];
        this.postCounter = 1;
        this.savePostHistory();
      }
    } catch (error) {
      logError(`Error loading post history: ${error}`);
      this.postHistory = [];
      this.postCounter = 1;
    }
  }

  // Save post history to file
  private savePostHistory() {
    try {
      if (!fs.existsSync(path.dirname(this.postHistoryPath))) {
        fs.mkdirSync(path.dirname(this.postHistoryPath), { recursive: true });
      }
      fs.writeFileSync(this.postHistoryPath, JSON.stringify(this.postHistory, null, 2));
    } catch (error) {
      logError(`Error saving post history: ${error}`);
    }
  }

  // Get rate limits for a user across all or specific platforms
  public getRateLimits(userId: number, platforms: string[] = []): Record<string, RateLimit | UnsupportedPlatform> {
    // If no platforms specified, use all available platforms
    const platformsToCheck = platforms.length > 0 
      ? platforms.filter(p => typeof p === 'string')  // Filter out invalid inputs
      : Object.keys(PLATFORM_RATE_LIMITS);

    const result: Record<string, RateLimit | UnsupportedPlatform> = {};

    platformsToCheck.forEach(platform => {
      const platformStr = platform.toString();
      
      // Check if platform is supported
      const isPlatformSupported = Object.keys(PLATFORM_RATE_LIMITS).includes(platformStr);
      
      if (!isPlatformSupported) {
        result[platformStr] = {
          supported: false,
          error: 'Platform not supported',
          remainingPosts: 0,
          nextBestTime: 'N/A'
        };
        return;
      }

      const dailyLimit = PLATFORM_RATE_LIMITS[platformStr as keyof typeof PLATFORM_RATE_LIMITS] || DEFAULT_RATE_LIMIT;
      const currentUsage = this.getUserPlatformUsage(userId, platformStr);
      const remainingPosts = Math.max(0, dailyLimit - currentUsage);
      const rateUsagePercentage = (currentUsage / dailyLimit) * 100;

      // Get next optimal posting time
      const nextBestTime = this.getNextOptimalPostingTime(platformStr);
      
      result[platformStr] = {
        supported: true,
        platformName: platformStr,
        totalLimit: dailyLimit,
        usedToday: currentUsage,
        remainingPosts: remainingPosts,
        nextBestTime: remainingPosts <= 0 ? nextBestTime : 'Now'
      };
    });

    return result;
  }

  // Get user's platform usage
  private getUserPlatformUsage(userId: number, platform: string): number {
    if (!this.platformUsage[userId]) {
      return 0;
    }
    return this.platformUsage[userId][platform] || 0;
  }

  // Get next optimal posting time
  private getNextOptimalPostingTime(platform: string): string {
    type PlatformType = keyof typeof OPTIMAL_POSTING_TIMES;
    
    // Check if the platform is a valid key in OPTIMAL_POSTING_TIMES
    const isValidPlatform = (p: string): p is PlatformType => 
      Object.keys(OPTIMAL_POSTING_TIMES).includes(p);
    
    if (!isValidPlatform(platform)) {
      return 'Unknown';
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeValue = currentHour * 60 + currentMinute;

    // Format: HH:MM in 24-hour
    type TimeInfo = { hours: number; minutes: number; value: number };
    
    const optimalTimes = OPTIMAL_POSTING_TIMES[platform].map((timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return { hours, minutes, value: hours * 60 + minutes } as TimeInfo;
    });

    // Find the next optimal time
    let nextTime = optimalTimes.find((time: TimeInfo) => time.value > currentTimeValue);

    // If no time found today, use the first time for tomorrow
    if (!nextTime && optimalTimes.length > 0) {
      nextTime = optimalTimes[0];
      return `Tomorrow at ${this.formatTime(nextTime.hours, nextTime.minutes)}`;
    } else if (!nextTime) {
      return 'Unknown';
    }

    return `Today at ${this.formatTime(nextTime.hours, nextTime.minutes)}`;
  }

  // Format time to 12-hour with AM/PM
  private formatTime(hours: number, minutes: number): string {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
  }

  // Post to social media
  public async postToSocialMedia(
    userId: number, 
    platform: string, 
    content: string, 
    campaignId?: number
  ) {
    // Check rate limits
    const rateLimits = this.getRateLimits(userId, [platform]);
    const platformStr = platform.toString(); // Ensure it's a string for indexing
    
    // Make sure we have rate limit info for this platform
    if (!rateLimits[platformStr]) {
      return {
        success: false,
        message: `Unknown platform: ${platform}`
      };
    }
    
    const rateLimit = rateLimits[platformStr];
    
    // Check if this is an error response for unsupported platform
    if ('error' in rateLimit) {
      return {
        success: false,
        message: rateLimit.error
      };
    }
    
    if (rateLimit.remainingPosts <= 0) {
      return {
        success: false,
        message: `Rate limit exceeded for ${platform}. Next best time to post: ${rateLimit.nextBestTime}`
      };
    }

    // For this demo implementation, we'll just simulate a successful post
    // In a real implementation, you would make API calls to the social media platforms
    try {
      logInfo(`[social-media] Posting to ${platform} for user ${userId}: ${content.substring(0, 30)}...`);

      // Add to post history
      const newPost: PostHistory = {
        id: this.postCounter++,
        userId,
        platform,
        content,
        status: 'success',
        createdAt: new Date().toISOString(),
        campaignId
      };
      
      this.postHistory.push(newPost);
      this.savePostHistory();
      
      // Update usage tracking
      if (!this.platformUsage[userId]) {
        this.platformUsage[userId] = {};
      }
      if (!this.platformUsage[userId][platformStr]) {
        this.platformUsage[userId][platformStr] = 0;
      }
      this.platformUsage[userId][platformStr]++;

      return { 
        success: true, 
        message: `Successfully posted to ${platform}`,
        postId: newPost.id
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError(`Error posting to ${platform}: ${errorMessage}`);
      
      // Add to post history as failed
      const newPost: PostHistory = {
        id: this.postCounter++,
        userId,
        platform,
        content,
        status: 'failed',
        errorMessage: errorMessage,
        createdAt: new Date().toISOString(),
        campaignId
      };
      
      this.postHistory.push(newPost);
      this.savePostHistory();
      
      return { 
        success: false, 
        message: `Failed to post to ${platform}: ${errorMessage}`
      };
    }
  }

  // Get post history for a user
  public getPostHistory(userId: number, platform?: string) {
    let filteredHistory = this.postHistory.filter(post => post.userId === userId);
    
    if (platform) {
      filteredHistory = filteredHistory.filter(post => post.platform === platform);
    }
    
    // Sort by timestamp, most recent first
    return filteredHistory.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

export default SocialMediaService;