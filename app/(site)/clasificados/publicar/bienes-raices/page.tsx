import type { Metadata } from "next";
import { BienesRaicesPublicarHubClient } from "./BienesRaicesPublicarHubClient";
import { resolveClasificadosPublishLangFromSearchParams } from "@/app/lib/clasificados/clasificadosPublishLang";

export const metadata: Metadata = {
  title: "Publicar Bienes Raíces | Leonix Clasificados",
  description: "Elige si publicas como particular o negocio profesional.",
};

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function BienesRaicesPublicarHubPage(props: PageProps) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { copyLang } = resolveClasificadosPublishLangFromSearchParams(sp);
  return <BienesRaicesPublicarHubClient lang={copyLang} />;
}
