import { pgTable, serial, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Marketplace item categories
export const MarketplaceItemCategories = [
  'textbooks',
  'electronics',
  'furniture',
  'clothing',
  'kitchen',
  'sports',
  'tickets',
  'services',
  'other'
] as const;

// Marketplace item conditions
export const MarketplaceItemConditions = [
  'new',
  'like_new',
  'very_good',
  'good',
  'fair',
  'poor'
] as const;

// Transaction statuses
export const TransactionStatuses = [
  'pending', 
  'paid', 
  'shipped', 
  'delivered', 
  'completed', 
  'cancelled', 
  'refunded', 
  'disputed'
] as const;

// Payment statuses
export const PaymentStatuses = [
  'pending',
  'processing',
  'paid',
  'failed',
  'refunded'
] as const;

// Delivery statuses
export const DeliveryStatuses = [
  'pending',
  'ready_for_pickup',
  'in_transit',
  'delivered',
  'failed'
] as const;

// Delivery methods
export const DeliveryMethods = [
  'pickup',
  'delivery'
] as const;

// Payment methods
export const PaymentMethods = [
  'bank_transfer',
  'card_payment',
  'cash',
  'paypal',
  'other'
] as const;

// Offer statuses
export const OfferStatuses = [
  'pending',
  'accepted',
  'rejected',
  'expired',
  'cancelled'
] as const;

// Marketplace items table
export const marketplaceItems = pgTable('marketplace_items', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  price: text('price').notNull(),
  category: text('category').notNull().$type<typeof MarketplaceItemCategories[number]>(),
  condition: text('condition').notNull().$type<typeof MarketplaceItemConditions[number]>(),
  images: jsonb('images').notNull().default([]),
  location: text('location').notNull(),
  seller_id: integer('seller_id').notNull(),
  buyer_id: integer('buyer_id'),
  ai_verified: boolean('ai_verified').default(false),
  ai_verified_at: timestamp('ai_verified_at'),
  ai_verification_score: text('ai_verification_score'),
  status: text('status').notNull().default('available'),
  meetup_preference: text('meetup_preference'),
  ai_notes: text('ai_notes'),
  university: text('university'),
  featured: boolean('featured').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
  deletedAt: timestamp('deleted_at')
});

// Create insert schema for marketplace items
export const insertMarketplaceItemSchema = createInsertSchema(marketplaceItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  ai_verified: true,
  ai_verified_at: true,
  ai_verification_score: true,
  featured: true
});

export type InsertMarketplaceItem = z.infer<typeof insertMarketplaceItemSchema>;
export type MarketplaceItem = typeof marketplaceItems.$inferSelect;

// Marketplace transactions table
export const marketplaceTransactions = pgTable('marketplace_transactions', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id').notNull(),
  buyerId: integer('buyer_id').notNull(),
  sellerId: integer('seller_id').notNull(),
  status: text('status').notNull().$type<typeof TransactionStatuses[number]>().default('pending'),
  paymentStatus: text('payment_status').notNull().$type<typeof PaymentStatuses[number]>().default('pending'),
  paymentMethod: text('payment_method').$type<typeof PaymentMethods[number]>(),
  paymentReceipt: text('payment_receipt'),
  deliveryMethod: text('delivery_method').$type<typeof DeliveryMethods[number]>().notNull(),
  deliveryStatus: text('delivery_status').$type<typeof DeliveryStatuses[number]>().default('pending'),
  deliveryAddress: text('delivery_address'),
  deliveryTrackingNumber: text('delivery_tracking_number'),
  deliveryProof: text('delivery_proof'), // Add delivery proof field for seller to upload proof of delivery
  amount: text('amount').notNull(),
  notes: text('notes'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
});

// Create insert schema for marketplace transactions
export const insertMarketplaceTransactionSchema = createInsertSchema(marketplaceTransactions).omit({
  id: true,
  updatedAt: true,
  createdAt: true,
  completedAt: true
});

export type InsertMarketplaceTransaction = z.infer<typeof insertMarketplaceTransactionSchema>;
export type MarketplaceTransaction = typeof marketplaceTransactions.$inferSelect;

// Marketplace offers table
export const marketplaceOffers = pgTable('marketplace_offers', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id').notNull(),
  buyerId: integer('buyer_id').notNull(),
  sellerId: integer('seller_id').notNull(),
  amount: text('amount').notNull(),
  note: text('note'),
  status: text('status').notNull().$type<typeof OfferStatuses[number]>().default('pending'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
});

// Create insert schema for marketplace offers
export const insertMarketplaceOfferSchema = createInsertSchema(marketplaceOffers).omit({
  id: true,
  updatedAt: true,
  createdAt: true,
  status: true
});

export type InsertMarketplaceOffer = z.infer<typeof insertMarketplaceOfferSchema>;
export type MarketplaceOffer = typeof marketplaceOffers.$inferSelect;

// Transaction messages table
export const marketplaceTransactionMessages = pgTable('marketplace_transaction_messages', {
  id: serial('id').primaryKey(),
  transactionId: integer('transaction_id').notNull(),
  senderId: integer('sender_id').notNull(),
  senderType: text('sender_type').notNull(), // 'buyer', 'seller', or 'system'
  message: text('message').notNull(),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
});

// Create insert schema for transaction messages
export const insertTransactionMessageSchema = createInsertSchema(marketplaceTransactionMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  readAt: true
});

export type InsertTransactionMessage = z.infer<typeof insertTransactionMessageSchema>;
export type TransactionMessage = typeof marketplaceTransactionMessages.$inferSelect;

// Saved marketplace items table
export const savedMarketplaceItems = pgTable('saved_marketplace_items', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id').notNull(),
  userId: integer('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Create insert schema for saved marketplace items
export const insertSavedMarketplaceItemSchema = createInsertSchema(savedMarketplaceItems).omit({
  id: true,
  createdAt: true
});

export type InsertSavedMarketplaceItem = z.infer<typeof insertSavedMarketplaceItemSchema>;
export type SavedMarketplaceItem = typeof savedMarketplaceItems.$inferSelect;

// Reported marketplace items table
export const reportedMarketplaceItems = pgTable('reported_marketplace_items', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id').notNull(),
  reporterId: integer('reporter_id').notNull(),
  reason: text('reason').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('pending'), // 'pending', 'reviewed', 'actioned', 'dismissed'
  reviewerId: integer('reviewer_id'),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Create insert schema for reported marketplace items
export const insertReportedMarketplaceItemSchema = createInsertSchema(reportedMarketplaceItems).omit({
  id: true,
  status: true,
  reviewerId: true,
  reviewedAt: true,
  reviewNotes: true,
  createdAt: true
});

export type InsertReportedMarketplaceItem = z.infer<typeof insertReportedMarketplaceItemSchema>;
export type ReportedMarketplaceItem = typeof reportedMarketplaceItems.$inferSelect;

// Marketplace messages table
export const marketplaceMessages = pgTable('marketplace_messages', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id').notNull(),
  senderId: integer('sender_id').notNull(),
  receiverId: integer('receiver_id').notNull(),
  message: text('message').notNull(),
  readAt: timestamp('read_at'),
  isSystemMessage: boolean('is_system_message').default(false),
  isFlagged: boolean('is_flagged').default(false),
  flagReason: text('flag_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
});

// Create insert schema for marketplace messages
export const insertMarketplaceMessageSchema = createInsertSchema(marketplaceMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  readAt: true,
  isFlagged: true,
  flagReason: true
});

export type InsertMarketplaceMessage = z.infer<typeof insertMarketplaceMessageSchema>;
export type MarketplaceMessage = typeof marketplaceMessages.$inferSelect;