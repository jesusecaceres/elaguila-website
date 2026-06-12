"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import type { AutosAdditionalInventoryVehicleDraft } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import { getAutosApplicationStepLabels } from "@/app/publicar/autos/shared/lib/autosApplicationStepShellCopy";
import {
  AutosApplicationSteppedShell,
  type AutosApplicationStepContext,
} from "@/app/publicar/autos/shared/components/AutosApplicationSteppedShell";
import { AutosNegociosVehicleApplicationSteps } from "./AutosNegociosVehicleApplicationSteps";
import { AutosInventoryInheritedDealerStep } from "./AutosInventoryInheritedDealerStep";
import { AutosNegociosChildInventoryPreviewOverlay } from "./AutosNegociosChildInventoryPreviewOverlay";
import { autosInventoryChildReviewPreviewCta } from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";
import { buildVehicleTitle } from "../lib/autoDealerTitle";

type Props = {
  lang: AutosNegociosLang;
  copy: AutosNegociosCopy;
  draft: AutosAdditionalInventoryVehicleDraft;
  parentListing: AutoDealerListing;
  additionalVehicles: AutosAdditionalInventoryVehicleDraft[];
  onPatch: (patch: Partial<AutosAdditionalInventoryVehicleDraft>) => void;
  onEditInMainApplication?: () => void;
  onActiveStepChange?: (step: number) => void;
  onStepNavReady?: (ctx: AutosApplicationStepContext | null) => void;
};

function StepNavBridge({
  ctx,
  onReady,
  children,
}: {
  ctx: AutosApplicationStepContext;
  onReady?: (ctx: AutosApplicationStepContext) => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    onReady?.(ctx);
  }, [ctx, onReady]);
  return <>{children}</>;
}

export function AutosNegociosInventoryChildApplication({
  lang,
  copy,
  draft,
  parentListing,
  additionalVehicles,
  onPatch,
  onEditInMainApplication,
  onActiveStepChange,
  onStepNavReady,
}: Props) {
  const stepLabels = getAutosApplicationStepLabels(lang, "negocios");
  const [previewOpen, setPreviewOpen] = useState(false);

  const vehicleTitleOverride = draft.vehicleTitleOverride === true;
  const autoTitlePreview = useMemo(
    () => buildVehicleTitle(draft.year, draft.make, draft.model, draft.trim),
    [draft.year, draft.make, draft.model, draft.trim],
  );

  const renderStep = useCallback(
    (activeStep: number) => {
      if (activeStep === 4) {
        return (
          <AutosInventoryInheritedDealerStep
            lang={lang}
            copy={copy}
            parentListing={parentListing}
            onEditInMainApplication={onEditInMainApplication}
          />
        );
      }

      const formStep =
        activeStep <= 3 ? activeStep : activeStep === 5 ? 5 : activeStep === 6 ? 6 : activeStep;

      return (
        <>
          <AutosNegociosVehicleApplicationSteps
            mode="inventory-child"
            lang={lang}
            copy={copy}
            listing={draft}
            onPatch={(p) => onPatch(p as Partial<AutosAdditionalInventoryVehicleDraft>)}
            vehicleTitleOverride={vehicleTitleOverride}
            onVehicleTitleOverrideChange={(v) => onPatch({ vehicleTitleOverride: v })}
            autoTitlePreview={autoTitlePreview}
            steppedMode
            activeStep={formStep}
            includeChildReview
          />
          {activeStep === 6 ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="w-full rounded-2xl border border-[color:var(--lx-gold-border)]/50 bg-white py-3 text-sm font-bold text-[#6E5418] hover:bg-[#FFF6E7]"
              >
                {autosInventoryChildReviewPreviewCta(lang)}
              </button>
            </div>
          ) : null}
        </>
      );
    },
    [
      autoTitlePreview,
      copy,
      draft,
      lang,
      onEditInMainApplication,
      onPatch,
      parentListing,
      vehicleTitleOverride,
    ],
  );

  return (
    <>
      <AutosApplicationSteppedShell
        lang={lang}
        lane="negocios"
        stepLabels={stepLabels}
        variant="embedded"
        hideShellFooter
        onStepChange={(step) => onActiveStepChange?.(step)}
      >
        {(ctx) => (
          <StepNavBridge ctx={ctx} onReady={onStepNavReady}>
            {renderStep(ctx.activeStep)}
          </StepNavBridge>
        )}
      </AutosApplicationSteppedShell>
      {previewOpen ? (
        <AutosNegociosChildInventoryPreviewOverlay
          lang={lang}
          parentListing={parentListing}
          child={draft}
          allAdditional={additionalVehicles}
          backToEditLabel={copy.preview.chrome.backToEdit}
          onBackToEdit={() => setPreviewOpen(false)}
        />
      ) : null}
    </>
  );
}
