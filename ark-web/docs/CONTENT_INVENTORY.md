# Content Inventory: WordPress → New Site

This document records where every piece of content from the 12 pages of the legacy site (thearkvictorychurch.com, crawled 16 Nov 2026) now lives. Nothing was dropped.

- **Raw crawl:** `../_legacy-site/` (`pages.json` is the WordPress REST export; `text_*.txt` holds the extracted text; `img/` holds the original images).
- **New content:** `src/content/*.ts`. Service times are stored in the database and are editable in **Admin → Service timings**.

## Page-by-page mapping

| Legacy page | Section / fact | New location |
|---|---|---|
| **Home** `/` | "Thanking God for 21 years of goodness & faithfulness" text | `/` (anniversary section) · `about.ts → anniversary` |
| | "Where church is family" text | `/` hero · `about.ts → whereChurchIsFamily` |
| | "Welcome to The Ark Church Family" (two paragraphs) | `/` and `/about` · `about.ts → welcome` |
| | "Together We Can Glorify God" | `/` (welcome section eyebrow) |
| | "Join us Online Every Sunday" (8 AM Tamil and 10 AM English streamed) | `/`, `/watch` · `pages.ts → servicesIntro.online` |
| | Four Sunday services: 6 AM Bilingual, 8 AM Tamil, 10 AM English, 12:15 PM Ark Arise | DB `service` (seeded) → `/`, `/services` |
| | "The highlight of our services is…" text | `/`, `/services` · `pages.ts → servicesIntro` |
| | Hindi Church (5 PM), Telugu Church (5 PM) | DB + `/ministries/hindi-church`, `/ministries/telugu-fellowship` |
| | Victory Kids, Tweens, Ark Arise descriptions | `/ministries/*` · `ministries.ts` |
| | International / African Fellowship (every 2nd Sunday) | DB + `/ministries/international-fellowship` |
| | Rakshak ("One little heartbeat at a time", 2004, 1000+ children), Donate link | `/`, `/give`, `/ministries/rakshak` |
| | "Church is more than walls — it is a family and a home." | `/about/journey` hero |
| **About us** `/about-us/` | "Where church is family" + welcome text | `/about` |
| | "Love God Love people" + 4 pillars (Love, Worship, Discipleship, Service) | `/about` · `about.ts → loveGodLovePeople` |
| | "Preaching Hope, Inspiring Generations" / "Guided by faith…" | `/about` (pastors section) |
| | Pastors: Ps. Jay Kumar & Ps. Anjali, photo, shepherd quote | `/about` · `about.ts → pastors` |
| | "Our Ark Team welcomes you", verse (Isaiah 43:4), team description | `/about` · `about.ts → arkTeam` |
| **Our Mission** `/our-mission/` | Mission statement + "To reach and influence the world…" | `/about/mission` hero |
| | Missions (Chennai and the "ends of the earth") | `/about/mission` |
| | "A missional church" + helping pastors in mission fields | `/about/mission` |
| | Alan Hirsch quote | `/about/mission` |
| | Petras and Rakshak (two local missions); Petras founded 2009 | `/about/mission` · `about.ts → localMissions` |
| | Ministry Teams paragraph + 2 photos | `/about/mission` · `about.ts → ministryTeams` |
| **Our Journey** `/our-journey/` | Matthew 18:20 + two intro paragraphs | `/about/journey` |
| | Timeline: 1999, 2000–2003, 2004 (+ Vision of Rakshak), 2006, 2007, 2009, Oct 2015, 2020, 2023 | `/about/journey` · `about.ts → journey` |
| **Services** `/services-2/` | All of the above service blocks | `/services` |
| | "Watch on YouTube" (video `ftCX9xWeFzU`) | `/watch` embedded player · `site.ts → featuredVideoId` |
| | The discipleship groups paragraph | `/ministries/discipleship-groups` |
| **Other services** `/other-services/` | Dawn service (5 AM, first Sunday / first day of month) | DB + `/services/special#dawn-service` |
| | Night prayer (last Friday of the month) | DB + `/services/special#night-prayer` |
| | Fasting prayer, 7 Days of Prayer, 21 Days of Prayer | `/services/special` · `pages.ts → otherServices` |
| | Special Sundays: Mother's Day, Valentine's Day, Women's Day + intro/outro | `/services/special#special-sundays` |
| **Different ministries** `/differentministries/` | Victory Kids (8 AM Tamil, 10 AM English), Ark Arise (12:15 PM), Tweens (10:15–11:30 AM) | `/ministries/*` + DB (Children & youth) |
| | Discipleship groups: three paragraphs + "Discipleship is the process…" | `/ministries/discipleship-groups` |
| | Missions: seven missionaries, one church in every district, blessing festivals | `/ministries/missions`, `/about/mission` |
| | Evangelistic events: 'History' (Christmas), 'Heroes' (Easter) | `/ministries/evangelistic-events` |
| **Reach out in faith** `/get-in-touch/` | Ministerial Opportunities | `/get-involved#ministerial-opportunities` |
| | Be the Hands and Feet of Christ (volunteer) | `/get-involved#volunteer` + new form `/get-involved/volunteer` |
| | About Our Church | `/get-involved` (closing section) |
| | Help Us Build for the Future (building fund) | `/get-involved#building-fund`, `/give#building-fund` |
| | Grow Together in Faith (discipleship groups, weekly in homes and online) | `/get-involved#discipleship-groups` |
| **Givings** `/givings/` | "Offering to God", "Excitement in sowing/giving/obeying", "Obedience is better than sacrifice" | `/give` |
| | **Payment QR image** (Victory Churches of India; Mastercard, BHIM RuPay, Visa; MID/TID) | `/give` · `public/images/giving-qr.webp` |
| | "Scan the QR code, enter the amount, mention tithe or offering" | `/give` |
| | Rakshak donate link | `/give` |
| | Explore Your Calling (4 numbered items) | `/get-involved` |
| **Live worship** `/live-worship/` | All text ("Whether you are unable to attend…", "Power of Worship", "Join us every Sunday online…") | `/watch` · `pages.ts → liveWorship` |
| **Contact us** `/contact-us/` | "New to Ark?" / "You are not here by accident" + welcome text | `/contact` hero |
| | Ark Ministries / Ark Youth & Kids / Ark Fellowships cards | `/contact` (3 cards) |
| | Form intro text, phone, **both** email addresses, Google Map | `/contact` |
| | Form purposes: Ministerial Opportunities, Volunteer, Building Fund, Discipleship Groups | `/contact` form (plus prayer, general, new-to-Ark and join-ministry options) |
| **Gallery** `/gallery/` | All 6 photos | `/gallery` (18 photos in total) |
| **Footer** | Phone, email, address, Useful Links, Community links, YouTube, Instagram and Facebook | `site.ts` → footer on every page |

