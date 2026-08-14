import type { Metadata } from "next";
import { resolveLocaleFromSearchParams } from "@/app/lib/language";
import RentasPrivadoApplication from "./application/RentasPrivadoApplication";

export const metadata: Metadata = {
  title: "Publicar renta | Leonix",
  description: "Publica una renta con borrador local y vista previa.",
};

export default async function RentasPrivadoPublishEntryPage(props: {
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
