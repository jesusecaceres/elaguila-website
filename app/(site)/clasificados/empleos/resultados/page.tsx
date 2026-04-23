import { Suspense } from "react";
import type { Metadata } from "next";

import { EmpleosResultsView } from "../components/EmpleosResultsView";
import { empleosOmitMarketingSeedCatalog } from "../lib/empleosPublicCatalogPolicy";
import { fetchEmpleosPublishedJobRecords } from "../lib/empleosPublicListingsDbServer";
import { mergeEmpleosSeedWithLiveJobs } from "../lib/staged/getEmpleosMergedBrowse";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Empleos | Leonix Clasificados",
  description:
    "Descubre ofertas de trabajo destacadas y recientes. Busca por palabra clave, ciudad o estado.",
};

export default async function ClasificadosEmpleosResultadosPage() {
  const live = await fetchEmpleosPublishedJobRecords();
  const omitMarketingSeed = empleosOmitMarketingSeedCatalog();
  const initialJobs = mergeEmpleosSeedWithLiveJobs(live, { omitSeed: omitMarketingSeed });
  const serverNowMs = Date.now();

  return (
    <Suspense
      fallback={<div className="min-h-screen bg-[#ECEAE7]" aria-busy="true" aria-label="Cargando empleos" />}
    >
      <EmpleosResultsView
        initialJobs={initialJobs}
        omitMarketingSeed={omitMarketingSeed}
        serverNowMs={serverNowMs}
      />
    </Suspense>
  );
}
