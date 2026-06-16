import { Suspense } from "react";
import { EnVentaResultsClient } from "./EnVentaResultsClient";

export const dynamic = "force-dynamic";

export default function EnVentaResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF6EE] pt-20 text-center text-sm text-[#5C5346]">Loading…</div>
      }
    >
      <EnVentaResultsClient />
    </Suspense>
  );
}
