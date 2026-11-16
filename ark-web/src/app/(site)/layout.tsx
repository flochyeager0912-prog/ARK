// Pages read live data (services, events, announcements) from Postgres.
export const dynamic = "force-dynamic";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { TabBar } from "@/components/layout/tab-bar";
import { ChurchJsonLd } from "@/components/site/json-ld";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import { RevealObserver } from "@/components/ui/reveal";
import { LiveRefresh } from "@/components/layout/live-refresh";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <PwaProvider>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <TabBar />
      <RevealObserver />
      <LiveRefresh />
      <ChurchJsonLd />
    </PwaProvider>
  );
}
