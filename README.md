# Dental Practice Demo

Portfolio full-stack project that implements a dental appointment booking workflow with an admin scheduling interface.

## Overview

This repository demonstrates:
- Patient appointment booking with server-side validation
- Admin login with protected scheduling endpoints
- Public team directory loaded from backend API data
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

- Live app: https://dental-practice-nyc.vercel.app
- Admin entry: https://dental-practice-nyc.vercel.app/admin

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
- Admin login: http://localhost:5173/admin (redirects to `/admin/appointments` after sign-in)

## Environment Variables

Defaults are in `.env.example`.

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | API port. Default: `5050` |
| `VITE_API_URL` | No (local/prod override) | Optional API base URL override in both dev and production; when unset, production falls back to same-origin `/api` |
| `ADMIN_SESSION_TTL_MINUTES` | No | In-memory admin session TTL. Default: `30` |
| `ALLOWED_ORIGINS` | No (for local defaults) | Comma-separated CORS allowlist |
| `TRUST_PROXY` | No | Proxy trust setting for `req.ip`-based protections. `true`/`1` trusts one reverse proxy hop (recommended for hosted demos behind one proxy). `false`/`0`/unset disables trust (safe local default). |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DATABASE_URL_RUNTIME` | No | Optional runtime DB role connection string (recommended for least-privilege API access) |
| `RESEND_API_KEY` | Optional | Enables email sending |
| `RESEND_FROM` | Optional | Sender email used by Resend |
| `STAFF_EMAIL` | Optional | Recipient for staff notifications |
| `DEFAULT_SLOT_MINUTES` | No | Fallback slot duration. Default: `30` |
| `PLAYWRIGHT_ADMIN_USERNAME` | Optional | Admin username for Playwright smoke auth test |
| `PLAYWRIGHT_ADMIN_PASSWORD` | Optional | Admin password for Playwright smoke auth test |

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

### Admin Users and Demo Credentials (Intentional)

- Admin login uses `username + password` against `admin_users`.
- App login endpoints only authenticate existing rows; they do not create admin users.
- For portfolio reviewer convenience, demo credentials are intentionally documented and use non-sensitive sample data.
- `server/seed.sql` creates two local bootstrap accounts:
  - `admin1` / `ChangeMe_Admin1_2026!`
  - `admin2` / `ChangeMe_Admin2_2026!`
- Keep these for demo workflows; rotate them if you repurpose this project beyond demo use.

Add another admin directly in Supabase SQL editor (not through app login):

```sql
insert into admin_users (username, password_hash, role, is_active)
values (
  'admin3',
  crypt('replace_with_strong_password', gen_salt('bf')),
  'admin',
  true
);
```

Recommended runtime hardening (Supabase SQL editor):

```sql
-- Replace app_runtime_role with the DB role used by DATABASE_URL_RUNTIME.
revoke all on table public.admin_users from public;
grant select on table public.admin_users to app_runtime_role;
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
- `GET /api/team-members`
- `GET /api/appointment-types`
- `GET /api/services/catalog`
- `GET /api/availability`
- `POST /api/appointments`

Admin (cookie-authenticated):
- `POST /api/admin/login` (`{ username, password }`)
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
- Admin routes return `Unauthorized`: log in first via `POST /api/admin/login` using a valid `admin_users.username` and password.
- Port conflicts: change `PORT` (API) or Vite port settings if needed.

## Deployment Security Checklist

- Set `NODE_ENV=production` for deployed API environments.
- Use strong unique passwords for all rows in `admin_users` and rotate seeded defaults before go-live.
- Restrict `ALLOWED_ORIGINS` to exact trusted frontend domains only.
- Set `TRUST_PROXY=1` only when the API is behind a single trusted reverse proxy; leave unset/`0` for local development or direct exposure.
- Set frontend `VITE_API_URL` when frontend and API are on different domains; leave it unset only when production uses same-origin `/api` routing/proxying.
- Prefer `DATABASE_URL_RUNTIME` with least-privilege DB permissions for API runtime.

## If This Were Production

- Move admin sessions from in-memory storage to a shared store (for example Redis) to support restarts and horizontal scaling.
- Add dedicated CSRF defenses for cookie-authenticated mutating admin routes.
- Add stronger admin controls such as MFA and structured auth audit logs.

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

Licensed under the MIT License. See `LICENSE`.
