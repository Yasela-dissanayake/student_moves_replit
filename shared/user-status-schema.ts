import { pgTable, serial, integer, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// User status types
export const userStatusTypes = ['online', 'away', 'busy', 'offline'] as const;
export type UserStatus = typeof userStatusTypes[number];

// User status table
export const userStatus = pgTable('user_status', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('offline'),
  lastSeen: timestamp('last_seen').defaultNow(),
  isActive: boolean('is_active').default(false),
  currentActivity: varchar('current_activity', { length: 100}),
  location: varchar('location', { length: 100}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// User activity tracking
export const userActivity = pgTable('user_activity', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  activityType: varchar('activity_type', { length: 50 }).notNull(),
  activityData: varchar('activity_data', { length: 500 }),
  timestamp: timestamp('timestamp').defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 500 })
});

// Real-time connection tracking
export const activeConnections = pgTable('active_connections', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  socketId: varchar('socket_id', { length: 100 }).notNull(),
  connectedAt: timestamp('connected_at').defaultNow(),
  lastPing: timestamp('last_ping').defaultNow(),
  userAgent: varchar('user_agent', { length: 500 }),
  ipAddress: varchar('ip_address', { length: 45 })
});

// Status update schemas
export const insertUserStatusSchema = createInsertSchema(userStatus).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserActivitySchema = createInsertSchema(userActivity).omit({
  id: true,
  timestamp: true
});

export const insertActiveConnectionSchema = createInsertSchema(activeConnections).omit({
  id: true,
  connectedAt: true,
  lastPing: true
});

// Types
export type InsertUserStatus = z.infer<typeof insertUserStatusSchema>;
export type SelectUserStatus = typeof userStatus.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type SelectUserActivity = typeof userActivity.$inferSelect;
export type InsertActiveConnection = z.infer<typeof insertActiveConnectionSchema>;
export type SelectActiveConnection = typeof activeConnections.$inferSelect;

// Status update payload for WebSocket
export const statusUpdateSchema = z.object({
  userId: z.number(),
  status: z.enum(userStatusTypes),
  activity: z.string().optional(),
  location: z.string().optional()
});

export type StatusUpdate = z.infer<typeof statusUpdateSchema>;