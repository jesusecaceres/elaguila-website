/**
 * Pricing-ready layer: display today; calculated rules later via admin + checkout integration.
 */

import type { TiendaCatalogItemRow } from "./tiendaCatalogTypes";

export function formatCatalogBasePrice(amount: number | null | undefined, lang: "es" | "en"): string | null {
  if (amount == null || !Number.isFinite(Number(amount))) return null;
  return new Intl.NumberFormat(lang === "en" ? "en-US" : "es-MX", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

/** Customer-facing price line from catalog item (display / quote / calculated stub). */
export function catalogItemPriceSummary(item: TiendaCatalogItemRow, lang: "es" | "en"): string {
  const mode = item.pricing_mode;
  if (mode === "quote_only") {
    return lang === "en" ? "Quote required" : "Cotización requerida";
  }
  if (item.price_label?.trim()) {
    return item.price_label.trim();
  }
  const base = formatCatalogBasePrice(
    item.base_price != null ? Number(item.base_price) : null,
    lang
  );
  if (base) {
    return lang === "en" ? `Starting at ${base}` : `Desde ${base}`;
  }
  if (mode === "calculated_ready") {
    return lang === "en" ? "Pricing in configurator" : "Precios en el configurador";
  }
  return lang === "en" ? "Contact for pricing" : "Consultar precio";
}

/**
 * TODO: merge active pricing_rules + meta.checkoutHints with self-serve cart lines.
 * Stub returns null — future admin pricing will supply resolved cents or line items.
 */
export function resolveCalculatedUnitPriceCents(_input: {
  itemId: string;
  quantity: number;
  sizeKey?: string;
  stockKey?: string;
}): number | null {
  return null;
}
