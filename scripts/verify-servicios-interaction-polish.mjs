#!/usr/bin/env node
/**
 * Servicios final interaction polish — Save removed, direct CTAs, external video thumbnails, work-method grid.
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

const hubRow = read("app/(site)/servicios/components/ServiciosBusinessHubEngagementRow.tsx");
const contactCard = read("app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx");
const videoTile = read("app/(site)/servicios/components/ServiciosGalleryVideoTile.tsx");
const lightbox = read("app/(site)/servicios/components/ServiciosMediaLightbox.tsx");
const directCta = read("app/(site)/servicios/lib/serviciosDirectCta.ts");
const horizontalCard = read("app/(site)/clasificados/servicios/components/ServiciosHorizontalResultCard.tsx");
const proCard = read("app/(site)/clasificados/servicios/ServiciosProfessionalResultCard.tsx");
const listingCard = read("app/(site)/clasificados/servicios/ServiciosListingResultCard.tsx");
const howSection = read("app/(site)/servicios/components/ServiciosGroupedHowSection.tsx");
const shellTokens = read("app/(site)/servicios/lib/serviciosShellSectionTokens.ts");
const resultStrip = read("app/(site)/servicios/components/ServiciosResultCardEngagementStrip.tsx");
const pkg = read("package.json");

assert(!hubRow.includes("LeonixSaveButton"), "hub row: Guardar removed");
assert(!hubRow.includes("recordSaveEvent"), "hub row: save analytics removed");
assert(hubRow.includes('hubEngagementVariant === "save_only"') && hubRow.includes("return null"), "hub row: save_only hides section");
assert(hubRow.includes("LeonixShareButton"), "hub row: Share preserved");
assert(hubRow.includes("ServiciosLikeEngagementCluster"), "hub row: Like preserved");

assert(!contactCard.includes("CtaActionSheet"), "contact card: modal sheet removed");
assert(contactCard.includes("serviciosOpenTelHref"), "contact card: direct tel");
assert(contactCard.includes("serviciosOpenMailtoHref"), "contact card: direct mailto");
assert(contactCard.includes("serviciosOpenGoogleMapsDirections"), "contact card: direct directions");
assert(contactCard.includes("cta_call_click"), "contact card: call analytics preserved");
assert(contactCard.includes("cta_maps_click"), "contact card: directions analytics preserved");

assert(videoTile.includes('variant?: "thumbnail" | "embed"'), "video tile: thumbnail/embed modes");
assert(videoTile.includes('rel="noopener noreferrer"'), "video tile: safe external link");
assert(videoTile.includes("data-servicios-gallery-video-thumbnail"), "video tile: thumbnail marker");
assert(!videoTile.includes("<iframe") || videoTile.includes("ServiciosGalleryVideoEmbed"), "video tile: iframe only in embed mode");
assert(lightbox.includes('variant="embed"'), "lightbox: embed mode for modal playback");

assert(directCta.includes("buildServiciosGoogleMapsDirectionsUrl"), "direct CTA: maps dir helper");
assert(directCta.includes("/maps/dir/?api=1&destination="), "direct CTA: directions URL pattern");
assert(directCta.includes("serviciosOpenTelHref"), "direct CTA: tel helper");

assert(!horizontalCard.includes("CtaActionSheet"), "trade results: modal removed");
assert(horizontalCard.includes("serviciosOpenTelHref"), "trade results: direct tel");
assert(horizontalCard.includes("serviciosOpenWhatsAppHref"), "trade results: direct WhatsApp");
assert(horizontalCard.includes("serviciosOpenGoogleMapsDirections"), "trade results: direct directions");
assert(horizontalCard.includes("trackServiciosListingCta"), "trade results: analytics preserved");

assert(!proCard.includes("CtaActionSheet"), "pro results: modal removed");
assert(proCard.includes("serviciosOpenTelHref"), "pro results: direct tel");
assert(proCard.includes("serviciosOpenWhatsAppHref"), "pro results: direct WhatsApp");
assert(proCard.includes("serviciosOpenGoogleMapsDirections"), "pro results: direct directions");

assert(!listingCard.includes("LeonixSaveButton"), "listing card: Guardar removed");
assert(!listingCard.includes("CtaActionSheet"), "listing card: modal removed");

assert(resultStrip.includes("directNativeShare"), "results strip: native share preserved");
assert(resultStrip.includes("LeonixShareButton"), "results strip: share preserved");

assert(howSection.includes("SVC_FEATURES_COMPACT_GRID"), "how section: responsive grid token");
assert(shellTokens.includes("min-w-0"), "shell tokens: min-width containment");
assert(shellTokens.includes("max-w-full"), "shell tokens: chip max width");
assert(shellTokens.includes("break-words"), "shell tokens: chip wrap");
assert(shellTokens.includes("xl:grid-cols-4"), "shell tokens: desktop column fill");

assert(pkg.includes('"verify:servicios-interaction-polish"'), "package.json: verifier registered");

console.log("OK: Servicios Guardar removed from hub and legacy listing card");
console.log("OK: Direct CTAs replace Call/Directions modals on detail + results");
console.log("OK: Gallery video thumbnails open external source");
console.log("verify-servicios-interaction-polish: PASS");
