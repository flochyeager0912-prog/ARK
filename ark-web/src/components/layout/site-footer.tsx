import Link from "next/link";
import Image from "next/image";
import { InstallButton } from "@/components/pwa/install-button";
import { IconFacebook, IconInstagram, IconMail, IconPhone, IconPin, IconYouTube } from "@/components/ui/icons";
import { footerNav } from "@/content/site";
import { getSite } from "@/server/content";

export async function SiteFooter() {
  const site = await getSite();
  const year = new Date().getFullYear();
  return (
    <footer className="bg-navy-950 text-white/75">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-5">
          <Image src="/images/logo-white.webp" alt="The Ark Victory Church" width={160} height={86} className="h-16 w-auto" />
          <p className="max-w-xs text-sm leading-relaxed">{site.description}</p>
          <div className="flex gap-2">
            <a href={site.social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="rounded-full bg-white/10 p-2.5 hover:bg-white/20 hover:text-white"><IconYouTube size={18} /></a>
            <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-full bg-white/10 p-2.5 hover:bg-white/20 hover:text-white"><IconInstagram size={18} /></a>
            <a href={site.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded-full bg-white/10 p-2.5 hover:bg-white/20 hover:text-white"><IconFacebook size={18} /></a>
          </div>
          <InstallButton className="btn-ghost-light px-4 py-2" />
        </div>

        {footerNav.map((col) => (
          <div key={col.title}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">{col.title}</h2>
            <ul className="space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">Contact</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <IconPhone size={18} className="mt-0.5 shrink-0 text-brand-300" />
              <a href={`tel:${site.contact.phoneE164}`} className="hover:text-white">{site.contact.phoneDisplay}</a>
            </li>
            <li className="flex gap-3">
              <IconMail size={18} className="mt-0.5 shrink-0 text-brand-300" />
              <a href={`mailto:${site.contact.email}`} className="break-all hover:text-white">{site.contact.email}</a>
            </li>
            <li className="flex gap-3">
              <IconPin size={18} className="mt-0.5 shrink-0 text-brand-300" />
              <address className="not-italic">{site.address.full}</address>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {site.name}. A member of {site.denomination}.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/admin" className="hover:text-white">Staff login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
