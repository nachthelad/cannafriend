# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CannaFriend is a bilingual (Spanish/English) Next.js PWA for tracking cannabis cultivation and consumption. It features plant diaries, AI-powered plant analysis, journaling, reminders, and image galleries.

## Commands

### Development
```bash
pnpm dev                    # Start development server
pnpm build                  # Build production version
pnpm start                  # Start production server
pnpm lint                   # Run ESLint
```

### Important Notes
- Uses pnpm as package manager (check pnpm-lock.yaml)
- ESLint and TypeScript errors are ignored during builds (see next.config.mjs)
- No test framework configured

## Architecture

### Tech Stack
- **Framework**: Next.js 15.2.4 with App Router
- **UI**: Tailwind CSS v4 + shadcn/ui components
- **Backend**: Firebase (Firestore, Auth, Storage)
- **State**: React hooks + Context providers
- **PWA**: Custom service worker implementation

### Key Dependencies
- Firebase ecosystem (firebase, firebase-admin)
- shadcn/ui with Radix UI primitives
- React Hook Form with Zod validation
- Recharts for data visualization
- Geist font family

### Project Structure

```
app/                        # Next.js App Router pages
├── api/                   # API routes
│   ├── admin/            # Admin endpoints
│   ├── ai-consumer/      # AI chat functionality
│   ├── analyze-plant/    # AI plant analysis
│   └── mercadopago/      # Payment integration
├── [various-pages]/      # Feature pages (dashboard, plants, etc.)
└── layout.tsx            # Root layout with providers

components/
├── auth/                 # Authentication components
├── common/               # Shared components
├── marketing/            # Landing page components
├── plant/                # Plant-specific components
├── providers/            # Context providers
└── ui/                   # shadcn/ui components

lib/                      # Core utilities and configurations
├── firebase*.ts          # Firebase setup and admin
├── *-config.ts          # Feature configurations
└── utils.ts              # Common utilities

hooks/                    # Custom React hooks
types/                    # TypeScript type definitions
```

### Firebase Architecture
- **Authentication**: Google Auth + email/password
- **Database**: Firestore with user-scoped collections
- **Storage**: User-specific image folders (`images/{userId}/`)
- **Security**: Comprehensive rules in firestore.rules and storage.rules

### Key Features
1. **Plant Management**: CRUD operations for plants with photos and logs
2. **AI Analysis**: Plant health analysis with GPT integration
3. **Journal System**: Activity logging (watering, feeding, training)
4. **Image Gallery**: Photo upload and management with Firebase Storage
5. **PWA**: Offline capability with custom service worker
6. **i18n**: Spanish/English support via context provider

### Data Models
- **Plant**: name, seedType, growType, photos, planting date
- **LogEntry**: type, date, notes, plant-specific data (watering, feeding, etc.)
- **EnvironmentData**: temperature, humidity, pH tracking

### Authentication Flow
- Firebase Auth with Google OAuth and email/password
- User data stored in `/users/{userId}` collections
- Premium features controlled by user roles/flags

### API Patterns
- Next.js API routes for server-side operations
- Firebase Admin SDK for backend operations
- Rate limiting implemented for AI endpoints
- MercadoPago integration for payments

### Development Practices
- TypeScript throughout with path aliases (`@/*`)
- Tailwind utility classes with shadcn/ui components
- Form handling with React Hook Form + Zod
- Error boundaries and toast notifications
- Mobile-first responsive design

## Environment Configuration

### Required Variables
```bash
# Firebase (already configured in codebase)
# reCAPTCHA (optional, disabled by default)
NEXT_PUBLIC_ENABLE_RECAPTCHA=true  # Enable reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=    # reCAPTCHA site key
```

### Optional Features
- reCAPTCHA: Disabled by default, enable with NEXT_PUBLIC_ENABLE_RECAPTCHA=true
- Google Ads: Conditionally loaded based on authentication state

## Important Files
- `firestore.rules` - Database security rules
- `storage.rules` - File upload security rules  
- `next.config.mjs` - Next.js configuration with PWA setup
- `components.json` - shadcn/ui configuration
- `lib/firebase.ts` - Client Firebase configuration
- `lib/firebase-admin.ts` - Server Firebase configuration

## Common Patterns
- Use existing plant-config.ts and log-config.ts for plant/log types
- Image uploads go through ImageUpload component to Firebase Storage
- All user data scoped to authenticated user ID
- Forms use React Hook Form with Zod schemas
- Responsive design with mobile-first approach
- i18n handled via LanguageProvider context