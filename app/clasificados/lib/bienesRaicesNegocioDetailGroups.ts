/**
 * Group BR negocio `detailPairs` into labeled sections for premium preview (Zillow/Redfin-style).
 * Uses existing questionnaire labels (ES/EN) from getDetailPairs — no new draft fields required.
 */

export type BrPair = { label: string; value: string };

export type NegocioDetailSectionId =
  | "homeType"
  | "interior"
  | "exteriorLot"
  | "utilities"
  | "locationZoning"
  | "listingLinks"
  | "other";

const EXCLUDE_FROM_SECTIONS = /^(nombre del negocio|business name|agente|agent|plan|categoría|category)$/i;

function norm(s: string) {
  return (s ?? "").trim().toLowerCase();
}

function bucketForLabel(label: string): NegocioDetailSectionId | null {
  const l = norm(label);
  if (EXCLUDE_FROM_SECTIONS.test(label.trim())) return null;

  if (/^(tipo de propiedad|property type|subtipo|subtype)$/.test(l)) return "homeType";

  if (
    /^(recámaras|bedrooms|baños|bathrooms|medios baños|half bathrooms|pies²|sq ft|square feet|niveles|levels|comodidades|amenities)/.test(l) ||
    /bedrooms|bathrooms|half bathrooms|sq ft|square feet|levels|amenities/.test(l)
  ) {
    if (/comodidades|amenities/.test(l)) return "interior";
    if (/^(dirección|address|nombre de la vecindad|neighborhood)/.test(l)) return null;
    return "interior";
  }

  if (/^(terreno|lot size|estacionamiento|parking|año de construcción|year built)$/.test(l) || /lot size|parking|year built/.test(l)) {
    return "exteriorLot";
  }

  if (/servicios|utilities|drenaje|sewer|internet|gas|electric|agua|water|detalles adicionales de servicios|additional utility details/.test(l)) {
    return "utilities";
  }

  if (/^(dirección|address|nombre de la vecindad|neighborhood|zonificación|zoning)$/.test(l) || /neighborhood name|address$/.test(l)) {
    return "locationZoning";
  }

  if (/video de la propiedad|property video|tour virtual|virtual tour|plano|floorplan/.test(l)) {
    return "listingLinks";
  }

  return "other";
}

const SECTION_META: Record<
  NegocioDetailSectionId,
  { titleEs: string; titleEn: string; order: number }
> = {
  homeType: { titleEs: "Tipo de vivienda", titleEn: "Home type", order: 1 },
  interior: { titleEs: "Interior y habitaciones", titleEn: "Interior & rooms", order: 2 },
  exteriorLot: { titleEs: "Exterior y terreno", titleEn: "Exterior & lot", order: 3 },
  utilities: { titleEs: "Servicios y sistemas", titleEn: "Utilities & systems", order: 4 },
  locationZoning: { titleEs: "Ubicación y zonificación", titleEn: "Location & zoning", order: 5 },
  listingLinks: { titleEs: "Enlaces del anuncio", titleEn: "Listing links", order: 6 },
  other: { titleEs: "Más detalles", titleEn: "Additional details", order: 7 },
};

export function groupBienesRaicesNegocioDetailPairs(pairs: BrPair[]): Array<{
  id: NegocioDetailSectionId;
  pairs: BrPair[];
}> {
  const buckets: Record<NegocioDetailSectionId, BrPair[]> = {
    homeType: [],
    interior: [],
    exteriorLot: [],
    utilities: [],
    locationZoning: [],
    listingLinks: [],
    other: [],
  };

  const seen = new Set<string>();
  for (const p of pairs) {
    const v = (p.value ?? "").trim();
    if (!v) continue;
    const key = `${norm(p.label)}\0${v}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const b = bucketForLabel(p.label);
    if (b) buckets[b].push(p);
    else if (!EXCLUDE_FROM_SECTIONS.test(p.label.trim())) buckets.other.push(p);
  }

  const out: Array<{ id: NegocioDetailSectionId; pairs: BrPair[] }> = [];
  for (const id of Object.keys(SECTION_META) as NegocioDetailSectionId[]) {
    const rows = buckets[id];
    if (rows.length === 0) continue;
    out.push({ id, pairs: rows });
  }
  out.sort((a, b) => SECTION_META[a.id].order - SECTION_META[b.id].order);
  return out;
}

/** Localized section title (groupBienesRaicesNegocioDetailPairs defaults ES for title field — replace per lang in UI). */
export function negocioSectionTitle(id: NegocioDetailSectionId, lang: "es" | "en"): string {
  const m = SECTION_META[id];
  return lang === "es" ? m.titleEs : m.titleEn;
}
