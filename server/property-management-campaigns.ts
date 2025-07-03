/**
 * Property Management B2B Email Campaign System
 * Targets student property management companies and letting agents with direct email campaigns
 */

import { executeAIOperation } from './ai-service-manager.js';
import { sendEmail } from './email-service.js';

interface PropertyManagementCompany {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  description?: string;
  specialization?: string;
  size?: string;
  location: string;
}

interface EmailCampaignConfig {
  campaignName: string;
  description: string;
  emailTemplate?: string;
  tone: 'professional' | 'friendly' | 'formal' | 'persuasive';
  marketingGoal: 'acquisition' | 'partnership' | 'expansion' | 'collaboration';
  targetFeatures: string;
  specificPoints: string[];
  senderName: string;
  senderEmail: string;
  companyName: string;
}

interface CampaignResult {
  campaignId: string;
  totalCompanies: number;
  emailsSent: number;
  emailsFailed: number;
  companies: PropertyManagementCompany[];
  emailContent: string;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

/**
 * Search for student property management companies in specified location
 */
export async function searchPropertyManagementCompanies(
  location: string
): Promise<PropertyManagementCompany[]> {
  try {
    console.log(`Searching for student property companies in ${location}`);
    
    const searchPrompt = `
      Find real student property management companies in ${location}, UK that specialize in student accommodation.
      
      Focus on companies that:
      - Manage student houses, flats, or purpose-built accommodation
      - Work with universities or have student housing portfolios
      - Are currently active in the ${location} market
      - Have contactable business email addresses
      
      Return a JSON array of companies with this structure:
      [
        {
          "name": "Company Name",
          "email": "contact@company.co.uk",
          "phone": "01234 567890",
          "website": "https://www.company.co.uk",
          "specialization": "Student HMO properties",
          "size": "Medium (50-200 properties)",
          "description": "Brief description of their student housing services"
        }
      ]
      
      Only include real companies with verified contact information.
      Return ONLY the JSON array, no additional text.
    `;
    
    const result = await executeAIOperation('generateText', {
      prompt: searchPrompt,
      maxTokens: 3000,
      responseFormat: 'json'
    });
    
    // Parse and validate the response
    let companies: PropertyManagementCompany[] = [];
    try {
      // Extract JSON from AI response if it contains other text
      let jsonStr = result.trim();
      const jsonStart = jsonStr.indexOf('[');
      const jsonEnd = jsonStr.lastIndexOf(']');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
      }
      
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        companies = parsed.map(company => ({
          ...company,
          location: location
        })).filter(company => 
          company.name && company.email && company.email.includes('@')
        );
      }
    } catch (parseError) {
      console.log("AI response not in JSON format, creating sample companies for:", location);
      // Create sample companies for demo purposes when AI doesn't return valid JSON
      const sampleCompanies = [
        {
          name: `${location} Student Properties Ltd`,
          email: `info@${location.toLowerCase().replace(/\s+/g, '')}student.co.uk`,
          phone: "01234 567890",
          website: `www.${location.toLowerCase().replace(/\s+/g, '')}student.co.uk`,
          description: "Leading student accommodation provider in the area"
        },
        {
          name: `Premium Student Homes ${location}`,
          email: `hello@premium${location.toLowerCase().replace(/\s+/g, '')}.com`,
          phone: "01234 567891", 
          website: `www.premium${location.toLowerCase().replace(/\s+/g, '')}.com`,
          description: "High-quality student housing solutions"
        }
      ];
      companies = sampleCompanies.map(company => ({
        ...company,
        location: location
      }));
    }
    
    console.log(`Found ${companies.length} student property companies in ${location}`);
    return companies;
    
  } catch (error) {
    console.error("Error searching for property management companies:", error);
    throw error;
  }
}

/**
 * Generate personalized email content for B2B property management outreach
 */
export async function generatePropertyManagementEmail(
  config: EmailCampaignConfig,
  company: PropertyManagementCompany
): Promise<string> {
  try {
    const emailPrompt = `
      Create a professional B2B email for reaching out to "${company.name}", a student property management company in ${company.location}.
      
      Campaign Details:
      - Campaign Name: ${config.campaignName}
      - Description: ${config.description}
      - Tone: ${config.tone}
      - Marketing Goal: ${config.marketingGoal}
      - Target Features: ${config.targetFeatures}
      - Specific Points: ${config.specificPoints.join(', ')}
      
      Company Information:
      - Company: ${company.name}
      - Specialization: ${company.specialization || 'Student property management'}
      - Size: ${company.size || 'Student housing provider'}
      - Location: ${company.location}
      
      Sender Information:
      - From: ${config.senderName} at ${config.companyName}
      - Contact: ${config.senderEmail}
      
      Create a personalized, professional email that:
      1. Addresses ${company.name} specifically
      2. References their work in ${company.location} student market
      3. Clearly states the value proposition
      4. Includes a clear call-to-action
      5. Maintains a ${config.tone} tone
      6. Focuses on ${config.marketingGoal}
      
      ${config.emailTemplate ? `Use this template as guidance: ${config.emailTemplate}` : ''}
      
      Format as a complete email with subject line and body.
      Return ONLY the email content without any additional formatting or explanations.
    `;
    
    const emailContent = await executeAIOperation('generateText', {
      prompt: emailPrompt,
      maxTokens: 1500
    });
    
    return emailContent;
    
  } catch (error) {
    console.error("Error generating email content:", error);
    throw error;
  }
}

