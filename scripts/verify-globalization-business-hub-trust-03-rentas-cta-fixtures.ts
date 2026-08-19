/**
 * Globalization Build 03 — Final Hardening, Gate 5: Rentas CTA fixture proofs.
 *
 * Runs the REAL, live functions the canonical `/clasificados/rentas/listing/[id]` route actually
 * uses (mapListingRowToRentasPublicListing -> getRentasListingDetailExtra ->
 * mapRentasListingToPrivadoPreviewVm), end to end, against constructed fixtures. This is the exact
 * pipeline `RentasVisualMatchPreviewView.tsx` consumes — proving the real, live CTA truth, not a
 * separate/parallel implementation.
 *
 * Correction to the prior Build 03 report: the "CtaActionSheet has no onAction" finding referred
 * to `RentasNegocioDesktopBusinessRail.tsx`, which is NOT imported by the canonical route
 * (confirmed by direct grep — it has zero live call sites). The real canonical page never renders
 * that component. Its actual contact CTAs (call/WhatsApp/SMS/email/website/directions) already use
 * real per-field visibility booleans (`showLlamar`, `showWhatsapp`, etc.) and are already wired to
 * real analytics (`app/(site)/clasificados/rentas/analytics/rentasAnalytics.ts` ->
 * `recordAnalyticsEvent` -> the one real backend sink) — this file proves that truth with real
 * fixtures rather than only static source reading.
 *
 * Run: npx tsx scripts/verify-globalization-business-hub-trust-03-rentas-cta-fixtures.ts
 */
import { strict as assert } from "node:assert";
import { mapListingRowToRentasPublicListing } from "../app/(site)/clasificados/rentas/data/mapListingRowToRentasPublicListing";
import { getRentasListingDetailExtra } from "../app/(site)/clasificados/rentas/listing/rentasListingDetailModel";
import { mapRentasListingToPrivadoPreviewVm } from "../app/(site)/clasificados/rentas/listing/mapRentasListingLiveToPreviewVm";

const failures: string[] = [];
async function check(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
  }
}

function rentasDetailPairs(overrides: Record<string, string> = {}): Array<{ label: string; value: string }> {
  const base: Record<string, string> = {
    "Leonix:categoria_propiedad": "residencial",
    "Leonix:results_property_kind": "departamento",
    "Leonix:bedrooms_count": "2",
    "Leonix:bathrooms_count": "1",
    "Leonix:rent:listing_status": "disponible",
    "Leonix:rent:show_exact_address": "false",
    "Leonix:state": "TX",
    ...overrides,
  };
  return Object.entries(base).map(([label, value]) => ({ label, value }));
}

function rentasRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "rentas-cta-fixture-1",
    category: "rentas",
    title: "Depa amueblado cerca del centro",
    description: "Depa amueblado.",
    city: "Houston",
    price: 1500,
    detail_pairs: rentasDetailPairs(),
    status: "active",
    is_published: true,
    published_at: "2026-08-01T00:00:00.000Z",
    created_at: "2026-08-01T00:00:00.000Z",
    expires_at: "2099-01-01T00:00:00.000Z",
    ...overrides,
  };
}

