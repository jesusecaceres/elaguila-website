/**
 * Gate 1 — Comunidad y Eventos QA remediation self-test.
 *
 * Statically/behaviorally pins the owner-approved acceptance criteria for this
 * gate. Comunidad-owned logic is exercised directly; a few checks that can
 * only be proven by inspecting rendered JSX are done as source-text
 * assertions (same pattern scripts/verify-checkpoint-first-routes.mjs already
 * uses in this repo) rather than a full React render, since this script has
 * no network/React/Supabase dependency by design.
 *
 * No network, no React, no Supabase. Run from repo root:
 *   npx tsx scripts/gate-1-comunidad-eventos-qa-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  comunidadPriceFields,
  buildComunidadDetailPairs,
  buildComunidadDescription,
} from "../app/(site)/publicar/comunidad/lib/comunidadPublishPayload";
import { comunidadPublishedQuickToDraft } from "../app/(site)/publicar/comunidad/lib/comunidadPublishedQuickToDraft";
import {
  buildComunidadDiscoveryCardModel,
  buildComunidadDiscoveryCardModelFromDraft,
} from "../app/(site)/clasificados/comunidad/shared/comunidadDiscoveryCardModel";
import { buildComunidadLegacyDetail } from "../app/(site)/clasificados/comunidad/shared/comunidadLegacyDetailAdapter";
import {
  COMUNIDAD_ACCESSIBILITY_UNCERTAIN_VALUE,
} from "../app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
import { COMUNIDAD_QUICK_COPY } from "../app/(site)/publicar/community/shared/copy/communityPublishCopy";
import {
  emptyComunidadQuickDraft,
  type ComunidadQuickDraft,
} from "../app/(site)/publicar/community/shared/types/communityQuickDraft";
import type { CommunityListingBrowseRow } from "../app/(site)/clasificados/community/shared/communityListingsBrowseClient";

function pairs(entries: Record<string, string>): { label: string; value: string }[] {
  return Object.entries(entries).map(([label, value]) => ({ label, value }));
}

function pairsMap(entries: Record<string, string>): Record<string, string> {
  return { ...entries };
}

function row(overrides: Partial<CommunityListingBrowseRow>): CommunityListingBrowseRow {
  return {
    id: "row-1",
    title: "Sample event",
    description: "Sample description",
    city: "San José",
    price: 0,
    is_free: true,
    category: null,
    detail_pairs: [],
    images: [],
    created_at: null,
    owner_id: null,
    ...overrides,
  };
}

function readSource(relPath: string): string {
  return readFileSync(path.join(__dirname, "..", relPath), "utf8");
}

// ---------------------------------------------------------------------------
// 1. Leonix listing stays free even when the event charges admission
// ---------------------------------------------------------------------------
{
  const paidDraft: ComunidadQuickDraft = {
    ...emptyComunidadQuickDraft(),
    eventCost: "pagado",
    admissionNote: "25",
  };
  const freeFields = comunidadPriceFields(paidDraft);
  assert.deepEqual(freeFields, { price: 0, is_free: true }, `paid-admission event must still publish a free Leonix listing, got ${JSON.stringify(freeFields)}`);

  const donationDraft: ComunidadQuickDraft = { ...emptyComunidadQuickDraft(), eventCost: "donacion", admissionNote: "10" };
  assert.deepEqual(comunidadPriceFields(donationDraft), { price: 0, is_free: true }, "donation event must still publish a free Leonix listing");

  const gratisDraft: ComunidadQuickDraft = { ...emptyComunidadQuickDraft(), eventCost: "gratis" };
  assert.deepEqual(comunidadPriceFields(gratisDraft), { price: 0, is_free: true }, "free event must publish a free Leonix listing");

  console.log("OK: Leonix listing free rule holds for gratis/pagado/donacion");
}

// ---------------------------------------------------------------------------
// 2. Separate restrictions/no-bring field persists (write + round-trip read)
// ---------------------------------------------------------------------------
{
  const draft: ComunidadQuickDraft = {
    ...emptyComunidadQuickDraft(),
    bringNote: "Trae tu propia silla",
    restrictionsNote: "No se permiten mascotas ni alcohol",
  };
  // buildComunidadDetailPairs only returns the comunidad-specific subset (Gate 0 split the
  // common lane/kind pairs into the shared transport file) — prepend them here so
  // isCommunityQuickListing() recognizes this as a real published quick listing below.
  const detailPairs = [
    { label: "Leonix:communityLane", value: "quick" },
    { label: "Leonix:communityKind", value: "comunidad" },
    ...buildComunidadDetailPairs(draft),
  ];
  const restrictionsPair = detailPairs.find((p) => p.label === "Leonix:restrictionsNote");
  assert.equal(restrictionsPair?.value, "No se permiten mascotas ni alcohol", "restrictionsNote must be persisted as its own detail pair");

  const description = buildComunidadDescription(draft, "es");
  assert.ok(description.includes("No se permiten mascotas ni alcohol"), "restrictionsNote should also appear in the description fallback text");

  // Round-trip: published listing hydration must read it back.
  const published = comunidadPublishedQuickToDraft(
    detailPairs,
    {
      id: "listing-1",
      title: { es: "Feria", en: "Fair" },
      blurb: { es: description, en: description },
      city: "San José",
      images: [],
      contact_phone: null,
      contact_email: null,
    },
    "es",
  );
  assert.equal(published?.restrictionsNote, "No se permiten mascotas ni alcohol", "restrictionsNote must round-trip through comunidadPublishedQuickToDraft");

  // Legacy listing without the new key must not throw and must default to empty.
  const legacyPairs = pairs({ "Leonix:communityLane": "quick", "Leonix:communityKind": "comunidad" });
  const legacyPublished = comunidadPublishedQuickToDraft(
    legacyPairs,
    { id: "legacy-1", title: { es: "Viejo evento", en: "Old event" }, blurb: { es: "", en: "" }, city: "San José" },
    "es",
  );
  assert.equal(legacyPublished?.restrictionsNote, "", "legacy listings without Leonix:restrictionsNote must default to empty, not throw");

  console.log("OK: restrictionsNote persists, round-trips, and is legacy-safe");
}

// ---------------------------------------------------------------------------
// 3. "No estoy seguro" never renders as a positive public accessibility chip
// ---------------------------------------------------------------------------
{
  assert.equal(COMUNIDAD_ACCESSIBILITY_UNCERTAIN_VALUE, "no_seguro");

  // Mirror the exact filter used in ComunidadQuickAdCanvas.tsx and
  // comunidadLegacyDetailAdapter.ts — both must exclude the uncertain value.
  const canvasSource = readSource("app/(site)/publicar/comunidad/components/ComunidadQuickAdCanvas.tsx");
  assert.ok(
    canvasSource.includes("if (k === COMUNIDAD_ACCESSIBILITY_UNCERTAIN_VALUE) continue;"),
    "live canvas must skip the uncertain accessibility value before pushing public chips",
  );

  const legacySource = readSource("app/(site)/clasificados/comunidad/shared/comunidadLegacyDetailAdapter.ts");
  assert.ok(
    legacySource.includes("COMUNIDAD_ACCESSIBILITY_UNCERTAIN_VALUE"),
    "legacy adapter must also filter the uncertain accessibility value",
  );

  console.log('OK: "No estoy seguro" excluded from public positive accessibility chips (live + legacy)');
}

// ---------------------------------------------------------------------------
// 4. Raw form's only final action is Preview — no visible Save/Publish there
// ---------------------------------------------------------------------------
{
  const formSource = readSource("app/(site)/publicar/comunidad/quick/ComunidadQuickApplication.tsx");
  assert.ok(
    /showSecondaryActions=\{false\}/.test(formSource),
    "ComunidadQuickApplication must hide Publish/Save-draft on the raw form (showSecondaryActions={false})",
  );

  const finalStepSource = readSource("app/(site)/publicar/empleos/shared/components/EmpleosApplicationFinalStep.tsx");
  assert.ok(
    /showSecondaryActions\s*\?/.test(finalStepSource),
    "shared final-step component must gate the Publish/Save buttons behind showSecondaryActions",
  );
  assert.ok(
    /showSecondaryActions = true/.test(finalStepSource),
    "showSecondaryActions must default to true so every other caller (Empleos, Clases) is unaffected",
  );

  console.log("OK: raw form shows only Vista previa as the final action (Publish/Save gated, default-on elsewhere)");
}

// ---------------------------------------------------------------------------
// 5. No forced "preferred contact method" selector on the Comunidad form
// ---------------------------------------------------------------------------
{
  const formSource = readSource("app/(site)/publicar/comunidad/quick/ComunidadQuickApplication.tsx");
  assert.ok(
    /showPrimaryCtaSelector=\{false\}/.test(formSource),
    "Comunidad form must hide the preferred-primary-action selector",
  );
  const ctaGroupSource = readSource("app/(site)/publicar/empleos/shared/components/EmpleosCtaFieldGroup.tsx");
  assert.ok(
    /showPrimaryCtaSelector = true/.test(ctaGroupSource),
    "showPrimaryCtaSelector must default to true so Empleos/Clases keep their existing selector",
  );
  console.log("OK: Comunidad form has no forced preferred-contact selector; other callers unaffected");
}

// ---------------------------------------------------------------------------
// 6. Native share remains wired on the live published detail page
// ---------------------------------------------------------------------------
{
  const detailPageSource = readSource("app/(site)/clasificados/community/CommunityQuickPublishedDetailPage.tsx");
  assert.ok(
    detailPageSource.includes('typeof navigator !== "undefined"') && detailPageSource.includes(".share === \"function\""),
    "published detail page must still feature-detect and call the native navigator.share API",
  );
  console.log("OK: native share still wired on the live published detail page");
}

// ---------------------------------------------------------------------------
// 7. Date formatting avoids exposing a raw ISO fallback where avoidable
// ---------------------------------------------------------------------------
{
  const isoLike = /\b\d{4}-\d{2}-\d{2}\b/;
  const paidRow = row({
    detail_pairs: pairs({
      "Leonix:communityLane": "quick",
      "Leonix:communityKind": "comunidad",
      "Leonix:eventCost": "pagado",
      "Leonix:eventDate": "2026-09-01",
      "Leonix:eventEndDate": "2026-09-03",
    }),
    is_free: true,
  });
  const model = buildComunidadDiscoveryCardModel(paidRow, "es", "/anuncio/row-1");
  assert.ok(!isoLike.test(model.secondaryChip ?? ""), `result-card secondaryChip should not leak a raw ISO date, got: ${model.secondaryChip}`);

  const draft: ComunidadQuickDraft = {
    ...emptyComunidadQuickDraft(),
    date: "2026-09-01",
    eventEndDate: "2026-09-03",
  };
  const draftModel = buildComunidadDiscoveryCardModelFromDraft(draft, "es", "/preview");
  assert.ok(!isoLike.test(draftModel.secondaryChip ?? ""), `draft result-card secondaryChip should not leak a raw ISO date, got: ${draftModel.secondaryChip}`);

  console.log("OK: result-card date formatting avoids raw ISO fallback");
}

// ---------------------------------------------------------------------------
// 8. No duplicate country rendering in the shared location card
// ---------------------------------------------------------------------------
{
  const canvasSource = readSource("app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx");
  assert.ok(
    !/if \(country\) locationParts\.push\(country\);/.test(canvasSource),
    "country must no longer be folded into the city/region line (that caused the duplicate)",
  );
  const countryParagraphMatches = canvasSource.match(/\{country \? \(/g) ?? [];
  assert.equal(countryParagraphMatches.length, 1, "country should render on exactly one standalone line in the location card");
  console.log("OK: no duplicate country line in the shared location card");
}

// ---------------------------------------------------------------------------
// 9. No internal "tabla listings / bucket" wording in Comunidad customer copy
// ---------------------------------------------------------------------------
{
  const bannedTerms = [/tabla listings/i, /bucket/i, /supabase/i];
  const comunidadCopyText = JSON.stringify(COMUNIDAD_QUICK_COPY);
  for (const re of bannedTerms) {
    assert.ok(!re.test(comunidadCopyText), `Comunidad-owned copy must not contain internal wording matching ${re}`);
  }
  const formSource = readSource("app/(site)/publicar/comunidad/quick/ComunidadQuickApplication.tsx");
  assert.ok(formSource.includes("copy.finalStepIntro"), "Comunidad form must override the shared finalStep.intro with its own customer-facing copy");
  console.log("OK: no internal storage/table wording in Comunidad-owned copy; finalStep.intro overridden");
}

// ---------------------------------------------------------------------------
// 10. Result-card model still builds (row + draft variants)
// ---------------------------------------------------------------------------
{
  const okRow = row({ detail_pairs: pairs({ "Leonix:communityLane": "quick", "Leonix:communityKind": "comunidad", "Leonix:eventCategory": "feria" }) });
  const model = buildComunidadDiscoveryCardModel(okRow, "es", "/anuncio/row-1");
  assert.equal(model.id, "row-1");
  const draftModel = buildComunidadDiscoveryCardModelFromDraft(emptyComunidadQuickDraft(), "es", "/preview");
  assert.ok(draftModel.id.length > 0);
  console.log("OK: Comunidad result-card model builds for both row and draft variants");
}

// ---------------------------------------------------------------------------
// 11. Legacy Comunidad detail adapter still builds
// ---------------------------------------------------------------------------
{
  const legacyDetail = buildComunidadLegacyDetail(
    pairsMap({ "Leonix:eventCategory": "feria", "Leonix:eventCost": "gratis" }),
    "es",
    (raw) => raw,
  );
  assert.equal(legacyDetail.sectionTitle, "Detalle del evento");
  assert.ok(Array.isArray(legacyDetail.rows));
  console.log("OK: legacy Comunidad detail adapter builds");
}

console.log("gate-1-comunidad-eventos-qa-selftest: PASS");
