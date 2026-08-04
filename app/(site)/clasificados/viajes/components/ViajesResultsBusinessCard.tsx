"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { ViajesUi } from "../data/viajesUiCopy";
import type { ViajesBusinessResult } from "../data/viajesResultsSampleData";
import { withViajesOfferBackParam } from "../lib/viajesOfferLink";
import { normalizeViajesSanJoseCaliforniaLabel } from "../lib/viajesPublicLocation";

export function ViajesResultsBusinessCard({ row, ui }: { row: ViajesBusinessResult; ui: ViajesUi }) {
  const sp = useSearchParams();
  const backHref = `/clasificados/viajes/resultados${sp?.toString() ? `?${sp.toString()}` : ""}`;
  const offerHref = row.href.includes("/oferta/") ? withViajesOfferBackParam(row.href, backHref) : row.href;
  const pills = row.includedSummary
    .split("·")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 3);
  const departureCity = normalizeViajesSanJoseCaliforniaLabel(row.departureCity);
  const duration = normalizeViajesSanJoseCaliforniaLabel(row.duration);
  const sourceLabel =
    row.sellerLane === "private"
      ? ui.offerDetail.privatePostedBy
      : ui.lang === "en"
        ? "Local business"
        : "Negocio local";

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-sm">
      <div className="relative aspect-[4/3] w-full min-w-0 overflow-hidden">
        <Image src={row.imageSrc} alt={row.imageAlt} fill className="object-cover object-center" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" />
        <span className="absolute left-3 top-3 rounded-full bg-[color:var(--lx-cta-dark)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#FFFCF7]">
          {sourceLabel}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h2 className="line-clamp-2 text-base font-bold leading-snug text-[color:var(--lx-text)]">{row.offerTitle}</h2>
        <p className="mt-1 text-sm text-[color:var(--lx-text-2)]">{row.destination}</p>
        <p className="mt-1 text-xs text-[color:var(--lx-muted)]">
          {duration}
          {departureCity &&
          departureCity !== "—" &&
          !duration.toLowerCase().includes(departureCity.toLowerCase()) &&
          !/salida\s+san\s*jos/i.test(duration)
            ? ` · ${ui.results.departurePrefix} ${departureCity}`
            : ""}
        </p>
        <p className="mt-2 text-base font-bold text-[color:var(--lx-text)]">{row.price}</p>
        {pills.length ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {pills.map((pill) => (
              <li
                key={pill}
                className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]/60 px-2 py-0.5 text-[11px] font-medium text-[color:var(--lx-text-2)]"
              >
                {pill}
              </li>
            ))}
          </ul>
        ) : null}
        {row.businessName && row.businessName !== "—" ? (
          <p className="mt-2 text-xs font-semibold text-[color:var(--lx-muted)]">{row.businessName}</p>
        ) : null}
        <div className="mt-auto pt-3">
          <Link
            href={offerHref}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[color:var(--lx-cta-dark)] px-3 text-sm font-bold text-[#FFFCF7] transition hover:bg-[color:var(--lx-cta-dark-hover)]"
          >
            {ui.lang === "en" ? "View offer" : "Ver oferta"}
          </Link>
        </div>
      </div>
    </article>
  );
}
