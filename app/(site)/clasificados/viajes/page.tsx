import { Suspense } from "react";

import type { ViajesBusinessResult } from "./data/viajesResultsSampleData";
import { ViajesLandingPage } from "./components/ViajesLandingPage";
import { fetchViajesPublicBrowseRowsMerged } from "./lib/viajesPublicBrowseRowsServer";

export default async function ClasificadosViajesPage() {
  const { rows } = await fetchViajesPublicBrowseRowsMerged();
  const initialBusinessRows = rows.filter((r): r is ViajesBusinessResult => r.kind === "business");

  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen bg-gradient-to-b from-[#f0e6d8] via-[#f5ebe0] to-[#fffcf7]"
          aria-busy="true"
        />
      }
    >
      <ViajesLandingPage initialBusinessRows={initialBusinessRows} />
    </Suspense>
  );
}
