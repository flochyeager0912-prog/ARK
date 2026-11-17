// Pages read live data (services, events, announcements) from Postgres.
export const dynamic = "force-dynamic";

import { SiteShell } from "@/components/layout/site-shell";
import { ChurchJsonLd } from "@/components/site/json-ld";
import { LiveRefresh } from "@/components/layout/live-refresh";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteShell>{children}</SiteShell>
      <LiveRefresh />
      <ChurchJsonLd />
    </>
  );
}
