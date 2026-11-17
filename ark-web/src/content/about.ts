/**
 * About us, Our Mission and Our Journey content.
 * Source: legacy pages /about-us/, /our-mission/, /our-journey/ and the Home page.
 */

export const welcome = {
  title: "Welcome to The Ark Church Family",
  body: [
    "The Ark VCI is a passionate, word-based church in South Chennai, aiming to build God’s Kingdom through ministering to individuals and families. Our core value is to love God & love people unconditionally which gives the Ark a unique flavour. People of all age groups, languages, ethnicities, and cultures are welcome to our church.",
    "At Ark, every individual is encouraged and edified to grow in their calling and be a committed Disciple of Jesus Christ. The Ark VCI’s purpose is to glorify God by establishing a powerful local church, teaching “Transformation of life” through prayer, worship, and fellowship, resulting in Godly characters, disciples, and good works.",
  ],
};

export const anniversary = {
  eyebrow: "The Ark Victory Church",
  title: "Thanking God for 21 years of goodness & faithfulness",
  body: "For 21 years, The Ark Victory Church has been a beacon of faith, hope, and love. Together we have grown, prayed, and witnessed God’s mighty hand at work. This anniversary is not just a milestone, but a testimony of His grace and our unity as a family of believers.",
};

export const whereChurchIsFamily = {
  title: "Where church is family",
  body: "At The Ark Victory Church, we believe church is more than a place—it’s a family where you belong, grow, and thrive. Together we worship, learn, and live out God’s love to impact our city and beyond.",
};

export const loveGodLovePeople = {
  title: "Love God, Love people",
  body: "The Ark Victory Church is a passionate, Word-based church in South Chennai with a heart to reach people and transform lives. We believe church is more than a place — it’s a family where people of all ages, backgrounds, and cultures can experience God’s love and grow together in faith.",
  intro: "Our mission is to glorify God by",
  pillars: [
    { title: "Love", body: "Loving God & Loving People unconditionally." },
    { title: "Worship", body: "Honoring God through heartfelt praise, prayer, and thanksgiving." },
    { title: "Discipleship", body: "Equipping people with God’s Word to grow in faith and live with purpose." },
    { title: "Service", body: "Reaching out to communities with compassion, care, and practical support." },
  ],
};

export const pastors = {
  eyebrow: "Pastors",
  title: "Our Church Pastors",
  names: "Ps. Jay Kumar & Ps. Anjali",
  image: "/images/pastors-jay-anjali.webp",
  quote: "A good pastor is like a shepherd who leads his flock with love and compassion.",
  tagline: "Preaching Hope, Inspiring Generations",
  subTagline: "Guided by faith, we inspire hearts and transform lives.",
};

export const arkTeam = {
  title: "Our Ark Team welcomes you",
  eyebrow: "Where church is a family",
  verse: {
    text: "Since you were precious in My sight, You have been honored, And I have loved you; Therefore I will give men for you, And people for your life.",
    reference: "Isaiah 43:4",
  },
  body: "The Ark Victory Church team consists of dedicated leaders who are committed to serving Christ and the Church. The church office is led by a group of passionate individuals who focus on various ministries, including worship, ministry services, outreach, and youth programs. They work to foster spiritual growth and provide support to church members.",
};

// ---------------------------------------------------------------------------
// Our Mission page
// ---------------------------------------------------------------------------

export const missionStatement = {
  title: "Our Mission Statement",
  statement:
    "Transformation of Life by creating a hunger for prayer, word of God, worship and thereby producing Godly characters, Disciples and Good works.",
  vision:
    "To reach and influence the world by building a Christ-centered, Bible-based church, changing mindsets and empowering people to lead and impact in every sphere of life.",
  image: "/images/marriage-celebration.webp",
};

export const missions = {
  title: "Missions",
  body: "We believe that God has called each of us as Christians to be missionaries here in the city of Chennai, reaching our colleagues, friends, family, and neighbors with the good news of Jesus. God also calls us to the “ends of the earth,” or to National and global missions.",
  missionalTitle: "A missional church",
  missionalSubtitle: "God also calls us to the “ends of the earth,” or to National and global missions.",
  missionalBody:
    "ARK Victory Church is committed to helping Pastors who are in mission fields. Our desire is to help train, equip, pray, serve, and give financially to what God is already doing in our country.",
  supportNote:
    "Our church is Mission focused. At present we are supporting seven missionaries. We stand with the vision of having one church in every district of India. We conduct and coordinate blessing festivals, firmly believing in not only preaching the gospel but also demonstrating it in the community.",
  quote: {
    text: "A missional church is a community of God's people that defines itself, and organizes its life around, its real purpose of being an agent of God's mission to the world.",
    author: "Alan Hirsch",
  },
};

