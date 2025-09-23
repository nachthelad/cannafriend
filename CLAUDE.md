# Claude Development Notes

This file contains important development notes and configurations for Claude AI assistant when working on this project.

## Project Overview

Cannafriend is a comprehensive cannabis growing and consumption tracking application built with Next.js, React, and Firebase.

## Recent Major Updates (January 2025)

### ✅ Suspense Data Loading Architecture (Sept 2025)

**Issue Addressed**: Redundant `isLoading` states throughout the application causing duplicate loading logic and maintenance overhead.

**Problem**: Multiple components had complex loading states that duplicated functionality now handled by Suspense boundaries:

- Journal page had 140+ lines of loading logic including data fetching, pagination, and skeletons
- Mobile components received `isLoading` props but used containers with Suspense
- Pages had auth loading skeletons that duplicated Suspense component skeletons

**Solution Implemented**: **Suspense-First Data Loading Pattern**

#### **Architecture Overview**:

```typescript
// Suspense utility pattern
import { getSuspenseResource } from "@/lib/suspense-utils";

function DataComponent({ userId }: { userId: string }) {
  const cacheKey = `data-${userId}`;
  const resource = getSuspenseResource(cacheKey, () => fetchData(userId));
  const data = resource.read(); // Suspends component until data ready

  return <div>{/* Render with data */}</div>;
}

// Wrapper with Suspense boundary
export function Component(props) {
  return (
    <Suspense fallback={<ProperSkeleton />}>
      <DataComponent {...props} />
    </Suspense>
  );
}
```

#### **Components Updated**:

1. **Journal System**:

   - `app/journal/page.tsx` - Removed 140+ lines of loading logic
   - `components/mobile/mobile-journal.tsx` - Converted to Suspense pattern
   - `components/journal/journal-grid.tsx` - Already using Suspense

2. **Page Components**:

   - `app/stash/page.tsx` - Removed auth loading skeleton (15 lines)
   - `app/nutrients/page.tsx` - Removed auth loading skeleton (17 lines)
   - `app/plants/page.tsx` - Uses containers with Suspense

3. **Container Components** (already implemented):
   - `components/dashboard/dashboard-container.tsx`
   - `components/plant/plant-grid.tsx`
   - `components/plant/mobile-plant-container.tsx`
   - `components/stash/stash-container.tsx`
   - `components/nutrients/nutrients-container.tsx`

#### **Benefits Achieved**:

- **Reduced bundle size** - Eliminated ~170 lines of duplicate loading code
- **Simplified state management** - Data fetching handled by Suspense utilities
- **Better UX** - Proper skeletons from Suspense instead of generic loaders
- **Code consistency** - All data-heavy components use same pattern
- **Maintainability** - Single source of truth for data fetching per component

#### **Suspense Pattern Rules**:

1. **Data Loading**: Use `getSuspenseResource` + Suspense boundaries for all Firebase data fetching
2. **Auth Loading**: Keep `useAuthUser` loading states - different from data loading
3. **Form Loading**: Keep form submission loading - user action feedback
4. **Component Loading**: Keep component-specific operations (file uploads, etc.)

**IMPORTANT**: When adding new data-fetching components, always use the Suspense pattern instead of `useState` + `useEffect` + `isLoading`.

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
import { useFormAuth, useToggle, useLoadingSteps } from "@/hooks";

// Use in components
const { form, t, toast, handleFirebaseError } = useFormAuth<SignupFormData>({
  defaultValues: { email: "", password: "", confirmPassword: "" },
});
const { value: showPassword, toggle: togglePassword } = useToggle();
const { isLoading, startLoading, setStep, stopLoading } = useLoadingSteps();
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
t("hero.subtitle");

// After:
t("hero.subtitle", { ns: "landing" });
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

### Code Quality & Unused Variable Detection

