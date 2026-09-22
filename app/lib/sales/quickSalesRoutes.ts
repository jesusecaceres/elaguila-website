/**
 * QUICK SALES ENTRY CONSOLIDATION — the ONE place that spells the staff cockpit's URL.
 *
 * `/admin/workspace/quick-sales` is the sole staff entry for creating a Leonix-managed client ad in
 * the four paid categories. Every other admin surface that used to open a category's PUBLIC
 * application on the staff member's own browser (the launchpad, Create for Client, the Managed
 * inventory, the category queues) now builds its link here, so a rename or a new preselection
 * parameter changes one file and never leaves a stale launcher pointing at a customer login.
 *
 * Pure: no server, no React, no database — importable from server pages, client components and
 * the node:assert verifiers alike.
 */
import { QUICK_SALES_CATEGORIES, isQuickSalesCategory, type QuickSalesCategory } from "./quickSalesCategories";

export const QUICK_SALES_WORKSPACE_PATH = "/admin/workspace/quick-sales";

export type QuickSalesHrefInput = {
  category?: string | null;
  businessId?: string | null;
  /** Reopen a specific Leonix-prepared draft: custody is re-established BOUND to this row. */
  listingId?: string | null;
  lang?: "es" | "en" | null;
};

/**
 * Build the cockpit link with optional preselection. An unknown category is dropped rather than
 * forwarded, so a launcher can never deep-link the workspace into a category it does not sell.
 */
export function buildQuickSalesHref(input: QuickSalesHrefInput = {}): string {
  const params = new URLSearchParams();
  const category = (input.category ?? "").trim();
  if (isQuickSalesCategory(category)) params.set("category", category);
  const businessId = (input.businessId ?? "").trim();
  if (businessId) params.set("businessId", businessId);
  const listingId = (input.listingId ?? "").trim();
  if (listingId) params.set("listingId", listingId);
  if (input.lang === "en" || input.lang === "es") params.set("lang", input.lang);
  const qs = params.toString();
  return qs ? `${QUICK_SALES_WORKSPACE_PATH}?${qs}` : QUICK_SALES_WORKSPACE_PATH;
}

/**
 * Quick Business registry keys (the launchpad's vocabulary) → the Quick Sales category that sells
 * them. Dealer and Bienes Negocio are the two whose registry key differs from the sales key.
 */
const QUICK_BUSINESS_KEY_TO_SALES_CATEGORY: Record<string, QuickSalesCategory> = {
  servicios: "servicios",
  restaurantes: "restaurantes",
  "autos-dealer": "autos",
  "bienes-negocio": "bienes-raices",
};

export function quickSalesCategoryForQuickBusinessKey(key: string): QuickSalesCategory | null {
  return QUICK_BUSINESS_KEY_TO_SALES_CATEGORY[(key ?? "").trim()] ?? null;
}

/** The public-gateway keys Quick Sales owns; every other gateway key keeps its existing launcher. */
export function isQuickSalesGatewayKey(key: string): key is QuickSalesCategory {
  return (QUICK_SALES_CATEGORIES as readonly string[]).includes(key);
}
