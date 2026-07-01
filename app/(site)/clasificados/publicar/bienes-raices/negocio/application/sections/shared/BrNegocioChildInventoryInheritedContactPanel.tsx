"use client";

import type { AgenteIndividualResidencialFormState } from "../../../agente-individual/schema/agenteIndividualResidencialFormState";
import { Step08CtaEnlaces } from "../../../agente-individual/sections/steps04-09";
import { useBrAgenteResidencialCopy } from "../../../agente-individual/application/BrAgenteResidencialLocaleContext";
import { aiSubClass } from "../../../agente-individual/application/formPrimitives";

/** Read-only inherited contact destinations (parent Step 8) for child inventory. */
export function BrNegocioChildInventoryInheritedContactPanel({
  state,
}: {
  state: AgenteIndividualResidencialFormState;
}) {
  const { lang } = useBrAgenteResidencialCopy();
  const inheritedNote =
    lang === "es"
      ? "Esta información se hereda de la aplicación principal y se usará para esta propiedad."
      : "This information is inherited from the main application and will be used for this property.";

  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-[#C9B46A]/35 bg-[#FFF6E7] px-3 py-2 text-xs font-medium text-[#5C5346]">
        {lang === "es" ? "Solo lectura — heredado del anuncio principal." : "Read-only — inherited from the main listing."}
      </p>
      <p className={aiSubClass}>{inheritedNote}</p>
      <Step08CtaEnlaces state={state} setState={() => {}} />
    </div>
  );
}
