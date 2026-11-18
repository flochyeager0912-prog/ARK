import Link from "next/link";
import { isStaticPreview } from "@/lib/preview";
import { InstallButton } from "@/components/pwa/install-button";
import { IconFacebook, IconInstagram, IconMail, IconPhone, IconPin, IconYouTube } from "@/components/ui/icons";
import { footerNav } from "@/content/site";
import { getSite } from "@/server/content";
import { EmailText } from "@/components/ui/section";
import { BackToTop } from "./back-to-top";

export async function SiteFooter() {
  const site = await getSite();
  const year = new Date().getFullYear();
  const social = [
    { href: site.social.youtube, label: "YouTube", Icon: IconYouTube },
    { href: site.social.instagram, label: "Instagram", Icon: IconInstagram },
    { href: site.social.facebook, label: "Facebook", Icon: IconFacebook },
  ];
  return (
    <footer className="relative mt-24 border-t border-white/[0.06] bg-night-950/80 backdrop-blur-xl">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.4fr] lg:gap-10">
        <div className="space-y-5">
          <p className="font-display text-2xl font-medium text-white">{site.name}</p>
          <p className="max-w-xs text-sm leading-relaxed text-muted">{site.description}</p>
          <div className="flex gap-2">
            {social.map(({ href, label, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-muted transition-colors hover:border-white/30 hover:text-white">
                <Icon size={17} />
              </a>
            ))}
          </div>
          <InstallButton className="chip transition-colors hover:border-white/30 hover:text-white" />
        </div>

        {footerNav.map((col) => (
          <div key={col.title}>
            <h2 className="eyebrow mb-5">{col.title}</h2>
            <ul className="space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted transition-colors hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h2 className="eyebrow mb-5">Visit</h2>
          <ul className="space-y-3.5 text-sm text-muted">
            <li className="flex gap-3">
              <IconPhone size={17} className="mt-0.5 shrink-0 text-glow-blue" />
              <a href={`tel:${site.contact.phoneE164}`} className="hover:text-white">{site.contact.phoneDisplay}</a>
            </li>
            <li className="flex gap-3">
              <IconMail size={17} className="mt-0.5 shrink-0 text-glow-blue" />
              <a href={`mailto:${site.contact.email}`} className="break-words hover:text-white"><EmailText email={site.contact.email} /></a>
            </li>
            <li className="flex gap-3">
              <IconPin size={17} className="mt-0.5 shrink-0 text-glow-blue" />
              <address className="not-italic leading-relaxed">{site.address.full}</address>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/[0.06]">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-muted/80 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {site.name}. A member of {site.denomination}.</p>
          <div className="flex flex-wrap gap-5">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            {isStaticPreview ? <span>Review preview</span> : <Link href="/admin" className="hover:text-white">Staff login</Link>}
            <BackToTop />
          </div>
        </div>
      </div>
    </footer>
  );
}
