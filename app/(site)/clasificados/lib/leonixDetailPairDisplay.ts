/**
 * Public listing detail: which `detail_pairs` rows are structural (hidden) vs user-facing facts.
 * Replaces a blanket `/^leonix:/i` filter that hid every Leonix-prefixed row, including facts
 * stored with a `Leonix:` label by some publish paths.
 */

import { EN_VENTA_VISIBILITY_LAST_RENEWAL_LABEL } from "@/app/clasificados/en-venta/boosts/enVentaVisibilityRenewal";
import {
  LEONIX_DP_BRANCH,
  LEONIX_DP_CHECKOUT_SESSION_ID,
  LEONIX_DP_CATEGORIA_PROPIEDAD,
  LEONIX_DP_LISTING_LIFECYCLE,
  LEONIX_DP_OPERATION,
  LEONIX_DP_PROMOTED,
  LEONIX_DP_PROMOTED_UNTIL,
} from "@/app/clasificados/lib/leonixRealEstateListingContract";

/** Exact `detail_pairs[].label` values that must never appear as public “Details” rows. */
export const LEONIX_INTERNAL_DETAIL_LABELS: ReadonlySet<string> = new Set([
  LEONIX_DP_BRANCH,
  LEONIX_DP_OPERATION,
  LEONIX_DP_CATEGORIA_PROPIEDAD,
  LEONIX_DP_LISTING_LIFECYCLE,
  LEONIX_DP_PROMOTED,
  LEONIX_DP_PROMOTED_UNTIL,
  LEONIX_DP_CHECKOUT_SESSION_ID,
  EN_VENTA_VISIBILITY_LAST_RENEWAL_LABEL,
  /** En Venta marketplace / taxonomy (see `enVentaPublishFromDraft`, `appendEnVentaDetailPairs`). */
  "Leonix:evDept",
  "Leonix:evSub",
  "Leonix:itemType",
  "Leonix:plan",
  /** Boolean logistics flags — surfaced via listing DTO / filters, not as raw 0/1 rows. */
  "Leonix:pickup",
  "Leonix:ship",
  "Leonix:delivery",
  "Leonix:meetup",
  "Leonix:negotiable",
]);

export function isLeonixInternalDetailLabel(label: string): boolean {
  return LEONIX_INTERNAL_DETAIL_LABELS.has(label.trim());
}

/**
 * Map a row for display: drops internal contract keys; for other `Leonix:*` labels, strips the
 * prefix so alternate encodings of property facts still render without exposing raw infra keys.
 */
export function mapLeonixDetailPairForPublicDisplay(row: { label: string; value: string }): { label: string; value: string } | null {
  const label = String(row.label ?? "").trim();
  const value = String(row.value ?? "").trim();
  if (!label || !value) return null;
  if (isLeonixInternalDetailLabel(label)) return null;
  if (/^leonix:/i.test(label)) {
    const rest = label.replace(/^leonix:/i, "").replace(/_/g, " ").trim();
    if (!rest) return null;
    const pretty = rest.charAt(0).toUpperCase() + rest.slice(1);
    return { label: pretty, value };
  }
  return { label, value };
}

export function filterPublicDetailPairRows(rows: Array<{ label: string; value: string }>): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const m = mapLeonixDetailPairForPublicDisplay(r);
    if (!m) continue;
    const key = `${m.label}\0${m.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}
