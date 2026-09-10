/**
 * Gate SERVICIOS-1 verifier — launch-critical Servicios lifecycle repairs.
 *
 * Pure/unit + source-level only: no network, no DB, no dev server.
 * Run: npx tsx scripts/verify-servicios-gate1-lifecycle.ts
 *
 * Covers, in order:
 *   1. Published -> edit hydration round-trip (the P0): reasons, custom reason, quick facts, and
 *      the businessHighlights preset/custom separation all survive a publish -> edit -> republish.
 *   2. Canonical republish identity: the row UUID, not the slug, is the persistence authority.
 *   3. Address privacy reaches public rendering through the shared contract.
 *   4. Hours/open-now uses the shared runtime evaluator, matching results/search truth.
 *   5. WhatsApp uses the canonical shared module with an E.164 ceiling; US phone left intact.
 *   6. Dropped-unpersistable media is surfaced instead of silently swallowed.
 *   7. Protected Application/Preview UX was not structurally redesigned.
 */
import { strict as assert } from "node:assert";
import * as fs from "node:fs";
import * as path from "node:path";

import { createDefaultClasificadosServiciosState } from "@/app/clasificados/publicar/servicios/lib/defaultClasificadosServiciosState";
import { normalizeClasificadosServiciosApplicationState } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationNormalize";
import { mapClasificadosServiciosApplicationToServiciosDraft } from "@/app/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft";
import { serviciosPublishedToApplicationDraft } from "@/app/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft";
import { BUSINESS_TYPE_PRESETS } from "@/app/clasificados/publicar/servicios/lib/businessTypePresets";
import { BUSINESS_HIGHLIGHT_PRESET_CHIPS } from "@/app/clasificados/publicar/servicios/lib/businessHighlightPresets";
import { mapServiciosApplicationDraftToBusinessProfile } from "@/app/servicios/lib/mapServiciosApplicationDraftToBusinessProfile";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import { normalizeServiciosWhatsAppDigits } from "@/app/servicios/lib/serviciosWhatsAppHref";
import {
  formatPhoneInputDisplay,
  formatWhatsAppInputDisplay,
  isValidWhatsAppNumber,
} from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";

const ROOT = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const ok = (m: string) => console.log(`OK: ${m}`);

const APPLICATION = "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx";
const PREVIEW = "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx";
const PUBLISH_ROUTE = "app/api/clasificados/servicios/publish/route.ts";
const REVERSE_MAPPER = "app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts";
const RESOLVE_PROFILE = "app/(site)/servicios/lib/resolveServiciosProfile.ts";
const HOURS = "app/(site)/servicios/components/ServiciosHours.tsx";
const RESULTS_FILTER = "app/(site)/clasificados/servicios/lib/serviciosResultsFilter.ts";

/* ------------------------------------------------------------------ *
 * 1. THE P0 — published -> edit hydration round-trip
 * ------------------------------------------------------------------ */

/** Pick a business type that actually has both reason and quick-fact presets to exercise. */
const preset = BUSINESS_TYPE_PRESETS.find((p) => p.reasonsToChoose.length >= 2 && p.quickFacts.length >= 1);
assert.ok(preset, "expected at least one business-type preset with reasons + quick facts");

const reasonIds = preset.reasonsToChoose.slice(0, 2).map((c) => c.id);
const quickFactIds = preset.quickFacts.slice(0, 1).map((c) => c.id);
const highlightId = BUSINESS_HIGHLIGHT_PRESET_CHIPS[0]!.id;

const authored = normalizeClasificadosServiciosApplicationState({
  ...createDefaultClasificadosServiciosState(),
  businessTypeId: preset.id,
  businessName: "Acme Plumbing",
  city: "San Jose",
  aboutText: "Servicio de plomería con más de 20 años de experiencia en el área.",
  phone: "4085551234",
  selectedReasonIds: reasonIds,
  customReasonLabel: "Garantía por escrito",
  customReasonIncluded: true,
  selectedQuickFactIds: quickFactIds,
  customQuickFacts: ["Servicio de emergencia", "Presupuesto gratis"],
  selectedBusinessHighlightIds: [highlightId],
  customBusinessHighlights: ["Familia local"],
  physicalStreet: "123 Main St",
  physicalAddressCity: "San Jose",
  physicalRegion: "CA",
  physicalPostalCode: "95112",
  physicalCountry: "US",
});

