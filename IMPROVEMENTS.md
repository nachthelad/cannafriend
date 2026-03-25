# Improvements Backlog

Tareas pendientes para abordar cuando haya más contexto disponible.

---

## Performance

### [ ] 1. Memoize expensive computations in `mobile-sessions.tsx`
**Priority: High**
**File**: `components/mobile/mobile-sessions.tsx` (1127 lines)
**Problem**: Zero use of `useCallback` or `useMemo`. Filter/sort/search operations run on every render, triggered on every keystroke.
**Fix**: Wrap filter/sort logic in `useMemo`, event handlers in `useCallback`. Consider splitting into smaller sub-components.

---

## Testing

### [ ] 2. Expand test coverage beyond utilities
**Priority: Medium**
**Files**: `__tests__/` (currently only utils, 2 API tests, firestore rules)
**Problem**: 22k+ lines of component code with zero component tests. Jest + RTL are already configured.
**Suggested targets**:
- `hooks/use-auth-user.ts` — auth state logic
- `hooks/use-firebase-collection.ts` — data fetching
- `components/plant/plant-card.tsx` — core UI
- `app/api/ai-assistant/route.ts` — topic guard and rate limit logic
