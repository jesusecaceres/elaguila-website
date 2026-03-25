import { Suspense } from "react";
import { EnVentaResultsClient } from "./EnVentaResultsClient";

export default function EnVentaResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F3EBDD] pt-28 text-center text-sm text-[#5C5346]">Loading…</div>
      }
    >
      <EnVentaResultsClient />
    </Suspense>
  );
}
