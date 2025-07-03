import {
  User, InsertUser,
  Property, InsertProperty,
  Application, InsertApplication,
  GroupApplicationMember, InsertGroupApplicationMember,
  Tenancy, InsertTenancy,
  Payment, InsertPayment,
  Verification, InsertVerification,
  AiProvider, InsertAiProvider,
  MaintenanceRequest, InsertMaintenanceRequest,
  MaintenanceTemplate, InsertMaintenanceTemplate,
  Contractor, InsertContractor,
  CalendarEvent, InsertCalendarEvent,
  DepositSchemeCredentials, InsertDepositSchemeCredentials,
  Document, InsertDocument,
  TenantPreferences, InsertTenantPreferences,
  AiTargetingResults, InsertAiTargetingResults,
  PropertyTenantMatch, InsertPropertyTenantMatch,
  TenantRiskAssessment, InsertTenantRiskAssessment,
  FraudAlert, InsertFraudAlert,
  UserActivity, InsertUserActivity,
  UserBehaviorAnalytic, InsertUserBehaviorAnalytic,
  UserSuggestion, InsertUserSuggestion,
  FinancialAccount, InsertFinancialAccount,
  FinancialTransaction, InsertFinancialTransaction,
  FinancialReport, InsertFinancialReport,
  TaxInformation, InsertTaxInformation,
  PropertyFinance, InsertPropertyFinance,
  PropertyKey, InsertPropertyKey,
  KeyAssignmentHistory, InsertKeyAssignmentHistory,
  PropertyUpdateNotification, InsertPropertyUpdateNotification,
  CityImage, InsertCityImage,
  VoucherCompany, InsertVoucherCompany,
  StudentVoucher, InsertStudentVoucher,
  VoucherRedemption, InsertVoucherRedemption,
  VoucherBooking, InsertVoucherBooking,
  SavedVoucher, InsertSavedVoucher,
  ChatConversation, InsertChatConversation,
  ChatParticipant, InsertChatParticipant,
  ChatMessage, InsertChatMessage,
  ChatMessageReaction, InsertChatMessageReaction,
  PropertyCheckProSubscription, InsertPropertyCheckProSubscription,
  MarketArea, InsertMarketArea,
  PropertyMarketData, InsertPropertyMarketData,
  PropertyInvestmentRecommendation, InsertPropertyInvestmentRecommendation,
  ViewingRequest, InsertViewingRequest,
  ViewingFeedback, InsertViewingFeedback,
  VirtualViewingSession, InsertVirtualViewingSession,
  JobApplication, InsertJobApplication,
  JobInterview, InsertJobInterview,
  JobSkill, InsertJobSkill,
  PropertyComparison, InsertPropertyComparison,
  UkPropertyLegislation, InsertUkPropertyLegislation,
  UserLegislationTracking, InsertUserLegislationTracking,
  users, properties, applications, tenancies, payments, verifications, aiProviders,
  maintenanceRequests, maintenanceTemplates, contractors, calendarEvents, depositSchemeCredentials,
  documents, tenantPreferences, aiTargetingResults, propertyTenantMatches, tenantRiskAssessments,
  fraudAlerts, userActivities, financialAccounts, financialTransactions, financialReports, taxInformation, propertyFinances,
  groupApplicationMembers, propertyKeys, keyAssignmentHistory, propertyUpdateNotifications, cityImages, viewingRequests,
  viewingFeedback, virtualViewingSessions, jobApplications, jobInterviews, jobSkills, propertyComparisons,
  ukPropertyLegislation, userLegislationTracking
} from "@shared/schema";

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
} from "@shared/marketplace-schema";

import {
  ShortVideo, InsertShortVideo,
  shortVideos
} from "@shared/video-sharing-schema";

// Social campaign type definition (this would normally be in schema.ts)
export interface SocialCampaign {
  id?: number;
  name: string;
  description?: string;
  targetDemographic?: string;
  targetUniversities?: string[];
  platforms?: string[];
  status?: string;
  userId?: number;
  createdAt?: Date;
  updatedAt?: Date;
  // Additional fields for campaign management
  budget?: string | number;
  duration?: number;
  studentInterests?: string[];
  campaignBudget?: number;
  campaignLength?: number;
  insights?: any;
  content?: any[];
}

export interface IStorage {
  // Social Targeting methods
  createSocialCampaign(campaignData: SocialCampaign): Promise<SocialCampaign>;
  getSocialCampaigns(userId?: number): Promise<SocialCampaign[]>;
  getSocialCampaign(id: number): Promise<SocialCampaign | undefined>;
  updateSocialCampaign(id: number, campaignData: Partial<SocialCampaign>): Promise<SocialCampaign | undefined>;
  deleteSocialCampaign(id: number): Promise<boolean>;
  
  // Property Comparison methods
  getPropertyComparisons(userId: number): Promise<PropertyComparison[]>;
  getPropertyComparison(id: number): Promise<PropertyComparison | undefined>;
  getPropertyComparisonByShareToken(shareToken: string): Promise<PropertyComparison | undefined>;
  createPropertyComparison(comparison: InsertPropertyComparison): Promise<PropertyComparison>;
  updatePropertyComparison(id: number, comparison: Partial<PropertyComparison>): Promise<PropertyComparison | undefined>;
  deletePropertyComparison(id: number): Promise<boolean>;
  sharePropertyComparison(id: number, isShared: boolean): Promise<PropertyComparison | undefined>;
  
  // Property Keys Management
  getPropertyKeys(propertyId: number): Promise<PropertyKey[]>;
  getPropertyKey(keyId: number): Promise<PropertyKey | undefined>;
  createPropertyKey(key: InsertPropertyKey): Promise<PropertyKey>;
  updatePropertyKey(keyId: number, key: Partial<PropertyKey>): Promise<PropertyKey | undefined>;
  deletePropertyKey(keyId: number): Promise<boolean>;
  
  // Key Assignment History
  getKeyAssignmentHistory(keyId: number): Promise<KeyAssignmentHistory[]>;
  createKeyAssignment(assignment: InsertKeyAssignmentHistory): Promise<KeyAssignmentHistory>;
  updateKeyAssignment(assignmentId: number, data: Partial<KeyAssignmentHistory>): Promise<KeyAssignmentHistory | undefined>;
  
  // Short Videos methods for Student Reels
  getAllShortVideos(): Promise<ShortVideo[]>;
  getShortVideo(id: number): Promise<ShortVideo | undefined>;
  getShortVideosByUser(userId: number): Promise<ShortVideo[]>;
  createShortVideo(video: InsertShortVideo): Promise<ShortVideo>;
  updateShortVideo(id: number, video: Partial<ShortVideo>): Promise<ShortVideo | undefined>;
  deleteShortVideo(id: number): Promise<boolean>;
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  updateUserRightToRent(userId: number, rightToRentData: {
    rightToRentVerified: boolean;
    rightToRentStatus?: string;
    rightToRentExpiryDate?: Date;
    rightToRentCheckDate?: Date;
  }): Promise<User | undefined>;
  
  // Property methods
  getAllProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  getPropertiesByOwner(ownerId: number): Promise<Property[]>;
  getPropertiesByFilters(filters: {
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
  }): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<Property>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;
  
  // Utility management methods
  // Utility providers
  getAllUtilityProviders(): Promise<UtilityProvider[]>;
  getUtilityProviders(): Promise<UtilityProvider[]>; // Alias for getAllUtilityProviders
  getUtilityProvider(id: number): Promise<UtilityProvider | undefined>;
  getUtilityProvidersByType(utilityType: UtilityType): Promise<UtilityProvider[]>;
  createUtilityProvider(provider: UtilityProviderInsert): Promise<UtilityProvider>;
  updateUtilityProvider(id: number, provider: Partial<UtilityProvider>): Promise<UtilityProvider | undefined>;
  deleteUtilityProvider(id: number): Promise<boolean>;
  
  // Utility plans
  getAllUtilityPlans(): Promise<UtilityPlan[]>;
  getUtilityPlan(id: number): Promise<UtilityPlan | undefined>;
  getUtilityPlansByProvider(providerId: number): Promise<UtilityPlan[]>;
  getUtilityPlansByType(utilityType: UtilityType): Promise<UtilityPlan[]>;
  createUtilityPlan(plan: UtilityPlanInsert): Promise<UtilityPlan>;
  updateUtilityPlan(id: number, plan: Partial<UtilityPlan>): Promise<UtilityPlan | undefined>;
  deleteUtilityPlan(id: number): Promise<boolean>;
  
  // Property utilities (utilities assigned to properties)
  getPropertyUtility(id: number): Promise<PropertyUtility | undefined>;
  getPropertyUtilitiesByProperty(propertyId: number): Promise<PropertyUtility[]>;
  getPropertyUtilitiesByType(propertyId: number, utilityType: UtilityType): Promise<PropertyUtility[]>;
  createPropertyUtility(utility: PropertyUtilityInsert): Promise<PropertyUtility>;
  updatePropertyUtility(id: number, utility: Partial<PropertyUtility>): Promise<PropertyUtility | undefined>;
  deletePropertyUtility(id: number): Promise<boolean>;
  
  // Utility switch requests
  getUtilitySwitchRequest(id: number): Promise<UtilitySwitchRequest | undefined>;
  getUtilitySwitchRequestsByUser(userId: number): Promise<UtilitySwitchRequest[]>;
  getUtilitySwitchRequestsByProperty(propertyId: number): Promise<UtilitySwitchRequest[]>;
  createUtilitySwitchRequest(request: UtilitySwitchRequestInsert): Promise<UtilitySwitchRequest>;
  updateUtilitySwitchRequestStatus(id: number, status: string, completionDate?: Date): Promise<UtilitySwitchRequest | undefined>;
  
  // Utility comparison history
  getUtilityComparisonHistory(id: number): Promise<UtilityComparisonHistory | undefined>;
  getUtilityComparisonHistoryByUser(userId: number): Promise<UtilityComparisonHistory[]>;
  createUtilityComparisonHistory(comparison: UtilityComparisonHistoryInsert): Promise<UtilityComparisonHistory>;
  updateUtilityComparisonHistorySwitchStatus(
    id: number, 
    switched: boolean, 
    selectedProviderId?: number, 
    selectedPlanId?: number
  ): Promise<UtilityComparisonHistory | undefined>;
  
  // Application methods
  getApplication(id: number): Promise<Application | undefined>;
  getApplicationsByTenant(tenantId: number): Promise<Application[]>;
  getApplicationsByProperty(propertyId: number): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: number, status: string): Promise<Application | undefined>;
  
  // Group Application Members methods
  getGroupApplicationMember(id: number): Promise<GroupApplicationMember | undefined>;
  getGroupApplicationMembersByGroupId(groupId: string): Promise<GroupApplicationMember[]>;
  getGroupApplicationMembersByUserId(userId: number): Promise<GroupApplicationMember[]>;
  getGroupApplicationMembersByApplicationId(applicationId: number): Promise<GroupApplicationMember[]>;
  createGroupApplicationMember(member: InsertGroupApplicationMember): Promise<GroupApplicationMember>;
  updateGroupApplicationMemberStatus(id: number, status: string): Promise<GroupApplicationMember | undefined>;
  updateGroupApplicationMemberVerification(id: number, verificationData: {
    verificationCompleted?: boolean;
    rightToRentVerified?: boolean;
  }): Promise<GroupApplicationMember | undefined>;
  
  // Group Application methods
  createGroupApplication(application: InsertApplication, groupMembers: Array<{name: string, email: string}>): Promise<Application>;
  getGroupApplicationMembers(groupId: string): Promise<any[]>;
  getGroupApplicationByGroupId(groupId: string): Promise<Application | undefined>;
  getGroupApplicationsByMemberId(userId: number): Promise<Application[]>;
  addGroupApplicationMember(groupId: string, applicationId: number, userId: number, invitedBy: number): Promise<any>;
  updateGroupApplicationMemberStatus(id: number, status: string, userId: number): Promise<any>;
  
  // UK Property Legislation methods
  getAllLegislation(): Promise<UkPropertyLegislation[]>;
  getLegislation(id: number): Promise<UkPropertyLegislation | undefined>;
  getLegislationByCategory(category: string): Promise<UkPropertyLegislation[]>;
  getLegislationByUrgency(urgency: string): Promise<UkPropertyLegislation[]>;
  getLegislationByTitleAndSource(title: string, source: string): Promise<UkPropertyLegislation | undefined>;
  createLegislation(legislation: InsertUkPropertyLegislation): Promise<UkPropertyLegislation>;
  updateLegislation(id: number, legislation: Partial<UkPropertyLegislation>): Promise<UkPropertyLegislation | undefined>;
  deleteLegislation(id: number): Promise<boolean>;
  
  // User Legislation Tracking methods
  getUserLegislationTracking(userId: number): Promise<UserLegislationTracking[]>;
  createUserLegislationTracking(tracking: InsertUserLegislationTracking): Promise<UserLegislationTracking>;
  markLegislationAsAcknowledged(userId: number, legislationId: number): Promise<UserLegislationTracking | undefined>;
  
  // Tenancy methods
  getTenancy(id: number): Promise<Tenancy | undefined>;
  getAllTenancies(): Promise<Tenancy[]>;
  getTenanciesByTenant(tenantId: number): Promise<Tenancy[]>;
  getTenanciesByProperty(propertyId: number): Promise<Tenancy[]>;
  createTenancy(tenancy: InsertTenancy): Promise<Tenancy>;
  updateTenancy(id: number, tenancy: Partial<Tenancy>): Promise<Tenancy | undefined>;
  
  // Payment methods
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByTenancy(tenancyId: number): Promise<Payment[]>;
  getPaymentsByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: number, status: string, paidDate?: Date): Promise<Payment | undefined>;
  
  // Verification methods
  getVerification(id: number): Promise<Verification | undefined>;
  getVerificationByUser(userId: number): Promise<Verification | undefined>;
  getVerificationByUserId(userId: number): Promise<Verification | undefined>;
  createVerification(verification: InsertVerification): Promise<Verification>;
  updateVerification(id: number, verification: Partial<Verification>): Promise<Verification | undefined>;
  updateVerificationStatus(id: number, status: string, aiVerified: boolean, adminVerified?: boolean): Promise<Verification | undefined>;
  getPendingRightToRentVerifications(userId?: number | null, userType?: string): Promise<Array<{verification: Verification, user: User}>>;
  getRightToRentFollowUps(userId?: number | null, userType?: string): Promise<Array<{verification: Verification, user: User}>>;
  checkLandlordOrAgentHasAccessToTenant(userId: number, tenantId: number, userType: string): Promise<boolean>;
  
  // AI Provider methods
  getAllAiProviders(): Promise<AiProvider[]>;
  getAiProvider(id: number): Promise<AiProvider | undefined>;
  getAiProviderByName(name: string): Promise<AiProvider | undefined>;
  getActiveAiProviders(): Promise<AiProvider[]>;
  createAiProvider(provider: InsertAiProvider): Promise<AiProvider>;
  updateAiProvider(id: number, provider: Partial<AiProvider>): Promise<AiProvider | undefined>;
  updateAiProviderStatus(id: number, status: string, errorMessage?: string): Promise<AiProvider | undefined>;
  deleteAiProvider(id: number): Promise<boolean>;
  
  // Maintenance Request methods
  getAllMaintenanceRequests(): Promise<MaintenanceRequest[]>;
  getMaintenanceRequest(id: number): Promise<MaintenanceRequest | undefined>;
  getMaintenanceRequestsByProperty(propertyId: number): Promise<MaintenanceRequest[]>;
  getMaintenanceRequestsByTenant(tenantId: number): Promise<MaintenanceRequest[]>;
  getMaintenanceRequestsByContractor(contractorId: number): Promise<MaintenanceRequest[]>;
  createMaintenanceRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest>;
  updateMaintenanceRequest(id: number, request: Partial<MaintenanceRequest>): Promise<MaintenanceRequest | undefined>;
  deleteMaintenanceRequest(id: number): Promise<boolean>;
  
  // Maintenance Template methods
  getAllMaintenanceTemplates(): Promise<MaintenanceTemplate[]>;
  getMaintenanceTemplate(id: number): Promise<MaintenanceTemplate | undefined>;
  getMaintenanceTemplatesByCategory(category: string): Promise<MaintenanceTemplate[]>;
  getMaintenanceTemplatesBySeason(season: string): Promise<MaintenanceTemplate[]>;
  createMaintenanceTemplate(template: InsertMaintenanceTemplate): Promise<MaintenanceTemplate>;
  updateMaintenanceTemplate(id: number, template: Partial<MaintenanceTemplate>): Promise<MaintenanceTemplate | undefined>;
  deleteMaintenanceTemplate(id: number): Promise<boolean>;
  
  // Contractor methods
  getAllContractors(): Promise<Contractor[]>;
  getContractor(id: number): Promise<Contractor | undefined>;
  getContractorsByService(service: string): Promise<Contractor[]>;
  getContractorsByArea(area: string): Promise<Contractor[]>;
  createContractor(contractor: InsertContractor): Promise<Contractor>;
  updateContractor(id: number, contractor: Partial<Contractor>): Promise<Contractor | undefined>;
  deleteContractor(id: number): Promise<boolean>;
  
  // Calendar Event methods
  getAllCalendarEvents(): Promise<CalendarEvent[]>;
  getCalendarEvent(id: number): Promise<CalendarEvent | undefined>;
  getCalendarEventsByUser(userId: number): Promise<CalendarEvent[]>;
  getCalendarEventsByDateRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]>;
  getCalendarEventsByEntity(entityType: string, entityId: number): Promise<CalendarEvent[]>;
  getCalendarEventsByType(type: string): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: number, event: Partial<CalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: number): Promise<boolean>;
  
  // Deposit Scheme Credentials methods
  getDepositSchemeCredentials(id: number): Promise<DepositSchemeCredentials | undefined>;
  getDepositSchemeCredentialsByUser(userId: number): Promise<DepositSchemeCredentials[]>;
  getDepositSchemeCredentialsByScheme(userId: number, schemeName: string): Promise<DepositSchemeCredentials | undefined>;
  getDefaultDepositSchemeCredentials(userId: number): Promise<DepositSchemeCredentials | undefined>;
  createDepositSchemeCredentials(credentials: InsertDepositSchemeCredentials): Promise<DepositSchemeCredentials>;
  updateDepositSchemeCredentials(id: number, credentials: Partial<DepositSchemeCredentials>): Promise<DepositSchemeCredentials | undefined>;
  setDefaultDepositSchemeCredentials(id: number, userId: number): Promise<boolean>;
  deleteDepositSchemeCredentials(id: number): Promise<boolean>;
  
  // Safety Certificate methods
  getSafetyCertificate(id: number): Promise<SafetyCertificate | undefined>;
  getSafetyCertificatesByProperty(propertyId: number): Promise<SafetyCertificate[]>;
  getSafetyCertificatesByType(propertyId: number, type: string): Promise<SafetyCertificate[]>;
  getExpiringSafetyCertificates(daysThreshold: number): Promise<SafetyCertificate[]>;
  createSafetyCertificate(certificate: InsertSafetyCertificate): Promise<SafetyCertificate>;
  updateSafetyCertificate(id: number, certificate: Partial<SafetyCertificate>): Promise<SafetyCertificate | undefined>;
  deleteSafetyCertificate(id: number): Promise<boolean>;
  
  // Document methods
  getDocument(id: number): Promise<Document | undefined>;
  getAllDocuments(filters?: {
    propertyId?: number;
    tenantId?: number;
    landlordId?: number;
    agentId?: number;
    documentType?: string;
  }): Promise<Document[]>;
  getDocumentsByFilters(filters: {
    propertyId?: number;
    tenantId?: number;
    landlordId?: number;
    agentId?: number;
    createdById?: number;
    documentType?: string;
  }): Promise<Document[]>;
  getDocumentsByLandlord(landlordId: number): Promise<Document[]>;
  getDocumentsByTenant(tenantId: number): Promise<Document[]>;
  getDocumentsByAgent(agentId: number): Promise<Document[]>;
  getDocumentsByProperty(propertyId: number): Promise<Document[]>;
  getDocumentsByTenancy(tenancyId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // E-signature methods
  signDocumentByTenant(id: string, tenantId: number): Promise<Document | undefined>;
  signDocumentByLandlord(id: string, landlordId: number): Promise<Document | undefined>;
  signDocumentByAgent(id: string, agentId: number): Promise<Document | undefined>;
  
  // Tenant Preferences methods
  getTenantPreferences(id: number): Promise<TenantPreferences | undefined>;
  getTenantPreferencesByTenantId(tenantId: number): Promise<TenantPreferences | undefined>;
  createTenantPreferences(preferences: InsertTenantPreferences): Promise<TenantPreferences>;
  updateTenantPreferences(id: number, preferences: Partial<TenantPreferences>): Promise<TenantPreferences | undefined>;
  deleteTenantPreferences(id: number): Promise<boolean>;
  
  // AI Targeting methods
  getAllAiTargetingResults(): Promise<AiTargetingResults[]>;
  getAiTargeting(id: number): Promise<AiTargetingResults | undefined>;
  getAiTargetingByAgent(agentId: number): Promise<AiTargetingResults[]>;
  createAiTargeting(targeting: InsertAiTargetingResults): Promise<AiTargetingResults>;
  updateAiTargeting(id: number, targeting: Partial<AiTargetingResults>): Promise<AiTargetingResults | undefined>;
  deleteAiTargeting(id: number): Promise<boolean>;
  
  // Property-Tenant Match methods
  getPropertyTenantMatch(id: number): Promise<PropertyTenantMatch | undefined>;
  getPropertyTenantMatchesByProperty(propertyId: number): Promise<PropertyTenantMatch[]>;
  getPropertyTenantMatchesByTenant(tenantId: number): Promise<PropertyTenantMatch[]>;
  getPropertyTenantMatchesByTargeting(targetingId: number): Promise<PropertyTenantMatch[]>;
  createPropertyTenantMatch(match: Partial<PropertyTenantMatch>): Promise<PropertyTenantMatch>;
  updatePropertyTenantMatch(id: number, match: Partial<PropertyTenantMatch>): Promise<PropertyTenantMatch | undefined>;
  deletePropertyTenantMatch(id: number): Promise<boolean>;
  
  // Viewing Request methods
  getAllViewingRequests(): Promise<ViewingRequest[]>;
  getViewingRequest(id: number): Promise<ViewingRequest | undefined>;
  getViewingRequestsByProperty(propertyId: number): Promise<ViewingRequest[]>;
  getViewingRequestsByStatus(status: string): Promise<ViewingRequest[]>;
  getViewingRequestsByDate(date: Date): Promise<ViewingRequest[]>;
  createViewingRequest(request: InsertViewingRequest): Promise<ViewingRequest>;
  updateViewingRequest(id: number, request: Partial<ViewingRequest>): Promise<ViewingRequest | undefined>;
  createViewingCalendarEvent(requestId: number, eventData: InsertCalendarEvent): Promise<{ viewingRequest: ViewingRequest, calendarEvent: CalendarEvent }>;
  deleteViewingRequest(id: number): Promise<boolean>;
  
  // Virtual Viewing Session methods
  createVirtualViewingSession(session: InsertVirtualViewingSession): Promise<VirtualViewingSession>;
  getVirtualViewingSession(id: number): Promise<VirtualViewingSession | undefined>;
  getVirtualViewingSessionBySessionId(sessionId: string): Promise<VirtualViewingSession | undefined>;
  getVirtualViewingSessionsByProperty(propertyId: number): Promise<VirtualViewingSession[]>;
  getVirtualViewingSessionsByViewingRequest(viewingRequestId: number): Promise<VirtualViewingSession[]>;
  getVirtualViewingSessionsByHost(hostId: number): Promise<VirtualViewingSession[]>;
  updateVirtualViewingSession(id: number, sessionData: Partial<VirtualViewingSession>): Promise<VirtualViewingSession | undefined>;
  updateVirtualViewingSessionStatus(id: number, status: string): Promise<VirtualViewingSession | undefined>;
  addParticipantToSession(sessionId: number, participant: {
    userId?: number;
    name: string;
    email?: string;
    role: string;
  }): Promise<VirtualViewingSession | undefined>;
  updateParticipantStatus(sessionId: number, participantIndex: number, connectionStatus: string): Promise<VirtualViewingSession | undefined>;
  recordSessionQuestion(sessionId: number, question: {
    question: string;
    askedBy: string;
    timestamp: string;
  }): Promise<VirtualViewingSession | undefined>;
  recordTechnicalIssue(sessionId: number, issue: {
    issueType: string;
    description: string;
    timestamp: string;
  }): Promise<VirtualViewingSession | undefined>;
  requestFeedback(sessionId: number): Promise<VirtualViewingSession | undefined>;
  
  // Viewing Feedback methods
  createViewingFeedback(feedback: InsertViewingFeedback): Promise<ViewingFeedback>;
  getViewingFeedback(id: number): Promise<ViewingFeedback | undefined>;
  getViewingFeedbackByViewingRequest(viewingRequestId: number): Promise<ViewingFeedback | undefined>;
  getViewingFeedbackByProperty(propertyId: number): Promise<ViewingFeedback[]>;
  getViewingFeedbackByUser(userId: number): Promise<ViewingFeedback[]>;
  updateViewingFeedback(id: number, feedbackData: Partial<ViewingFeedback>): Promise<ViewingFeedback | undefined>;
  getPropertyFeedbackStats(propertyId: number): Promise<{
    averageOverallRating: number;
    averageConnectionQuality: number;
    averageAudioQuality: number;
    averageVideoQuality: number;
    totalFeedbackCount: number;
    interestedInApplyingCount: number;
  }>;
  
  // Marketplace methods
  getMarketplaceItem(id: number): Promise<MarketplaceItem | undefined>;
  getAllMarketplaceItems(filters?: {
    sellerId?: number;
    buyerId?: number;
    category?: string;
    status?: string;
    university?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    searchQuery?: string;
  }): Promise<MarketplaceItem[]>;
  getMarketplaceItemsByUser(userId: number): Promise<MarketplaceItem[]>;
  getFeaturedMarketplaceItems(): Promise<MarketplaceItem[]>;
  createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem>;
  updateMarketplaceItem(id: number, item: Partial<MarketplaceItem>): Promise<MarketplaceItem | undefined>;
  deleteMarketplaceItem(id: number): Promise<boolean>;
  markItemAsSold(id: number, buyerId: number): Promise<MarketplaceItem | undefined>;
  
  // Saved marketplace items methods
  getSavedMarketplaceItemsByUser(userId: number): Promise<SavedMarketplaceItem[]>;
  saveMarketplaceItem(data: InsertSavedMarketplaceItem): Promise<SavedMarketplaceItem>;
  unsaveMarketplaceItem(userId: number, itemId: number): Promise<boolean>;
  isSavedMarketplaceItem(userId: number, itemId: number): Promise<boolean>;
  
  // Marketplace message methods
  getMarketplaceMessage(id: number): Promise<MarketplaceMessage | undefined>;
  getMarketplaceMessagesByItem(itemId: number): Promise<MarketplaceMessage[]>;
  getMarketplaceMessagesByUser(userId: number): Promise<MarketplaceMessage[]>;
  getMarketplaceConversation(itemId: number, userId1: number, userId2: number): Promise<MarketplaceMessage[]>;
  createMarketplaceMessage(message: InsertMarketplaceMessage): Promise<MarketplaceMessage>;
  markMessageAsRead(id: number): Promise<MarketplaceMessage | undefined>;
  scanMessageWithAI(id: number): Promise<{ message: MarketplaceMessage, isSuspicious: boolean, reason?: string }>;
  
  // Marketplace offer methods
  createMarketplaceOffer(offer: InsertMarketplaceOffer): Promise<MarketplaceOffer>;
  getMarketplaceOffer(id: number): Promise<MarketplaceOffer | undefined>;
  getMarketplaceOffersByItem(itemId: number): Promise<MarketplaceOffer[]>;
  getMarketplaceOffersByBuyer(buyerId: number): Promise<MarketplaceOffer[]>;
  getMarketplaceOffersBySeller(sellerId: number): Promise<MarketplaceOffer[]>;
  getMarketplaceOffersByBuyerAndItem(buyerId: number, itemId: number): Promise<MarketplaceOffer[]>;
  updateMarketplaceOffer(id: number, offer: Partial<MarketplaceOffer>): Promise<MarketplaceOffer | undefined>;
  updateOfferStatus(id: number, status: string, message?: string): Promise<MarketplaceOffer | undefined>;
  deleteMarketplaceOffer(id: number): Promise<boolean>;
  
  // Marketplace transaction methods
  createMarketplaceTransaction(transaction: InsertMarketplaceTransaction): Promise<MarketplaceTransaction>;
  getMarketplaceTransaction(id: number): Promise<MarketplaceTransaction | undefined>;
  getMarketplaceTransactionsByItem(itemId: number): Promise<MarketplaceTransaction[]>;
  getMarketplaceTransactionsByBuyer(buyerId: number): Promise<MarketplaceTransaction[]>;
  getMarketplaceTransactionsBySeller(sellerId: number): Promise<MarketplaceTransaction[]>;
  updateMarketplaceTransaction(id: number, transaction: Partial<MarketplaceTransaction>): Promise<MarketplaceTransaction | undefined>;
  updateTransactionStatus(id: number, status: string, trackingNumber?: string): Promise<MarketplaceTransaction | undefined>;
  uploadDeliveryProof(id: number, imageUrl: string): Promise<MarketplaceTransaction | undefined>;
  deleteDeliveryProof(id: number, imageUrl: string): Promise<MarketplaceTransaction | undefined>;
  confirmDelivery(id: number): Promise<MarketplaceTransaction | undefined>;
  createDispute(id: number, reason: string): Promise<MarketplaceTransaction | undefined>;
  
  // Transaction message methods
  getTransactionMessage(id: number): Promise<TransactionMessage | undefined>;
  getTransactionMessagesByTransaction(transactionId: number): Promise<TransactionMessage[]>;
  createTransactionMessage(message: InsertTransactionMessage): Promise<TransactionMessage>;
  updateTransactionMessage(id: number, message: Partial<TransactionMessage>): Promise<TransactionMessage | undefined>;
  markTransactionMessageAsRead(id: number): Promise<TransactionMessage | undefined>;
  
  // Saved marketplace item methods
  getSavedMarketplaceItem(id: number): Promise<SavedMarketplaceItem | undefined>;
  getSavedMarketplaceItemsByUser(userId: number): Promise<SavedMarketplaceItem[]>;
  getSavedMarketplaceItemsByItem(itemId: number): Promise<SavedMarketplaceItem[]>;
  saveMarketplaceItem(data: InsertSavedMarketplaceItem): Promise<SavedMarketplaceItem>;
  unsaveMarketplaceItem(userId: number, itemId: number): Promise<boolean>;
  
  // Reported marketplace item methods
  getReportedMarketplaceItem(id: number): Promise<ReportedMarketplaceItem | undefined>;
  getReportedMarketplaceItemsByUser(userId: number): Promise<ReportedMarketplaceItem[]>;
  getReportedMarketplaceItemsByItem(itemId: number): Promise<ReportedMarketplaceItem[]>;
  getReportedMarketplaceItemsByStatus(status: string): Promise<ReportedMarketplaceItem[]>;
  reportMarketplaceItem(data: InsertReportedMarketplaceItem): Promise<ReportedMarketplaceItem>;
  updateReportedMarketplaceItemStatus(id: number, status: string, reviewerId: number, notes?: string): Promise<ReportedMarketplaceItem | undefined>;
  resolveDispute(id: number, resolution: string, favor: 'buyer' | 'seller'): Promise<MarketplaceTransaction | undefined>;
  
  // Marketplace dashboard methods
  getMarketplaceOffersByUser(userId: number, role?: 'buyer' | 'seller'): Promise<MarketplaceOffer[]>;
  getMarketplaceTransactionsByUser(userId: number, role?: 'buyer' | 'seller'): Promise<MarketplaceTransaction[]>;
  getMarketplaceMessageThreadsByUser(userId: number): Promise<any[]>;
  
  // Enhanced Marketplace methods
  searchMarketplaceItems(query: string): Promise<any[]>;
  getMarketplaceFraudAlerts(status?: string): Promise<any[]>;
  getMarketplaceFraudStats(): Promise<any>;
  processMarketplaceFraudAlert(alertId: number, action: 'resolve' | 'dismiss', reviewerId: number, note?: string): Promise<any>;
  getMarketplaceReviews(targetType: 'item' | 'user', targetId: number, sort?: string, ratingFilter?: number | null): Promise<any>;
  getMarketplaceReviewsWithUserReactions(targetType: 'item' | 'user', targetId: number, userId: number, sort?: string, ratingFilter?: number | null): Promise<any>;
  createMarketplaceReview(review: { targetId: number, targetType: 'item' | 'user', reviewerId: number, rating: number, title?: string, content: string, verifiedPurchase?: boolean }): Promise<any>;
  addImagesToMarketplaceReview(reviewId: number, imagePaths: string[]): Promise<any>;
  reactToMarketplaceReview(reviewId: number, userId: number, type: 'helpful' | 'unhelpful', value: boolean): Promise<any>;
  reportMarketplaceReview(reviewId: number, reporterId: number, reason: string): Promise<any>;
  
  // User helper methods
  getUsersByType(userType: string): Promise<User[]>;
  
  // Tenant Risk Assessment methods
  getTenantRiskAssessment(tenantId: number, applicationId?: number): Promise<TenantRiskAssessment | null>;
  getTenantRiskAssessmentsByTenant(tenantId: number): Promise<TenantRiskAssessment[]>;
  getRecentTenantRiskAssessments(limit?: number): Promise<TenantRiskAssessment[]>;
  createTenantRiskAssessment(assessment: InsertTenantRiskAssessment): Promise<TenantRiskAssessment>;
  saveTenantRiskAssessment(assessment: TenantRiskAssessment): Promise<TenantRiskAssessment>;

  // Fraud Alert methods
  createFraudAlert(alert: InsertFraudAlert): Promise<FraudAlert>;
  getFraudAlert(id: number): Promise<FraudAlert | undefined>;
  getFraudAlerts(options?: {
    userId?: number;
    userType?: string;
    activityType?: string;
    severity?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<FraudAlert[]>;
  getRecentFraudAlerts(limit?: number): Promise<FraudAlert[]>;
  getFraudAlertsByUser(userId: number): Promise<FraudAlert[]>;
  getFraudAlertsByActivityType(activityType: string): Promise<FraudAlert[]>;
  getFraudAlertsBySeverity(severity: string): Promise<FraudAlert[]>;
  getFraudAlertsByStatus(status: string): Promise<FraudAlert[]>;
  updateFraudAlertStatus(id: number, status: string, reviewedBy?: number, reviewNotes?: string): Promise<FraudAlert | undefined>;
  deleteFraudAlert(id: number): Promise<boolean>;
  getFraudStats(timeframe: 'day' | 'week' | 'month' | 'year'): Promise<any>;
  
  // User activity tracking methods
  getUserActivities(userId: number): Promise<any[]>;
  getUserActivitiesByType(userId: number, activityType: string): Promise<any[]>;
  // For simple activity logging
  logUserActivity(userId: number, activityType: string, activityData: Record<string, any>, ipAddress?: string, deviceInfo?: string): Promise<UserActivity>;
  
  // User Behavior Analytics methods
  getUserBehaviorAnalytics(userId: number): Promise<UserBehaviorAnalytic[]>;
  getUserBehaviorAnalyticsByType(userId: number, behaviorType: string): Promise<UserBehaviorAnalytic[]>;
  createUserBehaviorAnalytic(behavior: InsertUserBehaviorAnalytic): Promise<UserBehaviorAnalytic>;
  updateUserBehaviorAnalytic(id: number, data: Partial<UserBehaviorAnalytic>): Promise<UserBehaviorAnalytic | undefined>;
  getRecentUserBehaviors(limit?: number): Promise<UserBehaviorAnalytic[]>;
  getUserBehaviorPatterns(userId: number): Promise<any>; // Returns patterns found in user behavior
  
  // User Suggestions methods
  getUserSuggestions(userId: number): Promise<UserSuggestion[]>;
  getUserSuggestionsByType(userId: number, suggestionType: string): Promise<UserSuggestion[]>;
  getUserSuggestionById(id: number): Promise<UserSuggestion | undefined>;
  createUserSuggestion(suggestion: InsertUserSuggestion): Promise<UserSuggestion>;
  updateUserSuggestion(id: number, data: Partial<UserSuggestion>): Promise<UserSuggestion | undefined>;
  markSuggestionImpression(id: number): Promise<UserSuggestion | undefined>;
  markSuggestionClicked(id: number): Promise<UserSuggestion | undefined>;
  dismissSuggestion(id: number): Promise<UserSuggestion | undefined>;
  getActiveSuggestionsForUser(userId: number, limit?: number): Promise<UserSuggestion[]>;
  deleteExpiredSuggestions(): Promise<number>; // Returns count of deleted suggestions
  
  // Property Update Notification methods
  getPropertyUpdateNotifications(filters?: {
    propertyId?: number;
    recipientId?: number;
    status?: string;
    notificationType?: string;
  }): Promise<PropertyUpdateNotification[]>;
  getPropertyUpdateNotification(id: number): Promise<PropertyUpdateNotification | undefined>;
  createPropertyUpdateNotification(notification: InsertPropertyUpdateNotification): Promise<PropertyUpdateNotification>;
  updatePropertyUpdateNotification(id: number, notification: Partial<PropertyUpdateNotification>): Promise<PropertyUpdateNotification | undefined>;

  // City Images methods
  getAllCityImages(): Promise<CityImage[]>;
  getCityImage(id: number): Promise<CityImage | undefined>;
  getCityImageByCity(city: string): Promise<CityImage | undefined>;
  createCityImage(cityImage: InsertCityImage): Promise<CityImage>;
  updateCityImage(id: number, cityImage: Partial<CityImage>): Promise<CityImage | undefined>;
  deleteCityImage(id: number): Promise<boolean>;
  
  // Jobs Platform Methods
  // Employer methods
  getAllEmployers(): Promise<Employer[]>;
  getEmployer(id: number): Promise<Employer | undefined>;
  getEmployerByUserId(userId: number): Promise<Employer | undefined>;
  createEmployer(employer: InsertEmployer): Promise<Employer>;
  updateEmployer(id: number, employer: Partial<Employer>): Promise<Employer | undefined>;
  updateEmployerStatus(id: number, status: string): Promise<Employer | undefined>;
  deleteEmployer(id: number): Promise<boolean>;
  
  // Student Profile methods
  getStudentProfile(id: number): Promise<StudentProfile | undefined>;
  getStudentProfileByUserId(userId: number): Promise<StudentProfile | undefined>;
  createStudentProfile(profile: InsertStudentProfile): Promise<StudentProfile>;
  updateStudentProfile(id: number, profile: Partial<StudentProfile>): Promise<StudentProfile | undefined>;
  updateStudentProfileSkills(userId: number, skills: string[]): Promise<StudentProfile | undefined>;
  
  // Job methods
  getAllJobs(): Promise<Job[]>;
  getJobs(filters?: Record<string, any>): Promise<Job[]>; // New method to get filtered jobs
  getJob(id: number): Promise<Job | undefined>;
  getJobById(id: number): Promise<Job | undefined>; // Alias for getJob for consistency
  getJobsByEmployer(employerId: number): Promise<Job[]>;
  getJobsByStatus(status: string): Promise<Job[]>;
  getJobsByIndustry(industry: string): Promise<Job[]>;
  getJobsByLocation(location: string): Promise<Job[]>;
  getVerifiedJobs(): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<Job>): Promise<Job | undefined>;
  updateJobStatus(id: number, status: string): Promise<Job | undefined>;
  updateJobVerificationStatus(id: number, isVerified: boolean, score?: number, notes?: string): Promise<Job | undefined>;
  incrementJobViewCount(id: number): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;
  
  // Job Application methods
  getAllJobApplications(): Promise<JobApplication[]>;
  getJobApplication(id: number): Promise<JobApplication | undefined>;
  getJobApplicationById(id: number): Promise<JobApplication | undefined>; // Alias for getJobApplication for consistency
  getJobApplicationsByJob(jobId: number): Promise<JobApplication[]>;
  getJobApplications(jobId: number): Promise<JobApplication[]>; // Alias for getJobApplicationsByJob for consistency
  getJobApplicationsByStudent(studentId: number): Promise<JobApplication[]>;
  getStudentApplications(studentId: number): Promise<JobApplication[]>; // Alias for getJobApplicationsByStudent for consistency
  getStudentJobApplication(studentId: number, jobId: number): Promise<JobApplication | undefined>; // New method to check if a student already applied for a job
  getJobApplicationsByStatus(status: string): Promise<JobApplication[]>;
  getEmployerApplications(employerId: number): Promise<JobApplication[]>; // New method to get all applications for an employer's jobs
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  updateJobApplication(id: number, application: Partial<JobApplication>): Promise<JobApplication | undefined>;
  updateJobApplicationStatus(id: number, status: string): Promise<JobApplication | undefined>;
  deleteJobApplication(id: number): Promise<boolean>;
  
  // Job Interview methods
  getAllJobInterviews(): Promise<JobInterview[]>;
  getJobInterview(id: number): Promise<JobInterview | undefined>;
  getJobInterviewsByApplication(applicationId: number): Promise<JobInterview[]>;
  getJobInterviewsByEmployer(employerId: number): Promise<JobInterview[]>;
  getJobInterviewsByStudent(studentId: number): Promise<JobInterview[]>;
  createJobInterview(interview: InsertJobInterview): Promise<JobInterview>;
  updateJobInterview(id: number, interview: Partial<JobInterview>): Promise<JobInterview | undefined>;
  updateJobInterviewStatus(id: number, status: string): Promise<JobInterview | undefined>;
  deleteJobInterview(id: number): Promise<boolean>;
  
  // Job Skills methods
  getAllJobSkills(): Promise<JobSkill[]>;
  getJobSkill(id: number): Promise<JobSkill | undefined>;
  getJobSkillByName(name: string): Promise<JobSkill | undefined>;
  getJobSkillsByCategory(category: string): Promise<JobSkill[]>;
  createJobSkill(skill: InsertJobSkill): Promise<JobSkill>;
  updateJobSkill(id: number, skill: Partial<JobSkill>): Promise<JobSkill | undefined>;
  incrementJobSkillPopularity(id: number): Promise<JobSkill | undefined>;
  deleteJobSkill(id: number): Promise<boolean>;
  
  // Marketplace methods
  getAllMarketplaceItems(): Promise<MarketplaceItem[]>;
  getMarketplaceItem(id: number): Promise<MarketplaceItem | undefined>;
  getMarketplaceItemsByUser(userId: number): Promise<MarketplaceItem[]>;
  getMarketplaceItemsByCategory(category: string): Promise<MarketplaceItem[]>;
  createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem>;
  updateMarketplaceItem(id: number, item: Partial<MarketplaceItem>): Promise<MarketplaceItem | undefined>;
  deleteMarketplaceItem(id: number): Promise<boolean>;
  
  getAllMarketplaceMessages(): Promise<MarketplaceMessage[]>;
  getMarketplaceMessage(id: number): Promise<MarketplaceMessage | undefined>;
  getMarketplaceMessagesByItem(itemId: number): Promise<MarketplaceMessage[]>;
  getMarketplaceMessagesByUser(userId: number): Promise<MarketplaceMessage[]>;
  createMarketplaceMessage(message: InsertMarketplaceMessage): Promise<MarketplaceMessage>;
  deleteMarketplaceMessage(id: number): Promise<boolean>;
  

  
  updateTenantRiskAssessment(id: number, assessment: Partial<TenantRiskAssessment>): Promise<TenantRiskAssessment | null>;
  verifyTenantRiskAssessment(id: number, verifiedById: number): Promise<TenantRiskAssessment | null>;
  deleteTenantRiskAssessment(id: number): Promise<boolean>;
  
  // Financial Account methods
  getFinancialAccount(id: number): Promise<FinancialAccount | undefined>;
  getFinancialAccountsByUser(userId: number): Promise<FinancialAccount[]>;
  getDefaultFinancialAccount(userId: number, accountType: string): Promise<FinancialAccount | undefined>;
  createFinancialAccount(account: InsertFinancialAccount): Promise<FinancialAccount>;
  updateFinancialAccount(id: number, account: Partial<FinancialAccount>): Promise<FinancialAccount | undefined>;
  setDefaultFinancialAccount(id: number, userId: number): Promise<boolean>;
  deleteFinancialAccount(id: number): Promise<boolean>;
  
  // Financial Transaction methods
  getFinancialTransaction(id: number): Promise<FinancialTransaction | undefined>;
  getFinancialTransactionsByAccount(accountId: number): Promise<FinancialTransaction[]>;
  getFinancialTransactionsByProperty(propertyId: number): Promise<FinancialTransaction[]>;
  getFinancialTransactionsByDateRange(userId: number, startDate: Date, endDate: Date): Promise<FinancialTransaction[]>;
  getFinancialTransactionsByCategory(userId: number, category: string): Promise<FinancialTransaction[]>;
  createFinancialTransaction(transaction: InsertFinancialTransaction): Promise<FinancialTransaction>;
  updateFinancialTransaction(id: number, transaction: Partial<FinancialTransaction>): Promise<FinancialTransaction | undefined>;
  deleteFinancialTransaction(id: number): Promise<boolean>;
  
  // Financial Report methods
  getFinancialReport(id: number): Promise<FinancialReport | undefined>;
  getFinancialReportsByUser(userId: number): Promise<FinancialReport[]>;
  getFinancialReportsByType(userId: number, reportType: string): Promise<FinancialReport[]>;
  createFinancialReport(report: InsertFinancialReport): Promise<FinancialReport>;
  updateFinancialReport(id: number, report: Partial<FinancialReport>): Promise<FinancialReport | undefined>;
  deleteFinancialReport(id: number): Promise<boolean>;
  
  // Tax Information methods
  getTaxInformation(id: number): Promise<TaxInformation | undefined>;
  getTaxInformationByUser(userId: number): Promise<TaxInformation[]>;
  getTaxInformationByYear(userId: number, taxYear: string): Promise<TaxInformation | undefined>;
  createTaxInformation(taxInfo: InsertTaxInformation): Promise<TaxInformation>;
  updateTaxInformation(id: number, taxInfo: Partial<TaxInformation>): Promise<TaxInformation | undefined>;
  calculateTaxInformation(id: number): Promise<TaxInformation | undefined>;
  deleteTaxInformation(id: number): Promise<boolean>;
  
  // Property Finance methods
  getPropertyFinance(id: number): Promise<PropertyFinance | undefined>;
  getPropertyFinanceByProperty(propertyId: number): Promise<PropertyFinance | undefined>;
  createPropertyFinance(finance: InsertPropertyFinance): Promise<PropertyFinance>;
  updatePropertyFinance(id: number, finance: Partial<PropertyFinance>): Promise<PropertyFinance | undefined>;
  deletePropertyFinance(id: number): Promise<boolean>;
  
  // User Activity tracking methods for fraud detection
  getUserActivity(id: number): Promise<UserActivity | undefined>;
  getUserActivities(userId: number): Promise<UserActivity[]>;
  getUserActivitiesByType(userId: number, activityType: string): Promise<UserActivity[]>;
  getAllUserActivities(): Promise<UserActivity[]>;
  getRecentUserActivities(limit?: number): Promise<UserActivity[]>;
  getAllUsers(): Promise<User[]>;
  
  // Virtual Viewing Sessions
  createVirtualViewingSession(session: InsertVirtualViewingSession): Promise<VirtualViewingSession>;
  getVirtualViewingSession(id: number): Promise<VirtualViewingSession | undefined>;
  getVirtualViewingSessionBySessionId(sessionId: string): Promise<VirtualViewingSession | undefined>;
  getVirtualViewingSessionsByProperty(propertyId: number): Promise<VirtualViewingSession[]>;
  getVirtualViewingSessionsByViewingRequest(viewingRequestId: number): Promise<VirtualViewingSession[]>;
  getVirtualViewingSessionsByHost(hostId: number): Promise<VirtualViewingSession[]>;
  updateVirtualViewingSession(id: number, sessionData: Partial<VirtualViewingSession>): Promise<VirtualViewingSession | undefined>;
  updateVirtualViewingSessionStatus(id: number, status: string): Promise<VirtualViewingSession | undefined>;
  addParticipantToSession(sessionId: number, participant: {
    userId: number;
    name: string;
    role: string;
    connectionStatus?: string;
  }): Promise<VirtualViewingSession | undefined>;
  updateParticipantStatus(sessionId: number, participantIndex: number, connectionStatus: string): Promise<VirtualViewingSession | undefined>;
  removeParticipantFromSession(sessionId: number, participantIndex: number): Promise<VirtualViewingSession | undefined>;
  addMessageToSession(sessionId: number, message: {
    userId: number;
    name: string;
    text: string;
    timestamp?: Date;
  }): Promise<VirtualViewingSession | undefined>;
  requestFeedback(sessionId: number): Promise<VirtualViewingSession | undefined>;
  
  // Viewing Feedback
  createViewingFeedback(feedback: InsertViewingFeedback): Promise<ViewingFeedback>;
  getViewingFeedback(id: number): Promise<ViewingFeedback | undefined>;
  getViewingFeedbackByViewingRequest(viewingRequestId: number): Promise<ViewingFeedback | undefined>;
  getViewingFeedbackByProperty(propertyId: number): Promise<ViewingFeedback[]>;
  getViewingFeedbackByUser(userId: number): Promise<ViewingFeedback[]>;
  updateViewingFeedback(id: number, feedbackData: Partial<ViewingFeedback>): Promise<ViewingFeedback | undefined>;
  
  // Voucher Companies methods
  getVoucherCompanies(filters?: any): Promise<VoucherCompany[]>;
  getVoucherCompanyById(id: number): Promise<VoucherCompany | undefined>;
  createVoucherCompany(company: InsertVoucherCompany): Promise<VoucherCompany>;
  updateVoucherCompany(id: number, company: Partial<VoucherCompany>): Promise<VoucherCompany | undefined>;
  deleteVoucherCompany(id: number): Promise<boolean>;
  
  // Student Vouchers methods
  getStudentVouchers(filters?: any): Promise<StudentVoucher[]>;
  getStudentVoucherById(id: number): Promise<StudentVoucher | undefined>;
  getStudentVouchersByCompany(companyId: number): Promise<StudentVoucher[]>;
  getStudentVouchersByUser(userId: number): Promise<StudentVoucher[]>;
  createStudentVoucher(voucher: InsertStudentVoucher): Promise<StudentVoucher>;
  updateStudentVoucher(id: number, voucher: Partial<StudentVoucher>): Promise<StudentVoucher | undefined>;
  deleteStudentVoucher(id: number): Promise<boolean>;
  
  // Voucher Redemptions methods
  getVoucherRedemptions(): Promise<VoucherRedemption[]>;
  getVoucherRedemptionById(id: number): Promise<VoucherRedemption | undefined>;
  getVoucherRedemptionsByVoucher(voucherId: number): Promise<VoucherRedemption[]>;
  getVoucherRedemptionsByUser(userId: number, voucherId?: number): Promise<VoucherRedemption[]>;
  createVoucherRedemption(redemption: InsertVoucherRedemption): Promise<VoucherRedemption>;
  updateVoucherRedemption(id: number, redemption: Partial<VoucherRedemption>): Promise<VoucherRedemption | undefined>;
  
  // Voucher Bookings methods
  getVoucherBookings(): Promise<VoucherBooking[]>;
  getVoucherBookingById(id: number): Promise<VoucherBooking | undefined>;
  getVoucherBookingsByVoucher(voucherId: number): Promise<VoucherBooking[]>;
  getVoucherBookingsByUser(userId: number): Promise<VoucherBooking[]>;
  getVoucherBookingsByCompany(companyId: number): Promise<VoucherBooking[]>;
  createVoucherBooking(booking: InsertVoucherBooking): Promise<VoucherBooking>;
  updateVoucherBooking(id: number, booking: Partial<VoucherBooking>): Promise<VoucherBooking | undefined>;
  
  // Saved Vouchers methods
  getSavedVouchers(): Promise<SavedVoucher[]>;
  getSavedVoucherById(id: number): Promise<SavedVoucher | undefined>;
  getSavedVouchersByUser(userId: number): Promise<SavedVoucher[]>;
  getSavedVoucherByUserAndVoucher(userId: number, voucherId: number): Promise<SavedVoucher | undefined>;
  createSavedVoucher(savedVoucher: InsertSavedVoucher): Promise<SavedVoucher>;
  deleteSavedVoucher(id: number): Promise<boolean>;
  
  // Chat Conversations methods
  getChatConversations(): Promise<ChatConversation[]>;
  getChatConversationById(id: number): Promise<ChatConversation | undefined>;
  getChatConversationsByUser(userId: number): Promise<ChatConversation[]>;
  createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  updateChatConversation(id: number, conversation: Partial<ChatConversation>): Promise<ChatConversation | undefined>;
  deleteChatConversation(id: number): Promise<boolean>;
  
  // Chat Participants methods
  getChatParticipants(conversationId: number): Promise<ChatParticipant[]>;
  getChatParticipantById(id: number): Promise<ChatParticipant | undefined>;
  getChatParticipantsByUser(userId: number): Promise<ChatParticipant[]>;
  getChatParticipantByConversationAndUser(conversationId: number, userId: number): Promise<ChatParticipant | undefined>;
  createChatParticipant(participant: InsertChatParticipant): Promise<ChatParticipant>;
  updateChatParticipant(id: number, participant: Partial<ChatParticipant>): Promise<ChatParticipant | undefined>;
  removeChatParticipant(id: number): Promise<boolean>;
  
  // Chat Messages methods
  getChatMessages(conversationId: number): Promise<ChatMessage[]>;
  getChatMessageById(id: number): Promise<ChatMessage | undefined>;
  getChatMessagesByUser(userId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  updateChatMessage(id: number, message: Partial<ChatMessage>): Promise<ChatMessage | undefined>;
  deleteChatMessage(id: number): Promise<boolean>;
  
  // Chat Message Reactions methods
  getChatMessageReactions(messageId: number): Promise<ChatMessageReaction[]>;
  getChatMessageReactionById(id: number): Promise<ChatMessageReaction | undefined>;
  getChatMessageReactionsByUser(userId: number): Promise<ChatMessageReaction[]>;
  createChatMessageReaction(reaction: InsertChatMessageReaction): Promise<ChatMessageReaction>;
  deleteChatMessageReaction(id: number): Promise<boolean>;
  
  // PropertyCheck Pro Subscriptions methods
  getPropertyCheckProSubscriptions(): Promise<PropertyCheckProSubscription[]>;
  getPropertyCheckProSubscriptionById(id: number): Promise<PropertyCheckProSubscription | undefined>;
  getPropertyCheckProSubscriptionByUser(userId: number): Promise<PropertyCheckProSubscription | undefined>;
  createPropertyCheckProSubscription(subscription: InsertPropertyCheckProSubscription): Promise<PropertyCheckProSubscription>;
  updatePropertyCheckProSubscription(id: number, subscription: Partial<PropertyCheckProSubscription>): Promise<PropertyCheckProSubscription | undefined>;
  
  // Market Areas methods
  getMarketAreas(): Promise<MarketArea[]>;
  getMarketAreaById(id: number): Promise<MarketArea | undefined>;
  getMarketAreasByCity(cityId: number): Promise<MarketArea[]>;
  getMarketAreasByPostcode(postcode: string): Promise<MarketArea[]>;
  createMarketArea(area: InsertMarketArea): Promise<MarketArea>;
  updateMarketArea(id: number, area: Partial<MarketArea>): Promise<MarketArea | undefined>;
  
  // Property Market Data methods
  getPropertyMarketData(marketAreaId: number): Promise<PropertyMarketData[]>;
  getPropertyMarketDataById(id: number): Promise<PropertyMarketData | undefined>;
  getLatestPropertyMarketData(marketAreaId: number, propertyType: string, bedrooms: number): Promise<PropertyMarketData | undefined>;
  getPropertyMarketDataHistory(marketAreaId: number, propertyType: string, bedrooms: number): Promise<PropertyMarketData[]>;
  createPropertyMarketData(data: InsertPropertyMarketData): Promise<PropertyMarketData>;
  
  // Agent-specific methods
  getPropertiesByAgentId(agentId: number): Promise<Property[]>;
  getApplicationsByPropertyIds(propertyIds: number[]): Promise<Application[]>;
  getTenanciesByPropertyIds(propertyIds: number[]): Promise<Tenancy[]>;
  getMaintenanceRequestsByPropertyIds(propertyIds: number[]): Promise<MaintenanceRequest[]>;
  
  // Property Investment Recommendations methods
  getPropertyInvestmentRecommendations(userId: number): Promise<PropertyInvestmentRecommendation[]>;
  getPropertyInvestmentRecommendationById(id: number): Promise<PropertyInvestmentRecommendation | undefined>;
  createPropertyInvestmentRecommendation(recommendation: InsertPropertyInvestmentRecommendation): Promise<PropertyInvestmentRecommendation>;
  updatePropertyInvestmentRecommendation(id: number, recommendation: Partial<PropertyInvestmentRecommendation>): Promise<PropertyInvestmentRecommendation | undefined>;
  markPropertyInvestmentRecommendationViewed(id: number, userId: number): Promise<PropertyInvestmentRecommendation | undefined>;
  savePropertyInvestmentRecommendation(id: number, userId: number): Promise<PropertyInvestmentRecommendation | undefined>;
  unsavePropertyInvestmentRecommendation(id: number, userId: number): Promise<PropertyInvestmentRecommendation | undefined>;
}

export class MemStorage implements IStorage {
  // Property Keys Storage
  private keys: PropertyKey[] = [];
  private keyCurrentId: number = 1;
  private keyAssignments: KeyAssignmentHistory[] = [];
  private keyAssignmentCurrentId: number = 1;
  
  // Property Update Notifications Storage
  private propertyUpdateNotificationsData: Map<number, PropertyUpdateNotification> = new Map();
  private propertyUpdateNotificationCurrentId: number = 1;
  
  // City Images Storage
  private cityImagesData: Map<number, CityImage> = new Map();
  private cityImageCurrentId: number = 1;
  
  // Property Comparison Storage
  private propertyComparisonsData: Map<number, PropertyComparison> = new Map();
  private propertyComparisonCurrentId: number = 1;
  
  // Property Comparison Methods
  async getPropertyComparisons(userId: number): Promise<PropertyComparison[]> {
    const comparisons: PropertyComparison[] = [];
    for (const comparison of this.propertyComparisonsData.values()) {
      if (comparison.userId === userId) {
        comparisons.push(comparison);
      }
    }
    return comparisons;
  }
  
  async getPropertyComparison(id: number): Promise<PropertyComparison | undefined> {
    return this.propertyComparisonsData.get(id);
  }
  
  async getPropertyComparisonByShareToken(shareToken: string): Promise<PropertyComparison | undefined> {
    for (const comparison of this.propertyComparisonsData.values()) {
      if (comparison.shareToken === shareToken && comparison.isShared) {
        return comparison;
      }
    }
    return undefined;
  }
  
  async createPropertyComparison(comparison: InsertPropertyComparison): Promise<PropertyComparison> {
    const id = this.propertyComparisonCurrentId++;
    const now = new Date();
    const newComparison: PropertyComparison = {
      id,
      ...comparison,
      shareToken: null,
      createdAt: now,
      updatedAt: now
    };
    this.propertyComparisonsData.set(id, newComparison);
    return newComparison;
  }
  
  async updatePropertyComparison(id: number, comparisonData: Partial<PropertyComparison>): Promise<PropertyComparison | undefined> {
    const comparison = this.propertyComparisonsData.get(id);
    if (!comparison) return undefined;
    
    const updatedComparison = {
      ...comparison,
      ...comparisonData,
      updatedAt: new Date()
    };
    this.propertyComparisonsData.set(id, updatedComparison);
    return updatedComparison;
  }
  
  async deletePropertyComparison(id: number): Promise<boolean> {
    return this.propertyComparisonsData.delete(id);
  }
  
  async sharePropertyComparison(id: number, isShared: boolean): Promise<PropertyComparison | undefined> {
    const comparison = this.propertyComparisonsData.get(id);
    if (!comparison) return undefined;
    
    const shareToken = isShared ? 
      comparison.shareToken || this.generateShareToken() : 
      null;
    
    const updatedComparison = {
      ...comparison,
      isShared,
      shareToken,
      updatedAt: new Date()
    };
    this.propertyComparisonsData.set(id, updatedComparison);
    return updatedComparison;
  }
  
  private generateShareToken(): string {
    // Simple token generation - in a real app this would be more secure
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  // Utility Management Storage
  private utilityProvidersData: Map<number, UtilityProvider> = new Map();
  private utilityProviderCurrentId: number = 1;
  
  private utilityPlansData: Map<number, UtilityPlan> = new Map();
  private utilityPlanCurrentId: number = 1;
  
  private propertyUtilitiesData: Map<number, PropertyUtility> = new Map();
  private propertyUtilityCurrentId: number = 1;
  
  private utilitySwitchRequestsData: Map<number, UtilitySwitchRequest> = new Map();
  private utilitySwitchRequestCurrentId: number = 1;
  
  private utilityComparisonHistoryData: Map<number, UtilityComparisonHistory> = new Map();
  private utilityComparisonHistoryCurrentId: number = 1;
  
  // Student Vouchers Storage
  private voucherCompaniesData: Map<number, VoucherCompany> = new Map();
  private voucherCompanyCurrentId: number = 1;
  private studentVouchersData: Map<number, StudentVoucher> = new Map();
  private studentVoucherCurrentId: number = 1;
  private voucherRedemptionsData: Map<number, VoucherRedemption> = new Map();
  private voucherRedemptionCurrentId: number = 1;
  private voucherBookingsData: Map<number, VoucherBooking> = new Map();
  private voucherBookingCurrentId: number = 1;
  private savedVouchersData: Map<number, SavedVoucher> = new Map();
  private savedVoucherCurrentId: number = 1;
  
  // Chat Feature Storage
  private chatConversationsData: Map<number, ChatConversation> = new Map();
  private chatConversationCurrentId: number = 1;
  private chatParticipantsData: Map<number, ChatParticipant> = new Map();
  private chatParticipantCurrentId: number = 1;
  private chatMessagesData: Map<number, ChatMessage> = new Map();
  private chatMessageCurrentId: number = 1;
  private chatMessageReactionsData: Map<number, ChatMessageReaction> = new Map();
  private chatMessageReactionCurrentId: number = 1;
  
  // PropertyCheck Pro Storage
  private propertyCheckProSubscriptionsData: Map<number, PropertyCheckProSubscription> = new Map();
  private propertyCheckProSubscriptionCurrentId: number = 1;
  private marketAreasData: Map<number, MarketArea> = new Map();
  private marketAreaCurrentId: number = 1;
  private propertyMarketDataData: Map<number, PropertyMarketData> = new Map();
  private propertyMarketDataCurrentId: number = 1;
  private propertyInvestmentRecommendationsData: Map<number, PropertyInvestmentRecommendation> = new Map();
  private propertyInvestmentRecommendationCurrentId: number = 1;
  
  // Jobs Platform Storage
  private employersData: Map<number, Employer> = new Map();
  private employerCurrentId: number = 1;
  private studentProfilesData: Map<number, StudentProfile> = new Map();
  private studentProfileCurrentId: number = 1;
  private jobsData: Map<number, Job> = new Map();
  private jobCurrentId: number = 1;
  private jobApplicationsData: Map<number, JobApplication> = new Map();
  private jobApplicationCurrentId: number = 1;
  private jobInterviewsData: Map<number, JobInterview> = new Map();
  private jobInterviewCurrentId: number = 1;
  private jobSkillsData: Map<number, JobSkill> = new Map();
  private jobSkillCurrentId: number = 1;
  
  private usersData: Map<number, User>;
  private propertiesData: Map<number, Property>;
  private applicationsData: Map<number, Application>;
  private tenanciesData: Map<number, Tenancy>;
  private paymentsData: Map<number, Payment>;
  private verificationsData: Map<number, Verification>;
  private aiProvidersData: Map<number, AiProvider>;
  private maintenanceRequestsData: Map<number, MaintenanceRequest>;
  private maintenanceTemplatesData: Map<number, MaintenanceTemplate>;
  private contractorsData: Map<number, Contractor>;
  private calendarEventsData: Map<number, CalendarEvent>;
  private depositSchemeCredentialsData: Map<number, DepositSchemeCredentials>;
  private documentsData: Map<string, Document>;
  private tenantPreferencesData: Map<number, TenantPreferences>;
  private aiTargetingResultsData: Map<number, AiTargetingResults>;
  private propertyTenantMatchesData: Map<number, PropertyTenantMatch>;
  private tenantRiskAssessmentsData: Map<number, TenantRiskAssessment>;
  private groupApplicationMembersData: Map<number, GroupApplicationMember>;
  private viewingRequestsData: Map<number, ViewingRequest>;
  private viewingFeedbackData: Map<number, ViewingFeedback>;
  private virtualViewingSessionsData: Map<number, VirtualViewingSession>;
  
  // Marketplace data structures
  private marketplaceItemsData: Map<number, MarketplaceItem>;
  private marketplaceMessagesData: Map<number, MarketplaceMessage>;
  private marketplaceOffersData: Map<number, MarketplaceOffer>;
  private marketplaceTransactionsData: Map<number, MarketplaceTransaction>;
  private transactionMessagesData: Map<number, TransactionMessage>;
  private savedMarketplaceItemsData: Map<number, SavedMarketplaceItem>;
  private reportedMarketplaceItemsData: Map<number, ReportedMarketplaceItem>;
  
  // Enhanced Marketplace Storage
  private marketplaceReviewsData: Map<number, any>;
  private marketplaceReviewReactionsData: Map<string, any>; // userId-reviewId -> reaction
  private marketplaceReviewReportsData: Map<number, any>;
  private marketplaceFraudAlertsData: Map<number, any>;
  private marketplaceSearchHistoryData: Map<string, any>; // query -> search history
  
  // Short Videos Storage
  private shortVideosData: Map<number, ShortVideo>;
  private shortVideoCurrentId: number = 1;
  
  // UK Property Legislation Storage
  private ukPropertyLegislationData: Map<number, UkPropertyLegislation> = new Map();
  private ukPropertyLegislationCurrentId: number = 1;
  private userLegislationTrackingData: Map<number, UserLegislationTracking> = new Map();
  private userLegislationTrackingCurrentId: number = 1;
  
  private marketplaceItemCurrentId: number;
  private marketplaceMessageCurrentId: number;
  private marketplaceOfferCurrentId: number = 1;
  private marketplaceTransactionCurrentId: number = 1;
  private transactionMessageCurrentId: number = 1;
  private savedMarketplaceItemCurrentId: number = 1;
  private marketplaceReviewCurrentId: number = 1;
  private marketplaceReviewReportCurrentId: number = 1;
  private marketplaceFraudAlertCurrentId: number = 1;
  private reportedMarketplaceItemCurrentId: number = 1;
  
  // Accounting data structures
  private financialAccountsData: Map<number, FinancialAccount>;
  private financialTransactionsData: Map<number, FinancialTransaction>;
  private financialReportsData: Map<number, FinancialReport>;
  private taxInformationData: Map<number, TaxInformation>;
  private propertyFinancesData: Map<number, PropertyFinance>;
  private fraudAlertsData: Map<number, FraudAlert>;
  private userActivitiesData: Map<number, UserActivity>;
  private userBehaviorAnalyticsData: Map<number, UserBehaviorAnalytic>;
  private userSuggestionsData: Map<number, UserSuggestion>;
  private userActivityCurrentId: number;
  private userBehaviorAnalyticCurrentId: number;
  private userSuggestionCurrentId: number;
  private viewingRequestCurrentId: number;
  private viewingFeedbackCurrentId: number;
  private virtualViewingSessionCurrentId: number;
  
  private userCurrentId: number;
  private propertyCurrentId: number;
  private applicationCurrentId: number;
  private tenancyCurrentId: number;
  private paymentCurrentId: number;
  private verificationCurrentId: number;
  private aiProviderCurrentId: number;
  private maintenanceRequestCurrentId: number;
  private maintenanceTemplateCurrentId: number;
  private contractorCurrentId: number;
  private calendarEventCurrentId: number;
  private depositSchemeCredentialsCurrentId: number;
  private tenantPreferencesCurrentId: number;
  private aiTargetingResultsCurrentId: number;
  private propertyTenantMatchesCurrentId: number;
  private tenantRiskAssessmentCurrentId: number;
  private groupApplicationMemberCurrentId: number;
  
  // Accounting IDs
  private financialAccountCurrentId: number;
  private financialTransactionCurrentId: number;
  private financialReportCurrentId: number;
  private taxInformationCurrentId: number;
  private propertyFinanceCurrentId: number;
  private fraudAlertCurrentId: number;
  
  // Property Keys Management
  async getPropertyKeys(propertyId: number): Promise<PropertyKey[]> {
    return this.keys.filter(key => key.propertyId === propertyId);
  }
  
  async getPropertyKey(keyId: number): Promise<PropertyKey | undefined> {
    return this.keys.find(key => key.id === keyId);
  }
  
  async createPropertyKey(key: InsertPropertyKey): Promise<PropertyKey> {
    const newKey: PropertyKey = {
      id: this.keyCurrentId++,
      ...key,
      createdAt: new Date(),
      updatedAt: null,
    };
    this.keys.push(newKey);
    return newKey;
  }
  
  async updatePropertyKey(keyId: number, keyData: Partial<PropertyKey>): Promise<PropertyKey | undefined> {
    const keyIndex = this.keys.findIndex(key => key.id === keyId);
    if (keyIndex === -1) return undefined;
    
    const updatedKey = {
      ...this.keys[keyIndex],
      ...keyData,
      updatedAt: new Date()
    };
    this.keys[keyIndex] = updatedKey;
    return updatedKey;
  }
  
  async deletePropertyKey(keyId: number): Promise<boolean> {
    const keyIndex = this.keys.findIndex(key => key.id === keyId);
    if (keyIndex === -1) return false;
    
    this.keys.splice(keyIndex, 1);
    return true;
  }
  
  // Key Assignment History
  async getKeyAssignmentHistory(keyId: number): Promise<KeyAssignmentHistory[]> {
    return this.keyAssignments.filter(assignment => assignment.keyId === keyId);
  }
  
  async createKeyAssignment(assignment: InsertKeyAssignmentHistory): Promise<KeyAssignmentHistory> {
    const newAssignment: KeyAssignmentHistory = {
      id: this.keyAssignmentCurrentId++,
      ...assignment,
    };
    this.keyAssignments.push(newAssignment);
    
    // Update key status to assigned
    const keyIndex = this.keys.findIndex(key => key.id === assignment.keyId);
    if (keyIndex !== -1) {
      this.keys[keyIndex].status = 'assigned';
      this.keys[keyIndex].heldBy = assignment.assignedTo;
      this.keys[keyIndex].dateAssigned = assignment.assignedDate;
      this.keys[keyIndex].dateReturned = null;
    }
    
    return newAssignment;
  }
  
  async updateKeyAssignment(assignmentId: number, data: Partial<KeyAssignmentHistory>): Promise<KeyAssignmentHistory | undefined> {
    const assignmentIndex = this.keyAssignments.findIndex(assignment => assignment.id === assignmentId);
    if (assignmentIndex === -1) return undefined;
    
    const updatedAssignment = {
      ...this.keyAssignments[assignmentIndex],
      ...data,
    };
    this.keyAssignments[assignmentIndex] = updatedAssignment;
    
    // If a key is being returned, update the key status
    if (data.returnDate) {
      const keyId = this.keyAssignments[assignmentIndex].keyId;
      const keyIndex = this.keys.findIndex(key => key.id === keyId);
      if (keyIndex !== -1) {
        this.keys[keyIndex].status = 'available';
        this.keys[keyIndex].heldBy = null;
        this.keys[keyIndex].dateReturned = data.returnDate;
      }
    }
    
    return updatedAssignment;
  }
  
  private addSamplePropertyComparisons() {
    // Sample property comparisons for demonstration
    const samplePropertyComparisons: PropertyComparison[] = [
      {
        id: this.propertyComparisonCurrentId++,
        userId: 6, // Tenant user
        name: "London Student Flats Comparison",
        description: "Comparing potential student accommodations in London",
        propertyIds: [1, 2, 3],
        notes: {
          "1": "Great location, but a bit expensive",
          "2": "Best value for money, nice area",
          "3": "Furthest from campus, but most affordable"
        },
        isShared: true,
        shareToken: "abc123comparison",
        createdAt: new Date(new Date().setDate(new Date().getDate() - 5)),
        updatedAt: new Date(new Date().setDate(new Date().getDate() - 5))
      },
      {
        id: this.propertyComparisonCurrentId++,
        userId: 7, // Another tenant user
        name: "Leeds Properties Comparison",
        description: "Comparing potential properties near university",
        propertyIds: [4, 5],
        notes: {
          "4": "Modern property with all amenities",
          "5": "Cheaper option but needs some work"
        },
        isShared: false,
        shareToken: null,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
        updatedAt: new Date(new Date().setDate(new Date().getDate() - 1))
      },
      {
        id: this.propertyComparisonCurrentId++,
        userId: 6, // Tenant user
        name: "Private Comparison",
        description: "Private comparison of properties for next year",
        propertyIds: [2, 4, 6],
        notes: {
          "2": "Option 1 - close to university",
          "4": "Option 2 - more modern",
          "6": "Option 3 - good transport links"
        },
        isShared: false,
        shareToken: null,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 1)),
        updatedAt: new Date(new Date().setDate(new Date().getDate() - 1))
      }
    ];
    
    // Add each property comparison to the storage
    for (const comparison of samplePropertyComparisons) {
      this.propertyComparisonsData.set(comparison.id, comparison);
    }
  }

  private addSamplePropertyKeys() {
    // Sample property keys for demonstration
    const sampleKeys: PropertyKey[] = [
      // Property 1 keys
      {
        id: this.keyCurrentId++,
        propertyId: 1,
        keyType: 'front_door',
        keyCode: 'FD-001',
        keyLocation: 'office',
        heldBy: null,
        dateAssigned: null,
        dateReturned: null,
        notes: 'Main front door key',
        status: 'available',
        isOriginal: true,
        copiesAvailable: 2,
        createdAt: new Date(),
        updatedAt: null,
      },
      {
        id: this.keyCurrentId++,
        propertyId: 1,
        keyType: 'back_door',
        keyCode: 'BD-001',
        keyLocation: 'office',
        heldBy: null,
        dateAssigned: null,
        dateReturned: null,
        notes: 'Back door key',
        status: 'available',
        isOriginal: true,
        copiesAvailable: 1,
        createdAt: new Date(),
        updatedAt: null,
      },
      {
        id: this.keyCurrentId++,
        propertyId: 1,
        keyType: 'mailbox',
        keyCode: 'MB-001',
        keyLocation: 'with_tenant',
        heldBy: 6,
        dateAssigned: new Date(2024, 8, 15),
        dateReturned: null,
        notes: 'Mailbox key',
        status: 'assigned',
        isOriginal: true,
        copiesAvailable: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      
      // Property 2 keys
      {
        id: this.keyCurrentId++,
        propertyId: 2,
        keyType: 'front_door',
        keyCode: 'FD-002',
        keyLocation: 'office',
        heldBy: null,
        dateAssigned: null,
        dateReturned: null,
        notes: 'Main entrance key',
        status: 'available',
        isOriginal: true,
        copiesAvailable: 3,
        createdAt: new Date(),
        updatedAt: null,
      },
      {
        id: this.keyCurrentId++,
        propertyId: 2,
        keyType: 'bedroom',
        keyCode: 'BR1-002',
        keyLocation: 'with_tenant',
        heldBy: 7,
        dateAssigned: new Date(2024, 8, 5),
        dateReturned: null,
        notes: 'Bedroom 1 key',
        status: 'assigned',
        isOriginal: true,
        copiesAvailable: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      
      // Property 3 keys
      {
        id: this.keyCurrentId++,
        propertyId: 3,
        keyType: 'front_door',
        keyCode: 'FD-003',
        keyLocation: 'with_contractor',
        heldBy: 3,  // Contractor ID
        dateAssigned: new Date(2024, 8, 10),
        dateReturned: null,
        notes: 'Main door key - needs replacement',
        status: 'maintenance',
        isOriginal: true,
        copiesAvailable: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.keyCurrentId++,
        propertyId: 3,
        keyType: 'gate',
        keyCode: 'GT-003',
        keyLocation: 'office',
        heldBy: null,
        dateAssigned: null,
        dateReturned: null,
        notes: 'Garden gate key',
        status: 'available',
        isOriginal: true,
        copiesAvailable: 2,
        createdAt: new Date(),
        updatedAt: null,
      }
    ];
    
    // Sample key assignment history
    const sampleKeyAssignments: KeyAssignmentHistory[] = [
      {
        id: this.keyAssignmentCurrentId++,
        keyId: 3,  // Mailbox key for Property 1
        assignedTo: 6,  // Tenant ID
        assignedBy: 2,  // Landlord ID
        assignedDate: new Date(2024, 8, 15),
        returnDate: null,
        returnedTo: null,
        condition: 'good',
        notes: 'Assigned for duration of tenancy',
      },
      {
        id: this.keyAssignmentCurrentId++,
        keyId: 5,  // Bedroom key for Property 2
        assignedTo: 7,  // Tenant ID
        assignedBy: 4,  // Agent ID
        assignedDate: new Date(2024, 8, 5),
        returnDate: null,
        returnedTo: null,
        condition: 'good',
        notes: 'Assigned for duration of tenancy',
      },
      {
        id: this.keyAssignmentCurrentId++,
        keyId: 6,  // Front door key for Property 3
        assignedTo: 3,  // Contractor ID
        assignedBy: 4,  // Agent ID
        assignedDate: new Date(2024, 8, 10),
        returnDate: null,
        returnedTo: null,
        condition: 'good',
        notes: 'Assigned for lock replacement',
      },
      {
        id: this.keyAssignmentCurrentId++,
        keyId: 1,  // Front door key for Property 1
        assignedTo: 6,  // Tenant ID
        assignedBy: 2,  // Landlord ID
        assignedDate: new Date(2024, 7, 10),
        returnDate: new Date(2024, 7, 15),
        returnedTo: 2,
        condition: 'good',
        notes: 'Temporary assignment for property viewing',
      }
    ];
    
    // Add keys to storage
    for (const key of sampleKeys) {
      this.keys.push(key);
    }
    
    // Add key assignments to storage
    for (const assignment of sampleKeyAssignments) {
      this.keyAssignments.push(assignment);
    }
  }

  constructor() {
    this.usersData = new Map();
    this.propertiesData = new Map();
    this.applicationsData = new Map();
    this.tenanciesData = new Map();
    this.paymentsData = new Map();
    this.verificationsData = new Map();
    this.aiProvidersData = new Map();
    this.maintenanceRequestsData = new Map();
    this.maintenanceTemplatesData = new Map();
    this.contractorsData = new Map();
    this.calendarEventsData = new Map();
    this.depositSchemeCredentialsData = new Map();
    this.documentsData = new Map();
    this.tenantPreferencesData = new Map();
    this.aiTargetingResultsData = new Map();
    this.propertyTenantMatchesData = new Map();
    this.tenantRiskAssessmentsData = new Map();
    this.groupApplicationMembersData = new Map();
    this.viewingRequestsData = new Map();
    this.viewingFeedbackData = new Map();
    this.virtualViewingSessionsData = new Map();
    this.shortVideosData = new Map();
    
    // Initialize Student Vouchers data structures
    this.voucherCompaniesData = new Map();
    this.studentVouchersData = new Map();
    this.voucherRedemptionsData = new Map();
    this.voucherBookingsData = new Map();
    this.savedVouchersData = new Map();
    
    // Initialize Chat Feature data structures
    this.chatConversationsData = new Map();
    this.chatParticipantsData = new Map();
    this.chatMessagesData = new Map();
    this.chatMessageReactionsData = new Map();
    
    // Initialize PropertyCheck Pro data structures
    this.propertyCheckProSubscriptionsData = new Map();
    this.marketAreasData = new Map();
    this.propertyMarketDataData = new Map();
    this.propertyInvestmentRecommendationsData = new Map();
    
    // Initialize Jobs Platform data structures
    this.employersData = new Map();
    this.studentProfilesData = new Map();
    this.jobsData = new Map();
    this.jobApplicationsData = new Map();
    this.jobInterviewsData = new Map();
    this.jobSkillsData = new Map();
    
    // Initialize marketplace data structures
    this.marketplaceItemsData = new Map();
    this.marketplaceMessagesData = new Map();
    this.marketplaceOffersData = new Map();
    this.marketplaceTransactionsData = new Map();
    this.transactionMessagesData = new Map();
    this.savedMarketplaceItemsData = new Map();
    this.reportedMarketplaceItemsData = new Map();
    
    // Initialize enhanced marketplace data structures
    this.marketplaceReviewsData = new Map();
    this.marketplaceReviewReactionsData = new Map();
    this.marketplaceReviewReportsData = new Map();
    this.marketplaceFraudAlertsData = new Map();
    this.marketplaceSearchHistoryData = new Map();
    
    // Initialize accounting data structures
    this.financialAccountsData = new Map();
    this.financialTransactionsData = new Map();
    this.financialReportsData = new Map();
    this.taxInformationData = new Map();
    this.propertyFinancesData = new Map();
    this.fraudAlertsData = new Map();
    this.userActivitiesData = new Map();
    this.userBehaviorAnalyticsData = new Map();
    this.userSuggestionsData = new Map();
    this.userBehaviorAnalyticCurrentId = 1;
    this.userSuggestionCurrentId = 1;
    this.propertyUpdateNotificationsData = new Map();
    this.cityImagesData = new Map();
    
    // Initialize property key management data structures
    this.keys = [];
    this.keyAssignments = [];
    
    this.userCurrentId = 1;
    this.propertyCurrentId = 1;
    this.applicationCurrentId = 1;
    this.tenancyCurrentId = 1;
    this.paymentCurrentId = 1;
    this.verificationCurrentId = 1;
    this.aiProviderCurrentId = 1;
    this.maintenanceRequestCurrentId = 1;
    this.maintenanceTemplateCurrentId = 1;
    this.contractorCurrentId = 1;
    this.calendarEventCurrentId = 1;
    this.depositSchemeCredentialsCurrentId = 1;
    this.tenantPreferencesCurrentId = 1;
    this.aiTargetingResultsCurrentId = 1;
    this.propertyTenantMatchesCurrentId = 1;
    this.tenantRiskAssessmentCurrentId = 1;
    this.groupApplicationMemberCurrentId = 1;
    this.viewingRequestCurrentId = 1;
    this.viewingFeedbackCurrentId = 1;
    this.virtualViewingSessionCurrentId = 1;
    
    // Initialize marketplace IDs
    this.marketplaceItemCurrentId = 1;
    this.marketplaceMessageCurrentId = 1;
    this.marketplaceReviewCurrentId = 1;
    this.marketplaceReviewReportCurrentId = 1;
    this.marketplaceFraudAlertCurrentId = 1;
    
    // Initialize accounting IDs
    this.financialAccountCurrentId = 1;
    this.financialTransactionCurrentId = 1;
    this.financialReportCurrentId = 1;
    this.taxInformationCurrentId = 1;
    this.propertyFinanceCurrentId = 1;
    this.fraudAlertCurrentId = 1;
    this.userActivityCurrentId = 1;
    this.propertyUpdateNotificationCurrentId = 1;
    this.cityImageCurrentId = 1;
    this.keyCurrentId = 1;
    this.keyAssignmentCurrentId = 1;
    
    // Initialize Jobs Platform IDs
    this.employerCurrentId = 1;
    this.studentProfileCurrentId = 1;
    this.jobCurrentId = 1;
    this.jobApplicationCurrentId = 1;
    this.jobInterviewCurrentId = 1;
    this.jobSkillCurrentId = 1;
    
    // Add sample data
    this.addSampleUsers();
    this.addSampleProperties();
    this.addSampleAiProviders();
    this.addSampleContractors();
    this.addSampleVirtualViewingSessions();
    this.addSampleViewingFeedback();
    this.addSampleMaintenanceTemplates();
    this.addSampleMaintenanceRequests();
    this.addSampleTenancies();
    this.addSampleCalendarEvents();
    this.addSampleDepositSchemeCredentials();
    this.addSampleDocuments();
    this.addSampleTenantPreferences();
    this.addSampleAiTargetingResults();
    this.addSamplePropertyComparisons();
    this.addSampleFinancialAccounts();
    this.addSampleFinancialTransactions();
    this.addSampleFinancialReports();
    this.addSampleTaxInformation();
    this.addSamplePropertyFinances();
    this.addSampleFraudAlerts();
    this.addSampleUserActivities();
    this.addSamplePropertyKeys();
    this.addSampleViewingRequests();
    this.addSampleJobsData();
  }
  
  private addSampleJobsData() {
    // Sample employers
    const sampleEmployers: Employer[] = [
      {
        id: this.employerCurrentId++,
        name: "Leeds University",
        email: "careers@leeds.ac.uk",
        phone: "0113 222 3333",
        website: "https://www.leeds.ac.uk",
        industry: "Education",
        description: "One of the UK's leading research universities with a wide range of part-time job opportunities for students.",
        location: "Leeds",
        verified: true,
        logo: "https://example.com/leeds_university_logo.png",
        size: "1000+",
        foundedYear: "1904",
        verificationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.employerCurrentId++,
        name: "City Retail Group",
        email: "jobs@cityretail.com",
        phone: "0113 444 5555",
        website: "https://www.cityretail.com",
        industry: "Retail",
        description: "Leading retail group with stores across Leeds city center offering flexible hours for students.",
        location: "Leeds",
        verified: true,
        logo: "https://example.com/city_retail_logo.png",
        size: "500-1000",
        foundedYear: "1998",
        verificationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.employerCurrentId++,
        name: "TechStart Leeds",
        email: "careers@techstart.co.uk",
        phone: "0113 666 7777",
        website: "https://www.techstart.co.uk",
        industry: "Technology",
        description: "Tech startup incubator offering internships and part-time roles in software development and design.",
        location: "Leeds",
        verified: true,
        logo: "https://example.com/techstart_logo.png",
        size: "50-200",
        foundedYear: "2015",
        verificationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Sample job skills
    const sampleJobSkills: JobSkill[] = [
      {
        id: this.jobSkillCurrentId++,
        name: "JavaScript",
        category: "Programming",
        description: "Experience with JavaScript programming language and related frameworks.",
        popularityScore: 85,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.jobSkillCurrentId++,
        name: "Customer Service",
        category: "Soft Skills",
        description: "Experience in customer-facing roles and handling customer inquiries.",
        popularityScore: 90,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.jobSkillCurrentId++,
        name: "Research",
        category: "Academic",
        description: "Experience with academic or commercial research methodologies.",
        popularityScore: 65,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.jobSkillCurrentId++,
        name: "Data Analysis",
        category: "Technical",
        description: "Experience with analyzing data sets and creating reports.",
        popularityScore: 75,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.jobSkillCurrentId++,
        name: "Social Media",
        category: "Digital Marketing",
        description: "Experience managing social media accounts and campaigns.",
        popularityScore: 80,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Sample jobs
    const sampleJobs: Job[] = [
      {
        id: this.jobCurrentId++,
        title: "Student Ambassador",
        description: "Represent the university at open days and events. Help prospective students learn about university life and courses.",
        employerId: 1,
        location: "Leeds University Campus",
        jobType: "part_time",
        hours: "8-12 hours per week",
        rate: "£11.50 per hour",
        applicationDeadline: new Date(new Date().setDate(new Date().getDate() + 14)),
        startDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        requirements: ["Currently enrolled student", "Good communication skills", "Knowledge of university courses"],
        benefits: ["Flexible hours", "Valuable CV experience", "Training provided"],
        skillsRequired: [2, 5],
        status: "active",
        aiVerified: true,
        aiScore: 95,
        aiVerificationDetails: "Job posting analyzed and verified as legitimate student opportunity with appropriate safeguards.",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.jobCurrentId++,
        title: "Retail Sales Assistant",
        description: "Weekend and evening work in our busy city center store. Responsibilities include customer service, stock management, and cash handling.",
        employerId: 2,
        location: "Leeds City Center",
        jobType: "part_time",
        hours: "12-16 hours per week",
        rate: "£10.75 per hour",
        applicationDeadline: new Date(new Date().setDate(new Date().getDate() + 7)),
        startDate: new Date(new Date().setDate(new Date().getDate() + 21)),
        requirements: ["Retail experience preferred but not essential", "Good communication skills", "Available weekends"],
        benefits: ["Staff discount", "Flexible rota", "Career progression opportunities"],
        skillsRequired: [2],
        status: "active",
        aiVerified: true,
        aiScore: 92,
        aiVerificationDetails: "Verified as legitimate retail opportunity with standard industry terms.",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.jobCurrentId++,
        title: "Junior Web Developer (Part-time)",
        description: "Join our growing tech team working on exciting web projects. Ideal for Computer Science students looking to gain industry experience alongside their studies.",
        employerId: 3,
        location: "Leeds Innovation Center",
        jobType: "part_time",
        hours: "15-20 hours per week",
        rate: "£14.50 per hour",
        applicationDeadline: new Date(new Date().setDate(new Date().getDate() + 21)),
        startDate: new Date(new Date().setDate(new Date().getDate() + 40)),
        requirements: ["Experience with HTML, CSS, JavaScript", "Knowledge of React or similar frontend frameworks", "Currently studying Computer Science or related subject"],
        benefits: ["Remote work options", "Flexible hours around studies", "Real project experience", "Potential for full-time role after graduation"],
        skillsRequired: [1, 4],
        status: "active",
        aiVerified: true,
        aiScore: 98,
        aiVerificationDetails: "Verified as legitimate tech opportunity with appropriate skill requirements for student developers.",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.jobCurrentId++,
        title: "Research Assistant",
        description: "Support ongoing research projects in the Department of Environmental Science. Tasks include data collection, literature reviews, and basic laboratory work.",
        employerId: 1,
        location: "Leeds University Science Building",
        jobType: "part_time",
        hours: "10 hours per week",
        rate: "£12.25 per hour",
        applicationDeadline: new Date(new Date().setDate(new Date().getDate() + 10)),
        startDate: new Date(new Date().setDate(new Date().getDate() + 25)),
        requirements: ["Currently enrolled in Environmental Science or related field", "Basic laboratory skills", "Good attention to detail"],
        benefits: ["Academic experience", "Potential for dissertation collaboration", "Flexible scheduling around classes"],
        skillsRequired: [3, 4],
        status: "active",
        aiVerified: true,
        aiScore: 96,
        aiVerificationDetails: "Verified as legitimate academic research position with appropriate safeguards and requirements.",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Sample student profiles (extending existing users)
    const sampleStudentProfiles: StudentProfile[] = [
      {
        id: this.studentProfileCurrentId++,
        userId: 6, // Using existing tenant user
        university: "University of Leeds",
        course: "Computer Science",
        yearOfStudy: 2,
        skills: [1, 4, 5],
        workExperience: [
          {
            title: "Intern Developer",
            company: "TechStart",
            startDate: new Date(2024, 5, 1),
            endDate: new Date(2024, 7, 31),
            description: "Summer internship developing web applications"
          }
        ],
        availability: {
          monday: ["afternoon", "evening"],
          tuesday: ["afternoon"],
          wednesday: ["morning", "evening"],
          thursday: ["afternoon", "evening"],
          friday: ["morning"],
          saturday: ["all_day"],
          sunday: ["all_day"]
        },
        preferredJobTypes: ["part_time", "internship"],
        preferredLocations: ["Leeds City Center", "Leeds University Campus"],
        cv: "path/to/user6_cv.pdf",
        bio: "Second-year Computer Science student with interest in web development and data analysis. Looking for part-time work that can fit around my studies.",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.studentProfileCurrentId++,
        userId: 7, // Using existing tenant user
        university: "Leeds Beckett University",
        course: "Business Management",
        yearOfStudy: 3,
        skills: [2, 5],
        workExperience: [
          {
            title: "Retail Assistant",
            company: "High Street Clothing",
            startDate: new Date(2023, 9, 1),
            endDate: new Date(2024, 2, 28),
            description: "Part-time retail position handling customer service and stock management"
          }
        ],
        availability: {
          monday: ["evening"],
          tuesday: ["evening"],
          wednesday: ["afternoon", "evening"],
          thursday: ["morning"],
          friday: ["afternoon", "evening"],
          saturday: ["morning", "afternoon"],
          sunday: ["all_day"]
        },
        preferredJobTypes: ["part_time"],
        preferredLocations: ["Leeds City Center"],
        cv: "path/to/user7_cv.pdf",
        bio: "Final year Business Management student with customer service experience. Looking for part-time work in retail or hospitality.",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Sample job applications
    const sampleJobApplications: JobApplication[] = [
      {
        id: this.jobApplicationCurrentId++,
        jobId: 1,
        studentId: 1,
        status: "applied",
        appliedDate: new Date(new Date().setDate(new Date().getDate() - 5)),
        coverLetter: "I am very interested in this Student Ambassador role as I enjoy helping others and have good knowledge of university programs.",
        resume: "path/to/user6_cv.pdf",
        aiRecommendationScore: 87,
        aiRecommendationReason: "Good communication skills, Available hours match job requirements",
        employerNotes: "Contacted for interview",
        updatedAt: new Date()
      },
      {
        id: this.jobApplicationCurrentId++,
        jobId: 2,
        studentId: 2,
        status: "interview_scheduled",
        appliedDate: new Date(new Date().setDate(new Date().getDate() - 7)),
        coverLetter: "I have previous retail experience and am available for the weekend hours required for this position.",
        resume: "path/to/user7_cv.pdf",
        aiRecommendationScore: 92,
        aiRecommendationReason: "Previous retail experience, Weekend availability",
        employerNotes: "Good candidate with relevant experience",
        interviewDate: new Date(new Date().setDate(new Date().getDate() + 2)),
        updatedAt: new Date()
      }
    ];
    
    // Sample job interviews
    const sampleJobInterviews: JobInterview[] = [
      {
        id: this.jobInterviewCurrentId++,
        applicationId: 2,
        type: "in_person",
        location: "City Retail Group - Leeds Store",
        interviewers: [
          { name: "Sarah Thompson", role: "Store Manager" }
        ],
        status: "scheduled",
        notes: "Candidate should bring ID and proof of right to work",
        questions: [
          "Tell us about your previous retail experience",
          "How would you handle a difficult customer?",
          "What are your availability preferences?"
        ],
        duration: 30,
        scheduledFor: new Date(new Date().setDate(new Date().getDate() + 2)),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Add all sample data to storage
    for (const employer of sampleEmployers) {
      this.employersData.set(employer.id, employer);
    }
    
    for (const skill of sampleJobSkills) {
      this.jobSkillsData.set(skill.id, skill);
    }
    
    for (const job of sampleJobs) {
      this.jobsData.set(job.id, job);
    }
    
    for (const profile of sampleStudentProfiles) {
      this.studentProfilesData.set(profile.id, profile);
    }
    
    for (const application of sampleJobApplications) {
      this.jobApplicationsData.set(application.id, application);
    }
    
    for (const interview of sampleJobInterviews) {
      this.jobInterviewsData.set(interview.id, interview);
    }
  }
  
  private addSampleAiProviders() {
    // Sample AI provider - ONLY using Google Gemini as per requirements
    const sampleProviders: AiProvider[] = [
      {
        id: this.aiProviderCurrentId++,
        name: 'gemini',
        displayName: 'Google Gemini',
        active: true,
        priority: 1,
        status: 'active',
        capabilities: ['text', 'image', 'chat'],
        errorMessage: null,
        lastChecked: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    // Add each AI provider to the storage
    for (const provider of sampleProviders) {
      this.aiProvidersData.set(provider.id, provider);
    }
  }
  
  private addSampleUsers() {
    // Sample users for testing with consistent credentials
    const sampleUsers: User[] = [
      // Admin user
      {
        id: this.userCurrentId++,
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Password123!',
        userType: 'admin',
        phone: '07700900000',
        verified: true,
        profileImage: null,
        createdAt: new Date(),
      },
      // Landlord users
      {
        id: this.userCurrentId++,
        name: 'John Smith (Landlord)',
        email: 'landlord@example.com',
        password: 'Password123!',
        userType: 'landlord',
        phone: '07700900001',
        verified: true,
        profileImage: null,
        createdAt: new Date(),
      },
      {
        id: this.userCurrentId++,
        name: 'Sarah Johnson (Landlord)',
        email: 'sarah@example.com',
        password: 'Password123!',
        userType: 'landlord',
        phone: '07700900101',
        verified: true,
        profileImage: null,
        createdAt: new Date(),
      },
      // Agent users
      {
        id: this.userCurrentId++,
        name: 'Michael Brown (Agent)',
        email: 'agent@example.com',
        password: 'Password123!',
        userType: 'agent',
        phone: '07700900002',
        verified: true,
        profileImage: null,
        createdAt: new Date(),
      },
      {
        id: this.userCurrentId++,
        name: 'Emma Davis (Agent)',
        email: 'emma@example.com',
        password: 'Password123!',
        userType: 'agent',
        phone: '07700900202',
        verified: true,
        profileImage: null,
        createdAt: new Date(),
      },
      // Tenant users
      {
        id: this.userCurrentId++,
        name: 'Alex Wilson (Tenant)',
        email: 'tenant@example.com',
        password: 'Password123!',
        userType: 'tenant',
        phone: '07700900003',
        verified: true,
        profileImage: null,
        createdAt: new Date(),
      },
      {
        id: this.userCurrentId++,
        name: 'Olivia Taylor (Tenant)',
        email: 'olivia@example.com',
        password: 'Password123!',
        userType: 'tenant',
        phone: '07700900303',
        verified: true,
        profileImage: null,
        createdAt: new Date(),
      },
    ];
    
    // Add users to the storage
    for (const user of sampleUsers) {
      this.usersData.set(user.id, user);
    }
  }
  
  private addSampleContractors() {
    // Sample contractors for demonstration
    const sampleContractors: Contractor[] = [
      {
        id: this.contractorCurrentId++,
        name: 'Leeds Plumbing Solutions',
        email: 'info@leedsplumbing.com',
        phone: '0113 123 4567',
        address: '123 Plumber Lane, Leeds, LS1 9AB',
        companyName: 'Leeds Plumbing Solutions Ltd',
        website: 'https://www.leedsplumbing.com',
        services: ['Plumbing', 'Heating', 'Boiler Repair'],
        serviceAreas: ['Leeds', 'Bradford', 'Wakefield'],
        rating: 4.8,
        availableTimes: 'Monday-Friday: 8am-6pm, Weekends: Emergency only',
        specialities: ['Emergency Repairs', 'Boiler Installation', 'Bathroom Fitting'],
        insuranceProvider: 'Contractor Cover Ltd',
        insuranceExpiryDate: new Date('2026-05-15'),
        hourlyRate: '£60',
        calloutFee: '£40',
        vatRegistered: true,
        notes: 'Reliable and efficient service, preferred contractor for emergency plumbing issues.',
        profileImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop',
        qualifications: ['Gas Safe Registered', 'City & Guilds Plumbing', 'Water Regulations Certificate'],
        verified: true,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        documentsUrls: ['https://example.com/gas-safe-cert.pdf', 'https://example.com/insurance-cert.pdf']
      },
      {
        id: this.contractorCurrentId++,
        name: 'Yorkshire Electrical Services',
        email: 'contact@yorkshireelectrical.co.uk',
        phone: '0113 987 6543',
        address: '45 Spark Street, Leeds, LS2 7CD',
        companyName: 'Yorkshire Electrical Services Ltd',
        website: 'https://www.yorkshireelectrical.co.uk',
        services: ['Electrical Installation', 'Electrical Testing', 'Emergency Repairs', 'Smart Home Installation'],
        serviceAreas: ['Leeds', 'York', 'Harrogate', 'Sheffield'],
        rating: 4.9,
        availableTimes: 'Monday-Saturday: 7am-7pm, Sunday: Emergency only',
        specialities: ['Student HMO Compliance', 'Rewiring', 'Smart Home Systems'],
        insuranceProvider: 'ElectroCover Insurance',
        insuranceExpiryDate: new Date('2025-12-10'),
        hourlyRate: '£55',
        calloutFee: '£45',
        vatRegistered: true,
        notes: 'Specialized in student property electrical compliance work.',
        profileImage: 'https://images.unsplash.com/photo-1621905252507-b35492cc74f4?q=80&w=2069&auto=format&fit=crop',
        qualifications: ['NICEIC Registered', '18th Edition Wiring Regulations', 'City & Guilds Electrical Installation'],
        verified: true,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        documentsUrls: ['https://example.com/niceic-cert.pdf', 'https://example.com/electrical-insurance.pdf']
      },
      {
        id: this.contractorCurrentId++,
        name: 'Student Locks & Security',
        email: 'info@studentlocks.co.uk',
        phone: '0113 567 8901',
        address: '78 Key Road, Leeds, LS3 8EF',
        companyName: 'Student Locks & Security',
        website: 'https://www.studentlocks.co.uk',
        services: ['Lock Replacement', 'Key Cutting', 'Security System Installation', 'Door Repairs'],
        serviceAreas: ['Leeds', 'Bradford', 'Huddersfield'],
        rating: 4.7,
        availableTimes: '24/7 Emergency Service',
        specialities: ['Student Property Security', 'Smart Lock Installation', 'HMO Compliance Locks'],
        insuranceProvider: 'LockSafe Insurance',
        insuranceExpiryDate: new Date('2026-01-20'),
        hourlyRate: '£50',
        calloutFee: '£35',
        vatRegistered: false,
        notes: 'Fast response times, specializes in student properties.',
        profileImage: 'https://images.unsplash.com/photo-1558002038-1055cc8b0707?q=80&w=2070&auto=format&fit=crop',
        qualifications: ['Master Locksmith Association', 'Security Systems Installation'],
        verified: true,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        documentsUrls: ['https://example.com/locksmith-cert.pdf']
      }
    ];
    
    // Add contractors to storage
    for (const contractor of sampleContractors) {
      this.contractorsData.set(contractor.id, contractor);
    }
  }
  
  private addSampleMaintenanceTemplates() {
    // Sample maintenance templates
    const sampleTemplates: MaintenanceTemplate[] = [
      {
        id: this.maintenanceTemplateCurrentId++,
        title: 'Annual Gas Safety Check',
        description: 'Mandatory annual gas safety inspection and certification for all properties with gas appliances.',
        category: 'Safety Compliance',
        season: 'All Year',
        priority: 'High',
        estimatedCost: '£80-120',
        estimatedTime: '1-2 hours',
        frequency: 'Annual',
        requiredQualifications: ['Gas Safe Registered'],
        steps: [
          'Check all gas appliances for safety',
          'Test for gas leaks',
          'Verify proper ventilation',
          'Check CO detectors',
          'Issue Gas Safety Certificate'
        ],
        materials: ['New parts if required'],
        notes: 'Legal requirement for all rental properties with gas appliances. Must be completed annually.',
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.maintenanceTemplateCurrentId++,
        title: 'Electrical Installation Condition Report (EICR)',
        description: 'Mandatory electrical safety inspection required every 5 years for rental properties.',
        category: 'Safety Compliance',
        season: 'All Year',
        priority: 'High',
        estimatedCost: '£150-300',
        estimatedTime: '3-5 hours',
        frequency: '5 Years',
        requiredQualifications: ['NICEIC Registered', '18th Edition Qualified'],
        steps: [
          'Visual inspection of electrical installation',
          'Testing of circuits',
          'Check consumer unit/fuse board',
          'Test RCDs and breakers',
          'Identify any categories of danger (C1, C2, C3)',
          'Issue EICR certificate'
        ],
        materials: ['Replacement parts if required'],
        notes: 'Legal requirement for rental properties. New regulations require this every 5 years.',
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.maintenanceTemplateCurrentId++,
        title: 'End of Tenancy Deep Clean',
        description: 'Comprehensive cleaning service between tenancies to prepare property for new tenants.',
        category: 'Cleaning',
        season: 'Summer',
        priority: 'Medium',
        estimatedCost: '£15-20 per hour',
        estimatedTime: '6-8 hours',
        frequency: 'Per Tenancy Change',
        requiredQualifications: [],
        steps: [
          'Deep clean kitchen including appliances',
          'Clean bathrooms including descaling',
          'Vacuum and mop all floors',
          'Clean windows internally',
          'Dust all surfaces',
          'Clean inside cupboards',
          'Remove all waste'
        ],
        materials: [
          'Professional cleaning products',
          'Vacuum cleaner',
          'Mop and bucket',
          'Cleaning cloths',
          'Oven cleaner'
        ],
        notes: 'Best scheduled immediately after previous tenants vacate. Takes 1 day with a team of 2-3 cleaners.',
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.maintenanceTemplateCurrentId++,
        title: 'Boiler Service',
        description: 'Regular maintenance of the property boiler to ensure efficient operation and safety.',
        category: 'Heating',
        season: 'Autumn',
        priority: 'Medium',
        estimatedCost: '£80-100',
        estimatedTime: '1-2 hours',
        frequency: 'Annual',
        requiredQualifications: ['Gas Safe Registered'],
        steps: [
          'Visual inspection of boiler',
          'Check for leaks and corrosion',
          'Test flue for emissions',
          'Check gas pressure',
          'Clean components',
          'Test operation and safety features'
        ],
        materials: ['Replacement parts if required'],
        notes: 'Best scheduled before winter months. Helps prevent emergency callouts during cold weather.',
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.maintenanceTemplateCurrentId++,
        title: 'Garden Maintenance',
        description: 'Regular maintenance of garden areas to keep them tidy and usable.',
        category: 'External',
        season: 'Spring,Summer',
        priority: 'Low',
        estimatedCost: '£50-80',
        estimatedTime: '2-4 hours',
        frequency: 'Monthly (growing season)',
        requiredQualifications: [],
        steps: [
          'Lawn mowing',
          'Hedge trimming',
          'Weeding flower beds and paths',
          'Clearing leaves and debris',
          'General tidy up'
        ],
        materials: [
          'Lawn mower',
          'Hedge trimmer',
          'Garden waste bags',
          'Gardening gloves'
        ],
        notes: 'Most important during growing season (April-September). Consider quarterly during winter months.',
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Add templates to storage
    for (const template of sampleTemplates) {
      this.maintenanceTemplatesData.set(template.id, template);
    }
  }
  
  private addSampleMaintenanceRequests() {
    // Sample maintenance requests
    const sampleRequests: MaintenanceRequest[] = [
      {
        id: this.maintenanceRequestCurrentId++,
        title: 'Broken Boiler - No Heating',
        description: 'The boiler has stopped working completely. No heating or hot water in the property.',
        status: 'in-progress',
        priority: 'high',
        category: 'heating',
        propertyId: 1,
        tenantId: 4,
        reportedDate: new Date(2025, 2, 15),
        estimatedCost: '320',
        scheduledDate: new Date(2025, 2, 16),
        requiresLandlordApproval: true,
        landlordApproved: true,
        assignedContractorId: 1,
      },
      {
        id: this.maintenanceRequestCurrentId++,
        title: 'Leaking Kitchen Sink',
        description: 'The kitchen sink has a slow leak under the cabinet. There is water damage to the cabinet floor.',
        status: 'pending',
        priority: 'medium',
        category: 'plumbing',
        propertyId: 2,
        tenantId: 5,
        reportedDate: new Date(2025, 3, 1),
        estimatedCost: '150',
        requiresLandlordApproval: false,
      },
      {
        id: this.maintenanceRequestCurrentId++,
        title: 'Broken Window - Bedroom',
        description: 'The window in the main bedroom has a crack and doesn\'t close properly. It\'s letting in cold air.',
        status: 'scheduled',
        priority: 'medium',
        category: 'structural',
        propertyId: 3,
        tenantId: 6,
        reportedDate: new Date(2025, 3, 10),
        scheduledDate: new Date(2025, 3, 17),
        estimatedCost: '220',
        requiresLandlordApproval: true,
        landlordApproved: true,
      },
      {
        id: this.maintenanceRequestCurrentId++,
        title: 'Electrical Issue - No Power in Kitchen',
        description: 'The power outlets in the kitchen have stopped working. The fuse box shows no issues.',
        status: 'completed',
        priority: 'high',
        category: 'electrical',
        propertyId: 1,
        tenantId: 4,
        reportedDate: new Date(2025, 2, 5),
        scheduledDate: new Date(2025, 2, 6),
        completedDate: new Date(2025, 2, 7),
        estimatedCost: '180',
        actualCost: '150',
        requiresLandlordApproval: false,
        assignedContractorId: 2,
      },
      {
        id: this.maintenanceRequestCurrentId++,
        title: 'Washing Machine Repair',
        description: 'The washing machine is making a loud noise during the spin cycle and sometimes stops mid-cycle.',
        status: 'pending',
        priority: 'low',
        category: 'appliance',
        propertyId: 2,
        tenantId: 5,
        assignedContractorId: 1,
        reportedDate: new Date('2025-01-15'),
        scheduledDate: new Date('2025-01-16'),
        completedDate: null,
        estimatedCost: '£200',
        actualCost: null,
        images: ['https://images.unsplash.com/photo-1621905252507-b35492cc74f4?q=80&w=2069&auto=format&fit=crop'],
        notes: 'Emergency callout required. Tenants using electric heaters temporarily.',
        internalNotes: 'May need new part - contractor advised will take 1-2 days for delivery if required.',
        receipts: [],
        invoiceUrl: null,
        receiptUrl: null,
        feedback: null,
        rating: null,
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-16')
      },
      {
        id: this.maintenanceRequestCurrentId++,
        title: 'Leaking Tap in Kitchen',
        description: 'The kitchen sink has a constant slow drip from the cold tap.',
        status: 'completed',
        priority: 'Low',
        category: 'Plumbing',
        propertyId: 2,
        tenantId: 4,
        assignedContractorId: 1,
        reportedDate: new Date('2024-12-10'),
        scheduledDate: new Date('2024-12-15'),
        completedDate: new Date('2024-12-15'),
        estimatedCost: '£60',
        actualCost: '£55',
        images: ['https://images.unsplash.com/photo-1601184953839-6cbc0e708f32?q=80&w=2070&auto=format&fit=crop'],
        notes: 'Tap washer needs replacing.',
        internalNotes: 'Simple fix completed in single visit.',
        receipts: ['https://example.com/receipt1234.pdf'],
        invoiceUrl: 'https://example.com/invoice1234.pdf',
        receiptUrl: 'https://example.com/receipt1234.pdf',
        feedback: 'Quick and efficient service. No more dripping!',
        rating: 5,
        createdAt: new Date('2024-12-10'),
        updatedAt: new Date('2024-12-15')
      },
      {
        id: this.maintenanceRequestCurrentId++,
        title: 'Electrical Socket Not Working',
        description: 'The socket in the living room next to the TV has stopped working.',
        status: 'scheduled',
        priority: 'Medium',
        category: 'Electrical',
        propertyId: 3,
        tenantId: 4,
        assignedContractorId: 2,
        reportedDate: new Date('2025-01-20'),
        scheduledDate: new Date('2025-01-25'),
        completedDate: null,
        estimatedCost: '£70',
        actualCost: null,
        images: ['https://images.unsplash.com/photo-1558002038-1055cc8b0707?q=80&w=2070&auto=format&fit=crop'],
        notes: 'TV and other devices have been moved to working sockets for now.',
        internalNotes: 'Schedule during daytime when tenant is home.',
        receipts: [],
        invoiceUrl: null,
        receiptUrl: null,
        feedback: null,
        rating: null,
        createdAt: new Date('2025-01-20'),
        updatedAt: new Date('2025-01-21')
      }
    ];
    
    // Add maintenance requests to storage
    for (const request of sampleRequests) {
      this.maintenanceRequestsData.set(request.id, request);
    }
  }
  
  private addSampleTenancies() {
    // Sample tenancies with and without deposit protection
    const sampleTenancies: Tenancy[] = [
      {
        id: this.tenancyCurrentId++,
        propertyId: 1,
        tenantId: 4,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        rentAmount: '895',
        depositAmount: '950',
        depositProtectionScheme: 'dps',
        depositProtectionId: 'DPS-123456789',
        signedByTenant: true,
        signedByOwner: true,
        active: true,
        createdAt: new Date('2024-12-10')
      },
      {
        id: this.tenancyCurrentId++,
        propertyId: 2,
        tenantId: 4,
        startDate: new Date('2025-02-01'),
        endDate: new Date('2026-01-31'),
        rentAmount: '750',
        depositAmount: '800',
        depositProtectionScheme: null,
        depositProtectionId: null,
        signedByTenant: true,
        signedByOwner: true,
        active: true,
        createdAt: new Date('2025-01-15')
      },
      {
        id: this.tenancyCurrentId++,
        propertyId: 3,
        tenantId: 4,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2026-02-28'),
        rentAmount: '1200',
        depositAmount: '1250',
        depositProtectionScheme: 'mydeposits',
        depositProtectionId: 'MD-987654321',
        signedByTenant: true,
        signedByOwner: true,
        active: true,
        createdAt: new Date('2025-02-15')
      },
      {
        id: this.tenancyCurrentId++,
        propertyId: 4,
        tenantId: 4,
        startDate: new Date('2025-04-01'),
        endDate: new Date('2026-03-31'),
        rentAmount: '675',
        depositAmount: '700',
        depositProtectionScheme: null,
        depositProtectionId: null,
        signedByTenant: true,
        signedByOwner: true,
        active: true,
        createdAt: new Date('2025-03-15')
      },
      {
        id: this.tenancyCurrentId++,
        propertyId: 5,
        tenantId: 4,
        startDate: new Date('2025-05-01'),
        endDate: new Date('2026-04-30'),
        rentAmount: '925',
        depositAmount: '1000',
        depositProtectionScheme: 'tds',
        depositProtectionId: 'TDS-567891234',
        signedByTenant: true,
        signedByOwner: true,
        active: true,
        createdAt: new Date('2025-04-15')
      }
    ];
    
    // Add tenancies to storage
    for (const tenancy of sampleTenancies) {
      this.tenanciesData.set(tenancy.id, tenancy);
      
      // Create a rent payment for each tenancy
      const rentPayment: Payment = {
        id: this.paymentCurrentId++,
        tenancyId: tenancy.id,
        amount: tenancy.rentAmount,
        paymentType: 'rent',
        status: 'paid',
        dueDate: new Date(tenancy.startDate),
        paidDate: new Date(tenancy.startDate),
        createdAt: tenancy.createdAt
      };
      this.paymentsData.set(rentPayment.id, rentPayment);
      
      // Create a deposit payment for each tenancy
      const depositPayment: Payment = {
        id: this.paymentCurrentId++,
        tenancyId: tenancy.id,
        amount: tenancy.depositAmount,
        paymentType: 'deposit',
        status: 'paid',
        dueDate: new Date(tenancy.startDate),
        paidDate: new Date(tenancy.startDate),
        createdAt: tenancy.createdAt
      };
      this.paymentsData.set(depositPayment.id, depositPayment);
    }
  }

  private addSampleCalendarEvents() {
    // Sample calendar events
    const sampleEvents: CalendarEvent[] = [
      {
        id: this.calendarEventCurrentId++,
        title: 'Gas Safety Check - 27 Brudenell Road',
        description: 'Annual gas safety inspection for student property.',
        type: 'maintenance',
        entityType: 'property',
        entityId: 1,
        userId: 2, // Landlord
        allDay: false,
        startDate: new Date('2025-03-15T10:00:00'),
        endDate: new Date('2025-03-15T12:00:00'),
        location: '27 Brudenell Road, Leeds, LS6 1LS',
        status: 'scheduled',
        reminderSent: false,
        reminderDate: new Date('2025-03-14T10:00:00'),
        color: '#4caf50',
        recurrenceRule: null,
        createdBy: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.calendarEventCurrentId++,
        title: 'Tenant Viewings - Luxury Student Apartment',
        description: 'Multiple viewings scheduled for prospective tenants.',
        type: 'viewing',
        entityType: 'property',
        entityId: 2,
        userId: 3, // Agent
        allDay: false,
        startDate: new Date('2025-02-10T14:00:00'),
        endDate: new Date('2025-02-10T17:00:00'),
        location: '64 The Headrow, Leeds, LS1 8TL',
        status: 'scheduled',
        reminderSent: true,
        reminderDate: new Date('2025-02-09T14:00:00'),
        color: '#2196f3',
        recurrenceRule: null,
        createdBy: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.calendarEventCurrentId++,
        title: 'Rent Collection Day',
        description: 'Monthly rent collection for all properties',
        type: 'financial',
        entityType: 'system',
        entityId: 0,
        userId: 1, // Admin
        allDay: true,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-01'),
        location: null,
        status: 'scheduled',
        reminderSent: false,
        reminderDate: new Date('2025-02-28T09:00:00'),
        color: '#f44336',
        recurrenceRule: 'FREQ=MONTHLY;BYMONTHDAY=1',
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.calendarEventCurrentId++,
        title: 'Property Inspection - Hyde Park Houses',
        description: 'Quarterly inspection of student properties in Hyde Park area',
        type: 'inspection',
        entityType: 'property',
        entityId: 1,
        userId: 2, // Landlord
        allDay: false,
        startDate: new Date('2025-04-05T10:00:00'),
        endDate: new Date('2025-04-05T15:00:00'),
        location: 'Hyde Park, Leeds',
        status: 'scheduled',
        reminderSent: false,
        reminderDate: new Date('2025-04-03T10:00:00'),
        color: '#ff9800',
        recurrenceRule: 'FREQ=MONTHLY;INTERVAL=3;BYDAY=1SA',
        createdBy: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Add calendar events to storage
    for (const event of sampleEvents) {
      this.calendarEventsData.set(event.id, event);
    }
  }

  private addSampleProperties() {
    // Sample properties for demonstration
    const sampleProperties: Property[] = [
      {
        id: this.propertyCurrentId++,
        title: 'Modern Student House - Hyde Park',
        description: 'A beautiful modern student house located in the heart of Hyde Park. Perfect for University of Leeds students.',
        address: '27 Brudenell Road',
        city: 'Leeds',
        postcode: 'LS6 1LS',
        price: '145.00',
        propertyType: 'house',
        bedrooms: 5,
        bathrooms: 2,
        available: true,
        features: ['Modern Kitchen', 'Weekly Cleaning Service', 'Flat-screen TV', 'Garden', 'Washing Machine'],
        images: ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'],
        ownerId: 1,
        university: 'University of Leeds',
        distanceToUniversity: '5 minute walk',
        createdAt: new Date(),
        updatedAt: new Date(),
        availableDate: '1st July 2025',
        area: 'Hyde Park',
        billsIncluded: true,
        includedBills: ['gas', 'electricity', 'water', 'broadband']
      },
      {
        id: this.propertyCurrentId++,
        title: 'Luxury Student Apartment - City Centre',
        description: 'Luxurious studio apartment in Leeds city center with modern facilities and security.',
        address: '64 The Headrow',
        city: 'Leeds',
        postcode: 'LS1 8TL',
        price: '185.00',
        propertyType: 'apartment',
        bedrooms: 1,
        bathrooms: 1,
        available: true,
        features: ['Gym Access', 'On-site Security', 'Study Areas', 'Community Events', 'Smart TV'],
        images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'],
        ownerId: 1,
        university: 'Leeds Beckett University',
        distanceToUniversity: '10 minute walk',
        createdAt: new Date(),
        updatedAt: new Date(),
        availableDate: '1st July 2025',
        area: 'City Centre',
        billsIncluded: true,
        includedBills: ['gas', 'electricity', 'water', 'broadband']
      },
      {
        id: this.propertyCurrentId++,
        title: 'Spacious 8-Bed Student House - Headingley',
        description: 'Large student house with big communal spaces, perfect for a group of friends looking to share.',
        address: '42 Cardigan Road',
        city: 'Leeds',
        postcode: 'LS6 1LF',
        price: '130.00',
        propertyType: 'house',
        bedrooms: 8,
        bathrooms: 3,
        available: true,
        features: ['Large Garden', 'Two Living Rooms', 'Dishwasher', 'Weekly Cleaning', 'Smart TV'],
        images: ['https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'],
        ownerId: 1,
        university: 'University of Leeds',
        distanceToUniversity: '15 minute walk',
        createdAt: new Date(),
        updatedAt: new Date(),
        availableDate: '1st July 2025',
        area: 'Headingley',
        billsIncluded: true,
        includedBills: ['gas', 'electricity', 'water', 'broadband']
      },
      {
        id: this.propertyCurrentId++,
        title: 'Ensuite Student Room - The Tannery',
        description: 'Private ensuite room in a modern purpose-built student accommodation building with excellent facilities.',
        address: 'The Tannery, 91 Kirkstall Road',
        city: 'Leeds',
        postcode: 'LS3 1HS',
        price: '165.00',
        propertyType: 'studio',
        bedrooms: 1,
        bathrooms: 1,
        available: true,
        features: ['Ensuite Bathroom', 'On-site Gym', 'Cinema Room', 'Study Spaces', 'Furnished'],
        images: ['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'],
        ownerId: 1,
        university: 'Leeds Arts University',
        distanceToUniversity: '12 minute walk',
        createdAt: new Date(),
        updatedAt: new Date(),
        availableDate: '1st July 2025',
        area: 'Kirkstall',
        billsIncluded: true,
        includedBills: ['gas', 'electricity', 'water', 'broadband']
      },
      {
        id: this.propertyCurrentId++,
        title: 'Modern 4-Bed Student House - Burley',
        description: 'Recently renovated student house with modern furnishings and appliances, ideal for small groups.',
        address: '55 Burley Road',
        city: 'Leeds',
        postcode: 'LS3 1JX',
        price: '140.00',
        propertyType: 'house',
        bedrooms: 4,
        bathrooms: 2,
        available: true,
        features: ['High-Speed Broadband', 'Smart TV', 'Fully Equipped Kitchen', 'Comfortable Living Space', 'Washing Machine'],
        images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'],
        ownerId: 1,
        university: 'Leeds Conservatoire',
        distanceToUniversity: '20 minute walk',
        createdAt: new Date(),
        updatedAt: new Date(),
        availableDate: '1st July 2025',
        area: 'Burley',
        billsIncluded: true,
        includedBills: ['gas', 'electricity', 'water', 'broadband']
      },
      {
        id: this.propertyCurrentId++,
        title: 'Premium Studio Apartment - Clarence Dock',
        description: 'Luxury studio apartment with riverside views, perfect for postgraduate students.',
        address: 'Clarence Dock, Leeds Dock',
        city: 'Leeds',
        postcode: 'LS10 1PL',
        price: '195.00',
        propertyType: 'studio',
        bedrooms: 1,
        bathrooms: 1,
        available: false,
        features: ['River Views', '24/7 Security', 'On-site Maintenance', 'Bike Storage', 'Private Balcony'],
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2080&q=80'],
        ownerId: 1,
        university: 'University of Leeds',
        distanceToUniversity: '25 minute walk',
        createdAt: new Date(),
        updatedAt: new Date(),
        availableDate: 'Now Let',
        area: 'Clarence Dock',
        billsIncluded: true,
        includedBills: ['gas', 'electricity', 'water', 'broadband']
      }
    ];
    
    // Add each property to the storage
    for (const property of sampleProperties) {
      this.propertiesData.set(property.id, property);
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }
  
  // Financial Account methods
  async getFinancialAccount(id: number): Promise<FinancialAccount | undefined> {
    return this.financialAccountsData.get(id);
  }
  
  async getFinancialAccountsByUser(userId: number): Promise<FinancialAccount[]> {
    return Array.from(this.financialAccountsData.values()).filter(
      account => account.userId === userId
    );
  }
  
  async createFinancialAccount(account: Omit<FinancialAccount, 'id'>): Promise<FinancialAccount> {
    const newAccount: FinancialAccount = {
      id: this.financialAccountCurrentId++,
      ...account
    };
    this.financialAccountsData.set(newAccount.id, newAccount);
    return newAccount;
  }
  
  async updateFinancialAccount(id: number, updates: Partial<FinancialAccount>): Promise<FinancialAccount | undefined> {
    const account = await this.getFinancialAccount(id);
    if (!account) return undefined;
    
    const updatedAccount = { ...account, ...updates };
    this.financialAccountsData.set(id, updatedAccount);
    return updatedAccount;
  }
  
  // Financial Transaction methods
  async getFinancialTransaction(id: number): Promise<FinancialTransaction | undefined> {
    return this.financialTransactionsData.get(id);
  }
  
  async getFinancialTransactionsByAccount(accountId: number): Promise<FinancialTransaction[]> {
    return Array.from(this.financialTransactionsData.values()).filter(
      transaction => transaction.accountId === accountId
    );
  }
  
  async createFinancialTransaction(transaction: Omit<FinancialTransaction, 'id'>): Promise<FinancialTransaction> {
    const newTransaction: FinancialTransaction = {
      id: this.financialTransactionCurrentId++,
      ...transaction
    };
    this.financialTransactionsData.set(newTransaction.id, newTransaction);
    return newTransaction;
  }
  
  // Financial Reports methods
  async getFinancialReport(id: number): Promise<FinancialReport | undefined> {
    return this.financialReportsData.get(id);
  }
  
  async getFinancialReportsByUser(userId: number): Promise<FinancialReport[]> {
    return Array.from(this.financialReportsData.values()).filter(
      report => report.userId === userId
    );
  }
  
  async createFinancialReport(report: Omit<FinancialReport, 'id'>): Promise<FinancialReport> {
    const newReport: FinancialReport = {
      id: this.financialReportCurrentId++,
      ...report
    };
    this.financialReportsData.set(newReport.id, newReport);
    return newReport;
  }
  
  // Tax Information methods
  async getTaxInformation(id: number): Promise<TaxInformation | undefined> {
    return this.taxInformationData.get(id);
  }
  
  async getTaxInformationByUser(userId: number): Promise<TaxInformation | undefined> {
    return Array.from(this.taxInformationData.values()).find(
      tax => tax.userId === userId
    );
  }
  
  async createTaxInformation(taxInfo: Omit<TaxInformation, 'id'>): Promise<TaxInformation> {
    const newTaxInfo: TaxInformation = {
      id: this.taxInformationCurrentId++,
      ...taxInfo
    };
    this.taxInformationData.set(newTaxInfo.id, newTaxInfo);
    return newTaxInfo;
  }
  
  async updateTaxInformation(id: number, updates: Partial<TaxInformation>): Promise<TaxInformation | undefined> {
    const taxInfo = await this.getTaxInformation(id);
    if (!taxInfo) return undefined;
    
    const updatedTaxInfo = { ...taxInfo, ...updates };
    this.taxInformationData.set(id, updatedTaxInfo);
    return updatedTaxInfo;
  }
  
  // Property Finance methods
  async getPropertyFinance(id: number): Promise<PropertyFinance | undefined> {
    return this.propertyFinancesData.get(id);
  }
  
  async getPropertyFinanceByProperty(propertyId: number): Promise<PropertyFinance | undefined> {
    return Array.from(this.propertyFinancesData.values()).find(
      finance => finance.propertyId === propertyId
    );
  }
  
  async createPropertyFinance(finance: Omit<PropertyFinance, 'id'>): Promise<PropertyFinance> {
    const newFinance: PropertyFinance = {
      id: this.propertyFinanceCurrentId++,
      ...finance
    };
    this.propertyFinancesData.set(newFinance.id, newFinance);
    return newFinance;
  }
  
  async updatePropertyFinance(id: number, updates: Partial<PropertyFinance>): Promise<PropertyFinance | undefined> {
    const finance = await this.getPropertyFinance(id);
    if (!finance) return undefined;
    
    const updatedFinance = { ...finance, ...updates };
    this.propertyFinancesData.set(id, updatedFinance);
    return updatedFinance;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    // Make email comparison case-insensitive to fix login issues
    return Array.from(this.usersData.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const newUser: User = { 
      ...user, 
      id,
      verified: false,
      createdAt: new Date(),
    };
    this.usersData.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.usersData.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.usersData.set(id, updatedUser);
    return updatedUser;
  }
  
  // Property methods
  async getAllProperties(): Promise<Property[]> {
    return Array.from(this.propertiesData.values());
  }
  
  async getProperty(id: number): Promise<Property | undefined> {
    return this.propertiesData.get(id);
  }
  
  async getPropertiesByOwner(ownerId: number): Promise<Property[]> {
    return Array.from(this.propertiesData.values()).filter(
      (property) => property.ownerId === ownerId,
    );
  }
  
  // Agent-specific methods
  async getPropertiesByAgentId(agentId: number): Promise<Property[]> {
    return Array.from(this.propertiesData.values()).filter(
      (property) => property.managedBy === 'agent' && property.agentId === agentId
    );
  }
  
  async getApplicationsByPropertyIds(propertyIds: number[]): Promise<Application[]> {
    return Array.from(this.applicationsData.values()).filter(
      (application) => propertyIds.includes(application.propertyId)
    );
  }
  
  async getTenanciesByPropertyIds(propertyIds: number[]): Promise<Tenancy[]> {
    return Array.from(this.tenanciesData.values()).filter(
      (tenancy) => propertyIds.includes(tenancy.propertyId)
    );
  }
  
  async getMaintenanceRequestsByPropertyIds(propertyIds: number[]): Promise<MaintenanceRequest[]> {
    return Array.from(this.maintenanceRequestsData.values()).filter(
      (request) => propertyIds.includes(request.propertyId)
    );
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
    return Array.from(this.propertiesData.values()).filter((property) => {
      let match = true;
      
      // City filter - case insensitive partial match
      if (filters.city && !property.city.toLowerCase().includes(filters.city.toLowerCase())) {
        match = false;
      }
      
      // Area filter - case insensitive partial match
      if (filters.area && 
          (!property.area || 
          !property.area.toLowerCase().includes(filters.area.toLowerCase()))) {
        match = false;
      }
      
      // University filter - case insensitive partial match
      if (filters.university && 
          (!property.university || 
          !property.university.toLowerCase().includes(filters.university.toLowerCase()))) {
        match = false;
      }
      
      // Property type filter - exact match
      if (filters.propertyType && property.propertyType !== filters.propertyType) {
        match = false;
      }
      
      // Price filters
      if (filters.maxPrice && Number(property.price) > filters.maxPrice) {
        match = false;
      }
      
      if (filters.minPrice && Number(property.price) < filters.minPrice) {
        match = false;
      }
      
      // Bedroom filters
      if (filters.bedrooms && property.bedrooms !== filters.bedrooms) {
        match = false;
      }
      
      if (filters.minBedrooms && property.bedrooms < filters.minBedrooms) {
        match = false;
      }
      
      if (filters.maxBedrooms && property.bedrooms > filters.maxBedrooms) {
        match = false;
      }
      
      // Furnished filter
      if (filters.furnished !== undefined && property.furnished !== filters.furnished) {
        match = false;
      }
      
      // Bills included filter
      if (filters.billsIncluded !== undefined && property.billsIncluded !== filters.billsIncluded) {
        match = false;
      }
      
      return match;
    });
  }
  
  async createProperty(property: InsertProperty): Promise<Property> {
    const id = this.propertyCurrentId++;
    const newProperty: Property = { 
      ...property, 
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.propertiesData.set(id, newProperty);
    return newProperty;
  }
  
  async updateProperty(id: number, propertyData: Partial<Property>): Promise<Property | undefined> {
    const property = this.propertiesData.get(id);
    if (!property) return undefined;
    
    const updatedProperty = { 
      ...property, 
      ...propertyData,
      updatedAt: new Date(),
    };
    this.propertiesData.set(id, updatedProperty);
    return updatedProperty;
  }
  
  async deleteProperty(id: number): Promise<boolean> {
    return this.propertiesData.delete(id);
  }
  
  // Application methods
  async getApplication(id: number): Promise<Application | undefined> {
    return this.applicationsData.get(id);
  }
  
  async getApplicationsByTenant(tenantId: number): Promise<Application[]> {
    return Array.from(this.applicationsData.values()).filter(
      (application) => application.tenantId === tenantId,
    );
  }
  
  async getApplicationsByProperty(propertyId: number): Promise<Application[]> {
    return Array.from(this.applicationsData.values()).filter(
      (application) => application.propertyId === propertyId,
    );
  }
  
  async createApplication(application: InsertApplication): Promise<Application> {
    const id = this.applicationCurrentId++;
    const newApplication: Application = { 
      ...application, 
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.applicationsData.set(id, newApplication);
    return newApplication;
  }
  
  async updateApplicationStatus(id: number, status: string): Promise<Application | undefined> {
    const application = this.applicationsData.get(id);
    if (!application) return undefined;
    
    const updatedApplication = { ...application, status };
    this.applicationsData.set(id, updatedApplication);
    return updatedApplication;
  }
  
  // Group Application Members methods
  async getGroupApplicationMember(id: number): Promise<GroupApplicationMember | undefined> {
    return this.groupApplicationMembersData.get(id);
  }
  
  async getGroupApplicationMembersByGroupId(groupId: string): Promise<GroupApplicationMember[]> {
    return Array.from(this.groupApplicationMembersData.values()).filter(
      (member) => member.groupId === groupId
    );
  }
  
  async getGroupApplicationMembersByUserId(userId: number): Promise<GroupApplicationMember[]> {
    return Array.from(this.groupApplicationMembersData.values()).filter(
      (member) => member.userId === userId
    );
  }
  
  async getGroupApplicationMembersByApplicationId(applicationId: number): Promise<GroupApplicationMember[]> {
    return Array.from(this.groupApplicationMembersData.values()).filter(
      (member) => member.applicationId === applicationId
    );
  }
  
  async createGroupApplicationMember(member: InsertGroupApplicationMember): Promise<GroupApplicationMember> {
    const id = this.groupApplicationMemberCurrentId++;
    const newMember: GroupApplicationMember = {
      ...member,
      id,
      status: "invited",
      verificationCompleted: false,
      rightToRentVerified: false,
      invitedAt: new Date(),
      respondedAt: null,
      notes: null
    };
    this.groupApplicationMembersData.set(id, newMember);
    return newMember;
  }
  
  async updateGroupApplicationMemberStatus(id: number, status: string): Promise<GroupApplicationMember | undefined> {
    const member = this.groupApplicationMembersData.get(id);
    if (!member) return undefined;
    
    const updatedMember = { 
      ...member, 
      status,
      respondedAt: new Date()
    };
    this.groupApplicationMembersData.set(id, updatedMember);
    return updatedMember;
  }
  
  async updateGroupApplicationMemberVerification(id: number, verificationData: {
    verificationCompleted?: boolean;
    rightToRentVerified?: boolean;
  }): Promise<GroupApplicationMember | undefined> {
    const member = this.groupApplicationMembersData.get(id);
    if (!member) return undefined;
    
    const updatedMember = { 
      ...member,
      ...verificationData
    };
    this.groupApplicationMembersData.set(id, updatedMember);
    return updatedMember;
  }
  
  // Group Application methods
  async createGroupApplication(application: InsertApplication, groupMembers: Array<{name: string, email: string}>): Promise<Application> {
    // First create the application for the lead tenant
    const id = this.applicationCurrentId++;
    const newApplication: Application = {
      ...application,
      id,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.applicationsData.set(id, newApplication);
    
    // Now create group application members for each invited tenant
    for (const member of groupMembers) {
      // First check if a user with this email already exists
      let userId: number | null = null;
      const existingUsers = Array.from(this.usersData.values()).filter(user => user.email === member.email);
      
      if (existingUsers.length > 0) {
        userId = existingUsers[0].id;
      }
      
      await this.createGroupApplicationMember({
        groupId: application.groupId as string,
        applicationId: id,
        name: member.name,
        email: member.email,
        userId: userId,
        invitedBy: application.groupLeadId as number
      });
    }
    
    return newApplication;
  }
  
  async getGroupApplicationMembers(groupId: string): Promise<any[]> {
    return Array.from(this.groupApplicationMembersData.values()).filter(
      (member) => member.groupId === groupId
    );
  }
  
  async getGroupApplicationByGroupId(groupId: string): Promise<Application | undefined> {
    return Array.from(this.applicationsData.values()).find(
      (application) => application.groupId === groupId
    );
  }
  
  async getGroupApplicationsByMemberId(userId: number): Promise<Application[]> {
    // First get all group application members for this user
    const memberEntries = Array.from(this.groupApplicationMembersData.values()).filter(
      (member) => member.userId === userId
    );
    
    // Now get the corresponding applications
    const applications: Application[] = [];
    for (const member of memberEntries) {
      const application = this.applicationsData.get(member.applicationId);
      if (application) {
        applications.push(application);
      }
    }
    
    return applications;
  }
  
  async addGroupApplicationMember(groupId: string, applicationId: number, userId: number, invitedBy: number): Promise<any> {
    const user = this.usersData.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const member = await this.createGroupApplicationMember({
      groupId,
      applicationId,
      name: user.name,
      email: user.email,
      userId,
      invitedBy
    });
    
    return member;
  }
  
  async updateGroupApplicationMemberStatus(id: number, status: string, userId: number): Promise<any> {
    const member = this.groupApplicationMembersData.get(id);
    if (!member) {
      throw new Error("Group application member not found");
    }
    
    // Ensure this user can update this member
    if (member.userId !== userId) {
      throw new Error("Unauthorized to update this group application member");
    }
    
    const updatedMember = {
      ...member,
      status,
      respondedAt: new Date()
    };
    
    this.groupApplicationMembersData.set(id, updatedMember);
    return updatedMember;
  }
  
  // Tenancy methods
  async getTenancy(id: number): Promise<Tenancy | undefined> {
    return this.tenanciesData.get(id);
  }
  
  async getAllTenancies(): Promise<Tenancy[]> {
    return Array.from(this.tenanciesData.values());
  }
  
  async getTenanciesByTenant(tenantId: number): Promise<Tenancy[]> {
    return Array.from(this.tenanciesData.values()).filter(
      (tenancy) => tenancy.tenantId === tenantId,
    );
  }
  
  async getTenanciesByProperty(propertyId: number): Promise<Tenancy[]> {
    return Array.from(this.tenanciesData.values()).filter(
      (tenancy) => tenancy.propertyId === propertyId,
    );
  }
  
  async createTenancy(tenancy: InsertTenancy): Promise<Tenancy> {
    const id = this.tenancyCurrentId++;
    const newTenancy: Tenancy = { 
      ...tenancy, 
      id,
      signedByTenant: false,
      signedByOwner: false,
      active: true,
      createdAt: new Date(),
    };
    this.tenanciesData.set(id, newTenancy);
    return newTenancy;
  }
  
  async updateTenancy(id: number, tenancyData: Partial<Tenancy>): Promise<Tenancy | undefined> {
    const tenancy = this.tenanciesData.get(id);
    if (!tenancy) return undefined;
    
    const updatedTenancy = { ...tenancy, ...tenancyData };
    this.tenanciesData.set(id, updatedTenancy);
    return updatedTenancy;
  }
  
  // Payment methods
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.paymentsData.get(id);
  }
  
  async getPaymentsByTenancy(tenancyId: number): Promise<Payment[]> {
    return Array.from(this.paymentsData.values()).filter(
      (payment) => payment.tenancyId === tenancyId,
    );
  }
  
  async getPaymentsByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Payment[]> {
    return Array.from(this.paymentsData.values()).filter(
      (payment) => payment.stripeSubscriptionId === stripeSubscriptionId,
    );
  }
  
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = this.paymentCurrentId++;
    const newPayment: Payment = { 
      ...payment, 
      id,
      createdAt: new Date(),
    };
    this.paymentsData.set(id, newPayment);
    return newPayment;
  }
  
  async updatePaymentStatus(id: number, status: string, paidDate?: Date): Promise<Payment | undefined> {
    const payment = this.paymentsData.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { 
      ...payment, 
      status,
      paidDate: paidDate || payment.paidDate,
    };
    this.paymentsData.set(id, updatedPayment);
    return updatedPayment;
  }
  
  // Verification methods
  async getVerification(id: number): Promise<Verification | undefined> {
    return this.verificationsData.get(id);
  }
  
  async getVerificationByUser(userId: number): Promise<Verification | undefined> {
    return Array.from(this.verificationsData.values()).find(
      (verification) => verification.userId === userId,
    );
  }
  
  async getVerificationByUserId(userId: number): Promise<Verification | undefined> {
    return this.getVerificationByUser(userId);
  }
  
  async updateVerification(id: number, verification: Partial<Verification>): Promise<Verification | undefined> {
    const existingVerification = this.verificationsData.get(id);
    if (!existingVerification) {
      return undefined;
    }
    
    const updatedVerification = {
      ...existingVerification,
      ...verification,
    };
    
    this.verificationsData.set(id, updatedVerification);
    return updatedVerification;
  }
  
  async updateUserRightToRent(userId: number, rightToRentData: {
    rightToRentVerified: boolean;
    rightToRentStatus?: string;
    rightToRentExpiryDate?: Date;
    rightToRentCheckDate?: Date;
  }): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) {
      return undefined;
    }
    
    const updatedUser = {
      ...user,
      rightToRentVerified: rightToRentData.rightToRentVerified,
      rightToRentStatus: rightToRentData.rightToRentStatus || user.rightToRentStatus,
      rightToRentExpiryDate: rightToRentData.rightToRentExpiryDate || user.rightToRentExpiryDate,
      rightToRentCheckDate: rightToRentData.rightToRentCheckDate || new Date(),
    };
    
    this.usersData.set(userId, updatedUser);
    return updatedUser;
  }
  
  async getPendingRightToRentVerifications(userId?: number | null, userType?: string): Promise<Array<{verification: Verification, user: User}>> {
    const verifications = Array.from(this.verificationsData.values()).filter((verification) => {
      // Filter verifications with Right to Rent status
      return verification.rightToRentStatus && !verification.rightToRentVerified;
    });
    
    const results: Array<{verification: Verification, user: User}> = [];
    
    for (const verification of verifications) {
      const user = this.usersData.get(verification.userId);
      if (!user) continue;
      
      // If filtering by userId and userType
      if (userId && userType) {
        if (userType === 'agent' || userType === 'landlord') {
          // For agents and landlords, check if they have access to this tenant
          const hasAccess = await this.checkLandlordOrAgentHasAccessToTenant(userId, verification.userId, userType);
          if (!hasAccess) continue;
        }
      }
      
      results.push({ verification, user });
    }
    
    return results;
  }
  
  async getRightToRentFollowUps(userId?: number | null, userType?: string): Promise<Array<{verification: Verification, user: User}>> {
    const verifications = Array.from(this.verificationsData.values()).filter((verification) => {
      // Filter verifications that need follow-up
      return verification.rightToRentFollowUpNeeded && verification.rightToRentFollowUpDate;
    });
    
    const results: Array<{verification: Verification, user: User}> = [];
    
    for (const verification of verifications) {
      const user = this.usersData.get(verification.userId);
      if (!user) continue;
      
      // If filtering by userId and userType
      if (userId && userType) {
        if (userType === 'agent' || userType === 'landlord') {
          // For agents and landlords, check if they have access to this tenant
          const hasAccess = await this.checkLandlordOrAgentHasAccessToTenant(userId, verification.userId, userType);
          if (!hasAccess) continue;
        }
      }
      
      results.push({ verification, user });
    }
    
    // Sort by follow-up date (closest first)
    results.sort((a, b) => {
      const dateA = a.verification.rightToRentFollowUpDate?.getTime() || 0;
      const dateB = b.verification.rightToRentFollowUpDate?.getTime() || 0;
      return dateA - dateB;
    });
    
    return results;
  }
  
  async checkLandlordOrAgentHasAccessToTenant(userId: number, tenantId: number, userType: string): Promise<boolean> {
    if (userType === 'admin') {
      return true; // Admin has access to all tenants
    }
    
    if (userType === 'agent') {
      // Check if the agent has any properties with tenancies for this tenant
      const agentProperties = await this.getPropertiesByOwner(userId);
      const propertyIds = agentProperties.map(property => property.id);
      
      // Get all tenancies
      const allTenancies = Array.from(this.tenanciesData.values());
      
      // Check if any tenancy matches both the tenant ID and any of the agent's properties
      const hasTenancy = allTenancies.some(
        tenancy => tenancy.tenantId === tenantId && propertyIds.includes(tenancy.propertyId)
      );
      
      return hasTenancy;
    }
    
    if (userType === 'landlord') {
      // Check if the landlord has any properties with tenancies for this tenant
      const landlordProperties = await this.getPropertiesByOwner(userId);
      const propertyIds = landlordProperties.map(property => property.id);
      
      // Get all tenancies
      const allTenancies = Array.from(this.tenanciesData.values());
      
      // Check if any tenancy matches both the tenant ID and any of the landlord's properties
      const hasTenancy = allTenancies.some(
        tenancy => tenancy.tenantId === tenantId && propertyIds.includes(tenancy.propertyId)
      );
      
      return hasTenancy;
    }
    
    return false; // Default: no access
  }
  
  async createVerification(verification: InsertVerification): Promise<Verification> {
    const id = this.verificationCurrentId++;
    const newVerification: Verification = { 
      ...verification, 
      id,
      status: "pending",
      aiVerified: false,
      adminVerified: false,
      createdAt: new Date(),
    };
    this.verificationsData.set(id, newVerification);
    return newVerification;
  }
  
  async updateVerificationStatus(
    id: number, 
    status: string, 
    aiVerified: boolean, 
    adminVerified: boolean = false
  ): Promise<Verification | undefined> {
    const verification = this.verificationsData.get(id);
    if (!verification) return undefined;
    
    const updatedVerification = { 
      ...verification, 
      status,
      aiVerified,
      adminVerified,
    };
    this.verificationsData.set(id, updatedVerification);
    return updatedVerification;
  }
  
  // AI Provider methods
  async getAllAiProviders(): Promise<AiProvider[]> {
    return Array.from(this.aiProvidersData.values());
  }
  
  async getAiProvider(id: number): Promise<AiProvider | undefined> {
    return this.aiProvidersData.get(id);
  }
  
  async getAiProviderByName(name: string): Promise<AiProvider | undefined> {
    return Array.from(this.aiProvidersData.values()).find(
      (provider) => provider.name === name
    );
  }
  
  async getActiveAiProviders(): Promise<AiProvider[]> {
    return Array.from(this.aiProvidersData.values())
      .filter(provider => provider.active)
      .sort((a, b) => a.priority - b.priority);
  }
  
  async createAiProvider(provider: InsertAiProvider): Promise<AiProvider> {
    const id = this.aiProviderCurrentId++;
    const newProvider: AiProvider = {
      ...provider,
      id,
      lastChecked: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.aiProvidersData.set(id, newProvider);
    return newProvider;
  }
  
  async updateAiProvider(id: number, providerData: Partial<AiProvider>): Promise<AiProvider | undefined> {
    const provider = this.aiProvidersData.get(id);
    if (!provider) return undefined;
    
    const updatedProvider = {
      ...provider,
      ...providerData,
      updatedAt: new Date(),
    };
    this.aiProvidersData.set(id, updatedProvider);
    return updatedProvider;
  }
  
  async updateAiProviderStatus(id: number, status: string, errorMessage?: string): Promise<AiProvider | undefined> {
    const provider = this.aiProvidersData.get(id);
    if (!provider) return undefined;
    
    const updatedProvider = {
      ...provider,
      status,
      errorMessage: errorMessage || null,
      lastChecked: new Date(),
      updatedAt: new Date(),
    };
    this.aiProvidersData.set(id, updatedProvider);
    return updatedProvider;
  }
  
  async deleteAiProvider(id: number): Promise<boolean> {
    return this.aiProvidersData.delete(id);
  }
  
  // Maintenance Request methods
  async getAllMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    return Array.from(this.maintenanceRequestsData.values());
  }
  
  async getMaintenanceRequest(id: number): Promise<MaintenanceRequest | undefined> {
    return this.maintenanceRequestsData.get(id);
  }
  
  async getMaintenanceRequestsByProperty(propertyId: number): Promise<MaintenanceRequest[]> {
    return Array.from(this.maintenanceRequestsData.values()).filter(
      (request) => request.propertyId === propertyId,
    );
  }
  
  async getMaintenanceRequestsByTenant(tenantId: number): Promise<MaintenanceRequest[]> {
    return Array.from(this.maintenanceRequestsData.values()).filter(
      (request) => request.tenantId === tenantId,
    );
  }
  
  async getMaintenanceRequestsByContractor(contractorId: number): Promise<MaintenanceRequest[]> {
    return Array.from(this.maintenanceRequestsData.values()).filter(
      (request) => request.assignedContractorId === contractorId,
    );
  }
  
  async createMaintenanceRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest> {
    const id = this.maintenanceRequestCurrentId++;
    const newRequest: MaintenanceRequest = { 
      ...request, 
      id,
      status: request.status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.maintenanceRequestsData.set(id, newRequest);
    return newRequest;
  }
  
  async updateMaintenanceRequest(id: number, requestData: Partial<MaintenanceRequest>): Promise<MaintenanceRequest | undefined> {
    const request = this.maintenanceRequestsData.get(id);
    if (!request) return undefined;
    
    const updatedRequest = { 
      ...request, 
      ...requestData,
      updatedAt: new Date(),
    };
    this.maintenanceRequestsData.set(id, updatedRequest);
    return updatedRequest;
  }
  
  async deleteMaintenanceRequest(id: number): Promise<boolean> {
    return this.maintenanceRequestsData.delete(id);
  }
  
  // Maintenance Template methods
  async getAllMaintenanceTemplates(): Promise<MaintenanceTemplate[]> {
    return Array.from(this.maintenanceTemplatesData.values());
  }
  
  async getMaintenanceTemplate(id: number): Promise<MaintenanceTemplate | undefined> {
    return this.maintenanceTemplatesData.get(id);
  }
  
  async getMaintenanceTemplatesByCategory(category: string): Promise<MaintenanceTemplate[]> {
    return Array.from(this.maintenanceTemplatesData.values()).filter(
      (template) => template.category === category,
    );
  }
  
  async getMaintenanceTemplatesBySeason(season: string): Promise<MaintenanceTemplate[]> {
    return Array.from(this.maintenanceTemplatesData.values()).filter(
      (template) => template.season === season,
    );
  }
  
  async createMaintenanceTemplate(template: InsertMaintenanceTemplate): Promise<MaintenanceTemplate> {
    const id = this.maintenanceTemplateCurrentId++;
    const newTemplate: MaintenanceTemplate = { 
      ...template, 
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.maintenanceTemplatesData.set(id, newTemplate);
    return newTemplate;
  }
  
  async updateMaintenanceTemplate(id: number, templateData: Partial<MaintenanceTemplate>): Promise<MaintenanceTemplate | undefined> {
    const template = this.maintenanceTemplatesData.get(id);
    if (!template) return undefined;
    
    const updatedTemplate = { 
      ...template, 
      ...templateData,
      updatedAt: new Date(),
    };
    this.maintenanceTemplatesData.set(id, updatedTemplate);
    return updatedTemplate;
  }
  
  async deleteMaintenanceTemplate(id: number): Promise<boolean> {
    return this.maintenanceTemplatesData.delete(id);
  }
  
  // Contractor methods
  async getAllContractors(): Promise<Contractor[]> {
    return Array.from(this.contractorsData.values());
  }
  
  async getContractor(id: number): Promise<Contractor | undefined> {
    return this.contractorsData.get(id);
  }
  
  async getContractorsByService(service: string): Promise<Contractor[]> {
    return Array.from(this.contractorsData.values()).filter(
      (contractor) => contractor.services && contractor.services.includes(service),
    );
  }
  
  async getContractorsByArea(area: string): Promise<Contractor[]> {
    return Array.from(this.contractorsData.values()).filter(
      (contractor) => contractor.serviceAreas && contractor.serviceAreas.includes(area),
    );
  }
  
  async createContractor(contractor: InsertContractor): Promise<Contractor> {
    const id = this.contractorCurrentId++;
    const newContractor: Contractor = { 
      ...contractor, 
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.contractorsData.set(id, newContractor);
    return newContractor;
  }
  
  async updateContractor(id: number, contractorData: Partial<Contractor>): Promise<Contractor | undefined> {
    const contractor = this.contractorsData.get(id);
    if (!contractor) return undefined;
    
    const updatedContractor = { 
      ...contractor, 
      ...contractorData,
      updatedAt: new Date(),
    };
    this.contractorsData.set(id, updatedContractor);
    return updatedContractor;
  }
  
  async deleteContractor(id: number): Promise<boolean> {
    return this.contractorsData.delete(id);
  }
  
  // Calendar Event methods
  async getAllCalendarEvents(): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEventsData.values());
  }
  
  async getCalendarEvent(id: number): Promise<CalendarEvent | undefined> {
    return this.calendarEventsData.get(id);
  }
  
  async getCalendarEventsByUser(userId: number): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEventsData.values()).filter(
      (event) => event.userId === userId,
    );
  }
  
  async getCalendarEventsByDateRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEventsData.values()).filter(
      (event) => {
        const eventDate = new Date(event.date);
        return eventDate >= startDate && eventDate <= endDate;
      }
    );
  }
  
  async getCalendarEventsByEntity(entityType: string, entityId: number): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEventsData.values()).filter(
      (event) => event.entityType === entityType && event.entityId === entityId,
    );
  }
  
  async getCalendarEventsByType(type: string): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEventsData.values()).filter(
      (event) => event.type === type,
    );
  }
  
  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = this.calendarEventCurrentId++;
    const newEvent: CalendarEvent = { 
      ...event, 
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.calendarEventsData.set(id, newEvent);
    return newEvent;
  }
  
  async updateCalendarEvent(id: number, eventData: Partial<CalendarEvent>): Promise<CalendarEvent | undefined> {
    const event = this.calendarEventsData.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { 
      ...event, 
      ...eventData,
      updatedAt: new Date(),
    };
    this.calendarEventsData.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async deleteCalendarEvent(id: number): Promise<boolean> {
    return this.calendarEventsData.delete(id);
  }

  // Deposit Scheme Credentials Methods
  async getDepositSchemeCredentials(id: number): Promise<DepositSchemeCredentials | undefined> {
    return this.depositSchemeCredentialsData.get(id);
  }

  async getDepositSchemeCredentialsByUser(userId: number): Promise<DepositSchemeCredentials[]> {
    return Array.from(this.depositSchemeCredentialsData.values()).filter(
      (credentials) => credentials.userId === userId
    );
  }

  async getDepositSchemeCredentialsByScheme(userId: number, schemeName: string): Promise<DepositSchemeCredentials | undefined> {
    return Array.from(this.depositSchemeCredentialsData.values()).find(
      (credentials) => credentials.userId === userId && credentials.schemeName === schemeName
    );
  }

  async getDefaultDepositSchemeCredentials(userId: number): Promise<DepositSchemeCredentials | undefined> {
    return Array.from(this.depositSchemeCredentialsData.values()).find(
      (credentials) => credentials.userId === userId && credentials.isDefault === true
    );
  }

  async createDepositSchemeCredentials(credentials: InsertDepositSchemeCredentials): Promise<DepositSchemeCredentials> {
    // If this is set as default, make sure no other credentials for this user are set as default
    if (credentials.isDefault) {
      const userCredentials = await this.getDepositSchemeCredentialsByUser(credentials.userId);
      for (const existingCred of userCredentials) {
        existingCred.isDefault = false;
        this.depositSchemeCredentialsData.set(existingCred.id, existingCred);
      }
    }

    const newCredentials: DepositSchemeCredentials = {
      id: this.depositSchemeCredentialsCurrentId++,
      createdAt: new Date(),
      updatedAt: null,
      ...credentials,
    };

    this.depositSchemeCredentialsData.set(newCredentials.id, newCredentials);
    return newCredentials;
  }

  async updateDepositSchemeCredentials(
    id: number,
    credentialsData: Partial<DepositSchemeCredentials>
  ): Promise<DepositSchemeCredentials | undefined> {
    const credentials = this.depositSchemeCredentialsData.get(id);
    if (!credentials) return undefined;

    // If this is being set as default, make sure no other credentials for this user are set as default
    if (credentialsData.isDefault) {
      const userCredentials = await this.getDepositSchemeCredentialsByUser(credentials.userId);
      for (const existingCred of userCredentials) {
        if (existingCred.id !== id) {
          existingCred.isDefault = false;
          this.depositSchemeCredentialsData.set(existingCred.id, existingCred);
        }
      }
    }

    const updatedCredentials: DepositSchemeCredentials = {
      ...credentials,
      ...credentialsData,
      updatedAt: new Date(),
    };

    this.depositSchemeCredentialsData.set(id, updatedCredentials);
    return updatedCredentials;
  }

  async setDefaultDepositSchemeCredentials(id: number, userId: number): Promise<boolean> {
    const credentials = this.depositSchemeCredentialsData.get(id);
    if (!credentials || credentials.userId !== userId) return false;

    // Remove default flag from all other credentials for this user
    const userCredentials = await this.getDepositSchemeCredentialsByUser(userId);
    for (const cred of userCredentials) {
      if (cred.id !== id && cred.isDefault) {
        cred.isDefault = false;
        cred.updatedAt = new Date();
        this.depositSchemeCredentialsData.set(cred.id, cred);
      }
    }

    // Set this credential as default
    credentials.isDefault = true;
    credentials.updatedAt = new Date();
    this.depositSchemeCredentialsData.set(id, credentials);
    return true;
  }

  async deleteDepositSchemeCredentials(id: number): Promise<boolean> {
    if (this.depositSchemeCredentialsData.has(id)) {
      this.depositSchemeCredentialsData.delete(id);
      return true;
    }
    return false;
  }

  // Document methods implementation
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documentsData.get(id.toString());
  }

  async getAllDocuments(filters?: {
    propertyId?: number;
    tenantId?: number;
    landlordId?: number;
    agentId?: number;
    documentType?: string;
  }): Promise<Document[]> {
    const documents = Array.from(this.documentsData.values());
    
    if (!filters) {
      return documents;
    }
    
    return documents.filter(doc => {
      let match = true;
      
      if (filters.propertyId !== undefined && doc.propertyId !== filters.propertyId) {
        match = false;
      }
      
      if (filters.tenantId !== undefined && doc.tenantId !== filters.tenantId) {
        match = false;
      }
      
      if (filters.landlordId !== undefined && doc.landlordId !== filters.landlordId) {
        match = false;
      }
      
      if (filters.agentId !== undefined && doc.agentId !== filters.agentId) {
        match = false;
      }
      
      if (filters.documentType !== undefined && doc.documentType !== filters.documentType) {
        match = false;
      }
      
      return match;
    });
  }

  async getDocumentsByFilters(filters: {
    propertyId?: number;
    tenantId?: number;
    landlordId?: number;
    agentId?: number;
    createdById?: number;
    documentType?: string;
  }): Promise<Document[]> {
    const documents = Array.from(this.documentsData.values());
    
    return documents.filter(doc => {
      let match = true;
      
      if (filters.propertyId !== undefined && doc.propertyId !== filters.propertyId) {
        match = false;
      }
      
      if (filters.tenantId !== undefined && doc.tenantId !== filters.tenantId) {
        match = false;
      }
      
      if (filters.landlordId !== undefined && doc.landlordId !== filters.landlordId) {
        match = false;
      }
      
      if (filters.agentId !== undefined && doc.agentId !== filters.agentId) {
        match = false;
      }
      
      if (filters.createdById !== undefined && doc.createdById !== filters.createdById) {
        match = false;
      }
      
      if (filters.documentType !== undefined && doc.documentType !== filters.documentType) {
        match = false;
      }
      
      return match;
    });
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const id = document.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const newDocument: Document = {
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      title: document.title,
      content: document.content,
      documentType: document.documentType,
      format: document.format,
      templateId: document.templateId || null,
      propertyId: document.propertyId || null,
      landlordId: document.landlordId || null,
      agentId: document.agentId || null,
      tenantId: document.tenantId || null,
      tenancyId: document.tenancyId || null,
      createdById: document.createdById,
      signedByTenant: document.signedByTenant || false,
      signedByLandlord: document.signedByLandlord || false,
      signedByAgent: document.signedByAgent || false,
      dateSigned: document.dateSigned || null,
      aiGenerated: document.aiGenerated || false,
      customRequirements: document.customRequirements || null,
      storagePath: document.storagePath || null,
      documentUrl: document.documentUrl || null,
    };
    
    this.documentsData.set(id, newDocument);
    return newDocument;
  }

  async updateDocument(id: string, document: Partial<Document>): Promise<Document | undefined> {
    const existingDocument = this.documentsData.get(id);
    
    if (!existingDocument) {
      return undefined;
    }
    
    const updatedDocument: Document = {
      ...existingDocument,
      ...document,
      updatedAt: new Date(),
    };
    
    this.documentsData.set(id, updatedDocument);
    return updatedDocument;
  }
  
  // E-signature specific methods
  async signDocumentByTenant(id: string, tenantId: number): Promise<Document | undefined> {
    const existingDocument = this.documentsData.get(id);
    
    if (!existingDocument || existingDocument.tenantId !== tenantId) {
      return undefined;
    }
    
    const updatedDocument: Document = {
      ...existingDocument,
      signedByTenant: true,
      dateSigned: existingDocument.dateSigned || new Date(),
      updatedAt: new Date(),
    };
    
    this.documentsData.set(id, updatedDocument);
    return updatedDocument;
  }
  
  async signDocumentByLandlord(id: string, landlordId: number): Promise<Document | undefined> {
    const existingDocument = this.documentsData.get(id);
    
    if (!existingDocument || existingDocument.landlordId !== landlordId) {
      return undefined;
    }
    
    const updatedDocument: Document = {
      ...existingDocument,
      signedByLandlord: true,
      dateSigned: existingDocument.dateSigned || new Date(),
      updatedAt: new Date(),
    };
    
    this.documentsData.set(id, updatedDocument);
    return updatedDocument;
  }
  
  async signDocumentByAgent(id: string, agentId: number): Promise<Document | undefined> {
    const existingDocument = this.documentsData.get(id);
    
    if (!existingDocument || existingDocument.agentId !== agentId) {
      return undefined;
    }
    
    const updatedDocument: Document = {
      ...existingDocument,
      signedByAgent: true,
      dateSigned: existingDocument.dateSigned || new Date(),
      updatedAt: new Date(),
    };
    
    this.documentsData.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: string): Promise<boolean> {
    if (this.documentsData.has(id)) {
      this.documentsData.delete(id);
      return true;
    }
    return false;
  }

  private addSampleDocuments() {
    // Sample documents with e-signature capabilities
    const sampleDocuments: Document[] = [
      {
        id: "doc-1",
        title: "Rental Agreement - 123 Student Street",
        content: "This is a full tenancy agreement for 123 Student Street including all terms, utilities and other provisions.",
        documentType: "rental_agreement",
        format: "pdf",
        templateId: "template-standard-rental",
        propertyId: 1,
        landlordId: 2,
        agentId: null,
        tenantId: 4,
        tenancyId: 1,
        createdById: 2,
        signedByTenant: true,
        signedByLandlord: true,
        signedByAgent: false,
        dateSigned: new Date(2025, 0, 15),
        aiGenerated: true,
        customRequirements: "Include all-inclusive utilities clause and high-speed internet provision.",
        storagePath: "/documents/rental-agreements/doc-1.pdf",
        documentUrl: "https://example.com/documents/doc-1.pdf",
        createdAt: new Date(2025, 0, 10),
        updatedAt: new Date(2025, 0, 15),
      },
      {
        id: "doc-2",
        title: "Deposit Protection Certificate - 456 University Avenue",
        content: "This document certifies that the tenant deposit of £1,000 for property at 456 University Avenue has been protected with the DPS scheme.",
        documentType: "deposit_certificate",
        format: "pdf",
        templateId: "template-dps-certificate",
        propertyId: 2,
        landlordId: 2,
        agentId: null,
        tenantId: 4,
        tenancyId: 2,
        createdById: 2,
        signedByTenant: true,
        signedByLandlord: true,
        signedByAgent: false,
        dateSigned: new Date(2025, 1, 5),
        aiGenerated: false,
        customRequirements: null,
        storagePath: "/documents/deposit-certificates/doc-2.pdf",
        documentUrl: "https://example.com/documents/doc-2.pdf",
        createdAt: new Date(2025, 1, 1),
        updatedAt: new Date(2025, 1, 5),
      },
      {
        id: "doc-3",
        title: "Inventory Report - 789 College Lane",
        content: "Complete inventory of all furnishings and fittings at 789 College Lane including condition notes and photographs.",
        documentType: "inventory",
        format: "pdf",
        templateId: "template-inventory",
        propertyId: 3,
        landlordId: null,
        agentId: 3,
        tenantId: 4,
        tenancyId: 3,
        createdById: 3,
        signedByTenant: true,
        signedByLandlord: false,
        signedByAgent: true,
        dateSigned: new Date(2025, 2, 10),
        aiGenerated: false,
        customRequirements: null,
        storagePath: "/documents/inventories/doc-3.pdf",
        documentUrl: "https://example.com/documents/doc-3.pdf",
        createdAt: new Date(2025, 2, 8),
        updatedAt: new Date(2025, 2, 10),
      },
      {
        id: "doc-4",
        title: "Right to Rent Check - Student Tenant",
        content: "Verification of Right to Rent for tenant John Student including passport and visa documentation.",
        documentType: "right_to_rent",
        format: "pdf",
        templateId: "template-right-to-rent",
        propertyId: null,
        landlordId: null,
        agentId: 3,
        tenantId: 4,
        tenancyId: null,
        createdById: 3,
        signedByTenant: true,
        signedByLandlord: false,
        signedByAgent: true,
        dateSigned: new Date(2025, 0, 5),
        aiGenerated: false,
        customRequirements: null,
        storagePath: "/documents/compliance/doc-4.pdf",
        documentUrl: "https://example.com/documents/doc-4.pdf",
        createdAt: new Date(2025, 0, 5),
        updatedAt: new Date(2025, 0, 5),
      },
      {
        id: "doc-5",
        title: "Gas Safety Certificate - 123 Student Street",
        content: "Annual gas safety inspection certificate for 123 Student Street valid for 12 months.",
        documentType: "gas_safety",
        format: "pdf",
        templateId: null,
        propertyId: 1,
        landlordId: 2,
        agentId: null,
        tenantId: null,
        tenancyId: null,
        createdById: 2,
        signedByTenant: false,
        signedByLandlord: true,
        signedByAgent: false,
        dateSigned: new Date(2025, 3, 1),
        aiGenerated: false,
        customRequirements: null,
        storagePath: "/documents/safety-certificates/doc-5.pdf",
        documentUrl: "https://example.com/documents/doc-5.pdf",
        createdAt: new Date(2025, 3, 1),
        updatedAt: new Date(2025, 3, 1),
      },
    ];

    // Add documents to storage
    for (const document of sampleDocuments) {
      this.documentsData.set(document.id, document);
    }
  }
  
  private addSampleDepositSchemeCredentials() {
    // Sample deposit scheme credentials
    const sampleCredentials: DepositSchemeCredentials[] = [
      {
        id: this.depositSchemeCredentialsCurrentId++,
        userId: 2, // Landlord user
        schemeName: 'dps',
        schemeUsername: 'landlord_dps',
        schemePassword: 'secure_password_123',
        accountNumber: 'DPS12345678',
        apiKey: 'dps_api_key_123456',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: null,
      },
      {
        id: this.depositSchemeCredentialsCurrentId++,
        userId: 2, // Landlord user
        schemeName: 'mydeposits',
        schemeUsername: 'landlord_mydeposits',
        schemePassword: 'another_secure_pwd',
        accountNumber: 'MD98765432',
        apiKey: 'mydeposits_api_987654',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: null,
      },
      {
        id: this.depositSchemeCredentialsCurrentId++,
        userId: 3, // Agent user
        schemeName: 'tds',
        schemeUsername: 'agent_tds',
        schemePassword: 'agent_secure_pwd',
        accountNumber: 'TDS55667788',
        apiKey: 'tds_api_key_556677',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: null,
      },
      {
        id: this.depositSchemeCredentialsCurrentId++,
        userId: 3, // Agent user
        schemeName: 'dps',
        schemeUsername: 'agent_dps',
        schemePassword: 'agent_dps_pwd',
        accountNumber: 'DPS87654321',
        apiKey: 'dps_api_agent_87654',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: null,
      },
    ];

    // Add credentials to storage
    for (const credentials of sampleCredentials) {
      this.depositSchemeCredentialsData.set(credentials.id, credentials);
    }
  }
  
  // Add sample tenant preferences
  private addSampleTenantPreferences() {
    // Sample tenant preferences for demonstration
    const samplePreferences: TenantPreferences[] = [
      {
        id: this.tenantPreferencesCurrentId++,
        tenantId: 4, // Tenant User
        propertyType: ['apartment', 'house', 'studio'],
        budget: { min: 500, max: 1000 },
        bedrooms: [1, 2],
        location: ['Leeds', 'City Centre'],
        maxDistanceToUniversity: 2.5,
        universities: ['University of Leeds', 'Leeds Beckett University'],
        mustHaveFeatures: ['high-speed internet', 'washing machine'],
        niceToHaveFeatures: ['dishwasher', 'balcony', 'gym'],
        dealBreakers: ['no pets allowed'],
        lifestyle: ['student', 'quiet'],
        preferredMoveInDate: new Date(2025, 8, 1), // Sept 1, 2025
        preferredTenancyLength: 12,
        notes: 'Looking for a clean, modern apartment close to university.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Add preferences to storage
    for (const preferences of samplePreferences) {
      this.tenantPreferencesData.set(preferences.id, preferences);
    }
  }
  
  // Add sample AI targeting results
  private addSampleAiTargetingResults() {
    // Sample AI targeting campaigns
    const sampleTargeting: AiTargetingResults[] = [
      {
        id: this.aiTargetingResultsCurrentId++,
        agentId: 1, // Admin User
        name: 'Property Management Outreach - Manchester',
        description: 'Campaign to target property management companies in Manchester area',
        targetDemographic: 'property_management',
        targetProperties: [],
        propertyFilters: {
          searchLocation: 'Manchester',
          companies: ['Manchester Student Homes', 'Manchester Property Solutions', 'UniHomes']
        },
        companyDetails: [
          {
            name: 'Manchester Student Homes',
            email: 'info@manchesterstudenthomes.com',
            phone: '0161 123 4567',
            website: 'https://www.manchesterstudenthomes.com',
            description: 'Manchester Student Homes is an accommodation service for students in Manchester.'
          },
          {
            name: 'Manchester Property Solutions',
            email: 'contact@manchesterpropertysolutions.co.uk',
            phone: '0161 789 1234',
            website: 'https://www.manchesterpropertysolutions.co.uk',
            description: 'A leading property management company specializing in student accommodation.'
          },
          {
            name: 'UniHomes',
            email: 'manchester@unihomes.co.uk',
            phone: '0161 456 7890',
            website: 'https://www.unihomes.co.uk/manchester',
            description: 'Provider of student housing with all-inclusive bills.'
          }
        ],
        emailTemplate: 'Tone: professional\nGoal: partnership\nFeatures to highlight: AI-powered property management, automated compliance, tenant matching',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.aiTargetingResultsCurrentId++,
        agentId: 3, // Agent User
        name: 'Student Housing Campaign - Fall 2025',
        description: 'Targeting campaign for University of Leeds students for the Fall 2025 semester',
        targetDemographic: 'students',
        targetProperties: [1, 2, 3],
        propertyFilters: {
          minPrice: 500,
          maxPrice: 1200,
          propertyTypes: ['house', 'apartment'],
          minBedrooms: 1,
          maxBedrooms: 5,
          locations: ['Leeds', 'Headingley'],
          universities: ['University of Leeds', 'Leeds Beckett University'],
          features: ['high-speed internet', 'bills included'],
          furnished: true,
          availableDate: '2025-09-01'
        },
        tenantFilters: {
          lifestyles: ['student'],
          universities: ['University of Leeds', 'Leeds Beckett University'],
          budget: { min: 400, max: 1000 },
          moveInDates: { min: '2025-08-15', max: '2025-09-15' }
        },
        matchedTenants: [
          {
            tenantId: 4,
            score: 85,
            matchReasons: ['Budget match', 'Location preference match', 'Required amenities available'],
            recommendedProperties: [1, 3]
          }
        ],
        insights: [
          'Campaign focuses on 3 properties in Leeds and Headingley',
          'Primary demographic: students from University of Leeds and Leeds Beckett',
          'Properties with high-speed internet and bills included are most attractive to the target demographic',
          'Most tenants are looking for 1-2 bedroom properties',
          'Average budget range is £500-900 per month'
        ],
        emailTemplate: 'Subject: Perfect Student Housing for Fall 2025!\n\nHello {name},\n\nWe have some fantastic properties available near {university} for the upcoming academic year. Our properties feature high-speed internet and all bills included, starting from just £{minPrice} per month.\n\nClick here to view our available properties and schedule a viewing: {link}\n\nBest regards,\nThe Agent Team',
        smsTemplate: 'Student housing available near your university for Fall 2025! All bills included, from £500/month. Reply YES to get details or visit {shortLink}',
        socialMediaContent: {
          facebook: 'Looking for student accommodation for the 2025-26 academic year? 🎓 We have a range of properties near University of Leeds and Leeds Beckett with all bills included! Prices start from just £500 per month. ✨ High-speed internet included ✨ Fully furnished ✨ Close to campus\n\nDM us or visit our website to book a viewing! #StudentAccommodation #Leeds #University',
          instagram: 'Student housing alert! 🏠🎓\nPerfect properties for the 2025-26 academic year are now available!\n\n✅ All bills included\n✅ High-speed internet\n✅ Close to campus\n✅ Fully furnished\n\nPrices from £500/month\nSwipe up to view! #StudentLiving #Leeds #UniAccommodation #Fall2025',
          twitter: 'Student housing for 2025-26 now available! 🏠 All bills & internet included, fully furnished, from £500/month. Close to @UniOfLeeds & @BeckettUni! Book a viewing today! #StudentAccommodation #Leeds'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Add targeting campaigns to storage
    for (const targeting of sampleTargeting) {
      this.aiTargetingResultsData.set(targeting.id, targeting);
    }
    
    // Sample property-tenant matches
    const sampleMatches: PropertyTenantMatch[] = [
      {
        id: this.propertyTenantMatchesCurrentId++,
        propertyId: 1,
        tenantId: 4,
        targetingId: 1,
        matchScore: 85,
        matchReasons: [
          'Property is within preferred budget range',
          'Location matches tenant preference',
          'Property has all required amenities',
          'Distance to university is within preferred range'
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.propertyTenantMatchesCurrentId++,
        propertyId: 3,
        tenantId: 4,
        targetingId: 1,
        matchScore: 78,
        matchReasons: [
          'Property is within preferred budget range',
          'Location matches tenant preference',
          'Property has most required amenities'
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Add property-tenant matches to storage
    for (const match of sampleMatches) {
      this.propertyTenantMatchesData.set(match.id, match);
    }
  }
  
  // Add sample financial accounts
  private addSampleFinancialAccounts() {
    const sampleAccounts: FinancialAccount[] = [
      {
        id: 1,
        userId: 2, // Landlord
        accountName: "Main Property Account",
        accountType: "business",
        balance: "25430.50",
        currency: "GBP",
        institution: "Barclays",
        accountNumber: "XXXX-XXXX-7890",
        sortCode: "20-35-45",
        accountingEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncedAt: new Date()
      },
      {
        id: 2,
        userId: 2, // Landlord
        accountName: "Tax Reserve Account",
        accountType: "savings",
        balance: "8750.25",
        currency: "GBP",
        institution: "Barclays",
        accountNumber: "XXXX-XXXX-1234",
        sortCode: "20-35-45",
        accountingEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncedAt: new Date()
      },
      {
        id: 3,
        userId: 4, // Agent
        accountName: "Client Account",
        accountType: "business",
        balance: "187450.75",
        currency: "GBP",
        institution: "HSBC",
        accountNumber: "XXXX-XXXX-5678",
        sortCode: "40-23-15",
        accountingEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncedAt: new Date()
      },
      {
        id: 4,
        userId: 4, // Agent
        accountName: "Operating Account",
        accountType: "business",
        balance: "42365.90",
        currency: "GBP",
        institution: "HSBC",
        accountNumber: "XXXX-XXXX-9012",
        sortCode: "40-23-15",
        accountingEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncedAt: new Date()
      },
      {
        id: 5,
        userId: 3, // Second Landlord
        accountName: "Property Income Account",
        accountType: "business",
        balance: "13765.40",
        currency: "GBP",
        institution: "NatWest",
        accountNumber: "XXXX-XXXX-3456",
        sortCode: "60-12-89",
        accountingEnabled: false, // Accounting feature disabled
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncedAt: new Date()
      }
    ];

    for (const account of sampleAccounts) {
      this.financialAccountsData.set(account.id, account);
    }
  }

  // Add sample financial transactions
  private addSampleFinancialTransactions() {
    const sampleTransactions: FinancialTransaction[] = [
      {
        id: 1,
        accountId: 1,
        amount: "750.00",
        description: "Rent payment - 14 Elm Street",
        category: "rent_income",
        date: new Date(2025, 3, 1),
        type: "income",
        propertyId: 1,
        tenancyId: 1,
        reference: "RENT-1001",
        status: "completed",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        accountId: 1,
        amount: "120.50",
        description: "Gas bill - 14 Elm Street",
        category: "utilities_gas",
        date: new Date(2025, 3, 2),
        type: "expense",
        propertyId: 1,
        tenancyId: 1,
        reference: "BILL-GAS-101",
        status: "completed",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        accountId: 1,
        amount: "95.75",
        description: "Electricity bill - 14 Elm Street",
        category: "utilities_electricity",
        date: new Date(2025, 3, 2),
        type: "expense",
        propertyId: 1,
        tenancyId: 1,
        reference: "BILL-ELEC-102",
        status: "completed",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        accountId: 1,
        amount: "175.00",
        description: "Plumbing repair - 14 Elm Street",
        category: "maintenance_repair",
        date: new Date(2025, 3, 5),
        type: "expense",
        propertyId: 1,
        tenancyId: 1,
        reference: "MAINT-103",
        status: "completed",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 5,
        accountId: 1,
        amount: "825.00",
        description: "Rent payment - 27 Oak Avenue",
        category: "rent_income",
        date: new Date(2025, 3, 1),
        type: "income",
        propertyId: 2,
        tenancyId: 2,
        reference: "RENT-1002",
        status: "completed",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 6,
        accountId: 3,
        amount: "950.00",
        description: "Rent payment - 8 Pine Road",
        category: "rent_income",
        date: new Date(2025, 3, 1),
        type: "income",
        propertyId: 3,
        tenancyId: 3,
        reference: "RENT-1003",
        status: "completed",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 7,
        accountId: 3,
        amount: "142.50",
        description: "Management fee - 8 Pine Road",
        category: "management_fee",
        date: new Date(2025, 3, 2),
        type: "income", // Income for the agent
        propertyId: 3,
        tenancyId: 3,
        reference: "FEE-101",
        status: "completed",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 8,
        accountId: 3,
        amount: "807.50",
        description: "Landlord payment - 8 Pine Road",
        category: "landlord_payment",
        date: new Date(2025, 3, 3),
        type: "expense", // Expense for the agent (paying the landlord)
        propertyId: 3,
        tenancyId: 3,
        reference: "LNDLRD-101",
        status: "completed",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 9,
        accountId: 4,
        amount: "325.75",
        description: "Office supplies",
        category: "office_expense",
        date: new Date(2025, 3, 10),
        type: "expense",
        reference: "OFFICE-101",
        status: "completed",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 10,
        accountId: 2,
        amount: "2500.00",
        description: "Tax reserve transfer",
        category: "tax_reserve",
        date: new Date(2025, 3, 15),
        type: "expense", // Expense from main account
        reference: "TAX-101",
        status: "completed",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const transaction of sampleTransactions) {
      this.financialTransactionsData.set(transaction.id, transaction);
    }
  }

  // Add sample financial reports
  private addSampleFinancialReports() {
    const sampleReports: FinancialReport[] = [
      {
        id: 1,
        userId: 2, // Landlord
        reportType: "monthly_summary",
        reportDate: new Date(2025, 3, 30),
        periodStart: new Date(2025, 3, 1),
        periodEnd: new Date(2025, 3, 30),
        totalIncome: "1575.00",
        totalExpense: "391.25",
        netProfit: "1183.75",
        reportData: {
          incomeByCategory: {
            rent_income: "1575.00"
          },
          expenseByCategory: {
            utilities_gas: "120.50",
            utilities_electricity: "95.75",
            maintenance_repair: "175.00"
          },
          incomeByProperty: {
            "14 Elm Street": "750.00",
            "27 Oak Avenue": "825.00"
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        userId: 4, // Agent
        reportType: "monthly_summary",
        reportDate: new Date(2025, 3, 30),
        periodStart: new Date(2025, 3, 1),
        periodEnd: new Date(2025, 3, 30),
        totalIncome: "1092.50",
        totalExpense: "1133.25",
        netProfit: "-40.75",
        reportData: {
          incomeByCategory: {
            rent_income: "950.00",
            management_fee: "142.50"
          },
          expenseByCategory: {
            landlord_payment: "807.50",
            office_expense: "325.75"
          },
          incomeByProperty: {
            "8 Pine Road": "950.00"
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        userId: 2, // Landlord
        reportType: "quarterly_summary",
        reportDate: new Date(2025, 3, 31),
        periodStart: new Date(2025, 1, 1),
        periodEnd: new Date(2025, 3, 31),
        totalIncome: "4725.00",
        totalExpense: "1285.75",
        netProfit: "3439.25",
        reportData: {
          incomeByCategory: {
            rent_income: "4725.00"
          },
          expenseByCategory: {
            utilities_gas: "378.25",
            utilities_electricity: "292.50",
            maintenance_repair: "615.00"
          },
          incomeByProperty: {
            "14 Elm Street": "2250.00",
            "27 Oak Avenue": "2475.00"
          },
          quarterlyTrend: {
            income: ["1575.00", "1575.00", "1575.00"],
            expense: ["452.25", "442.25", "391.25"],
            profit: ["1122.75", "1132.75", "1183.75"]
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const report of sampleReports) {
      this.financialReportsData.set(report.id, report);
    }
  }

  // Add sample tax information
  private addSampleTaxInformation() {
    const sampleTaxInfo: TaxInformation[] = [
      {
        id: 1,
        userId: 2, // Landlord
        taxYear: "2024-2025",
        totalIncome: "18900.00",
        totalDeductibleExpenses: "4250.75",
        taxableIncome: "14649.25",
        estimatedTaxDue: "2929.85",
        taxRate: "20.00",
        nationalInsurance: "382.50",
        taxPaid: "0.00",
        taxStatus: "estimated",
        lastCalculated: new Date(),
        reminderEnabled: true,
        taxNotes: "Remember to include capital gains on property sold this year",
        taxDeadline: new Date(2026, 0, 31), // January 31, 2026
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        userId: 3, // Second Landlord
        taxYear: "2024-2025",
        totalIncome: "13765.40",
        totalDeductibleExpenses: "3128.50",
        taxableIncome: "10636.90",
        estimatedTaxDue: "2127.38",
        taxRate: "20.00",
        nationalInsurance: "275.25",
        taxPaid: "0.00",
        taxStatus: "estimated",
        lastCalculated: new Date(),
        reminderEnabled: false,
        taxDeadline: new Date(2026, 0, 31), // January 31, 2026
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        userId: 4, // Agent
        taxYear: "2024-2025",
        totalIncome: "42365.90",
        totalDeductibleExpenses: "12750.30",
        taxableIncome: "29615.60",
        estimatedTaxDue: "5923.12",
        taxRate: "20.00",
        nationalInsurance: "945.75",
        taxPaid: "0.00",
        taxStatus: "estimated",
        lastCalculated: new Date(),
        reminderEnabled: true,
        taxNotes: "Check quarterly VAT returns",
        taxDeadline: new Date(2026, 0, 31), // January 31, 2026
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const taxInfo of sampleTaxInfo) {
      this.taxInformationData.set(taxInfo.id, taxInfo);
    }
  }

  // Add sample property finances
  private addSamplePropertyFinances() {
    const samplePropertyFinances: PropertyFinance[] = [
      {
        id: 1,
        propertyId: 1,
        mortgageAmount: "150000.00",
        mortgageProvider: "NatWest",
        mortgageType: "Buy-to-Let Fixed",
        interestRate: "3.25",
        mortgageTermYears: 25,
        monthlyPayment: "725.50",
        insuranceCost: "450.00",
        insuranceProvider: "Direct Line",
        insuranceRenewalDate: new Date(2026, 2, 15),
        annualGroundRent: "250.00",
        annualServiceCharge: "1200.00",
        councilTaxBand: "D",
        councilTaxAmount: "1850.00",
        estimatedUtilitiesCost: "175.00",
        managementFeesPercentage: "10.00",
        grossAnnualRentalIncome: "9000.00",
        netAnnualRentalIncome: "0.00", // Will be calculated
        yieldPercentage: "0.00", // Will be calculated
        propertyValue: "225000.00",
        lastValuationDate: new Date(2025, 1, 10),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        propertyId: 2,
        mortgageAmount: "185000.00",
        mortgageProvider: "Barclays",
        mortgageType: "Buy-to-Let Tracker",
        interestRate: "3.75",
        mortgageTermYears: 25,
        monthlyPayment: "950.25",
        insuranceCost: "525.00",
        insuranceProvider: "Aviva",
        insuranceRenewalDate: new Date(2025, 11, 5),
        annualGroundRent: "0.00", // Freehold
        annualServiceCharge: "0.00", // No service charge
        councilTaxBand: "E",
        councilTaxAmount: "2150.00",
        estimatedUtilitiesCost: "225.00",
        managementFeesPercentage: "10.00",
        grossAnnualRentalIncome: "9900.00",
        netAnnualRentalIncome: "0.00", // Will be calculated
        yieldPercentage: "0.00", // Will be calculated
        propertyValue: "285000.00",
        lastValuationDate: new Date(2025, 1, 15),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        propertyId: 3,
        mortgageAmount: "210000.00",
        mortgageProvider: "Halifax",
        mortgageType: "Buy-to-Let Fixed",
        interestRate: "3.50",
        mortgageTermYears: 25,
        monthlyPayment: "1050.75",
        insuranceCost: "625.00",
        insuranceProvider: "AXA",
        insuranceRenewalDate: new Date(2025, 8, 20),
        annualGroundRent: "200.00",
        annualServiceCharge: "1500.00",
        councilTaxBand: "F",
        councilTaxAmount: "2450.00",
        estimatedUtilitiesCost: "250.00",
        managementFeesPercentage: "15.00",
        grossAnnualRentalIncome: "11400.00",
        netAnnualRentalIncome: "0.00", // Will be calculated
        yieldPercentage: "0.00", // Will be calculated
        propertyValue: "320000.00",
        lastValuationDate: new Date(2025, 2, 5),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Calculate net income and yield for each property
    for (const finance of samplePropertyFinances) {
      // Calculate annual expenses
      const annualMortgage = parseFloat(finance.monthlyPayment) * 12;
      const annualInsurance = parseFloat(finance.insuranceCost);
      const annualGround = parseFloat(finance.annualGroundRent);
      const annualService = parseFloat(finance.annualServiceCharge);
      const annualCouncilTax = parseFloat(finance.councilTaxAmount);
      const annualUtilities = parseFloat(finance.estimatedUtilitiesCost) * 12;
      const managementFees = (parseFloat(finance.grossAnnualRentalIncome) * parseFloat(finance.managementFeesPercentage)) / 100;
      
      // Total expenses
      const totalExpenses = annualMortgage + annualInsurance + annualGround + 
                            annualService + annualCouncilTax + annualUtilities + managementFees;
      
      // Calculate net income
      const netIncome = parseFloat(finance.grossAnnualRentalIncome) - totalExpenses;
      finance.netAnnualRentalIncome = netIncome.toFixed(2);
      
      // Calculate yield
      const yieldValue = (netIncome / parseFloat(finance.propertyValue)) * 100;
      finance.yieldPercentage = yieldValue.toFixed(2);
      
      this.propertyFinancesData.set(finance.id, finance);
    }
  }

  // Tenant Preferences methods
  async getTenantPreferences(id: number): Promise<TenantPreferences | undefined> {
    return this.tenantPreferencesData.get(id);
  }
  
  async getTenantPreferencesByTenantId(tenantId: number): Promise<TenantPreferences | undefined> {
    const preferences = Array.from(this.tenantPreferencesData.values()).find(
      (pref) => pref.tenantId === tenantId
    );
    return preferences;
  }
  
  async createTenantPreferences(preferences: InsertTenantPreferences): Promise<TenantPreferences> {
    const newPreferences: TenantPreferences = {
      ...preferences,
      id: this.tenantPreferencesCurrentId++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.tenantPreferencesData.set(newPreferences.id, newPreferences);
    return newPreferences;
  }
  
  async updateTenantPreferences(id: number, preferences: Partial<TenantPreferences>): Promise<TenantPreferences | undefined> {
    const existingPreferences = this.tenantPreferencesData.get(id);
    if (!existingPreferences) {
      return undefined;
    }
    
    const updatedPreferences: TenantPreferences = {
      ...existingPreferences,
      ...preferences,
      updatedAt: new Date()
    };
    
    this.tenantPreferencesData.set(id, updatedPreferences);
    return updatedPreferences;
  }
  
  async deleteTenantPreferences(id: number): Promise<boolean> {
    return this.tenantPreferencesData.delete(id);
  }
  
  // AI Targeting methods
  async getAllAiTargetingResults(): Promise<AiTargetingResults[]> {
    return Array.from(this.aiTargetingResultsData.values());
  }
  
  async getAiTargeting(id: number): Promise<AiTargetingResults | undefined> {
    return this.aiTargetingResultsData.get(id);
  }
  
  async getAiTargetingByAgent(agentId: number): Promise<AiTargetingResults[]> {
    const targetingResults = Array.from(this.aiTargetingResultsData.values()).filter(
      (targeting) => targeting.agentId === agentId
    );
    return targetingResults;
  }
  
  async createAiTargeting(targeting: InsertAiTargetingResults): Promise<AiTargetingResults> {
    const newTargeting: AiTargetingResults = {
      ...targeting,
      id: this.aiTargetingResultsCurrentId++,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Initialize empty arrays and objects if not provided
      matchedTenants: targeting.matchedTenants || [],
      insights: targeting.insights || [],
      emailTemplate: targeting.emailTemplate || null,
      smsTemplate: targeting.smsTemplate || null,
      socialMediaContent: targeting.socialMediaContent || {},
      propertyFilters: targeting.propertyFilters || {},
      tenantFilters: targeting.tenantFilters || {}
    };
    
    this.aiTargetingResultsData.set(newTargeting.id, newTargeting);
    return newTargeting;
  }
  
  async updateAiTargeting(id: number, targeting: Partial<AiTargetingResults>): Promise<AiTargetingResults | undefined> {
    const existingTargeting = this.aiTargetingResultsData.get(id);
    if (!existingTargeting) {
      return undefined;
    }
    
    const updatedTargeting: AiTargetingResults = {
      ...existingTargeting,
      ...targeting,
      updatedAt: new Date()
    };
    
    this.aiTargetingResultsData.set(id, updatedTargeting);
    return updatedTargeting;
  }
  
  async deleteAiTargeting(id: number): Promise<boolean> {
    return this.aiTargetingResultsData.delete(id);
  }
  
  // Property-Tenant Match methods
  async getPropertyTenantMatch(id: number): Promise<PropertyTenantMatch | undefined> {
    return this.propertyTenantMatchesData.get(id);
  }
  
  async getPropertyTenantMatchesByProperty(propertyId: number): Promise<PropertyTenantMatch[]> {
    const matches = Array.from(this.propertyTenantMatchesData.values()).filter(
      (match) => match.propertyId === propertyId
    );
    return matches;
  }
  
  async getPropertyTenantMatchesByTenant(tenantId: number): Promise<PropertyTenantMatch[]> {
    const matches = Array.from(this.propertyTenantMatchesData.values()).filter(
      (match) => match.tenantId === tenantId
    );
    return matches;
  }
  
  async getPropertyTenantMatchesByTargeting(targetingId: number): Promise<PropertyTenantMatch[]> {
    const matches = Array.from(this.propertyTenantMatchesData.values()).filter(
      (match) => match.targetingId === targetingId
    );
    return matches;
  }
  
  async createPropertyTenantMatch(match: Partial<PropertyTenantMatch>): Promise<PropertyTenantMatch> {
    const newMatch: PropertyTenantMatch = {
      ...match as any, // Type casting to bypass TypeScript checks
      id: this.propertyTenantMatchesCurrentId++,
      createdAt: new Date(),
      updatedAt: new Date(),
      matchScore: match.matchScore || 0,
      matchReasons: match.matchReasons || []
    };
    
    this.propertyTenantMatchesData.set(newMatch.id, newMatch);
    return newMatch;
  }
  
  async updatePropertyTenantMatch(id: number, match: Partial<PropertyTenantMatch>): Promise<PropertyTenantMatch | undefined> {
    const existingMatch = this.propertyTenantMatchesData.get(id);
    if (!existingMatch) {
      return undefined;
    }
    
    const updatedMatch: PropertyTenantMatch = {
      ...existingMatch,
      ...match,
      updatedAt: new Date()
    };
    
    this.propertyTenantMatchesData.set(id, updatedMatch);
    return updatedMatch;
  }
  
  async deletePropertyTenantMatch(id: number): Promise<boolean> {
    return this.propertyTenantMatchesData.delete(id);
  }
  
  // User helper methods
  async getUsersByType(userType: string): Promise<User[]> {
    const users = Array.from(this.usersData.values()).filter(
      (user) => user.userType === userType
    );
    return users;
  }
  
  // Enhanced Marketplace methods
  async searchMarketplaceItems(query: string): Promise<any[]> {
    const items = Array.from(this.marketplaceItemsData.values())
      .filter(item => 
        (item.status === 'available') && 
        (item.title.toLowerCase().includes(query.toLowerCase()) || 
         item.description.toLowerCase().includes(query.toLowerCase()) ||
         (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))))
      )
      .map(item => ({
        id: item.id,
        title: item.title,
        type: 'item' as const,
        price: item.price?.toString(),
        image: item.images && item.images.length > 0 ? item.images[0] : null,
        category: item.category,
        location: item.location
      }));
      
    // Log search for analytics
    const searchEntry = {
      id: Date.now(),
      query,
      timestamp: new Date(),
      resultCount: items.length
    };
    this.marketplaceSearchHistoryData.set(searchEntry.id, searchEntry);
    
    return items.slice(0, 10); // Limit to 10 results
  }
  
  async getMarketplaceFraudAlerts(status: string = 'new'): Promise<any[]> {
    return Array.from(this.marketplaceFraudAlertsData.values())
      .filter(alert => status === 'all' || alert.status === status)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getMarketplaceFraudStats(): Promise<any> {
    const alerts = Array.from(this.marketplaceFraudAlertsData.values());
    
    // Calculate statistics
    const totalAlerts = alerts.length;
    const resolvedAlerts = alerts.filter(a => a.status === 'resolved').length;
    const dismissedAlerts = alerts.filter(a => a.status === 'dismissed').length;
    const newAlerts = alerts.filter(a => a.status === 'new').length;
    
    const highSeverity = alerts.filter(a => a.severity === 'high').length;
    const mediumSeverity = alerts.filter(a => a.severity === 'medium').length;
    const lowSeverity = alerts.filter(a => a.severity === 'low').length;
    
    // Most common fraud types
    const fraudTypes = alerts.reduce((acc, alert) => {
      acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const sortedFraudTypes = Object.entries(fraudTypes)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
    
    return {
      totalAlerts,
      resolvedAlerts,
      dismissedAlerts,
      newAlerts,
      severityBreakdown: {
        high: highSeverity,
        medium: mediumSeverity,
        low: lowSeverity
      },
      commonFraudTypes: sortedFraudTypes,
      lastUpdated: new Date()
    };
  }
  
  async processMarketplaceFraudAlert(alertId: number, action: 'resolve' | 'dismiss', reviewerId: number, note?: string): Promise<any> {
    const alert = this.marketplaceFraudAlertsData.get(alertId);
    if (!alert) {
      throw new Error(`Fraud alert with ID ${alertId} not found`);
    }
    
    alert.status = action;
    alert.reviewerId = reviewerId;
    alert.reviewNote = note || '';
    alert.reviewedAt = new Date();
    
    this.marketplaceFraudAlertsData.set(alertId, alert);
    
    if (action === 'resolve' && alert.targetType === 'item' && alert.targetId) {
      // If resolving, take action on the item
      const item = this.marketplaceItemsData.get(alert.targetId);
      if (item) {
        item.status = 'removed';
        item.updatedAt = new Date();
        this.marketplaceItemsData.set(item.id, item);
      }
    }
    
    return alert;
  }
  
  async getMarketplaceReviews(targetType: 'item' | 'user', targetId: number, sort: string = 'newest', ratingFilter?: number | null): Promise<any> {
    let reviews = Array.from(this.marketplaceReviewsData.values())
      .filter(review => 
        review.targetType === targetType && 
        review.targetId === targetId &&
        (ratingFilter ? review.rating === ratingFilter : true)
      );
    
    // Apply sorting
    switch (sort) {
      case 'newest':
        reviews = reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        reviews = reviews.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'highest':
        reviews = reviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        reviews = reviews.sort((a, b) => a.rating - b.rating);
        break;
      case 'helpful':
        reviews = reviews.sort((a, b) => b.helpful - a.helpful);
        break;
      default:
        reviews = reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    // Calculate aggregate ratings data
    const totalReviews = reviews.length;
    const ratingCounts = {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length
    };
    
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;
    
    return {
      reviews,
      stats: {
        totalReviews,
        averageRating,
        ratingCounts
      }
    };
  }
  
  async getMarketplaceReviewsWithUserReactions(targetType: 'item' | 'user', targetId: number, userId: number, sort: string = 'newest', ratingFilter?: number | null): Promise<any> {
    const result = await this.getMarketplaceReviews(targetType, targetId, sort, ratingFilter);
    
    // Add user reactions to reviews
    const reviewsWithReactions = result.reviews.map(review => {
      // Find user reactions for this review
      const userReaction = Array.from(this.marketplaceReviewReactionsData.values())
        .find(reaction => reaction.reviewId === review.id && reaction.userId === userId);
      
      return {
        ...review,
        reactions: userReaction 
          ? {
              helpful: userReaction.type === 'helpful',
              unhelpful: userReaction.type === 'unhelpful',
              reported: !!Array.from(this.marketplaceReviewReportsData.values())
                .find(report => report.reviewId === review.id && report.reporterId === userId)
            }
          : {
              helpful: false,
              unhelpful: false,
              reported: false
            }
      };
    });
    
    return {
      ...result,
      reviews: reviewsWithReactions
    };
  }
  
  async createMarketplaceReview(reviewData: {
    targetId: number, 
    targetType: 'item' | 'user', 
    reviewerId: number, 
    rating: number, 
    title?: string, 
    content: string, 
    verifiedPurchase?: boolean
  }): Promise<any> {
    // Check if user already reviewed this target
    const existingReview = Array.from(this.marketplaceReviewsData.values())
      .find(review => 
        review.targetId === reviewData.targetId && 
        review.targetType === reviewData.targetType && 
        review.reviewerId === reviewData.reviewerId
      );
    
    if (existingReview) {
      throw new Error('You have already reviewed this item');
    }
    
    // Get reviewer details
    const reviewer = this.usersData.get(reviewData.reviewerId);
    if (!reviewer) {
      throw new Error('Reviewer not found');
    }
    
    // Create new review
    const newReview = {
      id: this.marketplaceReviewCurrentId++,
      reviewerId: reviewData.reviewerId,
      reviewerName: reviewer.name,
      reviewerAvatar: reviewer.avatarUrl || undefined,
      reviewerVerified: reviewer.verified || false,
      targetId: reviewData.targetId,
      targetType: reviewData.targetType,
      rating: reviewData.rating,
      title: reviewData.title || undefined,
      content: reviewData.content,
      verifiedPurchase: reviewData.verifiedPurchase || false,
      helpful: 0,
      unhelpful: 0,
      createdAt: new Date().toISOString(),
      images: []
    };
    
    this.marketplaceReviewsData.set(newReview.id, newReview);
    
    // Update target's average rating
    this.updateTargetAverageRating(reviewData.targetType, reviewData.targetId);
    
    return newReview;
  }
  
  async addImagesToMarketplaceReview(reviewId: number, imagePaths: string[]): Promise<any> {
    const review = this.marketplaceReviewsData.get(reviewId);
    if (!review) {
      throw new Error(`Review with ID ${reviewId} not found`);
    }
    
    review.images = [...(review.images || []), ...imagePaths];
    review.updatedAt = new Date().toISOString();
    
    this.marketplaceReviewsData.set(reviewId, review);
    return review;
  }
  
  async reactToMarketplaceReview(reviewId: number, userId: number, type: 'helpful' | 'unhelpful', value: boolean): Promise<any> {
    const review = this.marketplaceReviewsData.get(reviewId);
    if (!review) {
      throw new Error(`Review with ID ${reviewId} not found`);
    }
    
    // Check if user has already reacted
    const existingReactionKey = Array.from(this.marketplaceReviewReactionsData.entries())
      .find(([_, reaction]) => reaction.reviewId === reviewId && reaction.userId === userId);
    
    const reactionId = existingReactionKey ? existingReactionKey[0] : Date.now();
    
    if (value) {
      // Add or update reaction
      const reaction = {
        id: reactionId,
        reviewId,
        userId,
        type,
        createdAt: new Date().toISOString()
      };
      
      // If changing reaction type, update counts accordingly
      if (existingReactionKey) {
        const existingReaction = existingReactionKey[1];
        if (existingReaction.type !== type) {
          // Decrease count for old reaction type
          if (existingReaction.type === 'helpful') {
            review.helpful = Math.max(0, review.helpful - 1);
          } else {
            review.unhelpful = Math.max(0, review.unhelpful - 1);
          }
          
          // Increase count for new reaction type
          if (type === 'helpful') {
            review.helpful++;
          } else {
            review.unhelpful++;
          }
        }
      } else {
        // New reaction, just increase the count
        if (type === 'helpful') {
          review.helpful++;
        } else {
          review.unhelpful++;
        }
      }
      
      this.marketplaceReviewReactionsData.set(reactionId, reaction);
    } else {
      // Remove reaction if exists
      if (existingReactionKey) {
        const existingReaction = existingReactionKey[1];
        
        // Decrease count
        if (existingReaction.type === 'helpful') {
          review.helpful = Math.max(0, review.helpful - 1);
        } else {
          review.unhelpful = Math.max(0, review.unhelpful - 1);
        }
        
        this.marketplaceReviewReactionsData.delete(existingReactionKey[0]);
      }
    }
    
    // Update review with new counts
    this.marketplaceReviewsData.set(reviewId, review);
    
    return review;
  }
  
  async reportMarketplaceReview(reviewId: number, reporterId: number, reason: string): Promise<any> {
    const review = this.marketplaceReviewsData.get(reviewId);
    if (!review) {
      throw new Error(`Review with ID ${reviewId} not found`);
    }
    
    // Check if user has already reported
    const existingReport = Array.from(this.marketplaceReviewReportsData.values())
      .find(report => report.reviewId === reviewId && report.reporterId === reporterId);
    
    if (existingReport) {
      throw new Error('You have already reported this review');
    }
    
    // Create report
    const newReport = {
      id: this.marketplaceReviewReportCurrentId++,
      reviewId,
      reporterId,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    this.marketplaceReviewReportsData.set(newReport.id, newReport);
    
    // Create a fraud alert for moderators
    const newAlert = {
      id: this.marketplaceFraudAlertCurrentId++,
      alertType: 'review_report',
      targetType: 'review',
      targetId: reviewId,
      relatedId: newReport.id,
      severity: 'medium',
      details: {
        reason,
        reviewContent: review.content,
        reviewerId: review.reviewerId
      },
      status: 'new',
      createdAt: new Date().toISOString()
    };
    
    this.marketplaceFraudAlertsData.set(newAlert.id, newAlert);
    
    return {
      success: true,
      message: 'Review reported successfully',
      reportId: newReport.id
    };
  }
  
  // Helper function for enhanced marketplace
  private updateTargetAverageRating(targetType: 'item' | 'user', targetId: number): void {
    const reviews = Array.from(this.marketplaceReviewsData.values())
      .filter(review => review.targetType === targetType && review.targetId === targetId);
    
    const totalReviews = reviews.length;
    if (totalReviews === 0) return;
    
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    
    if (targetType === 'item') {
      const item = this.marketplaceItemsData.get(targetId);
      if (item) {
        item.averageRating = averageRating;
        item.totalReviews = totalReviews;
        item.updatedAt = new Date();
        this.marketplaceItemsData.set(targetId, item);
      }
    } else if (targetType === 'user') {
      const user = this.usersData.get(targetId);
      if (user) {
        if (!user.marketplaceProfile) {
          user.marketplaceProfile = {};
        }
        user.marketplaceProfile.averageRating = averageRating;
        user.marketplaceProfile.totalReviews = totalReviews;
        user.updatedAt = new Date();
        this.usersData.set(targetId, user);
      }
    }
  }

  // Tenant Risk Assessment methods
  async getTenantRiskAssessment(tenantId: number, applicationId?: number): Promise<TenantRiskAssessment | null> {
    // Find by tenant ID and optionally by application ID
    const assessments = Array.from(this.tenantRiskAssessmentsData.values()).filter(
      (assessment) => assessment.tenantId === tenantId && 
        (applicationId ? assessment.applicationId === applicationId : true)
    );
    
    // Return the most recent one if multiple exist
    if (assessments.length > 0) {
      return assessments.sort((a, b) => 
        new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
      )[0];
    }
    
    return null;
  }

  async getTenantRiskAssessmentsByTenant(tenantId: number): Promise<TenantRiskAssessment[]> {
    const assessments = Array.from(this.tenantRiskAssessmentsData.values()).filter(
      (assessment) => assessment.tenantId === tenantId
    );
    
    // Sort by creation date, most recent first
    return assessments.sort((a, b) => 
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  }
  
  async getRecentTenantRiskAssessments(limit: number = 10): Promise<TenantRiskAssessment[]> {
    const assessments = Array.from(this.tenantRiskAssessmentsData.values());
    
    // Sort by creation date, most recent first
    return assessments
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
      .slice(0, limit);
  }
  
  async createTenantRiskAssessment(assessment: InsertTenantRiskAssessment): Promise<TenantRiskAssessment> {
    const id = this.tenantRiskAssessmentCurrentId++;
    const now = new Date();
    
    const newAssessment: TenantRiskAssessment = {
      id,
      createdAt: now,
      updatedAt: now,
      ...assessment
    };
    
    this.tenantRiskAssessmentsData.set(id, newAssessment);
    return newAssessment;
  }
  
  async saveTenantRiskAssessment(assessment: TenantRiskAssessment): Promise<TenantRiskAssessment> {
    this.tenantRiskAssessmentsData.set(assessment.id, assessment);
    return assessment;
  }
  
  async updateTenantRiskAssessment(id: number, assessment: Partial<TenantRiskAssessment>): Promise<TenantRiskAssessment | null> {
    const existingAssessment = this.tenantRiskAssessmentsData.get(id);
    
    if (!existingAssessment) {
      return null;
    }
    
    const updatedAssessment = {
      ...existingAssessment,
      ...assessment,
      updatedAt: new Date()
    };
    
    this.tenantRiskAssessmentsData.set(id, updatedAssessment);
    return updatedAssessment;
  }
  
  async verifyTenantRiskAssessment(id: number, verifiedById: number): Promise<TenantRiskAssessment | null> {
    const existingAssessment = this.tenantRiskAssessmentsData.get(id);
    
    if (!existingAssessment) {
      return null;
    }
    
    const updatedAssessment = {
      ...existingAssessment,
      verified: true,
      verifiedBy: verifiedById,
      verifiedAt: new Date(),
      updatedAt: new Date()
    };
    
    this.tenantRiskAssessmentsData.set(id, updatedAssessment);
    return updatedAssessment;
  }
  
  async deleteTenantRiskAssessment(id: number): Promise<boolean> {
    return this.tenantRiskAssessmentsData.delete(id);
  }

  // Fraud Alert methods implementation
  async createFraudAlert(alert: InsertFraudAlert): Promise<FraudAlert> {
    const newAlert: FraudAlert = {
      ...alert,
      id: this.fraudAlertCurrentId++,
      timestamp: alert.timestamp || new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.fraudAlertsData.set(newAlert.id, newAlert);
    return newAlert;
  }

  async getFraudAlert(id: number): Promise<FraudAlert | undefined> {
    return this.fraudAlertsData.get(id);
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
    let alerts = Array.from(this.fraudAlertsData.values());
    
    if (options) {
      if (options.userId) {
        alerts = alerts.filter(alert => alert.userId === options.userId);
      }
      if (options.userType) {
        alerts = alerts.filter(alert => alert.userType === options.userType);
      }
      if (options.activityType) {
        alerts = alerts.filter(alert => alert.activityType === options.activityType);
      }
      if (options.severity) {
        alerts = alerts.filter(alert => alert.severity === options.severity);
      }
      if (options.status) {
        alerts = alerts.filter(alert => alert.status === options.status);
      }
      if (options.startDate) {
        alerts = alerts.filter(alert => alert.timestamp >= options.startDate);
      }
      if (options.endDate) {
        alerts = alerts.filter(alert => alert.timestamp <= options.endDate);
      }

      // Sort by timestamp descending (newest first)
      alerts = alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      // Apply offset and limit if provided
      if (options.offset) {
        alerts = alerts.slice(options.offset);
      }
      if (options.limit) {
        alerts = alerts.slice(0, options.limit);
      }
    }
    
    return alerts;
  }

  async getRecentFraudAlerts(limit: number = 10): Promise<FraudAlert[]> {
    return this.getFraudAlerts({ limit });
  }

  async getFraudAlertsByUser(userId: number): Promise<FraudAlert[]> {
    return this.getFraudAlerts({ userId });
  }

  async getFraudAlertsByActivityType(activityType: string): Promise<FraudAlert[]> {
    return this.getFraudAlerts({ activityType });
  }

  async getFraudAlertsBySeverity(severity: string): Promise<FraudAlert[]> {
    return this.getFraudAlerts({ severity });
  }

  async getFraudAlertsByStatus(status: string): Promise<FraudAlert[]> {
    return this.getFraudAlerts({ status });
  }
  
  async getFraudStats(timeframe: 'day' | 'week' | 'month' | 'year'): Promise<any> {
    const allAlerts = await this.getFraudAlerts();
    const now = new Date();
    
    // Filter alerts based on timeframe
    const filteredAlerts = allAlerts.filter(alert => {
      const alertDate = new Date(alert.timestamp);
      
      switch (timeframe) {
        case 'day':
          return alertDate.getDate() === now.getDate() &&
                 alertDate.getMonth() === now.getMonth() &&
                 alertDate.getFullYear() === now.getFullYear();
        
        case 'week':
          const oneWeekAgo = new Date(now);
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return alertDate >= oneWeekAgo;
          
        case 'month':
          return alertDate.getMonth() === now.getMonth() &&
                 alertDate.getFullYear() === now.getFullYear();
                 
        case 'year':
          return alertDate.getFullYear() === now.getFullYear();
          
        default:
          return true;
      }
    });
    
    // Count alerts by status and severity
    const countByStatus = {
      new: filteredAlerts.filter(a => a.status === 'new').length,
      reviewing: filteredAlerts.filter(a => a.status === 'reviewing').length,
      resolved: filteredAlerts.filter(a => a.status === 'resolved').length,
      dismissed: filteredAlerts.filter(a => a.status === 'dismissed').length
    };
    
    const countBySeverity = {
      low: filteredAlerts.filter(a => a.severity === 'low').length,
      medium: filteredAlerts.filter(a => a.severity === 'medium').length,
      high: filteredAlerts.filter(a => a.severity === 'high').length,
      critical: filteredAlerts.filter(a => a.severity === 'critical').length
    };
    
    // Count by activity type
    const activityTypeCounts: Record<string, number> = {};
    filteredAlerts.forEach(alert => {
      activityTypeCounts[alert.activityType] = (activityTypeCounts[alert.activityType] || 0) + 1;
    });
    
    // Calculate AI accuracy
    const reviewedAlerts = filteredAlerts.filter(a => 
      a.status === 'resolved' || a.status === 'dismissed'
    );
    
    const truePositives = reviewedAlerts.filter(a => a.status === 'resolved').length;
    const falsePositives = reviewedAlerts.filter(a => a.status === 'dismissed').length;
    
    const accuracy = reviewedAlerts.length > 0 
      ? truePositives / reviewedAlerts.length
      : 0;
    
    return {
      totalAlerts: filteredAlerts.length,
      countByStatus,
      countBySeverity,
      activityTypes: Object.keys(activityTypeCounts).map(type => ({
        type,
        count: activityTypeCounts[type],
        percentage: filteredAlerts.length > 0 ? 
          activityTypeCounts[type] / filteredAlerts.length : 0
      })),
      aiPerformance: {
        accuracy,
        truePositives,
        falsePositives
      }
    };
  }
  
  // User Activity tracking methods
  async logUserActivity(userId: number, activityType: string, activityData: Record<string, any>, ipAddress?: string, deviceInfo?: string): Promise<UserActivity> {
    const id = this.userActivityCurrentId++;
    const activity: UserActivity = {
      id,
      userId,
      activityType,
      activityData,
      ipAddress,
      deviceInfo,
      timestamp: new Date()
    };
    
    this.userActivitiesData.set(id, activity);
    return activity;
  }

  async getUserActivity(id: number): Promise<UserActivity | undefined> {
    return this.userActivitiesData.get(id);
  }

  async getUserActivities(userId: number): Promise<UserActivity[]> {
    return Array.from(this.userActivitiesData.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort by most recent first
  }

  async getUserActivitiesByType(userId: number, activityType: string): Promise<UserActivity[]> {
    return Array.from(this.userActivitiesData.values())
      .filter(activity => activity.userId === userId && activity.activityType === activityType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  async getAllUserActivities(): Promise<UserActivity[]> {
    return Array.from(this.userActivitiesData.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  async getRecentUserActivities(limit: number = 100): Promise<UserActivity[]> {
    return Array.from(this.userActivitiesData.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Virtual Viewing Sessions Methods
  async createVirtualViewingSession(session: InsertVirtualViewingSession): Promise<VirtualViewingSession> {
    const id = this.virtualViewingSessionCurrentId++;
    const now = new Date();
    
    const newSession: VirtualViewingSession = {
      id,
      createdAt: now,
      updatedAt: now,
      participants: [],
      messages: [],
      status: "waiting",
      ...session,
      feedbackRequested: false,
    };
    
    this.virtualViewingSessionsData.set(id, newSession);
    return newSession;
  }

  async getVirtualViewingSession(id: number): Promise<VirtualViewingSession | undefined> {
    return this.virtualViewingSessionsData.get(id);
  }

  async getVirtualViewingSessionBySessionId(sessionId: string): Promise<VirtualViewingSession | undefined> {
    return Array.from(this.virtualViewingSessionsData.values()).find(
      (session) => session.sessionId === sessionId
    );
  }

  async getVirtualViewingSessionsByProperty(propertyId: number): Promise<VirtualViewingSession[]> {
    return Array.from(this.virtualViewingSessionsData.values()).filter(
      (session) => session.propertyId === propertyId
    );
  }

  async getVirtualViewingSessionsByViewingRequest(viewingRequestId: number): Promise<VirtualViewingSession[]> {
    return Array.from(this.virtualViewingSessionsData.values()).filter(
      (session) => session.viewingRequestId === viewingRequestId
    );
  }

  async getVirtualViewingSessionsByHost(hostId: number): Promise<VirtualViewingSession[]> {
    return Array.from(this.virtualViewingSessionsData.values()).filter(
      (session) => session.hostId === hostId
    );
  }

  async updateVirtualViewingSession(id: number, sessionData: Partial<VirtualViewingSession>): Promise<VirtualViewingSession | undefined> {
    const session = this.virtualViewingSessionsData.get(id);
    if (!session) return undefined;

    const updatedSession = {
      ...session,
      ...sessionData,
      updatedAt: new Date()
    };

    this.virtualViewingSessionsData.set(id, updatedSession);
    return updatedSession;
  }

  async updateVirtualViewingSessionStatus(id: number, status: string): Promise<VirtualViewingSession | undefined> {
    return this.updateVirtualViewingSession(id, { status });
  }

  async addParticipantToSession(
    sessionId: number, 
    participant: {
      userId: number;
      name: string;
      role: string;
      connectionStatus?: string;
    }
  ): Promise<VirtualViewingSession | undefined> {
    const session = this.virtualViewingSessionsData.get(sessionId);
    if (!session) return undefined;

    const participantWithDefaults = {
      ...participant,
      joinedAt: new Date(),
      connectionStatus: participant.connectionStatus || "connecting"
    };

    const updatedParticipants = [...(session.participants || []), participantWithDefaults];
    
    return this.updateVirtualViewingSession(sessionId, { participants: updatedParticipants });
  }

  async updateParticipantStatus(
    sessionId: number, 
    participantIndex: number, 
    connectionStatus: string
  ): Promise<VirtualViewingSession | undefined> {
    const session = this.virtualViewingSessionsData.get(sessionId);
    if (!session || !session.participants || participantIndex >= session.participants.length) {
      return undefined;
    }

    const updatedParticipants = [...session.participants];
    updatedParticipants[participantIndex] = {
      ...updatedParticipants[participantIndex],
      connectionStatus
    };

    return this.updateVirtualViewingSession(sessionId, { participants: updatedParticipants });
  }

  async removeParticipantFromSession(
    sessionId: number, 
    participantIndex: number
  ): Promise<VirtualViewingSession | undefined> {
    const session = this.virtualViewingSessionsData.get(sessionId);
    if (!session || !session.participants || participantIndex >= session.participants.length) {
      return undefined;
    }

    const updatedParticipants = [...session.participants];
    updatedParticipants.splice(participantIndex, 1);

    return this.updateVirtualViewingSession(sessionId, { participants: updatedParticipants });
  }

  async addMessageToSession(
    sessionId: number, 
    message: {
      userId: number;
      name: string;
      text: string;
      timestamp?: Date;
    }
  ): Promise<VirtualViewingSession | undefined> {
    const session = this.virtualViewingSessionsData.get(sessionId);
    if (!session) return undefined;

    const messageWithDefaults = {
      ...message,
      timestamp: message.timestamp || new Date()
    };

    const updatedMessages = [...(session.messages || []), messageWithDefaults];
    
    return this.updateVirtualViewingSession(sessionId, { messages: updatedMessages });
  }

  async requestFeedback(sessionId: number): Promise<VirtualViewingSession | undefined> {
    return this.updateVirtualViewingSession(sessionId, { 
      feedbackRequested: true,
      feedbackRequestedAt: new Date()
    });
  }

  // Viewing Feedback Methods
  async createViewingFeedback(feedback: InsertViewingFeedback): Promise<ViewingFeedback> {
    const id = this.viewingFeedbackCurrentId++;
    const now = new Date();
    
    const newFeedback: ViewingFeedback = {
      id,
      createdAt: now,
      updatedAt: now,
      ...feedback
    };
    
    this.viewingFeedbackData.set(id, newFeedback);
    return newFeedback;
  }

  async getViewingFeedback(id: number): Promise<ViewingFeedback | undefined> {
    return this.viewingFeedbackData.get(id);
  }

  async getViewingFeedbackByViewingRequest(viewingRequestId: number): Promise<ViewingFeedback | undefined> {
    return Array.from(this.viewingFeedbackData.values()).find(
      (feedback) => feedback.viewingRequestId === viewingRequestId
    );
  }

  async getViewingFeedbackByProperty(propertyId: number): Promise<ViewingFeedback[]> {
    return Array.from(this.viewingFeedbackData.values()).filter(
      (feedback) => feedback.propertyId === propertyId
    );
  }

  async getViewingFeedbackByUser(userId: number): Promise<ViewingFeedback[]> {
    return Array.from(this.viewingFeedbackData.values()).filter(
      (feedback) => feedback.userId === userId
    );
  }

  async updateViewingFeedback(id: number, feedbackData: Partial<ViewingFeedback>): Promise<ViewingFeedback | undefined> {
    const feedback = this.viewingFeedbackData.get(id);
    if (!feedback) return undefined;

    const updatedFeedback = {
      ...feedback,
      ...feedbackData,
      updatedAt: new Date()
    };

    this.viewingFeedbackData.set(id, updatedFeedback);
    return updatedFeedback;
  }

  // Property Update Notification methods
  async getPropertyUpdateNotifications(propertyId: number): Promise<PropertyUpdateNotification[]> {
    return Array.from(this.propertyUpdateNotificationsData.values())
      .filter(notification => notification.propertyId === propertyId);
  }

  async getPropertyUpdateNotification(id: number): Promise<PropertyUpdateNotification | undefined> {
    return this.propertyUpdateNotificationsData.get(id);
  }

  async createPropertyUpdateNotification(notification: InsertPropertyUpdateNotification): Promise<PropertyUpdateNotification> {
    const newNotification: PropertyUpdateNotification = {
      ...notification,
      id: this.propertyUpdateNotificationCurrentId++,
      sentAt: notification.sentAt || new Date(),
      recipientCount: notification.recipientCount || 0,
      successful: notification.successful || false
    };
    this.propertyUpdateNotificationsData.set(newNotification.id, newNotification);
    return newNotification;
  }

  async updatePropertyUpdateNotification(id: number, notification: Partial<PropertyUpdateNotification>): Promise<PropertyUpdateNotification | undefined> {
    const existingNotification = this.propertyUpdateNotificationsData.get(id);
    
    if (!existingNotification) {
      return undefined;
    }
    

    
    const updatedNotification = {
      ...existingNotification,
      ...notification
    };
    
    this.propertyUpdateNotificationsData.set(id, updatedNotification);
    return updatedNotification;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersData.values());
  }

  async updateFraudAlertStatus(
    id: number, 
    status: string, 
    reviewedBy?: number, 
    reviewNotes?: string
  ): Promise<FraudAlert | undefined> {
    const alert = await this.getFraudAlert(id);
    if (!alert) return undefined;

    const updatedAlert: FraudAlert = {
      ...alert,
      status,
      updatedAt: new Date()
    };

    if (reviewedBy) {
      updatedAlert.reviewedBy = reviewedBy;
      updatedAlert.reviewedAt = new Date();
    }

    if (reviewNotes) {
      updatedAlert.reviewNotes = reviewNotes;
    }

    this.fraudAlertsData.set(id, updatedAlert);
    return updatedAlert;
  }

  async deleteFraudAlert(id: number): Promise<boolean> {
    return this.fraudAlertsData.delete(id);
  }

  private addSampleUserActivities() {
    // Sample user activities for demonstration
    const sampleActivities: UserActivity[] = [
      {
        id: this.userActivityCurrentId++,
        userId: 6, // Tenant
        activityType: 'login',
        activityData: {
          browser: 'Chrome',
          os: 'Windows',
          success: true
        },
        ipAddress: '192.168.1.101',
        deviceInfo: 'Windows 11, Chrome 120',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: this.userActivityCurrentId++,
        userId: 6, // Tenant
        activityType: 'property_view',
        activityData: {
          propertyId: 1,
          timeSpent: '3m 45s',
          sections: ['details', 'photos', 'map', 'application']
        },
        ipAddress: '192.168.1.101',
        deviceInfo: 'Windows 11, Chrome 120',
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000) // 1.5 hours ago
      },
      {
        id: this.userActivityCurrentId++,
        userId: 6, // Tenant
        activityType: 'application_start',
        activityData: {
          propertyId: 1,
          applicationType: 'standard'
        },
        ipAddress: '192.168.1.101',
        deviceInfo: 'Windows 11, Chrome 120',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      },
      {
        id: this.userActivityCurrentId++,
        userId: 3, // Landlord
        activityType: 'login',
        activityData: {
          browser: 'Safari',
          os: 'macOS',
          success: true
        },
        ipAddress: '192.168.1.202',
        deviceInfo: 'macOS 14, Safari 17',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
      },
      {
        id: this.userActivityCurrentId++,
        userId: 3, // Landlord
        activityType: 'profile_update',
        activityData: {
          fields: ['banking_details', 'contact_info'],
          changes: {
            'phone': { 'old': '07700900001', 'new': '07700900011' },
            'bank_account': { 'old': '****1234', 'new': '****5678' }
          }
        },
        ipAddress: '192.168.1.202',
        deviceInfo: 'macOS 14, Safari 17',
        timestamp: new Date(Date.now() - 4.5 * 60 * 60 * 1000) // 4.5 hours ago
      },
      {
        id: this.userActivityCurrentId++,
        userId: 4, // Agent
        activityType: 'login',
        activityData: {
          browser: 'Firefox',
          os: 'Linux',
          success: true
        },
        ipAddress: '192.168.1.150',
        deviceInfo: 'Ubuntu 22.04, Firefox 120',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
      },
      {
        id: this.userActivityCurrentId++,
        userId: 4, // Agent
        activityType: 'property_add',
        activityData: {
          propertyId: 6,
          propertyType: 'apartment',
          bedrooms: 3,
          location: 'Leeds'
        },
        ipAddress: '192.168.1.150',
        deviceInfo: 'Ubuntu 22.04, Firefox 120',
        timestamp: new Date(Date.now() - 7.5 * 60 * 60 * 1000) // 7.5 hours ago
      },
      {
        id: this.userActivityCurrentId++,
        userId: 4, // Agent
        activityType: 'document_upload',
        activityData: {
          documentId: 'doc123',
          documentType: 'floorplan',
          propertyId: 6,
          fileSize: '2.4MB'
        },
        ipAddress: '192.168.1.150',
        deviceInfo: 'Ubuntu 22.04, Firefox 120',
        timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000) // 7 hours ago
      },
      {
        id: this.userActivityCurrentId++,
        userId: 7, // Tenant
        activityType: 'login_failed',
        activityData: {
          attemptCount: 3,
          reason: 'incorrect_password',
          browser: 'Mobile Chrome',
          os: 'Android'
        },
        ipAddress: '192.168.1.175',
        deviceInfo: 'Android 13, Chrome Mobile 119',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      },
      {
        id: this.userActivityCurrentId++,
        userId: 7, // Tenant
        activityType: 'password_reset',
        activityData: {
          requestMethod: 'email',
          completed: true
        },
        ipAddress: '192.168.1.175',
        deviceInfo: 'Android 13, Chrome Mobile 119',
        timestamp: new Date(Date.now() - 11.5 * 60 * 60 * 1000) // 11.5 hours ago
      }
    ];
    
    // Add activities to storage
    for (const activity of sampleActivities) {
      this.userActivitiesData.set(activity.id, activity);
    }
  }

  private addSampleFraudAlerts() {
    // Sample fraud alerts for demonstration
    const sampleFraudAlerts: FraudAlert[] = [
      {
        id: this.fraudAlertCurrentId++,
        userId: 6, // Tenant ID
        userType: 'tenant',
        activityType: 'user_registration',
        severity: 'medium',
        details: 'Multiple registration attempts with same email but different personal details',
        activityData: {
          email: 'suspicious.tenant@example.com',
          attemptCount: 3,
          ipAddresses: ['198.51.100.123', '198.51.100.234', '198.51.100.213'],
          timeSpan: '10 minutes'
        },
        ipAddress: '198.51.100.213',
        deviceInfo: 'Mobile Android 13.0, Chrome 108',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        status: 'reviewing',
        reviewedBy: 1, // Admin ID
        reviewNotes: 'Investigating pattern of registration attempts',
        reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: this.fraudAlertCurrentId++,
        userId: 5, // Tenant ID
        userType: 'tenant',
        activityType: 'document_upload',
        severity: 'high',
        details: 'Potentially doctored identification document detected by AI analysis',
        activityData: {
          documentType: 'passport',
          anomalies: ['inconsistent font', 'digital manipulation detected', 'security features missing'],
          aiConfidence: 0.92
        },
        ipAddress: '198.51.100.45',
        deviceInfo: 'Windows 11, Firefox 112',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        status: 'confirmed',
        reviewedBy: 1, // Admin ID
        reviewNotes: 'Document confirmed to be falsified after manual verification',
        reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: this.fraudAlertCurrentId++,
        userId: null,
        userType: null,
        activityType: 'login_attempt',
        severity: 'critical',
        details: 'Multiple failed login attempts from unusual location',
        activityData: {
          targetEmails: ['admin@example.com', 'landlord@example.com', 'agent@example.com'],
          attemptCount: 27,
          timeSpan: '5 minutes',
          pattern: 'sequential'
        },
        ipAddress: '203.0.113.42',
        deviceInfo: 'Linux, Chrome 109',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        status: 'new',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      },
      {
        id: this.fraudAlertCurrentId++,
        userId: 4, // Agent ID
        userType: 'agent',
        activityType: 'payment_processing',
        severity: 'high',
        details: 'Unusual payment pattern detected',
        activityData: {
          paymentMethod: 'credit_card',
          amount: 12500,
          currency: 'GBP',
          cardCountry: 'RU',
          userCountry: 'GB',
          previousTransactions: 0
        },
        ipAddress: '203.0.113.89',
        deviceInfo: 'macOS 14.2, Safari 17',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        status: 'dismissed',
        reviewedBy: 1, // Admin ID
        reviewNotes: 'Verified with agent - legitimate international client payment',
        reviewedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      },
      {
        id: this.fraudAlertCurrentId++,
        userId: 7, // Tenant ID
        userType: 'tenant',
        activityType: 'property_application',
        severity: 'medium',
        details: 'Multiple high-value property applications within short timeframe',
        activityData: {
          propertyIds: [1, 3, 5],
          totalValue: '4200',
          applicationInterval: '10 minutes',
          previousApplications: 0,
          incomeVerified: false
        },
        ipAddress: '198.51.100.78',
        deviceInfo: 'iPhone iOS 17.1, Mobile Safari',
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        status: 'confirmed',
        reviewedBy: 1, // Admin ID
        reviewNotes: 'Applicant unable to verify income or employment status',
        reviewedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
      },
      {
        id: this.fraudAlertCurrentId++,
        userId: 3, // Landlord ID
        userType: 'landlord',
        activityType: 'profile_update',
        severity: 'low',
        details: 'Suspicious banking details change',
        activityData: {
          fieldChanged: 'bankingDetails',
          oldValue: { bank: 'Barclays', accountNumber: '****7890', sortCode: '20-**-56' },
          newValue: { bank: 'Monzo', accountNumber: '****2345', sortCode: '04-**-75' },
          previousUpdates: 0
        },
        ipAddress: '198.51.100.132',
        deviceInfo: 'Windows 10, Edge 118',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        status: 'dismissed',
        reviewedBy: 1, // Admin ID
        reviewNotes: 'Confirmed as legitimate change with landlord via phone verification',
        reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ];
    
    // Add fraud alerts to storage
    for (const alert of sampleFraudAlerts) {
      this.fraudAlertsData.set(alert.id, alert);
    }
    
    // Add sample city images
    this.addSampleCityImages();
  }
  
  // City Images methods
  async getAllCityImages(): Promise<CityImage[]> {
    return Array.from(this.cityImagesData.values());
  }
  
  async getCityImage(id: number): Promise<CityImage | undefined> {
    return this.cityImagesData.get(id);
  }
  
  async getCityImageByCity(city: string): Promise<CityImage | undefined> {
    return Array.from(this.cityImagesData.values()).find(
      (cityImage) => cityImage.city.toLowerCase() === city.toLowerCase()
    );
  }
  
  async createCityImage(cityImage: InsertCityImage): Promise<CityImage> {
    const newCityImage: CityImage = {
      ...cityImage,
      id: this.cityImageCurrentId++,
      createdAt: new Date(),
      updatedAt: null,
      lastUpdated: new Date(),
      source: cityImage.source || 'uploaded',  // Ensure source is always provided
    };
    this.cityImagesData.set(newCityImage.id, newCityImage);
    return newCityImage;
  }
  
  async updateCityImage(id: number, cityImage: Partial<CityImage>): Promise<CityImage | undefined> {
    const existingCityImage = this.cityImagesData.get(id);
    if (!existingCityImage) {
      return undefined;
    }
    
    const updatedCityImage = {
      ...existingCityImage,
      ...cityImage,
      updatedAt: new Date(),
      lastUpdated: new Date(),
    };
    
    this.cityImagesData.set(id, updatedCityImage);
    return updatedCityImage;
  }
  
  async deleteCityImage(id: number): Promise<boolean> {
    return this.cityImagesData.delete(id);
  }
  
  private addSampleCityImages() {
    // Sample city images
    const sampleCityImages: CityImage[] = [
      {
        id: this.cityImageCurrentId++,
        city: "London",
        imageUrl: "/images/cities/london.jpg",
        source: "default",
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: null,
      },
      {
        id: this.cityImageCurrentId++,
        city: "Manchester",
        imageUrl: "/images/cities/manchester.jpg",
        source: "default",
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: null,
      },
      {
        id: this.cityImageCurrentId++,
        city: "Birmingham",
        imageUrl: "/images/cities/birmingham.jpg",
        source: "default",
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: null,
      },
      {
        id: this.cityImageCurrentId++,
        city: "Leeds",
        imageUrl: "/images/cities/leeds.jpg",
        source: "default",
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: null,
      },
      {
        id: this.cityImageCurrentId++,
        city: "Sheffield",
        imageUrl: "/images/cities/sheffield.jpg",
        source: "default",
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: null,
      },
      {
        id: this.cityImageCurrentId++,
        city: "Bristol",
        imageUrl: "/images/cities/bristol.jpg",
        source: "default",
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: null,
      },
      {
        id: this.cityImageCurrentId++,
        city: "Liverpool",
        imageUrl: "/images/cities/liverpool.jpg",
        source: "default",
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: null,
      },
      {
        id: this.cityImageCurrentId++,
        city: "Newcastle",
        imageUrl: "/images/cities/newcastle.jpg",
        source: "default",
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: null,
      },
      {
        id: this.cityImageCurrentId++,
        city: "Nottingham",
        imageUrl: "/images/cities/nottingham.jpg",
        source: "default",
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: null,
      },
      {
        id: this.cityImageCurrentId++,
        city: "Oxford",
        imageUrl: "/images/cities/oxford.jpg",
        source: "default",
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: null,
      },
      {
        id: this.cityImageCurrentId++,
        city: "Cambridge",
        imageUrl: "/images/cities/cambridge.jpg",
        source: "default",
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: null,
      },
      {
        id: this.cityImageCurrentId++,
        city: "York",
        imageUrl: "/images/cities/york.jpg",
        source: "default",
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: null,
      }
    ];
    
    // Add city images to storage
    for (const cityImage of sampleCityImages) {
      this.cityImagesData.set(cityImage.id, cityImage);
    }
  }
  
  // Viewing Request methods
  async getAllViewingRequests(): Promise<ViewingRequest[]> {
    return Array.from(this.viewingRequestsData.values());
  }

  async getViewingRequest(id: number): Promise<ViewingRequest | undefined> {
    return this.viewingRequestsData.get(id);
  }

  async getViewingRequestsByProperty(propertyId: number): Promise<ViewingRequest[]> {
    return Array.from(this.viewingRequestsData.values()).filter(
      request => request.propertyId === propertyId
    );
  }

  async getViewingRequestsByStatus(status: string): Promise<ViewingRequest[]> {
    return Array.from(this.viewingRequestsData.values()).filter(
      request => request.status === status
    );
  }

  async getViewingRequestsByDate(date: Date): Promise<ViewingRequest[]> {
    const dateString = date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
    
    return Array.from(this.viewingRequestsData.values()).filter(request => {
      // Convert preferredDate to string format for comparison
      const preferredDateString = new Date(request.preferredDate).toISOString().split('T')[0];
      return preferredDateString === dateString;
    });
  }

  async createViewingRequest(request: InsertViewingRequest): Promise<ViewingRequest> {
    const newRequest: ViewingRequest = {
      id: this.viewingRequestCurrentId++,
      ...request,
      status: 'pending', // Default status
      eventId: null, // No calendar event yet
      
      // Default values for enhanced fields
      isGroupViewing: request.isGroupViewing || false,
      groupId: request.groupId || null,
      groupLeadId: request.groupLeadId || null,
      groupMembers: request.groupMembers || [],
      
      timePreference: request.timePreference || {},
      alternativeDates: request.alternativeDates || [],
      matchScore: null,
      
      isVerifiedStudent: request.isVerifiedStudent || false,
      studentIdVerified: request.studentIdVerified || false,
      
      calendarSyncId: request.calendarSyncId || null,
      reminderSent: false,
      reminderSentAt: null,
      
      virtualViewingRequested: request.virtualViewingRequested || false,
      virtualViewingType: request.virtualViewingType || null,
      virtualViewingUrl: request.virtualViewingUrl || null,
      virtualViewingScheduledAt: null,
      
      sourceQrCode: request.sourceQrCode || null,
      sourceLocation: request.sourceLocation || null,
      
      cancellationReason: null,
      sentimentScore: null,
      feedbackProvided: false,
      feedbackContent: null,
      
      chatbotInteractionId: request.chatbotInteractionId || null,
      assistedByAi: request.assistedByAi || false,
      
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.viewingRequestsData.set(newRequest.id, newRequest);
    return newRequest;
  }

  async updateViewingRequest(id: number, data: Partial<ViewingRequest>): Promise<ViewingRequest | undefined> {
    const request = this.viewingRequestsData.get(id);
    if (!request) return undefined;
    
    const updatedRequest = {
      ...request,
      ...data,
      updatedAt: new Date()
    };
    
    this.viewingRequestsData.set(id, updatedRequest);
    return updatedRequest;
  }

  async createViewingCalendarEvent(requestId: number, eventData: InsertCalendarEvent): Promise<{ viewingRequest: ViewingRequest, calendarEvent: CalendarEvent }> {
    // First create the calendar event
    const calendarEvent = await this.createCalendarEvent(eventData);
    
    // Then update the viewing request with the eventId
    const viewingRequest = await this.getViewingRequest(requestId);
    if (!viewingRequest) {
      throw new Error('Viewing request not found');
    }
    
    const updatedRequest = await this.updateViewingRequest(requestId, { 
      eventId: calendarEvent.id,
      status: 'confirmed' // Update status to confirmed once event is created
    });
    
    if (!updatedRequest) {
      throw new Error('Failed to update viewing request');
    }
    
    return {
      viewingRequest: updatedRequest,
      calendarEvent
    };
  }

  async deleteViewingRequest(id: number): Promise<boolean> {
    const request = this.viewingRequestsData.get(id);
    if (!request) return false;
    
    // If there's an associated calendar event, delete it too
    if (request.eventId) {
      await this.deleteCalendarEvent(request.eventId);
    }
    
    return this.viewingRequestsData.delete(id);
  }
  
  // Add sample viewing requests
  private addSampleViewingRequests() {
    const sampleViewingRequests: ViewingRequest[] = [
      {
        id: this.viewingRequestCurrentId++,
        propertyId: 1,
        name: "Emma Wilson",
        email: "emma.wilson@example.com",
        phone: "07712345678",
        university: "University of Leeds",
        preferredDate: new Date(2025, 4, 15), // May 15, 2025
        preferredTime: "afternoon",
        message: "I'd like to view this property with my flatmate. We're both second-year students.",
        status: "pending",
        eventId: null,
        guestId: null,
        
        // Enhanced fields
        isGroupViewing: true,
        groupId: "group-123456",
        groupLeadId: null,
        groupMembers: [
          { name: "Sarah Johnson", email: "sarah.j@example.com", phone: "07712345679" }
        ],
        
        timePreference: { weekdays: true, weekends: false, eveningsOnly: false },
        alternativeDates: ["2025-05-16", "2025-05-18"],
        matchScore: 87,
        
        isVerifiedStudent: true,
        studentIdVerified: false,
        
        calendarSyncId: null,
        reminderSent: false,
        reminderSentAt: null,
        
        virtualViewingRequested: false,
        virtualViewingType: null,
        virtualViewingUrl: null,
        virtualViewingScheduledAt: null,
        
        sourceQrCode: null,
        sourceLocation: null,
        
        cancellationReason: null,
        sentimentScore: null,
        feedbackProvided: false,
        feedbackContent: null,
        
        chatbotInteractionId: null,
        assistedByAi: false,
        
        createdAt: new Date(2025, 4, 10),
        updatedAt: new Date(2025, 4, 10)
      },
      {
        id: this.viewingRequestCurrentId++,
        propertyId: 2,
        name: "James Brown",
        email: "james.brown@example.com",
        phone: "07723456789",
        university: "University of Manchester",
        preferredDate: new Date(2025, 4, 16), // May 16, 2025
        preferredTime: "morning",
        message: "Looking for a place for the next academic year.",
        status: "confirmed",
        eventId: 5, // Related to a calendar event
        guestId: null,
        
        // Enhanced fields
        isGroupViewing: false,
        groupId: null,
        groupLeadId: null,
        groupMembers: [],
        
        timePreference: { weekdays: true, weekends: true, eveningsOnly: false },
        alternativeDates: ["2025-05-18", "2025-05-19", "2025-05-20"],
        matchScore: 92,
        
        isVerifiedStudent: true,
        studentIdVerified: true,
        
        calendarSyncId: "gcal_sync_123456",
        reminderSent: true,
        reminderSentAt: new Date(2025, 4, 15), // A day before
        
        virtualViewingRequested: true,
        virtualViewingType: "recorded",
        virtualViewingUrl: "https://example.com/virtual-tour/property2",
        virtualViewingScheduledAt: null,
        
        sourceQrCode: "QR_1234567",
        sourceLocation: "Campus Notice Board",
        
        cancellationReason: null,
        sentimentScore: 0.85,
        feedbackProvided: false,
        feedbackContent: null,
        
        chatbotInteractionId: "chat_123456",
        assistedByAi: true,
        
        createdAt: new Date(2025, 4, 9),
        updatedAt: new Date(2025, 4, 11)
      },
      {
        id: this.viewingRequestCurrentId++,
        propertyId: 3,
        name: "Sophia Chen",
        email: "sophia.chen@example.com",
        phone: "07734567890",
        university: "University of Sheffield",
        preferredDate: new Date(2025, 4, 17), // May 17, 2025
        preferredTime: "evening",
        message: "I'm interested in this property for my study group of 4 people.",
        status: "completed",
        eventId: 6, // Related to a calendar event
        guestId: null,
        
        // Enhanced fields
        isGroupViewing: true,
        groupId: "group-789012",
        groupLeadId: 15, // User ID of the lead
        groupMembers: [
          { name: "Alex Wong", email: "alex.w@example.com", phone: "07734567891" },
          { name: "Maya Patel", email: "maya.p@example.com", phone: "07734567892" },
          { name: "Daniel Kim", email: "daniel.k@example.com", phone: "07734567893" }
        ],
        
        timePreference: { weekdays: false, weekends: true, eveningsOnly: true },
        alternativeDates: ["2025-05-18", "2025-05-24", "2025-05-25"],
        matchScore: 95,
        
        isVerifiedStudent: true,
        studentIdVerified: true,
        
        calendarSyncId: "gcal_sync_789012",
        reminderSent: true,
        reminderSentAt: new Date(2025, 4, 16), // A day before
        
        virtualViewingRequested: true,
        virtualViewingType: "live",
        virtualViewingUrl: "https://example.com/virtual-viewing/property3",
        virtualViewingScheduledAt: new Date(2025, 4, 16, 19, 0, 0), // 7PM the day before
        
        sourceQrCode: null,
        sourceLocation: null,
        
        cancellationReason: null,
        sentimentScore: 0.92,
        feedbackProvided: true,
        feedbackContent: "The property was exactly what we were looking for. The virtual viewing beforehand was very helpful. We're definitely interested in applying.",
        
        chatbotInteractionId: "chat_789012",
        assistedByAi: true,
        
        createdAt: new Date(2025, 4, 8),
        updatedAt: new Date(2025, 4, 17)
      }
    ];
    
    // Add sample viewing requests to storage
    for (const request of sampleViewingRequests) {
      this.viewingRequestsData.set(request.id, request);
    }
  }
  
  private addSampleVirtualViewingSessions() {
    // Sample virtual viewing sessions
    const sampleSessions: VirtualViewingSession[] = [
      {
        id: this.virtualViewingSessionCurrentId++,
        propertyId: 2,
        viewingRequestId: 2,
        hostId: 4, // Agent
        sessionId: "vs-" + Date.now() + "-1",
        status: "completed",
        scheduledStartTime: new Date(2025, 2, 28, 14, 0), // 2:00 PM
        scheduledEndTime: new Date(2025, 2, 28, 14, 30), // 2:30 PM
        actualStartTime: new Date(2025, 2, 28, 14, 3), // 2:03 PM (slightly late)
        actualEndTime: new Date(2025, 2, 28, 14, 28), // 2:28 PM
        participants: [
          {
            userId: 4, // Agent
            name: "Michael Brown (Agent)",
            role: "host",
            joinedAt: new Date(2025, 2, 28, 14, 0), 
            connectionStatus: "connected"
          },
          {
            userId: 7, // Tenant
            name: "Olivia Taylor (Tenant)",
            role: "tenant",
            joinedAt: new Date(2025, 2, 28, 14, 3),
            connectionStatus: "connected"
          }
        ],
        messages: [
          {
            userId: 4,
            name: "Michael Brown (Agent)",
            text: "Welcome to the virtual viewing! I'll be showing you around the property today.",
            timestamp: new Date(2025, 2, 28, 14, 4)
          },
          {
            userId: 7,
            name: "Olivia Taylor (Tenant)",
            text: "Thanks! I'm particularly interested in the kitchen and bathroom.",
            timestamp: new Date(2025, 2, 28, 14, 5)
          },
          {
            userId: 4,
            name: "Michael Brown (Agent)",
            text: "Great, I'll make sure to focus on those areas. Let me start by showing you the entrance and living room.",
            timestamp: new Date(2025, 2, 28, 14, 6)
          },
          {
            userId: 7,
            name: "Olivia Taylor (Tenant)",
            text: "The living room looks spacious! How's the natural light throughout the day?",
            timestamp: new Date(2025, 2, 28, 14, 10)
          },
          {
            userId: 4,
            name: "Michael Brown (Agent)",
            text: "The living room gets great morning light until about 2pm. Now let's see the kitchen you were interested in.",
            timestamp: new Date(2025, 2, 28, 14, 12)
          },
          {
            userId: 7,
            name: "Olivia Taylor (Tenant)",
            text: "I like the kitchen layout! Are the appliances included?",
            timestamp: new Date(2025, 2, 28, 14, 15)
          },
          {
            userId: 4,
            name: "Michael Brown (Agent)",
            text: "Yes, all appliances are included - fridge, oven, dishwasher, and microwave are all included in the rent.",
            timestamp: new Date(2025, 2, 28, 14, 16)
          },
          {
            userId: 7,
            name: "Olivia Taylor (Tenant)",
            text: "Perfect. And can we see the bathroom now?",
            timestamp: new Date(2025, 2, 28, 14, 18)
          },
          {
            userId: 4,
            name: "Michael Brown (Agent)",
            text: "Of course, this way to the bathroom. It was renovated last year.",
            timestamp: new Date(2025, 2, 28, 14, 20)
          },
          {
            userId: 7,
            name: "Olivia Taylor (Tenant)",
            text: "The bathroom looks great! I'm definitely interested in applying for this property.",
            timestamp: new Date(2025, 2, 28, 14, 25)
          },
          {
            userId: 4,
            name: "Michael Brown (Agent)",
            text: "Wonderful! I'll send you the application details right after our viewing. Any other questions before we finish?",
            timestamp: new Date(2025, 2, 28, 14, 26)
          },
          {
            userId: 7,
            name: "Olivia Taylor (Tenant)",
            text: "No, I think that's all. Thank you for the tour!",
            timestamp: new Date(2025, 2, 28, 14, 27)
          }
        ],
        createdAt: new Date(2025, 2, 22), // When the session was created
        updatedAt: new Date(2025, 2, 28, 14, 28), // Last update (session end)
        feedbackRequested: true,
        feedbackRequestedAt: new Date(2025, 2, 28, 14, 35) // Requested right after the viewing
      },
      {
        id: this.virtualViewingSessionCurrentId++,
        propertyId: 3,
        viewingRequestId: 5,
        hostId: 5, // Agent
        sessionId: "vs-" + Date.now() + "-2",
        status: "scheduled",
        scheduledStartTime: new Date(2025, 3, 12, 11, 0), // 11:00 AM
        scheduledEndTime: new Date(2025, 3, 12, 11, 30), // 11:30 AM
        participants: [],
        messages: [],
        createdAt: new Date(2025, 3, 5), // When the session was created
        updatedAt: new Date(2025, 3, 5), // Last update
        feedbackRequested: false
      },
      {
        id: this.virtualViewingSessionCurrentId++,
        propertyId: 1,
        viewingRequestId: 1,
        hostId: 4, // Agent
        sessionId: "vs-" + Date.now() + "-3",
        status: "cancelled",
        scheduledStartTime: new Date(2025, 2, 25, 16, 0), // 4:00 PM
        scheduledEndTime: new Date(2025, 2, 25, 16, 30), // 4:30 PM
        cancelledAt: new Date(2025, 2, 24, 10, 15),
        cancellationReason: "Tenant requested to change to in-person viewing instead",
        participants: [],
        messages: [],
        createdAt: new Date(2025, 2, 21), // When the session was created
        updatedAt: new Date(2025, 2, 24, 10, 15), // Last update (cancellation)
        feedbackRequested: false
      },
      {
        id: this.virtualViewingSessionCurrentId++,
        propertyId: 4,
        viewingRequestId: null, // Direct session without viewing request
        hostId: 5, // Agent
        sessionId: "vs-" + Date.now() + "-4",
        status: "in-progress",
        scheduledStartTime: new Date(), // Current date/time to simulate ongoing session
        scheduledEndTime: new Date(new Date().getTime() + 30 * 60000), // 30 mins from now
        actualStartTime: new Date(new Date().getTime() - 10 * 60000), // Started 10 mins ago
        participants: [
          {
            userId: 5, // Agent
            name: "Emma Davis (Agent)",
            role: "host",
            joinedAt: new Date(new Date().getTime() - 10 * 60000), 
            connectionStatus: "connected"
          },
          {
            userId: 6, // Tenant
            name: "Alex Wilson (Tenant)",
            role: "tenant",
            joinedAt: new Date(new Date().getTime() - 8 * 60000),
            connectionStatus: "connected"
          }
        ],
        messages: [
          {
            userId: 5,
            name: "Emma Davis (Agent)",
            text: "Welcome to this live virtual viewing! Let me know if you have any questions as we go through the property.",
            timestamp: new Date(new Date().getTime() - 9 * 60000)
          },
          {
            userId: 6,
            name: "Alex Wilson (Tenant)",
            text: "Thanks for setting this up. I'm especially interested in the bedroom sizes and storage options.",
            timestamp: new Date(new Date().getTime() - 7 * 60000)
          }
        ],
        createdAt: new Date(new Date().getTime() - 2 * 24 * 60 * 60000), // 2 days ago
        updatedAt: new Date(new Date().getTime() - 8 * 60000), // Last update
        feedbackRequested: false
      }
    ];
    
    // Add sessions to storage
    for (const session of sampleSessions) {
      this.virtualViewingSessionsData.set(session.id, session);
    }
  }
  
  private addSampleViewingFeedback() {
    // Sample viewing feedback entries
    const sampleFeedback: ViewingFeedback[] = [
      {
        id: this.viewingFeedbackCurrentId++,
        viewingRequestId: 2,
        propertyId: 2,
        userId: 7, // Tenant (Olivia)
        userType: "tenant",
        virtualViewingSessionId: 1,
        overallRating: 4,
        propertyRating: 5,
        hostRating: 4,
        connectionQualityRating: 3,
        audioQualityRating: 3,
        videoQualityRating: 3,
        likedProperty: true,
        interestedInApplying: true,
        comments: "Great property with excellent kitchen and bathroom. The virtual viewing was very helpful, though there were a few minor connection issues. The agent was knowledgeable and answered all my questions.",
        feedbackForHost: "Michael was very helpful and professional. He focused on the areas I was most interested in.",
        improvementSuggestions: "Maybe a slightly better camera would help with the video quality, but overall it was a good experience.",
        technicalIssues: "Brief connection lag at a couple of points during the tour.",
        createdAt: new Date(2025, 2, 28, 16, 0), // 4:00 PM, after the viewing
        updatedAt: new Date(2025, 2, 28, 16, 0)
      },
      {
        id: this.viewingFeedbackCurrentId++,
        viewingRequestId: 3,
        propertyId: 3,
        userId: 6, // Tenant (Alex)
        userType: "tenant",
        virtualViewingSessionId: null, // In-person viewing
        overallRating: 5,
        propertyRating: 5,
        hostRating: 5,
        likedProperty: true,
        interestedInApplying: true,
        comments: "Excellent property with perfect location for my needs. All the rooms were spacious and well-maintained.",
        feedbackForHost: "The agent was very thorough and took time to show me all aspects of the property.",
        improvementSuggestions: "No suggestions, it was a perfect viewing experience.",
        createdAt: new Date(2025, 2, 18, 14, 0), // 2:00 PM, after the viewing
        updatedAt: new Date(2025, 2, 18, 14, 0)
      },
      {
        id: this.viewingFeedbackCurrentId++,
        viewingRequestId: 2,
        propertyId: 2,
        userId: 4, // Agent (Michael)
        userType: "agent",
        virtualViewingSessionId: 1,
        overallRating: 4,
        hostRating: null, // Doesn't rate themselves
        connectionQualityRating: 3,
        audioQualityRating: 4,
        videoQualityRating: 3,
        tenantEngagementRating: 5,
        tenantPreparationRating: 4,
        tenantInterestLevel: "high",
        tenantLikelyToApply: true,
        comments: "Successful virtual viewing. The tenant was engaged and asked good questions about the property.",
        technicalIssues: "Some minor video quality issues in rooms with less natural light.",
        nextSteps: "Tenant expressed interest in applying. I'll follow up with application details.",
        improvementSuggestions: "Consider using additional lighting for future virtual viewings in this property.",
        createdAt: new Date(2025, 2, 28, 15, 0), // 3:00 PM, after the viewing
        updatedAt: new Date(2025, 2, 28, 15, 0)
      }
    ];
    
    // Add feedback to storage
    for (const feedback of sampleFeedback) {
      this.viewingFeedbackData.set(feedback.id, feedback);
    }
  }
  
  // Sample data generation methods for virtual viewing sessions and feedback
  async generateSampleVirtualViewingSessions(count: number = 5): Promise<VirtualViewingSession[]> {
    const properties = await this.getAllProperties();
    const users = await this.getAllUsers();
    const viewingRequests = Array.from(this.viewingRequestsData.values());
    
    if (properties.length === 0 || users.length === 0 || viewingRequests.length === 0) {
      console.warn("Cannot generate sample virtual viewing sessions: no properties, users, or viewing requests available");
      return [];
    }
    
    const sessions: VirtualViewingSession[] = [];
    
    for (let i = 0; i < count; i++) {
      const property = properties[Math.floor(Math.random() * properties.length)];
      const host = users.find(user => user.userType === 'agent' || user.userType === 'landlord') || users[0];
      const viewingRequest = viewingRequests[Math.floor(Math.random() * viewingRequests.length)];
      
      const tenantUser = users.find(user => user.userType === 'tenant') || users[1];
      const sessionId = `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Create a session from 1-7 days ago
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() - Math.floor(Math.random() * 7) - 1);
      
      // End time is 15-45 minutes after start time
      const endDate = new Date(sessionDate);
      endDate.setMinutes(endDate.getMinutes() + 15 + Math.floor(Math.random() * 30));
      
      // Status options: "completed", "cancelled", "no-show", "technical-issues"
      const statuses = ["completed", "cancelled", "no-show", "technical-issues"];
      const status = Math.random() > 0.3 ? "completed" : statuses[Math.floor(Math.random() * statuses.length)];
      
      const participants = [
        {
          userId: host.id,
          name: host.name,
          role: "host",
          joinedAt: sessionDate,
          connectionStatus: "connected"
        },
        {
          userId: tenantUser.id,
          name: tenantUser.name,
          role: "viewer",
          joinedAt: new Date(sessionDate.getTime() + 120000), // Joined 2 minutes later
          connectionStatus: "connected"
        }
      ];
      
      // Add some random messages
      const messages = [];
      const messageCount = Math.floor(Math.random() * 10) + 2;
      const questions = [
        "Is the property available from September?",
        "How much is the deposit?",
        "Are bills included in the rent?",
        "Is the internet connection good?",
        "How is the water pressure in the shower?",
        "Is there storage space in the bedroom?",
        "Are pets allowed?",
        "How far is the nearest bus stop?",
        "Is there a washing machine?",
        "How old is the boiler?",
        "Can you show me the garden again please?",
        "What are the neighbors like?",
      ];
      
      for (let j = 0; j < messageCount; j++) {
        const sender = Math.random() > 0.6 ? participants[1] : participants[0];
        const messageTime = new Date(sessionDate.getTime() + (j + 1) * 60000); // One message per minute
        
        // 70% probability of a question if the sender is a tenant, 30% probability for a simple message
        let text = "";
        if (sender.role === "viewer" && Math.random() > 0.3) {
          text = questions[Math.floor(Math.random() * questions.length)];
        } else {
          const responses = [
            "Yes, that's correct.",
            "Let me show you that again.",
            "That's a good question.",
            "The landlord would need to confirm that.",
            "This part of the property was recently renovated.",
            "The kitchen appliances are all included.",
            "There's plenty of natural light in this room.",
            "The property is very energy efficient.",
            "Public transport is just a 5-minute walk away.",
            "The neighbors are mostly professionals and very quiet.",
            "There's a convenience store just around the corner.",
            "The garden is maintained by the landlord.",
          ];
          text = responses[Math.floor(Math.random() * responses.length)];
        }
        
        messages.push({
          userId: sender.userId,
          name: sender.name,
          text,
          timestamp: messageTime
        });
      }
      
      const session: InsertVirtualViewingSession = {
        propertyId: property.id,
        hostId: host.id,
        viewingRequestId: viewingRequest.id,
        sessionId,
        scheduledStartTime: sessionDate,
        scheduledEndTime: endDate,
        actualStartTime: sessionDate,
        actualEndTime: status === "completed" ? endDate : undefined,
        status,
        participants,
        messages,
        technicalIssues: status === "technical-issues" ? [{
          issueType: "connection",
          description: "Host lost internet connection",
          timestamp: new Date(sessionDate.getTime() + 600000).toISOString() // 10 minutes in
        }] : [],
        questions: [],
        recordingUrl: Math.random() > 0.7 ? `https://storage.unirent.example/recordings/${sessionId}.mp4` : undefined,
        feedbackRequested: Math.random() > 0.5,
        feedbackRequestedAt: Math.random() > 0.5 ? endDate : undefined
      };
      
      const createdSession = await this.createVirtualViewingSession(session);
      sessions.push(createdSession);
      
      // If session was completed and feedback was requested, 80% chance to generate feedback
      if (status === "completed" && session.feedbackRequested && Math.random() > 0.2) {
        await this.generateFeedbackForSession(createdSession);
      }
    }
    
    return sessions;
  }
  
  async generateFeedbackForSession(session: VirtualViewingSession): Promise<ViewingFeedback[]> {
    const feedbacks: ViewingFeedback[] = [];
    
    // Get participants from session
    const participants = session.participants || [];
    const property = await this.getProperty(session.propertyId);
    
    if (!property) {
      console.warn("Cannot generate feedback: property not found");
      return feedbacks;
    }
    
    for (const participant of participants) {
      // Skip missing user IDs
      if (!participant.userId) continue;
      
      // Only generate feedback for viewers most of the time
      if (participant.role === "host" && Math.random() > 0.3) continue;
      
      // 1-5 rating scale
      const overallRating = 3 + Math.floor(Math.random() * 3); // 3-5 mostly positive
      const connectionQuality = 2 + Math.floor(Math.random() * 4); // 2-5 varied
      const audioQuality = 2 + Math.floor(Math.random() * 4); // 2-5 varied
      const videoQuality = 2 + Math.floor(Math.random() * 4); // 2-5 varied
      
      const comments = [];
      
      if (participant.role === "viewer") {
        const viewerComments = [
          "The property looked well maintained.",
          "It was smaller than I expected from the photos.",
          "I appreciated being able to ask questions during the viewing.",
          "The agent was very knowledgeable about the property.",
          "I would have liked more time to see the exterior of the building.",
          "The virtual viewing saved me a lot of time.",
          "It was difficult to get a sense of the space online.",
          "The host was very professional and helpful.",
          "I would have preferred an in-person viewing.",
          "The virtual tour gave me a good impression of the property."
        ];
        comments.push(viewerComments[Math.floor(Math.random() * viewerComments.length)]);
      } else {
        const hostComments = [
          "The viewer seemed very interested in the property.",
          "It was a bit difficult to show some parts of the property virtually.",
          "The viewing went smoothly without technical issues.",
          "The prospective tenant asked a lot of good questions.",
          "I need better lighting for future virtual viewings.",
          "The internet connection was unstable during the viewing.",
          "Virtual viewings are much more efficient than in-person ones.",
          "I'd recommend doing a follow-up in-person viewing."
        ];
        comments.push(hostComments[Math.floor(Math.random() * hostComments.length)]);
      }
      
      // Determine if viewer is interested based on rating
      const interestedInApplying = participant.role === "viewer" ? (overallRating >= 4 && Math.random() > 0.2) : undefined;
      
      const feedback: InsertViewingFeedback = {
        virtualViewingSessionId: session.id,
        viewingRequestId: session.viewingRequestId,
        propertyId: session.propertyId,
        userId: participant.userId,
        userType: participant.role,
        overallRating,
        connectionQualityRating: connectionQuality,
        audioQualityRating: audioQuality,
        videoQualityRating: videoQuality,
        comments: comments.join(" "),
        interestedInApplying,
        preferredViewingType: participant.role === "viewer" 
          ? (Math.random() > 0.6 ? "virtual" : "in-person") 
          : undefined,
        improvementSuggestions: participant.role === "host" 
          ? (Math.random() > 0.5 ? "Better internet connection is needed" : "Need better camera equipment") 
          : undefined
      };
      
      const createdFeedback = await this.createViewingFeedback(feedback);
      feedbacks.push(createdFeedback);
    }
    
    return feedbacks;
  }
  
  async getPropertyFeedbackStats(propertyId: number): Promise<{
    averageOverallRating: number;
    averageConnectionQuality: number;
    averageAudioQuality: number;
    averageVideoQuality: number;
    totalFeedbackCount: number;
    interestedInApplyingCount: number;
  }> {
    const feedbacks = await this.getViewingFeedbackByProperty(propertyId);
    
    if (!feedbacks.length) {
      return {
        averageOverallRating: 0,
        averageConnectionQuality: 0,
        averageAudioQuality: 0,
        averageVideoQuality: 0,
        totalFeedbackCount: 0,
        interestedInApplyingCount: 0
      };
    }
    
    // Only include viewer feedback for these metrics
    const viewerFeedbacks = feedbacks.filter(f => f.userType === "viewer");
    
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const avg = (arr: number[]) => arr.length > 0 ? sum(arr) / arr.length : 0;
    
    const overallRatings = viewerFeedbacks.map(f => f.overallRating).filter(Boolean) as number[];
    const connectionQualityRatings = viewerFeedbacks.map(f => f.connectionQualityRating).filter(Boolean) as number[];
    const audioQualityRatings = viewerFeedbacks.map(f => f.audioQualityRating).filter(Boolean) as number[];
    const videoQualityRatings = viewerFeedbacks.map(f => f.videoQualityRating).filter(Boolean) as number[];
    
    const interestedInApplyingCount = viewerFeedbacks.filter(f => f.interestedInApplying === true).length;
    
    return {
      averageOverallRating: avg(overallRatings),
      averageConnectionQuality: avg(connectionQualityRatings),
      averageAudioQuality: avg(audioQualityRatings),
      averageVideoQuality: avg(videoQualityRatings),
      totalFeedbackCount: viewerFeedbacks.length,
      interestedInApplyingCount
    };
  }

  // Marketplace Item methods
  async getAllMarketplaceItems(): Promise<MarketplaceItem[]> {
    return Array.from(this.marketplaceItemsData.values());
  }

  async getMarketplaceItem(id: number): Promise<MarketplaceItem | undefined> {
    console.log(`[storage] Getting marketplace item with ID: ${id}`);
    const item = this.marketplaceItemsData.get(id);
    
    if (!item) {
      console.log(`[storage] No item found with ID: ${id}`);
      return undefined;
    }
    
    console.log(`[storage] Found item with ID: ${id}, title: ${item.title}, userId: ${item.userId || item.sellerId}`);
    return item;
  }

  async getMarketplaceItemsByUser(userId: number): Promise<MarketplaceItem[]> {
    return Array.from(this.marketplaceItemsData.values()).filter(
      (item) => item.sellerId === userId
    );
  }

  async getMarketplaceItemsByCategory(category: string): Promise<MarketplaceItem[]> {
    return Array.from(this.marketplaceItemsData.values()).filter(
      (item) => item.category === category
    );
  }

  async createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem> {
    const newItem: MarketplaceItem = {
      ...item,
      id: this.marketplaceItemCurrentId++,
      createdAt: new Date(),
      updatedAt: null,
      listingStatus: item.listingStatus || 'active',
      aiVerified: item.aiVerified || false,
      adminVerified: item.adminVerified || false,
      viewCount: 0,
      savedCount: 0,
    };
    this.marketplaceItemsData.set(newItem.id, newItem);
    return newItem;
  }

  async updateMarketplaceItem(id: number, item: Partial<MarketplaceItem>): Promise<MarketplaceItem | undefined> {
    const existingItem = this.marketplaceItemsData.get(id);
    if (!existingItem) {
      return undefined;
    }
    
    const updatedItem = {
      ...existingItem,
      ...item,
      updatedAt: new Date(),
    };
    
    this.marketplaceItemsData.set(id, updatedItem);
    return updatedItem;
  }

  async deleteMarketplaceItem(id: number): Promise<boolean> {
    return this.marketplaceItemsData.delete(id);
  }
  
  async markItemAsSold(id: number, buyerId: number): Promise<MarketplaceItem | undefined> {
    const existingItem = this.marketplaceItemsData.get(id);
    if (!existingItem) {
      return undefined;
    }
    
    const updatedItem: MarketplaceItem = {
      ...existingItem,
      listingStatus: 'sold',
      buyerId,
      updatedAt: new Date()
    };
    
    this.marketplaceItemsData.set(id, updatedItem);
    return updatedItem;
  }

  // Marketplace Message methods
  async getAllMarketplaceMessages(): Promise<MarketplaceMessage[]> {
    return Array.from(this.marketplaceMessagesData.values());
  }

  async getMarketplaceMessage(id: number): Promise<MarketplaceMessage | undefined> {
    return this.marketplaceMessagesData.get(id);
  }

  async getMarketplaceMessagesByItem(itemId: number): Promise<MarketplaceMessage[]> {
    return Array.from(this.marketplaceMessagesData.values()).filter(
      (message) => message.itemId === itemId
    );
  }

  async getMarketplaceMessagesByUser(userId: number): Promise<MarketplaceMessage[]> {
    return Array.from(this.marketplaceMessagesData.values()).filter(
      (message) => message.senderId === userId || message.receiverId === userId
    );
  }

  async createMarketplaceMessage(message: InsertMarketplaceMessage): Promise<MarketplaceMessage> {
    const newMessage: MarketplaceMessage = {
      ...message,
      id: this.marketplaceMessageCurrentId++,
      createdAt: new Date(),
      updatedAt: null,
      isRead: false,
    };
    this.marketplaceMessagesData.set(newMessage.id, newMessage);
    return newMessage;
  }

  async deleteMarketplaceMessage(id: number): Promise<boolean> {
    return this.marketplaceMessagesData.delete(id);
  }

  async updateMarketplaceMessage(id: number, message: Partial<MarketplaceMessage>): Promise<MarketplaceMessage | undefined> {
    const existingMessage = this.marketplaceMessagesData.get(id);
    if (!existingMessage) {
      return undefined;
    }
    
    const updatedMessage = {
      ...existingMessage,
      ...message,
      updatedAt: new Date(),
    };
    
    this.marketplaceMessagesData.set(id, updatedMessage);
    return updatedMessage;
  }
  
  // Transaction message methods
  async getTransactionMessage(id: number): Promise<TransactionMessage | undefined> {
    return this.transactionMessagesData.get(id);
  }
  
  async getTransactionMessagesByTransaction(transactionId: number): Promise<TransactionMessage[]> {
    return Array.from(this.transactionMessagesData.values()).filter(
      (message) => message.transactionId === transactionId
    );
  }
  
  async createTransactionMessage(message: InsertTransactionMessage): Promise<TransactionMessage> {
    const newMessage: TransactionMessage = {
      ...message,
      id: this.transactionMessageCurrentId++,
      createdAt: new Date(),
      readAt: null,
    };
    this.transactionMessagesData.set(newMessage.id, newMessage);
    return newMessage;
  }
  
  async updateTransactionMessage(id: number, message: Partial<TransactionMessage>): Promise<TransactionMessage | undefined> {
    const existingMessage = this.transactionMessagesData.get(id);
    if (!existingMessage) {
      return undefined;
    }
    
    const updatedMessage = {
      ...existingMessage,
      ...message,
    };
    
    this.transactionMessagesData.set(id, updatedMessage);
    return updatedMessage;
  }
  
  async markTransactionMessageAsRead(id: number): Promise<TransactionMessage | undefined> {
    const existingMessage = this.transactionMessagesData.get(id);
    if (!existingMessage) {
      return undefined;
    }
    
    const updatedMessage = {
      ...existingMessage,
      readAt: new Date(),
    };
    
    this.transactionMessagesData.set(id, updatedMessage);
    return updatedMessage;
  }
  
  // Saved marketplace item methods
  async getSavedMarketplaceItem(id: number): Promise<SavedMarketplaceItem | undefined> {
    return this.savedMarketplaceItemsData.get(id);
  }
  
  async getSavedMarketplaceItemsByUser(userId: number): Promise<SavedMarketplaceItem[]> {
    return Array.from(this.savedMarketplaceItemsData.values()).filter(
      (item) => item.userId === userId
    );
  }
  
  async getSavedMarketplaceItemsByItem(itemId: number): Promise<SavedMarketplaceItem[]> {
    return Array.from(this.savedMarketplaceItemsData.values()).filter(
      (item) => item.itemId === itemId
    );
  }
  
  async saveMarketplaceItem(data: InsertSavedMarketplaceItem): Promise<SavedMarketplaceItem> {
    const newSaved: SavedMarketplaceItem = {
      ...data,
      id: this.savedMarketplaceItemCurrentId++,
      savedAt: new Date(),
    };
    this.savedMarketplaceItemsData.set(newSaved.id, newSaved);
    return newSaved;
  }
  
  async unsaveMarketplaceItem(userId: number, itemId: number): Promise<boolean> {
    const savedItem = Array.from(this.savedMarketplaceItemsData.values()).find(
      (item) => item.userId === userId && item.itemId === itemId
    );
    
    if (!savedItem) {
      return false;
    }
    
    return this.savedMarketplaceItemsData.delete(savedItem.id);
  }
  
  async isSavedMarketplaceItem(userId: number, itemId: number): Promise<boolean> {
    return Array.from(this.savedMarketplaceItemsData.values()).some(
      (item) => item.userId === userId && item.itemId === itemId
    );
  }
  
  // Reported marketplace item methods
  async getReportedMarketplaceItem(id: number): Promise<ReportedMarketplaceItem | undefined> {
    return this.reportedMarketplaceItemsData.get(id);
  }
  
  async getReportedMarketplaceItemsByUser(userId: number): Promise<ReportedMarketplaceItem[]> {
    return Array.from(this.reportedMarketplaceItemsData.values()).filter(
      (item) => item.reportedByUserId === userId
    );
  }
  
  async getReportedMarketplaceItemsByItem(itemId: number): Promise<ReportedMarketplaceItem[]> {
    return Array.from(this.reportedMarketplaceItemsData.values()).filter(
      (item) => item.itemId === itemId
    );
  }
  
  async getReportedMarketplaceItemsByStatus(status: string): Promise<ReportedMarketplaceItem[]> {
    return Array.from(this.reportedMarketplaceItemsData.values()).filter(
      (item) => item.status === status
    );
  }
  
  async reportMarketplaceItem(data: InsertReportedMarketplaceItem): Promise<ReportedMarketplaceItem> {
    const newReport: ReportedMarketplaceItem = {
      ...data,
      id: this.reportedMarketplaceItemCurrentId++,
      reportedAt: new Date(),
      status: 'pending',
      reviewedAt: null,
      reviewedByUserId: null,
      reviewNotes: null,
    };
    this.reportedMarketplaceItemsData.set(newReport.id, newReport);
    return newReport;
  }
  
  async updateReportedMarketplaceItemStatus(id: number, status: string, reviewerId: number, notes?: string): Promise<ReportedMarketplaceItem | undefined> {
    const existingReport = this.reportedMarketplaceItemsData.get(id);
    if (!existingReport) {
      return undefined;
    }
    
    const updatedReport = {
      ...existingReport,
      status,
      reviewedAt: new Date(),
      reviewedByUserId: reviewerId,
      reviewNotes: notes || null,
    };
    
    this.reportedMarketplaceItemsData.set(id, updatedReport);
    return updatedReport;
  }
  
  // Social Campaign methods implementation
  private socialCampaignsData: Map<number, SocialCampaign> = new Map();
  private socialCampaignCurrentId: number = 1;

  async createSocialCampaign(campaignData: SocialCampaign): Promise<SocialCampaign> {
    const id = this.socialCampaignCurrentId++;
    const campaign: SocialCampaign = {
      ...campaignData,
      id,
      createdAt: campaignData.createdAt || new Date(),
      updatedAt: new Date()
    };
    this.socialCampaignsData.set(id, campaign);
    return campaign;
  }

  async getSocialCampaigns(userId?: number): Promise<SocialCampaign[]> {
    if (userId) {
      return Array.from(this.socialCampaignsData.values()).filter(
        campaign => campaign.userId === userId
      );
    }
    return Array.from(this.socialCampaignsData.values());
  }

  async getSocialCampaign(id: number): Promise<SocialCampaign | undefined> {
    return this.socialCampaignsData.get(id);
  }

  async updateSocialCampaign(id: number, campaignData: Partial<SocialCampaign>): Promise<SocialCampaign | undefined> {
    const campaign = this.socialCampaignsData.get(id);
    if (!campaign) return undefined;
    
    const updatedCampaign = {
      ...campaign,
      ...campaignData,
      updatedAt: new Date()
    };
    this.socialCampaignsData.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async deleteSocialCampaign(id: number): Promise<boolean> {
    return this.socialCampaignsData.delete(id);
  }

  // Add marketplace transaction implementations
  async createMarketplaceTransaction(transaction: InsertMarketplaceTransaction): Promise<MarketplaceTransaction> {
    const newTransaction: MarketplaceTransaction = {
      ...transaction,
      id: this.marketplaceTransactionCurrentId++,
      createdAt: new Date(),
      updatedAt: null,
      completedAt: null,
      status: transaction.status || 'pending',
      paymentStatus: transaction.paymentStatus || 'pending',
      deliveryStatus: transaction.deliveryStatus || 'pending',
      deliveryProofImages: [],
    };
    this.marketplaceTransactionsData.set(newTransaction.id, newTransaction);
    return newTransaction;
  }
  
  async getMarketplaceTransaction(id: number): Promise<MarketplaceTransaction | undefined> {
    return this.marketplaceTransactionsData.get(id);
  }
  
  async getMarketplaceTransactionsByItem(itemId: number): Promise<MarketplaceTransaction[]> {
    return Array.from(this.marketplaceTransactionsData.values()).filter(
      (transaction) => transaction.itemId === itemId
    );
  }
  
  async getMarketplaceTransactionsByBuyer(buyerId: number): Promise<MarketplaceTransaction[]> {
    return Array.from(this.marketplaceTransactionsData.values()).filter(
      (transaction) => transaction.buyerId === buyerId
    );
  }
  
  async getMarketplaceTransactionsBySeller(sellerId: number): Promise<MarketplaceTransaction[]> {
    return Array.from(this.marketplaceTransactionsData.values()).filter(
      (transaction) => transaction.sellerId === sellerId
    );
  }
  
  async updateMarketplaceTransaction(id: number, transaction: Partial<MarketplaceTransaction>): Promise<MarketplaceTransaction | undefined> {
    const existingTransaction = this.marketplaceTransactionsData.get(id);
    if (!existingTransaction) {
      return undefined;
    }
    
    const updatedTransaction = {
      ...existingTransaction,
      ...transaction,
      updatedAt: new Date(),
    };
    
    this.marketplaceTransactionsData.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async updateTransactionStatus(id: number, status: string, trackingNumber?: string): Promise<MarketplaceTransaction | undefined> {
    const existingTransaction = this.marketplaceTransactionsData.get(id);
    if (!existingTransaction) {
      return undefined;
    }
    
    const updatedTransaction = {
      ...existingTransaction,
      status,
      updatedAt: new Date(),
      ...(trackingNumber ? { deliveryTrackingNumber: trackingNumber } : {}),
      ...(status === 'completed' ? { completedAt: new Date() } : {}),
    };
    
    this.marketplaceTransactionsData.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async uploadDeliveryProof(id: number, imageUrl: string): Promise<MarketplaceTransaction | undefined> {
    const existingTransaction = this.marketplaceTransactionsData.get(id);
    if (!existingTransaction) {
      return undefined;
    }
    
    const updatedTransaction = {
      ...existingTransaction,
      deliveryProofImages: [...existingTransaction.deliveryProofImages, imageUrl],
      updatedAt: new Date(),
    };
    
    this.marketplaceTransactionsData.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async deleteDeliveryProof(id: number, imageUrl: string): Promise<MarketplaceTransaction | undefined> {
    const existingTransaction = this.marketplaceTransactionsData.get(id);
    if (!existingTransaction) {
      return undefined;
    }
    
    const updatedTransaction = {
      ...existingTransaction,
      deliveryProofImages: existingTransaction.deliveryProofImages.filter(img => img !== imageUrl),
      updatedAt: new Date(),
    };
    
    this.marketplaceTransactionsData.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async confirmDelivery(id: number): Promise<MarketplaceTransaction | undefined> {
    const existingTransaction = this.marketplaceTransactionsData.get(id);
    if (!existingTransaction) {
      return undefined;
    }
    
    const updatedTransaction = {
      ...existingTransaction,
      deliveryStatus: 'delivered',
      status: existingTransaction.paymentStatus === 'paid' ? 'completed' : existingTransaction.status,
      completedAt: existingTransaction.paymentStatus === 'paid' ? new Date() : existingTransaction.completedAt,
      updatedAt: new Date(),
    };
    
    this.marketplaceTransactionsData.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async createDispute(id: number, reason: string): Promise<MarketplaceTransaction | undefined> {
    const existingTransaction = this.marketplaceTransactionsData.get(id);
    if (!existingTransaction) {
      return undefined;
    }
    
    const updatedTransaction = {
      ...existingTransaction,
      status: 'disputed',
      disputeReason: reason,
      disputeCreatedAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.marketplaceTransactionsData.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async resolveDispute(id: number, resolution: string, favor: 'buyer' | 'seller'): Promise<MarketplaceTransaction | undefined> {
    const existingTransaction = this.marketplaceTransactionsData.get(id);
    if (!existingTransaction) {
      return undefined;
    }
    
    const updatedTransaction = {
      ...existingTransaction,
      status: 'completed',
      disputeResolution: resolution,
      disputeResolvedAt: new Date(),
      disputeResolvedInFavorOf: favor,
      updatedAt: new Date(),
      completedAt: new Date(),
    };
    
    this.marketplaceTransactionsData.set(id, updatedTransaction);
    return updatedTransaction;
  }

  // Marketplace dashboard methods
  async getMarketplaceOffersByUser(userId: number): Promise<MarketplaceOffer[]> {
    const buyerOffers = Array.from(this.marketplaceOffersData.values()).filter(
      (offer) => offer.buyerId === userId
    );
    
    const sellerOffers = Array.from(this.marketplaceOffersData.values()).filter(
      (offer) => offer.sellerId === userId
    );
    
    // Combine both sets of offers
    return [...buyerOffers, ...sellerOffers];
  }
  
  async getMarketplaceOffersByBuyerAndItem(buyerId: number, itemId: number): Promise<MarketplaceOffer[]> {
    return Array.from(this.marketplaceOffersData.values()).filter(
      (offer) => offer.buyerId === buyerId && offer.itemId === itemId
    );
  }
  
  async getMarketplaceOffersByItem(itemId: number): Promise<MarketplaceOffer[]> {
    return Array.from(this.marketplaceOffersData.values()).filter(
      (offer) => offer.itemId === itemId
    );
  }
  
  async getMarketplaceOffersByBuyer(buyerId: number): Promise<MarketplaceOffer[]> {
    return Array.from(this.marketplaceOffersData.values()).filter(
      (offer) => offer.buyerId === buyerId
    );
  }
  
  async getMarketplaceOffersBySeller(sellerId: number): Promise<MarketplaceOffer[]> {
    return Array.from(this.marketplaceOffersData.values()).filter(
      (offer) => offer.sellerId === sellerId
    );
  }
  
  async getMarketplaceOffer(id: number): Promise<MarketplaceOffer | undefined> {
    return this.marketplaceOffersData.get(id);
  }
  
  async createMarketplaceOffer(offer: InsertMarketplaceOffer): Promise<MarketplaceOffer> {
    const newOffer: MarketplaceOffer = {
      ...offer,
      id: this.marketplaceOfferCurrentId++,
      createdAt: new Date(),
      updatedAt: null,
      status: offer.status || 'pending',
    };
    this.marketplaceOffersData.set(newOffer.id, newOffer);
    return newOffer;
  }
  
  async updateMarketplaceOffer(id: number, offer: Partial<MarketplaceOffer>): Promise<MarketplaceOffer | undefined> {
    const existingOffer = this.marketplaceOffersData.get(id);
    if (!existingOffer) {
      return undefined;
    }
    
    const updatedOffer = {
      ...existingOffer,
      ...offer,
      updatedAt: new Date(),
    };
    
    this.marketplaceOffersData.set(id, updatedOffer);
    return updatedOffer;
  }
  
  async updateOfferStatus(id: number, status: string, message?: string): Promise<MarketplaceOffer | undefined> {
    const existingOffer = this.marketplaceOffersData.get(id);
    if (!existingOffer) {
      return undefined;
    }
    
    const updatedOffer = {
      ...existingOffer,
      status,
      statusMessage: message,
      updatedAt: new Date(),
    };
    
    this.marketplaceOffersData.set(id, updatedOffer);
    return updatedOffer;
  }
  
  async deleteMarketplaceOffer(id: number): Promise<boolean> {
    return this.marketplaceOffersData.delete(id);
  }
  
  async getMarketplaceTransactionsByUser(userId: number): Promise<MarketplaceTransaction[]> {
    const buyerTransactions = Array.from(this.marketplaceTransactionsData.values()).filter(
      (transaction) => transaction.buyerId === userId
    );
    
    const sellerTransactions = Array.from(this.marketplaceTransactionsData.values()).filter(
      (transaction) => transaction.sellerId === userId
    );
    
    // Combine both sets of transactions
    return [...buyerTransactions, ...sellerTransactions];
  }
  
  async getMarketplaceMessageThreadsByUser(userId: number): Promise<any[]> {
    // Get all messages where the user is either sender or receiver
    const userMessages = Array.from(this.marketplaceMessagesData.values()).filter(
      (message) => message.senderId === userId || message.receiverId === userId
    );
    
    // Group messages by item to create threads
    const threadMap = new Map<number, any>();
    
    for (const message of userMessages) {
      const itemId = message.itemId;
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      
      // Create a unique key for each conversation using itemId + otherUserId
      const threadKey = `${itemId}-${otherUserId}`;
      
      if (!threadMap.has(threadKey)) {
        // Get the item details
        const item = this.marketplaceItemsData.get(message.itemId);
        // Get the other user's name
        const otherUser = this.usersData.get(otherUserId);
        
        // Create a new thread summary
        threadMap.set(threadKey, {
          id: parseInt(threadKey.replace('-', '')), // Generate an ID from the key
          itemId: message.itemId,
          senderId: userId,
          receiverId: otherUserId,
          unreadCount: 0,
          lastMessage: message.content,
          lastMessageDate: message.createdAt,
          item: {
            title: item?.title || 'Unknown Item',
            images: item?.images || []
          },
          senderName: 'You',
          receiverName: otherUser?.name || 'Unknown User'
        });
      }
      
      // Update the thread with the most recent message
      const thread = threadMap.get(threadKey);
      if (new Date(message.createdAt) > new Date(thread.lastMessageDate)) {
        thread.lastMessage = message.content;
        thread.lastMessageDate = message.createdAt;
        
        // Increment unread count if message is to the user and not read
        if (message.receiverId === userId && !message.isRead) {
          thread.unreadCount++;
        }
      }
    }
    
    // Convert the map to an array and sort by the most recent message
    return Array.from(threadMap.values()).sort((a, b) => 
      new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
    );
  }

  // Utility Providers methods
  async getAllUtilityProviders(): Promise<UtilityProvider[]> {
    return Array.from(this.utilityProvidersData.values());
  }

  async getUtilityProvider(id: number): Promise<UtilityProvider | undefined> {
    return this.utilityProvidersData.get(id);
  }

  async getUtilityProvidersByType(utilityType: UtilityType): Promise<UtilityProvider[]> {
    return Array.from(this.utilityProvidersData.values()).filter(
      provider => provider.utilityType === utilityType
    );
  }

  async createUtilityProvider(provider: UtilityProviderInsert): Promise<UtilityProvider> {
    const newProvider: UtilityProvider = {
      id: this.utilityProviderCurrentId++,
      ...provider,
      createdAt: new Date(),
      updatedAt: null
    };
    this.utilityProvidersData.set(newProvider.id, newProvider);
    return newProvider;
  }

  async updateUtilityProvider(id: number, provider: Partial<UtilityProvider>): Promise<UtilityProvider | undefined> {
    const existingProvider = this.utilityProvidersData.get(id);
    if (!existingProvider) return undefined;

    const updatedProvider = {
      ...existingProvider,
      ...provider,
      updatedAt: new Date()
    };
    this.utilityProvidersData.set(id, updatedProvider);
    return updatedProvider;
  }

  async deleteUtilityProvider(id: number): Promise<boolean> {
    return this.utilityProvidersData.delete(id);
  }

  // Utility Plans methods
  async getAllUtilityPlans(): Promise<UtilityPlan[]> {
    return Array.from(this.utilityPlansData.values());
  }

  async getUtilityPlan(id: number): Promise<UtilityPlan | undefined> {
    return this.utilityPlansData.get(id);
  }

  async getUtilityPlansByProvider(providerId: number): Promise<UtilityPlan[]> {
    return Array.from(this.utilityPlansData.values()).filter(
      plan => plan.providerId === providerId
    );
  }

  async getUtilityPlansByType(utilityType: UtilityType): Promise<UtilityPlan[]> {
    // This requires a join-like operation between plans and providers
    const providers = await this.getUtilityProvidersByType(utilityType);
    const providerIds = providers.map(provider => provider.id);
    
    return Array.from(this.utilityPlansData.values()).filter(
      plan => providerIds.includes(plan.providerId)
    );
  }

  async createUtilityPlan(plan: UtilityPlanInsert): Promise<UtilityPlan> {
    const newPlan: UtilityPlan = {
      id: this.utilityPlanCurrentId++,
      ...plan,
      createdAt: new Date(),
      updatedAt: null
    };
    this.utilityPlansData.set(newPlan.id, newPlan);
    return newPlan;
  }

  async updateUtilityPlan(id: number, plan: Partial<UtilityPlan>): Promise<UtilityPlan | undefined> {
    const existingPlan = this.utilityPlansData.get(id);
    if (!existingPlan) return undefined;

    const updatedPlan = {
      ...existingPlan,
      ...plan,
      updatedAt: new Date()
    };
    this.utilityPlansData.set(id, updatedPlan);
    return updatedPlan;
  }

  async deleteUtilityPlan(id: number): Promise<boolean> {
    return this.utilityPlansData.delete(id);
  }

  // Property Utilities methods
  async getPropertyUtility(id: number): Promise<PropertyUtility | undefined> {
    return this.propertyUtilitiesData.get(id);
  }

  async getPropertyUtilitiesByProperty(propertyId: number): Promise<PropertyUtility[]> {
    return Array.from(this.propertyUtilitiesData.values()).filter(
      utility => utility.propertyId === propertyId
    );
  }

  async getPropertyUtilitiesByType(propertyId: number, utilityType: UtilityType): Promise<PropertyUtility[]> {
    return Array.from(this.propertyUtilitiesData.values()).filter(
      utility => utility.propertyId === propertyId && utility.utilityType === utilityType
    );
  }

  async createPropertyUtility(utility: PropertyUtilityInsert): Promise<PropertyUtility> {
    const newUtility: PropertyUtility = {
      id: this.propertyUtilityCurrentId++,
      ...utility,
      createdAt: new Date(),
      updatedAt: null
    };
    this.propertyUtilitiesData.set(newUtility.id, newUtility);
    return newUtility;
  }

  async updatePropertyUtility(id: number, utility: Partial<PropertyUtility>): Promise<PropertyUtility | undefined> {
    const existingUtility = this.propertyUtilitiesData.get(id);
    if (!existingUtility) return undefined;

    const updatedUtility = {
      ...existingUtility,
      ...utility,
      updatedAt: new Date()
    };
    this.propertyUtilitiesData.set(id, updatedUtility);
    return updatedUtility;
  }

  async deletePropertyUtility(id: number): Promise<boolean> {
    return this.propertyUtilitiesData.delete(id);
  }

  // Utility Switch Requests methods
  async getUtilitySwitchRequest(id: number): Promise<UtilitySwitchRequest | undefined> {
    return this.utilitySwitchRequestsData.get(id);
  }

  async getUtilitySwitchRequestsByUser(userId: number): Promise<UtilitySwitchRequest[]> {
    return Array.from(this.utilitySwitchRequestsData.values()).filter(
      request => request.userId === userId
    );
  }

  async getUtilitySwitchRequestsByProperty(propertyId: number): Promise<UtilitySwitchRequest[]> {
    return Array.from(this.utilitySwitchRequestsData.values()).filter(
      request => request.propertyId === propertyId
    );
  }

  async createUtilitySwitchRequest(request: UtilitySwitchRequestInsert): Promise<UtilitySwitchRequest> {
    const newRequest: UtilitySwitchRequest = {
      id: this.utilitySwitchRequestCurrentId++,
      ...request,
      requestDate: new Date(),
      completionDate: null,
      createdAt: new Date(),
      updatedAt: null
    };
    this.utilitySwitchRequestsData.set(newRequest.id, newRequest);
    return newRequest;
  }

  async updateUtilitySwitchRequestStatus(id: number, status: string, completionDate?: Date): Promise<UtilitySwitchRequest | undefined> {
    const existingRequest = this.utilitySwitchRequestsData.get(id);
    if (!existingRequest) return undefined;

    const updatedRequest = {
      ...existingRequest,
      status,
      completionDate: status === 'completed' ? completionDate || new Date() : existingRequest.completionDate,
      updatedAt: new Date()
    };
    this.utilitySwitchRequestsData.set(id, updatedRequest);
    return updatedRequest;
  }

  // Utility Comparison History methods
  async getUtilityComparisonHistory(id: number): Promise<UtilityComparisonHistory | undefined> {
    return this.utilityComparisonHistoryData.get(id);
  }

  async getUtilityComparisonHistoryByUser(userId: number): Promise<UtilityComparisonHistory[]> {
    return Array.from(this.utilityComparisonHistoryData.values()).filter(
      history => history.userId === userId
    );
  }

  async createUtilityComparisonHistory(comparison: UtilityComparisonHistoryInsert): Promise<UtilityComparisonHistory> {
    const newHistory: UtilityComparisonHistory = {
      id: this.utilityComparisonHistoryCurrentId++,
      ...comparison,
      searchDate: new Date(),
      createdAt: new Date()
    };
    this.utilityComparisonHistoryData.set(newHistory.id, newHistory);
    return newHistory;
  }

  async updateUtilityComparisonHistorySwitchStatus(
    id: number, 
    switched: boolean, 
    selectedProviderId?: number, 
    selectedPlanId?: number
  ): Promise<UtilityComparisonHistory | undefined> {
    const existingHistory = this.utilityComparisonHistoryData.get(id);
    if (!existingHistory) return undefined;

    const updatedHistory = {
      ...existingHistory,
      conversionToSwitch: switched,
      selectedProviderId: switched ? selectedProviderId || existingHistory.selectedProviderId : null,
      selectedPlanId: switched ? selectedPlanId || existingHistory.selectedPlanId : null
    };
    this.utilityComparisonHistoryData.set(id, updatedHistory);
    return updatedHistory;
  }

  // User Behavior Analytics Implementation
  async getUserBehaviorAnalytics(userId: number): Promise<UserBehaviorAnalytic[]> {
    const behaviors: UserBehaviorAnalytic[] = [];
    this.userBehaviorAnalyticsData.forEach(behavior => {
      if (behavior.userId === userId) {
        behaviors.push(behavior);
      }
    });
    return behaviors;
  }

  async getUserBehaviorAnalyticsByType(userId: number, behaviorType: string): Promise<UserBehaviorAnalytic[]> {
    const behaviors: UserBehaviorAnalytic[] = [];
    this.userBehaviorAnalyticsData.forEach(behavior => {
      if (behavior.userId === userId && behavior.behaviorType === behaviorType) {
        behaviors.push(behavior);
      }
    });
    return behaviors;
  }

  async createUserBehaviorAnalytic(behavior: InsertUserBehaviorAnalytic): Promise<UserBehaviorAnalytic> {
    const now = new Date();
    const newBehavior: UserBehaviorAnalytic = {
      ...behavior,
      id: this.userBehaviorAnalyticCurrentId++,
      createdAt: now,
      updatedAt: now
    };
    
    this.userBehaviorAnalyticsData.set(newBehavior.id, newBehavior);
    return newBehavior;
  }

  async updateUserBehaviorAnalytic(id: number, data: Partial<UserBehaviorAnalytic>): Promise<UserBehaviorAnalytic | undefined> {
    const behavior = this.userBehaviorAnalyticsData.get(id);
    if (!behavior) return undefined;
    
    const updatedBehavior = {
      ...behavior,
      ...data,
      updatedAt: new Date()
    };
    
    this.userBehaviorAnalyticsData.set(id, updatedBehavior);
    return updatedBehavior;
  }

  async getRecentUserBehaviors(limit: number = 100): Promise<UserBehaviorAnalytic[]> {
    // Convert Map to array and sort by date (most recent first)
    const behaviors = Array.from(this.userBehaviorAnalyticsData.values())
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, limit);
    
    return behaviors;
  }

  async getUserBehaviorPatterns(userId: number): Promise<any> {
    // Get all behaviors for this user
    const userBehaviors = await this.getUserBehaviorAnalytics(userId);
    
    // Group behaviors by type
    const behaviorsByType: Record<string, UserBehaviorAnalytic[]> = {};
    
    userBehaviors.forEach(behavior => {
      if (!behaviorsByType[behavior.behaviorType]) {
        behaviorsByType[behavior.behaviorType] = [];
      }
      behaviorsByType[behavior.behaviorType].push(behavior);
    });
    
    // Calculate frequency and patterns
    const patterns = {
      mostFrequentBehavior: '',
      frequencyByType: {} as Record<string, number>,
      preferredItems: {} as Record<string, number[]>,
      timeAnalysis: {
        morningActivity: 0,
        afternoonActivity: 0,
        eveningActivity: 0,
      },
      sequencePatterns: [] as string[][],
    };
    
    // Calculate frequency by type
    Object.keys(behaviorsByType).forEach(type => {
      patterns.frequencyByType[type] = behaviorsByType[type].length;
    });
    
    // Determine most frequent behavior
    let maxFrequency = 0;
    Object.keys(patterns.frequencyByType).forEach(type => {
      if (patterns.frequencyByType[type] > maxFrequency) {
        maxFrequency = patterns.frequencyByType[type];
        patterns.mostFrequentBehavior = type;
      }
    });
    
    // Extract preferred items (properties, marketplace items, etc.)
    userBehaviors.forEach(behavior => {
      if (behavior.targetId && behavior.targetType) {
        if (!patterns.preferredItems[behavior.targetType]) {
          patterns.preferredItems[behavior.targetType] = [];
        }
        
        if (!patterns.preferredItems[behavior.targetType].includes(behavior.targetId)) {
          patterns.preferredItems[behavior.targetType].push(behavior.targetId);
        }
      }
    });
    
    // Analyze time patterns
    userBehaviors.forEach(behavior => {
      const hour = behavior.occurredAt.getHours();
      
      if (hour >= 5 && hour < 12) {
        patterns.timeAnalysis.morningActivity++;
      } else if (hour >= 12 && hour < 18) {
        patterns.timeAnalysis.afternoonActivity++;
      } else {
        patterns.timeAnalysis.eveningActivity++;
      }
    });
    
    // Find sequence patterns (if behaviors have previous/next actions)
    const sequences: Record<string, Record<string, number>> = {};
    
    userBehaviors.forEach(behavior => {
      if (behavior.previousAction) {
        if (!sequences[behavior.previousAction]) {
          sequences[behavior.previousAction] = {};
        }
        
        const currentAction = behavior.behaviorType;
        if (!sequences[behavior.previousAction][currentAction]) {
          sequences[behavior.previousAction][currentAction] = 0;
        }
        
        sequences[behavior.previousAction][currentAction]++;
      }
    });
    
    // Extract common sequences
    Object.keys(sequences).forEach(prev => {
      Object.keys(sequences[prev]).forEach(curr => {
        if (sequences[prev][curr] >= 3) { // Threshold for a pattern
          patterns.sequencePatterns.push([prev, curr]);
        }
      });
    });
    
    return patterns;
  }

  // User Suggestions Implementation
  async getUserSuggestions(userId: number): Promise<UserSuggestion[]> {
    const suggestions: UserSuggestion[] = [];
    this.userSuggestionsData.forEach(suggestion => {
      if (suggestion.userId === userId) {
        suggestions.push(suggestion);
      }
    });
    return suggestions;
  }

  async getUserSuggestionsByType(userId: number, suggestionType: string): Promise<UserSuggestion[]> {
    const suggestions: UserSuggestion[] = [];
    this.userSuggestionsData.forEach(suggestion => {
      if (suggestion.userId === userId && suggestion.suggestionType === suggestionType) {
        suggestions.push(suggestion);
      }
    });
    return suggestions;
  }

  async getUserSuggestionById(id: number): Promise<UserSuggestion | undefined> {
    return this.userSuggestionsData.get(id);
  }

  async createUserSuggestion(suggestion: InsertUserSuggestion): Promise<UserSuggestion> {
    const now = new Date();
    const newSuggestion: UserSuggestion = {
      ...suggestion,
      id: this.userSuggestionCurrentId++,
      impressions: 0,
      clicks: 0,
      dismissed: false,
      createdAt: now,
      updatedAt: now
    };
    
    this.userSuggestionsData.set(newSuggestion.id, newSuggestion);
    return newSuggestion;
  }

  async updateUserSuggestion(id: number, data: Partial<UserSuggestion>): Promise<UserSuggestion | undefined> {
    const suggestion = this.userSuggestionsData.get(id);
    if (!suggestion) return undefined;
    
    const updatedSuggestion = {
      ...suggestion,
      ...data,
      updatedAt: new Date()
    };
    
    this.userSuggestionsData.set(id, updatedSuggestion);
    return updatedSuggestion;
  }

  async markSuggestionImpression(id: number): Promise<UserSuggestion | undefined> {
    const suggestion = this.userSuggestionsData.get(id);
    if (!suggestion) return undefined;
    
    const updatedSuggestion = {
      ...suggestion,
      impressions: suggestion.impressions + 1,
      updatedAt: new Date()
    };
    
    this.userSuggestionsData.set(id, updatedSuggestion);
    return updatedSuggestion;
  }

  async markSuggestionClicked(id: number): Promise<UserSuggestion | undefined> {
    const suggestion = this.userSuggestionsData.get(id);
    if (!suggestion) return undefined;
    
    const updatedSuggestion = {
      ...suggestion,
      clicks: suggestion.clicks + 1,
      updatedAt: new Date()
    };
    
    this.userSuggestionsData.set(id, updatedSuggestion);
    return updatedSuggestion;
  }

  async dismissSuggestion(id: number): Promise<UserSuggestion | undefined> {
    const suggestion = this.userSuggestionsData.get(id);
    if (!suggestion) return undefined;
    
    const updatedSuggestion = {
      ...suggestion,
      dismissed: true,
      updatedAt: new Date()
    };
    
    this.userSuggestionsData.set(id, updatedSuggestion);
    return updatedSuggestion;
  }

  async getActiveSuggestionsForUser(userId: number, limit: number = 5): Promise<UserSuggestion[]> {
    const now = new Date();
    const suggestions: UserSuggestion[] = [];
    
    this.userSuggestionsData.forEach(suggestion => {
      if (
        suggestion.userId === userId && 
        !suggestion.dismissed && 
        (!suggestion.startAt || suggestion.startAt <= now) && 
        (!suggestion.endAt || suggestion.endAt >= now)
      ) {
        suggestions.push(suggestion);
      }
    });
    
    // Sort by priority (higher priority first) then by creation date (newer first)
    return suggestions
      .sort((a, b) => {
        // First sort by priority (higher number = higher priority)
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        // Then sort by creation date (newer first)
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .slice(0, limit);
  }

  // Initialize sample utility data for demonstration
  private addSampleUtilityData() {
    // Sample utility providers
    const sampleProviders: UtilityProvider[] = [
      {
        id: this.utilityProviderCurrentId++,
        name: 'british_gas',
        displayName: 'British Gas',
        utilityType: 'gas',
        status: 'active',
        description: 'One of the UK\'s largest energy suppliers',
        logoUrl: 'https://example.com/britishgas.png',
        website: 'https://www.britishgas.co.uk',
        contactPhone: '0333 202 9802',
        contactEmail: 'support@britishgas.co.uk',
        averageRating: 3.8,
        reviewCount: 1250,
        features: ['Smart meters', '24/7 customer service', 'Boiler cover options'],
        greenEnergy: false,
        studentDiscount: true,
        studentDiscountDetails: '10% off for students with valid ID',
        priceIndex: 95.5,
        comparisonData: { averageSavings: '£120 per year' },
        createdAt: new Date(),
        updatedAt: null
      },
      {
        id: this.utilityProviderCurrentId++,
        name: 'edf_energy',
        displayName: 'EDF Energy',
        utilityType: 'electricity',
        status: 'active',
        description: 'Leading producer of low-carbon electricity',
        logoUrl: 'https://example.com/edf.png',
        website: 'https://www.edfenergy.com',
        contactPhone: '0333 200 5100',
        contactEmail: 'support@edfenergy.com',
        averageRating: 4.0,
        reviewCount: 980,
        features: ['Green energy options', 'Smart home integration', 'Renewable tariffs'],
        greenEnergy: true,
        studentDiscount: true,
        studentDiscountDetails: 'Special student tariffs available',
        priceIndex: 92.0,
        comparisonData: { renewablePercentage: '100%' },
        createdAt: new Date(),
        updatedAt: null
      },
      {
        id: this.utilityProviderCurrentId++,
        name: 'thames_water',
        displayName: 'Thames Water',
        utilityType: 'water',
        status: 'active',
        description: 'Largest water and wastewater services company in the UK',
        logoUrl: 'https://example.com/thameswater.png',
        website: 'https://www.thameswater.co.uk',
        contactPhone: '0800 980 8800',
        contactEmail: 'customer.feedback@thameswater.co.uk',
        averageRating: 3.5,
        reviewCount: 750,
        features: ['Water saving devices', 'Leak detection', 'Payment assistance'],
        greenEnergy: false,
        studentDiscount: false,
        studentDiscountDetails: null,
        priceIndex: 100.0,
        comparisonData: { waterQuality: 'Good' },
        createdAt: new Date(),
        updatedAt: null
      },
      {
        id: this.utilityProviderCurrentId++,
        name: 'virgin_media',
        displayName: 'Virgin Media',
        utilityType: 'internet',
        status: 'active',
        description: 'Broadband, TV and phone provider with ultrafast fiber connections',
        logoUrl: 'https://example.com/virginmedia.png',
        website: 'https://www.virginmedia.com',
        contactPhone: '0345 454 1111',
        contactEmail: 'help@virginmedia.com',
        averageRating: 4.2,
        reviewCount: 1580,
        features: ['Ultrafast fiber', 'TV bundles', 'Mobile packages'],
        greenEnergy: false,
        studentDiscount: true,
        studentDiscountDetails: '9-month student contracts available',
        priceIndex: 105.0,
        comparisonData: { averageSpeed: '350Mbps' },
        createdAt: new Date(),
        updatedAt: null
      },
      {
        id: this.utilityProviderCurrentId++,
        name: 'tv_licensing',
        displayName: 'TV Licensing',
        utilityType: 'tv_license',
        status: 'active',
        description: 'Official UK television licensing authority',
        logoUrl: 'https://example.com/tvlicensing.png',
        website: 'https://www.tvlicensing.co.uk',
        contactPhone: '0300 790 6131',
        contactEmail: 'support@tvlicensing.co.uk',
        averageRating: 3.0,
        reviewCount: 420,
        features: ['Online payments', 'Direct debit options', 'Student exemptions'],
        greenEnergy: false,
        studentDiscount: false,
        studentDiscountDetails: null,
        priceIndex: 100.0,
        comparisonData: { annualCost: '£159.00' },
        createdAt: new Date(),
        updatedAt: null
      },
      {
        id: this.utilityProviderCurrentId++,
        name: 'lambeth_council',
        displayName: 'Lambeth Council',
        utilityType: 'council_tax',
        status: 'active',
        description: 'Local authority for the London Borough of Lambeth',
        logoUrl: 'https://example.com/lambeth.png',
        website: 'https://www.lambeth.gov.uk',
        contactPhone: '020 7926 1000',
        contactEmail: 'counciltax@lambeth.gov.uk',
        averageRating: 3.2,
        reviewCount: 320,
        features: ['Online payments', 'Direct debit discounts', 'Student exemptions'],
        greenEnergy: false,
        studentDiscount: true,
        studentDiscountDetails: 'Full-time students are exempt from council tax',
        priceIndex: 110.0,
        comparisonData: { bands: 'A-H' },
        createdAt: new Date(),
        updatedAt: null
      }
    ];

    // Sample utility plans
    const samplePlans: UtilityPlan[] = [
      {
        id: this.utilityPlanCurrentId++,
        providerId: 1, // British Gas
        name: 'homewarm_standard',
        displayName: 'HomeWarm Standard',
        description: 'Standard gas tariff with competitive rates',
        monthlyPrice: 80.00,
        annualPrice: 960.00,
        unitPrice: 7.5,
        standingCharge: 27.5,
        contractLength: 12,
        exitFees: 25.00,
        features: ['Online account management', 'Energy usage insights', 'Monthly billing'],
        termsUrl: 'https://www.britishgas.co.uk/terms',
        isPopular: true,
        isPromoted: false,
        startDate: new Date('2024-01-01'),
        endDate: null,
        createdAt: new Date(),
        updatedAt: null
      },
      {
        id: this.utilityPlanCurrentId++,
        providerId: 1, // British Gas
        name: 'homewarm_plus',
        displayName: 'HomeWarm Plus',
        description: 'Premium gas tariff with boiler coverage',
        monthlyPrice: 95.00,
        annualPrice: 1140.00,
        unitPrice: 7.2,
        standingCharge: 30.0,
        contractLength: 24,
        exitFees: 50.00,
        features: ['Basic boiler cover', 'Priority customer service', 'Price promise'],
        termsUrl: 'https://www.britishgas.co.uk/terms',
        isPopular: false,
        isPromoted: true,
        startDate: new Date('2024-01-01'),
        endDate: null,
        createdAt: new Date(),
        updatedAt: null
      },
      {
        id: this.utilityPlanCurrentId++,
        providerId: 2, // EDF Energy
        name: 'go_electric',
        displayName: 'Go Electric',
        description: '100% renewable electricity tariff',
        monthlyPrice: 75.00,
        annualPrice: 900.00,
        unitPrice: 6.8,
        standingCharge: 25.0,
        contractLength: 12,
        exitFees: 30.00,
        features: ['100% renewable energy', 'Smart meter included', 'Electric vehicle discounts'],
        termsUrl: 'https://www.edfenergy.com/terms',
        isPopular: true,
        isPromoted: true,
        startDate: new Date('2024-01-01'),
        endDate: null,
        createdAt: new Date(),
        updatedAt: null
      },
      {
        id: this.utilityPlanCurrentId++,
        providerId: 2, // EDF Energy
        name: 'easy_online',
        displayName: 'Easy Online',
        description: 'Simple online-managed electricity tariff',
        monthlyPrice: 65.00,
        annualPrice: 780.00,
        unitPrice: 6.5,
        standingCharge: 22.5,
        contractLength: 12,
        exitFees: 20.00,
        features: ['Online-only account', 'Paperless billing', 'Direct debit discounts'],
        termsUrl: 'https://www.edfenergy.com/terms',
        isPopular: false,
        isPromoted: false,
        startDate: new Date('2024-01-01'),
        endDate: null,
        createdAt: new Date(),
        updatedAt: null
      },
      {
        id: this.utilityPlanCurrentId++,
        providerId: 4, // Virgin Media
        name: 'fibre_150',
        displayName: 'Fibre 150',
        description: '150Mbps broadband package',
        monthlyPrice: 35.00,
        annualPrice: 420.00,
        unitPrice: null,
        standingCharge: null,
        contractLength: 18,
        exitFees: 45.00,
        features: ['150Mbps download speed', 'Unlimited usage', 'Free installation'],
        termsUrl: 'https://www.virginmedia.com/terms',
        isPopular: true,
        isPromoted: false,
        startDate: new Date('2024-01-01'),
        endDate: null,
        createdAt: new Date(),
        updatedAt: null
      },
      {
        id: this.utilityPlanCurrentId++,
        providerId: 4, // Virgin Media
        name: 'ultimate_oomph',
        displayName: 'Ultimate Oomph Bundle',
        description: 'Complete home package with ultrafast broadband, TV and phone',
        monthlyPrice: 89.00,
        annualPrice: 1068.00,
        unitPrice: null,
        standingCharge: null,
        contractLength: 18,
        exitFees: 75.00,
        features: ['1Gbps download speed', 'Full TV package', 'Unlimited calls', 'Mobile SIM'],
        termsUrl: 'https://www.virginmedia.com/terms',
        isPopular: false,
        isPromoted: true,
        startDate: new Date('2024-01-01'),
        endDate: null,
        createdAt: new Date(),
        updatedAt: null
      }
    ];

    // Sample property utilities
    const samplePropertyUtilities: PropertyUtility[] = [
      {
        id: this.propertyUtilityCurrentId++,
        propertyId: 1,
        utilityType: 'gas',
        providerId: 1, // British Gas
        planId: 1, // HomeWarm Standard
        accountNumber: 'GB12345678',
        meterNumber: 'G7654321',
        startDate: new Date('2023-09-01'),
        endDate: null,
        currentReading: 10250.5,
        lastReadingDate: new Date('2024-03-15'),
        billedDirectlyToTenant: true,
        includedInRent: false,
        notes: 'Smart meter installed in kitchen',
        createdAt: new Date(),
        updatedAt: null
      },
      {
        id: this.propertyUtilityCurrentId++,
        propertyId: 1,
        utilityType: 'electricity',
        providerId: 2, // EDF Energy
        planId: 3, // Go Electric
        accountNumber: 'EDF87654321',
        meterNumber: 'E1234567',
        startDate: new Date('2023-09-01'),
        endDate: null,
        currentReading: 5678.5,
        lastReadingDate: new Date('2024-03-15'),
        billedDirectlyToTenant: true,
        includedInRent: false,
        notes: 'Smart meter installed in hallway cupboard',
        createdAt: new Date(),
        updatedAt: null
      },
      {
        id: this.propertyUtilityCurrentId++,
        propertyId: 1,
        utilityType: 'water',
        providerId: 3, // Thames Water
        planId: null,
        accountNumber: 'TW567890',
        meterNumber: 'W9876543',
        startDate: new Date('2023-09-01'),
        endDate: null,
        currentReading: 450.75,
        lastReadingDate: new Date('2024-03-01'),
        billedDirectlyToTenant: false,
        includedInRent: true,
        notes: 'Water meter located outside front door',
        createdAt: new Date(),
        updatedAt: null
      },
      {
        id: this.propertyUtilityCurrentId++,
        propertyId: 2,
        utilityType: 'internet',
        providerId: 4, // Virgin Media
        planId: 5, // Fibre 150
        accountNumber: 'VM12345',
        meterNumber: null,
        startDate: new Date('2023-10-15'),
        endDate: null,
        currentReading: null,
        lastReadingDate: null,
        billedDirectlyToTenant: true,
        includedInRent: false,
        notes: 'Router located in living room',
        createdAt: new Date(),
        updatedAt: null
      }
    ];

    // Sample utility switch requests
    const sampleSwitchRequests: UtilitySwitchRequest[] = [
      {
        id: this.utilitySwitchRequestCurrentId++,
        userId: 6, // Tenant
        propertyId: 1,
        utilityType: 'electricity',
        currentProviderId: 2, // EDF Energy
        newProviderId: 1, // British Gas (they also offer electricity)
        newPlanId: null, // To be determined
        status: 'pending',
        requestDate: new Date('2024-03-20'),
        completionDate: null,
        notes: 'Looking for a better deal on electricity',
        contactPhone: '07700 900123',
        contactEmail: 'tenant@example.com',
        preferredContactMethod: 'email',
        preferredContactTime: 'evening',
        createdAt: new Date('2024-03-20'),
        updatedAt: null
      },
      {
        id: this.utilitySwitchRequestCurrentId++,
        userId: 7, // Another tenant
        propertyId: 2,
        utilityType: 'internet',
        currentProviderId: 4, // Virgin Media
        newProviderId: 4, // Virgin Media (upgrading plan)
        newPlanId: 6, // Ultimate Oomph Bundle
        status: 'approved',
        requestDate: new Date('2024-03-15'),
        completionDate: null,
        notes: 'Upgrading to faster internet',
        contactPhone: '07700 900456',
        contactEmail: 'anothertenant@example.com',
        preferredContactMethod: 'phone',
        preferredContactTime: 'morning',
        createdAt: new Date('2024-03-15'),
        updatedAt: new Date('2024-03-18')
      },
      {
        id: this.utilitySwitchRequestCurrentId++,
        userId: 8, // Yet another tenant
        propertyId: 3,
        utilityType: 'gas',
        currentProviderId: null, // Unknown provider
        newProviderId: 1, // British Gas
        newPlanId: 2, // HomeWarm Plus
        status: 'completed',
        requestDate: new Date('2024-02-10'),
        completionDate: new Date('2024-03-01'),
        notes: 'New tenant setting up gas',
        contactPhone: '07700 900789',
        contactEmail: 'newtenant@example.com',
        preferredContactMethod: 'email',
        preferredContactTime: 'anytime',
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-03-01')
      }
    ];

    // Sample utility comparison history
    const sampleComparisonHistory: UtilityComparisonHistory[] = [
      {
        id: this.utilityComparisonHistoryCurrentId++,
        userId: 6, // Tenant
        utilityType: 'electricity',
        searchPostcode: 'SW1A 1AA',
        providersCompared: [
          { id: 2, name: 'EDF Energy', planId: 3, currentMonthly: 75.00 },
          { id: 1, name: 'British Gas', planId: null, estimatedMonthly: 70.00 }
        ],
        potentialSavings: 60.00,
        searchDate: new Date('2024-03-19'),
        resultCount: 5,
        selectedProviderId: 1, // British Gas
        selectedPlanId: null,
        conversionToSwitch: true,
        createdAt: new Date('2024-03-19')
      },
      {
        id: this.utilityComparisonHistoryCurrentId++,
        userId: 7, // Another tenant
        utilityType: 'internet',
        searchPostcode: 'SW1A 2AA',
        providersCompared: [
          { id: 4, name: 'Virgin Media', planId: 5, currentMonthly: 35.00 },
          { id: 4, name: 'Virgin Media', planId: 6, upgradeMonthly: 89.00 }
        ],
        potentialSavings: -54.00, // Negative as it's an upgrade
        searchDate: new Date('2024-03-14'),
        resultCount: 1,
        selectedProviderId: 4, // Virgin Media
        selectedPlanId: 6, // Ultimate Oomph Bundle
        conversionToSwitch: true,
        createdAt: new Date('2024-03-14')
      },
      {
        id: this.utilityComparisonHistoryCurrentId++,
        userId: 8, // Yet another tenant
        utilityType: 'gas',
        searchPostcode: 'SW1A 3AA',
        providersCompared: [
          { id: 1, name: 'British Gas', planId: 1, estimatedMonthly: 80.00 },
          { id: 1, name: 'British Gas', planId: 2, estimatedMonthly: 95.00 }
        ],
        potentialSavings: 0.00, // New setup, no savings
        searchDate: new Date('2024-02-09'),
        resultCount: 2,
        selectedProviderId: 1, // British Gas
        selectedPlanId: 2, // HomeWarm Plus
        conversionToSwitch: true,
        createdAt: new Date('2024-02-09')
      }
    ];

    // Add the sample data to the storage
    for (const provider of sampleProviders) {
      this.utilityProvidersData.set(provider.id, provider);
    }

    for (const plan of samplePlans) {
      this.utilityPlansData.set(plan.id, plan);
    }

    for (const utility of samplePropertyUtilities) {
      this.propertyUtilitiesData.set(utility.id, utility);
    }

    for (const request of sampleSwitchRequests) {
      this.utilitySwitchRequestsData.set(request.id, request);
    }

    for (const history of sampleComparisonHistory) {
      this.utilityComparisonHistoryData.set(history.id, history);
    }
  }

  // Short Videos methods for Student Reels
  async getAllShortVideos(): Promise<ShortVideo[]> {
    return Array.from(this.shortVideosData.values());
  }

  async getShortVideo(id: number): Promise<ShortVideo | undefined> {
    return this.shortVideosData.get(id);
  }

  async getShortVideosByUser(userId: number): Promise<ShortVideo[]> {
    return Array.from(this.shortVideosData.values()).filter(video => video.userId === userId);
  }

  async createShortVideo(video: InsertShortVideo): Promise<ShortVideo> {
    const newVideo: ShortVideo = {
      id: this.shortVideoCurrentId++,
      ...video,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      flagCount: 0,
      isApproved: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.shortVideosData.set(newVideo.id, newVideo);
    return newVideo;
  }

  async updateShortVideo(id: number, video: Partial<ShortVideo>): Promise<ShortVideo | undefined> {
    const existingVideo = this.shortVideosData.get(id);
    if (!existingVideo) return undefined;
    
    const updatedVideo = {
      ...existingVideo,
      ...video,
      updatedAt: new Date()
    };
    this.shortVideosData.set(id, updatedVideo);
    return updatedVideo;
  }

  async deleteShortVideo(id: number): Promise<boolean> {
    return this.shortVideosData.delete(id);
  }

  private loadSampleShortVideos() {
    const sampleVideos: ShortVideo[] = [
      {
        id: 1,
        userId: 1,
        title: "Moving into student accommodation",
        description: "Just moved into my new student flat in London! Here's the tour 🏠✨ #StudentLife #London #Moving",
        videoUrl: "/videos/sample-student-move.mp4",
        thumbnailUrl: "/images/video-thumbnails/student-move.jpg",
        duration: "45",
        fileSize: 25600000,
        format: "mp4",
        resolution: "1080x1920",
        category: "property_tour",
        tags: ["StudentLife", "London", "Moving", "Accommodation"],
        isPublic: true,
        views: 1250,
        likes: 89,
        comments: 23,
        shares: 12,
        isApproved: true,
        moderationNotes: null,
        flagCount: 0,
        location: "London, UK",
        propertyId: 1,
        createdAt: new Date('2024-03-15T10:30:00Z'),
        updatedAt: new Date('2024-03-15T10:30:00Z'),
      },
      {
        id: 2,
        userId: 2,
        title: "Study tips for university",
        description: "How I stay organized during exam season 📚💪 #StudyTips #University #Productivity",
        videoUrl: "/videos/sample-study-tips.mp4",
        thumbnailUrl: "/images/video-thumbnails/study-tips.jpg",
        duration: "62",
        fileSize: 31200000,
        format: "mp4",
        resolution: "1080x1920",
        category: "study_tips",
        tags: ["StudyTips", "University", "Productivity", "Exams"],
        isPublic: true,
        views: 2100,
        likes: 156,
        comments: 42,
        shares: 28,
        isApproved: true,
        moderationNotes: null,
        flagCount: 0,
        location: "London, UK",
        propertyId: null,
        createdAt: new Date('2024-03-14T14:15:00Z'),
        updatedAt: new Date('2024-03-14T14:15:00Z'),
      },
      {
        id: 3,
        userId: 3,
        title: "Campus life at University of London",
        description: "A day in my life as a student in London 🎓🌟 #CampusLife #UniversityOfLondon #StudentLife",
        videoUrl: "/videos/sample-campus-life.mp4",
        thumbnailUrl: "/images/video-thumbnails/campus-life.jpg",
        duration: "38",
        fileSize: 22800000,
        format: "mp4",
        resolution: "1080x1920",
        category: "campus_life",
        tags: ["CampusLife", "UniversityOfLondon", "StudentLife"],
        isPublic: true,
        views: 890,
        likes: 67,
        comments: 18,
        shares: 9,
        isApproved: true,
        moderationNotes: null,
        flagCount: 0,
        location: "London, UK",
        propertyId: null,
        createdAt: new Date('2024-03-13T16:45:00Z'),
        updatedAt: new Date('2024-03-13T16:45:00Z'),
      }
    ];

    sampleVideos.forEach(video => {
      this.shortVideosData.set(video.id, video);
    });
    
    this.shortVideoCurrentId = 4;
    
    // Initialize UK Property Legislation data
    this.initializeUkLegislationData();
  }

  private initializeUkLegislationData() {
    const sampleLegislation = [
      {
        id: 1,
        title: "Renters' Rights Bill 2024 - Abolition of Section 21 Evictions",
        summary: "The Government has introduced legislation to abolish Section 21 'no-fault' evictions, providing greater security for tenants. Landlords will only be able to evict tenants for specific reasons outlined in the legislation.",
        fullText: "The Renters' Rights Bill introduces significant changes to the private rental sector. Key provisions include: abolition of Section 21 evictions, stronger grounds for possession under Section 8, new ombudsman scheme for private landlords, and enhanced enforcement powers for local authorities. Landlords must ensure compliance with new procedures and timelines.",
        category: "tenancy_law",
        urgency: "critical" as const,
        affectedParties: ["landlord", "agent", "tenant"],
        implementationDate: "2024-10-01",
        lastUpdated: new Date().toISOString(),
        governmentSource: "Department for Levelling Up, Housing and Communities",
        sourceUrl: "https://www.gov.uk/government/bills/renters-rights-bill",
        complianceRequirements: [
          "Review and update tenancy agreements to remove Section 21 clauses",
          "Implement new Section 8 possession procedures",
          "Register with the new private rental sector ombudsman",
          "Ensure all properties meet decent homes standards"
        ],
        penalties: "Failure to comply may result in fines up to £30,000 and/or prohibition from letting properties",
        actionRequired: "Immediate action required: Update all tenancy agreements and procedures before October 2024",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        title: "Electrical Safety Standards in Private Rental Sector Regulations 2024",
        summary: "Updated electrical safety requirements for private rental properties, including mandatory 5-yearly electrical inspections and new certification requirements.",
        fullText: "All private rental properties must have electrical installations inspected and tested at least every 5 years by a qualified electrician. Landlords must provide tenants with a copy of the electrical safety certificate before occupation and ensure any remedial work is completed within 28 days.",
        category: "safety_regulations",
        urgency: "high" as const,
        affectedParties: ["landlord", "agent"],
        implementationDate: "2024-04-01",
        lastUpdated: new Date().toISOString(),
        governmentSource: "Health and Safety Executive",
        sourceUrl: "https://www.gov.uk/government/publications/electrical-safety-standards-in-the-private-rented-sector",
        complianceRequirements: [
          "Arrange electrical inspection every 5 years maximum",
          "Obtain electrical installation condition report (EICR)",
          "Provide copy to tenants within 7 days of inspection",
          "Complete remedial work within 28 days of identification"
        ],
        penalties: "Fines up to £30,000 for non-compliance with electrical safety requirements",
        actionRequired: "Check electrical inspection dates for all properties - overdue inspections must be arranged immediately",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        title: "Gas Safety (Installation and Use) Regulations - Annual Requirements",
        summary: "Annual gas safety checks remain mandatory for all rental properties with gas appliances. Updated procedures for record keeping and tenant notifications.",
        category: "safety_regulations",
        urgency: "high" as const,
        affectedParties: ["landlord", "agent"],
        implementationDate: "2024-01-01",
        lastUpdated: new Date().toISOString(),
        governmentSource: "Health and Safety Executive",
        sourceUrl: "https://www.hse.gov.uk/gas/domestic/landlords.htm",
        complianceRequirements: [
          "Annual gas safety check by Gas Safe registered engineer",
          "Provide gas safety certificate to tenants within 28 days",
          "Keep gas safety records for minimum 2 years",
          "Ensure all gas appliances are safe and properly maintained"
        ],
        penalties: "Unlimited fines and/or imprisonment up to 6 months for gas safety breaches",
        actionRequired: "Verify all gas safety certificates are current and schedule renewals",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 4,
        title: "Deposit Protection Scheme Compliance 2024",
        summary: "Updated requirements for protecting tenant deposits, including new timescales and penalty structures for non-compliance.",
        category: "tenancy_law",
        urgency: "medium" as const,
        affectedParties: ["landlord", "agent"],
        implementationDate: "2024-01-01",
        lastUpdated: new Date().toISOString(),
        governmentSource: "Ministry of Housing, Communities and Local Government",
        sourceUrl: "https://www.gov.uk/deposit-protection-schemes-and-landlords",
        complianceRequirements: [
          "Protect deposit within 30 days of receipt",
          "Provide prescribed information to tenants within 30 days",
          "Use government-approved deposit protection scheme",
          "Return deposit within 10 days of agreement or adjudication"
        ],
        penalties: "Compensation of 1-3 times deposit amount plus return of original deposit",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 5,
        title: "Energy Performance Certificate (EPC) Requirements 2024",
        summary: "Minimum EPC rating requirements for rental properties, with enhanced enforcement and upcoming changes to minimum standards.",
        category: "environmental_compliance",
        urgency: "medium" as const,
        affectedParties: ["landlord", "agent"],
        implementationDate: "2024-01-01",
        lastUpdated: new Date().toISOString(),
        governmentSource: "Department for Energy Security and Net Zero",
        sourceUrl: "https://www.gov.uk/buy-sell-your-home/energy-performance-certificates",
        complianceRequirements: [
          "Maintain minimum EPC rating of E",
          "Renew EPC every 10 years or when changes made",
          "Provide valid EPC to tenants before tenancy starts",
          "Display EPC rating in property advertisements"
        ],
        penalties: "Fines up to £5,000 for failing to comply with EPC requirements",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 6,
        title: "Right to Rent Scheme - Enhanced Checking Requirements",
        summary: "Updated guidance on right to rent checks with new acceptable documents and digital verification options.",
        category: "immigration_compliance",
        urgency: "medium" as const,
        affectedParties: ["landlord", "agent"],
        implementationDate: "2024-03-01",
        lastUpdated: new Date().toISOString(),
        governmentSource: "Home Office",
        sourceUrl: "https://www.gov.uk/check-tenant-right-to-rent-documents",
        complianceRequirements: [
          "Check right to rent before tenancy starts",
          "Accept only prescribed documents",
          "Keep copies of documents for duration of tenancy plus 1 year",
          "Conduct follow-up checks for time-limited permissions"
        ],
        penalties: "Civil penalty up to £3,000 per illegal occupier",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    sampleLegislation.forEach(legislation => {
      this.ukPropertyLegislationData.set(legislation.id, legislation);
    });
    
    this.ukPropertyLegislationCurrentId = 7;
  }

  // UK Property Legislation methods
  async getAllLegislation(): Promise<UkPropertyLegislation[]> {
    return Array.from(this.ukPropertyLegislationData.values());
  }

  async getLegislation(id: number): Promise<UkPropertyLegislation | undefined> {
    return this.ukPropertyLegislationData.get(id);
  }

  async getLegislationByCategory(category: string): Promise<UkPropertyLegislation[]> {
    return Array.from(this.ukPropertyLegislationData.values()).filter(
      item => item.category === category
    );
  }

  async getLegislationByUrgency(urgency: string): Promise<UkPropertyLegislation[]> {
    return Array.from(this.ukPropertyLegislationData.values()).filter(
      item => item.urgency === urgency
    );
  }

  async getLegislationByTitleAndSource(title: string, source: string): Promise<UkPropertyLegislation | undefined> {
    return Array.from(this.ukPropertyLegislationData.values()).find(
      item => item.title === title && item.governmentSource === source
    );
  }

  async createLegislation(legislation: InsertUkPropertyLegislation): Promise<UkPropertyLegislation> {
    const id = this.ukPropertyLegislationCurrentId++;
    const newLegislation: UkPropertyLegislation = {
      ...legislation,
      id,
      lastUpdated: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.ukPropertyLegislationData.set(id, newLegislation);
    return newLegislation;
  }

  async updateLegislation(id: number, legislation: Partial<UkPropertyLegislation>): Promise<UkPropertyLegislation | undefined> {
    const existing = this.ukPropertyLegislationData.get(id);
    if (!existing) return undefined;
    
    const updated = { 
      ...existing, 
      ...legislation, 
      updatedAt: new Date(),
      lastUpdated: new Date()
    };
    this.ukPropertyLegislationData.set(id, updated);
    return updated;
  }

  async deleteLegislation(id: number): Promise<boolean> {
    return this.ukPropertyLegislationData.delete(id);
  }

  // User Legislation Tracking methods
  async getUserLegislationTracking(userId: number): Promise<UserLegislationTracking[]> {
    return Array.from(this.userLegislationTrackingData.values()).filter(
      item => item.userId === userId
    );
  }

  async createUserLegislationTracking(tracking: InsertUserLegislationTracking): Promise<UserLegislationTracking> {
    const id = this.userLegislationTrackingCurrentId++;
    const newTracking: UserLegislationTracking = {
      ...tracking,
      id,
      acknowledgedAt: new Date(),
      createdAt: new Date(),
    };
    this.userLegislationTrackingData.set(id, newTracking);
    return newTracking;
  }

  async markLegislationAsAcknowledged(userId: number, legislationId: number): Promise<UserLegislationTracking | undefined> {
    // Check if tracking already exists
    const existing = Array.from(this.userLegislationTrackingData.values()).find(
      item => item.userId === userId && item.legislationId === legislationId
    );

    if (existing) {
      const updated = { 
        ...existing, 
        acknowledgedAt: new Date()
      };
      this.userLegislationTrackingData.set(existing.id, updated);
      return updated;
    } else {
      // Create new tracking record
      return this.createUserLegislationTracking({
        userId,
        legislationId,
        reminderSent: false,
        reminderSentAt: null
      });
    }
  }
}

// Import the PostgreSQL storage implementation
import { dbStorage } from './db-storage';

// Choose the appropriate storage implementation
// export const storage = new MemStorage(); // In-memory storage (for development)
export const storage = dbStorage; // PostgreSQL storage (for production)
