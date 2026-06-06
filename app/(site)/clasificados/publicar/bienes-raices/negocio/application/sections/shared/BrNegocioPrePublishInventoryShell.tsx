"use client";

import { useState } from "react";
import type { BrNegocioPrePublishInventoryLang } from "../../brNegocioPrePublishInventoryShellCopy";
import { brNegocioPrePublishInventoryShellCopy } from "../../brNegocioPrePublishInventoryShellCopy";
import { BrNegocioPrePublishInventoryDrawerShell } from "./BrNegocioPrePublishInventoryDrawerShell";

type Props = {
  lang?: BrNegocioPrePublishInventoryLang;
  /** Hide when already in post-publish inventory add mode (BR13B). */
  hidden?: boolean;
};

/** BR-INV-B — CTA + count shell + drawer open/close only. Count stays 0 until BR-INV-C. */
export function BrNegocioPrePublishInventoryShell({ lang = "es", hidden = false }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const copy = brNegocioPrePublishInventoryShellCopy(lang);
  const additionalCount = 0;

  if (hidden) return null;

  return (
    <>
      <div className="mt-5 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-4 py-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[#6E5418]">{copy.sectionKicker}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-[#5C5346]/90">{copy.hint}</p>
        <p className="mt-2 text-sm font-semibold tabular-nums text-[#1E1810]">{copy.countLabel(additionalCount)}</p>
        <p className="mt-1 text-xs text-[#7A7164]">{copy.ownerOnlyNote}</p>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="mt-4 min-h-[48px] w-full touch-manipulation rounded-xl border border-[#C9B46A]/60 bg-[#FFF6E7] px-4 py-3 text-sm font-bold text-[#6E5418] hover:bg-[#FFEFD8] sm:min-h-0 sm:w-auto sm:px-5 sm:py-2.5"
        >
          {copy.cta}
        </button>
      </div>
      <BrNegocioPrePublishInventoryDrawerShell open={drawerOpen} onClose={() => setDrawerOpen(false)} lang={lang} />
    </>
  );
}
