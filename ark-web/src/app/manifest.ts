import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "The Ark Victory Church",
    lang: "en-IN",
    dir: "ltr",
    short_name: "The Ark",
    description: "Service times, events, live worship and more from The Ark Victory Church, Chennai.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#050b2e",
    theme_color: "#050b2e",
    orientation: "portrait",
    categories: ["lifestyle", "social"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Service times", url: "/services", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Events", url: "/events", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Watch live", url: "/watch", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Give", url: "/give", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
    screenshots: [
      { src: "/screenshots/home-wide.png", sizes: "1366x768", type: "image/png", form_factor: "wide", label: "Home" },
      { src: "/screenshots/home-narrow.png", sizes: "390x844", type: "image/png", form_factor: "narrow", label: "Home on mobile" },
      { src: "/screenshots/services-narrow.png", sizes: "390x844", type: "image/png", form_factor: "narrow", label: "Service times" },
    ],
  };
}
