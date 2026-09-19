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

/** Categories whose paid term is enforced on `listings.expires_at` (same set as `isListingRowWithinEnforcedTerm`). */
const TERM_ENFORCED_CATEGORIES: ReadonlySet<string> = new Set(["rentas", "clases"]);

export type AdminReactivationDecision =
  | { blocked: false }
  | { blocked: true; code: "payment_required" | "renewal_required"; message: string };

/**
 * "Show public" (is_published=true) is not an activation authority (Gate 5). It may only re-show a row that is
 * already active, and never one held by the payment system. PURE.
 */
export function decideAdminShowPublic(row: {
  status?: string | null;
  suspended_reason?: string | null;
}): { blocked: false } | { blocked: true; code: "not_active" | "payment_suspension_active"; message: string } {
  const status = String(row.status ?? "").trim().toLowerCase();
  const reason = String(row.suspended_reason ?? "").trim().toLowerCase();
  if (status === "suspended" || reason === "payment" || reason === "chargeback") {
    return {
      blocked: true,
      code: "payment_suspension_active",
      message: "This listing is suspended by the payment system. Show public cannot override it - it returns only when the payment is cured.",
    };
  }
  if (status !== "active") {
    return {
      blocked: true,
      code: "not_active",
      message: "Only an active listing can be shown again. Use Restore / Republish (they enforce payment, term and capacity) for other statuses.",
    };
  }
  return { blocked: false };
}

export function decideAdminReactivation(input: {
  category: string | null | undefined;
  status: string | null | undefined;
  published_at?: string | null;
  expires_at?: string | null;
  /**
   * `listings.is_free`. F6 (2026-09 final free-circuit audit): a FREE Clases row never gets `published_at` /
   * `expires_at` (no payment stamps them), so the never-live evidence rule below wrongly treated every suspended
   * free Clases listing as never-paid and staff could never Restore / Republish it. A free Clases row
   * (`is_free === true`) is exempt from THAT rule only; `pending` still blocks, and paid Clases / Rentas / Bienes
   * keep the rule unchanged (missing / null / false is_free = paid, fail closed).
   */
  is_free?: boolean | null;
  /** Test seam; defaults to the current time. */
  nowMs?: number;
}): AdminReactivationDecision {
  const category = String(input.category ?? "").trim().toLowerCase();
  const status = String(input.status ?? "").trim().toLowerCase();
  // A pending-payment insert stamps neither `published_at` nor `expires_at`; the first paid activation stamps
  // both. A never-paid row that staff suspended / archived (flagged / removed) must therefore stay blocked,
  // otherwise suspend -> unsuspend launders it live without payment.
  const everLive = Boolean(String(input.published_at ?? "").trim() || String(input.expires_at ?? "").trim());
  const freeClasesRow = category === "clases" && input.is_free === true;
  const provenNeverLive = status !== "" && !everLive && !freeClasesRow;
  if (PAID_LANE_CATEGORIES.has(category) && (status === "pending" || provenNeverLive)) {
    return {
      blocked: true,
      code: "payment_required",
      message:
        "This paid-lane listing has never been paid for (status pending). It goes live only through a verified payment or a cleared manual payment — Restore/Republish cannot activate it.",
    };
  }
  // A paid term that has ELAPSED cannot be revived by Admin: Restore / Republish never write `expires_at`, so the row
  // would be flipped "active" with an expired term (an expired entitlement treated as active). Renewal is a paid
  // Revenue OS action.
  if (TERM_ENFORCED_CATEGORIES.has(category)) {
    const raw = String(input.expires_at ?? "").trim();
    const ms = raw ? new Date(raw).getTime() : NaN;
    if (Number.isFinite(ms) && ms <= (input.nowMs ?? Date.now())) {
      return {
        blocked: true,
        code: "renewal_required",
        message:
          "renewal required: this listing's paid term has elapsed. Restore / Republish never grant a new term - the owner must renew through checkout.",
      };
    }
  }
  return { blocked: false };
}
