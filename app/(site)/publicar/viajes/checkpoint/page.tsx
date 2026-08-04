/**
 * Globalization Package A Gate 2 — Viajes checkpoint entry page.
 *
 * Presents the truthful paid (negocios, $ from revenuePricingMatrix) and free (privado) lane
 * cards before either application. The existing /publicar/viajes branch chooser
 * (PublicarViajesBranchClient) is deliberately left untouched — that surface may be superseded
 * by the isolated Viajes workstream at merge; the shared checkpoint card config in
 * categoryPublishCheckpoints.ts is the canonical contract either surface consumes. The gateway
 * routes here (registry `checkpointRoute`); lane applications are unchanged at
 * /publicar/viajes/{negocios,privado}.
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import { QuickLaneCheckpointClient } from "@/app/(site)/clasificados/publicar/_components/QuickLaneCheckpointClient";
import { resolveClasificadosPublishLangFromSearchParams } from "@/app/lib/clasificados/clasificadosPublishLang";

export const metadata: Metadata = {
  title: "Publicar Viajes | Leonix Clasificados",
  description: "Elige cómo publicar tu viaje u oferta en Leonix.",
};

type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function ViajesCheckpointPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { copyLang } = resolveClasificadosPublishLangFromSearchParams(sp);
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <QuickLaneCheckpointClient lang={copyLang} category="viajes" />
    </Suspense>
  );
}
