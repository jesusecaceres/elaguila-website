/**
 * Visual-only image map for the Bienes Raíces landing "intent tiles" cards.
 * Kept out of the copy/i18n layer on purpose — these paths are
 * language-independent. Keyed by the `id` field on BIENES_INTENT_TILES
 * (bienesRaicesLandingGateway.ts).
 *
 */
export const BIENES_RAICES_CHILD_CATEGORY_IMAGE: Record<
  "casas" | "departamentos" | "venta" | "renta" | "comerciales" | "terrenos" | "proyecto-nuevo" | "multifamiliar",
  string
> = {
  casas: "/child-categories/bienes-raices/casas.jpg",
  departamentos: "/child-categories/bienes-raices/departamentos.jpg",
  venta: "/child-categories/bienes-raices/venta.jpg",
  renta: "/child-categories/bienes-raices/renta.jpg",
  comerciales: "/child-categories/bienes-raices/comerciales.jpg",
  terrenos: "/child-categories/bienes-raices/terrenos.jpg",
  "proyecto-nuevo": "/child-categories/bienes-raices/proyecto-nuevo.jpg",
  multifamiliar: "/child-categories/bienes-raices/multifamiliar.jpg",
} as const;
