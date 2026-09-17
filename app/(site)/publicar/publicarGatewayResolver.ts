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
import { LEONIX_CATEGORY_VISUALS } from "@/app/(site)/clasificados/config/categoryVisuals";
import { getPublicCategoryCardCopy } from "@/app/lib/clasificados/publicCategoryCopyGuard";

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
 * `adapter.checkpointRoute ?? adapter.hubRoute ?? adapter.applicationRoute`, read live from
 * the registry, language-tagged. Globalization Package A Gate 2 added `checkpointRoute` so
 * every lane presents its truthful product checkpoint BEFORE the application; hubs that
 * already render checkpoint cards (Autos, Bienes Raíces, Rentas, Restaurantes, Empleos) keep
 * resolving via `hubRoute` unchanged.
 */
export function resolvePublicarGatewayDestination(key: PublicarGatewayCategoryKey, lang: SupportedLang): string {
  const pipeline = GATEWAY_KEY_TO_PIPELINE[key];
  const adapter = CATEGORY_ROUTE_REGISTRY[pipeline];
  const dest = adapter.checkpointRoute ?? adapter.hubRoute ?? adapter.applicationRoute;
  return replaceLangInHref(dest, lang);
}

/**
 * Visual token lookup — every `PUBLICAR_GATEWAY_CATEGORY_KEYS` member either has a
 * `LEONIX_CATEGORY_VISUALS` entry already, or gets this one small additive fallback
 * (Gate I.5.2 — Comida Local/Ofertas Locales aren't part of that shared visual registry).
 * Lifted from PublicarGatewayClient.tsx unchanged so the staff Create-for-Client launcher and
 * the public gateway share ONE category presentation source instead of two.
 */
export function publicarGatewayVisual(key: PublicarGatewayCategoryKey) {
  if (key in LEONIX_CATEGORY_VISUALS) {
    return LEONIX_CATEGORY_VISUALS[key as keyof typeof LEONIX_CATEGORY_VISUALS];
  }
  return {
    emoji: "🏷️",
    tint: "from-[#7A1E2C]/8 via-[#FFFDF7] to-[#FAF6EE]",
    border: "border-[#7A1E2C]/35",
    chipBg: "bg-[#7A1E2C]/10",
    glow: "shadow-[0_10px_24px_-16px_rgba(122,30,44,0.25)]",
  };
}

/** ES/EN-only card copy — no PT/TL (Gate I.5.2 launch rule). Lifted from PublicarGatewayClient.tsx unchanged. */
export function publicarGatewayCardCopy(key: PublicarGatewayCategoryKey, lang: "es" | "en"): { label: string; description: string } {
  if (key === "comida-local") {
    return lang === "es"
      ? { label: "Comida Local", description: "Publica tu negocio de comida local." }
      : { label: "Local Food", description: "Publish your local food business." };
  }
  if (key === "ofertas-locales") {
    return lang === "es"
      ? { label: "Ofertas Locales", description: "Publica tus ofertas locales." }
      : { label: "Local Deals", description: "Publish your local deals." };
  }
  if (key === "autos") {
    return lang === "es"
      ? { label: "Autos", description: "Concesionario o vendedor privado." }
      : { label: "Autos", description: "Dealer or private seller." };
  }
  const copy = getPublicCategoryCardCopy(key, lang);
  return { label: copy.label, description: copy.desc };
}
