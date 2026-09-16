/**
 * Staff-Created Business Profile pipeline. Mirrors the CHECK constraints in
 * supabase/migrations/20260916150000_business_profile_foundation.sql exactly.
 *
 * This is a presentation layer only -- it never repeats a field that already has a canonical
 * home (business name/phone/email/website/address/languages/socials all stay on businesses /
 * business_contacts / business_service_areas / business_digital_profiles / business_custom_links).
 */

export type BusinessProfileStatus = "draft" | "published";

export type BusinessProfileHighlight = {
  title: string;
  description: string;
};

export type BusinessProfile = {
  id: string;
  businessId: string;
  status: BusinessProfileStatus;
  headline: string | null;
  shortDescription: string | null;
  aboutDescription: string | null;
  logoUrl: string | null;
  heroImageUrl: string | null;
  galleryImages: readonly string[];
  featuredHighlights: readonly BusinessProfileHighlight[];
  createdByType: "staff" | "owner";
  createdByRef: string | null;
  updatedByType: "staff" | "owner" | null;
  updatedByRef: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  firstPublishedAt: string | null;
};

export type BusinessProfileDraftInput = {
  headline: string | null;
  shortDescription: string | null;
  aboutDescription: string | null;
  logoUrl: string | null;
  heroImageUrl: string | null;
  galleryImages: readonly string[];
  featuredHighlights: readonly BusinessProfileHighlight[];
};

export type PublishBusinessProfileResult =
  | { ok: true; businessId: string }
  | { ok: false; error: "not_a_member" | "profile_not_found" | "no_active_entitlement" | "not_authenticated" | "unknown_error" };

export type UnpublishBusinessProfileResult =
  | { ok: true; businessId: string }
  | { ok: false; error: "not_a_member" | "not_authenticated" | "unknown_error" };

export type SaveOwnBusinessProfileDraftResult =
  | { ok: true; businessId: string }
  | { ok: false; error: "not_a_member" | "not_authenticated" | "unknown_error" };

/**
 * Gate 07 -- business-level (not listing-level) commercial benefit that authorizes releasing/
 * publishing a Business Profile. Mirrors the CHECK constraints on business_profile_entitlements
 * in supabase/migrations/20260916150000_business_profile_foundation.sql exactly. source_type
 * reuses three of listing_package_entitlements.grant_source's existing values (admin_manual/comp/
 * partner) plus manual_cleared_payment -- the same vocabulary as every other Leonix commercial
 * grant, not a new one invented for this table alone.
 */
export type BusinessProfileEntitlementStatus = "active" | "scheduled" | "expired" | "revoked";
export type BusinessProfileEntitlementSourceType = "admin_manual" | "comp" | "partner" | "manual_cleared_payment";

export type BusinessProfileEntitlement = {
  id: string;
  businessId: string;
  status: BusinessProfileEntitlementStatus;
  sourceType: BusinessProfileEntitlementSourceType;
  sourceReference: string | null;
  startsAt: string;
  expiresAt: string | null;
  grantedAt: string;
  grantedByRosterId: string | null;
  grantedByEmail: string | null;
  revokedAt: string | null;
  revokedByRosterId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GrantBusinessProfileEntitlementInput = {
  sourceType: BusinessProfileEntitlementSourceType;
  sourceReference: string | null;
  expiresAt: string | null;
};

/** The truthful, resolved commercial state a staff member sees -- never a client-submitted boolean. */
export type BusinessProfileCommercialState = "not_purchased" | "active" | "complimentary" | "expired";
