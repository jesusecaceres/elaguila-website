import { Suspense } from "react";

import { ViajesResultsShell } from "../components/ViajesResultsShell";

export default function ClasificadosViajesResultadosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <ViajesResultsShell />
    </Suspense>
  );
}
