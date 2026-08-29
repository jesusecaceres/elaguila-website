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
 *
 * QA-2026-08-28: `force-dynamic` is required alongside the missing Suspense boundary —
 * `BienesRaicesResultsClient` calls `useSearchParams()` client-side, and without opting this
 * route out of static generation, `next build` attempts to prerender it and fails with
 * "useSearchParams() should be wrapped in a suspense boundary", halting the entire production
 * build. Rentas' equivalent route (`rentas/results/page.tsx`) already carries this export for the
 * same reason — this route was missing it.
 */
export const dynamic = "force-dynamic";

export default function BienesRaicesResultsPage() {
  return <BienesRaicesResultsClient />;
}
