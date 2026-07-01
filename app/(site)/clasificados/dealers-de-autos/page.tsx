import { Suspense } from "react";
import { AutosLandingPage } from "../autos/landing/AutosLandingPage";

export default function DealersDeAutosLandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <AutosLandingPage market="dealer" />
    </Suspense>
  );
}
