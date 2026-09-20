/**
 * Quick Business — adapter registry (client side). One adapter per LIVE category. A category whose registry status
 * is "direct" (Autos Dealer, Bienes Raíces negocio/agent — both REQUIRE structured inventory) gets no adapter; the
 * intake route then shows the honest "use the full application" card driven by the server-safe registry.
 */

import type { QuickBusinessCategoryAdapter, QuickBusinessCategoryKey } from "@/app/lib/quickBusiness/quickBusinessTypes";
import { restaurantesQuickBusinessAdapter } from "./restaurantesQuickBusinessAdapter";
import { serviciosQuickBusinessAdapter } from "./serviciosQuickBusinessAdapter";

const ADAPTERS: Partial<Record<QuickBusinessCategoryKey, QuickBusinessCategoryAdapter>> = {
  servicios: serviciosQuickBusinessAdapter,
  restaurantes: restaurantesQuickBusinessAdapter,
};

export function getQuickBusinessAdapter(key: QuickBusinessCategoryKey): QuickBusinessCategoryAdapter | null {
  return ADAPTERS[key] ?? null;
}
