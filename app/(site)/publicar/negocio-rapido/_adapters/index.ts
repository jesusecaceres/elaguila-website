/**
 * Quick Business — adapter registry (client side). One adapter per LIVE category. Since the Dealer + Bienes closeout
 * (PM decision: Quick may ask for the customer's REAL first vehicle / first property because the canonical products
 * are vehicle-first / property-first) all four Core categories have an adapter. A category whose registry status is
 * "direct" (none today) would get no adapter and the intake route would show the honest "use the full application" card.
 */

import type { QuickBusinessCategoryAdapter, QuickBusinessCategoryKey } from "@/app/lib/quickBusiness/quickBusinessTypes";
import { autosDealerQuickBusinessAdapter } from "./autosDealerQuickBusinessAdapter";
import { bienesNegocioQuickBusinessAdapter } from "./bienesNegocioQuickBusinessAdapter";
import { restaurantesQuickBusinessAdapter } from "./restaurantesQuickBusinessAdapter";
import { serviciosQuickBusinessAdapter } from "./serviciosQuickBusinessAdapter";

const ADAPTERS: Partial<Record<QuickBusinessCategoryKey, QuickBusinessCategoryAdapter>> = {
  servicios: serviciosQuickBusinessAdapter,
  restaurantes: restaurantesQuickBusinessAdapter,
  "autos-dealer": autosDealerQuickBusinessAdapter,
  "bienes-negocio": bienesNegocioQuickBusinessAdapter,
};

export function getQuickBusinessAdapter(key: QuickBusinessCategoryKey): QuickBusinessCategoryAdapter | null {
  return ADAPTERS[key] ?? null;
}
