/**
 * Ministries. Source: legacy /differentministries/, /services-2/ and Home page.
 * `serviceSlugs` link a ministry to its rows in the `service` table (admin-editable times).
 */

export type Ministry = {
  slug: string;
  name: string;
  group: "Children & youth" | "Language fellowships" | "Growth & outreach";
  tagline: string;
  /** One-line schedule as stated on the legacy site (live times come from `serviceSlugs`). */
  schedule?: string;
  ageRange?: string;
  summary: string;
  body: string[];
  highlights?: string[];
  image: { src: string; alt: string };
  gallery?: { src: string; alt: string }[];
  serviceSlugs?: string[];
  cta: { label: string; href: string; external?: boolean };
};

export const ministries: Ministry[] = [
  {
    slug: "victory-kids",
    name: "Victory Kids Church",
    group: "Children & youth",
    tagline: "Children are an asset, not a liability",
    ageRange: "Ages 3 – 12",
    schedule: "Every Sunday at 8 AM (Tamil) and 10 AM (English)",
    summary:
      "Our dedicated team of teachers impart the Word of God to children aged 3 to 12 through creative, child-friendly methods.",
    body: [
      "At Ark we believe children are an asset and not a liability. Our dedicated team of teachers through creative methods that are child friendly impart the Word of God to the kids to lay strong biblical foundations.",
      "Victory Kids cater to children from the age group of 3 years old to 12 years of age. The Victory Kids church happens every Sunday at 8 a.m (Tamil) and 10 a.m (English).",
    ],
    image: { src: "/images/victory-kids.webp", alt: "Victory Kids performing on stage in orange costumes" },
    gallery: [
      { src: "/images/victory-kids-collage.webp", alt: "Children doing a craft activity at Victory Kids" },
      { src: "/images/kids-church-worship-2.webp", alt: "Kids church worship leaders on stage" },
    ],
    serviceSlugs: ["victory-kids-tamil", "victory-kids-english"],
    cta: { label: "Join Victory Kids", href: "/contact?purpose=join-ministry&ministry=victory-kids" },
  },
  {
    slug: "tweens",
    name: "Tweens Church",
    group: "Children & youth",
    tagline: "Between Victory Kids and Ark Arise",
    schedule: "Every Sunday, 10:15 AM – 11:30 AM",
    summary:
      "An energetic and enthusiastic bunch of young teenagers who meet every Sunday to read, study and understand the Word of God.",
    body: [
      "The children who feel they do not fit in Victory Kids church yet feel they are too young for Ark Arise (Youth Service) are part of the Tweens Church.",
      "They are an energetic and enthusiastic bunch of teenagers that can be themselves and study the word of God. They meet every Sunday from 10:15 a.m to 11:30 a.m to read, study and understand the Word of God.",
    ],
    image: { src: "/images/tweens-1.webp", alt: "Tweens church sitting together in a circle" },
    gallery: [{ src: "/images/tweens-2.webp", alt: "Tweens church gathering" }],
    serviceSlugs: ["tweens"],
    cta: { label: "Join Tweens", href: "/contact?purpose=join-ministry&ministry=tweens" },
  },
  {
    slug: "ark-arise",
    name: "Ark Arise",
    group: "Children & youth",
    tagline: "Youth service",
    schedule: "Every Sunday at 12:15 PM",
    summary:
      "The youth service of The Ark, with yearly events like Sparkz, Life Fests, Tribe Night and Camps to draw young people to God.",
    body: [
      "The target group of the church is the youngsters. Ark Arise is a service that caters to these youngsters every Sunday from 12:15 p.m.",
      "There are various events like Sparkz, Life Fests, Tribe Night and Camps that happen yearly to draw the youngsters to God.",
    ],
    highlights: ["Sparkz", "Life Fests", "Tribe Night", "Camps"],
    image: { src: "/images/ark-arise.webp", alt: "Young people worshipping with raised hands at Ark Arise" },
    gallery: [{ src: "/images/ark-arise-2.webp", alt: "Ark Arise youth gathering" }],
    serviceSlugs: ["ark-arise"],
    cta: { label: "Join Ark Arise", href: "/contact?purpose=join-ministry&ministry=ark-arise" },
  },
  {
    slug: "hindi-church",
    name: "Hindi Church",
    group: "Language fellowships",
    tagline: "Worship in your own language",
    schedule: "Every Sunday at 5 PM",
    summary:
      "A growing church where brothers and sisters from North India worship the Lord together in Hindi.",
    body: [
      "We also have a Hindi service in the evening at 5 pm. The Hindi church is expanding, allowing brothers and sisters from north India to worship the Lord in unison in their own language.",
      "The Hindi Church is growing, creating a space for brothers and sisters from North India to worship the Lord together in the beauty of their own language.",
    ],
    image: { src: "/images/hindi-church.webp", alt: "Hindi Church congregation" },
    serviceSlugs: ["hindi-church"],
    cta: { label: "Join Hindi Church", href: "/contact?purpose=join-ministry&ministry=hindi-church" },
  },
  {
    slug: "telugu-fellowship",
    name: "Telugu Church & Fellowship",
    group: "Language fellowships",
    tagline: "Worship, Word and fellowship in your heart language",
    schedule: "Every Sunday at 5 PM",
    summary:
      "Bringing together all our Telugu-speaking brothers and sisters every Sunday. Started in 2023.",
    body: [
      "The Telugu church connects together all our Telugu speaking brothers and sisters every Sunday at 5 p.m.",
      "Our church has a Telugu Fellowship, bringing together all our Telugu-speaking brothers and sisters every Sunday for worship, Word, and fellowship in their heart language.",
    ],
    image: { src: "/images/telugu-church-anniversary.webp", alt: "Ark Telugu Church celebrating its 2nd anniversary" },
    gallery: [{ src: "/images/telugu-church-portrait.webp", alt: "Ark Telugu Church anniversary celebration" }],
    serviceSlugs: ["telugu-fellowship"],
    cta: { label: "Join Telugu Fellowship", href: "/contact?purpose=join-ministry&ministry=telugu-fellowship" },
  },
  {
    slug: "international-fellowship",
    name: "International Fellowship",
    group: "Language fellowships",
    tagline: "Many nations, one family",
    schedule: "Every 2nd Sunday",
    summary:
      "Also known as the African Fellowship — believers from many nations worshipping together in one spirit, as one family.",
    body: [
      "The International Fellowship (African Fellowship) brings together brothers and sisters from across many nations, uniting hearts to worship the Lord together in one spirit and as one family.",
      "The fellowship happens every 2nd Sunday.",
    ],
    image: { src: "/images/international-fellowship.webp", alt: "International Fellowship worship gathering" },
    serviceSlugs: ["international-fellowship"],
    cta: { label: "Join International Fellowship", href: "/contact?purpose=join-ministry&ministry=international-fellowship" },
  },
  {
    slug: "discipleship-groups",
    name: "Discipleship Groups",
    group: "Growth & outreach",
    tagline: "Doing life together",
    schedule: "Small groups meet weekly across the city — in homes and online",
    summary:
      "Smaller groups throughout the city where we pray, study the Word and do life together during the week.",
    body: [
      "Beyond the traditional Sunday services, our church works to create a sense of family through disciple group gatherings. These gatherings provide a space for intimate fellowship, where we collectively study the enriching teachings of God’s word.",
      "Our discipleship groups are a place where we pray together and study the word together and do life together and stand for each other. It is a nurturing place to grow in the Lord and to experience church being a family.",
      "Discipleship is the process of following and becoming more like Jesus and is the point of the Christian walk — to follow Jesus with immediate and complete obedience, make God first priority in life and follow Jesus with wholehearted commitment and singular focus.",
      "Discipleship cannot happen just on Sundays. That is why we meet in smaller groups throughout the city during the week for fellowship and to dive deeper into the questions about Sunday sermons.",
    ],
    image: { src: "/images/discipleship-groups.webp", alt: "Discipleship group praying together" },
    gallery: [{ src: "/images/sunday-worship-3.webp", alt: "Sunday worship at The Ark" }],
    cta: { label: "Join a Discipleship Group", href: "/contact?purpose=discipleship-groups" },
  },
  {
    slug: "missions",
    name: "Missions",
    group: "Growth & outreach",
    tagline: "One church in every district of India",
    summary:
      "We currently support seven missionaries and stand with the vision of having one church in every district of India.",
    body: [
      "Our church is Mission focused. At present we are supporting seven missionaries. We stand with the vision of having one church in every district of India.",
      "We conduct and coordinate blessing festivals, firmly believing in not only preaching the gospel but also demonstrating it in the community.",
      "ARK Victory Church is committed to helping Pastors who are in mission fields. Our desire is to help train, equip, pray, serve, and give financially to what God is already doing in our country.",
    ],
    image: { src: "/images/telugu-church-portrait.webp", alt: "Church members celebrating together" },
    cta: { label: "Know more", href: "/about/mission" },
  },
  {
    slug: "rakshak",
    name: "Rakshak",
    group: "Growth & outreach",
    tagline: "One little heartbeat at a time",
    summary:
      "Our NGO, founded in 2004, creating an environment for underprivileged children in informal settlements.",
    body: [
      "Rakshak is our NGO, founded in 2004, aiming to create an environment for underprivileged children in informal settlements.",
      "Over the years, Rakshak has been able to serve 1000 plus children. Our children, by God’s grace, have been placed in good positions and good jobs and some of them are in colleges. Our dream is to see the cycle of poverty broken in their life.",
      "It began under a tree with 20 children learning spoken English — with a cup of Boost and biscuits. Today, Rakshak has impacted over 3,000 children, producing teachers, professionals, and leaders.",
    ],
    image: { src: "/images/rakshak.webp", alt: "Rakshak children praying" },
    cta: { label: "Donate to Rakshak", href: "https://rakshak.org.in/", external: true },
  },
  {
    slug: "evangelistic-events",
    name: "Evangelistic Events",
    group: "Growth & outreach",
    tagline: "History at Christmas · Heroes at Easter",
    summary:
      "Each year we run outreach programmes such as ‘History’ during Christmas and ‘Heroes’ during Easter.",
    body: [
      "The spirit of evangelism is a dynamic force within Ark Victory Church. Each year, we embark on outreach programs such as ‘History’ during Christmas and ‘Heroes’ during Easter.",
    ],
    highlights: ["History — Christmas", "Heroes — Easter"],
    image: { src: "/images/evangelistic-events.webp", alt: "Large crowd at an outdoor evangelistic event at night" },
    cta: { label: "See upcoming events", href: "/events" },
  },
];

export function getMinistry(slug: string) {
  return ministries.find((m) => m.slug === slug);
}

export const ministryGroups = ["Children & youth", "Language fellowships", "Growth & outreach"] as const;
