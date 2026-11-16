/**
 * Content for Services intro, Other services, Live worship, Givings,
 * Reach out in faith (get involved), Contact and Gallery.
 * Source: legacy /services-2/, /other-services/, /live-worship/, /givings/,
 * /get-in-touch/, /contact-us/, /gallery/.
 */

export const servicesIntro = {
  title: "Church Services",
  lead: "We have four different services every Sunday",
  body: "The highlight of our services is the vibrant Spirit-led worship, undiluted Word of God, and a family of loving people.",
  image: "/images/collage-services.webp",
  online: {
    title: "Join us online every Sunday",
    body: "Our 8:00 AM (Tamil) and 10:00 AM (English) services are streamed live online. Be part of uplifting worship, a life-changing Word, and the presence of God right where you are.",
  },
};

export type OtherService = {
  slug: string;
  title: string;
  when?: string;
  verse?: string;
  body: string[];
  image?: { src: string; alt: string };
};

export const otherServices: OtherService[] = [
  {
    slug: "dawn-service",
    title: "Dawn Service",
    when: "5:00 AM · First Sunday of every month",
    verse: "Seek ye first the kingdom of God",
    body: [
      "Every first day of the month, the church gathers together to seek the Presence of the Lord for the new month.",
      "Every first day of the month holds special significance for us as a church community. As the word says, “Seek ye first the kingdom of God,” we seek the Kingdom of God and the presence and guidance of the Lord for the new month ahead.",
      "Through worship, prayer, and fellowship, these gatherings offer us an opportunity to draw closer to God, renew our faith, and set the tone for a spiritually fulfilling and blessed month. It happens every first Sunday of every month at 5 a.m.",
    ],
    image: { src: "/images/dawn-service.webp", alt: "Congregation worshipping at the Dawn Service" },
  },
  {
    slug: "night-prayer",
    title: "Night Prayer",
    when: "Last Friday of every month",
    body: [
      "The Night Prayer service at our church is a deeply meaningful and reflective gathering that takes place every last Friday of the month, thanking the Lord for His mercy and grace for the past month.",
    ],
    image: { src: "/images/prayer-service.webp", alt: "Night prayer service" },
  },
  {
    slug: "fasting-prayer",
    title: "Fasting Prayer",
    body: [
      "Join us in seeking God through fasting and prayer. This special gathering is a time to humble ourselves, focus on God’s Word, and experience spiritual breakthroughs. Come prepared to worship, pray, and align your heart with His purposes.",
    ],
  },
  {
    slug: "7-days-of-prayer",
    title: "7 Days of Prayer",
    when: "A week-long season",
    body: [
      "A week-long journey dedicated to persistent prayer and spiritual renewal. Each day focuses on a different theme, helping participants deepen their relationship with God and intercede.",
    ],
  },
  {
    slug: "21-days-of-prayer",
    title: "21 Days of Prayer",
    when: "An extended season of prayer & fasting",
    body: [
      "An extended season of prayer and fasting to experience sustained spiritual growth and transformation. This program is designed to strengthen faith, ignite purpose, and invite God’s presence into every area of life.",
    ],
    image: { src: "/images/21-days-prayer.webp", alt: "21 Days of Prayer poster" },
  },
];

export const specialSundays = {
  title: "Special Sundays",
  intro:
    "Special Sundays at our church are joyous occasions that allow us to come together as a community and celebrate the diverse and meaningful aspects of our lives and faith. Each of these unique Sundays holds a special place in our hearts and offers us an opportunity to reflect, honor, and rejoice in various important themes and events.",
  items: [
    {
      title: "Mother’s Day",
      body: "A cherished day where we express our gratitude and love for all the wonderful mothers and mother figures in our congregation. We take this time to celebrate their unconditional love, sacrifices, and the invaluable role they play in nurturing and shaping our families and communities.",
    },
    {
      title: "Valentine’s Day",
      body: "A beautiful occasion where we celebrate the sacred bond of marriage and love. It’s a time to honor the commitment, companionship, and love shared between couples in our church. We celebrate the beauty of marriage as a divine union and a reflection of God’s love for us.",
    },
    {
      title: "Women’s Day",
      body: "A special Sunday dedicated to recognizing and honoring the incredible women in our church and society. We celebrate their strength, resilience, faith, and contributions to our community and the world. It’s a day to uplift and empower women, acknowledging their unique gifts and the vital role they play in our families, church, and broader society.",
    },
  ],
  outro:
    "These are just some instances of our Special Sundays. They are not only occasions of celebration but also moments of reflection and spiritual growth. They remind us of the importance of love, family, community, and faith in our lives. It’s a time for unity, celebration, and renewal as we continue to grow together in faith and love as a church family.",
  images: [
    { src: "/images/special-sundays-1.webp", alt: "Congregation gathered for a Special Sunday" },
    { src: "/images/special-sundays-2.webp", alt: "Special Sunday service in the main hall" },
  ],
};

export const liveWorship = {
  title: "Live Worship",
  body: [
    "Whether you are unable to attend in-person services, exploring faith for the first time, or looking for a digital community to connect with, The Ark Victory Church Online welcomes you with open arms. You can join our live-streamed services and connect to us using our online platforms.",
    "Experience the joy of community, the power of worship, and the transformative presence of God in the comfort of your own space.",
  ],
  power: {
    title: "Power of Worship",
    body: "Join us every Sunday online and be part of the Online Ark community. Come as you are and join us online this Sunday! We look forward to worshiping with you!",
  },
};