## Images
All 58 legacy images were converted to WebP (cutting about 64 MB to about 9 MB) and given descriptive names. `scripts/optimize-images.ts` holds the full mapping from legacy filename to new filename.

Four images referenced by the old site were **already missing on the WordPress server** (they returned 404) and could not be recovered:
- `pic-1.png` (home hero decoration)
- `32e609f0-pin.png` (decorative pin icon)
- `429b4115-obj-2.png` (decoration)
- `f.png` (contact page decoration)

None of them carried information.

## Corrections made (please review)
| Legacy text | What the new site says | Why |
|---|---|---|
| "Rakshak is **out** NGO" | "our NGO" | Typo |
| "Over the **19 years**, Rakshak has served 1000 plus children" | "Over the years…" | Founded in 2004, so "19 years" is out of date |
| 2015 and 2020 journey entries reused the 2009 text ("A new focus on youth and leadership emerged…") | 2015 says only "The new Ark Victory Church building at Sembakkam was dedicated." 2020 has a short Tweens sentence. | Copy-paste error on the old site |
| "Join Dawn service / Fasting prayer / 21 days / Special Sundays" buttons linked to rakshak.org.in | Now link to the contact form | Broken links on the old site |
| "Join Victory kids" etc. linked to `/contact%20us/` (a broken URL) | `/contact?purpose=join-ministry&ministry=…` | Broken links on the old site |
| Night prayer: "time:" (blank) | "Time to be announced" (editable in Admin → Service timings) | No time was given |
| "Evagelitic", "Didcipleship" | "Evangelistic", "Discipleship" | Typos |

## ⚠️ Needs confirmation from church leadership
1. **Dawn service:** the old site says both "every **first day** of the month" and "every **first Sunday** of every month at 5 a.m." The new site uses **first Sunday, 5 AM**. Change it in Admin → Service timings if this is wrong.
2. **Rakshak reach:** "1000 plus children" (Home and Ministries pages) vs "over **3,000** children" (Journey page). Both statements are kept. Pick one figure.
3. **International vs African Fellowship:** the new name is "International Fellowship (African Fellowship)". Confirm the preferred name, and its **time** (none was published).
4. **Night prayer time:** none was published.
5. **Hindi Church and Telugu Fellowship both at 5 PM:** confirm (the old site states this).
6. **Secondary email `meetmayday2018@gmail.com`:** it was published on the old Contact page and is kept there. Confirm it should stay public.
7. **Anniversary year:** the site says "21 years". It will need updating each year, in `src/content/about.ts` and `site.ts`.
8. **Building fund giving:** the old site had no separate account or QR for the building fund, so the new site asks donors to use the main QR with the note "building fund". Supply separate details if they exist.
