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
  // Gate I.13A — launch languages are Spanish and English only; `resolveLocaleFromSearchParams`
  // still accepts pt/tl (a deliberately reversible, not-yet-launched extensibility mechanism —
  // see app/lib/language.ts's ADDITIONAL_LANGUAGES comment), so clamp here rather than in the
  // shared resolver to avoid touching other, unrelated future-language work.
  const launchLocale = locale === "es" || locale === "en" ? locale : "es";
  return <RentasPrivadoApplication initialLocale={launchLocale} />;
}
