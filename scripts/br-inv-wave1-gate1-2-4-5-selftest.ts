/**
 * BR-INV-WAVE1 — behavioral self-test for Gates 1, 4, and 5 (data-integrity fixes).
 * No network, no Supabase, no browser. Run from repo root:
 *   npx tsx scripts/br-inv-wave1-gate1-2-4-5-selftest.ts
 *
 * Covers (see QA test-plan letters in the Wave 1 report):
 *   A/B/C — BR Negocio residential/commercial/land: every structured field + highlights survive
 *           the publish mapper (mapAgenteResidencialFormStateToNegocioForPublish).
 *   D     — BR Negocio: 8 external video URLs survive publish mapping (was capped at 4).
 *   E     — BR Negocio: mostrarMarcaEnTarjeta=false is honored even when marcaNombre is set.
 *   K     — Rentas garage (storage_parking): no bedroom/bath/year/condition rows, even when
 *           categoriaPropiedad is mismatched to "residencial".
 *   L     — Rentas room/shared: only relevant room rows, "Estacionamientos" correctly dropped.
 *   M/N   — Rentas office/land: category-appropriate fields present.
 *   O     — Rentas draft preview and published/live renderer produce identical row filtering for
 *           the same form state (the draft/live parity fix).
 *
 * Not covered here (require a browser — IndexedDB, sessionStorage, real file inputs — or manual
 * QA per the Wave 1 report's Gate 8 matrix): F/G (BR Privado device video UI absence),
 * H/I/J (photo IndexedDB round-trip through application -> preview -> edit -> refresh).
 */
import { strict as assert } from "node:assert";

import {
  createEmptyAgenteIndividualResidencialFormState,
  mergePartialAgenteIndividualResidencial,
  type AgenteIndividualResidencialFormState,
} from "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState";
import { mapAgenteResidencialFormStateToNegocioForPublish } from "../app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish";
import { mapBienesRaicesNegocioStateToPreviewVm } from "../app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm";
import {
  createEmptyRentasPrivadoFormState,
  type RentasPrivadoFormState,
} from "../app/(site)/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";
import {
  buildRentasFlowPropertyBodyRows,
  filterRentasLivePropertyRowsForFlow,
  rentasResidencialFormRowsMode,
  type RentasPublicListingFlowSlice,
} from "../app/(site)/clasificados/rentas/shared/rentasRentalTypeApply";
import { rentasRentalFlowGroupForTipo } from "../app/(site)/clasificados/rentas/shared/rentasRentalTypeTaxonomy";
import { mergeParentHubWithChildProperty } from "../app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioChildInventoryFormMapping";
import { createEmptyBrNegocioAdditionalInventoryPropertyDraft } from "../app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioAdditionalInventoryDraft";
import { mapAdditionalDraftToInventoryCard } from "../app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryCardModel";
import { buildOpenHouseSlotRows, buildPropertyDetailRows } from "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/lib/agenteResidencialPreviewFormat";
import {
  labelForSubtipo,
  residencialSubtipoSemanticKind,
  residencialSubtipoDisplayGroup,
} from "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteResidencialTipoMeta";
import {
  labelComercialSubtipo,
  labelTerrenoSubtipo,
  comercialSubtipoSemanticKind,
  terrenoSubtipoSemanticKind,
  terrenoSubtipoDisplayGroup,
} from "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteComercialTerrenoMeta";

function agente(overrides: Partial<AgenteIndividualResidencialFormState>): AgenteIndividualResidencialFormState {
  return mergePartialAgenteIndividualResidencial({
    ...createEmptyAgenteIndividualResidencialFormState(),
    ...overrides,
  });
}

