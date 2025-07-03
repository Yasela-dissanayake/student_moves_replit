import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import * as fs from "fs";
import csrfProtection, {
  handleCsrfError,
  setupCsrfRoutes,
} from "./middleware/csrf-protection";
import setupContentSecurityPolicy from "./middleware/content-security-policy";
import setupSecureCookies from "./middleware/secure-cookies";
import setupSecureHeaders from "./middleware/secure-headers";
import { userStatusService } from "./user-status-service";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

import dotenv from "dotenv";
dotenv.config();

// Fix for ESM modules that don't have __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), "uploads");
const marketplaceUploadsDir = join(uploadsDir, "marketplace");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(marketplaceUploadsDir)) {
  fs.mkdirSync(marketplaceUploadsDir, { recursive: true });
}

// Serve static files from the uploads directory
app.use("/uploads", express.static(uploadsDir));
console.log("Static file serving set up for uploads directory:", uploadsDir);

// Serve static files from the public directory
const publicDir = join(process.cwd(), "public");
app.use(express.static(publicDir));
console.log("Static file serving set up for public directory:", publicDir);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Session middleware setup function
async function setupSessionMiddleware(app: express.Application) {
  let sessionStore;

  try {
    const PgStore = connectPgSimple(session);
    sessionStore = new PgStore({
      conString: process.env.DATABASE_URL,
      tableName: "sessions",
      createTableIfMissing: true,
      disableTouch: false,
      pruneSessionInterval: 60,
      errorLog: (error: Error) => {
        console.error("🔴 PostgreSQL session store error:", error);
      },
    });

    sessionStore.on("connect", () => {
      console.log("✅ PostgreSQL session store initialized successfully");
    });

    sessionStore.on("disconnect", () => {
      console.log("⚠️ PostgreSQL session store disconnected");
    });

    console.log("✅ PostgreSQL session store initialized successfully");
  } catch (error) {
    console.warn(
      "⚠️ Failed to initialize PostgreSQL session store, using default memory store:",
      error
    );
    // Use default session store (MemoryStore)
    sessionStore = undefined;
    console.log("Using default memory session store as fallback");
  }

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "unirent-secret-key",
      resave: false,
      saveUninitialized: true,
      store: sessionStore,
      name: "sid",
      rolling: true,
      cookie: {
        secure: false,
        httpOnly: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      },
    })
  );

  // Add session debugging middleware
  app.use((req, res, next) => {
    console.log("🔍 Session Debug:", {
      sessionID: req.sessionID,
      hasSession: !!req.session,
      userId: req.session?.userId,
      userType: req.session?.userType,
      cookie: req.headers.cookie?.substring(0, 50) + "...",
    });
    next();
  });
}

(async () => {
  // Set up session middleware FIRST - critical for authentication
  await setupSessionMiddleware(app);

  // Set up secure cookies middleware - should be one of the first middlewares
  setupSecureCookies(app);

  // Set up secure headers middleware
  setupSecureHeaders(app);

  // Set up CSRF protection routes - must be done before registering other routes
  setupCsrfRoutes(app);

  // Set up Content Security Policy
  setupContentSecurityPolicy(app);

  // Register all application routes
  const server = await registerRoutes(app);

  // Initialize real-time user status service
  userStatusService.initialize(server);

  // Set up CSRF error handler - must be after route registration
  app.use(handleCsrfError);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log the error but don't throw it again
    console.error("API Error:", err);

    // Only send a response if one hasn't been sent already
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
