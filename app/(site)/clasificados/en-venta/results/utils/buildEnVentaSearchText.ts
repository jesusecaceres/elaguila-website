import type { EnVentaAnuncioDTO } from "../../shared/types/enVentaListing.types";
import {
  departmentLabel,
  EN_VENTA_PUBLISH_CONDITION_OPTIONS,
  getArticuloLabel,
} from "../../shared/fields/enVentaTaxonomy";
import { findSubcategory } from "../../taxonomy/subcategories";
import { enVentaFulfillmentLabels } from "../../mapping/appendEnVentaDetailPairs";
import { expandEnVentaSearchTerms, normalizeEnVentaSearchText } from "../../taxonomy/synonyms";

/** Normalized searchable blob for one En Venta listing (taxonomy + copy + location). */
export function buildEnVentaListingSearchBlob(
  dto: EnVentaAnuncioDTO,
  effectiveDeptKey: string | null
): string {
  const dept = (effectiveDeptKey ?? dto.departmentKey ?? "").trim();
  const sub = (dto.subKey ?? "").trim();
  const art = (dto.articleKey ?? "").trim();
  const cond = (dto.conditionKey ?? "").trim();

  const parts: string[] = [
    dto.title.es,
    dto.title.en,
    dto.description,
    dto.city,
    dto.zip ?? "",
    dto.brand ?? "",
    dto.model ?? "",
    dto.quantity ?? "",
  ];

  if (dept) {
    parts.push(dept, departmentLabel(dept, "es"), departmentLabel(dept, "en"));
  }
  if (sub && dept) {
    parts.push(sub);
    const row = findSubcategory(dept, sub);
    if (row) parts.push(row.label.es, row.label.en);
  }
  if (art && dept) {
    parts.push(art, getArticuloLabel(dept, art, "es"), getArticuloLabel(dept, art, "en"));
  }
  if (cond) {
    const c = cond.toLowerCase().replace(/_/g, "-");
    parts.push(c);
    const opt = EN_VENTA_PUBLISH_CONDITION_OPTIONS.find((o) => o.value === c);
    if (opt) parts.push(opt.labelEs, opt.labelEn);
  }

  const flags = {
    pickup: dto.fulfillment.pickup,
    shipping: dto.fulfillment.shipping,
    delivery: dto.fulfillment.delivery,
    meetup: dto.meetupOffered,
  };
  parts.push(...enVentaFulfillmentLabels(flags, "es"), ...enVentaFulfillmentLabels(flags, "en"));

  for (const row of dto.specRows) {
    if (row.label.trim()) parts.push(row.label);
    if (row.value.trim()) parts.push(row.value);
  }

  return normalizeEnVentaSearchText(parts.filter(Boolean).join(" "));
}

function searchTermHitsBlob(term: string, blob: string): boolean {
  const n = normalizeEnVentaSearchText(term);
  if (n.length < 2) return false;
  if (blob.includes(n)) return true;
  const tokens = n.split(" ").filter((t) => t.length >= 2);
  if (tokens.length > 1 && tokens.every((t) => blob.includes(t))) return true;
  return false;
}

/**
 * Client-side `q` match: title, description, taxonomy labels/slugs, location, fulfillment,
 * and En Venta-only synonym expansion (no cross-category routing).
 */
export function enVentaQueryMatchesListing(
  q: string,
  dto: EnVentaAnuncioDTO,
  effectiveDeptKey: string | null
): boolean {
  const needleRaw = q.trim();
  if (!needleRaw) return true;

  const blob = buildEnVentaListingSearchBlob(dto, effectiveDeptKey);
  if (searchTermHitsBlob(needleRaw, blob)) return true;

  for (const term of expandEnVentaSearchTerms(needleRaw)) {
    if (searchTermHitsBlob(term, blob)) return true;
  }

  return false;
}
