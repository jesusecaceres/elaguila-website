import Image from "next/image";
import Link from "next/link";

import type { ViajesBusinessResult } from "../data/viajesResultsSampleData";

const VIAJES_ACCENT = "#D97706";

export function ViajesResultsBusinessCard({ row }: { row: ViajesBusinessResult }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border-2 border-[color:var(--lx-gold-border)] bg-[color:var(--lx-card)] shadow-[0_10px_36px_-14px_rgba(42,36,22,0.18)]">
      <div className="relative aspect-[16/10] w-full">
        <Image src={row.imageSrc} alt={row.imageAlt} fill className="object-cover" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" />
        <span className="absolute left-3 top-3 rounded-full bg-[color:var(--lx-cta-dark)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#FFFCF7]">
          Anuncio de negocio
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{row.businessName}</p>
        <h2 className="mt-1 text-base font-bold leading-snug text-[color:var(--lx-text)]">{row.offerTitle}</h2>
        <p className="mt-1 text-sm text-[color:var(--lx-text-2)]">
          {row.destination} · salida {row.departureCity}
        </p>
        <p className="mt-3 text-lg font-bold text-[color:var(--lx-text)]">{row.price}</p>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{row.includedSummary}</p>
        <p className="mt-2 text-xs text-[color:var(--lx-muted)]">🗓️ {row.duration}</p>
        <div className="mt-auto flex flex-col gap-2 pt-4 sm:flex-row sm:flex-wrap">
          <Link
            href={row.href}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm transition hover:brightness-105"
            style={{ backgroundColor: VIAJES_ACCENT }}
          >
            Ver oferta
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
            href={row.href}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[color:var(--lx-cta-dark)] bg-transparent text-sm font-bold text-[color:var(--lx-cta-dark)] transition hover:bg-[color:var(--lx-nav-hover)]"
          >
            Contactar
          </Link>
        </div>
      </div>
    </article>
  );
}
