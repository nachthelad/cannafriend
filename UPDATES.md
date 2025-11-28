Project Updates Log

This file is maintained automatically by scripts/autolog.mjs.

## Entries

<!-- AUTOLOG:START -->
- [MID]: update mobile nav to main content — 2025-11-28

- [MID]: Introduce extensive UI components and types for dashboard, plant management, mobile, sessions, AI, and related features. — 2025-11-25

- [MID]: Add plant management UI, journal, and reminders pages with new UI components and localization. — 2025-11-24
- [MID]: add initial dashboard, AI chat, plant, journal, and common UI components with localization support. — 2025-11-21
- [MID]: add dashboard container component for displaying user data and actions. — 2025-11-21
- [MID]: add desktop journal view with filtering, sorting, search, and log deletion capabilities. — 2025-11-20

- [MID]: Implement journal feature with dedicated components, i18n, and a Firestore index, improving dashboard log fetching. — 2025-11-20
- [MINOR]: remove outdated documentation and files related to reminders and marketing strategy — 2025-11-20
- [MINOR]: simplify FastLogAction button by removing outline variant for a cleaner UI — 2025-11-18
- [MINOR]: update reminder forms and dialogs to improve user experience with enhanced validation and UI components — 2025-11-18
- [MINOR]: simplify reminder item logic by removing unnecessary language prop and updating overdue check — 2025-11-18
- [MINOR]: remove default value for isActive in reminder schema to ensure explicit state management — 2025-11-18
- [MINOR]: handle unauthorized access by validating user ID from Firebase token — 2025-11-18
- [MID]: enhance reminder system with new alarm-style notifications and migration for legacy reminders — 2025-11-18
- [MINOR]: streamline journal data fetching and enhance desktop layout — 2025-11-18
- [MID]: add lastLighting support to plant details and mobile plant page — 2025-11-18

- [MINOR]: update dashboard logging terminology to 'fast log' for consistency — 2025-11-18
- [MINOR]: update favicon and app icons for improved visual consistency — 2025-11-17
- [MINOR]: enhance image upload handling and loading indicators across components — 2025-11-13
- [MINOR]: add header and title to image gallery modal for improved accessibility — 2025-11-13
- [MINOR]: update notification icons and improve logo handling across the application — 2025-11-12
- [MINOR]: enhance skeleton components for improved mobile and desktop layouts — 2025-11-12
- [MINOR]: improve layout of responsive page header for mobile and desktop — 2025-11-10

- [MID]: add mobile image upload functionality in plant details — 2025-11-10
- [MINOR]: enhance layout and settings components for improved responsiveness and consistency — 2025-11-01
- [MINOR]: improve landing page rendering and prevent stale update prompts — 2025-10-28
- [MINOR]: update PremiumPage to switch payment methods from Stripe to MercadoPago, adjust translations, and improve code formatting — 2025-10-28

- [MINOR]: Fix landing page rendering and prevent stale update prompts — 2025-10-28
- [MINOR]: update dashboard and plant components for improved translations and UI consistency; add new translation keys for status filters — 2025-10-28
- [MINOR]: update VAPID email configuration to use DEV_EMAIL constant for consistency across push and reminder routes; adjust VAPID key generation script to reflect new email handling — 2025-10-14
- [MID]: enhance reminders page with conditional rendering for plant and reminder management, including new translations for empty states — 2025-10-14
- [MID]: implement plant lifecycle management by adding end cycle functionality, including status updates and UI enhancements for journal and plant components — 2025-10-14

- [MINOR]: optimize reminder check route by importing web-push module at runtime to reduce bundle size and enhance performance; add immediate activation handling in service worker for improved user experience — 2025-10-14
- [MINOR]: enhance privacy and terms pages with improved structure and translation handling, including dynamic content rendering and consistent styling — 2025-10-14
- [MINOR]: [minor]: update landing footer to display app version dynamically and adjust copyright year in translations — 2025-10-09
- [MINOR]: streamline type imports and enhance code organization by consolidating session and settings types across components — 2025-10-09

- [MINOR]: enhance type definitions and improve code organization by consolidating types across components — 2025-10-08
- [MINOR]: consolidate type definitions into centralized files for admin and common components to improve code organization and maintainability — 2025-10-08
- [MID]: add mobile reminders component and integrate it into reminders page for improved mobile experience — 2025-10-08
- [MINOR]: remove AnimatedLogo component and replace with FormSkeleton in various pages for improved loading states — 2025-10-07
- [MINOR]: update Vercel deployment instructions and clean up cron job configuration in documentation — 2025-10-07

