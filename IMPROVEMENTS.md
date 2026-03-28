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

## PWA

### [ ] 2. Agregar screenshots al manifest
**Priority: Medium**
**File**: `public/manifest.json`
**Problem**: Sin screenshots, el prompt de instalación de PWA es menos atractivo en navegadores modernos.
**Fix**: Crear screenshots (1280x720 landscape, 540x720 portrait) y agregarlos al manifest.

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

---

## UX / Copy

### [ ] 4. Evaluar virtualización en listas grandes
**Priority: Low**
**Files**: `components/plant/plant-grid.tsx`, `components/mobile/mobile-journal.tsx`
**Problem**: Si las listas de plantas o entradas de journal superan 50 items, el render puede degradarse.
**Fix**: Considerar `virtua` o `content-visibility: auto`.

### [ ] 5. Verificar Title Case en headings y botones (en inglés)
**Priority: Low**
**Problem**: Revisar los textos de botones de acción principales en inglés para asegurar Title Case según Chicago style.
**Fix**: Búsqueda manual en archivos de traducción `lib/locales/en/`.
