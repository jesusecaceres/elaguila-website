/**
 * Canonical residencial detail rows for Rentas preview + publish detail_pairs (Spanish labels).
 */

import type { BienesRaicesPrivadoResidencialFields } from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import { labelForSubtipo, TIPO_PROPIEDAD_OPCIONES } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteResidencialTipoMeta";
import type { BienesRaicesPreviewFact } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import {
  formatDetailCountDisplay,
  formatSqftDisplay,
  formatYearBuiltDisplay,
} from "@/app/(site)/clasificados/bienes-raices/shared/realEstateAddressPriceFormat";

const CONDICION_LABEL: Record<string, string> = {
  excelente: "Excelente",
  buena: "Buena",
  regular: "Regular",
  necesita_reparacion: "Necesita reparación",
};

function trim(s: string): string {
  return String(s ?? "").trim();
}

function row(label: string, value: string): BienesRaicesPreviewFact | null {
  const v = trim(value);
  if (!v) return null;
  return { label, value: v };
}

function rowOptionalCount(label: string, raw: string): BienesRaicesPreviewFact | null {
  const t = trim(raw);
  if (!t || t === "0") return null;
  return row(label, formatDetailCountDisplay(raw) || t);
}

export function buildRentasResidencialPropertyRows(r: BienesRaicesPrivadoResidencialFields): BienesRaicesPreviewFact[] {
  const tipoLabel = TIPO_PROPIEDAD_OPCIONES.find((o) => o.value === r.tipoCodigo)?.label ?? trim(r.tipoCodigo);
  const subLabel = labelForSubtipo(r.tipoCodigo, r.subtipo);
  const tipoLine = [tipoLabel, subLabel].filter(Boolean).join(" · ");
  const cond = CONDICION_LABEL[r.condicion] ?? trim(r.condicion);

  return [
    row("Tipo de propiedad", tipoLine),
    row("Recámaras", formatDetailCountDisplay(r.recamaras) || trim(r.recamaras)),
    row("Baños completos", formatDetailCountDisplay(r.banos) || trim(r.banos)),
    rowOptionalCount("Medios baños", r.mediosBanos),
    row("Interior (ft²)", r.interiorSqft ? formatSqftDisplay(r.interiorSqft) : ""),
    row("Lote (ft²)", r.loteSqft ? formatSqftDisplay(r.loteSqft) : ""),
    row("Estacionamientos", formatDetailCountDisplay(r.estacionamiento) || trim(r.estacionamiento)),
    row("Año de construcción", formatYearBuiltDisplay(r.ano)),
    row("Condición", cond),
  ].filter((x): x is BienesRaicesPreviewFact => x != null);
}
