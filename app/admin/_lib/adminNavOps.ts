/** Launch Leads inbox — promo / print-quote filtered view (query param, not a separate route). */
export const ADMIN_LEADS_PROMO_INBOX_HREF = "/admin/leads/inbox?view=promo";

export const ADMIN_LAUNCH_LEADS_INBOX_HREF = "/admin/leads/inbox";

export type AdminLeadsInboxOpsView =
  | "all"
  | "needs_reply"
  | "promo"
  | "advertising"
  | "media_kit"
  | "archived";

/** Maps `?view=` query values to inbox ops views; unknown values return undefined. */
export function parseAdminLeadsInboxViewParam(raw: string | undefined): AdminLeadsInboxOpsView | undefined {
  if (!raw?.trim()) return undefined;
  const v = raw.trim().toLowerCase();
  if (v === "promo" || v === "promotions") return "promo";
  if (v === "needs_reply" || v === "needs-reply") return "needs_reply";
  if (v === "advertising") return "advertising";
  if (v === "media_kit" || v === "media-kit") return "media_kit";
  if (v === "archived") return "archived";
  if (v === "all") return "all";
  return undefined;
}
