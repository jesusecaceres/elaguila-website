"use client";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { LeonixLocalBusinessCompactSearchCanvas } from "@/app/(site)/clasificados/shared/components/LeonixLocalBusinessCompactSearchCanvas";

export function ServiciosCompactSearchCanvas({ lang }: { lang: Lang }) {
  const resultsHref = buildCategoryResultsUrl("servicios", lang);

  return (
    <LeonixLocalBusinessCompactSearchCanvas
      lang={lang}
      routeLang={lang}
      action={resultsHref}
      method="get"
      keywordPlaceholder={lang === "es" ? "Servicio, oficio o negocio…" : "Service, trade, or business…"}
      searchButtonLabel={lang === "es" ? "Buscar" : "Search"}
      filtersHref={`${resultsHref}?lang=${lang}`}
      browseAllHref={`${resultsHref}?lang=${lang}`}
      cityDatalistId="servicios-city-presets"
    />
  );
}
