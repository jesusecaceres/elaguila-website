/**
 * Gate I.5.2 — narrow display/route-resolution adapter for the modern `/publicar` gateway.
 *
 * This file resolves NO destinations itself — every URL returned here is read straight from
 * `app/lib/listingIdentity/categoryRouteRegistry.ts` (`applicationRoute` or, for multi-lane
 * categories, the Gate I.5.2 `hubRoute` field added to the registry). This file only maps the
 * gateway's own presentation-facing category keys to the registry's canonical pipeline keys —
 * it must never grow a second hardcoded route literal.
 */
import {
  CATEGORY_ROUTE_REGISTRY,
  type CanonicalCategoryKey,
} from "@/app/lib/listingIdentity";
import { replaceLangInHref, type SupportedLang } from "@/app/lib/language";

/**
 * Every category the gateway displays a card for. Deliberately excludes "cupones" — confirmed
 * non-standalone in Gate I.5A/I.5.1 (managed through parent-category entitlements, not its own
 * publish pipeline).
 */
export const PUBLICAR_GATEWAY_CATEGORY_KEYS = [
  "en-venta",
  "rentas",
  "autos",
  "bienes-raices",
  "servicios",
  "empleos",
  "clases",
  "comunidad",
  "busco",
  "mascotas-y-perdidos",
  "travel",
  "restaurantes",
  "comida-local",
  "ofertas-locales",
] as const;

export type PublicarGatewayCategoryKey = (typeof PUBLICAR_GATEWAY_CATEGORY_KEYS)[number];

/**
 * One representative registry pipeline per gateway card. For multi-lane categories (Autos,
 * Bienes Raíces, Rentas) either lane's adapter resolves to the identical shared `hubRoute`
 * (set on both siblings in Gate I.5.2), so picking one representative is safe and not a
 * hidden second source of truth — both adapters in the pair are asserted equal in the self-test.
 */
const GATEWAY_KEY_TO_PIPELINE: Record<PublicarGatewayCategoryKey, CanonicalCategoryKey> = {
  "en-venta": "en_venta",
  rentas: "rentas_negocio",
  autos: "autos_negocios",
  "bienes-raices": "bienes_raices_negocio",
  servicios: "servicios",
  empleos: "empleos",
  clases: "clases",
  comunidad: "comunidad",
  busco: "busco",
  "mascotas-y-perdidos": "mascotas_y_perdidos",
  travel: "viajes",
  restaurantes: "restaurantes",
  "comida-local": "comida_local",
  "ofertas-locales": "ofertas_locales",
};

/**
 * Deep-link aliases accepted by `?cat=`/`?categoria=`, preserving every value the old
 * `PublicarPageClient.tsx`'s `normalizeChooserDeepLink()` accepted (`"br"` → `"bienes-raices"`,
 * `"viajes"` → `"travel"`), plus two additive, non-breaking extensions: `"comida-local"` and
 * `"ofertas-locales"` now resolve directly (the old chooser had no card for either, so a deep
 * link using those values previously fell through to its invalid-value case and never worked —
 * nothing that worked before can regress here).
 */
const DEEP_LINK_ALIASES: Record<string, PublicarGatewayCategoryKey> = {
  br: "bienes-raices",
  "bienes-raices": "bienes-raices",
  viajes: "travel",
};

/** Resolves a raw `?cat=`/`?categoria=` value to a valid gateway key, or null if unsupported —
 * fails closed exactly like the old chooser (invalid values never redirect, chooser stays put). */
export function normalizePublicarGatewayDeepLink(raw: string | null | undefined): PublicarGatewayCategoryKey | null {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v || v === "all") return null;
  const aliased = DEEP_LINK_ALIASES[v] ?? v;
  return (PUBLICAR_GATEWAY_CATEGORY_KEYS as readonly string[]).includes(aliased)
    ? (aliased as PublicarGatewayCategoryKey)
    : null;
}

/**
 * The single canonical destination for starting a new publish flow in this category — always
 * `adapter.hubRoute ?? adapter.applicationRoute`, read live from the registry, language-tagged.
 */
export function resolvePublicarGatewayDestination(key: PublicarGatewayCategoryKey, lang: SupportedLang): string {
  const pipeline = GATEWAY_KEY_TO_PIPELINE[key];
  const adapter = CATEGORY_ROUTE_REGISTRY[pipeline];
  const dest = adapter.hubRoute ?? adapter.applicationRoute;
  return replaceLangInHref(dest, lang);
}
