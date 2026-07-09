/** Payment state stored in `listings.listing_json.rentas_publish` (no migration). */

export type RentasListingPaymentMeta = {
  payment_status?: "pending" | "paid" | "failed" | "canceled";
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  lane?: "negocio" | "privado";
  paid_at?: string | null;
};

export function readRentasListingPaymentMeta(listingJson: unknown): RentasListingPaymentMeta {
  if (!listingJson || typeof listingJson !== "object") return {};
  const root = listingJson as Record<string, unknown>;
  const rp = root.rentas_publish;
  if (!rp || typeof rp !== "object") return {};
  const o = rp as Record<string, unknown>;
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

export function mergeRentasListingPaymentMeta(
  listingJson: unknown,
  patch: RentasListingPaymentMeta,
): Record<string, unknown> {
  const base =
    listingJson && typeof listingJson === "object" && !Array.isArray(listingJson)
      ? { ...(listingJson as Record<string, unknown>) }
      : {};
  const prev = readRentasListingPaymentMeta(base);
  base.rentas_publish = { ...prev, ...patch };
  return base;
}
