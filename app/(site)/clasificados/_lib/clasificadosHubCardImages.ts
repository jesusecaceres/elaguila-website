import type { HubCategoryKey } from "@/app/(site)/clasificados/config/clasificadosHub";

/**
 * Gate 5 — visual-only selector-card image map for `/clasificados`. Deliberately kept out of
 * the copy/i18n layer (`publicCategoryCopyGuard.ts`, `clasificadosHubPageCopy/index.ts`) since
 * these paths are language-independent. `Record` over the exhaustive `HubCategoryKey` union (plus
 * the one hardcoded Dealer card key) guarantees no card is ever left without a mapping.
 */
export const CLASIFICADOS_HUB_CARD_IMAGE: Record<HubCategoryKey | "dealers-de-autos", string> = {
  "en-venta": "/selector-cards/varios-resale-comunitario.jpg",
  rentas: "/selector-cards/rentas-vivienda.jpg",
  empleos: "/selector-cards/empleos-trabajo-comunitario.jpg",
  "bienes-raices": "/selector-cards/bienes-raices-propiedad.jpg",
  servicios: "/selector-cards/servicios-locales.jpg",
  autos: "/selector-cards/autos-privado.jpg",
  restaurantes: "/selector-cards/restaurantes-mesa.jpg",
  travel: "/selector-cards/viajes-viaje-real.jpg",
  comunidad: "/selector-cards/comunidad-evento-vecinal.jpg",
  clases: "/selector-cards/clases-taller-comunitario.jpg",
  busco: "/selector-cards/busco-solicitud-comunitaria.jpg",
  "mascotas-y-perdidos": "/selector-cards/mascotas-perdidos-comunidad.jpg",
  "dealers-de-autos": "/selector-cards/dealers-de-autos-inventario.jpg",
} as const;
