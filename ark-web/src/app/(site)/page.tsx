import { getActiveAnnouncements, getNextService, getServices, getUpcomingEvents } from "@/server/queries";
import { getSection, getSite } from "@/server/content";
import { About, Announcements, Contact, Events, GetInvolved, Hero, Journey, Ministries, Services } from "@/components/home/sections";

/**
 * The home page is the single-page story of the church. Each section maps to a header nav entry
 * (see `sectionNav` in content/site.ts) and links on to its full page.
 * All text comes from Admin → Content; times, events and announcements are live from the database.
 */
export default async function HomePage() {
  const [site, home, about, journey, ministriesSection, servicesContent, giving, getInvolved, contact] = await Promise.all([
    getSite(),
    getSection("home"),
    getSection("about"),
    getSection("journey"),
    getSection("ministries"),
    getSection("services"),
    getSection("giving"),
    getSection("getInvolved"),
    getSection("contact"),
  ]);
  const [services, next, events, announcements] = await Promise.all([getServices(), getNextService(), getUpcomingEvents(3), getActiveAnnouncements()]);
  const ministries = ministriesSection.items;

  return (
    <>
      <Hero site={site} home={home} pillarsTitle={about.loveGodLovePeople.title} next={next} />
      <Announcements items={announcements} />
      <About home={home} about={about} />
      <Journey journey={journey} />
      <Services site={site} services={services} intro={servicesContent.intro} />
      <Ministries ministries={ministries} />
      <Events events={events} ministries={ministries} />
      <GetInvolved site={site} getInvolved={getInvolved} giving={giving} hasRakshak={ministries.some((m) => m.slug === "rakshak")} />
      <Contact site={site} contact={contact} />
    </>
  );
}
