import { Suspense } from "react";

import { MascotasPerdidosResultsClient } from "../MascotasPerdidosResultsClient";

export default function MascotasPerdidosResultadosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4EFE6]" aria-busy="true" />}>
      <MascotasPerdidosResultsClient />
    </Suspense>
  );
}
