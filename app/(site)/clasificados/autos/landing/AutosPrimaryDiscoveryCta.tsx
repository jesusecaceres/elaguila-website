"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import type { AutosPublicBlueprintCopy } from "../lib/autosPublicBlueprintCopy";
import { autosLandingSectionClass } from "./autosLandingLayout";

export function AutosPrimaryDiscoveryCta({ copy, browseAllHref }: { copy: AutosPublicBlueprintCopy; browseAllHref: string }) {
  return (
    <section className={autosLandingSectionClass}>
      <div className="rounded-[18px] border border-[color:var(--lx-gold-border)]/50 bg-[color:var(--lx-nav-hover)]/80 px-4 py-6 text-center shadow-[0_12px_40px_-18px_rgba(42,36,22,0.14)] sm:px-8 sm:py-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">{copy.primaryDiscoveryHint}</p>
        <Link
          href={browseAllHref}
          className="mx-auto mt-4 inline-flex min-h-[52px] w-full max-w-md items-center justify-center gap-2 rounded-full bg-[color:var(--lx-cta-dark)] px-8 py-3.5 text-sm font-bold text-[#FFFCF7] shadow-[0_12px_36px_-14px_rgba(26,22,18,0.55)] transition hover:bg-[color:var(--lx-cta-dark-hover)] active:opacity-95 sm:w-auto"
        >
          {copy.browseAllShort}
          <FiArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
