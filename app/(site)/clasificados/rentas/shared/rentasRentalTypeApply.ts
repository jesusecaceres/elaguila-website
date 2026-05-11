/**
 * Rentas inventory tipo: preview/output filtering + extra fact rows (Privado + Negocio share the same state shape).
 */

import type { BienesRaicesPreviewFact } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import {
  COMERCIAL_TIPO_OPCIONES,
  TERRENO_SUBTIPO_POR_TIPO,
  TERRENO_TIPO_OPCIONES,
  labelComercialSubtipo,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteComercialTerrenoMeta";
import type { RentasPrivadoFormState } from "@/app/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";
import { RENTAS_PLAZO_LABELS } from "@/app/clasificados/rentas/shared/utils/rentasPublishConstants";
import {
  formatRentasDepositUsdPreview,
  formatRentasDisponibilidadDisplay,
  formatRentasServiciosIncluidosOutputMultiline,
} from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";
import { buildRentasResidencialPropertyRows } from "@/app/clasificados/rentas/shared/rentasResidencialPreviewRows";
import {
  coerceRentasTipoDeRentaId,
  formatRentasTipoDeRentaDisplay,
  rentasRentalFlowGroupForTipo,
  type RentasRentalFlowGroup,
} from "@/app/clasificados/rentas/shared/rentasRentalTypeTaxonomy";

const CONDICION_COMERCIAL_LABEL: Record<string, string> = {
  excelente: "Excelente",
  buena: "Buena",
  regular: "Regular",
  necesita_reparacion: "Necesita reparación",
};

export type RentasFlowFormSlice = Pick<
  RentasPrivadoFormState,
  | "tipoDeRenta"
  | "tipoDeRentaOtro"
  | "condicionesAlquiler"
  | "categoriaPropiedad"
  | "residencial"
  | "comercial"
  | "terreno"
  | "deposito"
  | "plazoContrato"
  | "plazoContratoOtro"
  | "disponibilidad"
  | "amueblado"
  | "mascotas"
  | "requisitos"
  | "zonaVecindario"
  | "serviciosIncluidosKeys"
  | "serviciosIncluidosOtro"
  | "serviciosIncluidosLegacy"
  | "rentaMensual"
  | "estadoAnuncio"
  | "rentasEspacioTipoBano"
  | "rentasEspacioTipoCocina"
  | "rentasEspacioEntradaPrivada"
  | "rentasEspacioLavanderia"
  | "rentasEspacioMaxOcupantes"
  | "rentasAlmacenTamanoAprox"
  | "rentasAlmacenAcceso24h"
  | "rentasAlmacenElectricidad"
  | "rentasAlmacenSeguridad"
  | "rentasAlmacenUsoPermitido"
  | "rentasAlmacenDimensiones"
  | "rentasComercialUsoPermitido"
  | "rentasComercialTamanoFt2"
  | "rentasComercialBanoDisponible"
  | "rentasComercialHorarioAcceso"
  | "rentasComercialContratoMinimo"
  | "rentasLoteUsoPermitido"
  | "rentasLoteServiciosDisponibles"
  | "rentasLoteAcceso"
  | "rentasLoteZonificacion"
>;

function trim(s: string): string {
  return String(s ?? "").trim();
}

function row(label: string, value: string): BienesRaicesPreviewFact | null {
  const v = trim(value);
  if (!v) return null;
  return { label, value: v };
}

function prettifyPlainNumber(raw: string): string {
  const t = trim(raw);
  if (!t) return "";
  const c = t.replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(c)) return t;
  const [intPart, frac] = c.split(".");
  const pretty = intPart!.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac !== undefined ? `${pretty}.${frac}` : pretty;
}

function prettifySqft(raw: string): string {
  const t = trim(raw);
  if (!t) return "";
  return `${prettifyPlainNumber(t)} ft²`;
}

function labelTerrenoSubtipo(codigo: (typeof TERRENO_TIPO_OPCIONES)[number]["value"], subvalor: string): string {
  const v = trim(subvalor);
  if (!v) return "";
  const list = TERRENO_SUBTIPO_POR_TIPO[codigo];
  return list.find((x) => x.value === v)?.label ?? "";
}

