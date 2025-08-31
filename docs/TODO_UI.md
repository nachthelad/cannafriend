# Mobile UI Development TODO

## Priority 1: Core Mobile Experience

### ✅ Completed

#### 1. Mobile-optimized dashboard component with role-based widgets ✅

- [x] Create mobile dashboard layout with single-column widget stack
- [x] Implement role-based widget rendering (grower vs consumer)
- [x] Add touch-friendly quick action buttons
- [x] Optimize widget cards for mobile viewport
- [x] Test responsive breakpoints and interactions
- [x] Build succeeds without errors
- [x] **FIX: Replace hardcoded text with translation keys**

**Implementation details:**

- Created `components/mobile/mobile-dashboard.tsx` with mobile-first design
- Integrated responsive dashboard that shows mobile version on screens < 768px
- Added role-based stats cards (plants, logs, nutrients, growth metrics)
- Implemented touch-friendly quick action buttons with proper spacing
- Added empty state for new users with call-to-action
- Overdue reminders banner with mobile-optimized styling

**Translation keys implemented:**

- ✅ Replaced hardcoded text with proper translation keys
- ✅ Used t() function for all user-facing text including:
  - `t("journal.recentLogs")` for "Recent Logs"
  - `t("dashboard.growth")` and `t("dashboard.active")` for growth stats
  - `t("dashboard.quickActions")` and `t("dashboard.quickActionsDesc")`
  - `t("common.viewAll")` for "View all" buttons
  - `t("dashboard.plantsGrowing")`, `t("dashboard.latestActivity")`
  - `t("dashboard.startGrowingJourney")` for empty state text
  - `t("dashboard.overdueRemindersDesc")` for reminder notifications

**Translation keys status:**
✅ **COMPLETED** - All translation keys have been added to `components/providers/language-provider.tsx`

**Added keys for Mobile Dashboard:**
- `dashboard.startGrowingJourney` (Spanish/English)
- `common.viewAll` (Spanish/English) 

**Added keys for Mobile Plant List:**
- `search.plants` (Spanish/English)
- `plants.total`, `plants.noResults`, `plants.tryDifferentSearch` (Spanish/English)
- `sort.byDate`, `sort.byName`, `sort.bySeedType`, `sort.byGrowType` (Spanish/English)
- `sort.ascending`, `sort.descending` (Spanish/English)
- `filters.title`, `filters.active`, `filters.all`, `filters.clear` (Spanish/English)
- `filters.seedType`, `filters.growType` (Spanish/English)
- `seedType.autoflowering`, `seedType.photoperiodic` (Spanish/English)
- `growType.indoor`, `growType.outdoor` (Spanish/English)

### 🚧 In Progress

- [ ] None currently

#### 2. Responsive plant list component with mobile-first grid layout ✅

- [x] Build mobile-first plant grid (1 col mobile, 2+ desktop)
- [x] Implement infinite scroll/pagination for mobile
- [x] Add search and filter UI optimized for mobile
- [x] Create plant card hover states that work on touch
- [x] Add skeleton loading states
- [x] Test performance with large plant lists
- [x] Build succeeds without errors

**Implementation details:**

- Created `components/mobile/mobile-plant-list.tsx` with advanced mobile features
- Built responsive grid layout (1 col mobile, 2 col tablet+)
- Implemented infinite scroll with Intersection Observer API
- Added mobile-optimized search with clear button
- Created advanced filtering modal with seed/grow type badges
- Built view mode toggle (grid/list) with proper mobile touch targets
- Added comprehensive sorting (name, date, type) with visual indicators
- Implemented skeleton loading states in `components/skeletons/mobile-plant-list-skeleton.tsx`
- Integrated responsive rendering with desktop fallback
- Added proper translation keys for all user-facing text

#### 3. Mobile-friendly journal interface with touch-optimized filters ✅

- [x] Redesign filter sidebar for mobile (collapsible drawer)
- [x] Implement mobile-optimized date picker
- [x] Add touch-friendly filter chips
- [x] Create swipeable journal entries
- [x] Optimize calendar view for mobile screens
- [x] Add quick log entry floating action button
- [x] Build succeeds without errors
- [x] **FIX: Replace hardcoded text with translation keys**

**Implementation details:**

