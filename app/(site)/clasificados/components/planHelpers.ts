export type ListingPlan = "free" | "pro";

const EN_VENTA_CATEGORIES = new Set(["en-venta", "en_venta", "for-sale", "for_sale"]);

function listingCategory(raw: unknown): string {
  return (typeof raw === "string" ? raw : "").toLowerCase().trim();
}

export function normalizePlan(raw: unknown): ListingPlan {
  const v = (typeof raw === "string" ? raw : "").toLowerCase().trim();
  if (!v) return "free";
  // LOCKED: only explicit listing-level Free + Pro values are accepted here.
  // Do not treat account membership, business/lite/premium strings, or generic tiers as universal Pro.
  if (v === "pro") return "pro";
  if (v === "free" || v === "gratis") return "free";
  return "free";
}

export function inferListingPlan(listing: any): ListingPlan {
  if (!listing) return "free";
  const category = listingCategory(listing.category ?? listing.category_slug ?? listing.listing_category);
  const isEnVenta = EN_VENTA_CATEGORIES.has(category);

  // En Venta keeps Free/Pro semantics. Other categories must use categoryAdPlans/listing row fields.
  if (isEnVenta && (listing.isPro === true || listing.pro === true || listing.is_pro === true)) return "pro";

  // Listing-level plan keys only. Account-level membership keys are intentionally excluded.
  const candidates = [
    listing.plan,
    listing.listing_plan,
    listing.ad_plan,
    listing.plan_tier,
  ];

  for (const c of candidates) {
    const plan = normalizePlan(c);
    if (plan === "pro") return isEnVenta ? "pro" : "free";
  }

  return "free";
}

export function isProListing(listing: any): boolean {
  return inferListingPlan(listing) === "pro";
}
