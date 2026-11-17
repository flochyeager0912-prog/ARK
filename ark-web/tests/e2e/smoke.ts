/**
 * End-to-end smoke test of the real user journeys in a real browser.
 *
 *   BASE_URL=http://localhost:3000 E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... \
 *   CHROME_PATH=/usr/bin/google-chrome npm run test:e2e
 *
 * Requires an event with slug "tribe-night-demo" (npm run db:seed -- --demo).
 * Screenshots are written to E2E_OUT (default ./e2e-output).
 */
import { chromium, type Page } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.env.E2E_OUT ?? "e2e-output";
const CHROME = process.env.CHROME_PATH ?? "/usr/bin/google-chrome";
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
async function step(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✔ ${name}`);
  } catch (e) {
    failures++;
    console.error(`✘ ${name}\n  ${(e as Error).message.split("\n")[0]}`);
  }
}

/** Scroll through the page so lazy-loaded images render, then take a screenshot. */
async function shot(page: Page, name: string, fullPage = true) {
  if (fullPage) {
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState("networkidle").catch(() => undefined);
  }
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage });
}
const humanPause = () => new Promise((r) => setTimeout(r, 2800)); // anti-bot minimum fill time
const uniq = Date.now().toString(36);

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const desktop = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await desktop.newPage();
  const consoleErrors: string[] = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));

  await step("home page renders with service times", async () => {
    await page.goto(BASE + "/");
    await page.getByRole("heading", { name: /Where church/ }).waitFor();
    await page.getByText("Tamil Service").first().waitFor();
    await shot(page, "01-home-desktop");
  });

  for (const p of ["about", "about/journey", "about/mission", "services", "services/special", "ministries", "ministries/ark-arise", "events", "give", "watch", "get-involved", "contact", "gallery"]) {
    await step(`page /${p}`, async () => {
      const res = await page.goto(`${BASE}/${p}`);
      if (!res || res.status() !== 200) throw new Error(`status ${res?.status()}`);
      await shot(page, `02-${p.replace(/\//g, "_")}`);
    });
  }

  await step("header section links glide to each home-page section", async () => {
    await page.goto(BASE + "/");
    for (const id of ["about", "services", "ministries", "events", "involved", "contact"]) {
      await page.locator(`header a[href="/#${id}"]:visible`).first().click();
      await page.waitForFunction((id) => {
        const top = document.getElementById(id)?.getBoundingClientRect().top ?? 9999;
        return Math.abs(top) < 140;
      }, id, { timeout: 5000 });
      const current = await page.locator(`header a[href="/#${id}"][aria-current]`).count();
      if (!current) throw new Error(`nav entry for #${id} not highlighted`);
    }
  });

  await step("client-side navigation never leaves sections invisible", async () => {
    await page.goto(BASE + "/");
    for (const link of ["/about", "/ministries", "/events", "/contact", "/services", "/give"]) {
      await page.locator(`footer a[href="${link}"]:visible`).first().click();
      await page.waitForURL("**" + link);
      await page.locator("main h1").first().waitFor();
      await page.waitForTimeout(400);
      // Scroll the whole page like a visitor would.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 80));
        }
      });
      await page.waitForTimeout(900);
      const hidden = await page.$$eval('[data-reveal-state="pending"]', (els) => els.length);
      if (hidden > 0) throw new Error(`${hidden} section(s) invisible on ${link}`);
    }
  });

  await step("mobile home + menu", async () => {
    const m = await mobile.newPage();
    await m.goto(BASE + "/");
    await shot(m, "03-home-mobile");
    await m.getByRole("button", { name: "Open menu" }).click();
    await m.getByRole("navigation", { name: "Mobile" }).waitFor();
    await shot(m, "03-menu-mobile", false);
    await m.goto(BASE + "/events/tribe-night-demo");
    await shot(m, "03-event-mobile");
  });

  await step("contact form: prayer request", async () => {
    await page.goto(BASE + "/contact?purpose=prayer-request");
    await page.getByLabel("Your name").fill("E2E Tester");
    await page.getByLabel("Your email").fill(`e2e-${uniq}@example.com`);
    await page.getByLabel("Your prayer request").fill("Please pray for my family. (automated test)");
    await page.locator('input[name="consent"]').check();
    await humanPause();
    await page.getByRole("button", { name: "Send message" }).click();
    await page.getByText("Message received").waitFor({ timeout: 15000 });
  });

  await step("contact form: validation errors shown", async () => {
    await page.goto(BASE + "/contact");
    await page.getByLabel("Your name").fill("X");
    await page.getByLabel("Your email").fill("not-an-email");
    await page.getByLabel("Purpose").selectOption("general");
    await page.getByLabel("Your message").fill("hello");
    await page.locator('input[name="consent"]').check();
    await humanPause();
    await page.getByRole("button", { name: "Send message" }).click();
    await page.getByText("Enter a valid email address").waitFor({ timeout: 15000 });
  });

  await step("volunteer application", async () => {
    await page.goto(BASE + "/get-involved/volunteer");
    await page.getByLabel("Full name").fill("E2E Volunteer");
    await page.getByLabel("Mobile number").fill("+91 98842 65131");
    await page.getByLabel("Email").fill(`vol-${uniq}@example.com`);
    await page.getByLabel("Media & tech").check();
    await page.getByLabel("10 AM English service").check();
    await page.locator('input[name="consent"]').check();
    await humanPause();
    await page.getByRole("button", { name: "Submit application" }).click();
    await page.getByText("Thank you for offering to serve!").first().waitFor({ timeout: 15000 });
  });

  let refCode = "";
  let bookingUrl = "";
  await step("event registration → booking page with QR", async () => {
    await page.goto(BASE + "/events/tribe-night-demo");
    await page.getByRole("link", { name: /Register now|Join the waitlist/ }).click();
    await page.getByLabel("Full name").fill("E2E Registrant");
    await page.getByLabel("Mobile number").fill("9884265131");
    await page.getByLabel("Email").fill(`reg-${uniq}@example.com`);
    await page.getByLabel("2 people").check({ force: true });
    await page.locator('input[name="consent"]').check();
    await humanPause();
    await page.getByRole("button", { name: /Confirm registration|Join the waitlist/ }).click();
    await page.waitForURL(/\/booking\//, { timeout: 15000 });
    bookingUrl = page.url();
    refCode = (await page.locator("[data-ref-code]").first().innerText()).trim();
    if (!/^ARK-[A-Z0-9]{6}$/.test(refCode)) throw new Error(`unexpected ref ${refCode}`);
    await page.getByAltText(/QR code for booking/).waitFor();
    await shot(page, "04-booking");
  });

  await step("duplicate registration is refused", async () => {
    await page.goto(BASE + "/events/tribe-night-demo/register");
    await page.getByLabel("Full name").fill("E2E Registrant");
    await page.getByLabel("Mobile number").fill("9884265131");
    await page.getByLabel("Email").fill(`reg-${uniq}@example.com`);
    await page.locator('input[name="consent"]').check();
    await humanPause();
    await page.getByRole("button", { name: /Confirm registration/ }).click();
    await page.getByText("already registered").waitFor({ timeout: 15000 });
  });

  const adminEmail = process.env.E2E_ADMIN_EMAIL;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    await step("admin: wrong password is rejected", async () => {
      await page.goto(BASE + "/admin/login");
      await page.getByLabel("Email").fill(adminEmail);
      await page.getByLabel("Password").fill("definitely-wrong");
      await page.getByRole("button", { name: "Sign in" }).click();
      await page.getByText("Incorrect email or password").waitFor();
    });
    await step("admin: login + dashboard", async () => {
      await page.getByLabel("Password").fill(adminPassword);
      await page.getByRole("button", { name: "Sign in" }).click();
      await page.waitForURL(BASE + "/admin");
      await page.getByRole("heading", { name: "Dashboard" }).waitFor();
      await shot(page, "05-admin-dashboard");
    });
    await step("admin: prayer request visible in inbox", async () => {
      await page.goto(BASE + "/admin/enquiries?type=prayer");
      await page.getByRole("link", { name: "E2E Tester" }).first().click();
      await page.getByText("Please pray for my family").waitFor();
      await shot(page, "05-admin-enquiry");
    });
    await step("admin: check in by reference", async () => {
      await page.goto(BASE + "/admin/events");
      await page.getByRole("link", { name: "Tribe Night" }).click();
      await page.getByLabel("Booking reference").fill(refCode);
      await page.getByRole("button", { name: "Check in", exact: true }).first().click();
      await page.getByText(/Checked in E2E Registrant/).waitFor({ timeout: 15000 });
      await shot(page, "05-admin-event");
    });
    await step("admin: CSV export", async () => {
      const res = await page.request.get(page.url().split("?")[0] + "/export");
      const body = await res.text();
      if (!body.includes(refCode)) throw new Error("ref not in CSV");
    });
    await step("admin: content editor — edit, publish, restore, reset", async () => {
      const marker = `Welcome home ${uniq}`;
      await page.goto(BASE + "/admin/content");
      await page.getByRole("link", { name: /Home page/ }).click();
      await page.getByRole("heading", { name: "Home page" }).waitFor();
      // The "Welcome" group's title field
      const welcome = page.locator("section", { has: page.getByRole("heading", { name: "Welcome section", exact: true }) });
      await welcome.getByLabel("Title").fill(marker);
      await page.getByText("● Unsaved changes").waitFor();
      await shot(page, "06-content-editor");
      await page.getByRole("button", { name: "Save changes" }).click();
      await page.getByText(/Saved — the website is updated/).waitFor({ timeout: 15000 });
      const pub = await (await browser.newContext()).newPage();
      await pub.goto(BASE + "/");
      await pub.getByRole("heading", { name: marker }).waitFor();
      // History has the previous version → restore it
      page.once("dialog", (d) => d.accept());
      await page.getByRole("button", { name: "Restore" }).first().click();
      // Wait for the restore to complete (the editor reloads with the restored text).
      await page.waitForFunction(
        (m) => ![...document.querySelectorAll("input")].some((i) => (i as HTMLInputElement).value === m),
        marker,
        { timeout: 15000 },
      );
      await pub.reload();
      if ((await pub.getByRole("heading", { name: marker }).count()) > 0) throw new Error("restore did not revert the text");
      // Reset to original (if the section is still marked edited)
      await page.reload();
      const reset = page.getByRole("button", { name: "Reset to original" });
      if (await reset.isVisible()) {
        page.once("dialog", (d) => d.accept());
        await reset.click();
        await page.waitForLoadState("networkidle");
      }
      await pub.close();
    });

    await step("admin: content editor — validation blocks bad links", async () => {
      await page.goto(BASE + "/admin/content/getInvolved");
      const link = page.getByLabel("Link").first();
      await link.fill("javascript:alert(1)");
      await page.getByRole("button", { name: "Save changes" }).click();
      await page.getByText("Use a /page-path or a full https:// link").waitFor({ timeout: 15000 });
      await page.getByRole("button", { name: "Discard changes" }).click();
    });

    await step("admin: photo upload (resized, served from /media)", async () => {
      // 1x1 PNG generated on the fly
      const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
      await page.goto(BASE + "/admin/media");
      await page.locator('input[type="file"]').setInputFiles({ name: `e2e-${uniq}.png`, mimeType: "image/png", buffer: png });
      await page.getByText(`e2e-${uniq}.png`).waitFor({ timeout: 15000 });
      const src = await page.locator(`img[src^="/media/"]`).first().getAttribute("src");
      const r = await page.request.get(BASE + src);
      if (r.headers()["content-type"] !== "image/webp") throw new Error(`unexpected type ${r.headers()["content-type"]}`);
      // delete it again
      page.once("dialog", (d) => d.accept());
      await page.getByRole("button", { name: "Delete" }).first().click();
      await page.getByText("Deleted.").waitFor();
    });

    await step("admin: upload endpoint rejects non-images and cross-site posts", async () => {
      const bad = await page.request.post(BASE + "/admin/media/upload", {
        headers: { origin: BASE },
        multipart: { file: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("not an image") } },
      });
      if (bad.status() !== 400) throw new Error(`expected 400, got ${bad.status()}`);
      const csrf = await page.request.post(BASE + "/admin/media/upload", {
        headers: { origin: "https://evil.example" },
        multipart: { file: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("x") } },
      });
      if (csrf.status() !== 403) throw new Error(`expected 403, got ${csrf.status()}`);
    });

    await step("admin: service timings page", async () => {
      await page.goto(BASE + "/admin/services");
      await page.getByText("Bilingual Service").waitFor();
      await shot(page, "05-admin-services");
    });
  } else {
    console.log("(admin steps skipped — set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD)");
  }

  await step("visitor cancels booking via manage link", async () => {
    const p2 = await (await browser.newContext()).newPage();
    p2.on("dialog", (d) => d.accept());
    await p2.goto(bookingUrl.replace("?new=1", ""));
    await p2.getByRole("button", { name: "Cancel my booking" }).click();
    await p2.getByText(/booking has been cancelled/).first().waitFor({ timeout: 15000 });
  });

  await step("no browser console errors", async () => {
    // Network-level failures (third-party embeds behind proxies, aborted navigations) are not app errors.
    const relevant = consoleErrors.filter((e) => !/net::ERR_|favicon|youtube|google|maps/i.test(e));
    if (relevant.length) throw new Error(relevant.slice(0, 3).join(" | "));
  });

  await browser.close();
  console.log(failures ? `\n${failures} step(s) failed` : "\nAll e2e steps passed");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
