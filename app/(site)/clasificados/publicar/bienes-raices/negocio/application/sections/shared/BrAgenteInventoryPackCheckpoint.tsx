"use client";

import { useState } from "react";
import { brAgenteApplicationPricingCopy, type BrAgentePricingLang } from "../../../../shared/brAgenteApplicationPricingCopy";
import { BrAgenteShowcaseSeeMoreDrawer } from "../../../../shared/BrAgenteShowcaseSeeMoreDrawer";
import {
  BR_INVENTORY_PACK_MAX_CHILDREN,
  brApplicationMonthlyTotalCents,
  formatBrMonthlyPrice,
} from "../../../../shared/brAgenteApplicationPricingHelpers";

type Props = {
  lang: BrAgentePricingLang;
  inventoryPackAccepted: boolean;
  childCount: number;
  onAcceptPack: () => void;
  onContinueMainOnly: () => void;
  onCancelPack: () => void;
  onAddProperty: () => void;
};

/** Pricing checkpoint before child inventory opens (Restaurante coupon pattern). */
export function BrAgenteInventoryPackCheckpoint({
  lang,
  inventoryPackAccepted,
  childCount,
  onAcceptPack,
  onContinueMainOnly,
  onCancelPack,
  onAddProperty,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const copy = brAgenteApplicationPricingCopy(lang);
  const packActive = inventoryPackAccepted || childCount > 0;
  const totalCents = brApplicationMonthlyTotalCents(childCount, inventoryPackAccepted);

  const handleCancelPack = () => {
    if (childCount > 0) {
      if (!window.confirm(`${copy.cancelPackConfirmTitle}\n\n${copy.cancelPackConfirmBody}`)) return;
    }
    onCancelPack();
  };

  if (!packActive) {
    return (
      <>
        <div className="mt-4 rounded-2xl border-2 border-[#C9B46A]/45 bg-gradient-to-b from-[#FFF6E7] to-[#FFFCF7] p-4 shadow-sm">
          <h3 className="text-base font-bold text-[#1E1810]">{copy.inventoryCheckpointTitle}</h3>
          <p className="mt-1 text-sm text-[#5C5346]/90">{copy.inventoryCheckpointLead}</p>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#6E5418]">{copy.currentPlan}</p>
              <p className="font-semibold text-[#1E1810]">{copy.currentPlanLine}</p>
              <p className="text-[#5C5346]/85">{copy.currentPlanDetail}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#6E5418]">{copy.optionalUpgrade}</p>
              <p className="font-semibold text-[#1E1810]">{copy.optionalUpgradeLine}</p>
              <p className="text-[#5C5346]/85">{copy.optionalUpgradeDetail}</p>
            </div>
            <p className="text-sm font-semibold text-[#6E5418]">
              {copy.totalIfSelected}: {copy.total498}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={onAcceptPack}
              className="min-h-[44px] rounded-xl bg-[#1E1810] px-4 py-2.5 text-sm font-bold text-[#F9F6F1] hover:bg-[#2C2416]"
            >
              {copy.acceptPack}
            </button>
            <button
              type="button"
              onClick={onContinueMainOnly}
              className="min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-4 py-2.5 text-sm font-semibold text-[#5C5346] hover:bg-[#FFFCF7]"
            >
              {copy.continueMainOnly}
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="min-h-[44px] rounded-xl border border-[#C9B46A]/55 bg-[#FFF6E7] px-4 py-2.5 text-sm font-semibold text-[#6E5418] hover:bg-[#FFEFD8]"
            >
              {copy.startSeeMore}
            </button>
          </div>
        </div>
        <BrAgenteShowcaseSeeMoreDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} lang={lang} />
      </>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-[#C9B46A]/40 bg-[#FFF6E7]/80 px-4 py-3">
      <p className="text-sm font-bold text-[#6E5418]">{copy.packSelected}</p>
      <p className="mt-0.5 text-sm text-[#5C5346]/90">{copy.packSelectedLine}</p>
      <p className="mt-1 text-sm font-semibold text-[#1E1810]">{copy.additionalCount(childCount)}</p>
      <p className="mt-1 text-sm font-semibold text-[#6E5418]">
        {copy.totalMonthly}: {formatBrMonthlyPrice(totalCents, lang)}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={onAddProperty}
          disabled={childCount >= BR_INVENTORY_PACK_MAX_CHILDREN}
          className="min-h-[44px] rounded-xl border border-[#C9B46A]/60 bg-white px-4 py-2.5 text-sm font-bold text-[#6E5418] hover:bg-[#FFEFD8] disabled:opacity-45"
        >
          {copy.addAnother}
        </button>
        <button
          type="button"
          onClick={handleCancelPack}
          className="min-h-[44px] rounded-xl border border-[#E8DFD0] px-4 py-2.5 text-sm font-semibold text-[#B42318] hover:bg-[#FFF5F5]"
        >
          {copy.cancelPack}
        </button>
      </div>
    </div>
  );
}
