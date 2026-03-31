/**
 * Split BR preview detailPairs into quick facts vs feature-style tags using existing labels only.
 * No new draft fields — heuristics match getDetailPairs() labels for bienes-raices.
 */

export type BrPreviewPair = { label: string; value: string };

const EXCLUDE_LABEL_ES = /^(Nombre del negocio|Agente|Plan|Categoría)$/i;
const EXCLUDE_LABEL_EN = /^(Business name|Agent|Plan|Category)$/i;

const QUICK_FACT_LABEL_ES =
  /^(Tipo de propiedad|Subtipo|Recámaras|Baños|Medios baños|Pies²|Terreno|Niveles|Estacionamiento|Año de construcción|Zonificación)$/i;
const QUICK_FACT_LABEL_EN =
  /^(Property type|Subtype|Bedrooms|Bathrooms|Half bathrooms|Sq ft|Lot size|Levels|Parking|Year built|Zoning)$/i;

const FEATURE_TAG_LABEL_ES =
  /^(Nombre de la vecindad|Servicios disponibles|Detalles adicionales de servicios|Video de la propiedad|Tour virtual|Comodidades)$/i;
const FEATURE_TAG_LABEL_EN =
  /^(Neighborhood name|Utilities available|Additional utility details|Property video|Virtual tour|Amenities)$/i;

function isExcluded(p: BrPreviewPair, lang: "es" | "en"): boolean {
  const re = lang === "es" ? EXCLUDE_LABEL_ES : EXCLUDE_LABEL_EN;
  return re.test(p.label.trim());
}

function isQuickFactLabel(p: BrPreviewPair, lang: "es" | "en"): boolean {
  const re = lang === "es" ? QUICK_FACT_LABEL_ES : QUICK_FACT_LABEL_EN;
  return re.test(p.label.trim());
}

function isFeatureTagLabel(p: BrPreviewPair, lang: "es" | "en"): boolean {
  const lab = p.label.trim();
  if (/comodidades|amenities/i.test(lab)) return true;
  const re = lang === "es" ? FEATURE_TAG_LABEL_ES : FEATURE_TAG_LABEL_EN;
  return re.test(lab);
}

function looksLikeUrl(v: string): boolean {
  return /^https?:\/\//i.test(v.trim());
}

/** Short display for URL values in tag row (deferred: real video/tour tiles). */
function displayValue(p: BrPreviewPair, lang: "es" | "en"): string {
  const v = (p.value ?? "").trim();
  if (!v) return "";
  if (looksLikeUrl(v)) {
    if (/video/i.test(p.label)) return lang === "es" ? "Video disponible" : "Video available";
    if (/tour|virtual/i.test(p.label)) return lang === "es" ? "Tour disponible" : "Tour available";
    return lang === "es" ? "Enlace" : "Link";
  }
  return v;
}

export function partitionBienesRaicesPreviewDetailPairs(
  pairs: BrPreviewPair[],
  lang: "es" | "en"
): { quickFacts: BrPreviewPair[]; featureTags: BrPreviewPair[] } {
  const quickFacts: BrPreviewPair[] = [];
  const featureTags: BrPreviewPair[] = [];
  const seen = new Set<string>();

  for (const p of pairs) {
    const value = (p.value ?? "").trim();
    if (!value) continue;
    if (isExcluded(p, lang)) continue;
    const key = `${p.label}\0${value}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const display = displayValue(p, lang);
    const pairForUi = { label: p.label, value: display };

    if (isFeatureTagLabel(p, lang) || looksLikeUrl(p.value)) {
      featureTags.push(pairForUi);
      continue;
    }
    if (isQuickFactLabel(p, lang)) {
      quickFacts.push(pairForUi);
      continue;
    }
    /** Long free-text or comma lists → feature tags */
    if (value.length > 48 || value.includes(",")) {
      featureTags.push(pairForUi);
      continue;
    }
    quickFacts.push(pairForUi);
  }

  return { quickFacts, featureTags };
}
