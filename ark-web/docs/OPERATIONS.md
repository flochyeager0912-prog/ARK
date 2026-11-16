# Operations Runbook: ark-web (Version 1)

## 1. Environments
| Env | URL | Notes |
|---|---|---|
| Local | http://localhost:3000 | `docker compose up -d db` + `npm run dev` |
| Staging | https://new.thearkvictorychurch.com | Used for user acceptance testing (UAT) before cutover. Seed with `--demo` if you want sample events. |
| Production | https://thearkvictorychurch.com | After the DNS cutover (see §5) |

## 2. Required configuration
Every variable is documented in `.env.example`. For production:
- `SITE_URL=https://thearkvictorychurch.com`. Must be `https://`; this enables HSTS and `upgrade-insecure-requests`.
- `AUTH_SECRET`: generate with `openssl rand -base64 48`. Changing it signs everyone out.
- `DATABASE_URL`: a managed Postgres 16, ideally in an India region.
- **SMTP** (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`): use Amazon SES (ap-south-1), Brevo, Zoho or Google Workspace SMTP.
  - Add **SPF, DKIM and DMARC** DNS records for the sending domain, or emails will land in spam.
  - Without SMTP, emails are only written to the server log.
- `OFFICE_NOTIFY_EMAIL`: the inbox that receives notifications about new enquiries, volunteers and registrations.
- **Turnstile keys** (optional but recommended): create a free widget at dash.cloudflare.com → Turnstile.
- `TRUSTED_PROXY_COUNT`: the number of proxies in front of the app (Cloudflare + Caddy = 2). Used to get the real client IP for rate limiting.

## 3. Deploying

### Option A: one VM with Docker Compose (recommended for a small team)
```bash
# On a VM (2 vCPU / 2 GB is plenty), with Docker installed:
git clone <repo> ark-web && cd ark-web
cp .env.example .env && nano .env              # fill in production values
docker compose --profile app up -d --build     # db + migrations + app on 127.0.0.1:3000
docker compose --profile app run --rm migrate npx tsx prisma/seed.ts   # first time only: services + first admin
```
Put **Caddy** (automatic HTTPS) or **Cloudflare** in front:
```
# /etc/caddy/Caddyfile
thearkvictorychurch.com, www.thearkvictorychurch.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3000
}
```
To update: `git pull && docker compose --profile app up -d --build`. Migrations run automatically through the `migrate` service before the app starts.

> The seed and admin scripts need the dev dependencies (`tsx`), which the `migrate` image includes.
> Alternatively, run them from a laptop with `DATABASE_URL` pointed at production:
> `npm run db:seed` and `npm run admin:create -- --email … --name … --role ADMIN`.

### Option B: Vercel with managed Postgres
1. Import the repo into Vercel and set the environment variables (§2). Set the region to `bom1` (Mumbai).
2. Use Neon, Supabase or RDS as Postgres. Run `npm run db:migrate` (with `DATABASE_URL` set) from CI or your laptop on each release.
3. Run `npm run db:seed` once.

## 4. First admin and staff accounts
- `npm run db:seed` creates the first **ADMIN** from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. **Remove `ADMIN_PASSWORD` from `.env` afterwards.**
- Other staff can be added in **Admin → Users** (ADMIN only), or with `npm run admin:create -- --email x@y --name "Name" --role EDITOR`.
- **Forgotten password:** run `npm run admin:create` with the same email. It resets the password and reactivates the account.

## 5. Go-live / DNS cutover checklist
1. [ ] Leadership has reviewed the content, including the "Needs confirmation" list in `CONTENT_INVENTORY.md`.
2. [ ] SMTP is configured and tested: send yourself a contact-form message and an event registration.
3. [ ] SPF, DKIM and DMARC are set up for the sending domain.
4. [ ] Turnstile keys are set.
5. [ ] An admin password has been set and `ADMIN_PASSWORD` removed from `.env`.
6. [ ] Backups are configured (§6) and **one restore has been tested**.
7. [ ] Uptime monitor is pointed at `https://…/api/health` (UptimeRobot or Better Stack, free tier).
8. [ ] **Full WordPress backup taken** (files plus database) and stored off-site.
9. [ ] Lower the DNS TTL to 300 s a day before the switch.
10. [ ] Switch the A/CNAME records for `thearkvictorychurch.com` and `www` to the new host.
11. [ ] Check that old URLs redirect, e.g. `/about-us/`, `/givings/`, `/contact-us/`, `/live-worship/`.
12. [ ] **Google Search Console:** verify the domain, submit `https://thearkvictorychurch.com/sitemap.xml`, and watch "Pages → Not found" for 4 weeks.
13. [ ] Update the website link in the **Google Business Profile**, the YouTube channel, Instagram and Facebook bios.
14. [ ] Keep WordPress available on a hidden URL (or as a backup) for 30 days, then retire it.

