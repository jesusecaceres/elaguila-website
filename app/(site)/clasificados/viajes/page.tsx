import { Suspense } from "react";

import { ViajesLandingPage } from "./components/ViajesLandingPage";

export default function ClasificadosViajesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <ViajesLandingPage />
    </Suspense>
  );
}
