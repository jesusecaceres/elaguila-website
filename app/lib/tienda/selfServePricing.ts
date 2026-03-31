/**
 * Self-serve Tienda pricing resolution: admin catalog + pricing_rules → order-summary display.
 * No payment logic — honest reference / display / fallback only.
 */

import type { TiendaCatalogItemRow, TiendaCatalogPricingRuleRow } from "./tiendaCatalogTypes";
import { catalogItemPriceSummary } from "./tiendaCatalogPricing";

export type SelfServePricingMatchInput = {
  productSlug: string;
  quantity: number;
  sidesKey?: string | null;
  sizeKey?: string | null;
  stockKey?: string | null;
  finishKey?: string | null;
};

export type SelfServeOrderPricingSnapshot = {
  kind: "admin_rule_hit" | "catalog_display" | "unavailable";
  headlineEs: string;
  headlineEn: string;
  sublineEs: string | null;
  sublineEn: string | null;
};

/** Products intended for this pricing pass (admin-linked catalog + rules). */
export const SELF_SERVE_CATALOG_PRICING_SLUGS = new Set([
  "standard-business-cards",
  "two-sided-business-cards",
  "flyers-standard",
  "brochures-standard",
  "retractable-banners",
  "yard-signs",
  "stickers-standard",
]);

export function isSelfServeCatalogPricingProduct(slug: string): boolean {
  return SELF_SERVE_CATALOG_PRICING_SLUGS.has(slug);
}

function fmtUsd(n: number, lang: "es" | "en"): string {
  return new Intl.NumberFormat(lang === "en" ? "en-US" : "es-MX", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function ruleSpecificity(r: TiendaCatalogPricingRuleRow): number {
  let s = 0;
  if (r.quantity_min != null || r.quantity_max != null) s += 1;
  if (r.size_key) s += 2;
  if (r.stock_key) s += 2;
  if (r.finish_key) s += 1;
  if (r.sides_key) s += 2;
  return s;
}

/** Whether an active rule applies to the current configuration. */
export function pricingRuleMatches(r: TiendaCatalogPricingRuleRow, ctx: SelfServePricingMatchInput): boolean {
  if (!r.active) return false;
  if (r.quantity_min != null && ctx.quantity < r.quantity_min) return false;
  if (r.quantity_max != null && ctx.quantity > r.quantity_max) return false;
  if (r.size_key) {
    if (!ctx.sizeKey || r.size_key !== ctx.sizeKey) return false;
  }
  if (r.stock_key) {
    if (!ctx.stockKey || r.stock_key !== ctx.stockKey) return false;
  }
  if (r.finish_key) {
    if (!ctx.finishKey || r.finish_key !== ctx.finishKey) return false;
  }
  if (r.sides_key) {
    if (!ctx.sidesKey || r.sides_key !== ctx.sidesKey) return false;
  }
  return true;
}

export function pickBestPricingRule(
  rules: TiendaCatalogPricingRuleRow[],
  ctx: SelfServePricingMatchInput
): TiendaCatalogPricingRuleRow | null {
  const candidates = rules.filter((r) => pricingRuleMatches(r, ctx));
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => ruleSpecificity(b) - ruleSpecificity(a) || a.sort_order - b.sort_order);
  return candidates[0] ?? null;
}

export function buildSelfServeOrderPricingSnapshot(
  item: TiendaCatalogItemRow | null,
  rules: TiendaCatalogPricingRuleRow[],
  ctx: SelfServePricingMatchInput
): SelfServeOrderPricingSnapshot {
  const contactSubEs =
    "Leonix confirmará el total final tras revisar tu pedido. Mejor contacto: teléfono u oficina; el correo es respaldo.";
  const contactSubEn =
    "Leonix will confirm the final total after reviewing your order. Best contact: phone or office visit; email is secondary.";

  if (!item) {
    return {
      kind: "unavailable",
      headlineEs: "Precio: Leonix lo confirmará contigo",
      headlineEn: "Pricing: Leonix will confirm with you",
      sublineEs: contactSubEs,
      sublineEn: contactSubEn,
    };
  }

  const matched = pickBestPricingRule(rules, ctx);
  if (matched) {
    const amt = Number(matched.price);
    const safe = Number.isFinite(amt) ? amt : null;
    if (safe != null) {
      return {
        kind: "admin_rule_hit",
        headlineEs: `Referencia (tabla admin): ${fmtUsd(safe, "es")} — cant. ${ctx.quantity}`,
        headlineEn: `Admin table reference: ${fmtUsd(safe, "en")} — qty ${ctx.quantity}`,
        sublineEs:
          "No es total final de checkout. Refleja la regla activa en catálogo para esta combinación; Leonix valida en revisión.",
        sublineEn:
          "Not a final checkout total. Reflects the active catalog rule for this configuration; Leonix validates on review.",
      };
    }
  }

  const summaryEs = catalogItemPriceSummary(item, "es");
  const summaryEn = catalogItemPriceSummary(item, "en");
  const hasDisplay =
    item.pricing_mode === "display_only" ||
    item.pricing_mode === "quote_only" ||
    (item.price_label?.trim() ?? "").length > 0 ||
    item.base_price != null;

  if (hasDisplay || item.pricing_mode === "calculated_ready") {
    return {
      kind: "catalog_display",
      headlineEs: summaryEs,
      headlineEn: summaryEn,
      sublineEs:
        matched == null && rules.length > 0
          ? "No hay regla de precio que coincida con cantidad/opciones actuales. Leonix cotizará o ajustará en revisión."
          : item.pricing_mode === "calculated_ready"
            ? "Los totales finales siguen el configurador y la tabla admin cuando las reglas estén completas."
            : contactSubEs,
      sublineEn:
        matched == null && rules.length > 0
          ? "No pricing rule matches the current quantity/options. Leonix will quote or adjust on review."
          : item.pricing_mode === "calculated_ready"
            ? "Final totals follow the configurator and admin table when rule coverage is complete."
            : contactSubEn,
    };
  }

  return {
    kind: "unavailable",
    headlineEs: "Precio: consultar con Leonix",
    headlineEn: "Pricing: contact Leonix",
    sublineEs: contactSubEs,
    sublineEn: contactSubEn,
  };
}
