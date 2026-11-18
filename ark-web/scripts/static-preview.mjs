#!/usr/bin/env node
/**
 * Turns a running preview build into a static site for GitHub Pages.
 *
 *   STATIC_PREVIEW=1 PREVIEW_BASE_PATH=/ARK NEXT_DIST_DIR=.next-preview npm run build
 *   NEXT_DIST_DIR=.next-preview npx next start -p 3200 &
 *   PREVIEW_ORIGIN=http://localhost:3200 PREVIEW_BASE_PATH=/ARK node scripts/static-preview.mjs
 *
 * Visits every public page (sitemap + links found on pages), saves each as <path>/index.html,
 * copies the built assets and public files, downloads uploaded photos and .ics files, then checks
 * that every internal link and asset in the saved pages exists. Exits non-zero on any problem.
 * Admin, booking and API pages are never included.
 */
import fs from "node:fs";
import path from "node:path";

const ORIGIN = process.env.PREVIEW_ORIGIN ?? "http://localhost:3200";
const BASE = (process.env.PREVIEW_BASE_PATH ?? "/ARK").replace(/\/$/, "");
const OUT = path.resolve(process.env.PREVIEW_OUT ?? "preview-out");
const DIST = path.resolve(process.env.NEXT_DIST_DIR ?? ".next-preview");
const PUBLIC = path.resolve("public");

const EXCLUDE = [/^\/admin(\/|$)/, /^\/booking(\/|$)/, /^\/api\/(?!events\/[^/]+\/ics$)/, /^\/offline$/, /^\/_next\//];
const isPage = (rel) => !EXCLUDE.some((re) => re.test(rel));

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

/** "/ARK/events/x?y#z" → "/events/x" (or null when it isn't ours) */
function toRel(raw) {
  if (!raw || raw.startsWith("#") || /^(mailto|tel|data|javascript|blob):/i.test(raw)) return null;
  let u;
  try {
    u = new URL(raw, ORIGIN + BASE + "/");
  } catch {
    return null;
  }
  if (u.origin !== ORIGIN) return null;
  if (u.pathname !== BASE && !u.pathname.startsWith(BASE + "/")) return null;
  return decodeURIComponent(u.pathname.slice(BASE.length)).replace(/\/$/, "") || "/";
}

function outFile(rel, html) {
  if (html) return path.join(OUT, rel === "/" ? "" : rel, "index.html");
  return path.join(OUT, rel);
}

function save(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
}

const urlAttrs = /\s(?:href|src|action|poster)="([^"]*)"/g;
const srcsetAttr = /\ssrcset="([^"]*)"/g;
function refsIn(html) {
  const refs = [];
  for (const m of html.matchAll(urlAttrs)) refs.push(m[1].replace(/&amp;/g, "&"));
  for (const m of html.matchAll(srcsetAttr)) for (const part of m[1].split(",")) refs.push(part.trim().split(/\s+/)[0]);
  return refs;
}

// ------------------------------------------------------------------ crawl
const queue = ["/"];
const seen = new Set();
const assets = new Set();
const problems = [];

try {
  const sm = await fetch(`${ORIGIN}${BASE}/sitemap.xml`).then((r) => r.text());
  for (const m of sm.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const rel = toRel(new URL(m[1]).pathname);
    if (rel) queue.push(rel);
  }
} catch {
  console.warn("sitemap.xml not available — relying on links only");
}

while (queue.length) {
  const rel = queue.shift();
  if (seen.has(rel) || !isPage(rel)) continue;
  seen.add(rel);
  const res = await fetch(`${ORIGIN}${BASE}${rel === "/" ? "" : rel}`, { redirect: "manual" });
  if (res.status >= 300 && res.status < 400) continue; // legacy redirects etc.
  if (!res.ok) {
    problems.push(`${res.status} ${rel}`);
    continue;
  }
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("text/html")) {
    save(outFile(rel, false), Buffer.from(await res.arrayBuffer()));
    continue;
  }
  const html = await res.text();
  save(outFile(rel, true), html);
  for (const ref of refsIn(html)) {
    const r = toRel(ref);
    if (!r) continue;
    if (/^\/(media|images)\//.test(r) || /\.(png|svg|ico|webmanifest|webp|jpe?g|txt|xml)$/.test(r)) assets.add(r);
    else if (!r.startsWith("/_next/")) queue.push(r);
  }
}

// ------------------------------------------------------------------ assets
fs.cpSync(path.join(DIST, "static"), path.join(OUT, "_next", "static"), { recursive: true });
for (const entry of fs.readdirSync(PUBLIC)) {
  if (entry === "sw.js") continue; // no service worker in the preview
  fs.cpSync(path.join(PUBLIC, entry), path.join(OUT, entry), { recursive: true });
}
for (const rel of [...assets, "/robots.txt", "/manifest.webmanifest", "/icon.svg", "/apple-icon.png"]) {
  if (fs.existsSync(outFile(rel, false))) continue;
  const res = await fetch(`${ORIGIN}${BASE}${rel}`);
  if (res.ok) save(outFile(rel, false), Buffer.from(await res.arrayBuffer()));
  else problems.push(`${res.status} asset ${rel}`);
}

// GitHub Pages: 404 page, and no Jekyll processing (it would hide the _next folder).
const nf = await fetch(`${ORIGIN}${BASE}/this-page-does-not-exist`);
save(path.join(OUT, "404.html"), await nf.text());
save(path.join(OUT, ".nojekyll"), "");

// ------------------------------------------------------------------ verify
let pages = 0;
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
for (const file of walk(OUT).filter((f) => f.endsWith(".html"))) {
  pages++;
  const html = fs.readFileSync(file, "utf8");
  for (const ref of refsIn(html)) {
    if (/^\/(?!\/)/.test(ref) && !new RegExp(`^${BASE}([/?#]|$)`).test(ref)) {
      problems.push(`missing ${BASE} prefix: ${ref} in ${path.relative(OUT, file)}`);
      continue;
    }
    const rel = toRel(ref);
    if (!rel || !isPage(rel) && !rel.startsWith("/_next/")) continue;
    if (!fs.existsSync(outFile(rel, false)) && !fs.existsSync(outFile(rel, true))) problems.push(`broken: ${ref} in ${path.relative(OUT, file)}`);
  }
}

const unique = [...new Set(problems)];
console.log(`Static preview: ${pages} pages, ${assets.size} downloaded assets → ${path.relative(process.cwd(), OUT)}`);
if (unique.length) {
  console.error(`${unique.length} problem(s):\n  ` + unique.slice(0, 40).join("\n  "));
  process.exit(1);
}
