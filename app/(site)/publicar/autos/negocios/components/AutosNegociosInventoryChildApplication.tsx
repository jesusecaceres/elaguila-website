"use client";

import { useCallback, useEffect, useState } from "react";
import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import type { AutosAdditionalInventoryVehicleDraft } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import { getAutosApplicationStepLabels } from "@/app/publicar/autos/shared/lib/autosApplicationStepShellCopy";
import {
  AutosInventoryChildSteppedShell,
  type AutosInventoryChildStepContext,
} from "@/app/publicar/autos/shared/components/AutosInventoryChildSteppedShell";
import { AutosInventoryVehicleDrawerForm } from "./AutosInventoryVehicleDrawerForm";
import { AutosInventoryInheritedDealerStep } from "./AutosInventoryInheritedDealerStep";
import { AutosNegociosChildInventoryPreviewOverlay } from "./AutosNegociosChildInventoryPreviewOverlay";
import { autosInventoryChildReviewPreviewCta } from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";

type Props = {
  lang: AutosNegociosLang;
  copy: AutosNegociosCopy;
  draft: AutosAdditionalInventoryVehicleDraft;
  parentListing: AutoDealerListing;
  additionalVehicles: AutosAdditionalInventoryVehicleDraft[];
  onPatch: (patch: Partial<AutosAdditionalInventoryVehicleDraft>) => void;
  onEditInMainApplication?: () => void;
  onActiveStepChange?: (step: number) => void;
  onStepNavReady?: (ctx: AutosInventoryChildStepContext | null) => void;
};

function StepNavBridge({
  ctx,
  onReady,
  children,
}: {
  ctx: AutosInventoryChildStepContext;
  onReady?: (ctx: AutosInventoryChildStepContext) => void;
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
          <AutosInventoryVehicleDrawerForm
            lang={lang}
            copy={copy}
            draft={draft}
            onPatch={onPatch}
            steppedMode
            activeStep={formStep}
          />
          {activeStep === 6 ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="w-full rounded-2xl border border-[#C9B46A]/50 bg-white py-3 text-sm font-bold text-[#6E5418] hover:bg-[#FFF6E7]"
              >
                {autosInventoryChildReviewPreviewCta(lang)}
              </button>
            </div>
          ) : null}
        </>
      );
    },
    [copy, draft, lang, onEditInMainApplication, onPatch, parentListing],
  );

  return (
    <>
      <AutosInventoryChildSteppedShell
        lang={lang}
        stepLabels={stepLabels}
        onStepChange={onActiveStepChange}
      >
        {(ctx) => (
          <StepNavBridge ctx={ctx} onReady={onStepNavReady}>
            {renderStep(ctx.activeStep)}
          </StepNavBridge>
        )}
      </AutosInventoryChildSteppedShell>
      {previewOpen ? (
        <AutosNegociosChildInventoryPreviewOverlay
          lang={lang}
          parentListing={parentListing}
          child={draft}
          allAdditional={additionalVehicles}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
    </>
  );
}
