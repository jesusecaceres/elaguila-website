import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RENTAS_PUBLICAR_PRIVADO } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { normalizeRentasLandingLang, withRentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";

export const metadata: Metadata = {
  title: "Publicar Rentas | Leonix Clasificados",
  description: "Publica una renta por 30 días.",
};

type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function RentasPublicarHubPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const lang = normalizeRentasLandingLang(sp.lang);
  redirect(withRentasLandingLang(RENTAS_PUBLICAR_PRIVADO, lang));
}
