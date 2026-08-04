/**
 * Globalization Package A Gate 2 — Clases checkpoint entry page.
 * The lane previously had no checkpoint: the gateway routed straight into the quick
 * application. Application unchanged at /publicar/clases/quick. The dormant paid Clases SKU
 * (clases_paid_30d) is deliberately not offered — no checkout path exists (owner decision D2).
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import { QuickLaneCheckpointClient } from "@/app/(site)/clasificados/publicar/_components/QuickLaneCheckpointClient";
import { resolveClasificadosPublishLangFromSearchParams } from "@/app/lib/clasificados/clasificadosPublishLang";

export const metadata: Metadata = {
  title: "Publicar Clases | Leonix Clasificados",
  description: "Publica gratis tu clase, curso o taller en Leonix.",
};

type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function ClasesCheckpointPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { copyLang } = resolveClasificadosPublishLangFromSearchParams(sp);
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <QuickLaneCheckpointClient lang={copyLang} category="clases" />
    </Suspense>
  );
}
