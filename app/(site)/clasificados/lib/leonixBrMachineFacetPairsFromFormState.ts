/**
 * BR publish: structured facets → `detail_pairs` machine keys (`Leonix:*`).
 * Consumed by `mergeLeonixListingContractDetailPairs` + `parseLeonixMachineFacetRead`.
 */

import type {
  BienesRaicesPrivadoFormState,
  BrPrivadoListingStatus,
} from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import type { BienesRaicesNegocioFormState } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState";
import type { RentasPrivadoFormState } from "@/app/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";
import { mergePartialBienesRaicesPrivadoState } from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import type { BrResultsPropertyKind } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import {
  LEONIX_DP_BATHROOMS_COUNT,
  LEONIX_DP_BEDROOMS_COUNT,
  LEONIX_DP_FURNISHED,
  LEONIX_DP_PARKING_SPOTS,
  LEONIX_DP_PETS_ALLOWED,
  LEONIX_DP_POOL,
  LEONIX_DP_POSTAL_CODE,
  LEONIX_DP_PROPERTY_SUBTYPE,
  LEONIX_DP_RESULTS_PROPERTY_KIND,
} from "@/app/clasificados/lib/leonixRealEstateListingContract";

function push(out: Array<{ label: string; value: string }>, label: string, value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) return;
  const v = typeof value === "boolean" ? (value ? "true" : "false") : typeof value === "number" ? String(value) : String(value).trim();
  if (!v) return;
  out.push({ label, value: v });
}

