import { pgTable, serial, integer, text, timestamp, boolean, numeric, json } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Short Videos Schema - TikTok-style content (matches actual database structure)
export const shortVideos = pgTable("short_videos", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(), // Video URL
  caption: text("caption"), // Video caption/description
  userId: integer("user_id").notNull(),
  viewsCount: integer("views_count").default(0),
  hashtags: text("hashtags").array(), // Array of hashtags
  createdAt: timestamp("created_at").defaultNow(),
  thumbnailUrl: text("thumbnail_url"), // Auto-generated thumbnail
  duration: numeric("duration"), // Video duration in seconds
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  category: text("category"), // e.g., "property_tour", "campus_life", "study_tips", "entertainment"
  isPublic: boolean("is_public").default(true),
});

// Video Interactions - likes, comments, shares
export const videoInteractions = pgTable("video_interactions", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull(),
  userId: integer("user_id").notNull(),
  interactionType: text("interaction_type").notNull(), // 'like', 'comment', 'share', 'view'
  comment: text("comment"), // For comment interactions
  timestamp: timestamp("timestamp").defaultNow(),
});

// Video Collections/Playlists
export const videoCollections = pgTable("video_collections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  videoIds: json("video_ids").$type<number[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Video Upload Sessions - track upload progress
export const videoUploads = pgTable("video_uploads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fileName: text("file_name").notNull(),
  originalSize: integer("original_size"),
  compressedSize: integer("compressed_size"),
  uploadProgress: numeric("upload_progress").default("0"), // 0-100
  processingStatus: text("processing_status").default("pending"), // pending, processing, completed, failed
  uploadUrl: text("upload_url"), // Temporary upload URL
  finalUrl: text("final_url"), // Final processed video URL
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Trending/Featured Videos
export const videoTrends = pgTable("video_trends", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull(),
  category: text("category").notNull(),
  trendScore: numeric("trend_score").default("0"), // Algorithm-calculated trend score
  region: text("region"), // Geographic trending area
  dateRange: text("date_range"), // e.g., "daily", "weekly", "monthly"
  position: integer("position"), // Ranking position
  calculatedAt: timestamp("calculated_at").defaultNow(),
});

// Video Reports/Flags
export const videoReports = pgTable("video_reports", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull(),
  reporterId: integer("reporter_id").notNull(),
  reason: text("reason").notNull(), // inappropriate, spam, copyright, etc.
  description: text("description"),
  status: text("status").default("pending"), // pending, reviewed, resolved
  moderatorId: integer("moderator_id"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Create insert schemas
export const insertShortVideoSchema = createInsertSchema(shortVideos).omit({
  id: true,
  views: true,
  likes: true,
  comments: true,
  shares: true,
  flagCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVideoInteractionSchema = createInsertSchema(videoInteractions).omit({
  id: true,
  timestamp: true,
});

export const insertVideoCollectionSchema = createInsertSchema(videoCollections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVideoUploadSchema = createInsertSchema(videoUploads).omit({
  id: true,
  uploadProgress: true,
  createdAt: true,
  completedAt: true,
});

export const insertVideoReportSchema = createInsertSchema(videoReports).omit({
  id: true,
  status: true,
  createdAt: true,
  resolvedAt: true,
});

// Type definitions
export type ShortVideo = typeof shortVideos.$inferSelect;
export type InsertShortVideo = z.infer<typeof insertShortVideoSchema>;

export type VideoInteraction = typeof videoInteractions.$inferSelect;
export type InsertVideoInteraction = z.infer<typeof insertVideoInteractionSchema>;

export type VideoCollection = typeof videoCollections.$inferSelect;
export type InsertVideoCollection = z.infer<typeof insertVideoCollectionSchema>;

export type VideoUpload = typeof videoUploads.$inferSelect;
export type InsertVideoUpload = z.infer<typeof insertVideoUploadSchema>;

export type VideoReport = typeof videoReports.$inferSelect;
export type InsertVideoReport = z.infer<typeof insertVideoReportSchema>;

// Enums for type safety
export type VideoCategory = 'property_tour' | 'campus_life' | 'study_tips' | 'entertainment' | 'housing_advice' | 'city_guide' | 'social';
export type InteractionType = 'like' | 'comment' | 'share' | 'view' | 'bookmark';
export type ProcessingStatus = 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
export type ReportReason = 'inappropriate' | 'spam' | 'copyright' | 'harassment' | 'misleading' | 'other';