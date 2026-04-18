# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Project: Wedding Invitation App

### What it does
A premium personalized wedding invitation web application where each guest receives a unique link. Features include:
- Personalized invitation pages per guest (by URL slug)
- 2D Canvas mini-game (3 levels, 3 lives) — guest collects hearts/flowers/rings, avoids dark spiky items
- Beautiful countdown timer to wedding date
- OpenStreetMap venue map
- RSVP form with comment
- Admin panel: Dashboard, Guests, Tables, Settings tabs
- Table seating system (CRUD) — assign guests to tables + seat numbers
- Activity log — tracks when guests open invitation, complete game, submit RSVP
- Enhanced stats: total/attending/not_attending/pending with person counts

### Architecture
- **Frontend**: `artifacts/wedding/` — React + Vite + Tailwind + Framer Motion
- **Backend**: `artifacts/api-server/` — Express 5 + Drizzle ORM + PostgreSQL
- **DB Schema**: `lib/db/src/schema/` — guests, settings, tables, activity-logs
- **API Spec**: `lib/api-spec/openapi.yaml`
- **Generated Hooks**: `lib/api-client-react/src/generated/api.ts`
- **Generated Zod Schemas**: `lib/api-zod/src/generated/api.ts`

### DB Tables
- `guests` — includes `tableId`, `seatNumber` (nullable FK to `wedding_tables`)
- `settings` — global wedding config (single row)
- `wedding_tables` — table seating (name, seatsCount, sortOrder, note)
- `activity_logs` — event log (guestId, guestName, eventType, payload, createdAt)

### URL Routes
- `/` — redirects to `/admin`
- `/admin` — admin panel (protected by password)
- `/invite/:slug` — individual guest invitation page

### Admin Login
Default password: `wedding2025` (changeable in settings)

### Sample Guest Slugs
- `/invite/mariya-petrova-test1`
- `/invite/ivan-sidorov-test2`
- `/invite/elena-sergey-kuznetsy-test3`

### Important Notes
- After changing `lib/api-spec/openapi.yaml`, run: `pnpm --filter @workspace/api-spec run codegen` then manually fix `lib/api-zod/src/index.ts` to only `export * from "./generated/api";`
- Three.js is installed as a regular dependency (not devDependency) in `artifacts/wedding/`
