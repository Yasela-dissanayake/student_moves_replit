import OpenAI from "openai";
import { db } from "../db";
import { 
  utilityProviders, 
  utilityTariffs, 
  propertyUtilityContracts, 
  utilityPriceComparisons,
  UtilityTariff,
  UtilityProvider,
  PropertyUtilityContract
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface UtilityComparisonParams {
  propertyId: number;
  utilityType: 'gas' | 'electricity' | 'dual_fuel' | 'water' | 'broadband' | 'tv_license';
  postcode: string;
  propertySize?: string;
  bedrooms?: number;
  occupants?: number;
  currentProvider?: string;
  currentTariff?: string;
  currentMonthlyPayment?: number;
  usageProfile?: 'low' | 'medium' | 'high';
}

interface ComparisonResult {
  providerId: number;
  tariffId: number;
  providerName: string;
  tariffName: string;
  annualCost: number;
  monthlyCost: number;
  termLength: number;
  fixedTerm: boolean;
  standingCharge: number;
  unitRate: number;
  specialOffers: string[];
  savings: number;
}

export async function findBestUtilityDeals(params: UtilityComparisonParams): Promise<ComparisonResult[]> {
  try {
    // First, fetch all active providers and tariffs for the specified utility type
    const providers = await db.select().from(utilityProviders)
      .where(and(
        eq(utilityProviders.utilityType, params.utilityType),
        eq(utilityProviders.active, true)
      ));

    if (providers.length === 0) {
      console.log(`No active providers found for ${params.utilityType}`);
      return [];
    }

    const providerIds = providers.map(p => p.id);
    
    // Get all tariffs from these providers
    const allTariffs = await db.select().from(utilityTariffs)
      .where(and(
        eq(utilityTariffs.utilityType, params.utilityType)
      ));

    // If we have tariff data in the database, use it for comparison
    if (allTariffs.length > 0) {
      return await performLocalComparison(params, providers, allTariffs);
    }
    
    // If we don't have tariff data, use OpenAI to retrieve and analyze current market rates
    return await performAIComparison(params, providers);
  } catch (error) {
    console.error("Error finding best utility deals:", error);
    throw error;
  }
}

async function performLocalComparison(
  params: UtilityComparisonParams, 
  providers: UtilityProvider[], 
  tariffs: UtilityTariff[]
): Promise<ComparisonResult[]> {
  // Filter tariffs by region if available
  const filteredTariffs = tariffs.filter(tariff => {
    // If region is specified, check if it matches the postcode area
    if (tariff.region) {
      const postcodeArea = params.postcode.split(' ')[0]; // Get the first part of the postcode
      if (!tariff.region.includes(postcodeArea)) return false;
    }
    
    // Check if tariff is still available
    const now = new Date();
    if (tariff.availableUntil && new Date(tariff.availableUntil) < now) return false;
    if (tariff.availableFrom && new Date(tariff.availableFrom) > now) return false;
    
    return true;
  });

  // Sort tariffs by estimated annual cost (cheapest first)
  const sortedTariffs = filteredTariffs.sort((a, b) => {
    if (!a.estimatedAnnualCost && !b.estimatedAnnualCost) return 0;
    if (!a.estimatedAnnualCost) return 1; // a should come after b
    if (!b.estimatedAnnualCost) return -1; // b should come after a
    return Number(a.estimatedAnnualCost) - Number(b.estimatedAnnualCost);
  });

  // Calculate savings compared to current payment (if provided)
  const currentAnnualCost = params.currentMonthlyPayment ? params.currentMonthlyPayment * 12 : null;

  // Map to ComparisonResult format
  return sortedTariffs.map(tariff => {
    const provider = providers.find(p => p.id === tariff.providerId);
    const monthlyCost = tariff.estimatedAnnualCost ? Number(tariff.estimatedAnnualCost) / 12 : 0;
    const savings = currentAnnualCost && tariff.estimatedAnnualCost 
      ? currentAnnualCost - Number(tariff.estimatedAnnualCost) 
      : 0;

    return {
      providerId: tariff.providerId,
      tariffId: tariff.id,
      providerName: provider?.name || "Unknown Provider",
      tariffName: tariff.name,
      annualCost: Number(tariff.estimatedAnnualCost || 0),
      monthlyCost,
      termLength: tariff.termLength || 0,
      fixedTerm: tariff.fixedTerm || false,
      standingCharge: Number(tariff.standingCharge || 0),
      unitRate: Number(tariff.unitRate || 0),
      specialOffers: tariff.specialOffers || [],
      savings
    };
  });
}

async function performAIComparison(
  params: UtilityComparisonParams, 
  providers: UtilityProvider[]
): Promise<ComparisonResult[]> {
  try {
    // Construct a prompt for the AI to get current market rates
    const prompt = `
      I need to find the best ${params.utilityType} deals available in the UK for a property with the following details:
      - Postcode: ${params.postcode}
      ${params.propertySize ? `- Property size: ${params.propertySize}` : ''}
      ${params.bedrooms ? `- Number of bedrooms: ${params.bedrooms}` : ''}
      ${params.occupants ? `- Number of occupants: ${params.occupants}` : ''}
      ${params.currentProvider ? `- Current provider: ${params.currentProvider}` : ''}
      ${params.currentTariff ? `- Current tariff: ${params.currentTariff}` : ''}
      ${params.currentMonthlyPayment ? `- Current monthly payment: £${params.currentMonthlyPayment}` : ''}
      ${params.usageProfile ? `- Usage profile: ${params.usageProfile}` : ''}
      
      Please provide the top 5 available deals from major UK providers in JSON format, with the following structure for each deal:
      {
        "providerName": string, // Name of the provider
        "tariffName": string, // Name of the tariff
        "annualCost": number, // Estimated annual cost in GBP
        "monthlyCost": number, // Estimated monthly cost in GBP
        "termLength": number, // Contract length in months
        "fixedTerm": boolean, // Whether the tariff has a fixed term
        "standingCharge": number, // Daily standing charge in pence
        "unitRate": number, // Unit rate in pence per kWh
        "specialOffers": string[], // Any special offers or incentives
        "savings": number // Estimated annual savings compared to current deal (if applicable)
      }
      
      Only include deals that are currently available for new customers. For savings, compare to the current monthly payment if provided.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a utility market expert that provides accurate, up-to-date information about utility providers and tariffs in the UK. You are helpful, knowledgeable, and precise." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);
    
    if (!aiResponse.deals || !Array.isArray(aiResponse.deals) || aiResponse.deals.length === 0) {
      console.log("AI did not return any deals or returned invalid format");
      return [];
    }

    // Map AI results to our database providers if possible, or create new entries
    const results: ComparisonResult[] = [];
    
    for (const deal of aiResponse.deals) {
      // Try to find the provider in our database
      let provider = providers.find(p => 
        p.name.toLowerCase() === deal.providerName.toLowerCase());
      
      let providerId = provider?.id;
      let tariffId = 0;
      
      // If we don't have this provider in our database, we'll use a placeholder ID
      // In a production system, you would want to add the provider to the database
      if (!providerId) {
        providerId = -1; // Placeholder for now
        
        // In a more complex implementation, you might want to:
        // 1. Create a new provider record in the database
        // 2. Create a new tariff record
        // 3. Use those real IDs in the result
      }
      
      results.push({
        providerId: providerId,
        tariffId: tariffId,
        providerName: deal.providerName,
        tariffName: deal.tariffName,
        annualCost: deal.annualCost,
        monthlyCost: deal.monthlyCost,
        termLength: deal.termLength,
        fixedTerm: deal.fixedTerm,
        standingCharge: deal.standingCharge,
        unitRate: deal.unitRate,
        specialOffers: deal.specialOffers || [],
        savings: deal.savings || 0
      });
    }
    
    // Save the AI comparison results to the database for future reference
    await saveComparisonResults(params.propertyId, params.utilityType, results);
    
    return results;
  } catch (error) {
    console.error("Error performing AI-based utility comparison:", error);
    throw error;
  }
}

async function saveComparisonResults(
  propertyId: number,
  utilityType: 'gas' | 'electricity' | 'dual_fuel' | 'water' | 'broadband' | 'tv_license',
  results: ComparisonResult[]
): Promise<void> {
  try {
    await db.insert(utilityPriceComparisons).values({
      propertyId,
      utilityType,
      results,
      aiProcessed: true,
    });
  } catch (error) {
    console.error("Error saving utility comparison results:", error);
    // Non-critical error, so we don't throw
  }
}

export async function initiateUtilitySetup(
  propertyId: number,
  tenancyId: number,
  utilityType: 'gas' | 'electricity' | 'dual_fuel' | 'water' | 'broadband' | 'tv_license',
  providerId: number,
  tariffId: number,
  bankingDetailsId: number
): Promise<PropertyUtilityContract> {
  try {
    // Get the selected provider and tariff
    const provider = await db.select().from(utilityProviders)
      .where(eq(utilityProviders.id, providerId))
      .then(res => res[0]);
      
    const tariff = await db.select().from(utilityTariffs)
      .where(eq(utilityTariffs.id, tariffId))
      .then(res => res[0]);
      
    if (!provider || !tariff) {
      throw new Error("Selected provider or tariff not found");
    }
    
    // Create a new utility contract
    const [contract] = await db.insert(propertyUtilityContracts).values({
      propertyId,
      tenancyId,
      utilityType,
      providerId,
      tariffId,
      status: "pending",
      monthlyPaymentAmount: tariff.estimatedAnnualCost ? Number(tariff.estimatedAnnualCost) / 12 : null,
      contractStartDate: new Date(),
      contractEndDate: tariff.termLength ? new Date(Date.now() + tariff.termLength * 30 * 24 * 60 * 60 * 1000) : null,
      bankingDetailsId,
      aiProcessed: true,
      bestDealAvailable: true,
    }).returning();
    
    return contract;
  } catch (error) {
    console.error("Error initiating utility setup:", error);
    throw error;
  }
}

export async function registerWithProvider(contractId: number): Promise<boolean> {
  try {
    // Get the contract details
    const contract = await db.select().from(propertyUtilityContracts)
      .where(eq(propertyUtilityContracts.id, contractId))
      .then(res => res[0]);
      
    if (!contract) {
      throw new Error("Utility contract not found");
    }
    
    // Get the provider
    const provider = await db.select().from(utilityProviders)
      .where(eq(utilityProviders.id, contract.providerId))
      .then(res => res[0]);
      
    if (!provider) {
      throw new Error("Provider not found");
    }
    
    // Check if the provider has API integration
    if (!provider.apiIntegration || !provider.apiEndpoint) {
      // If no API integration, mark as in progress, admin needs to handle manually
      await db.update(propertyUtilityContracts)
        .set({ status: "in_progress" })
        .where(eq(propertyUtilityContracts.id, contractId));
        
      return false;
    }
    
    // If API is available, we'd implement the actual provider API call here
    // For now, simulate a successful registration
    const registrationSuccess = Math.random() > 0.3; // 70% success rate
    
    if (registrationSuccess) {
      // Update the contract status
      await db.update(propertyUtilityContracts)
        .set({ 
          status: "active",
          accountNumber: `ACC-${Date.now().toString().slice(-8)}` // Simulate account number
        })
        .where(eq(propertyUtilityContracts.id, contractId));
        
      return true;
    } else {
      // Mark as blocked, needs manual intervention and document upload
      await db.update(propertyUtilityContracts)
        .set({ 
          status: "blocked",
          notes: "Automatic registration failed. Please upload tenancy agreement document and retry."
        })
        .where(eq(propertyUtilityContracts.id, contractId));
        
      return false;
    }
  } catch (error) {
    console.error("Error registering with provider:", error);
    throw error;
  }
}

export async function uploadTenancyAgreement(
  contractId: number, 
  documentId: number
): Promise<void> {
  try {
    await db.update(propertyUtilityContracts)
      .set({ 
        tenancyAgreementUploaded: true,
        tenancyAgreementDocumentId: documentId
      })
      .where(eq(propertyUtilityContracts.id, contractId));
  } catch (error) {
    console.error("Error uploading tenancy agreement:", error);
    throw error;
  }
}

// Scheduled task to check for better deals
export async function checkForBetterDeals(): Promise<void> {
  try {
    // Get all active utility contracts
    const contracts = await db.select().from(propertyUtilityContracts)
      .where(eq(propertyUtilityContracts.status, "active"));
      
    for (const contract of contracts) {
      // Skip contracts checked within the last 30 days
      if (contract.lastAiCheckDate && 
          new Date().getTime() - new Date(contract.lastAiCheckDate).getTime() < 30 * 24 * 60 * 60 * 1000) {
        continue;
      }
      
      // For each contract, run a comparison
      await checkContractForBetterDeal(contract);
    }
  } catch (error) {
    console.error("Error checking for better deals:", error);
  }
}

async function checkContractForBetterDeal(contract: PropertyUtilityContract): Promise<void> {
  try {
    // Get property details
    const property = await db.query.properties.findFirst({
      where: eq(db.schema.properties.id, contract.propertyId),
    });
    
    if (!property) return;
    
    // Set up comparison parameters
    const params: UtilityComparisonParams = {
      propertyId: contract.propertyId,
      utilityType: contract.utilityType as any,
      postcode: property.postcode,
      bedrooms: property.bedrooms,
    };
    
    // Get current provider and tariff
    const provider = await db.select().from(utilityProviders)
      .where(eq(utilityProviders.id, contract.providerId))
      .then(res => res[0]);
      
    const tariff = contract.tariffId ? await db.select().from(utilityTariffs)
      .where(eq(utilityTariffs.id, contract.tariffId))
      .then(res => res[0]) : null;
      
    if (provider) {
      params.currentProvider = provider.name;
    }
    
    if (tariff) {
      params.currentTariff = tariff.name;
    }
    
    if (contract.monthlyPaymentAmount) {
      params.currentMonthlyPayment = Number(contract.monthlyPaymentAmount);
    }
    
    // Run the comparison
    const results = await findBestUtilityDeals(params);
    
    // Check if there's a better deal
    if (results.length > 0) {
      const bestDeal = results[0];
      const currentCost = contract.monthlyPaymentAmount ? Number(contract.monthlyPaymentAmount) * 12 : Infinity;
      
      // If savings are significant (>10%)
      if (bestDeal.annualCost < currentCost * 0.9) {
        // Mark contract as not being the best deal
        await db.update(propertyUtilityContracts)
          .set({ 
            bestDealAvailable: false,
            lastAiCheckDate: new Date()
          })
          .where(eq(propertyUtilityContracts.id, contract.id));
          
        // Save the comparison results
        await saveComparisonResults(contract.propertyId, contract.utilityType as any, results);
      } else {
        // Still the best deal
        await db.update(propertyUtilityContracts)
          .set({ 
            bestDealAvailable: true,
            lastAiCheckDate: new Date()
          })
          .where(eq(propertyUtilityContracts.id, contract.id));
      }
    }
  } catch (error) {
    console.error("Error checking contract for better deal:", error);
    
    // Update the last check date even if there was an error
    await db.update(propertyUtilityContracts)
      .set({ lastAiCheckDate: new Date() })
      .where(eq(propertyUtilityContracts.id, contract.id));
  }
}