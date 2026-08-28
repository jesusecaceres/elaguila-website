/**
 * Gate 0B — Community results/search isolation self-test.
 *
 * Pins that the category-owned result/search/legacy-detail extraction done in
 * Gate 0B produces the same output the old inline `if (category === ...)`
 * branches used to produce, for both Comunidad and Clases:
 *   1. Comunidad result-card model generation (row + draft variants)
 *   2. Clases result-card model generation (row + draft variants)
 *   3. Comunidad search-blob generation (known searchable terms present)
 *   4. Clases search-blob generation (known searchable terms present)
 *   5. Legacy detail adapter dispatch (rows/title/chip per category)
 *
 * No network, no React, no Supabase. Run from repo root:
 *   npx tsx scripts/gate-0b-community-results-isolation-selftest.ts
 */
import { strict as assert } from "node:assert";

import {
  buildComunidadDiscoveryCardModel,
  buildComunidadDiscoveryCardModelFromDraft,
} from "../app/(site)/clasificados/comunidad/shared/comunidadDiscoveryCardModel";
import {
  buildClasesDiscoveryCardModel,
  buildClasesDiscoveryCardModelFromDraft,
} from "../app/(site)/clasificados/clases/shared/clasesDiscoveryCardModel";
import { buildCommunityDiscoverySearchBlob } from "../app/(site)/clasificados/community/shared/communityDiscoveryListingCardModel";
import type { CommunityListingBrowseRow } from "../app/(site)/clasificados/community/shared/communityListingsBrowseClient";
import { buildComunidadLegacyDetail } from "../app/(site)/clasificados/comunidad/shared/comunidadLegacyDetailAdapter";
import { buildClasesLegacyDetail } from "../app/(site)/clasificados/clases/shared/clasesLegacyDetailAdapter";
import {
  emptyComunidadQuickDraft,
  emptyClasesQuickDraft,
  type ComunidadQuickDraft,
  type ClasesQuickDraft,
} from "../app/(site)/publicar/community/shared/types/communityQuickDraft";

function pairs(entries: Record<string, string>): { label: string; value: string }[] {
  return Object.entries(entries).map(([label, value]) => ({ label, value }));
}

