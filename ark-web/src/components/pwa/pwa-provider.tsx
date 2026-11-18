"use client";

import { isStaticPreview } from "@/lib/preview";
import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import Image from "next/image";
import { IconX } from "@/components/ui/icons";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaState = {
  canInstall: boolean;
  isStandalone: boolean;
  isIos: boolean;
  install: () => Promise<void>;
};

const PwaContext = createContext<PwaState>({ canInstall: false, isStandalone: false, isIos: false, install: async () => undefined });
export const usePwa = () => useContext(PwaContext);

const DISMISS_KEY = "ark-install-dismissed-at";
// Set only when the user taps "Update", so the first-ever install never triggers a reload.
let updateRequested = false;
const DISMISS_DAYS = 21;

function safeGet(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode) — ignore */
  }
}

// --- online/offline as an external store --------------------------------
function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}
const getOnline = () => navigator.onLine;
const getOnlineServer = () => true;

// --- display mode ---------------------------------------------------------
function subscribeStandalone(cb: () => void) {
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const getFalse = () => false;

const subscribeNoop = () => () => undefined;
const getIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);

export function PwaProvider({ children }: { children: ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [bannerOpen, setBannerOpen] = useState(false);
  const online = useSyncExternalStore(subscribeOnline, getOnline, getOnlineServer);
  const isStandalone = useSyncExternalStore(subscribeStandalone, getStandalone, getFalse);
  const isIos = useSyncExternalStore(subscribeNoop, getIos, getFalse);

  // Register the service worker (production only) and watch for updates.
  useEffect(() => {
    // Not in the static review preview: it lives under a sub-path and must not cache like an app.
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production" || isStaticPreview) return;
    let reloading = false;
    const onControllerChange = () => {
      if (!updateRequested || reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    let onVisible: (() => void) | undefined;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          sw?.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) setWaiting(sw);
          });
        });
        // Check for a new version when the app regains focus.
        onVisible = () => {
          if (document.visibilityState === "visible") reg.update().catch(() => undefined);
        };
        document.addEventListener("visibilitychange", onVisible);
      })
      .catch((e) => console.warn("Service worker registration failed", e));

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      if (onVisible) document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Capture the install prompt (Chrome / Edge / Android).
  useEffect(() => {
    const recentlyDismissed = () => {
      const at = Number(safeGet(DISMISS_KEY));
      return at > 0 && Date.now() - at < DISMISS_DAYS * 86_400_000;
    };
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (!recentlyDismissed()) setBannerOpen(true);
    };
    const onInstalled = () => {
      setDeferred(null);
      setBannerOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    // iOS has no install prompt: show manual instructions once in a while.
    const t = window.setTimeout(() => {
      if (getIos() && !getStandalone() && !recentlyDismissed()) setBannerOpen(true);
    }, 4000);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(t);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    setDeferred(null);
    setBannerOpen(false);
  }, [deferred]);

  const dismiss = () => {
    safeSet(DISMISS_KEY, String(Date.now()));
    setBannerOpen(false);
  };

  const showBanner = bannerOpen && !isStandalone && (deferred !== null || isIos);

  return (
    <PwaContext.Provider value={{ canInstall: deferred !== null, isStandalone, isIos, install }}>
      {children}

      {!online && (
        <div role="status" className="fixed inset-x-0 top-0 z-[60] bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-amber-950 pt-[max(0.375rem,env(safe-area-inset-top))]">
          You&apos;re offline — showing saved pages. Forms will work again when you reconnect.
        </div>
      )}

      {waiting && (
        <div role="status" className="animate-toast-in fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] mx-auto flex max-w-md items-center justify-between gap-4 panel rounded-2xl px-5 py-4 text-sm text-white shadow-2xl lg:bottom-6">
          <span>A new version of the app is available.</span>
          <button className="btn-primary shrink-0 px-4 py-2" onClick={() => {
              updateRequested = true;
              waiting.postMessage("SKIP_WAITING");
            }}>
            Update
          </button>
        </div>
      )}

      {showBanner && !waiting && (
        <div role="dialog" aria-label="Install The Ark app" className="animate-toast-in fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[55] mx-auto max-w-md panel rounded-2xl p-4 shadow-2xl lg:bottom-6">
          <div className="flex items-start gap-4">
            <Image src="/icon-192.png" alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">Install The Ark app</p>
              {isIos && !deferred ? (
                <p className="mt-1 text-sm text-muted">
                  Tap the <strong>Share</strong> button <ShareGlyph /> in Safari, then <strong>Add to Home Screen</strong>.
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted">Service times, events and live worship — one tap from your home screen. Works offline.</p>
              )}
              {deferred && (
                <div className="mt-3 flex gap-2">
                  <button className="btn-primary px-4 py-2" onClick={install}>Install</button>
                  <button className="btn-outline px-4 py-2" onClick={dismiss}>Not now</button>
                </div>
              )}
            </div>
            <button aria-label="Dismiss" className="-m-1 rounded-full p-1 text-muted hover:bg-surface" onClick={dismiss}>
              <IconX size={18} />
            </button>
          </div>
        </div>
      )}
    </PwaContext.Provider>
  );
}

function ShareGlyph() {
  return (
    <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-0.5 inline -translate-y-px">
      <path d="M12 3v13M7 8l5-5 5 5M5 12v8h14v-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