/* ------------------------------------------------------------------------------------------ *
 * A — BR Negocio Residential: highlights (matched + unmatched) + core fields survive publish
 * ------------------------------------------------------------------------------------------ */
{
  const s = agente({
    categoriaPropiedad: "residencial",
    titulo: "Casa de prueba",
    precio: "500000",
    estacionamientos: "2",
    anoConstruccion: "1998",
    condicionPropiedad: "buena",
    marcaNombre: "Acme Realty",
    mostrarMarcaEnTarjeta: true,
    destacados: {
      piscina: true, // matches highlightPresets "piscina"
      // item 11 — sotano/garaje are now reconciled into BR_HIGHLIGHT_PRESET_DEFS too, so both
      // survive as structured presets rather than falling back to customHighlightsText.
      sotano: true,
      garaje: true,
    } as AgenteIndividualResidencialFormState["destacados"],
    videoUrls: [
      "https://example.com/v1",
      "https://example.com/v2",
      "https://example.com/v3",
      "https://example.com/v4",
      "https://example.com/v5",
      "https://example.com/v6",
      "https://example.com/v7",
      "https://example.com/v8",
    ],
  });
  const negocio = mapAgenteResidencialFormStateToNegocioForPublish(s);

  assert.equal(negocio.estacionamientos, "2", "A: estacionamientos must survive publish");
  assert.equal(negocio.anioConstruccion, "1998", "A: anioConstruccion must survive publish");
  assert.equal(negocio.condicion, "buena", "A: condicion must survive publish");
  assert.equal(negocio.highlightPresets.piscina, true, "A: matched highlight (piscina) must survive as a preset");
  assert.equal(negocio.highlightPresets.sotano, true, "item 11: sotano must survive as a reconciled preset, not free text");
  assert.equal(negocio.highlightPresets.garaje, true, "item 11: garaje must survive as a reconciled preset, not free text");
  assert.equal(negocio.customHighlightsText, "", "item 11: all 15 BR Negocio residential highlight ids now map to a canonical preset");

  // D — video cap raised from 4 to 8
  assert.equal(negocio.media.externalVideoUrls?.length, 8, "D: all 8 video URLs must survive the publish mapper");

  // E — item 104: brand visibility is purely content-driven; the mostrarMarcaEnTarjeta toggle
  // no longer has a live UI control (removed per the owner's "no redundant toggle" rule) and is
  // never honored as a suppression gate anywhere in the app — including here — because a legacy
  // draft stored with it false must not silently lose its brand block with no way to fix it.
  assert.equal(negocio.trust.mostrarBrokerage, true, "E: brand shown whenever marcaNombre is set");
  const sHidden = agente({ ...s, mostrarMarcaEnTarjeta: false });
  const negocioHidden = mapAgenteResidencialFormStateToNegocioForPublish(sHidden);
  assert.equal(
    negocioHidden.trust.mostrarBrokerage,
    true,
    "E: brand still shown even when the vestigial mostrarMarcaEnTarjeta field is false — content-driven, not toggle-gated",
  );

  // Confirm the highlights and D-fixed fields actually render in the preview VM, not just the
  // intermediate state shape.
  const vm = mapBienesRaicesNegocioStateToPreviewVm(negocio);
  assert.ok(vm.highlightsRows.some((r) => r.value === "Alberca / piscina"), "A: matched highlight renders in preview");
  assert.ok(vm.highlightsRows.some((r) => r.value === "Sótano"), "item 11: reconciled sotano preset renders in preview");
  assert.ok(vm.highlightsRows.some((r) => r.value === "Garaje"), "item 11: reconciled garaje preset renders in preview");
  assert.equal(vm.media.externalVideoLinks?.length, 8, "D: all 8 videos render as links in preview");

  console.log("Gate 1 (A/D/E — BR Negocio Residential) OK");
}

