"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import type { AutosPublicBlueprintCopy } from "../lib/autosPublicBlueprintCopy";

export function AutosLandingPublishCTA({
  copy,
  publishAutosHref,
  browseAllHref,
}: {
  copy: AutosPublicBlueprintCopy;
  publishAutosHref: string;
  browseAllHref: string;
}) {
  return (
    <section className="mx-auto max-w-[1280px] px-4 sm:px-5 md:px-6">
      <div className="rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]/95 p-6 shadow-[0_16px_48px_-20px_rgba(42,36,22,0.22)] backdrop-blur-sm sm:p-8 md:p-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-12">
          <div className="max-w-xl">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-[color:var(--lx-text)] sm:text-[1.65rem]">{copy.publishBandTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--lx-text-2)] sm:text-base">{copy.publishBandBody}</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:max-w-sm md:w-auto md:min-w-[280px]">
            <Link
              href={publishAutosHref}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(135deg,rgba(201,168,74,0.98),rgba(184,149,74,0.94))] px-6 text-sm font-bold text-[#FFFCF7] shadow-[0_10px_32px_-10px_rgba(120,90,30,0.5)] transition hover:brightness-[1.03] active:opacity-95"
            >
              {copy.publishNowCta}
              <FiArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href={browseAllHref}
              className="inline-flex min-h-[48px] items-center justify-center rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-6 text-sm font-bold text-[color:var(--lx-text)] transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]"
            >
              {copy.exploreAllAutosCta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
