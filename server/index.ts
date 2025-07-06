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

// Serve static files
app.use("/uploads", express.static(uploadsDir));
console.log("Static file serving set up for uploads directory:", uploadsDir);

const publicDir = join(process.cwd(), "public");
app.use(express.static(publicDir));
console.log("Static file serving set up for public directory:", publicDir);

// API request logger
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

// Session middleware setup
async function setupSessionMiddleware(app: express.Application) {
  let sessionStore;

  try {
    const PgStore = connectPgSimple(session);
    sessionStore = new PgStore({
      conString: process.env.DATABASE_URL,
      tableName: "sessions",
      createTableIfMissing: false,
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
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      },
    })
  );

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
  // Middleware and route setup
  await setupSessionMiddleware(app);
  setupSecureCookies(app);
  setupSecureHeaders(app);
  setupCsrfRoutes(app);
  setupContentSecurityPolicy(app);

  // Register application routes
  const server = await registerRoutes(app);

  // Initialize user status service (WebSocket, etc.)
  userStatusService.initialize(server);

  // Global CSRF error handler
  app.use(handleCsrfError);

  // Global API error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("API Error:", err);
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // Set up Vite or static serving
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Final server listen
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`✅ Server is running on http://localhost:${port}`);
    }
  );
})();
