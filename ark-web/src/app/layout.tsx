import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import { getSite } from "@/server/content";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });

const baseUrl = process.env.SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
  metadataBase: new URL(baseUrl),
  title: { default: `${site.name} · Sembakkam, Chennai`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "church in Chennai",
    "Sembakkam church",
    "Tamil church",
    "English church",
    "Hindi church Chennai",
    "Telugu church Chennai",
    "youth church Chennai",
    "The Ark Victory Church",
    "Victory Churches of India",
  ],
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_IN",
    images: [{ url: "/images/church-family-1-wide.webp", width: 755, height: 461, alt: site.name }],
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: true },
  appleWebApp: { capable: true, title: "The Ark", statusBarStyle: "black-translucent" },
  };
}


export const viewport: Viewport = {
  themeColor: "#050b2e",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
