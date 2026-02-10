# Dental Practice Demo

A portfolio project showing a full-stack appointment booking workflow for a dental office.

Tech stack:
- Frontend: Vite + React
- Backend: Node.js + Express
- Database: PostgreSQL
- Email: Resend

## Live Demo

- URL: `ADD-LIVE-DEMO-LINK-HERE`
- If the demo includes admin pages, provide the demo admin password in your recruiter outreach message (not in this repository).

## What This Project Demonstrates

- Patient appointment booking flow with server-side validation
- Admin session login and protected admin endpoints
- Availability generation from recurring schedules + date exceptions
- Blocked-time management for admins
- Database-level and API-level overlap protection
- Optional transactional email notifications

## Quick Start (Reviewer Friendly)

### 1. Prerequisites

- Node.js 18+
- npm 9+
- Docker Desktop (recommended for one-command DB setup)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Then update `.env` values as needed. The default `DATABASE_URL` in `.env.example` is already set for the Docker database in this repo.

### 4. Start PostgreSQL (one command)

```bash
npm run db:up
```

### 5. Apply schema and seed data

```bash
npm run db:setup
```

### 6. Run backend + frontend

Terminal 1 (API):

```bash
npm run dev:server
```

Terminal 2 (web app):

```bash
npm run dev
```

Open:
- Frontend: http://localhost:5173
- API health check: http://localhost:5050/api/health

## No External Accounts Required For Local Review

- You do not need a Supabase account to run this project locally.
- You do not need a Resend account to run booking flows locally.
- Email is optional; if Resend env vars are missing, appointment creation still works and email is skipped.
- Admin pages require only the local `ADMIN_PASSWORD` from your `.env`.

## Environment Variables

See `.env.example` for defaults.

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | No | API server port (default: `5050`) |
| `VITE_API_URL` | Yes (frontend) | Base URL for frontend API calls |
| `ADMIN_PASSWORD` | Yes (admin features) | Password for admin login |
| `ADMIN_SESSION_TTL_MINUTES` | No | In-memory admin session TTL (default: `30`) |
| `ALLOWED_ORIGINS` | Yes for multi-origin setups | Comma-separated CORS allowlist |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `RESEND_API_KEY` | Optional | Enables outbound email when set |
| `RESEND_FROM` | Optional | Verified sender address for Resend |
| `STAFF_EMAIL` | Optional | Inbox for staff notifications |
| `DEFAULT_SLOT_MINUTES` | No | Fallback slot size used by availability logic |

## Database Setup, Migrations, and Seed Data

### Current migration approach

This demo currently uses SQL files directly instead of a migration framework:
- Schema source: `server/schema.sql`
- Seed source: `server/seed.sql`

`server/schema.sql` is mostly idempotent (`create table if not exists`, guarded constraints), so it can be re-applied safely during local development.

### Standard local DB workflow (Docker)

```bash
npm run db:up
npm run db:migrate
npm run db:seed
```

### Using Supabase instead

This app uses plain PostgreSQL. Supabase is still supported by setting `DATABASE_URL` to your Supabase connection string.

```bash
# with DATABASE_URL pointed at Supabase
npm run db:migrate
npm run db:seed
```

### Schema highlights

- `appointments` has overlap protection, start-time uniqueness, and status-aware exclusion rules
- `blocked_periods` has overlap protection
- `availability` + `exceptions` drive slot generation
- Services are active/inactive and duration-based

## Running Scripts

- `npm run dev` - start Vite dev server
- `npm run build` - create production build in `dist/`
- `npm run preview` - serve production build locally
- `npm run dev:server` - run Express API with file watch
- `npm run start:server` - run Express API without watch
- `npm run db:up` - start PostgreSQL container via Docker Compose
- `npm run db:down` - stop Docker Compose services
- `npm run db:migrate` - apply `server/schema.sql` using `DATABASE_URL`
- `npm run db:seed` - apply `server/seed.sql` using `DATABASE_URL`
- `npm run db:setup` - run migrate + seed

## API Surface (High Level)

Public:
- `GET /api/health`
- `GET /api/services`
- `GET /api/availability`
- `POST /api/appointments`

Admin/authenticated:
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/session`
- `GET /api/appointments`
- `GET /api/blocked-periods`
- `POST /api/blocked-periods`
- `DELETE /api/blocked-periods/:id`

## Resend Email Notes

- Email sending is optional for local demos.
- If `RESEND_API_KEY` or `RESEND_FROM` is missing, appointment creation still succeeds and email sending is skipped.
- Staff emails also require `STAFF_EMAIL`.
- Appointment API responses include per-recipient email outcomes as `sent`, `skipped`, or `failed`.
- Server logs include per-recipient Resend `messageId` values when available.
- Use `RESEND_FROM=onboarding@resend.dev` only for Resend test mode.
- For real sending, configure a verified domain/sender in Resend.

## Reviewer Notes

- This is a demo portfolio project, not a production healthcare system.
- Data is not HIPAA-compliant.
- Admin sessions are in-memory, so they reset on API restart.
- Rate limiting and validation are present, but infrastructure hardening is intentionally lightweight.

## Known Gaps / Next Improvements

- Clarify naming mismatch (`last_initial` column vs API-level `last_name` mapping)
- Add test layers (API, DB smoke, UI smoke)
- Add CI pipeline (`npm ci`, lint, test, build)

## Project Structure (Key Files)

- `server/index.js` - Express API and scheduling logic
- `server/db.js` - PostgreSQL pool configuration
- `server/schema.sql` - schema and DB constraints
- `server/seed.sql` - initial sample data
- `server/email.js` - Resend integration
- `Pages/` - React route/page components
- `components/ui/` - reusable UI primitives
