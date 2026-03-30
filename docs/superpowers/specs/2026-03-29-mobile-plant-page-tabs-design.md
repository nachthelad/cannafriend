# Mobile Plant Page — Tab Layout Redesign

**Date:** 2026-03-29
**Scope:** `MobilePlantPage` component + related types and container wiring
**Goal:** Replace the current long-scroll flat layout with a compact hero + 4-tab structure that is more mobile-friendly, discoverable, and fast to navigate.

---

## Problem

The current `MobilePlantPage` is a single long scroll page:
- Hero image takes **320px** (h-80) — eats half the screen before any data is visible
- Status info is a loose list (temp, humidity, lighting, pH, nutrients each as separate rows)
- Plant info (seed type, grow type, seed bank) appears below the action buttons — low discoverability
- Photos are managed through a hidden menu (hamburger) — not intuitive
- Delete button is visible at the bottom of every scroll — risky placement
- No visual grouping; user must scroll to see all content

---

## Design Decision

**Compact hero + 4-tab layout**, matching standard mobile app patterns (similar to Instagram / plant tracker apps).

Tabs (in order): **Estado → Diario → Info → Fotos**

The **global bottom nav** (`MobileBottomNav`, `fixed bottom-0 z-40`) is always visible and is **not affected** by this change. The tab strip sits inline within the page content (not fixed), and the existing `pb-32` on the Layout `<main>` already provides the clearance.

---

## Files to Change

| File | Change |
|------|--------|
| `components/mobile/mobile-plant-page.tsx` | Full rewrite — compact hero + tab layout |
| `types/mobile.ts` | Add `recentLogs?: LogEntry[]` to `MobilePlantPageProps` |
| `components/plant/plant-details-container.tsx` | Pass `logs.slice(0, 5)` as `recentLogs` to `MobilePlantPage` |

---

## Component Architecture

### Hero (compact, ~120px)

- Height: `h-28` (112px) — reduced from `h-80` (320px)
- Shows cover photo (or first photo, or green gradient placeholder)
- **No swipe** / image counter in hero — photos moved to their own tab
- Overlaid gradient (bottom-to-top black)
- Top overlay: `←` back button + `⋯` menu button (keep existing dropdown for photo actions)
- Bottom overlay: plant name (InlineEdit, white/bold/uppercase) + `● DÍA X · SeedType · GrowType` in green

### Tab Strip

```
[ Estado ] [ Diario ] [ Info ] [ Fotos ]
```

- `sticky top-0 z-10` so it stays visible while scrolling tab content
- Active tab: `text-green-400 border-b-2 border-green-400`
- Inactive: `text-muted-foreground`
- State: `useState<TabId>('estado')` where `type TabId = 'estado' | 'diario' | 'info' | 'fotos'`

### Tab Content Area

- Each tab renders conditionally based on active tab state
- No animation required (keep it simple and fast)
- `px-3 py-3` padding inside each tab

---

## Tab Content Specs

### Tab 1 — Estado

**Purpose:** Quick status snapshot + primary actions

Layout (top to bottom):
1. **Last watering chip** — only if `lastWatering` exists
   `💧 Último riego: hace N días` — green pill badge
   Uses `differenceInDays(new Date(), parseISO(lastWatering.date))`

2. **Stats grid** — 2×2 grid of stat cards
   Each card: icon box (colored bg) + value (white bold) + label (muted)

   | Slot | Icon | Value | Label | Source |
   |------|------|-------|-------|--------|
   | TL | 🌡️ blue bg | `{temp}°C` or `—` | Temperatura | `lastEnvironment?.temperature` |
   | TR | 💧 blue bg | `{hum}%` or `—` | Humedad | `lastEnvironment?.humidity` |
   | BL | ☀️ yellow bg | `{schedule}` or `—` | Iluminación | `lastLighting?.lightSchedule \|\| plant.lightSchedule` |
   | BR | 🔬 purple bg | `{ph}` or `—` | pH | `lastEnvironment?.ph` |

   > Remove the hardcoded fallback values (`"73°"`, `"50"`, `"18h"`) — show `—` when data is absent.

3. **Action buttons row**
   - `Ver Diario` (secondary, outline) → `Link href={/plants/${plant.id}/logs}`
   - `Agregar Log` (primary, green) → `Link href={/plants/${plant.id}/add-log}`

---

### Tab 2 — Diario

**Purpose:** At-a-glance recent activity + quick add

Layout:
1. List of last 5 `recentLogs` entries
   Each entry: colored icon box + type label + note snippet + relative date

   Icon colors by `log.type`:
   - `watering` → blue bg (`bg-blue-500/15`)
   - `feeding` → green bg (`bg-green-500/15`)
   - `training` → orange bg (`bg-orange-500/15`)
   - `environment` → purple bg (`bg-purple-500/15`)
   - `flowering` → pink bg (`bg-pink-500/15`)
   - other → gray bg

   Date display: `differenceInDays` from now — "hoy", "ayer", "hace Nd"

   If `recentLogs` is empty: empty state text `t("noLogs", { ns: "journal" })` or similar

