# Deploying The Ark Victory Church app

This guide covers every realistic way to put the app on the internet — free and paid, managed and
self-hosted — plus the ways that **won't** work and why. It covers both the **public website** and the
**staff admin** (`/admin`), because they are one application and are always deployed together.

> Prices are approximate (late 2026) and change often — always confirm on the provider's pricing page.

---

## Contents

1. [Recommendation (read this first)](#1-recommendation-read-this-first)
2. [What this app needs to run](#2-what-this-app-needs-to-run)
3. [Steps common to every deployment](#3-steps-common-to-every-deployment)
4. [All options at a glance](#4-all-options-at-a-glance)
5. [Option-by-option instructions](#5-option-by-option-instructions)
6. [Deploying through GitHub & showing it to clients](#6-deploying-through-github--showing-it-to-clients)
7. [The admin area: deploying and securing it](#7-the-admin-area-deploying-and-securing-it)
8. [Domain, HTTPS and Cloudflare](#8-domain-https-and-cloudflare)
9. [After deploying: verify, update, roll back, back up](#9-after-deploying-verify-update-roll-back-back-up)
10. [Options that do NOT work (and why)](#10-options-that-do-not-work-and-why)

---

## 1. Recommendation (read this first)

| If you want… | Choose | Cost / month | Why |
|---|---|---|---|
| **Easiest and professional** (no server to look after) | **Vercel** (app) + **Neon** or **Supabase** (database) — [§5.1](#51-vercel--neon-or-supabase--easiest) | ₹0 to start; ~$20 (Vercel Pro) + $0–19 (DB) for an organisation | Push to GitHub → live in ~2 minutes. HTTPS, CDN, preview links for every change, instant rollback. Nothing to patch. |
| **Best value and full control** | **One VM + Docker Compose + Caddy** — [§5.2](#52-one-vm--docker-compose--caddy--best-value-full-control) | ~$4–12 (or ₹0 on Oracle Free Tier) | Already scripted in this repo (`Dockerfile`, `docker-compose.yml`). App + database on one machine, flat price, India regions available. You handle updates and backups. |
| **To show clients a working demo from GitHub** | **GitHub Codespaces** (one click, runs on GitHub) or **GitHub + Vercel** for an always-on link — [§6](#6-deploying-through-github--showing-it-to-clients) | ₹0 | Demo data and admin login are set up automatically. |
| **VM price with a Vercel-like dashboard** | **Coolify** (or Dokploy) on a VM — [§5.3](#53-coolify--dokploy--caprover-on-a-vm--self-hosted-paas) | Same as the VM | Point-and-click deploys from GitHub, automatic HTTPS, database backups to S3 — on your own server. |

**Our pick for The Ark:** start with **Vercel + Neon/Supabase** (fastest to launch, least to maintain for
a church office). If monthly cost or data control becomes the priority, move to **a VM with Docker
Compose or Coolify** — the code needs no changes either way.

> **About Vercel's free (Hobby) plan:** it is licensed for personal, non-commercial use. A church
> website is non-profit, but if you take donations or want to be safe, use **Pro** — or pick a VM option.

---

## 2. What this app needs to run

Knowing this explains which hosts work and which don't.

| Need | Detail | Consequence |
|---|---|---|
| **A Node.js server** (Node 20+) | Next.js 16 with server rendering, server actions (forms, admin), API routes (`/api/health`, `/api/events/…/ics`), and `src/proxy.ts` (guards `/admin`). | **Static hosting cannot run it** (GitHub Pages, S3 website, Surge…). |
| **PostgreSQL 16** | All data: services, events, registrations, enquiries, admin users, page content, rate limits — **and uploaded photos** (stored in the `media` table). | The app server keeps **no files** → it works on serverless and auto-scaling platforms. Back up the database and you've backed up everything. |
| **Native module `sharp`** | Resizes uploaded photos. | Fine on Linux servers, containers, Vercel, Netlify, Cloud Run. **Not on Cloudflare Workers**. |
| **Outbound SMTP** (optional) | Confirmation and notification emails via `nodemailer`. | Some VM hosts block mail ports for new accounts (e.g. DigitalOcean) — use port **2525** (Brevo, SES, SendGrid support it) or ask support to unblock. |
| **Environment variables** | See [§3.1](#31-environment-variables). | Set them in the host's dashboard or `.env`. |
| **Repo layout** | The app lives in the **`ark-web/`** sub-folder of this repository. | On every platform, set **Root Directory = `ark-web`**. |

The **public site and the admin are the same deployment**. `/admin` is protected by login (signed
session cookie, rate-limited) and is never indexed or cached. See [§7](#7-the-admin-area-deploying-and-securing-it).

---

## 3. Steps common to every deployment

### 3.1 Environment variables

Copy `ark-web/.env.example` and fill in production values:

| Variable | Required | Production value |
|---|---|---|
| `SITE_URL` | ✅ | `https://thearkvictorychurch.com` (must be **https**, no trailing slash — enables HSTS, used in emails, sitemap, QR links) |
| `DATABASE_URL` | ✅ | `postgresql://USER:PASSWORD@HOST:5432/DB?schema=public` (add `&sslmode=require` for managed databases) |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 48` — keep it secret; changing it signs all staff out |
| `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` | first run | Used once by the seed to create the first admin. **Delete `ADMIN_PASSWORD` afterwards.** |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | recommended | Amazon SES (Mumbai), Brevo, Zoho, Google Workspace. Empty `SMTP_HOST` = emails only written to logs. |
| `OFFICE_NOTIFY_EMAIL` | recommended | Inbox that receives new enquiries / volunteers / registrations |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | recommended | Free bot protection: dash.cloudflare.com → Turnstile |
| `TRUSTED_PROXY_COUNT` | ✅ | Number of proxies in front of the app — used for per-visitor rate limits. See table below. |

**`TRUSTED_PROXY_COUNT` by platform** (verify after launch by submitting a form and checking the IP in
Admin → Enquiries):

| Setup | Value |
|---|---|
| Vercel, Render, Railway, Fly.io, Heroku | `1` |
| VM + Caddy/Nginx | `1` |
| VM + Caddy + Cloudflare proxy (orange cloud) | `2` |
| Google Cloud Run, AWS behind a load balancer | `2` (check) |

### 3.2 Database: create, migrate, seed

1. **Create** a PostgreSQL 16 database (managed, or the `db` container on a VM).
2. **Migrate** (creates/updates tables — run on every release that changes `prisma/`):
   ```bash
   cd ark-web
   DATABASE_URL="postgresql://…" npm run db:migrate        # = prisma migrate deploy
   ```
   > With a **pooled** connection string (Neon `-pooler` host, Supabase port `6543`), run migrations
   > with the **direct** (non-pooled) URL instead. Use the pooled URL for the running app.
3. **Seed once** — service times + first admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD`:
   ```bash
   DATABASE_URL="postgresql://…" ADMIN_EMAIL=… ADMIN_NAME="…" ADMIN_PASSWORD=… npm run db:seed
   ```
   Do **not** use `-- --demo` in production (it adds sample events).

### 3.3 Build and start (any Node host)

```bash
cd ark-web
npm ci                 # also runs `prisma generate`
npm run build          # Next.js standalone build
npm run start          # serves on $PORT (default 3000)
```
Docker hosts use the included `Dockerfile` (target `runner`) instead — it produces a small image that
runs `node server.js` and has a health check on `/api/health`.

---

## 4. All options at a glance

✅ works as-is · ⚠️ works with caveats · ❌ not without rewriting the app

| # | Option | Type | Free? | Approx. cost/month | India region | Effort | Works? |
|---|---|---|---|---|---|---|---|
| 5.1 | **Vercel** + Neon/Supabase | Managed serverless | Hobby (non-commercial) | $0 / $20 Pro + DB $0–19 | Mumbai (`bom1`) | ★ Easiest | ✅ |
| 5.2 | **VM + Docker Compose + Caddy** (Hetzner, DigitalOcean, AWS Lightsail, Linode, Vultr, Oracle, E2E Networks…) | Self-managed server | Oracle Always Free | $4–12 | Mumbai/Bangalore/Chennai on many | ★★ | ✅ |
| 5.3 | **Coolify / Dokploy / CapRover** on a VM | Self-hosted PaaS | Software free | VM cost | As VM | ★★ | ✅ |
| 5.4 | **Render** | Managed PaaS | Free tier (sleeps; free DB expires) | ~$7 app + ~$7 DB | Singapore | ★ | ✅ |
| 5.5 | **Railway** | Managed PaaS | Trial credit | ~$5–15 usage | Singapore | ★ | ✅ |
| 5.6 | **Fly.io** | Managed containers | No (pay-as-you-go) | ~$5–10 + DB | Mumbai (`bom`) | ★★ | ✅ |
| 5.7 | **DigitalOcean App Platform** + Managed PG | Managed PaaS | Static only | ~$5–12 app + ~$15 DB | Bangalore | ★ | ✅ |
| 5.8 | **Google Cloud Run** (+ Cloud SQL or Neon) | Serverless containers | Generous free tier | ~$0–5 app + DB | Mumbai, Delhi | ★★★ | ✅ |
| 5.9 | **Firebase App Hosting** (+ external Postgres) | Managed (Cloud Run underneath) | Blaze pay-as-you-go | ~$0–5 + DB | via Cloud Run regions | ★★ | ⚠️ verify Next 16 support |
| 5.10 | **AWS** — ECS Fargate / Elastic Beanstalk / Lightsail Containers / Amplify + RDS | Cloud | 12-month free tier (some) | $15–40+ | Mumbai, Hyderabad | ★★★ | ✅ (Amplify ⚠️) |
| 5.11 | **Azure** — App Service / Container Apps + Azure PostgreSQL | Cloud | Free credits | $15–40+ | **South India (Chennai)**, Central India | ★★★ | ✅ |
| 5.12 | **Netlify** | Managed serverless | Free tier | $0 / $19 Pro + DB | — (global edge) | ★★ | ⚠️ adapter must support Next 16 |
| 5.13 | **Heroku** | Managed PaaS | No | ~$5–7 dyno + ~$5 DB | — (EU/US) | ★ | ✅ (far from India) |
| 5.14 | **Kubernetes** (EKS, GKE, AKS, DOKS, k3s) | Orchestrated containers | No | $20–100+ | Yes | ★★★★ | ✅ (overkill) |
| 5.15 | **cPanel / shared hosting with Node.js** (Hostinger, A2…) | Shared | No | ₹200–800 | Yes | ★★★ | ⚠️ needs external Postgres |
| 5.16 | **Church/home server + Cloudflare Tunnel** | Self-hosted | Yes | Electricity | Local | ★★ | ⚠️ reliability |
| 6.2 | **GitHub Codespaces** (demo only) | Cloud dev container on GitHub | 120 core-hours/month | ₹0 | — | ★ One click | ✅ for demos, not production |
| 10 | GitHub Pages, Cloudflare Pages/Workers, S3 static, Firebase *Hosting*, Surge, WordPress hosting | Static / edge | — | — | — | — | ❌ |

---

## 5. Option-by-option instructions

### 5.1 Vercel + Neon or Supabase — easiest

**Best for:** launching quickly with no server maintenance. Vercel is made by the Next.js team.

**Database first**
- **Neon** (neon.tech): create a project (pick the nearest region, e.g. Singapore). Copy both the
  **pooled** connection string (host contains `-pooler`) and the **direct** one.
- **or Supabase** (supabase.com): create a project in **Mumbai (ap-south-1)** → Project Settings →
  Database. Use the **transaction pooler** (port `6543`, append `?pgbouncer=true`) for the app and the
  **direct** connection (port `5432`) for migrations. Free projects pause after a week without traffic —
  use Pro ($25) for production.

Run migrations and seed from your laptop with the **direct** URL ([§3.2](#32-database-create-migrate-seed)).

**Deploy the app**
1. Go to vercel.com → **Add New → Project** → import `flochyeager0912-prog/ARK` from GitHub.
2. **Root Directory:** `ark-web`. Framework preset: **Next.js** (auto-detected). Leave build/install commands default.
3. **Environment Variables:** add everything from [§3.1](#31-environment-variables) with
   `DATABASE_URL` = the **pooled** string and `TRUSTED_PROXY_COUNT=1`.
4. **Settings → Functions → Region:** `bom1` (Mumbai) — keep it close to the database.
5. **Deploy.** You get `https://<project>.vercel.app`.
6. **Settings → Domains:** add `thearkvictorychurch.com` and `www`, then create the DNS records Vercel shows.
7. Update `SITE_URL` to the real domain and **Redeploy**.

**Ongoing:** every push to `main` deploys automatically; every pull request gets its own preview URL.
Roll back from **Deployments → ⋯ → Promote to Production** on an earlier build.
When a release changes `prisma/`, run `npm run db:migrate` (direct URL) **before** merging.

**Notes:** image optimisation and function time count toward plan limits — fine for a church site.
No database backups are needed on the app side; use Neon/Supabase point-in-time restore.

---

### 5.2 One VM + Docker Compose + Caddy — best value, full control

**Best for:** lowest flat cost, data under your control, India data centres. Everything is already in
the repo (`ark-web/Dockerfile`, `ark-web/docker-compose.yml`).

**Pick a VM** (Ubuntu 24.04, **2 vCPU / 2–4 GB RAM**, 40 GB disk):

| Provider | Approx. price | India? | Note |
|---|---|---|---|
| Hetzner Cloud | ~€4–8 | No (Singapore nearest) | Best price/performance |
| DigitalOcean Droplet | ~$12 (2 GB) | **Bangalore** | Mail ports blocked for new accounts → use SMTP port 2525 |
| AWS Lightsail | ~$10–12 | **Mumbai** | Simple fixed pricing, AWS account |
| Akamai/Linode, Vultr | ~$10–12 | **Mumbai / Bangalore / Chennai (Akamai)** | |
| Oracle Cloud Always Free | **₹0** | **Mumbai, Hyderabad** | Free ARM VM (up to 4 cores / 24 GB); sign-up needs a card; capacity can be scarce |
| Azure / Google Cloud VM | ~$15–30 | **Chennai** (Azure South India), Mumbai | |
| E2E Networks, Hostinger VPS (India) | ₹500–1,500 | **India** | Indian billing / GST invoices |

**Set it up**
```bash
# 1. On the VM: install Docker + firewall
curl -fsSL https://get.docker.com | sh
sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable

# 2. Get the code
sudo mkdir -p /srv && cd /srv
sudo git clone https://github.com/flochyeager0912-prog/ARK.git ark && cd ark/ark-web

# 3. Configure
cp .env.example .env && nano .env
#   SITE_URL=https://thearkvictorychurch.com
#   AUTH_SECRET=$(openssl rand -base64 48)
#   POSTGRES_PASSWORD=<long random>      ← used by docker-compose for the db container
#   (DATABASE_URL is set automatically by docker-compose for the app container)
#   SMTP_…, OFFICE_NOTIFY_EMAIL, TURNSTILE_…, TRUSTED_PROXY_COUNT=1 (2 if Cloudflare proxied)

# 4. Start database + migrations + app (app listens on 127.0.0.1:3000 only)
docker compose --profile app up -d --build

# 5. First time only: service times + first admin
docker compose --profile app run --rm migrate npx tsx prisma/seed.ts
#   then remove ADMIN_PASSWORD from .env
```

**HTTPS with Caddy** (automatic Let's Encrypt certificates):
```bash
sudo apt install -y caddy
sudo tee /etc/caddy/Caddyfile >/dev/null <<'EOF'
thearkvictorychurch.com, www.thearkvictorychurch.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3000
}
EOF
sudo systemctl reload caddy
```
Point the domain's **A record** at the VM's IP. Caddy obtains the certificate on the first request.
(Nginx + Certbot works too if you prefer.)

**Update:** `cd /srv/ark/ark-web && git pull && docker compose --profile app up -d --build`
(migrations run automatically before the new app starts).

**Roll back:** `git checkout <previous-commit> && docker compose --profile app up -d --build`
(only safe if that release added no database migration).

**Backups:** nightly `pg_dump` cron + off-site copy — see `ark-web/docs/OPERATIONS.md` §6.
Also enable the provider's weekly VM snapshots (~20% of VM price).

**Security basics:** `sudo apt install unattended-upgrades`, SSH keys only (disable password login),
keep the app bound to `127.0.0.1` (as in `docker-compose.yml`).

---

### 5.3 Coolify / Dokploy / CapRover on a VM — self-hosted PaaS

**Best for:** a VM's price with a web dashboard, GitHub push-to-deploy, logs and backups in a UI.

**Coolify** (coolify.io — free, open source; a hosted "Coolify Cloud" control panel is also offered):
1. Get a VM as in [§5.2](#52-one-vm--docker-compose--caddy--best-value-full-control) (2 vCPU / 4 GB recommended).
2. Install: `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash`, open `http://<vm-ip>:8000`, create the admin account.
3. **+ New → Database → PostgreSQL 16.** Enable **scheduled backups** to S3/Backblaze/R2. Copy its internal connection URL.
4. **+ New → Application → GitHub** (install the Coolify GitHub App) → repo `ARK`, branch `main`.
   - **Base directory:** `/ark-web` · **Build pack:** Dockerfile · **Dockerfile target:** `runner` · Port `3000`.
   - Environment variables from [§3.1](#31-environment-variables), `DATABASE_URL` = the internal URL.
   - **Pre-deployment command:** `npx prisma migrate deploy` (or run it once from your laptop per release).
   - Domain: `https://thearkvictorychurch.com` → Coolify issues the certificate.
5. Deploy; enable **auto-deploy on push**. Seed once from your laptop ([§3.2](#32-database-create-migrate-seed)).

**Dokploy** (dokploy.com) and **CapRover** (caprover.com) work the same way: create a Postgres
service, create an app from the GitHub repo with build context `ark-web` and the Dockerfile, set env vars.

---

### 5.4 Render

1. render.com → **New → PostgreSQL** (region **Singapore**). Paid plans (~$7+) include backups; the free
   database **expires after ~30 days** — not for production.
2. **New → Web Service** → connect GitHub repo.
   - **Root Directory:** `ark-web` · **Runtime:** Docker (uses the Dockerfile) — *or* Node with
     Build `npm ci && npm run build`, Start `npm run start`.
   - **Pre-Deploy Command:** `npx prisma migrate deploy` (Node runtime).
   - **Health Check Path:** `/api/health`.
   - Env vars from §3.1; `DATABASE_URL` = the database's **Internal** URL; `TRUSTED_PROXY_COUNT=1`.
3. Instance type: **Starter** (~$7). The free instance sleeps after 15 min idle (30–60 s first load).
4. **Settings → Custom Domains** → add the domain, set DNS records. Seed once (§3.2) using the **External** DB URL.

Auto-deploys on push; rollback from **Events → Rollback**.

---

### 5.5 Railway

1. railway.com → **New Project → Deploy from GitHub repo** → `ARK`.
2. Service **Settings → Root Directory:** `/ark-web`. Railway detects the Dockerfile (or uses Nixpacks/Railpack for Node).
3. **+ New → Database → PostgreSQL** in the same project. In the app's variables set
   `DATABASE_URL=${{Postgres.DATABASE_URL}}` plus the rest of §3.1.
4. **Settings → Deploy → Pre-deploy command:** `npx prisma migrate deploy`. Healthcheck path `/api/health`.
5. Region: Singapore (Southeast Asia). **Networking → Custom Domain.** Seed once via `railway run npm run db:seed`.

Billing is usage-based (Hobby plan ~$5/month includes credit). Easy rollbacks from the Deployments list.

---

### 5.6 Fly.io

```bash
# install flyctl, then from ark-web/:
fly launch --no-deploy --region bom          # Mumbai; uses the Dockerfile
fly secrets set AUTH_SECRET=… SITE_URL=https://thearkvictorychurch.com SMTP_HOST=… TRUSTED_PROXY_COUNT=1 …
```
- **Database:** use an external managed Postgres (Neon/Supabase, or Fly's managed Postgres offering)
  and `fly secrets set DATABASE_URL=…`.
- In `fly.toml` set `internal_port = 3000`, a `[[http_service.checks]]` on `/api/health`, and
  `[deploy] release_command = "npx prisma migrate deploy"` (the runner image lacks the Prisma CLI —
  either run migrations from your laptop or build with `--build-target migrate` for a separate release step).
- `fly deploy` · `fly certs add thearkvictorychurch.com` for the domain.

Pay-as-you-go: a shared-CPU 512 MB–1 GB machine costs a few dollars a month.

---

### 5.7 DigitalOcean App Platform

1. **Create → Database → PostgreSQL 16**, region **BLR1 (Bangalore)** (~$15/month, daily backups included).
2. **Create → Apps → GitHub** → repo `ARK`, **Source directory** `ark-web`. It detects the Dockerfile.
3. HTTP port `3000`, health check `/api/health`. Attach the database (injects `${db.DATABASE_URL}`).
4. Add a **Pre-deploy job**: `npx prisma migrate deploy` (Node buildpack) or run migrations from your laptop.
5. Env vars from §3.1 (`TRUSTED_PROXY_COUNT=1`), add your domain under **Settings → Domains**.

---

### 5.8 Google Cloud Run

```bash
# From ark-web/, with gcloud installed and a project selected
gcloud run deploy ark-web --source . --region asia-south1 \
  --allow-unauthenticated --port 3000 \
  --set-env-vars SITE_URL=https://thearkvictorychurch.com,TRUSTED_PROXY_COUNT=2 \
  --set-secrets AUTH_SECRET=auth-secret:latest,DATABASE_URL=database-url:latest
```
- Builds the Dockerfile with Cloud Build (set `--build-arg`/target if needed; the default final stage is `runner`).
- **Database:** Cloud SQL for PostgreSQL in `asia-south1` (~$10+/month, connect via the Cloud SQL
  connector) **or** Neon/Supabase over the internet.
- Run migrations as a **Cloud Run Job** from the `migrate` image target, or from your laptop.
- Domain: Cloud Run **domain mappings** or a global load balancer. Scales to zero → near-free at low traffic
  (set `--min-instances 1` to avoid cold starts, ~$10–15/month).

### 5.9 Firebase App Hosting

Firebase **App Hosting** (not classic Firebase Hosting) runs Next.js server apps on Cloud Run:
`firebase init apphosting` → connect the GitHub repo, **root directory `ark-web`**, set env vars/secrets
in `apphosting.yaml`, use Neon/Supabase/Cloud SQL for Postgres. Requires the Blaze (pay-as-you-go) plan.
⚠️ Confirm App Hosting supports **Next.js 16** before choosing it.

---

### 5.10 Amazon Web Services

| Service | How | Notes |
|---|---|---|
| **Lightsail VM** | Follow §5.2 | Simplest AWS route, Mumbai region, fixed price |
| **Lightsail Containers** | Push the `runner` image, set env vars, attach **Lightsail managed Postgres** | ~$10 + ~$15 |
| **ECS Fargate** + **RDS PostgreSQL** + **ALB** | Push image to ECR, task definition (port 3000, health `/api/health`), service behind an Application Load Balancer, ACM certificate | Most "enterprise"; ~$40+/month |
| **Elastic Beanstalk** (Docker platform) | `eb init` / `eb create` from `ark-web/` with the Dockerfile; RDS separately | |
| **Amplify Hosting** | Connect GitHub, app root `ark-web`, SSR auto-detected | ⚠️ Confirm Next.js 16 support first; DB via RDS/Neon |

Region: **ap-south-1 (Mumbai)** or ap-south-2 (Hyderabad). Use **SES (Mumbai)** for email.

### 5.11 Microsoft Azure

- **Azure App Service (Linux, Node 20)** — deploy from GitHub (Deployment Center), app root `ark-web`,
  startup command `npm run start`; or **Web App for Containers** with the Docker image.
- **Azure Container Apps** — `az containerapp up --source ./ark-web --ingress external --target-port 3000`.
- Database: **Azure Database for PostgreSQL – Flexible Server**.
- Region: **South India (Chennai)** — the closest data centre to the church. Non-profits can apply for
  Azure grant credits (Microsoft for Nonprofits).

### 5.12 Netlify

Import from GitHub, **Base directory** `ark-web`. Netlify runs Next.js through its OpenNext-based adapter.
Use Neon/Supabase for Postgres and run migrations from your laptop. ⚠️ Check that the adapter supports
**Next.js 16** and `proxy.ts`; Vercel or a container host is the safer choice for this version.

### 5.13 Heroku

`heroku create`, add **Heroku Postgres** (Essential, ~$5), set `PROJECT_PATH=ark-web` with a monorepo
buildpack (or deploy the Dockerfile with `heroku stack:set container`), add a `release` phase
`npx prisma migrate deploy`. Works fine, but there's no free tier and no India region.

### 5.14 Kubernetes

Possible on EKS / GKE / AKS / DigitalOcean Kubernetes / k3s: a `Deployment` of the `runner` image
(readiness/liveness on `/api/health`), a `Job` for migrations, an Ingress with cert-manager, and a
managed Postgres. **Overkill** for one church website — only if your organisation already runs Kubernetes.

### 5.15 cPanel / shared hosting with Node.js support

Some shared hosts (Hostinger Business, A2, etc.) offer **"Setup Node.js App"** (Phusion Passenger).
1. Build locally: `npm ci && npm run build`.
2. Upload `.next/standalone/` contents, plus `.next/static` → `.next/static` and `public/` → `public/`.
3. Set the application startup file to `server.js`, Node 20, and environment variables in cPanel.
4. Most shared hosts only offer **MySQL**, so use an **external PostgreSQL** (Neon/Supabase).

⚠️ Memory/process limits, no shell on cheaper plans, and `sharp` may fail to load. Prefer a VPS.

### 5.16 Church or home server + Cloudflare Tunnel (free)

Run §5.2's Docker Compose on any always-on Linux machine at church. Instead of opening router ports,
install **cloudflared**, create a tunnel, and route `thearkvictorychurch.com` → `http://localhost:3000`
(set `TRUSTED_PROXY_COUNT=1`). Free and private, but the site goes down with the building's power or
internet — fine for a staging copy, risky for the main site.

---

## 6. Deploying through GitHub & showing it to clients

### 6.1 What GitHub can and can't do

| GitHub feature | Can it run this app? | Use it for |
|---|---|---|
| **GitHub Pages** | ❌ Static files only — no Node.js server, no database, no admin | — |
| **GitHub Codespaces** | ✅ Runs the **full app + database** in a cloud container on GitHub, with an https link you can share | **Live demos and client reviews** ([§6.2](#62-live-demo-inside-github-codespaces--no-other-account-needed)) |
| **GitHub + Vercel/Render/Railway** | ✅ GitHub holds the code; the host redeploys on every push | **Permanent client preview link** ([§6.3](#63-a-permanent-client-preview-link-github--vercel)) and production |
| **GitHub Actions** | Runs tests/builds, can push to a server | **CI** (already set up, [§6.4](#64-continuous-integration-github-actions)) and **auto-deploy to a VM** ([§6.5](#65-github-actions--your-vm-auto-deploy)) |

**In short:** to *show* the app from GitHub alone, use **Codespaces**. For a link that stays online
24/7 (clients can open it any time), connect the GitHub repo to **Vercel** — it takes 10 minutes and is free for a demo.

---

### 6.2 Live demo inside GitHub Codespaces — no other account needed

The repository includes a ready-made setup (`.devcontainer/`): one click builds the website, the admin
and a PostgreSQL database **with sample events, registrations and inbox items**, all running on GitHub.

**Start it (first time ≈ 5–8 minutes):**
1. Open https://github.com/flochyeager0912-prog/ARK
2. Click **Code → Codespaces → Create codespace on main**
   (or the **Open in GitHub Codespaces** button in `README.md`).
3. Wait for setup to finish in the terminal — it installs, creates the database, loads demo content and
   builds the production site. At the end it prints:
   ```
   Website : https://<codespace-name>-3000.app.github.dev
   Admin   : https://<codespace-name>-3000.app.github.dev/admin   (admin@example.com / <generated password>)
   ```
   (Reprint any time with `bash .devcontainer/start.sh`.)
4. Open the **Ports** tab → port **3000** → click the globe icon to open the site.

**Share it with clients:**
1. **Ports** tab → right-click port **3000** → **Port Visibility → Public**.
2. Copy the forwarded address and send it. Anyone with the link can open the public site; give the
   admin login only to people who should see the admin.
3. To show the admin yourself, sign in at `/admin` with the printed demo credentials.

**Keep it running during a meeting:**
- A codespace **stops after 30 minutes without activity** (the link stops working). Raise the limit to
  up to 4 hours in GitHub → **Settings → Codespaces → Default idle timeout**, and open the codespace
  shortly before the demo.
- Restarting a stopped codespace starts the site again automatically (same link, same data).
- Free allowance on personal accounts: **120 core-hours/month** (≈ 60 hours on the 2-core machine used here).
  Stop or delete the codespace after the demo: **github.com/codespaces → ⋯ → Stop / Delete**.

**Limits:** it's a demo, not hosting — the link sleeps when the codespace stops, emails are only
logged (no SMTP), and the address changes if you create a new codespace.

**Without GitHub's cloud:** the same `.devcontainer/` works locally in VS Code
(**Dev Containers: Reopen in Container**) with Docker installed.

---

### 6.3 A permanent client preview link (GitHub + Vercel)

For a link that is always online, connect the GitHub repo to Vercel. Every push to `main` updates it
automatically, and every pull request gets its own preview link — ideal for "here's the change, please approve".

1. **Demo database:** create a free **Neon** project (or Supabase). From your laptop, with its *direct*
   connection string:
   ```bash
   cd ark-web
   export DATABASE_URL="postgresql://…direct…?sslmode=require"
   npm run db:migrate
   ADMIN_EMAIL=demo@example.com ADMIN_NAME="Demo Admin" ADMIN_PASSWORD='<choose one>' npm run db:seed -- --demo
   ```
   (`--demo` adds sample events and inbox items — use it for the demo database only.)
2. **vercel.com → Add New → Project → Import** `flochyeager0912-prog/ARK`. Sign in with GitHub.
3. **Root Directory: `ark-web`**. Framework: Next.js (auto).
4. Environment variables: `DATABASE_URL` (Neon **pooled** string), `AUTH_SECRET` (`openssl rand -base64 48`),
   `SITE_URL` (`https://<project>.vercel.app`), `TRUSTED_PROXY_COUNT=1`.
5. **Deploy** → share `https://<project>.vercel.app` with clients (admin at `/admin`).
6. Optional: **Settings → Domains** → add e.g. `demo.thearkvictorychurch.com`.

The free Hobby plan is fine for a demo. For the real launch, follow [§5.1](#51-vercel--neon-or-supabase--easiest)
(or any other option) with a **separate production database without demo data**.

Alternatives with the same "connect GitHub, get a URL" flow: **Render** (free instance sleeps after
15 min; §5.4), **Railway** (§5.5), **DigitalOcean App Platform** (§5.7), **Netlify** (§5.12).

---

### 6.4 Continuous integration (GitHub Actions)

`.github/workflows/ci.yml` runs on every push to `main` and every pull request:
install → database migrations (throw-away Postgres) → lint → typecheck → unit tests → integration
tests → production build → Docker image build. See results in the repo's **Actions** tab.

To block broken code from reaching `main`: **Settings → Branches → Add rule** for `main` →
*Require status checks to pass* → select **test** and **docker**.

---

### 6.5 GitHub Actions → your VM (auto-deploy)

For the VM option (§5.2): every push to `main` builds the image and redeploys the server.
Add repository secrets (**Settings → Secrets and variables → Actions**) `VM_HOST`, `VM_USER`,
`VM_SSH_KEY`, then create `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  workflow_run:                 # deploy only after CI passes on main
    workflows: [CI]
    types: [completed]
    branches: [main]
jobs:
  deploy:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VM_HOST }}
          username: ${{ secrets.VM_USER }}
          key: ${{ secrets.VM_SSH_KEY }}
          script: |
            cd /srv/ark && git pull --ff-only
            cd ark-web && docker compose --profile app up -d --build
```
Other targets have official actions: Google Cloud Run (`google-github-actions/deploy-cloudrun`),
AWS ECS (`aws-actions/amazon-ecs-deploy-task-definition`), Azure (`azure/webapps-deploy`),
Fly.io (`superfly/flyctl-actions`). Managed hosts (Vercel, Render, Railway…) need no workflow — they
deploy from GitHub by themselves.

---

## 7. The admin area: deploying and securing it

- **Same deployment:** the admin lives at `https://<your-domain>/admin`. There's nothing separate to deploy.
  Every option above serves both the public site and the admin.
- **Create the first admin:** `npm run db:seed` with `ADMIN_EMAIL` / `ADMIN_NAME` / `ADMIN_PASSWORD`
  (§3.2), then sign in at `/admin/login` and **remove `ADMIN_PASSWORD`** from the environment.
- **More staff:** Admin → Users (ADMIN role), or
  `npm run admin:create -- --email x@y.com --name "Name" --role EDITOR` with `DATABASE_URL` set.
  Running it again for the same email resets that password.
- **Built-in protection:** signed session cookies (`AUTH_SECRET`), login rate-limiting, every admin page
  and action re-checks the session, `/admin` is `no-store` and `noindex`.

**Optional extra layer (recommended for production):**

| Method | How | Cost |
|---|---|---|
| **Cloudflare Access** (Zero Trust) | Protect `thearkvictorychurch.com/admin*` with an Access application; staff verify by email one-time code before the login page even loads | Free up to 50 users |
| **IP allow-list in Caddy** | `@admin path /admin*` + `remote_ip <church-office-IP>` → `respond 403` for others | Free |
| **Vercel Deployment Protection / password** | Pro add-ons; protects previews | Plan-dependent |

A separate `admin.` subdomain would need code changes (routing + cookie scope) and isn't necessary.

---

## 8. Domain, HTTPS and Cloudflare

1. **Domain:** keep `thearkvictorychurch.com` at your current registrar (or move DNS to Cloudflare — free).
2. **DNS records:**
   - Vercel: `A @ 76.76.21.21` and `CNAME www cname.vercel-dns.com` (use the exact values the dashboard shows).
   - Render / Railway / Fly / DO App Platform / Cloud Run: the CNAME/A values shown in their domain settings.
   - VM: `A @ <VM IP>` and `A www <VM IP>` (or `CNAME www @`).
3. **HTTPS:** automatic on every managed platform; Caddy on a VM. `SITE_URL` must start with `https://`.
4. **Cloudflare in front (optional):** proxied (orange cloud) gives CDN caching, DDoS protection and
   analytics. Set SSL mode to **Full (strict)** and raise `TRUSTED_PROXY_COUNT` by 1. On Vercel, leave the
   records **DNS-only** (grey cloud) — Vercel already provides a CDN.
5. **Go-live checklist** (DNS cutover from WordPress, redirects, Search Console): `ark-web/docs/OPERATIONS.md` §5.

---

## 9. After deploying: verify, update, roll back, back up

**Verify (5 minutes):**
- `https://<domain>/api/health` → `{"status":"ok","db":"ok"}`
- Home page shows live service times; `/events` lists events; old URL `/about-us/` redirects to `/about`.
- Submit the contact form → appears in Admin → Enquiries; email arrives (if SMTP set).
- Sign in at `/admin`; upload a photo (tests `sharp` + database storage).
- On a phone: "Install app" prompt appears; airplane mode → cached pages still open.
- Automated PWA check against production: `BASE_URL=https://<domain> npm run test:pwa`
  (avoid `test:e2e` / `test:sync` on production — they create test records).

**Monitoring:** free uptime check on `/api/health` (UptimeRobot, Better Stack). Platform logs for errors;
lines starting `[mail]` are email failures.

**Updating:** merge to `main` → auto-deploy (managed/Coolify/Actions) or `git pull && docker compose
--profile app up -d --build` (VM). If `prisma/migrations` changed, migrations must run **before** the new
version serves traffic (pre-deploy command, `migrate` service, or manually).

**Rolling back:** managed platforms have one-click rollback; on a VM, check out the previous commit
and rebuild. Database migrations are not automatically reversed — avoid rolling back across a migration.

**Backups:** the database is the only state (it includes uploaded photos).
- Managed Postgres: enable automatic backups / point-in-time recovery.
- VM: nightly `pg_dump` + off-site copy (`ark-web/docs/OPERATIONS.md` §6), and **test a restore once**.

---

## 10. Options that do NOT work (and why)

| Option | Why not |
|---|---|
| **GitHub Pages** | Static files only — no Node.js server, no server actions, no database, no `/admin`. |
| **Cloudflare Pages / Workers** | Edge runtime: no native `sharp`, Prisma needs driver adapters, Node APIs limited. Would need code changes (OpenNext adapter + image handling rewrite). Cloudflare is still great **in front** of another host (§8) or via Tunnel (§5.16). |
| **Amazon S3 / Azure Blob / GCS static website, Surge, Firebase *Hosting* (classic), Neocities** | Static hosting only. |
| **`next export` (static export)** | The app depends on server rendering, forms, the database and auth — a static export would lose events, registration, contact forms and the entire admin. |
| **WordPress / PHP-only hosting** | No Node.js runtime. |
| **Vercel/Netlify without a database** | There is no built-in Postgres in the app — you must attach Neon, Supabase, or another PostgreSQL. |
| **SQLite / MySQL instead of Postgres** | The Prisma schema targets PostgreSQL; switching needs schema and migration changes. |
