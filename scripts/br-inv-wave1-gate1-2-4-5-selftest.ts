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
      sotano: true, // no match -> customHighlightsText
      garaje: true, // no match -> customHighlightsText
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
  assert.match(negocio.customHighlightsText, /Sótano/, "A: unmatched highlight (sótano) must survive as free text");
  assert.match(negocio.customHighlightsText, /Garaje/, "A: unmatched highlight (garaje) must survive as free text");

  // D — video cap raised from 4 to 8
  assert.equal(negocio.media.externalVideoUrls?.length, 8, "D: all 8 video URLs must survive the publish mapper");

  // E — mostrarMarcaEnTarjeta honored even when marcaNombre is set
  assert.equal(negocio.trust.mostrarBrokerage, true, "E: brand shown when toggle is true and name is set");
  const sHidden = agente({ ...s, mostrarMarcaEnTarjeta: false });
  const negocioHidden = mapAgenteResidencialFormStateToNegocioForPublish(sHidden);
  assert.equal(
    negocioHidden.trust.mostrarBrokerage,
    false,
    "E: brand must be hidden when the agent explicitly disabled it, even though marcaNombre is set",
  );

  // Confirm the highlights and D-fixed fields actually render in the preview VM, not just the
  // intermediate state shape.
  const vm = mapBienesRaicesNegocioStateToPreviewVm(negocio);
  assert.ok(vm.highlightsRows.some((r) => r.value === "Alberca / piscina"), "A: matched highlight renders in preview");
  assert.ok(vm.highlightsRows.some((r) => r.value === "Sótano"), "A: unmatched highlight renders in preview as custom");
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

console.log("\nBR-INV-WAVE1 Gates 1/4/5 selftest: ALL OK");
