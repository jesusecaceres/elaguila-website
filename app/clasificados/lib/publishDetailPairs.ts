/**
 * Unified publish flow: builds label/value detail rows for preview, appendix, and validation.
 * Dispatches to category field config + structured category mappers.
 */

import { getPublishCategoryFields } from "@/app/clasificados/config/publishCategoryFields";
import { appendBrNegocioLongTailDetailPairs } from "@/app/clasificados/bienes-raices/negocio/mapping/brNegocioDetailPairsAppend";
import { appendBrPrivadoLongTailDetailPairs } from "@/app/clasificados/bienes-raices/privado/mapping/brPrivadoDetailPairsAppend";
import { getBienesRaicesPublishStructuredDetailPairs } from "@/app/clasificados/bienes-raices/shared/mapping/bienesRaicesPublishDetailPairs";
import { getArticuloLabel } from "@/app/clasificados/en-venta/shared/fields/enVentaTaxonomy";
import { getRentasPublishStructuredDetailPairs } from "@/app/clasificados/rentas/shared/mapping/rentasPublishDetailPairs";
import { buildDetailsAppendixFromPairs, type PublishLang } from "./buildDetailsAppendix";

export type { PublishLang };

export function getDetailPairs(
  cat: string,
  lang: PublishLang,
  details: Record<string, string>,
  cityDisplay = ""
): Array<{ label: string; value: string }> {
  const fields = getPublishCategoryFields(cat, details);
  const out: Array<{ label: string; value: string }> = [];
  // En Venta: item-selling details come from fields (rama, itemType, condition) only.
  if (cat === "bienes-raices") {
    out.push(...getBienesRaicesPublishStructuredDetailPairs(lang, details, cityDisplay));
  }
  if (cat === "rentas") {
    out.push(...getRentasPublishStructuredDetailPairs(lang, details));
  }
  for (const f of fields) {
    if (cat === "rentas" && f.key === "plazo_contrato") continue;
    // BR: address + optional zone are emitted above with summary-friendly labels; skip legacy row to avoid duplicates/wrong labels.
    if (cat === "bienes-raices" && f.key === "direccionPropiedad") continue;
    const raw = (details[f.key] ?? "").toString().trim();
    if (!raw) continue;

    if (f.type === "select" && f.options && f.options.length > 0) {
      const opt = f.options.find((o) => o.value === raw);
      out.push({ label: f.label[lang], value: opt ? opt.label[lang] : raw });
      continue;
    }

    if (cat === "en-venta" && f.key === "itemType") {
      const rama = (details.rama ?? "").trim();
      const label = getArticuloLabel(rama, raw, lang);
      out.push({ label: f.label[lang], value: label });
      continue;
    }

    out.push({ label: f.label[lang], value: raw });
  }
  const brBr = (details.bienesRaicesBranch ?? "").trim().toLowerCase();
  if (cat === "bienes-raices" && brBr === "negocio") {
    appendBrNegocioLongTailDetailPairs(lang, details, out);
  }
  if (cat === "bienes-raices" && brBr === "privado") {
    appendBrPrivadoLongTailDetailPairs(lang, details, out);
  }
  return out;
}

export function buildDetailsAppendix(
  cat: string,
  lang: PublishLang,
  details: Record<string, string>,
  cityDisplay?: string
): string {
  return buildDetailsAppendixFromPairs(getDetailPairs(cat, lang, details, cityDisplay ?? ""), lang);
}
