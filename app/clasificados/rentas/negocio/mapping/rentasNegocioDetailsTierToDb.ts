/**
 * Maps publish flow `details.rentasTier` to DB `listings.rentas_tier` (Rentas negocio path).
 * Preserves insert semantics: only "business_plus" and "negocio" → "plus"; else "standard".
 */
export function mapRentasNegocioDetailsTierToDb(detailsRentasTier: string): "plus" | "standard" {
  const tier = detailsRentasTier.trim();
  return tier === "business_plus" || tier === "negocio" ? "plus" : "standard";
}
