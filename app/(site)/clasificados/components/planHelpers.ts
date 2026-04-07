export type ListingPlan = "free" | "pro";

export function normalizePlan(raw: unknown): ListingPlan {
  const v = (typeof raw === "string" ? raw : "").toLowerCase().trim();
  if (!v) return "free";
  // LOCKED: only Free + LEONIX Pro exist publicly.
  // Legacy/other tiers map to Pro.
  if (v.includes("pro") || v.includes("business") || v.includes("lite") || v.includes("premium")) return "pro";
  return "free";
}

export function inferListingPlan(listing: any): ListingPlan {
  if (!listing) return "free";

  // boolean flags
  if (listing.isPro === true || listing.pro === true || listing.is_pro === true) return "pro";

  // common tier keys
  const candidates = [
    listing.plan,
    listing.tier,
    listing.membership,
    listing.membershipTier,
    listing.membership_tier,
    listing.role,
    listing.userPlan,
    listing.user_plan,
    listing.sellerPlan,
    listing.seller_plan,
    listing.sellerType, // legacy sample data uses sellerType
    listing.seller_type,
  ];

  for (const c of candidates) {
    const plan = normalizePlan(c);
    if (plan === "pro") return "pro";
  }

  return "free";
}

export function isProListing(listing: any): boolean {
  return inferListingPlan(listing) === "pro";
}
