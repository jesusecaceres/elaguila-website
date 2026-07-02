"use client";

import { useMemo } from "react";
import type { AgenteIndividualResidencialFormState } from "../../../agente-individual/schema/agenteIndividualResidencialFormState";
import { Step08CtaEnlaces } from "../../../agente-individual/sections/steps04-09";
import { useBrAgenteResidencialCopy } from "../../../agente-individual/application/BrAgenteResidencialLocaleContext";
import { aiCardClass, aiSubClass, aiTitleClass } from "../../../agente-individual/application/formPrimitives";
import { detectAgenteResBuyerActions } from "../../../agente-individual/lib/agenteResidencialDetectedActions";
import {
  inheritedHubEmptyMessage,
  inheritedHubStep8EmptyHint,
  useInheritedHubModel,
} from "./brNegocioChildInheritedHubShared";

/** Read-only inherited contact destinations (parent Step 8) for child inventory. */
export function BrNegocioChildInventoryInheritedContactPanel({
  state,
}: {
  state: AgenteIndividualResidencialFormState;
}) {
  const { lang, t } = useBrAgenteResidencialCopy();
  const locale = lang === "en" ? "en" : "es";
  const s8 = t.step08;
  const hubModel = useInheritedHubModel(state, t.step07, locale);
  const activeActions = useMemo(
    () => detectAgenteResBuyerActions(state, locale).filter((d) => d.active),
    [state, locale],
  );

  const inheritedNote =
    lang === "es"
      ? "Esta información se hereda de la aplicación principal y se usará para esta propiedad."
      : "This information is inherited from the main application and will be used for this property.";

  const showEmpty = !hubModel.hasAnyContent && activeActions.length === 0;

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>{s8.title}</h2>
      <p className={aiSubClass}>{inheritedNote}</p>
      <p className="mt-3 rounded-lg border border-[#C9B46A]/35 bg-[#FFF6E7] px-3 py-2 text-xs font-medium text-[#5C5346]">
        {lang === "es" ? "Solo lectura — heredado del anuncio principal." : "Read-only — inherited from the main listing."}
      </p>

      {showEmpty ? (
        <div className="mt-4 space-y-2 rounded-lg border border-[#FECDCA]/80 bg-[#FEF3F2] px-4 py-3">
          <p className="text-sm font-semibold text-[#B42318]">{inheritedHubEmptyMessage(lang)}</p>
          <p className="text-sm leading-relaxed text-[#5C5346]/90">{inheritedHubStep8EmptyHint(lang)}</p>
        </div>
      ) : (
        <div className="mt-4">
          <Step08CtaEnlaces state={state} setState={() => {}} />
        </div>
      )}
    </section>
  );
}
