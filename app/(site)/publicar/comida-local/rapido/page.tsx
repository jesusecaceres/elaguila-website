import type { Metadata } from "next";
import { Suspense } from "react";
import { ComidaLocalQuickIntakeClient } from "./ComidaLocalQuickIntakeClient";

export const metadata: Metadata = {
  title: "Comida rápida — Comida Local — LEONIX",
  description: "Tu negocio + un plato real que vendes.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/publicar/comida-local/rapido" },
};

/** Quick Comida Local — ESSENTIAL QUESTIONS → ≥ 1 REAL IMAGE → REVIEW → existing preview. Additive route,
 * dedicated to this one category; never touches the certified Quick Classifieds or Quick Business trees. */
export default function PublicarComidaLocalRapidoPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-[#F6F0E2]" aria-busy="true" />}>
      <ComidaLocalQuickIntakeClient />
    </Suspense>
  );
}
