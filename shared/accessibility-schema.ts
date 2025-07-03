import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Accessibility audit results
export const accessibilityAudits = pgTable("accessibility_audits", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  url: varchar("url", { length: 500 }).notNull(),
  auditType: varchar("audit_type", { length: 100 }).notNull(), // 'wcag', 'color-contrast', 'keyboard-nav', 'screen-reader'
  score: integer("score").notNull(), // 0-100
  issues: jsonb("issues").notNull(), // Array of accessibility issues
  recommendations: jsonb("recommendations").notNull(), // Array of fix suggestions
  complianceLevel: varchar("compliance_level", { length: 50 }).notNull(), // 'A', 'AA', 'AAA'
  createdAt: timestamp("created_at").defaultNow(),
  userId: varchar("user_id"),
});

// Accessibility design tokens
export const accessibilityTokens = pgTable("accessibility_tokens", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'color', 'typography', 'spacing', 'focus'
  value: text("value").notNull(),
  wcagCompliant: boolean("wcag_compliant").default(true),
  contrastRatio: varchar("contrast_ratio", { length: 20 }),
  description: text("description"),
  usage: text("usage"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Live preview sessions
export const previewSessions = pgTable("preview_sessions", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  sessionId: varchar("session_id", { length: 100 }).notNull().unique(),
  htmlContent: text("html_content").notNull(),
  cssContent: text("css_content"),
  accessibilityScore: integer("accessibility_score"),
  issues: jsonb("issues"),
  settings: jsonb("settings"), // Preview settings like screen reader mode, high contrast, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Accessibility guidelines and tips
export const accessibilityGuidelines = pgTable("accessibility_guidelines", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  title: varchar("title", { length: 200 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  wcagLevel: varchar("wcag_level", { length: 10 }).notNull(), // 'A', 'AA', 'AAA'
  description: text("description").notNull(),
  implementation: text("implementation").notNull(),
  examples: jsonb("examples"),
  priority: varchar("priority", { length: 20 }).default("medium"), // 'low', 'medium', 'high', 'critical'
});

// Insert schemas
export const insertAccessibilityAuditSchema = createInsertSchema(accessibilityAudits);
export const insertAccessibilityTokenSchema = createInsertSchema(accessibilityTokens);
export const insertPreviewSessionSchema = createInsertSchema(previewSessions);
export const insertAccessibilityGuidelineSchema = createInsertSchema(accessibilityGuidelines);

// Types
export type AccessibilityAudit = typeof accessibilityAudits.$inferSelect;
export type InsertAccessibilityAudit = z.infer<typeof insertAccessibilityAuditSchema>;

export type AccessibilityToken = typeof accessibilityTokens.$inferSelect;
export type InsertAccessibilityToken = z.infer<typeof insertAccessibilityTokenSchema>;

export type PreviewSession = typeof previewSessions.$inferSelect;
export type InsertPreviewSession = z.infer<typeof insertPreviewSessionSchema>;

export type AccessibilityGuideline = typeof accessibilityGuidelines.$inferSelect;
export type InsertAccessibilityGuideline = z.infer<typeof insertAccessibilityGuidelineSchema>;

// Accessibility issue types
export interface AccessibilityIssue {
  id: string;
  type: 'error' | 'warning' | 'notice';
  severity: 'critical' | 'high' | 'medium' | 'low';
  wcagRule: string;
  element: string;
  message: string;
  suggestion: string;
  codeExample?: string;
}

// Color contrast analysis
export interface ContrastAnalysis {
  foreground: string;
  background: string;
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  level: 'fail' | 'aa' | 'aaa';
}

// Accessibility audit result
export interface AuditResult {
  score: number;
  issues: AccessibilityIssue[];
  passed: number;
  failed: number;
  warnings: number;
  complianceLevel: 'A' | 'AA' | 'AAA' | 'Non-compliant';
}