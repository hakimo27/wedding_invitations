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
- 3D mini-game (Three.js) — guest collects hearts before seeing invitation
- Beautiful countdown timer to wedding date
- OpenStreetMap venue map
- RSVP form
- Admin panel for managing guests and settings

### Architecture
- **Frontend**: `artifacts/wedding/` — React + Vite + Tailwind + Framer Motion
- **Backend**: `artifacts/api-server/` — Express 5 + Drizzle ORM + PostgreSQL
- **DB Schema**: `lib/db/src/schema/guests.ts` + `lib/db/src/schema/settings.ts`
- **API Spec**: `lib/api-spec/openapi.yaml`
- **Generated Hooks**: `lib/api-client-react/src/generated/api.ts`
- **Generated Zod Schemas**: `lib/api-zod/src/generated/api.ts`

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
