# Claude Development Notes

This file contains important development notes and configurations for Claude AI assistant when working on this project.

## Project Overview
CannaFriend is a comprehensive cannabis growing and consumption tracking application built with Next.js, React, and Firebase.

## Recent Translation System Updates

### ✅ Completed i18n Improvements

**Issue Resolved**: Marketing components (hero-section, app-showcase, landing-footer, cta-section) were not rendering translations properly on the landing page.

**Root Cause**: The landing page (`app/page.tsx`) was only loading the `common` namespace, but marketing components needed access to landing-specific translations.

**Solution Implemented**:

#### 1. Created Dedicated Landing Namespace
- **Created**: `lib/locales/en/landing.json` and `lib/locales/es/landing.json`
- **Moved**: All marketing translations from `common.json` to `landing.json`
- **Added**: Landing namespace to i18n configuration in `components/providers/i18n-provider.tsx`

#### 2. Updated Parent Page
```typescript
// app/page.tsx
const { t } = useTranslation(["common", "landing"]); // Added landing namespace
```

#### 3. Updated Marketing Components
All components now explicitly specify namespace like other working pages:
```typescript
// Before:
t("hero.subtitle")

// After:
t("hero.subtitle", { ns: "landing" })
```

**Components Updated**:
- `components/marketing/hero-section.tsx`
- `components/marketing/app-showcase.tsx` 
- `components/marketing/landing-footer.tsx`
- `components/marketing/cta-section.tsx`

#### 4. Fixed Plant Card Watering Records
- **Updated**: `components/plant/plant-card.tsx` to use correct journal namespace
- **Fixed**: `t(\`watering.${method}\`, { ns: "journal" })` for watering method translations

### Translation Pattern
Follow the same pattern as `/plants` page:
1. **Page Level**: `useTranslation(["primary-namespace", "common", "other-namespaces"])`
2. **Component Level**: `t("translationKey", { ns: "specific-namespace" })`

## Commands to Remember

### Development
```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run lint    # Run linting
npm run typecheck # Run TypeScript checks
```

### Testing
```bash
npm test        # Run tests
npm run test:watch # Watch mode
```

## Key Architecture Notes

### Firebase Configuration
- Authentication with custom user profiles
- Firestore for data storage
- Storage for image uploads
- Security rules configured for user data isolation

### Internationalization (i18n)
- **Primary Language**: Spanish (es) - default and fallback
- **Secondary**: English (en)
- **Namespace Structure**:
  - `common`: Shared translations across app
  - `landing`: Marketing/landing page specific
  - `plants`: Plant management features
  - `journal`: Grow journal and logging
  - `auth`: Authentication forms
  - `dashboard`: Main dashboard
  - And others...

### Component Structure
- **Marketing Components**: Use `landing` namespace
- **App Components**: Use feature-specific namespaces
- **Shared UI**: Use `common` namespace

### PWA Features
- Installable app experience
- Offline functionality
- Push notifications support
- Optimized mobile performance

## Important Notes for Future Development

1. **Always specify namespace explicitly** in translation calls, even for default namespace
2. **Test translations** on both English and Spanish
3. **Follow established patterns** when adding new components
4. **Use appropriate namespace** for each feature area
5. **Update i18n config** when adding new namespaces

## Common Issues & Solutions

### Translation Keys Not Rendering
1. Check if namespace is loaded in parent page's `useTranslation`
2. Ensure explicit `{ ns: "namespace" }` specification
3. Verify translation keys exist in JSON files
4. Check JSON syntax validity

### Build/Development Issues
- Run `npm run typecheck` before committing
- Use `npm run lint` to catch style issues
- Test PWA functionality on mobile devices