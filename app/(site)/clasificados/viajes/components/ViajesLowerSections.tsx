import Image from "next/image";
import Link from "next/link";

import { selectViajesEditorialFeed, selectViajesPartnerSpotlight, selectViajesSeasonalCampaigns } from "../data/viajesHomeFeedSelectors";
import { withViajesOfferBackParam } from "../lib/viajesOfferLink";
import { ViajesSectionHeader } from "./ViajesSectionHeader";

type ViajesLowerSectionsProps = {
  /** Canonical return path when opening offers from seasonal rail (usually Viajes home + lang). */
  homeBackHref: string;
};

export function ViajesLowerSections({ homeBackHref }: ViajesLowerSectionsProps) {
  const partners = selectViajesPartnerSpotlight();
  const editorial = selectViajesEditorialFeed();
  const seasonal = selectViajesSeasonalCampaigns();

  return (
    <div className="mt-12 space-y-10 sm:mt-14 sm:space-y-12 md:mt-16">
      <section className="rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-6 shadow-sm sm:p-8">
        <ViajesSectionHeader
          title="Agencias y socios destacados"
          subtitle="Negocios y operadores con perfil en Leonix — contacto directo y especialidades visibles."
          className="mb-6"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((p) => (
            <Link
              key={p.slug}
              href={p.profileHref}
              className="group flex flex-col rounded-2xl border border-[color:var(--lx-gold-border)]/50 bg-[color:var(--lx-section)]/60 p-4 transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-section)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--lx-muted)]">Negocio publicado</p>
                  <h3 className="mt-1 text-lg font-bold text-[color:var(--lx-text)] group-hover:underline">{p.businessName}</h3>
                </div>
                {p.verifiedPlaceholder ? (
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900">Verificado</span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">{p.tagline}</p>
              <p className="mt-3 text-xs text-[color:var(--lx-muted)]">{p.destinationsLine}</p>
              <span className="mt-4 text-sm font-bold text-[#D97706]">Ver perfil →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-6 shadow-sm sm:p-8">
        <ViajesSectionHeader
          title="Guías e ideas para tu próximo viaje"
          subtitle="Contenido editorial Leonix — enlaces de inspiración hasta que existan rutas de lectura dedicadas."
          className="mb-6"
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {editorial.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className="group overflow-hidden rounded-2xl border border-dashed border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)]/50 transition hover:bg-[color:var(--lx-section)]"
            >
              <div className="relative aspect-[16/10] w-full">
                <Image src={card.imageSrc} alt={card.imageAlt} fill className="object-cover transition duration-300 group-hover:scale-[1.02]" sizes="(max-width:768px) 100vw, 33vw" />
                <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Editorial</span>
              </div>
              <div className="p-4">
                <h3 className="text-base font-bold text-[color:var(--lx-text)] group-hover:underline">{card.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-[color:var(--lx-text-2)]">{card.dek}</p>
                <p className="mt-2 text-xs font-semibold text-[color:var(--lx-muted)]">{card.readTime} de lectura</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <ViajesSectionHeader
          title="Ofertas de temporada"
          subtitle="Campañas agrupadas — mezcla de inventario de socios y anuncios de negocios locales."
          className="mb-2"
        />
        {seasonal.map((camp) => (
          <div
            key={camp.id}
            className="rounded-2xl border border-[color:var(--lx-nav-border)] bg-gradient-to-br from-[color:var(--lx-card)] to-[color:var(--lx-section)]/80 p-5 sm:p-6"
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold text-[color:var(--lx-text)]">{camp.headline}</h3>
              <p className="mt-1 text-sm text-[color:var(--lx-text-2)]">{camp.subline}</p>
            </div>
            <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {camp.offers.map((o) => (
                <li key={o.id}>
                  <Link
                    href={o.href.includes("/oferta/") ? withViajesOfferBackParam(o.href, homeBackHref) : o.href}
                    className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                      o.source === "affiliate"
                        ? "border-amber-300/80 bg-amber-50/90 text-amber-950 hover:bg-amber-100"
                        : "border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)]"
                    }`}
                  >
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        o.source === "affiliate" ? "bg-amber-200/90 text-amber-950" : "bg-[color:var(--lx-section)] text-[color:var(--lx-text-2)]"
                      }`}
                    >
                      {o.source === "affiliate" ? "Socio" : "Negocio"}
                    </span>
                    <span>{o.title}</span>
                    <span className="text-[10px] text-[color:var(--lx-muted)]">({o.tag})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
