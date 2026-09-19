/**
 * Quick Classifieds — adapter registry (client side). One adapter per LIVE category; the blocked category
 * (Empleos, BLOCKED_BY_EXISTING_MEDIA_OUTPUT) deliberately has none, so the intake route falls back to the
 * honest "use the standard application" card driven by the server-safe registry.
 */

import type { QuickClassifiedCategoryAdapter, QuickClassifiedCategoryKey } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { autosPrivadoQuickAdapter } from "./autosPrivadoQuickAdapter";
import { bienesRaicesPrivadoQuickAdapter } from "./bienesRaicesPrivadoQuickAdapter";
import { buscoQuickAdapter } from "./buscoQuickAdapter";
import { clasesQuickAdapter, comunidadQuickAdapter } from "./communityQuickAdapters";
import { enVentaQuickAdapter } from "./enVentaQuickAdapter";
import { mascotasQuickAdapter } from "./mascotasQuickAdapter";
import { rentasPrivadoQuickAdapter } from "./rentasPrivadoQuickAdapter";

const ADAPTERS: Partial<Record<QuickClassifiedCategoryKey, QuickClassifiedCategoryAdapter>> = {
  "en-venta": enVentaQuickAdapter,
  rentas: rentasPrivadoQuickAdapter,
  autos: autosPrivadoQuickAdapter,
  "bienes-raices": bienesRaicesPrivadoQuickAdapter,
  clases: clasesQuickAdapter,
  comunidad: comunidadQuickAdapter,
  busco: buscoQuickAdapter,
  "mascotas-y-perdidos": mascotasQuickAdapter,
};

export function getQuickClassifiedAdapter(key: QuickClassifiedCategoryKey): QuickClassifiedCategoryAdapter | null {
  return ADAPTERS[key] ?? null;
}

export function countQuickEssentialQuestions(adapter: QuickClassifiedCategoryAdapter): number {
  return adapter.steps.reduce((n, s) => n + s.fields.length, 0);
}