/* ------------------------------------------------------------------------------------------ *
 * B — BR Negocio Comercial: every commercial field + highlights survive publish
 * ------------------------------------------------------------------------------------------ */
{
  const s = agente({
    categoriaPropiedad: "comercial",
    titulo: "Oficina de prueba",
    precio: "3000",
    comercialUso: "Consultorio médico",
    comercialOficinas: "4",
    comercialNiveles: "2",
    comercialZonificacion: "C-2",
    comercialAccesoCarga: true,
    destacadosComercial: { recepcion: true } as AgenteIndividualResidencialFormState["destacadosComercial"],
  });
  const negocio = mapAgenteResidencialFormStateToNegocioForPublish(s);

  assert.match(negocio.deepDetails.tipoYEstilo.uso, /Consultorio médico/, "B: comercialUso must reach deepDetails");
  assert.match(negocio.deepDetails.interior.oficina, /4/, "B: comercialOficinas must reach deepDetails");
  assert.equal(negocio.niveles, "2", "B: comercialNiveles must reach the top-level niveles field");
  assert.match(negocio.deepDetails.observacionesAgente.observacionesPublicas, /Zonificación: C-2/, "B: comercialZonificacion must survive as a note");
  assert.match(negocio.deepDetails.observacionesAgente.observacionesPublicas, /Acceso de carga: Sí/, "B: comercialAccesoCarga must survive as a note");
  assert.match(negocio.customHighlightsText, /Recepción/, "B: commercial highlight must survive as free text");

  const vm = mapBienesRaicesNegocioStateToPreviewVm(negocio);
  assert.ok(vm.propertyDetailsRows.some((r) => r.label === "Uso" && /Consultorio médico/.test(r.value)), "B: Uso row renders");
  assert.ok(vm.highlightsRows.some((r) => r.value === "Recepción"), "B: commercial highlight renders in preview");

  console.log("Gate 1 (B — BR Negocio Comercial) OK");
}

/* ------------------------------------------------------------------------------------------ *
 * FINAL-04 — BR Negocio HOA: residential-only, survives publish + preview; absent for comercial/terreno
 * ------------------------------------------------------------------------------------------ */
{
  const s = agente({
    categoriaPropiedad: "residencial",
    titulo: "Condominio con HOA",
    precio: "400000",
    hasHoa: "yes",
    hoaFee: "250",
    hoaFrequency: "monthly",
    hoaIncludes: "Agua, jardinería, seguridad",
    communityRules: "No rentas de corto plazo",
    petRules: "Máximo 2 mascotas",
    rentalRestrictions: "Mínimo 6 meses",
    shortTermRentalAllowed: "no",
    parkingRules: "1 espacio asignado",
  });
  const negocio = mapAgenteResidencialFormStateToNegocioForPublish(s);
  assert.equal(negocio.gate12d.hasHoa, "yes", "FINAL-04: hasHoa must survive publish");
  assert.equal(negocio.gate12d.hoaFee, "250", "FINAL-04: hoaFee must survive publish");
  assert.equal(negocio.gate12d.hoaFrequency, "monthly", "FINAL-04: hoaFrequency must survive publish");
  assert.equal(negocio.gate12d.communityRules, "No rentas de corto plazo", "FINAL-04: communityRules must survive");
  assert.equal(negocio.gate12d.parkingRules, "1 espacio asignado", "FINAL-04: parkingRules must survive");

  const vm = mapBienesRaicesNegocioStateToPreviewVm(negocio);
  assert.ok(vm.hoaCommunityCard && vm.hoaCommunityCard.rows.length > 0, "FINAL-04: HOA card must render for residential");

  // HOA must NOT leak into comercial/terreno — semantically wrong per the product decision.
  const sComercial = agente({
    categoriaPropiedad: "comercial",
    titulo: "Oficina",
    precio: "3000",
    hasHoa: "yes",
    hoaFee: "250",
  });
  const negocioComercial = mapAgenteResidencialFormStateToNegocioForPublish(sComercial);
  assert.equal(negocioComercial.gate12d.hasHoa, "", "FINAL-04: HOA must NOT be forwarded for comercial category");

  console.log("Item 4 (BR Negocio HOA — residential-only) OK");
}

