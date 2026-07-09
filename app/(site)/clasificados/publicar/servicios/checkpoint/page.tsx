import type { Metadata } from "next";
import { Suspense } from "react";
import { resolveClasificadosPublishLangFromSearchParams } from "@/app/lib/clasificados/clasificadosPublishLang";
import { ServiciosCheckpointClient } from "./ServiciosCheckpointClient";

export const metadata: Metadata = {
  title: "Publicar en Servicios | Leonix Clasificados",
  description: "Presenta tu negocio de servicios en Leonix con una ficha profesional.",
};

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function ServiciosCheckpointPage(props: PageProps) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { routeLang, copyLang } = resolveClasificadosPublishLangFromSearchParams(sp);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F0E2] pt-28 text-center text-sm text-[#5D4A25]" aria-busy="true">
          …
        </div>
      }
    >
      <ServiciosCheckpointClient lang={copyLang} routeLang={routeLang} />
    </Suspense>
  );
}
