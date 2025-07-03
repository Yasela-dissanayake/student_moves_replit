# StudentMoves Platform - Deployment Guide

## Quick Start Deployment

### Prerequisites
- Node.js 20+ with npm
- PostgreSQL database (provided by Replit)
- Environment variables configured

### Environment Variables Required
```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
SENDGRID_API_KEY=SG...
PGHOST=...
PGPORT=5432
PGUSER=...
PGPASSWORD=...
PGDATABASE=...
```

### Deployment Commands
```bash
# Install dependencies (already configured)
npm install

# Build production bundle
npm run build

# Start production server
npm run start

# Development mode
npm run dev
```

## Production Configuration

### Build Optimization
- **Frontend**: React with Vite bundling
- **Backend**: Express.js with TypeScript compilation
- **Assets**: Static file serving with proper caching headers
- **Database**: PostgreSQL with connection pooling

### Performance Settings
- **Response Compression**: Enabled for all API responses
- **Static Asset Caching**: 1 year cache for immutable assets
- **Database Connection Pool**: Optimized for concurrent users
- **Rate Limiting**: Configured per endpoint

### Security Configuration
- **HTTPS**: Enforced in production
- **CSP Headers**: Comprehensive content security policy
- **Session Security**: HTTP-only secure cookies
- **Input Validation**: Zod schemas for all user inputs

## Feature Configuration

### Admin Panel Access
1. Navigate to `/dashboard/admin`
2. Configure business settings via Settings tab
3. Manage utility providers through Utilities tab
4. Monitor system health via AI Maintenance tab

### User Management
- **Authentication**: Session-based with secure cookies
- **Role Assignment**: Admin, Agent, Landlord, Tenant roles
- **Verification**: Document upload and AI verification
- **Right-to-Rent**: UK legal compliance checking

### Utility Provider Setup
- **Live Data**: 16 authentic UK energy companies configured
- **Privacy Mode**: Tenants see setup status, not specific providers
- **API Integration**: Ready for live utility provider APIs
- **Tariff Management**: Real-time pricing data updates

## Database Management

### Schema Updates
```bash
# Push schema changes to database
npm run db:push

# Generate migrations (if needed)
npx drizzle-kit generate:pg
```

### Data Seeding
- Properties: 31 authentic UK student properties
- Utility Providers: 16 real UK energy companies  
- Business Config: Complete company information
- Sample Users: Test accounts for all user types

## Monitoring & Maintenance

### Health Checks
- **Database**: Connection pool status monitoring
- **API Performance**: Response time tracking
- **Error Rates**: Comprehensive error logging
- **Security Events**: Authentication and access monitoring

### Log Management
- **Application Logs**: Structured JSON format
- **Security Logs**: Authentication attempts and access
- **Performance Logs**: Response times and database queries
- **Error Logs**: Exception tracking with stack traces

### Backup Strategy
- **Database Backups**: Automated daily backups
- **File Uploads**: Secure storage with redundancy
- **Configuration**: Version-controlled settings
- **Code Deployment**: Git-based deployment pipeline

## Scaling Configuration

### Horizontal Scaling
- **Load Balancing**: Ready for multi-instance deployment
- **Session Sharing**: Database-backed session storage
- **File Storage**: Scalable asset management
- **Database**: Connection pooling for concurrent access

### Performance Optimization
- **Caching**: Ready for Redis implementation
- **CDN**: Static asset optimization
- **Database Indexing**: Optimized query performance
- **API Efficiency**: Minimal response payloads

## Support & Troubleshooting

### Common Issues
1. **Database Connection**: Check DATABASE_URL and pool settings
2. **Authentication**: Verify session cookie configuration
3. **File Uploads**: Ensure proper disk space and permissions
4. **API Errors**: Check logs for detailed error information

### Contact Information
- **Technical Support**: Available through admin dashboard
- **Documentation**: Complete in replit.md
- **Bug Reporting**: Through admin interface
- **Feature Requests**: Admin dashboard feedback system

## Post-Deployment Checklist

### Immediate Actions
- [ ] Verify admin panel access
- [ ] Test user registration and login
- [ ] Confirm property search functionality
- [ ] Validate utility provider integration
- [ ] Check email notifications

### Ongoing Monitoring
- [ ] Monitor response times
- [ ] Review error logs daily
- [ ] Check database performance
- [ ] Verify backup completion
- [ ] Update security certificates

### User Training
- [ ] Admin user onboarding
- [ ] Agent dashboard walkthrough
- [ ] Landlord feature training
- [ ] Tenant application guide

---

**Deployment Status**: PRODUCTION READY  
**Last Updated**: June 26, 2025  
**Platform Version**: 2.8.0  
**Support**: Available 24/7 through admin dashboard