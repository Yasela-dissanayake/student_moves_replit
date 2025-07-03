/**
 * Automated Utility Registration Service
 * Handles automatic sign-up for utility tariffs with minimal user input
 * Uses AI to monitor registration progress and handle issues
 */

import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../shared/schema';
import { sendEmail } from '../utils';
import { storage } from '../storage';

// Registration status types
export type RegistrationStatus = 
  | 'pending'
  | 'in_progress'
  | 'verification_required'
  | 'completed'
  | 'failed';

// Registration process interface
export interface RegistrationProcess {
  id: number;
  contractId: number;
  tenantId: number;
  status: RegistrationStatus;
  startTime: Date;
  lastUpdated: Date;
  completionTime?: Date;
  notes?: string;
  verificationDocumentUrl?: string;
  failureReason?: string;
  aiAnalysis?: string;
  nextAttemptDate?: Date;
  attemptCount: number;
}

// Tenant sign-up data needed for utility registration
export interface TenantSignupData {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  sortCode?: string;
  previousAddress?: string;
  previousPostcode?: string;
  tenancyDuration?: number; // in months
}

// Interface for monitoring sign-up progress
export interface SignupProgressUpdate {
  contractId: number;
  status: RegistrationStatus;
  statusMessage: string;
  estimatedCompletionDate?: Date;
  actionRequired?: boolean;
  actionMessage?: string;
}

/**
 * Start automatic registration for utility contract with the cheapest tariff
 */
