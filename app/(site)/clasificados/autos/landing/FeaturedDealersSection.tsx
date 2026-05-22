"use client";

import Image from "next/image";
import Link from "next/link";
import { FiMapPin } from "react-icons/fi";
import type { AutosPublicBlueprintCopy } from "../lib/autosPublicBlueprintCopy";
import type { AutosLandingDealerSample } from "./autosLandingDealerSamples";
import { autosLandingSectionClass } from "./autosLandingLayout";

export function FeaturedDealersSection({
  copy,
  dealers,
  buildInventoryHref,
}: {
  copy: AutosPublicBlueprintCopy;
  dealers: AutosLandingDealerSample[];
  buildInventoryHref: (dealer: AutosLandingDealerSample) => string;
}) {
  return (
    <section className={autosLandingSectionClass}>
      <div className="rounded-[22px] border border-[color:var(--lx-gold-border)]/40 bg-[linear-gradient(180deg,rgba(255,250,240,0.95)_0%,rgba(255,252,247,0.98)_55%,rgba(255,252,247,1)_100%)] px-4 py-8 shadow-[0_16px_48px_-20px_rgba(212,165,116,0.22)] sm:px-6 sm:py-10">
        <h2 className="text-center font-serif text-xl font-semibold tracking-tight text-[color:var(--lx-text)] sm:text-2xl">
          {copy.featuredDealersTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-[color:var(--lx-muted)]">
          {copy.featuredDealersSubtitle}
        </p>
        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
          {dealers.map((d) => (
            <div
              key={d.id}
              className="flex min-w-0 flex-col gap-4 rounded-[18px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_12px_36px_-14px_rgba(42,36,22,0.2)] sm:p-5"
            >
              <div className="flex items-center gap-4">
                <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-[14px] border-2 border-[color:var(--lx-gold-border)]/55 bg-[#FFFCF7] shadow-sm">
                  <Image src={d.logoUrl} alt="" fill className="object-cover" sizes="72px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[color:var(--lx-text)]">{d.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-[color:var(--lx-muted)]">
                    <FiMapPin className="h-3.5 w-3.5 shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
                    <span className="truncate">
                      {d.city}, {d.state}
                    </span>
                  </p>
                  <span className="mt-2 inline-flex rounded-full border border-[color:var(--lx-gold-border)]/60 bg-[color:var(--lx-nav-hover)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-text-2)]">
                    {copy.featuredDealersOnLeonix}
                  </span>
                </div>
              </div>
              <Link
                href={buildInventoryHref(d)}
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-[12px] bg-[linear-gradient(135deg,rgba(201,168,74,0.98),rgba(184,149,74,0.94))] px-5 text-sm font-bold text-[#FFFCF7] shadow-[0_8px_24px_-8px_rgba(120,90,30,0.45)] transition hover:brightness-[1.04] active:opacity-95"
              >
                {copy.dealerInventoryCta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