/**
 * Mirrors what `app/api/clasificados/servicios/publish/route.ts` actually persists: the wire
 * profile plus `opsMeta.businessTypeId` (the route sets it from `state.businessTypeId`). The
 * reverse mapper reads that field to resolve preset ids — the same dependency the pre-existing
 * `mapSelectedServiceIds` already has, so the fixture must reproduce it rather than bypass it.
 */
function publishWire(state: typeof authored) {
  const wire = mapServiciosApplicationDraftToBusinessProfile(
    mapClasificadosServiciosApplicationToServiciosDraft(state, "es"),
  );
  return {
    ...wire,
    opsMeta: { ...wire.opsMeta, businessTypeId: state.businessTypeId.trim() },
  };
}

const publishedWire = publishWire(authored);

const rehydrated = serviciosPublishedToApplicationDraft({
  id: "11111111-1111-1111-1111-111111111111",
  slug: "acme-plumbing",
  leonix_ad_id: "LX-SV-TEST-001",
  business_name: "Acme Plumbing",
  city: "San Jose",
  listing_status: "published",
  profile_json: publishedWire,
}).state;

assert.deepEqual(
  [...rehydrated.selectedReasonIds].sort(),
  [...reasonIds].sort(),
  "reasons-to-choose preset selections must survive published -> edit",
);
ok("1a. reasons-to-choose preset selections survive published -> edit");

assert.equal(rehydrated.customReasonLabel, "Garantía por escrito");
assert.equal(rehydrated.customReasonIncluded, true);
ok("1b. free-text custom reason survives published -> edit");

/** Quick facts round-trip as free text by design (no stable preset id survives persistence) —
 *  what matters is that the owner's exact wording is never lost. */
const authoredQuickFactLabels = [
  ...quickFactIds.map((id) => preset.quickFacts.find((c) => c.id === id)!.es),
  "Servicio de emergencia",
  "Presupuesto gratis",
];
for (const label of authoredQuickFactLabels) {
  assert.ok(
    rehydrated.customQuickFacts.some((x) => x.trim() === label.trim()),
    `quick fact "${label}" must survive published -> edit (found: ${JSON.stringify(rehydrated.customQuickFacts)})`,
  );
}
ok("1c. every quick fact survives published -> edit with exact wording");

assert.deepEqual(
  rehydrated.selectedBusinessHighlightIds,
  [highlightId],
  "preset business highlight must come back as its PRESET id, not the persisted bh_preset_* string",
);
assert.ok(
  !rehydrated.selectedBusinessHighlightIds.some((id) => id.startsWith("trust_") || id === "custom_reason"),
  "trust ids must never be folded into selectedBusinessHighlightIds",
);
ok("1d. businessHighlights preset ids restored correctly, no trust_/custom_reason contamination");

assert.deepEqual(
  rehydrated.customBusinessHighlights,
  ["Familia local"],
  "only bh_custom_* entries are custom highlights — a preset must not be duplicated as custom text",
);
ok("1e. custom business highlights separated from preset highlights");

/** Republishing the rehydrated state must not lose the sections a second time. */
const republishedWire = publishWire(normalizeClasificadosServiciosApplicationState(rehydrated));
assert.ok((republishedWire.trust ?? []).length > 0, "trust must survive a same-row republish");
assert.ok((republishedWire.quickFacts ?? []).length > 0, "quickFacts must survive a same-row republish");
assert.ok(
  (republishedWire.businessHighlights ?? []).length > 0,
  "businessHighlights must survive a same-row republish",
);
assert.equal(
  (republishedWire.trust ?? []).length,
  (publishedWire.trust ?? []).length,
  "same-row republish must not shrink the trust list",
);
ok("1f. same-row republish preserves trust / quickFacts / businessHighlights (no shrink)");

/* ------------------------------------------------------------------ *
 * 2. Canonical republish identity
 * ------------------------------------------------------------------ */

const publishRoute = read(PUBLISH_ROUTE);
assert.ok(
  publishRoute.includes("getServiciosPublicListingByIdFromDb"),
  "publish route must resolve the target row by canonical id",
);
assert.ok(
  publishRoute.includes('updateQuery.eq("id", canonicalListingId)'),
  "publish route must UPDATE by canonical id when one is supplied",
);
assert.ok(
  publishRoute.includes("listing_owner_mismatch"),
  "an id pointing at another owner's row must be refused, never updated",
);
ok("2a. publish route keys persistence on the canonical listing id");

