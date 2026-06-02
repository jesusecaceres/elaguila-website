"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AutosDealerInventoryCount } from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import {
  autosDealerInventoryDrawerPaymentNote,
  autosDealerInventoryRequestBoostCta,
} from "@/app/lib/clasificados/autos/autosDealerInventoryCopy";
import { autosDealerInventoryAddTenSlotsCta, autosDealerInventoryAddVehicleCta } from "@/app/lib/clasificados/autos/autosDealerInventoryValueCopy";
import {
  autosDealerInventoryActiveCountLine,
  autosDealerInventoryDrawerAtLimitBody,
  autosDealerInventoryDrawerAtLimitTitle,
  autosDealerInventoryDrawerBasePackageLine,
  autosDealerInventoryDrawerClose,
  autosDealerInventoryDrawerPlanFootnote,
  autosDealerInventoryDrawerTitle,
  autosDealerInventoryDrawerUpgradeLine,
  autosDealerInventoryDrawerValueBullets,
  autosDealerInventoryRemainingSlotsLine,
} from "@/app/lib/clasificados/autos/autosDealerInventoryDrawerCopy";
import { autosDealerInventoryTotalWithBoostLine } from "@/app/lib/clasificados/autos/autosDealerInventoryCopy";
import {
  buildAutosInventoryAddPublishHref,
  type AutosInventoryAddContext,
} from "@/app/lib/clasificados/autos/autosDealerInventoryAddFlow";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import {
  AutosNegociosInventoryBoostPanel,
  type AutosInventoryBoostEditorContext,
} from "@/app/publicar/autos/negocios/components/AutosNegociosInventoryBoostPanel";

type Props = {
  open: boolean;
  onClose: () => void;
  lang: AutosNegociosLang;
  addCtx: AutosInventoryAddContext;
  counts: AutosDealerInventoryCount;
  flushDraft?: () => Promise<void>;
  boostEditorContext?: AutosInventoryBoostEditorContext;
};

export function AutosNegociosInventoryValueDrawer({
  open,
  onClose,
  lang,
  addCtx,
  counts,
  flushDraft,
  boostEditorContext,
}: Props) {
  const router = useRouter();
  const atLimit = !counts.canAddActiveVehicle;
  const bullets = autosDealerInventoryDrawerValueBullets(lang);
  const [boostOpen, setBoostOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const boostContext: AutosInventoryBoostEditorContext = boostEditorContext ?? {
    editorPath: typeof window !== "undefined" ? window.location.pathname : "",
    editorSearch: typeof window !== "undefined" ? window.location.search : "",
    parentListingId: addCtx.parentListingId,
    returnToListingId: addCtx.returnToListingId,
    dealerInventoryGroupId: addCtx.dealerInventoryGroupId,
  };

  const handlePrimary = () => {
    if (atLimit) {
      setBoostOpen(true);
      return;
    }
    onClose();
    router.push(buildAutosInventoryAddPublishHref(addCtx, lang));
  };

  const primaryLabel = atLimit ? autosDealerInventoryRequestBoostCta(lang) : autosDealerInventoryAddVehicleCta(lang);

  return (
    <>
      <div
        className="fixed inset-0 z-[70] flex items-end justify-center lg:items-stretch lg:justify-end"
        role="dialog"
        aria-modal="true"
        aria-labelledby="autos-inventory-value-drawer-title"
      >
        <button
          type="button"
          className="absolute inset-0 bg-[#1E1810]/45 backdrop-blur-[2px]"
          aria-label={autosDealerInventoryDrawerClose(lang)}
          onClick={onClose}
        />
        <div className="relative flex max-h-[min(92dvh,720px)] w-full flex-col rounded-t-[24px] border border-[#E8DFD0] bg-[#FAF7F2] shadow-2xl lg:ml-auto lg:h-full lg:max-h-none lg:w-[min(100%,480px)] lg:max-w-[480px] lg:rounded-none lg:rounded-l-[24px]">
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[#D4C4A8] lg:hidden" aria-hidden />
          <div className="flex shrink-0 items-center justify-between border-b border-[#E8DFD0] px-4 py-3 sm:px-5">
            <h2 id="autos-inventory-value-drawer-title" className="font-serif text-lg font-semibold text-[#1E1810] sm:text-xl">
              {autosDealerInventoryDrawerTitle(lang)}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-[#5C5346] hover:bg-[#FDFBF7]"
            >
              {autosDealerInventoryDrawerClose(lang)}
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
            <p className="text-base font-extrabold text-[#1E1810]">{autosDealerInventoryActiveCountLine(lang, counts)}</p>
            {!atLimit ? (
              <p className="mt-1 text-sm font-semibold text-[#6E5418]">
                {autosDealerInventoryRemainingSlotsLine(lang, counts)}
              </p>
            ) : (
              <div className="mt-3 rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3">
                <p className="text-sm font-bold text-amber-950">{autosDealerInventoryDrawerAtLimitTitle(lang)}</p>
                <p className="mt-1 text-sm text-amber-900/95">{autosDealerInventoryDrawerAtLimitBody(lang)}</p>
              </div>
            )}

            <p className="mt-4 text-sm leading-relaxed text-[#2C2416]">{autosDealerInventoryDrawerBasePackageLine(lang)}</p>
            <ul className="mt-4 space-y-2.5">
              {bullets.map((line) => (
                <li key={line} className="flex gap-2 text-sm text-[#2C2416]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9B46A]" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-sm leading-relaxed text-[#5C5346]">{autosDealerInventoryDrawerUpgradeLine(lang)}</p>
            <p className="mt-2 text-sm font-semibold text-[#1E1810]">{autosDealerInventoryTotalWithBoostLine(lang)}</p>
            <p className="mt-3 text-xs text-[#7A7164]">{autosDealerInventoryDrawerPlanFootnote(lang)}</p>
            <p className="mt-3 text-xs font-medium text-[#6E5418]">{autosDealerInventoryDrawerPaymentNote(lang)}</p>
          </div>

          <div className="shrink-0 border-t border-[#E8DFD0] bg-[#FAF7F2] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
            <button
              type="button"
              onClick={handlePrimary}
              className="w-full rounded-2xl bg-[#2A2620] py-3.5 text-sm font-bold text-[#FAF7F2] shadow-md hover:bg-[#1E1810]"
            >
              {primaryLabel}
            </button>
            {atLimit ? (
              <button
                type="button"
                onClick={() => setBoostOpen(true)}
                className="mt-2 flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[#C9B46A]/50 bg-white text-sm font-bold text-[#6E5418]"
              >
                {autosDealerInventoryAddTenSlotsCta(lang)}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <AutosNegociosInventoryBoostPanel
        open={boostOpen}
        onClose={() => setBoostOpen(false)}
        lang={lang}
        flushDraft={flushDraft}
        editorContext={boostContext}
      />
    </>
  );
}
