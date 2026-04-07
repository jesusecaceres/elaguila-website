import type { TiendaOrderSource } from "../types/orderHandoff";
import type { PrintUploadProductSlug } from "../product-configurators/print-upload/types";
import { PRINT_UPLOAD_PRODUCT_SLUGS } from "../product-configurators/print-upload/productConfigs";
import type { BusinessCardProductSlug } from "../product-configurators/business-cards/types";

export const BUSINESS_CARD_ORDER_SLUGS: BusinessCardProductSlug[] = [
  "standard-business-cards",
  "two-sided-business-cards",
];

export type TiendaOrderHandoffSegment = { source: TiendaOrderSource; slug: string };

export function getRegisteredOrderHandoffRoutes(): TiendaOrderHandoffSegment[] {
  const bc: TiendaOrderHandoffSegment[] = BUSINESS_CARD_ORDER_SLUGS.map((slug) => ({
    source: "business-cards",
    slug,
  }));
  const pu: TiendaOrderHandoffSegment[] = PRINT_UPLOAD_PRODUCT_SLUGS.map((slug: PrintUploadProductSlug) => ({
    source: "print-upload",
    slug,
  }));
  return [...bc, ...pu];
}

export function isTiendaOrderSource(s: string): s is TiendaOrderSource {
  return s === "business-cards" || s === "print-upload";
}

export function isRegisteredOrderHandoff(source: string, slug: string): boolean {
  if (!isTiendaOrderSource(source)) return false;
  if (source === "business-cards") {
    return BUSINESS_CARD_ORDER_SLUGS.includes(slug as BusinessCardProductSlug);
  }
  return PRINT_UPLOAD_PRODUCT_SLUGS.includes(slug as PrintUploadProductSlug);
}
