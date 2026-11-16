/**
 * Generates PWA / favicon PNGs from the white logo on the brand navy.
 *   npx tsx scripts/generate-icons.ts
 */
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const logo = path.join(root, "public/images/logo-white.webp");

async function make(size: number, pad: number, out: string) {
  const inner = Math.round(size * (1 - pad * 2));
  const l = await sharp(logo).trim().resize({ width: inner, fit: "inside" }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: "#050b2e" } })
    .composite([{ input: l, gravity: "center" }])
    .png()
    .toFile(path.join(root, out));
}

async function main() {
  await make(192, 0.1, "public/icon-192.png");
  await make(512, 0.1, "public/icon-512.png");
  await make(512, 0.2, "public/icon-maskable-512.png");
  await make(180, 0.1, "src/app/apple-icon.png");
  console.log("icons generated");
}
main();
