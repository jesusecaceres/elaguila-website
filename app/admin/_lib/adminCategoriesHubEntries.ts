/**
 * Categories command-center hub entries — registry plus ops-contract categories
 * not present in `categoryConfig` (e.g. comida-local).
 */
import type { ClasificadosCategoryRegistryEntry } from "@/app/lib/clasificados/clasificadosCategoryRegistry";
import { CLASSIFIEDS_OPS_CONTRACTS } from "@/app/admin/_lib/classifiedsOpsContract";

export type AdminCategoriesHubEntry = ClasificadosCategoryRegistryEntry;

const SUPPLEMENTAL_HUB_ENTRIES: AdminCategoriesHubEntry[] = [
  {
    slug: "comida-local",
    displayNameEs: "Comida Local",
    displayNameEn: "Local Food",
    emoji: "🍲",
    sortOrder: 900,
    visibility: "public",
    operationalStatus: "staged",
    landingTarget: "/clasificados/comida-local",
    notes: "Dedicated table comida_local_public_listings; L8A analytics wired.",
    readiness: "partial",
    highlight: false,
    configLayer: "code",
    overlayNotes: null,
  },
];

/** Registry rows plus supplemental ops categories missing from categoryConfig. */
export function mergeAdminCategoriesHubEntries(
  registry: ClasificadosCategoryRegistryEntry[],
): AdminCategoriesHubEntry[] {
  const slugs = new Set(registry.map((r) => r.slug));
  const opsSlugs = new Set(CLASSIFIEDS_OPS_CONTRACTS.map((c) => c.slug));
  const supplemental = SUPPLEMENTAL_HUB_ENTRIES.filter((e) => opsSlugs.has(e.slug) && !slugs.has(e.slug));
  return [...registry, ...supplemental].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function isAdminCategoryScaffoldEntry(entry: AdminCategoriesHubEntry): boolean {
  return entry.readiness === "scaffold" || entry.operationalStatus === "coming_soon";
}

export function isAdminCategoryClientReady(entry: AdminCategoriesHubEntry): boolean {
  return entry.operationalStatus === "live" && entry.readiness === "full";
}