## 6. Backups
Postgres is the only state (images live in git under `public/images`).
```bash
# Nightly cron on the VM, keeping 30 days:
0 2 * * * cd /srv/ark-web && docker compose exec -T db pg_dump -U ark -Fc ark > backups/ark-$(date +\%F).dump && find backups -mtime +30 -delete
```
Copy `backups/` off-site, e.g. with `rclone` to Google Drive or S3.

**Restore:** `docker compose exec -T db pg_restore -U ark -d ark --clean < backups/ark-YYYY-MM-DD.dump`

With managed Postgres, turn on point-in-time recovery instead.

## 7. Data retention (DPDP Act 2023)
The privacy notice promises:
- Registrations are kept for 12 months after the event.
- Enquiries and volunteer applications are kept for 24 months.

Run this quarterly, or as a cron job:
```sql
DELETE FROM registration r USING event e WHERE r."eventId" = e.id AND e."startsAt" < now() - interval '12 months';
DELETE FROM enquiry WHERE status = 'RESOLVED' AND "createdAt" < now() - interval '24 months';
DELETE FROM volunteer_application WHERE status IN ('DECLINED') AND "createdAt" < now() - interval '24 months';
DELETE FROM audit_log WHERE "createdAt" < now() - interval '24 months';
DELETE FROM rate_limit_hit WHERE "windowEnd" < now();
```
**Erasure requests:** an ADMIN can delete an enquiry or volunteer application from its page in the admin. For a registration, cancel it, then delete it in SQL if full erasure is requested.

## 8. Everyday content tasks
| Task | Where |
|---|---|
| Change a service time, or hide a service | Admin → Service timings |
| Post a banner (e.g. "Christmas: one combined service at 10 AM") | Admin → Announcements |
| Create an event, see registrations, export, check people in | Admin → Events |
| Reply to enquiries and prayer requests | Admin → Enquiries |
| Review volunteers | Admin → Volunteers |
| Edit any page text: church details, home, about, mission, journey, ministries, services text, giving, get involved, contact, gallery | **Admin → Page content**. Changes go live on save. Use **History → Restore** to undo, or **Reset to original** to return to the launch text. |
| Add photos | **Admin → Photo library**, or **Upload new photo** inside any image field. Photos are resized automatically and location data is removed. |

## 9. Event-day check-in
1. Open **Admin → Events → (event)** on a phone or laptop at the entrance.
2. Scan the attendee's QR code with the phone camera (it shows the `ARK-XXXXXX` reference) or with a USB/Bluetooth scanner. You can also type the reference. Then press **Check in**.
3. Walk-ins: register them on the public event page from the same device.

## 10. Monitoring and troubleshooting
- **Health check:** `GET /api/health` returns 200 `{status:"ok"}`, or 503 if the database is unreachable.
- **Logs:** `docker compose logs -f app`. Lines prefixed `[mail]` mean an email failed to send. The submission is still saved in the database and visible in the admin.
- **"Too many submissions" complaints** usually come from a shared network such as the church Wi-Fi. Limits per IP per hour: enquiries 8, volunteer applications 5, registrations 10. They are configured in `src/server/actions/public.ts`.
- **Locked out after too many logins:** wait 15 minutes, or run `DELETE FROM rate_limit_hit WHERE key LIKE 'login-%';`.

## 11. PWA / service worker
- Bump `VERSION` in `public/sw.js` whenever you change caching logic. Users then see an **"Update available"** toast.
- Ordinary content deploys don't need a version bump, because pages are network-first.
- An installed app shows new content as soon as it's online.
- To clear a broken cache on a device: Chrome → Site settings → Clear data, or DevTools → Application → Storage → Clear site data.
- After a big visual redesign, re-run `npm run screenshots` so the install dialog shows current screenshots.