- [MINOR]: update push notifications implementation to use Firebase Admin SDK and improve service worker registration — 2025-10-07

- [MINOR]: bump version to 0.9.15 and update UPDATES.md with minor dashboard enhancements — 2025-10-07

- [MINOR]: enhance error handling and toast notifications across components, implement theme synchronization in layout — 2025-10-02
- [MINOR]: consolidate plant details and reminders functionality, enhance reminder system with new caching and data handling — 2025-10-01

- [MINOR]: update plant details component and enhance image gallery modal with new features — 2025-09-24

- [MINOR]: enhance AI assistant functionality with improved topic detection and error handling — 2025-09-23
- [MINOR]: adjust OpenAI parameters for improved response quality — 2025-09-23

- [MINOR]: -- Move normalizeOpenAIContent helper into shared util — 2025-09-23
- [MINOR]: simplify reminder display structure and enhance layout — 2025-09-23
- [MINOR]: clean up chat components and remove unused date display — 2025-09-23
- [MINOR]: remove deprecated photo gallery component and update AI-related translations — 2025-09-23
- [MINOR]: update chat message types and improve OpenAI integration — 2025-09-23
- [MINOR]: rename unified-chat to chat and update related imports — 2025-09-23
- [MINOR]: adjust padding and backdrop blur for mobile plant card — 2025-09-22

- [MINOR]: improve code readability and structure — 2025-09-22
- [MID]: integrate Fuse.js for enhanced search functionality and improve cache invalidation — 2025-09-22

- [MINOR]: enhance dashboard with new plant addition feature and icon updates — 2025-09-21
- [MINOR]: streamline forgot and reset password pages with responsive design and component consolidation — 2025-09-21
- [MINOR]: enhance AIAssistantContent with sidebar management and improve layout structure — 2025-09-19
- [MINOR]: implement Suspense for loading state and improve component structure — 2025-09-19
- [MID]: implement sessions management with mobile and desktop components — 2025-09-19
- [MINOR]: handle unauthorized access and improve loading state display — 2025-09-19
- [MINOR]: consolidate admin dashboard layout with modular components — 2025-09-18
- [MINOR]: enhance unused variable detection and code quality rules — 2025-09-18

- [MINOR]: -- Refactor admin dashboard layout and modular panels — 2025-09-18
- [MINOR]: add Vercel Analytics integration — 2025-09-18
- [MINOR]: implement premium status checks and Suspense for loading state — 2025-09-18
- [MINOR]: enhance dashboard with reminders and premium status checks — 2025-09-18
- [MID]: enhance settings page with new components and improved structure — 2025-09-18
- [MID]: reuse reminders suspense data on mobile — 2025-09-17

- [MINOR]: remove redundant isLoading states now handled by Suspense boundaries — 2025-09-17

- [MID]: implement Firestore and Storage rules with ownership checks — 2025-09-17
- [MINOR]: update translation namespaces and remove analyzePlant references — 2025-09-16

- [MINOR]: remove outline variant from buttons and update analytics initialization logic — 2025-09-15
- [MINOR]: update Content Security Policy and enhance mobile styling for dashboard and plant pages — 2025-09-15

- [MINOR]: improve keyword detection for more intuitive plant conversations — 2025-09-15

- [MINOR]: enhance admin page with UID copy functionality and layout improvements — 2025-09-15
- [MINOR]: enhance subscription creation and error handling — 2025-09-15
- [MID]: show premium subscription details with remaining time and recurring status; add MP subscription-status API; unify admin search; docs updated; build ok — 2025-09-15
- [MID]: MP premium auto-grant + unified admin search; docs and build verified — 2025-09-15
- [MID]: enhance admin page with unified MercadoPago search functionality — 2025-09-15
- [MID]: enhance AI assistant layout and chat functionality — 2025-09-15
- [MID]: add version bump scripts to package.json for automated versioning — 2025-09-13
- [MINOR]: [MINOR]: update UPDATES.md to reflect recent changes in AGENTS.md and logging system — 2025-09-12 — 2025-09-12
- [MINOR]: update AGENTS.md for clarity and correct hook terminology — 2025-09-12
- [MID]: [MID]: update UPDATES.md to include automatic logging entry — 2025-09-12
- [MID]: implement automatic update logging system and enhance package scripts — 2025-09-12
- [MINOR]: Mover bitácora automática a UPDATES.md y documentar en AGENTS.md — 2025-09-12
<!-- AUTOLOG:END -->
