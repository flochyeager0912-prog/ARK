/**
 * One-off migration helper: converts the images downloaded from the legacy
 * WordPress site (../_legacy-site/img) into web-optimised WebP files with
 * meaningful names in public/images.
 *
 *   npm run images:optimize -- [sourceDir]
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = process.argv[2] ?? path.resolve(process.cwd(), "../_legacy-site/img");
const OUT = path.resolve(process.cwd(), "public/images");

// legacy filename -> new name (without extension), max width
const MAP: Array<[string, string, number?]> = [
  ["Untitled-design-4.png", "logo-white", 560],
  ["v-bv.png", "giving-qr", 1200],
  ["home-1-1.jpg", "hero-gradient", 1920],
  ["Glimpse-of-Sunday-service-sundayworship-sundayservice-pr.jay-thearkvictory.jpg", "sunday-worship-1"],
  ["Glimpse-of-Sunday-service-sundayworship-sundayservice-pr.jay-thearkvictory-1-min.jpg", "sunday-worship-2"],
  ["Glimpse-of-Sunday-service-sundayworship-sundayservice-pr.jay-thearkvictory-3-min.jpg", "sunday-worship-3"],
  ["Glimpse-of-Sunday-service-sundayservice-kidschurch-worship-1.jpg", "kids-church-worship-1"],
  ["Glimpse-of-Sunday-service-sundayservice-kidschurch-worship-7.jpg", "kids-church-worship-2"],
  ["✨-It-was-a-special-Sunday-with-Pr.-Naresh-🙌-We-experienced-a-powerful-time-of-Gods-interventi-3-min.jpg", "special-sunday-pr-naresh"],
  ["539841223_18528881092057470_2574562280519276867_n-1.jpg", "church-family-1"],
  ["539841223_18528881092057470_2574562280519276867_n-1-e1757501160424.jpg", "church-family-1-wide"],
  ["540336371_18528881059057470_4096105079944636975_n-1.jpg", "church-family-2"],
  ["539894564_18528881095057470_1479976289664467042_n-1.jpg", "church-family-3"],
  ["516534933_18518552188057470_453089919532027762_n-1.jpg", "church-family-4"],
  ["517247563_18518552170057470_1442942671537278579_n-1.jpg", "church-family-5"],
  ["sd.png", "collage-sunday"],
  ["s.png", "collage-services"],
  ["hindi-church.jpeg", "hindi-church"],
  ["Ark-Telugu-Church-joyfully-celebrated-its-2nd-anniversary-🎉-The-day-began-with-fun-and-games-1.jpg", "telugu-church-anniversary"],
  ["Ark-Telugu-Church-joyfully-celebrated-its-2nd-anniversary-🎉-The-day-began-with-fun-and-games-1-1.jpg", "telugu-church-portrait"],
  ["KIDS3-2.jpg", "victory-kids"],
  ["sdv.png", "victory-kids-collage"],
  ["TWEENS-1.jpg", "tweens-1"],
  ["TWEENS-4.jpg", "tweens-2"],
  ["AdobeExpress-file.jpg", "ark-arise"],
  ["YOUTH-1.jpg", "ark-arise-2"],
  ["YOUTH-scaled-e1760433573256.jpg", "international-fellowship"],
  ["WhatsApp-Image-2025-09-08-at-10.16.06-AM.jpeg", "rakshak"],
  ["IMG_6032-min-2.jpg", "pastors-jay-anjali"],
  ["Marriage-instituted-by-God-it-makes-men-whole.-Today-as-The-Ark-Victory-Church-we-celebrate-m.jpg", "marriage-celebration"],
  ["vfv.png", "mission-1"],
  ["vffg.png", "mission-petras-rakshak"],
  ["asfs.png", "mission-purpose"],
  ["The-cross-was-once-a-symbol-of-curse-but-Christ-turned-it-into-a-symbol-of-victoryOn-this-Goo.jpg", "ministry-teams-1"],
  ["The-cross-was-once-a-symbol-of-curse-but-Christ-turned-it-into-a-symbol-of-victoryOn-this-Goo-2.jpg", "ministry-teams-2"],
  ["asf.png", "journey-1999"],
  ["OLD-HUT.jpg", "journey-rooftop"],
  ["aaa.png", "journey-rakshak"],
  ["MOORTHY-COMPLEX-copy.jpg", "journey-camp-road"],
  ["PB040568.jpg", "journey-festival-2007"],
  ["AdobeExpress-file-1.jpg", "journey-sparkz-2009"],
  ["wevdf.png", "journey-building-2015"],
  ["ENGLISH2.jpg", "dawn-service"],
  ["ENGLISH.jpg", "prayer-service"],
  ["21DAYS.jpeg", "21-days-prayer"],
  ["sss.png", "special-sundays-1"],
  ["SPL-SUNDAY.jpg", "special-sundays-2"],
  ["DSC08407-1.jpg", "discipleship-groups"],
  ["EVANGLICAL-EVENT.jpeg", "evangelistic-events"],
  ["JUR09137-1.jpg", "ministerial-opportunities"],
  ["TAMIL2-2-1.jpg", "volunteer-teams"],
  ["nhnmh.png", "about-church"],
  ["cc.png", "building-fund"],
  ["DSCF8896-1.jpg", "discipleship-small-groups"],
  ["1.png", "icon-ministries"],
  ["2.png", "icon-youth-kids"],
  ["3.png", "icon-fellowships"],
  ["OLDHUTPlace-1.svg", "journey-place-icon"],
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  let ok = 0;
  for (const [src, name, maxWidth = 1600] of MAP) {
    const from = path.join(SRC, src);
    if (!fs.existsSync(from)) {
      console.warn(`skip (missing): ${src}`);
      continue;
    }
    if (src.endsWith(".svg")) {
      fs.copyFileSync(from, path.join(OUT, `${name}.svg`));
      ok++;
      continue;
    }
    const out = path.join(OUT, `${name}.webp`);
    await sharp(from)
      .rotate()
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality: name === "giving-qr" ? 95 : 80, lossless: name === "logo-white" })
      .toFile(out);
    ok++;
  }
  console.log(`optimised ${ok}/${MAP.length} images -> ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
