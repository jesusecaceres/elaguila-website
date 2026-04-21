import { Suspense } from "react";

import { ViajesResultsShell } from "../components/ViajesResultsShell";
import { fetchViajesPublicBrowseRowsMerged } from "../lib/viajesPublicBrowseRowsServer";

export default async function ClasificadosViajesResultadosPage() {
  const { rows, stagedApprovedCount } = await fetchViajesPublicBrowseRowsMerged();
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <ViajesResultsShell initialRows={rows} stagedApprovedCount={stagedApprovedCount} />
    </Suspense>
  );
}
