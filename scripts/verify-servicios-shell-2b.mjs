#!/usr/bin/env node
/**
 * SVC-SHELL-2B — section order + coupon placement regression guard.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function indexAfter(haystack, first, second, label) {
  const a = haystack.indexOf(first);
  const b = haystack.indexOf(second);
  assert(a >= 0, `${label}: missing ${first}`);
  assert(b >= 0, `${label}: missing ${second}`);
  assert(a < b, `${label}: expected ${first} before ${second}`);
}

const proShell = read("app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx");
const stdShell = read("app/(site)/servicios/components/ServiciosProfileView.tsx");
const previewShell = read("app/(site)/clasificados/publicar/servicios/preview/ServiciosProfessionalPreviewShell.tsx");
const featuredMedia = read("app/(site)/servicios/lib/serviciosFeaturedMedia.ts");
const lightbox = read("app/(site)/servicios/components/ServiciosMediaLightbox.tsx");
const canvas = read("app/(site)/servicios/components/ServiciosPublicDetailsCanvas.tsx");
const proHero = read("app/(site)/servicios/components/ServiciosProfessionalHero.tsx");
const stdHero = read("app/(site)/servicios/components/ServiciosHero.tsx");
const pkg = read("package.json");

function renderBody(source, label) {
  const markers = ["(displayProfile, translateControl)", "<ServiciosAbout", "LX_PRO_INNER_PAD"];
  let anchor = -1;
  for (const m of markers) {
    const i = source.indexOf(m);
    if (i >= 0) {
      anchor = i;
      break;
    }
  }
  assert(anchor >= 0, `${label}: missing render body`);
  return source.slice(anchor);
}

function assertBuyerJourney(shell, label) {
  const body = renderBody(shell, label);
  indexAfter(body, "ServiciosAbout", "ServiciosBusinessHubContactCard", label);
  indexAfter(body, "ServiciosBusinessHubContactCard", "ServiciosVisualProofRow", label);
  indexAfter(body, "ServiciosVisualProofRow", "ServiciosCouponsCard", label);
  indexAfter(body, "ServiciosCouponsCard", "ServiciosGalleryWithTabs", label);
  indexAfter(body, "ServiciosGalleryWithTabs", "ServiciosOfferedSection", label);
  indexAfter(body, "ServiciosOfferedSection", "ServiciosPublicDetailsCanvas", label);
  indexAfter(body, "ServiciosPublicDetailsCanvas", "ServiciosGroupedHowSection", label);
  indexAfter(body, "ServiciosGroupedHowSection", "ServiciosPagosBeneficiosSection", label);
}

assertBuyerJourney(proShell, "professional shell");
assertBuyerJourney(stdShell, "standard shell");
assertBuyerJourney(previewShell, "professional preview shell");

assert(!previewShell.includes("collectProfessionalServiceChips"), "preview: no hero services strip");
assert(!previewShell.includes("ServiciosTrustSection"), "preview: trust moved into details canvas");
assert(!previewShell.includes("ServiciosHighlightsSection"), "preview: highlights moved into details canvas");
assert(!previewShell.includes("LX_PRO_GRID"), "preview: no sidebar grid hijacking order");

assert(!proShell.includes("servicios-pro-contact-desktop"), "professional: no duplicate desktop contact id");
assert(!proShell.includes("LX_PRO_ASIDE"), "professional: sidebar contact removed");

assert(!stdShell.includes("ServiciosLicense"), "standard: generic license badges not used");
assert(!stdShell.includes("ServiciosTrustSection"), "standard: standalone trust wall removed");

assert(!proHero.includes("collectHeroDisplayChips"), "professional hero: no services chip strip");
assert(!proHero.includes("displayChips"), "professional hero: no display chip row");
assert(!stdHero.includes("featuredChips"), "standard hero: no services chip strip");

assert(featuredMedia.includes("hasSelectedDestacadaImages"), "destacada-only visual proof guard");
assert(featuredMedia.includes("galleryMore.length > 0"), "destacada detection uses gallery split");

assert(lightbox.includes("Fotos") && lightbox.includes("Photos"), "drawer still Fotos/Photos");
assert(!lightbox.includes("Comida"), "drawer not restaurant-labeled");

assert(canvas.includes("ServiciosCredencialesCard"), "credentials still wired in canvas");

assert(pkg.includes('"verify:servicios-shell-2b"'), "package.json verifier registered");

console.log("OK: Hero → About → Contact → Visual proof → Coupons → Gallery → Services → Details");
console.log("OK: preview shell aligned with production journey");
console.log("OK: hero service strips removed; destacada-only visual proof");
console.log("verify-servicios-shell-2b: PASS");