export async function startAutomatedRegistration(
  propertyId: number,
  tenancyId: number,
  utilityType: 'gas' | 'electricity' | 'dual_fuel' | 'water' | 'broadband' | 'tv_license',
  tenantSignupData: TenantSignupData,
  bankingDetailsId?: number
): Promise<{ success: boolean, message: string, contractId?: number }> {
  try {
    // Get property details to check if it's all-inclusive
    const property = await db.query.properties.findFirst({
      where: eq(schema.properties.id, propertyId)
    });
    
    if (!property) {
      return { 
        success: false, 
        message: "Property not found." 
      };
    }
    
    // Check if this is an all-inclusive property
    const isAllInclusive = property.billsIncluded === true;
    
    // For all-inclusive properties, we still register utilities but mark that it's included in rent
    // This allows landlords to manage the utilities efficiently behind the scenes
    
    // 1. Find the cheapest tariff for the utility type
    const cheapestTariff = await findCheapestTariff(utilityType);
    
    if (!cheapestTariff) {
      return { 
        success: false, 
        message: "No available tariffs found for this utility type." 
      };
    }
    
    // 2. Get provider information
    const provider = await db.query.utilityProviders.findFirst({
      where: eq(schema.utilityProviders.id, cheapestTariff.providerId)
    });
    
    if (!provider) {
      return { 
        success: false, 
        message: "Provider information not found." 
      };
    }
    
    // 3. Get banking details if provided or use default
    let bankingDetails;
    if (bankingDetailsId) {
      bankingDetails = await db.query.adminBankingDetails.findFirst({
        where: eq(schema.adminBankingDetails.id, bankingDetailsId)
      });
    } else {
      // Get default banking details
      bankingDetails = await db.query.adminBankingDetails.findFirst({
        where: eq(schema.adminBankingDetails.isDefault, true)
      });
    }
    
    if (!bankingDetails) {
      return { 
        success: false, 
        message: "Banking details not found. Please set up banking details first." 
      };
    }
    
    // 4. Create utility contract with appropriate flags based on property type
    const [newContract] = await db.insert(schema.propertyUtilityContracts).values({
      propertyId,
      tenancyId,
      utilityType,
      providerId: provider.id,
      providerName: provider.name,
      tariffId: cheapestTariff.id,
      tariffName: cheapestTariff.name,
      bankingDetailsId: bankingDetails.id,
      status: 'pending',
      autoRenewal: true,
      tenancyAgreementUploaded: false,
      aiProcessed: true,
      monthlyPaymentAmount: isAllInclusive ? 0 : Number(cheapestTariff.estimatedAnnualCost) / 12, // Zero for all-inclusive
      bestDealAvailable: true,
      paymentMethod: isAllInclusive ? 'Included in Rent' : 'Direct Debit',
      depositPaid: isAllInclusive, // No deposit needed for all-inclusive
      notes: isAllInclusive ? 'All-inclusive tenancy - utility costs covered by landlord' : '',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    if (!newContract) {
      return { 
        success: false, 
        message: "Failed to create utility contract." 
      };
    }
    
    // 5. Start the registration process tracking
    await startRegistrationProcess(newContract.id, tenantSignupData);
    
    // 6. Return success response with appropriate message
    return { 
      success: true, 
      message: isAllInclusive 
        ? "Automated registration started successfully for all-inclusive property. The system will handle utility setup for the landlord."
        : "Automated registration started successfully. The system will monitor the signup process.",
      contractId: newContract.id
    };
  } catch (error) {
    console.error("Error in startAutomatedRegistration:", error);
    return { 
      success: false, 
      message: "An error occurred while setting up automated registration." 
    };
  }
}

/**
 * Find the cheapest tariff for a specific utility type
 */
async function findCheapestTariff(utilityType: string) {
  // Get all tariffs for the utility type, sorted by estimated annual cost
  const tariffs = await db.query.utilityTariffs.findMany({
    where: eq(schema.utilityTariffs.utilityType, utilityType as any),
    orderBy: (tariffs, { asc }) => [asc(tariffs.estimatedAnnualCost)]
  });
  
  // Filter for tariffs with API integration for automated signup
  const eligibleTariffPromises = tariffs.map(async (tariff) => {
    const provider = await db.query.utilityProviders.findFirst({
      where: eq(schema.utilityProviders.id, tariff.providerId)
    });
    
    return provider?.apiIntegration === true ? tariff : null;
  });
  
  // Resolve all promises and filter out null values
  const eligibleTariffs = (await Promise.all(eligibleTariffPromises)).filter(Boolean);
  
  // Return the cheapest eligible tariff
  return eligibleTariffs.length > 0 ? eligibleTariffs[0] : null;
}

/**
 * Start the registration process tracking
 */
async function startRegistrationProcess(
  contractId: number,
  tenantSignupData: TenantSignupData
) {
  try {
    // 1. Get contract information
    const contract = await db.query.propertyUtilityContracts.findFirst({
      where: eq(schema.propertyUtilityContracts.id, contractId)
    });
    
    if (!contract) {
      throw new Error("Contract not found");
    }
    
    // 2. Get associated tenancy
    const tenancy = await db.query.tenancies.findFirst({
      where: eq(schema.tenancies.id, contract.tenancyId!)
    });
    
    if (!tenancy) {
      throw new Error("Tenancy not found");
    }
    
    // 3. Get tenant ID (using the first tenant associated with the tenancy)
    const tenantApplication = await db.query.applications.findFirst({
      where: and(
        eq(schema.applications.propertyId, contract.propertyId),
        eq(schema.applications.status, 'approved')
      )
    });
    
    if (!tenantApplication) {
      throw new Error("No approved tenant application found");
    }
    
    const tenant = await db.query.users.findFirst({
      where: eq(schema.users.id, tenantApplication.tenantId)
    });
    
    if (!tenant) {
      throw new Error("Tenant information not found");
    }
    
    // 4. Store signup data temporarily - using localStorage
    const tempData = {
      tenantSignupData,
      contractId,
      tenantId: tenant.id,
      propertyId: contract.propertyId,
      providerId: contract.providerId,
      utilityType: contract.utilityType
    };
    
    // Since we don't have a direct storeTemporaryData method,
    // we'll use an alternative approach for storage - create a temp property record
    await storage.createProperty({
      title: `TEMP_UTILITY_SIGNUP_${contractId}`,
      description: JSON.stringify(tempData),
      address: "temp_storage",
      city: "temp",
      postcode: "temp",
      price: "0",
      propertyType: "other",
      bedrooms: 0,
      bathrooms: 0,
      ownerId: tenant.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // 5. Initiate API call to provider (mock for now)
    await initiateProviderSignup(contractId, tenant.id, tenantSignupData);
    
    // 6. Schedule first monitoring check
    setTimeout(() => {
      monitorRegistrationStatus(contractId);
    }, 60000); // Check in 1 minute
    
    return true;
  } catch (error) {
    console.error("Error in startRegistrationProcess:", error);
    return false;
  }
}

/**
 * Initiate the signup with the provider's API
 */
async function initiateProviderSignup(
  contractId: number,
  tenantId: number,
  signupData: TenantSignupData
) {
  // Get contract to determine provider
  const contract = await db.query.propertyUtilityContracts.findFirst({
    where: eq(schema.propertyUtilityContracts.id, contractId)
  });
  
  if (!contract) {
    throw new Error("Contract not found");
  }
  
  const provider = await db.query.utilityProviders.findFirst({
    where: eq(schema.utilityProviders.id, contract.providerId)
  });
  
  if (!provider) {
    throw new Error("Provider not found");
  }
  
  // Get property details
  const property = await db.query.properties.findFirst({
    where: eq(schema.properties.id, contract.propertyId)
  });
  
  if (!property) {
    throw new Error("Property not found");
  }
  
  // Update contract status
  await db.update(schema.propertyUtilityContracts)
    .set({ 
      status: 'in_progress',
      updatedAt: new Date()
    })
    .where(eq(schema.propertyUtilityContracts.id, contractId));
  
  // Create registration process record
  // TODO: Create registration_processes table in schema.ts
  
  // For demonstration, we'll simulate an API call to the provider
  console.log(`[Automated Registration] Initiated signup for contract ${contractId} with provider ${provider.name}`);
  console.log(`[Automated Registration] Tenant: ${signupData.fullName}, Email: ${signupData.email}`);
  console.log(`[Automated Registration] Property: ${property.address}, ${property.city}, ${property.postcode}`);
  
  // Return mock response
  return {
    success: true,
    referenceNumber: `REF-${Date.now()}-${contractId}`,
    estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    status: 'in_progress'
  };
}

/**
 * Monitor registration status and handle issues
 */
export async function monitorRegistrationStatus(contractId: number): Promise<SignupProgressUpdate> {
  // Get contract details
  const contract = await db.query.propertyUtilityContracts.findFirst({
    where: eq(schema.propertyUtilityContracts.id, contractId)
  });
  
  if (!contract) {
    return {
      contractId,
      status: 'failed',
      statusMessage: "Contract not found",
      actionRequired: true,
      actionMessage: "Please contact support as the contract information is missing."
    };
  }
  
  // For demonstration, we'll simulate different statuses based on time
  // In production, this would make API calls to the provider to check status
  const createdAt = contract.createdAt || new Date();
  const minutesSinceCreation = (Date.now() - createdAt.getTime()) / (60 * 1000);
  
  // Mock different scenarios
  let status: RegistrationStatus;
  let statusMessage: string;
  let actionRequired = false;
  let actionMessage: string | undefined;
  
  if (minutesSinceCreation < 5) {
    status = 'in_progress';
    statusMessage = "Application submitted to provider. Initial processing in progress.";
  } else if (minutesSinceCreation < 10) {
    status = 'in_progress';
    statusMessage = "Identity verification in progress with provider.";
  } else if (minutesSinceCreation < 15) {
    // Simulate a verification required scenario
    status = 'verification_required';
    statusMessage = "Additional verification required by provider.";
    actionRequired = true;
    actionMessage = "Please upload a copy of the tenancy agreement to proceed.";
    
    // Update contract status
    await db.update(schema.propertyUtilityContracts)
      .set({ 
        status: 'blocked',
        updatedAt: new Date()
      })
      .where(eq(schema.propertyUtilityContracts.id, contractId));
      
  } else if (minutesSinceCreation < 20) {
    status = 'in_progress';
    statusMessage = "Verification documents received. Processing final approval.";
  } else {
    status = 'completed';
    statusMessage = "Registration complete. Service will be active starting next billing cycle.";
    
    // Update contract status
    await db.update(schema.propertyUtilityContracts)
      .set({ 
        status: 'active',
        updatedAt: new Date()
      })
      .where(eq(schema.propertyUtilityContracts.id, contractId));
      
    // Send confirmation email
    await sendCompletionEmail(contractId);
  }
  
  // Schedule next check if not completed
  if (status !== 'completed') {
    setTimeout(() => {
      monitorRegistrationStatus(contractId);
    }, 60000); // Check again in 1 minute
  }
  
  // Return progress update
  return {
    contractId,
    status,
    statusMessage,
    estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    actionRequired,
    actionMessage
  };
}

/**
 * Get current registration status
 */
export async function getRegistrationStatus(contractId: number): Promise<SignupProgressUpdate> {
  // Get contract details
  const contract = await db.query.propertyUtilityContracts.findFirst({
    where: eq(schema.propertyUtilityContracts.id, contractId)
  });
  
  if (!contract) {
    return {
      contractId,
      status: 'failed',
      statusMessage: "Contract not found",
      actionRequired: true,
      actionMessage: "Please contact support as the contract information is missing."
    };
  }
  
  // Map contract status to registration status
  let registrationStatus: RegistrationStatus;
  let statusMessage: string;
  let actionRequired = false;
  let actionMessage: string | undefined;
  
  switch (contract.status) {
    case 'pending':
      registrationStatus = 'pending';
      statusMessage = "Registration pending. Waiting to initiate with provider.";
      break;
    case 'in_progress':
      registrationStatus = 'in_progress';
      statusMessage = "Registration in progress with utility provider.";
      break;
    case 'blocked':
      registrationStatus = 'verification_required';
      statusMessage = "Registration blocked. Verification document required.";
      actionRequired = true;
      actionMessage = "Please upload a copy of the tenancy agreement to proceed.";
      break;
    case 'active':
      registrationStatus = 'completed';
      statusMessage = "Registration complete. Service is active.";
      break;
    case 'cancelled':
    case 'expired':
      registrationStatus = 'failed';
      statusMessage = `Registration ${contract.status}. Please contact support.`;
      actionRequired = true;
      actionMessage = "Please contact support to restart the registration process.";
      break;
    default:
      registrationStatus = 'pending';
      statusMessage = "Registration status unknown. Please contact support.";
      actionRequired = true;
      actionMessage = "Please contact support to check registration status.";
  }
  
  return {
    contractId,
    status: registrationStatus,
    statusMessage,
    actionRequired,
    actionMessage
  };
}

/**
 * Send completion email to tenant
 */
async function sendCompletionEmail(contractId: number) {
  try {
    // Get contract details
    const contract = await db.query.propertyUtilityContracts.findFirst({
      where: eq(schema.propertyUtilityContracts.id, contractId)
    });
    
    if (!contract || !contract.tenancyId) {
      throw new Error("Contract or tenancy information not found");
    }
    
    // Get tenancy details
    const tenancy = await db.query.tenancies.findFirst({
      where: eq(schema.tenancies.id, contract.tenancyId)
    });
    
    if (!tenancy) {
      throw new Error("Tenancy not found");
    }
    
    // Get property details
    const property = await db.query.properties.findFirst({
      where: eq(schema.properties.id, contract.propertyId)
    });
    
    if (!property) {
      throw new Error("Property not found");
    }
    
    // Get tenant applications for this tenancy
    const tenantApplication = await db.query.applications.findFirst({
      where: and(
        eq(schema.applications.propertyId, contract.propertyId),
        eq(schema.applications.status, 'approved')
      )
    });
    
    if (!tenantApplication) {
      throw new Error("No approved tenant application found");
    }
    
    // Get tenant information
    const tenant = await db.query.users.findFirst({
      where: eq(schema.users.id, tenantApplication.tenantId)
    });
    
    if (!tenant) {
      throw new Error("Tenant information not found");
    }
    
    // Get provider information
    const provider = await db.query.utilityProviders.findFirst({
      where: eq(schema.utilityProviders.id, contract.providerId)
    });
    
    // Get tariff information
    const tariff = contract.tariffId 
      ? await db.query.utilityTariffs.findFirst({
          where: eq(schema.utilityTariffs.id, contract.tariffId)
        })
      : null;
    
    // Check if property has bills included (all-inclusive)
    const isAllInclusive = property.billsIncluded === true;
    
    // Prepare email information
    const emailSubject = `Your ${contract.utilityType} utility setup is complete - ${property.address}`;
    
    // Create email body based on whether this is an all-inclusive property
    const emailBody = `
      <h1>Utility Registration Complete</h1>
      <p>Dear ${tenant.name},</p>
      
      <p>We're pleased to inform you that your ${contract.utilityType} utility service has been successfully registered with ${provider?.name || 'your selected provider'}.</p>
      
      <h2>Details:</h2>
      <ul>
        <li><strong>Property:</strong> ${property.address}, ${property.city}, ${property.postcode}</li>
        <li><strong>Utility Type:</strong> ${contract.utilityType}</li>
        <li><strong>Provider:</strong> ${provider?.name || 'Selected Provider'}</li>
        <li><strong>Tariff:</strong> ${tariff?.name || 'Standard tariff'}</li>
        ${isAllInclusive ? 
          `<li><strong>Payment:</strong> Included in your rent as per all-inclusive agreement</li>` : 
          `<li><strong>Monthly Payment:</strong> £${contract.monthlyPaymentAmount ? parseFloat(String(contract.monthlyPaymentAmount)).toFixed(2) : '0.00'}</li>`
        }
        <li><strong>Start Date:</strong> ${tenancy.startDate}</li>
      </ul>
      
      ${isAllInclusive ? 
        `<p>Your utility service is now active under your all-inclusive agreement. Remember that reasonable usage limits apply as outlined in your tenancy agreement.</p>` : 
        `<p>Your account is now active and ready to use. You do not need to take any further action regarding setup.</p>`
      }
      
      <p>If you have any questions or need assistance, please contact your property manager or reach out directly to ${provider?.name || 'the utility provider'} customer service at ${provider?.customerServicePhone || 'the number listed on their website'} or ${provider?.customerServiceEmail || 'support@provider.com'}.</p>
      
      <p>Thank you for using our automated utility setup service!</p>
      
      <p>Kind regards,<br>UniRent Property Management Team</p>
    `;
    
    // Send email
    await logEmailSending(tenant.email, emailSubject, emailBody);
    
    console.log(`[Automated Registration] Completion email sent to ${tenant.email} for contract ${contractId}`);
    return true;
  } catch (error) {
    console.error("Error sending completion email:", error);
    return false;
  }
}

/**
 * Upload tenancy agreement document for verification
 */
export async function uploadTenancyAgreement(
  contractId: number,
  documentBase64: string,
  fileName: string
): Promise<{ success: boolean, message: string }> {
  try {
    // Get contract details
    const contract = await db.query.propertyUtilityContracts.findFirst({
      where: eq(schema.propertyUtilityContracts.id, contractId)
    });
    
    if (!contract) {
      return { success: false, message: "Contract not found" };
    }
    
    // Update contract with tenancy agreement
    await db.update(schema.propertyUtilityContracts)
      .set({ 
        tenancyAgreementUploaded: true,
        status: 'in_progress', // Change status from blocked to in_progress
        updatedAt: new Date()
      })
      .where(eq(schema.propertyUtilityContracts.id, contractId));
    
    // Mock document storage (in production, would store in S3 or similar)
    console.log(`[Automated Registration] Tenancy agreement uploaded for contract ${contractId}: ${fileName}`);
    
    // Restart registration process
    setTimeout(() => {
      monitorRegistrationStatus(contractId);
    }, 5000); // Check soon
    
    return { 
      success: true, 
      message: "Tenancy agreement uploaded successfully. Registration process will resume." 
    };
  } catch (error) {
    console.error("Error uploading tenancy agreement:", error);
    return { 
      success: false, 
      message: "An error occurred while uploading the tenancy agreement." 
    };
  }
}

/**
 * Log email for debugging purposes - using the imported sendEmail function
 */
async function logEmailSending(email: string, subject: string, body: string) {
  console.log(`[Email Debug] To: ${email}, Subject: ${subject}`);
  console.log(`[Email Debug] Body: ${body}`);
  
  // Use the imported sendEmail function
  return sendEmail(email, subject, body);
}