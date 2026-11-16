"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

// Pages that show admin-managed data (events, services, announcements). Form pages are excluded
// so a refresh never interrupts someone mid-registration.
const LIVE = /^\/(events(\/[^/]+)?|services(\/special)?|watch)?$/;
const POLL_MS = 45_000;
const MIN_GAP_MS = 15_000;

/**
 * Keeps public pages in sync with changes made in the admin: re-fetches server data when the
 * tab becomes visible again or the device comes back online, and polls gently while visible.
 * `router.refresh()` re-renders server components only — scroll position and client state stay put.
 */
export function LiveRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const last = useRef(0);

  useEffect(() => {
    if (!LIVE.test(pathname)) return;
    last.current = Date.now();
    const refresh = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      if (Date.now() - last.current < MIN_GAP_MS) return;
      last.current = Date.now();
      router.refresh();
    };
    const timer = window.setInterval(refresh, POLL_MS);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [pathname, router]);

  return null;
}
