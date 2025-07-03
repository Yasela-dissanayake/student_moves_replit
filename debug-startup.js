#!/usr/bin/env node

/**
 * Debug Script for StudentMoves Platform Startup Issues
 * Run with: node debug-startup.js
 */

import dotenv from "dotenv";
dotenv.config();

console.log("🔍 Debugging StudentMoves Platform startup...\n");

// Check Node.js version
console.log("1. Node.js version:", process.version);
const nodeVersion = parseInt(process.version.slice(1).split(".")[0]);
if (nodeVersion < 18) {
  console.error("❌ Node.js version 18+ required. Current:", process.version);
  process.exit(1);
}
console.log("✅ Node.js version compatible\n");

// Check if essential files exist
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const essentialFiles = ["server/index.ts", "package.json", "drizzle.config.ts"];

console.log("2. Checking essential files:");
for (const file of essentialFiles) {
  if (existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
}
console.log();

// Check environment variables
console.log("3. Environment variables:");
const requiredEnvVars = ["DATABASE_URL", "SESSION_SECRET"];

const optionalEnvVars = ["OPENAI_API_KEY", "SENDGRID_API_KEY", "NODE_ENV"];

for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar} - Set`);
  } else {
    console.log(`❌ ${envVar} - MISSING (Required)`);
  }
}

for (const envVar of optionalEnvVars) {
  if (process.env[envVar]) {
    console.log(`ℹ️  ${envVar} - Set (Optional)`);
  } else {
    console.log(`⚠️  ${envVar} - Not set (Optional)`);
  }
}
console.log();

// Test database connection
console.log("4. Testing database connection:");
try {
  if (!process.env.DATABASE_URL) {
    console.log("❌ DATABASE_URL not set - skipping database test");
  } else {
    console.log("ℹ️  DATABASE_URL configured");
    // Basic URL validation
    try {
      new URL(process.env.DATABASE_URL);
      console.log("✅ DATABASE_URL format valid");
    } catch (e) {
      console.log("❌ DATABASE_URL format invalid:", e.message);
    }
  }
} catch (error) {
  console.log("❌ Database connection error:", error.message);
}
console.log();

// Test basic Express server
console.log("5. Testing minimal Express server:");
try {
  const express = await import("express");
  const app = express.default();

  app.get("/test", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const server = app.listen(0, () => {
    const port = server.address().port;
    console.log(`✅ Express server started on port ${port}`);
    server.close();
  });
} catch (error) {
  console.log("❌ Express server error:", error.message);
}
console.log();

console.log("🏁 Debug complete. Review any ❌ items above.\n");

// Provide fix recommendations
console.log("🔧 Common fixes:");
console.log("1. Install dependencies: npm install");
console.log("2. Create .env file with DATABASE_URL and SESSION_SECRET");
console.log("3. Ensure PostgreSQL is running");
console.log("4. Check Node.js version (18+)");
console.log("5. Try: npm run dev -- --verbose");
