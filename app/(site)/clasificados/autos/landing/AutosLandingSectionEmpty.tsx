"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import type { AutosPublicBlueprintCopy } from "../lib/autosPublicBlueprintCopy";

export function AutosLandingSectionEmpty({
  copy,
  browseAllHref,
}: {
  copy: AutosPublicBlueprintCopy;
  browseAllHref: string;
}) {
  return (
    <div className="mt-5 rounded-[16px] border border-dashed border-[color:var(--lx-gold-border)]/60 bg-[color:var(--lx-nav-hover)]/50 px-4 py-8 text-center sm:px-6">
      <p className="text-sm font-medium text-[color:var(--lx-text-2)]">{copy.landingEmptyBandTitle}</p>
      <Link
        href={browseAllHref}
        className="mt-4 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-card)] px-5 text-sm font-bold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
      >
        {copy.landingEmptyBandCta}
        <FiArrowRight className="h-4 w-4 text-[color:var(--lx-gold)]" aria-hidden />
      </Link>
    </div>
  );
}
