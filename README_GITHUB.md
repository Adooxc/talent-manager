# Talent Manager - Professional Talent & Project Management System

A comprehensive React Native/Expo application for managing talents (actors, models, influencers) and projects with advanced features like cost tracking, template management, and WhatsApp integration.

## 🌟 Features

### Talent Management
- ✅ Add, edit, delete talents with photos and detailed profiles
- ✅ Custom categories (Actors, Models, Influencers, etc.)
- ✅ Social media links (Instagram, TikTok, Twitter, Facebook, YouTube, Snapchat)
- ✅ Custom fields (height, weight, age, languages, nationality, location, experience)
- ✅ Rating system and favorite marking
- ✅ International phone numbers with country codes
- ✅ Talent calendar and booking management

### Project Management
- ✅ Create and manage projects with multiple talents
- ✅ Project phases (preparation, shooting, post-production, delivery, completed)
- ✅ Cost tracking with profit margin calculation
- ✅ Project attachments (contracts, documents, images)
- ✅ Payment tracking and history
- ✅ Project status management (draft, active, completed, negotiating, cancelled, postponed)
- ✅ PDF export with customizable templates

### Communication
- ✅ Conversation logging (calls, WhatsApp, meetings)
- ✅ Message templates (job offers, confirmations, thank you, reminders)
- ✅ Direct WhatsApp integration
- ✅ Bilingual support (Arabic & English)

### Template Management
- ✅ Upload Invoice templates
- ✅ Upload Quotation templates
- ✅ Template preview (images & PDFs)
- ✅ Backup and restore templates
- ✅ Template history tracking

### Settings & Configuration
- ✅ Custom app branding (name, logo, colors)
- ✅ Dark mode support
- ✅ Category management
- ✅ Message template customization
- ✅ Data backup and restore
- ✅ Admin panel access

## 🛠 Tech Stack

### Frontend
- **React Native 0.81** - Cross-platform mobile development
- **Expo SDK 54** - Managed React Native framework
- **Expo Router 6** - File-based routing
- **NativeWind 4** - Tailwind CSS for React Native
- **TypeScript 5.9** - Type-safe development
- **React 19** - Latest React features
- **TanStack Query 5** - Server state management
- **React Native Reanimated 4** - Smooth animations

### Backend
- **Express.js** - REST API server
- **tRPC** - Type-safe API communication
- **PostgreSQL** - Primary database
- **Drizzle ORM** - Type-safe database queries
- **MySQL2** - Database driver

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy & load balancing
- **Redis** - Caching layer

### Development
- **Vitest** - Unit testing
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **pnpm** - Fast package manager

## 📋 Project Structure

```
talent_manager/
├── app/                          # React Native screens
│   ├── (tabs)/                  # Tab navigation
│   ├── settings/                # Settings screens
│   ├── project/                 # Project management
│   ├── talent/                  # Talent management
│   ├── admin/                   # Admin panel
│   └── dev/                     # Development tools
├── components/                  # Reusable React components
├── server/                      # Backend API
│   ├── _core/                  # Core server logic
│   ├── routers.ts              # API routes
│   └── db.ts                   # Database setup
├── lib/                         # Shared utilities
│   ├── storage.ts              # Local storage
│   ├── template-manager.ts     # Template management
│   ├── types.ts                # TypeScript types
│   └── theme-provider.tsx      # Theme context
├── tests/                       # Test suites
├── drizzle/                     # Database schema
├── constants/                   # App constants
├── hooks/                       # React hooks
├── assets/                      # Images, icons, fonts
├── Dockerfile                   # Docker image
├── docker-compose.yml           # Multi-container setup
├── nginx.conf                   # Nginx configuration
└── package.json                 # Dependencies
```

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- pnpm 9.12+
- Docker & Docker Compose (for deployment)

### Development

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Start development server**
   ```bash
   pnpm dev
   ```
   - Metro bundler runs on http://localhost:8081
   - Backend API runs on http://localhost:3000

3. **Run tests**
   ```bash
   pnpm test
   ```

