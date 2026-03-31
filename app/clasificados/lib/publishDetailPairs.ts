/**
 * Unified publish flow: builds label/value detail rows for preview, appendix, and validation.
 * Dispatches to category field config + structured category mappers.
 */

import { getPublishCategoryFields } from "@/app/clasificados/config/publishCategoryFields";
import { appendEnVentaDetailPairs } from "@/app/clasificados/en-venta/mapping/appendEnVentaDetailPairs";
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
  if (cat === "rentas") {
    out.push(...getRentasPublishStructuredDetailPairs(lang, details));
  }
  for (const f of fields) {
    if (cat === "en-venta" && f.key === "evSub") continue;
    if (cat === "rentas" && f.key === "plazo_contrato") continue;
    const raw = (details[f.key] ?? "").toString().trim();
    if (!raw) continue;

    if (f.type === "select" && f.options && f.options.length > 0) {
      const opt = f.options.find((o) => o.value === raw);
      if (cat === "en-venta" && (f.key === "rama" || f.key === "condition")) {
        out.push({ label: f.label[lang], value: raw });
        continue;
      }
      out.push({ label: f.label[lang], value: opt ? opt.label[lang] : raw });
      continue;
    }

    if (cat === "en-venta" && f.key === "itemType") {
      out.push({ label: f.label[lang], value: raw });
      continue;
    }

    out.push({ label: f.label[lang], value: raw });
  }
  if (cat === "en-venta") {
    appendEnVentaDetailPairs(lang, details, out);
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