function parseNonNegInt(raw: string): number | null {
  const n = parseInt(String(raw ?? "").replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseNonNegNumber(raw: string): number | null {
  const n = Number(String(raw ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseAmuebladoNegocio(raw: string): boolean | null {
  const t = String(raw ?? "").trim().toLowerCase();
  if (!t) return null;
  if (/^(si|sí|yes|amuebl|furnish|full\s*y\s*amuebl)/i.test(t)) return true;
  if (/^(no|sin|unfurnish|vac[ií]o|semi)/i.test(t)) return false;
  return null;
}

export function inferBrResultsPropertyKindPrivado(state: BienesRaicesPrivadoFormState): BrResultsPropertyKind {
  if (state.categoriaPropiedad === "terreno_lote") return "terreno";
  if (state.categoriaPropiedad === "comercial") return "comercial";
  const tipo = state.residencial.tipoCodigo;
  if (tipo === "apartamento" || tipo === "condominio" || tipo === "multifamiliar") return "departamento";
  return "casa";
}

export function inferBrResultsPropertyKindNegocio(state: BienesRaicesNegocioFormState): BrResultsPropertyKind {
  if (state.publicationType === "terreno") return "terreno";
  if (state.publicationType === "comercial") return "comercial";
  const t = String(state.tipoPropiedad ?? "").toLowerCase();
  if (/departamento|condominio|loft|penthouse|ph\b|multifamiliar|unidad/i.test(t)) return "departamento";
  if (/casa|town|dúplex|duplex|villa|hogar|residencia/i.test(t)) return "casa";
  return "casa";
}

/** Rentas Privado shares BR residencial/comercial/terreno facets — reuse BR machine builder. */
export function buildLeonixMachineFacetPairsFromRentasPrivadoFormState(
  state: RentasPrivadoFormState,
): Array<{ label: string; value: string }> {
  const br = mergePartialBienesRaicesPrivadoState({
    categoriaPropiedad: state.categoriaPropiedad,
    titulo: state.titulo,
    precio: state.rentaMensual,
    ciudad: state.ciudad,
    ubicacionLinea: state.ubicacionLinea,
    enlaceMapa: state.enlaceMapa,
    descripcion: state.descripcion,
    estadoAnuncio: ((): BrPrivadoListingStatus | undefined => {
      if (state.estadoAnuncio === "rentado") return "vendido";
      if (state.estadoAnuncio === "disponible" || state.estadoAnuncio === "pendiente" || state.estadoAnuncio === "bajo_contrato") {
        return state.estadoAnuncio as BrPrivadoListingStatus;
      }
      return undefined;
    })(),
    media: state.media,
    seller: { ...state.seller, etiquetaRol: "" },
    residencial: state.residencial,
    comercial: state.comercial,
    terreno: state.terreno,
    petsAllowed:
      state.mascotas === "permitidas" ? "yes" : state.mascotas === "no_permitidas" ? "no" : "",
  });
  return buildLeonixMachineFacetPairsFromBienesRaicesPrivadoState(br);
}

export function buildLeonixMachineFacetPairsFromBienesRaicesPrivadoState(
  state: BienesRaicesPrivadoFormState,
): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = [];
  const rk = inferBrResultsPropertyKindPrivado(state);
  push(out, LEONIX_DP_RESULTS_PROPERTY_KIND, rk);
  const cat = state.categoriaPropiedad;

  if (cat === "residencial") {
    push(out, LEONIX_DP_PROPERTY_SUBTYPE, state.residencial.tipoCodigo);
    const beds = parseNonNegInt(state.residencial.recamaras);
    if (beds != null) push(out, LEONIX_DP_BEDROOMS_COUNT, beds);
    const fullB = parseNonNegInt(state.residencial.banos);
    const halfCt = parseNonNegInt(state.residencial.mediosBanos);
    const bathNum =
      (fullB ?? 0) + (halfCt != null && halfCt > 0 ? halfCt * 0.5 : 0);
    if (bathNum > 0) push(out, LEONIX_DP_BATHROOMS_COUNT, bathNum);
    const park = parseNonNegNumber(state.residencial.estacionamiento);
    if (park != null) push(out, LEONIX_DP_PARKING_SPOTS, park);
    if (state.residencial.highlightKeys.includes("piscina")) push(out, LEONIX_DP_POOL, true);
  } else if (cat === "comercial") {
    push(out, LEONIX_DP_PROPERTY_SUBTYPE, state.comercial.tipoCodigo);
    const bathNum = parseNonNegNumber(state.comercial.banos);
    if (bathNum != null && bathNum > 0) push(out, LEONIX_DP_BATHROOMS_COUNT, bathNum);
    const park = parseNonNegNumber(state.comercial.estacionamiento);
    if (park != null) push(out, LEONIX_DP_PARKING_SPOTS, park);
  } else {
    push(out, LEONIX_DP_PROPERTY_SUBTYPE, state.terreno.tipoCodigo);
  }

  if (state.petsAllowed === "yes") push(out, LEONIX_DP_PETS_ALLOWED, true);
  else if (state.petsAllowed === "no") push(out, LEONIX_DP_PETS_ALLOWED, false);

  return out;
}

export function buildLeonixMachineFacetPairsFromBienesRaicesNegocioState(
  state: BienesRaicesNegocioFormState,
): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = [];
  const rk = inferBrResultsPropertyKindNegocio(state);
  push(out, LEONIX_DP_RESULTS_PROPERTY_KIND, rk);
  const subtype = String(state.tipoPropiedad ?? "").trim().toLowerCase().replace(/\s+/g, "_").slice(0, 64);
  if (subtype) push(out, LEONIX_DP_PROPERTY_SUBTYPE, subtype);

  const beds = parseNonNegInt(state.recamaras);
  if (beds != null) push(out, LEONIX_DP_BEDROOMS_COUNT, beds);
  const fullB = parseNonNegInt(state.banosCompletos);
  const halfCt = parseNonNegInt(state.mediosBanos);
  const bathNum = (fullB ?? 0) + (halfCt != null && halfCt > 0 ? halfCt * 0.5 : 0);
  if (bathNum > 0) push(out, LEONIX_DP_BATHROOMS_COUNT, bathNum);
  const park = parseNonNegNumber(state.estacionamientos);
  if (park != null) push(out, LEONIX_DP_PARKING_SPOTS, park);

  const zip = String(state.codigoPostal ?? "").replace(/\D/g, "").slice(0, 10);
  if (zip.length >= 5) push(out, LEONIX_DP_POSTAL_CODE, zip);

  const fur = parseAmuebladoNegocio(state.amueblado);
  if (fur != null) push(out, LEONIX_DP_FURNISHED, fur);

  const poolHl = Boolean(state.highlightPresets?.piscina);
  const poolDeep = Boolean(String(state.deepDetails?.exterior?.piscina ?? "").trim());
  if (poolHl || poolDeep) push(out, LEONIX_DP_POOL, true);

  if (state.petsAllowed === "yes") push(out, LEONIX_DP_PETS_ALLOWED, true);
  else if (state.petsAllowed === "no") push(out, LEONIX_DP_PETS_ALLOWED, false);

  return out;
}
