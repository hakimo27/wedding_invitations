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
- `pnpm run build:prod` — production build → assembles `dist/server/` + `dist/public/`
- `pnpm run start` — start production server (`dist/server/index.mjs`)
- `pnpm run db:push` — push DB schema changes (run with DATABASE_URL set)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Production Deployment

Full guide: `README_DEPLOY.md`

### Quick start (VPS without Docker)
```bash
pnpm install
cp .env.example .env  # fill in DATABASE_URL, ADMIN_PASSWORD, APP_BASE_URL
export $(grep -v '^#' .env | xargs)
pnpm db:push              # create DB tables
pnpm build:prod           # build → dist/server/ + dist/public/
pm2 start ecosystem.config.cjs --env production
```

### With Docker
```bash
cp .env.example .env      # fill in DB_PASSWORD, APP_BASE_URL, ADMIN_PASSWORD
docker compose up -d --build
docker compose exec app sh -c "pnpm db:push"
```

### Production build output
```
dist/
├── server/     — Node.js bundle (serves API + static files)
└── public/     — Frontend SPA (also served by nginx directly for perf)
```

### How production serving works
- In `NODE_ENV=production`, the API server serves `dist/public/` as static files
- All non-API routes fall back to `index.html` (SPA routing)
- Nginx sits in front: serves `/assets/` directly, proxies `/api/` to Node.js
- Nginx config: `deploy/nginx.conf`
- PM2 config: `ecosystem.config.cjs`

### Environment variables
| Variable        | Required | Description                          |
|-----------------|----------|--------------------------------------|
| `NODE_ENV`      | yes      | `production`                         |
| `PORT`          | yes      | Node.js port (default 3000)          |
| `APP_BASE_URL`  | yes      | `https://wedding.yourdomain.com`     |
| `DATABASE_URL`  | yes      | PostgreSQL connection string         |
| `ADMIN_PASSWORD`| yes      | Admin panel password                 |
| `CORS_ORIGIN`   | no       | Restrict CORS to this origin         |

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
- **3 invitation templates** — Классический (default), Элегантный (classic), Цветочный (floral)
- **Template preview** — `/preview/template/:key` shows each template with sample data
- **Couple guest support** — "Дорогие" salutation with secondary first name, shared last name
- **Inline table assignment** — dropdown directly in guest list row
- **Redesigned action groups** — Share (Copy/Telegram/Text/Open) and Edit/Delete clearly separated

### Architecture
- **Frontend**: `artifacts/wedding/` — React + Vite + Tailwind + Framer Motion
- **Backend**: `artifacts/api-server/` — Express 5 + Drizzle ORM + PostgreSQL
- **DB Schema**: `lib/db/src/schema/` — guests, settings, tables, activity-logs
- **API Spec**: `lib/api-spec/openapi.yaml`
- **Generated Hooks**: `lib/api-client-react/src/generated/api.ts`
- **Generated Zod Schemas**: `lib/api-zod/src/generated/api.ts`
- **Templates**: `artifacts/wedding/src/templates/` — DefaultTemplate, ClassicTemplate, FloralTemplate

### DB Tables
- `guests` — includes `tableId`, `seatNumber`, `primaryFirstName`, `secondaryFirstName`, `sharedLastName`, `coupleDisplayMode`
- `settings` — global wedding config (single row), includes `activeTemplate`
- `wedding_tables` — table seating (name, seatsCount, sortOrder, note)
- `activity_logs` — event log (guestId, guestName, eventType, payload, createdAt)

### URL Routes
- `/` — redirects to `/admin`
- `/admin` — admin panel (protected by password)
- `/admin/login` — admin login page
- `/invite/:slug` — individual guest invitation page (renders active template)
- `/preview/template/:key` — template preview with sample data (default/classic/floral)
- `/admin/login` — admin login

### Admin Panel
- **Дашборд** — stats cards + RSVP bar chart + recent activity feed
- **Гости** — guest list with search/filter, Add/Edit dialogs with couple fields, inline table assignment, grouped share actions
- **Столы** — table CRUD with occupancy bars and guest roster
- **Настройки** — template picker (3 templates with color swatches + preview links), all wedding settings

### Key Files
- `lib/db/src/schema/guests.ts` — guest table schema with couple fields
- `lib/db/src/schema/settings.ts` — settings schema with activeTemplate
- `artifacts/wedding/src/templates/types.ts` — shared template types + `getGreeting()` helper
- `artifacts/wedding/src/templates/DefaultTemplate.tsx` — cream/gold classic style
- `artifacts/wedding/src/templates/ClassicTemplate.tsx` — ivory/navy/gold elegant style
- `artifacts/wedding/src/templates/FloralTemplate.tsx` — blush pink/rose floral style
- `artifacts/wedding/src/pages/template-preview.tsx` — template preview page with sample data
- `artifacts/wedding/src/pages/invitation.tsx` — invitation page (routes to correct template)
- `artifacts/wedding/src/pages/admin-dashboard.tsx` — full admin panel
- `artifacts/api-server/src/routes/guests.ts` — guest CRUD (slug uses `||` not `??`)

### Codegen Note
After running `pnpm --filter @workspace/api-spec run codegen`, always reset `lib/api-zod/src/index.ts` to contain only:
```
export * from "./generated/api";
```

### Auth
- Admin password stored in settings table, default: `wedding2025`
- Token returned from `/api/admin/login` is a SHA-256 hash of the password
- All admin API routes require `Authorization: Bearer <token>`

### Templates
- `activeTemplate` field in settings determines which template renders on invite pages
- Values: `"default"` | `"classic"` | `"floral"`
- Preview any template at `/preview/template/<key>` (no auth required)

### Couple Guest Logic
- When `salutationType === "Дорогие"`:
  - `primaryFirstName` = first person's name (same as `firstName`)
  - `secondaryFirstName` = second person's name
  - `sharedLastName` = shared surname (e.g., "Петровы")
  - `coupleDisplayMode` = `"first_names_only"` | `"full_shared_last_name"`
- `getGreeting(guest)` helper in `src/templates/types.ts` returns the correct greeting