function siNoLabel(v: string): string {
  const t = trim(v).toLowerCase();
  if (t === "si") return "Sí";
  if (t === "no") return "No";
  return "";
}

function plazoDisplay(s: RentasFlowFormSlice): string {
  if (s.plazoContrato === "otro") return trim(s.plazoContratoOtro);
  if (s.plazoContrato && RENTAS_PLAZO_LABELS[s.plazoContrato]) return RENTAS_PLAZO_LABELS[s.plazoContrato].es;
  return "";
}

const ESTADO_RENTAS: Record<RentasPrivadoFormState["estadoAnuncio"], string> = {
  disponible: "Disponible",
  pendiente: "Pendiente",
  bajo_contrato: "Bajo contrato",
  rentado: "Rentado",
};

const BANO_ESP_LABEL: Record<string, string> = {
  privado: "Privado",
  compartido: "Compartido",
  no_incluido: "No incluido",
};

const COCINA_ESP_LABEL: Record<string, string> = {
  privada: "Privada",
  compartida: "Compartida",
  no_incluida: "No incluida",
};

export function rentasFlowGroupActive(s: RentasFlowFormSlice): RentasRentalFlowGroup {
  return rentasRentalFlowGroupForTipo(s.tipoDeRenta);
}

/** Which residencial “Detalle” rows to show in publish forms (state is never cleared when hidden). */
export type RentasResidencialFormRowsMode = "full_legacy" | "room_partial" | "none";

export function rentasResidencialFormRowsMode(g: RentasRentalFlowGroup): RentasResidencialFormRowsMode {
  if (g === "unset" || g === "full_housing") return "full_legacy";
  if (g === "room_shared") return "room_partial";
  if (g === "storage_parking") return "none";
  return "full_legacy";
}

/** Price row for resumen (matches existing Rentas preview currency formatting). */
export function buildRentasRentaMensualRow(s: Pick<RentasFlowFormSlice, "rentaMensual">): BienesRaicesPreviewFact | null {
  const d = String(s.rentaMensual ?? "").replace(/\D/g, "");
  if (!d) return null;
  const n = Number(d);
  if (!Number.isFinite(n) || n <= 0) return null;
  const cur = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  return { label: "Renta mensual", value: `${cur} / mes` };
}

/** Contract / resumen rows (Spanish labels) — merged into `propertyDetailsRows` for preview + publish. */
export function buildRentasFlowContractRows(s: RentasFlowFormSlice): BienesRaicesPreviewFact[] {
  const rows: BienesRaicesPreviewFact[] = [];
  const dep = formatRentasDepositUsdPreview(s.deposito);
  if (dep) rows.push({ label: "Depósito", value: dep });
  const pl = plazoDisplay(s);
  if (pl) rows.push({ label: "Plazo del contrato", value: pl });
  const disp = formatRentasDisponibilidadDisplay(s.disponibilidad);
  if (disp) rows.push({ label: "Disponibilidad", value: disp });
  const g = rentasFlowGroupActive(s);
  const showFurnPets = g === "unset" || g === "full_housing" || g === "room_shared" || g === "commercial_space";
  if (showFurnPets) {
    if (s.amueblado === "amueblado") rows.push({ label: "Amueblado", value: "Amueblado" });
    if (s.amueblado === "sin_amueblar") rows.push({ label: "Amueblado", value: "Sin amueblar" });
    if (s.mascotas === "permitidas") rows.push({ label: "Mascotas", value: "Permitidas" });
    if (s.mascotas === "no_permitidas") rows.push({ label: "Mascotas", value: "No permitidas" });
  }
  const svc = formatRentasServiciosIncluidosOutputMultiline(s);
  if (svc) rows.push({ label: "Servicios incluidos", value: svc });
  const req = trim(s.requisitos);
  if (req) rows.push({ label: "Requisitos", value: req });
  const cond = trim(s.condicionesAlquiler);
  if (cond) rows.push({ label: "Condiciones importantes", value: cond });
  const zona = trim(s.zonaVecindario);
  if (zona) rows.push({ label: "Zona o vecindario", value: zona });
  rows.push({ label: "Estado del anuncio", value: ESTADO_RENTAS[s.estadoAnuncio] });
  return rows;
}

