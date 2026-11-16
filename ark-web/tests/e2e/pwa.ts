/**
 * PWA verification in a real browser:
 *  manifest + installability fields, service worker control, offline behaviour,
 *  and that private pages (admin, bookings) are never cached.
 *
 *   BASE_URL=http://localhost:3000 CHROME_PATH=/usr/bin/google-chrome npm run test:pwa
 */
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const CHROME = process.env.CHROME_PATH ?? "/usr/bin/google-chrome";
let failures = 0;
const check = (ok: boolean, label: string, detail = "") => {
  console.log(`${ok ? "✔" : "✘"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();

  // Manifest
  const mres = await page.request.get(`${BASE}/manifest.webmanifest`);
  const m = await mres.json();
  check(mres.ok(), "manifest is served");
  check(m.display === "standalone" && !!m.start_url && !!m.name && !!m.short_name, "manifest has name, short_name, start_url, display=standalone");
  const sizes = (m.icons ?? []).map((i: { sizes: string }) => i.sizes);
  check(sizes.includes("192x192") && sizes.includes("512x512"), "manifest has 192 and 512 icons");
  check((m.icons ?? []).some((i: { purpose?: string }) => i.purpose === "maskable"), "manifest has a maskable icon");
  for (const icon of m.icons ?? []) {
    const r = await page.request.get(BASE + icon.src);
    check(r.ok(), `icon ${icon.src} loads`);
  }
  for (const s of m.screenshots ?? []) {
    const r = await page.request.get(BASE + s.src);
    check(r.ok(), `screenshot ${s.src} loads`);
  }

  // Service worker
  const sw = await page.request.get(`${BASE}/sw.js`);
  check(sw.ok() && /no-cache|no-store/.test(sw.headers()["cache-control"] ?? ""), "sw.js served with no-cache");

  await page.goto(BASE + "/");
  const controlled = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((r) => navigator.serviceWorker.addEventListener("controllerchange", () => r(), { once: true }));
    }
    return !!reg.active && !!navigator.serviceWorker.controller;
  });
  check(controlled, "service worker is active and controls the page");

  const appleCapable = await page.locator('meta[name="apple-mobile-web-app-capable"], meta[name="mobile-web-app-capable"]').count();
  check(appleCapable > 0, "iOS / Android web-app meta tags present");
  check((await page.locator('meta[name="theme-color"]').count()) > 0, "theme-color meta present");
  check(await page.getByRole("navigation", { name: "Quick navigation" }).isVisible(), "mobile tab bar visible");

  // Visit pages while online so they are cached; also visit a private page.
  await page.goto(BASE + "/about");
  await page.goto(BASE + "/admin/login");
  await page.waitForTimeout(800);

  const cached = await page.evaluate(async () => {
    const out: string[] = [];
    for (const k of await caches.keys()) for (const r of await (await caches.open(k)).keys()) out.push(new URL(r.url).pathname);
    return out;
  });
  check(cached.includes("/offline"), "offline page precached");
  check(cached.includes("/services") && cached.includes("/"), "key pages warmed into cache");
  check(cached.includes("/about"), "visited page cached");
  check(!cached.some((p) => p.startsWith("/admin") || p.startsWith("/booking") || p.startsWith("/api")), "no admin / booking / api responses cached");

  // Go offline
  await ctx.setOffline(true);
  await page.goto(BASE + "/services");
  check(await page.getByText("Tamil Service").first().isVisible(), "offline: cached /services still shows service times");
  await page.goto(BASE + "/about");
  check(await page.getByRole("heading", { name: /Where church is family/ }).first().isVisible(), "offline: cached /about renders");
  await page.goto(BASE + "/gallery");
  check(await page.getByRole("heading", { name: "You're offline" }).isVisible(), "offline: uncached page shows the offline screen");
  await page.goto(BASE + "/services");
  check(await page.getByText(/You're offline/).first().isVisible(), "offline banner shown");
  await ctx.setOffline(false);

  await browser.close();
  console.log(failures ? `\n${failures} PWA check(s) failed` : "\nAll PWA checks passed");
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
