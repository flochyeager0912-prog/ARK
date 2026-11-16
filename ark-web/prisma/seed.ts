/**
 * Seeds the database with:
 *  - the church's service timings (taken from the legacy WordPress site), and
 *  - the first ADMIN user from ADMIN_EMAIL / ADMIN_PASSWORD.
 * Idempotent: safe to run repeatedly (existing rows are left unchanged).
 *
 *   npm run db:seed              # services + admin
 *   npm run db:seed -- --demo    # also adds 15 sample events with registrations, inbox items,
 *                                # volunteer applications and an announcement (staging only!)
 */
import fs from "node:fs";
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomInt } from "node:crypto";

// Load .env when present (in containers the variables are injected directly).
if (fs.existsSync(".env")) process.loadEnvFile(".env");

const db = new PrismaClient();

const services: Prisma.ServiceCreateInput[] = [
  // Sunday services ("We have four different services every Sunday")
  { slug: "bilingual-service", name: "Bilingual Service", subtitle: "Tamil & English", category: "SUNDAY", language: "Tamil & English", dayOfWeek: 0, startTime: "06:00", sortOrder: 10 },
  { slug: "tamil-service", name: "Tamil Service", category: "SUNDAY", language: "Tamil", dayOfWeek: 0, startTime: "08:00", livestream: true, sortOrder: 20, description: "Streamed live on YouTube." },
  { slug: "english-service", name: "English Service", category: "SUNDAY", language: "English", dayOfWeek: 0, startTime: "10:00", livestream: true, sortOrder: 30, description: "Streamed live on YouTube." },
  { slug: "ark-arise", name: "Ark Arise", subtitle: "Youth service", category: "SUNDAY", language: "English", dayOfWeek: 0, startTime: "12:15", sortOrder: 40 },

  // Language fellowships
  { slug: "hindi-church", name: "Hindi Church", category: "FELLOWSHIP", language: "Hindi", dayOfWeek: 0, startTime: "17:00", sortOrder: 10, description: "For brothers and sisters from North India to worship together in their own language." },
  { slug: "telugu-fellowship", name: "Telugu Church & Fellowship", category: "FELLOWSHIP", language: "Telugu", dayOfWeek: 0, startTime: "17:00", sortOrder: 20, description: "Worship, Word and fellowship in our Telugu brothers' and sisters' heart language." },
  { slug: "international-fellowship", name: "International Fellowship", subtitle: "African Fellowship", category: "FELLOWSHIP", language: "English", dayOfWeek: 0, recurrence: "MONTHLY_NTH", nthWeek: 2, startTime: null, sortOrder: 30, description: "Brothers and sisters from many nations worshipping together as one family." },

  // Children & youth (meet alongside the main services)
  { slug: "victory-kids-tamil", name: "Victory Kids (Tamil)", subtitle: "Ages 3 – 12", category: "CHILDREN", language: "Tamil", dayOfWeek: 0, startTime: "08:00", sortOrder: 10 },
  { slug: "victory-kids-english", name: "Victory Kids (English)", subtitle: "Ages 3 – 12", category: "CHILDREN", language: "English", dayOfWeek: 0, startTime: "10:00", sortOrder: 20 },
  { slug: "tweens", name: "Tweens Church", subtitle: "Between Victory Kids and Ark Arise", category: "CHILDREN", dayOfWeek: 0, startTime: "10:15", endTime: "11:30", sortOrder: 30 },

  // Monthly gatherings
  { slug: "dawn-service", name: "Dawn Service", subtitle: "Seek ye first the kingdom of God", category: "MONTHLY", dayOfWeek: 0, recurrence: "MONTHLY_NTH", nthWeek: 1, startTime: "05:00", sortOrder: 10, description: "We gather to seek the presence and guidance of the Lord for the new month." },
  { slug: "night-prayer", name: "Night Prayer", category: "MONTHLY", dayOfWeek: 5, recurrence: "MONTHLY_NTH", nthWeek: -1, startTime: null, sortOrder: 20, description: "Thanking the Lord for His mercy and grace over the past month." },
];

