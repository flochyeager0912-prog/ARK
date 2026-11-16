/* The Ark Victory Church — service worker.
 *
 * Strategy
 *  - App shell (/offline, icons, logo) is precached on install.
 *  - /_next/static/* (content-hashed, immutable): cache-first.
 *  - Images (/images/*, /_next/image): stale-while-revalidate, capped.
 *  - Public page navigations: network-first; successful responses are cached so
 *    service times, events and contact details remain readable offline.
 *  - Never cached: /admin, /api, /booking (personal), POSTs/server actions, RSC payloads.
 */
const VERSION = "v1";
const SHELL = `ark-shell-${VERSION}`;
const PAGES = `ark-pages-${VERSION}`;
const STATIC = `ark-static-${VERSION}`;
const IMAGES = `ark-images-${VERSION}`;
const CURRENT = [SHELL, PAGES, STATIC, IMAGES];

const SHELL_URLS = [
  "/offline",
  "/images/logo-white.webp",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.webmanifest",
];

// Key public pages saved at install (best effort) so they work offline from day one.
const WARM_PAGES = ["/", "/services", "/events", "/contact"];

const PRIVATE_PREFIXES = ["/admin", "/api", "/booking"];
const MAX_PAGES = 40;
const MAX_IMAGES = 120;

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(SHELL).then((c) => c.addAll(SHELL_URLS)),
      caches.open(PAGES).then((c) => Promise.allSettled(WARM_PAGES.map((u) => c.add(u)))),
    ]),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("ark-") && !CURRENT.includes(k)).map((k) => caches.delete(k)));
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

// The page asks a waiting worker to take over when the user accepts an update.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (PRIVATE_PREFIXES.some((p) => url.pathname === p || url.pathname.startsWith(p + "/"))) return;
  // React Server Component payloads used by client-side navigation: always network.
  if (req.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return;

  // Immutable build assets
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Images: stale-while-revalidate
  if (url.pathname.startsWith("/images/") || url.pathname === "/_next/image") {
    event.respondWith(
      caches.open(IMAGES).then(async (cache) => {
        const hit = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res.ok) {
              cache.put(req, res.clone());
              trim(IMAGES, MAX_IMAGES);
            }
            return res;
          })
          .catch(() => hit);
        return hit || network;
      }),
    );
    return;
  }

  // Page navigations: network-first with offline fallback
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preload = await event.preloadResponse;
          const res = preload || (await fetch(req));
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put(req, copy).then(() => trim(PAGES, MAX_PAGES)));
          }
          return res;
        } catch {
          return (await caches.match(req)) || (await caches.match("/offline")) || Response.error();
        }
      })(),
    );
  }
});
