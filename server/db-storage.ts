import { eq, and, lte, or, desc, asc, count, sql, isNull, isNotNull } from 'drizzle-orm';
import { db } from './db';
import { IStorage } from './storage';
import { 
  User, InsertUser, 
  Property, InsertProperty, 
  Application, InsertApplication, 
  Tenancy, InsertTenancy,
  Payment, InsertPayment, 
  Verification, InsertVerification,
  Document, InsertDocument,
  AiProvider, InsertAiProvider,
  MaintenanceRequest, InsertMaintenanceRequest,
  MaintenanceTemplate, InsertMaintenanceTemplate,
  Contractor, InsertContractor,
  CalendarEvent, InsertCalendarEvent,
  DepositSchemeCredentials, InsertDepositSchemeCredentials,
  SafetyCertificate, InsertSafetyCertificate,
  Landlord, InsertLandlord,
  PropertyInspection, InsertPropertyInspection,
  FraudAlert, InsertFraudAlert,
  UserActivity, InsertUserActivity,
  CityImage, InsertCityImage,
  PropertyUpdateNotification, InsertPropertyUpdateNotification,
  ViewingFeedback, InsertViewingFeedback,
  VirtualViewingSession, InsertVirtualViewingSession,
  ViewingRequest, InsertViewingRequest,
  JobListing, InsertJobListing,
  JobApplication, InsertJobApplication,
  JobInterview, InsertJobInterview,
  StudentProfile, InsertStudentProfile,
  VoucherCompany, InsertVoucherCompany,
  StudentVoucher, InsertStudentVoucher,
  VoucherRedemption, InsertVoucherRedemption,
  VoucherBooking, InsertVoucherBooking,
  SavedVoucher, InsertSavedVoucher,
  users, properties, applications, tenancies, payments, verifications,
  documents,
  aiProviders, maintenanceRequests, maintenanceTemplates, contractors,
  calendarEvents, depositSchemeCredentials, safetyCertificates,
  landlords, propertyInspections, fraudAlerts, userActivities,
  cityImages, propertyUpdateNotifications, viewingFeedback, 
  virtualViewingSessions, viewingRequests,
  jobListings, jobApplications, jobInterviews, studentProfiles,
  voucherCompanies, studentVouchers, voucherRedemptions, voucherBookings, savedVouchers
} from '../shared/schema';

import {
  ShortVideo, InsertShortVideo,
  shortVideos
} from '../shared/video-sharing-schema';

import {
  MarketplaceItem, InsertMarketplaceItem,
  MarketplaceMessage, InsertMarketplaceMessage,
  MarketplaceTransaction, InsertMarketplaceTransaction,
  MarketplaceOffer, InsertMarketplaceOffer,
  TransactionMessage, InsertTransactionMessage,
  SavedMarketplaceItem, InsertSavedMarketplaceItem,
  ReportedMarketplaceItem, InsertReportedMarketplaceItem,
  marketplaceItems, marketplaceMessages, marketplaceTransactions, 
  marketplaceOffers, marketplaceTransactionMessages,
  savedMarketplaceItems, reportedMarketplaceItems
} from '../shared/marketplace-schema';
import { log } from './vite';

/**
 * PostgreSQL implementation of the Storage interface
 */
