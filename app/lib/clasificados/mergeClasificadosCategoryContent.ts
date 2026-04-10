import type {
  BilingualPair,
  BilingualPatch,
  ClasificadosCategoryContentRootPayload,
  ClasificadosDetailFieldCopyPatch,
  ClasificadosEnVentaContentPatch,
} from "@/app/lib/clasificados/clasificadosCategoryContentTypes";
import {
  EN_VENTA_HUB_LANDING_DEFAULTS,
  EN_VENTA_PUBLISH_HUB_DEFAULTS,
} from "@/app/lib/clasificados/enVentaContentDefaults";

function mergeBilingualKey(
  lang: "es" | "en",
  baseEs: string,
  baseEn: string,
  patch?: BilingualPatch
): string {
  const raw = lang === "en" ? patch?.en ?? baseEn : patch?.es ?? baseEs;
  return raw.trim() !== "" ? raw : lang === "en" ? baseEn : baseEs;
}

export function extractCategoryPatch(
  root: ClasificadosCategoryContentRootPayload | null | undefined,
  slug: string
): Record<string, unknown> | undefined {
  const c = root?.categories?.[slug];
  if (!c || typeof c !== "object" || Array.isArray(c)) return undefined;
  return c as Record<string, unknown>;
}

export type EnVentaHubLandingResolved = {
  hero: string;
  sub: string;
  searchPh: string;
  search: string;
  publish: string;
  lista: string;
  trust: string;
  heroEmoji: string;
  heroImageUrl: string;
};

export function mergeEnVentaHubLanding(
  lang: "es" | "en",
  patch: ClasificadosEnVentaContentPatch | null | undefined
): EnVentaHubLandingResolved {
  const h = patch?.hubLanding;
  const d = EN_VENTA_HUB_LANDING_DEFAULTS;
  return {
    hero: mergeBilingualKey(lang, d.es.hero, d.en.hero, h?.hero),
    sub: mergeBilingualKey(lang, d.es.sub, d.en.sub, h?.sub),
    searchPh: mergeBilingualKey(lang, d.es.searchPh, d.en.searchPh, h?.searchPh),
    search: mergeBilingualKey(lang, d.es.search, d.en.search, h?.search),
    publish: mergeBilingualKey(lang, d.es.publish, d.en.publish, h?.publish),
    lista: mergeBilingualKey(lang, d.es.lista, d.en.lista, h?.lista),
    trust: mergeBilingualKey(lang, d.es.trust, d.en.trust, h?.trust),
    heroEmoji: (h?.heroEmoji ?? "").trim(),
    heroImageUrl: (h?.heroImageUrl ?? "").trim(),
  };
}

export type EnVentaPublishHubResolved = {
  title: string;
  subtitle: string;
  freeTitle: string;
  freeDesc: string;
  proTitle: string;
  proDesc: string;
  sfTitle: string;
  sfDesc: string;
  back: string;
  langToggleEs: string;
  langToggleEn: string;
  laneFreeEmoji: string;
  laneProBadge: string;
  laneSfEmoji: string;
  backHref: string;
};

export function mergeEnVentaPublishHub(
  lang: "es" | "en",
  patch: ClasificadosEnVentaContentPatch | null | undefined
): EnVentaPublishHubResolved {
  const p = patch?.publishHub;
  const d = EN_VENTA_PUBLISH_HUB_DEFAULTS;
  const backHref = (p?.backHref ?? "").trim() || "/clasificados/publicar";
  return {
    title: mergeBilingualKey(lang, d.es.title, d.en.title, p?.title),
    subtitle: mergeBilingualKey(lang, d.es.subtitle, d.en.subtitle, p?.subtitle),
    freeTitle: mergeBilingualKey(lang, d.es.freeTitle, d.en.freeTitle, p?.freeTitle),
    freeDesc: mergeBilingualKey(lang, d.es.freeDesc, d.en.freeDesc, p?.freeDesc),
    proTitle: mergeBilingualKey(lang, d.es.proTitle, d.en.proTitle, p?.proTitle),
    proDesc: mergeBilingualKey(lang, d.es.proDesc, d.en.proDesc, p?.proDesc),
    sfTitle: mergeBilingualKey(lang, d.es.sfTitle, d.en.sfTitle, p?.sfTitle),
    sfDesc: mergeBilingualKey(lang, d.es.sfDesc, d.en.sfDesc, p?.sfDesc),
    back: mergeBilingualKey(lang, d.es.back, d.en.back, p?.back),
    langToggleEs: d.es.langToggle,
    langToggleEn: d.en.langToggle,
    laneFreeEmoji: (p?.laneFreeEmoji ?? "").trim() || "🛍️",
    laneProBadge: (p?.laneProBadge ?? "").trim() || "👑 Pro",
    laneSfEmoji: (p?.laneSfEmoji ?? "").trim() || "🏬",
    backHref,
  };
}

/** Merge detail field copy for admin preview / future public wiring. */
export function mergeDetailFieldPatch(
  baseLabel: BilingualPair,
  basePlaceholder: BilingualPair | undefined,
  patch: ClasificadosDetailFieldCopyPatch | undefined,
  lang: "es" | "en"
): { label: string; placeholder?: string; help?: string } {
  const label = mergeBilingualKey(lang, baseLabel.es, baseLabel.en, patch?.label);
  const placeholder = basePlaceholder
    ? mergeBilingualKey(lang, basePlaceholder.es, basePlaceholder.en, patch?.placeholder)
    : undefined;
  const hp = patch?.help;
  const help =
    hp && (hp.es?.trim() || hp.en?.trim())
      ? lang === "en"
        ? (hp.en ?? hp.es ?? "").trim() || undefined
        : (hp.es ?? hp.en ?? "").trim() || undefined
      : undefined;
  return {
    label,
    placeholder: placeholder || undefined,
    help,
  };
}

export function parseEnVentaPatch(raw: unknown): ClasificadosEnVentaContentPatch | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as ClasificadosEnVentaContentPatch;
}
