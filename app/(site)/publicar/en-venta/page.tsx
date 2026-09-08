/**
 * Globalization Package A Gate 2 — En Venta checkpoint entry page.
 *
 * Note on the Gate I.5.1 "documented temporary exception" (no modern /publicar/en-venta):
 * that exception barred building a modern *wrapper around the Pro application component*
 * without a zero-behavior-change proof. This page is not a wrapper — it is a new, standalone
 * checkpoint card page whose CTA links to the unchanged canonical nested application
 * (/clasificados/publicar/en-venta/pro). The application route, component, and registry
 * `applicationRoute` are untouched.
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import { QuickLaneCheckpointClient } from "@/app/(site)/clasificados/publicar/_components/QuickLaneCheckpointClient";
import { resolveClasificadosPublishLangFromSearchParams } from "@/app/lib/clasificados/clasificadosPublishLang";

export const metadata: Metadata = {
  title: "Publicar En Venta / Varios | Leonix Clasificados",
  description: "Publica gratis artículos en venta en Leonix.",
};

type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function EnVentaCheckpointPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { copyLang } = resolveClasificadosPublishLangFromSearchParams(sp);
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <QuickLaneCheckpointClient lang={copyLang} category="en-venta" />
    </Suspense>
  );
}