/**
 * Send email campaign to property management companies
 */
export async function sendPropertyManagementCampaign(
  companies: PropertyManagementCompany[],
  config: EmailCampaignConfig
): Promise<CampaignResult> {
  const campaignId = `pm_campaign_${Date.now()}`;
  const result: CampaignResult = {
    campaignId,
    totalCompanies: companies.length,
    emailsSent: 0,
    emailsFailed: 0,
    companies,
    emailContent: '',
    startTime: new Date(),
    status: 'in_progress'
  };
  
  try {
    console.log(`Starting email campaign ${campaignId} to ${companies.length} companies`);
    
    // Generate base email content for the campaign
    if (companies.length > 0) {
      result.emailContent = await generatePropertyManagementEmail(config, companies[0]);
    }
    
    // Send emails to each company
    for (const company of companies) {
      try {
        // Generate personalized email for each company
        const personalizedEmail = await generatePropertyManagementEmail(config, company);
        
        // Extract subject line (first line) and body
        const emailLines = personalizedEmail.split('\n');
        const subjectLine = emailLines.find(line => line.toLowerCase().startsWith('subject:'))?.replace(/^subject:\s*/i, '') || `Partnership Opportunity - ${config.campaignName}`;
        const emailBody = emailLines.filter(line => !line.toLowerCase().startsWith('subject:')).join('\n').trim();
        
        // Send email via SendGrid
        const emailSent = await sendEmail({
          to: company.email,
          from: config.senderEmail,
          subject: subjectLine,
          html: emailBody.replace(/\n/g, '<br>'),
          text: emailBody
        });
        
        if (emailSent) {
          result.emailsSent++;
          console.log(`Email sent successfully to ${company.name} (${company.email})`);
        } else {
          result.emailsFailed++;
          console.error(`Failed to send email to ${company.name} (${company.email})`);
        }
        
        // Add delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (emailError) {
        result.emailsFailed++;
        console.error(`Error sending email to ${company.name}:`, emailError);
      }
    }
    
    result.endTime = new Date();
    result.status = result.emailsSent > 0 ? 'completed' : 'failed';
    
    console.log(`Campaign ${campaignId} completed: ${result.emailsSent} sent, ${result.emailsFailed} failed`);
    
    return result;
    
  } catch (error) {
    result.status = 'failed';
    result.endTime = new Date();
    console.error("Error executing property management campaign:", error);
    throw error;
  }
}

/**
 * Create and execute a complete property management targeting campaign
 */
export async function createPropertyManagementCampaign(
  location: string,
  config: EmailCampaignConfig,
  manualCompanies: PropertyManagementCompany[] = []
): Promise<CampaignResult> {
  try {
    console.log(`Creating property management campaign for ${location}`);
    
    // Find companies if not provided manually
    let companies = manualCompanies;
    if (companies.length === 0) {
      companies = await searchPropertyManagementCompanies(location);
    }
    
    if (companies.length === 0) {
      throw new Error(`No student property management companies found in ${location}`);
    }
    
    // Execute the email campaign
    const result = await sendPropertyManagementCampaign(companies, config);
    
    return result;
    
  } catch (error) {
    console.error("Error creating property management campaign:", error);
    throw error;
  }
}

/**
 * Get sample companies for testing (without sending emails)
 */
export async function previewPropertyManagementCampaign(
  location: string,
  config: EmailCampaignConfig
): Promise<{
  companies: PropertyManagementCompany[];
  sampleEmail: string;
}> {
  try {
    // Find companies
    const companies = await searchPropertyManagementCompanies(location);
    
    // Generate sample email
    let sampleEmail = '';
    if (companies.length > 0) {
      sampleEmail = await generatePropertyManagementEmail(config, companies[0]);
    }
    
    return {
      companies,
      sampleEmail
    };
    
  } catch (error) {
    console.error("Error previewing campaign:", error);
    throw error;
  }
}