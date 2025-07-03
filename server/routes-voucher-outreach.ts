/**
 * Routes for voucher partner outreach
 * Handles business discovery and outreach management for the voucher program
 */

import express from 'express';
import { log } from './vite';
import { findBusinesses, markBusinessAsContacted } from './business-discovery-service';
import { BusinessType } from './osm-service';
import { IStorage } from './storage';
import { CustomAIService } from './ai-services';
import { sendEmail } from './email-service';

// Status options for business outreach
type OutreachStatus = 
  | 'contacted' 
  | 'interested' 
  | 'negotiating' 
  | 'onboarded' 
  | 'not_interested' 
  | 'no_response';

// Popular UK cities for business discovery
const UK_CITIES = [
  'London',
  'Manchester',
  'Birmingham',
  'Glasgow',
  'Liverpool',
  'Leeds',
  'Edinburgh',
  'Bristol',
  'Sheffield',
  'Newcastle',
  'Cardiff',
  'Nottingham',
  'Belfast',
  'Leicester',
  'Southampton',
  'Brighton',
  'Oxford',
  'Cambridge',
  'York',
  'Aberdeen'
];

// Business types that make good voucher partners
const BUSINESS_TYPES: BusinessType[] = [
  'restaurant',
  'cafe',
  'bar',
  'pub',
  'fast_food',
  'clothing',
  'hairdresser',
  'beauty',
  'supermarket',
  'bakery',
  'bookshop',
  'sports',
  'gym',
  'cinema',
  'theater'
];

/**
 * Export the router for voucher outreach
 */
