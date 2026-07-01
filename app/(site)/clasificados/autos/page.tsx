import { Suspense } from "react";
import { AutosLandingPage } from "./landing/AutosLandingPage";

export default function ClasificadosAutosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <AutosLandingPage market="private" />
    </Suspense>
  );
}