function tipoRentaRow(s: RentasFlowFormSlice): BienesRaicesPreviewFact | null {
  const id = coerceRentasTipoDeRentaId(s.tipoDeRenta);
  if (!id) return null;
  const label = formatRentasTipoDeRentaDisplay(s.tipoDeRenta, s.tipoDeRentaOtro);
  return row("Tipo de renta", label);
}

export function buildRentasFlowTipoResumenRow(s: RentasFlowFormSlice): BienesRaicesPreviewFact[] {
  const t = tipoRentaRow(s);
  return t ? [t] : [];
}

function extensionRows(s: RentasFlowFormSlice, g: RentasRentalFlowGroup): BienesRaicesPreviewFact[] {
  const out: BienesRaicesPreviewFact[] = [];
  if (g === "room_shared") {
    const b = BANO_ESP_LABEL[s.rentasEspacioTipoBano] ?? "";
    if (b) out.push({ label: "Tipo de baño", value: b });
    const c = COCINA_ESP_LABEL[s.rentasEspacioTipoCocina] ?? "";
    if (c) out.push({ label: "Cocina", value: c });
    const ep = siNoLabel(s.rentasEspacioEntradaPrivada);
    if (ep) out.push({ label: "Entrada privada", value: ep });
    const lav = siNoLabel(s.rentasEspacioLavanderia);
    if (lav) out.push({ label: "Lavandería disponible", value: lav });
    const mx = trim(s.rentasEspacioMaxOcupantes).replace(/\D/g, "");
    if (mx) out.push({ label: "Máximo de ocupantes", value: mx });
  }
  if (g === "storage_parking") {
    const r1 = row("Tamaño aproximado", s.rentasAlmacenTamanoAprox);
    if (r1) out.push(r1);
    const a24 = siNoLabel(s.rentasAlmacenAcceso24h);
    if (a24) out.push({ label: "Acceso 24/7", value: a24 });
    const el = siNoLabel(s.rentasAlmacenElectricidad);
    if (el) out.push({ label: "Electricidad disponible", value: el });
    const seg = siNoLabel(s.rentasAlmacenSeguridad);
    if (seg) out.push({ label: "Seguridad / acceso controlado", value: seg });
    const r2 = row("Uso permitido", s.rentasAlmacenUsoPermitido);
    if (r2) out.push(r2);
    const r3 = row("Altura / dimensiones", s.rentasAlmacenDimensiones);
    if (r3) out.push(r3);
  }
  if (g === "commercial_space") {
    const r0 = row("Uso permitido", s.rentasComercialUsoPermitido);
    if (r0) out.push(r0);
    const rSq = row("Tamaño (ft²)", s.rentasComercialTamanoFt2);
    if (rSq) out.push(rSq);
    const b = siNoLabel(s.rentasComercialBanoDisponible);
    if (b) out.push({ label: "Baño disponible", value: b });
    const r1 = row("Horario / acceso", s.rentasComercialHorarioAcceso);
    if (r1) out.push(r1);
    const r2 = row("Contrato mínimo", s.rentasComercialContratoMinimo);
    if (r2) out.push(r2);
  }
  if (g === "land_parcel") {
    const r0 = row("Uso permitido", s.rentasLoteUsoPermitido);
    if (r0) out.push(r0);
    const r1 = row("Servicios disponibles", s.rentasLoteServiciosDisponibles);
    if (r1) out.push(r1);
    const r2 = row("Acceso", s.rentasLoteAcceso);
    if (r2) out.push(r2);
    const r3 = row("Zonificación", s.rentasLoteZonificacion);
    if (r3) out.push(r3);
  }
  return out;
}

const RES_LABELS_DROP: Record<RentasRentalFlowGroup, Set<string> | null> = {
  unset: null,
  full_housing: null,
  room_shared: new Set(["Recámaras", "Lote (ft²)", "Año de construcción", "Condición", "Tipo", "Subtipo"]),
  storage_parking: new Set([
    "Tipo",
    "Subtipo",
    "Recámaras",
    "Baños completos",
    "Medios baños",
    "Lote (ft²)",
    "Interior (ft²)",
    "Año de construcción",
    "Condición",
  ]),
  commercial_space: new Set(["Tipo", "Subtipo"]),
  land_parcel: new Set(["Tipo", "Subtipo"]),
};

