"use client";

import type { ReactNode } from "react";
import { CategoryStandardResultsHeader } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsHeader";
import { CategoryStandardResultsPageShell } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsPageShell";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";

type Props = {
  lang: Lang;
  children: ReactNode;
  resultCount?: number;
};

/** Servicios results — listings-first Leonix shell (no full-bleed atmosphere band). */
export function ServiciosResultsPageShell({ lang, children, resultCount }: Props) {
  const landingHref = `/clasificados/servicios?lang=${lang}`;
  const publishHref = `/clasificados/publicar/servicios?lang=${lang}`;
  const clearHref = `/clasificados/servicios/results?lang=${lang}`;

  return (
    <CategoryStandardResultsPageShell>
      <div className="space-y-5">
        <CategoryStandardResultsHeader
          lang={lang}
          title={lang === "en" ? "Services results" : "Resultados de Servicios"}
          subtitle={
            lang === "en"
              ? "Refine by area, trade, and trust signals — published showcases only."
              : "Afinar por zona, giro y señales de confianza — solo vitrinas publicadas."
          }
          backHref={landingHref}
          backLabel={lang === "en" ? "Back to Servicios" : "Volver a Servicios"}
          publishHref={publishHref}
          publishLabel={lang === "en" ? "Post your service" : "Publica tu servicio"}
          clearHref={clearHref}
          resultCount={resultCount}
        />
        {children}
      </div>
    </CategoryStandardResultsPageShell>
  );
}
