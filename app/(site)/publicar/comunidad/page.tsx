/**
 * Globalization Package A Gate 2 — Comunidad checkpoint entry page.
 * The lane previously had no checkpoint: the gateway routed straight into the quick
 * application. Application unchanged at /publicar/comunidad/quick.
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import { QuickLaneCheckpointClient } from "@/app/(site)/clasificados/publicar/_components/QuickLaneCheckpointClient";
import { resolveClasificadosPublishLangFromSearchParams } from "@/app/lib/clasificados/clasificadosPublishLang";

export const metadata: Metadata = {
  title: "Publicar Comunidad y Eventos | Leonix Clasificados",
  description: "Publica gratis eventos y actividades comunitarias en Leonix.",
};

type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function ComunidadCheckpointPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { copyLang } = resolveClasificadosPublishLangFromSearchParams(sp);
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <QuickLaneCheckpointClient lang={copyLang} category="comunidad" />
    </Suspense>
  );
}
