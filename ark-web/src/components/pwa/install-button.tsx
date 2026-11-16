"use client";

import { usePwa } from "./pwa-provider";

/** Shows an "Install app" action when the browser supports installing. */
export function InstallButton({ className }: { className?: string }) {
  const { canInstall, isStandalone, install } = usePwa();
  if (!canInstall || isStandalone) return null;
  return (
    <button type="button" onClick={install} className={className}>
      <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
      </svg>
      Install app
    </button>
  );
}
