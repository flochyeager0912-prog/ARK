import type { MetadataRoute } from "next";
import { withBase as b } from "@/lib/preview";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: b("/"),
    name: "The Ark Victory Church",
    lang: "en-IN",
    dir: "ltr",
    short_name: "The Ark",
    description: "Service times, events, live worship and more from The Ark Victory Church, Chennai.",
    start_url: b("/?source=pwa"),
    scope: b("/"),
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#050b2e",
    theme_color: "#050b2e",
    orientation: "portrait",
    categories: ["lifestyle", "social"],
    icons: [
      { src: b("/icon-192.png"), sizes: "192x192", type: "image/png" },
      { src: b("/icon-512.png"), sizes: "512x512", type: "image/png" },
      { src: b("/icon-maskable-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Service times", url: b("/services"), icons: [{ src: b("/icon-192.png"), sizes: "192x192" }] },
      { name: "Events", url: b("/events"), icons: [{ src: b("/icon-192.png"), sizes: "192x192" }] },
      { name: "Watch live", url: b("/watch"), icons: [{ src: b("/icon-192.png"), sizes: "192x192" }] },
      { name: "Give", url: b("/give"), icons: [{ src: b("/icon-192.png"), sizes: "192x192" }] },
    ],
    screenshots: [
      { src: b("/screenshots/home-wide.png"), sizes: "1366x768", type: "image/png", form_factor: "wide", label: "Home" },
      { src: b("/screenshots/home-narrow.png"), sizes: "390x844", type: "image/png", form_factor: "narrow", label: "Home on mobile" },
      { src: b("/screenshots/services-narrow.png"), sizes: "390x844", type: "image/png", form_factor: "narrow", label: "Service times" },
    ],
  };
}