/** The row's own slug is adopted, so a rename can never mint a new slug and INSERT a duplicate. */
const canonicalBlock = publishRoute.slice(
  publishRoute.indexOf("let canonicalListingId"),
  publishRoute.indexOf("const draft = mapClasificadosServiciosApplicationToServiciosDraft"),
);
assert.ok(
  /canonicalListingId = row\.id[\s\S]*?slug = row\.slug/.test(canonicalBlock),
  "resolving by id must adopt that row's own slug (stable public URL across a rename)",
);
ok("2b. resolving by id adopts the row's own slug — a rename cannot create a duplicate");

const publishClient = read("app/(site)/clasificados/publicar/servicios/lib/serviciosPublishClient.ts");
assert.ok(publishClient.includes("SERVICIOS_EXISTING_LISTING_ID_SESSION_KEY"));
assert.ok(publishClient.includes("primeServiciosExistingListingId"));
assert.ok(
  publishClient.includes("existingListingId"),
  "the client must thread the canonical id into the publish transport",
);
ok("2c. client threads the canonical listing id through the publish transport");

for (const [label, file] of [
  ["application", APPLICATION],
  ["preview", PREVIEW],
] as const) {
  assert.ok(
    read(file).includes("primeServiciosExistingListingId(hydrated"),
    `${label} must prime the canonical id on listing-bound hydration`,
  );
}
ok("2d. canonical id primed at both listing-bound hydration sites");

/* ------------------------------------------------------------------ *
 * 3. Address privacy reaches public rendering
 * ------------------------------------------------------------------ */

const publicWithAddress = resolveServiciosProfile(publishedWire, "es");
assert.ok(
  (publicWithAddress.contact.physicalAddressDisplay ?? "").includes("123 Main St"),
  "default (showExactAddress absent/true) must still show the address — no retroactive hiding",
);
assert.ok(publicWithAddress.contact.mapsSearchHref, "directions allowed when the address is public");
ok("3a. address public by default (no existing listing retroactively hidden)");

const privateWire = {
  ...publishedWire,
  contact: { ...publishedWire.contact, showExactAddress: false },
};
const publicHidden = resolveServiciosProfile(privateWire, "es");
assert.equal(
  publicHidden.contact.physicalAddressDisplay,
  undefined,
  "exact address must not reach the public view model when the owner opted out",
);
assert.equal(
  publicHidden.contact.mapsSearchHref,
  undefined,
  "directions must not expose a hidden destination",
);
ok("3b. showExactAddress=false hides the street AND suppresses directions");

const resolveSrc = read(RESOLVE_PROFILE);
assert.ok(
  resolveSrc.includes("resolveBusinessAddressPublicView"),
  "the reveal/hide decision must come from the shared privacy contract, not a category-local rule",
);
assert.ok(
  resolveSrc.includes("addressPublicView.directionsAllowed"),
  "mapsSearchHref must be gated on directionsAllowed",
);
ok("3c. privacy decision delegated to the shared businessAddress contract");

/** The privacy field must survive published -> edit so an opt-out is not silently reverted. */
const rehydratedPrivate = serviciosPublishedToApplicationDraft({
  slug: "acme-plumbing",
  profile_json: privateWire,
}).state;
assert.equal(rehydratedPrivate.showExactAddress, false, "an opt-out must survive published -> edit");
const rehydratedLegacy = serviciosPublishedToApplicationDraft({
  slug: "acme-plumbing",
  profile_json: { ...publishedWire, contact: { ...publishedWire.contact, showExactAddress: undefined } },
}).state;
assert.equal(rehydratedLegacy.showExactAddress, true, "a pre-field listing must default to visible");
ok("3d. showExactAddress round-trips on edit; legacy listings default to visible");

/* ------------------------------------------------------------------ *
 * 4. Hours / open now
 * ------------------------------------------------------------------ */

