import { Suspense } from "react";
import { AutosPublicLanding } from "./components/public/AutosPublicLanding";

export default function ClasificadosAutosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <AutosPublicLanding />
    </Suspense>
  );
}
