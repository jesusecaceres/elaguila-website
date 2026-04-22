/**
 * Servicios business profile: infer display tier from listing sample / row data.
 */

export type ServicesTier = "standard" | "plus" | "premium";

export function inferServiciosTierFromListing(x: unknown): ServicesTier {
  const rec = x as { servicesTier?: unknown };
  const v = (typeof rec?.servicesTier === "string" ? rec.servicesTier : "").toLowerCase().trim();
  if (v === "premium" || v === "plus" || v === "standard") return v as ServicesTier;
  return "standard";
}
