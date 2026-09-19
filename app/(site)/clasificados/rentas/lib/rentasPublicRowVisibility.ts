/**
 * Rentas public-visibility row rule — PURE (no I/O), client-safe. Gate 9 (2026-09 parity).
 *
 * This is the single row-level statement of what the Rentas PUBLIC results
 * (`fetchRentasPublicListingsForBrowse` -> `mapListingRowToRentasPublicListing().browseActive`) and the
 * canonical detail (`fetchRentasListingForPublicDetail`) show:
 *   - `status` is `active` (public RLS: lower(coalesce(status,'')) = 'active'; `sold` is NOT a public Rentas state),
 *   - `is_published` is not `false`,
 *   - the 30-day lifecycle is live: a real, future `expires_at` is REQUIRED (`expirationRequired: true`),
 *   - the machine availability (`Leonix:rent:listing_status`) is not `rentado` / `bajo_contrato`.
 *
 * It exists so the generic `/clasificados/anuncio/[id]` renderer (which also serves Rentas rows) can apply the
 * SAME rule instead of its looser generic `active|sold` check. Admin Live (`isRentasRowPubliclyLive` in
 * `app/admin/_lib/adminLivePredicates.ts`) implements the identical rule; `scripts/verify-final-parity-moderation.ts`
 * asserts the two agree over a row matrix.
 */
import { readLeonixDetailPairValue } from "@/app/(site)/clasificados/lib/leonixRealEstateListingContract";
import { RENTAS_DP_LISTING_STATUS } from "@/app/(site)/clasificados/rentas/lib/rentasMachineDetailPairs";
import { RENTAS_LISTING_LIFECYCLE_CONFIG } from "@/app/lib/listingLifecycle/listingLifecycleConfig";
import { resolveListingLifecycle } from "@/app/lib/listingLifecycle/resolveListingLifecycle";

export function isRentasRowPubliclyVisible(row: Record<string, unknown>, nowMs: number = Date.now()): boolean {
  const status = String(row.status ?? "")
    .trim()
    .toLowerCase();
  if (status !== "active") return false;
  const lifecycle = resolveListingLifecycle(
    {
      category: "rentas",
      packageKey: "rentas_30d",
      status,
      isPublished: row.is_published as boolean | null | undefined,
      publishedAt: typeof row.published_at === "string" ? row.published_at : null,
      expiresAt: typeof row.expires_at === "string" ? row.expires_at : null,
      nowIso: new Date(nowMs).toISOString(),
    },
    RENTAS_LISTING_LIFECYCLE_CONFIG,
  );
  if (!lifecycle.isPubliclyVisible) return false;
  const availability = String(readLeonixDetailPairValue(row.detail_pairs, RENTAS_DP_LISTING_STATUS) ?? "")
    .trim()
    .toLowerCase();
  return availability !== "rentado" && availability !== "bajo_contrato";
}
