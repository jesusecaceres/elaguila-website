import { Suspense } from "react";

import { ViajesResultsShell } from "../components/ViajesResultsShell";
import { fetchViajesPublicBrowseRowsMerged } from "../lib/viajesPublicBrowseRowsServer";
import { viajesResultsMetadata } from "../lib/viajesLocalSeo";

export const dynamic = "force-dynamic";
export const metadata = viajesResultsMetadata("es");

export default async function ClasificadosViajesResultadosPage() {
  const { rows, stagedApprovedCount } = await fetchViajesPublicBrowseRowsMerged();
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <ViajesResultsShell initialRows={rows} stagedApprovedCount={stagedApprovedCount} />
    </Suspense>
  );
}
