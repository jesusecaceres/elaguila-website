/**
 * Globalization Package A Gate 2 — Comida Local checkpoint entry page.
 *
 * The comida_local pipeline's application lives at /publicar/comida-local (that page IS the
 * form, so the checkpoint cannot take its path). The gateway now routes here first (registry
 * `checkpointRoute`); the CTA continues to the unchanged application. Distinct from the
 * Restaurantes-family "mobile_food_vendor" product card (which routes to
 * /publicar/restaurantes) — this is the free community comida_local pipeline.
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import { QuickLaneCheckpointClient } from "@/app/(site)/clasificados/publicar/_components/QuickLaneCheckpointClient";
import { resolveClasificadosPublishLangFromSearchParams } from "@/app/lib/clasificados/clasificadosPublishLang";

export const metadata: Metadata = {
  title: "Publicar Comida Local | Leonix Clasificados",
  description: "Publica gratis tu puesto o comida local en Leonix.",
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
