# UniCard Solutions - Setup Guide

Complete installation and configuration guide for the UniCard Solutions platform.

## 📋 Prerequisites

### Required Software
- **Node.js** 18.0 or higher
- **npm** 9.0 or higher (comes with Node.js)
- **Git** for version control
- **Supabase Account** (free tier available)

### Optional Software
- **Expo CLI** for mobile development
- **Android Studio** for Android development
- **Xcode** for iOS development (macOS only)
- **VS Code** with recommended extensions

## 🚀 Installation Steps

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/unicardslutions/unicard-complete-system.git
cd unicard-complete-system

# Verify structure
ls -la
# Should show: unicard-creator-hub, unicard-school-app, unicard-admin-app, unicard-shared
```

### Step 2: Setup Supabase

#### 2.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Choose organization
5. Enter project details:
   - **Name**: `unicard-solutions`
   - **Database Password**: Generate strong password
   - **Region**: Choose closest to your location
6. Click "Create new project"
7. Wait for project to be ready (2-3 minutes)

#### 2.2 Get Supabase Credentials
1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)
3. Save these for later use

#### 2.3 Setup Database Schema
```bash
cd unicard-creator-hub
npx supabase init
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

### Step 3: Setup Web Application

```bash
cd unicard-creator-hub

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your Supabase credentials
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key

# Start development server
npm run dev
```

**Web app will be available at:** `http://localhost:8080`

### Step 4: Setup Mobile Applications

#### 4.1 Install Expo CLI
```bash
npm install -g @expo/cli
```

#### 4.2 Setup School App
```bash
cd unicard-school-app

# Install dependencies
npm install

# Update app.json with your Supabase credentials
# Edit the "extra" section with your Supabase URL and key

# Start development server
npx expo start
```

#### 4.3 Setup Admin App
```bash
cd unicard-admin-app

# Install dependencies
npm install

# Update app.json with your Supabase credentials
# Edit the "extra" section with your Supabase URL and key

# Start development server
npx expo start
```

### Step 5: Setup Shared Package

```bash
cd unicard-shared

# Install dependencies
npm install

# Build the package
npm run build
```

## 🔧 Configuration Details

### Environment Variables

#### Web Application (.env)
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Development settings
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
```

#### Mobile Applications (app.json)
```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://your-project-ref.supabase.co",
      "supabaseAnonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "eas": {
        "projectId": "your-eas-project-id"
      }
    }
  }
}
```

### Database Configuration

#### Row Level Security (RLS)
The database uses Row Level Security for data isolation:

```sql
-- Schools can only see their own data
CREATE POLICY "Schools can view own data" ON schools
  FOR SELECT USING (auth.uid() = id);

-- Students are isolated by school
CREATE POLICY "Students isolated by school" ON students
  FOR ALL USING (
    school_id IN (
      SELECT id FROM schools WHERE auth.uid() = id
    )
  );
```

#### Storage Buckets
```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('student-photos', 'student-photos', true),
  ('templates', 'templates', true),
  ('advertisements', 'advertisements', true);
```

## 📱 Mobile App Testing

### Method 1: Expo Go (Recommended for Development)

#### Android
1. Install **Expo Go** from Google Play Store
2. Run `npx expo start` in mobile app directory
3. Scan QR code with Expo Go
4. App will load on your device

#### iOS
1. Install **Expo Go** from App Store
2. Run `npx expo start` in mobile app directory
3. Scan QR code with Expo Go
4. App will load on your device

### Method 2: Web Browser
```bash
npx expo start --web
# Opens in browser for testing
```

### Method 3: Android Studio Emulator
1. Install Android Studio
2. Create Android Virtual Device (AVD)
3. Start emulator
4. Run `npx expo start` and press 'a' for Android

### Method 4: Physical Device (Development Build)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for Android
eas build --platform android --profile development

# Install APK on device
```

## 🗄️ Database Setup

### Manual Schema Application

If `supabase db push` fails, apply schema manually:

1. Go to Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL scripts in order:

```sql
-- 1. Create core tables
-- (Copy content from supabase/migrations/20251009151851_*.sql)

-- 2. Add advertisements table
-- (Copy content from supabase/migrations/20251010120000_*.sql)

-- 3. Add enhanced templates
-- (Copy content from supabase/migrations/20250110130000_*.sql)
```

### Verify Database Setup

```sql
-- Check if all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should return: schools, students, orders, templates, advertisements, user_roles, template_versions
```

## 🔐 Authentication Setup

### Email Authentication
1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Configure email settings:
   - Enable email confirmations
   - Set email templates
   - Configure redirect URLs

### Google OAuth (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
6. Copy Client ID and Secret
7. Add to Supabase Dashboard → **Authentication** → **Providers**

## 🚀 Deployment

### Web Application (Vercel)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
cd unicard-creator-hub
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: unicard-creator-hub
# - Directory: ./
# - Override settings? No
```

3. **Configure Environment Variables**
   - Go to Vercel Dashboard
   - Select your project
   - Go to **Settings** → **Environment Variables**
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

### Mobile Applications (EAS Build)

1. **Install EAS CLI**
```bash
npm install -g eas-cli
```

2. **Login to Expo**
```bash
eas login
```

3. **Configure Projects**
```bash
# School App
cd unicard-school-app
eas build:configure

# Admin App
cd unicard-admin-app
eas build:configure
```

4. **Build APKs**
```bash
# School App
eas build --platform android --profile production

# Admin App
eas build --platform android --profile production
```

## 🧪 Testing

### Web Application Testing
```bash
cd unicard-creator-hub
npm run test
```

### Mobile App Testing
```bash
# School App
cd unicard-school-app
npx expo start --web

# Admin App
cd unicard-admin-app
npx expo start --web
```

### Database Testing
1. Go to Supabase Dashboard
2. Navigate to **Table Editor**
3. Verify data in all tables
4. Test RLS policies

## 🐛 Troubleshooting

### Common Issues

#### "Cannot find module" errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Supabase connection issues
- Check environment variables
- Verify Supabase project is active
- Check network connectivity
- Verify RLS policies

#### Mobile app won't start
```bash
# Clear Expo cache
npx expo start --clear

# Reset Metro bundler
npx expo start --reset-cache
```

#### Database migration fails
- Check Supabase project status
- Verify SQL syntax
- Check for conflicting migrations
- Apply migrations manually via SQL Editor

### Getting Help

1. **Check logs** in browser console or terminal
2. **Verify configuration** matches this guide
3. **Check Supabase status** at status.supabase.com
4. **Create GitHub issue** with error details
5. **Contact support** at support@unicardsolutions.com

## 📚 Next Steps

After successful setup:

1. **Test all features** using the testing guide
2. **Create your first school account**
3. **Upload sample student data**
4. **Create your first ID card template**
5. **Test mobile apps** on physical devices
6. **Deploy to production** when ready

## 🔄 Updates

To update the system:

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Apply database migrations
npx supabase db push

# Restart services
npm run dev
```

---

*For additional help, see the [Troubleshooting Guide](TROUBLESHOOTING.md) or [Contact Support](mailto:support@unicardsolutions.com).*
