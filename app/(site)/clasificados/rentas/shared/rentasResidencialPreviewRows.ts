/**
 * Canonical residencial detail rows for Rentas preview + publish detail_pairs (Spanish labels).
 */

import type { BienesRaicesPrivadoResidencialFields } from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import { labelForSubtipo, TIPO_PROPIEDAD_OPCIONES } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteResidencialTipoMeta";
import type { BienesRaicesPreviewFact } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";

const CONDICION_LABEL: Record<string, string> = {
  excelente: "Excelente",
  buena: "Buena",
  regular: "Regular",
  necesita_reparacion: "Necesita reparación",
};

function trim(s: string): string {
  return String(s ?? "").trim();
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

function row(label: string, value: string): BienesRaicesPreviewFact | null {
  const v = trim(value);
  if (!v) return null;
  return { label, value: v };
}

function rowOptionalCount(label: string, raw: string): BienesRaicesPreviewFact | null {
  const t = trim(raw);
  if (!t || t === "0") return null;
  return row(label, prettifyPlainNumber(raw));
}

export function buildRentasResidencialPropertyRows(r: BienesRaicesPrivadoResidencialFields): BienesRaicesPreviewFact[] {
  const tipoLabel = TIPO_PROPIEDAD_OPCIONES.find((o) => o.value === r.tipoCodigo)?.label ?? "";
  const subLbl = labelForSubtipo(r.tipoCodigo, r.subtipo);
  const rows: Array<BienesRaicesPreviewFact | null> = [
    row("Tipo", tipoLabel),
    row("Subtipo", subLbl),
    row("Recámaras", prettifyPlainNumber(r.recamaras)),
    row("Baños completos", prettifyPlainNumber(r.banos)),
    rowOptionalCount("Medios baños", r.mediosBanos),
    row("Interior (ft²)", r.interiorSqft ? prettifySqft(r.interiorSqft) : ""),
    row("Lote (ft²)", r.loteSqft ? prettifySqft(r.loteSqft) : ""),
    row("Estacionamiento", r.estacionamiento),
    row("Año de construcción", trim(r.ano)),
    row("Condición", r.condicion ? CONDICION_LABEL[r.condicion] ?? r.condicion : ""),
  ];
  return rows.filter((x): x is BienesRaicesPreviewFact => x != null);
}
