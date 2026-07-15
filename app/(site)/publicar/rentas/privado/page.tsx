import type { Metadata } from "next";
import { resolveLocaleFromSearchParams } from "@/app/lib/language";
import RentasPrivadoApplication from "@/app/clasificados/publicar/rentas/privado/application/RentasPrivadoApplication";

export const metadata: Metadata = {
  title: "Publicar Rentas — Privado | Leonix",
  description: "Publica tu renta como particular. Borrador local y vista previa.",
};

/** Public entry URL — same application as `/clasificados/publicar/rentas/privado`. */
export default async function PublicarRentasPrivadoEntryPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const locale = resolveLocaleFromSearchParams(searchParams);
  return <RentasPrivadoApplication initialLocale={locale} />;
}
