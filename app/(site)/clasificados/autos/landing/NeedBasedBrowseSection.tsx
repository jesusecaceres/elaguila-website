"use client";

import Link from "next/link";
import type { AutosPublicBlueprintCopy } from "../lib/autosPublicBlueprintCopy";
import { FiArrowUpRight } from "react-icons/fi";

export function NeedBasedBrowseSection({
  copy,
  cards,
}: {
  copy: AutosPublicBlueprintCopy;
  cards: { href: string; title: string; hint: string }[];
}) {
  return (
    <section className="mx-auto max-w-[1280px] px-4 sm:px-5 md:px-6">
      <h2 className="border-l-[3px] border-[color:var(--lx-gold)] pl-3 font-serif text-xl font-semibold tracking-tight text-[color:var(--lx-text)] sm:text-2xl">
        {copy.browseNeedTitle}
      </h2>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="group flex min-h-[100px] flex-col justify-between rounded-[16px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_28px_-14px_rgba(42,36,22,0.16)] transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-section)] sm:p-5"
          >
            <div>
              <p className="font-serif text-lg font-semibold text-[color:var(--lx-text)]">{c.title}</p>
              <p className="mt-1 text-sm leading-snug text-[color:var(--lx-muted)]">{c.hint}</p>
            </div>
            <div className="mt-3 flex items-center justify-end gap-1 text-xs font-bold uppercase tracking-wide text-[color:var(--lx-gold)]">
              <span>{copy.browseAllShort}</span>
              <FiArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
