"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { BrPropertyInventoryCountSnapshot } from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import {
  brPropertyInventoryAddPropertyCtaLabel,
  brPropertyInventoryAddPropertyToInventoryCtaLabel,
  brPropertyInventoryContactLeonixLine,
  brPropertyInventoryDrawerContinueCtaLabel,
  brPropertyInventoryUpgradeContactHref,
  brPropertyInventoryUpgradeCtaLabel,
  brPropertyInventoryValueDrawerCopy,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryCopy";
import {
  buildBrInventoryAddPublishHref,
  type BrInventoryAddContext,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryAddFlow";

type Lang = "es" | "en";

type Props = {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  addCtx: BrInventoryAddContext;
  counts: BrPropertyInventoryCountSnapshot;
};

export function BrPropertyInventoryValueDrawer({ open, onClose, lang, addCtx, counts }: Props) {
  const router = useRouter();
  const copy = brPropertyInventoryValueDrawerCopy(lang);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const needsUpgrade = counts.atBaseLimit && !counts.upgradeActive;
  const canContinue = counts.canAddProperty;
  const atTotalLimit = counts.atTotalLimit;

  const primaryLabel = atTotalLimit
    ? copy.contactLine
    : needsUpgrade
      ? brPropertyInventoryUpgradeCtaLabel(lang)
      : counts.upgradeActive
        ? brPropertyInventoryAddPropertyToInventoryCtaLabel(lang)
        : canContinue
          ? brPropertyInventoryDrawerContinueCtaLabel(lang)
          : brPropertyInventoryAddPropertyCtaLabel(lang);

  const handlePrimary = () => {
    if (atTotalLimit) {
      window.location.href = brPropertyInventoryUpgradeContactHref(lang);
      return;
    }
    if (needsUpgrade) {
      window.location.href = brPropertyInventoryUpgradeContactHref(lang);
      return;
    }
    if (canContinue) {
      onClose();
      router.push(buildBrInventoryAddPublishHref(addCtx, lang));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="br-inventory-value-drawer-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1E1810]/45 backdrop-blur-[2px]"
        aria-label={copy.close}
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-none flex-col bg-[#FAF7F2] shadow-2xl lg:ml-auto lg:h-full lg:w-[min(100%,480px)] lg:max-w-[480px]">
        <div className="flex shrink-0 items-center justify-between border-b border-[#E8DFD0] px-4 py-3 sm:px-5">
          <h2 id="br-inventory-value-drawer-title" className="font-serif text-lg font-semibold text-[#1E1810] sm:text-xl">
            {copy.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-[#5C5346] hover:bg-[#FDFBF7]"
          >
            {copy.close}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <ul className="space-y-3 text-sm leading-relaxed text-[#2C2416]">
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9B46A]" aria-hidden />
              <span>{copy.baseBullet}</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9B46A]" aria-hidden />
              <span>{copy.upgradeBullet}</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6E5418]" aria-hidden />
              <span>{copy.valueParagraph}</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9B46A]" aria-hidden />
              <span>{copy.catalogBullet}</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9B46A]" aria-hidden />
              <span>{copy.leonixBullet}</span>
            </li>
          </ul>
          <p className="mt-4 text-xs font-semibold text-[#6E5418]">{copy.contactLine}</p>
          <p className="mt-2 text-xs text-[#7A7164]">{copy.paymentNote}</p>
        </div>

        <div className="shrink-0 border-t border-[#E8DFD0] bg-[#FAF7F2] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
          <button
            type="button"
            onClick={handlePrimary}
            disabled={!canContinue && !needsUpgrade && !atTotalLimit}
            className="w-full rounded-2xl bg-[#2A2620] py-3.5 text-sm font-bold text-[#FAF7F2] shadow-md hover:bg-[#1E1810] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {primaryLabel}
          </button>
          {atTotalLimit ? (
            <p className="mt-2 text-center text-xs text-[#5C5346]">{brPropertyInventoryContactLeonixLine(lang)}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
