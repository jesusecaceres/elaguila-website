/**
 * Owner-side client table writes may only RELIST a listing the owner themselves took offline (paused / sold).
 * pending (unpaid), flagged (staff moderation), draft, expired and removed rows are activated by payment
 * fulfilment, a paid renewal or staff — never by a dashboard button (2026-09 forensic closeout; shared by the
 * listings table, the listing workspace and the editor so no surface re-implements it).
 *
 * PURE: no I/O.
 */
export function dashboardOwnerMayActivateFromStatus(status: unknown): boolean {
  const s = String(status ?? "").trim().toLowerCase();
  return s === "paused" || s === "sold" || s === "active";
}
