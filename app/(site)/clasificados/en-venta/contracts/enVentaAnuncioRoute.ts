/**
 * Public `/clasificados/anuncio/[id]` routing — detect published En Venta/Varios listings
 * even when `listings.category` is missing or mis-set (must not rely on preview-only paths).
 */

function normalizeCategorySlug(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
}

function pairsFromUnknown(pairs: unknown): Array<{ label: string; value: string }> {
  if (!Array.isArray(pairs)) return [];
  return pairs
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const o = p as { label?: string; value?: string };
      if (!o.label) return null;
      return { label: String(o.label).trim(), value: String(o.value ?? "").trim() };
    })
    .filter((x): x is { label: string; value: string } => x != null);
}

export function isEnVentaCategorySlug(raw: unknown): boolean {
  const s = normalizeCategorySlug(raw);
  return s === "en-venta" || s === "en venta" || s === "varios" || s === "for-sale";
}

export function isLeonixSaleListingAdId(raw: unknown): boolean {
  return /^SALE-\d{4}-\d+/i.test(String(raw ?? "").trim());
}

export function hasEnVentaMachineDetailPairs(pairs: unknown): boolean {
  return pairsFromUnknown(pairs).some((p) => {
    const lb = p.label;
    return lb === "Leonix:evDept" || lb === "Leonix:plan" || lb === "Leonix:itemType" || lb === "Leonix:evSub";
  });
}

export type EnVentaAnuncioRouteInput = {
  category?: unknown;
  leonixAdId?: unknown;
  detailPairs?: unknown;
  publishedRow?: Record<string, unknown> | null;
};

/** True when the public anuncio page must use the approved En Venta detail shell (not legacy generic). */
export function shouldUseEnVentaPublishedDetailShell(input: EnVentaAnuncioRouteInput): boolean {
  if (isEnVentaCategorySlug(input.category)) return true;
  if (isLeonixSaleListingAdId(input.leonixAdId)) return true;
  if (hasEnVentaMachineDetailPairs(input.detailPairs)) return true;

  const row = input.publishedRow;
  if (!row) return false;
  if (isEnVentaCategorySlug(row.category)) return true;
  if (isLeonixSaleListingAdId(row.leonix_ad_id)) return true;
  if (hasEnVentaMachineDetailPairs(row.detail_pairs)) return true;

  return false;
}
