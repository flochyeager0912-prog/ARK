import { describe, expect, it } from "vitest";
import { describeSchedule, formatClock, fromIst, nextOccurrence, parseIstLocal, toIstLocalInput } from "@/lib/time";

const weekly = (dayOfWeek: number, startTime: string | null) => ({ dayOfWeek, recurrence: "WEEKLY" as const, nthWeek: null, startTime });

describe("IST conversion", () => {
  it("round-trips datetime-local input in IST", () => {
    const d = parseIstLocal("2026-12-25T10:00")!;
    expect(d.toISOString()).toBe("2026-12-25T04:30:00.000Z");
    expect(toIstLocalInput(d)).toBe("2026-12-25T10:00");
  });
  it("rejects malformed input", () => {
    expect(parseIstLocal("2026-13-01T10:00")).toBeNull();
    expect(parseIstLocal("hello")).toBeNull();
  });
  it("formats clock times", () => {
    expect(formatClock("06:00")).toBe("6:00 AM");
    expect(formatClock("12:15")).toBe("12:15 PM");
    expect(formatClock("17:00")).toBe("5:00 PM");
    expect(formatClock(null)).toBe("Time to be announced");
  });
});

describe("nextOccurrence", () => {
  it("finds the same Sunday when the service is later today (IST)", () => {
    // Sunday 22 Nov 2026, 07:00 IST
    const from = fromIst(2026, 10, 22, 7, 0);
    const next = nextOccurrence(weekly(0, "08:00"), from)!;
    expect(toIstLocalInput(next)).toBe("2026-11-22T08:00");
  });
  it("rolls to next week once the service has started", () => {
    const from = fromIst(2026, 10, 22, 8, 0);
    expect(toIstLocalInput(nextOccurrence(weekly(0, "08:00"), from)!)).toBe("2026-11-29T08:00");
  });
  it("handles a Saturday-night UTC instant that is already Sunday in IST", () => {
    // 2026-11-21T20:00Z == Sunday 22 Nov 01:30 IST
    const from = new Date("2026-11-21T20:00:00Z");
    expect(toIstLocalInput(nextOccurrence(weekly(0, "06:00"), from)!)).toBe("2026-11-22T06:00");
  });
  it("supports the 1st Sunday of the month (Dawn service)", () => {
    const s = { dayOfWeek: 0, recurrence: "MONTHLY_NTH" as const, nthWeek: 1, startTime: "05:00" };
    expect(toIstLocalInput(nextOccurrence(s, fromIst(2026, 10, 16))!)).toBe("2026-12-06T05:00");
  });
  it("supports the 2nd Sunday (International Fellowship)", () => {
    const s = { dayOfWeek: 0, recurrence: "MONTHLY_NTH" as const, nthWeek: 2, startTime: "16:00" };
    expect(toIstLocalInput(nextOccurrence(s, fromIst(2026, 10, 16))!)).toBe("2026-12-13T16:00");
  });
  it("supports the last Friday of the month (Night prayer)", () => {
    const s = { dayOfWeek: 5, recurrence: "MONTHLY_NTH" as const, nthWeek: -1, startTime: "21:00" };
    expect(toIstLocalInput(nextOccurrence(s, fromIst(2026, 10, 16))!)).toBe("2026-11-27T21:00");
  });
  it("returns null when time is to be announced", () => {
    expect(nextOccurrence(weekly(0, null))).toBeNull();
  });
  it("describes schedules", () => {
    expect(describeSchedule(weekly(0, "06:00"))).toBe("Every Sunday");
    expect(describeSchedule({ dayOfWeek: 5, recurrence: "MONTHLY_NTH", nthWeek: -1, startTime: null })).toBe("Last Friday of every month");
  });
});
