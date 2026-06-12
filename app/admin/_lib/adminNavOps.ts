/** Launch Leads inbox — promo / print-quote filtered view (query param, not a separate route). */
export const ADMIN_LEADS_PROMO_INBOX_HREF = "/admin/leads/inbox?view=promo";

export const ADMIN_LAUNCH_LEADS_INBOX_HREF = "/admin/leads/inbox";

export const ADMIN_LEADS_PROMO_EMPTY_STATE =
  "No promotional product / print quote leads match this view.";

/** Query values that open the Promocionales inbox view. */
export const ADMIN_LEADS_PROMO_VIEW_PARAMS = new Set(["promo", "promotions", "promocionales"]);

export function isAdminLeadsPromoViewParam(raw: string | null | undefined): boolean {
  if (!raw?.trim()) return false;
  return ADMIN_LEADS_PROMO_VIEW_PARAMS.has(raw.trim().toLowerCase());
}

/** Identify promotional product / print quote leads using persisted lead fields. */
export function isPromotionalLeadRow(row: {
  inquiry_type?: string | null;
  source_cta?: string | null;
  source_page?: string | null;
  message?: string | null;
}): boolean {
  const page = String(row.source_page ?? "");
  const cta = String(row.source_cta ?? "");
  const msg = String(row.message ?? "");
  const hay = `${page} ${cta} ${msg}`;
  return (
    row.inquiry_type === "promotionalProducts" ||
    cta === "promo_quote" ||
    /productos-promocion|cotizacion-general|tienda.contacto|tienda_contacto|productos_promocion/i.test(hay) ||
    /promo|print|quote|impres|promocional/i.test(hay)
  );
}

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
  if (v === "promo" || v === "promotions" || v === "promocionales") return "promo";
  if (v === "needs_reply" || v === "needs-reply") return "needs_reply";
  if (v === "advertising") return "advertising";
  if (v === "media_kit" || v === "media-kit") return "media_kit";
  if (v === "archived") return "archived";
  if (v === "all") return "all";
  return undefined;
}