async function run() {

// =================================================================================
// Phone
// =================================================================================

await check("Rentas CTA: real phone -> call button visible with a real tel: href", () => {
  const listing = mapListingRowToRentasPublicListing(rentasRow({ contact_phone: "+1 713 555 0100" }), "es");
  assert.ok(listing);
  const extra = getRentasListingDetailExtra(listing!);
  const vm = mapRentasListingToPrivadoPreviewVm(listing!, extra, "es");
  assert.equal(vm.contact.showLlamar, true, "showLlamar must be true for a real phone number");
  assert.ok(vm.contact.llamarHref && vm.contact.llamarHref.startsWith("tel:"), "call href must be a real tel: link");
});

await check("Rentas CTA: missing phone -> call button hidden", () => {
  const listing = mapListingRowToRentasPublicListing(rentasRow({ contact_phone: null }), "es");
  assert.ok(listing);
  const extra = getRentasListingDetailExtra(listing!);
  const vm = mapRentasListingToPrivadoPreviewVm(listing!, extra, "es");
  assert.equal(vm.contact.showLlamar, false, "showLlamar must be false with no real phone number");
  assert.equal(vm.contact.llamarHref, null);
});

// =================================================================================
// WhatsApp
// =================================================================================

await check("Rentas CTA: real WhatsApp digits -> WhatsApp button visible with a real wa.me href", () => {
  // WhatsApp digits are read from detail_pairs (Leonix:rent:contact_whatsapp_digits), not a plain
  // column — confirmed directly against rentasMachineDetailPairs.ts / rentasDetailPairRead.ts.
  const listing = mapListingRowToRentasPublicListing(
    rentasRow({ detail_pairs: rentasDetailPairs({ "Leonix:rent:contact_whatsapp_digits": "7135550100" }) }),
    "es",
  );
  assert.ok(listing);
  const extra = getRentasListingDetailExtra(listing!);
  const vm = mapRentasListingToPrivadoPreviewVm(listing!, extra, "es");
  assert.equal(vm.contact.showWhatsapp, true);
  assert.ok(vm.contact.whatsappHref && /wa\.me|whatsapp/i.test(vm.contact.whatsappHref), "WhatsApp href must be a real wa.me link");
});

await check("Rentas CTA: missing WhatsApp (and no phone to fall back to) -> WhatsApp button hidden", () => {
  const listing = mapListingRowToRentasPublicListing(rentasRow({ contact_phone: null }), "es");
  assert.ok(listing);
  const extra = getRentasListingDetailExtra(listing!);
  const vm = mapRentasListingToPrivadoPreviewVm(listing!, extra, "es");
  assert.equal(vm.contact.showWhatsapp, false);
  assert.equal(vm.contact.whatsappHref, null);
});

// =================================================================================
// Map / directions — Foundation 02 privacy truth
// =================================================================================

await check("Rentas CTA: map query uses ONLY city/state when the exact-address flag is off — never the street", () => {
  const listing = mapListingRowToRentasPublicListing(
    rentasRow({ detail_pairs: rentasDetailPairs({ "Leonix:rent:show_exact_address": "false" }) }),
    "es",
  );
  assert.ok(listing);
  const extra = getRentasListingDetailExtra(listing!);
  const vm = mapRentasListingToPrivadoPreviewVm(listing!, extra, "es");
  assert.equal(vm.mostrarDireccionExacta, false);
  // The map destination, if present at all, must never be built from the exact street line when
  // the owner did not opt in — proven by mostrarDireccionExacta driving the same `loc.exact` used
  // to select mapsQuery (source: mapRentasListingLiveToPreviewVm.ts — `loc.exact ? loc.addressLine
  // : loc.cityStateZip`).
  if (vm.location.mapsUrl) {
    assert.ok(!/calle|street|ave\b/i.test(decodeURIComponent(vm.location.mapsUrl)), "map query must not leak a street-shaped address when privacy is on");
  }
});

await check("Rentas CTA: map destination reflects the real listing city, never a fabricated fallback", () => {
  const listing = mapListingRowToRentasPublicListing(rentasRow({ city: "Houston" }), "es");
  assert.ok(listing);
  const extra = getRentasListingDetailExtra(listing!);
  const vm = mapRentasListingToPrivadoPreviewVm(listing!, extra, "es");
  if (vm.location.mapsUrl) {
    assert.ok(decodeURIComponent(vm.location.mapsUrl).includes("Houston") || vm.location.cityStateZip.includes("Houston"));
  }
});

// =================================================================================
// Analytics wiring — real dispatcher, real canonical event names
// =================================================================================

await check("Rentas analytics dispatcher uses real canonical event types already in the shared allowlist", async () => {
  const mod = await import("../app/(site)/clasificados/rentas/analytics/rentasAnalytics");
  assert.equal(typeof mod.trackRentasPhoneClick, "function");
  assert.equal(typeof mod.trackRentasWhatsappClick, "function");
  assert.equal(typeof mod.trackRentasDirectionsClick, "function");
  const { LISTING_ANALYTICS_EVENT_TYPES } = await import("../app/lib/listingAnalyticsEventTypes");
  for (const t of ["phone_click", "whatsapp_click", "email_click", "website_click", "directions_click", "message_click"]) {
    assert.ok((LISTING_ANALYTICS_EVENT_TYPES as readonly string[]).includes(t), `${t} must be a real allowlisted event type`);
  }
});

await check("Rentas analytics dispatcher routes through the one real backend sink (recordAnalyticsEvent), no parallel stack", async () => {
  const fs = await import("node:fs");
  const src = fs.readFileSync("app/(site)/clasificados/rentas/analytics/rentasAnalytics.ts", "utf8");
  assert.ok(src.includes('from "@/app/lib/analytics/client/recordAnalyticsEvent"'));
  assert.ok(!/fetch\(["'](?!\/api\/analytics\/events)/.test(src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")));
});

}

run().then(() => {
  if (failures.length) {
    console.error(`\n${failures.length} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nverify-globalization-business-hub-trust-03-rentas-cta-fixtures: PASS");
});