/* ------------------------------------------------------------------------------------------ *
 * FINAL-04-CHILD — BR Inventory child property: HOA is child-owned (not inherited from parent
 * hub identity) and survives the same publish mapper the parent uses, end to end.
 * ------------------------------------------------------------------------------------------ */
{
  const parentHub = agente({
    categoriaPropiedad: "residencial",
    titulo: "Hub del agente (no debe verse en el hijo)",
    marcaNombre: "Acme Realty",
    // Parent explicitly has NO HOA — proves the child's HOA isn't leaking from a shared default.
    hasHoa: "",
    hoaFee: "",
  });
  const childProperty = {
    categoriaPropiedad: "residencial" as const,
    titulo: "Unidad 204 — Condominio del inventario",
    precio: "310000",
    hasHoa: "yes" as const,
    hoaFee: "180",
    hoaFrequency: "monthly" as const,
    communityRules: "No mascotas mayores a 25 lbs",
    shortTermRentalAllowed: "no" as const,
    parkingRules: "1 espacio numerado",
  };
  const childState = mergeParentHubWithChildProperty(parentHub, childProperty);

  // Child owns its own HOA facts, distinct from (and not blocked by) the parent's empty HOA.
  assert.equal(childState.hasHoa, "yes", "FINAL-04-CHILD: child hasHoa must come from the child, not the parent");
  assert.equal(childState.hoaFee, "180", "FINAL-04-CHILD: child hoaFee must survive the parent/child merge");
  assert.equal(childState.titulo, childProperty.titulo, "FINAL-04-CHILD: child title must win over parent hub title");
  // Parent identity (brand) is still inherited, proving this is a merge, not a wholesale replace.
  assert.equal(childState.marcaNombre, "Acme Realty", "FINAL-04-CHILD: parent identity fields must still be inherited");

  const negocioChild = mapAgenteResidencialFormStateToNegocioForPublish(childState);
  assert.equal(negocioChild.gate12d.hasHoa, "yes", "FINAL-04-CHILD: child HOA must survive the shared publish mapper");
  assert.equal(negocioChild.gate12d.hoaFee, "180", "FINAL-04-CHILD: child hoaFee must survive publish");
  assert.equal(
    negocioChild.gate12d.communityRules,
    "No mascotas mayores a 25 lbs",
    "FINAL-04-CHILD: child communityRules must survive publish",
  );

  const vmChild = mapBienesRaicesNegocioStateToPreviewVm(negocioChild);
  assert.ok(
    vmChild.hoaCommunityCard && vmChild.hoaCommunityCard.rows.length > 0,
    "FINAL-04-CHILD: HOA card must render for a published child property",
  );

  console.log("Item 4 (BR Inventory child HOA — owned by child, survives publish) OK");
}

/* ------------------------------------------------------------------------------------------ *
 * FINAL-34 — BR Inventory checkpoint card: a child draft whose title/price/city only exist under
 * propertyForm (never mirrored to the flat legacy fields) must still display real values, not
 * "Sin título" / "Precio pendiente" / a bare country placeholder.
 * ------------------------------------------------------------------------------------------ */
{
  const draft = {
    ...createEmptyBrNegocioAdditionalInventoryPropertyDraft("child-final-34"),
    // Flat fields intentionally left blank — simulates a draft saved by a path that only wrote
    // propertyForm (e.g. an interrupted save, or a pre-flat-sync legacy draft).
    propertyForm: {
      titulo: "Unidad 12B — Torre Vista",
      precio: "225000",
      ciudad: "San Jose",
      direccionEstado: "CA",
      direccionCodigoPostal: "95112",
      direccionPais: "United States",
    },
  };
  const card = mapAdditionalDraftToInventoryCard(draft as never, "es");
  assert.equal(card.title, "Unidad 12B — Torre Vista", "FINAL-34: card title must read from propertyForm when flat title is blank");
  assert.match(card.priceDisplay, /225,000|225000/, "FINAL-34: card price must read from propertyForm when flat price is blank");
  assert.match(card.cityState, /San Jose/, "FINAL-34: card location must read from propertyForm when flat city is blank");
  assert.ok(!card.title.includes("Sin título"), "FINAL-34: must not fall back to the empty-title placeholder when real data exists");
  assert.ok(!card.priceDisplay.includes("pendiente"), "FINAL-34: must not fall back to the pending-price placeholder when real data exists");

  console.log("Item 34 (BR Inventory child card — reads propertyForm when flat fields are blank) OK");
}

