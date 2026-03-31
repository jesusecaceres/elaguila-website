/**
 * Admin-managed Tienda catalog — mirrors DB + integration contracts.
 */

export const TIENDA_CATALOG_PRICING_MODES = ["display_only", "calculated_ready", "quote_only"] as const;
export type TiendaCatalogPricingMode = (typeof TIENDA_CATALOG_PRICING_MODES)[number];

export const TIENDA_CATALOG_CTA_MODES = [
  "self_serve",
  "upload_ready",
  "request_quote",
  "contact_us",
  "catalog_only",
  "representative_assisted",
] as const;
export type TiendaCatalogCtaMode = (typeof TIENDA_CATALOG_CTA_MODES)[number];

export function isTiendaCatalogPricingMode(s: string): s is TiendaCatalogPricingMode {
  return (TIENDA_CATALOG_PRICING_MODES as readonly string[]).includes(s);
}

export function isTiendaCatalogCtaMode(s: string): s is TiendaCatalogCtaMode {
  return (TIENDA_CATALOG_CTA_MODES as readonly string[]).includes(s);
}

/** Future: versioned pricing config inside meta + pricing_rules table */
export type TiendaCatalogItemMeta = {
  pricingContractVersion?: number;
  /** Reserved: map to checkout line calculators */
  checkoutHints?: Record<string, unknown>;
  source?: string;
};

export type TiendaCatalogItemRow = {
  id: string;
  created_at: string;
  updated_at: string;
  title_es: string;
  title_en: string;
  slug: string;
  category_slug: string;
  subcategory_slug: string | null;
  short_description_es: string;
  short_description_en: string;
  description_es: string;
  description_en: string;
  pricing_mode: string;
  price_label: string | null;
  price_note: string | null;
  base_price: string | number | null;
  cta_mode: string;
  is_featured: boolean;
  is_live: boolean;
  is_hidden: boolean;
  sort_order: number;
  badge_label: string | null;
  specialty_flag: boolean;
  storefront_visible: boolean;
  category_visible: boolean;
  office_preferred: boolean;
  phone_preferred: boolean;
  email_allowed: boolean;
  meta: TiendaCatalogItemMeta;
  linked_product_slug: string | null;
};

export type TiendaCatalogImageRow = {
  id: string;
  item_id: string;
  created_at: string;
  image_url: string;
  alt_es: string;
  alt_en: string;
  sort_order: number;
  is_primary: boolean;
};

export type TiendaCatalogPricingRuleRow = {
  id: string;
  item_id: string;
  rule_type: string;
  quantity_min: number | null;
  quantity_max: number | null;
  size_key: string | null;
  stock_key: string | null;
  finish_key: string | null;
  sides_key: string | null;
  price: string | number;
  sort_order: number;
  active: boolean;
  created_at: string;
};

export type TiendaCatalogItemWithMedia = TiendaCatalogItemRow & {
  images: TiendaCatalogImageRow[];
  pricing_rules: TiendaCatalogPricingRuleRow[];
};
