import { Suspense } from "react";

import { fetchEmpleosPublishedJobRecords } from "./lib/empleosPublicListingsDbServer";
import { empleosOmitMarketingSeedCatalog } from "./lib/empleosPublicCatalogPolicy";
import { mapEmpleosLiveToFeaturedLanding, mapEmpleosLiveToRecentLanding } from "./lib/empleosLandingLiveMaps";
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
  const featured = omit ? mapEmpleosLiveToFeaturedLanding(merged, 4) : undefined;
  const recentEs = omit ? mapEmpleosLiveToRecentLanding(merged, nowMs, "es", 5) : undefined;
  const recentEn = omit ? mapEmpleosLiveToRecentLanding(merged, nowMs, "en", 5) : undefined;

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
