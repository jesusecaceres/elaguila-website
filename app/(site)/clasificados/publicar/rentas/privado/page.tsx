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
  return <RentasPrivadoApplication initialLocale={locale} />;
}