async function seedServices() {
  let created = 0;
  for (const s of services) {
    const existing = await db.service.findUnique({ where: { slug: s.slug } });
    if (!existing) {
      await db.service.create({ data: s });
      created++;
    }
  }
  console.log(`services: ${created} created, ${services.length - created} already present`);
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("admin: ADMIN_EMAIL / ADMIN_PASSWORD not set — skipped (use `npm run admin:create`)");
    return;
  }
  const existing = await db.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`admin: ${email} already exists`);
    return;
  }
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters");
  await db.adminUser.create({
    data: { email, name: process.env.ADMIN_NAME || "Church Office", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
  });
  console.log(`admin: created ${email}`);
}

const DEMO_NAMES = [
  "Priya Raman", "Arun Kumar", "Divya Joseph", "Samuel David", "Keerthana S", "Rahul Verma", "Grace Thomas", "Vijay Anand",
  "Anitha Paul", "Joel Daniel", "Meera Krishnan", "Suresh Babu", "Neha Sharma", "Daniel Raj", "Sharon Prakash", "Karthik M",
];

const demoToken = () => randomBytes(32).toString("base64url");
const demoRef = () => `ARK-${Array.from({ length: 6 }, () => "23456789ABCDEFGHJKMNPQRSTUVWXYZ"[randomInt(31)]).join("")}`;

