# Dental Practice Demo

Portfolio full-stack project that implements a dental appointment booking workflow with an admin scheduling interface.

## Overview

This repository demonstrates:
- Patient appointment booking with server-side validation
- Admin login with protected scheduling endpoints
- Availability generation from recurring weekly hours plus date exceptions
- Admin blocked-time management
- Database-level overlap protection for appointments and blocked periods
- Optional transactional email notifications

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Email (optional): Resend
- Tests: Vitest, Supertest, React Testing Library

## Demo Status

No public deployment is configured in this repository yet.

## Quick Start

### 1. Prerequisites

- Node.js 18+ (CI runs on Node.js 22)
- npm 9+
- Docker Desktop (recommended for local PostgreSQL)

### 2. Install

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Update values in `.env` as needed. For local Docker usage, the default `DATABASE_URL` already matches `docker-compose.yml`.

### 4. Start database

```bash
npm run db:up
```

### 5. Apply schema and seed

```bash
npm run db:setup
```

### 6. Run API and frontend

Terminal 1:

```bash
npm run dev:server
```

Terminal 2:

```bash
npm run dev
```

Local URLs:
- Frontend: http://localhost:5173
- API health check: http://localhost:5050/api/health

## Environment Variables

Defaults are in `.env.example`.

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | API port. Default: `5050` |
| `VITE_API_URL` | Yes (frontend) | Base URL for API requests from the frontend |
| `ADMIN_PASSWORD` | Yes (admin routes) | Password for admin login |
| `ADMIN_SESSION_TTL_MINUTES` | No | In-memory admin session TTL. Default: `30` |
| `ALLOWED_ORIGINS` | No (for local defaults) | Comma-separated CORS allowlist |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `RESEND_API_KEY` | Optional | Enables email sending |
| `RESEND_FROM` | Optional | Sender email used by Resend |
| `STAFF_EMAIL` | Optional | Recipient for staff notifications |
| `DEFAULT_SLOT_MINUTES` | No | Fallback slot duration. Default: `30` |

## Database Workflow

This project uses SQL files directly (no migration framework):
- Schema: `server/schema.sql`
- Seed data: `server/seed.sql`

Common commands:

```bash
npm run db:up
npm run db:migrate
npm run db:seed
```

`server/schema.sql` is mostly idempotent (`create table if not exists`, guarded constraints), so re-applying in local development is safe.

You can also use an external PostgreSQL instance (for example Supabase) instead of local Docker. Set `DATABASE_URL` to your external connection string, then run:

```bash
npm run db:migrate
npm run db:seed
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run dev:server` | Start Express API in watch mode |
| `npm run start:server` | Start Express API without watch |
| `npm run build` | Build frontend into `dist/` |
| `npm run preview` | Preview production frontend build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm test` | Run default test suite |
| `npm run test:api` | Run API tests |
| `npm run test:ui` | Run UI tests |
| `npm run test:db` | Run DB smoke tests (`RUN_DB_TESTS=1`) |
| `npm run db:up` | Start PostgreSQL (Docker Compose) |
| `npm run db:down` | Stop Docker Compose services |
| `npm run db:migrate` | Apply schema SQL |
| `npm run db:seed` | Apply seed SQL |
| `npm run db:setup` | Run migrate + seed |

## API Endpoints (High Level)

Public:
- `GET /api/health`
- `GET /api/services`
- `GET /api/availability`
- `POST /api/appointments`

Admin (cookie-authenticated):
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/session`
- `GET /api/appointments`
- `GET /api/blocked-periods`
- `POST /api/blocked-periods`
- `DELETE /api/blocked-periods/:id`

## Testing

- `npm test` runs the default Vitest suite.
- `npm run test:db` runs only when `RUN_DB_TESTS=1` and requires a reachable PostgreSQL instance.
- CI workflow (`.github/workflows/ci.yml`) runs lint, tests, build, and DB smoke checks.

## Email Behavior

Resend integration is optional for local review.
- If `RESEND_API_KEY` or `RESEND_FROM` is missing, appointment creation still succeeds and email sending is skipped.
- Staff notifications additionally require `STAFF_EMAIL`.
- API responses include per-recipient email status (`sent`, `skipped`, `failed`) for observability.

## Troubleshooting

- `DATABASE_URL is not set`: copy `.env.example` to `.env` and verify `DATABASE_URL`.
- `Origin not allowed by CORS`: add your frontend origin to `ALLOWED_ORIGINS`.
- Admin routes return `Unauthorized`: log in first via `POST /api/admin/login`, and ensure `ADMIN_PASSWORD` is set.
- Port conflicts: change `PORT` (API) or Vite port settings if needed.

## Project Structure (Key Files)

- `server/index.js`: Express API and scheduling logic
- `server/db.js`: PostgreSQL connection layer
- `server/schema.sql`: schema and database constraints
- `server/seed.sql`: initial sample data
- `server/email.js`: Resend integration
- `Pages/`: top-level React pages/routes
- `components/ui/`: reusable UI primitives
- `tests/`: API, UI, and DB smoke tests

## Limitations

- Demo portfolio project, not a production healthcare platform
- Not HIPAA-compliant
- Admin sessions are in-memory and reset on API restart
- Security hardening is intentionally lightweight for demo scope

## Roadmap

- Add deployment pipeline and public demo URL
- Add CI badge once deployment/repo visibility is finalized

## Contributing

Small targeted improvements are welcome. Please open an issue or pull request with a clear problem statement and testing notes.

## License

No license file is currently included. All rights reserved by default until a license is added.