2. **"＋ Agregar Registro"** full-width primary button → `Link href={/plants/${plant.id}/add-log}`

---

### Tab 3 — Info

**Purpose:** View and edit all plant metadata. Replace delete button from main scroll.

Two sections + danger zone:

**Section "Planta"** (`t("plantPage.details", { ns: "plants" })` or similar label):
- **Nombre** — `InlineEdit` (same as current hero InlineEdit, reuse existing `onSave` handler)
- **Edad** — read-only: `{daysSincePlanting} días` (green accent on number)

**Section "Características"**:
- **Tipo de semilla** — `Select` (same as current, reuse handler)
- **Tipo de cultivo** — `Select` (same as current, reuse handler)
- **Banco de semillas** — `InlineEdit` (same as current, reuse handler)

**Section "Zona de peligro"** (separated visually, red-tinted card):
- Delete plant — `AlertDialog` trigger with trash icon, same handler as current `onDelete`
- Only renders if `onDelete` prop is provided
- Remove the current full-width destructive button from the bottom of the page

---

### Tab 4 — Fotos

**Purpose:** Browse, add, manage photos

Layout:
1. **3-column thumbnail grid** using `plant.coverPhoto` + `plant.photos`
   - Cover photo gets a `★ Portada` badge (top-left, yellow)
   - Tap on any thumbnail → opens existing fullscreen image modal
   - Long-press or tap-hold on a thumbnail (use `onContextMenu` on web) → shows "Set as cover" / "Delete" options (or keep the existing `⋯` dropdown in the hero for those actions, whichever is simpler)

2. **"+" add cell** — last cell in the grid, dashed border, calls `onAddPhoto(plant)` on tap
   - Only renders if `onAddPhoto` is provided
   - Shows `Loader2` spinner if `photoUploadState === 'uploading'`

3. Empty state: if no photos and no `onAddPhoto` → show `<Leaf>` icon + "Sin fotos"

**Note on photo actions (set cover / delete):**
Keep the existing `⋯` dropdown menu in the hero for "Set as cover" and "Delete photo" actions. The hero image will show `allImages[currentImageIndex]` and the dropdown will act on the current index. The only difference is the hero no longer auto-navigates via swipe — to select a different image as current, the user taps a thumbnail in the Fotos tab to change `currentImageIndex`. This keeps the existing photo management logic intact with minimal changes.

---

## State Changes

### New prop: `recentLogs`

```typescript
// types/mobile.ts — MobilePlantPageProps
recentLogs?: LogEntry[];
```

### New state: `activeTab`

```typescript
// Inside MobilePlantPage
const [activeTab, setActiveTab] = useState<'estado' | 'diario' | 'info' | 'fotos'>('estado');
```

Keep all existing state (`showFullImage`, `currentImageIndex`, touch handlers, `menuOpen`).

### Container wiring

```typescript
// plant-details-container.tsx — inside JSX
<MobilePlantPage
  ...existing props...
  recentLogs={logs.slice(0, 5)}   // ADD THIS
/>
```

---

## What Does NOT Change

- `InlineEdit` component — no changes
- Firebase update logic (`updateDoc`, `invalidatePlantDetails`, `invalidatePlantsCache`, `onUpdate`)
- Full-screen image modal — keep as-is
- Touch swipe handlers — keep for fullscreen modal navigation
- `onAddPhoto` / `onRemovePhoto` / `onSetCoverPhoto` callbacks — keep as-is
- `MobileBottomNav` — not touched
- `PlantDetailsContainer` — only adds `recentLogs` prop pass-through
- Desktop layout (`hidden md:block`) — not touched

---

## i18n

No new translation keys needed. Existing keys cover all content:
- `t("plantPage.*", { ns: "plants" })` for section labels
- `t("viewLogs", { ns: "journal" })`, `t("addLog", { ns: "journal" })` for buttons
- `t("seedType.*", { ns: "plants" })`, `t("growType.*", { ns: "plants" })` for selects

One potential addition: an empty state for when there are no recent logs in the Diario tab — check if `"noLogs"` key exists in `journal` namespace before adding.

---

## Spec Self-Review

- **Placeholders:** None — all fields reference actual data sources
- **Consistency:** Tab order matches approved mockup (Estado/Diario/Info/Fotos)
- **Scope:** Single file rewrite + 2 small supporting changes — focused and implementable in one plan
- **Ambiguity resolved:**
  - Photo actions (cover/delete) stay in `⋯` hero menu, not duplicated in grid
  - `currentImageIndex` still used by hero + fullscreen modal
  - Swipe removed from hero (single cover photo shown), retained in fullscreen modal
  - Delete plant moved from scroll bottom to Info tab "Zona de peligro"
  - Hardcoded fallback values (`"73°"`, `"50"`) removed — show `—` instead
