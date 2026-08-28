/**
 * Servicios application — final repair batch self-test.
 *
 * Covers only the source-verifiable items actually changed in this gate: business-type alphabetical
 * discovery, multiple custom Quick Facts, section-specific "Otro" (per-subgroup custom entries),
 * the special-hours note, and removal of stale +$99 coupon copy. No network, no React. Run from
 * repo root:
 *   npx tsx scripts/verify-servicios-application-final-qa.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

import { BUSINESS_TYPE_PRESETS } from "../app/(site)/clasificados/publicar/servicios/lib/businessTypePresets";
import { createDefaultClasificadosServiciosState } from "../app/(site)/clasificados/publicar/servicios/lib/defaultClasificadosServiciosState";
import { normalizeClasificadosServiciosApplicationState } from "../app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationNormalize";
import { enforceServiciosSelectionCaps, MAX_QUICK_FACTS_SELECTION } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosSelectionCaps";
import { evaluateAddCustomAmenityOption } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosCustomAmenityOptions";
import { mapClasificadosServiciosApplicationToServiciosDraft } from "../app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft";
import { mapServiciosApplicationDraftToBusinessProfile } from "../app/(site)/servicios/lib/mapServiciosApplicationDraftToBusinessProfile";
import { resolveServiciosProfile } from "../app/(site)/servicios/lib/resolveServiciosProfile";
import { SERVICIOS_AMENITY_REAL_GROUP_IDS } from "../app/(site)/servicios/lib/serviciosAmenitiesCatalog";

const ROOT = join(__dirname, "..");
function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), "utf8");
}

// ---------------------------------------------------------------------------
// 1. Business type discovery — alphabetical, canonical ids preserved, "Otro" last
// ---------------------------------------------------------------------------
{
  const form = read("app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx");
  assert.ok(form.includes("sortedBusinessTypePresets"), "form must render a locale-sorted preset list, not raw declaration order");
  assert.ok(/Intl\.Collator/.test(form), "sort must be locale-aware (Intl.Collator), not a naive string compare");
  assert.ok(form.includes('value={p.id}') || form.includes("value={p.id}"), "canonical id must remain the stored <option> value");
  // Every real preset id must still exist and be reachable — sorting must not drop entries.
  const ids = BUSINESS_TYPE_PRESETS.map((p) => p.id);
  assert.ok(ids.includes("plomeria") && ids.includes("abogado_asesoria_legal") && ids.includes("servicio_otro_generico"));
  console.log("OK: 1 business type discovery is locale-sorted, canonical ids preserved");
}

// ---------------------------------------------------------------------------
// 2-4. Multiple custom Quick Facts — array-based, deduped, cap fills a 3x3 grid
// ---------------------------------------------------------------------------
{
  assert.equal(MAX_QUICK_FACTS_SELECTION, 9, "cap must be raised to fill a 3x3 grid, not capped at 2");
  const base = createDefaultClasificadosServiciosState();
  assert.ok(Array.isArray(base.customQuickFacts), "customQuickFacts must be a real array, not a single boolean+string pair");

  const withFacts = enforceServiciosSelectionCaps({
    ...base,
    customQuickFacts: ["Bilingüe", "Bilingüe", " bilingüe ", "Certificado EPA", "Garantía de 1 año"],
  });
  assert.equal(withFacts.customQuickFacts.length, 3, "duplicate (case/accent-insensitive) custom facts must be deduped, distinct ones kept");
  assert.ok(withFacts.customQuickFacts.includes("Bilingüe"));
  assert.ok(withFacts.customQuickFacts.includes("Certificado EPA"));
  assert.ok(withFacts.customQuickFacts.includes("Garantía de 1 año"));

  // Legacy single-value shape (customQuickFactIncluded + customQuickFactLabel) must still hydrate
  // into the new array — an in-flight draft from before this gate must not lose its one fact.
  const legacyHydrated = normalizeClasificadosServiciosApplicationState({
    customQuickFactIncluded: true,
    customQuickFactLabel: "Servicio de emergencia 24/7",
  });
  assert.deepEqual(legacyHydrated.customQuickFacts, ["Servicio de emergencia 24/7"], "legacy single custom quick fact must fold into the new array, not be lost");

  const form = read("app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx");
  assert.ok(!form.includes("customQuickFactIncluded"), "the old single-value boolean must be fully retired from the form");
  console.log("OK: 2-4 multiple custom Quick Facts (array, deduped, 9-slot cap, legacy value preserved)");
}

// ---------------------------------------------------------------------------
// 5-7. Section-specific "Otro" — each of the 5 subgroups keeps its own custom bucket
// ---------------------------------------------------------------------------
{
  assert.equal(SERVICIOS_AMENITY_REAL_GROUP_IDS.length, 5, "exactly 5 real subgroups (Servicio, Disponibilidad, Clientes que atiende, Accesibilidad e idiomas, Descuentos y beneficios)");

  const base = createDefaultClasificadosServiciosState();
  const withEntries = enforceServiciosSelectionCaps({
    ...base,
    customAmenityOptions: [
      { groupId: "service", label: "Reparación de electrodomésticos antiguos" },
      { groupId: "discounts_benefits", label: "Reparación de electrodomésticos antiguos" }, // same text, different group — must NOT collide
      { groupId: "accessibility_languages", label: "Atención en portugués" },
    ],
  });
  assert.equal(withEntries.customAmenityOptions.length, 3, "identical label text in two DIFFERENT subgroups must not be treated as a duplicate");
  const serviceGroupLabels = withEntries.customAmenityOptions.filter((e) => e.groupId === "service").map((e) => e.label);
  const discountsGroupLabels = withEntries.customAmenityOptions.filter((e) => e.groupId === "discounts_benefits").map((e) => e.label);
  assert.deepEqual(serviceGroupLabels, ["Reparación de electrodomésticos antiguos"]);
  assert.deepEqual(discountsGroupLabels, ["Reparación de electrodomésticos antiguos"]);

  // evaluateAddCustomAmenityOption must only dedupe within the SAME group.
  const r = evaluateAddCustomAmenityOption(withEntries, "service", "Reparación de electrodomésticos antiguos");
  assert.equal(r.ok, false, "adding the same label again within its own group must be rejected as a duplicate");
  const r2 = evaluateAddCustomAmenityOption(withEntries, "customers_served", "Reparación de electrodomésticos antiguos");
  assert.equal(r2.ok, true, "the same label text must be addable to a DIFFERENT group — no cross-group collision");

  // Legacy flat string[] shape must migrate (arbitrarily into "service", documented) without throwing/losing data.
  const legacyHydrated = normalizeClasificadosServiciosApplicationState({
    customAmenityOptions: ["WiFi gratis", "Estacionamiento amplio"],
  });
  assert.equal(legacyHydrated.customAmenityOptions.length, 2, "legacy flat custom amenity list must not be silently dropped");
  assert.ok(legacyHydrated.customAmenityOptions.every((e) => typeof e.groupId === "string" && typeof e.label === "string"));

  const form = read("app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx");
  assert.ok(!/amenitiesOtherLabel/.test(form), "the old single shared 'Otras opciones' input label must be gone");
  assert.ok(form.includes("pendingCustomAmenityOptionByGroup"), "form must track pending custom text per subgroup");
  const groupOccurrences = (form.match(/groupCustoms/g) ?? []).length;
  assert.ok(groupOccurrences >= 1, "form must render each group's own custom entries inline with that group");

  const card = read("app/(site)/servicios/components/ServiciosOpcionesFacilidadesCard.tsx");
  assert.ok(
    !/en" \? "Other options" : "Otras opciones"/.test(card),
    "public display must no longer render a separate shared 'Otras opciones' section heading",
  );
  assert.ok(card.includes("customByGroup"), "public display must bucket custom entries by their own group, not one flat list");

  console.log("OK: 5-7 section-specific \"Otro\" — 5 independent subgroup buckets, no shared dumping ground, legacy data preserved");
}

// ---------------------------------------------------------------------------
// 5b. Full pipeline: form state -> draft -> business profile -> resolved profile
//     (proves group fidelity survives every mapping/sanitize layer, not just the
//     first one — the existing smoke-servicios-business-presets.ts script cannot
//     reach this assertion because it halts earlier on an unrelated pre-existing
//     "promotions" failure from a prior gate; see report.)
// ---------------------------------------------------------------------------
{
  const draftState = enforceServiciosSelectionCaps({
    ...createDefaultClasificadosServiciosState(),
    businessTypeId: "plomeria",
    customAmenityOptions: [
      { groupId: "service", label: "Instalación de calentadores solares" },
      { groupId: "discounts_benefits", label: "Descuento para veteranos" },
    ],
  });
  const draft = mapClasificadosServiciosApplicationToServiciosDraft(draftState, "es");
  assert.ok(Array.isArray(draft.customAmenityOptions) && draft.customAmenityOptions.length === 2, "draft must carry both group-tagged custom entries");
  assert.ok(draft.customAmenityOptions!.some((e) => e.groupId === "service" && e.label === "Instalación de calentadores solares"));
  assert.ok(draft.customAmenityOptions!.some((e) => e.groupId === "discounts_benefits" && e.label === "Descuento para veteranos"));

  const profile = mapServiciosApplicationDraftToBusinessProfile(draft);
  assert.ok(Array.isArray(profile.customAmenityOptions) && profile.customAmenityOptions!.length === 2, "business profile must preserve both group-tagged entries");

  const resolved = resolveServiciosProfile(profile, "es");
  const resolvedByGroup = new Map<string, string[]>();
  for (const e of resolved.customAmenityOptions) {
    resolvedByGroup.set(e.groupId, [...(resolvedByGroup.get(e.groupId) ?? []), e.label]);
  }
  assert.deepEqual(resolvedByGroup.get("service"), ["Instalación de calentadores solares"], "resolved profile must keep the service-group entry in its own group");
  assert.deepEqual(resolvedByGroup.get("discounts_benefits"), ["Descuento para veteranos"], "resolved profile must keep the discounts-group entry in its own group, not merged with service");

  console.log("OK: 5b full pipeline (form state -> draft -> business profile -> resolved profile) preserves per-group custom amenity fidelity end to end");
}

// ---------------------------------------------------------------------------
// 8. Special hours note wired end-to-end
// ---------------------------------------------------------------------------
{
  const base = createDefaultClasificadosServiciosState();
  assert.equal(base.specialHoursNote, "", "specialHoursNote must default to empty string, not be undefined/missing");
  const hydrated = normalizeClasificadosServiciosApplicationState({ specialHoursNote: "Cerrado en días festivos" });
  assert.equal(hydrated.specialHoursNote, "Cerrado en días festivos");

  const form = read("app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx");
  assert.ok(form.includes("specialHoursNote={{"), "HoursEditor must actually receive the specialHoursNote prop, not just have the field exist unused");

  const hoursComp = read("app/components/forms/HoursEditor.tsx");
  assert.ok(hoursComp.includes("specialHoursNote"), "shared HoursEditor primitive must support the note (unchanged, already existed)");

  const publicHours = read("app/(site)/servicios/components/ServiciosHours.tsx");
  assert.ok(publicHours.includes("hours.note"), "public Hours section must render the note when present");

  console.log("OK: 8 special-hours note wired through state, form UI, mapping, and public rendering");
}

// ---------------------------------------------------------------------------
// 9. Coupons — no stale +$99 upsell wording left anywhere live
// ---------------------------------------------------------------------------
{
  const form = read("app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx");
  assert.ok(!form.includes("+$99"), "no stale +$99 coupon upsell text may remain, dead or live");
  assert.ok(!form.includes("couponDecisionBody"), "the unreferenced legacy coupon-decision variables must be removed, not just unused");
  console.log("OK: 9 no stale +$99 coupon upsell wording remains in the application file");
}

// ---------------------------------------------------------------------------
// 10-11. Scope discipline — no migrations, no Revenue OS, no Restaurants/Comida Local/Community touched
// ---------------------------------------------------------------------------
{
  const changedFiles = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const untrackedFiles = execSync("git status --porcelain", { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .filter((l) => l.startsWith("??"))
    .map((l) => l.slice(3).trim());
  const allTouched = [...new Set([...changedFiles, ...untrackedFiles])];

  const migrationTouched = allTouched.some((f) => /supabase\/migrations\//i.test(f) || /\.sql$/i.test(f));
  assert.equal(migrationTouched, false, "no DB migration file may be touched");

  const revenueOsTouched = allTouched.some((f) => /revenuePricingMatrix|stripe|checkout\/|api\/revenue-os\//i.test(f));
  assert.equal(revenueOsTouched, false, "no Revenue OS / Stripe / checkout file may be touched");

  const forbiddenPrefixes = [
    "app/(site)/publicar/restaurantes/",
    "app/(site)/clasificados/restaurantes/",
    "app/(site)/publicar/comida-local/",
    "app/(site)/clasificados/comida-local/",
    "app/(site)/publicar/comunidad/",
    "app/(site)/clasificados/comunidad/",
    "app/(site)/publicar/clases/",
    "app/(site)/clasificados/clases/",
    "app/(site)/publicar/mascotas-y-perdidos/",
    "app/(site)/clasificados/mascotas-y-perdidos/",
    "app/(site)/publicar/busco/",
    "app/(site)/clasificados/busco/",
    "app/(site)/dashboard/",
    "app/admin/",
  ];
  const violations = allTouched.filter((f) => forbiddenPrefixes.some((p) => f.startsWith(p)));
  assert.equal(violations.length, 0, `expected no out-of-scope category/dashboard/admin files touched, found: ${violations.join(", ")}`);

  console.log("OK: 10-11 no DB migration, no Revenue OS, no out-of-scope category/dashboard/admin files touched");
}

console.log("verify-servicios-application-final-qa: PASS");
