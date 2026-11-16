import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="hero-bg flex min-h-[70vh] items-center text-white">
        <div className="container-page py-32 text-center">
          <p className="eyebrow text-brand-300">404</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">We couldn&apos;t find that page</h1>
          <p className="mx-auto mt-4 max-w-lg text-white/75">It may have moved when we launched our new website. Try one of these instead:</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn-light">Home</Link>
            <Link href="/services" className="btn-ghost-light">Service times</Link>
            <Link href="/events" className="btn-ghost-light">Events</Link>
            <Link href="/contact" className="btn-ghost-light">Contact</Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
