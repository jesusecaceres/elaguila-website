import { Suspense } from "react";

import { fetchEmpleosPublishedJobRecords } from "./lib/empleosPublicListingsDbServer";
import { empleosOmitMarketingSeedCatalog } from "./lib/empleosPublicCatalogPolicy";
import { mapEmpleosLiveToFeaturedLanding, mapEmpleosLiveToRecentLandingFair } from "./lib/empleosLandingLiveMaps";
import { EMPLEOS_LANDING_FEATURED_MAX, EMPLEOS_LANDING_RECENT_MAX } from "./lib/empleosPublicRankingPolicy";
import { mergeEmpleosSeedWithLiveJobs } from "./lib/staged/getEmpleosMergedBrowse";
import { EmpleosLandingPage } from "./EmpleosLandingPageClient";

function LandingFallback() {
  return (
    <div
      className="min-h-screen bg-[#FAF7F2]"
      aria-busy="true"
      aria-label="Cargando empleos"
    />
  );
}

export async function EmpleosLandingServer() {
  const nowMs = Date.now();
  const live = await fetchEmpleosPublishedJobRecords();
  const omit = empleosOmitMarketingSeedCatalog();
  const merged = mergeEmpleosSeedWithLiveJobs(live, { omitSeed: omit });
  const featured = omit ? mapEmpleosLiveToFeaturedLanding(merged, EMPLEOS_LANDING_FEATURED_MAX) : undefined;
  const recentEs = omit ? mapEmpleosLiveToRecentLandingFair(merged, nowMs, "es", EMPLEOS_LANDING_RECENT_MAX) : undefined;
  const recentEn = omit ? mapEmpleosLiveToRecentLandingFair(merged, nowMs, "en", EMPLEOS_LANDING_RECENT_MAX) : undefined;

  return (
    <Suspense fallback={<LandingFallback />}>
      <EmpleosLandingPage
        liveInventory={omit}
        featuredJobsOverride={featured}
        recentJobsByLang={omit && recentEs && recentEn ? { es: recentEs, en: recentEn } : undefined}
      />
    </Suspense>
  );
}
