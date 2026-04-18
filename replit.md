# Hensek Company Management System

Express + Vite/React app with WebSocket chat and PostgreSQL persistence.

## Architecture

- `client/` — Vite + React SPA, served on port 5000 in dev. Proxies `/api`, `/ws`, and `/uploads` to the backend on port 3001.
- `server/` — Express + Passport + ws backend (TypeScript via tsx in dev), listens on port 3001.
- `server/src/db/` — Drizzle ORM schema (`schema.ts`) and Postgres pool (`index.ts`).
- `server/src/lib/storage.ts` — Single source of truth for app data. Loads every table into in-memory caches at startup, and write-throughs every mutation to Postgres via per-table serial queues. Routes still call it synchronously.
- Sessions persist in Postgres via `connect-pg-simple` (`session` table auto-created).

## Database

- `DATABASE_URL` is provided by Replit.
- Schema lives at `server/src/db/schema.ts`. Push changes with `npm run db:push`.
- On first boot when the DB is empty, the storage layer seeds default departments, accounts, sites, an announcement, and chat rooms.

## Default accounts (dev only)

- MD: `admin@hensek.com` / `HensekAdmin2024!`
- HR: `hr@hensek.com` / `HRPassword123!`
- Safety: `safety@hensek.com` / `Safety123!`
- Security: `security@hensek.com` / `Security123!`
- Staff: `john.doe@hensek.com` / `Staff123!`

## Workflow

- `Start application` — `npm run dev` (concurrently runs Vite on 5000 and the backend on 3001).