- Created `components/mobile/mobile-journal.tsx` with mobile-first design and advanced features
- Built touch-optimized filter system with modal-based interface
- Implemented infinite scroll with Intersection Observer API
- Added mobile-optimized search with clear functionality
- Created swipeable journal entries with delete gesture in `components/mobile/mobile-journal-entry.tsx`
- Integrated modal-based date picker and filtering system
- Added comprehensive sorting (date, type, plant) with visual indicators
- Implemented responsive rendering in `app/journal/page.tsx`
- Added proper translation keys for all user-facing text

**Translation keys implemented:**

- ✅ Added missing journal translation keys to `components/providers/language-provider.tsx`
- ✅ Used t() function for all user-facing text including:
  - `t("search.journal")` for search placeholder
  - `t("journal.noLogs")`, `t("journal.noFilteredLogs")` for empty states
  - `t("journal.tryDifferentFilters")`, `t("journal.addFirstLog")` for call-to-action
  - `t("journal.selectDate")`, `t("journal.deleteLog")` for modal titles
  - `t("journal.deleteLogConfirm")` for confirmation dialog
  - `t("journal.deleted")`, `t("journal.deletedDesc")` for success feedback
  - `t("filters.active")`, `t("filters.clear")` for filter management

**Key Features:**
- Touch-optimized swipe-to-delete journal entries
- Modal-based filters with plant/type selection badges
- Advanced search with text matching across notes, plant names, and types
- Infinite scroll for performance with large datasets
- Active filter display with individual remove buttons
- Responsive date picker with locale support
- Mobile-first grid layout with proper touch targets (44px+)

#### 4. Mobile plant page with dark theme design and comprehensive plant information ✅

- [x] Create mobile plant page with dark theme matching reference design
- [x] Implement plant status display with environmental data
- [x] Add day counter since planting with proper calculations
- [x] Create plant information sections (temperature, humidity, lighting, nutrients)
- [x] Add quick action buttons for logging activities
- [x] Implement plant image display with optimized loading
- [x] Add plant care reminders and status indicators
- [x] Create responsive layout for mobile screens
- [x] Add proper navigation and back button
- [x] Implement touch-friendly interactions
- [x] Build succeeds without errors
- [x] **FIX: Replace hardcoded text with translation keys**

**Implementation details:**

- Created `components/mobile/mobile-plant-page.tsx` with dark theme design exactly matching the reference image
- Built comprehensive plant status display with temperature, humidity, pH, and nutrient tracking
- Implemented day counter since planting with proper date calculations using date-fns
- Added plant information sections with proper categorization (lighting, nutrients, plant details)
- Created quick action buttons for adding logs and scheduling
- Integrated optimized image display with full-screen modal viewer
- Added proper navigation header with back button and dropdown menu
- Updated `app/plants/[id]/page.tsx` with responsive rendering for mobile vs desktop
- Reverted `components/mobile/mobile-plant-card.tsx` back to simple card design

**Translation keys implemented:**

- ✅ Added comprehensive plant page translation keys to `components/providers/language-provider.tsx`
- ✅ Used t() function for all user-facing text including:
  - `t("plantPage.day")`, `t("plantPage.plantStatus")` for main sections
  - `t("plantPage.watered")`, `t("plantPage.dayAgo")` for watering status
  - `t("plantPage.lighting")`, `t("plantPage.nutrients")` for status categories
  - `t("plantPage.npk")`, `t("plantPage.ph")` for nutrient information
  - `t("plantPage.seedType")`, `t("plantPage.growType")` for plant details
  - `t("plants.plantDetails")` for navigation header
  - `t("journal.addLog")`, `t("common.edit")` for action buttons

**Key Features:**
- **Dark Theme Design**: Exactly matches the provided cannabis journal reference with gradient backgrounds
- **Plant Status Grid**: Shows temperature (°F), humidity (%), pH, and N-P-K values with proper icons
- **Day Counter**: Large prominent display of days since planting in header
- **Environmental Data**: Real-time display of latest environmental readings
- **Quick Actions**: View Logs and Add Log buttons for immediate plant care actions
- **Image Navigation**: Swipe-based image carousel for multiple plant photos with image counter
- **Inline Editing**: Edit plant name, seed type, grow type, and seed bank directly on the page
- **Navigation**: Proper back button and menu with photo upload actions
- **Responsive Integration**: Seamless mobile/desktop switching in plant detail page
- **Plant Information**: Comprehensive display of seed type, grow type, and seed bank details

