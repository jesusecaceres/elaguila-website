import { Suspense } from "react";

import { ViajesPrivadoApplicationShell } from "./components/ViajesPrivadoApplicationShell";

export default function PublicarViajesPrivadoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <ViajesPrivadoApplicationShell />
    </Suspense>
  );
}
