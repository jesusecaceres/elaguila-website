import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { ViajesStagedLane } from "./viajesStagedListingTypes";
import { isViajesPrivatePublishDisabled } from "./viajesPrivateLaneLaunchPolicy";

export type ViajesOwnerLinkLang = "es" | "en";

function withLangQuery(pathWithQuery: string, lang: ViajesOwnerLinkLang): string {
  return appendLangToPath(pathWithQuery, lang as Lang);
}

/** Lane-aware publisher edit URL with stagedId. */
export function viajesOwnerEditHref(input: {
  id: string;
  lane: ViajesStagedLane;
  lang?: ViajesOwnerLinkLang;
}): string {
  const lang = input.lang ?? "es";
  if (input.lane === "private" && isViajesPrivatePublishDisabled()) {
    return withLangQuery("/publicar/viajes?private_lane=disabled_dashboard", lang);
  }
  const base = input.lane === "private" ? "/publicar/viajes/privado" : "/publicar/viajes/negocios";
  const qs = new URLSearchParams();
  qs.set("stagedId", input.id);
  if (lang === "en") qs.set("lang", "en");
  return withLangQuery(`${base}?${qs.toString()}`, lang);
}

/** Lane-aware Preview URL with stagedId. */
export function viajesOwnerPreviewHref(input: {
  id: string;
  lane: ViajesStagedLane;
  lang?: ViajesOwnerLinkLang;
}): string {
  const lang = input.lang ?? "es";
  if (input.lane === "private" && isViajesPrivatePublishDisabled()) {
    return withLangQuery("/publicar/viajes?private_lane=disabled_dashboard", lang);
  }
  const base =
    input.lane === "private" ? "/clasificados/viajes/preview/privado" : "/clasificados/viajes/preview/negocios";
  const qs = new URLSearchParams();
  qs.set("stagedId", input.id);
  if (lang === "en") qs.set("lang", "en");
  return withLangQuery(`${base}?${qs.toString()}`, lang);
}

/** Public offer URL only when approved + public + slug present. */
export function viajesOwnerPublicHref(input: {
  slug: string;
  lifecycle_status: string;
  is_public: boolean;
  lang?: ViajesOwnerLinkLang;
}): string | null {
  const slug = input.slug.trim();
  if (!slug || input.lifecycle_status !== "approved" || !input.is_public) return null;
  return withLangQuery(`/clasificados/viajes/oferta/${encodeURIComponent(slug)}`, input.lang ?? "es");
}

/** Success page after submit — requires id, slug, and lane. */
export function viajesEnviadoSuccessHref(input: {
  id: string;
  slug: string;
  lane: string;
  lang?: ViajesOwnerLinkLang;
}): string {
  const qs = new URLSearchParams();
  qs.set("id", input.id);
  qs.set("slug", input.slug);
  qs.set("lane", input.lane);
  if (input.lang === "en") qs.set("lang", "en");
  return withLangQuery(`/publicar/viajes/enviado?${qs.toString()}`, input.lang ?? "es");
}

/** Build publisher preview href while editing (keeps stagedId). */
export function viajesPublisherPreviewHref(input: {
  lane: "business" | "private";
  stagedId?: string | null;
  lang?: ViajesOwnerLinkLang;
}): string {
  const lang = input.lang ?? "es";
  const base =
    input.lane === "private" ? "/clasificados/viajes/preview/privado" : "/clasificados/viajes/preview/negocios";
  const qs = new URLSearchParams();
  const staged = (input.stagedId ?? "").trim();
  if (staged) qs.set("stagedId", staged);
  if (lang === "en") qs.set("lang", "en");
  const q = qs.toString();
  return withLangQuery(q ? `${base}?${q}` : base, lang);
}

/** Return-to-edit from Preview when stagedId is present. */
export function viajesPreviewReturnToEditHref(input: {
  lane: "business" | "private";
  stagedId?: string | null;
  lang?: ViajesOwnerLinkLang;
}): string {
  const staged = (input.stagedId ?? "").trim();
  if (!staged) {
    const base = input.lane === "private" ? "/publicar/viajes/privado" : "/publicar/viajes/negocios";
    return withLangQuery(base, input.lang ?? "es");
  }
  return viajesOwnerEditHref({ id: staged, lane: input.lane, lang: input.lang });
}
