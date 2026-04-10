"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { CategoryLandingChipsRail } from "@/app/(site)/clasificados/components/categoryLanding/CategoryLandingChipsRail";
import type { AutosPublicBlueprintCopy } from "../lib/autosPublicBlueprintCopy";
import { autosLandingSectionClass } from "./autosLandingLayout";

export function AutosQuickChips({
  copy,
  items,
}: {
  copy: AutosPublicBlueprintCopy;
  items: { href: string; label: string }[];
}) {
  return (
    <section className={`${autosLandingSectionClass} pt-1`}>
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">{copy.quickChipsLabel}</p>
      <p className="mx-auto mt-2 max-w-md text-center text-[11px] leading-snug text-[color:var(--lx-muted)] sm:text-xs">{copy.chipsShortcutHint}</p>
      <div className="relative mt-3 min-w-0">
        <CategoryLandingChipsRail label={copy.quickChipsLabel}>
          {items.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="inline-flex min-h-[44px] shrink-0 snap-start items-center gap-1.5 rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 pr-3 text-xs font-semibold text-[color:var(--lx-text)] shadow-sm ring-[color:var(--lx-focus-ring)] transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)] hover:ring-1 active:opacity-95 sm:shrink"
            >
              <span>{item.label}</span>
              <FiArrowRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
            </Link>
          ))}
        </CategoryLandingChipsRail>
      </div>
    </section>
  );
}
