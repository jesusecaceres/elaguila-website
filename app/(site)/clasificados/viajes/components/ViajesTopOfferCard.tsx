import Image from "next/image";
import Link from "next/link";

import type { ViajesTopOffer } from "../data/viajesLandingSampleData";

const VIAJES_ACCENT = "#D97706";

function StarRow({ count }: { count: number }) {
  const full = Math.min(5, Math.max(0, Math.round(count)));
  return (
    <span className="text-amber-500" aria-label={`${full} de 5 estrellas`}>
      {"★".repeat(full)}
      <span className="text-[color:var(--lx-muted)]/40">{"☆".repeat(5 - full)}</span>
    </span>
  );
}

export function ViajesTopOfferCard({ offer }: { offer: ViajesTopOffer }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-[0_12px_40px_-16px_rgba(42,36,22,0.2)] transition hover:shadow-[0_20px_48px_-14px_rgba(42,36,22,0.22)]">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={offer.imageSrc}
          alt={offer.imageAlt}
          fill
          sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-text)] shadow-sm backdrop-blur-sm">
          {offer.badge}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-lg font-bold text-[color:var(--lx-text)]">{offer.title}</h3>
        <p className="mt-1 text-sm text-[color:var(--lx-text-2)]">{offer.supportingLine}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[color:var(--lx-muted)]">
          <StarRow count={offer.stars} />
          <span className="hidden sm:inline">·</span>
          <span>{offer.locationLine}</span>
        </div>
        <p className="mt-3 text-lg font-bold text-[color:var(--lx-text)]">{offer.priceFrom}</p>
        <div className="mt-2 flex flex-col gap-1 text-xs text-[color:var(--lx-muted)]">
          <span className="flex items-center gap-1.5">
            <span aria-hidden>🗓️</span>
            {offer.duration}
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden>✈️</span>
            {offer.departureContext}
          </span>
          {offer.partnerLabel ? (
            <span className="mt-1 rounded-lg bg-[rgba(212,188,106,0.15)] px-2 py-1 text-[11px] font-medium text-[color:var(--lx-text-2)]">
              {offer.partnerLabel}
            </span>
          ) : null}
        </div>
        <div className="mt-auto flex justify-end pt-4">
          <Link
            href={offer.href}
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-105"
            style={{ backgroundColor: VIAJES_ACCENT }}
          >
            Ver oferta
          </Link>
        </div>
      </div>
    </article>
  );
}
