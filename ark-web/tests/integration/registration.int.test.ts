/**
 * Integration test against a real Postgres (DATABASE_URL from .env).
 * Verifies the capacity lock: concurrent registrations can never overbook,
 * and cancellations promote the waitlist FIFO.
 *   npm run test:integration
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
process.loadEnvFile?.(".env");
vi.spyOn(console, "info").mockImplementation(() => undefined);

const { db } = await import("@/server/db");
const { register, cancelRegistration, confirmedSeats } = await import("@/server/registrations");

const slug = `int-test-${Date.now()}`;
let eventId = "";

beforeAll(async () => {
  const e = await db.event.create({
    data: {
      slug,
      title: "Integration test event",
      summary: "test",
      description: "test",
      venue: "Test hall",
      startsAt: new Date(Date.now() + 7 * 86_400_000),
      status: "PUBLISHED",
      capacity: 10,
      waitlistEnabled: true,
      maxSeatsPerBooking: 5,
    },
  });
  eventId = e.id;
});

afterAll(async () => {
  await db.event.deleteMany({ where: { slug } });
  await db.$disconnect();
});

describe("register() under concurrency", () => {
  it("confirms exactly `capacity` seats when 30 people register at once", async () => {
    const results = await Promise.all(
      Array.from({ length: 30 }, (_, i) =>
        register(eventId, { name: `Person ${i}`, email: `p${i}@example.com`, phone: `98842651${String(i).padStart(2, "0")}`, seats: 1 }),
      ),
    );
    const confirmed = results.filter((r) => r.ok && r.status === "CONFIRMED").length;
    const waitlisted = results.filter((r) => r.ok && r.status === "WAITLISTED").length;
    expect(confirmed).toBe(10);
    expect(waitlisted).toBe(20);
    expect(await confirmedSeats(eventId)).toBe(10);
  }, 60_000);

  it("rejects a duplicate registration with the same email", async () => {
    const r = await register(eventId, { name: "Dup", email: "p0@example.com", phone: "9884265199", seats: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("DUPLICATE");
  });

  it("enforces max seats per booking", async () => {
    const r = await register(eventId, { name: "Big", email: "big@example.com", phone: "9884265198", seats: 6 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("TOO_MANY_SEATS");
  });

  it("promotes the earliest waitlisted registration when someone cancels", async () => {
    const firstConfirmed = await db.registration.findFirstOrThrow({ where: { eventId, status: "CONFIRMED" } });
    const firstWaitlisted = await db.registration.findFirstOrThrow({ where: { eventId, status: "WAITLISTED" }, orderBy: { createdAt: "asc" } });
    const res = await cancelRegistration(firstConfirmed.id);
    expect(res).toEqual({ cancelled: true, promoted: 1 });
    const promoted = await db.registration.findUniqueOrThrow({ where: { id: firstWaitlisted.id } });
    expect(promoted.status).toBe("CONFIRMED");
    expect(await confirmedSeats(eventId)).toBe(10);
  });
});
