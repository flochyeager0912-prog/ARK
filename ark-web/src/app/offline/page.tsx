import type { Metadata } from "next";
import Image from "next/image";
import { RetryButton } from "@/components/pwa/retry-button";
import { getSite } from "@/server/content";

export const metadata: Metadata = { title: "You're offline", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Precached by the service worker; shown when a page isn't available offline. */
export default async function OfflinePage() {
  const site = await getSite();
  return (
    <main className="hero-bg flex min-h-dvh items-center px-6 py-16 text-white">
      <div className="mx-auto max-w-md text-center">
        <Image src="/images/logo-white.webp" alt={site.name} width={160} height={86} className="mx-auto h-16 w-auto" priority />
        <h1 className="mt-10 text-3xl font-semibold">You&apos;re offline</h1>
        <p className="mt-3 text-white/75">
          This page hasn&apos;t been saved on your device yet. Pages you&apos;ve visited before — like service times — still work offline.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
          <a href="/services" className="btn-ghost-light">Service times</a>
          <a href="/contact" className="btn-ghost-light">Contact &amp; map</a>
        </div>
        <p className="mt-6 text-sm text-white/70">
          {site.address.full}
          <br />
          {site.contact.phoneDisplay}
        </p>
        <RetryButton />
      </div>
    </main>
  );
}
