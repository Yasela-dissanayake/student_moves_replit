import { storage } from "./storage";
import { UkPropertyLegislation, InsertUkPropertyLegislation } from "@shared/schema";

interface LegislationAPIResponse {
  results: Array<{
    title: string;
    description: string;
    uri: string;
    modified: string;
    type: string;
  }>;
}

interface GovUKAPIResponse {
  results: Array<{
    title: string;
    description: string;
    link: string;
    public_updated_at: string;
    document_type: string;
    content_id: string;
  }>;
}

/**
 * Fetches the latest UK property legislation from official government sources
 */
export async function fetchLatestLegislation(): Promise<InsertUkPropertyLegislation[]> {
  const legislationData: InsertUkPropertyLegislation[] = [];
  
  try {
    // Fetch from legislation.gov.uk API
    const legislationResponse = await fetch(
      'https://www.legislation.gov.uk/search?text=property+landlord+tenant&format=json'
    );
    
    if (legislationResponse.ok) {
      const data: LegislationAPIResponse = await legislationResponse.json();
      
      for (const item of data.results.slice(0, 10)) { // Get latest 10 items
        legislationData.push({
          title: item.title,
          description: item.description,
          category: categorizeByTitle(item.title),
          status: 'active',
          urgency: assessUrgency(item.title, item.description),
          effectiveDate: new Date(item.modified).toISOString().split('T')[0],
          sourceUrl: item.uri,
          governmentSource: 'legislation.gov.uk',
          summary: truncateDescription(item.description),
          keyPoints: extractKeyPoints(item.description),
          affectedParties: determineAffectedParties(item.title, item.description),
          tags: generateTags(item.title, item.description),
          isBreaking: isBreakingNews(item.title, item.modified)
        });
      }
    }
    
    // Fetch from gov.uk API for guidance and updates
    const govResponse = await fetch(
      'https://www.gov.uk/api/search.json?q=property+law+landlord+tenant&filter_organisations[]=department-for-levelling-up-housing-and-communities'
    );
    
    if (govResponse.ok) {
      const govData: GovUKAPIResponse = await govResponse.json();
      
      for (const item of govData.results.slice(0, 10)) { // Get latest 10 items
        legislationData.push({
          title: item.title,
          description: item.description,
          category: categorizeByTitle(item.title),
          status: 'active',
          urgency: assessUrgency(item.title, item.description),
          effectiveDate: new Date(item.public_updated_at).toISOString().split('T')[0],
          sourceUrl: item.link,
          governmentSource: 'gov.uk',
          summary: truncateDescription(item.description),
          keyPoints: extractKeyPoints(item.description),
          affectedParties: determineAffectedParties(item.title, item.description),
          tags: generateTags(item.title, item.description),
          isBreaking: isBreakingNews(item.title, item.public_updated_at)
        });
      }
    }
    
  } catch (error) {
    console.error('Error fetching legislation data:', error);
    // Return current UK property law essentials as fallback
    return getCurrentLegislationEssentials();
  }
  
  return legislationData;
}

/**
 * Returns essential UK property legislation that landlords and agents must know
 */
