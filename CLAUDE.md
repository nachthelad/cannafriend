# Claude Development Notes

## Project Overview

Cannafriend is a cannabis growing and consumption tracking app built with **Next.js 15, React, Firebase, and TypeScript**. Primary language is Spanish (es), secondary is English (en). Features: plant tracking, grow journal, stash, nutrients, AI assistant, PWA.

## Directory Structure

```
app/                  # Next.js App Router pages
  [feature]/          # admin, dashboard, journal, plants, stash, nutrients,
                      # sessions, reminders, ai-assistant, settings, premium
  api/                # Server-side API routes
components/
  [feature]/          # Feature-specific components
  ui/                 # Shadcn/ui primitives
  mobile/             # Mobile-specific variants
  marketing/          # Landing page components
  skeletons/          # Loading skeletons
lib/
  constants.ts        # Shared constants (client + server)
  routes.ts           # All route constants
  firebase.ts         # Firebase client initialization
  firebase-admin.ts   # Firebase Admin (server only)
  suspense-utils.ts   # Suspense resource helpers
  locales/{en,es}/    # i18n translation files (15 namespaces)
hooks/                # Custom hooks (all exported from hooks/index.ts)
__tests__/            # Jest tests
```

## Environment Variables

Copy `.env.example` to `.env.local`. Required groups:

| Group | Variables |
|-------|-----------|
| Firebase Client | `NEXT_PUBLIC_FIREBASE_*` (6 vars + optional VAPID key) |
| Firebase Admin | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |
| OpenAI | `OPENAI_API_KEY`, `REQUIRE_PREMIUM_FOR_AI`, `AI_CHAT_RATELIMIT_*` |
| Payments | `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `MERCADOPAGO_ACCESS_TOKEN` |
| App | `NEXTAUTH_URL` |

## Commands

```bash
# Development
npm run dev           # Start dev server
npm run build         # Build for production
npm run typecheck     # TypeScript strict check

# Code quality
npm run lint          # ESLint (240+ warnings, non-blocking)
npm run lint:fix      # Auto-fix ESLint issues
npm run lint:unused   # Show unused vars only

# Testing
npm run test          # Run Jest
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report in coverage/
```

## Architecture Patterns

### Suspense Data Loading

**Rule**: Use `getSuspenseResource` + `<Suspense>` for all Firebase data fetching. Never use `useState` + `useEffect` + `isLoading` for data loading.

```typescript
import { getSuspenseResource } from "@/lib/suspense-utils";

function DataComponent({ userId }: { userId: string }) {
  const resource = getSuspenseResource(`data-${userId}`, () => fetchData(userId));
  const data = resource.read(); // suspends until ready
  return <div>{/* render */}</div>;
}

export function Component(props) {
  return (
    <Suspense fallback={<Skeleton />}>
      <DataComponent {...props} />
    </Suspense>
  );
}
```

Keep `useAuthUser` loading states (auth ≠ data loading), form submission loading, and component-specific operations (file uploads).

### Custom Hooks

All hooks imported from `@/hooks`:

```typescript
import { useFormAuth, useToggle, useLoadingSteps, useFirebaseCollection } from "@/hooks";
```

Available hooks: `useAuthUser`, `useFormAuth<T>`, `useFirebaseCollection`, `useFirebaseDocument`, `useAsync`, `useLoadingSteps`, `useToggle`, `usePagination`, `useLocalStorage`, `usePremium`, `useUserRoles`, `useHasPlants`, `useErrorHandler`, `useToast`, `useAppVersion`

### Internationalization

**Rule**: Always specify namespace explicitly. Never rely on default namespace.

```typescript
// ❌ Wrong — shows key instead of text
t("logType.watering");

