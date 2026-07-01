import { Suspense } from "react";
import { AutosPublicResultsShell } from "../../autos/components/public/AutosPublicResultsShell";

export default function DealersDeAutosResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <AutosPublicResultsShell market="dealer" />
    </Suspense>
  );
}
