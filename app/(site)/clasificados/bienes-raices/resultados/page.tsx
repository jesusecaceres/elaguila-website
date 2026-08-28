import type { Metadata } from "next";
import { BienesRaicesResultsClient } from "./BienesRaicesResultsClient";

export const metadata: Metadata = {
  title: "Bienes Raíces — Resultados | Leonix Clasificados",
  description: "Explora propiedades en Bienes Raíces con filtros claros y listados moderados.",
};

/**
 * BR-INV-A-FIX — no `<Suspense>` boundary here; see the identical fix + rationale in
 * `app/(site)/clasificados/rentas/results/page.tsx`. The streamed reveal for this boundary
 * reliably never fires on a hard load with a `lang` query param present (React/Next
 * streaming-runtime defect, not application code) — removing the boundary avoids it entirely.
 */
export default function BienesRaicesResultsPage() {
  return <BienesRaicesResultsClient />;
}
