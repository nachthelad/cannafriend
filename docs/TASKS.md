# Cannafriend Development Tasks

This tracker lists the remaining work first (prioritized), followed by a consolidated list of what’s already completed. This keeps planning focused while preserving history and context.

## Remaining Tasks (Prioritized)

### PWA & Service Worker
- [x] Standardize to a single service worker in `public/sw.(ts|js)`
- [x] Precache app shell + key routes (`/`, `/plants`, `/journal`)
- [x] Add runtime caching: images (CacheFirst, ~30d), API/JSON (SWR ~60s), translations JSON (24h), `_next/static` (1y)
- [x] Add navigation preload + offline fallback at `app/offline/page.tsx`
- [x] Background Sync for failed POSTs to `/api/*`

### Rendering & Routing (Next.js)
- [x] Prefer Server Components by default where viable
- [x] Add Suspense streaming boundaries around heavy subtrees
- [x] Add explicit ISR where safe (`export const revalidate = 60`), and tag-based revalidation on writes
- [x] Virtualize long lists (plants/journal) with `@tanstack/react-virtual`

### Data & Firebase
- [ ] Ensure modular SDK imports everywhere (tree-shake)
- [x] Enable persistent local cache (IndexedDB + tab sync)
- [ ] First render from cache: `onSnapshot(..., { includeMetadataChanges: true })`
- [ ] Add composite indexes; apply query limits + cursors consistently
- [ ] Batch writes to reduce N+1 patterns
- [ ] Move heavier aggregations to server routes/Cloud Functions
- [ ] Client-side image resize + thumbnail generation on upload
- [ ] Cache user/profile docs with SWR keys + background refresh

### Bundles, Assets & Images
- [ ] Audit bundles with `@next/bundle-analyzer`; define page budgets
- [ ] Replace heavy libs where needed; prefer per-module imports
- [ ] Audit `next/image` usage for `sizes`, placeholders, AVIF/WebP
- [ ] Define width/height on images to prevent CLS; compress public assets

### Fonts & CSS
- [ ] Migrate to `next/font` with subsets + `display: swap`
- [ ] Preload only primary weights; avoid runtime Google CSS
- [ ] Tailwind cleanup: remove unused globals from `app/globals.css`

### Internationalization
- [ ] Load minimal namespaces per route; lazy import dictionaries
- [ ] Split large translation JSON; compress and cache via SW

### Edge & API Routes
- [ ] Convert simple GETs to `runtime = 'edge'` where feasible
- [ ] Add cache headers (`s-maxage=60, stale-while-revalidate=300`)
- [ ] Use revalidation tags and trigger on data writes

### Monitoring & Budgets
- [ ] Report Web Vitals via `instrumentation.ts` (Sentry/console)
- [ ] Add Lighthouse CI locally; track key scores
- [ ] Define and enforce bundle-size budgets

### Mobile Header Standardization (Remaining)
- [x] `/plants/[id]` - Plant detail page header pass
- [x] `/plants` - List header actions review
- [x] `/nutrients` and `/nutrients/new` - Apply standard header
- [x] `/reminders` - Header consistency
- [x] `/settings` - Header consistency
- [x] `/stash` - Header consistency
- [ ] `/ai-assistant` - Confirm desktop/mobile header UX

---

## Completed Tasks

### Rendering, Loading & Skeletons
- [x] Replaced in-page AnimatedLogo loaders with skeletons on key routes
- [x] Removed global `app/loading.tsx` spinner to avoid pre-skeleton flash
- [x] Route-level skeletons aligned with final desktop layouts (journal, AI)
- [x] Dynamic import splitting for heavy marketing views on home

### AI Assistant
- [x] Always show AI Assistant in desktop sidebar; redirect non‑premium to `ROUTE_PREMIUM`
- [x] AI chat skeleton updated to match AILayout (no extra top/sidebar skeletons)

### Journal
- [x] Consolidated to single `/journal/new` with Zod validation
- [x] Mobile calendar filter opens calendar directly (no intermediate step)
- [x] Added Amount + Unit component; persisted watering unit (ml/L/gal)
- [x] Added feeding unit (ml/L, g/L); show selected unit in entries and plant cards
 
### Nutrients
- [x] Added edit page `/nutrients/[id]/edit` with consistent UI
- [x] Delete confirmations via modal on `/nutrients`

### Plants
- [x] Reworked `/plants/new` to match `/sessions/new` layout (headers, inputs, actions)
- [x] Mobile plant page now shows latest ambient info (query order by `date desc`)

### Dashboard & Mobile Views
- [x] Mobile Dashboard skeletons (replaced AnimatedLogo) and consistent loading

### ESLint/Tooling
- [x] Added ESLint v9 flat config via `eslint.config.mjs` (VSCode compatibility)

### Reference: Optimization Roadmap (for context)
- Rendering & Routing (Server Components, ISR, Suspense)
- Data & Firebase (cache, indexes, batch writes)
- PWA SW (precache, runtime strategies, offline fallback, bg sync)
- Bundles & Images (analyzer budgets, CLS-safe images)
- Fonts & CSS (next/font)
- i18n (namespace loading)
- Edge & API (edge runtime + cache headers)
- Monitoring (web vitals, Lighthouse, budgets)