export const localMissions = {
  title: "Petras and Rakshak",
  body: "ARK Victory Church is integrated to Petras and Rakshak – two local missions of the Church.",
  petras: {
    title: "Petras",
    body: "Petras, founded in 2009, is a Christ-centered business unit of ARK Victory Church. It was formed with the purpose of building lives and raising resources for planting churches across the country.",
  },
};

export const ministryTeams = {
  eyebrow: "Our ministry",
  title: "Ministry Teams",
  body: "Another great way to get connected is to Volunteer at ARK Victory Church by joining one of our Ministry Teams – serving Jesus in and through practical ways at Church. We have incredible teams of people who serve on ministry teams, with the heart to make Jesus known and to serve each other through the offering of their gifts, time and talents. Ministry Teams are a great way to get involved, meet others within our church body and serve together at ARK Victory Church.",
  images: ["/images/ministry-teams-1.webp", "/images/ministry-teams-2.webp"],
};

// ---------------------------------------------------------------------------
// Our Journey page
// ---------------------------------------------------------------------------

export const journeyIntro = {
  title: "Church is more than walls — it is a family and a home.",
  verse: { text: "For where two or three gather in my name, there am I with them.", reference: "Matthew 18:20" },
  body: [
    "At the Ark Victory Church, our journey is built on faith, love, and service. For over 21 years, we have been a family united in Christ, committed to spreading hope and compassion within our community and beyond.",
    "From small gatherings in the early days to a vibrant congregation today, God’s grace has guided every step of our growth. Our mission is simple yet profound — to share the Gospel, uplift the broken-hearted, and stand as a place of healing, worship, and fellowship for all.",
  ],
  image: "/images/church-family-5.webp",
};

export type Milestone = {
  year: string;
  title: string;
  body: string[];
  image?: { src: string; alt: string };
};

export const journey: Milestone[] = [
  {
    year: "1999",
    title: "Ministry began",
    body: [
      "The Ark Ministry began with a small group of believers gathering in faith and prayer, sowing the seeds for what would later grow into a thriving church community.",
    ],
    image: { src: "/images/journey-1999-clean.webp", alt: "Illustration of an ancient stone wall, recalling the book of Nehemiah" },
  },
  {
    year: "2000–2003",
    title: "Rooftop fellowship",
    body: [
      "Fellowship meetings were held on a rooftop, where people came together to worship, pray, and grow in God’s Word — laying the foundation for the church’s vision and mission.",
    ],
    image: { src: "/images/journey-rooftop.webp", alt: "Early rooftop fellowship meeting under a thatched shelter" },
  },
  {
    year: "2004",
    title: "New mandate, new beginning",
    body: [
      "January 2004: Church restarted with 5 people at Caspa Hall, under a fresh mandate from the Lord inspired by the book of Nehemiah.",
      "Vision of Rakshak — God gave the vision of Rakshak. It began under a tree with 20 children learning spoken English — with a cup of Boost and biscuits. Today, Rakshak has impacted over 3,000 children, producing teachers, professionals, and leaders.",
    ],
    image: { src: "/images/journey-rakshak-clean.webp", alt: "Rakshak children learning together in the early days" },
  },
  {
    year: "2006",
    title: "Camp Road Junction Hall",
    body: ["The ministry moved to Camp Road Junction Hall, marking a new phase of growth and community outreach."],
    image: { src: "/images/journey-camp-road.webp", alt: "Victory Churches of India hall at Camp Road Junction" },
  },
  {
    year: "2007",
    title: "Peace & Healing Festival",
    body: ["A powerful festival of faith and healing that reached many hearts, igniting revival and restoration."],
    image: { src: "/images/journey-festival-2007.webp", alt: "Prayer for people at the 2007 Peace and Healing Festival" },
  },
  {
    year: "2009",
    title: "Sparkz & leadership growth",
    body: ["A new focus on youth and leadership emerged, equipping the next generation to rise with purpose and vision."],
    image: { src: "/images/journey-sparkz-2009.webp", alt: "Young people worshipping at a Sparkz youth gathering" },
  },
  {
    year: "October 2015",
    title: "The Ark Victory Church building dedicated",
    body: ["The new Ark Victory Church building at Sembakkam was dedicated."],
    image: { src: "/images/building-fund.webp", alt: "The Ark Victory Church building at Sembakkam" },
  },
  {
    year: "2020",
    title: "Tweens ministry began",
    body: ["The Tweens ministry began, giving pre-teens and young teenagers their own place to study and understand the Word of God."],
    image: { src: "/images/tweens-2.webp", alt: "Tweens church gathered in a circle" },
  },
  {
    year: "2023",
    title: "Telugu Church fellowship",
    body: [
      "The Telugu Church began, extending the vision to reach and serve diverse communities through worship and fellowship in their heart language.",
    ],
    image: { src: "/images/telugu-church-anniversary.webp", alt: "Ark Telugu Church celebrating its anniversary" },
  },
];