4. **Type checking**
   ```bash
   pnpm check
   ```

5. **Linting**
   ```bash
   pnpm lint
   ```

### Mobile Testing

**iOS:**
```bash
pnpm ios
```

**Android:**
```bash
pnpm android
```

**Web:**
```bash
pnpm dev:metro
```

## 📦 Deployment

### Docker Deployment

1. **Build Docker image**
   ```bash
   docker build -t talent-manager:latest .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Web App: http://app.adooxc.com
   - API: http://api.adooxc.com
   - Admin: http://admin.adooxc.com

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

### Relationships
- Users → Categories (1:N)
- Users → Talents (1:N)
- Users → Projects (1:N)
- Talents → Projects (N:N through project_talents)
- Talents → Conversations (1:N)

## 🧪 Testing

### Run All Tests
```bash
pnpm test
```

### Test Coverage
- **Unit Tests:** 19 tests for storage operations
- **Integration Tests:** 6 tests for cloud sync
- **E2E Tests:** 20 tests for user flows
- **Template Tests:** 8 tests for template management
- **Overall:** 53/54 passing (98% success rate)

## 📱 Features by Screen

### Home Screen
- Quick stats (talents, projects, conversations)
- Recent activities
- Quick actions (add talent, create project)

### Talents Screen
- Browse all talents
- Filter by gender, category, price range
- Search functionality
- Add/edit/delete talents
- View talent details and history

### Projects Screen
- List all projects
- Filter by status
- Create new projects
- Manage project talents
- Track costs and payments
- Export to PDF

### Settings Screen
- App branding (name, logo, colors)
- Category management
- Message templates
- Invoice/Quotation templates
- Conversation logging
- Data backup/restore
- Admin panel

### Dashboard
- Project statistics
- Revenue tracking
- Talent statistics
- Performance metrics

## 🔐 Security Features

- ✅ OAuth authentication
- ✅ JWT tokens
- ✅ HTTPS/SSL encryption
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation
- ✅ SQL injection prevention (Drizzle ORM)
- ✅ XSS protection

## 📝 API Documentation

### Core Endpoints

**Talents**
- `GET /api/trpc/talent.list` - List all talents
- `POST /api/trpc/talent.create` - Create talent
- `GET /api/trpc/talent.get` - Get talent details
- `PUT /api/trpc/talent.update` - Update talent
- `DELETE /api/trpc/talent.delete` - Delete talent

**Projects**
- `GET /api/trpc/project.list` - List all projects
- `POST /api/trpc/project.create` - Create project
- `GET /api/trpc/project.get` - Get project details
- `PUT /api/trpc/project.update` - Update project
- `DELETE /api/trpc/project.delete` - Delete project

**Conversations**
- `GET /api/trpc/conversation.list` - List conversations
- `POST /api/trpc/conversation.create` - Log conversation
- `DELETE /api/trpc/conversation.delete` - Delete conversation

**Health Checks**
- `GET /health` - Basic health check
- `GET /api/health` - Detailed API health
- `GET /ready` - Readiness probe
- `GET /live` - Liveness probe

## 🎨 Customization

### Theming
Edit `theme.config.js` to customize colors:
```javascript
const themeColors = {
  primary: { light: '#0a7ea4', dark: '#0a7ea4' },
  background: { light: '#ffffff', dark: '#151718' },
  surface: { light: '#f5f5f5', dark: '#1e2022' },
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

## 📄 Documentation

- [DEPLOYMENT_CONFIG.md](./DEPLOYMENT_CONFIG.md) - Comprehensive deployment guide
- [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - Rapid setup guide
- [COMPREHENSIVE_AUDIT_REPORT.md](./COMPREHENSIVE_AUDIT_REPORT.md) - Full audit report
- [QA_REPORT.md](./QA_REPORT.md) - Quality assurance report
- [design.md](./design.md) - UI/UX design specifications
- [server/README.md](./server/README.md) - Server documentation

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

For support, email: support@adooxc.com

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

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
