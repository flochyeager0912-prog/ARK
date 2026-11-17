/**
 * Registry of editable content sections (Admin → Content).
 *
 * Each section's DEFAULT comes from the typed content files in this folder.
 * When staff save a section, the edited value is stored in the `content_block`
 * table and overrides the default (see src/server/content.ts).
 */
import { site } from "./site";
import * as about from "./about";
import { ministries, ministryGroups } from "./ministries";
import * as pages from "./pages";

export const SECTION_DEFAULTS = {
  site,
  home: {
    anniversary: about.anniversary,
    whereChurchIsFamily: about.whereChurchIsFamily,
    welcome: about.welcome,
  },
  about: {
    loveGodLovePeople: about.loveGodLovePeople,
    pastors: about.pastors,
    arkTeam: about.arkTeam,
  },
  mission: {
    missionStatement: about.missionStatement,
    missions: about.missions,
    localMissions: about.localMissions,
    ministryTeams: about.ministryTeams,
  },
  journey: {
    intro: about.journeyIntro,
    milestones: about.journey,
  },
  ministries: { items: ministries },
  services: {
    intro: pages.servicesIntro,
    otherServices: pages.otherServices,
    specialSundays: pages.specialSundays,
    liveWorship: pages.liveWorship,
  },
  giving: pages.giving,
  getInvolved: pages.getInvolved,
  contact: pages.contactPage,
  gallery: { photos: pages.gallery },
};

export type Sections = typeof SECTION_DEFAULTS;
export type SectionKey = keyof Sections;

export const SECTION_META: Record<SectionKey, { title: string; description: string; pages: string[] }> = {
  site: {
    title: "Church details",
    description: "Name, tagline, phone, email, address, social links and the featured YouTube video. Used in the header, footer, emails and Google.",
    pages: ["/", "/contact"],
  },
  home: { title: "Home page", description: "Anniversary message, “Where church is family” and the welcome text.", pages: ["/"] },
  about: { title: "About us", description: "Love God, Love People pillars, pastors and the Ark team.", pages: ["/about", "/#about"] },
  mission: { title: "Our mission", description: "Mission statement, missions, Petras & Rakshak and ministry teams.", pages: ["/about/mission"] },
  journey: { title: "Our journey", description: "Intro text, verse and the timeline milestones (1999 → today).", pages: ["/about/journey", "/#journey"] },
  ministries: {
    title: "Ministries",
    description: "Every ministry page: text, schedule, age group, photos and button.",
    pages: ["/ministries", "/#ministries"],
  },
  services: {
    title: "Services & worship text",
    description: "Services page intro, other services (dawn, prayer, fasting…), Special Sundays and the Live worship page. Times are under Service timings.",
    pages: ["/services", "/services/special", "/watch", "/#services"],
  },
  giving: { title: "Givings", description: "Giving page text, QR image, building fund and Rakshak.", pages: ["/give", "/#involved"] },
  getInvolved: { title: "Get involved", description: "Reach out in faith: the four ways to serve and the closing section.", pages: ["/get-involved", "/#involved"] },
  contact: { title: "Contact page", description: "“New to Ark?” welcome, the three cards and the form introduction.", pages: ["/contact", "/#contact"] },
  gallery: { title: "Gallery", description: "Photos shown on the Gallery page, in order.", pages: ["/gallery"] },
};

export const SECTION_KEYS = Object.keys(SECTION_DEFAULTS) as SectionKey[];

export const isSectionKey = (k: string): k is SectionKey => (SECTION_KEYS as string[]).includes(k);

/** Choice lists for specific fields (rendered as a dropdown). */
export const FIELD_OPTIONS: Record<string, readonly string[]> = {
  group: ministryGroups,
};

/** Friendlier labels / hints for field keys (anything not listed is auto-labelled). */
export const FIELD_LABELS: Record<string, { label?: string; hint?: string }> = {
  body: { label: "Text", hint: "Each box is one paragraph." },
  src: { label: "Image" },
  alt: { label: "Image description", hint: "Describe the photo for people using screen readers and for Google." },
  href: { label: "Link", hint: "A page on this site (e.g. /contact) or a full https:// address." },
  cta: { label: "Button" },
  slug: { label: "URL name", hint: "Used in the web address, e.g. /ministries/ark-arise. Lowercase letters, numbers and dashes only." },
  serviceSlugs: { label: "Linked service times", hint: "Slugs of rows in Admin → Service timings whose times show on this page." },
  external: { label: "Opens another website" },
  eyebrow: { label: "Small heading above the title" },
  phoneE164: { label: "Phone (international format)", hint: "e.g. +919884265131 — used for tap-to-call." },
  phoneDisplay: { label: "Phone (as displayed)" },
  whatsappE164: { label: "WhatsApp number", hint: "Digits only with country code, e.g. 919884265131." },
  featuredVideoId: { label: "Featured YouTube video ID", hint: "The part after watch?v= in a YouTube link." },
  full: { label: "Full address (one line)", hint: "Also used for the map and directions." },
  anniversaryYears: { label: "Years since founding" },
  ageRange: { label: "Age group" },
  verseRef: { label: "Verse reference" },
  nthWeek: { label: "Week of month" },
  when: { label: "When", hint: "Leave empty if there is no regular time." },
  photos: { label: "Photos" },
  whereChurchIsFamily: { label: "Top banner — “Where church is family”" },
  welcome: { label: "Welcome section" },
  anniversary: { label: "Anniversary section" },
  loveGodLovePeople: { label: "Love God, Love People" },
  arkTeam: { label: "Ark team" },
  missionStatement: { label: "Mission statement" },
  localMissions: { label: "Petras & Rakshak" },
  ministryTeams: { label: "Ministry teams" },
  otherServices: { label: "Other services" },
  specialSundays: { label: "Special Sundays" },
  liveWorship: { label: "Live worship page" },
  buildingFund: { label: "Building fund" },
  qr: { label: "Giving QR code" },
  cards: { label: "Ways to get involved" },
  pillars: { label: "Cards" },
  newToArk: { label: "“New to Ark?” banner" },
  intro: { label: "Introduction" },
  key: { label: "Section ID", hint: "Used in links such as /get-involved#volunteer. Avoid changing it." },
  items: { label: "Ministries" },
  milestones: { label: "Timeline milestones" },
};

/** Fields that are optional by design (path within the section; list levels skipped). */
export const OPTIONAL_FIELDS: Partial<Record<SectionKey, string[]>> = {
  journey: ["milestones.image"],
  services: ["otherServices.image", "otherServices.when", "otherServices.verse"],
  ministries: ["items.schedule", "items.ageRange", "items.highlights", "items.gallery", "items.serviceSlugs", "items.cta.external"],
  getInvolved: ["cards.subtitle"],
};

/** Keys whose values must not be empty when present. */
export const REQUIRED_KEYS = new Set(["name", "title", "slug", "src"]);
