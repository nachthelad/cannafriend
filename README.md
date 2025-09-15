## Cannafriend 🌱

Your complete cannabis cultivation companion. A modern PWA designed for growers and consumers to track, manage, and optimize their cannabis experience with powerful AI-assisted insights.

### 🚀 Key Features

- **🤖 AI Plant Analysis**: Upload photos and get intelligent insights about plant health, deficiencies, pests, and care recommendations
- **📔 Grow Journal**: Comprehensive logging system for watering, feeding, training, environmental data, and notes
- **📅 Smart Reminders**: Never miss watering, feeding, or maintenance schedules with customizable notifications
- **📸 Photo Documentation**: Visual progress tracking with organized galleries and time-lapse capabilities
- **📱 Mobile-First PWA**: Install as an app for seamless mobile experience with offline functionality
- **🌍 Internationalization**: Full support for English and Spanish with easy language switching

### ✨ Latest Updates

#### 🤖 AI Analysis System

- **AI Assistant Page**: `/ai-assistant` - Interactive AI chat for plant analysis and growing advice
- **Universal AI Help**: Ask anything about cannabis cultivation, get expert recommendations
- **Photo Analysis**: Upload plant photos for automated health assessments
- **Analysis History**: All AI interactions are saved and accessible anytime
- **Smart Recommendations**: Personalized advice based on your specific growing conditions

#### 🌐 Enhanced Translation System

- **Improved i18n**: Comprehensive translation support across all components
- **Landing Page Translations**: Fully localized marketing content
- **Namespace Organization**: Structured translation system for better maintainability
- **Dynamic Language Switching**: Seamless experience in both Spanish and English

#### 📱 Premium Features

### Payments & Premium (Stripe / MercadoPago)

- Premium access is controlled via Firebase custom claims.
- Automatic granting via webhooks:
  - Stripe: `app/api/stripe/webhook/route.ts` marks `premium: true` for active subscriptions; revokes on cancellation.
  - MercadoPago: `app/api/mercadopago/webhook/route.ts` supports both:
    - `payment`/`authorized_payment` approved → grants premium and sets `premium_until` ≈ 31 days.
    - `preapproval` active/authorized → grants premium. Cancelled/paused does not auto‑revoke; access expires by `premium_until` or admin toggle.
- Client reads premium via `hooks/use-premium.ts` (checks `premium` or `premium_until > now`).
- After returning from MercadoPago, `/premium?status=completed` triggers claim sync and token refresh.

Configuration
- Env var: `MERCADOPAGO_ACCESS_TOKEN` (production token APP_USR‑…)
- Webhook URL (MercadoPago): `https://www.cannafriend.app/api/mercadopago/webhook`
- For Stripe, configure your webhook secret and price ID per your account.

Admin Tools
- Unified search at `/admin` lets you search MercadoPago payments and subscriptions by email or UID (`external_reference`), view status/date, and Reprocess to grant premium if appropriate.


- **AI Access Control**: Advanced AI features available for authorized users
- **Enhanced Dashboard**: Premium users get additional insights and features
- **Priority Support**: Dedicated assistance for premium subscribers

### 🎯 How It Works

#### 🏠 **Dashboard**

Your cultivation command center with:

- Overview of all plants and their status
- Quick access to reminders and recent activities
- Growth statistics and insights
- Direct access to AI assistance

#### 🌱 **Plant Management**

- Add and track multiple plants with detailed profiles
- Monitor growth stages (vegetative, flowering)
- Track strain information and growing conditions
- Visual progress with photo galleries

#### 📔 **Grow Journal**

- Log watering schedules with amounts and methods
- Track feeding with NPK ratios and nutrients
- Record training techniques (LST, topping, defoliation)
- Environmental monitoring (temperature, humidity, pH)
- Add notes and observations

#### 🤖 **AI Assistant**

1. Navigate to "AI Assistant" (`/ai-assistant`)
2. Upload a plant photo or ask a general question
3. Get personalized recommendations and insights
4. Review analysis history and previous conversations
5. Apply AI suggestions to improve your grow

#### 📅 **Reminders System**

- Set custom watering and feeding schedules
- Get notifications for maintenance tasks
- Track overdue activities
- Sync across all devices

### 💾 What CannaFriend Stores

#### 🔐 **Your Growing Data**

- **Plant Profiles**: Names, strains, planting dates, growth stages
- **Journal Entries**: Detailed logs of all activities with timestamps
- **Photo Libraries**: Visual documentation linked to specific plants
- **Environmental Data**: Temperature, humidity, pH measurements
- **AI Interactions**: Chat history, analysis results, and recommendations

#### 🔒 **Privacy & Security**

- All data is securely stored in your personal account
- Photos and analysis are encrypted and private
- No sharing of personal cultivation data
- Full account deletion available in settings

### 🛡️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **UI**: React with TypeScript, Tailwind CSS
- **Database**: Firebase Firestore for scalable data storage
- **Authentication**: Firebase Auth with custom user profiles
- **Storage**: Firebase Storage for image handling
- **PWA**: Service Worker for offline functionality
- **Internationalization**: React-i18next for multi-language support
- **AI Integration**: OpenAI API for plant analysis and recommendations

### ❓ Frequently Asked Questions

**Q: Do I need internet connection?**
A: CannaFriend works offline for basic functionality (viewing plants, reading journal entries). Internet is required for syncing data, uploading photos, and AI features.

**Q: Can I access my data from multiple devices?**
A: Yes! Your account syncs across all devices. Sign in anywhere to access your complete grow history.

**Q: How does the AI analysis work?**
A: Upload plant photos or ask questions via the AI Assistant. Our AI analyzes images for health issues, nutrient deficiencies, pests, and provides personalized growing advice.

**Q: Is my growing data private?**
A: Absolutely. All data is encrypted and stored securely in your personal account. We never share or sell cultivation information.

**Q: Can I use this for commercial grows?**
A: CannaFriend is designed for personal cultivation tracking. For commercial operations, contact us about enterprise solutions.

### 🚀 Getting Started

1. **Visit**: [CannaFriend Web App](https://cannafriend.app)
2. **Sign Up**: Create your account with email authentication
3. **Add Plants**: Start by adding your first plant profile
4. **Begin Logging**: Record your first watering or feeding
5. **Try AI**: Upload a plant photo for instant analysis
6. **Install PWA**: Add to home screen for app-like experience

### 🛠️ Setup

1. Copy `.env.example` to `.env` and fill in your Firebase credentials:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
2. Install dependencies with `npm install` (or your preferred package manager).
3. Start the development server with `npm run dev`.