export const giving = {
  title: "Offering to God",
  eyebrow: "Givings",
  headline: "Excitement in sowing, giving, obeying",
  subline: "Obedience is better than sacrifice",
  verseRef: "1 Samuel 15:22",
  qr: {
    src: "/images/giving-qr.webp",
    alt: "Victory Churches of India payment QR code with Mastercard, BHIM RuPay and Visa details",
    instructions: "Scan the QR code, enter the amount, and mention “tithe” or “offering”.",
    payee: "Victory Churches of India",
  },
  buildingFund: {
    title: "Help us build for the future",
    body: "Support our vision to expand facilities and create more space for worship, learning, and outreach. Every contribution brings us closer to our goal.",
    image: "/images/building-fund.webp",
  },
  rakshak: {
    title: "Rakshak",
    tagline: "One little heartbeat at a time",
    body: "Give to Rakshak, our NGO serving underprivileged children in informal settlements since 2004.",
    image: "/images/rakshak.webp",
  },
};

export const getInvolved = {
  title: "Explore your calling to serve God",
  intro:
    "Discover ways to grow in ministry through preaching, teaching, and pastoral care. Join our volunteer teams and make a real difference in the community.",
  cards: [
    {
      key: "ministerial-opportunities",
      number: 1,
      title: "Ministerial Opportunities",
      body: "Discover ways to serve through preaching, teaching, pastoral care, and outreach. Whether you’re pursuing full-time ministry or seeking to grow spiritually, we welcome your gifts.",
      image: { src: "/images/ministerial-opportunities.webp", alt: "Pastor preaching during a Sunday service" },
      cta: { label: "Ministerial opportunities", href: "/contact?purpose=ministerial-opportunities" },
    },
    {
      key: "volunteer",
      number: 2,
      title: "Volunteer With Us",
      subtitle: "Be the hands and feet of Christ",
      body: "Join our volunteer teams in hospitality, tech, worship, children’s ministry, and more. Every helping hand makes a difference.",
      image: { src: "/images/volunteer-teams.webp", alt: "Volunteers serving during a Tamil service" },
      cta: { label: "Apply to volunteer", href: "/get-involved/volunteer" },
    },
    {
      key: "building-fund",
      number: 3,
      title: "Donate to the Building Fund",
      subtitle: "Help us build for the future",
      body: "Support our vision to expand facilities and create more space for worship, learning, and outreach. Every contribution brings us closer to our goal.",
      image: { src: "/images/building-fund.webp", alt: "The Ark Victory Church building" },
      cta: { label: "Give to the building fund", href: "/give#building-fund" },
    },
    {
      key: "discipleship-groups",
      number: 4,
      title: "Discipleship Groups",
      subtitle: "Grow together in faith",
      body: "Join a small group to study Scripture, pray, and build lasting relationships. Groups meet weekly in homes and online.",
      image: { src: "/images/discipleship-small-groups.webp", alt: "Church members worshipping together" },
      cta: { label: "Join a discipleship group", href: "/contact?purpose=discipleship-groups" },
    },
  ],
  about: {
    title: "About our church",
    body: "Learn about our mission, beliefs, leadership, and history. We’re a Christ-centered community committed to love, service, and spiritual growth.",
    image: { src: "/images/about-church.webp", alt: "Petras building, home of the early Ark services" },
  },
};

export const contactPage = {
  newToArk: {
    eyebrow: "New to Ark?",
    title: "You are not here by accident",
    body: "Welcome to Ark Victory Church! We invite you to experience a warm and vibrant community where faith and fellowship flourish. Join us for inspiring worship, meaningful connections, and a journey of spiritual growth.",
  },
  pillars: [
    {
      title: "Ark Ministries",
      body: "Grow your faith with our main teaching and outreach programmes.",
      href: "/ministries",
    },
    {
      title: "Ark Youth & Kids",
      body: "Connecting the next generation to Christ through fun and engaging activities — Victory Kids, Tweens and Ark Arise.",
      href: "/ministries#children-youth",
    },
    {
      title: "Ark Fellowships",
      body: "Find your community and build meaningful relationships — Hindi, Telugu and International fellowships and discipleship groups.",
      href: "/ministries#language-fellowships",
    },
  ],
  formIntro:
    "If you have a prayer request, an enquiry or would like to be part of the Ark Team of Volunteers, let us know by filling the form below — one of our leaders will get in touch with you.",
};

export const gallery: { src: string; alt: string }[] = [
  { src: "/images/church-family-1.webp", alt: "Pastors leading the congregation" },
  { src: "/images/sunday-worship-2.webp", alt: "Sunday worship at The Ark Victory Church" },
  { src: "/images/special-sunday-pr-naresh.webp", alt: "A special Sunday with Pr. Naresh" },
  { src: "/images/church-family-2.webp", alt: "Worship leaders on stage" },
  { src: "/images/church-family-3.webp", alt: "Church family moments" },
  { src: "/images/church-family-4.webp", alt: "Prayer and fellowship" },
  { src: "/images/sunday-worship-1.webp", alt: "Ps. Jay Kumar preaching" },
  { src: "/images/sunday-worship-3.webp", alt: "Worship team ministering" },
  { src: "/images/kids-church-worship-1.webp", alt: "Kids church worship" },
  { src: "/images/kids-church-worship-2.webp", alt: "Kids church leaders" },
  { src: "/images/church-family-5.webp", alt: "The Ark church family" },
  { src: "/images/collage-sunday.webp", alt: "Sunday service collage" },
  { src: "/images/marriage-celebration.webp", alt: "Celebrating marriage at The Ark" },
  { src: "/images/telugu-church-portrait.webp", alt: "Telugu Church anniversary" },
  { src: "/images/ark-arise.webp", alt: "Ark Arise youth" },
  { src: "/images/dawn-service.webp", alt: "Dawn service" },
  { src: "/images/special-sundays-1.webp", alt: "Special Sunday" },
  { src: "/images/evangelistic-events.webp", alt: "Evangelistic outreach event" },
];
