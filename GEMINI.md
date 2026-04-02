# GEMINI.md

## Project Overview
**Cannafriend** is a modern Progressive Web App (PWA) designed to serve as a comprehensive cultivation companion for cannabis growers. It provides tools for tracking plant growth, managing cultivation logs, setting maintenance reminders, and leveraging AI for plant health analysis.

- **Primary Goal:** Track, manage, and optimize the cannabis cultivation experience.
- **Technologies:** Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, Firebase (Auth, Firestore, Storage), OpenAI API, React-i18next.

## Data Fetching Architecture
The project utilizes a custom **Suspense-based resource fetching pattern**. Components use `getSuspenseResource` to handle data loading, replacing traditional `useState`/`useEffect` patterns for remote data. Cache invalidation is handled via utility functions in `lib/suspense-cache.ts`.

## Building and Running
The project is a Next.js application managed via `pnpm`.

### Commands
- **Install Dependencies:** `pnpm install`
- **Development Server:** `pnpm dev`
- **Production Build:** `pnpm build`
- **Production Start:** `pnpm start`
- **Linting:** `pnpm lint`
- **Testing:** `pnpm test` (Uses Jest)

## Development Conventions
- **Technical Deep-Dive:** Refer to `CLAUDE.md` for strictly enforced architectural rules, git hook usage, and specific debugging procedures.
- **Internationalization:** All `t()` calls must explicitly specify a namespace (e.g., `t("key", { ns: "journal" })`).
- **Data Fetching:** Prefer `getSuspenseResource` over local `useEffect` fetching.
- **Routing:** Use only constants from `lib/routes.ts`.
- **Styling:** Tailwind CSS.
- **Project Structure:**
  - `app/`: Routing and page components.
  - `components/`: Feature-specific UI components.
  - `lib/`: Shared utilities, Firebase config, and constants.
  - `hooks/`: Custom hooks exported from `hooks/index.ts`.
  - `types/`: Domain-split type definitions.
