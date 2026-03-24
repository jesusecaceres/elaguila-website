import type { PublishLang } from "@/app/clasificados/lib/buildDetailsAppendix";
import { findSubcategory, departmentLabel, getArticuloLabel } from "../shared/fields/enVentaTaxonomy";

/** Append EV-only rows after generic field scan (subcategory label, fulfillment summary). */
export function appendEnVentaDetailPairs(
  lang: PublishLang,
  details: Record<string, string>,
  out: Array<{ label: string; value: string }>
) {
  const dept = (details.rama ?? "").trim();
  const sub = (details.evSub ?? "").trim();
  if (dept && sub) {
    out.push({ label: "Leonix:evSub", value: sub });
    const row = findSubcategory(dept, sub);
    if (row) {
      out.push({ label: lang === "es" ? "Clasificación" : "Shelf / type", value: row.label[lang] });
    }
  }
  const pickup = (details.pickup ?? "").trim() === "1";
  const shipping = (details.shipping ?? "").trim() === "1";
  const delivery = (details.delivery ?? "").trim() === "1";
  if (pickup || shipping || delivery) {
    const parts: string[] = [];
    if (pickup) parts.push(lang === "es" ? "Recogida" : "Pickup");
    if (shipping) parts.push(lang === "es" ? "Envío" : "Shipping");
    if (delivery) parts.push(lang === "es" ? "Entrega" : "Delivery");
    out.push({ label: lang === "es" ? "Entrega" : "Fulfillment", value: parts.join(" · ") });
  }
}

/** Resolve display line for lista card condition from listing.condition or detail_pairs. */
export function enVentaConditionDisplay(
  conditionRaw: string | null | undefined,
  lang: "es" | "en"
): string | null {
  const c = (conditionRaw ?? "").trim().toLowerCase();
  const map: Record<string, { es: string; en: string }> = {
    new: { es: "Nuevo", en: "New" },
    "like-new": { es: "Como nuevo", en: "Like new" },
    good: { es: "Bueno", en: "Good" },
    fair: { es: "Regular", en: "Fair" },
  };
  const hit = map[c];
  return hit ? hit[lang] : null;
}

export function enVentaDeptArticleLine(
  details: Record<string, string | undefined>,
  lang: "es" | "en"
): string {
  const dept = (details.rama ?? "").trim();
  const art = (details.itemType ?? "").trim();
  if (!dept) return "";
  const d = departmentLabel(dept, lang);
  if (!art) return d;
  return `${d} · ${getArticuloLabel(dept, art, lang)}`;
}
