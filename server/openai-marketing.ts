/**
 * OpenAI Marketing Content Generation
 * Cost-effective alternative to expensive marketing subscription services
 * Uses OpenAI to generate professional marketing campaigns and content
 */
import OpenAI from "openai";
import { log } from "./utils/logger";
import { USE_MOCK_OPENAI } from "./openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = "gpt-4o";

export interface MarketingCampaignParams {
  targetAudience: 'students' | 'landlords' | 'agents' | 'property_managers';
  campaignType: 'email' | 'social' | 'sms' | 'multi_channel';
  propertyType?: string;
  location?: string;
  budget?: string;
  tone: 'professional' | 'casual' | 'urgent' | 'friendly';
  callToAction: string;
  brandName?: string;
  uniqueSellingPoint?: string;
  promotionalOffer?: string;
  seasonality?: 'summer_lettings' | 'academic_year' | 'general' | 'holiday';
}

export interface SocialMediaPostParams {
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok';
  contentType: 'property_showcase' | 'testimonial' | 'tips' | 'promotional' | 'educational';
  propertyDetails?: {
    title: string;
    location: string;
    price: string;
    features: string[];
    bedrooms?: number;
  };
  tone: 'professional' | 'casual' | 'trendy' | 'informative';
  includeHashtags: boolean;
  includeEmojis: boolean;
  maxLength?: number;
}

export interface EmailCampaignParams {
  purpose: 'welcome' | 'property_alert' | 'newsletter' | 'promotional' | 'follow_up';
  recipientType: 'students' | 'landlords' | 'agents';
  subject: string;
  personalisation: {
    name?: string;
    university?: string;
    location?: string;
    preferences?: string[];
  };
  callToAction: string;
  brandVoice: 'professional' | 'friendly' | 'authoritative' | 'casual';
}

/**
 * Generate comprehensive marketing campaign content using OpenAI
 */