/* ------------------------------------------------------------------------------------------ *
 * FINAL-05 — BR Negocio Open House: structured per-slot rows instead of one joined text blob.
 * ------------------------------------------------------------------------------------------ */
{
  const s = agente({
    openHouseSlots: [
      { fecha: "2026-09-05", fechaFin: "", inicio: "10:00 AM", fin: "1:00 PM", diasHorariosAdicionales: "", notas: "Solo con cita" },
      { fecha: "2026-09-06", fechaFin: "", inicio: "2:00 PM", fin: "4:00 PM", diasHorariosAdicionales: "", notas: "" },
    ],
  });
  const rows = buildOpenHouseSlotRows(s, "es");
  assert.equal(rows.length, 2, "FINAL-05: one row-set per open house slot");
  assert.ok(rows[0].some((r) => r.label === "Fecha" && r.value.length > 0), "FINAL-05: slot 1 has a structured Fecha row");
  assert.ok(rows[0].some((r) => r.label === "Horario" && r.value === "10:00 AM – 1:00 PM"), "FINAL-05: slot 1 has a structured Horario row");
  assert.ok(rows[0].some((r) => r.label === "Notas" && r.value === "Solo con cita"), "FINAL-05: slot 1 has a structured Notas row");
  assert.ok(!rows[1].some((r) => r.label === "Notas"), "FINAL-05: slot 2 has no Notas row (sparse, no joined blob padding)");
  assert.ok(
    rows.every((slotRows) => slotRows.every((r) => !r.value.includes("\n"))),
    "FINAL-05: rows are structured facts, never a single joined multi-line blob",
  );

  console.log("Item 5 (BR Negocio Open House — structured per-slot rows, not a text blob) OK");
}

/* ------------------------------------------------------------------------------------------ *
 * C — BR Negocio Terreno/Lote: every land field + highlights survive publish
 * ------------------------------------------------------------------------------------------ */
{
  const s = agente({
    categoriaPropiedad: "terreno_lote",
    titulo: "Terreno de prueba",
    precio: "150000",
    terrenoUsoZonificacion: "Uso mixto",
    terrenoAcceso: "Camino pavimentado",
    terrenoServicios: "Agua, luz, alcantarillado",
    terrenoTopografia: "Plano",
    terrenoListoConstruir: true,
    terrenoCercado: true,
    destacadosTerreno: { pozo: true } as AgenteIndividualResidencialFormState["destacadosTerreno"],
  });
  const negocio = mapAgenteResidencialFormStateToNegocioForPublish(s);

  assert.equal(negocio.deepDetails.loteTerreno.usoSuelo, "Uso mixto", "C: terrenoUsoZonificacion -> usoSuelo");
  assert.equal(negocio.deepDetails.loteTerreno.zonificacion, "Uso mixto", "C: terrenoUsoZonificacion -> zonificacion");
  assert.equal(negocio.deepDetails.loteTerreno.topografia, "Plano", "C: terrenoTopografia must survive");
  assert.equal(negocio.deepDetails.utilidades.agua, "Agua, luz, alcantarillado", "C: terrenoServicios must survive");
  assert.match(negocio.deepDetails.observacionesAgente.observacionesPublicas, /Acceso: Camino pavimentado/, "C: terrenoAcceso must survive as a note");
  assert.match(negocio.deepDetails.observacionesAgente.observacionesPublicas, /Listo para construir: Sí/, "C: terrenoListoConstruir must survive");
  assert.match(negocio.deepDetails.observacionesAgente.observacionesPublicas, /Cercado: Sí/, "C: terrenoCercado must survive");
  assert.match(negocio.customHighlightsText, /Pozo/, "C: land highlight must survive as free text");

  const vm = mapBienesRaicesNegocioStateToPreviewVm(negocio);
  assert.ok(vm.propertyDetailsRows.some((r) => r.label === "Uso de suelo" && r.value === "Uso mixto"), "C: Uso de suelo row renders");
  assert.ok(vm.highlightsRows.some((r) => r.value === "Pozo"), "C: land highlight renders in preview");

  console.log("Gate 1 (C — BR Negocio Terreno) OK");
}