**Recent Updates:**
- ✅ **Fixed Navigation**: Removed schedule button, added View Logs button that navigates to dedicated logs page
- ✅ **Added Logs Page**: Created `app/plants/[id]/logs/page.tsx` with mobile-optimized journal entry display
- ✅ **Improved UI Consistency**: Logs page matches main journal UI with trash icons instead of swipe-to-delete
- ✅ **Enhanced Image Navigation**: Added swipe-based navigation between multiple plant photos
- ✅ **Inline Editing**: Implemented inline editing for plant details using existing InlineEdit component
- ✅ **Better UX**: Clean swipe-only navigation without cluttering arrow buttons

## Priority 2: Essential Components

#### 5. Mobile plant card component with swipe gestures and optimized images ✅

- [x] Implement swipe gestures for quick actions
- [x] Add optimized image loading with progressive enhancement
- [x] Create card animations and micro-interactions
- [x] Add contextual action menu (dropdown menu)
- [x] Implement image lazy loading
- [x] Test touch interactions and performance
- [x] **FIX: Replace hardcoded text with translation keys**

**Implementation details:**

- Created `components/mobile/mobile-plant-card.tsx` with dark theme design matching the reference image
- Built swipe-to-delete functionality with touch gesture handlers
- Implemented plant status display with temperature, humidity, pH, and nutrient tracking
- Added day counter since planting with proper date calculations
- Created contextual dropdown menu with edit, add log, and delete actions
- Integrated optimized image loading with fallback gradient backgrounds
- Added proper translation keys for all user-facing text
- Updated `components/mobile/mobile-plant-list.tsx` to use the new mobile plant card

**Translation keys implemented:**

- ✅ Added new plant card translation keys to `components/providers/language-provider.tsx`
- ✅ Used t() function for all user-facing text including:
  - `t("plantCard.day")` for day counter
  - `t("plantCard.status")` for status section header
  - `t("plantCard.watered")`, `t("plantCard.daysAgo")` for watering info
  - `t("plants.deletePlant")`, `t("plants.deletePlantConfirm")` for deletion dialog
  - `t("seedType.autoflowering")`, `t("growType.indoor")` for plant type badges
  - `t("journal.addLog")`, `t("common.edit")`, `t("common.delete")` for actions

**Key Features:**
- **Dark Theme Design**: Matches the provided reference with gradient backgrounds and proper contrast
- **Touch Gestures**: Smooth swipe-to-delete with visual feedback and confirmation dialog
- **Plant Status Display**: Shows temperature, humidity, pH, nutrients, and lighting information
- **Day Tracking**: Displays days since planting with proper date calculations
- **Action Menu**: Dropdown menu with edit, add log, and delete options
- **Image Optimization**: Lazy loading with fallback states for missing images
- **Responsive Layout**: Single-column layout optimized for mobile screens
- **Micro-interactions**: Smooth animations and visual feedback for all touch interactions

## Recent Enhancements (Beyond Original TODO)

#### ✅ Mobile Plant Page Navigation & Logs System

**What we built:**
- **Dedicated Add Log Page**: Created `app/plants/[id]/add-log/page.tsx` for mobile-friendly log creation
- **Plant Logs Viewer**: Built `app/plants/[id]/logs/page.tsx` with consistent journal UI
- **Navigation Improvements**: Replaced modal-based actions with dedicated screens for better mobile UX
- **UI Consistency**: Made plant logs match the main journal page with trash icon deletions

**Key Features:**
- Mobile-optimized headers with proper back navigation
- Consistent styling between journal and plant logs pages
- Real-time log updates using Firestore snapshots
- Floating action button for adding logs when entries exist
- Empty state with call-to-action for first-time users
- Proper translation support for all new text

#### ✅ Advanced Image Navigation System

**What we built:**
- **Swipe Navigation**: Touch-based image carousel for multiple plant photos
- **Image Counter**: Visual indicator showing current position (e.g., "2 / 4")
- **Full Screen Support**: Swipe navigation works in both normal and full-screen modes
- **Clean UI**: Removed cluttering arrow buttons in favor of intuitive swipe gestures
- **Smart Image Logic**: Combines coverPhoto and photos array with duplicate removal

