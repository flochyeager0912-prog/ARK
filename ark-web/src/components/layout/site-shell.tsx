import type { ReactNode } from "react";
import { Fraunces, IBM_Plex_Mono, Sora } from "next/font/google";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { TabBar } from "./tab-bar";
import { SmoothScroll } from "./smooth-scroll";
import { SceneBackground } from "@/components/three/scene-background";
import { PwaProvider } from "@/components/pwa/pwa-provider";

// Public-site typography (the admin keeps its own fonts from the root layout):
// Fraunces for display, Sora for reading text, IBM Plex Mono for small labels.
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", style: ["normal", "italic"], axes: ["opsz"], display: "swap" });
const sans = Sora({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-code", weight: ["400", "500"], display: "swap" });

/** Midnight theme, 3D backdrop, smooth scrolling, header and footer — everything public pages share. */
export function SiteShell({ children, tabBar = true }: { children: ReactNode; tabBar?: boolean }) {
  return (
    <div className={`theme-dark relative isolate min-h-dvh ${serif.variable} ${sans.variable} ${mono.variable}`}>
      <PwaProvider>
        <SceneBackground />
        <SmoothScroll />
        <SiteHeader />
        <main id="main" className="relative">{children}</main>
        <SiteFooter />
        {tabBar && <TabBar />}
      </PwaProvider>
    </div>
  );
}