```bash
npm run lint           # See all issues including unused variables/imports
npm run lint:fix       # Auto-fix what's possible (some unused vars need manual fix)
npm run lint:unused    # Show only unused variable warnings
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

### ✅ Unused Variable Detection Setup (Jan 2025)

**Issue Addressed**: Remove unused imports and variables to improve code quality and reduce bundle size.

**Configuration Implemented**:

1. **ESLint Rules** (`.eslintrc.json`):

   ```json
   "@typescript-eslint/no-unused-vars": [
     "warn",  // Won't block builds, shows as warnings
     {
       "argsIgnorePattern": "^_",      // Allow unused args starting with _
       "varsIgnorePattern": "^_",      // Allow unused vars starting with _
       "ignoreRestSiblings": true      // Allow unused in destructuring
     }
   ]
   ```

2. **TypeScript Config** (`tsconfig.json`):
   ```json
   // Disabled for builds to prevent blocking deployments
   // "noUnusedLocals": true,
   // "noUnusedParameters": true,
   ```

**Usage**:

- **IDE**: Shows red squiggly lines under unused variables/imports
- **Commands**: Use `npm run lint` to see warnings, `npm run lint:fix` for auto-fixes
- **Builds**: ✅ Won't block builds or deployments (warnings only)
- **Cleanup**: Fix gradually as you work on files or dedicate cleanup sessions

**Benefits**:

- Continuous visibility of unused code
- Can deploy while gradually cleaning up
- Better code quality and smaller bundles
- IDE integration for immediate feedback

### Code Consistency Standards

**CRITICAL: Always Follow Existing Patterns**

When editing files, you MUST follow the exact same patterns used in that file:

1. **Route Constants**: Always use route constants from `lib/routes.ts` (e.g., `ROUTE_ADMIN`, `ROUTE_PLANTS`) instead of hardcoded strings like `"/admin"`
2. **Import Patterns**: Follow the same import structure and grouping as existing code
3. **Component Patterns**: Use the same props, styling, and structure as similar components in the file
4. **Hook Usage**: Follow the same hook patterns and custom hook usage as existing code
5. **Translation Patterns**: Use the same translation namespace and key patterns as existing code
6. **Styling Patterns**: Follow existing className patterns and component composition

**Examples of Following Patterns:**

- If other buttons use `ROUTE_PLANTS`, use `ROUTE_ADMIN` not `"/admin"`
- If other components use specific translation namespaces, use the same approach
- If other functions use specific error handling, use the same patterns
- If other hooks use specific custom hooks, use the same ones

**This ensures code consistency and prevents introducing inconsistencies or breaking existing patterns.**

### ✅ GitHub Actions CI/CD (Simplified)

**Issue Addressed**: Over-engineered CI/CD setup was too complex for a small webapp with no active users.

**Solution Implemented**: Simplified to essential checks only.

**Current CI Workflow**: Basic quality checks that run on every push/PR:

1. **Install dependencies** - `pnpm install --frozen-lockfile`
2. **TypeScript checking** - `pnpm run typecheck`
3. **Run tests** - `pnpm run test`
4. **Build verification** - `pnpm run build`

**Removed Complex Features**:

- SonarCloud code quality analysis
- Trivy security scanning
- CodeQL security analysis
- Weekly security audits
- Dependency review automation
- Performance testing with Lighthouse
- Multiple Node.js version testing

**Philosophy**: Keep it simple until you have active users and team members. Focus on building features, not perfect CI/CD.

## ✅ Form Architecture Consolidation (Sept 2025)

### **Issue Addressed**: Duplicate form code and inconsistent translation namespacing

**Problem**: Had duplicate form implementations for journal entry creation:

- `components/journal/add-log-form.tsx` - Complex form with manual validation
- `app/journal/new/page.tsx` - Superior form with Zod validation and better UX
- Different translation namespace usage causing key display instead of translated text

**Solution Implemented**: **Single Source of Truth Architecture**

#### **✅ Consolidated Journal Entry Creation**

**Before**:

- **Two forms**: `AddLogForm` component + `/journal/new` page
- **Different validation**: Manual validation vs Zod schema
- **Inconsistent UX**: Different mobile experiences and error handling
- **Translation issues**: Mixed namespace usage showing keys instead of text

**After**:

- **Single form**: Only `/journal/new` page with superior implementation
- **Plant preselection**: URL parameters `?plantId=${id}&returnTo=plant`
- **Smart navigation**: Returns to plant page when coming from plant context
- **Consistent namespacing**: All translations use proper `{ ns: "namespace" }` syntax

#### **✅ URL Flow Architecture**

```
/plants/[id]/add-log → (redirects to) → /journal/new?plantId=${id}&returnTo=plant
```

**Navigation Logic**:

- **From plant page**: Returns to `/plants/${id}` after save/cancel/back
- **From journal page**: Returns to `/journal` after save/cancel/back
- **Seamless UX**: Users don't notice the redirect

#### **✅ Mobile Header Standardization**

**Implemented consistent header pattern across plant-related pages**:

```jsx
{
  /* Mobile Header */
}
<div className="md:hidden mb-4 p-4">
  <div className="flex items-center gap-3 mb-4">
    <Button variant="ghost" size="sm" onClick={handleBack} className="p-2">
      <ArrowLeft className="h-5 w-5" />
    </Button>
    <div className="flex-1">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
    <Button size="icon" onClick={actionHandler}>
      <ActionIcon className="h-5 w-5" />
    </Button>
  </div>
</div>;

{
  /* Desktop Header */
}
<div className="hidden md:block mb-6 p-6">
  <div className="flex items-center gap-3 mb-4">
    <Button variant="ghost" size="sm" onClick={handleBack}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      {t("back", { ns: "common" })}
    </Button>
  </div>
  <div className="flex items-center justify-between mb-4">
    <div>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
    <Button size="icon" onClick={actionHandler}>
      <ActionIcon className="h-5 w-5" />
    </Button>
  </div>
</div>;
```

#### **✅ Translation Namespace Standards**

**Fixed all translation calls to use explicit namespaces**:

```jsx
// ❌ Before - Shows keys instead of text
t("logType.watering");
t("journal.selectPlant");
t("validation.required");

