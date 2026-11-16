/**
 * Church-wide facts — DEFAULTS. Source: footer + Contact page of the legacy WordPress site.
 * Staff edit these in Admin → Content → Church details; read them via getSite() (src/server/content.ts).
 */
export const site = {
  name: "The Ark Victory Church",
  shortName: "The Ark",
  alternateNames: ["The Ark VCI", "Ark Victory Church", "ARK Victory Church"],
  denomination: "Victory Churches of India",
  tagline: "Where church is a family",
  description:
    "The Ark Victory Church is a passionate, Word-based church in South Chennai — a family where people of all ages, languages and cultures belong, grow and thrive.",
  foundedNote: "Ministry began in 1999 · Church restarted January 2004",
  anniversaryYears: 21,

  contact: {
    phoneDisplay: "+91 98842 65131",
    phoneE164: "+919884265131",
    whatsappE164: "919884265131",
    email: "infovci@thearkvictorychurch.com",
    // Listed on the legacy Contact page as a second contact email.
    secondaryEmail: "meetmayday2018@gmail.com",
  },

  address: {
    line1: "99/A, Velachery - Tambaram Main Rd",
    locality: "Sembakkam",
    city: "Chennai",
    region: "Tamil Nadu",
    postalCode: "600073",
    country: "IN",
    full: "99/A, Velachery - Tambaram Main Rd, Sembakkam, Chennai, Tamil Nadu 600073",
  },

  social: {
    youtube: "https://www.youtube.com/thearkvictorychurch",
    instagram: "https://www.instagram.com/thearkvictory/",
    facebook: "https://www.facebook.com/thearkvictory/",
  },

  // A recent service video linked from the legacy Services page.
  featuredVideoId: "ftCX9xWeFzU",

  external: {
    rakshak: "https://rakshak.org.in/",
  },
};

export type SiteContent = typeof site;

export const mapsEmbedUrl = (s: SiteContent) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(s.address.full)}&t=m&z=15&output=embed&iwloc=near`;

export const mapsDirectionsUrl = (s: SiteContent) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address.full)}`;

export type NavItem = { label: string; href: string; children?: NavItem[] };

export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "About",
    href: "/about",
    children: [
      { label: "About us", href: "/about" },
      { label: "Our mission", href: "/about/mission" },
      { label: "Our journey", href: "/about/journey" },
      { label: "Gallery", href: "/gallery" },
    ],
  },
  {
    label: "Services",
    href: "/services",
    children: [
      { label: "Sunday services", href: "/services" },
      { label: "Other services", href: "/services/special" },
      { label: "Live worship", href: "/watch" },
    ],
  },
  { label: "Ministries", href: "/ministries" },
  { label: "Events", href: "/events" },
  {
    label: "Get involved",
    href: "/get-involved",
    children: [
      { label: "Reach out in faith", href: "/get-involved" },
      { label: "Volunteer with us", href: "/get-involved/volunteer" },
      { label: "Givings", href: "/give" },
    ],
  },
  { label: "Contact", href: "/contact" },
];

export const footerNav: { title: string; links: NavItem[] }[] = [
  {
    title: "Useful links",
    links: [
      { label: "About us", href: "/about" },
      { label: "Gallery", href: "/gallery" },
      { label: "Our journey", href: "/about/journey" },
      { label: "Services", href: "/services" },
      { label: "Events", href: "/events" },
      { label: "Contact us", href: "/contact" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Reach out in faith", href: "/get-involved" },
      { label: "Other services", href: "/services/special" },
      { label: "Different ministries", href: "/ministries" },
      { label: "Volunteer with us", href: "/get-involved/volunteer" },
      { label: "Donate", href: "/give" },
    ],
  },
];
