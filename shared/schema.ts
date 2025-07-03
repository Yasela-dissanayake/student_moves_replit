import { pgTable, text, serial, integer, boolean, timestamp, numeric, json, date, pgEnum, uuid, varchar, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for fraud detection
export const fraudActivityTypeEnum = pgEnum('fraud_activity_type', [
  'user_registration',
  'property_application',
  'document_upload',
  'payment_processing',
  'login_attempt',
  'profile_update'
]);

export const fraudAlertSeverityEnum = pgEnum('fraud_alert_severity', [
  'low',
  'medium',
  'high',
  'critical'
]);

export const studentVerificationStatusEnum = pgEnum('student_verification_status', [
  'unverified',
  'pending',
  'verified',
  'rejected',
  'expired'
]);

export const fraudAlertStatusEnum = pgEnum('fraud_alert_status', [
  'new',
  'reviewing',
  'dismissed',
  'confirmed'
]);

// Utility types enum
export const utilityTypeEnum = pgEnum('utility_type', [
  'gas',
  'electricity',
  'dual_fuel',
  'water',
  'broadband',
  'tv_license'
]);

// Utility contract status enum
export const utilityContractStatusEnum = pgEnum('utility_contract_status', [
  'pending',
  'in_progress',
  'active',
  'cancelled',
  'expired',
  'blocked'
]);

// Interface for property description generation with AI
export interface PropertyDescriptionParams {
  title: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  location: string;
  university?: string;
  features: string[];
  nearbyAmenities?: string[];
  furnished: boolean;
  garden?: boolean;
  parking?: boolean;
  billsIncluded: boolean;
  includedBills?: string[];
  additionalDetails?: string;
  tone?: 'professional' | 'casual' | 'luxury' | 'student-focused';
  propertyCategory?: 'house' | 'apartment' | 'studio' | 'hmo' | 'shared' | 'ensuite' | 'other';
  target?: 'students' | 'professionals' | 'families';
  pricePoint?: 'budget' | 'mid-range' | 'premium';
  optimizeForSEO?: boolean;
  highlightUtilities?: boolean;
  maxLength?: number;
}

// Legal legislation categories enum
export const legislationCategoryEnum = pgEnum('legislation_category', [
  'tenancy_law',
  'safety_regulations',
  'tax_requirements',
  'landlord_obligations',
  'tenant_rights',
  'deposit_protection',
  'property_standards',
  'energy_efficiency',
  'fire_safety',
  'electrical_safety',
  'gas_safety',
  'planning_permission',
  'licensing_requirements',
  'eviction_procedures',
  'rent_controls'
]);

// Digital signing enums
export const documentSigningStatusEnum = pgEnum('document_signing_status', [
  'draft',
  'sent',
  'in_progress', 
  'completed',
  'declined',
  'expired'
]);

export const signatoryStatusEnum = pgEnum('signatory_status', [
  'pending',
  'signed',
  'declined'
]);

export const legislationStatusEnum = pgEnum('legislation_status', [
  'active',
  'proposed',
  'coming_into_force',
  'repealed',
  'amended'
]);

export const legislationUrgencyEnum = pgEnum('legislation_urgency', [
  'low',
  'medium',
  'high',
  'critical'
]);

// UK Property Legislation Schema
export const ukPropertyLegislation = pgTable("uk_property_legislation", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: legislationCategoryEnum("category").notNull(),
  status: legislationStatusEnum("status").notNull().default('active'),
  urgency: legislationUrgencyEnum("urgency").notNull().default('medium'),
  effectiveDate: date("effective_date"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  sourceUrl: text("source_url"),
  governmentSource: text("government_source"), // e.g., "gov.uk", "legislation.gov.uk"
  summary: text("summary"),
  keyPoints: json("key_points").$type<string[]>(),
  affectedParties: json("affected_parties").$type<string[]>(), // ['landlords', 'agents', 'tenants']
  complianceDeadline: date("compliance_deadline"),
  penalties: text("penalties"),
  relatedLegislation: json("related_legislation").$type<number[]>(),
  tags: json("tags").$type<string[]>(),
  isBreaking: boolean("is_breaking").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User legislation tracking - which legislation items users have acknowledged
export const userLegislationTracking = pgTable("user_legislation_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  legislationId: integer("legislation_id").references(() => ukPropertyLegislation.id),
  acknowledgedAt: timestamp("acknowledged_at").defaultNow(),
  reminderSent: boolean("reminder_sent").default(false),
  reminderSentAt: timestamp("reminder_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Providers Schema
export const aiProviders = pgTable("ai_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 'openai', 'gemini', 'huggingface', 'mistral'
  displayName: text("display_name").notNull(), // 'OpenAI', 'Google Gemini', 'Hugging Face', 'Mistral AI'
  active: boolean("active").default(false),
  priority: integer("priority").notNull(), // Lower number means higher priority
  lastChecked: timestamp("last_checked"),
  status: text("status").default("unknown"), // 'active', 'inactive', 'error', 'unknown'
  errorMessage: text("error_message"),
  capabilities: json("capabilities").$type<string[]>().default(['text']), // 'text', 'image', 'audio', etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAiProviderSchema = createInsertSchema(aiProviders).omit({
  id: true,
  lastChecked: true,
  createdAt: true,
  updatedAt: true,
});

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  userType: text("user_type").notNull(), // 'tenant', 'landlord', 'agent', 'admin', 'student'
  verified: boolean("verified").default(false),
  // Student-specific verification fields
  studentVerificationStatus: studentVerificationStatusEnum("student_verification_status").default("unverified"),
  studentVerifiedAt: timestamp("student_verified_at"),
  studentUniversityEmail: text("student_university_email"),
  studentUniversityName: text("student_university_name"),
  studentUniversityEmailVerified: boolean("student_university_email_verified").default(false),
  // ID Verification
  idVerified: boolean("id_verified").default(false),
  idVerificationDate: timestamp("id_verification_date"),
  idDocumentType: text("id_document_type"), // 'passport', 'drivers_license', 'national_id'
  idDocumentNumber: text("id_document_number"),
  idDocumentImage: text("id_document_image"), // URL to uploaded document image
  idDocumentExpiry: timestamp("id_document_expiry"),
  faceImage: text("face_image"), // URL to uploaded face/selfie image for comparison
  faceToDocumentMatchScore: numeric("face_document_match_score"), // AI face matching score (0-100)
  faceToDocumentVerified: boolean("face_document_verified").default(false), // Whether AI has verified face matches document
  // Address verification
  addressVerified: boolean("address_verified").default(false),
  addressVerificationDate: timestamp("address_verification_date"),
  addressVerificationDocument: text("address_verification_document"), // URL to proof of address
  // Banking information for marketplace purchases and sales
  bankAccountName: text("bank_account_name"),
  bankAccountNumber: text("bank_account_number"),
  bankSortCode: text("bank_sort_code"),
  bankVerified: boolean("bank_verified").default(false),
  // WhatsApp integration fields
  whatsappVerified: boolean("whatsapp_verified").default(false),
  whatsappVerificationDate: timestamp("whatsapp_verification_date"),
  whatsappOptIn: boolean("whatsapp_opt_in").default(false), // User consent for WhatsApp messages
  // Right to Rent verification fields directly on the user schema
  rightToRentVerified: boolean("right_to_rent_verified").default(false),
  rightToRentCheckDate: timestamp("right_to_rent_check_date"),
  rightToRentStatus: text("right_to_rent_status"), // 'unlimited', 'time-limited', null
  rightToRentExpiryDate: timestamp("right_to_rent_expiry_date"),
  profileImage: text("profile_image"),
  stripeCustomerId: text("stripe_customer_id"), // Stripe customer ID for payment processing
  stripeSubscriptionId: text("stripe_subscription_id"), // For users with recurring subscriptions
  paymentMethod: text("payment_method"), // preferred payment method
  billingAddress: text("billing_address"), // billing address
  billingCity: text("billing_city"),
  billingPostcode: text("billing_postcode"),
  billingCountry: text("billing_country"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  verified: true,
  createdAt: true,
  updatedAt: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
});

// Deposit Scheme Credentials Schema
// Deposit Scheme Type enum
export const depositSchemeTypeEnum = pgEnum('deposit_scheme_type', [
  'dps',      // Deposit Protection Service
  'mydeposits', // MyDeposits
  'tds'       // Tenancy Deposit Scheme
]);

// Deposit Registration Status enum
export const depositRegistrationStatusEnum = pgEnum('deposit_registration_status', [
  'pending',        // Registration has been initiated but not completed
  'in_progress',    // API call to scheme is in progress
  'registered',     // Successfully registered with the scheme
  'failed',         // Registration failed
  'expired',        // Registration has expired
  'renewed',        // Registration has been renewed
  'released'        // Deposit has been released back to tenant
]);

// Deposit Protection Type enum
export const depositProtectionTypeEnum = pgEnum('deposit_protection_type', [
  'custodial',      // Scheme holds the deposit
  'insured'         // Landlord/agent holds the deposit, scheme insures it
]);

export const depositSchemeCredentials = pgTable("deposit_scheme_credentials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Landlord or agent ID
  schemeName: depositSchemeTypeEnum("scheme_name").notNull(), // 'dps', 'mydeposits', 'tds'
  schemeUsername: text("scheme_username").notNull(),
  schemePassword: text("scheme_password").notNull(),
  accountNumber: text("account_number"),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"), // For schemes requiring an API secret
  protectionType: depositProtectionTypeEnum("protection_type").default("custodial"), // custodial or insured
  isDefault: boolean("is_default").default(false),
  lastVerified: timestamp("last_verified"), // When the credentials were last verified
  isVerified: boolean("is_verified").default(false), // Whether credentials are valid
  lastUsed: timestamp("last_used"), // When credentials were last used
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertDepositSchemeCredentialsSchema = createInsertSchema(depositSchemeCredentials).omit({
  id: true,
  isVerified: true,
  lastVerified: true,
  lastUsed: true,
  createdAt: true,
  updatedAt: true,
});

export type DepositSchemeCredentials = typeof depositSchemeCredentials.$inferSelect;
export type InsertDepositSchemeCredentials = z.infer<typeof insertDepositSchemeCredentialsSchema>;

// Deposit Registrations table for tracking full deposit lifecycle
export const depositRegistrations = pgTable("deposit_registrations", {
  id: serial("id").primaryKey(),
  tenancyId: integer("tenancy_id").notNull(), // Link to the tenancy
  propertyId: integer("property_id").notNull(), // Link to the property
  registeredById: integer("registered_by_id").notNull(), // User who registered the deposit
  registeredByType: text("registered_by_type").notNull(), // landlord or agent
  schemeCredentialId: integer("scheme_credential_id").notNull(), // Link to the credentials used
  schemeName: depositSchemeTypeEnum("scheme_name").notNull(), // dps, mydeposits, tds
  protectionType: depositProtectionTypeEnum("protection_type").notNull(), // custodial or insured
  depositAmount: numeric("deposit_amount").notNull(), // Amount of the deposit
  depositReferenceId: text("deposit_reference_id"), // Reference ID provided by the scheme
  tenantNames: json("tenant_names").$type<string[]>().notNull(), // Array of tenant names
  tenantEmails: json("tenant_emails").$type<string[]>().notNull(), // Array of tenant emails
  tenantPhones: json("tenant_phones").$type<string[]>(), // Array of tenant phones
  certificateUrl: text("certificate_url"), // URL to the protection certificate
  prescribedInfoUrl: text("prescribed_info_url"), // URL to the prescribed information document
  status: depositRegistrationStatusEnum("status").default("pending"),
  registeredAt: timestamp("registered_at").defaultNow(), // When the deposit was registered
  expiryDate: timestamp("expiry_date"), // When the protection expires
  renewalReminder: boolean("renewal_reminder").default(true), // Send reminder before expiry
  renewalReminderSentAt: timestamp("renewal_reminder_sent_at"), // When renewal reminder was sent
  lastCheckedAt: timestamp("last_checked_at"), // When status was last verified with scheme
  apiResponse: json("api_response"), // Raw response from API
  errorMessage: text("error_message"), // Error message if registration failed
  internalNotes: text("internal_notes"), // Notes for staff
  updatedAt: timestamp("updated_at"),
});

export const insertDepositRegistrationSchema = createInsertSchema(depositRegistrations).omit({
  id: true,
  status: true,
  registeredAt: true,
  renewalReminderSentAt: true,
  lastCheckedAt: true,
  apiResponse: true,
  errorMessage: true,
  updatedAt: true,
});

export type DepositRegistration = typeof depositRegistrations.$inferSelect;
export type InsertDepositRegistration = z.infer<typeof insertDepositRegistrationSchema>;

// Property Schema
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  postcode: text("postcode").notNull(),
  price: numeric("price").notNull(),
  pricePerPerson: numeric("price_per_person"), // Weekly price per person
  propertyType: text("property_type").notNull(), // studio, flat, house, etc.
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  available: boolean("available").default(true),
  availableDate: text("available_date"), // "1st July 2025" or "Now Let"
  area: text("area"), // "Hyde Park", "Headingley", "City Centre", etc.
  features: json("features").$type<string[]>().default([]),
  images: json("images").$type<string[]>().default([]),
  videos: json("videos").$type<string[]>().default([]),
  virtualTourUrl: text("virtual_tour_url"),
  depositAmount: numeric("deposit_amount"), // Property deposit amount
  depositProtectionScheme: text("deposit_protection_scheme"), // E.g., "Deposit Protection Service"
  depositProtectionId: text("deposit_protection_id"), // Deposit protection reference
  ownerId: integer("owner_id").notNull(), // can be landlord or agent
  university: text("university"),
  distanceToUniversity: text("distance_to_university"),
  nearbyUniversities: json("nearby_universities").$type<{name: string, distance: string, travelTime: string}[]>().default([]),
  // Property compliance fields
  epcRating: text("epc_rating"), // Energy Performance Certificate rating (A-G)
  epcExpiryDate: timestamp("epc_expiry_date"),
  gasChecked: boolean("gas_checked").default(false),
  gasCheckDate: timestamp("gas_check_date"),
  gasCheckExpiryDate: timestamp("gas_check_expiry_date"),
  electricalChecked: boolean("electrical_checked").default(false),
  electricalCheckDate: timestamp("electrical_check_date"),
  electricalCheckExpiryDate: timestamp("electrical_check_expiry_date"),
  hmoLicensed: boolean("hmo_licensed").default(false),
  hmoLicenseNumber: text("hmo_license_number"),
  hmoLicenseExpiryDate: timestamp("hmo_license_expiry_date"),
  // Property additional details
  furnished: boolean("furnished").default(false),
  petsAllowed: boolean("pets_allowed").default(false),
  smokingAllowed: boolean("smoking_allowed").default(false),
  parkingAvailable: boolean("parking_available").default(false),
  billsIncluded: boolean("bills_included").default(true), // All properties must include bills
  includedBills: json("included_bills").$type<string[]>().default(['gas', 'electricity', 'water', 'broadband']), // All-inclusive utilities required
  // Management details
  managedBy: text("managed_by").default("landlord"), // "landlord" or "agent"
  agentId: integer("agent_id"), // Only set if managedBy = "agent"
  // Landlord details for agent-managed properties
  landlordId: integer("landlord_id"), // Only required for agent-managed properties
  landlordCommissionPercentage: numeric("landlord_commission_percentage"),
  maintenanceBudget: numeric("maintenance_budget"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Application Schema
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  moveInDate: timestamp("move_in_date"),
  message: text("message"),
  // Group application fields
  isGroupApplication: boolean("is_group_application").default(false),
  groupId: text("group_id"), // UUID for the group application
  groupLeadId: integer("group_lead_id"), // User ID of the group lead/organizer
  numBedroomsRequested: integer("num_bedrooms_requested"), // For matching to appropriate properties
  createdAt: timestamp("created_at").defaultNow(),
});

// Group Application Members Schema
export const groupApplicationMembers = pgTable("group_application_members", {
  id: serial("id").primaryKey(),
  groupId: text("group_id").notNull(), // UUID for the group application
  applicationId: integer("application_id").notNull(), // Reference to the main application
  userId: integer("user_id").notNull(), // Member user ID
  status: text("status").notNull().default("invited"), // invited, accepted, declined
  verificationCompleted: boolean("verification_completed").default(false),
  rightToRentVerified: boolean("right_to_rent_verified").default(false),
  invitedBy: integer("invited_by").notNull(), // User ID who sent the invitation
  invitedAt: timestamp("invited_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  notes: text("notes"),
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  status: true,
  createdAt: true,
});

export const insertGroupApplicationMemberSchema = createInsertSchema(groupApplicationMembers).omit({
  id: true,
  status: true, 
  verificationCompleted: true,
  rightToRentVerified: true,
  invitedAt: true,
  respondedAt: true
});

// Tenancy Schema
export const tenancies = pgTable("tenancies", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  rentAmount: numeric("rent_amount").notNull(),
  depositAmount: numeric("deposit_amount").notNull(),
  depositProtectionScheme: text("deposit_protection_scheme"),
  depositProtectionId: text("deposit_protection_id"),
  signedByTenant: boolean("signed_by_tenant").default(false),
  signedByOwner: boolean("signed_by_owner").default(false),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTenancySchema = createInsertSchema(tenancies).omit({
  id: true,
  signedByTenant: true,
  signedByOwner: true,
  active: true,
  createdAt: true,
});

// Payment Schema
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  tenancyId: integer("tenancy_id").notNull(),
  amount: numeric("amount").notNull(),
  paymentType: text("payment_type").notNull(), // rent, deposit, etc.
  status: text("status").notNull(), // pending, completed, failed
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  stripePaymentIntentId: text("stripe_payment_intent_id"), // Stripe payment intent ID
  stripeSubscriptionId: text("stripe_subscription_id"), // Stripe subscription ID for recurring payments
  stripeInvoiceId: text("stripe_invoice_id"), // Stripe invoice ID
  stripeCustomerId: text("stripe_customer_id"), // Stripe customer ID
  paymentMethod: text("payment_method"), // card, bank_transfer, etc.
  paymentMethodDetails: json("payment_method_details"), // Details about the payment method
  receiptUrl: text("receipt_url"), // URL to the receipt
  description: text("description"), // Description of the payment
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"), // When the payment record was last updated
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  stripePaymentIntentId: true,
  stripeSubscriptionId: true,
  stripeInvoiceId: true,
  receiptUrl: true,
});

// Verification Schema
export const verifications = pgTable("verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  documentType: text("document_type").notNull(), // passport, drivers license, etc.
  documentImage: text("document_image").notNull(),
  selfieImage: text("selfie_image").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  aiVerified: boolean("ai_verified").default(false),
  aiVerifiedAt: timestamp("ai_verified_at"),
  adminVerified: boolean("admin_verified").default(false),
  adminVerifiedAt: timestamp("admin_verified_at"),
  adminVerifiedBy: integer("admin_verified_by"),
  // Right to Rent verification fields
  rightToRentVerified: boolean("right_to_rent_verified").default(false),
  rightToRentStatus: text("right_to_rent_status"), // unlimited, time-limited, not-verified
  rightToRentExpiryDate: timestamp("right_to_rent_expiry_date"), // For time-limited right to rent
  rightToRentDocumentId: text("right_to_rent_document_id"), // Reference to generated Right to Rent form
  rightToRentCheckDate: timestamp("right_to_rent_check_date"), // When Right to Rent was verified
  rightToRentFollowUpNeeded: boolean("right_to_rent_follow_up_needed").default(false),
  rightToRentFollowUpDate: timestamp("right_to_rent_follow_up_date"), // When follow-up is needed
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVerificationSchema = createInsertSchema(verifications).omit({
  id: true,
  status: true,
  aiVerified: true,
  aiVerifiedAt: true,
  adminVerified: true,
  adminVerifiedAt: true,
  adminVerifiedBy: true,
  metadata: true,
  createdAt: true,
});

// Document Schema
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  documentType: text("document_type").notNull(), // rental_agreement, deposit_certificate, etc.
  format: text("format").notNull().default("txt"), // txt, html, pdf
  templateId: text("template_id"), // Reference to the template used
  propertyId: integer("property_id"),
  landlordId: integer("landlord_id"),
  agentId: integer("agent_id"),
  tenantId: integer("tenant_id"),
  tenancyId: integer("tenancy_id"),
  createdById: integer("created_by_id").notNull(), // User who created the document
  signedByTenant: boolean("signed_by_tenant").default(false),
  signedByLandlord: boolean("signed_by_landlord").default(false),
  signedByAgent: boolean("signed_by_agent").default(false),
  tenantSignatureData: text("tenant_signature_data"), // Base64 encoded signature image
  landlordSignatureData: text("landlord_signature_data"), // Base64 encoded signature image
  agentSignatureData: text("agent_signature_data"), // Base64 encoded signature image
  dateSigned: timestamp("date_signed"),
  aiGenerated: boolean("ai_generated").default(false),
  customRequirements: text("custom_requirements"), // For AI-generated documents
  storagePath: text("storage_path"), // Path to the file on disk
  documentUrl: text("document_url"), // URL to access the document
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  signedByTenant: true,
  signedByLandlord: true,
  signedByAgent: true,
  tenantSignatureData: true,
  landlordSignatureData: true,
  agentSignatureData: true,
  dateSigned: true,
  createdAt: true,
  updatedAt: true,
});

// User Referral Schema
export const userReferrals = pgTable("user_referrals", {
  id: serial("id").primaryKey(),
  referrerUserId: integer("referrer_user_id").notNull().references(() => users.id),
  inviteeEmail: text("invitee_email").notNull(),
  inviteeName: text("invitee_name"),
  referralCode: text("referral_code").notNull().unique(),
  message: text("message"),
  invitationSentAt: timestamp("invitation_sent_at").defaultNow(),
  status: text("status").notNull().default("pending"), // pending, accepted, expired
  acceptedAt: timestamp("accepted_at"),
  acceptedByUserId: integer("accepted_by_user_id").references(() => users.id),
  invitationType: text("invitation_type").default("email"), // email, sms, whatsapp, link
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertUserReferralSchema = createInsertSchema(userReferrals).omit({
  id: true,
  invitationSentAt: true,
  status: true,
  acceptedAt: true,
  acceptedByUserId: true,
  createdAt: true,
  updatedAt: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type GroupApplicationMember = typeof groupApplicationMembers.$inferSelect;
export type InsertGroupApplicationMember = z.infer<typeof insertGroupApplicationMemberSchema>;

export type Tenancy = typeof tenancies.$inferSelect;
export type InsertTenancy = z.infer<typeof insertTenancySchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Verification = typeof verifications.$inferSelect;
export type InsertVerification = z.infer<typeof insertVerificationSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

// Accounting System Schemas

// Financial Account Schema (for tracking income and expenses)
export const financialAccounts = pgTable("financial_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // The landlord or agent that owns this account
  name: text("name").notNull(), // e.g., "Rental Income", "Property Expenses", "Maintenance Costs", etc.
  description: text("description"),
  accountType: text("account_type").notNull(), // "income", "expense", "asset", "liability"
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

export const insertFinancialAccountSchema = createInsertSchema(financialAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type FinancialAccount = typeof financialAccounts.$inferSelect;
export type InsertFinancialAccount = z.infer<typeof insertFinancialAccountSchema>;

// Financial Transaction Schema
export const financialTransactions = pgTable("financial_transactions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull(), // The financial account this transaction belongs to
  amount: numeric("amount").notNull(),
  transactionType: text("transaction_type").notNull(), // "income", "expense", "transfer"
  description: text("description").notNull(),
  category: text("category").notNull(), // e.g., "rent", "maintenance", "utilities", "fees", etc.
  propertyId: integer("property_id"), // Optional reference to a property
  tenancyId: integer("tenancy_id"), // Optional reference to a tenancy
  tenantId: integer("tenant_id"), // Optional reference to a tenant
  paymentId: integer("payment_id"), // Optional reference to a payment
  maintenanceRequestId: integer("maintenance_request_id"), // Optional reference to a maintenance request
  transactionDate: date("transaction_date").notNull(),
  notes: text("notes"),
  receiptUrl: text("receipt_url"), // URL to a receipt image
  isRecurring: boolean("is_recurring").default(false),
  recurringFrequency: text("recurring_frequency"), // "monthly", "quarterly", "annually", etc.
  createdById: integer("created_by_id").notNull(), // User who created this transaction
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type FinancialTransaction = typeof financialTransactions.$inferSelect;
export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;

// Financial Reports Schema (for saving generated reports)
export const financialReports = pgTable("financial_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // The landlord or agent that owns this report
  title: text("title").notNull(),
  description: text("description"),
  reportType: text("report_type").notNull(), // "income_statement", "balance_sheet", "cash_flow", "tax", etc.
  dateRange: json("date_range").$type<{startDate: string, endDate: string}>(),
  filters: json("filters").$type<Record<string, any>>(), // Any filters applied to the report
  generatedContent: text("generated_content").notNull(), // The actual report content (HTML or JSON)
  format: text("format").notNull().default("html"), // "html", "json", "csv", "pdf"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

export const insertFinancialReportSchema = createInsertSchema(financialReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type FinancialReport = typeof financialReports.$inferSelect;
export type InsertFinancialReport = z.infer<typeof insertFinancialReportSchema>;

// Tax Information Schema
export const taxInformation = pgTable("tax_information", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // The landlord or agent
  taxYear: text("tax_year").notNull(), // e.g., "2024-2025"
  totalIncome: numeric("total_income").notNull().default("0"),
  totalExpenses: numeric("total_expenses").notNull().default("0"),
  totalTaxableProfit: numeric("total_taxable_profit").notNull().default("0"),
  taxNotes: text("tax_notes"),
  estimatedTaxDue: numeric("estimated_tax_due").default("0"),
  isComplete: boolean("is_complete").default(false),
  lastCalculatedAt: timestamp("last_calculated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

export const insertTaxInformationSchema = createInsertSchema(taxInformation).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastCalculatedAt: true
});

export type TaxInformation = typeof taxInformation.$inferSelect;
export type InsertTaxInformation = z.infer<typeof insertTaxInformationSchema>;

// Property Finance Schema (connects properties with financial data)
export const propertyFinances = pgTable("property_finances", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  purchasePrice: numeric("purchase_price"),
  purchaseDate: date("purchase_date"),
  currentValue: numeric("current_value"),
  lastValuationDate: date("last_valuation_date"),
  mortgageAmount: numeric("mortgage_amount"),
  mortgageProvider: text("mortgage_provider"),
  mortgageInterestRate: numeric("mortgage_interest_rate"),
  mortgagePayment: numeric("mortgage_payment"),
  mortgageType: text("mortgage_type"), // "interest_only", "repayment", etc.
  annualInsuranceCost: numeric("annual_insurance_cost"),
  annualPropertyTax: numeric("annual_property_tax"),
  annualMaintenanceEstimate: numeric("annual_maintenance_estimate"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

export const insertPropertyFinanceSchema = createInsertSchema(propertyFinances).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type PropertyFinance = typeof propertyFinances.$inferSelect;
export type InsertPropertyFinance = z.infer<typeof insertPropertyFinanceSchema>;

// Maintenance Request Schema
export const maintenanceRequests = pgTable("maintenance_requests", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  tenantId: integer("tenant_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull().default("medium"), // low, medium, high, emergency
  status: text("status").notNull().default("pending"), // pending, scheduled, in-progress, completed, cancelled
  reportedDate: timestamp("reported_date").defaultNow(),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  category: text("category"), // plumbing, electrical, appliance, etc.
  estimatedCost: numeric("estimated_cost"),
  actualCost: numeric("actual_cost"),
  assignedContractorId: integer("assigned_contractor_id"), // Contractor ID of assigned contractor
  assignedAgentId: integer("assigned_agent_id"), // User ID of agent assigned
  notes: text("notes"),
  images: json("images").$type<string[]>().default([]),
  requiresLandlordApproval: boolean("requires_landlord_approval").default(false),
  landlordApproved: boolean("landlord_approved").default(false),
  tenantReported: boolean("tenant_reported").default(false), // To identify if reported by tenant
  recurring: boolean("recurring").default(false), // For recurring maintenance tasks
  recurrenceInterval: text("recurrence_interval"), // weekly, monthly, quarterly, yearly, etc.
  nextScheduledDate: timestamp("next_scheduled_date"), // For recurring maintenance 
  budget: numeric("budget"), // Budget allocated for this maintenance
  invoiceUrl: text("invoice_url"), // URL to stored invoice document
  receiptUrl: text("receipt_url"), // URL to stored receipt document
  // WhatsApp integration fields
  whatsappMessageSent: boolean("whatsapp_message_sent").default(false),
  whatsappMessageSentAt: timestamp("whatsapp_message_sent_at"),
  whatsappMessageId: text("whatsapp_message_id"), // ID of the WhatsApp message for tracking
  whatsappCompletionPhotosReceived: boolean("whatsapp_completion_photos_received").default(false),
  whatsappCompletionPhotosReceivedAt: timestamp("whatsapp_completion_photos_received_at"),
  whatsappCompletionPhotos: json("whatsapp_completion_photos").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMaintenanceRequestSchema = createInsertSchema(maintenanceRequests).omit({
  id: true,
  status: true,
  reportedDate: true,
  completedDate: true,
  assignedContractorId: true,
  landlordApproved: true,
  createdAt: true,
  updatedAt: true,
});

// Safety Certificates Schema
export const safetyCertificates = pgTable("safety_certificates", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  type: text("type").notNull(), // gas, electrical, epc, fire, etc.
  issueDate: timestamp("issue_date").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  certificateNumber: text("certificate_number"),
  issuedBy: text("issued_by").notNull(),
  documentUrl: text("document_url"),
  status: text("status").notNull().default("valid"), // valid, expired, expiring_soon
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSafetyCertificateSchema = createInsertSchema(safetyCertificates).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

// Landlord Schema - for better agent management of landlords
export const landlords = pgTable("landlords", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  companyName: text("company_name"),
  address: text("address").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  bankAccount: text("bank_account"),
  bankSortCode: text("bank_sort_code"),
  commissionRate: numeric("commission_rate"),
  paymentTerms: text("payment_terms"),
  notes: text("notes"),
  preferredContactMethod: text("preferred_contact_method").default("email"), // email, phone, post
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLandlordSchema = createInsertSchema(landlords).omit({
  id: true,
  active: true,
  createdAt: true,
  updatedAt: true,
});

// Contractor Schema - for maintenance management
export const contractors = pgTable("contractors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  companyName: text("company_name"),
  services: json("services").$type<string[]>().default([]), // plumbing, electrical, cleaning, etc.
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  whatsappVerified: boolean("whatsapp_verified").default(false),
  whatsappVerificationDate: timestamp("whatsapp_verification_date"),
  address: text("address"),
  hourlyRate: numeric("hourly_rate"),
  insuranceInfo: text("insurance_info"),
  insuranceExpiryDate: timestamp("insurance_expiry_date"),
  vatRegistered: boolean("vat_registered").default(false),
  vatNumber: text("vat_number"),
  preferredPaymentTerms: text("preferred_payment_terms"),
  certifications: json("certifications").$type<string[]>().default([]), // Gas Safe, NICEIC, etc.
  serviceAreas: json("service_areas").$type<string[]>().default([]), // Leeds, York, etc.
  responseTime: text("response_time"), // same day, next day, within 48h, etc.
  availableWeekends: boolean("available_weekends").default(false),
  availableEvenings: boolean("available_evenings").default(false),
  emergencyCallouts: boolean("emergency_callouts").default(false),
  rating: numeric("rating"), // 1-5 star rating
  totalJobsCompleted: integer("total_jobs_completed").default(0),
  notes: text("notes"),
  profileImage: text("profile_image"),
  documentsUrls: json("document_urls").$type<string[]>().default([]), // URLs to certificates, insurance docs, etc.
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContractorSchema = createInsertSchema(contractors).omit({
  id: true,
  active: true,
  createdAt: true,
  updatedAt: true,
});

// Property Inspection Schema
export const propertyInspections = pgTable("property_inspections", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  inspectedBy: integer("inspected_by").notNull(), // User ID of agent or admin
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  status: text("status").notNull().default("scheduled"), // scheduled, completed, missed
  type: text("type").notNull(), // routine, move-in, move-out, quarterly, annual
  overallCondition: text("overall_condition"), // excellent, good, fair, poor
  issues: json("issues").$type<string[]>().default([]),
  recommendations: text("recommendations"),
  tenantPresent: boolean("tenant_present").default(false),
  images: json("images").$type<string[]>().default([]),
  notes: text("notes"),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPropertyInspectionSchema = createInsertSchema(propertyInspections).omit({
  id: true,
  completedDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

// Import user status schemas
export * from './user-status-schema';

// Type definitions
export type AiProvider = typeof aiProviders.$inferSelect;
export type InsertAiProvider = z.infer<typeof insertAiProviderSchema>;

export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;

export type SafetyCertificate = typeof safetyCertificates.$inferSelect;
export type InsertSafetyCertificate = z.infer<typeof insertSafetyCertificateSchema>;

export type Landlord = typeof landlords.$inferSelect;
export type InsertLandlord = z.infer<typeof insertLandlordSchema>;

export type Contractor = typeof contractors.$inferSelect;
export type InsertContractor = z.infer<typeof insertContractorSchema>;

export type PropertyInspection = typeof propertyInspections.$inferSelect;
export type InsertPropertyInspection = z.infer<typeof insertPropertyInspectionSchema>;

// Maintenance Template Schema
export const maintenanceTemplates = pgTable("maintenance_templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // plumbing, electrical, etc.
  estimatedCost: numeric("estimated_cost"),
  estimatedTime: text("estimated_time"), // "1 hour", "2-3 hours", etc.
  priority: text("priority").notNull().default("medium"), // low, medium, high, emergency
  steps: json("steps").$type<string[]>().default([]), // Step by step instructions
  requiredTools: json("required_tools").$type<string[]>().default([]),
  requiredMaterials: json("required_materials").$type<string[]>().default([]),
  recommendedContractorType: text("recommended_contractor_type"), // plumber, electrician, etc.
  propertyTypeApplicable: json("property_type_applicable").$type<string[]>().default([]), // house, flat, etc.
  seasonal: boolean("seasonal").default(false), // if it's a seasonal maintenance
  season: text("season"), // spring, summer, fall, winter
  frequency: text("frequency"), // once, weekly, monthly, quarterly, yearly
  createdBy: integer("created_by"), // User ID who created the template
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMaintenanceTemplateSchema = createInsertSchema(maintenanceTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type MaintenanceTemplate = typeof maintenanceTemplates.$inferSelect;
export type InsertMaintenanceTemplate = z.infer<typeof insertMaintenanceTemplateSchema>;

// Calendar Events Schema
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  allDay: boolean("all_day").default(false),
  location: text("location"),
  type: text("type").notNull(), // maintenance, inspection, visit, reminder, etc.
  relatedEntityType: text("related_entity_type"), // property, tenant, contractor, etc.
  relatedEntityId: integer("related_entity_id"), // ID of related entity
  status: text("status").default("scheduled"), // scheduled, completed, canceled, etc.
  color: text("color"), // CSS color or predefined set
  reminderEnabled: boolean("reminder_enabled").default(false),
  reminderBefore: integer("reminder_before"), // minutes before event
  reminderSentTo: json("reminder_sent_to").$type<string[]>().default([]), // list of email addresses
  recurringEvent: boolean("recurring_event").default(false),
  recurrenceRule: text("recurrence_rule"), // RRULE format for recurring events
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;

// Viewing Requests Schema
export const viewingRequests = pgTable("viewing_requests", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(), // Property being viewed
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  university: text("university"),
  preferredDate: date("preferred_date").notNull(),
  preferredTime: text("preferred_time").notNull(), // morning, afternoon, evening
  message: text("message"),
  status: text("status").default("pending"), // pending, confirmed, completed, cancelled
  eventId: integer("event_id"), // related calendar event once scheduled
  guestId: integer("guest_id"), // related tenant ID if authenticated
  
  // Enhanced fields for advanced booking features
  isGroupViewing: boolean("is_group_viewing").default(false), // For group viewing coordination
  groupId: text("group_id"), // UUID for group viewings
  groupLeadId: integer("group_lead_id"), // User who organized the group viewing
  groupMembers: json("group_members").$type<{name: string, email: string, phone?: string}[]>().default([]), // Other members for group viewing
  
  // Smart matching fields
  timePreference: json("time_preference").$type<{weekdays: boolean, weekends: boolean, eveningsOnly: boolean}>().default({weekdays: false, weekends: false, eveningsOnly: false}), // For smart calendar matching
  alternativeDates: json("alternative_dates").$type<string[]>().default([]), // Alternative dates the tenant is available
  matchScore: integer("match_score"), // AI matching score with landlord availability
  
  // Verification fields
  isVerifiedStudent: boolean("is_verified_student").default(false), // If verified with student email
  studentIdVerified: boolean("student_id_verified").default(false), // If student ID was uploaded & verified
  
  // Calendar integration fields
  calendarSyncId: text("calendar_sync_id"), // ID for Google/Apple calendar sync
  reminderSent: boolean("reminder_sent").default(false), // If reminder was sent
  reminderSentAt: timestamp("reminder_sent_at"), // When reminder was sent
  
  // Virtual viewing fields
  virtualViewingRequested: boolean("virtual_viewing_requested").default(false), // If virtual viewing was requested
  virtualViewingType: text("virtual_viewing_type"), // 'recorded' or 'live'
  virtualViewingUrl: text("virtual_viewing_url"), // URL for virtual viewing
  virtualViewingScheduledAt: timestamp("virtual_viewing_scheduled_at"), // When virtual viewing is scheduled
  
  // QR code related fields
  sourceQrCode: text("source_qr_code"), // ID of QR code if viewing was requested through one
  sourceLocation: text("source_location"), // Location of physical advertisement
  
  // Feedback & analysis fields
  cancellationReason: text("cancellation_reason"), // Reason if viewing was cancelled
  sentimentScore: numeric("sentiment_score"), // AI analysis of sentiment in messages
  feedbackProvided: boolean("feedback_provided").default(false), // If feedback was provided after viewing
  feedbackContent: text("feedback_content"), // Feedback content
  
  // Chatbot interaction fields
  chatbotInteractionId: text("chatbot_interaction_id"), // ID of related chatbot interaction
  assistedByAi: boolean("assisted_by_ai").default(false), // If booking was assisted by AI
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertViewingRequestSchema = createInsertSchema(viewingRequests).omit({
  id: true,
  eventId: true,
  status: true,
  matchScore: true,
  reminderSent: true,
  reminderSentAt: true,
  sentimentScore: true,
  feedbackProvided: true,
  createdAt: true,
  updatedAt: true,
});

export type ViewingRequest = typeof viewingRequests.$inferSelect;
export type InsertViewingRequest = z.infer<typeof insertViewingRequestSchema>;

// Virtual Viewing Feedback Schema
export const viewingFeedback = pgTable("viewing_feedback", {
  id: serial("id").primaryKey(),
  viewingRequestId: integer("viewing_request_id").notNull(), // Reference to the viewing request
  userId: integer("user_id"), // User who provided feedback (can be null for anonymous feedback)
  propertyId: integer("property_id").notNull(), // Property that was viewed
  overallRating: integer("overall_rating").notNull(), // 1-5 star rating
  connectionQuality: integer("connection_quality"), // 1-5 rating for connection quality
  audioQuality: integer("audio_quality"), // 1-5 rating for audio quality
  videoQuality: integer("video_quality"), // 1-5 rating for video quality
  hostProfessionalism: integer("host_professionalism"), // 1-5 rating for the host
  propertyAccuracy: integer("property_accuracy"), // 1-5 rating for accuracy of property representation
  questionsAnswered: boolean("questions_answered").default(true), // Were all questions answered
  likedMost: text("liked_most"), // What the viewer liked most about the property
  likedLeast: text("liked_least"), // What the viewer liked least about the property
  interestedInApplying: boolean("interested_in_applying").default(false), // If they're interested in applying
  comments: text("comments"), // General comments/feedback
  virtualViewingExperience: text("virtual_viewing_experience"), // Feedback specifically about virtual viewing experience
  suggestedImprovements: text("suggested_improvements"), // Suggestions for improving the viewing experience
  feedbackType: text("feedback_type").default("virtual"), // 'virtual' or 'in-person'
  sharedWithLandlord: boolean("shared_with_landlord").default(false), // If feedback shared with landlord
  sentiment: text("sentiment"), // AI-analyzed sentiment (positive, neutral, negative)
  sentimentScore: numeric("sentiment_score"), // AI-analyzed sentiment score (0-1)
  isAnonymous: boolean("is_anonymous").default(false), // If feedback is anonymous
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertViewingFeedbackSchema = createInsertSchema(viewingFeedback).omit({
  id: true,
  sentiment: true,
  sentimentScore: true,
  sharedWithLandlord: true,
  createdAt: true,
});

export type ViewingFeedback = typeof viewingFeedback.$inferSelect;
export type InsertViewingFeedback = z.infer<typeof insertViewingFeedbackSchema>;

// Virtual Viewing Session Schema
export const virtualViewingSessions = pgTable("virtual_viewing_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(), // Unique session identifier for WebRTC
  viewingRequestId: integer("viewing_request_id").notNull(), // Related viewing request
  propertyId: integer("property_id").notNull(), // Property being viewed
  hostId: integer("host_id").notNull(), // User hosting the viewing (landlord/agent)
  status: text("status").notNull().default("scheduled"), // scheduled, active, completed, cancelled
  scheduledStartTime: timestamp("scheduled_start_time").notNull(),
  actualStartTime: timestamp("actual_start_time"),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // Duration in seconds
  participants: json("participants").$type<
    Array<{
      userId?: number,
      name: string,
      email?: string,
      joinTime: string,
      leaveTime?: string,
      role: string, // 'host', 'viewer'
      connectionStatus: string // 'connected', 'disconnected'
    }>
  >().default([]),
  recordingUrl: text("recording_url"), // URL if session was recorded
  recordingStatus: text("recording_status"), // 'not_recorded', 'recording', 'processing', 'available', 'failed'
  connectionQualityScore: integer("connection_quality_score"), // Overall connection quality (1-5)
  notes: text("notes"), // Host notes about the session
  featuredAreas: json("featured_areas").$type<string[]>().default([]), // Areas of property highlighted during viewing
  questions: json("questions").$type<
    Array<{
      question: string,
      askedBy: string,
      answeredBy?: string,
      answer?: string,
      timestamp: string
    }>
  >().default([]), // Questions asked during the session
  technicalIssues: json("technical_issues").$type<
    Array<{
      issueType: string, // 'audio', 'video', 'connection', etc.
      timestamp: string,
      description: string,
      resolved: boolean
    }>
  >().default([]), // Any technical issues encountered
  feedbackRequested: boolean("feedback_requested").default(false), // Whether feedback was requested
  feedbackRequestedAt: timestamp("feedback_requested_at"), // When feedback was requested 
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVirtualViewingSessionSchema = createInsertSchema(virtualViewingSessions).omit({
  id: true,
  status: true,
  participants: true,
  recordingStatus: true,
  actualStartTime: true,
  endTime: true,
  duration: true,
  connectionQualityScore: true,
  questions: true,
  technicalIssues: true,
  feedbackRequested: true,
  feedbackRequestedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type VirtualViewingSession = typeof virtualViewingSessions.$inferSelect;
export type InsertVirtualViewingSession = z.infer<typeof insertVirtualViewingSessionSchema>;

// Tenant Preferences Schema for AI Targeting
export const tenantPreferences = pgTable("tenant_preferences", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  propertyType: json("property_type").$type<string[]>().default([]), // Array of preferred property types
  budget: json("budget").$type<{ min: number, max: number }>(), // Budget range
  bedrooms: json("bedrooms").$type<number[]>().default([]), // Preferred number of bedrooms
  location: json("location").$type<string[]>().default([]), // Preferred locations/areas
  universities: json("universities").$type<string[]>().default([]), // Preferred nearby universities
  mustHaveFeatures: json("must_have_features").$type<string[]>().default([]), // Must-have features
  niceToHaveFeatures: json("nice_to_have_features").$type<string[]>().default([]), // Nice-to-have features
  dealBreakers: json("deal_breakers").$type<string[]>().default([]), // Deal-breaker features
  moveInDate: timestamp("move_in_date"), // Preferred move-in date
  moveOutDate: timestamp("move_out_date"), // Preferred move-out date
  maxDistanceToUniversity: integer("max_distance_to_university"), // Maximum distance to university (in miles/km)
  lifestyle: json("lifestyle").$type<string[]>().default([]), // social, quiet, studious, etc.
  additionalInfo: text("additional_info"), // Any additional preferences
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTenantPreferencesSchema = createInsertSchema(tenantPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TenantPreferences = typeof tenantPreferences.$inferSelect;
export type InsertTenantPreferences = z.infer<typeof insertTenantPreferencesSchema>;

// AI Targeting Results Schema 
export const aiTargetingResults = pgTable("ai_targeting_results", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(), // Agent who created the targeting
  name: text("name").notNull(), // Name of the targeting campaign
  description: text("description"), // Description of the targeting
  targetDemographic: text("target_demographic").notNull(), // students, professionals, families, property_management, etc.
  targetProperties: json("target_properties").$type<number[]>().default([]), // Array of property IDs
  propertyFilters: json("property_filters").$type<Record<string, any>>(), // Filters used to select properties
  tenantFilters: json("tenant_filters").$type<Record<string, any>>(), // Filters used to select tenants
  matchedTenants: json("matched_tenants").$type<
    Array<{
      tenantId: number,
      score: number,
      matchReasons: string[],
      recommendedProperties: number[]
    }>
  >().default([]), // Tenants matched with this targeting
  // Company details for property management targeting
  companyDetails: json("company_details").$type<
    Array<{
      name: string,
      email: string,
      phone?: string,
      website?: string,
      description?: string
    }>
  >(), // Details of property management companies for targeting
  status: text("status").notNull().default("draft"), // draft, active, completed, archived
  marketingContent: json("marketing_content").$type<Record<string, any>>(), // AI-generated marketing content
  emailTemplate: text("email_template"), // Email template for outreach
  smsTemplate: text("sms_template"), // SMS template for outreach
  socialMediaContent: json("social_media_content").$type<Record<string, any>>(), // Content for different platforms
  aiProviderId: integer("ai_provider_id"), // Which AI provider generated the targeting
  insights: json("insights").$type<string[]>().default([]), // AI-generated insights about the targeting
  performanceMetrics: json("performance_metrics").$type<Record<string, any>>(), // Metrics on campaign performance
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  sentAt: timestamp("sent_at"), // When the campaign was sent
  completedAt: timestamp("completed_at"), // When the campaign was completed
});

export const insertAiTargetingResultsSchema = createInsertSchema(aiTargetingResults).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  sentAt: true,
  completedAt: true,
  performanceMetrics: true,
});

export type AiTargetingResults = typeof aiTargetingResults.$inferSelect;
export type InsertAiTargetingResults = z.infer<typeof insertAiTargetingResultsSchema>;

// Property-Tenant Matching Schema
export const propertyTenantMatches = pgTable("property_tenant_matches", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  targetingId: integer("targeting_id"), // Reference to the AI targeting campaign
  matchScore: numeric("match_score").notNull(), // Match score from 0-100
  matchReasons: json("match_reasons").$type<string[]>().default([]), // Reasons for the match
  tenantViewed: boolean("tenant_viewed").default(false), // Whether the tenant has viewed this match
  tenantInterested: boolean("tenant_interested").default(false), // Whether the tenant is interested
  agentNotified: boolean("agent_notified").default(false), // Whether the agent has been notified
  agentAction: text("agent_action"), // Action taken by agent
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPropertyTenantMatchesSchema = createInsertSchema(propertyTenantMatches).omit({
  id: true,
  matchScore: true,
  matchReasons: true,
  tenantViewed: true,
  tenantInterested: true,
  agentNotified: true,
  agentAction: true,
  createdAt: true,
  updatedAt: true,
});

export type PropertyTenantMatch = typeof propertyTenantMatches.$inferSelect;
export type InsertPropertyTenantMatch = z.infer<typeof insertPropertyTenantMatchesSchema>;

// Tenant Risk Assessment Schema
export const tenantRiskAssessments = pgTable("tenant_risk_assessments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  applicationId: integer("application_id"),
  assessmentData: json("assessment_data").notNull(), // Full risk assessment JSON
  overallRiskScore: numeric("overall_risk_score").notNull(), // 0-100 risk score
  riskLevel: text("risk_level").notNull(), // 'low', 'medium', 'high'
  reviewFindings: json("review_findings").$type<{
    found: boolean;
    reviews: Array<{
      source: string;
      content: string;
      sentiment: string;
      date?: string;
    }>;
    overallSentiment: string;
  }>(),
  assessedBy: text("assessed_by").default('ai'), // 'ai', 'admin', 'agent'
  assessedById: integer("assessed_by_id"), // User ID of human assessor if applicable
  verifiedBy: integer("verified_by"), // User who verified the assessment
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTenantRiskAssessmentSchema = createInsertSchema(tenantRiskAssessments).omit({
  id: true,
  assessedBy: true,
  verifiedBy: true,
  verifiedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type TenantRiskAssessment = typeof tenantRiskAssessments.$inferSelect;
export type InsertTenantRiskAssessment = z.infer<typeof insertTenantRiskAssessmentSchema>;

// Fraud Alerts Schema
export const fraudAlerts = pgTable("fraud_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  userType: text("user_type"),
  activityType: fraudActivityTypeEnum("activity_type").notNull(),
  severity: fraudAlertSeverityEnum("severity").notNull(),
  details: text("details").notNull(),
  activityData: json("activity_data").notNull(),
  ipAddress: text("ip_address"),
  deviceInfo: text("device_info"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  status: fraudAlertStatusEnum("status").notNull().default("new"),
  reviewedBy: integer("reviewed_by"),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertFraudAlertSchema = createInsertSchema(fraudAlerts).omit({
  id: true,
  reviewedAt: true,
});

export type FraudAlert = typeof fraudAlerts.$inferSelect;
export type InsertFraudAlert = z.infer<typeof insertFraudAlertSchema>;

// User Activities for tracking user behavior
export const userActivities = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  activityType: text("activity_type").notNull(),
  activityData: json("activity_data").notNull(),
  ipAddress: text("ip_address"),
  deviceInfo: text("device_info"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertUserActivitySchema = createInsertSchema(userActivities).omit({
  id: true,
});

export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;

// City Images Schema - For storage and management of city images for the hero section
export const cityImages = pgTable("city_images", {
  id: serial("id").primaryKey(),
  city: text("city").notNull(),
  imageUrl: text("image_url").notNull(),
  source: text("source").notNull().default("default"), // 'uploaded', 'ai-generated', 'default'
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertCityImageSchema = createInsertSchema(cityImages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CityImage = typeof cityImages.$inferSelect;
export type InsertCityImage = z.infer<typeof insertCityImageSchema>;

// Property Keys Schema
export const propertyKeys = pgTable("property_keys", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  keyType: text("key_type").notNull(), // 'front_door', 'back_door', 'garage', 'mailbox', 'other'
  keyCode: text("key_code"), // Optional unique code for the key
  keyLocation: text("key_location").notNull().default("office"), // 'office', 'with_tenant', 'with_landlord', 'with_contractor'
  heldBy: integer("held_by"), // User ID of person holding the key (if applicable)
  dateAssigned: timestamp("date_assigned"),
  dateReturned: timestamp("date_returned"),
  notes: text("notes"),
  status: text("status").notNull().default("available"), // 'available', 'assigned', 'lost', 'damaged'
  isOriginal: boolean("is_original").default(true), // Whether this is an original key or a copy
  copiesAvailable: integer("copies_available").default(0), // Number of copies available
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertPropertyKeySchema = createInsertSchema(propertyKeys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Property Key Assignment History
export const keyAssignmentHistory = pgTable("key_assignment_history", {
  id: serial("id").primaryKey(),
  keyId: integer("key_id").notNull(),
  assignedTo: integer("assigned_to").notNull(), // User ID of person who received the key
  assignedBy: integer("assigned_by").notNull(), // User ID of person who assigned the key
  assignedDate: timestamp("assigned_date").notNull().defaultNow(),
  returnDate: timestamp("return_date"),
  returnedTo: integer("returned_to"), // User ID of person who received the key back
  condition: text("condition").default("good"), // 'good', 'damaged', 'lost'
  notes: text("notes"),
});

export const insertKeyAssignmentHistorySchema = createInsertSchema(keyAssignmentHistory).omit({
  id: true,
});

export type PropertyKey = typeof propertyKeys.$inferSelect;
export type InsertPropertyKey = z.infer<typeof insertPropertyKeySchema>;
export type KeyAssignmentHistory = typeof keyAssignmentHistory.$inferSelect;
export type InsertKeyAssignmentHistory = z.infer<typeof insertKeyAssignmentHistorySchema>;

// Job-related enums
export const jobTypeEnum = pgEnum('job_type', [
  'part_time',
  'full_time',
  'internship',
  'one_off',
  'seasonal',
  'remote',
  'hybrid'
]);

export const salaryPeriodEnum = pgEnum('salary_period', [
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'annually'
]);

export const jobStatusEnum = pgEnum('job_status', [
  'draft',
  'pending_approval',
  'active',
  'paused',
  'filled',
  'expired',
  'deleted'
]);

export const applicationStatusEnum = pgEnum('application_status', [
  'applied',
  'reviewed',
  'shortlisted',
  'rejected',
  'interview_scheduled',
  'offered',
  'accepted',
  'declined'
]);

// Employer Schema - For recruiters and companies posting jobs
export const employers = pgTable("employers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Link to users table for login
  name: text("name").notNull(),
  companyNumber: text("company_number"),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull().unique(),
  contactPhone: text("contact_phone"),
  website: text("website"),
  logo: text("logo"),
  description: text("description"),
  industry: text("industry"),
  address: text("address"),
  city: text("city"),
  postcode: text("postcode"),
  isVerified: boolean("is_verified").default(false),
  verificationDate: timestamp("verification_date"),
  verificationDocuments: json("verification_documents").$type<string[]>().default([]),
  trustScore: numeric("trust_score"), // AI-calculated trust score (0-100)
  activeJobCount: integer("active_job_count").default(0),
  totalJobsPosted: integer("total_jobs_posted").default(0),
  socialMedia: json("social_media").$type<{
    linkedin?: string,
    twitter?: string,
    facebook?: string,
    instagram?: string
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmployerSchema = createInsertSchema(employers).omit({
  id: true,
  isVerified: true,
  verificationDate: true,
  trustScore: true,
  activeJobCount: true,
  totalJobsPosted: true,
  createdAt: true,
  updatedAt: true,
});

// Student Profile Schema - Extension of user profiles for students
export const studentProfiles = pgTable("student_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  university: text("university"),
  course: text("course"),
  graduationYear: integer("graduation_year"),
  skills: json("skills").$type<string[]>().default([]),
  workExperience: json("work_experience").$type<{
    company: string,
    role: string,
    startDate: string,
    endDate: string | null,
    description: string
  }[]>().default([]),
  availability: json("availability").$type<{
    totalHoursPerWeek: number,
    preferredDays: string[],
    preferredTimeOfDay: string[]
  }>().default({
    totalHoursPerWeek: 0,
    preferredDays: [],
    preferredTimeOfDay: []
  }),
  preferences: json("preferences").$type<{
    jobTypes: string[],
    industries: string[],
    maxDistance: number,
    minSalary: number
  }>().default({
    jobTypes: [],
    industries: [],
    maxDistance: 10,
    minSalary: 0
  }),
  cv: text("cv"),
  aiGeneratedSkills: json("ai_generated_skills").$type<string[]>().default([]),
  recommendedJobs: json("recommended_jobs").$type<number[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudentProfileSchema = createInsertSchema(studentProfiles).omit({
  id: true,
  aiGeneratedSkills: true,
  recommendedJobs: true,
  createdAt: true,
  updatedAt: true,
});

// Job related types are now defined at the end of this file

// Property Update Notification Schema
export const propertyUpdateNotifications = pgTable("property_update_notifications", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  senderUserId: integer("sender_user_id").notNull(),
  updateType: text("update_type").notNull(), // 'price', 'availability', 'description', 'features', etc.
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  message: text("message"), // Custom message to include with the notification
  sentAt: timestamp("sent_at").defaultNow(),
  recipientCount: integer("recipient_count").default(0), // Number of recipients the notification was sent to
  successful: boolean("successful").default(false), // Whether the notification was successfully sent
  errorMessage: text("error_message"), // Any error message if the notification failed
});

export const insertPropertyUpdateNotificationSchema = createInsertSchema(propertyUpdateNotifications).omit({
  id: true,
  sentAt: true,
  recipientCount: true,
  successful: true,
  errorMessage: true,
});

export type PropertyUpdateNotification = typeof propertyUpdateNotifications.$inferSelect;
export type InsertPropertyUpdateNotification = z.infer<typeof insertPropertyUpdateNotificationSchema>;

// Property Floor Plans
export const propertyFloorPlans = pgTable("property_floor_plans", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  createdBy: integer("created_by").notNull(), // User ID who created the floor plan
  svgContent: text("svg_content").notNull(),
  description: text("description"),
  roomLabels: json("room_labels").default([]), // Array of room labels
  accuracy: integer("accuracy").default(70), // Estimated accuracy percentage
  imageCount: integer("image_count").default(0), // Number of images used to generate
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  isActive: boolean("is_active").default(true), // Whether this is the active floor plan for the property
  version: integer("version").default(1), // Version number for tracking revisions
});

export const insertPropertyFloorPlanSchema = createInsertSchema(propertyFloorPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PropertyFloorPlan = typeof propertyFloorPlans.$inferSelect;
export type InsertPropertyFloorPlan = z.infer<typeof insertPropertyFloorPlanSchema>;

// Utility Provider Schema
export const utilityProviders = pgTable("utility_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  utilityType: utilityTypeEnum("utility_type").notNull(),
  logoUrl: text("logo_url"),
  website: text("website"),
  customerServicePhone: text("customer_service_phone"),
  customerServiceEmail: text("customer_service_email"),
  apiIntegration: boolean("api_integration").default(false),
  apiEndpoint: text("api_endpoint"),
  apiKey: text("api_key"),
  active: boolean("active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUtilityProviderSchema = createInsertSchema(utilityProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Utility Tariff Schema
export const utilityTariffs = pgTable("utility_tariffs", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  utilityType: utilityTypeEnum("utility_type").notNull(),
  fixedTerm: boolean("fixed_term").default(false),
  termLength: integer("term_length"), // in months
  earlyExitFee: numeric("early_exit_fee"),
  standingCharge: numeric("standing_charge"), // daily charge in pence
  unitRate: numeric("unit_rate"), // rate per kWh/unit in pence
  estimatedAnnualCost: numeric("estimated_annual_cost"), // for average usage
  greenEnergy: boolean("green_energy").default(false), // renewable energy source
  specialOffers: json("special_offers").$type<string[]>().default([]),
  availableFrom: timestamp("available_from"),
  availableUntil: timestamp("available_until"),
  region: text("region"), // specific region availability
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUtilityTariffSchema = createInsertSchema(utilityTariffs).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
  updatedAt: true,
});

// Admin Banking Details for Utility Setup
export const adminBankingDetails = pgTable("admin_banking_details", {
  id: serial("id").primaryKey(),
  accountName: text("account_name").notNull(),
  accountNumber: text("account_number").notNull(),
  sortCode: text("sort_code").notNull(),
  bankName: text("bank_name").notNull(),
  reference: text("reference"), // Optional reference for payments
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdminBankingDetailsSchema = createInsertSchema(adminBankingDetails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Property Utility Contracts
export const propertyUtilityContracts = pgTable("property_utility_contracts", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  tenancyId: integer("tenancy_id"),
  utilityType: utilityTypeEnum("utility_type").notNull(),
  providerId: integer("provider_id").notNull(),
  tariffId: integer("tariff_id"),
  accountNumber: text("account_number"),
  meterSerialNumber: text("meter_serial_number"),
  meterReadingDay: integer("meter_reading_day"), // day of month for readings
  contractStartDate: timestamp("contract_start_date"),
  contractEndDate: timestamp("contract_end_date"),
  depositAmount: numeric("deposit_amount"),
  depositPaid: boolean("deposit_paid").default(false),
  monthlyPaymentAmount: numeric("monthly_payment_amount"),
  paymentDay: integer("payment_day"), // day of month for payments
  paymentMethod: text("payment_method"), // direct debit, card, etc.
  bankingDetailsId: integer("banking_details_id"), // reference to admin banking details
  namedPersonFullName: text("named_person_full_name"), // Full name of the person responsible for the bill
  namedPersonEmail: text("named_person_email"), // Email of the named person
  namedPersonPhone: text("named_person_phone"), // Phone number of the named person
  namedPersonDateOfBirth: text("named_person_date_of_birth"), // Date of birth for verification
  namedPersonTenantId: integer("named_person_tenant_id"), // Link to a tenant if applicable
  status: utilityContractStatusEnum("status").default("pending"),
  autoRenewal: boolean("auto_renewal").default(false),
  tenancyAgreementUploaded: boolean("tenancy_agreement_uploaded").default(false),
  tenancyAgreementDocumentId: integer("tenancy_agreement_document_id"),
  aiProcessed: boolean("ai_processed").default(false),
  lastAiCheckDate: timestamp("last_ai_check_date"),
  bestDealAvailable: boolean("best_deal_available").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPropertyUtilityContractSchema = createInsertSchema(propertyUtilityContracts).omit({
  id: true,
  status: true,
  aiProcessed: true,
  lastAiCheckDate: true,
  bestDealAvailable: true,
  createdAt: true,
  updatedAt: true,
});

// Utility Price Comparison Results
export const utilityPriceComparisons = pgTable("utility_price_comparisons", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  utilityType: utilityTypeEnum("utility_type").notNull(),
  searchDate: timestamp("search_date").defaultNow(),
  results: json("results").$type<{
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
    savings: number; // compared to current/average
  }[]>().default([]),
  selectedProviderId: integer("selected_provider_id"),
  selectedTariffId: integer("selected_tariff_id"),
  implementationStatus: text("implementation_status").default("pending"), // pending, in_progress, completed
  implementationDate: timestamp("implementation_date"),
  aiProcessed: boolean("ai_processed").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUtilityPriceComparisonSchema = createInsertSchema(utilityPriceComparisons).omit({
  id: true,
  searchDate: true,
  implementationStatus: true,
  implementationDate: true,
  aiProcessed: true,
  createdAt: true,
  updatedAt: true,
});

// Type definitions for utility management
export type UtilityProvider = typeof utilityProviders.$inferSelect;
export type InsertUtilityProvider = z.infer<typeof insertUtilityProviderSchema>;

export type UtilityTariff = typeof utilityTariffs.$inferSelect;
export type InsertUtilityTariff = z.infer<typeof insertUtilityTariffSchema>;

export type AdminBankingDetails = typeof adminBankingDetails.$inferSelect;
export type InsertAdminBankingDetails = z.infer<typeof insertAdminBankingDetailsSchema>;

export type PropertyUtilityContract = typeof propertyUtilityContracts.$inferSelect;
export type InsertPropertyUtilityContract = z.infer<typeof insertPropertyUtilityContractSchema>;

export type UtilityPriceComparison = typeof utilityPriceComparisons.$inferSelect;
export type InsertUtilityPriceComparison = z.infer<typeof insertUtilityPriceComparisonSchema>;

// Named Persons Schema (for utility bills responsibility)
export const namedPersons = pgTable("named_persons", {
  id: serial("id").primaryKey(),
  tenancyId: integer("tenancy_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  dateOfBirth: timestamp("date_of_birth"), // For verification
  utilityPreference: text("utility_preference"), // gas, electricity, water, etc.
  primaryContact: boolean("primary_contact").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertNamedPersonSchema = createInsertSchema(namedPersons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertNamedPerson = z.infer<typeof insertNamedPersonSchema>;
export type NamedPerson = typeof namedPersons.$inferSelect;

// Student Marketplace Category Enum
export const marketplaceCategoryEnum = pgEnum('marketplace_category', [
  'textbooks',
  'electronics',
  'furniture',
  'clothing',
  'kitchen',
  'sports',
  'entertainment',
  'other'
]);

// Marketplace Item Condition Enum
export const itemConditionEnum = pgEnum('item_condition', [
  'new',
  'like_new',
  'good',
  'fair',
  'poor'
]);

// Marketplace Item Status Enum
export const marketplaceItemStatusEnum = pgEnum('marketplace_item_status', [
  'available',
  'pending',
  'sold',
  'reserved',
  'removed'
]);

// Student Marketplace Item Offer Status Enum
export const offerStatusEnum = pgEnum('offer_status', [
  'pending',
  'accepted',
  'rejected',
  'expired',
  'withdrawn'
]);

// Student Marketplace Transaction Status Enum
export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending_payment',
  'payment_received',
  'item_shipped',
  'delivered',
  'awaiting_meetup',
  'completed',
  'disputed',
  'refunded',
  'cancelled'
]);

// Marketplace Items Schema
export const marketplaceItems = pgTable("marketplace_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: numeric("price").notNull(),
  category: marketplaceCategoryEnum("category").notNull(),
  condition: itemConditionEnum("condition").notNull(),
  status: marketplaceItemStatusEnum("status").default("available"),
  images: json("images").$type<string[]>().default([]),
  sellerId: integer("seller_id").notNull(), // Reference to users table
  buyerId: integer("buyer_id"), // Reference to users table, only set when item is sold
  university: text("university"), // Seller's university
  location: text("location"), // Campus or area
  meetupPreference: text("meetup_preference"), // Where seller prefers to meet
  // Price negotiation fields
  allowOffers: boolean("allow_offers").default(true), // Whether seller accepts offers below listed price
  minimumOfferPercentage: numeric("minimum_offer_percentage"), // Minimum offer as percentage of listed price (e.g., 70%)
  currentAcceptedOfferId: integer("current_accepted_offer_id"), // ID of the currently accepted offer
  // Transaction tracking fields
  transactionStatus: transactionStatusEnum("transaction_status"),
  paymentReceived: boolean("payment_received").default(false),
  paymentReceivedAt: timestamp("payment_received_at"),
  trackingNumber: text("tracking_number"), // For shipped items
  deliveryMethod: text("delivery_method"), // shipping, meetup, pickup
  estimatedDeliveryDate: timestamp("estimated_delivery_date"),
  deliveryProofImageUrl: text("delivery_proof_image_url"), // URL to proof of delivery image
  // AI verification fields
  aiVerified: boolean("ai_verified").default(false), // AI has verified the listing is legitimate
  aiVerifiedAt: timestamp("ai_verified_at"),
  aiVerificationScore: numeric("ai_verification_score"), // 0-100 score for legitimacy
  aiNotes: text("ai_notes"), // Any AI-generated notes about potential issues
  // Other fields
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  deletedAt: timestamp("deleted_at"), // Soft delete
});

// Marketplace Item Messages Schema
export const marketplaceMessages = pgTable("marketplace_messages", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull(),
  senderId: integer("sender_id").notNull(),
  recipientId: integer("recipient_id").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  aiScanned: boolean("ai_scanned").default(false),
  aiSuspiciousFlag: boolean("ai_suspicious_flag").default(false),
  aiSuspiciousReason: text("ai_suspicious_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertMarketplaceItemSchema = createInsertSchema(marketplaceItems).omit({
  id: true,
  status: true,
  aiVerified: true,
  aiVerifiedAt: true,
  aiVerificationScore: true,
  aiNotes: true,
  featured: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  buyerId: true,
});

export const insertMarketplaceMessageSchema = createInsertSchema(marketplaceMessages).omit({
  id: true,
  read: true,
  aiScanned: true,
  aiSuspiciousFlag: true,
  aiSuspiciousReason: true,
  createdAt: true,
});

// Type definitions for marketplace
export type MarketplaceItem = typeof marketplaceItems.$inferSelect;
export type InsertMarketplaceItem = z.infer<typeof insertMarketplaceItemSchema>;

export type MarketplaceMessage = typeof marketplaceMessages.$inferSelect;
export type InsertMarketplaceMessage = z.infer<typeof insertMarketplaceMessageSchema>;

// Marketplace Item Offers Schema
export const marketplaceOffers = pgTable("marketplace_offers", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull(),
  buyerId: integer("buyer_id").notNull(), // User making the offer
  offerAmount: numeric("offer_amount").notNull(), // Amount offered by buyer
  status: offerStatusEnum("status").default("pending"),
  message: text("message"), // Optional message from buyer
  expiresAt: timestamp("expires_at"), // When the offer expires
  // AI fraud detection fields
  aiScanned: boolean("ai_scanned").default(false),
  aiSuspiciousFlag: boolean("ai_suspicious_flag").default(false),
  aiSuspiciousReason: text("ai_suspicious_reason"),
  // Payment tracking
  paymentId: text("payment_id"), // ID of the payment if offer is accepted
  paymentMethod: text("payment_method"), // stripe, bank_transfer, etc.
  paymentStatus: text("payment_status"), // pending, completed, failed
  paymentDate: timestamp("payment_date"),
  receiptUrl: text("receipt_url"), // URL to the receipt
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  cancelledAt: timestamp("cancelled_at"), // When the offer was withdrawn or rejected
});

export const insertMarketplaceOfferSchema = createInsertSchema(marketplaceOffers).omit({
  id: true,
  status: true,
  aiScanned: true, 
  aiSuspiciousFlag: true,
  aiSuspiciousReason: true,
  paymentId: true,
  paymentStatus: true,
  paymentDate: true,
  receiptUrl: true,
  createdAt: true,
  updatedAt: true,
  cancelledAt: true,
});

// Marketplace Transaction Schema (for tracking deliveries and receipts)
export const marketplaceTransactions = pgTable("marketplace_transactions", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  buyerId: integer("buyer_id").notNull(),
  offerId: integer("offer_id"), // Related offer if purchase was made through offer
  amount: numeric("amount").notNull(), // Final amount paid
  status: transactionStatusEnum("status").default("pending_payment"),
  paymentMethod: text("payment_method"), // stripe, bank_transfer, etc.
  paymentId: text("payment_id"), // External payment reference
  receiptUrl: text("receipt_url"), // Receipt URL
  // Shipping and delivery tracking
  deliveryMethod: text("delivery_method").notNull(), // shipping, meetup, pickup
  trackingNumber: text("tracking_number"),
  estimatedDeliveryDate: timestamp("estimated_delivery_date"),
  actualDeliveryDate: timestamp("actual_delivery_date"),
  deliveryAddress: text("delivery_address"), // Shipping address if applicable
  deliveryNotes: text("delivery_notes"), // Any notes for delivery
  // Proof of delivery
  deliveryProofImage: text("delivery_proof_image"), // URL to delivery proof image
  deliveryConfirmedByBuyer: boolean("delivery_confirmed_by_buyer").default(false),
  deliveryConfirmedByBuyerAt: timestamp("delivery_confirmed_by_buyer_at"),
  // Dispute handling
  hasDispute: boolean("has_dispute").default(false),
  disputeReason: text("dispute_reason"),
  disputeStatus: text("dispute_status"), // open, resolved_buyer, resolved_seller
  disputeResolution: text("dispute_resolution"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  completedAt: timestamp("completed_at"),
});

export const insertMarketplaceTransactionSchema = createInsertSchema(marketplaceTransactions).omit({
  id: true,
  status: true,
  paymentId: true,
  receiptUrl: true,
  actualDeliveryDate: true,
  deliveryConfirmedByBuyer: true,
  deliveryConfirmedByBuyerAt: true,
  hasDispute: true,
  disputeStatus: true,
  disputeResolution: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export type MarketplaceOffer = typeof marketplaceOffers.$inferSelect;
export type InsertMarketplaceOffer = z.infer<typeof insertMarketplaceOfferSchema>;

export type MarketplaceTransaction = typeof marketplaceTransactions.$inferSelect;
export type InsertMarketplaceTransaction = z.infer<typeof insertMarketplaceTransactionSchema>;

// Saved marketplace items (favorites)
export const savedMarketplaceItems = pgTable("saved_marketplace_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  itemId: integer("item_id").notNull().references(() => marketplaceItems.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSavedMarketplaceItemSchema = createInsertSchema(savedMarketplaceItems).omit({
  id: true,
  createdAt: true,
});

export type SavedMarketplaceItem = typeof savedMarketplaceItems.$inferSelect;
export type InsertSavedMarketplaceItem = z.infer<typeof insertSavedMarketplaceItemSchema>;

// -------------------- STUDENT VOUCHER SECTION --------------------

// Enums for student vouchers
export const voucherTypeEnum = pgEnum('voucher_type', [
  'discount', // Percentage or fixed amount off
  'bogo', // Buy one get one free
  'freebie', // Free item with purchase
  'exclusive', // Special offers only for students
  'event', // Free or discounted event entry
  'subscription', // Subscription discount
  'service' // Service discount
]);

export const voucherStatusEnum = pgEnum('voucher_status', [
  'active', // Voucher is currently active
  'expired', // Voucher has expired
  'limited', // Limited quantity remaining
  'verified', // Company verified but voucher not yet active
  'pending_verification', // Pending AI verification
  'rejected' // Rejected after verification
]);

export const bookingStatusEnum = pgEnum('booking_status', [
  'pending', // Booking requested but not confirmed
  'confirmed', // Booking confirmed by business
  'cancelled', // Booking cancelled by user or business
  'completed', // Booking completed
  'no_show' // User didn't show up for booking
]);

// Companies that offer vouchers
export const voucherCompanies = pgTable("voucher_companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  logo: text("logo"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  postcode: text("postcode").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull().unique(),
  website: text("website"),
  // Verification fields
  verified: boolean("verified").default(false),
  aiVerified: boolean("ai_verified").default(false),
  aiVerificationScore: numeric("ai_verification_score"),
  aiVerificationDetails: json("ai_verification_details"),
  adminVerified: boolean("admin_verified").default(false),
  adminVerifiedBy: integer("admin_verified_by"),
  adminVerifiedAt: timestamp("admin_verified_at"),
  // Business details
  businessType: text("business_type").notNull(), // restaurant, retail, entertainment, etc.
  categories: json("categories").$type<string[]>().default([]),
  establishedYear: integer("established_year"),
  companyNumber: text("company_number"), // Business registration number
  taxId: text("tax_id"),
  // Social proof and reputation
  averageRating: numeric("average_rating"),
  totalReviews: integer("total_reviews").default(0),
  // Account owner - who created and manages the business
  ownerId: integer("owner_id").references(() => users.id),
  // Support for booking functionality
  allowsBookings: boolean("allows_bookings").default(false),
  maxBookingsPerDay: integer("max_bookings_per_day"),
  bookingLeadHours: integer("booking_lead_hours").default(24), // How many hours in advance a booking must be made
  operatingHours: json("operating_hours").$type<{
    monday: {open: string, close: string} | null,
    tuesday: {open: string, close: string} | null,
    wednesday: {open: string, close: string} | null,
    thursday: {open: string, close: string} | null,
    friday: {open: string, close: string} | null,
    saturday: {open: string, close: string} | null,
    sunday: {open: string, close: string} | null
  }>(),
  // System fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertVoucherCompanySchema = createInsertSchema(voucherCompanies).omit({
  id: true,
  verified: true,
  aiVerified: true,
  aiVerificationScore: true,
  aiVerificationDetails: true,
  adminVerified: true,
  adminVerifiedBy: true,
  adminVerifiedAt: true,
  averageRating: true,
  totalReviews: true,
  createdAt: true,
  updatedAt: true,
});

// Student vouchers offered by companies
export const studentVouchers = pgTable("student_vouchers", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => voucherCompanies.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: voucherTypeEnum("type").notNull(),
  status: voucherStatusEnum("status").default("pending_verification"),
  // Voucher details
  discountPercentage: numeric("discount_percentage"), // For percentage-based discounts
  discountAmount: numeric("discount_amount"), // For fixed amount discounts
  currencyCode: text("currency_code").default("GBP"),
  minPurchaseAmount: numeric("min_purchase_amount"), // Minimum purchase amount if applicable
  // Time validity
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  // Redemption details
  redemptionCode: text("redemption_code"), // Optional manual code for redemption
  qrCodeData: text("qr_code_data"), // Data encoded in QR code for verification 
  qrCodeImage: text("qr_code_image"), // URL to QR code image
  // Usage limits
  usageLimit: integer("usage_limit"), // How many times the voucher can be used in total
  usageCount: integer("usage_count").default(0), // How many times the voucher has been used
  userUsageLimit: integer("user_usage_limit").default(1), // How many times a single user can use the voucher
  exclusiveTo: json("exclusive_to").$type<string[]>().default([]), // List of universities if exclusive to certain schools
  // Media
  images: json("images").$type<string[]>().default([]),
  // Terms and conditions
  termsAndConditions: text("terms_and_conditions"),
  // AI verification fields
  aiVerified: boolean("ai_verified").default(false),
  aiVerificationScore: numeric("ai_verification_score"),
  aiVerificationDetails: json("ai_verification_details"),
  adminVerified: boolean("admin_verified").default(false),
  // System fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertStudentVoucherSchema = createInsertSchema(studentVouchers).omit({
  id: true,
  status: true,
  qrCodeData: true,
  qrCodeImage: true,
  usageCount: true,
  aiVerified: true,
  aiVerificationScore: true,
  aiVerificationDetails: true,
  adminVerified: true,
  createdAt: true, 
  updatedAt: true,
});

// Track voucher redemptions
export const voucherRedemptions = pgTable("voucher_redemptions", {
  id: serial("id").primaryKey(),
  voucherId: integer("voucher_id").notNull().references(() => studentVouchers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  redemptionDate: timestamp("redemption_date").defaultNow(),
  redemptionLocation: text("redemption_location"), // Location where voucher was redeemed (GPS coordinates or address)
  verificationMethod: text("verification_method").notNull(), // 'qr_code', 'manual_code', 'staff_verified'
  verificationCode: text("verification_code"), // Code entered or scanned
  verified: boolean("verified").default(false), // Whether redemption was verified
  // Transaction details if applicable
  transactionAmount: numeric("transaction_amount"),
  discountApplied: numeric("discount_applied"),
  // Staff verification if applicable
  verifiedByStaffId: integer("verified_by_staff_id"),
  verifiedByStaffName: text("verified_by_staff_name"),
  // Additional details
  notes: text("notes"),
  receipt: text("receipt"), // URL to receipt image if uploaded
  // Review post-redemption
  rated: boolean("rated").default(false),
  rating: integer("rating"), // 1-5 star rating
  review: text("review"),
  // System fields
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVoucherRedemptionSchema = createInsertSchema(voucherRedemptions).omit({
  id: true,
  redemptionDate: true,
  verified: true,
  rated: true,
  createdAt: true,
});

// Voucher bookings for venues that require reservations
export const voucherBookings = pgTable("voucher_bookings", {
  id: serial("id").primaryKey(),
  voucherId: integer("voucher_id").notNull().references(() => studentVouchers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  // Booking details
  bookingDate: timestamp("booking_date").notNull(), // When the booking is for
  partySize: integer("party_size").notNull().default(1),
  specialRequests: text("special_requests"),
  status: bookingStatusEnum("status").default("pending"),
  // Voucher application confirmed
  voucherApplied: boolean("voucher_applied").default(false),
  // Communication with business
  customerNotes: text("customer_notes"),
  businessNotes: text("business_notes"),
  // Confirmation details
  confirmationCode: text("confirmation_code"),
  confirmationDate: timestamp("confirmation_date"),
  confirmedByStaffId: integer("confirmed_by_staff_id"),
  confirmedByStaffName: text("confirmed_by_staff_name"),
  // Cancellation details
  cancellationReason: text("cancellation_reason"),
  cancelledByUserId: integer("cancelled_by_user_id"),
  cancellationDate: timestamp("cancellation_date"),
  // Reminders
  reminderSent: boolean("reminder_sent").default(false),
  reminderSentDate: timestamp("reminder_sent_date"),
  // Check-in information
  checkedIn: boolean("checked_in").default(false),
  checkedInDate: timestamp("checked_in_date"),
  // System fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertVoucherBookingSchema = createInsertSchema(voucherBookings).omit({
  id: true,
  status: true,
  voucherApplied: true,
  confirmationDate: true,
  confirmationCode: true,
  confirmedByStaffId: true,
  confirmedByStaffName: true,
  cancellationDate: true,
  cancelledByUserId: true,
  reminderSent: true,
  reminderSentDate: true,
  checkedIn: true,
  checkedInDate: true,
  createdAt: true,
  updatedAt: true,
});

// Saved/favorite vouchers for users
export const savedVouchers = pgTable("saved_vouchers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  voucherId: integer("voucher_id").notNull().references(() => studentVouchers.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSavedVoucherSchema = createInsertSchema(savedVouchers).omit({
  id: true,
  createdAt: true,
});

// -------------------- CHAT WITH FRIENDS FEATURE --------------------

// Chat message types enum
export const messageTypeEnum = pgEnum('message_type', [
  'text',
  'image',
  'video',
  'audio',
  'document',
  'location',
  'contact',
  'system'
]);

// Message status enum
export const messageStatusEnum = pgEnum('message_status', [
  'sent',
  'delivered',
  'read',
  'failed',
  'deleted'
]);

// Verification status enum for ID and face verification
export const verificationStatusEnum = pgEnum('verification_status', [
  'pending',
  'in_progress',
  'approved',
  'rejected',
  'expired',
  'requires_review'
]);

// Student verification status is defined at the top of the file

// Chat security check status enum
export const securityCheckStatusEnum = pgEnum('security_check_status', [
  'pending',
  'passed',
  'flagged',
  'blocked'
]);

// Chat conversations (direct or group)
export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  title: text("title"), // Name of group chat (null for direct chats)
  type: text("type").notNull().default("direct"), // 'direct' or 'group'
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  lastMessageAt: timestamp("last_message_at"),
  // Group chat settings
  avatar: text("avatar"), // Group avatar image URL
  description: text("description"),
  isPublic: boolean("is_public").default(false), // Whether the group can be discovered/joined by others
  isEncrypted: boolean("is_encrypted").default(true), // Whether messages are end-to-end encrypted
  // Security and moderation
  moderationEnabled: boolean("moderation_enabled").default(true), // Whether AI moderation is enabled
  aiScanEnabled: boolean("ai_scan_enabled").default(true), // Whether files are scanned for malware/inappropriate content
  retentionDays: integer("retention_days"), // Message retention policy in days (null = forever)
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastMessageAt: true,
});

// Chat conversation participants
export const chatParticipants = pgTable("chat_participants", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => chatConversations.id),
  userId: integer("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  // Participant roles and permissions
  role: text("role").default("member"), // 'admin', 'moderator', 'member'
  canSendMessages: boolean("can_send_messages").default(true),
  canAddParticipants: boolean("can_add_participants").default(false),
  canRemoveParticipants: boolean("can_remove_participants").default(false),
  canEditSettings: boolean("can_edit_settings").default(false),
  // Muting and notification preferences
  isMuted: boolean("is_muted").default(false),
  muteUntil: timestamp("mute_until"),
  notificationLevel: text("notification_level").default("all"), // 'all', 'mentions', 'none'
  // Custom nickname in this conversation
  nickname: text("nickname"),
  // Message status tracking
  lastReadMessageId: integer("last_read_message_id"),
  lastReadAt: timestamp("last_read_at"),
});

export const insertChatParticipantSchema = createInsertSchema(chatParticipants).omit({
  id: true,
  joinedAt: true,
  leftAt: true,
  lastReadMessageId: true,
  lastReadAt: true,
});

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => chatConversations.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  replyToId: integer("reply_to_id"),
  type: messageTypeEnum("type").default("text").notNull(),
  content: text("content"), // Message text content
  // Media attachments
  mediaUrl: text("media_url"), // URL to image, video, audio, or document
  mediaThumbnailUrl: text("media_thumbnail_url"), // Thumbnail for media (if applicable)
  mediaType: text("media_type"), // MIME type of media
  mediaSize: integer("media_size"), // Size in bytes
  mediaDuration: integer("media_duration"), // Duration in seconds for audio/video
  mediaWidth: integer("media_width"), // Width in pixels for images/videos
  mediaHeight: integer("media_height"), // Height in pixels for images/videos
  mediaName: text("media_name"), // Original filename
  // Metadata
  metadata: json("metadata"), // Additional message-specific metadata
  // Message status
  status: messageStatusEnum("status").default("sent"),
  sentAt: timestamp("sent_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  readBy: json("read_by").$type<{userId: number, readAt: string}[]>().default([]),
  editedAt: timestamp("edited_at"),
  // Security checks
  securityStatus: securityCheckStatusEnum("security_status").default("pending"),
  securityDetails: json("security_details"),
  securityCheckedAt: timestamp("security_checked_at"),
  // System fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  status: true,
  sentAt: true,
  deliveredAt: true,
  readBy: true,
  editedAt: true,
  securityStatus: true,
  securityDetails: true,
  securityCheckedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Message reactions
export const chatMessageReactions = pgTable("chat_message_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => chatMessages.id),
  userId: integer("user_id").notNull().references(() => users.id),
  reaction: text("reaction").notNull(), // Emoji reaction
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatMessageReactionSchema = createInsertSchema(chatMessageReactions).omit({
  id: true,
  createdAt: true,
});

// -------------------- PROPERTYCHECK PRO DASHBOARD --------------------

// Market data source types
export const marketDataSourceEnum = pgEnum('market_data_source', [
  'land_registry',
  'rightmove',
  'zoopla',
  'onthemarket',
  'local_authority',
  'office_national_statistics',
  'custom_api',
  'manual_entry'
]);

// Property market trend enums
export const marketTrendEnum = pgEnum('market_trend', [
  'rising_fast', // >5% monthly increase
  'rising', // 1-5% monthly increase
  'stable', // -1% to 1% monthly change
  'falling', // 1-5% monthly decrease
  'falling_fast' // >5% monthly decrease 
]);

// PropertyCheck Pro subscriptions
export const propertyCheckProSubscriptions = pgTable("property_check_pro_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  // Subscription details
  plan: text("plan").notNull(), // 'basic', 'standard', 'premium'
  status: text("status").notNull().default("active"), // 'active', 'suspended', 'cancelled'
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  renewalDate: timestamp("renewal_date"),
  autoRenew: boolean("auto_renew").default(true),
  // Billing information
  billingCycle: text("billing_cycle").notNull(), // 'monthly', 'quarterly', 'annual'
  billingAmount: numeric("billing_amount").notNull(),
  lastBillingDate: timestamp("last_billing_date"),
  nextBillingDate: timestamp("next_billing_date"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  // Usage limits and metrics
  reportsLimit: integer("reports_limit"), // Number of reports allowed per billing cycle
  reportsUsed: integer("reports_used").default(0),
  apiCallsLimit: integer("api_calls_limit"), // Number of API calls allowed per billing cycle
  apiCallsUsed: integer("api_calls_used").default(0),
  // Advanced features
  hasMarketIntelligence: boolean("has_market_intelligence").default(false),
  hasRentComparisons: boolean("has_rent_comparisons").default(false),
  hasPriceComparisons: boolean("has_price_comparisons").default(false),
  hasHistoricalData: boolean("has_historical_data").default(false),
  hasPredictiveAnalysis: boolean("has_predictive_analysis").default(false),
  hasAreaInsights: boolean("has_area_insights").default(false),
  hasCompetitorAnalysis: boolean("has_competitor_analysis").default(false),
  // System fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertPropertyCheckProSubscriptionSchema = createInsertSchema(propertyCheckProSubscriptions).omit({
  id: true,
  status: true,
  startDate: true,
  reportsUsed: true,
  apiCallsUsed: true,
  createdAt: true,
  updatedAt: true,
});

// Market area definitions for analysis
export const marketAreas = pgTable("market_areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Friendly name for the area
  description: text("description"),
  // Area definition - one of these must be populated
  postcodePrefixes: json("postcode_prefixes").$type<string[]>().default([]), // E.g., ['M1', 'M2']
  postcodes: json("postcodes").$type<string[]>().default([]), // Full postcodes
  cityId: integer("city_id"), // Link to a city
  localAuthorityId: integer("local_authority_id"), // Link to local authority/council
  customBoundaryGeoJson: json("custom_boundary_geojson"), // Custom GeoJSON boundary
  // Area profile information
  primaryPropertyTypes: json("primary_property_types").$type<string[]>().default([]),
  typicalBedrooms: json("typical_bedrooms").$type<number[]>().default([]),
  predominantTenantType: text("predominant_tenant_type"), // 'student', 'professional', 'family', 'mixed'
  // Stats updated periodically by the system
  averageRent: numeric("average_rent"),
  averageSalePrice: numeric("average_sale_price"),
  rentTrend3Month: marketTrendEnum("rent_trend_3_month"),
  saleTrend3Month: marketTrendEnum("sale_trend_3_month"),
  rentTrend12Month: marketTrendEnum("rent_trend_12_month"),
  saleTrend12Month: marketTrendEnum("sale_trend_12_month"),
  totalListings: integer("total_listings"),
  averageDaysOnMarket: integer("average_days_on_market"),
  // University proximity (if relevant)
  nearbyUniversities: json("nearby_universities").$type<{name: string, distance: string}[]>().default([]),
  // System fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertMarketAreaSchema = createInsertSchema(marketAreas).omit({
  id: true,
  averageRent: true,
  averageSalePrice: true,
  rentTrend3Month: true,
  saleTrend3Month: true,
  rentTrend12Month: true,
  saleTrend12Month: true,
  totalListings: true,
  averageDaysOnMarket: true,
  createdAt: true,
  updatedAt: true,
});

// Property market data 
export const propertyMarketData = pgTable("property_market_data", {
  id: serial("id").primaryKey(),
  marketAreaId: integer("market_area_id").notNull().references(() => marketAreas.id),
  // Data collection metadata
  source: marketDataSourceEnum("source").notNull(),
  collectedAt: timestamp("collected_at").notNull().defaultNow(),
  dataDate: timestamp("data_date").notNull(), // The date the data represents
  // Property type breakdown
  propertyType: text("property_type").notNull(), // 'house', 'flat', 'detached', 'semi-detached', etc.
  bedrooms: integer("bedrooms").notNull(),
  // Price and rent data
  averageSalePrice: numeric("average_sale_price"),
  medianSalePrice: numeric("median_sale_price"),
  minimumSalePrice: numeric("minimum_sale_price"),
  maximumSalePrice: numeric("maximum_sale_price"),
  salesVolume: integer("sales_volume"), // Number of sales in the period
  // Rental data
  averageRent: numeric("average_rent"), // Monthly
  medianRent: numeric("median_rent"),
  minimumRent: numeric("minimum_rent"),
  maximumRent: numeric("maximum_rent"),
  rentalsVolume: integer("rentals_volume"), // Number of rentals in the period
  // Market activity metrics
  averageDaysOnMarket: integer("average_days_on_market"),
  listingCount: integer("listing_count"), // Active listings during the period
  newListingsCount: integer("new_listings_count"), // New listings added in the period
  soldListingsCount: integer("sold_listings_count"), // Listings sold in the period
  rentedListingsCount: integer("rented_listings_count"), // Listings rented in the period
  // Year-over-year comparisons
  salePriceYoYChange: numeric("sale_price_yo_y_change"), // Percentage change
  rentYoYChange: numeric("rent_yo_y_change"), // Percentage change
  // Additional metadata
  dataQualityScore: numeric("data_quality_score"), // 0-100 score for data quality/reliability
  sampleSize: integer("sample_size"), // Number of properties the data is based on
  notes: text("notes"),
  // Raw data for advanced analysis
  rawData: json("raw_data"), // Original data in JSON format
  // System fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertPropertyMarketDataSchema = createInsertSchema(propertyMarketData).omit({
  id: true,
  collectedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Property investment recommendations
export const propertyInvestmentRecommendations = pgTable("property_investment_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  // Recommendation details
  title: text("title").notNull(),
  description: text("description").notNull(),
  marketAreaId: integer("market_area_id").references(() => marketAreas.id),
  // Specific recommendation details
  propertyType: text("property_type").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  priceRangeLow: numeric("price_range_low").notNull(),
  priceRangeHigh: numeric("price_range_high").notNull(),
  expectedRentalYield: numeric("expected_rental_yield").notNull(),
  expectedCapitalGrowth: numeric("expected_capital_growth"),
  riskLevel: text("risk_level").notNull(), // 'low', 'medium', 'high'
  // Rationale and supporting data
  recommendationRationale: text("recommendation_rationale").notNull(),
  supportingDataPoints: json("supporting_data_points"),
  // Specific opportunity if applicable
  specificPropertyId: integer("specific_property_id").references(() => properties.id),
  specificPropertyUrl: text("specific_property_url"),
  // AI-generated content
  aiGenerated: boolean("ai_generated").default(true),
  aiConfidenceScore: numeric("ai_confidence_score"),
  aiModelVersion: text("ai_model_version"),
  // User interaction
  viewed: boolean("viewed").default(false),
  viewedAt: timestamp("viewed_at"),
  saved: boolean("saved").default(false),
  savedAt: timestamp("saved_at"),
  actionTaken: text("action_taken"), // 'contacted_agent', 'viewed_property', 'made_offer', etc.
  // System fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// User-contributed rental data for crowd-sourced market intelligence
export const contributedRentalData = pgTable("contributed_rental_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  postcode: text("postcode").notNull(),
  propertyType: text("property_type").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  monthlyRent: numeric("monthly_rent").notNull(),
  isAnonymous: boolean("is_anonymous").default(true),
  verifiedByAdmin: boolean("verified_by_admin").default(false),
  verifiedAt: timestamp("verified_at"),
  verifiedById: integer("verified_by_id"),
  propertyFeatures: json("property_features").$type<string[]>().default([]),
  billsIncluded: boolean("bills_included").default(false),
  includedBills: json("included_bills").$type<string[]>().default([]),
  tenancyStartDate: timestamp("tenancy_start_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertContributedRentalDataSchema = createInsertSchema(contributedRentalData).omit({
  id: true,
  verifiedByAdmin: true,
  verifiedAt: true,
  verifiedById: true,
  createdAt: true,
  updatedAt: true,
});

export type ContributedRentalData = typeof contributedRentalData.$inferSelect;
export type InsertContributedRentalData = z.infer<typeof insertContributedRentalDataSchema>;

// Area Statistics Schema
export const areaStats = pgTable("area_stats", {
  id: serial("id").primaryKey(),
  area: text("area").notNull(),
  postcode_prefix: text("postcode_prefix"), // e.g., "LS6", "M1", etc.
  region: text("region"),
  averageSalePrice: numeric("average_sale_price"),
  averageRent: numeric("average_rent"),
  medianSalePrice: numeric("median_sale_price"),
  medianRent: numeric("median_rent"),
  priceGrowth: numeric("price_growth"), // annual price growth as percentage
  rentGrowth: numeric("rent_growth"), // annual rent growth as percentage
  averageYield: numeric("average_yield"), // rental yield as percentage
  numberOfSales: integer("number_of_sales"),
  numberOfRentals: integer("number_of_rentals"),
  trend: text("trend"), // rising, stable, falling, etc.
  propertyTypeBreakdown: json("property_type_breakdown").$type<Record<string, number>>(),
  priceRangeBreakdown: json("price_range_breakdown").$type<Record<string, number>>(),
  rentRangeBreakdown: json("rent_range_breakdown").$type<Record<string, number>>(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  dataSource: text("data_source"), // land_registry, ons, user_contributed, etc.
});

export const insertAreaStatsSchema = createInsertSchema(areaStats).omit({
  id: true,
  lastUpdated: true,
});

export type AreaStats = typeof areaStats.$inferSelect;
export type InsertAreaStats = z.infer<typeof insertAreaStatsSchema>;

export const insertPropertyInvestmentRecommendationSchema = createInsertSchema(propertyInvestmentRecommendations).omit({
  id: true,
  aiConfidenceScore: true,
  aiModelVersion: true,
  viewed: true,
  viewedAt: true,
  saved: true, 
  savedAt: true,
  actionTaken: true,
  createdAt: true,
  updatedAt: true,
});

// Types for voucher system
export type VoucherCompany = typeof voucherCompanies.$inferSelect;
export type InsertVoucherCompany = z.infer<typeof insertVoucherCompanySchema>;

export type StudentVoucher = typeof studentVouchers.$inferSelect;
export type InsertStudentVoucher = z.infer<typeof insertStudentVoucherSchema>;

export type VoucherRedemption = typeof voucherRedemptions.$inferSelect;
export type InsertVoucherRedemption = z.infer<typeof insertVoucherRedemptionSchema>;

export type VoucherBooking = typeof voucherBookings.$inferSelect;
export type InsertVoucherBooking = z.infer<typeof insertVoucherBookingSchema>;

export type SavedVoucher = typeof savedVouchers.$inferSelect;
export type InsertSavedVoucher = z.infer<typeof insertSavedVoucherSchema>;

// -------------------- WATER UTILITIES SECTION --------------------

// Water registration status enum
export const waterRegistrationStatusEnum = pgEnum('water_registration_status', [
  'pending',
  'active',
  'suspended',
  'cancelled',
  'transferred'
]);

// Water registrations table for tracking tenant water utility accounts
export const waterRegistrations = pgTable("water_registrations", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  tenantId: integer("tenant_id").references(() => users.id),
  waterCompanyId: text("water_company_id").notNull(), // ID from UK_WATER_COMPANIES
  waterCompanyName: text("water_company_name").notNull(),
  accountNumber: text("account_number").notNull(),
  customerReference: text("customer_reference").notNull(),
  
  // Tenant details
  tenantName: text("tenant_name").notNull(),
  tenantEmail: text("tenant_email").notNull(),
  tenantPhone: text("tenant_phone"),
  
  // Registration timeline
  moveInDate: date("move_in_date").notNull(),
  moveOutDate: date("move_out_date"),
  registrationStatus: waterRegistrationStatusEnum("registration_status").default("pending"),
  
  // Billing information
  monthlyDirectDebit: numeric("monthly_direct_debit"),
  paperlessBilling: boolean("paperless_billing").default(false),
  autoMeterReading: boolean("auto_meter_reading").default(false),
  
  // Account preferences
  communicationPreference: text("communication_preference").default("email"), // email, sms, post
  emergencyContact: text("emergency_contact"),
  emergencyContactPhone: text("emergency_contact_phone"),
  
  // Meter information
  meterType: text("meter_type"), // standard, smart, prepaid
  meterSerialNumber: text("meter_serial_number"),
  meterLocation: text("meter_location"),
  lastMeterReading: numeric("last_meter_reading"),
  lastMeterReadingDate: date("last_meter_reading_date"),
  
  // Service details
  serviceStartDate: date("service_start_date"),
  serviceEndDate: date("service_end_date"),
  cancellationReason: text("cancellation_reason"),
  
  // Administrative
  registeredAt: timestamp("registered_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWaterRegistrationSchema = createInsertSchema(waterRegistrations).omit({
  id: true,
  registrationStatus: true,
  registeredAt: true,
  updatedAt: true,
  createdAt: true,
});

export type WaterRegistration = typeof waterRegistrations.$inferSelect;
export type InsertWaterRegistration = z.infer<typeof insertWaterRegistrationSchema>;

// Types for chat system
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;

export type ChatParticipant = typeof chatParticipants.$inferSelect;
export type InsertChatParticipant = z.infer<typeof insertChatParticipantSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type ChatMessageReaction = typeof chatMessageReactions.$inferSelect;
export type InsertChatMessageReaction = z.infer<typeof insertChatMessageReactionSchema>;

// Types for PropertyCheck Pro
export type PropertyCheckProSubscription = typeof propertyCheckProSubscriptions.$inferSelect;
export type InsertPropertyCheckProSubscription = z.infer<typeof insertPropertyCheckProSubscriptionSchema>;

export type MarketArea = typeof marketAreas.$inferSelect;
export type InsertMarketArea = z.infer<typeof insertMarketAreaSchema>;

export type PropertyMarketData = typeof propertyMarketData.$inferSelect;
export type InsertPropertyMarketData = z.infer<typeof insertPropertyMarketDataSchema>;

export type PropertyInvestmentRecommendation = typeof propertyInvestmentRecommendations.$inferSelect;
export type InsertPropertyInvestmentRecommendation = z.infer<typeof insertPropertyInvestmentRecommendationSchema>;

// Job Listings
export const jobListings = pgTable("job_listings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  employerId: integer("employer_id").notNull(),
  location: text("location").notNull(),
  // Location coordinates for distance-based search
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  category: text("category").notNull(),
  type: text("type").notNull(),
  // Working arrangement: on-site, remote, hybrid
  workArrangement: text("work_arrangement").default("on-site"),
  // Remote work details
  remoteWorkOptions: json("remote_work_options").$type<{
    isFullyRemote?: boolean;
    isHybrid?: boolean;
    daysInOffice?: number;
    allowedCountries?: string[];
    timeZoneRestrictions?: string[];
  }>(),
  status: text("status").notNull().default("active"),
  salary: json("salary").$type<number | { min: number; max: number }>(),
  workSchedule: json("work_schedule").$type<{
    totalHoursPerWeek?: number;
    preferredDays?: string[];
    preferredTimeOfDay?: string[];
  }>(),
  requiredSkills: json("required_skills").$type<string[]>(),
  preferredSkills: json("preferred_skills").$type<string[]>(),
  applicationDeadline: text("application_deadline"),
  startDate: text("start_date"),
  company: text("company"),
  postedDate: timestamp("posted_date").defaultNow(),
  // AI verification fields
  aiVerified: boolean("ai_verified").default(false),
  aiVerificationResults: json("ai_verification_results"),
  // Fraud detection
  flaggedForReview: boolean("flagged_for_review").default(false),
  fraudDetectionResults: json("fraud_detection_results"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertJobListingSchema = createInsertSchema(jobListings).omit({
  id: true,
  postedDate: true,
  aiVerified: true,
  aiVerificationResults: true,
  flaggedForReview: true,
  fraudDetectionResults: true,
  createdAt: true,
  updatedAt: true,
});

export type JobListing = typeof jobListings.$inferSelect;
export type InsertJobListing = z.infer<typeof insertJobListingSchema>;

// Document Templates for Digital Signing
export const documentTemplates = pgTable("document_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  template: text("template").notNull(),
  requiredFields: json("required_fields").$type<string[]>(),
  signatoryRoles: json("signatory_roles").$type<string[]>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertDocumentTemplateSchema = createInsertSchema(documentTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Signing Requests
export const signingRequests = pgTable("signing_requests", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documentTemplates.id),
  documentName: text("document_name").notNull(),
  initiatorId: integer("initiator_id").references(() => users.id),
  initiatorName: text("initiator_name").notNull(),
  status: documentSigningStatusEnum("status").default("draft"),
  documentData: json("document_data").$type<Record<string, string>>(),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertSigningRequestSchema = createInsertSchema(signingRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Signatories
export const signatories = pgTable("signatories", {
  id: serial("id").primaryKey(),
  signingRequestId: integer("signing_request_id").references(() => signingRequests.id),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  status: signatoryStatusEnum("status").default("pending"),
  signature: text("signature"), // Base64 encoded signature image
  signedAt: timestamp("signed_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSignatorySchema = createInsertSchema(signatories).omit({
  id: true,
  createdAt: true,
});

// Signature Audit Log
export const signatureAuditLog = pgTable("signature_audit_log", {
  id: serial("id").primaryKey(),
  signingRequestId: integer("signing_request_id").references(() => signingRequests.id),
  signatoryId: integer("signatory_id").references(() => signatories.id),
  action: text("action").notNull(), // "viewed", "signed", "declined", "reminded"
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: json("metadata"),
});

export const insertSignatureAuditLogSchema = createInsertSchema(signatureAuditLog).omit({
  id: true,
  timestamp: true,
});

// Types
export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type InsertDocumentTemplate = z.infer<typeof insertDocumentTemplateSchema>;

export type SigningRequest = typeof signingRequests.$inferSelect;
export type InsertSigningRequest = z.infer<typeof insertSigningRequestSchema>;

export type Signatory = typeof signatories.$inferSelect;
export type InsertSignatory = z.infer<typeof insertSignatorySchema>;

export type SignatureAuditLog = typeof signatureAuditLog.$inferSelect;
export type InsertSignatureAuditLog = z.infer<typeof insertSignatureAuditLogSchema>;

// Job Applications
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobListings.id),
  studentId: integer("student_id").notNull(),
  status: text("status").notNull().default("applied"),
  resume: text("resume"),
  coverLetter: text("cover_letter"),
  // Interview related fields
  interviewDate: timestamp("interview_date"),
  interviewType: text("interview_type"), // e.g., 'video', 'phone', 'in_person'
  interviewStatus: text("interview_status"),
  interviewNotes: text("interview_notes"),
  // Offer related fields
  offerMade: boolean("offer_made").default(false),
  offerDetails: json("offer_details"),
  offerAccepted: boolean("offer_accepted"),
  // AI analysis results
  aiRecommendation: boolean("ai_recommendation").default(false),
  aiRecommendationScore: integer("ai_recommendation_score"),
  aiRecommendationReason: text("ai_recommendation_reason"),
  // Notes
  studentNotes: text("student_notes"),
  employerNotes: text("employer_notes"),
  // Timestamps
  appliedDate: timestamp("applied_date").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  status: true,
  interviewDate: true,
  interviewType: true,
  interviewStatus: true,
  offerMade: true,
  offerAccepted: true,
  aiRecommendation: true,
  aiRecommendationScore: true,
  aiRecommendationReason: true,
  appliedDate: true,
  updatedAt: true,
});

export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;

// Job Interviews
export const jobInterviews = pgTable("job_interviews", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => jobApplications.id),
  scheduledFor: timestamp("scheduled_for").notNull(),
  duration: integer("duration").notNull(), // in minutes
  type: text("type").notNull(), // video, phone, in_person
  location: text("location"),
  videoLink: text("video_link"),
  meetingId: text("meeting_id"),
  interviewers: json("interviewers").$type<{ name: string; role: string }[]>(),
  questions: json("questions").$type<string[]>(),
  notes: text("notes"),
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled, rescheduled
  feedback: json("feedback"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertJobInterviewSchema = createInsertSchema(jobInterviews).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export type JobInterview = typeof jobInterviews.$inferSelect;
export type InsertJobInterview = z.infer<typeof insertJobInterviewSchema>;

// Job Skills Schema
export const jobSkills = pgTable("job_skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(), // e.g., 'technical', 'soft', 'language', 'industry-specific'
  description: text("description"),
  popularityScore: integer("popularity_score").default(0), // Indicates how often this skill is requested in job listings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertJobSkillSchema = createInsertSchema(jobSkills).omit({
  id: true,
  popularityScore: true,
  createdAt: true,
  updatedAt: true,
});

// User behavior tracking enum - defines what types of behavior we track
export const userBehaviorTypeEnum = pgEnum('user_behavior_type', [
  'page_view',
  'search',
  'filter_use',
  'property_view',
  'property_save',
  'property_apply',
  'marketplace_item_view',
  'marketplace_item_inquiry',
  'utility_compare',
  'utility_switch',
  'document_upload',
  'chat_initiate',
  'feature_use',
  'time_spent',
  'return_visit',
  'profile_update',
  'job_search',
  'job_save',
  'job_apply',
  'calculator_use'
]);

// Suggestion type enum - defines what types of suggestions we can make
export const suggestionTypeEnum = pgEnum('suggestion_type', [
  'property_recommendation',
  'marketplace_item',
  'utility_provider',
  'feature_discovery',
  'document_reminder',
  'application_followup',
  'job_recommendation',
  'content_recommendation',
  'onboarding_completion',
  'security_reminder',
  'community_event',
  'chat_connection',
  'service_upgrade'
]);

// User behavior analytics table - tracks detailed user interaction with the platform
export const userBehaviorAnalytics = pgTable("user_behavior_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  behaviorType: userBehaviorTypeEnum("behavior_type").notNull(),
  // Details about the behavior
  targetId: integer("target_id"), // ID of related item (property, marketplace item, etc)
  targetType: text("target_type"), // Type of target (property, marketplace, utility, etc)
  targetData: json("target_data"), // Additional context about the target
  // Contextual information  
  sessionId: text("session_id"), // To group behaviors in a session
  previousAction: text("previous_action"), // What the user did immediately before
  nextAction: text("next_action"), // What the user did immediately after
  timeSpent: integer("time_spent"), // Time spent in seconds
  // Metrics
  frequency: integer("frequency").default(1), // How many times this behavior occurred
  engagementScore: integer("engagement_score"), // 1-100 rating of engagement level
  // Timestamps
  occurredAt: timestamp("occurred_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserBehaviorSchema = createInsertSchema(userBehaviorAnalytics).omit({
  id: true,
  createdAt: true, 
  updatedAt: true
});

export type UserBehaviorAnalytic = typeof userBehaviorAnalytics.$inferSelect;
export type InsertUserBehaviorAnalytic = z.infer<typeof insertUserBehaviorSchema>;

// User suggestions table - stores personalized recommendations for users
export const userSuggestions = pgTable("user_suggestions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  suggestionType: suggestionTypeEnum("suggestion_type").notNull(),
  // Content of the suggestion
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  actionUrl: text("action_url"), // URL or path for the user to take action
  // Related items
  relatedItemId: integer("related_item_id"), // ID of related item 
  relatedItemType: text("related_item_type"), // Type of related item
  // Contextual data
  context: json("context"), // Data explaining why this suggestion is being made
  priority: integer("priority").default(5), // 1-10 rating of importance
  // Tracking
  impressions: integer("impressions").default(0), // How many times shown to user
  clicks: integer("clicks").default(0), // How many times user clicked
  dismissed: boolean("dismissed").default(false), // If user has dismissed this suggestion
  // Schedule
  startAt: timestamp("start_at"), // When to start showing this suggestion
  endAt: timestamp("end_at"), // When to stop showing this suggestion
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSuggestionSchema = createInsertSchema(userSuggestions).omit({
  id: true,
  impressions: true,
  clicks: true,
  dismissed: true,
  createdAt: true,
  updatedAt: true
});

export type UserSuggestion = typeof userSuggestions.$inferSelect;
export type InsertUserSuggestion = z.infer<typeof insertUserSuggestionSchema>;

// Property Comparison Schema
export const propertyComparisons = pgTable("property_comparisons", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  propertyIds: json("property_ids").$type<number[]>().notNull(),
  notes: json("notes").$type<Record<string, string>>().default({}),
  isShared: boolean("is_shared").default(false),
  shareToken: text("share_token"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPropertyComparisonSchema = createInsertSchema(propertyComparisons).omit({
  id: true,
  shareToken: true,
  createdAt: true,
  updatedAt: true,
});

export type PropertyComparison = typeof propertyComparisons.$inferSelect;
export type InsertPropertyComparison = z.infer<typeof insertPropertyComparisonSchema>;

// Website builder user behavior tracking schemas
export const websiteBuilderUserBehavior = pgTable(
  "website_builder_user_behavior",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    action: text("action").notNull(), // view, implement, search, favorite
    itemType: text("item_type").notNull(), // template, file, category
    itemId: text("item_id").notNull(), // template id, file path, category name
    itemDetails: json("item_details"), // additional details (complexity, tags, category, etc)
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  }
);

export const websiteBuilderUserPreferences = pgTable(
  "website_builder_user_preferences",
  {
    userId: integer("user_id").primaryKey(),
    preferredCategories: json("preferred_categories").$type<string[]>().default([]),
    preferredComplexity: text("preferred_complexity"),
    preferredTags: json("preferred_tags").$type<string[]>().default([]),
    lastActiveTimestamp: timestamp("last_active_timestamp").defaultNow().notNull(),
  }
);

export type WebsiteBuilderUserBehavior = typeof websiteBuilderUserBehavior.$inferSelect;
export type WebsiteBuilderUserPreferences = typeof websiteBuilderUserPreferences.$inferSelect;

export const createWebsiteBuilderUserBehaviorSchema = createInsertSchema(websiteBuilderUserBehavior).omit({
  id: true,
  timestamp: true,
});
export type InsertWebsiteBuilderUserBehavior = z.infer<typeof createWebsiteBuilderUserBehaviorSchema>;

export const createWebsiteBuilderUserPreferencesSchema = createInsertSchema(websiteBuilderUserPreferences).omit({
  lastActiveTimestamp: true,
});
export type InsertWebsiteBuilderUserPreferences = z.infer<typeof createWebsiteBuilderUserPreferencesSchema>;
// WebsiteBuilderUserPreferences type defined elsewhere

// Agent document verification
export const agentVerifications = pgTable("agent_verifications", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => users.id),
  status: verificationStatusEnum("status").default("pending"),
  idDocumentPath: text("id_document_path"),
  selfiePath: text("selfie_path"),
  verificationConfidence: numeric("verification_confidence"),
  faceMatchScore: numeric("face_match_score"),
  documentValidityScore: numeric("document_validity_score"),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertAgentVerificationSchema = createInsertSchema(agentVerifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verifiedAt: true
});

export type InsertAgentVerification = z.infer<typeof insertAgentVerificationSchema>;
export type AgentVerification = typeof agentVerifications.$inferSelect;

// UK Property Legislation Zod schemas
export const insertUkPropertyLegislationSchema = createInsertSchema(ukPropertyLegislation).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserLegislationTrackingSchema = createInsertSchema(userLegislationTracking).omit({
  id: true,
  acknowledgedAt: true,
  createdAt: true,
});

export type InsertUkPropertyLegislation = z.infer<typeof insertUkPropertyLegislationSchema>;
export type UkPropertyLegislation = typeof ukPropertyLegislation.$inferSelect;
export type InsertUserLegislationTracking = z.infer<typeof insertUserLegislationTrackingSchema>;
export type UserLegislationTracking = typeof userLegislationTracking.$inferSelect;

// Admin Configuration Schema
export const adminConfiguration = pgTable("admin_configuration", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  contactFirstName: text("contact_first_name").notNull(),
  contactLastName: text("contact_last_name").notNull(),
  contactTitle: text("contact_title"), // Mr, Mrs, Miss, Ms, Dr
  businessEmail: text("business_email").notNull(),
  businessPhone: text("business_phone").notNull(),
  businessAddress: text("business_address").notNull(),
  businessCity: text("business_city").notNull(),
  businessPostcode: text("business_postcode").notNull(),
  companyNumber: text("company_number"),
  vatNumber: text("vat_number"),
  preferredContactMethod: text("preferred_contact_method").default("email"), // email, phone, post
  businessType: text("business_type").default("property_management"), // property_management, letting_agency, landlord, estate_agency
  authorized: boolean("authorized").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdminConfigurationSchema = createInsertSchema(adminConfiguration).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AdminConfiguration = typeof adminConfiguration.$inferSelect;
export type InsertAdminConfiguration = z.infer<typeof insertAdminConfigurationSchema>;
