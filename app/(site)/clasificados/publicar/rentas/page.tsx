import type { Metadata } from "next";
import { Suspense } from "react";
import { RentasPublicarHubClient } from "./RentasPublicarHubClient";
import { resolveClasificadosPublishLangFromSearchParams } from "@/app/lib/clasificados/clasificadosPublishLang";

export const metadata: Metadata = {
  title: "Publicar Rentas | Leonix Clasificados",
  description: "Elige cómo publicar una renta en Leonix.",
};

type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function RentasPublicarHubPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { copyLang } = resolveClasificadosPublishLangFromSearchParams(sp);
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <RentasPublicarHubClient lang={copyLang} />
    </Suspense>
  );
}
