import { pgTable, serial, varchar, boolean, timestamp, numeric, pgEnum, text, integer, json, date } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Define utility type enum
export const utilityTypeEnum = pgEnum('utility_type', [
  'electricity',
  'gas',
  'water',
  'internet',
  'tv_license',
  'council_tax'
]);

// Define provider status enum
export const providerStatusEnum = pgEnum('provider_status', [
  'active',
  'inactive',
  'limited'
]);

// Define providers table
export const utilityProviders = pgTable('utility_providers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  utilityType: utilityTypeEnum('utility_type').notNull(),
  status: providerStatusEnum('status').default('active'),
  description: text('description'),
  logoUrl: varchar('logo_url', { length: 255 }),
  website: varchar('website', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  averageRating: numeric('average_rating', { precision: 3, scale: 2 }).default('0'),
  reviewCount: integer('review_count').default(0),
  features: text('features').array(),
  greenEnergy: boolean('green_energy').default(false),
  studentDiscount: boolean('student_discount').default(false),
  studentDiscountDetails: text('student_discount_details'),
  priceIndex: numeric('price_index', { precision: 5, scale: 2 }),
  comparisonData: json('comparison_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
});

// Define plans table
export const utilityPlans = pgTable('utility_plans', {
  id: serial('id').primaryKey(),
  providerId: integer('provider_id').notNull().references(() => utilityProviders.id),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  description: text('description'),
  monthlyPrice: numeric('monthly_price', { precision: 10, scale: 2 }),
  annualPrice: numeric('annual_price', { precision: 10, scale: 2 }),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }),
  standingCharge: numeric('standing_charge', { precision: 10, scale: 2 }),
  contractLength: integer('contract_length'),
  exitFees: numeric('exit_fees', { precision: 10, scale: 2 }),
  features: text('features').array(),
  termsUrl: varchar('terms_url', { length: 255 }),
  isPopular: boolean('is_popular').default(false),
  isPromoted: boolean('is_promoted').default(false),
  startDate: date('start_date'),
  endDate: date('end_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
});

// Define property utilities table (to track which utilities are set up for which property)
export const propertyUtilities = pgTable('property_utilities', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').notNull(),
  utilityType: utilityTypeEnum('utility_type').notNull(),
  providerId: integer('provider_id').references(() => utilityProviders.id),
  planId: integer('plan_id').references(() => utilityPlans.id),
  accountNumber: varchar('account_number', { length: 100 }),
  meterNumber: varchar('meter_number', { length: 100 }),
  startDate: date('start_date'),
  endDate: date('end_date'),
  currentReading: numeric('current_reading', { precision: 10, scale: 2 }),
  lastReadingDate: timestamp('last_reading_date'),
  billedDirectlyToTenant: boolean('billed_directly_to_tenant').default(false),
  includedInRent: boolean('included_in_rent').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
});

// Define utility switch requests table
export const utilitySwitchRequests = pgTable('utility_switch_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  propertyId: integer('property_id').notNull(),
  utilityType: utilityTypeEnum('utility_type').notNull(),
  currentProviderId: integer('current_provider_id').references(() => utilityProviders.id),
  newProviderId: integer('new_provider_id').notNull().references(() => utilityProviders.id),
  newPlanId: integer('new_plan_id').references(() => utilityPlans.id),
  status: varchar('status', { length: 50 }).default('pending'),
  requestDate: timestamp('request_date').defaultNow(),
  completionDate: timestamp('completion_date'),
  notes: text('notes'),
  contactPhone: varchar('contact_phone', { length: 50 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  preferredContactMethod: varchar('preferred_contact_method', { length: 20 }).default('email'),
  preferredContactTime: varchar('preferred_contact_time', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
});

// Define utility comparison history table
export const utilityComparisonHistory = pgTable('utility_comparison_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  utilityType: utilityTypeEnum('utility_type').notNull(),
  searchPostcode: varchar('search_postcode', { length: 20 }),
  providersCompared: json('providers_compared'),
  potentialSavings: numeric('potential_savings', { precision: 10, scale: 2 }),
  searchDate: timestamp('search_date').defaultNow(),
  resultCount: integer('result_count'),
  selectedProviderId: integer('selected_provider_id').references(() => utilityProviders.id),
  selectedPlanId: integer('selected_plan_id').references(() => utilityPlans.id),
  conversionToSwitch: boolean('conversion_to_switch').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

// Create Zod schemas for validation and typing
export const insertUtilityProviderSchema = createInsertSchema(utilityProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUtilityPlanSchema = createInsertSchema(utilityPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPropertyUtilitySchema = createInsertSchema(propertyUtilities).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUtilitySwitchRequestSchema = createInsertSchema(utilitySwitchRequests).omit({
  id: true,
  requestDate: true,
  createdAt: true,
  updatedAt: true
});

export const insertUtilityComparisonHistorySchema = createInsertSchema(utilityComparisonHistory).omit({
  id: true,
  searchDate: true,
  createdAt: true
});

// Type definitions
export type UtilityProvider = typeof utilityProviders.$inferSelect;
export type UtilityProviderInsert = z.infer<typeof insertUtilityProviderSchema>;

export type UtilityPlan = typeof utilityPlans.$inferSelect;
export type UtilityPlanInsert = z.infer<typeof insertUtilityPlanSchema>;

export type PropertyUtility = typeof propertyUtilities.$inferSelect;
export type PropertyUtilityInsert = z.infer<typeof insertPropertyUtilitySchema>;

export type UtilitySwitchRequest = typeof utilitySwitchRequests.$inferSelect;
export type UtilitySwitchRequestInsert = z.infer<typeof insertUtilitySwitchRequestSchema>;

export type UtilityComparisonHistory = typeof utilityComparisonHistory.$inferSelect;
export type UtilityComparisonHistoryInsert = z.infer<typeof insertUtilityComparisonHistorySchema>;

// Utility types to make it easier to reference
export type UtilityType = 'electricity' | 'gas' | 'water' | 'internet' | 'tv_license' | 'council_tax';
export type ProviderStatus = 'active' | 'inactive' | 'limited';