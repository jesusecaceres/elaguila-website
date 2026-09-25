/**
 * Single admin-facing source for category status labels, reasons, and route proof.
 * LIVE is never cosmetic — see `LIVE_STATUS_PROOF` and registry defaults in clasificadosCategoryRegistry.
 */
import type { AdminCategoriesHubEntry } from "@/app/admin/_lib/adminCategoriesHubEntries";
import { isAdminCategoryScaffoldEntry } from "@/app/admin/_lib/adminCategoriesHubEntries";
import {
  adminCategoryWorkspaceLiveListingsHref,
  adminCategoryWorkspaceQueueHref,
  type AdminCategoryOperationalStatus,
} from "@/app/admin/_lib/adminCategoryWorkspaceQueueHref";
import { getClassifiedsOpsContract } from "@/app/admin/_lib/classifiedsOpsContract";
import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
import { adminTr } from "@/app/admin/_lib/adminStrings";

/** Categories marked live in code defaults only when queue + public + source are wired (see audit). */
export const ADMIN_CATEGORY_LIVE_STATUS_PROOF: Record<string, string> = {
  "en-venta": "Dedicated admin queue, public browse, listings source — primary Varios vertical.",
  restaurantes: "Dedicated table + admin queue + public restaurant profiles.",
  rentas: "Listings source with Leonix rent merge; admin queue + public browse.",
  "bienes-raices": "Listings source + Leonix contract; admin queue + public browse.",
  empleos: "empleos_public_listings + admin API + public job pages.",
  servicios: "servicios_public_listings + admin queue + public service directory.",
  autos:
    "autos_classifieds_listings; privado + dealer publish circuits (paid, BASE/PRO); admin queue + live view; public results + vehicle detail; owner dashboard edit.",
  clases: "listings source (category=clases); quick publish; admin queue + live view; public results + anuncio detail; Mis Anuncios edit.",
  comunidad:
    "listings source (category=comunidad); quick publish; admin queue + live view; public results + anuncio detail; Mis Anuncios edit.",
  busco: "listings source (category=busco); quick publish; admin queue + live view; public results + anuncio detail; Mis Anuncios edit.",
  "mascotas-y-perdidos":
    "listings source (category=mascotas-y-perdidos); quick publish; admin queue + live view; public results + anuncio detail; Mis Anuncios edit.",
};

export type AdminCategoryStatusProof = {
  queueRoute: string;
  liveRoute: string;
  publicRoute: string;
  sourceTable: string | null;
  opsKind: string | null;
  hasOpsContract: boolean;
  blockerKey: string | null;
};

export function getAdminCategoryStatusProof(entry: AdminCategoriesHubEntry): AdminCategoryStatusProof {
  const ops = getClassifiedsOpsContract(entry.slug);
  const queueRoute = ops?.adQueueAdminPath ?? adminCategoryWorkspaceQueueHref(entry.slug);
  const liveRoute = adminCategoryWorkspaceLiveListingsHref(entry.slug);
  const blockerKey = resolveBlockerKey(entry, ops?.writableTable ?? null);

  return {
    queueRoute,
    liveRoute,
    publicRoute: entry.landingTarget,
    sourceTable: ops?.writableTable ?? (entry.slug === "comida-local" ? "comida_local_public_listings" : null),
    opsKind: ops?.opsKind ?? null,
    hasOpsContract: Boolean(ops),
    blockerKey,
  };
}

/**
 * True when a `site_category_config` row overrides the code default. Admin must name the override
 * instead of attributing the status to readiness/source maturity (e.g. a stale seed row staging Servicios).
 */
export function isAdminCategoryStatusDbOverride(entry: AdminCategoriesHubEntry): boolean {
  return (
    entry.configLayer === "database" &&
    entry.codeDefaultOperationalStatus != null &&
    entry.codeDefaultOperationalStatus !== entry.operationalStatus
  );
}

