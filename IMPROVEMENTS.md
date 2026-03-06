# Improvements Backlog

Tasks identified from codebase review. Ordered roughly by impact/priority.

---

## Security

### [x] 1. Fix rate limiter — in-memory Map doesn't work in serverless
**File**: `lib/rate-limit.ts`
**Problem**: The `Map` is module-scoped. Each cold-start serverless instance gets a fresh map, so users hitting different instances bypass rate limiting entirely. The AI endpoint has no real rate limiting in production.
**Fix**: Replace with a persistent store. Options:
- Upstash Redis (free tier, Vercel integration)
- Vercel KV
- Alternatively, use Vercel's built-in rate limiting middleware

---

### [x] 2. Add CSP headers to all app pages
**File**: `next.config.mjs`
**Problem**: `Content-Security-Policy` headers are only set for `/sw.js`. All app pages (journal, sessions, stash, etc.) have no CSP — leaving them vulnerable to XSS via user-generated content.
**Fix**: Add a global `headers()` entry for `source: "/(.*)"` with appropriate CSP policy. At minimum add `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy`.

---

## Architecture / Correctness

### [x] 3. Fix Suspense cache memory leak / stale data risk
**File**: `lib/suspense-utils.ts`, `lib/suspense-cache.ts`
**Problem**: Module-level `Map` grows unboundedly. Manual cache invalidation means a forgotten `clearSuspenseCache()` call silently serves stale data.
**Options**:
- Add TTL to cache entries (e.g. expire after 60s)
- Migrate to React Query / SWR which handle expiry and revalidation automatically

---

### [x] 4. Fix `useFirebaseCollection` — `JSON.stringify(constraints)` as dependency
**File**: `hooks/use-firebase-collection.ts:165`
**Problem**: Firestore `QueryConstraint` objects are class instances with non-enumerable properties. `JSON.stringify` may always produce `{}`, meaning the effect never re-runs when constraints change.
**Fix**: Derive a stable key from the actual constraint values instead of serializing the objects.

---

### [x] 5. Replace `require()` with dynamic `import()` for Firebase Analytics
**File**: `lib/firebase.ts:53`
**Problem**: Uses CommonJS `require("firebase/analytics")` inside a `try/catch`. This bypasses TypeScript module resolution and is inconsistent with the rest of the codebase.
**Fix**: Use `import("firebase/analytics")` (dynamic ESM import).

---

## Cleanup / Dead Code

### [ ] 6. Remove deprecated `resolveHomePathForRoles` and replace all call sites
**File**: `lib/routes.ts:55`
**Problem**: Marked `@deprecated`, always returns `ROUTE_DASHBOARD`, still called in 5+ pages (journal, premium, reminders x2, settings, etc.).
**Fix**: Replace every call site with `ROUTE_DASHBOARD` directly, then delete the function.

---

### [ ] 7. Remove `openai` package or use the SDK properly
**File**: `app/api/ai-assistant/route.ts`, `package.json`
**Problem**: The `openai` npm package is listed as a dependency but the route calls the OpenAI API via raw `fetch()`. The SDK adds bundle weight with no benefit.
**Fix**: Either switch to using the `openai` SDK client (cleaner, typed responses), or remove the package from `package.json`.

---

### [ ] 8. Add `ROUTE_AI_ASSISTANT` to `AppPath` type
**File**: `lib/routes.ts`
**Problem**: `ROUTE_AI_ASSISTANT` is exported but missing from the `AppPath` union type.
**Fix**: Add `| typeof ROUTE_AI_ASSISTANT` to the union. Also consider removing the `| string` escape hatch at the end — it makes the type provide no actual safety.

---

## Performance

### [ ] 9. Memoize expensive computations in `mobile-sessions.tsx`
**File**: `components/mobile/mobile-sessions.tsx` (1127 lines)
**Problem**: Zero use of `useCallback` or `useMemo`. Filter/sort/search operations run on every render, triggered on every keystroke.
**Fix**: Wrap filter/sort logic in `useMemo`, event handlers in `useCallback`. Consider splitting into smaller sub-components.

---

### [ ] 10. Reduce `useAuthUser` forced token refreshes
**File**: `hooks/use-auth-user.ts:19`
**Problem**: Calls `getIdToken(true)` (force refresh) on every `onAuthStateChanged` event. This hits Firebase on every page load, tab focus, and reconnect — adding latency and unnecessary network calls.
**Fix**: Remove the `true` flag. Only force-refresh when an API call returns a 401, then retry.

---

## Reliability

### [ ] 11. Add ErrorBoundaries to all Suspense boundaries
**Files**: `components/` (Suspense used in 14 components, ErrorBoundary in only 2)
**Problem**: Without an ErrorBoundary wrapping each Suspense, any fetch failure propagates to the page root and shows a blank screen.
**Fix**: Create a reusable `<DataErrorBoundary>` component and wrap every `<Suspense>` with it.

---

## Dependencies

### [ ] 12. Pin `"latest"` dependencies to specific versions
**File**: `package.json`
**Problem**: 18+ packages use `"latest"` (firebase, firebase-admin, react-hook-form, recharts, workbox-*, etc.). A fresh `pnpm install` after deleting the lockfile can pull breaking changes.
**Fix**: Run `pnpm ls` to get current installed versions and pin them in `package.json` with caret ranges (e.g. `"^10.0.0"`).

---

## Testing

### [ ] 13. Expand test coverage beyond utilities
**Files**: `__tests__/` (currently only utils, 2 API tests, firestore rules)
**Problem**: 22k+ lines of component code with zero component tests. Jest + RTL are already configured.
**Suggested targets**:
- `hooks/use-auth-user.ts` — auth state logic
- `hooks/use-firebase-collection.ts` — data fetching
- `components/plant/plant-card.tsx` — core UI
- `app/api/ai-assistant/route.ts` — topic guard and rate limit logic
