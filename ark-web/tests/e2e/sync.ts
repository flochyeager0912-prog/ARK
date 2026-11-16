/**
 * End-to-end sync test: admin ⇄ public ⇄ database, in a real browser.
 *
 *   BASE_URL=http://localhost:3000 E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... \
 *   CHROME_PATH=/usr/bin/google-chrome npm run test:sync
 *
 * Proves that:
 *  - events created / edited / unpublished / cancelled in the admin show up on the public site at once,
 *  - an open public page picks up admin changes by itself (LiveRefresh),
 *  - registrations, enquiries and volunteer applications made on the public site land in Postgres
 *    and appear in the admin,
 *  - the public site never shows seat numbers.
 * Everything it creates is deleted again at the end.
 */
import fs from "node:fs";
import { chromium, type Page } from "playwright-core";
import { PrismaClient } from "@prisma/client";

if (fs.existsSync(".env")) process.loadEnvFile(".env");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const CHROME = process.env.CHROME_PATH ?? "/usr/bin/google-chrome";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? "";
const db = new PrismaClient();
const uniq = Date.now().toString(36);
const TITLE = `Sync Test Night ${uniq}`;
const TITLE_2 = `Sync Test Night (renamed) ${uniq}`;
const humanPause = () => new Promise((r) => setTimeout(r, 2800)); // anti-bot minimum fill time

