import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

import { VIAJES_CACHE_TAG_BROWSE, viajesOfferDetailCacheTag } from "./viajesCacheTags";

/**
 * Invalidate merged results, landing, offer detail path, and tag-based caches used by
 * `unstable_cache` in `viajesPublicBrowseRowsServer` + `resolveViajesOfferDetailFromStagedServer`.
 */
export function revalidateViajesStagedPublicSurfaces(slug?: string | null): void {
  revalidatePath("/clasificados/viajes/resultados");
  revalidatePath("/clasificados/viajes");
  const s = slug?.trim();
  if (s) revalidatePath(`/clasificados/viajes/oferta/${s}`);
  revalidateTag(VIAJES_CACHE_TAG_BROWSE);
  if (s) revalidateTag(viajesOfferDetailCacheTag(s));
}
