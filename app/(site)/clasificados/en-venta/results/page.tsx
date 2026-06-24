import { Suspense } from "react";
import { EnVentaResultsClient } from "./EnVentaResultsClient";

export const dynamic = "force-dynamic";

export default function EnVentaResultsPage() {
  const underNavOffset = "pt-[calc(2.75rem+env(safe-area-inset-top,0px))] sm:pt-0";
  return (
    <Suspense
      fallback={
        <div className={`min-h-screen bg-[#FAF6EE] ${underNavOffset} text-center text-sm text-[#5C5346]`}>
          Loading…
        </div>
      }
    >
      <div className={underNavOffset}>
        <EnVentaResultsClient />
      </div>
    </Suspense>
  );
}