let failures = 0;
async function step(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✔ ${name}`);
  } catch (e) {
    failures++;
    console.error(`✘ ${name}\n  ${(e as Error).message.split("\n").slice(0, 3).join("\n  ")}`);
  }
}
function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

/** "YYYY-MM-DDTHH:mm" in IST, `days` from now — the value a datetime-local input expects. */
function istInput(days: number, hour: number) {
  const d = new Date(Date.now() + 330 * 60_000 + days * 86_400_000);
  return `${d.toISOString().slice(0, 10)}T${String(hour).padStart(2, "0")}:00`;
}

/** No seat counts anywhere in the visible public page. */
async function assertNoSeatNumbers(page: Page) {
  const text = await page.locator("main").innerText();
  const leak = /\b\d+\s+(seats?|places?|spots?)\s+(left|remaining|available)\b|\b\d+\s*\/\s*\d+\s+booked\b/i.exec(text);
  assert(!leak, `seat number visible on public page: "${leak?.[0]}"`);
}

async function main() {
  assert(ADMIN_EMAIL && ADMIN_PASSWORD, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
  // Repeated local runs would otherwise trip the per-IP form limits. Only localhost counters are cleared.
  await db.rateLimitHit.deleteMany({ where: { OR: [{ key: { endsWith: ":::1" } }, { key: { endsWith: ":127.0.0.1" } }] } });
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const admin = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
  const publicCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const pub = await publicCtx.newPage();
  const consoleErrors: string[] = [];
  pub.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  let eventId = "";

  await step("public: event pages never show seat numbers", async () => {
    for (const slug of ["", "/christmas-carol-service", "/ark-arise-youth-camp", "/couples-dinner", "/christmas-carol-service/register"]) {
      const res = await pub.goto(`${BASE}/events${slug}`);
      assert(res?.ok(), `/events${slug} → ${res?.status()}`);
      await assertNoSeatNumbers(pub);
    }
  });

  await step("admin: sign in", async () => {
    await admin.goto(BASE + "/admin/login");
    await admin.getByLabel("Email").fill(ADMIN_EMAIL);
    await admin.getByLabel("Password").fill(ADMIN_PASSWORD);
    await admin.getByRole("button", { name: "Sign in" }).click();
    await admin.getByRole("heading", { name: "Dashboard" }).waitFor({ timeout: 15000 });
  });

  await step("admin → DB: create a published event", async () => {
    await admin.goto(BASE + "/admin/events/new");
    await admin.getByLabel(/^Title/).fill(TITLE);
    await admin.getByLabel("Short summary").fill("An automated end-to-end sync test event.");
    await admin.getByLabel("Full description").fill("Created by tests/e2e/sync.ts — it is deleted automatically.");
    await admin.getByLabel("Starts (IST)").fill(istInput(9, 18));
    await admin.getByLabel("Ends (IST)").fill(istInput(9, 20));
    await admin.getByLabel("Capacity (seats)").fill("2");
    await admin.getByLabel("Max seats per booking").fill("2");
    await admin.getByLabel("Status").selectOption("PUBLISHED");
    await admin.getByText(TITLE).first().waitFor(); // live preview follows the form
    await admin.getByRole("button", { name: "Create event" }).click();
    await admin.getByText(/Event saved — the public site is updated/).waitFor({ timeout: 15000 });
    const row = await db.event.findFirst({ where: { title: TITLE } });
    assert(row?.status === "PUBLISHED" && row.capacity === 2, "event row missing or wrong in DB");
    eventId = row.id;
  });

  await step("admin → public: new event is listed and open for registration", async () => {
    await pub.goto(BASE + "/events");
    await pub.getByText(TITLE).first().waitFor();
    await pub.goto(`${BASE}/events/sync-test-night-${uniq}`);
    await pub.getByRole("heading", { name: TITLE }).waitFor();
    await pub.getByText("Registration open").first().waitFor();
    await assertNoSeatNumbers(pub);
  });

  await step("admin → public: an open page refreshes itself after an edit", async () => {
    await pub.goto(BASE + "/events");
    await pub.getByText(TITLE).first().waitFor();
    await admin.goto(`${BASE}/admin/events/${eventId}/edit`);
    await admin.getByLabel(/^Title/).fill(TITLE_2);
    await admin.getByRole("button", { name: "Save changes" }).click();
    await admin.getByText(/Event saved/).waitFor({ timeout: 15000 });
    // No navigation on the public tab: LiveRefresh polls / refreshes on focus.
    await pub.waitForTimeout(16_000);
    await pub.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await pub.getByText(TITLE_2).first().waitFor({ timeout: 50_000 });
    assert((await pub.getByText(TITLE, { exact: true }).count()) === 0, "old title still shown");
  });

  let refCode = "";
  await step("public → DB → admin: registration is stored and visible to staff", async () => {
    await pub.goto(`${BASE}/events/sync-test-night-${uniq}`);
    await pub.getByRole("link", { name: "Register now" }).first().click();
    await pub.getByLabel("2 people").check({ force: true });
    await pub.getByLabel("Full name").fill("Sync Registrant");
    await pub.getByLabel("Mobile number").fill("9884265131");
    await pub.getByLabel("Email").fill(`sync-${uniq}@example.com`);
    await pub.locator('input[name="consent"]').check();
    await humanPause();
    await pub.getByRole("button", { name: "Confirm registration" }).click();
    await pub.waitForURL(/\/booking\//, { timeout: 15000 });
    refCode = (await pub.locator("p.font-display").first().innerText()).trim();
    const reg = await db.registration.findUnique({ where: { refCode } });
    assert(reg?.eventId === eventId && reg.seats === 2 && reg.status === "CONFIRMED", "registration not stored correctly");
    await admin.goto(`${BASE}/admin/events/${eventId}`);
    await admin.getByText("Sync Registrant").waitFor();
    await admin.getByText(refCode).waitFor();
  });

  await step("public: full event offers the waitlist — still without numbers", async () => {
    await pub.goto(`${BASE}/events/sync-test-night-${uniq}`);
    await pub.getByText("Waitlist open").first().waitFor();
    await pub.getByRole("link", { name: "Join the waitlist" }).first().waitFor();
    await assertNoSeatNumbers(pub);
  });

  await step("admin → public: unpublish hides the event, publish brings it back", async () => {
    await admin.goto(BASE + "/admin/events");
    const row = admin.locator("li", { hasText: TITLE_2 });
    await row.getByRole("button", { name: "Unpublish" }).click();
    await row.waitFor({ state: "detached", timeout: 15000 }); // drafts leave the Upcoming tab
    await admin.goto(BASE + "/admin/events?show=drafts");
    await admin.locator("li", { hasText: TITLE_2 }).waitFor();
    assert((await db.event.findUnique({ where: { id: eventId } }))?.status === "DRAFT", "DB status not DRAFT");
    // The page streams behind a loading skeleton, so check the not-found content rather than the status code.
    await pub.goto(`${BASE}/events/sync-test-night-${uniq}`);
    await pub.getByRole("heading", { name: "We couldn't find that page" }).waitFor();
    await pub.goto(BASE + "/events");
    assert((await pub.getByText(TITLE_2).count()) === 0, "draft still listed publicly");

    await admin.locator("li", { hasText: TITLE_2 }).getByRole("button", { name: "Publish" }).click();
    await admin.locator("li", { hasText: TITLE_2 }).waitFor({ state: "detached" });
    await pub.goto(`${BASE}/events/sync-test-night-${uniq}`);
    await pub.getByRole("heading", { name: TITLE_2 }).waitFor();
  });

  await step("admin → public: cancelling is shown on the public page", async () => {
    await admin.goto(`${BASE}/admin/events/${eventId}/edit`);
    await admin.getByLabel("Status").selectOption("CANCELLED");
    await admin.getByRole("button", { name: "Save changes" }).click();
    await admin.getByText(/Event saved/).waitFor({ timeout: 15000 });
    await pub.goto(`${BASE}/events/sync-test-night-${uniq}`);
    await pub.getByText("This event has been cancelled").waitFor();
    assert((await pub.getByRole("link", { name: /Register now|Join the waitlist/ }).count()) === 0, "register link still shown");
  });

  await step("admin → public: announcement appears on the home page", async () => {
    await admin.goto(BASE + "/admin/announcements/new");
    await admin.getByLabel("Title").fill(`Sync announcement ${uniq}`);
    await admin.getByRole("button", { name: "Publish announcement" }).click();
    await admin.waitForURL((u) => u.pathname === "/admin/announcements", { timeout: 15000 });
    assert(await db.announcement.findFirst({ where: { title: `Sync announcement ${uniq}` } }), "announcement not in DB");
    await pub.goto(BASE + "/");
    await pub.getByText(`Sync announcement ${uniq}`).waitFor();
  });

  await step("public → DB → admin: contact enquiry reaches the inbox", async () => {
    await pub.goto(BASE + "/contact");
    await pub.getByLabel("Your name").fill(`Sync Enquirer ${uniq}`);
    await pub.getByLabel("Your email").fill(`enq-${uniq}@example.com`);
    await pub.getByLabel("Purpose").selectOption("general");
    await pub.getByLabel("Your message").fill("Automated sync test enquiry.");
    await pub.locator('input[name="consent"]').check();
    await humanPause();
    await pub.getByRole("button", { name: "Send message" }).click();
    await pub.getByText("Message received").waitFor({ timeout: 15000 });
    assert(await db.enquiry.findFirst({ where: { email: `enq-${uniq}@example.com` } }), "enquiry not in DB");
    await admin.goto(BASE + "/admin/enquiries");
    await admin.getByText(`Sync Enquirer ${uniq}`).first().waitFor();
  });

  await step("public → DB → admin: volunteer application reaches the review list", async () => {
    await pub.goto(BASE + "/get-involved/volunteer");
    await pub.getByLabel("Full name").fill(`Sync Volunteer ${uniq}`);
    await pub.getByLabel("Mobile number").fill("+91 98842 65131");
    await pub.getByLabel("Email").fill(`vol-${uniq}@example.com`);
    await pub.getByLabel("Media & tech").check();
    await pub.locator('input[name="consent"]').check();
    await humanPause();
    await pub.getByRole("button", { name: "Submit application" }).click();
    await pub.getByText("Thank you for offering to serve!").first().waitFor({ timeout: 15000 });
    assert(await db.volunteerApplication.findFirst({ where: { email: `vol-${uniq}@example.com` } }), "volunteer not in DB");
    await admin.goto(BASE + "/admin/volunteers");
    await admin.getByText(`Sync Volunteer ${uniq}`).first().waitFor();
  });

  await step("no browser console errors on public pages", async () => {
    const real = consoleErrors.filter((e) => !/favicon|404 \(Not Found\)/.test(e));
    assert(real.length === 0, real.join(" | "));
  });

  await browser.close();

  // Clean up everything this run created.
  if (eventId) await db.event.delete({ where: { id: eventId } }).catch(() => undefined); // cascades registrations
  await db.announcement.deleteMany({ where: { title: `Sync announcement ${uniq}` } });
  await db.enquiry.deleteMany({ where: { email: `enq-${uniq}@example.com` } });
  await db.volunteerApplication.deleteMany({ where: { email: `vol-${uniq}@example.com` } });
  await db.$disconnect();

  console.log(failures ? `\n${failures} step(s) failed` : "\nAll sync checks passed");
  process.exitCode = failures ? 1 : 0;
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exitCode = 1;
});
