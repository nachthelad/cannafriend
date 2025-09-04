# Claude Development Notes

This file contains important development notes and configurations for Claude AI assistant when working on this project.

## Project Overview
CannaFriend is a comprehensive cannabis growing and consumption tracking application built with Next.js, React, and Firebase.

## Recent Major Updates (January 2025)

### ✅ Custom Hooks System Implementation

**Issue Addressed**: Repeated logic patterns across components leading to code duplication and maintenance overhead.

**Solution Implemented**: Created comprehensive custom hooks system to extract common patterns into reusable utilities.

#### Custom Hooks Created:
1. **useFormAuth** - Authentication form handling with loading states and error management
2. **useFirebaseCollection** - Firebase collection fetching with loading, error states, and realtime updates
3. **useFirebaseDocument** - Single Firebase document CRUD operations
4. **useAsync** - Generic async operation handler with loading/error states
5. **useToggle** - Boolean state management (password visibility, modals, etc.)
6. **useLoadingSteps** - Multi-step loading state management for complex operations
7. **usePagination** - Complete pagination logic and navigation
8. **useLocalStorage** - Type-safe localStorage management with SSR safety

**Usage Pattern**:
```typescript
// Import from centralized index
import { useFormAuth, useToggle, useLoadingSteps } from '@/hooks'

// Use in components
const { form, t, toast, handleFirebaseError } = useFormAuth<SignupFormData>({
  defaultValues: { email: '', password: '', confirmPassword: '' }
})
const { value: showPassword, toggle: togglePassword } = useToggle()
const { isLoading, startLoading, setStep, stopLoading } = useLoadingSteps()
```

### ✅ TypeScript & ESLint Configuration

**Completed**: Fixed all TypeScript strict checking errors and set up comprehensive ESLint configuration.

**Files Modified**:
- Fixed `useTranslation` hook usage in 4 files (journal, plants pages)
- Re-enabled TypeScript strict checking in `next.config.mjs`
- Created comprehensive `.eslintrc.json` configuration
- 240+ ESLint warnings identified and made non-blocking

### ✅ Testing Framework Setup

**Completed**: Full Jest + React Testing Library integration with comprehensive configuration.

**Testing Stack**:
- **Jest 30.x** with Next.js integration
- **React Testing Library** for component testing
- **jsdom** environment for DOM testing
- **Coverage reporting** with detailed HTML reports
- **Pre-configured mocks** for Next.js, Firebase, and i18n

**Test Commands**:
```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage reports
```

### ✅ Code Quality Improvements

**Completed**: Removed duplicate theme provider and improved component organization.

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
npm run dev       # Start development server
npm run build     # Build for production
npm run lint      # Run ESLint (240+ warnings identified, non-blocking)
npm run typecheck # Run TypeScript checks (strict checking enabled)
```

### Testing
```bash
npm run test          # Run all tests with Jest
npm run test:watch    # Run tests in watch mode for development
npm run test:coverage # Generate coverage reports in coverage/
```

### Package Management
```bash
pnpm add <package>    # Add new package
pnpm build           # Alternative build command
pnpm dev             # Alternative dev command
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

### Custom Hooks Architecture
- **Central Export**: All hooks available from `@/hooks` index
- **Type Safety**: Full TypeScript support with generic types
- **Reusable Patterns**: Authentication, Firebase operations, state management
- **Error Handling**: Consistent error management across hooks
- **Loading States**: Unified loading state management
- **Firebase Integration**: Hooks specifically for Firestore operations

#### Hook Categories:
1. **Authentication**: `useFormAuth` - Form handling for auth flows
2. **Firebase**: `useFirebaseCollection`, `useFirebaseDocument` - Database operations
3. **Async Operations**: `useAsync`, `useLoadingSteps` - Async state management
4. **UI State**: `useToggle`, `usePagination` - Component state utilities
5. **Storage**: `useLocalStorage` - Browser storage management

## Important Notes for Future Development

### Translation Best Practices
1. **Always specify namespace explicitly** in translation calls, even for default namespace
2. **Test translations** on both English and Spanish
3. **Follow established patterns** when adding new components
4. **Use appropriate namespace** for each feature area
5. **Update i18n config** when adding new namespaces

### Custom Hooks Best Practices
1. **Use custom hooks** for repeated patterns (auth forms, Firebase operations, loading states)
2. **Import from centralized index**: `import { useFormAuth, useToggle } from '@/hooks'`
3. **Leverage TypeScript generics** for type-safe data handling
4. **Follow established patterns** when creating new hooks
5. **Test hooks thoroughly** using React Testing Library

### Code Quality Standards
1. **TypeScript strict mode enabled** - Fix type errors immediately
2. **ESLint configured** - 240+ warnings identified, address gradually
3. **Testing required** - Write tests for new components and hooks
4. **Build must pass** - Always verify `npm run build` succeeds before committing

### Current Priorities (Next Tasks)
1. **GitHub Actions CI/CD** - Set up automated testing and deployment pipeline
2. **Standardize error handling** - Create consistent error patterns across application
3. **Address ESLint warnings** - Gradually fix the 240+ identified warnings

## Common Issues & Solutions

### Translation Keys Not Rendering
1. Check if namespace is loaded in parent page's `useTranslation`
2. Ensure explicit `{ ns: "namespace" }` specification
3. Verify translation keys exist in JSON files
4. Check JSON syntax validity

### Custom Hooks Issues
1. **Hook not found**: Ensure proper import from `@/hooks` index
2. **TypeScript errors**: Use proper generic types `useFormAuth<FormData>`
3. **Firebase operations failing**: Check user authentication state
4. **Loading states not working**: Verify proper `startLoading`/`stopLoading` calls

### Build/Development Issues
- Run `npm run typecheck` before committing (strict checking enabled)
- Use `npm run lint` to catch style issues (240+ warnings identified)
- Run `npm run test` to verify new functionality
- Test PWA functionality on mobile devices
- Verify `npm run build` passes before pushing changes

### Testing Issues
- Use `npm run test:watch` for development
- Check `coverage/` directory for test coverage reports
- Ensure mocks are properly configured in `jest.setup.js`
- Follow patterns in existing `__tests__/` directory