function getCurrentLegislationEssentials(): InsertUkPropertyLegislation[] {
  return [
    {
      title: "Housing Act 1988 - Assured Shorthold Tenancies",
      description: "The primary legislation governing most private residential tenancies in England and Wales, establishing the framework for assured shorthold tenancies (ASTs).",
      category: 'tenancy_law',
      status: 'active',
      urgency: 'high',
      effectiveDate: '1988-11-15',
      sourceUrl: 'https://www.legislation.gov.uk/ukpga/1988/50',
      governmentSource: 'legislation.gov.uk',
      summary: "Defines the legal framework for most private tenancies, including grounds for possession and rent requirements.",
      keyPoints: [
        "ASTs are the default tenancy type for most private lettings",
        "Landlords must provide proper notice for possession claims",
        "Tenants have security of tenure during fixed term",
        "Section 21 and Section 8 notices govern eviction procedures"
      ],
      affectedParties: ['landlords', 'agents', 'tenants'],
      complianceDeadline: null,
      penalties: "Invalid notices, inability to recover possession, compensation claims",
      tags: ['tenancy', 'ast', 'possession', 'housing-act'],
      isBreaking: false
    },
    {
      title: "Tenant Fees Act 2019",
      description: "Legislation that bans most letting fees charged to tenants and caps tenancy deposits.",
      category: 'tenant_rights',
      status: 'active',
      urgency: 'critical',
      effectiveDate: '2019-06-01',
      sourceUrl: 'https://www.legislation.gov.uk/ukpga/2019/4',
      governmentSource: 'legislation.gov.uk',
      summary: "Prohibits most tenant fees and limits deposit amounts to protect tenants from excessive charges.",
      keyPoints: [
        "Deposits capped at maximum 5 weeks' rent (or 6 weeks if annual rent exceeds £50,000)",
        "Holding deposits limited to 1 week's rent",
        "Only permitted payments include rent, deposits, utilities, council tax, and default fees",
        "Penalties up to £5,000 for first breach, £30,000 for further breaches"
      ],
      affectedParties: ['landlords', 'agents', 'tenants'],
      complianceDeadline: null,
      penalties: "Financial penalties up to £30,000, criminal conviction possible",
      tags: ['fees', 'deposits', 'tenant-protection'],
      isBreaking: false
    },
    {
      title: "The Electrical Safety Standards in the Private Rented Sector (England) Regulations 2020",
      description: "Mandatory electrical safety inspections every 5 years for private rental properties in England.",
      category: 'electrical_safety',
      status: 'active',
      urgency: 'critical',
      effectiveDate: '2020-07-01',
      sourceUrl: 'https://www.legislation.gov.uk/uksi/2020/312',
      governmentSource: 'legislation.gov.uk',
      summary: "Requires landlords to ensure electrical installations are inspected every 5 years by qualified electricians.",
      keyPoints: [
        "Electrical installations must be inspected every 5 years",
        "EICR (Electrical Installation Condition Report) must be obtained",
        "Copy must be provided to tenants within 28 days",
        "Local authority must be notified if remedial work required"
      ],
      affectedParties: ['landlords', 'agents'],
      complianceDeadline: null,
      penalties: "Unlimited fine, up to 6 months imprisonment",
      tags: ['electrical', 'safety', 'eicr', 'inspection'],
      isBreaking: false
    },
    {
      title: "The Smoke and Carbon Monoxide Alarm (Amendment) Regulations 2022",
      description: "Updated requirements for smoke and carbon monoxide alarms in rental properties.",
      category: 'fire_safety',
      status: 'active',
      urgency: 'high',
      effectiveDate: '2022-10-01',
      sourceUrl: 'https://www.legislation.gov.uk/uksi/2022/547',
      governmentSource: 'legislation.gov.uk',
      summary: "Enhanced alarm requirements including carbon monoxide alarms in rooms with fixed combustion appliances.",
      keyPoints: [
        "Smoke alarms required on every storey",
        "Carbon monoxide alarms required in rooms with fixed combustion appliances",
        "Alarms must be tested before each new tenancy",
        "Landlord must ensure alarms are in working order at start of tenancy"
      ],
      affectedParties: ['landlords', 'agents'],
      complianceDeadline: null,
      penalties: "Fine up to £5,000",
      tags: ['smoke-alarms', 'carbon-monoxide', 'safety'],
      isBreaking: false
    }
  ];
}

function categorizeByTitle(title: string): 'tenancy_law' | 'safety_regulations' | 'tax_requirements' | 'landlord_obligations' | 'tenant_rights' | 'deposit_protection' | 'property_standards' | 'energy_efficiency' | 'fire_safety' | 'electrical_safety' | 'gas_safety' | 'planning_permission' | 'licensing_requirements' | 'eviction_procedures' | 'rent_controls' {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('electrical') || titleLower.includes('eicr')) return 'electrical_safety';
  if (titleLower.includes('fire') || titleLower.includes('smoke') || titleLower.includes('alarm')) return 'fire_safety';
  if (titleLower.includes('gas') || titleLower.includes('carbon monoxide')) return 'gas_safety';
  if (titleLower.includes('deposit') || titleLower.includes('tenancy deposit')) return 'deposit_protection';
  if (titleLower.includes('energy') || titleLower.includes('epc')) return 'energy_efficiency';
  if (titleLower.includes('eviction') || titleLower.includes('possession') || titleLower.includes('section 21')) return 'eviction_procedures';
  if (titleLower.includes('rent control') || titleLower.includes('rent cap')) return 'rent_controls';
  if (titleLower.includes('license') || titleLower.includes('licence')) return 'licensing_requirements';
  if (titleLower.includes('planning')) return 'planning_permission';
  if (titleLower.includes('tenant fee') || titleLower.includes('tenant right')) return 'tenant_rights';
  if (titleLower.includes('tax') || titleLower.includes('capital gains')) return 'tax_requirements';
  if (titleLower.includes('safety') || titleLower.includes('regulation')) return 'safety_regulations';
  if (titleLower.includes('standard') || titleLower.includes('quality')) return 'property_standards';
  if (titleLower.includes('landlord')) return 'landlord_obligations';
  
  return 'tenancy_law'; // Default
}

