import type { ReactNode } from "react";
import { JetBrains_Mono, Newsreader, Space_Grotesk } from "next/font/google";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { TabBar } from "./tab-bar";
import { SmoothScroll } from "./smooth-scroll";
import { SceneBackground } from "@/components/three/scene-background";
import { PwaProvider } from "@/components/pwa/pwa-provider";

// Public-site typography (the admin keeps its own fonts from the root layout).
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", style: ["normal", "italic"], display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", weight: ["400", "500"], display: "swap" });

/** Midnight theme, 3D backdrop, smooth scrolling, header and footer — everything public pages share. */
export function SiteShell({ children, tabBar = true }: { children: ReactNode; tabBar?: boolean }) {
  return (
    <div className={`theme-dark relative isolate min-h-dvh ${serif.variable} ${grotesk.variable} ${mono.variable}`}>
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
