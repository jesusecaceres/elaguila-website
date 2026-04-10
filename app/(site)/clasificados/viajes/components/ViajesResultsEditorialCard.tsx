"use client";

import Image from "next/image";
import Link from "next/link";

import type { ViajesUi } from "../data/viajesUiCopy";
import type { ViajesEditorialResult } from "../data/viajesResultsSampleData";
import { setLangOnHref } from "../lib/viajesLangHref";

export function ViajesResultsEditorialCard({ row, ui }: { row: ViajesEditorialResult; ui: ViajesUi }) {
  const href = setLangOnHref(row.href, ui.lang);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-dashed border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)]/90 shadow-[0_10px_32px_-18px_rgba(30,40,55,0.12)]">
      <div className="relative aspect-[16/10] w-full min-w-0 overflow-hidden">
        <Image src={row.imageSrc} alt={row.imageAlt} fill className="object-cover object-center" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" />
        <div className="absolute left-2 top-2 rounded-md bg-[#2A2620]/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#FAF7F2]">{ui.cards.sourceIdeas}</div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--lx-muted)]">{row.destinationLabel}</p>
        <h2 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-[color:var(--lx-text)]">{row.title}</h2>
        <p className="mt-1 line-clamp-3 text-sm text-[color:var(--lx-text-2)]">{row.dek}</p>
        <div className="mt-auto pt-4">
          <Link
            href={href}
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-dashed border-[color:var(--lx-gold)] bg-white/90 px-4 text-sm font-bold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-card)]"
          >
            {ui.cards.explore}
          </Link>
        </div>
      </div>
    </article>
  );
}
