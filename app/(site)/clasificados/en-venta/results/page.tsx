import { Suspense } from "react";
import type { Metadata } from "next";
import { EnVentaResultsClient } from "./EnVentaResultsClient";

export const dynamic = "force-dynamic";

// Package F Build F2, Gate 7 (P1 SEO fix) — no metadata previously exported; inherited the wrong
// parent canonical. /results is the confirmed real canonical for En Venta (next.config.ts already
// redirects /resultados here).
export const metadata: Metadata = {
  alternates: { canonical: "/clasificados/en-venta/results" },
};

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
