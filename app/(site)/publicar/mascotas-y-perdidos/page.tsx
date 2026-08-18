/**
 * Globalization Package A Gate 2 — Mascotas y Perdidos checkpoint entry page.
 * The lane previously had no checkpoint (and no /publicar/mascotas-y-perdidos index at all):
 * the gateway routed straight into the quick application. Application unchanged at
 * /publicar/mascotas-y-perdidos/quick.
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import { QuickLaneCheckpointClient } from "@/app/(site)/clasificados/publicar/_components/QuickLaneCheckpointClient";
import { resolveClasificadosPublishLangFromSearchParams } from "@/app/lib/clasificados/clasificadosPublishLang";

export const metadata: Metadata = {
  title: "Publicar Mascotas y Perdidos | Leonix Clasificados",
  description: "Publica gratis avisos de mascotas, perdidos y encontrados en Leonix.",
};

type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function MascotasCheckpointPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { copyLang } = resolveClasificadosPublishLangFromSearchParams(sp);
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <QuickLaneCheckpointClient lang={copyLang} category="mascotas-y-perdidos" />
    </Suspense>
  );
}
