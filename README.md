# The Ark Victory Church — website & app

The public website (installable web app) and staff admin for **The Ark Victory Church**, Sembakkam, Chennai.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/flochyeager0912-prog/ARK?quickstart=1)

↑ One click runs the full app — website, admin and a database with demo content — on GitHub, with a
link you can share. See [DEPLOYMENT.md §6.2](DEPLOYMENT.md#62-live-demo-inside-github-codespaces--no-other-account-needed).

## Repository layout

| Path | What it is |
|---|---|
| [`ark-web/`](ark-web/) | **The application** (Next.js 16 + PostgreSQL): public site, `/admin`, PWA. Start with [`ark-web/README.md`](ark-web/README.md). |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | **Every way to deploy** — managed, server, cloud, free and paid — with step-by-step instructions and a recommendation. |
| [`ark-web/docs/OPERATIONS.md`](ark-web/docs/OPERATIONS.md) | Running it in production: go-live checklist, backups, data retention, event-day check-in. |
| [`ark-web/docs/ARCHITECTURE.md`](ark-web/docs/ARCHITECTURE.md) | How the app is built. |
| [`.devcontainer/`](.devcontainer/) | One-click demo environment for GitHub Codespaces / VS Code Dev Containers. |
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | CI: lint, typecheck, unit + integration tests, production build, Docker build on every push and pull request. |
| `ARK_PUBLIC_APP_ARCHITECTURE.md`, `Ark.docx` | Planning documents. |
| `_legacy-site/` | Archive of the old WordPress site's text and images (source material). |

## Quick start (local)

```bash
cd ark-web
cp .env.example .env            # then fill in DATABASE_URL, AUTH_SECRET, ADMIN_*
docker compose up -d db         # or use any PostgreSQL 16
npm ci
npm run db:migrate
npm run db:seed                 # add  -- --demo  for sample events
npm run dev                     # http://localhost:3000  (admin at /admin)
```

**Production:** `npm run build && npm run start`, or `docker compose --profile app up -d --build`.
For hosting choices, see [DEPLOYMENT.md](DEPLOYMENT.md). On any hosting platform, set the
**root directory to `ark-web`**.