function resolveBlockerKey(entry: AdminCategoriesHubEntry, sourceTable: string | null): string | null {
  if (
    entry.operationalStatus !== "live" &&
    entry.codeDefaultOperationalStatus === "live" &&
    isAdminCategoryStatusDbOverride(entry)
  ) {
    return "hub.blocker.dbOverrideBelowCodeLive";
  }
  if (entry.operationalStatus === "live") {
    if (!sourceTable && !ADMIN_CATEGORY_LIVE_STATUS_PROOF[entry.slug]) {
      return "hub.blocker.liveMissingSource";
    }
    return null;
  }
  if (entry.operationalStatus === "coming_soon" || isAdminCategoryScaffoldEntry(entry)) {
    if (!sourceTable) return "hub.blocker.comingSoonNoSource";
    return "hub.blocker.comingSoonScaffold";
  }
  if (entry.slug === "travel") return "hub.blocker.stagedViajesTable";
  if (entry.slug === "comida-local") return "hub.blocker.stagedComidaLocal";
  if (entry.slug === "ofertas-locales") return "hub.blocker.stagedOfertas";
  if (entry.readiness === "partial") return "hub.blocker.stagedPartialVertical";
  return "hub.blocker.stagedGeneric";
}

export function adminCategoryStatusReasonKey(
  entry: AdminCategoriesHubEntry,
  proof: AdminCategoryStatusProof,
): string {
  const status = entry.operationalStatus;
  if (isAdminCategoryStatusDbOverride(entry)) return "hub.statusReason.dbOverride";
  if (status === "live") {
    if (ADMIN_CATEGORY_LIVE_STATUS_PROOF[entry.slug]) return `hub.statusReason.live.${entry.slug}`;
    return "hub.statusReason.liveGeneric";
  }
  if (status === "coming_soon") {
    return proof.hasOpsContract ? "hub.statusReason.comingSoonWithOps" : "hub.statusReason.comingSoonScaffold";
  }
  if (entry.slug === "travel") return "hub.statusReason.stagedTravel";
  if (entry.slug === "comida-local") return "hub.statusReason.stagedComidaLocal";
  if (entry.slug === "ofertas-locales") return "hub.statusReason.stagedOfertas";
  if (entry.readiness === "partial") return "hub.statusReason.stagedPartial";
  return "hub.statusReason.stagedGeneric";
}

export function getAdminCategoryStatusReason(entry: AdminCategoriesHubEntry, lang: AdminLang): string {
  const proof = getAdminCategoryStatusProof(entry);
  const key = adminCategoryStatusReasonKey(entry, proof);
  const specific = adminTr(lang, key);
  if (specific !== key) return specific;
  return adminTr(lang, "hub.statusReason.stagedGeneric");
}

export function getAdminCategoryBlockerText(entry: AdminCategoriesHubEntry, lang: AdminLang): string | null {
  const proof = getAdminCategoryStatusProof(entry);
  if (!proof.blockerKey) return null;
  return adminTr(lang, proof.blockerKey);
}

export function adminCategoryLiveListingsCtaLabel(entry: AdminCategoriesHubEntry, lang: AdminLang): string {
  if (entry.operationalStatus === "coming_soon" && !getClassifiedsOpsContract(entry.slug)) {
    return adminTr(lang, "hub.liveListingsUnavailable");
  }
  return adminTr(lang, "hub.liveListingsCta");
}

export function adminCategoryLiveListingsWiredBySlug(slug: string): boolean {
  return Boolean(getClassifiedsOpsContract(slug));
}

export function adminCategoryLiveListingsAvailable(entry: AdminCategoriesHubEntry): boolean {
  if (entry.operationalStatus === "coming_soon" && !getClassifiedsOpsContract(entry.slug)) return false;
  return Boolean(getClassifiedsOpsContract(entry.slug) || entry.readiness !== "scaffold");
}

export function adminCategoryOperationalStatusFromProof(
  slug: string,
  status: AdminCategoryOperationalStatus,
): boolean {
  if (status !== "live") return true;
  return slug in ADMIN_CATEGORY_LIVE_STATUS_PROOF;
}
