import type { PublishLang } from "@/app/clasificados/lib/buildDetailsAppendix";
import {
  EN_VENTA_PUBLISH_CONDITION_OPTIONS,
  findSubcategory,
  departmentLabel,
  getArticuloLabel,
} from "../shared/fields/enVentaTaxonomy";

type EnVentaLang = "es" | "en";
type EnVentaFulfillmentFlags = {
  pickup?: boolean;
  shipping?: boolean;
  delivery?: boolean;
  meetup?: boolean;
};

function humanizeFallback(raw: string): string {
  return raw
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

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
  lang: EnVentaLang
): string | null {
  const raw = (conditionRaw ?? "").trim();
  if (!raw) return null;
  const c = raw.toLowerCase().replace(/_/g, "-");
  const opt = EN_VENTA_PUBLISH_CONDITION_OPTIONS.find((o) => o.value === c);
  if (opt) return lang === "es" ? opt.labelEs : opt.labelEn;
  const legacy: Record<string, { es: string; en: string }> = {
    excellent: { es: "Excelente estado", en: "Excellent" },
    used: { es: "Usado", en: "Used" },
    poor: { es: "Para repuesto", en: "For parts" },
  };
  const hit = legacy[c];
  return hit ? hit[lang] : humanizeFallback(raw);
}

export function enVentaCategoryLine(
  details: { departmentKey?: string | null; subKey?: string | null; articleKey?: string | null },
  lang: EnVentaLang
): string | null {
  const dept = (details.departmentKey ?? "").trim();
  const sub = (details.subKey ?? "").trim();
  const art = (details.articleKey ?? "").trim();
  if (!dept) return null;
  const d = departmentLabel(dept, lang);
  if (sub) {
    const row = findSubcategory(dept, sub);
    return row ? `${d} · ${row.label[lang]}` : d;
  }
  if (!art) return d;
  return `${d} · ${getArticuloLabel(dept, art, lang)}`;
}

export function enVentaDeptArticleLine(
  details: Record<string, string | undefined>,
  lang: EnVentaLang
): string {
  return (
    enVentaCategoryLine(
      {
        departmentKey: details.rama,
        articleKey: details.itemType,
      },
      lang
    ) ?? ""
  );
}

export function enVentaFulfillmentLabels(flags: EnVentaFulfillmentFlags, lang: EnVentaLang): string[] {
  const labels =
    lang === "es"
      ? {
          shipping: "Envío disponible",
          pickup: "Recogida local",
          meetup: "Punto de encuentro",
          delivery: "Entrega local",
        }
      : {
          shipping: "Shipping available",
          pickup: "Local pickup",
          meetup: "Meetup",
          delivery: "Local delivery",
        };
  const out: string[] = [];
  if (flags.shipping) out.push(labels.shipping);
  if (flags.pickup) out.push(labels.pickup);
  if (flags.meetup) out.push(labels.meetup);
  if (flags.delivery) out.push(labels.delivery);
  return out;
}

export function enVentaFulfillmentSummary(flags: EnVentaFulfillmentFlags, lang: EnVentaLang): string | null {
  const labels = enVentaFulfillmentLabels(flags, lang);
  return labels.length ? labels.join(" · ") : null;
}
