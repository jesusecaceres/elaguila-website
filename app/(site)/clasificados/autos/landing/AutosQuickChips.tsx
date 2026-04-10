"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import type { AutosPublicBlueprintCopy } from "../lib/autosPublicBlueprintCopy";

export function AutosQuickChips({
  copy,
  items,
}: {
  copy: AutosPublicBlueprintCopy;
  items: { href: string; label: string }[];
}) {
  return (
    <section className="mx-auto w-full max-w-[1280px] min-w-0 px-4 sm:px-5 md:px-6">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">{copy.quickChipsLabel}</p>
      <p className="mx-auto mt-2 max-w-md text-center text-[11px] leading-snug text-[color:var(--lx-muted)] sm:text-xs">{copy.chipsShortcutHint}</p>
      <div className="relative mt-3 min-w-0">
        <div className="-mx-4 flex min-w-0 gap-2 overflow-x-auto overflow-y-visible scroll-pl-4 scroll-pr-4 px-4 pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
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
        </div>
      </div>
    </section>
  );
}
