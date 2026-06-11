"use client";

import { useMemo } from "react";
import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutosAdditionalInventoryVehicleDraft } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import { buildVehicleTitle } from "../lib/autoDealerTitle";
import { AutosNegociosVehicleApplicationSteps } from "./AutosNegociosVehicleApplicationSteps";

type Props = {
  lang: AutosNegociosLang;
  copy: AutosNegociosCopy;
  draft: AutosAdditionalInventoryVehicleDraft;
  onPatch: (patch: Partial<AutosAdditionalInventoryVehicleDraft>) => void;
  /** When set, only the matching step section renders (0–3, 5–6). Step 4 is inherited dealer in parent. */
  activeStep?: number;
  steppedMode?: boolean;
};

/** Legacy export — delegates to shared Autos Negocios vehicle application steps (inventory-child mode). */
export function AutosInventoryVehicleDrawerForm({
  lang,
  copy,
  draft,
  onPatch,
  activeStep,
  steppedMode = false,
}: Props) {
  const vehicleTitleOverride = draft.vehicleTitleOverride === true;
  const autoTitlePreview = useMemo(
    () => buildVehicleTitle(draft.year, draft.make, draft.model, draft.trim),
    [draft.year, draft.make, draft.model, draft.trim],
  );

  return (
    <AutosNegociosVehicleApplicationSteps
      mode="inventory-child"
      lang={lang}
      copy={copy}
      listing={draft}
      onPatch={(p) => onPatch(p as Partial<AutosAdditionalInventoryVehicleDraft>)}
      vehicleTitleOverride={vehicleTitleOverride}
      onVehicleTitleOverrideChange={(v) => onPatch({ vehicleTitleOverride: v })}
      autoTitlePreview={autoTitlePreview}
      activeStep={activeStep}
      steppedMode={steppedMode}
      includeChildReview
    />
  );
}
