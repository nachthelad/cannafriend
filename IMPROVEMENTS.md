# Improvements Backlog

Tareas pendientes para abordar cuando haya más contexto disponible.

---

## Performance

### [x] 1. Memoize expensive computations in `mobile-sessions.tsx`
**Priority: High**
**File**: `components/mobile/mobile-sessions.tsx`
**Done**: Wrapped all event handlers in `useCallback` (`handleSessionView`, `handleBackToList`, `handleSessionEdit`, `handleSessionDelete` in `MobileSessions`; all handlers in `SessionDetailView`). Wrapped derived values in `useMemo` (`sessionDate`, `startTime`, `endTime`, `timeRange`, `methodAndAmount`, `hasMultiplePhotos`). Extracted `parseIsoToHHMM` and `safeFormatTime` as module-level pure functions (eliminating duplication). Replaced `selectedSession` closure in `handleSessionEdit` with functional `setSelectedSession` update.

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

### [x] 5. Verificar Title Case en headings y botones (en inglés)
**Priority: Low**
**Done**: Aplicado Chicago-style Title Case en ~80 strings a través de 9 archivos: `common.json`, `dashboard.json`, `journal.json`, `plants.json`, `sessions.json`, `stash.json`, `reminders.json`, `auth.json`, `aiAssistant.json`. Se mantuvieron en minúscula preposiciones cortas (to, by, as, from) y artículos (a, an, the) según Chicago style. Se omitieron descripciones largas, placeholders y mensajes de validación.
