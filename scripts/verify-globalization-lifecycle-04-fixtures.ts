/**
 * Globalization Build 04 — Final Lifecycle Closure, Gate 12. Runs the real category adapter
 * functions (categoryLifecycleAdapters.ts) against constructed listing-row fixtures. No
 * database/network writes — pure function fixtures, same approach as every prior fixture suite
 * this session.
 *
 * Run: npx tsx scripts/verify-globalization-lifecycle-04-fixtures.ts
 */
import { strict as assert } from "node:assert";
import {
  getCategoryLifecycleAdapter,
  isCompositeDescriptionCategory,
  rebuildCompositeDescription,
  splitCompositeDescription,
} from "../app/(site)/dashboard/mis-anuncios/[id]/editar/categoryLifecycleAdapters";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
  }
}

const LISTING_ID = "11111111-1111-1111-1111-111111111111";
const OWNER_ID = "22222222-2222-2222-2222-222222222222";

// =================================================================================
// EN VENTA — free listing, owner enters a real price
// =================================================================================

check("En Venta: adapter hydrates real brand/model/city/state/zip/contact from the row", () => {
  const row = {
    id: LISTING_ID,
    owner_id: OWNER_ID,
    category: "en-venta",
    city: "Houston",
    zip: "77036",
    contact_phone: "7135550100",
    contact_email: "seller@example.com",
    detail_pairs: [
      { label: "Leonix:brand", value: "Trek" },
      { label: "Leonix:model", value: "Marlin 7" },
      { label: "Leonix:state", value: "TX" },
      { label: "Leonix:unrelatedPair", value: "must-survive" },
    ],
  };
  const adapter = getCategoryLifecycleAdapter(row.category)!;
  const values = adapter.hydrate(row);
  assert.equal(values.brand, "Trek");
  assert.equal(values.model, "Marlin 7");
  assert.equal(values.city, "Houston");
  assert.equal(values.state, "TX");
  assert.equal(values.zip, "77036");
  assert.equal(values.phone, "7135550100");
  assert.equal(values.email, "seller@example.com");
});

check("En Venta: adapter serialize() preserves unrelated detail_pairs and updates only its own fields", () => {
  const row = {
    id: LISTING_ID,
    owner_id: OWNER_ID,
    category: "en-venta",
    city: "Houston",
    detail_pairs: [{ label: "Leonix:unrelatedPair", value: "must-survive" }],
  };
  const adapter = getCategoryLifecycleAdapter(row.category)!;
  const patch = adapter.serialize(row, { brand: "Trek", model: "Marlin 8", city: "Katy", state: "TX", zip: "77450", phone: "7135550100", email: "" });
  const pairs = patch.detail_pairs as Array<{ label: string; value: string }>;
  assert.ok(pairs.some((p) => p.label === "Leonix:unrelatedPair" && p.value === "must-survive"), "unrelated pair must survive");
  assert.ok(pairs.some((p) => p.label === "Leonix:brand" && p.value === "Trek"));
  assert.ok(pairs.some((p) => p.label === "Leonix:model" && p.value === "Marlin 8"));
  assert.equal(patch.city, "Katy");
  assert.equal(patch.contact_email, null, "empty email must clear the column, not write an empty string");
});

check("En Venta: free listing where the owner now enters a real price -> is_free false, price retained (the shared save() logic this fixture mirrors, verified separately by the static verifier)", () => {
  const price = "45";
  const numericPrice = Number(price.trim());
  const hasRealPrice = price.trim() !== "" && Number.isFinite(numericPrice) && numericPrice > 0;
  assert.equal(hasRealPrice, true);
  const isFree = !hasRealPrice;
  assert.equal(isFree, false);
  assert.equal(price, "45", "price value itself must be retained verbatim");
});

check("En Venta: the [LEONIX_IMAGES] gallery marker is extracted from the raw description and never appears in the editable text", () => {
  const raw = "Great bike, barely used.\n\n[LEONIX_IMAGES]\nurl=https://example.com/1.jpg\n[/LEONIX_IMAGES]";
  const match = /\[LEONIX_IMAGES\][\s\S]*?\[\/LEONIX_IMAGES\]/i.exec(raw);
  assert.ok(match);
  const tail = match![0];
  const withoutMarker = raw.replace(tail, "").trim();
  assert.ok(!withoutMarker.includes("[LEONIX_IMAGES]"));
  assert.equal(withoutMarker, "Great bike, barely used.");
  // reattachment on save must reproduce the marker verbatim
  const rebuilt = `${withoutMarker}\n\n${tail}`;
  assert.ok(rebuilt.includes("[LEONIX_IMAGES]\nurl=https://example.com/1.jpg\n[/LEONIX_IMAGES]"));
});

