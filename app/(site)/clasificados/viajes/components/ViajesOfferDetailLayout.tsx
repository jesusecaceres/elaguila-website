import Image from "next/image";
import Link from "next/link";

import type { ViajesOfferDetailModel } from "../data/viajesOfferDetailSampleData";

const ACCENT = "#D97706";

export function ViajesOfferDetailLayout({
  offer,
  backHref,
  backLabel = "Volver",
  preview = false,
}: {
  offer: ViajesOfferDetailModel;
  backHref: string;
  backLabel?: string;
  preview?: boolean;
}) {
  const { partner } = offer;

  return (
    <div className="min-h-screen bg-[color:var(--lx-page)] pb-20 text-[color:var(--lx-text)]">
      {preview ? (
        <div className="border-b border-amber-400/35 bg-amber-100/95 px-4 py-2.5 text-center text-sm font-semibold text-amber-950">
          Vista previa — así verán tu oferta en Clasificados (datos de borrador / ejemplo).
        </div>
      ) : null}
      <div className="relative min-h-[min(52vh,520px)] w-full overflow-hidden">
        <Image
          src={offer.heroImageSrc}
          alt={offer.heroImageAlt}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/20" aria-hidden />
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-24 sm:px-5 lg:px-6">
            <Link
              href={backHref}
              className="mb-4 inline-flex text-xs font-semibold text-white/90 underline-offset-4 hover:text-white hover:underline"
            >
              ← {backLabel}
            </Link>
            <div className="flex flex-wrap gap-2">
              {offer.tags.map((t) => (
                <span key={t} className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {t}
                </span>
              ))}
            </div>
            <h1 className="mt-3 max-w-4xl text-3xl font-bold leading-tight text-white drop-shadow-sm sm:text-4xl">{offer.title}</h1>
            <p className="mt-2 text-sm text-white/95 sm:text-base">{offer.destination}</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-white/90 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
              <span className="text-lg font-bold text-white">{offer.priceFrom}</span>
              <span>🗓️ {offer.duration}</span>
              <span>✈️ {offer.departureCity}</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={offer.mainCtaHref}
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-105"
                style={{ backgroundColor: ACCENT }}
              >
                {offer.mainCtaLabel}
              </a>
              <Link
                href="/clasificados/viajes"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/50 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Explorar Viajes
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-5 lg:space-y-12 lg:px-6 lg:py-12">
        <section className="rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-[color:var(--lx-text)]">Qué incluye</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {offer.includes.map((line) => (
              <li key={line} className="flex gap-3 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
                <span className="mt-0.5 shrink-0 text-[color:var(--lx-gold)]" aria-hidden>
                  ✓
                </span>
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]/90 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-[color:var(--lx-text)]">¿Para quién es?</h2>
          <ul className="mt-4 space-y-3">
            {offer.whoItsFor.map((p) => (
              <li key={p} className="text-sm leading-relaxed text-[color:var(--lx-text-2)]">
                · {p}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">
                {partner.isAffiliate ? "Socio comercial" : "Publicado por"}
              </p>
              <h2 className="mt-1 text-xl font-bold text-[color:var(--lx-text)]">{partner.name}</h2>
              {partner.isAffiliate ? (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--lx-text-2)]">
                  {partner.affiliateDisclosure ??
                    "Esta oferta proviene de un socio comercial; Leonix no procesa el pago final en este flujo."}
                </p>
              ) : (
                <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">
                  Negocio o agencia con anuncio en Leonix Clasificados — contacto directo.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <a
                href={partner.ctaHref}
                className="inline-flex min-h-[44px] min-w-[200px] items-center justify-center rounded-xl text-sm font-bold text-white shadow-md transition hover:brightness-105"
                style={{ backgroundColor: ACCENT }}
              >
                {partner.ctaLabel}
              </a>
              {partner.secondaryCtaLabel && partner.secondaryCtaHref ? (
                <Link
                  href={partner.secondaryCtaHref}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] px-4 text-sm font-bold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
                >
                  {partner.secondaryCtaLabel}
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-6 sm:p-8">
          <h2 className="text-lg font-bold text-[color:var(--lx-text)]">Detalles del viaje</h2>
          <p className="text-sm leading-relaxed text-[color:var(--lx-text-2)]">{offer.description}</p>
          {offer.dateRange ? (
            <p className="text-sm font-medium text-[color:var(--lx-text)]">
              <span className="text-[color:var(--lx-muted)]">Calendario: </span>
              {offer.dateRange}
            </p>
          ) : null}
          {offer.notes ? <p className="text-sm text-[color:var(--lx-muted)]">{offer.notes}</p> : null}
          {offer.trustNote ? (
            <div className="rounded-xl border border-dashed border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)]/80 p-4 text-sm text-[color:var(--lx-text-2)]">
              {offer.trustNote}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
