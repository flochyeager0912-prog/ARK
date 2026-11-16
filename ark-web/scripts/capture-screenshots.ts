/**
 * Captures the store-style screenshots referenced by the web manifest.
 *   BASE_URL=http://localhost:3000 npx tsx scripts/capture-screenshots.ts
 */
import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
(async () => {
  fs.mkdirSync("public/screenshots", { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/usr/bin/google-chrome" });
  const wide = await (await b.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  await wide.goto(BASE + "/", { waitUntil: "networkidle" });
  await wide.waitForTimeout(1200);
  await wide.screenshot({ path: "public/screenshots/home-wide.png" });
  const narrow = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
  for (const [path, name] of [["/", "home-narrow"], ["/services", "services-narrow"]] as const) {
    await narrow.goto(BASE + path, { waitUntil: "networkidle" });
    await narrow.waitForTimeout(1200);
    await narrow.screenshot({ path: `public/screenshots/${name}.png` });
  }
  await b.close();
  console.log("screenshots saved to public/screenshots");
})();
