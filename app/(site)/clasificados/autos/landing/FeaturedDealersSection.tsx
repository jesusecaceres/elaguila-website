"use client";

import Image from "next/image";
import Link from "next/link";
import { FaStar } from "react-icons/fa";
import type { AutosPublicBlueprintCopy } from "../lib/autosPublicBlueprintCopy";
import type { AutosLandingDealerSample } from "./autosLandingDealerSamples";

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
    <section className="mx-auto max-w-[1280px] px-4 sm:px-5 md:px-6">
      <div className="rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]/95 px-2 py-8 shadow-[inset_0_1px_0_rgba(255,252,247,0.65)] backdrop-blur-sm sm:px-4 sm:py-10">
        <h2 className="text-center font-serif text-xl font-semibold tracking-tight text-[color:var(--lx-text)] sm:text-2xl">
          {copy.featuredDealersTitle}
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {dealers.map((d) => (
            <div
              key={d.id}
              className="flex flex-col gap-3 rounded-[16px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_10px_32px_-14px_rgba(42,36,22,0.2)] sm:flex-row sm:items-center"
            >
              <div className="relative mx-auto h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] sm:mx-0">
                <Image src={d.logoUrl} alt="" fill className="object-cover" sizes="56px" />
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="truncate font-semibold text-[color:var(--lx-text)]">{d.name}</p>
                <p className="text-xs text-[color:var(--lx-muted)]">
                  {d.city}, {d.state}
                </p>
                <p className="mt-1 flex items-center justify-center gap-1 text-xs font-semibold text-[color:var(--lx-text-2)] sm:justify-start">
                  <FaStar className="h-3.5 w-3.5 text-[color:var(--lx-gold)]" aria-hidden />
                  {d.rating.toFixed(1)}
                </p>
              </div>
              <Link
                href={buildInventoryHref(d)}
                className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(201,168,74,0.98),rgba(184,149,74,0.94))] px-4 text-xs font-bold text-[#FFFCF7] shadow-sm transition hover:brightness-[1.03] active:opacity-95 sm:w-auto"
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
