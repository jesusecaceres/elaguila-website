/**
 * Gate D23 — targeted verifier for the Comida Local D0-D24 changes. No live DB/network calls.
 * Run: npx tsx scripts/verify-comida-local-gate-d-targeted.ts
 */
import { strict as assert } from "node:assert";
import { createEmptyComidaLocalDraft } from "../app/lib/clasificados/comida-local/createEmptyComidaLocalDraft";
import { mergeComidaLocalDraftFromStorage } from "../app/lib/clasificados/comida-local/comidaLocalDraftPersistence";
import { mapComidaLocalDraftToPreviewVm } from "../app/lib/clasificados/comida-local/mapComidaLocalDraftToPreviewVm";
import { getRevenuePackageDefinition, getRevenuePackagePriceCents } from "../app/lib/listingPlans/revenuePricingMatrix";
import {
  isLeonixEndorsementCategory,
  isValidLeonixEndorsementKey,
  leonixEndorsementTargetTypeForCategory,
} from "../app/lib/leonixCommunityTrust/leonixEndorsementRegistry";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(name);
    console.error(`FAIL: ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
  }
}

check("new fields round-trip through the storage sanitizer", () => {
  const draft = {
    ...createEmptyComidaLocalDraft(),
    businessName: "Tacos Doña Lupe",
    businessType: "food_truck" as const,
    businessTypeCustom: "",
    email: "hola@tacosdonalupe.com",
    serviceOptions: ["preorder" as const, "market_pickup" as const, "other" as const],
    serviceOptionOtherCustom: "solo por encargo",
    businessAddressLine: "123 Main St, San Jose",
    showAddressPublicly: true,
    highlights: ["hecho_en_casa" as const, "vegano" as const],
    highlightsOtherCustom: "",
    additionalWebsites: [{ label: "Menú", url: "https://example.com/menu" }],
    languages: ["es" as const, "otro" as const],
    customLanguages: ["Mixteco", "Náhuatl"],
    weeklyHours: { monday: { closed: false, openTime: "09:00", closeTime: "17:00" }, tuesday: { closed: true } },
  };

  const roundTripped = mergeComidaLocalDraftFromStorage(JSON.parse(JSON.stringify(draft)));

  assert.equal(roundTripped.businessType, "food_truck");
  assert.equal(roundTripped.email, "hola@tacosdonalupe.com");
  assert.deepEqual(roundTripped.serviceOptions, ["preorder", "market_pickup", "other"]);
  assert.equal(roundTripped.serviceOptionOtherCustom, "solo por encargo");
  assert.equal(roundTripped.businessAddressLine, "123 Main St, San Jose");
  assert.equal(roundTripped.showAddressPublicly, true);
  assert.deepEqual(roundTripped.highlights, ["hecho_en_casa", "vegano"]);
  assert.deepEqual(roundTripped.additionalWebsites, [{ label: "Menú", url: "https://example.com/menu" }]);
  assert.deepEqual(roundTripped.customLanguages, ["Mixteco", "Náhuatl"]);
  assert.equal(roundTripped.weeklyHours.monday?.openTime, "09:00");
  assert.equal(roundTripped.weeklyHours.tuesday?.closed, true);
});

check("unknown/malformed fields never crash the sanitizer, no fabricated values", () => {
  const merged = mergeComidaLocalDraftFromStorage({
    businessType: "not_a_real_type",
    serviceOptions: ["not_real", 123, null],
    additionalWebsites: "not-an-array",
    weeklyHours: { monday: { closed: "yes" }, notaday: { closed: true } },
  });
  assert.equal(merged.businessType, "");
  assert.deepEqual(merged.serviceOptions, []);
  assert.deepEqual(merged.additionalWebsites, []);
  assert.equal(merged.weeklyHours.notaday, undefined);
  assert.equal(merged.weeklyHours.monday?.closed, false);
});

check("address privacy: businessAddressLine hidden from VM unless showAddressPublicly is true", () => {
  const base = { ...createEmptyComidaLocalDraft(), businessName: "X", businessAddressLine: "123 Main St" };
  const privateVm = mapComidaLocalDraftToPreviewVm({ ...base, showAddressPublicly: false });
  assert.equal(privateVm.businessAddressLine, "");
  assert.equal(privateVm.sections.showBusinessAddress, false);

  const publicVm = mapComidaLocalDraftToPreviewVm({ ...base, showAddressPublicly: true });
  assert.equal(publicVm.businessAddressLine, "123 Main St");
  assert.equal(publicVm.sections.showBusinessAddress, true);
});

check("today-location (Encuéntrame hoy) stays independent of permanent address", () => {
  const draft = {
    ...createEmptyComidaLocalDraft(),
    businessName: "X",
    locationNote: "Hoy en el mercado central",
    businessAddressLine: "123 Main St",
    showAddressPublicly: false,
  };
  const vm = mapComidaLocalDraftToPreviewVm(draft);
  assert.equal(vm.locationNote, "Hoy en el mercado central");
  assert.equal(vm.sections.showLocationAvailability, true);
  assert.equal(vm.sections.showBusinessAddress, false);
});

check("email persists into a real CtaActionSheet-ready contact action, hidden when absent", () => {
  const withEmail = mapComidaLocalDraftToPreviewVm({
    ...createEmptyComidaLocalDraft(),
    businessName: "X",
    email: "owner@example.com",
  });
  assert.ok(withEmail.contactActions.some((a) => a.id === "email" && a.href === "mailto:owner@example.com"));

  const withoutEmail = mapComidaLocalDraftToPreviewVm({ ...createEmptyComidaLocalDraft(), businessName: "X" });
  assert.ok(!withoutEmail.contactActions.some((a) => a.id === "email"));
});

check("$129/month is the current Comida Local Revenue OS price", () => {
  const def = getRevenuePackageDefinition("comida_local_base_monthly");
  assert.ok(def, "comida_local_base_monthly package must exist");
  assert.equal(def!.category, "comida-local");
  assert.equal(def!.priceCents, 12900);
  assert.equal(def!.stripeEligible, true);
  const { priceCents } = getRevenuePackagePriceCents({ category: "comida-local", packageKey: "comida_local_base_monthly" });
  assert.equal(priceCents, 12900);
});

check("Restaurantes stays $399/mo and Servicios stays $399/mo (no regression)", () => {
  const r = getRevenuePackageDefinition("restaurantes_base_monthly");
  const s = getRevenuePackageDefinition("servicios_base_monthly");
  assert.equal(r?.priceCents, 39900);
  assert.equal(s?.priceCents, 39900);
});

check("Community Trust: comida-local is a valid endorsement category with real keys", () => {
  assert.equal(isLeonixEndorsementCategory("comida-local"), true);
  assert.equal(isLeonixEndorsementCategory("servicios"), true);
  assert.equal(isLeonixEndorsementCategory("restaurantes"), true);
  assert.equal(isValidLeonixEndorsementKey("comida-local", "cl_tasty_food"), true);
  assert.equal(isValidLeonixEndorsementKey("comida-local", "not_a_real_key"), false);
  assert.equal(leonixEndorsementTargetTypeForCategory("comida-local"), "comida_local_listing");
  assert.equal(leonixEndorsementTargetTypeForCategory("servicios"), "servicios_profile");
  assert.equal(leonixEndorsementTargetTypeForCategory("restaurantes"), "restaurantes_listing");
});

check("Gate F2: business type/service/highlight labels are genuinely bilingual, stored values unchanged", () => {
  const draft = {
    ...createEmptyComidaLocalDraft(),
    businessName: "X",
    businessType: "comida_casa" as const,
    serviceOptions: ["pickup" as const, "delivery" as const],
    highlights: ["receta_familiar" as const, "ingredientes_frescos" as const],
  };

  const esVm = mapComidaLocalDraftToPreviewVm(draft, "es");
  const enVm = mapComidaLocalDraftToPreviewVm(draft, "en");

  assert.equal(esVm.businessTypeLabel, "Comida desde casa");
  assert.equal(enVm.businessTypeLabel, "Home kitchen");

  assert.deepEqual(
    esVm.serviceChips.map((c) => c.label),
    ["Recoger", "Entrega"],
  );
  assert.deepEqual(
    enVm.serviceChips.map((c) => c.label),
    ["Pickup", "Delivery"],
  );

  assert.deepEqual(
    esVm.highlightChips.map((c) => c.label),
    ["Receta familiar", "Ingredientes frescos"],
  );
  assert.deepEqual(
    enVm.highlightChips.map((c) => c.label),
    ["Family recipe", "Fresh ingredients"],
  );

  // Stored keys (chip `key`, not `label`) must stay language-neutral regardless of lang.
  assert.deepEqual(
    esVm.serviceChips.map((c) => c.key),
    enVm.serviceChips.map((c) => c.key),
  );
  assert.equal(esVm.serviceChips[0]?.key, "pickup");

  // Default (no lang arg) must stay Spanish — preserves every pre-existing call site.
  const defaultVm = mapComidaLocalDraftToPreviewVm(draft);
  assert.equal(defaultVm.businessTypeLabel, "Comida desde casa");
});

check("hide-if-empty: optional sections all false on an empty draft", () => {
  const vm = mapComidaLocalDraftToPreviewVm({ ...createEmptyComidaLocalDraft(), businessName: "X" });
  assert.equal(vm.sections.showHighlights, false);
  assert.equal(vm.sections.showAdditionalWebsites, false);
  assert.equal(vm.sections.showBusinessAddress, false);
  assert.equal(vm.sections.showHours, false);
  assert.equal(vm.sections.showContact, false);
});

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
  process.exit(1);
} else {
  console.log("\nAll Gate D targeted checks passed.");
}
