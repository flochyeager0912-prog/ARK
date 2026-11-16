import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/db", () => ({ db: {} }));

const { decideStatus, registrationOpen } = await import("@/server/registrations");

describe("decideStatus", () => {
  it("confirms when capacity is unlimited", () => {
    expect(decideStatus({ capacity: null, confirmedSeats: 999, seats: 5, waitlistEnabled: false })).toBe("CONFIRMED");
  });
  it("confirms when seats fit exactly", () => {
    expect(decideStatus({ capacity: 10, confirmedSeats: 8, seats: 2, waitlistEnabled: true })).toBe("CONFIRMED");
  });
  it("waitlists when the party doesn't fit and waitlist is on", () => {
    expect(decideStatus({ capacity: 10, confirmedSeats: 9, seats: 2, waitlistEnabled: true })).toBe("WAITLISTED");
  });
  it("rejects when full and no waitlist", () => {
    expect(decideStatus({ capacity: 10, confirmedSeats: 10, seats: 1, waitlistEnabled: false })).toBe("FULL");
  });
});

describe("registrationOpen", () => {
  const base = {
    status: "PUBLISHED" as const,
    registrationEnabled: true,
    registrationClosesAt: null as Date | null,
    startsAt: new Date(Date.now() + 86_400_000),
  };
  it("is open for a future published event", () => expect(registrationOpen(base)).toBe(true));
  it("is closed for drafts and cancelled events", () => {
    expect(registrationOpen({ ...base, status: "DRAFT" })).toBe(false);
    expect(registrationOpen({ ...base, status: "CANCELLED" })).toBe(false);
  });
  it("is closed after the deadline", () => {
    expect(registrationOpen({ ...base, registrationClosesAt: new Date(Date.now() - 1000) })).toBe(false);
  });
  it("is closed once the event has started", () => {
    expect(registrationOpen({ ...base, startsAt: new Date(Date.now() - 1000) })).toBe(false);
  });
  it("is closed when registration is disabled", () => {
    expect(registrationOpen({ ...base, registrationEnabled: false })).toBe(false);
  });
});