// ✅ After - Shows translated text
t("logType.watering", { ns: "journal" });
t("selectPlant", { ns: "journal" });
t("required", { ns: "validation" });
```

### **Benefits Achieved**:

1. **Code Maintainability**: Single form to maintain instead of duplicates
2. **Better UX**: Zod validation, larger touch targets, proper error display
3. **Consistent Design**: Standardized headers across plant pages
4. **Translation Reliability**: All keys display properly translated text
5. **Smaller Bundles**: Eliminated duplicate form code
6. **Mobile Optimization**: Buttons positioned correctly above bottom navbar

### ✅ Constants Architecture (Sept 2025)

**Issue Addressed**: Client components importing from server-only API routes causing build errors.

**Problem**: Admin email constant was defined in server-only API route (`app/api/admin/users/route.ts`) but imported by client components (`app/admin/page.tsx`, `app/dashboard/page.tsx`), creating build errors due to `firebase-admin` "server-only" dependency chain.

**Solution Implemented**: **Shared Constants Pattern**

#### **Constants Architecture**:

```typescript
// lib/constants.ts - Shared constants for client & server
export const ADMIN_EMAIL = "nacho.vent@gmail.com" as const;
```

**Import Pattern**:

```typescript
// ✅ Client components
import { ADMIN_EMAIL } from "@/lib/constants";

// ✅ Server components/API routes
import { ADMIN_EMAIL } from "@/lib/constants";
```

**Files Updated**:

- **Created**: `lib/constants.ts` - Centralized constants file
- **Updated**: `app/api/admin/users/route.ts` - Import from constants
- **Updated**: `app/admin/page.tsx` - Fixed client-side import
- **Updated**: `app/dashboard/page.tsx` - Fixed client-side import

#### **Pattern for Future Constants**:

When adding constants that need to be accessed by both client and server code:

1. **Add to `lib/constants.ts`** - Never define in API routes
2. **Import from constants** - Both client and server import from same file
3. **Avoid server-only dependencies** - Keep constants file clean of Firebase Admin, etc.

**Common constants to move here**:

- Configuration values used across components
- Feature flags and toggles
- Default values and limits
- Email addresses and identifiers

### ✅ AI Assistant Context Improvements (Sept 2025)

**Issue Addressed**: AI assistant rejecting valid cannabis-related questions due to insufficient keyword detection and lack of conversation context awareness.

**Problem**:

- AI would reject questions like "la planta está caída, fertilizante Mantra Nitro" despite being clearly cannabis-related
- After establishing cannabis context, subsequent plant questions (temperature, humidity, watering) were rejected
- Only ~25 keywords were recognized, missing common plant care terms

**Solution Implemented**: **Enhanced Keyword Detection & Context Awareness**

**Changes Made**:

1. **Expanded keywords**: From 25 to 300+ terms including environment, nutrients, problems, equipment
2. **Context memory**: If "cannabis"/"cultivo" mentioned anywhere in conversation, plant terms become valid
3. **Specific brands**: Added "mantra", "nitro", "monstruoso" and other fertilizer names
4. **Environmental terms**: "temperatura", "humedad", "indoor", "grados", "celsius"

**Files Updated**:

- **Modified**: `app/api/ai-assistant/route.ts` - Enhanced `isCannabisRelated()` and added `isContextuallyOnTopic()`

### Current Priorities (Next Tasks)

1. **Standardize mobile headers** - Apply consistent header pattern to remaining pages
2. **Move shared constants** - Identify and move other constants from server-only locations
3. **Address ESLint warnings** - Gradually fix the 240+ identified warnings

## Commit Naming Conventions

**IMPORTANT: When suggesting commit names, consider the actual impact and user experience, not just code changes.**

### Commit Type Guidelines:

- **`fix(component)`** - Solves existing user experience issues, bugs, or problems

  - Use when: Users report something not working as expected
  - Example: AI rejecting valid questions, translations not showing, forms failing

- **`feat(component)`** - Adds completely new functionality or major features

  - Use when: Adding new pages, new user-facing features, new integrations
  - Avoid for: Improvements to existing functionality

- **`enhance(component)`** - Improves existing functionality without fixing bugs

  - Use when: Performance improvements, better UX for working features

- **`chore(component)`** - Internal improvements with no user-facing impact
  - Use when: Code refactoring, dependency updates, build improvements

### Examples from Recent Work:

✅ **Correct**: `fix(ai): improve keyword detection for more intuitive plant conversations`

- Reason: Solves user problem where AI rejected valid questions

❌ **Incorrect**: `feat(ai): enhance keyword detection and context awareness`

- Reason: This fixes an existing issue, doesn't add new functionality

✅ **Correct**: `fix(forms): consolidate journal entry creation to single form`

- Reason: Fixes duplicate forms causing inconsistent UX

✅ **Correct**: `feat(admin): add unified MercadoPago search functionality`

- Reason: Completely new admin feature

**Philosophy**: Think about the user experience impact, not the technical implementation. If it solves a problem users were having, it's a `fix`.

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
