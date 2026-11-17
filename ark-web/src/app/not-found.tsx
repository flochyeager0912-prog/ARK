import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";

export default function NotFound() {
  return (
    <SiteShell>
      <section className="container-page flex min-h-[80svh] items-center pb-12 pt-28">
        <div className="panel stagger mx-auto max-w-2xl p-8 text-center sm:p-12">
          <p className="eyebrow">Error 404</p>
          <h1 className="text-gradient mt-5 font-display text-5xl font-medium sm:text-6xl">We couldn&apos;t find that page</h1>
          <p className="lead mx-auto mt-5 max-w-lg">It may have moved when we launched our new website. Try one of these instead:</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn-primary">Home</Link>
            <Link href="/services" className="btn-outline">Service times</Link>
            <Link href="/events" className="btn-outline">Events</Link>
            <Link href="/contact" className="btn-outline">Contact</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
