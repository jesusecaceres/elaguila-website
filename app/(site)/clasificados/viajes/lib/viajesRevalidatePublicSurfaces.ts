import "server-only";

import { revalidatePath, revalidateTag, unstable_expireTag } from "next/cache";

import { VIAJES_CACHE_TAG_BROWSE, viajesOfferDetailCacheTag } from "./viajesCacheTags";

/**
 * Invalidate merged results, landing, offer detail path, and tag-based caches used by
 * `unstable_cache` in `viajesPublicBrowseRowsServer` + `resolveViajesOfferDetailFromStagedServer`.
 *
 * Prefer `unstable_expireTag` so the next resultados request is a hard cache miss
 * (approve → public results must not serve a stale empty browse payload).
 */
export function revalidateViajesStagedPublicSurfaces(slug?: string | null): void {
  revalidatePath("/clasificados/viajes/resultados");
  revalidatePath("/clasificados/viajes");
  const s = slug?.trim();
  if (s) revalidatePath(`/clasificados/viajes/oferta/${s}`);
  unstable_expireTag(VIAJES_CACHE_TAG_BROWSE);
  revalidateTag(VIAJES_CACHE_TAG_BROWSE);
  if (s) {
    unstable_expireTag(viajesOfferDetailCacheTag(s));
    revalidateTag(viajesOfferDetailCacheTag(s));
  }
}
