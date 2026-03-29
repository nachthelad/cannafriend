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

### [x] 3. Expand test coverage beyond utilities

**Priority: Medium**
**Done**: Added 40 new tests across 4 files (86 total, all passing):
- `__tests__/hooks/use-auth-user.test.ts` — 8 tests: auth state transitions, token error codes, signOut behavior, unsubscribe on unmount
- `__tests__/hooks/use-firebase-collection.test.ts` — 7 tests: enabled/user guards, `{userId}` path replacement, doc mapping, error handling, realtime mode, refetch
- `__tests__/components/plant-card.test.tsx` — 14 tests: photo/placeholder rendering, ENDED badge, compact mode, last activity labels, link href
- `__tests__/api/ai-assistant-route.test.ts` — 11 tests: auth/premium/rate-limit guards, input validation, topic guard (off-topic refusal, cannabis pass-through, image bypass)
- Fixed `jest.setup.js` to guard browser globals behind `typeof window !== 'undefined'` for node-env test files

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
