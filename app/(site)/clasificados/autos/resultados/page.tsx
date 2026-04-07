import { Suspense } from "react";
import { AutosPublicResultsShell } from "../components/public/AutosPublicResultsShell";

export default function ClasificadosAutosResultadosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <AutosPublicResultsShell />
    </Suspense>
  );
}
