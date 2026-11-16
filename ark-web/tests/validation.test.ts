import { describe, expect, it } from "vitest";
import { enquirySchema, formToObject, registrationSchema, volunteerSchema } from "@/lib/validation";
import { safeHref, slugify } from "@/lib/utils";

describe("registrationSchema", () => {
  const ok = { name: "Asha", email: " Asha@Example.com ", phone: "+91 98842-65131", seats: "2", consent: "on" };
  it("normalises email and phone", () => {
    const r = registrationSchema.parse(ok);
    expect(r.email).toBe("asha@example.com");
    expect(r.phone).toBe("+919884265131");
    expect(r.seats).toBe(2);
  });
  it("requires consent", () => {
    expect(registrationSchema.safeParse({ ...ok, consent: undefined }).success).toBe(false);
  });
  it("rejects bad phone numbers", () => {
    expect(registrationSchema.safeParse({ ...ok, phone: "12345" }).success).toBe(false);
  });
});

describe("enquirySchema", () => {
  it("accepts a prayer request without phone", () => {
    const r = enquirySchema.safeParse({ name: "R", email: "r@x.in", phone: "", purpose: "prayer-request", message: "Please pray", consent: "on" });
    expect(r.success).toBe(true);
  });
  it("rejects unknown purposes", () => {
    expect(enquirySchema.safeParse({ name: "R", email: "r@x.in", purpose: "spam", message: "x", consent: "on" }).success).toBe(false);
  });
});

describe("volunteerSchema", () => {
  it("requires at least one known team", () => {
    const base = { name: "V", email: "v@x.in", phone: "9884265131", consent: "on", availability: [] };
    expect(volunteerSchema.safeParse({ ...base, teams: [] }).success).toBe(false);
    expect(volunteerSchema.safeParse({ ...base, teams: ["Hacking"] }).success).toBe(false);
    expect(volunteerSchema.safeParse({ ...base, teams: ["Media & tech"] }).success).toBe(true);
  });
});

describe("helpers", () => {
  it("formToObject collects arrays", () => {
    const fd = new FormData();
    fd.append("teams", "A");
    fd.append("teams", "B");
    fd.append("name", "X");
    expect(formToObject(fd, ["teams", "availability"])).toEqual({ teams: ["A", "B"], name: "X", availability: [] });
  });
  it("slugify", () => {
    expect(slugify("Tribe Night 2026 — Ark Arise!")).toBe("tribe-night-2026-ark-arise");
  });
  it("safeHref blocks javascript: and protocol-relative links", () => {
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("//evil.com")).toBeNull();
    expect(safeHref("/events/x")).toBe("/events/x");
    expect(safeHref("https://rakshak.org.in/")).toBe("https://rakshak.org.in/");
  });
});
