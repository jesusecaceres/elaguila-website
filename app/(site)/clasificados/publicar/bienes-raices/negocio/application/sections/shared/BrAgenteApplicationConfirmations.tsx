"use client";

import type { AgenteIndividualResidencialFormState } from "../../../agente-individual/schema/agenteIndividualResidencialFormState";
import { brAgenteApplicationPricingCopy, type BrAgentePricingLang } from "../../../../shared/brAgenteApplicationPricingCopy";

type Props = {
  lang: BrAgentePricingLang;
  state: AgenteIndividualResidencialFormState;
  childCount: number;
  setState: React.Dispatch<React.SetStateAction<AgenteIndividualResidencialFormState>>;
};

/** Final step confirmation checkboxes — gates Preview CTA (not Stripe). */
export function BrAgenteApplicationConfirmations({ lang, state, childCount, setState }: Props) {
  const copy = brAgenteApplicationPricingCopy(lang);
  const showInventoryConfirm = childCount >= 1;

  return (
    <section className="mt-5 rounded-xl border border-[#E8DFD0] bg-white/80 px-4 py-4">
      <p className="text-sm text-[#5C5346]/90">{copy.confirmIntro}</p>
      <div className="mt-4 space-y-3">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0"
            checked={state.confirmListingAccurate}
            onChange={(e) => setState((s) => ({ ...s, confirmListingAccurate: e.target.checked }))}
          />
          <span className="text-sm text-[#1E1810]">{copy.confirmAccurate}</span>
        </label>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0"
            checked={state.confirmPhotosRepresentItem}
            onChange={(e) => setState((s) => ({ ...s, confirmPhotosRepresentItem: e.target.checked }))}
          />
          <span className="text-sm text-[#1E1810]">{copy.confirmPhotos}</span>
        </label>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0"
            checked={state.confirmCommunityRules}
            onChange={(e) => setState((s) => ({ ...s, confirmCommunityRules: e.target.checked }))}
          />
          <span className="text-sm text-[#1E1810]">{copy.confirmRules}</span>
        </label>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0"
            checked={state.confirmPaymentAfterPreview}
            onChange={(e) => setState((s) => ({ ...s, confirmPaymentAfterPreview: e.target.checked }))}
          />
          <span className="text-sm text-[#1E1810]">{copy.confirmPayment}</span>
        </label>
        {showInventoryConfirm ? (
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0"
              checked={state.confirmInventoryPackPricing}
              onChange={(e) => setState((s) => ({ ...s, confirmInventoryPackPricing: e.target.checked }))}
            />
            <span className="text-sm text-[#1E1810]">{copy.confirmInventory}</span>
          </label>
        ) : null}
      </div>
    </section>
  );
}