/* ------------------------------------------------------------------------------------------ *
 * Gate 4 — Rentas tipoDeRenta / categoriaPropiedad desync
 * ------------------------------------------------------------------------------------------ */
{
  // K — storage_parking must hide the full residential block, even when categoriaPropiedad is
  // mismatched to "residencial" (the exact bug scenario from the audit).
  assert.equal(rentasResidencialFormRowsMode("storage_parking"), "none", "K: storage_parking must be none");
  // The originally-confirmed gap: commercial_space/land_parcel previously fell through to
  // "full_legacy" (the full bedroom/bath/lot/year/condition block) instead of "none".
  assert.equal(rentasResidencialFormRowsMode("commercial_space"), "none", "Gate 4: commercial_space must now be none");
  assert.equal(rentasResidencialFormRowsMode("land_parcel"), "none", "Gate 4: land_parcel must now be none");
  // Sanity: full_housing/room_shared/unset must be unaffected by this fix.
  assert.equal(rentasResidencialFormRowsMode("full_housing"), "full_legacy");
  assert.equal(rentasResidencialFormRowsMode("room_shared"), "room_partial");
  assert.equal(rentasResidencialFormRowsMode("unset"), "full_legacy");

  console.log("Gate 4 (tipoDeRenta / categoriaPropiedad desync) OK");
}

/* ------------------------------------------------------------------------------------------ *
 * Gate 5 — label-mismatch fix + draft/live row-filter parity
 * ------------------------------------------------------------------------------------------ */
function rentasSlice(overrides: Partial<RentasPrivadoFormState>): RentasPrivadoFormState {
  return { ...createEmptyRentasPrivadoFormState(), ...overrides };
}

{
  // L — room_shared: "Estacionamientos" (the actual generated label) must now be correctly
  // dropped, and only room-relevant rows should remain alongside the base residential rows.
  const s = rentasSlice({
    tipoDeRenta: "cuarto_recamara",
    categoriaPropiedad: "residencial",
    residencial: {
      ...createEmptyRentasPrivadoFormState().residencial,
      estacionamiento: "1 espacio",
      recamaras: "1",
    },
    rentasEspacioTipoBano: "privado",
  });
  const draftRows = buildRentasFlowPropertyBodyRows(s);
  assert.ok(!draftRows.some((r) => r.label === "Estacionamientos"), "L: Estacionamientos row must be dropped for room_shared");
  assert.ok(!draftRows.some((r) => r.label === "Recámaras"), "L: Recámaras must be dropped for room_shared");
  assert.ok(draftRows.some((r) => r.label === "Tipo de baño"), "L: room-specific field must render");

  console.log("Gate 5 (L — Estacionamientos label-mismatch fix) OK");
}

{
  // M/N — office (commercial_space) and land (land_parcel) get category-appropriate fields.
  const office = rentasSlice({
    tipoDeRenta: "oficina",
    categoriaPropiedad: "comercial",
    rentasComercialUsoPermitido: "Oficinas profesionales",
  });
  const officeRows = buildRentasFlowPropertyBodyRows(office);
  assert.ok(officeRows.some((r) => r.label === "Uso permitido" && r.value === "Oficinas profesionales"), "M: office gets commercial fields");
  assert.ok(!officeRows.some((r) => r.label === "Recámaras"), "M: office must not show residential bedroom field");

  const land = rentasSlice({
    tipoDeRenta: "terreno_lote",
    categoriaPropiedad: "terreno_lote",
    rentasLoteUsoPermitido: "Agrícola",
  });
  const landRows = buildRentasFlowPropertyBodyRows(land);
  assert.ok(landRows.some((r) => r.label === "Uso permitido" && r.value === "Agrícola"), "N: land gets land-specific fields");

  console.log("Gate 5 (M/N — office/land category-appropriate fields) OK");
}