const hoursSrc = read(HOURS);
assert.ok(
  hoursSrc.includes("buildServiciosHeroHoursPill"),
  "public hours must use the shared runtime evaluator",
);
assert.ok(
  !/openNowLabel\.toLowerCase\(\)\.includes\(['"]cerrado['"]\)\s*\?/.test(hoursSrc),
  "the frozen-string colour heuristic must no longer be the primary logic",
);
assert.ok(
  read(RESULTS_FILTER).includes("serviciosHoursSummaryIsOpenNow"),
  "results/search must use the same evaluator module (shared truth)",
);
ok("4. public open-now and results open_now share one runtime evaluator");

/* ------------------------------------------------------------------ *
 * 5. Phone / WhatsApp
 * ------------------------------------------------------------------ */

assert.equal(normalizeServiciosWhatsAppDigits("4085551234"), "14085551234", "bare US 10-digit gets a 1");
assert.equal(
  normalizeServiciosWhatsAppDigits("+52 55 1234 5678"),
  "525512345678",
  "an international number must pass through untruncated",
);
assert.equal(
  normalizeServiciosWhatsAppDigits("1234567890123456"),
  null,
  "16 digits exceeds the E.164 max and must be rejected, not silently truncated",
);
assert.equal(normalizeServiciosWhatsAppDigits("1234567"), null, "below 8 digits is not a real number");
ok("5a. WhatsApp normalization is international-safe with an E.164 ceiling");

assert.equal(
  formatWhatsAppInputDisplay("+52 55 1234 5678"),
  "+525512345678",
  "WhatsApp input keeps the leading + and never applies US grouping",
);
assert.equal(isValidWhatsAppNumber("+525512345678"), true);
assert.equal(isValidWhatsAppNumber("1234567890123456"), false, "16 digits must be invalid");
ok("5b. WhatsApp input display/validation delegate to the shared module");

assert.equal(
  formatPhoneInputDisplay("4085551234"),
  "(408) 555-1234",
  "the primary phone field keeps its deliberate US formatting contract",
);
ok("5c. US primary-phone formatting left intact");

/* ------------------------------------------------------------------ *
 * 6. Media failure visibility
 * ------------------------------------------------------------------ */

const mediaContract = read("app/lib/media/listingMediaContract.ts");
assert.ok(
  mediaContract.includes("export function warnDroppedUnpersistableMedia"),
  "the shared media contract must expose the dropped-media warning helper",
);
assert.ok(
  publishRoute.includes('warnDroppedUnpersistableMedia("servicios-publish"'),
  "the Servicios publish boundary must read droppedUnpersistable, not discard it",
);
assert.ok(
  publishRoute.includes("droppedUnpersistableMedia"),
  "the dropped list must reach the client, not only the server log",
);
assert.ok(
  read(PREVIEW).includes("mediaDropped"),
  "the publish success hand-off must carry the dropped-media signal",
);
assert.ok(
  read("app/(site)/clasificados/publicar/servicios/components/ServiciosJustPublishedSuccessBanner.tsx").includes(
    "mediaDroppedNotice",
  ),
  "the success banner must have an owner-visible slot for the dropped-media notice",
);
const slugPage = read("app/(site)/clasificados/servicios/[slug]/page.tsx");
assert.ok(slugPage.includes("mediaDroppedNotice") && slugPage.includes("mediaDropped"));
ok("6. dropped media is surfaced to the owner, not silently swallowed");

/* ------------------------------------------------------------------ *
 * 7. Protected pre-Preview UX preserved
 * ------------------------------------------------------------------ */

const appSrc = read(APPLICATION);
for (const anchor of [
  "useBusinessApplicationLeaveGuard",
  "CityAutocomplete",
  "clasificadosServiciosStorage",
  "evaluateServiciosPreviewReadiness",
]) {
  assert.ok(appSrc.includes(anchor), `protected application wiring "${anchor}" must remain mounted`);
}
const previewSrc = read(PREVIEW);
for (const anchor of [
  "PublishCheckoutCheckpoint",
  "saveServiciosPendingBeforeCheckout",
  "startRevenueCategoryCheckout",
  "captureCheckoutNewsletterSubscriber",
  "evaluateServiciosPublishReadiness",
]) {
  assert.ok(previewSrc.includes(anchor), `protected preview wiring "${anchor}" must remain mounted`);
}
ok("7. protected Application/Preview wiring still mounted (additive changes only)");

console.log("\nverify-servicios-gate1-lifecycle: PASS");
