import { describe, expect, it } from "vitest";
import { OPTIONAL_FIELDS, SECTION_DEFAULTS, SECTION_KEYS, REQUIRED_KEYS } from "@/content/sections";
import { blankFor, isSafeImage, isSafeLink, mergeOver, normalize, schemaFor, shapeOf, withOptional } from "@/lib/content-schema";

const shapeFor = (key: keyof typeof SECTION_DEFAULTS) => withOptional(shapeOf(SECTION_DEFAULTS[key]), OPTIONAL_FIELDS[key] ?? []);
const validate = (key: keyof typeof SECTION_DEFAULTS, value: unknown) => {
  const shape = shapeFor(key);
  return schemaFor(shape, "", REQUIRED_KEYS).safeParse(normalize(value, shape));
};

describe("content sections", () => {
  it.each(SECTION_KEYS)("default for “%s” passes its own validation (round-trips unchanged)", (key) => {
    const res = validate(key, SECTION_DEFAULTS[key]);
    if (!res.success) throw new Error(JSON.stringify(res.error.issues.slice(0, 3)));
    expect(res.data).toEqual(normalize(SECTION_DEFAULTS[key], shapeFor(key)));
  });

  it("marks keys missing from some list items as optional (union of item shapes)", () => {
    const shape = shapeOf(SECTION_DEFAULTS.ministries);
    if (shape.kind !== "object") throw new Error("shape");
    const items = shape.fields.items!.shape;
    if (items.kind !== "objectArray") throw new Error("items");
    expect(items.item.fields.schedule!.optional).toBe(true); // Missions has no schedule
    expect(items.item.fields.name!.optional).toBe(false);
  });

  it("drops empty optional fields (e.g. a milestone without an image) and empty list entries", () => {
    const shape = shapeFor("journey");
    const out = normalize(
      { intro: SECTION_DEFAULTS.journey.intro, milestones: [{ year: "2027", title: "New", body: ["One", "  ", ""], image: { src: "", alt: "" } }] },
      shape,
    ) as { milestones: Record<string, unknown>[] };
    expect(out.milestones[0]).toEqual({ year: "2027", title: "New", body: ["One"] });
  });

  it("rejects empty required fields", () => {
    const value = structuredClone(SECTION_DEFAULTS.ministries);
    value.items[0]!.name = " ";
    expect(validate("ministries", value).success).toBe(false);
  });

  it("rejects unsafe links and foreign images", () => {
    const g = structuredClone(SECTION_DEFAULTS.getInvolved);
    g.cards[0]!.cta.href = "javascript:alert(1)";
    expect(validate("getInvolved", g).success).toBe(false);
    const gal = { photos: [{ src: "https://evil.example/x.png", alt: "x" }] };
    expect(validate("gallery", gal).success).toBe(false);
  });

  it("strips unknown keys", () => {
    const res = validate("gallery", { photos: [{ src: "/images/rakshak.webp", alt: "Kids", onclick: "x" }], extra: 1 });
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ photos: [{ src: "/images/rakshak.webp", alt: "Kids" }] });
  });

  it("blankFor creates an empty item of the right shape", () => {
    const shape = shapeOf(SECTION_DEFAULTS.gallery);
    if (shape.kind !== "object" || shape.fields.photos!.shape.kind !== "objectArray") throw new Error("shape");
    expect(blankFor(shape.fields.photos!.shape.item)).toEqual({ src: "", alt: "" });
  });
});

describe("helpers", () => {
  it("mergeOver keeps new default keys while applying saved values", () => {
    expect(mergeOver({ a: 1, b: { c: 2, d: 3 }, list: [1, 2] }, { b: { c: 9 }, list: [7] })).toEqual({ a: 1, b: { c: 9, d: 3 }, list: [7] });
  });
  it("isSafeLink / isSafeImage", () => {
    expect(isSafeLink("/contact?purpose=x")).toBe(true);
    expect(isSafeLink("https://rakshak.org.in/")).toBe(true);
    expect(isSafeLink("tel:+919884265131")).toBe(true);
    expect(isSafeLink("javascript:alert(1)")).toBe(false);
    expect(isSafeLink("//evil.com")).toBe(false);
    expect(isSafeImage("/media/0b1c2d3e-0000-4000-8000-000000000000.webp")).toBe(true);
    expect(isSafeImage("/images/../../etc/passwd")).toBe(false);
    expect(isSafeImage("https://x.com/a.png")).toBe(false);
  });
});