export default function voucherOutreachRoutes(storage: IStorage, aiService: CustomAIService | null) {
  const router = express.Router();

  // Middleware to ensure user is an admin
  const adminOnly = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.session || !req.user || !req.user.isAdmin) {
      log('Non-admin user attempted to access admin voucher outreach route');
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
  };

  /**
   * Get a list of UK cities for business discovery
   * GET /api/admin/voucher-outreach/cities
   */
  router.get('/cities', adminOnly, (req, res) => {
    log('Getting list of UK cities for business discovery');
    
    // Return the list of UK cities
    res.json({
      cities: UK_CITIES
    });
  });

  /**
   * Get a list of business types for outreach
   * GET /api/admin/voucher-outreach/business-types
   */
  router.get('/business-types', adminOnly, (req, res) => {
    log('Getting list of business types for outreach');
    
    // Return the list of business types
    res.json({
      businessTypes: BUSINESS_TYPES
    });
  });

  /**
   * Discover businesses in a city
   * GET /api/admin/voucher-outreach/discover
   * Query parameters:
   *   - city: The city to search in
   *   - businessType: The type of business to search for (optional)
   *   - includePreviouslyContacted: Whether to include previously contacted businesses (optional)
   */
  router.get('/discover', adminOnly, async (req, res) => {
    const { city, businessType = 'all', includePreviouslyContacted = 'false' } = req.query;
    
    if (!city || typeof city !== 'string') {
      log('Invalid city parameter for business discovery');
      return res.status(400).json({ error: 'City parameter is required' });
    }
    
    try {
      log(`Discovering businesses in ${city} of type ${businessType}`);
      
      // Validate business type
      const validBusinessType = businessType === 'all' || 
        BUSINESS_TYPES.includes(businessType as BusinessType)
        ? businessType as BusinessType
        : 'all';
      
      // Find businesses
      const businesses = await findBusinesses(
        city, 
        validBusinessType,
        includePreviouslyContacted === 'true',
        aiService || undefined
      );
      
      log(`Found ${businesses.length} businesses in ${city}`);
      
      // Return the list of businesses
      res.json({
        city,
        businessType: validBusinessType,
        businesses
      });
    } catch (error) {
      log(`Error discovering businesses: ${error}`);
      res.status(500).json({ error: 'Failed to discover businesses' });
    }
  });

  /**
   * Mark a business as contacted with a specific status
   * POST /api/admin/voucher-outreach/mark-contacted
   * Body:
   *   - businessId: The ID of the business to mark
   *   - status: The outreach status to set
   */
  router.post('/mark-contacted', adminOnly, async (req, res) => {
    const { businessId, status } = req.body;
    
    if (!businessId || !status) {
      log('Invalid parameters for marking business as contacted');
      return res.status(400).json({ error: 'Business ID and status are required' });
    }
    
    // Validate status
    const validStatuses: OutreachStatus[] = [
      'contacted', 
      'interested', 
      'negotiating', 
      'onboarded', 
      'not_interested', 
      'no_response'
    ];
    
    if (!validStatuses.includes(status as OutreachStatus)) {
      log(`Invalid status: ${status}`);
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses
      });
    }
    
    try {
      log(`Marking business ${businessId} as contacted with status ${status}`);
      
      // Mark the business as contacted
      const success = await markBusinessAsContacted(
        parseInt(businessId),
        status as OutreachStatus
      );
      
      if (success) {
        log(`Successfully marked business ${businessId} as contacted`);
        res.json({ success: true });
      } else {
        log(`Failed to mark business ${businessId} as contacted`);
        res.status(500).json({ error: 'Failed to mark business as contacted' });
      }
    } catch (error) {
      log(`Error marking business as contacted: ${error}`);
      res.status(500).json({ error: 'Failed to mark business as contacted' });
    }
  });

  /**
   * Generate outreach email content for a partner
   * POST /api/admin/voucher-outreach/generate-email
   * Body:
   *   - partner: The partner data to generate an email for (from client)
   */
  router.post('/generate-email', adminOnly, async (req, res) => {
    const { partner } = req.body;
    
    if (!partner || !partner.name) {
      log('Invalid partner data for email generation');
      return res.status(400).json({ error: 'Valid partner data is required' });
    }
    
    try {
      log(`Generating outreach email for partner: ${partner.name}`);
      
      // If AI service is available, use it to generate a personalized email
      if (aiService && typeof aiService.generateText === 'function') {
        log(`Using AI to generate personalized email for ${partner.name}`);
        
        // Admin user information for the email signature
        const adminName = req.user && 'name' in req.user 
          ? req.user.name 
          : 'Student Housing Admin Team';
        
        const emailPrompt = `
          Generate a professional outreach email to a business called "${partner.name}" which is a ${partner.category || partner.businessType}.
          The email should invite them to join our student voucher program.
          
          Key details to include:
          - The email is from "${adminName}" at Student Housing Portal
          - Our program connects local businesses with university students through exclusive vouchers and discounts
          - Businesses can offer discounts, special deals, or unique experiences to students
          - Benefits include increased foot traffic, new student customers, and targeted marketing
          - Participation is completely free with no upfront costs
          - It should be warm, professional, and personalized to their specific business type
          - Keep it reasonably brief and to the point (3-4 paragraphs maximum)
          
          Format:
          Subject: [Return a clear, enticing subject line]
          
          Body:
          [The email body with appropriate greeting, paragraphs, and sign-off]
          
          Signature:
          [A professional signature with the admin name]
        `;
        
        try {
          // Generate email content using AI
          let emailContent = '';
          
          const response = await aiService.generateText({
            prompt: emailPrompt,
            maxTokens: 1000,
            temperature: 0.7
          });
          
          // Handle different response formats
          if (typeof response === 'string') {
            emailContent = response;
          } else if (response && typeof response === 'object') {
            // Extract text from object response using type assertion since we don't know the exact shape
            const objResponse = response as Record<string, any>;
            emailContent = objResponse.text || objResponse.content || objResponse.output || '';
          } else {
            emailContent = '';
          }
          
          // Extract subject and body using regex patterns
          const subjectMatch = emailContent.match(/Subject:(.*?)(?=\n\n|\nBody:)/);
          const bodyMatch = emailContent.match(/Body:(.*?)(?=\n\n|\nSignature:)/);
          const signatureMatch = emailContent.match(/Signature:(.*)/);
          
          const subject = subjectMatch 
            ? subjectMatch[1].trim() 
            : `Join Our Student Voucher Program - Opportunity for ${partner.name}`;
          
          const body = bodyMatch 
            ? bodyMatch[1].trim() 
            : emailContent; // Fallback to using the entire content
          
          const signature = signatureMatch
            ? signatureMatch[1].trim()
            : `Best regards,\n${adminName}\nStudent Housing Portal Team`;
          
          log(`Successfully generated personalized email for ${partner.name}`, 'voucher-outreach');
          
          res.json({
            subject,
            body,
            signature,
            partnerName: partner.name,
            partnerEmail: partner.email || '[Partner Email]'
          });
        } catch (aiError) {
          log(`Error generating email with AI: ${aiError}`);
          
          // Fall back to template-based email
          generateTemplateEmail(partner, req, res);
        }
      } else {
        // Use template-based email generation if AI is not available
        generateTemplateEmail(partner, req, res);
      }
    } catch (error) {
      log(`Error generating outreach email: ${error}`);
      res.status(500).json({ error: 'Failed to generate outreach email' });
    }
  });

  /**
   * Generate a template-based email for a partner
   */
  function generateTemplateEmail(partner: any, req: express.Request, res: express.Response) {
    log(`Generating template email for ${partner.name}`);
    
    // Admin user information for the email signature
    const adminName = req.user && 'name' in req.user 
      ? req.user.name 
      : 'Student Housing Admin Team';
    
    // Customize greeting based on business type
    let businessTypeGreeting = '';
    let businessBenefits = '';
    const businessType = partner.type || partner.businessType;
    const city = partner.city || 'your city';
    
    // Create location-specific messaging
    const locationPhrase = city ? `in ${city}` : 'in your area';
    
    switch (businessType) {
      case 'restaurant':
      case 'cafe':
      case 'fast_food':
      case 'take_away':
        businessTypeGreeting = `Your food establishment could be a popular spot for hungry students looking for great deals ${locationPhrase}!`;
        businessBenefits = 'Food and dining establishments typically see a 30% increase in student foot traffic when joining our voucher program.';
        break;
      case 'bar':
      case 'pub':
        businessTypeGreeting = `Your venue could be a favorite gathering spot for students looking for special offers ${locationPhrase}!`;
        businessBenefits = 'Bars and pubs in our network have reported up to 25% increase in weekday business from student promotions.';
        break;
      case 'clothing':
      case 'hairdresser':
      case 'beauty':
        businessTypeGreeting = `Students are always looking for deals on looking their best, and your business could be their go-to choice ${locationPhrase}!`;
        businessBenefits = 'Beauty and fashion businesses partnering with us have built loyal student customer bases that continue beyond graduation.';
        break;
      case 'cinema':
      case 'theater':
      case 'entertainment':
        businessTypeGreeting = `Students love entertainment options, and your venue could be their preferred choice for leisure time ${locationPhrase}!`;
        businessBenefits = 'Entertainment venues see particularly high redemption rates, with over 70% of offered vouchers being used during off-peak hours.';
        break;
      case 'retail':
      case 'supermarket':
      case 'convenience':
      case 'bookshop':
        businessTypeGreeting = `Students are regular shoppers for essentials and study materials, making your retail business an excellent fit for our program ${locationPhrase}!`;
        businessBenefits = 'Retail partners report both increased sales and higher average transaction values from student customers.';
        break;
      case 'fitness':
      case 'gym':
      case 'sport':
        businessTypeGreeting = `Students are increasingly health-conscious and looking for affordable fitness options ${locationPhrase}!`;
        businessBenefits = 'Fitness businesses often convert promotional student users into long-term membership holders.';
        break;
      default:
        businessTypeGreeting = `Students are constantly looking for great deals from quality local businesses like yours ${locationPhrase}!`;
        businessBenefits = 'Our partners typically see a significant increase in student customers, with many becoming regular patrons.';
    }
    
    const subject = `Join Our Student Voucher Program - Opportunity for ${partner.name}`;
    
    const body = `Dear ${partner.name} Team,

I hope this email finds you well. I'm reaching out from the Student Housing Portal, the leading platform connecting students with essential services in your area.

${businessTypeGreeting}

${businessBenefits}

We're inviting select local businesses to join our Student Voucher Program, which connects you directly with thousands of university students. By offering exclusive discounts or special deals through our platform, you can:

• Attract new student customers and increase foot traffic
• Build loyalty with the student community
• Get featured promotion on our highly-visited platform
• Track redemption and measure campaign success

Participation is completely free with no upfront costs. You simply provide the offers you'd like to extend to students, and we handle the rest through our platform.

Would you be interested in learning more? I'd be happy to discuss the details and answer any questions you might have about joining our program.

Thank you for considering this opportunity. I look forward to potentially working together.`;
    
    const signature = `Best regards,

${adminName}
Student Housing Portal Team
studenthousingportal.com`;
    
    log(`Successfully generated template email for ${partner.name}`);
    
    res.json({
      subject,
      body,
      signature,
      partnerName: partner.name,
      partnerEmail: partner.email || '[Partner Email]'
    });
  }

  /**
   * Send outreach email to a partner
   * POST /api/admin/voucher-outreach/send-email
   * Body:
   *   - partnerId: The ID of the partner to send to
   *   - partnerEmail: The email address to send to
   *   - subject: Email subject
   *   - body: Email body
   *   - signature: Email signature
   */
  router.post('/send-email', adminOnly, async (req, res) => {
    const { partnerId, partnerEmail, subject, body, signature } = req.body;
    
    // For backward compatibility, still accept businessId and businessEmail
    const id = partnerId || req.body.businessId;
    const email = partnerEmail || req.body.businessEmail;
    
    if (!id || !email || !subject || !body) {
      log('Invalid parameters for sending outreach email');
      return res.status(400).json({ error: 'Partner ID, email, subject, and body are required' });
    }
    
    try {
      log(`Sending outreach email to partner ${id} at ${email}`);
      
      // Combine body and signature
      const emailBody = `${body}\n\n${signature || ''}`;
      
      // Send the email
      const emailSent = await sendEmail({
        to: email,
        from: 'noreply@studenthousingportal.com',
        subject: subject,
        text: emailBody,
        html: emailBody.replace(/\n/g, '<br>')
      });
      
      if (emailSent) {
        // Mark the partner as contacted
        await markBusinessAsContacted(
          parseInt(id),
          'contacted'
        );
        
        log(`Successfully sent outreach email to partner ${id}`);
        res.json({ success: true });
      } else {
        log(`Failed to send outreach email to partner ${id}`);
        res.status(500).json({ error: 'Failed to send outreach email' });
      }
    } catch (error) {
      log(`Error sending outreach email: ${error}`);
      res.status(500).json({ error: 'Failed to send outreach email' });
    }
  });

  /**
   * Find potential partners based on city and business type
   * POST /api/admin/voucher-outreach/find-partners
   * Body:
   *   - city: The city to search in
   *   - businessType: (optional) The type of business to search for
   */
  router.post('/find-partners', adminOnly, async (req, res) => {
    const { city, businessType = 'all' } = req.body;
    
    if (!city || typeof city !== 'string') {
      log('Invalid city parameter for business discovery');
      return res.status(400).json({ error: 'City parameter is required' });
    }
    
    try {
      log(`Finding partners in ${city} of type ${businessType}`, 'voucher-outreach');
      
      // Validate business type
      const validBusinessType = businessType === 'all' || 
        BUSINESS_TYPES.includes(businessType as BusinessType)
        ? businessType as BusinessType
        : 'all';
      
      // Find businesses using the business discovery service
      const businesses = await findBusinesses(
        city, 
        validBusinessType,
        false, // Don't include previously contacted businesses by default
        aiService || undefined
      );
      
      log(`Found ${businesses.length} businesses in ${city}`);
      
      // Return the list of businesses
      res.json({
        success: true,
        partners: businesses
      });
    } catch (error) {
      log(`Error finding partners: ${error}`);
      res.status(500).json({ error: 'Failed to find potential partners' });
    }
  });

  /**
   * Get existing partners
   * GET /api/admin/voucher-outreach/partners
   * Query parameters:
   *   - city: Optional city filter
   *   - businessType: Optional business type filter
   *   - includeContacted: Whether to include previously contacted businesses
   */
  router.get('/partners', adminOnly, async (req, res) => {
    const { city, businessType = 'all', includeContacted = 'false' } = req.query;
    
    try {
      // If city is provided, filter by city, otherwise get all
      let businesses: any[] = [];
      
      if (city && typeof city === 'string') {
        // Get businesses for the specific city
        businesses = await findBusinesses(
          city,
          businessType as BusinessType,
          includeContacted === 'true',
          aiService || undefined
        );
      } else {
        // Get businesses for all cities with a limit
        // Just use the first few UK cities to keep it simple
        const limitedCities = UK_CITIES.slice(0, 3);
        
        for (const cityName of limitedCities) {
          const cityBusinesses = await findBusinesses(
            cityName,
            businessType as BusinessType,
            includeContacted === 'true',
            aiService || undefined
          );
          
          businesses = [...businesses, ...cityBusinesses];
        }
      }
      
      log(`Returning ${businesses.length} partners`);
      
      // Return the list of businesses
      res.json({
        success: true,
        partners: businesses
      });
    } catch (error) {
      log(`Error getting partners: ${error}`);
      res.status(500).json({ error: 'Failed to get partners' });
    }
  });

  /**
   * Get outreach emails history
   * GET /api/admin/voucher-outreach/emails
   */
  router.get('/emails', adminOnly, async (req, res) => {
    // In a real implementation, this would fetch from a database
    // For now, just return an empty array
    res.json({
      success: true,
      emails: []
    });
  });

  /**
   * Get email templates
   * GET /api/admin/voucher-outreach/templates
   */
  router.get('/templates', adminOnly, async (req, res) => {
    // Return expanded email templates with more business type options
    res.json({
      success: true,
      templates: [
        {
          id: 'standard',
          name: 'Standard Outreach',
          subject: 'Join Our Student Voucher Program - Opportunity for Your Business',
          businessTypes: ['all'],
          content: 'Standard template for all business types',
          statistics: 'Our partners typically see a significant increase in student customers, with many becoming regular patrons.'
        },
        {
          id: 'restaurant',
          name: 'Restaurant Partner',
          subject: 'Student Discount Opportunity for [Business Name]',
          businessTypes: ['restaurant', 'cafe', 'fast_food', 'take_away'],
          content: 'Specialized template for food establishments',
          statistics: 'Food and dining establishments typically see a 30% increase in student foot traffic when joining our voucher program.'
        },
        {
          id: 'retail',
          name: 'Retail Partner',
          subject: 'Student Shopping Partnership - [Business Name]',
          businessTypes: ['clothing', 'supermarket', 'convenience', 'bookshop'],
          content: 'Specialized template for retail businesses',
          statistics: 'Retail partners report both increased sales and higher average transaction values from student customers.'
        },
        {
          id: 'entertainment',
          name: 'Entertainment Venue',
          subject: 'Student Entertainment Partnership - [Business Name]',
          businessTypes: ['cinema', 'theater', 'entertainment'],
          content: 'Specialized template for entertainment businesses',
          statistics: 'Entertainment venues see particularly high redemption rates, with over 70% of offered vouchers being used during off-peak hours.'
        },
        {
          id: 'bar',
          name: 'Bar & Pub Partnership',
          subject: 'Student Night Offers - Partnership Opportunity for [Business Name]',
          businessTypes: ['bar', 'pub'],
          content: 'Specialized template for bars and pubs',
          statistics: 'Bars and pubs in our network have reported up to 25% increase in weekday business from student promotions.'
        },
        {
          id: 'beauty',
          name: 'Beauty & Style',
          subject: 'Student Style & Beauty Partnership - [Business Name]',
          businessTypes: ['hairdresser', 'beauty'],
          content: 'Specialized template for beauty and styling businesses',
          statistics: 'Beauty and fashion businesses partnering with us have built loyal student customer bases that continue beyond graduation.'
        },
        {
          id: 'fitness',
          name: 'Fitness & Wellness',
          subject: 'Student Fitness Partnership - [Business Name]',
          businessTypes: ['fitness', 'gym', 'sport'],
          content: 'Specialized template for fitness and wellness businesses',
          statistics: 'Fitness businesses often convert promotional student users into long-term membership holders.'
        }
      ]
    });
  });

  return router;
}