function filterResidencialCaracteristicas(
  g: RentasRentalFlowGroup,
  rows: BienesRaicesPreviewFact[],
): BienesRaicesPreviewFact[] {
  const drop = RES_LABELS_DROP[g];
  if (!drop) return rows;
  return rows.filter((r) => !drop.has(r.label));
}

function buildComercialPropertyRows(s: RentasFlowFormSlice): BienesRaicesPreviewFact[] {
  const c = s.comercial;
  const tipoLabel = COMERCIAL_TIPO_OPCIONES.find((o) => o.value === c.tipoCodigo)?.label ?? "";
  const subLbl = labelComercialSubtipo(c.tipoCodigo, c.subtipo);
  const rows: Array<BienesRaicesPreviewFact | null> = [
    row("Tipo comercial", tipoLabel),
    row("Subtipo", subLbl),
    row("Uso", c.uso),
    row("Tamaño interior", c.interiorSqft ? prettifySqft(c.interiorSqft) : ""),
    row("Oficinas", prettifyPlainNumber(c.oficinas)),
    row("Baños", prettifyPlainNumber(c.banos)),
    row("Niveles / pisos", prettifyPlainNumber(c.niveles)),
    row("Estacionamiento", c.estacionamiento),
    row("Zonificación", c.zonificacion),
    row("Condición", c.condicion ? CONDICION_COMERCIAL_LABEL[c.condicion] ?? c.condicion : ""),
    row("Acceso de carga", c.accesoCarga ? "Sí" : ""),
  ];
  return rows.filter((x): x is BienesRaicesPreviewFact => x != null);
}

function buildTerrenoPropertyRows(s: RentasFlowFormSlice): BienesRaicesPreviewFact[] {
  const t = s.terreno;
  const tipoLabel = TERRENO_TIPO_OPCIONES.find((o) => o.value === t.tipoCodigo)?.label ?? "";
  const subLbl = labelTerrenoSubtipo(t.tipoCodigo, t.subtipo);
  const rows: Array<BienesRaicesPreviewFact | null> = [
    row("Tipo de terreno", tipoLabel),
    row("Subtipo", subLbl),
    row("Tamaño del lote", t.loteSqft ? prettifySqft(t.loteSqft) : ""),
    row("Uso / zonificación", t.usoZonificacion),
    row("Acceso", t.acceso),
    row("Servicios disponibles", t.servicios),
    row("Topografía", t.topografia),
    row("Listo para construir", t.listoConstruir ? "Sí" : ""),
    row("Cercado", t.cercado ? "Sí" : ""),
  ];
  return rows.filter((x): x is BienesRaicesPreviewFact => x != null);
}

/** Build características + tipo-specific rows for Rentas preview/publish. */
export function buildRentasFlowPropertyBodyRows(s: RentasFlowFormSlice): BienesRaicesPreviewFact[] {
  const g = rentasFlowGroupActive(s);
  const ext = extensionRows(s, g);

  if (s.categoriaPropiedad === "residencial") {
    let rows = buildRentasResidencialPropertyRows(s.residencial);
    rows = filterResidencialCaracteristicas(g, rows);
    return [...rows, ...ext];
  }

  if (s.categoriaPropiedad === "comercial") {
    const base = buildComercialPropertyRows(s);
    if (g === "commercial_space") {
      return [...ext, ...base];
    }
    return [...base, ...ext];
  }

  const base = buildTerrenoPropertyRows(s);
  if (g === "land_parcel") {
    return [...ext, ...base];
  }
  return [...base, ...ext];
}

export type RentasPublicListingFlowSlice = {
  rentalTypeCode?: string | null;
  rentalTypeCustom?: string | null;
  leaseConditions?: string | null;
  rentasRoomBathLabel?: string | null;
  rentasRoomKitchenLabel?: string | null;
  rentasRoomMaxOccupants?: string | null;
  rentasStorageAccess24h?: boolean | null;
  rentasStorageSecurity?: boolean | null;
  categoriaPropiedad: RentasFlowFormSlice["categoriaPropiedad"];
  beds: string;
  baths: string;
  fullBaths?: string;
  halfBaths?: string;
  halfBathsCount?: number | null;
  sqft: string;
  lotSqft?: string;
  yearBuilt?: string;
  condition?: string;
  parking?: string;
  parkingSpots?: number | null;
  leaseTermCode?: string | null;
  depositUsd?: number;
  availabilityNote?: string | null;
  servicesIncluded?: string | null;
  requirements?: string | null;
  amueblado?: boolean;
  mascotasPermitidas?: boolean;
  resultsPropertyKind?: string | null;
  propertySubtype?: string | null;
};

