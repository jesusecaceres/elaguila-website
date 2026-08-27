/**
 * Globalization Package A Gate 2 — Comida Local checkpoint entry page.
 *
 * The comida_local pipeline's application lives at /publicar/comida-local (that page IS the
 * form, so the checkpoint cannot take its path). The gateway now routes here first (registry
 * `checkpointRoute`); the CTA continues to the unchanged application. Distinct from the
 * Restaurantes-family "mobile_food_vendor" product card (which routes to
 * /publicar/restaurantes and remains its own $399/mo product, untouched here) — this is the
 * standalone comida_local pipeline. Gate D18: this pipeline is $129/mo (comida_local_base_monthly
 * in revenuePricingMatrix.ts), not free — see getComidaLocalCheckpointCard.
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import { QuickLaneCheckpointClient } from "@/app/(site)/clasificados/publicar/_components/QuickLaneCheckpointClient";
import { resolveClasificadosPublishLangFromSearchParams } from "@/app/lib/clasificados/clasificadosPublishLang";

export const metadata: Metadata = {
  title: "Publicar Comida Local | Leonix Clasificados",
  description: "Publica tu puesto o comida local en Leonix — $129/mes.",
};

type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function ComidaLocalCheckpointPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { copyLang } = resolveClasificadosPublishLangFromSearchParams(sp);
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <QuickLaneCheckpointClient lang={copyLang} category="comida-local" />
    </Suspense>
  );
}
