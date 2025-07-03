/**
 * Deployment Package Generation Routes
 * Provides endpoints for generating and downloading deployment packages
 */

import express from 'express';
import archiver from 'archiver';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Generate and download a complete deployment package
 */
router.post('/generate-deployment-package', async (req, res) => {
  try {
    console.log('Generating deployment package...');
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="studentmoves-deployment-${new Date().toISOString().split('T')[0]}.zip"`);
    
    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Handle archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      res.status(500).json({ error: 'Failed to create deployment package' });
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add essential files and directories
    const filesToInclude = [
      // Core application files
      { src: 'package.json', dest: 'package.json' },
      { src: 'package-lock.json', dest: 'package-lock.json' },
      { src: 'tsconfig.json', dest: 'tsconfig.json' },
      { src: 'vite.config.ts', dest: 'vite.config.ts' },
      { src: 'tailwind.config.ts', dest: 'tailwind.config.ts' },
      { src: 'postcss.config.js', dest: 'postcss.config.js' },
      { src: 'drizzle.config.ts', dest: 'drizzle.config.ts' },
      { src: 'theme.json', dest: 'theme.json' },
      
      // Frontend source
      { src: 'client/', dest: 'client/', isDirectory: true },
      
      // Backend source
      { src: 'server/', dest: 'server/', isDirectory: true },
      
      // Shared code
      { src: 'shared/', dest: 'shared/', isDirectory: true },
      
      // Public assets
      { src: 'public/', dest: 'public/', isDirectory: true },
      
      // Database migrations
      { src: 'migrations/', dest: 'migrations/', isDirectory: true },
      
      // Mobile application
      { src: 'mobile/', dest: 'mobile/', isDirectory: true },
      
      // Documentation
      { src: 'docs/', dest: 'docs/', isDirectory: true },
    ];

    // Add files to archive
    for (const file of filesToInclude) {
      const sourcePath = path.join(projectRoot, file.src);
      
      try {
        if (await fs.pathExists(sourcePath)) {
          if (file.isDirectory) {
            archive.directory(sourcePath, file.dest, {
              ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**', '.env', '.env.*']
            });
          } else {
            archive.file(sourcePath, { name: file.dest });
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not add ${file.src} to package:`, error.message);
      }
    }

    // Create deployment instructions
    const deploymentInstructions = `# StudentMoves Complete Deployment Package

This package contains everything needed to deploy StudentMoves property management platform on your own infrastructure.

## Package Contents

### Web Application
- Complete React frontend with TypeScript
- Express.js backend with authentication
- PostgreSQL database with Drizzle ORM
- UK property law compliance features
- Digital signature system
- Document management
- Admin panel with AI features

### Mobile Applications (React Native)
- Cross-platform mobile app for iOS and Android
- Native property browsing and search
- User authentication and profiles
- Photo uploads and document handling
- Ready for App Store deployment

## Prerequisites

### Server Requirements
- Node.js 18+ 
- PostgreSQL 14+ database
- Domain name with DNS configured
- SSL certificate (recommended)
- Minimum 2GB RAM, 20GB storage

### Mobile Development (Optional)
- React Native CLI
- Android Studio (for Android builds)
- Xcode (for iOS builds - macOS only)

## Web Application Deployment

### 1. Environment Setup
Copy \`.env.example\` to \`.env\` and configure:

\`\`\`bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/studentmoves

# API Keys
OPENAI_API_KEY=your_openai_api_key
SENDGRID_API_KEY=your_sendgrid_api_key

# Server Configuration
NODE_ENV=production
PORT=5000
\`\`\`

### 2. Installation Steps

1. Extract this package to your server
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Build the application:
   \`\`\`bash
   npm run build
   \`\`\`

4. Set up database:
   \`\`\`bash
   npm run db:push
   \`\`\`

5. Start production server:
   \`\`\`bash
   npm start
   \`\`\`

### 3. Server Configuration

Configure reverse proxy (nginx example):

\`\`\`nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
\`\`\`

## Mobile Application Deployment

### Android Deployment

1. Navigate to mobile directory:
   \`\`\`bash
   cd mobile
   npm install
   \`\`\`

2. Update API URL in \`src/services/api.ts\`:
   \`\`\`typescript
   const BASE_URL = 'https://yourdomain.com';
   \`\`\`

3. Build release APK:
   \`\`\`bash
   cd android
   ./gradlew assembleRelease
   \`\`\`

4. Submit to Google Play Store:
   - Create Google Play Console account (\$25 one-time)
   - Upload APK and configure store listing
   - Submit for review (1-3 days typically)

### iOS Deployment

1. Requirements:
   - Apple Developer Account (\$99/year)
   - macOS with Xcode installed

2. Build and deploy:
   \`\`\`bash
   cd mobile/ios
   pod install
   \`\`\`

3. Open in Xcode and archive for App Store submission

## Features Included

### Property Management
- Property listings with advanced search
- Document upload and management
- Tenant screening and applications
- Digital lease signing (DocuSign-style)
- Maintenance request tracking
- Financial reporting

### UK Compliance
- Right to Rent checks
- Deposit protection schemes
- HMO licensing management
- EPC certificates
- Gas and electrical safety certificates
- Tenancy agreement templates

### Admin Features
- User management (tenants, landlords, agents)
- AI-powered property descriptions
- Bulk document processing
- Newsletter generation
- Business outreach tools
- Analytics and reporting

### Mobile App Features
- Property search and browsing
- Photo uploads for applications
- Document scanning and storage
- Push notifications
- Offline data caching
- Biometric authentication support

## Production Checklist

### Web Application
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] SSL certificate installed
- [ ] Reverse proxy configured
- [ ] Application started successfully
- [ ] DNS pointing to your server
- [ ] Admin panel accessible

### Mobile Applications
- [ ] API URL updated in mobile app
- [ ] App icons and branding configured
- [ ] Google Play Console account created
- [ ] Apple Developer account (for iOS)
- [ ] Apps built and tested
- [ ] Store listings prepared

## Default Accounts

The system includes demo accounts for testing:
- Admin: admin@demo.com / demo123
- Landlord: landlord@demo.com / demo123
- Tenant: tenant@demo.com / demo123
- Agent: agent@demo.com / demo123

Remember to create your own admin account and disable demo accounts in production.

## Support and Documentation

- Complete API documentation in \`docs/\` directory
- Database schema documentation
- Mobile app development guide
- Deployment troubleshooting guide

## Technical Stack

### Backend
- Node.js + Express.js
- TypeScript for type safety
- PostgreSQL with Drizzle ORM
- Authentication with sessions
- File upload handling
- Email integration (SendGrid)

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Shadcn/ui component library
- React Query for data fetching
- Wouter for routing
- Form handling with React Hook Form

### Mobile
- React Native for cross-platform development
- React Navigation for navigation
- AsyncStorage for local data
- React Native Paper for UI components
- TypeScript throughout

## Generated Information
- Package generated: ${new Date().toISOString()}
- Version: StudentMoves v1.0
- Platform: Complete Property Management Solution
- Mobile Apps: iOS and Android ready
- Deployment: Production ready
`;

    // Add deployment instructions
    archive.append(deploymentInstructions, { name: 'README.md' });

    // Create environment template
    const envTemplate = `# StudentMoves Environment Configuration
# Copy this file to .env and configure your values

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/studentmoves
PGHOST=localhost
PGPORT=5432
PGUSER=your_db_user
PGPASSWORD=your_db_password
PGDATABASE=studentmoves

# API Keys
OPENAI_API_KEY=your_openai_api_key_here
SENDGRID_API_KEY=your_sendgrid_api_key_here

# Server Configuration
NODE_ENV=production
PORT=5000

# Optional: Additional API Keys
# PERPLEXITY_API_KEY=your_perplexity_api_key_here
`;

    archive.append(envTemplate, { name: '.env.example' });

    // Create production package.json scripts
    const productionScripts = {
      "start": "node server/index.js",
      "build": "vite build",
      "db:push": "drizzle-kit push",
      "db:migrate": "drizzle-kit migrate"
    };

    // Add production-optimized package.json modifications
    archive.append(JSON.stringify(productionScripts, null, 2), { name: 'production-scripts.json' });

    console.log('Finalizing deployment package...');
    
    // Finalize the archive
    await archive.finalize();
    
    console.log('Deployment package generated successfully');
    
  } catch (error) {
    console.error('Error generating deployment package:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to generate deployment package',
        message: error.message 
      });
    }
  }
});

export default router;