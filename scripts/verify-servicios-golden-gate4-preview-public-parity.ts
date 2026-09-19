/**
 * Servicios Golden lifecycle closeout — Gate 4 (Preview -> Database -> Public Profile parity,
 * 2026-09-18).
 *
 * An Explore-agent field-by-field audit (business identity, category, service pills, custom
 * services, description, logo/cover/gallery/video, phones, email, website/socials, address/
 * privacy/maps, hours, special hours, offers, languages, Community Leonix, verification truth)
 * found every field already round-trips through the SAME mapper + SAME Golden shell components on
 * both Preview and Public, with two confirmed real gaps:
 *
 *   1. leonix_verified: the published page overrides the wire identity with the real DB value
 *      (`page.tsx`: `wireMerged.identity = {...,leonixVerified: row.leonix_verified === true}`)
 *      before resolving the profile. A listing-bound Preview never did this — it always forced
 *      `false`, so an owner previewing their OWN already-verified listing never saw the real
 *      badge, even though the my-listing API route already returns the real value.
 *   2. WhatsApp: the mapper wrote `contact.socialWhatsappUrl`/`socialWhatsappProfileUrl` whenever
 *      a number was present, WITHOUT checking `state.enableWhatsapp` — unlike the matching
 *      enableCall/enableEmail/enableWebsite gates a few lines above for phone/email/website. An
 *      owner who typed a WhatsApp number and then unchecked the toggle before publishing still
 *      got it published — "WhatsApp only when configured" was violated for BOTH Preview and
 *      Public equally (not a parity break, but a real capture-vs-publish bug).
 *
 * Fix: Preview now overrides the wire identity's leonixVerified the SAME way the published page
 * does, sourced from the my-listing route's already-returned real value; the WhatsApp write is
 * now gated on state.enableWhatsapp, matching the sibling channel gates.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-golden-gate4-preview-public-parity.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const raw = (rel: string) =>
  stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n"));

const PREVIEW = "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx";
const MAPPER = "app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft.ts";
const PUBLIC_PAGE = "app/(site)/clasificados/servicios/[slug]/page.tsx";
const MY_LISTING_ROUTE = "app/api/clasificados/servicios/my-listing/route.ts";
const HYDRATION = "app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts";

check("my-listing route already returns real leonix_verified (no server change needed)", () => {
  const src = raw(MY_LISTING_ROUTE);
  assert.ok(src.includes("leonix_verified: rec.leonix_verified === true,"));
});

check("hydration source type carries leonix_verified through to the client", () => {
  const src = raw(HYDRATION);
  assert.ok(src.includes("leonix_verified?: boolean;"));
});

check("Preview overrides the wire identity's leonixVerified for a listing-bound preview, mirroring the published page's own override", () => {
  const src = raw(PREVIEW);
  assert.ok(src.includes("setListingBoundLeonixVerified(data.listing.leonix_verified === true);"));
  const idx = src.indexOf("if (listingBoundPreview) {\n      wire = { ...wire, identity:");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 200);
  assert.ok(block.includes("leonixVerified: listingBoundLeonixVerified === true"));
});

check("REGRESSION GUARD: the published page's own override is untouched — same pattern, same source of truth", () => {
  const src = raw(PUBLIC_PAGE);
  assert.ok(src.includes("wireMerged.identity = { ...wireMerged.identity, leonixVerified: row.leonix_verified === true };"));
});

check("the mock preview card (previewListingRow) also uses the real value for a listing-bound preview, never a fabricated true", () => {
  const src = raw(PREVIEW);
  assert.ok(src.includes("leonix_verified: listingBoundPreview ? listingBoundLeonixVerified === true : false,"));
});

check("REGRESSION GUARD: a fresh (non listing-bound) application preview still honestly shows false (no real row exists yet)", () => {
  const src = raw(PREVIEW);
  assert.ok(src.includes("listingBoundLeonixVerified === true : false,"));
});

check("WhatsApp is now gated on the enableWhatsapp toggle, matching the sibling enableCall/enableEmail/enableWebsite gates", () => {
  const src = raw(MAPPER);
  const idx = src.indexOf("if (state.enableWhatsapp) {");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 500);
  assert.ok(block.includes("contact.socialWhatsappUrl = wa;"));
  assert.ok(block.includes("contact.socialWhatsappProfileUrl = socialHref;"));
});

check("REGRESSION GUARD: the sibling enableCall/enableEmail/enableWebsite gates are untouched", () => {
  const src = raw(MAPPER);
  assert.ok(src.includes("if (state.enableCall && state.phone.trim()"));
  assert.ok(src.includes("if (state.enableEmail && isValidEmail(state.email)) {"));
  assert.ok(src.includes("if (state.enableWebsite) {"));
});

if (failures.length) {
  console.error(`\nverify-servicios-golden-gate4-preview-public-parity: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-golden-gate4-preview-public-parity: PASS");
