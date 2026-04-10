"use client";

import Link from "next/link";
import type { AutosPublicBlueprintCopy } from "../lib/autosPublicBlueprintCopy";

export function AutosQuickChips({
  copy,
  items,
}: {
  copy: AutosPublicBlueprintCopy;
  items: { href: string; label: string }[];
}) {
  return (
    <section className="mx-auto max-w-[1280px] px-4 sm:px-5 md:px-6">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">{copy.quickChipsLabel}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {items.map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            className="inline-flex min-h-[40px] items-center rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 text-xs font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)] active:opacity-95"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