{
  // O — draft preview and published/live renderer must agree on what to drop for the SAME
  // flow-group/category combination. Previously comercial/terreno drafts were completely
  // unfiltered while the live renderer applied extra drops (e.g. a bare "Subtipo" row) — a
  // seller filling out a comercial listing would see a "Subtipo" row in their own draft preview
  // that then silently vanished on the live listing. This proves that gap is closed: the draft
  // path (buildRentasFlowPropertyBodyRows) must no longer emit any row the live path
  // (filterRentasLivePropertyRowsForFlow) would have dropped for an equivalent listing.
  const commercialState = rentasSlice({
    tipoDeRenta: "oficina",
    categoriaPropiedad: "comercial",
    comercial: { ...createEmptyRentasPrivadoFormState().comercial, tipoCodigo: "oficina", subtipo: "planta_abierta" },
  });
  const commercialDraftRows = buildRentasFlowPropertyBodyRows(commercialState);
  assert.ok(
    !commercialDraftRows.some((r) => r.label === "Subtipo"),
    "O: comercial draft preview must not show a 'Subtipo' row the live listing would drop",
  );
  const commercialListing: RentasPublicListingFlowSlice = {
    categoriaPropiedad: "comercial",
    rentalTypeCode: "oficina",
    beds: "",
    baths: "",
    sqft: "",
  };
  const commercialLiveRows = filterRentasLivePropertyRowsForFlow(commercialListing, [
    { label: "Subtipo", value: "Planta abierta" },
    { label: "Uso", value: "Consultorio" },
  ]);
  assert.ok(!commercialLiveRows.some((r) => r.label === "Subtipo"), "O: live renderer drops Subtipo for commercial_space (unchanged baseline)");
  assert.ok(commercialLiveRows.some((r) => r.label === "Uso"), "O: live renderer keeps unrelated rows");

  const landState = rentasSlice({
    tipoDeRenta: "terreno_lote",
    categoriaPropiedad: "terreno_lote",
    terreno: { ...createEmptyRentasPrivadoFormState().terreno, tipoCodigo: "lote_residencial", subtipo: "esquina" },
  });
  const landDraftRows = buildRentasFlowPropertyBodyRows(landState);
  assert.ok(
    !landDraftRows.some((r) => r.label === "Subtipo"),
    "O: terreno draft preview must not show a 'Subtipo' row the live listing would drop",
  );

  console.log("Gate 5 (O — draft/live preview parity) OK");
}

