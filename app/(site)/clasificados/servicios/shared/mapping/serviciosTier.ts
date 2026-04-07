/**
 * Servicios business profile: infer display tier from listing sample / row data.
 */

export type ServicesTier = "standard" | "plus" | "premium";

export function inferServiciosTierFromListing(x: any): ServicesTier {
  const v = (typeof x?.servicesTier === "string" ? x.servicesTier : "").toLowerCase().trim();
  if (v === "premium" || v === "plus" || v === "standard") return v as ServicesTier;
  return "standard";
}
