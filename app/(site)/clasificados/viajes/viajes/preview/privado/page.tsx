import { Suspense } from "react";

import { ViajesPrivadoPreviewClient } from "./ViajesPrivadoPreviewClient";

export default function ClasificadosViajesPreviewPrivadoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[color:var(--lx-page)] px-4 py-10" aria-busy="true">
          <div className="mx-auto max-w-7xl animate-pulse rounded-2xl bg-[color:var(--lx-section)] h-96" />
        </div>
      }
    >
      <ViajesPrivadoPreviewClient />
    </Suspense>
  );
}