/** Sample registrations for a demo event: `parties` is a list of party sizes, `waitlisted` how many of them are on the waitlist. */
async function demoRegistrations(eventId: string, slug: string, parties: number[], waitlisted = 0) {
  for (const [i, seats] of parties.entries()) {
    const name = DEMO_NAMES[i % DEMO_NAMES.length]!;
    await db.registration.create({
      data: {
        eventId,
        refCode: demoRef(),
        name,
        email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}.${slug.slice(0, 12)}@example.com`,
        phone: `+91 98${String(40000000 + i * 137911).slice(0, 8)}`,
        seats,
        status: i >= parties.length - waitlisted ? "WAITLISTED" : "CONFIRMED",
        manageTokenHash: createHash("sha256").update(demoToken()).digest("hex"),
        consentAt: new Date(Date.now() - (parties.length - i) * 3600_000),
        notes: i % 4 === 1 ? "Coming with family" : null,
      },
    });
  }
}

async function seedDemo() {
  const day = 24 * 3600_000;
  /** IST wall-clock time `days` from today. */
  const at = (days: number, hourIst: number, min = 0) => {
    const d = new Date(Date.now() + 330 * 60_000 + days * day);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hourIst, min) - 330 * 60_000);
  };
  const venue = "The Ark Victory Church, Sembakkam";
  const demo: { data: Prisma.EventCreateInput; parties?: number[]; waitlisted?: number }[] = [
    {
      data: {
        slug: "tribe-night-demo", title: "Tribe Night", ministrySlug: "ark-arise", imageUrl: "/images/ark-arise.webp",
        summary: "A night of worship, games and the Word for young people — bring your friends!",
        description: "Tribe Night is one of Ark Arise's yearly highlights.\n\nExpect high-energy worship, team games, great food and a powerful Word for young people. Come as you are and bring a friend along.\n\nOpen to everyone aged 16 – 30.",
        venue, startsAt: at(14, 18), endsAt: at(14, 21), status: "PUBLISHED", capacity: 150, maxSeatsPerBooking: 4,
      },
      parties: [2, 1, 3, 1, 2, 4, 1],
    },
    {
      data: {
        slug: "21-days-of-prayer-demo", title: "21 Days of Prayer — Opening Night", imageUrl: "/images/21-days-prayer.webp",
        summary: "Begin our extended season of prayer and fasting together as one church family.",
        description: "An extended season of prayer and fasting to experience sustained spiritual growth and transformation.\n\nWe open the 21 days together with worship, a word from our pastors and corporate prayer. No registration needed — everyone is welcome.",
        venue, startsAt: at(21, 19), endsAt: at(21, 21), status: "PUBLISHED", registrationEnabled: false,
      },
    },
    {
      data: {
        slug: "christmas-carol-service", title: "Christmas Carol Service", imageUrl: "/images/sunday-worship-2.webp",
        summary: "Carols, candles and the Christmas story — an evening for the whole family and your friends.",
        description: "Celebrate the birth of Jesus with an evening of carols by our choir and children, a short Christmas message and refreshments afterwards.\n\nInvite your neighbours, colleagues and friends — this is a wonderful evening to bring someone to church for the first time.",
        venue, startsAt: at(34, 18, 30), endsAt: at(34, 20, 30), status: "PUBLISHED", capacity: 400, maxSeatsPerBooking: 8,
      },
      parties: [4, 2, 5, 3, 2, 6, 1, 2, 3],
    },
    {
      data: {
        slug: "victory-kids-christmas-party", title: "Victory Kids Christmas Party", ministrySlug: "victory-kids", imageUrl: "/images/victory-kids.webp",
        summary: "Games, crafts, a nativity skit and gifts for children aged 3 – 12.",
        description: "Our Victory Kids team is throwing a Christmas party! Children will enjoy games, crafts, a nativity skit and a small gift each.\n\nParents: please register each child (one booking per family is fine — choose the number of children). Drop-off from 3:45 PM.",
        venue: "Victory Kids Hall, The Ark Victory Church", startsAt: at(27, 16), endsAt: at(27, 18), status: "PUBLISHED", capacity: 80, maxSeatsPerBooking: 4,
      },
      parties: [2, 1, 3, 2, 1, 2],
    },
    {
      data: {
        slug: "ark-arise-youth-camp", title: "Ark Arise Youth Camp 2027", ministrySlug: "ark-arise", imageUrl: "/images/ark-arise-2.webp",
        summary: "Three days away to grow in faith and friendship — worship, workshops and adventure.",
        description: "Our annual youth camp is back! Three days of worship, teaching, small groups and outdoor adventure.\n\nTransport, meals and accommodation are included. Places are limited — if the camp is full, join the waitlist and we'll confirm you automatically if a place opens up.",
        venue: "Retreat centre, East Coast Road", startsAt: at(48, 7), endsAt: at(50, 17), status: "PUBLISHED", capacity: 12, maxSeatsPerBooking: 2,
      },
      parties: [2, 2, 1, 2, 1, 2, 2, 1, 1],
      waitlisted: 2,
    },
    {
      data: {
        slug: "couples-dinner", title: "Couples' Dinner Night", imageUrl: "/images/marriage-celebration.webp",
        summary: "An evening for married couples — dinner, conversation and encouragement for your marriage.",
        description: "Take an evening off together. Enjoy a sit-down dinner, a short talk on building a Christ-centred marriage, and time to connect with other couples.\n\nChildcare is not provided at this event.",
        venue: "Fellowship Hall, The Ark Victory Church", startsAt: at(19, 19, 30), endsAt: at(19, 22), status: "PUBLISHED", capacity: 20, maxSeatsPerBooking: 2, waitlistEnabled: false,
      },
      parties: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    },
    {
      data: {
        slug: "hindi-church-fellowship-lunch", title: "Hindi Church Fellowship Lunch", ministrySlug: "hindi-church", imageUrl: "/images/hindi-church.webp",
        summary: "Worship in Hindi followed by a home-cooked lunch together.",
        description: "Join our Hindi Church family for a special Sunday of worship in Hindi, followed by lunch together.\n\nNew to Chennai? This is a great way to meet others from North India and find a church family.",
        venue, startsAt: at(7, 17), endsAt: at(7, 20), status: "PUBLISHED", capacity: 60, maxSeatsPerBooking: 6,
      },
      parties: [3, 2, 4],
    },
    {
      data: {
        slug: "telugu-fellowship-anniversary", title: "Telugu Fellowship Anniversary", ministrySlug: "telugu-fellowship", imageUrl: "/images/telugu-church-anniversary.webp",
        summary: "Celebrating God's faithfulness to our Telugu church family with worship and a special guest speaker.",
        description: "Our Telugu Church & Fellowship celebrates another year of God's goodness. Join us for a joyful anniversary service with worship, testimonies and a special guest speaker, followed by dinner.",
        venue, startsAt: at(40, 17), endsAt: at(40, 20, 30), status: "PUBLISHED", registrationEnabled: false,
      },
    },
    {
      data: {
        slug: "discipleship-groups-launch", title: "Discipleship Groups — New Term Launch", ministrySlug: "discipleship-groups", imageUrl: "/images/discipleship-small-groups.webp",
        summary: "Find a small group near you and grow in your walk with Jesus this term.",
        description: "Our discipleship groups meet weekly across Chennai. At the launch evening you'll meet group leaders, hear about this term's study and sign up for a group that suits your area and schedule.\n\nRegistration closes two days before the event so we can plan groups.",
        venue, startsAt: at(10, 19), endsAt: at(10, 20, 30), registrationClosesAt: at(8, 23, 59), status: "PUBLISHED", capacity: 120, maxSeatsPerBooking: 2,
      },
      parties: [1, 2, 1, 1],
    },
    {
      data: {
        slug: "rakshak-health-camp", title: "Rakshak Community Health Camp", ministrySlug: "rakshak", imageUrl: "/images/rakshak.webp",
        summary: "Free health check-ups for families in our neighbourhood — volunteers welcome.",
        description: "Rakshak is hosting a free community health camp with general check-ups, blood-pressure and sugar screening, and guidance for mothers and children.\n\nRegister if you'd like a check-up slot or want to serve as a volunteer (mention it in the notes).",
        venue: "Community Hall, Sembakkam", startsAt: at(24, 9), endsAt: at(24, 14), status: "PUBLISHED", capacity: 200, maxSeatsPerBooking: 5,
      },
      parties: [1, 3, 2, 1, 4],
    },
    {
      data: {
        slug: "sembakkam-outreach", title: "Sembakkam Neighbourhood Outreach", ministrySlug: "evangelistic-events", imageUrl: "/images/evangelistic-events.webp",
        summary: "Share God's love with our neighbours through songs, prayer and practical help.",
        description: "Join the outreach team as we go out into our neighbourhood with songs, prayer and food packets for families in need.\n\nMeet at the church gate. No registration needed — just come along in comfortable shoes!",
        venue: "Meet at the church gate", startsAt: at(5, 16), endsAt: at(5, 18, 30), status: "PUBLISHED", registrationEnabled: false,
      },
    },
    {
      data: {
        slug: "watchnight-service", title: "New Year's Eve Watchnight Service", imageUrl: "/images/prayer-service.webp",
        summary: "Thank God for the year gone by and step into the new year in worship and prayer.",
        description: "End the year in God's presence. We gather for worship, testimonies, communion and prayer, crossing into the new year together as a church family.",
        venue, startsAt: at(45, 22), endsAt: at(46, 0, 30), status: "PUBLISHED", registrationEnabled: false,
      },
    },
    {
      data: {
        slug: "easter-musical-planning", title: "Easter Musical — Auditions", imageUrl: "/images/special-sundays-1.webp",
        summary: "Singers, actors and tech crew wanted for this year's Easter musical.",
        description: "Draft: details still being finalised by the worship team.",
        venue, startsAt: at(60, 15), endsAt: at(60, 18), status: "DRAFT", capacity: 50, maxSeatsPerBooking: 1,
      },
    },
    {
      data: {
        slug: "beach-baptism", title: "Beach Baptism Service", imageUrl: "/images/church-family-3.webp",
        summary: "Celebrating new believers as they take the step of baptism.",
        description: "Due to the cyclone warning this baptism service has been postponed. A new date will be announced on Sunday.",
        venue: "Besant Nagar Beach", startsAt: at(12, 6, 30), endsAt: at(12, 9), status: "CANCELLED", capacity: 100, maxSeatsPerBooking: 6,
      },
      parties: [3, 2],
    },
    {
      data: {
        slug: "thanksgiving-sunday", title: "Thanksgiving Sunday", imageUrl: "/images/church-family-1.webp",
        summary: "A special Sunday of gratitude for all that God has done this year.",
        description: "A combined service of thanksgiving with testimonies, special music and a fellowship meal.",
        venue, startsAt: at(-7, 10), endsAt: at(-7, 13), status: "PUBLISHED", capacity: 300, maxSeatsPerBooking: 6,
      },
      parties: [4, 2, 3, 5, 1],
    },
  ];
  let created = 0;
  for (const e of demo) {
    if (await db.event.findUnique({ where: { slug: e.data.slug } })) continue;
    const ev = await db.event.create({ data: e.data });
    if (e.parties) await demoRegistrations(ev.id, ev.slug, e.parties, e.waitlisted ?? 0);
    created++;
  }
  console.log(`demo events: ${created} created, ${demo.length - created} already present`);

  // Inbox, volunteers and an announcement so every admin screen has something to show.
  if ((await db.enquiry.count({ where: { email: { endsWith: "@example.com" } } })) === 0) {
    const consentAt = new Date();
    await db.enquiry.createMany({
      data: [
        { name: "Ravi Shankar", email: "ravi.shankar@example.com", phone: "+91 98400 11223", purpose: "new-to-ark", message: "We just moved to Sembakkam. Is there parking near the church for the 10 AM service?", consentAt },
        { name: "Lydia George", email: "lydia.george@example.com", purpose: "prayer-request", message: "Please pray for my mother's surgery next week.", isPrayerRequest: true, contactOk: false, consentAt },
        { name: "Thomas Mathew", email: "thomas.mathew@example.com", phone: "+91 98410 55667", purpose: "discipleship-groups", message: "Is there a discipleship group near Medavakkam that meets on weekday evenings?", status: "IN_PROGRESS", consentAt },
        { name: "Asha Nair", email: "asha.nair@example.com", purpose: "general", message: "Do you have a Tamil Bible study on weekdays?", status: "RESOLVED", resolvedAt: consentAt, consentAt },
      ],
    });
    await db.volunteerApplication.createMany({
      data: [
        { name: "Benjamin Isaac", email: "benjamin.isaac@example.com", phone: "+91 98765 43210", teams: ["Media & tech"], availability: ["10 AM English service"], experience: "Ran sound at college events.", consentAt },
        { name: "Hannah Joseph", email: "hannah.joseph@example.com", phone: "+91 98765 12345", teams: ["Victory Kids (children)"], availability: ["8 AM Tamil service"], status: "APPROVED", consentAt },
        { name: "Pradeep Kumar", email: "pradeep.kumar@example.com", phone: "+91 98111 22334", teams: ["Hospitality & ushering"], availability: ["6 AM Bilingual service", "Special events"], status: "ON_HOLD", consentAt },
      ],
    });
    await db.announcement.create({
      data: { title: "Christmas Carol Service — registration is open", body: "Invite your friends and family for an evening of carols and the Christmas story.", linkUrl: "/events/christmas-carol-service", linkLabel: "Register now" },
    });
    console.log("demo inbox, volunteers and announcement created");
  }
}

async function main() {
  await seedServices();
  await seedAdmin();
  if (process.argv.includes("--demo")) await seedDemo();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