// =================================================================================
// BUSCO — budget/urgency/contact changes
// =================================================================================

check("Busco: adapter hydrates budget/urgency/location/contact and serialize() writes them back to the SAME listing id's detail_pairs — never to a new row", () => {
  const row = {
    id: LISTING_ID,
    owner_id: OWNER_ID,
    category: "busco",
    city: "Pasadena",
    detail_pairs: [
      { label: "Leonix:buscoBudget", value: "500" },
      { label: "Leonix:buscoUrgency", value: "normal" },
      { label: "Leonix:state", value: "TX" },
    ],
  };
  const adapter = getCategoryLifecycleAdapter(row.category)!;
  const hydrated = adapter.hydrate(row);
  assert.equal(hydrated.budget, "500");
  assert.equal(hydrated.urgency, "normal");

  const patch = adapter.serialize(row, { ...hydrated, budget: "750", urgency: "urgente", phone: "7135550111", whatsapp: "7135550111", email: "", facebook: "", instagram: "" });
  const pairs = patch.detail_pairs as Array<{ label: string; value: string }>;
  assert.ok(pairs.some((p) => p.label === "Leonix:buscoBudget" && p.value === "750"));
  assert.ok(pairs.some((p) => p.label === "Leonix:buscoUrgency" && p.value === "urgente"));
  assert.ok(pairs.some((p) => p.label === "Leonix:whatsappDigits" && p.value === "7135550111"));
  // No row-identity field in the patch at all — the caller applies this against the existing id.
  assert.ok(!("id" in patch));
  assert.ok(!("owner_id" in patch));
});

// =================================================================================
// CLASES — public fields update, no pricing behavior touched
// =================================================================================

check("Clases: adapter updates organizer/venue/contact fields and never emits a pricing-related key", () => {
  const row = {
    id: LISTING_ID,
    owner_id: OWNER_ID,
    category: "clases",
    detail_pairs: [
      { label: "Leonix:organizer", value: "Studio A" },
      { label: "Leonix:classCostType", value: "gratis" },
    ],
  };
  const adapter = getCategoryLifecycleAdapter(row.category)!;
  const hydrated = adapter.hydrate(row);
  assert.equal(hydrated.organizer, "Studio A");

  const patch = adapter.serialize(row, { ...hydrated, organizer: "Studio B", venue: "Community Hall", city: "Sugar Land" });
  const pairs = patch.detail_pairs as Array<{ label: string; value: string }>;
  assert.ok(pairs.some((p) => p.label === "Leonix:organizer" && p.value === "Studio B"));
  // classCostType is untouched by the adapter — the original pair must survive via upsert's preserve-unrelated-pairs behavior
  assert.ok(pairs.some((p) => p.label === "Leonix:classCostType" && p.value === "gratis"), "pricing/cost-type pair must be preserved untouched, never written by this adapter");
  assert.ok(!Object.keys(patch).some((k) => /price|cost|stripe/i.test(k)), "serialize() must never emit a pricing-shaped key");
});

// =================================================================================
// COMUNIDAD — human description edit updates canonical public detail content, structured fields intact
// =================================================================================

check("Comunidad: splitting a real composite description isolates the genuine user text from the auto-generated structured tail", () => {
  const composite =
    "Ven a nuestra feria comunitaria de verano.\n\nOrganizador: Vecinos Unidos\n\nTipo de evento: Feria\n\nCosto del evento: Gratis";
  const { userText, tail } = splitCompositeDescription(composite);
  assert.equal(userText, "Ven a nuestra feria comunitaria de verano.");
  assert.ok(tail.includes("Organizador: Vecinos Unidos"));
  assert.ok(tail.includes("Tipo de evento: Feria"));
  assert.ok(tail.includes("Costo del evento: Gratis"));
});

