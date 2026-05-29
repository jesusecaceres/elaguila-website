"use client";

import { useMemo } from "react";
import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { buildEnVentaResultsCardModelFromDraftState } from "../results/buildEnVentaResultsCardModel";
import { EnVentaResultListingCard } from "../results/EnVentaResultListingCard";
import { EN_VENTA_SURFACE } from "../shared/styles/enVentaBrand";

const COPY = {
  es: {
    title: "Así aparecerá en los listados",
    helper: "Esta tarjeta es una vista aproximada de cómo los compradores verán tu anuncio en resultados.",
    detailTitle: "Vista previa del anuncio completo",
  },
  en: {
    title: "How it will appear in listings",
    helper: "This card is an approximate preview of how buyers will see your listing in results.",
    detailTitle: "Full listing preview",
  },
} as const;

export function EnVentaPreviewResultsCardSample({
  state,
  lang,
  plan,
}: {
  state: EnVentaFreeApplicationState;
  lang: "es" | "en";
  plan: "free" | "pro";
}) {
  const t = COPY[lang];
  const model = useMemo(
    () => buildEnVentaResultsCardModelFromDraftState(state, { lang, plan }),
    [state, lang, plan]
  );

  return (
    <section aria-labelledby="enventa-preview-results-card-heading" className="space-y-6">
      <div className={EN_VENTA_SURFACE.contentCard}>
        <h2 id="enventa-preview-results-card-heading" className="text-lg font-bold text-[#3D3428] sm:text-xl">
          {t.title}
        </h2>
        <p className="mt-2 text-sm font-normal leading-relaxed text-[#3D3428]/85">{t.helper}</p>
        <div className="mt-5 flex justify-center sm:justify-start">
          <div className="w-full max-w-[320px] sm:max-w-[340px]">
            <EnVentaResultListingCard
              model={model}
              lang={lang}
              layout="grid"
              mode="preview"
              isFav={false}
              onToggleFav={() => {}}
              href="#"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-[#D6C7AD]/70 pt-5">
        <h2 className="text-base font-semibold text-[#3D3428] sm:text-lg">{t.detailTitle}</h2>
      </div>
    </section>
  );
}
