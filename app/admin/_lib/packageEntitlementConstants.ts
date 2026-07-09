import type { PackageEntitlementTier } from "@/app/lib/listingPlans/packageEntitlements";

export const PACKAGE_ENTITLEMENT_TIERS: { value: PackageEntitlementTier; label: string }[] = [
  { value: "premium", label: "Premium print (Destacados module)" },
  { value: "full_page", label: "Full-page print (results priority)" },
  { value: "half_page", label: "Half-page print (listing + Republish + Boost)" },
  { value: "quarter_page", label: "Quarter-page print" },
  { value: "classified_print", label: "Classified print" },
  { value: "digital_only", label: "Digital-only (Republish / Boost)" },
];

export const PACKAGE_ENTITLEMENT_CATEGORIES = [
  { value: "servicios", label: "Servicios" },
  { value: "restaurantes", label: "Restaurantes" },
  { value: "autos", label: "Autos" },
  { value: "bienes-raices", label: "Bienes Raíces" },
  { value: "rentas", label: "Rentas" },
] as const;

export const PACKAGE_ENTITLEMENT_LISTING_SOURCES = [
  { value: "servicios_public_listings", label: "servicios_public_listings", categories: ["servicios"] },
  { value: "restaurantes_public_listings", label: "restaurantes_public_listings", categories: ["restaurantes"] },
  { value: "autos_classifieds_listings", label: "autos_classifieds_listings", categories: ["autos"] },
  { value: "listings", label: "listings (generic)", categories: ["bienes-raices", "rentas", "en-venta"] },
] as const;

export const PACKAGE_ENTITLEMENT_PLACEMENT_SCOPES = [
  { value: "homepage", label: "Homepage Destacados" },
  { value: "clasificados", label: "Clasificados hub" },
  { value: "category", label: "Category landing" },
  { value: "results", label: "Results module" },
] as const;

export const PREMIUM_INVENTORY_SOFT_CAP = 10;

export const PACKAGE_ENTITLEMENT_STATUS_FILTERS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "expired", label: "Expired" },
  { value: "revoked", label: "Revoked" },
  { value: "pending_listing", label: "Pending listing (no listing ID)" },
] as const;

export const PACKAGE_ENTITLEMENT_TRACKER_FETCH_LIMIT = 150;

export const PACKAGE_ENTITLEMENT_CONTRACT_TERMS = [
  { value: "month_to_month", label: "Month-to-month (0% off)" },
  { value: "3_month", label: "3 months (10% off)" },
  { value: "6_month", label: "6 months (15% off)" },
  { value: "12_month", label: "12 months (20% off)" },
  { value: "founding_partner", label: "Founding partner (25% off, owner approval)" },
] as const;

export const PACKAGE_ENTITLEMENT_PRINT_PLACEMENT_TYPES = [
  { value: "back_cover", label: "Back cover (highest priority)" },
  { value: "inside_page", label: "Inside page" },
  { value: "regular_full_page", label: "Regular full-page" },
  { value: "half_page", label: "Half-page" },
  { value: "quarter_page", label: "Quarter-page" },
  { value: "classified_print", label: "Classified print" },
  { value: "internal_reserved", label: "Internal / reserved (Leonix/event/partner)" },
] as const;

export const PACKAGE_ENTITLEMENT_PROMO_CODE_TYPES = [
  { value: "entitlement", label: "Entitlement / package access" },
  { value: "discount", label: "Discount only" },
  { value: "newsletter", label: "Newsletter signup code (unique / send later)" },
  { value: "sms", label: "SMS signup code (unique / send later)" },
  { value: "sales_rep", label: "Sales rep attribution" },
  { value: "contract", label: "Contract / package term" },
  { value: "founding_partner", label: "Founding partner" },
  { value: "owner_override", label: "Owner override" },
] as const;