export async function generateMarketingCampaign(params: MarketingCampaignParams): Promise<{
  headline: string;
  description: string;
  emailSubject: string;
  emailContent: string;
  socialMediaPosts: {
    platform: string;
    content: string;
    hashtags: string[];
  }[];
  smsContent: string;
  callToActionButtons: string[];
  targetingKeywords: string[];
  estimatedCostSavings: string;
}> {
  try {
    if (USE_MOCK_OPENAI) {
      return generateMockMarketingCampaign(params);
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Create a comprehensive marketing campaign for a UK student property platform targeting ${params.targetAudience}. 

Campaign Details:
- Type: ${params.campaignType}
- Property Type: ${params.propertyType || 'student accommodation'}
- Location: ${params.location || 'UK universities'}
- Tone: ${params.tone}
- Call to Action: ${params.callToAction}
- Brand: ${params.brandName || 'StudentMoves'}
- USP: ${params.uniqueSellingPoint || 'verified properties with transparent pricing'}
- Offer: ${params.promotionalOffer || 'no admin fees'}
- Season: ${params.seasonality || 'academic_year'}

Generate content that would typically cost £500-2000 from marketing agencies:

1. Compelling headline (max 60 characters)
2. Campaign description (100-150 words)
3. Email subject line (max 50 characters)
4. Email content (300-400 words, professional format)
5. Social media posts for Instagram, Facebook, Twitter, LinkedIn (platform-optimized)
6. SMS content (max 160 characters)
7. 3 call-to-action button texts
8. 10 targeting keywords for ads
9. Cost savings estimate vs traditional agencies

Format response as JSON with these exact keys: headline, description, emailSubject, emailContent, socialMediaPosts (array with platform, content, hashtags), smsContent, callToActionButtons (array), targetingKeywords (array), estimatedCostSavings.

Focus on UK student housing market, university locations, and property management benefits.`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    log(`Generated marketing campaign for ${params.targetAudience} - ${params.campaignType}`, 'openai-marketing');
    
    return {
      headline: result.headline || 'Find Your Perfect Student Home',
      description: result.description || 'Professional marketing campaign generated',
      emailSubject: result.emailSubject || 'Your Dream Student Property Awaits',
      emailContent: result.emailContent || 'Generated email content',
      socialMediaPosts: result.socialMediaPosts || [],
      smsContent: result.smsContent || 'Check out amazing student properties',
      callToActionButtons: result.callToActionButtons || ['View Properties', 'Book Viewing', 'Learn More'],
      targetingKeywords: result.targetingKeywords || ['student housing', 'university accommodation'],
      estimatedCostSavings: result.estimatedCostSavings || '£500-2000 saved vs traditional marketing agencies'
    };

  } catch (error: any) {
    log(`Error generating marketing campaign: ${error.message}`, 'openai-marketing-error');
    return generateMockMarketingCampaign(params);
  }
}

/**
 * Generate social media post content using OpenAI
 */
export async function generateSocialMediaPost(params: SocialMediaPostParams): Promise<{
  content: string;
  hashtags: string[];
  optimalPostTime: string;
  engagementTips: string[];
  estimatedReach: string;
}> {
  try {
    if (USE_MOCK_OPENAI) {
      return generateMockSocialMediaPost(params);
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Create an engaging ${params.platform} post for UK student property marketing.

Content Details:
- Platform: ${params.platform}
- Type: ${params.contentType}
- Tone: ${params.tone}
- Include hashtags: ${params.includeHashtags}
- Include emojis: ${params.includeEmojis}
- Max length: ${params.maxLength || getPlatformMaxLength(params.platform)}

${params.propertyDetails ? `Property: ${params.propertyDetails.title} in ${params.propertyDetails.location}, ${params.propertyDetails.bedrooms} bed, £${params.propertyDetails.price}, features: ${params.propertyDetails.features.join(', ')}` : ''}

Generate platform-optimized content that would cost £50-200 per post from social media agencies:

1. Engaging post content (platform character limits)
2. 10-15 relevant hashtags
3. Optimal posting time for UK student audience
4. 3 engagement tips
5. Estimated organic reach

Format as JSON: content, hashtags (array), optimalPostTime, engagementTips (array), estimatedReach.

Focus on UK student lifestyle, university areas, and property benefits.`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    log(`Generated ${params.platform} post for ${params.contentType}`, 'openai-marketing');
    
    return {
      content: result.content || 'Check out this amazing student property!',
      hashtags: result.hashtags || ['#StudentHousing', '#University', '#Accommodation'],
      optimalPostTime: result.optimalPostTime || '6-8 PM weekdays',
      engagementTips: result.engagementTips || ['Use high-quality images', 'Post consistently', 'Engage with comments'],
      estimatedReach: result.estimatedReach || '500-2000 students per post'
    };

  } catch (error: any) {
    log(`Error generating social media post: ${error.message}`, 'openai-marketing-error');
    return generateMockSocialMediaPost(params);
  }
}

/**
 * Generate professional email campaign using OpenAI
 */
export async function generateEmailCampaign(params: EmailCampaignParams): Promise<{
  subject: string;
  preheader: string;
  htmlContent: string;
  textContent: string;
  personalisationTags: string[];
  abtestVariants: { subject: string; content: string }[];
  expectedOpenRate: string;
  costComparison: string;
}> {
  try {
    if (USE_MOCK_OPENAI) {
      return generateMockEmailCampaign(params);
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Create a professional email campaign for UK student property marketing.

Email Details:
- Purpose: ${params.purpose}
- Audience: ${params.recipientType}
- Subject: ${params.subject}
- Brand Voice: ${params.brandVoice}
- Call to Action: ${params.callToAction}
- Personalisation: ${JSON.stringify(params.personalisation)}

Generate content that would cost £200-800 from email marketing agencies:

1. Optimized subject line (max 50 chars)
2. Preheader text (max 90 chars)  
3. HTML email content (responsive design)
4. Plain text version
5. Personalisation tags for merge fields
6. 2 A/B test subject variants
7. Expected open rate for UK students
8. Cost savings vs agencies

Format as JSON: subject, preheader, htmlContent, textContent, personalisationTags (array), abtestVariants (array of objects), expectedOpenRate, costComparison.

Focus on UK student needs, university locations, and property verification.`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    log(`Generated email campaign for ${params.purpose} - ${params.recipientType}`, 'openai-marketing');
    
    return {
      subject: result.subject || params.subject,
      preheader: result.preheader || 'Your perfect student accommodation awaits',
      htmlContent: result.htmlContent || '<p>Professional email content generated</p>',
      textContent: result.textContent || 'Professional email content generated',
      personalisationTags: result.personalisationTags || ['{{firstName}}', '{{university}}', '{{location}}'],
      abtestVariants: result.abtestVariants || [],
      expectedOpenRate: result.expectedOpenRate || '25-35% for student audience',
      costComparison: result.costComparison || '£200-800 saved vs email marketing agencies'
    };

  } catch (error: any) {
    log(`Error generating email campaign: ${error.message}`, 'openai-marketing-error');
    return generateMockEmailCampaign(params);
  }
}

// Helper functions for platform limits
function getPlatformMaxLength(platform: string): number {
  const limits = {
    twitter: 280,
    instagram: 2200,
    facebook: 63206,
    linkedin: 3000,
    tiktok: 300
  };
  return limits[platform as keyof typeof limits] || 500;
}

// Mock implementations for development/testing
function generateMockMarketingCampaign(params: MarketingCampaignParams) {
  return {
    headline: `Find Your Perfect ${params.propertyType || 'Student'} Home`,
    description: `Professional ${params.campaignType} campaign targeting ${params.targetAudience} with ${params.tone} tone. Designed to drive ${params.callToAction} for ${params.brandName || 'StudentMoves'} properties.`,
    emailSubject: `🏠 Amazing ${params.propertyType || 'Student'} Properties Available`,
    emailContent: `Dear Student,\n\nWe've found some amazing ${params.propertyType || 'student'} properties that match your needs. Our verified listings ensure you get transparent pricing and quality accommodation.\n\n${params.callToAction}\n\nBest regards,\n${params.brandName || 'StudentMoves'} Team`,
    socialMediaPosts: [
      {
        platform: 'instagram',
        content: `🏠 Amazing ${params.propertyType || 'student'} properties available! ${params.promotionalOffer || 'No admin fees'} 📚 #StudentHousing #University`,
        hashtags: ['#StudentHousing', '#University', '#NoAdminFees', '#VerifiedProperties']
      },
      {
        platform: 'facebook',
        content: `Looking for quality student accommodation? Our verified properties offer transparent pricing and excellent locations near universities. ${params.callToAction}`,
        hashtags: ['#StudentAccommodation', '#University', '#Housing']
      }
    ],
    smsContent: `🏠 New student properties available! ${params.promotionalOffer || 'No fees'}. View now: [link]`,
    callToActionButtons: ['View Properties', 'Book Viewing', 'Get Started'],
    targetingKeywords: ['student housing', 'university accommodation', 'student properties', 'verified rentals'],
    estimatedCostSavings: '£500-2000 saved vs traditional marketing agencies using OpenAI generation'
  };
}

function generateMockSocialMediaPost(params: SocialMediaPostParams) {
  return {
    content: `🏠 Check out this amazing ${params.propertyDetails?.title || 'student property'}! Perfect for university students with all modern amenities. ${params.includeEmojis ? '📚✨' : ''}`,
    hashtags: ['#StudentHousing', '#University', '#Accommodation', '#StudentLife'],
    optimalPostTime: '6-8 PM weekdays for maximum student engagement',
    engagementTips: ['Use high-quality property photos', 'Post consistently', 'Engage with comments quickly'],
    estimatedReach: '500-2000 students per post with proper hashtags'
  };
}

function generateMockEmailCampaign(params: EmailCampaignParams) {
  return {
    subject: params.subject,
    preheader: 'Your perfect student accommodation awaits - verified properties',
    htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px;"><h2>Hello ${params.personalisation.name || 'Student'}!</h2><p>We've found some amazing properties near ${params.personalisation.university || 'your university'}.</p><p>${params.callToAction}</p><p>Best regards,<br>StudentMoves Team</p></div>`,
    textContent: `Hello ${params.personalisation.name || 'Student'}!\n\nWe've found some amazing properties near ${params.personalisation.university || 'your university'}.\n\n${params.callToAction}\n\nBest regards,\nStudentMoves Team`,
    personalisationTags: ['{{firstName}}', '{{university}}', '{{location}}', '{{preferences}}'],
    abtestVariants: [
      { subject: `${params.subject} - Limited Time`, content: 'Variant A with urgency' },
      { subject: `Your Perfect Home Awaits`, content: 'Variant B with emotional appeal' }
    ],
    expectedOpenRate: '25-35% for UK student audience',
    costComparison: '£200-800 saved vs professional email marketing agencies'
  };
}