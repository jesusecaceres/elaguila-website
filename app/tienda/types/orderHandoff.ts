/**
 * Shared Tienda pre-checkout order handoff contract.
 * Normalized view of business-card and print-upload configurators for the order/review layer.
 */

export type TiendaOrderSource = "business-cards" | "print-upload";

export type TiendaFulfillmentPreference = "local-pickup" | "local-delivery-discuss" | "shipping-discuss";

export type TiendaCustomerDetails = {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  notes: string;
};

export type TiendaLocalizedLine = { es: string; en: string };

export type TiendaAssetSummaryKind = "image" | "pdf" | "design-side";

export type TiendaAssetSummaryItem = {
  id: string;
  kind: TiendaAssetSummaryKind;
  label: TiendaLocalizedLine;
  thumbnailUrl: string | null;
  metaLines: TiendaLocalizedLine[];
};

/** Input for `/api/tienda/self-serve-pricing` (admin catalog + rules). */
export type TiendaOrderPricingInput = {
  productSlug: string;
  quantity: number;
  sidesKey?: string | null;
  sizeKey?: string | null;
  stockKey?: string | null;
  finishKey?: string | null;
};

export type TiendaOrderReviewSummary = {
  source: TiendaOrderSource;
  productSlug: string;
  productTitle: TiendaLocalizedLine;
  categorySlug: string;
  sidednessSummary: TiendaLocalizedLine;
  specLines: TiendaLocalizedLine[];
  assets: TiendaAssetSummaryItem[];
  approvalStatus: TiendaLocalizedLine;
  approvalDetails: TiendaLocalizedLine[];
  warnings: TiendaLocalizedLine[];
  builderSavedAt: string | null;
  /** Optional hint from business-card text fields (company). */
  prefillBusinessName?: string | null;
  /** Resolves admin pricing for order summary (client fetches snapshot via API). */
  pricingInput?: TiendaOrderPricingInput;
};

export type TiendaOrderDraft = {
  review: TiendaOrderReviewSummary;
  customer: TiendaCustomerDetails;
  fulfillment: TiendaFulfillmentPreference | "";
  /** Local metadata */
  hydratedAtIso: string;
};

export const emptyTiendaCustomerDetails = (): TiendaCustomerDetails => ({
  fullName: "",
  businessName: "",
  email: "",
  phone: "",
  notes: "",
});
