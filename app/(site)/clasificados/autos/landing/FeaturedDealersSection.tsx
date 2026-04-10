"use client";

import Image from "next/image";
import Link from "next/link";
import { FaStar } from "react-icons/fa";
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
      <div className="rounded-[20px] border border-[color:var(--lx-nav-border)] bg-gradient-to-b from-[color:var(--lx-section)]/98 to-[color:var(--lx-card)]/95 px-3 py-8 shadow-[inset_0_1px_0_rgba(255,252,247,0.7),0_12px_40px_-18px_rgba(42,36,22,0.18)] backdrop-blur-sm sm:px-6 sm:py-10">
        <h2 className="text-center font-serif text-xl font-semibold tracking-tight text-[color:var(--lx-text)] sm:text-2xl">{copy.featuredDealersTitle}</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-[color:var(--lx-muted)]">{copy.featuredDealersSubtitle}</p>
        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 md:gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {dealers.map((d) => (
            <div
              key={d.id}
              className="flex min-w-0 flex-col gap-4 rounded-[16px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_10px_32px_-14px_rgba(42,36,22,0.18)] sm:flex-row sm:items-center sm:gap-4 sm:p-5"
            >
              <div className="relative mx-auto h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[color:var(--lx-gold-border)]/50 bg-[#FFFCF7] shadow-sm sm:mx-0">
                <Image src={d.logoUrl} alt="" fill className="object-cover" sizes="64px" />
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="truncate font-semibold text-[color:var(--lx-text)]">{d.name}</p>
                <p className="mt-1 flex items-center justify-center gap-1 text-xs text-[color:var(--lx-muted)] sm:justify-start">
                  <FiMapPin className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                  <span className="truncate">
                    {d.city}, {d.state}
                  </span>
                </p>
                <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-[color:var(--lx-text-2)] sm:justify-start">
                  <FaStar className="h-4 w-4 text-[color:var(--lx-gold)]" aria-hidden />
                  <span>{d.rating.toFixed(1)}</span>
                  <span className="font-normal text-[color:var(--lx-muted)]">·</span>
                  <span className="font-normal text-[color:var(--lx-muted)]">{copy.sellerDealerFooter}</span>
                </p>
              </div>
              <Link
                href={buildInventoryHref(d)}
                className="inline-flex min-h-[48px] w-full shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(201,168,74,0.98),rgba(184,149,74,0.94))] px-5 text-sm font-bold text-[#FFFCF7] shadow-[0_6px_20px_-8px_rgba(120,90,30,0.45)] transition hover:brightness-[1.04] active:opacity-95 sm:min-w-[9.5rem] sm:w-auto"
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