/* ------------------------------------------------------------------------------------------ *
 * FINAL-12 — type/subtype semantic reclassification: every legacy stored subtipo value still
 * resolves to a label (no destructive rename), and the new display-group classifier correctly
 * separates true subtypes from structural/location/access characteristics.
 * ------------------------------------------------------------------------------------------ */
{
  // Legacy values still resolve to a non-empty label — proves no destructive rename.
  assert.equal(labelForSubtipo("casa", "un_piso"), "Un solo piso", "FINAL-12: legacy 'un_piso' still resolves");
  assert.equal(labelForSubtipo("townhome", "esquina"), "En esquina", "FINAL-12: legacy 'esquina' (residential) still resolves");
  assert.equal(labelComercialSubtipo("nave_industrial", "muelle"), "Muelle de carga", "FINAL-12: legacy 'muelle' still resolves");
  assert.equal(labelTerrenoSubtipo("lote_residencial", "cul_de_sac"), "Calle sin salida", "FINAL-12: legacy 'cul_de_sac' still resolves");
  assert.equal(labelTerrenoSubtipo("lote_residencial", "esquina"), "En esquina", "FINAL-12: legacy 'esquina' (terreno) still resolves");

  // Semantic classification: structural/location/access attributes are no longer "subtype".
  assert.equal(residencialSubtipoSemanticKind("un_piso"), "story_count", "FINAL-12: un_piso classified as story_count");
  assert.equal(residencialSubtipoSemanticKind("esquina"), "corner_lot", "FINAL-12: esquina (residential) classified as corner_lot");
  assert.equal(residencialSubtipoSemanticKind("duplex"), "subtype", "FINAL-12: duplex remains a true subtype");
  assert.equal(comercialSubtipoSemanticKind("muelle"), "access_loading", "FINAL-12: muelle classified as access_loading");
  assert.equal(comercialSubtipoSemanticKind("pb_comercio"), "zoning_use", "FINAL-12: pb_comercio classified as zoning_use");
  assert.equal(comercialSubtipoSemanticKind("suite"), "subtype", "FINAL-12: suite remains a true commercial subtype");
  assert.equal(terrenoSubtipoSemanticKind("esquina"), "lot_access", "FINAL-12: esquina (terreno) classified as lot_access");
  assert.equal(terrenoSubtipoSemanticKind("cul_de_sac"), "lot_access", "FINAL-12: cul_de_sac classified as lot_access");
  assert.equal(terrenoSubtipoSemanticKind("con_casa"), "subtype", "FINAL-12: con_casa remains a true terreno subtype");

  // Display-group labels are accurate, not the generic "Subtipo", for reclassified values.
  assert.equal(residencialSubtipoDisplayGroup("esquina", "es"), "Característica del lote", "FINAL-12: corner lot row title (es)");
  assert.equal(residencialSubtipoDisplayGroup("esquina", "en"), "Lot characteristic", "FINAL-12: corner lot row title (en)");
  assert.equal(residencialSubtipoDisplayGroup("duplex", "es"), "Subtipo", "FINAL-12: true subtype keeps 'Subtipo' row title");
  assert.equal(terrenoSubtipoDisplayGroup("cul_de_sac", "en"), "Lot characteristic", "FINAL-12: cul-de-sac row title (en)");

  // End-to-end: BR Negocio's live preview (AgenteIndividualResidencialPreviewPage.tsx) reads
  // buildPropertyDetailRows() directly off AgenteIndividualResidencialFormState — verify it
  // splits the corner-lot fact out of the type line into its own accurately-labeled row, while
  // the type line itself no longer implies corner lot is a distinct townhome subtype.
  const cornerTownhome = agente({
    categoriaPropiedad: "residencial",
    tipoPropiedadCodigo: "townhome",
    subtipoPropiedad: "esquina",
  });
  const cornerRows = buildPropertyDetailRows(cornerTownhome, "es");
  assert.ok(
    cornerRows.some((r) => r.label === "Característica del lote" && r.value === "En esquina"),
    "FINAL-12: corner-lot fact renders as its own row, not folded into 'Tipo de propiedad'",
  );
  assert.ok(
    !cornerRows.some((r) => r.label === "Tipo de propiedad" && r.value.includes("esquina")),
    "FINAL-12: 'Tipo de propiedad' row no longer implies corner lot is a distinct townhome subtype",
  );

  // A true subtype (duplex) still folds into the type line as before — no regression.
  const duplexHouse = agente({
    categoriaPropiedad: "residencial",
    tipoPropiedadCodigo: "casa",
    subtipoPropiedad: "duplex",
  });
  const duplexRows = buildPropertyDetailRows(duplexHouse, "es");
  assert.ok(
    duplexRows.some((r) => r.label === "Tipo de propiedad" && r.value.includes("Dúplex")),
    "FINAL-12: true subtype (duplex) still folds into the type line, unchanged",
  );
  assert.ok(
    !duplexRows.some((r) => r.label !== "Tipo de propiedad" && r.value === "Dúplex / pareado"),
    "FINAL-12: true subtype does not get a spurious extra characteristic row",
  );

  console.log("Item 12 (type/subtype semantic reclassification — compatibility-safe) OK");
}

console.log("\nBR-INV-WAVE1 Gates 1/4/5 selftest: ALL OK");
