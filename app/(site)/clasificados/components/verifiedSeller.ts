"use client";

export type AnyListing = Record<string, any> | null | undefined;

/**
 * Verified Seller (Phase 2)
 * IMPORTANT: This helper NEVER "grants" verification.
 * It only returns true when the listing data already contains an explicit verified indicator.
 */
export function isVerifiedSeller(item: AnyListing): boolean {
  if (!item) return false;

  const any = item as any;

  // Explicit booleans
  if (any.verifiedSeller === true) return true;
  if (any.sellerVerified === true) return true;
  if (any.verified === true) return true;

  // Nested structures (future-safe)
  if (any.verification && typeof any.verification === "object") {
    const status = String(any.verification.status || "").toLowerCase();
    if (status === "verified" || status === "active") return true;
    if (any.verification.verified === true) return true;
  }

  if (any.seller && typeof any.seller === "object") {
    if (any.seller.verified === true) return true;
    const sellerStatus = String(any.seller.verificationStatus || "").toLowerCase();
    if (sellerStatus === "verified") return true;
  }

  // Badges arrays (explicit tags)
  const badges: any[] = Array.isArray(any.badges) ? any.badges : [];
  const trustBadges: any[] = Array.isArray(any.trustBadges) ? any.trustBadges : [];
  const all = [...badges, ...trustBadges].map((x) => String(x).toLowerCase());

  if (all.includes("verified") || all.includes("verified_seller") || all.includes("seller_verified")) return true;

  return false;
}
