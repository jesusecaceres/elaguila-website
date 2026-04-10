"use client";

import Link from "next/link";
import { FiArrowRight, FiCheck } from "react-icons/fi";
import type { AutosPublicBlueprintCopy } from "../lib/autosPublicBlueprintCopy";
import { autosLandingSectionClass } from "./autosLandingLayout";

export function AutosLandingPublishCTA({
  copy,
  publishAutosHref,
  browseAllHref,
}: {
  copy: AutosPublicBlueprintCopy;
  publishAutosHref: string;
  browseAllHref: string;
}) {
  const bullets = [copy.publishTrust1, copy.publishTrust2, copy.publishTrust3];

  return (
    <section className={autosLandingSectionClass}>
      <div className="rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]/95 p-5 shadow-[0_16px_48px_-20px_rgba(42,36,22,0.22)] backdrop-blur-sm sm:p-7 md:p-9 lg:p-10 2xl:p-11">
        <div className="grid grid-cols-1 gap-7 sm:gap-8 lg:grid-cols-12 lg:gap-10 lg:items-start 2xl:gap-12">
          <div className="min-w-0 lg:col-span-7">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-[color:var(--lx-text)] sm:text-[1.65rem]">{copy.publishBandTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--lx-text-2)] sm:text-base">{copy.publishBandBody}</p>
            <ul className="mt-5 space-y-2.5 border-t border-[color:var(--lx-nav-border)] pt-5">
              {bullets.map((line) => (
                <li key={line} className="flex gap-2.5 text-sm leading-snug text-[color:var(--lx-text-2)]">
                  <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-3 lg:col-span-5 lg:pt-1">
            <Link
              href={publishAutosHref}
              className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(135deg,rgba(201,168,74,0.98),rgba(184,149,74,0.94))] px-6 text-sm font-bold text-[#FFFCF7] shadow-[0_10px_32px_-10px_rgba(120,90,30,0.5)] transition hover:brightness-[1.03] active:opacity-95"
            >
              {copy.publishNowCta}
              <FiArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href={browseAllHref}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-[14px] border-2 border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-6 text-sm font-bold text-[color:var(--lx-text)] transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]"
            >
              {copy.exploreAllAutosCta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
