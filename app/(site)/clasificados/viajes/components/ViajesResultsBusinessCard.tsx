"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { ViajesUi } from "../data/viajesUiCopy";
import type { ViajesBusinessResult } from "../data/viajesResultsSampleData";
import { withViajesOfferBackParam } from "../lib/viajesOfferLink";

export function ViajesResultsBusinessCard({ row, ui }: { row: ViajesBusinessResult; ui: ViajesUi }) {
  const sp = useSearchParams();
  const backHref = `/clasificados/viajes/resultados${sp?.toString() ? `?${sp.toString()}` : ""}`;
  const offerHref = row.href.includes("/oferta/") ? withViajesOfferBackParam(row.href, backHref) : row.href;

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border-2 border-[color:var(--lx-gold-border)] bg-[color:var(--lx-card)] shadow-[0_12px_40px_-16px_rgba(42,36,22,0.2)]">
      <div className="relative aspect-[16/10] w-full min-w-0 overflow-hidden">
        <Image src={row.imageSrc} alt={row.imageAlt} fill className="object-cover object-center" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" />
        <span className="absolute left-3 top-3 rounded-full bg-[color:var(--lx-cta-dark)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#FFFCF7]">
          {ui.cards.businessListing}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{row.businessName}</p>
        <h2 className="mt-1 line-clamp-2 break-words text-base font-bold leading-snug text-[color:var(--lx-text)]">{row.offerTitle}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-[color:var(--lx-text-2)]">
          {row.destination} · {ui.results.departurePrefix} {row.departureCity}
        </p>
        <p className="mt-3 text-lg font-bold text-[color:var(--lx-text)]">{row.price}</p>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{row.includedSummary}</p>
        <p className="mt-2 text-xs text-[color:var(--lx-muted)]">🗓️ {row.duration}</p>
        {row.ctaHint ? <p className="mt-2 text-[11px] font-medium text-[color:var(--lx-text-2)]">{row.ctaHint}</p> : null}
        <div className="mt-auto flex flex-col gap-2 pt-4 sm:flex-row sm:flex-wrap">
          <Link
            href={offerHref}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-[color:var(--lx-cta-dark)] text-sm font-bold text-[#FFFCF7] shadow-md transition hover:bg-[color:var(--lx-cta-dark-hover)]"
          >
            {ui.cards.businessViewListing}
          </Link>
          {row.whatsapp ? (
            <a
              href={`https://wa.me/${row.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] text-sm font-bold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
            >
              WhatsApp
            </a>
          ) : null}
          <Link
            href={offerHref}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[color:var(--lx-cta-dark)] bg-transparent text-sm font-bold text-[color:var(--lx-cta-dark)] transition hover:bg-[color:var(--lx-nav-hover)]"
          >
            {ui.cards.businessMoreDetails}
          </Link>
        </div>
      </div>
    </article>
  );
}