// ✅ Correct
t("logType.watering", { ns: "journal" });
```

**Page level**: `useTranslation(["primary-namespace", "common"])`
**Component level**: `t("key", { ns: "namespace" })`

Available namespaces: `common`, `landing`, `auth`, `dashboard`, `plants`, `journal`, `stash`, `nutrients`, `sessions`, `reminders`, `aiAssistant`, `onboarding`, `premium`, `nav`, `validation`

### Route Constants

**Rule**: Always use constants from `lib/routes.ts`. Never hardcode strings like `"/plants"`.

```typescript
import { ROUTE_PLANTS, ROUTE_JOURNAL_NEW } from "@/lib/routes";
```

Constants: `ROUTE_HOME`, `ROUTE_LOGIN`, `ROUTE_DASHBOARD`, `ROUTE_ONBOARDING`, `ROUTE_PLANTS`, `ROUTE_PLANTS_NEW`, `ROUTE_JOURNAL`, `ROUTE_JOURNAL_NEW`, `ROUTE_STASH`, `ROUTE_STASH_NEW`, `ROUTE_NUTRIENTS`, `ROUTE_NUTRIENTS_NEW`, `ROUTE_REMINDERS`, `ROUTE_REMINDERS_NEW`, `ROUTE_SESSIONS`, `ROUTE_AI_ASSISTANT`, `ROUTE_SETTINGS`, `ROUTE_PREMIUM`, `ROUTE_ADMIN`, `ROUTE_PRIVACY`, `ROUTE_TERMS`

### Shared Constants

**Rule**: Constants used by both client and server go in `lib/constants.ts`. Never define shared constants inside API routes — they import `firebase-admin` which is server-only and will cause build errors in client components.

### Firebase Collections

```
users/{userId}
  plants/{plantId}
    logs/{logId}          # Grow journal entries
    environment/{docId}   # Environmental data
  reminders/{reminderId}
  nutrientMixes/{mixId}
```

Storage: `images/{userId}/{fileName}`

### Mobile Headers

Consistent pattern for pages with back navigation:

```jsx
{/* Mobile */}
<div className="md:hidden mb-4 p-4">
  <div className="flex items-center gap-3 mb-4">
    <Button variant="ghost" size="sm" onClick={handleBack} className="p-2">
      <ArrowLeft className="h-5 w-5" />
    </Button>
    <div className="flex-1">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
    <Button size="icon" onClick={actionHandler}><Icon className="h-5 w-5" /></Button>
  </div>
</div>

{/* Desktop */}
<div className="hidden md:block mb-6 p-6">
  <Button variant="ghost" size="sm" onClick={handleBack}>
    <ArrowLeft className="h-4 w-4 mr-2" />{t("back", { ns: "common" })}
  </Button>
  <div className="flex items-center justify-between mb-4">
    <div>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
    <Button size="icon" onClick={actionHandler}><Icon className="h-5 w-5" /></Button>
  </div>
</div>
```

## Commit Conventions

Think about **user experience impact**, not technical implementation.

| Type | Use when |
|------|----------|
| `fix(scope)` | Solves a user-facing bug or broken experience |
| `feat(scope)` | Adds completely new functionality |
| `enhance(scope)` | Improves existing working feature |
| `chore(scope)` | Internal changes, no user-facing impact |

Examples:
- `fix(ai): improve keyword detection for more intuitive plant conversations`
- `fix(forms): consolidate journal entry creation to single form`
- `feat(admin): add unified MercadoPago search functionality`
- `chore(ci): simplify GitHub Actions workflow`

## Common Issues

**Translation keys show instead of text**
1. Check namespace is loaded in page's `useTranslation([...])`
2. Verify explicit `{ ns: "namespace" }` in component call
3. Confirm key exists in both `en/` and `es/` JSON files

**Build fails: "server-only" dependency in client component**
→ Move the constant to `lib/constants.ts` and import from there

**Hook not found / TypeScript error**
→ Import from `@/hooks` (central index), use generics: `useFormAuth<FormData>`

**Firebase operation fails silently**
→ Check `useAuthUser` state — user may not be authenticated yet