export class DatabaseStorage implements IStorage {
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting user: ${error.message}`, 'db-storage');
      return undefined;
    }
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting user by ID: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email));
      return result[0];
    } catch (error) {
      log(`Error getting user by email: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await db.insert(users).values(user).returning();
      return result[0];
    } catch (error) {
      log(`Error creating user: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      const result = await db.update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating user: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  // Get all users for admin dashboard
  async getAllUsers(): Promise<User[]> {
    try {
      const result = await db.select().from(users).orderBy(desc(users.createdAt));
      return result;
    } catch (error) {
      log(`Error getting all users: ${error.message}`, 'db-storage');
      return [];
    }
  }

  // Count methods for admin dashboard
  async getUserCount(): Promise<number> {
    try {
      const result = await db.select({ count: count() }).from(users);
      return result[0].count;
    } catch (error) {
      log(`Error getting user count: ${error.message}`, 'db-storage');
      return 0;
    }
  }

  async getPropertyCount(): Promise<number> {
    try {
      const result = await db.select({ count: count() }).from(properties);
      return result[0].count;
    } catch (error) {
      log(`Error getting property count: ${error.message}`, 'db-storage');
      return 0;
    }
  }

  async getApplicationCount(): Promise<number> {
    try {
      const result = await db.select({ count: count() }).from(applications);
      return result[0].count;
    } catch (error) {
      log(`Error getting application count: ${error.message}`, 'db-storage');
      return 0;
    }
  }

  async getTenancyCount(): Promise<number> {
    try {
      const result = await db.select({ count: count() }).from(tenancies);
      return result[0].count;
    } catch (error) {
      log(`Error getting tenancy count: ${error.message}`, 'db-storage');
      return 0;
    }
  }

  async getAvailablePropertyCount(): Promise<number> {
    try {
      const result = await db.select({ count: count() }).from(properties).where(eq(properties.available, true));
      return result[0].count;
    } catch (error) {
      log(`Error getting available property count: ${error.message}`, 'db-storage');
      return 0;
    }
  }

  async getOccupiedPropertyCount(): Promise<number> {
    try {
      const result = await db.select({ count: count() }).from(properties).where(eq(properties.available, false));
      return result[0].count;
    } catch (error) {
      log(`Error getting occupied property count: ${error.message}`, 'db-storage');
      return 0;
    }
  }

  async getPendingApplicationCount(): Promise<number> {
    try {
      const result = await db.select({ count: count() }).from(applications).where(eq(applications.status, 'pending'));
      return result[0].count;
    } catch (error) {
      log(`Error getting pending application count: ${error.message}`, 'db-storage');
      return 0;
    }
  }

  async getActiveApplicationCount(): Promise<number> {
    try {
      const result = await db.select({ count: count() }).from(applications).where(sql`${applications.status} IN ('pending', 'reviewing', 'accepted')`);
      return result[0].count;
    } catch (error) {
      log(`Error getting active application count: ${error.message}`, 'db-storage');
      return 0;
    }
  }

  async getRecentProperties(limit: number = 5): Promise<Property[]> {
    try {
      return await db.select().from(properties).orderBy(desc(properties.createdAt)).limit(limit);
    } catch (error) {
      log(`Error getting recent properties: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getPendingVerifications(): Promise<Verification[]> {
    try {
      return await db.select().from(verifications).where(eq(verifications.status, 'pending'));
    } catch (error) {
      log(`Error getting pending verifications: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getRecentUserActivities(limit: number = 10, activityType?: string): Promise<UserActivity[]> {
    try {
      let query = db.select().from(userActivities).orderBy(desc(userActivities.createdAt));
      
      if (activityType) {
        query = query.where(eq(userActivities.activityType, activityType));
      }
      
      return await query.limit(limit);
    } catch (error) {
      log(`Error getting recent user activities: ${error.message}`, 'db-storage');
      return [];
    }
  }

  // Property methods
  async getAllProperties(): Promise<Property[]> {
    try {
      return await db.select().from(properties);
    } catch (error) {
      log(`Error getting all properties: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getProperty(id: number): Promise<Property | undefined> {
    try {
      const result = await db.select().from(properties).where(eq(properties.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting property: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getPropertiesByOwner(ownerId: number): Promise<Property[]> {
    try {
      return await db.select().from(properties).where(eq(properties.ownerId, ownerId));
    } catch (error) {
      log(`Error getting properties by owner: ${error.message}`, 'db-storage');
      return [];
    }
  }
  
  async getPropertiesByAgentId(agentId: number): Promise<Property[]> {
    try {
      if (!agentId || isNaN(agentId)) {
        log(`Invalid agent ID: ${agentId}`, 'db-storage');
        return [];
      }
      log(`Getting properties for agent ID: ${agentId}`, 'db-storage');
      // Use agent_id column name from the schema
      return await db.select().from(properties).where(eq(properties.agent_id, agentId));
    } catch (error) {
      log(`Error getting properties by agent: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getPropertiesByFilters(filters: {
    city?: string;
    area?: string;
    university?: string;
    propertyType?: string;
    maxPrice?: number;
    minPrice?: number;
    minBedrooms?: number;
    maxBedrooms?: number;
    bedrooms?: number;
    furnished?: boolean;
    billsIncluded?: boolean;
  }): Promise<Property[]> {
    try {
      console.log("Querying properties with filters:", filters);
      let query = db.select().from(properties);
      
      if (filters.city) {
        // Use ILIKE for case-insensitive matching
        query = query.where(sql`${properties.city} ILIKE ${`%${filters.city}%`}`);
      }
      
      if (filters.area) {
        query = query.where(sql`${properties.area} ILIKE ${`%${filters.area}%`}`);
      }
      
      if (filters.university) {
        query = query.where(sql`${properties.university} ILIKE ${`%${filters.university}%`}`);
      }
      
      if (filters.propertyType) {
        // Match property type with ILIKE using raw SQL to avoid column name issues
        query = query.where(sql`"property_type" ILIKE ${`%${filters.propertyType}%`}`);
      }
      
      if (filters.bedrooms) {
        query = query.where(eq(properties.bedrooms, filters.bedrooms));
      }
      
      if (filters.minBedrooms) {
        query = query.where(sql`${properties.bedrooms} >= ${filters.minBedrooms}`);
      }
      
      if (filters.maxBedrooms) {
        query = query.where(sql`${properties.bedrooms} <= ${filters.maxBedrooms}`);
      }
      
      if (filters.minPrice) {
        query = query.where(sql`${properties.price} >= ${filters.minPrice}`);
      }
      
      if (filters.maxPrice) {
        query = query.where(sql`${properties.price} <= ${filters.maxPrice}`);
      }
      
      if (filters.furnished !== undefined) {
        query = query.where(eq(properties.furnished, filters.furnished));
      }
      
      if (filters.billsIncluded !== undefined) {
        // Match bills included using raw SQL to avoid column name issues
        query = query.where(sql`("bills_included" = ${filters.billsIncluded} OR "billsIncluded" = ${filters.billsIncluded})`);
      }
      
      // Order by id (newest first) since createdAt might have naming issues
      query = query.orderBy(desc(properties.id));
      
      console.log("SQL Query:", query.toSQL());
      const results = await query;
      console.log(`Found ${results.length} properties`);
      return results;
    } catch (error) {
      console.error(`Error getting properties by filters:`, error);
      log(`Error getting properties by filters: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    try {
      const result = await db.insert(properties).values(property).returning();
      return result[0];
    } catch (error) {
      log(`Error creating property: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updateProperty(id: number, propertyData: Partial<Property>): Promise<Property | undefined> {
    try {
      const result = await db.update(properties)
        .set(propertyData)
        .where(eq(properties.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating property: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async deleteProperty(id: number): Promise<boolean> {
    try {
      const result = await db.delete(properties).where(eq(properties.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      log(`Error deleting property: ${error.message}`, 'db-storage');
      return false;
    }
  }

  // Application methods
  async getApplication(id: number): Promise<Application | undefined> {
    try {
      const result = await db.select().from(applications).where(eq(applications.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting application: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getApplicationsByTenant(tenantId: number): Promise<Application[]> {
    try {
      return await db.select().from(applications).where(eq(applications.tenantId, tenantId));
    } catch (error) {
      log(`Error getting applications by tenant: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getApplicationsByProperty(propertyId: number): Promise<Application[]> {
    try {
      return await db.select().from(applications).where(eq(applications.propertyId, propertyId));
    } catch (error) {
      log(`Error getting applications by property: ${error.message}`, 'db-storage');
      return [];
    }
  }
  
  async getApplicationsByPropertyIds(propertyIds: number[]): Promise<Application[]> {
    try {
      if (!propertyIds || propertyIds.length === 0) {
        return [];
      }
      // Use SQL "IN" operator to find applications for multiple properties
      return await db.select().from(applications)
        .where(sql`${applications.propertyId} IN (${sql.join(propertyIds)})`);
    } catch (error) {
      log(`Error getting applications by property IDs: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    try {
      const result = await db.insert(applications).values(application).returning();
      return result[0];
    } catch (error) {
      log(`Error creating application: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updateApplicationStatus(id: number, status: string): Promise<Application | undefined> {
    try {
      const result = await db.update(applications)
        .set({ status })
        .where(eq(applications.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating application status: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  // Tenancy methods
  async getTenancy(id: number): Promise<Tenancy | undefined> {
    try {
      const result = await db.select().from(tenancies).where(eq(tenancies.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting tenancy: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getAllTenancies(): Promise<Tenancy[]> {
    try {
      return await db.select().from(tenancies);
    } catch (error) {
      log(`Error getting all tenancies: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getTenanciesByTenant(tenantId: number): Promise<Tenancy[]> {
    try {
      return await db.select().from(tenancies).where(eq(tenancies.tenantId, tenantId));
    } catch (error) {
      log(`Error getting tenancies by tenant: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getTenanciesByProperty(propertyId: number): Promise<Tenancy[]> {
    try {
      return await db.select().from(tenancies).where(eq(tenancies.propertyId, propertyId));
    } catch (error) {
      log(`Error getting tenancies by property: ${error.message}`, 'db-storage');
      return [];
    }
  }
  
  async getTenanciesByPropertyIds(propertyIds: number[]): Promise<Tenancy[]> {
    try {
      if (!propertyIds || propertyIds.length === 0) {
        return [];
      }
      // Use SQL "IN" operator to find tenancies for multiple properties
      return await db.select().from(tenancies)
        .where(sql`${tenancies.propertyId} IN (${sql.join(propertyIds)})`);
    } catch (error) {
      log(`Error getting tenancies by property IDs: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async createTenancy(tenancy: InsertTenancy): Promise<Tenancy> {
    try {
      const result = await db.insert(tenancies).values(tenancy).returning();
      return result[0];
    } catch (error) {
      log(`Error creating tenancy: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updateTenancy(id: number, tenancyData: Partial<Tenancy>): Promise<Tenancy | undefined> {
    try {
      const result = await db.update(tenancies)
        .set(tenancyData)
        .where(eq(tenancies.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating tenancy: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  // Payment methods
  async getPayment(id: number): Promise<Payment | undefined> {
    try {
      const result = await db.select().from(payments).where(eq(payments.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting payment: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getPaymentsByTenancy(tenancyId: number): Promise<Payment[]> {
    try {
      return await db.select().from(payments).where(eq(payments.tenancyId, tenancyId));
    } catch (error) {
      log(`Error getting payments by tenancy: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getPaymentsByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Payment[]> {
    try {
      return await db.select().from(payments).where(eq(payments.stripeSubscriptionId, stripeSubscriptionId));
    } catch (error) {
      log(`Error getting payments by Stripe subscription ID: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    try {
      const result = await db.insert(payments).values(payment).returning();
      return result[0];
    } catch (error) {
      log(`Error creating payment: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updatePaymentStatus(id: number, status: string, paidDate?: Date): Promise<Payment | undefined> {
    try {
      const updateData: Partial<Payment> = { status };
      if (paidDate) {
        updateData.paidDate = paidDate;
      }
      
      const result = await db.update(payments)
        .set(updateData)
        .where(eq(payments.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating payment status: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  // Verification methods
  async getVerification(id: number): Promise<Verification | undefined> {
    try {
      const result = await db.select().from(verifications).where(eq(verifications.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting verification: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getVerificationByUser(userId: number): Promise<Verification | undefined> {
    try {
      const result = await db.select().from(verifications).where(eq(verifications.userId, userId));
      return result[0];
    } catch (error) {
      log(`Error getting verification by user: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async createVerification(verification: InsertVerification): Promise<Verification> {
    try {
      const result = await db.insert(verifications).values(verification).returning();
      return result[0];
    } catch (error) {
      log(`Error creating verification: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updateVerificationStatus(
    id: number,
    status: string,
    aiVerified: boolean,
    adminVerified?: boolean
  ): Promise<Verification | undefined> {
    try {
      const updateData: Partial<Verification> = { 
        status, 
        aiVerified 
      };
      
      if (adminVerified !== undefined) {
        updateData.adminVerified = adminVerified;
      }
      
      const result = await db.update(verifications)
        .set(updateData)
        .where(eq(verifications.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating verification status: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  // AI Provider methods
  async getAllAiProviders(): Promise<AiProvider[]> {
    try {
      return await db.select().from(aiProviders).orderBy(asc(aiProviders.priority));
    } catch (error) {
      log(`Error getting all AI providers: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getAiProvider(id: number): Promise<AiProvider | undefined> {
    try {
      const result = await db.select().from(aiProviders).where(eq(aiProviders.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting AI provider: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getAiProviderByName(name: string): Promise<AiProvider | undefined> {
    try {
      const result = await db.select().from(aiProviders).where(eq(aiProviders.name, name));
      return result[0];
    } catch (error) {
      log(`Error getting AI provider by name: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getActiveAiProviders(): Promise<AiProvider[]> {
    try {
      return await db.select()
        .from(aiProviders)
        .where(eq(aiProviders.active, true))
        .orderBy(asc(aiProviders.priority));
    } catch (error) {
      log(`Error getting active AI providers: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async createAiProvider(provider: InsertAiProvider): Promise<AiProvider> {
    try {
      const result = await db.insert(aiProviders).values(provider).returning();
      return result[0];
    } catch (error) {
      log(`Error creating AI provider: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updateAiProvider(id: number, provider: Partial<AiProvider>): Promise<AiProvider | undefined> {
    try {
      const result = await db.update(aiProviders)
        .set(provider)
        .where(eq(aiProviders.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating AI provider: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async updateAiProviderStatus(id: number, status: string, errorMessage?: string): Promise<AiProvider | undefined> {
    try {
      const updateData: Partial<AiProvider> = { 
        status,
        lastChecked: new Date()
      };
      
      if (errorMessage !== undefined) {
        updateData.errorMessage = errorMessage;
      }
      
      const result = await db.update(aiProviders)
        .set(updateData)
        .where(eq(aiProviders.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating AI provider status: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async deleteAiProvider(id: number): Promise<boolean> {
    try {
      const result = await db.delete(aiProviders).where(eq(aiProviders.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      log(`Error deleting AI provider: ${error.message}`, 'db-storage');
      return false;
    }
  }

  // ========== Fraud Alert Methods ==========
  
  async createFraudAlert(alert: InsertFraudAlert): Promise<FraudAlert> {
    try {
      const result = await db.insert(fraudAlerts).values(alert).returning();
      return result[0];
    } catch (error) {
      log(`Error creating fraud alert: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async getFraudAlert(id: number): Promise<FraudAlert | undefined> {
    try {
      const result = await db.select().from(fraudAlerts).where(eq(fraudAlerts.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting fraud alert: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getFraudAlerts(options?: {
    userId?: number;
    userType?: string;
    activityType?: string;
    severity?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<FraudAlert[]> {
    try {
      let query = db.select().from(fraudAlerts);
      
      if (options) {
        if (options.userId) {
          query = query.where(eq(fraudAlerts.userId, options.userId));
        }
        
        if (options.userType) {
          query = query.where(eq(fraudAlerts.userType, options.userType));
        }
        
        if (options.activityType) {
          query = query.where(eq(fraudAlerts.activityType, options.activityType as any));
        }
        
        if (options.severity) {
          query = query.where(eq(fraudAlerts.severity, options.severity as any));
        }
        
        if (options.status) {
          query = query.where(eq(fraudAlerts.status, options.status as any));
        }
        
        if (options.startDate) {
          query = query.where(sql`${fraudAlerts.timestamp} >= ${options.startDate}`);
        }
        
        if (options.endDate) {
          query = query.where(sql`${fraudAlerts.timestamp} <= ${options.endDate}`);
        }
        
        query = query.orderBy(desc(fraudAlerts.timestamp));
        
        if (options.limit) {
          query = query.limit(options.limit);
        }
        
        if (options.offset) {
          query = query.offset(options.offset);
        }
      }
      
      return await query;
    } catch (error) {
      log(`Error getting fraud alerts: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getRecentFraudAlerts(limit: number = 10): Promise<FraudAlert[]> {
    try {
      return await db.select()
        .from(fraudAlerts)
        .orderBy(desc(fraudAlerts.timestamp))
        .limit(limit);
    } catch (error) {
      log(`Error getting recent fraud alerts: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getFraudAlertsByUser(userId: number): Promise<FraudAlert[]> {
    try {
      return await db.select()
        .from(fraudAlerts)
        .where(eq(fraudAlerts.userId, userId))
        .orderBy(desc(fraudAlerts.timestamp));
    } catch (error) {
      log(`Error getting fraud alerts by user: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getFraudAlertsByActivityType(activityType: string): Promise<FraudAlert[]> {
    try {
      return await db.select()
        .from(fraudAlerts)
        .where(eq(fraudAlerts.activityType, activityType as any))
        .orderBy(desc(fraudAlerts.timestamp));
    } catch (error) {
      log(`Error getting fraud alerts by activity type: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getFraudAlertsBySeverity(severity: string): Promise<FraudAlert[]> {
    try {
      return await db.select()
        .from(fraudAlerts)
        .where(eq(fraudAlerts.severity, severity as any))
        .orderBy(desc(fraudAlerts.timestamp));
    } catch (error) {
      log(`Error getting fraud alerts by severity: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getFraudAlertsByStatus(status: string): Promise<FraudAlert[]> {
    try {
      return await db.select()
        .from(fraudAlerts)
        .where(eq(fraudAlerts.status, status as any))
        .orderBy(desc(fraudAlerts.timestamp));
    } catch (error) {
      log(`Error getting fraud alerts by status: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async updateFraudAlertStatus(
    id: number, 
    status: string, 
    reviewedBy?: number, 
    reviewNotes?: string
  ): Promise<FraudAlert | undefined> {
    try {
      const updateData: Partial<FraudAlert> = { 
        status: status as any 
      };
      
      if (reviewedBy !== undefined) {
        updateData.reviewedBy = reviewedBy;
      }
      
      if (reviewNotes !== undefined) {
        updateData.reviewNotes = reviewNotes;
      }
      
      // Set reviewedAt timestamp when status is being updated
      updateData.reviewedAt = new Date();
      
      const result = await db.update(fraudAlerts)
        .set(updateData)
        .where(eq(fraudAlerts.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating fraud alert status: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async deleteFraudAlert(id: number): Promise<boolean> {
    try {
      const result = await db.delete(fraudAlerts).where(eq(fraudAlerts.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      log(`Error deleting fraud alert: ${error.message}`, 'db-storage');
      return false;
    }
  }

  async getFraudStats(timeframe: 'day' | 'week' | 'month' | 'year'): Promise<any> {
    try {
      let startDate = new Date();
      
      switch (timeframe) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }
      
      // Get all fraud alerts within the timeframe
      const alerts = await db.select()
        .from(fraudAlerts)
        .where(sql`${fraudAlerts.timestamp} >= ${startDate}`)
        .orderBy(desc(fraudAlerts.timestamp));
      
      // Calculate stats
      const totalAlerts = alerts.length;
      const bySeverity = {
        low: alerts.filter(a => a.severity === 'low').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        high: alerts.filter(a => a.severity === 'high').length,
        critical: alerts.filter(a => a.severity === 'critical').length
      };
      
      const byStatus = {
        new: alerts.filter(a => a.status === 'new').length,
        reviewing: alerts.filter(a => a.status === 'reviewing').length,
        dismissed: alerts.filter(a => a.status === 'dismissed').length,
        confirmed: alerts.filter(a => a.status === 'confirmed').length
      };
      
      const byActivityType = {
        user_registration: alerts.filter(a => a.activityType === 'user_registration').length,
        property_application: alerts.filter(a => a.activityType === 'property_application').length,
        document_upload: alerts.filter(a => a.activityType === 'document_upload').length,
        payment_processing: alerts.filter(a => a.activityType === 'payment_processing').length,
        login_attempt: alerts.filter(a => a.activityType === 'login_attempt').length,
        profile_update: alerts.filter(a => a.activityType === 'profile_update').length
      };
      
      const byUserType = {
        tenant: alerts.filter(a => a.userType === 'tenant').length,
        landlord: alerts.filter(a => a.userType === 'landlord').length,
        agent: alerts.filter(a => a.userType === 'agent').length,
        admin: alerts.filter(a => a.userType === 'admin').length
      };
      
      // Calculate percentage of confirmed fraud
      const fraudRate = totalAlerts > 0 
        ? (byStatus.confirmed / totalAlerts) * 100 
        : 0;
      
      return {
        timeframe,
        totalAlerts,
        bySeverity,
        byStatus,
        byActivityType,
        byUserType,
        fraudRate: Math.round(fraudRate * 100) / 100, // Round to 2 decimal places
        period: {
          start: startDate,
          end: new Date()
        }
      };
    } catch (error) {
      log(`Error getting fraud stats: ${error.message}`, 'db-storage');
      return {};
    }
  }
  
  // ========== User Activity Tracking Methods ==========
  
  async getUserActivities(userId: number): Promise<any[]> {
    try {
      return await db.select()
        .from(userActivities)
        .where(eq(userActivities.userId, userId))
        .orderBy(desc(userActivities.timestamp));
    } catch (error) {
      log(`Error getting user activities: ${error.message}`, 'db-storage');
      return [];
    }
  }
  
  async getUserActivitiesByType(userId: number, activityType: string): Promise<any[]> {
    try {
      return await db.select()
        .from(userActivities)
        .where(and(
          eq(userActivities.userId, userId),
          eq(userActivities.activityType, activityType)
        ))
        .orderBy(desc(userActivities.timestamp));
    } catch (error) {
      log(`Error getting user activities by type: ${error.message}`, 'db-storage');
      return [];
    }
  }
  
  async logUserActivity(userId: number, activityType: string, activityData: Record<string, any>, ipAddress?: string, deviceInfo?: string): Promise<UserActivity> {
    try {
      const [activity] = await db.insert(userActivities).values({
        userId,
        activityType,
        activityData,
        timestamp: new Date(),
        ipAddress: ipAddress || null,
        deviceInfo: deviceInfo || null
      }).returning();
      
      return activity;
    } catch (error) {
      log(`Error logging user activity: ${error.message}`, 'db-storage');
      throw new Error(`Failed to log user activity: ${error.message}`);
    }
  }

  // Maintenance Request methods
  async getAllMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    try {
      return await db.select()
        .from(maintenanceRequests)
        .orderBy(desc(maintenanceRequests.reportedDate));
    } catch (error) {
      log(`Error getting all maintenance requests: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getMaintenanceRequest(id: number): Promise<MaintenanceRequest | undefined> {
    try {
      const result = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting maintenance request: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getMaintenanceRequestsByProperty(propertyId: number): Promise<MaintenanceRequest[]> {
    try {
      return await db.select()
        .from(maintenanceRequests)
        .where(eq(maintenanceRequests.propertyId, propertyId))
        .orderBy(desc(maintenanceRequests.reportedDate));
    } catch (error) {
      log(`Error getting maintenance requests by property: ${error.message}`, 'db-storage');
      return [];
    }
  }
  
  async getMaintenanceRequestsByPropertyIds(propertyIds: number[]): Promise<MaintenanceRequest[]> {
    try {
      if (!propertyIds || propertyIds.length === 0) {
        return [];
      }
      // Use SQL "IN" operator to find maintenance requests for multiple properties
      return await db.select()
        .from(maintenanceRequests)
        .where(sql`${maintenanceRequests.propertyId} IN (${sql.join(propertyIds)})`)
        .orderBy(desc(maintenanceRequests.reportedDate));
    } catch (error) {
      log(`Error getting maintenance requests by property IDs: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getMaintenanceRequestsByTenant(tenantId: number): Promise<MaintenanceRequest[]> {
    try {
      return await db.select()
        .from(maintenanceRequests)
        .where(eq(maintenanceRequests.tenantId, tenantId))
        .orderBy(desc(maintenanceRequests.reportedDate));
    } catch (error) {
      log(`Error getting maintenance requests by tenant: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getMaintenanceRequestsByContractor(contractorId: number): Promise<MaintenanceRequest[]> {
    try {
      return await db.select()
        .from(maintenanceRequests)
        .where(eq(maintenanceRequests.assignedContractorId, contractorId))
        .orderBy(desc(maintenanceRequests.reportedDate));
    } catch (error) {
      log(`Error getting maintenance requests by contractor: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async createMaintenanceRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest> {
    try {
      const result = await db.insert(maintenanceRequests).values(request).returning();
      return result[0];
    } catch (error) {
      log(`Error creating maintenance request: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updateMaintenanceRequest(id: number, request: Partial<MaintenanceRequest>): Promise<MaintenanceRequest | undefined> {
    try {
      const result = await db.update(maintenanceRequests)
        .set({
          ...request,
          updatedAt: new Date()
        })
        .where(eq(maintenanceRequests.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating maintenance request: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async deleteMaintenanceRequest(id: number): Promise<boolean> {
    try {
      const result = await db.delete(maintenanceRequests).where(eq(maintenanceRequests.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      log(`Error deleting maintenance request: ${error.message}`, 'db-storage');
      return false;
    }
  }

  // Maintenance Template methods
  async getAllMaintenanceTemplates(): Promise<MaintenanceTemplate[]> {
    try {
      return await db.select().from(maintenanceTemplates);
    } catch (error) {
      log(`Error getting all maintenance templates: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getMaintenanceTemplate(id: number): Promise<MaintenanceTemplate | undefined> {
    try {
      const result = await db.select().from(maintenanceTemplates).where(eq(maintenanceTemplates.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting maintenance template: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getMaintenanceTemplatesByCategory(category: string): Promise<MaintenanceTemplate[]> {
    try {
      return await db.select().from(maintenanceTemplates).where(eq(maintenanceTemplates.category, category));
    } catch (error) {
      log(`Error getting maintenance templates by category: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getMaintenanceTemplatesBySeason(season: string): Promise<MaintenanceTemplate[]> {
    try {
      return await db.select()
        .from(maintenanceTemplates)
        .where(sql`${maintenanceTemplates.seasons} @> ${JSON.stringify([season])}`);
    } catch (error) {
      log(`Error getting maintenance templates by season: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async createMaintenanceTemplate(template: InsertMaintenanceTemplate): Promise<MaintenanceTemplate> {
    try {
      const result = await db.insert(maintenanceTemplates).values(template).returning();
      return result[0];
    } catch (error) {
      log(`Error creating maintenance template: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updateMaintenanceTemplate(id: number, template: Partial<MaintenanceTemplate>): Promise<MaintenanceTemplate | undefined> {
    try {
      const result = await db.update(maintenanceTemplates)
        .set({
          ...template,
          updatedAt: new Date()
        })
        .where(eq(maintenanceTemplates.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating maintenance template: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async deleteMaintenanceTemplate(id: number): Promise<boolean> {
    try {
      const result = await db.delete(maintenanceTemplates).where(eq(maintenanceTemplates.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      log(`Error deleting maintenance template: ${error.message}`, 'db-storage');
      return false;
    }
  }

  // Contractor methods
  async getAllContractors(): Promise<Contractor[]> {
    try {
      return await db.select().from(contractors).where(eq(contractors.active, true));
    } catch (error) {
      log(`Error getting all contractors: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getContractor(id: number): Promise<Contractor | undefined> {
    try {
      const result = await db.select().from(contractors).where(eq(contractors.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting contractor: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getContractorsByService(service: string): Promise<Contractor[]> {
    try {
      return await db.select()
        .from(contractors)
        .where(and(
          eq(contractors.active, true),
          sql`${contractors.services} @> ${JSON.stringify([service])}`
        ));
    } catch (error) {
      log(`Error getting contractors by service: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getContractorsByArea(area: string): Promise<Contractor[]> {
    try {
      return await db.select()
        .from(contractors)
        .where(and(
          eq(contractors.active, true),
          sql`${contractors.serviceAreas} @> ${JSON.stringify([area])}`
        ));
    } catch (error) {
      log(`Error getting contractors by area: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async createContractor(contractor: InsertContractor): Promise<Contractor> {
    try {
      const result = await db.insert(contractors).values(contractor).returning();
      return result[0];
    } catch (error) {
      log(`Error creating contractor: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updateContractor(id: number, contractor: Partial<Contractor>): Promise<Contractor | undefined> {
    try {
      const result = await db.update(contractors)
        .set({
          ...contractor,
          updatedAt: new Date()
        })
        .where(eq(contractors.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating contractor: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async deleteContractor(id: number): Promise<boolean> {
    try {
      // Soft delete - just mark as inactive
      const result = await db.update(contractors)
        .set({ 
          active: false,
          updatedAt: new Date()
        })
        .where(eq(contractors.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      log(`Error deleting contractor: ${error.message}`, 'db-storage');
      return false;
    }
  }

  // Calendar Event methods
  async getAllCalendarEvents(): Promise<CalendarEvent[]> {
    try {
      return await db.select().from(calendarEvents).orderBy(asc(calendarEvents.startDate));
    } catch (error) {
      log(`Error getting all calendar events: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getCalendarEvent(id: number): Promise<CalendarEvent | undefined> {
    try {
      const result = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting calendar event: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getCalendarEventsByUser(userId: number): Promise<CalendarEvent[]> {
    try {
      return await db.select()
        .from(calendarEvents)
        .where(eq(calendarEvents.userId, userId))
        .orderBy(asc(calendarEvents.startDate));
    } catch (error) {
      log(`Error getting calendar events by user: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getCalendarEventsByDateRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      return await db.select()
        .from(calendarEvents)
        .where(and(
          lte(calendarEvents.startDate, endDate),
          lte(startDate, calendarEvents.endDate)
        ))
        .orderBy(asc(calendarEvents.startDate));
    } catch (error) {
      log(`Error getting calendar events by date range: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getCalendarEventsByEntity(entityType: string, entityId: number): Promise<CalendarEvent[]> {
    try {
      return await db.select()
        .from(calendarEvents)
        .where(and(
          eq(calendarEvents.entityType, entityType),
          eq(calendarEvents.entityId, entityId)
        ))
        .orderBy(asc(calendarEvents.startDate));
    } catch (error) {
      log(`Error getting calendar events by entity: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getCalendarEventsByType(type: string): Promise<CalendarEvent[]> {
    try {
      return await db.select()
        .from(calendarEvents)
        .where(eq(calendarEvents.eventType, type))
        .orderBy(asc(calendarEvents.startDate));
    } catch (error) {
      log(`Error getting calendar events by type: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    try {
      const result = await db.insert(calendarEvents).values(event).returning();
      return result[0];
    } catch (error) {
      log(`Error creating calendar event: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updateCalendarEvent(id: number, event: Partial<CalendarEvent>): Promise<CalendarEvent | undefined> {
    try {
      const result = await db.update(calendarEvents)
        .set({
          ...event,
          updatedAt: new Date()
        })
        .where(eq(calendarEvents.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating calendar event: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async deleteCalendarEvent(id: number): Promise<boolean> {
    try {
      const result = await db.delete(calendarEvents).where(eq(calendarEvents.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      log(`Error deleting calendar event: ${error.message}`, 'db-storage');
      return false;
    }
  }

  // Deposit Scheme Credentials methods
  async getDepositSchemeCredentials(id: number): Promise<DepositSchemeCredentials | undefined> {
    try {
      const result = await db.select().from(depositSchemeCredentials).where(eq(depositSchemeCredentials.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting deposit scheme credentials: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getDepositSchemeCredentialsByUser(userId: number): Promise<DepositSchemeCredentials[]> {
    try {
      return await db.select()
        .from(depositSchemeCredentials)
        .where(eq(depositSchemeCredentials.userId, userId));
    } catch (error) {
      log(`Error getting deposit scheme credentials by user: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getDepositSchemeCredentialsByScheme(userId: number, schemeName: string): Promise<DepositSchemeCredentials | undefined> {
    try {
      const result = await db.select()
        .from(depositSchemeCredentials)
        .where(and(
          eq(depositSchemeCredentials.userId, userId),
          eq(depositSchemeCredentials.schemeName, schemeName)
        ));
      return result[0];
    } catch (error) {
      log(`Error getting deposit scheme credentials by scheme: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getDefaultDepositSchemeCredentials(userId: number): Promise<DepositSchemeCredentials | undefined> {
    try {
      const result = await db.select()
        .from(depositSchemeCredentials)
        .where(and(
          eq(depositSchemeCredentials.userId, userId),
          eq(depositSchemeCredentials.isDefault, true)
        ));
      return result[0];
    } catch (error) {
      log(`Error getting default deposit scheme credentials: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async createDepositSchemeCredentials(credentials: InsertDepositSchemeCredentials): Promise<DepositSchemeCredentials> {
    try {
      // If this is set as default, clear other defaults for this user
      if (credentials.isDefault) {
        await db.update(depositSchemeCredentials)
          .set({ isDefault: false })
          .where(eq(depositSchemeCredentials.userId, credentials.userId));
      }
      
      const result = await db.insert(depositSchemeCredentials).values({
        ...credentials,
        updatedAt: new Date()
      }).returning();
      return result[0];
    } catch (error) {
      log(`Error creating deposit scheme credentials: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updateDepositSchemeCredentials(id: number, credentials: Partial<DepositSchemeCredentials>): Promise<DepositSchemeCredentials | undefined> {
    try {
      // Get the existing credentials to get the userId
      const existing = await this.getDepositSchemeCredentials(id);
      if (!existing) {
        return undefined;
      }
      
      // If this is being set as default, clear other defaults for this user
      if (credentials.isDefault) {
        await db.update(depositSchemeCredentials)
          .set({ isDefault: false })
          .where(eq(depositSchemeCredentials.userId, existing.userId));
      }
      
      const result = await db.update(depositSchemeCredentials)
        .set({
          ...credentials,
          updatedAt: new Date()
        })
        .where(eq(depositSchemeCredentials.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating deposit scheme credentials: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async setDefaultDepositSchemeCredentials(id: number, userId: number): Promise<boolean> {
    try {
      // First, clear all defaults for this user
      await db.update(depositSchemeCredentials)
        .set({ isDefault: false })
        .where(eq(depositSchemeCredentials.userId, userId));
      
      // Then set the new default
      const result = await db.update(depositSchemeCredentials)
        .set({ 
          isDefault: true,
          updatedAt: new Date()
        })
        .where(eq(depositSchemeCredentials.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      log(`Error setting default deposit scheme credentials: ${error.message}`, 'db-storage');
      return false;
    }
  }

  async deleteDepositSchemeCredentials(id: number): Promise<boolean> {
    try {
      const result = await db.delete(depositSchemeCredentials).where(eq(depositSchemeCredentials.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      log(`Error deleting deposit scheme credentials: ${error.message}`, 'db-storage');
      return false;
    }
  }

  // City Images methods
  async getAllCityImages(): Promise<CityImage[]> {
    try {
      return await db.select().from(cityImages);
    } catch (error) {
      log(`Error getting all city images: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getCityImage(id: number): Promise<CityImage | undefined> {
    try {
      const result = await db.select().from(cityImages).where(eq(cityImages.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting city image: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getCityImageByCity(city: string): Promise<CityImage | undefined> {
    try {
      const result = await db.select().from(cityImages).where(eq(cityImages.city, city));
      return result[0];
    } catch (error) {
      log(`Error getting city image by city: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async createCityImage(cityImage: InsertCityImage): Promise<CityImage> {
    try {
      const result = await db.insert(cityImages).values(cityImage).returning();
      return result[0];
    } catch (error) {
      log(`Error creating city image: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updateCityImage(id: number, cityImage: Partial<CityImage>): Promise<CityImage | undefined> {
    try {
      const result = await db.update(cityImages)
        .set(cityImage)
        .where(eq(cityImages.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating city image: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async deleteCityImage(id: number): Promise<boolean> {
    try {
      const result = await db.delete(cityImages)
        .where(eq(cityImages.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      log(`Error deleting city image: ${error.message}`, 'db-storage');
      return false;
    }
  }

  // Job methods
  async getAllJobs(): Promise<Job[]> {
    try {
      return await db.select().from(jobs).orderBy(desc(jobs.id));
    } catch (error) {
      log(`Error getting all jobs: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getJobs(filters?: Record<string, any>): Promise<Job[]> {
    try {
      let query = db.select().from(jobs);
      
      if (filters) {
        if (filters.status) {
          query = query.where(eq(jobs.status, filters.status));
        }
        
        if (filters.category) {
          query = query.where(eq(jobs.category, filters.category));
        }
        
        if (filters.type) {
          query = query.where(eq(jobs.type, filters.type));
        }
        
        // Basic location search (text-based)
        if (filters.location) {
          query = query.where(sql`${jobs.location} ILIKE ${`%${filters.location}%`}`);
        }
        
        // Work arrangement filtering (on-site, remote, hybrid)
        if (filters.workArrangement) {
          query = query.where(eq(jobs.workArrangement, filters.workArrangement));
        }
        
        // Remote work options filtering
        if (filters.remoteOnly === true) {
          query = query.where(sql`${jobs.workArrangement} = 'remote'`);
        }
        
        if (filters.hybridOnly === true) {
          query = query.where(sql`${jobs.workArrangement} = 'hybrid'`);
        }
        
        // Location-based distance search
        if (filters.latitude && filters.longitude && filters.distanceInKm) {
          // Use the Haversine formula to calculate distance between coordinates
          query = query.where(
            sql`
              (
                6371 * acos(
                  cos(radians(${filters.latitude})) * 
                  cos(radians(${jobs.latitude})) * 
                  cos(radians(${jobs.longitude}) - radians(${filters.longitude})) + 
                  sin(radians(${filters.latitude})) * 
                  sin(radians(${jobs.latitude}))
                )
              ) <= ${filters.distanceInKm}
            `
          );
        }
        
        // Salary filtering (handles both number and JSON range format)
        if (filters.minSalary) {
          // For JSON salary format with min/max fields
          query = query.where(
            or(
              // For numeric salary
              sql`CAST(${jobs.salary} AS TEXT) >= ${filters.minSalary}`,
              // For JSON object with min field
              sql`CAST(json_extract_path_text(${jobs.salary}, 'min') AS NUMERIC) >= ${filters.minSalary}`
            )
          );
        }
        
        if (filters.maxSalary) {
          query = query.where(
            or(
              // For numeric salary
              sql`CAST(${jobs.salary} AS TEXT) <= ${filters.maxSalary}`,
              // For JSON object with max field
              sql`CAST(json_extract_path_text(${jobs.salary}, 'max') AS NUMERIC) <= ${filters.maxSalary}`
            )
          );
        }
        
        // Text search in title and description
        if (filters.search) {
          query = query.where(
            or(
              sql`${jobs.title} ILIKE ${`%${filters.search}%`}`,
              sql`${jobs.description} ILIKE ${`%${filters.search}%`}`
            )
          );
        }
        
        // Filter by employer ID
        if (filters.employerId) {
          query = query.where(eq(jobs.employerId, Number(filters.employerId)));
        }
      }
      
      return await query.orderBy(desc(jobs.id));
    } catch (error) {
      log(`Error getting filtered jobs: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getJob(id: number): Promise<Job | undefined> {
    try {
      const result = await db.select().from(jobs).where(eq(jobs.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting job: ${error.message}`, 'db-storage');
      return undefined;
    }
  }
  
  async getJobById(id: number): Promise<Job | undefined> {
    return this.getJob(id);
  }

  async getJobsByEmployer(employerId: number): Promise<Job[]> {
    try {
      return await db.select().from(jobs).where(eq(jobs.employerId, employerId));
    } catch (error) {
      log(`Error getting jobs by employer: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getJobsByStatus(status: string): Promise<Job[]> {
    try {
      return await db.select().from(jobs).where(eq(jobs.status, status));
    } catch (error) {
      log(`Error getting jobs by status: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getJobsByIndustry(industry: string): Promise<Job[]> {
    try {
      return await db.select().from(jobs).where(eq(jobs.industry, industry));
    } catch (error) {
      log(`Error getting jobs by industry: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getJobsByLocation(location: string): Promise<Job[]> {
    try {
      return await db.select().from(jobs).where(sql`${jobs.location} LIKE ${`%${location}%`}`);
    } catch (error) {
      log(`Error getting jobs by location: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getVerifiedJobs(): Promise<Job[]> {
    try {
      return await db.select().from(jobs).where(eq(jobs.aiVerified, true));
    } catch (error) {
      log(`Error getting verified jobs: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async createJob(job: InsertJob): Promise<Job> {
    try {
      const result = await db.insert(jobs).values(job).returning();
      return result[0];
    } catch (error) {
      log(`Error creating job: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updateJob(id: number, job: Partial<Job>): Promise<Job | undefined> {
    try {
      const result = await db.update(jobs)
        .set(job)
        .where(eq(jobs.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating job: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async updateJobStatus(id: number, status: string): Promise<Job | undefined> {
    try {
      const result = await db.update(jobs)
        .set({ status })
        .where(eq(jobs.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating job status: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async updateJobVerificationStatus(id: number, isVerified: boolean, score?: number, notes?: string): Promise<Job | undefined> {
    try {
      const updateData: Partial<Job> = { 
        aiVerified: isVerified 
      };
      
      if (score !== undefined) {
        updateData.aiVerificationScore = score;
      }
      
      if (notes !== undefined) {
        updateData.aiVerificationNotes = notes;
      }
      
      const result = await db.update(jobs)
        .set(updateData)
        .where(eq(jobs.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating job verification status: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async incrementJobViewCount(id: number): Promise<Job | undefined> {
    try {
      // First get current view count
      const job = await this.getJob(id);
      if (!job) return undefined;
      
      const currentViews = job.viewCount || 0;
      
      const result = await db.update(jobs)
        .set({ viewCount: currentViews + 1 })
        .where(eq(jobs.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error incrementing job view count: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async deleteJob(id: number): Promise<boolean> {
    try {
      const result = await db.delete(jobs).where(eq(jobs.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      log(`Error deleting job: ${error.message}`, 'db-storage');
      return false;
    }
  }
  
  // Job Application methods
  async getAllJobApplications(): Promise<JobApplication[]> {
    try {
      return await db.select().from(jobApplications).orderBy(desc(jobApplications.id));
    } catch (error) {
      log(`Error getting all job applications: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getJobApplication(id: number): Promise<JobApplication | undefined> {
    try {
      const result = await db.select().from(jobApplications).where(eq(jobApplications.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting job application: ${error.message}`, 'db-storage');
      return undefined;
    }
  }
  
  async getJobApplicationById(id: number): Promise<JobApplication | undefined> {
    return this.getJobApplication(id);
  }

  async getJobApplicationsByJob(jobId: number): Promise<JobApplication[]> {
    try {
      return await db.select().from(jobApplications).where(eq(jobApplications.jobId, jobId));
    } catch (error) {
      log(`Error getting job applications by job: ${error.message}`, 'db-storage');
      return [];
    }
  }
  
  async getJobApplications(jobId: number): Promise<JobApplication[]> {
    return this.getJobApplicationsByJob(jobId);
  }

  async getJobApplicationsByStudent(studentId: number): Promise<JobApplication[]> {
    try {
      return await db.select().from(jobApplications).where(eq(jobApplications.studentId, studentId));
    } catch (error) {
      log(`Error getting job applications by student: ${error.message}`, 'db-storage');
      return [];
    }
  }
  
  async getStudentApplications(studentId: number): Promise<JobApplication[]> {
    return this.getJobApplicationsByStudent(studentId);
  }
  
  async getStudentJobApplication(studentId: number, jobId: number): Promise<JobApplication | undefined> {
    try {
      const result = await db.select().from(jobApplications)
        .where(and(
          eq(jobApplications.studentId, studentId),
          eq(jobApplications.jobId, jobId)
        ));
      return result[0];
    } catch (error) {
      log(`Error getting student job application: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getJobApplicationsByStatus(status: string): Promise<JobApplication[]> {
    try {
      return await db.select().from(jobApplications).where(eq(jobApplications.status, status));
    } catch (error) {
      log(`Error getting job applications by status: ${error.message}`, 'db-storage');
      return [];
    }
  }
  
  async getEmployerApplications(employerId: number): Promise<JobApplication[]> {
    try {
      // Join with jobs to filter by employerId
      const result = await db.select({
        application: jobApplications,
        job: jobs
      })
      .from(jobApplications)
      .innerJoin(jobs, eq(jobApplications.jobId, jobs.id))
      .where(eq(jobs.employerId, employerId));
      
      // Extract the application objects from the join result
      return result.map(r => r.application);
    } catch (error) {
      log(`Error getting employer applications: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    try {
      const result = await db.insert(jobApplications).values(application).returning();
      return result[0];
    } catch (error) {
      log(`Error creating job application: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updateJobApplication(id: number, application: Partial<JobApplication>): Promise<JobApplication | undefined> {
    try {
      const result = await db.update(jobApplications)
        .set(application)
        .where(eq(jobApplications.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating job application: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async updateJobApplicationStatus(id: number, status: string): Promise<JobApplication | undefined> {
    try {
      const result = await db.update(jobApplications)
        .set({ status })
        .where(eq(jobApplications.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating job application status: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async deleteJobApplication(id: number): Promise<boolean> {
    try {
      const result = await db.delete(jobApplications).where(eq(jobApplications.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      log(`Error deleting job application: ${error.message}`, 'db-storage');
      return false;
    }
  }
  
  // Job Interview methods
  async getAllJobInterviews(): Promise<JobInterview[]> {
    try {
      return await db.select().from(jobInterviews).orderBy(desc(jobInterviews.id));
    } catch (error) {
      log(`Error getting all job interviews: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getJobInterview(id: number): Promise<JobInterview | undefined> {
    try {
      const result = await db.select().from(jobInterviews).where(eq(jobInterviews.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting job interview: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getJobInterviewsByApplication(applicationId: number): Promise<JobInterview[]> {
    try {
      return await db.select().from(jobInterviews).where(eq(jobInterviews.applicationId, applicationId));
    } catch (error) {
      log(`Error getting job interviews by application: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getJobInterviewsByEmployer(employerId: number): Promise<JobInterview[]> {
    try {
      // This requires a complex join across jobInterviews -> jobApplications -> jobs
      const result = await db.select({
        interview: jobInterviews,
        application: jobApplications,
        job: jobs
      })
      .from(jobInterviews)
      .innerJoin(jobApplications, eq(jobInterviews.applicationId, jobApplications.id))
      .innerJoin(jobs, eq(jobApplications.jobId, jobs.id))
      .where(eq(jobs.employerId, employerId));
      
      // Extract the interview objects from the join result
      return result.map(r => r.interview);
    } catch (error) {
      log(`Error getting job interviews by employer: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getJobInterviewsByStudent(studentId: number): Promise<JobInterview[]> {
    try {
      // This requires a join from jobInterviews -> jobApplications
      const result = await db.select({
        interview: jobInterviews,
        application: jobApplications
      })
      .from(jobInterviews)
      .innerJoin(jobApplications, eq(jobInterviews.applicationId, jobApplications.id))
      .where(eq(jobApplications.studentId, studentId));
      
      // Extract the interview objects from the join result
      return result.map(r => r.interview);
    } catch (error) {
      log(`Error getting job interviews by student: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async createJobInterview(interview: InsertJobInterview): Promise<JobInterview> {
    try {
      const result = await db.insert(jobInterviews).values(interview).returning();
      return result[0];
    } catch (error) {
      log(`Error creating job interview: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updateJobInterview(id: number, interview: Partial<JobInterview>): Promise<JobInterview | undefined> {
    try {
      const result = await db.update(jobInterviews)
        .set(interview)
        .where(eq(jobInterviews.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating job interview: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async updateJobInterviewStatus(id: number, status: string): Promise<JobInterview | undefined> {
    try {
      const result = await db.update(jobInterviews)
        .set({ status })
        .where(eq(jobInterviews.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating job interview status: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async deleteJobInterview(id: number): Promise<boolean> {
    try {
      const result = await db.delete(jobInterviews).where(eq(jobInterviews.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      log(`Error deleting job interview: ${error.message}`, 'db-storage');
      return false;
    }
  }
  
  // Job Skills methods
  async getAllJobSkills(): Promise<JobSkill[]> {
    try {
      return await db.select().from(jobSkills).orderBy(asc(jobSkills.name));
    } catch (error) {
      log(`Error getting all job skills: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getJobSkill(id: number): Promise<JobSkill | undefined> {
    try {
      const result = await db.select().from(jobSkills).where(eq(jobSkills.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting job skill: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getJobSkillByName(name: string): Promise<JobSkill | undefined> {
    try {
      const result = await db.select().from(jobSkills).where(eq(jobSkills.name, name));
      return result[0];
    } catch (error) {
      log(`Error getting job skill by name: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getJobSkillsByCategory(category: string): Promise<JobSkill[]> {
    try {
      return await db.select().from(jobSkills).where(eq(jobSkills.category, category));
    } catch (error) {
      log(`Error getting job skills by category: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async createJobSkill(skill: InsertJobSkill): Promise<JobSkill> {
    try {
      const result = await db.insert(jobSkills).values(skill).returning();
      return result[0];
    } catch (error) {
      log(`Error creating job skill: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updateJobSkill(id: number, skill: Partial<JobSkill>): Promise<JobSkill | undefined> {
    try {
      const result = await db.update(jobSkills)
        .set(skill)
        .where(eq(jobSkills.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating job skill: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async incrementJobSkillPopularity(id: number): Promise<JobSkill | undefined> {
    try {
      const skill = await this.getJobSkill(id);
      if (!skill) return undefined;
      
      const currentPopularity = skill.popularity || 0;
      
      const result = await db.update(jobSkills)
        .set({ popularity: currentPopularity + 1 })
        .where(eq(jobSkills.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error incrementing job skill popularity: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async deleteJobSkill(id: number): Promise<boolean> {
    try {
      const result = await db.delete(jobSkills).where(eq(jobSkills.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      log(`Error deleting job skill: ${error.message}`, 'db-storage');
      return false;
    }
  }
  
  // Employer methods
  async getAllEmployers(): Promise<Employer[]> {
    try {
      return await db.select().from(employers).orderBy(asc(employers.name));
    } catch (error) {
      log(`Error getting all employers: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getEmployer(id: number): Promise<Employer | undefined> {
    try {
      const result = await db.select().from(employers).where(eq(employers.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting employer: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getEmployerByUserId(userId: number): Promise<Employer | undefined> {
    try {
      const result = await db.select().from(employers).where(eq(employers.userId, userId));
      return result[0];
    } catch (error) {
      log(`Error getting employer by user ID: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async createEmployer(employer: InsertEmployer): Promise<Employer> {
    try {
      const result = await db.insert(employers).values(employer).returning();
      return result[0];
    } catch (error) {
      log(`Error creating employer: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updateEmployer(id: number, employer: Partial<Employer>): Promise<Employer | undefined> {
    try {
      const result = await db.update(employers)
        .set(employer)
        .where(eq(employers.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating employer: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async updateEmployerVerificationStatus(id: number, isVerified: boolean, verifiedBy?: number): Promise<Employer | undefined> {
    try {
      const updateData: Partial<Employer> = { 
        verified: isVerified 
      };
      
      if (verifiedBy !== undefined) {
        updateData.verifiedBy = verifiedBy;
      }
      
      if (isVerified) {
        updateData.verifiedAt = new Date();
      }
      
      const result = await db.update(employers)
        .set(updateData)
        .where(eq(employers.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating employer verification status: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async deleteEmployer(id: number): Promise<boolean> {
    try {
      const result = await db.delete(employers).where(eq(employers.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      log(`Error deleting employer: ${error.message}`, 'db-storage');
      return false;
    }
  }
  
  // Student Profile methods
  async getAllStudentProfiles(): Promise<StudentProfile[]> {
    try {
      return await db.select().from(studentProfiles).orderBy(asc(studentProfiles.id));
    } catch (error) {
      log(`Error getting all student profiles: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getStudentProfile(id: number): Promise<StudentProfile | undefined> {
    try {
      const result = await db.select().from(studentProfiles).where(eq(studentProfiles.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting student profile: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getStudentProfileByUserId(userId: number): Promise<StudentProfile | undefined> {
    try {
      const result = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId));
      return result[0];
    } catch (error) {
      log(`Error getting student profile by user ID: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async createStudentProfile(profile: InsertStudentProfile): Promise<StudentProfile> {
    try {
      const result = await db.insert(studentProfiles).values(profile).returning();
      return result[0];
    } catch (error) {
      log(`Error creating student profile: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updateStudentProfile(id: number, profile: Partial<StudentProfile>): Promise<StudentProfile | undefined> {
    try {
      const result = await db.update(studentProfiles)
        .set(profile)
        .where(eq(studentProfiles.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating student profile: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async updateStudentProfileSkills(userId: number, skills: string[]): Promise<StudentProfile | undefined> {
    try {
      const profile = await this.getStudentProfileByUserId(userId);
      if (!profile) return undefined;
      
      const result = await db.update(studentProfiles)
        .set({ skills })
        .where(eq(studentProfiles.userId, userId))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating student profile skills: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  // PropertyUpdateNotification methods
  async createPropertyUpdateNotification(notification: InsertPropertyUpdateNotification): Promise<PropertyUpdateNotification> {
    try {
      const result = await db.insert(propertyUpdateNotifications).values(notification).returning();
      return result[0];
    } catch (error) {
      log(`Error creating property update notification: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async getPropertyUpdateNotification(id: number): Promise<PropertyUpdateNotification | undefined> {
    try {
      const result = await db.select().from(propertyUpdateNotifications).where(eq(propertyUpdateNotifications.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting property update notification: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getPropertyUpdateNotifications(filters: {
    propertyId?: number;
    recipientId?: number;
    status?: string;
    notificationType?: string;
  }): Promise<PropertyUpdateNotification[]> {
    try {
      let query = db.select().from(propertyUpdateNotifications);
      
      if (filters.propertyId) {
        query = query.where(eq(propertyUpdateNotifications.propertyId, filters.propertyId));
      }
      
      if (filters.recipientId) {
        query = query.where(eq(propertyUpdateNotifications.recipientId, filters.recipientId));
      }
      
      if (filters.status) {
        query = query.where(eq(propertyUpdateNotifications.status, filters.status));
      }
      
      if (filters.notificationType) {
        query = query.where(eq(propertyUpdateNotifications.notificationType, filters.notificationType));
      }
      
      return await query;
    } catch (error) {
      log(`Error getting property update notifications: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async updatePropertyUpdateNotification(id: number, notification: Partial<PropertyUpdateNotification>): Promise<PropertyUpdateNotification | undefined> {
    try {
      const result = await db.update(propertyUpdateNotifications)
        .set(notification)
        .where(eq(propertyUpdateNotifications.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating property update notification: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async deletePropertyUpdateNotification(id: number): Promise<boolean> {
    try {
      const result = await db.delete(propertyUpdateNotifications)
        .where(eq(propertyUpdateNotifications.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      log(`Error deleting property update notification: ${error.message}`, 'db-storage');
      return false;
    }
  }

  // Marketplace Item methods
  async getAllMarketplaceItems(): Promise<MarketplaceItem[]> {
    try {
      return await db.select().from(marketplaceItems)
        .orderBy(desc(marketplaceItems.createdAt));
    } catch (error) {
      log(`Error getting all marketplace items: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getMarketplaceItem(id: number): Promise<MarketplaceItem | undefined> {
    try {
      log(`[db-storage] Getting marketplace item with ID: ${id}`, 'db-storage');
      
      // Log the query we're about to execute for debugging
      const query = db.select().from(marketplaceItems)
        .where(and(
          eq(marketplaceItems.id, id),
          isNull(marketplaceItems.deletedAt)
        ));
      
      // Execute query
      const result = await query;
      
      // Log result information
      if (result.length === 0) {
        log(`[db-storage] No marketplace item found with ID: ${id}`, 'db-storage');
        return undefined;
      }
      
      log(`[db-storage] Found marketplace item: ${result[0].id}, title: ${result[0].title}`, 'db-storage');
      return result[0];
    } catch (error) {
      log(`[db-storage] Error getting marketplace item: ${error.message}`, 'db-storage');
      console.error('Full error:', error);
      return undefined;
    }
  }

  async getMarketplaceItemsByUser(userId: number): Promise<MarketplaceItem[]> {
    try {
      return await db.select().from(marketplaceItems)
        .where(
          eq(marketplaceItems.seller_id, userId)
        )
        .orderBy(desc(marketplaceItems.createdAt));
    } catch (error) {
      log(`Error getting marketplace items by user: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getFeaturedMarketplaceItems(): Promise<MarketplaceItem[]> {
    try {
      return await db.select().from(marketplaceItems)
        .where(
          eq(marketplaceItems.featured, true)
        )
        .orderBy(desc(marketplaceItems.createdAt));
    } catch (error) {
      log(`Error getting featured marketplace items: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem> {
    try {
      const result = await db.insert(marketplaceItems).values(item).returning();
      return result[0];
    } catch (error) {
      log(`Error creating marketplace item: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updateMarketplaceItem(id: number, item: Partial<MarketplaceItem>): Promise<MarketplaceItem | undefined> {
    try {
      const result = await db.update(marketplaceItems)
        .set({ ...item, updatedAt: new Date() })
        .where(eq(marketplaceItems.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating marketplace item: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async deleteMarketplaceItem(id: number): Promise<boolean> {
    try {
      // Soft delete by setting deletedAt
      const result = await db.update(marketplaceItems)
        .set({ deletedAt: new Date(), status: 'deleted' })
        .where(eq(marketplaceItems.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      log(`Error deleting marketplace item: ${error.message}`, 'db-storage');
      return false;
    }
  }

  // Marketplace Message methods
  async getMarketplaceMessages(itemId: number, userId: number): Promise<MarketplaceMessage[]> {
    try {
      return await db.select().from(marketplaceMessages)
        .where(
          and(
            eq(marketplaceMessages.itemId, itemId),
            or(
              eq(marketplaceMessages.senderId, userId),
              eq(marketplaceMessages.receiverId, userId)
            )
          )
        )
        .orderBy(asc(marketplaceMessages.createdAt));
    } catch (error) {
      log(`Error getting marketplace messages: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async createMarketplaceMessage(message: InsertMarketplaceMessage): Promise<MarketplaceMessage> {
    try {
      const result = await db.insert(marketplaceMessages).values(message).returning();
      return result[0];
    } catch (error) {
      log(`Error creating marketplace message: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async markMessageAsRead(id: number): Promise<MarketplaceMessage | undefined> {
    try {
      const result = await db.update(marketplaceMessages)
        .set({ readAt: new Date() })
        .where(eq(marketplaceMessages.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error marking message as read: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    try {
      const result = await db.select({ count: count() }).from(marketplaceMessages)
        .where(
          and(
            eq(marketplaceMessages.receiverId, userId),
            isNull(marketplaceMessages.readAt)
          )
        );
      return result[0].count;
    } catch (error) {
      log(`Error getting unread message count: ${error.message}`, 'db-storage');
      return 0;
    }
  }

  // Marketplace Transaction methods
  async getMarketplaceTransaction(id: number): Promise<MarketplaceTransaction | undefined> {
    try {
      const result = await db.select().from(marketplaceTransactions)
        .where(eq(marketplaceTransactions.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting marketplace transaction: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getMarketplaceTransactionsByItem(itemId: number): Promise<MarketplaceTransaction[]> {
    try {
      return await db.select().from(marketplaceTransactions)
        .where(eq(marketplaceTransactions.itemId, itemId))
        .orderBy(desc(marketplaceTransactions.createdAt));
    } catch (error) {
      log(`Error getting marketplace transactions by item: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getMarketplaceTransactionsByUser(userId: number, role: 'buyer' | 'seller'): Promise<MarketplaceTransaction[]> {
    try {
      if (role === 'buyer') {
        return await db.select().from(marketplaceTransactions)
          .where(eq(marketplaceTransactions.buyerId, userId))
          .orderBy(desc(marketplaceTransactions.createdAt));
      } else {
        return await db.select().from(marketplaceTransactions)
          .where(eq(marketplaceTransactions.sellerId, userId))
          .orderBy(desc(marketplaceTransactions.createdAt));
      }
    } catch (error) {
      log(`Error getting marketplace transactions by user: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async createMarketplaceTransaction(transaction: InsertMarketplaceTransaction): Promise<MarketplaceTransaction> {
    try {
      const result = await db.insert(marketplaceTransactions).values(transaction).returning();
      return result[0];
    } catch (error) {
      log(`Error creating marketplace transaction: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updateMarketplaceTransaction(id: number, transaction: Partial<MarketplaceTransaction>): Promise<MarketplaceTransaction | undefined> {
    try {
      const result = await db.update(marketplaceTransactions)
        .set({ ...transaction, updatedAt: new Date() })
        .where(eq(marketplaceTransactions.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating marketplace transaction: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async uploadDeliveryProof(id: number, deliveryProof: string): Promise<MarketplaceTransaction | undefined> {
    try {
      const result = await db.update(marketplaceTransactions)
        .set({ 
          deliveryProof, 
          deliveryStatus: 'delivered',
          updatedAt: new Date()
        })
        .where(eq(marketplaceTransactions.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error uploading delivery proof: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async uploadPaymentReceipt(id: number, paymentReceipt: string): Promise<MarketplaceTransaction | undefined> {
    try {
      const result = await db.update(marketplaceTransactions)
        .set({ 
          paymentReceipt, 
          paymentStatus: 'paid',
          updatedAt: new Date()
        })
        .where(eq(marketplaceTransactions.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error uploading payment receipt: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  // Marketplace Offer methods
  async createMarketplaceOffer(offer: InsertMarketplaceOffer): Promise<MarketplaceOffer> {
    try {
      const result = await db.insert(marketplaceOffers).values(offer).returning();
      return result[0];
    } catch (error) {
      log(`Error creating marketplace offer: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async getMarketplaceOffer(id: number): Promise<MarketplaceOffer | undefined> {
    try {
      const result = await db.select().from(marketplaceOffers)
        .where(eq(marketplaceOffers.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting marketplace offer: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getMarketplaceOffersByItem(itemId: number): Promise<MarketplaceOffer[]> {
    try {
      return await db.select().from(marketplaceOffers)
        .where(eq(marketplaceOffers.itemId, itemId))
        .orderBy(desc(marketplaceOffers.createdAt));
    } catch (error) {
      log(`Error getting marketplace offers by item: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getMarketplaceOffersByUser(userId: number, role: 'buyer' | 'seller'): Promise<MarketplaceOffer[]> {
    try {
      if (role === 'buyer') {
        return await db.select().from(marketplaceOffers)
          .where(eq(marketplaceOffers.buyerId, userId))
          .orderBy(desc(marketplaceOffers.createdAt));
      } else {
        return await db.select().from(marketplaceOffers)
          .where(eq(marketplaceOffers.sellerId, userId))
          .orderBy(desc(marketplaceOffers.createdAt));
      }
    } catch (error) {
      log(`Error getting marketplace offers by user: ${error.message}`, 'db-storage');
      return [];
    }
  }
  
  async getMarketplaceOffersByBuyer(buyerId: number): Promise<MarketplaceOffer[]> {
    try {
      return await db.select().from(marketplaceOffers)
        .where(eq(marketplaceOffers.buyerId, buyerId))
        .orderBy(desc(marketplaceOffers.createdAt));
    } catch (error) {
      log(`Error getting marketplace offers by buyer: ${error.message}`, 'db-storage');
      return [];
    }
  }
  
  async getMarketplaceOffersBySeller(sellerId: number): Promise<MarketplaceOffer[]> {
    try {
      return await db.select().from(marketplaceOffers)
        .where(eq(marketplaceOffers.sellerId, sellerId))
        .orderBy(desc(marketplaceOffers.createdAt));
    } catch (error) {
      log(`Error getting marketplace offers by seller: ${error.message}`, 'db-storage');
      return [];
    }
  }
  
  async getMarketplaceOffersByBuyerAndItem(buyerId: number, itemId: number): Promise<MarketplaceOffer[]> {
    try {
      return await db.select().from(marketplaceOffers)
        .where(
          and(
            eq(marketplaceOffers.buyerId, buyerId),
            eq(marketplaceOffers.itemId, itemId)
          )
        )
        .orderBy(desc(marketplaceOffers.createdAt));
    } catch (error) {
      log(`Error getting marketplace offers by buyer and item: ${error.message}`, 'db-storage');
      return [];
    }
  }
  
  async updateOfferStatus(id: number, status: string, message?: string): Promise<MarketplaceOffer | undefined> {
    try {
      const updateData: Partial<MarketplaceOffer> = { 
        status: status as any, // Cast to any to avoid type issues with the enum
        updatedAt: new Date()
      };
      
      if (message) {
        updateData.note = message;
      }
      
      const result = await db.update(marketplaceOffers)
        .set(updateData)
        .where(eq(marketplaceOffers.id, id))
        .returning();
        
      return result[0];
    } catch (error) {
      log(`Error updating offer status: ${error.message}`, 'db-storage');
      return undefined;
    }
  }
  
  async markItemAsSold(id: number, buyerId: number): Promise<MarketplaceItem | undefined> {
    try {
      const result = await db.update(marketplaceItems)
        .set({ 
          status: 'sold',
          buyer_id: buyerId,
          updatedAt: new Date()
        })
        .where(eq(marketplaceItems.id, id))
        .returning();
        
      return result[0];
    } catch (error) {
      log(`Error marking item as sold: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async updateMarketplaceOffer(id: number, offer: Partial<MarketplaceOffer>): Promise<MarketplaceOffer | undefined> {
    try {
      const result = await db.update(marketplaceOffers)
        .set({ ...offer, updatedAt: new Date() })
        .where(eq(marketplaceOffers.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating marketplace offer: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  // Transaction Message methods
  async getTransactionMessages(transactionId: number): Promise<TransactionMessage[]> {
    try {
      return await db.select().from(marketplaceTransactionMessages)
        .where(eq(marketplaceTransactionMessages.transactionId, transactionId))
        .orderBy(asc(marketplaceTransactionMessages.createdAt));
    } catch (error) {
      log(`Error getting transaction messages: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async createTransactionMessage(message: InsertTransactionMessage): Promise<TransactionMessage> {
    try {
      const result = await db.insert(marketplaceTransactionMessages).values(message).returning();
      return result[0];
    } catch (error) {
      log(`Error creating transaction message: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  // Saved Marketplace Item methods
  async saveFavoriteItem(savedItem: InsertSavedMarketplaceItem): Promise<SavedMarketplaceItem> {
    try {
      const result = await db.insert(savedMarketplaceItems).values(savedItem).returning();
      return result[0];
    } catch (error) {
      log(`Error saving favorite item: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async removeFavoriteItem(userId: number, itemId: number): Promise<boolean> {
    try {
      const result = await db.delete(savedMarketplaceItems)
        .where(
          and(
            eq(savedMarketplaceItems.userId, userId),
            eq(savedMarketplaceItems.itemId, itemId)
          )
        )
        .returning();
      return result.length > 0;
    } catch (error) {
      log(`Error removing favorite item: ${error.message}`, 'db-storage');
      return false;
    }
  }

  async getFavoriteItems(userId: number): Promise<SavedMarketplaceItem[]> {
    try {
      return await db.select().from(savedMarketplaceItems)
        .where(eq(savedMarketplaceItems.userId, userId))
        .orderBy(desc(savedMarketplaceItems.createdAt));
    } catch (error) {
      log(`Error getting favorite items: ${error.message}`, 'db-storage');
      return [];
    }
  }
  
  // Alias for getFavoriteItems to match the API used in routes
  async getSavedMarketplaceItemsByUser(userId: number): Promise<SavedMarketplaceItem[]> {
    return this.getFavoriteItems(userId);
  }
  
  // Save a marketplace item (add to favorites)
  async saveMarketplaceItem(data: InsertSavedMarketplaceItem): Promise<SavedMarketplaceItem> {
    try {
      // Check if already saved
      const isAlreadySaved = await this.isSavedMarketplaceItem(data.userId, data.itemId);
      if (isAlreadySaved) {
        // Return the existing saved item
        const existing = await db.select().from(savedMarketplaceItems)
          .where(
            and(
              eq(savedMarketplaceItems.userId, data.userId),
              eq(savedMarketplaceItems.itemId, data.itemId)
            )
          );
        return existing[0];
      }
      
      // Insert new saved item
      const result = await db.insert(savedMarketplaceItems).values(data).returning();
      return result[0];
    } catch (error) {
      log(`Error saving marketplace item: ${error.message}`, 'db-storage');
      throw error;
    }
  }
  
  // Checks if an item is saved by a user
  async isSavedMarketplaceItem(userId: number, itemId: number): Promise<boolean> {
    try {
      const result = await db.select().from(savedMarketplaceItems)
        .where(
          and(
            eq(savedMarketplaceItems.userId, userId),
            eq(savedMarketplaceItems.itemId, itemId)
          )
        );
      return result.length > 0;
    } catch (error) {
      log(`Error checking if item is saved: ${error.message}`, 'db-storage');
      return false;
    }
  }
  
  // Alias for removeFavoriteItem to match the API used in routes
  async unsaveMarketplaceItem(userId: number, itemId: number): Promise<boolean> {
    return this.removeFavoriteItem(userId, itemId);
  }

  // Report Item methods
  async reportItem(report: InsertReportedMarketplaceItem): Promise<ReportedMarketplaceItem> {
    try {
      const result = await db.insert(reportedMarketplaceItems).values(report).returning();
      return result[0];
    } catch (error) {
      log(`Error reporting item: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async getReportsByItem(itemId: number): Promise<ReportedMarketplaceItem[]> {
    try {
      return await db.select().from(reportedMarketplaceItems)
        .where(eq(reportedMarketplaceItems.itemId, itemId))
        .orderBy(desc(reportedMarketplaceItems.createdAt));
    } catch (error) {
      log(`Error getting reports by item: ${error.message}`, 'db-storage');
      return [];
    }
  }
  
  // Marketplace dashboard methods
  async getMarketplaceMessageThreadsByUser(userId: number): Promise<any[]> {
    try {
      // Get all messages where the user is either sender or recipient
      const messages = await db.select().from(marketplaceMessages)
        .where(
          or(
            eq(marketplaceMessages.senderId, userId),
            eq(marketplaceMessages.receiverId, userId)
          )
        )
        .orderBy(desc(marketplaceMessages.createdAt));
      
      // Group messages by conversation (item + other user)
      const conversationMap = new Map();
      
      for (const message of messages) {
        const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
        const conversationKey = `${message.itemId}-${otherUserId}`;
        
        if (!conversationMap.has(conversationKey)) {
          conversationMap.set(conversationKey, {
            itemId: message.itemId,
            otherUserId,
            latestMessage: message,
            unreadCount: message.receiverId === userId && message.readAt === null ? 1 : 0
          });
        } else {
          const conversation = conversationMap.get(conversationKey);
          if (message.createdAt > conversation.latestMessage.createdAt) {
            conversation.latestMessage = message;
          }
          if (message.receiverId === userId && message.readAt === null) {
            conversation.unreadCount += 1;
          }
        }
      }
      
      // Convert map to array
      return Array.from(conversationMap.values());
    } catch (error) {
      log(`Error getting marketplace message threads: ${error.message}`, 'db-storage');
      return [];
    }
  }
  
  // Student Vouchers methods
  async getStudentVouchers(filters?: any): Promise<StudentVoucher[]> {
    try {
      let query = db.select().from(studentVouchers);
      
      if (filters) {
        if (filters.companyId) {
          query = query.where(eq(studentVouchers.companyId, filters.companyId));
        }
        
        if (filters.type) {
          query = query.where(eq(studentVouchers.type, filters.type));
        }
        
        if (filters.status) {
          query = query.where(eq(studentVouchers.status, filters.status));
        }
        
        if (filters.active !== undefined) {
          query = query.where(eq(studentVouchers.active, filters.active));
        }
      }
      
      // Order by newest first
      query = query.orderBy(desc(studentVouchers.id));
      
      return await query;
    } catch (error) {
      log(`Error getting student vouchers: ${error.message}`, 'db-storage');
      return [];
    }
  }
  
  async getStudentVoucherById(id: number): Promise<StudentVoucher | undefined> {
    try {
      const result = await db.select().from(studentVouchers).where(eq(studentVouchers.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting student voucher by id: ${error.message}`, 'db-storage');
      return undefined;
    }
  }
  
  async getStudentVouchersByCompany(companyId: number): Promise<StudentVoucher[]> {
    try {
      return await db.select().from(studentVouchers).where(eq(studentVouchers.companyId, companyId));
    } catch (error) {
      log(`Error getting student vouchers by company: ${error.message}`, 'db-storage');
      return [];
    }
  }
  
  async getStudentVouchersByUser(userId: number): Promise<StudentVoucher[]> {
    try {
      // First get saved vouchers for this user
      const savedVouchersResult = await db.select().from(savedVouchers).where(eq(savedVouchers.userId, userId));
      
      if (savedVouchersResult.length === 0) {
        return [];
      }
      
      // Extract voucher IDs
      const voucherIds = savedVouchersResult.map(saved => saved.voucherId);
      
      // Handle empty array case to prevent SQL error
      if (voucherIds.length === 0) {
        return [];
      }
      
      // Get the vouchers
      const vouchers = await db.select()
        .from(studentVouchers)
        .where(sql`${studentVouchers.id} IN (${voucherIds.join(',')})`);
      
      return vouchers;
    } catch (error) {
      log(`Error getting student vouchers by user: ${error.message}`, 'db-storage');
      return [];
    }
  }
  
  async createStudentVoucher(voucher: InsertStudentVoucher): Promise<StudentVoucher> {
    try {
      const result = await db.insert(studentVouchers).values(voucher).returning();
      return result[0];
    } catch (error) {
      log(`Error creating student voucher: ${error.message}`, 'db-storage');
      throw error;
    }
  }
  
  async updateStudentVoucher(id: number, voucher: Partial<StudentVoucher>): Promise<StudentVoucher | undefined> {
    try {
      const result = await db.update(studentVouchers)
        .set(voucher)
        .where(eq(studentVouchers.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating student voucher: ${error.message}`, 'db-storage');
      return undefined;
    }
  }
  
  async deleteStudentVoucher(id: number): Promise<boolean> {
    try {
      const result = await db.delete(studentVouchers).where(eq(studentVouchers.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      log(`Error deleting student voucher: ${error.message}`, 'db-storage');
      return false;
    }
  }
  
  // Social Campaign Methods
  async createSocialCampaign(campaignData: SocialCampaign): Promise<SocialCampaign> {
    try {
      log(`Creating social campaign: ${campaignData.name}`, 'db-storage');
      
      // Generate a sequential ID (temporary solution as we don't have a proper social_campaigns table)
      const id = Date.now();
      
      // Include the ID in the returned campaign data
      const campaign: SocialCampaign = {
        ...campaignData,
        id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // In a full implementation, we would insert into the database
      // This is a temporary solution until we set up the social_campaigns table
      
      log(`Social campaign created with ID ${id}`, 'db-storage');
      return campaign;
    } catch (error) {
      log(`Error creating social campaign: ${error.message}`, 'db-storage');
      throw new Error('Failed to create social campaign');
    }
  }

  // Short Videos methods for Student Reels
  async getAllShortVideos(): Promise<ShortVideo[]> {
    try {
      const result = await db.select().from(shortVideos);
      
      // Transform the result to match the expected ShortVideo interface
      return result.map(video => ({
        id: video.id,
        userId: video.userId,
        title: video.caption || 'Untitled Video',
        description: '',
        videoUrl: video.url,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        fileSize: null,
        format: 'mp4',
        resolution: null,
        category: video.category,
        tags: video.hashtags || [],
        isPublic: video.isPublic,
        views: video.viewsCount || 0,
        likes: video.likes || 0,
        comments: video.comments || 0,
        shares: video.shares || 0,
        isApproved: true,
        moderationNotes: null,
        flagCount: 0,
        location: null,
        propertyId: null,
        createdAt: video.createdAt,
        updatedAt: video.createdAt
      }));
    } catch (error) {
      log(`Error getting all short videos: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async getShortVideo(id: number): Promise<ShortVideo | undefined> {
    try {
      const result = await db.select().from(shortVideos).where(eq(shortVideos.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting short video: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async getShortVideosByUser(userId: number): Promise<ShortVideo[]> {
    try {
      const result = await db.select().from(shortVideos).where(eq(shortVideos.userId, userId));
      return result;
    } catch (error) {
      log(`Error getting short videos by user: ${error.message}`, 'db-storage');
      return [];
    }
  }

  async createShortVideo(video: InsertShortVideo): Promise<ShortVideo> {
    try {
      const result = await db.insert(shortVideos).values(video).returning();
      return result[0];
    } catch (error) {
      log(`Error creating short video: ${error.message}`, 'db-storage');
      throw error;
    }
  }

  async updateShortVideo(id: number, video: Partial<ShortVideo>): Promise<ShortVideo | undefined> {
    try {
      const result = await db.update(shortVideos)
        .set(video)
        .where(eq(shortVideos.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating short video: ${error.message}`, 'db-storage');
      return undefined;
    }
  }

  async deleteShortVideo(id: number): Promise<boolean> {
    try {
      const result = await db.delete(shortVideos).where(eq(shortVideos.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      log(`Error deleting short video: ${error.message}`, 'db-storage');
      return false;
    }
  }

  // UK Property Legislation methods (fallback to sample data for now)
  async getAllLegislation(): Promise<any[]> {
    return [
      {
        id: 1,
        title: "Renters' Rights Bill 2024 - Abolition of Section 21 Evictions",
        summary: "The Government has introduced legislation to abolish Section 21 'no-fault' evictions, providing greater security for tenants.",
        fullText: "The Renters' Rights Bill introduces significant changes to the private rental sector including abolition of Section 21 evictions and stronger grounds for possession under Section 8.",
        category: "tenancy_law",
        urgency: "critical",
        affectedParties: ["landlord", "agent", "tenant"],
        implementationDate: "2024-10-01",
        lastUpdated: new Date().toISOString(),
        governmentSource: "Department for Levelling Up, Housing and Communities",
        sourceUrl: "https://www.gov.uk/government/bills/renters-rights-bill",
        complianceRequirements: [
          "Review and update tenancy agreements to remove Section 21 clauses",
          "Implement new Section 8 possession procedures",
          "Register with the new private rental sector ombudsman"
        ]
      },
      {
        id: 2,
        title: "Electrical Safety Standards in the Private Rented Sector (England) Regulations 2020",
        summary: "Landlords must ensure electrical installations and appliances are safe and tested by qualified electricians.",
        fullText: "These regulations require landlords to have electrical installations inspected and tested by a qualified person at least every 5 years.",
        category: "safety_standards",
        urgency: "high",
        affectedParties: ["landlord", "agent"],
        implementationDate: "2020-07-01",
        lastUpdated: new Date().toISOString(),
        governmentSource: "Health and Safety Executive",
        sourceUrl: "https://www.gov.uk/government/publications/electrical-safety-standards-in-the-private-rented-sector",
        complianceRequirements: [
          "Conduct electrical safety inspections every 5 years",
          "Provide electrical safety certificates to tenants",
          "Remedy any electrical safety issues identified"
        ]
      }
    ];
  }

  async getLegislation(id: number): Promise<any | undefined> {
    const all = await this.getAllLegislation();
    return all.find(item => item.id === id);
  }

  async getLegislationByCategory(category: string): Promise<any[]> {
    const all = await this.getAllLegislation();
    return all.filter(item => item.category === category);
  }

  async getLegislationByUrgency(urgency: string): Promise<any[]> {
    const all = await this.getAllLegislation();
    return all.filter(item => item.urgency === urgency);
  }

  async getLegislationByTitleAndSource(title: string, source: string): Promise<any | undefined> {
    const all = await this.getAllLegislation();
    return all.find(item => item.title === title && item.governmentSource === source);
  }

  async createLegislation(legislation: any): Promise<any> {
    // For now, return the legislation with a new ID
    return { ...legislation, id: Date.now() };
  }

  async updateLegislation(id: number, updates: any): Promise<any | undefined> {
    const existing = await this.getLegislation(id);
    if (!existing) return undefined;
    return { ...existing, ...updates };
  }

  async markLegislationAsAcknowledged(userId: number, legislationId: number): Promise<any> {
    return {
      id: Date.now(),
      userId,
      legislationId,
      acknowledgedAt: new Date()
    };
  }

  async getUserLegislationTracking(userId: number): Promise<any[]> {
    return [];
  }

  // Document methods implementation
  async getDocument(id: number): Promise<Document | undefined> {
    try {
      const [document] = await db.select().from(documents).where(eq(documents.id, id));
      return document;
    } catch (error) {
      console.error('Error getting document:', error);
      return undefined;
    }
  }

  async getAllDocuments(filters?: {
    propertyId?: number;
    tenantId?: number;
    landlordId?: number;
    agentId?: number;
    documentType?: string;
  }): Promise<Document[]> {
    try {
      let query = db.select().from(documents);
      
      if (filters) {
        const conditions = [];
        if (filters.propertyId) conditions.push(eq(documents.propertyId, filters.propertyId));
        if (filters.tenantId) conditions.push(eq(documents.tenantId, filters.tenantId));
        if (filters.landlordId) conditions.push(eq(documents.landlordId, filters.landlordId));
        if (filters.agentId) conditions.push(eq(documents.agentId, filters.agentId));
        if (filters.documentType) conditions.push(eq(documents.documentType, filters.documentType));
        
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting all documents:', error);
      return [];
    }
  }

  async getDocumentsByFilters(filters: {
    propertyId?: number;
    tenantId?: number;
    landlordId?: number;
    agentId?: number;
    createdById?: number;
    documentType?: string;
  }): Promise<Document[]> {
    try {
      const conditions = [];
      if (filters.propertyId) conditions.push(eq(documents.propertyId, filters.propertyId));
      if (filters.tenantId) conditions.push(eq(documents.tenantId, filters.tenantId));
      if (filters.landlordId) conditions.push(eq(documents.landlordId, filters.landlordId));
      if (filters.agentId) conditions.push(eq(documents.agentId, filters.agentId));
      if (filters.createdById) conditions.push(eq(documents.createdById, filters.createdById));
      if (filters.documentType) conditions.push(eq(documents.documentType, filters.documentType));
      
      if (conditions.length === 0) {
        return await db.select().from(documents);
      }
      
      return await db.select().from(documents).where(and(...conditions));
    } catch (error) {
      console.error('Error getting documents by filters:', error);
      return [];
    }
  }

  async getDocumentsByLandlord(landlordId: number): Promise<Document[]> {
    try {
      return await db.select().from(documents).where(eq(documents.landlordId, landlordId));
    } catch (error) {
      console.error('Error getting documents by landlord:', error);
      return [];
    }
  }

  async getDocumentsByTenant(tenantId: number): Promise<Document[]> {
    try {
      return await db.select().from(documents).where(eq(documents.tenantId, tenantId));
    } catch (error) {
      console.error('Error getting documents by tenant:', error);
      return [];
    }
  }

  async getDocumentsByAgent(agentId: number): Promise<Document[]> {
    try {
      return await db.select().from(documents).where(eq(documents.agentId, agentId));
    } catch (error) {
      console.error('Error getting documents by agent:', error);
      return [];
    }
  }

  async getDocumentsByProperty(propertyId: number): Promise<Document[]> {
    try {
      return await db.select().from(documents).where(eq(documents.propertyId, propertyId));
    } catch (error) {
      console.error('Error getting documents by property:', error);
      return [];
    }
  }

  async getDocumentsByTenancy(tenancyId: number): Promise<Document[]> {
    try {
      return await db.select().from(documents).where(eq(documents.tenancyId, tenancyId));
    } catch (error) {
      console.error('Error getting documents by tenancy:', error);
      return [];
    }
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    try {
      const [newDocument] = await db.insert(documents).values(document).returning();
      return newDocument;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  async updateDocument(id: number, document: Partial<Document>): Promise<Document | undefined> {
    try {
      const [updatedDocument] = await db
        .update(documents)
        .set({ ...document, updatedAt: new Date() })
        .where(eq(documents.id, id))
        .returning();
      return updatedDocument;
    } catch (error) {
      console.error('Error updating document:', error);
      return undefined;
    }
  }

  async deleteDocument(id: number): Promise<boolean> {
    try {
      await db.delete(documents).where(eq(documents.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  // E-signature methods
  async signDocumentByTenant(id: number, tenantId: number): Promise<Document | undefined> {
    try {
      const [updatedDocument] = await db
        .update(documents)
        .set({ 
          signedByTenant: true,
          dateSigned: new Date(),
          updatedAt: new Date()
        })
        .where(and(eq(documents.id, id), eq(documents.tenantId, tenantId)))
        .returning();
      return updatedDocument;
    } catch (error) {
      console.error('Error signing document by tenant:', error);
      return undefined;
    }
  }

  async signDocumentByLandlord(id: number, landlordId: number): Promise<Document | undefined> {
    try {
      const [updatedDocument] = await db
        .update(documents)
        .set({ 
          signedByLandlord: true,
          dateSigned: new Date(),
          updatedAt: new Date()
        })
        .where(and(eq(documents.id, id), eq(documents.landlordId, landlordId)))
        .returning();
      return updatedDocument;
    } catch (error) {
      console.error('Error signing document by landlord:', error);
      return undefined;
    }
  }

  async signDocumentByAgent(id: number, agentId: number): Promise<Document | undefined> {
    try {
      const [updatedDocument] = await db
        .update(documents)
        .set({ 
          signedByAgent: true,
          dateSigned: new Date(),
          updatedAt: new Date()
        })
        .where(and(eq(documents.id, id), eq(documents.agentId, agentId)))
        .returning();
      return updatedDocument;
    } catch (error) {
      console.error('Error signing document by agent:', error);
      return undefined;
    }
  }
}

// Create and export a singleton instance
export const dbStorage = new DatabaseStorage();