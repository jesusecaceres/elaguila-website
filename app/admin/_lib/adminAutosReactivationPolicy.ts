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
  | { blocked: true; code: "payment_required" | "renewal_required"; message: string };

export const AUTOS_PRE_PUBLISH_STATUSES: ReadonlySet<string> = new Set(["draft", "pending_payment", "payment_failed"]);

export function decideAutosAdminReactivation(row: {
  status?: string | null;
  published_at?: string | null;
  /** Privado is a fixed-term product (`expires_at`); dealer / negocios rows have none. */
  lane?: string | null;
  expires_at?: string | null;
  /** Test seam; defaults to the current time. */
  nowMs?: number;
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
  // Privado term elapsed: Restore / Republish never write `expires_at`, so an elapsed term cannot be revived by Admin
  // (the public reader would hide the row anyway; refusing keeps Admin from reporting an expired listing "active").
  if (String(row.lane ?? "").trim().toLowerCase() === "privado") {
    const raw = String(row.expires_at ?? "").trim();
    const ms = raw ? new Date(raw).getTime() : NaN;
    if (Number.isFinite(ms) && ms <= (row.nowMs ?? Date.now())) {
      return {
        blocked: true,
        code: "renewal_required",
        message:
          "renewal required: this private-seller vehicle listing's paid term has elapsed. Restore / Republish never grant a new term - the owner must renew through checkout.",
      };
    }
  }
  return { blocked: false };
}
