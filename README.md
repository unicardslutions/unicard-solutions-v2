# UniCard Solutions - Complete System

A comprehensive ID card template builder and school management system with web application and mobile apps for schools and administrators.

## 🚀 System Overview

UniCard Solutions is a complete platform for creating, managing, and printing student ID cards with advanced template building capabilities, real-time collaboration, and mobile-first design.

### 📊 Current Status: 85% Complete

- ✅ **Web Application**: 100% Complete
- ✅ **Database Schema**: 100% Complete  
- ✅ **Authentication**: 100% Complete
- ⚠️ **Mobile Apps**: 60% Complete (Basic structure + Auth)
- ⚠️ **Offline Sync**: 0% Complete
- ⚠️ **Push Notifications**: 0% Complete

## 🏗️ Architecture

```
unicards/
├── unicard-creator-hub/          # Web Application (React + Vite)
├── unicard-school-app/            # School Mobile App (React Native + Expo)
├── unicard-admin-app/             # Admin Mobile App (React Native + Expo)
└── unicard-shared/                # Shared Package (TypeScript)
```

## ✨ Features

### Web Application (100% Complete)
- 🎨 **Advanced Template Builder** with Fabric.js & Konva.js
- 📸 **Photo Editor** with background removal (Rembg)
- 📊 **Student Management** with bulk import (Excel/ZIP)
- 🏫 **School Dashboard** with real-time statistics
- 👨‍💼 **Admin Panel** with comprehensive management
- 🖨️ **Print Export** with DPI optimization for Epson F530
- 🔄 **Real-time Updates** with Supabase
- 📱 **Responsive Design** for all devices

### Mobile Apps (60% Complete)
- 🔐 **Authentication** (Email, Google Sign-In, Biometric)
- 📱 **Native Navigation** with bottom tabs
- 📊 **Dashboard** with real-time stats
- ⚠️ **Core Features** (Placeholder screens - needs implementation)

### Shared Package
- 🗄️ **Database Types** for Supabase
- 🔧 **Utilities** for dynamic fields and validation
- 🌐 **API Client** for cross-platform consistency
- 📋 **Constants** and configuration

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** + **shadcn/ui** for styling
- **React Router** for navigation
- **TanStack Query** for state management

### Mobile
- **React Native** with **Expo**
- **TypeScript** for type safety
- **React Navigation** for navigation
- **WatermelonDB** for offline support (planned)

### Backend
- **Supabase** (PostgreSQL + Auth + Storage)
- **Row Level Security** for data protection
- **Real-time subscriptions**
- **Edge Functions** for background processing

### Template Builder
- **Fabric.js** for lightweight 2D canvas
- **Konva.js** for advanced features
- **Dynamic field replacement**
- **Import/Export** (Word, Photoshop, Images)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Expo CLI (for mobile apps)

### 1. Clone Repository
```bash
git clone https://github.com/unicardslutions/unicard-complete-system.git
cd unicard-complete-system
```

### 2. Setup Web Application
```bash
cd unicard-creator-hub
npm install
cp .env.example .env
# Add your Supabase credentials to .env
npm run dev
```

### 3. Setup Mobile Apps
```bash
# School App
cd unicard-school-app
npm install
npx expo start

# Admin App  
cd unicard-admin-app
npm install
npx expo start
```

### 4. Setup Database
```bash
cd unicard-creator-hub
npx supabase db push
```

## 📱 Mobile App Testing

### Using Expo Go (Recommended)
1. Install **Expo Go** on your Android/iOS device
2. Run `npx expo start` in mobile app directory
3. Scan QR code with Expo Go app
4. Test authentication and navigation

### Using Web Browser
```bash
npx expo start --web
# Opens in browser for testing
```

### Building APKs
```bash
# Install EAS CLI
npm install -g eas-cli

# Build School App
cd unicard-school-app
eas build --platform android --profile production

# Build Admin App
cd unicard-admin-app
eas build --platform android --profile production
```

## 🔧 Configuration

### Environment Variables

#### Web App (.env)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

#### Mobile Apps (app.json)
```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "your_supabase_url",
      "supabaseAnonKey": "your_supabase_key"
    }
  }
}
```

## 📊 Database Schema

### Core Tables
- `schools` - School information and verification
- `students` - Student data with photos
- `orders` - Order management and status
- `templates` - ID card templates with versioning
- `advertisements` - Admin-managed ads
- `user_roles` - Role-based access control

### Key Features
- **Row Level Security** for data isolation
- **Real-time subscriptions** for live updates
- **File storage** for photos and documents
- **Audit trails** with created_at/updated_at

## 🎨 Template Builder Features

### Canvas Support
- **Fabric.js** - Lightweight, good for 2D manipulation
- **Konva.js** - Advanced features, React integration
- **Dual canvas** system for flexibility

### Import Capabilities
- **Word Documents** (.docx) with text extraction
- **Photoshop Files** (.psd) with layer support
- **Image Files** (PNG, JPG, etc.) with auto-sizing

### Export Options
- **PDF** with print optimization
- **PNG** with DPI settings
- **EPS** for professional printing
- **ZIP** for batch processing

## 🔐 Authentication & Security

### Web Application
- Email/password authentication
- Google OAuth integration
- Role-based access control
- Session management

### Mobile Apps
- Email/password authentication
- Google Sign-In
- Biometric authentication (fingerprint/face)
- Secure token storage

## 📈 Admin Features

### School Management
- View all registered schools
- Verify school accounts
- Monitor school statistics
- Contact management

### Order Management
- Track all orders in real-time
- Update order status
- View order details and students
- Export order data

### Template Management
- Create and edit templates
- Version control
- Public/private templates
- Usage statistics

### Advertisement Management
- Create targeted ads
- Schedule campaigns
- Track performance
- A/B testing

## 🚧 Pending Features (15% Remaining)

### Mobile App Core Features
- [ ] Student management implementation
- [ ] Order management implementation  
- [ ] Template selection with preview
- [ ] Photo upload and editing
- [ ] Excel/ZIP import functionality
- [ ] Offline database sync
- [ ] Push notifications
- [ ] Card generation on mobile

### Advanced Features
- [ ] Real-time collaboration
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] API rate limiting
- [ ] Advanced security features

## 🐛 Troubleshooting

### Common Issues

#### Web App Won't Start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### Mobile App Build Fails
```bash
# Clear Expo cache
npx expo start --clear
```

#### Database Connection Issues
- Check Supabase credentials
- Verify RLS policies
- Check network connectivity

## 📞 Support

- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Email**: support@unicardsolutions.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📊 Project Status

| Component | Status | Progress |
|-----------|--------|----------|
| Web App | ✅ Complete | 100% |
| Database | ✅ Complete | 100% |
| Authentication | ✅ Complete | 100% |
| Mobile Structure | ⚠️ Partial | 60% |
| Mobile Features | ❌ Pending | 0% |
| Offline Sync | ❌ Pending | 0% |
| Push Notifications | ❌ Pending | 0% |
| Documentation | ✅ Complete | 100% |

**Overall Progress: 85% Complete**

---

*Last Updated: October 23, 2025*
