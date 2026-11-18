# The Ark Victory Church: Website & App (Version 1)

This is the new public website and installable web app for **The Ark Victory Church**, Sembakkam, Chennai. It replaces the WordPress site at thearkvictorychurch.com.

> **Version 1** (this repo) is the public app plus a small staff admin.
> **Version 2** (ChurchOS) is the full back office. It will grow out of this codebase; see `docs/ARCHITECTURE.md` §10.

## What's included

**Public site** (an installable PWA: home-screen icon, mobile tab bar, works offline, update prompts):
- **Pages:** Home, About, Mission, Journey, Gallery, Service times, Other services, Live worship, Ministries (10 pages), Events, Get involved, Givings, Contact, Privacy
- **Event registration:** capacity limits (seat numbers are never shown publicly — only “Registration open / Waitlist open / Fully booked”), automatic waitlist, QR ticket, email confirmation, `.ics` calendar file, and a self-service manage/cancel link
- **Forms:** volunteer applications, plus contact, enquiries and confidential prayer requests
- **SEO:** sitemap, JSON-LD (Church + Event), Open Graph, and 301 redirects from every old WordPress URL

**Staff admin** (`/admin`):
- Dashboard
- **Events:** create, edit and cancel events; view and search registrations; check in by QR or reference; export CSV
- **Inboxes:** enquiry and prayer inbox; volunteer review with approve/decline emails
- **Content:** service timings and home-page announcements
- **Page content editor:** edit every page's text and photos with no code. It has a photo library with upload, version history with restore, and reset to original.
- **Access:** users and roles (ADMIN / EDITOR), plus an audit log

**Content parity:** everything on the old site was carried over. See `docs/CONTENT_INVENTORY.md`, including the list of items that **need confirmation from church leadership**.

## Tech
Next.js 16 (App Router, React 19, TypeScript) · Tailwind CSS 4 · PostgreSQL 16 + Prisma 6 · Zod · Nodemailer · Docker

## Quick start (local)
Run these from inside the `ark-web/` folder:
```bash
cp .env.example .env              # then set AUTH_SECRET, ADMIN_PASSWORD and DATABASE_URL
npm install
npx prisma migrate deploy
npm run db:seed -- --demo         # service times + first admin (+ 15 demo events, bookings, inbox items)
npm run dev                       # http://localhost:3000  ·  staff: /admin
```
**Database:** use any Postgres 14+. Either run your own (e.g. a local `ark_web` database), or
start the bundled one with `docker compose up -d db` (localhost:5434). Set `DATABASE_URL` in `.env` to match.

**Testing the PWA:** the service worker only registers in production builds.
Run `npm run build && npm start`, open the site in Chrome, then use DevTools → Application → Manifest / Service workers.
> Behind a TLS-intercepting corporate proxy, prefix commands with
> `NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt`.

## Scripts
| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Develop, build and run |
| `npm run lint` / `typecheck` | ESLint / TypeScript |
| `npm test` | Unit tests (time and recurrence maths, capacity rules, ICS, validation) |
| `npm run test:integration` | Concurrency test against Postgres (30 simultaneous bookings → never overbooked) |
| `npm run test:e2e` | Real-browser smoke test of every journey (needs a running server; see the file header) |
| `npm run test:sync` | Admin ⇄ public ⇄ database sync in a real browser: create/edit/unpublish/cancel events, live refresh, registrations, enquiries, volunteers, no seat numbers in public (needs a running server; cleans up after itself) |
| `npm run test:pwa` | Installability, service worker, offline behaviour, no caching of private pages |
| `npm run screenshots` | Re-capture the app screenshots used by the install dialog |
| `npm run db:migrate` | Apply migrations (production) |
| `npm run db:seed` | Seed service times and the first admin (idempotent) |
| `npm run admin:create -- --email … --name … --role ADMIN` | Create a staff user or reset a password |
| `npm run images:optimize` | Re-import images from the legacy WordPress crawl |

## Project layout
```
src/
  app/(site)/        public pages
  app/admin/         staff area: (auth)/login, (panel)/*
  app/api/           health check, .ics download
  components/        layout, ui, forms, admin, site
  content/           ✏️ editable page content (site facts, about, ministries, pages)
  lib/               validation, time (IST), ics, session token, utils
  server/            domain layer: registrations, enquiries, volunteers, auth, mail, rate limiting
  proxy.ts           admin gate, 410 for old WordPress endpoints
prisma/              schema, migrations, seed
docs/                ARCHITECTURE, CONTENT_INVENTORY, OPERATIONS
tests/               unit, integration, e2e
```

## Deploying
See **`../DEPLOYMENT.md`** for every way to deploy (with step-by-step instructions), and **`docs/OPERATIONS.md`** for the go-live checklist, backups, data retention and the event-day check-in guide.
