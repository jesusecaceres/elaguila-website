import type { Metadata } from "next";
import { BienesRaicesPublicarHubClient } from "./BienesRaicesPublicarHubClient";

export const metadata: Metadata = {
  title: "Publicar Bienes Raíces | Leonix Clasificados",
  description: "Elige si publicas como particular o negocio profesional.",
};

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function BienesRaicesPublicarHubPage(props: PageProps) {
  const sp = props.searchParams ? await props.searchParams : {};
  const lang = sp.lang === "en" ? "en" : "es";
  return <BienesRaicesPublicarHubClient lang={lang} />;
}
