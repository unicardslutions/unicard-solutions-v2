# UniCard Solutions - Deployment Guide

Complete deployment guide for web application and mobile apps.

## 🚀 Deployment Overview

This guide covers deployment for:
- ✅ **Web Application** (Vercel)
- ✅ **Database** (Supabase)
- ⚠️ **Mobile Apps** (EAS Build - APK generation)
- ✅ **Domain & SSL** (Automatic with Vercel)

## 🌐 Web Application Deployment (Vercel)

### Prerequisites
- Vercel account (free tier available)
- GitHub repository connected
- Supabase project configured

### Step 1: Prepare for Deployment

#### 1.1 Environment Variables
Create production environment variables:

```env
# Production Environment
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_ENV=production
VITE_DEBUG_MODE=false
```

#### 1.2 Build Configuration
Verify `vite.config.ts` is optimized for production:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          fabric: ['fabric', 'konva', 'react-konva'],
          utils: ['xlsx', 'jszip', 'qrcode', 'jspdf', 'mammoth']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
});
```

### Step 2: Deploy to Vercel

#### 2.1 Install Vercel CLI
```bash
npm install -g vercel
```

#### 2.2 Login to Vercel
```bash
vercel login
```

#### 2.3 Deploy Application
```bash
cd unicard-creator-hub
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? [Your account]
# - Link to existing project? No
# - Project name: unicard-creator-hub
# - Directory: ./
# - Override settings? No
```

#### 2.4 Configure Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://your-project-ref.supabase.co` | Production |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production |
| `VITE_APP_ENV` | `production` | Production |
| `VITE_DEBUG_MODE` | `false` | Production |

#### 2.5 Redeploy with Environment Variables
```bash
vercel --prod
```

### Step 3: Configure Custom Domain (Optional)

#### 3.1 Add Domain
1. Go to Vercel Dashboard → **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS records as instructed

#### 3.2 SSL Certificate
- SSL is automatically provisioned by Vercel
- Certificate will be ready in 5-10 minutes
- Force HTTPS redirect is enabled by default

## 📱 Mobile Application Deployment

### Prerequisites
- Expo account
- EAS CLI installed
- Android Studio (for local builds)

### Step 1: Setup EAS Build

#### 1.1 Install EAS CLI
```bash
npm install -g eas-cli
```

#### 1.2 Login to Expo
```bash
eas login
```

#### 1.3 Configure Projects

**School App:**
```bash
cd unicard-school-app
eas build:configure

# Select:
# - Platform: Android
# - Build profile: production
# - EAS project ID: [Generate new or use existing]
```

**Admin App:**
```bash
cd unicard-admin-app
eas build:configure

# Select:
# - Platform: Android
# - Build profile: production
# - EAS project ID: [Generate new or use existing]
```

### Step 2: Configure App Settings

#### 2.1 Update app.json for Production

**School App (unicard-school-app/app.json):**
```json
{
  "expo": {
    "name": "UniCard School",
    "slug": "unicard-school-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.unicardsolutions.school"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.unicardsolutions.school",
      "versionCode": 1
    },
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      },
      "supabaseUrl": "https://your-project-ref.supabase.co",
      "supabaseAnonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Admin App (unicard-admin-app/app.json):**
```json
{
  "expo": {
    "name": "UniCard Admin",
    "slug": "unicard-admin-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.unicardsolutions.admin"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.unicardsolutions.admin",
      "versionCode": 1
    },
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      },
      "supabaseUrl": "https://your-project-ref.supabase.co",
      "supabaseAnonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### Step 3: Build APKs

#### 3.1 Build School App
```bash
cd unicard-school-app
eas build --platform android --profile production

# This will:
# - Upload your code to EAS servers
# - Build the APK in the cloud
# - Provide download link when complete
```

#### 3.2 Build Admin App
```bash
cd unicard-admin-app
eas build --platform android --profile production
```

#### 3.3 Monitor Build Progress
```bash
# Check build status
eas build:list

# View specific build
eas build:view [BUILD_ID]
```

### Step 4: Download and Install APKs

