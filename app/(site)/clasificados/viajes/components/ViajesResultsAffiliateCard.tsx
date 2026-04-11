"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { ViajesUi } from "../data/viajesUiCopy";
import type { ViajesAffiliateResult } from "../data/viajesResultsSampleData";
import { VIAJES_LANDING_CTA_ORANGE } from "../lib/viajesLandingVisual";
import { withViajesOfferBackParam } from "../lib/viajesOfferLink";

export function ViajesResultsAffiliateCard({ row, ui }: { row: ViajesAffiliateResult; ui: ViajesUi }) {
  const sp = useSearchParams();
  const backHref = `/clasificados/viajes/resultados${sp?.toString() ? `?${sp.toString()}` : ""}`;
  const offerHref = row.href.includes("/oferta/") ? withViajesOfferBackParam(row.href, backHref) : row.href;

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-amber-200/80 bg-[color:var(--lx-card)] shadow-[0_10px_36px_-14px_rgba(42,36,22,0.18)]">
      <div className="relative aspect-[16/10] w-full min-w-0 overflow-hidden">
        <Image src={row.imageSrc} alt={row.imageAlt} fill className="object-cover object-center" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" />
        <div className="absolute left-0 right-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3">
          <span className="rounded-full bg-[#D97706] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            {row.inventoryLabel}
          </span>
          <span className="rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white/95 backdrop-blur-sm">{ui.cards.partnerInventory}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h2 className="line-clamp-2 text-base font-bold leading-snug text-[color:var(--lx-text)]">{row.title}</h2>
        <p className="mt-1 line-clamp-1 text-sm text-[color:var(--lx-text-2)]">{row.destination}</p>
        <p className="mt-3 text-lg font-bold text-[color:var(--lx-text)]">{row.priceFrom}</p>
        <div className="mt-2 space-y-1 text-xs text-[color:var(--lx-muted)]">
          <p>🗓️ {row.duration}</p>
          <p>✈️ {row.departureContext}</p>
          {row.affiliateNote ? <p className="rounded-lg border border-amber-200/70 bg-amber-50/90 py-1.5 pl-2 pr-2 text-[10px] font-medium leading-snug text-amber-950">{row.affiliateNote}</p> : null}
        </div>
        <div className="mt-auto pt-4">
          <Link
            href={offerHref}
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm transition hover:brightness-105"
            style={{ backgroundColor: VIAJES_LANDING_CTA_ORANGE }}
          >
            {ui.cards.affiliateCta}
          </Link>
        </div>
      </div>
    </article>
  );
}
