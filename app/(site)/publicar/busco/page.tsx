/**
 * Globalization Package A Gate 2 — Busco checkpoint entry page.
 * The lane previously had no checkpoint: the gateway routed straight into the quick
 * application. This page presents the truthful free-lane checkpoint card first; the
 * application itself is unchanged at /publicar/busco/quick.
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import { QuickLaneCheckpointClient } from "@/app/(site)/clasificados/publicar/_components/QuickLaneCheckpointClient";
import { resolveClasificadosPublishLangFromSearchParams } from "@/app/lib/clasificados/clasificadosPublishLang";

export const metadata: Metadata = {
  title: "Publicar Busco / Se Busca | Leonix Clasificados",
  description: "Publica gratis lo que buscas en Leonix.",
};

type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function BuscoCheckpointPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { copyLang } = resolveClasificadosPublishLangFromSearchParams(sp);
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <QuickLaneCheckpointClient lang={copyLang} category="busco" />
    </Suspense>
  );
}
