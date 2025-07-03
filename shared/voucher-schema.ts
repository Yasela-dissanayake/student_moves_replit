import { pgTable, serial, text, boolean, timestamp, integer, pgEnum, varchar, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Voucher status enum
export const voucherStatusEnum = pgEnum('voucher_status', ['active', 'used', 'expired', 'revoked']);

// Voucher category enum
export const voucherCategoryEnum = pgEnum('voucher_category', [
  'food', 'drinks', 'entertainment', 'shopping', 'travel', 'health', 'fitness', 'education', 'other'
]);

// Business table
export const businesses = pgTable('businesses', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  address: text('address').notNull(),
  city: text('city').notNull(),
  postcode: text('postcode').notNull(),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  website: text('website'),
  logo: text('logo'),
  category: text('category').array(),
  isVerified: boolean('is_verified').default(false),
  coordinates: json('coordinates').$type<{ lat: number, lng: number }>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Voucher template table (for creating multiple vouchers of the same type)
export const voucherTemplates = pgTable('voucher_templates', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').references(() => businesses.id),
  title: text('title').notNull(),
  description: text('description'),
  discount: text('discount').notNull(), // e.g., "20% off", "£5 off"
  termsAndConditions: text('terms_and_conditions'),
  validFrom: timestamp('valid_from').notNull(),
  validUntil: timestamp('valid_until').notNull(),
  imageUrl: text('image_url'),
  category: voucherCategoryEnum('category').default('other'),
  maxRedemptions: integer('max_redemptions'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Individual voucher table
export const vouchers = pgTable('vouchers', {
  id: serial('id').primaryKey(),
  voucherCode: varchar('voucher_code', { length: 12 }).notNull().unique(),
  templateId: integer('template_id').references(() => voucherTemplates.id),
  status: voucherStatusEnum('status').default('active'),
  studentId: integer('student_id'), // References the user who claimed this voucher
  claimedAt: timestamp('claimed_at'),
  redeemedAt: timestamp('redeemed_at'),
  qrCodeUrl: text('qr_code_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Voucher redemption history
export const voucherRedemptions = pgTable('voucher_redemptions', {
  id: serial('id').primaryKey(),
  voucherId: integer('voucher_id').references(() => vouchers.id),
  businessId: integer('business_id').references(() => businesses.id),
  studentId: integer('student_id'), // References the user who used the voucher
  redeemedAt: timestamp('redeemed_at').defaultNow(),
  verificationMethod: text('verification_method').default('qr_code'), // qr_code, manual, etc.
  verifiedBy: integer('verified_by'), // If manually verified, references staff user
  notes: text('notes')
});

// Zod schemas for validation
export const insertBusinessSchema = createInsertSchema(businesses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVoucherTemplateSchema = createInsertSchema(voucherTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVoucherSchema = createInsertSchema(vouchers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVoucherRedemptionSchema = createInsertSchema(voucherRedemptions).omit({ id: true, redeemedAt: true });

// TypeScript types for the schemas
export type Business = typeof businesses.$inferSelect;
export type BusinessInsert = z.infer<typeof insertBusinessSchema>;

export type VoucherTemplate = typeof voucherTemplates.$inferSelect;
export type VoucherTemplateInsert = z.infer<typeof insertVoucherTemplateSchema>;

export type Voucher = typeof vouchers.$inferSelect;
export type VoucherInsert = z.infer<typeof insertVoucherSchema>;

export type VoucherRedemption = typeof voucherRedemptions.$inferSelect;
export type VoucherRedemptionInsert = z.infer<typeof insertVoucherRedemptionSchema>;