import { Suspense } from "react";

import { ViajesNegociosApplicationShell } from "./components/ViajesNegociosApplicationShell";

export default function PublicarViajesNegociosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <ViajesNegociosApplicationShell />
    </Suspense>
  );
}
