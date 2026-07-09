import type { Metadata } from "next";
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
  return <RentasPublicarHubClient lang={copyLang} />;
}
