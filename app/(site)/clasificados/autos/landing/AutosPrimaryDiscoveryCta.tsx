"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import type { AutosPublicBlueprintCopy } from "../lib/autosPublicBlueprintCopy";

export function AutosPrimaryDiscoveryCta({ copy, browseAllHref }: { copy: AutosPublicBlueprintCopy; browseAllHref: string }) {
  return (
    <section className="mx-auto max-w-[1280px] px-4 sm:px-5 md:px-6">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-2 text-center">
        <Link
          href={browseAllHref}
          className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[color:var(--lx-cta-dark)] px-8 py-3.5 text-sm font-bold text-[#FFFCF7] shadow-[0_12px_36px_-14px_rgba(26,22,18,0.55)] transition hover:bg-[color:var(--lx-cta-dark-hover)] active:opacity-95 sm:w-auto"
        >
          {copy.browseAllShort}
          <FiArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <p className="max-w-md text-xs text-[color:var(--lx-muted)]">{copy.primaryDiscoveryHint}</p>
      </div>
    </section>
  );
}