/** Adapt live listing property rows using persisted rental type code when present. */
export function filterRentasLivePropertyRowsForFlow(
  listing: RentasPublicListingFlowSlice,
  rows: BienesRaicesPreviewFact[],
): BienesRaicesPreviewFact[] {
  const g = rentasRentalFlowGroupForTipo(listing.rentalTypeCode ?? "");
  if (g === "unset") return rows;
  if (listing.categoriaPropiedad === "residencial") {
    return filterResidencialCaracteristicas(g, rows);
  }
  return rows;
}

function leaseTermCardLabel(code: string | null | undefined): string {
  const c = (code ?? "").trim();
  const m: Record<string, string> = {
    "mes-a-mes": "Mes a mes",
    "6-meses": "6 meses",
    "12-meses": "12 meses",
    "1-ano": "Contrato 1 año",
    "2-anos": "Contrato 2 años",
  };
  return m[c] ?? c;
}

/** Compact Spanish summary for result cards when rental type is set (no condiciones). */
export function buildRentasResultsCardSummaryEs(listing: RentasPublicListingFlowSlice): string {
  const g = rentasRentalFlowGroupForTipo(listing.rentalTypeCode ?? "");
  if (g === "unset") return "";
  const parts: string[] = [];

  const sq = trim(listing.sqft ?? "");
  const sqOk = sq && sq !== "—";

  if (g === "full_housing") {
    const beds = trim(listing.beds ?? "");
    const bt = trim(listing.fullBaths ?? "") || trim(listing.baths ?? "");
    if (beds && beds !== "—") parts.push(`${beds} rec`);
    if (bt && bt !== "—") parts.push(`${bt} baños`);
    if (sqOk) parts.push(sq);
    if (listing.mascotasPermitidas === true) parts.push("Mascotas permitidas");
    return parts.join(" · ");
  }

  if (g === "room_shared") {
    const b = trim(listing.rentasRoomBathLabel ?? "");
    const k = trim(listing.rentasRoomKitchenLabel ?? "");
    const mx = trim(listing.rentasRoomMaxOccupants ?? "");
    if (b) parts.push(`Baño ${b}`);
    if (k) parts.push(`Cocina ${k}`);
    if (mx) parts.push(`Máx. ${mx} persona${mx === "1" ? "" : "s"}`);
    const svc = trim(listing.servicesIncluded ?? "");
    if (svc) parts.push("Servicios incluidos");
    return parts.join(" · ");
  }

  if (g === "storage_parking") {
    if (sqOk) parts.push(sq);
    if (listing.rentasStorageAccess24h === true) parts.push("Acceso 24/7");
    if (listing.rentasStorageSecurity === true) parts.push("Seguridad");
    const pl = leaseTermCardLabel(listing.leaseTermCode);
    if (pl) parts.push(pl);
    return parts.join(" · ");
  }

  if (g === "commercial_space") {
    if (sqOk) parts.push(sq);
    const bath =
      trim(listing.fullBaths ?? "") && trim(listing.fullBaths ?? "") !== "—"
        ? "Baño disponible"
        : trim(listing.baths ?? "") && trim(listing.baths ?? "") !== "—"
          ? "Baño disponible"
          : "";
    if (bath) parts.push(bath);
    if (trim(listing.parking ?? "")) parts.push("Estacionamiento");
    const pl = leaseTermCardLabel(listing.leaseTermCode);
    if (pl) parts.push(pl);
    return parts.join(" · ");
  }

  if (g === "land_parcel") {
    const lot = trim(listing.lotSqft ?? "");
    if (lot && lot !== "—") parts.push(`Lote ${lot}`);
    else if (sqOk) parts.push(`Lote ${sq}`);
    parts.push("Uso permitido");
    if (trim(listing.parking ?? "") || (listing.parkingSpots ?? 0) > 0) parts.push("Acceso");
    return parts.join(" · ");
  }

  return "";
}
