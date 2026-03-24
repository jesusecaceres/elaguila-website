/**
 * Canonical detail keys for En Venta — aligned with `EnVentaDraftDetails` in contracts.
 * Application forms map into these keys for downstream preview/publish/lista.
 */

export const EN_VENTA_CANONICAL_DETAIL_KEYS = [
  "rama",
  "evSub",
  "itemType",
  "condition",
  "negotiable",
  "brand",
  "model",
  "city",
  "zip",
  "pickup",
  "shipping",
  "delivery",
  "seller_kind",
] as const;

export type EnVentaCanonicalDetailKey = (typeof EN_VENTA_CANONICAL_DETAIL_KEYS)[number];