**Key Features:**
- 50px minimum swipe distance to prevent accidental navigation
- Circular navigation (loops from last to first image)
- Touch-friendly interaction without visual clutter
- Works seamlessly in both plant page and full-screen modal
- Responsive image counter that only shows when multiple images exist

#### ✅ Inline Editing for Plant Details

**What we built:**
- **Plant Name Editing**: Inline editing with pencil icon using existing InlineEdit component
- **Type Selectors**: Proper dropdown selectors for seed type and grow type instead of text inputs
- **Seed Bank Editing**: Inline text editing for seed bank information
- **Consistent Styling**: Dark theme styling that matches the plant page design

**Key Features:**
- Reused existing InlineEdit component for consistency
- Type-safe dropdowns prevent invalid data entry
- Immediate Firebase updates on save
- Proper error handling and user feedback
- Mobile-optimized input styling with dark theme support

**Translation Keys Added:**
- `journal.viewLogs` (Spanish: "Ver registros", English: "View Logs")
- Enhanced existing keys for better plant page integration

### 📋 Pending

#### 6. Mobile navigation system with floating action button and role switching

- [ ] Enhance bottom navigation with better touch targets
- [ ] Implement floating action button with contextual actions
- [ ] Add role switching UI for dual-role users
- [ ] Create navigation transitions and animations
- [ ] Add haptic feedback for interactions
- [ ] Test navigation flow across all pages

#### 7. Mobile-optimized forms with large touch targets and proper keyboards

- [ ] Redesign all forms with 44px+ touch targets
- [ ] Implement proper input types for mobile keyboards
- [ ] Add form validation with mobile-friendly error states
- [ ] Create auto-advancing form fields
- [ ] Add form progress indicators
- [ ] Test accessibility and keyboard navigation

## Priority 3: Enhanced Features

#### 8. Responsive image gallery with mobile photo viewer and upload

- [ ] Create mobile-first image gallery component
- [ ] Implement touch-friendly photo viewer with pinch zoom
- [ ] Add mobile camera integration for uploads
- [ ] Create image selection and crop functionality
- [ ] Add photo organization and tagging
- [ ] Test image performance and caching

#### 9. Mobile reminder system with notification-style cards and quick actions

- [ ] Design notification-style reminder cards
- [ ] Add quick action buttons (snooze, complete, edit)
- [ ] Implement swipe actions for reminders
- [ ] Create reminder scheduling UI for mobile
- [ ] Add push notification integration
- [ ] Test reminder timing and persistence

#### 10. Mobile-first AI chat interface with conversation bubbles

- [ ] Create chat bubble component with proper sizing
- [ ] Implement auto-scrolling conversation view
- [ ] Add typing indicators and message states
- [ ] Create mobile-optimized input with voice support
- [ ] Add image sharing within chat
- [ ] Test chat performance and real-time updates

## Priority 4: User Experience

#### 11. Mobile onboarding flow with progressive disclosure and touch navigation

- [ ] Create step-by-step onboarding screens
- [ ] Implement swipeable tutorial cards
- [ ] Add interactive feature introductions
- [ ] Create role selection interface
- [ ] Add skip and replay functionality
- [ ] Test onboarding completion rates

## Testing Checklist for Each Feature

### Mobile Testing

- [ ] iPhone (Safari)
- [ ] Android Chrome
- [ ] Different screen sizes (375px to 414px width)
- [ ] Portrait and landscape orientations
- [ ] Touch interactions and gestures
- [ ] Performance on slower devices

### Desktop Testing

- [ ] Chrome, Firefox, Safari
- [ ] Responsive breakpoints (768px, 1024px, 1280px)
- [ ] Hover states and mouse interactions
- [ ] Keyboard navigation
- [ ] Multi-column layouts

### Accessibility Testing

- [ ] Screen reader compatibility
- [ ] Color contrast ratios
- [ ] Focus indicators
- [ ] Touch target sizes (minimum 44px)
- [ ] Keyboard navigation

## Notes

- All components should follow the mobile-first approach outlined in UI_COMPONENT_GUIDE.md
- Use existing shadcn/ui components as base where possible
- Maintain consistency with current design system
- Test on actual devices, not just browser dev tools
- Consider offline functionality for PWA features
