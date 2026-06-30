/** Payment state stored in `listings.listing_json.br_publish` (no migration). */

export type BrListingPaymentMeta = {
  payment_status?: "pending" | "paid" | "failed" | "canceled";
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  lane?: "negocio" | "privado";
  paid_at?: string | null;
};

export function readBrListingPaymentMeta(listingJson: unknown): BrListingPaymentMeta {
  if (!listingJson || typeof listingJson !== "object") return {};
  const root = listingJson as Record<string, unknown>;
  const br = root.br_publish;
  if (!br || typeof br !== "object") return {};
  const o = br as Record<string, unknown>;
  return {
    payment_status:
      o.payment_status === "pending" ||
      o.payment_status === "paid" ||
      o.payment_status === "failed" ||
      o.payment_status === "canceled"
        ? o.payment_status
        : undefined,
    stripe_checkout_session_id:
      typeof o.stripe_checkout_session_id === "string" ? o.stripe_checkout_session_id : null,
    stripe_payment_intent_id:
      typeof o.stripe_payment_intent_id === "string" ? o.stripe_payment_intent_id : null,
    lane: o.lane === "privado" ? "privado" : o.lane === "negocio" ? "negocio" : undefined,
    paid_at: typeof o.paid_at === "string" ? o.paid_at : null,
  };
}

export function mergeBrListingPaymentMeta(
  listingJson: unknown,
  patch: BrListingPaymentMeta,
): Record<string, unknown> {
  const base =
    listingJson && typeof listingJson === "object" && !Array.isArray(listingJson)
      ? { ...(listingJson as Record<string, unknown>) }
      : {};
  const prev = readBrListingPaymentMeta(base);
  base.br_publish = { ...prev, ...patch };
  return base;
}
