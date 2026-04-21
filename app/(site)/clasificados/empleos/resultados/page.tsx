import { Suspense } from "react";
import type { Metadata } from "next";

import { EmpleosResultsView } from "../components/EmpleosResultsView";
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
  const initialJobs = mergeEmpleosSeedWithLiveJobs(live);

  return (
    <Suspense
      fallback={<div className="min-h-screen bg-[#ECEAE7]" aria-busy="true" aria-label="Cargando empleos" />}
    >
      <EmpleosResultsView initialJobs={initialJobs} />
    </Suspense>
  );
}
