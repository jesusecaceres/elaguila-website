import type { BusinessLaneKey } from "./negociosLocalesLanes";

/**
 * Gate 5 — visual-only selector-card image map for `/negocios-locales`. Sibling to
 * `negociosLocalesLanes.ts`, not a modification of it — copy/href data stays separate from
 * visual data. Typed over the 5 grid lanes only (Ofertas Locales is excluded from
 * `NEGOCIOS_SECTOR_GRID_ORDER` and rendered outside this card grid).
 */
export const NEGOCIOS_LANE_CARD_IMAGE: Record<Exclude<BusinessLaneKey, "ofertas-locales">, string> = {
  servicios: "/selector-cards/servicios-locales.jpg",
  restaurantes: "/selector-cards/restaurantes-negocio-premium.jpg",
  "comida-local": "/selector-cards/comida-local-vendedor-movil.jpg",
  "autos-dealer": "/selector-cards/dealers-de-autos-inventario.jpg",
  "bienes-raices": "/selector-cards/bienes-raices-vitrina-agente.jpg",
} as const;
