# 🎬 Talent Manager

Professional Talent & Project Management System built with React Native, Expo, and TypeScript.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-blue)](https://expo.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-53%2F54%20passing-brightgreen)](tests/)

## ✨ Features

### 🎭 Talent Management
- Add, edit, delete talents with photos and detailed profiles
- Custom categories (Actors, Models, Influencers, etc.)
- Social media integration (Instagram, TikTok, Twitter, Facebook, YouTube, Snapchat)
- Custom fields (height, weight, age, languages, nationality, location, experience)
- Rating system and favorite marking
- International phone numbers with country codes
- Talent calendar and booking management

### 📊 Project Management
- Create and manage projects with multiple talents
- Project phases (preparation, shooting, post-production, delivery, completed)
- Cost tracking with profit margin calculation
- Project attachments (contracts, documents, images)
- Payment tracking and history
- PDF export with customizable templates
- Project status management

### 💬 Communication
- Conversation logging (calls, WhatsApp, meetings)
- Message templates (job offers, confirmations, thank you, reminders)
- Direct WhatsApp integration
- Bilingual support (Arabic & English)

### 📋 Template Management
- Upload Invoice templates
- Upload Quotation templates
- Template preview (images & PDFs)
- Backup and restore templates
- Template history tracking

### ⚙️ Settings & Configuration
- Custom app branding (name, logo, colors)
- Dark mode support
- Category management
- Message template customization
- Data backup and restore
- Admin panel access

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React Native 0.81, Expo 54, TypeScript 5.9 |
| **Styling** | NativeWind 4 (Tailwind CSS) |
| **Navigation** | Expo Router 6 |
| **State** | TanStack Query 5, React Context |
| **API** | tRPC, Express.js |
| **Database** | PostgreSQL, Drizzle ORM |
| **Testing** | Vitest |
| **Deployment** | Docker, Docker Compose, Nginx |

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- pnpm 9.12+

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/talent-manager.git
cd talent-manager

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server (Metro + API)
pnpm dev:metro       # Start Metro bundler only
pnpm dev:server      # Start API server only

# Testing
pnpm test            # Run all tests
pnpm check           # TypeScript type checking
pnpm lint            # ESLint linting

# Building
pnpm build           # Build for production
pnpm start           # Start production server

# Mobile
pnpm ios             # Run on iOS simulator
pnpm android         # Run on Android emulator

# Database
pnpm db:push         # Run database migrations
```

## 📱 Screens Overview

### Home Screen
- Quick statistics (talents, projects, conversations)
- Recent activities
- Quick action buttons

### Talents Screen
- Browse all talents with filters
- Search by name, category, gender
- Add/edit/delete talents
- View detailed talent profiles
- Manage talent bookings

### Projects Screen
- List all projects with status filters
- Create new projects
- Manage project talents and costs
- Track payments
- Export projects to PDF

### Settings Screen
- App branding customization
- Category management
- Message templates
- Invoice/Quotation templates
- Conversation logging
- Data backup/restore
- Admin panel

### Dashboard
- Project statistics
- Revenue tracking
- Talent analytics
- Performance metrics

## 📦 Project Structure

```
talent-manager/
├── app/                          # React Native screens (27 files)
│   ├── (tabs)/                  # Tab navigation
│   ├── settings/                # Settings screens
│   ├── project/                 # Project management
│   ├── talent/                  # Talent management
│   ├── admin/                   # Admin panel
│   └── dev/                     # Development tools
├── components/                  # Reusable components (11 files)
├── server/                      # Backend API (18 files)
├── lib/                         # Shared utilities (16 files)
├── tests/                       # Test suites (4 files)
├── drizzle/                     # Database schema
├── constants/                   # App constants
├── hooks/                       # React hooks
├── assets/                      # Images, icons, fonts
├── Dockerfile                   # Docker image
├── docker-compose.yml           # Multi-container setup
├── nginx.conf                   # Nginx configuration
└── package.json                 # Dependencies
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Test coverage
# - Unit Tests: 19 tests for storage operations
# - Integration Tests: 6 tests for cloud sync
# - E2E Tests: 20 tests for user flows
# - Template Tests: 8 tests for template management
# - Overall: 53/54 passing (98% success rate)
```

## 🐳 Docker Deployment

### Quick Start

```bash
# Build Docker image
docker build -t talent-manager:latest .

# Run with Docker Compose
docker-compose up -d

# Access the application
# - Web App: http://localhost:8081
# - API: http://localhost:3000
```

### Environment Variables

Create `.env` file:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@postgres:5432/talent_manager
REDIS_URL=redis://redis:6379
JWT_SECRET=your_jwt_secret_here
```

See `.env.example` for all available options.

## 📊 Database Schema

### Core Tables
- **users** - User authentication
- **categories** - Talent categories
- **talents** - Talent profiles
- **projects** - Project management
- **conversations** - Conversation logs
- **templates** - Message templates

### Key Features
- Proper normalization and foreign keys
- Timestamps for audit trail
- JSON columns for flexibility
- Optimized indexes

## 🔐 Security

- ✅ OAuth authentication
- ✅ JWT tokens
- ✅ HTTPS/SSL encryption
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation
- ✅ SQL injection prevention (Drizzle ORM)
- ✅ XSS protection

## 📚 Documentation

- [GITHUB_SETUP.md](GITHUB_SETUP.md) - GitHub setup instructions
- [DEPLOYMENT_CONFIG.md](DEPLOYMENT_CONFIG.md) - Deployment guide
- [QUICK_DEPLOY.md](QUICK_DEPLOY.md) - Rapid setup guide
- [COMPREHENSIVE_AUDIT_REPORT.md](COMPREHENSIVE_AUDIT_REPORT.md) - Full audit report
- [QA_REPORT.md](QA_REPORT.md) - Quality assurance report
- [design.md](design.md) - UI/UX design specifications
- [server/README.md](server/README.md) - Server documentation

## 🎨 Customization

### Theme Colors

Edit `theme.config.js`:

```javascript
const themeColors = {
  primary: { light: '#0a7ea4', dark: '#0a7ea4' },
  background: { light: '#ffffff', dark: '#151718' },
  surface: { light: '#f5f5f5', dark: '#1e2022' },
  foreground: { light: '#11181C', dark: '#ECEDEE' },
  // ... more colors
};
```

### App Branding

Edit `app.config.ts`:

```typescript
const env = {
  appName: "Talent Manager",
  appSlug: "talent_manager",
  logoUrl: "https://...", // S3 URL
};
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Code Standards

- **TypeScript:** Strict mode enabled
- **Linting:** ESLint with Expo config
- **Formatting:** Prettier
- **Testing:** Vitest with 98% pass rate
- **Type Safety:** Full type coverage

## 🐛 Bug Reports

Found a bug? Please create an issue with:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)

## 💡 Feature Requests

Have an idea? Open an issue with:
- Feature description
- Use case/motivation
- Proposed implementation (optional)

## 📞 Support

For support, please create an issue or contact: support@adooxc.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgments

- Built with [React Native](https://reactnative.dev/)
- Powered by [Expo](https://expo.dev/)
- Styled with [NativeWind](https://www.nativewind.dev/)
- API with [tRPC](https://trpc.io/)
- Database with [Drizzle ORM](https://orm.drizzle.team/)

---

**Version:** 1.0.0  
**Last Updated:** January 8, 2026  
**Status:** ✅ Production Ready

Made with ❤️ for talent management