function assessUrgency(title: string, description: string): 'low' | 'medium' | 'high' | 'critical' {
  const content = (title + ' ' + description).toLowerCase();
  
  if (content.includes('immediate') || content.includes('urgent') || content.includes('penalty') || content.includes('fine')) {
    return 'critical';
  }
  if (content.includes('deadline') || content.includes('compliance') || content.includes('must')) {
    return 'high';
  }
  if (content.includes('should') || content.includes('recommend')) {
    return 'medium';
  }
  
  return 'low';
}

function truncateDescription(description: string): string {
  return description.length > 300 ? description.substring(0, 297) + '...' : description;
}

function extractKeyPoints(description: string): string[] {
  // Simple extraction of key points from description
  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 20);
  return sentences.slice(0, 4).map(s => s.trim());
}

function determineAffectedParties(title: string, description: string): string[] {
  const content = (title + ' ' + description).toLowerCase();
  const parties = [];
  
  if (content.includes('landlord')) parties.push('landlords');
  if (content.includes('agent') || content.includes('letting agent')) parties.push('agents');
  if (content.includes('tenant')) parties.push('tenants');
  if (content.includes('property manager')) parties.push('property_managers');
  
  return parties.length > 0 ? parties : ['landlords', 'agents'];
}

function generateTags(title: string, description: string): string[] {
  const content = (title + ' ' + description).toLowerCase();
  const tags = [];
  
  const tagKeywords = {
    'tenancy': ['tenancy', 'lease', 'rental'],
    'safety': ['safety', 'protection', 'security'],
    'compliance': ['compliance', 'regulation', 'requirement'],
    'deposit': ['deposit', 'bond'],
    'notice': ['notice', 'notification'],
    'inspection': ['inspection', 'check', 'survey'],
    'certificate': ['certificate', 'certification'],
    'electrical': ['electrical', 'eicr', 'wiring'],
    'gas': ['gas', 'boiler', 'heating'],
    'fire': ['fire', 'smoke', 'alarm']
  };
  
  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some(keyword => content.includes(keyword))) {
      tags.push(tag);
    }
  }
  
  return tags;
}

function isBreakingNews(title: string, dateString: string): boolean {
  const articleDate = new Date(dateString);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const isRecent = articleDate > thirtyDaysAgo;
  const hasUrgentKeywords = title.toLowerCase().includes('new') || 
                           title.toLowerCase().includes('change') || 
                           title.toLowerCase().includes('update');
  
  return isRecent && hasUrgentKeywords;
}

/**
 * Updates the local database with fresh legislation data
 */
export async function updateLegislationDatabase(): Promise<void> {
  try {
    const latestLegislation = await fetchLatestLegislation();
    
    for (const legislation of latestLegislation) {
      // Check if legislation already exists by title and source
      const existing = await storage.getLegislationByTitleAndSource(
        legislation.title, 
        legislation.governmentSource || ''
      );
      
      if (!existing) {
        await storage.createLegislation(legislation);
      } else {
        // Update if the existing one is older
        await storage.updateLegislation(existing.id, legislation);
      }
    }
    
    console.log(`Updated legislation database with ${latestLegislation.length} items`);
  } catch (error) {
    console.error('Error updating legislation database:', error);
  }
}

/**
 * Gets legislation relevant to a specific user type
 */
export async function getLegislationForUserType(userType: string): Promise<UkPropertyLegislation[]> {
  const allLegislation = await storage.getAllLegislation();
  
  return allLegislation.filter(item => {
    if (!item.affectedParties) return true;
    
    const affectedParties = Array.isArray(item.affectedParties) ? item.affectedParties : [];
    
    switch (userType.toLowerCase()) {
      case 'landlord':
        return affectedParties.includes('landlords');
      case 'agent':
        return affectedParties.includes('agents');
      case 'property_manager':
        return affectedParties.includes('property_managers');
      default:
        return true;
    }
  });
}

/**
 * Gets critical/urgent legislation items
 */
export async function getCriticalLegislation(): Promise<UkPropertyLegislation[]> {
  const allLegislation = await storage.getAllLegislation();
  
  return allLegislation.filter(item => 
    item.urgency === 'critical' || item.urgency === 'high'
  ).sort((a, b) => {
    const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
  });
}