function row(overrides: Partial<CommunityListingBrowseRow>): CommunityListingBrowseRow {
  return {
    id: "row-1",
    title: "Sample listing",
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

// ---------------------------------------------------------------------------
// 1 & 3. Comunidad result model + search blob
// ---------------------------------------------------------------------------
{
  const comunidadPairs = pairs({
    "Leonix:communityLane": "quick",
    "Leonix:communityKind": "comunidad",
    "Leonix:organizer": "Iglesia San Jose",
    "Leonix:eventCategory": "feria",
    "Leonix:eventCost": "gratis",
    "Leonix:eventDate": "2026-09-01",
    "Leonix:state": "CA",
    "Leonix:zip": "95110",
  });
  const comunidadRow = row({ detail_pairs: comunidadPairs, is_free: true });
  const model = buildComunidadDiscoveryCardModel(comunidadRow, "es", "/clasificados/anuncio/row-1");
  assert.equal(model.id, "row-1");
  assert.equal(model.typeChip, "Feria", `expected Comunidad type chip "Feria", got ${model.typeChip}`);
  assert.equal(model.costBadge, "Gratis", `expected Gratis cost badge, got ${model.costBadge}`);
  assert.ok(model.locationLine.includes("San Jos"), "comunidad locationLine should include city");

  const blob = buildCommunityDiscoverySearchBlob(comunidadRow, "comunidad", Object.fromEntries(comunidadPairs.map((p) => [p.label, p.value])), "es");
  assert.ok(blob.includes("feria"), `comunidad search blob missing known term "feria": ${blob}`);
  assert.ok(blob.includes("iglesia san jose"), `comunidad search blob missing organizer term: ${blob}`);

  const draft: ComunidadQuickDraft = {
    ...emptyComunidadQuickDraft(),
    title: "Feria Comunitaria",
    category: "feria",
    eventCost: "gratis",
    publicCity: "San José",
  };
  const draftModel = buildComunidadDiscoveryCardModelFromDraft(draft, "es", "/preview");
  assert.equal(draftModel.title, "Feria Comunitaria");
  assert.equal(draftModel.typeChip, "Feria", `expected draft type chip "Feria", got ${draftModel.typeChip}`);

  console.log("OK: Comunidad result model + search blob generation");
}

// ---------------------------------------------------------------------------
// 2 & 4. Clases result model + search blob
// ---------------------------------------------------------------------------
{
  const clasesPairs = pairs({
    "Leonix:communityLane": "quick",
    "Leonix:communityKind": "clases",
    "Leonix:organizer": "Instructor Yoga",
    "Leonix:classCategory": "yoga",
    "Leonix:classCostType": "gratis",
    "Leonix:skillLevel": "principiante",
    "Leonix:mode": "presencial",
    "Leonix:state": "CA",
    "Leonix:zip": "95112",
  });
  const clasesRow = row({ detail_pairs: clasesPairs, is_free: true });
  const model = buildClasesDiscoveryCardModel(clasesRow, "es", "/clasificados/anuncio/row-2");
  assert.equal(model.typeChip, "Yoga", `expected Clases type chip "Yoga", got ${model.typeChip}`);
  assert.equal(model.costBadge, "Gratis", `expected Gratis cost badge, got ${model.costBadge}`);
  assert.ok(model.secondaryChip?.includes("Principiante"), `expected level in secondaryChip: ${model.secondaryChip}`);

  const blob = buildCommunityDiscoverySearchBlob(clasesRow, "clases", Object.fromEntries(clasesPairs.map((p) => [p.label, p.value])), "es");
  assert.ok(blob.includes("yoga"), `clases search blob missing known term "yoga": ${blob}`);
  assert.ok(blob.includes("principiante"), `clases search blob missing known skill-level term: ${blob}`);
  assert.ok(blob.includes("instructor yoga"), `clases search blob missing organizer term: ${blob}`);

  const draft: ClasesQuickDraft = {
    ...emptyClasesQuickDraft(),
    title: "Yoga para todos",
    category: "yoga",
    classCostType: "gratis",
    skillLevel: "principiante",
    publicCity: "San José",
  };
  const draftModel = buildClasesDiscoveryCardModelFromDraft(draft, "es", "/preview");
  assert.equal(draftModel.title, "Yoga para todos");
  assert.equal(draftModel.typeChip, "Yoga", `expected draft type chip "Yoga", got ${draftModel.typeChip}`);

  console.log("OK: Clases result model + search blob generation");
}

// ---------------------------------------------------------------------------
// 5. Legacy detail adapter dispatch
// ---------------------------------------------------------------------------
{
  const comunidadPairs = Object.fromEntries(
    pairs({
      "Leonix:eventCategory": "festival",
      "Leonix:eventCost": "pagado",
      "Leonix:eventDate": "2026-10-01",
      "Leonix:admissionNote": "5",
    }).map((p) => [p.label, p.value]),
  );
  const comunidadDetail = buildComunidadLegacyDetail(comunidadPairs, "es", (raw) => (/^\d/.test(raw) ? `$${raw}` : raw));
  assert.equal(comunidadDetail.sectionTitle, "Detalle del evento");
  assert.equal(comunidadDetail.categoryChipLabel, "Comunidad y Eventos");
  const admissionRow = comunidadDetail.rows.find((r) => r.label === "Admisión");
  assert.equal(admissionRow?.value, "$5", `expected $-prefixed admission, got ${admissionRow?.value}`);

  const clasesPairs = Object.fromEntries(
    pairs({
      "Leonix:classCategory": "boxeo",
      "Leonix:mode": "presencial",
      "Leonix:classCostType": "pagada",
      "Leonix:priceAmount": "$20",
      "Leonix:priceFrequency": "porClase",
    }).map((p) => [p.label, p.value]),
  );
  const clasesDetail = buildClasesLegacyDetail(clasesPairs, "es");
  assert.equal(clasesDetail.sectionTitle, "Detalle de la clase");
  assert.equal(clasesDetail.categoryChipLabel, "Clases");
  const priceRow = clasesDetail.rows.find((r) => r.label === "Precio");
  assert.ok(priceRow?.value.includes("$20"), `expected price row to include $20, got ${priceRow?.value}`);

  console.log("OK: legacy detail adapter dispatch (comunidad + clases)");
}

console.log("gate-0b-community-results-isolation-selftest: PASS");
