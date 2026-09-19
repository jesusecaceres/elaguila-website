/**
 * Admin Restore / Republish of an Autos row must not double as "publish without paying" (2026-09 forensic
 * closeout). Every Autos activation path (Revenue OS fulfilment, dealer capacity RPC, owner activation) stamps
 * `published_at`; a pre-payment row (`draft` / `pending_payment` / `payment_failed`) never has one. Archive is
 * also refused for those statuses, but a row archived by an older build (or by another route) still must not
 * be switched live here without payment evidence.
 *
 * PURE: no I/O.
 */
export type AutosAdminReactivationDecision =
  | { blocked: false }
  | { blocked: true; code: "payment_required"; message: string };

export const AUTOS_PRE_PUBLISH_STATUSES: ReadonlySet<string> = new Set(["draft", "pending_payment", "payment_failed"]);

export function decideAutosAdminReactivation(row: {
  status?: string | null;
  published_at?: string | null;
}): AutosAdminReactivationDecision {
  const status = String(row.status ?? "").trim().toLowerCase();
  const everLive = Boolean(String(row.published_at ?? "").trim());
  if (AUTOS_PRE_PUBLISH_STATUSES.has(status) || !everLive) {
    return {
      blocked: true,
      code: "payment_required",
      message:
        "This vehicle listing was never published (no verified payment / activation on record). Restore or Republish cannot activate it; it goes live only through a verified payment.",
    };
  }
  return { blocked: false };
}
