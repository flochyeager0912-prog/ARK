import { describe, expect, it } from "vitest";
import { buildIcs, googleCalendarUrl } from "@/lib/ics";

describe("buildIcs", () => {
  const ev = {
    uid: "abc@thearkvictorychurch.com",
    title: "Tribe Night; worship, games",
    description: "Line one\nLine two",
    location: "99/A, Velachery - Tambaram Main Rd, Sembakkam",
    start: new Date("2026-12-05T12:30:00Z"),
    end: new Date("2026-12-05T15:30:00Z"),
  };
  const ics = buildIcs(ev, new Date("2026-11-16T00:00:00Z"));

  it("produces a valid VCALENDAR with CRLF line endings", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).toContain("DTSTART:20261205T123000Z");
    expect(ics).toContain("DTEND:20261205T153000Z");
  });
  it("escapes text values", () => {
    expect(ics).toContain("SUMMARY:Tribe Night\; worship\\, games");
    expect(ics).toContain("DESCRIPTION:Line one\\nLine two");
  });
  it("folds lines longer than 75 octets", () => {
    for (const line of ics.split("\r\n")) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
  });
  it("defaults to a 2 hour duration", () => {
    expect(buildIcs({ ...ev, end: null })).toContain("DTEND:20261205T143000Z");
  });
  it("builds a Google Calendar link", () => {
    const url = new URL(googleCalendarUrl(ev));
    expect(url.searchParams.get("dates")).toBe("20261205T123000Z/20261205T153000Z");
  });
});
