/**
 * Admin Restore / Republish must not double as a "publish without paying" button (2026-09 closeout).
 *
 * PURE. The generic `listings` admin route wrote `status='active', is_published=true` for
 * `unsuspend` / a reactivating `republish` on ANY non-live row — including a paid-lane row that is
 * still `pending` (saved, never paid). Fulfilment activates only from `pending` after a verified
 * payment; staff who want to comp a listing must record a cleared manual payment / entitlement, which
 * activates it through the same fulfilment path. Restore is for rows that WERE live (flagged, paused,
 * removed, sold, expired).
 */
const PAID_LANE_CATEGORIES: ReadonlySet<string> = new Set(["rentas", "bienes-raices", "clases"]);

export type AdminReactivationDecision = { blocked: false } | { blocked: true; code: "payment_required"; message: string };

export function decideAdminReactivation(input: {
  category: string | null | undefined;
  status: string | null | undefined;
  published_at?: string | null;
  expires_at?: string | null;
}): AdminReactivationDecision {
  const category = String(input.category ?? "").trim().toLowerCase();
  const status = String(input.status ?? "").trim().toLowerCase();
  // A pending-payment insert stamps neither `published_at` nor `expires_at`; the first paid activation stamps
  // both. A never-paid row that staff suspended / archived (flagged / removed) must therefore stay blocked,
  // otherwise suspend -> unsuspend launders it live without payment.
  const everLive = Boolean(String(input.published_at ?? "").trim() || String(input.expires_at ?? "").trim());
  const provenNeverLive = status !== "" && !everLive;
  if (PAID_LANE_CATEGORIES.has(category) && (status === "pending" || provenNeverLive)) {
    return {
      blocked: true,
      code: "payment_required",
      message:
        "This paid-lane listing has never been paid for (status pending). It goes live only through a verified payment or a cleared manual payment — Restore/Republish cannot activate it.",
    };
  }
  return { blocked: false };
}
