"use client";

import { brAgenteApplicationPricingCopy, type BrAgentePricingLang } from "../../../../shared/brAgenteApplicationPricingCopy";
import {
  BR_AGENT_SHOWCASE_PRICE_CENTS,
  BR_INVENTORY_PACK_PRICE_CENTS,
  brApplicationPricingSummaryTotalCents,
  formatBrMonthlyPrice,
} from "../../../../shared/brAgenteApplicationPricingHelpers";

type Props = {
  lang: BrAgentePricingLang;
  childCount: number;
};

/** Final application step — monthly pricing summary before preview. */
export function BrAgenteApplicationPricingSummary({ lang, childCount }: Props) {
  const copy = brAgenteApplicationPricingCopy(lang);
  const hasChildren = childCount >= 1;
  const totalCents = brApplicationPricingSummaryTotalCents(childCount);

  return (
    <section className="mt-5 rounded-xl border border-[#C9B46A]/35 bg-[#FFF6E7]/60 px-4 py-4">
      <h3 className="text-sm font-bold uppercase tracking-wide text-[#6E5418]">{copy.pricingSummaryTitle}</h3>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#E8DFD0]/80 pb-2">
          <div>
            <p className="font-semibold text-[#1E1810]">{copy.baseLine}</p>
            <p className="text-xs text-[#5C5346]/85">{copy.baseDetail}</p>
          </div>
          <p className="font-bold tabular-nums text-[#1E1810]">{formatBrMonthlyPrice(BR_AGENT_SHOWCASE_PRICE_CENTS, lang)}</p>
        </div>
        {hasChildren ? (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#E8DFD0]/80 pb-2">
              <div>
                <p className="font-semibold text-[#1E1810]">{copy.packLine}</p>
                <p className="text-xs text-[#5C5346]/85">{copy.packDetail}</p>
              </div>
              <p className="font-bold tabular-nums text-[#1E1810]">
                +{formatBrMonthlyPrice(BR_INVENTORY_PACK_PRICE_CENTS, lang)}
              </p>
            </div>
            <p className="text-xs font-medium text-[#5C5346]">{copy.additionalCount(childCount)}</p>
          </>
        ) : null}
        <div className="flex flex-wrap items-baseline justify-between gap-2 pt-1">
          <p className="font-bold text-[#1E1810]">{copy.totalLabel}</p>
          <p className="text-base font-bold tabular-nums text-[#6E5418]">{formatBrMonthlyPrice(totalCents, lang)}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-[#7A7164]">{copy.paymentAfterPreview}</p>
    </section>
  );
}
