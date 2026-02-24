# Desert Battles (معارك الصحراء) - Replit Agent Guide

## Overview

Desert Battles is a mobile-first online strategy game inspired by Travian, featuring a full Arabic desert theme. Players build and manage a desert city, produce resources (water, dates, gold, stone), construct and upgrade buildings, and compete on a world map. The app is built with Expo (React Native) for the frontend and Express.js for the backend, using PostgreSQL (via Drizzle ORM) for data persistence and Supabase for authentication.

The game is currently in MVP phase, focusing on: authentication, city view with building management, resource production (server-calculated), and a building upgrade queue system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with expo-router for file-based routing
- **Language**: TypeScript with strict mode
- **Navigation**: File-based routing via expo-router v6. Routes are under `app/` directory:
  - `app/index.tsx` — Login screen (redirects to game if authenticated)
  - `app/(game)/index.tsx` — Main city/game screen
  - `app/(game)/_layout.tsx` — Game stack layout
- **State Management**: TanStack React Query for server state, React context for auth
- **Styling**: React Native StyleSheet with a centralized color system (`constants/colors.ts`)
- **Fonts**: Tajawal Arabic font family (Light, Regular, Medium, Bold, ExtraBold)
- **Animations**: react-native-reanimated for building pulse effects and parallax login screen
- **RTL Support**: Enabled via `I18nManager.forceRTL(true)` for Arabic language support
- **Key UI Components**:
  - `ParallaxLogin` — Multi-layer animated login screen with stars, dunes, and camel caravan
  - `ResourceBar` — Top-of-screen resource display with capacity bars
  - `BuildingSlot` — Individual building on the city map with upgrade indicators
  - `BuildingInfoModal` — Building details, upgrade costs, and countdown timer
  - `NewBuildingModal` — Selection modal for constructing new buildings

### Backend (Express.js)

- **Framework**: Express.js v5 running on Node.js
- **Entry point**: `server/index.ts`
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Key Endpoints** (defined in `server/routes.ts`):
  - `POST /api/profile` — Create or fetch player profile
  - `GET /api/profile/:id/resources` — Get calculated resources
  - `GET /api/profile/:id/buildings` — Get player's buildings
  - `POST /api/profile/:id/buildings` — Construct a new building
  - `POST /api/buildings/:id/upgrade` — Upgrade an existing building
- **Resource Calculation**: Server-side time-based resource accumulation. Resources are calculated on each request based on elapsed time since last update, capped by storage capacity.
- **Build Queue**: Only one building can be upgraded at a time per player. Build times are real countdown timers stored as timestamps.
- **CORS**: Dynamic CORS based on Replit domain environment variables, with localhost support for development
- **Production**: Static web build served by Express in production; proxy to Metro bundler in development

### Database (Supabase PostgreSQL)

- **Client**: `@supabase/supabase-js` with service role key for backend operations
- **Admin Client**: `server/supabase-admin.ts` provides authenticated Supabase client for server-side DB operations
- **Tables** (created via Supabase SQL Editor):
  - `profiles` — Player data: resources (water, dates, gold, stone), production rates, storage capacity, map coordinates
  - `buildings` — Player buildings: type, level, slot index, upgrade state with start/end timestamps
  - `world_map` — World map grid cells: coordinates, terrain type, occupancy
- **Storage Layer**: `server/storage.ts` provides a `SupabaseStorage` class implementing `IStorage` interface for all CRUD operations using Supabase client
- **Column Mapping**: camelCase (TypeScript) ↔ snake_case (database) handled by helper functions in storage.ts

### Game Configuration

Building types and their configs are defined in `shared/schema.ts` and shared between client and server:
- **Resource buildings**: Well (water), Date Farm (dates), Gold Mine (gold), Quarry (stone)
- **Military/Infrastructure**: Barracks, City Wall, Warehouse, Market
- Each building has levels 1-10 with scaling costs and production rates
- Building costs and times calculated via helper functions: `getBuildingCost()`, `getBuildingTime()`, `getBuildingProduction()`

### Authentication

- **Provider**: Supabase Auth (email/password)
- **Client**: `@supabase/supabase-js` with `AsyncStorage` for session persistence on mobile
- **Context**: `lib/auth-context.tsx` provides `AuthProvider` wrapping the app with session state, signIn, signUp, signOut
- **Flow**: Login screen → Supabase auth → profile creation via backend API → redirect to game

### Development vs Production

- **Development**: Expo Metro bundler proxied through Express server; `expo:dev` and `server:dev` scripts run concurrently
- **Production**: Static web bundle built via custom `scripts/build.js`, served by Express; backend bundled via esbuild

## External Dependencies

### Services & APIs
- **Supabase**: Authentication (email/password) + PostgreSQL database for all game data. Frontend uses `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Backend uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### Required Environment Variables
- `SUPABASE_URL` — Supabase project URL (backend)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (backend, sensitive)
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL (frontend)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous/public key
- `EXPO_PUBLIC_DOMAIN` — App domain for API requests (set automatically on Replit)
- `REPLIT_DEV_DOMAIN` — Replit dev domain (set automatically)

### Key NPM Packages
- **Frontend**: expo, expo-router, react-native-reanimated, react-native-gesture-handler, @tanstack/react-query, expo-linear-gradient, expo-image, @expo-google-fonts/tajawal
- **Backend**: express, pg, drizzle-orm, drizzle-zod, http-proxy-middleware
- **Shared**: zod (validation), drizzle-orm schema definitions
- **Build tools**: drizzle-kit, esbuild, tsx, patch-package