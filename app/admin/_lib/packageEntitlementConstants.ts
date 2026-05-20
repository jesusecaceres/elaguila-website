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