#### 4.1 Download APKs
1. Go to [EAS Dashboard](https://expo.dev)
2. Navigate to your projects
3. Click on the completed build
4. Download the APK file

#### 4.2 Install on Android Device
1. Enable "Unknown Sources" in Android settings
2. Transfer APK to device
3. Install APK
4. Launch and test

### Step 5: Google Play Store (Optional)

#### 5.1 Prepare for Play Store
```bash
# Build release version
eas build --platform android --profile production --non-interactive

# Create app bundle (recommended for Play Store)
eas build --platform android --profile production --non-interactive --type app-bundle
```

#### 5.2 Play Store Submission
1. Go to [Google Play Console](https://play.google.com/console)
2. Create new application
3. Upload APK or AAB file
4. Fill in store listing details
5. Submit for review

## 🗄️ Database Deployment

### Prerequisites
- Supabase project created
- Database migrations ready

### Step 1: Apply Migrations

#### 1.1 Using Supabase CLI
```bash
cd unicard-creator-hub
npx supabase db push
```

#### 1.2 Manual Application
If CLI fails, apply manually:

1. Go to Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run migrations in order:

```sql
-- 1. Core schema
-- (Copy from supabase/migrations/20251009151851_*.sql)

-- 2. Advertisements table
-- (Copy from supabase/migrations/20251010120000_*.sql)

-- 3. Enhanced templates
-- (Copy from supabase/migrations/20250110130000_*.sql)
```

### Step 2: Configure Production Settings

#### 2.1 Row Level Security
Verify RLS policies are enabled:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

#### 2.2 Storage Buckets
Create production storage buckets:

```sql
-- Create buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('student-photos', 'student-photos', true),
  ('templates', 'templates', true),
  ('advertisements', 'advertisements', true);

-- Set up policies
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'student-photos');

CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'templates');

CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'advertisements');
```

### Step 3: Environment Configuration

#### 3.1 Production Environment Variables
Update all applications with production Supabase credentials:

**Web App (Vercel):**
- `VITE_SUPABASE_URL`: Production Supabase URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Production anon key

**Mobile Apps (app.json):**
- `supabaseUrl`: Production Supabase URL
- `supabaseAnonKey`: Production anon key

## 🔐 Security Configuration

### Step 1: Supabase Security

#### 1.1 API Keys
- Use production API keys only
- Never commit keys to repository
- Rotate keys regularly

#### 1.2 RLS Policies
Verify all tables have proper RLS policies:

```sql
-- Example: Students table
CREATE POLICY "Students isolated by school" ON students
  FOR ALL USING (
    school_id IN (
      SELECT id FROM schools WHERE auth.uid() = id
    )
  );
```

#### 1.3 Authentication Settings
1. Go to Supabase Dashboard → **Authentication** → **Settings**
2. Configure:
   - Email confirmation required
   - Password requirements
   - Session timeout
   - OAuth providers

### Step 2: Vercel Security

#### 2.1 Environment Variables
- Mark sensitive variables as "Encrypted"
- Use different keys for different environments
- Never expose secrets in client-side code

#### 2.2 Headers Configuration
Create `vercel.json` for security headers:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

## 📊 Monitoring & Analytics

### Step 1: Vercel Analytics
1. Go to Vercel Dashboard → **Analytics**
2. Enable Web Analytics
3. Monitor performance metrics

### Step 2: Supabase Monitoring
1. Go to Supabase Dashboard → **Logs**
2. Monitor API usage
3. Set up alerts for errors

### Step 3: Error Tracking
Consider integrating:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Google Analytics** for usage analytics

## 🚀 CI/CD Pipeline

### Step 1: GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
    paths: ['unicard-creator-hub/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./unicard-creator-hub
```

### Step 2: Automated Mobile Builds

Create `.github/workflows/mobile-build.yml`:

```yaml
name: Build Mobile Apps

on:
  push:
    branches: [main]
    paths: ['unicard-*-app/**']

jobs:
  build-school:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install EAS CLI
        run: npm install -g eas-cli
      - name: Build School App
        run: |
          cd unicard-school-app
          eas build --platform android --non-interactive

  build-admin:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install EAS CLI
        run: npm install -g eas-cli
      - name: Build Admin App
        run: |
          cd unicard-admin-app
          eas build --platform android --non-interactive
```

## 🔄 Updates & Maintenance

### Step 1: Application Updates

#### 1.1 Web Application
```bash
# Pull latest changes
git pull origin main

# Deploy to Vercel
cd unicard-creator-hub
vercel --prod
```

#### 1.2 Mobile Applications
```bash
# Update version in app.json
# Build new APK
eas build --platform android --profile production

# Distribute to users
```

### Step 2: Database Updates

#### 2.1 Schema Changes
```bash
# Create new migration
npx supabase migration new migration_name

# Apply migration
npx supabase db push
```

#### 2.2 Data Migrations
```sql
-- Run data migration scripts
-- Test in staging first
-- Apply to production
```

## 🐛 Troubleshooting

### Common Deployment Issues

#### Issue: "Build failed on Vercel"
**Solutions:**
1. Check build logs in Vercel Dashboard
2. Verify environment variables
3. Check for TypeScript errors
4. Ensure all dependencies are installed

#### Issue: "Mobile app won't build"
**Solutions:**
1. Check EAS build logs
2. Verify app.json configuration
3. Check for missing dependencies
4. Ensure assets are properly referenced

#### Issue: "Database connection failed"
**Solutions:**
1. Verify Supabase credentials
2. Check RLS policies
3. Verify network connectivity
4. Check API rate limits

### Performance Optimization

#### Web Application
- Enable Vercel Edge Functions
- Optimize images
- Use CDN for static assets
- Implement caching strategies

#### Mobile Applications
- Optimize bundle size
- Use lazy loading
- Implement offline caching
- Optimize images

## 📞 Support

For deployment issues:
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Expo Support**: [expo.dev/support](https://expo.dev/support)
- **Supabase Support**: [supabase.com/support](https://supabase.com/support)
- **GitHub Issues**: [github.com/unicardslutions/unicard-complete-system/issues](https://github.com/unicardslutions/unicard-complete-system/issues)

---

*For additional deployment scenarios or issues, see the [Troubleshooting Guide](TROUBLESHOOTING.md) or contact support.*
