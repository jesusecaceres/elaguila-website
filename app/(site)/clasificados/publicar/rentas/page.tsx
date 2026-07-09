import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RENTAS_PUBLICAR_PRIVADO } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { resolveClasificadosPublishLangFromSearchParams, withClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";

export const metadata: Metadata = {
  title: "Publicar Rentas | Leonix Clasificados",
  description: "Publica una renta por 30 días.",
};

type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function RentasPublicarHubPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { routeLang } = resolveClasificadosPublishLangFromSearchParams(sp);
  redirect(withClasificadosPublishLang(RENTAS_PUBLICAR_PRIVADO, routeLang));
}
