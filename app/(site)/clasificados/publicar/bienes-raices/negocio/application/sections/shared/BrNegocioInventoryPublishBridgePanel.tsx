"use client";

import Link from "next/link";
import { brNegocioInventoryPublishBridgeCopy } from "../../brNegocioInventoryPublishBridgeCopy";

type Props = {
  lang: "es" | "en";
  mode: "main" | "child" | "complete";
  remainingCount: number;
  mainListingHref: string;
  childListingHref?: string | null;
  onPublishNext?: () => void;
};

/** BR-INV-E-FAST — owner-only bridge after real publish (no fake URLs). */
export function BrNegocioInventoryPublishBridgePanel({
  lang,
  mode,
  remainingCount,
  mainListingHref,
  childListingHref,
  onPublishNext,
}: Props) {
  const copy = brNegocioInventoryPublishBridgeCopy(lang);

  return (
    <div className="rounded-xl border border-[#C9B46A]/45 bg-[#FFF6E7] px-4 py-4 text-sm text-[#2C2416] shadow-sm">
      {mode === "main" ? (
        <>
          <p className="font-bold text-[#6E5418]">{copy.mainPublishedTitle}</p>
          <p className="mt-1 text-[#5C5346]">{copy.mainPublishedBody}</p>
          <p className="mt-2 text-[#5C5346]">{copy.mainNextHint}</p>
          {remainingCount > 0 ? (
            <p className="mt-2 font-semibold text-[#1E1810]">{copy.remainingLabel(remainingCount)}</p>
          ) : null}
        </>
      ) : null}

      {mode === "child" ? (
        <>
          <p className="font-bold text-[#6E5418]">{copy.childPublishedTitle}</p>
          <p className="mt-1 text-[#5C5346]">{copy.childPublishedBody}</p>
          {remainingCount > 0 ? (
            <p className="mt-2 font-semibold text-[#1E1810]">{copy.remainingLabel(remainingCount)}</p>
          ) : (
            <p className="mt-2 text-[#5C5346]">{copy.queueComplete}</p>
          )}
        </>
      ) : null}

      {mode === "complete" ? <p className="font-semibold text-[#6E5418]">{copy.queueComplete}</p> : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {remainingCount > 0 && onPublishNext ? (
          <button
            type="button"
            onClick={onPublishNext}
            className="min-h-[48px] touch-manipulation rounded-xl bg-[#1E1810] px-4 py-2.5 text-sm font-bold text-[#F9F6F1] hover:bg-[#2C2416] sm:min-h-0"
          >
            {copy.publishNext}
          </button>
        ) : null}
        <Link
          href={mainListingHref}
          className="inline-flex min-h-[48px] touch-manipulation items-center justify-center rounded-xl border border-[#C9B46A]/55 bg-white px-4 py-2.5 text-sm font-semibold text-[#6E5418] hover:bg-[#FFFCF7] sm:min-h-0"
        >
          {copy.viewMainListing}
        </Link>
        {childListingHref ? (
          <Link
            href={childListingHref}
            className="inline-flex min-h-[48px] touch-manipulation items-center justify-center rounded-xl border border-[#E8DFD0] bg-white px-4 py-2.5 text-sm font-semibold text-[#2C2416] hover:bg-[#FFFCF7] sm:min-h-0"
          >
            {copy.viewChildListing}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