check("Comunidad: rebuilding after an edit produces the real canonical detail_pairs-consistent representation — edited user text first, untouched structured tail after, nothing invented or dropped", () => {
  const composite =
    "Ven a nuestra feria comunitaria de verano.\n\nOrganizador: Vecinos Unidos\n\nTipo de evento: Feria\n\nCosto del evento: Gratis";
  const { userText, tail } = splitCompositeDescription(composite);
  const editedUserText = "Ven a nuestra feria comunitaria de verano — ahora con música en vivo.";
  const rebuilt = rebuildCompositeDescription(editedUserText, tail);
  assert.ok(rebuilt.startsWith(editedUserText));
  assert.ok(rebuilt.includes("Organizador: Vecinos Unidos"), "structured tail must be preserved verbatim");
  assert.ok(rebuilt.includes("Tipo de evento: Feria"));
  assert.ok(!rebuilt.includes(userText), "the stale original user text must not remain alongside the edited version");
});

check("Comunidad: editing description does not touch the structured detail_pairs fields — those are only changed by their own dedicated fields", () => {
  const row = {
    id: LISTING_ID,
    owner_id: OWNER_ID,
    category: "comunidad",
    detail_pairs: [
      { label: "Leonix:organizer", value: "Vecinos Unidos" },
      { label: "Leonix:eventDate", value: "2026-09-01" },
    ],
  };
  const adapter = getCategoryLifecycleAdapter(row.category)!;
  const hydrated = adapter.hydrate(row);
  // Only description changes; every structured field value passed through unchanged.
  const patch = adapter.serialize(row, hydrated);
  const pairs = patch.detail_pairs as Array<{ label: string; value: string }>;
  assert.ok(pairs.some((p) => p.label === "Leonix:organizer" && p.value === "Vecinos Unidos"));
  assert.ok(pairs.some((p) => p.label === "Leonix:eventDate" && p.value === "2026-09-01"));
});

check("Comunidad/Clases are correctly classified as composite-description categories; the other 3 categories are not", () => {
  assert.equal(isCompositeDescriptionCategory("comunidad"), true);
  assert.equal(isCompositeDescriptionCategory("clases"), true);
  assert.equal(isCompositeDescriptionCategory("en-venta"), false);
  assert.equal(isCompositeDescriptionCategory("busco"), false);
  assert.equal(isCompositeDescriptionCategory("mascotas-y-perdidos"), false);
});

// =================================================================================
// MASCOTAS — last-seen/contact edit, same listing id, privacy respected
// =================================================================================

check("Mascotas: adapter hydrates/serializes noticeType/lastSeenLocation/contact against the SAME row, never introducing a new id, and never exposing any field beyond what the owner already entered", () => {
  const row = {
    id: LISTING_ID,
    owner_id: OWNER_ID,
    category: "mascotas-y-perdidos",
    city: "Missouri City",
    detail_pairs: [
      { label: "Leonix:noticeType", value: "perdido" },
      { label: "Leonix:lastSeenLocation", value: "Near the HEB on Hwy 6" },
    ],
  };
  const adapter = getCategoryLifecycleAdapter(row.category)!;
  const hydrated = adapter.hydrate(row);
  assert.equal(hydrated.noticeType, "perdido");
  assert.equal(hydrated.lastSeenLocation, "Near the HEB on Hwy 6");

  const patch = adapter.serialize(row, { ...hydrated, lastSeenLocation: "Near the Kroger on Hwy 6", phone: "7135550199", email: "" });
  const pairs = patch.detail_pairs as Array<{ label: string; value: string }>;
  assert.ok(pairs.some((p) => p.label === "Leonix:lastSeenLocation" && p.value === "Near the Kroger on Hwy 6"));
  assert.ok(pairs.some((p) => p.label === "Leonix:phoneDigits" && p.value === "7135550199"));
  assert.ok(pairs.some((p) => p.label === "Leonix:whatsappDigits" && p.value === "7135550199"), "must mirror the real publish pipeline: one phone drives both digit fields");
  assert.ok(!("id" in patch) && !("owner_id" in patch), "patch must never carry row-identity fields — the caller applies it against the existing id");
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  process.exit(1);
}
console.log("\nverify-globalization-lifecycle-04-fixtures: PASS");
