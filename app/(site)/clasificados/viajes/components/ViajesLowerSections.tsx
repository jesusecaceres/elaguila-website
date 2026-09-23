import Link from "next/link";

import type { ViajesUi } from "../data/viajesUiCopy";
import type { ViajesBusinessResult } from "../data/viajesResultsSampleData";
import { VIAJES_EDITORIAL_CARDS } from "../data/viajesEditorialSampleData";
import { selectViajesLivePartnerSpotlight } from "../lib/viajesPublicInventory";
import { setLangOnHref } from "../lib/viajesLangHref";
import { ViajesSafeImage } from "./ViajesSafeImage";
import { ViajesSectionHeader } from "./ViajesSectionHeader";

type ViajesLowerSectionsProps = {
  /** Canonical return path when opening offers from seasonal rail (usually Viajes home + lang). */
  homeBackHref: string;
  ui: ViajesUi;
  initialBusinessRows?: ViajesBusinessResult[];
};

export function ViajesLowerSections({ ui, initialBusinessRows = [] }: ViajesLowerSectionsProps) {
  const partners = selectViajesLivePartnerSpotlight(initialBusinessRows);
  const editorial = VIAJES_EDITORIAL_CARDS;
  const L = ui.lower;

  return (
    <>
      {partners.length ? (
        <section className="mt-12 sm:mt-14 md:mt-16">
          <div className="overflow-hidden rounded-2xl border border-[color:var(--lx-gold-border)] bg-gradient-to-br from-[#fffdf9] via-[#faf6ef] to-[#f2f4f7]/90 p-5 shadow-[0_16px_48px_-28px_rgba(30,50,75,0.14)] sm:p-7">
            <ViajesSectionHeader
              title={L.partnersTitle}
              subtitle={L.partnersSubtitle}
              showRail
              eyebrow={ui.landing.tier2Eyebrow}
              headingScale="secondary"
              className="mb-2 sm:mb-3"
            />
            <p className="mb-6 max-w-3xl text-[13px] leading-relaxed text-[color:var(--lx-text-2)] sm:mb-7 sm:text-sm">
              {ui.landing.advertiserPresenceLine}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {partners.map((p) => (
                <Link
                  key={p.slug}
                  href={setLangOnHref(p.profileHref, ui.lang)}
                  className="group flex min-h-[200px] min-w-0 flex-col rounded-2xl border border-[color:var(--lx-gold-border)]/70 bg-white/90 p-4 shadow-[inset_0_1px_0_rgba(255,252,247,0.9)] transition hover:border-[color:var(--lx-gold)]/50 hover:shadow-[0_14px_40px_-22px_rgba(30,40,55,0.14)]"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-[color:var(--lx-nav-border)]/50 pb-3">
                    <span className="rounded-md bg-[color:var(--lx-cta-dark)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#FFFCF7]">
                      {ui.cards.businessListing}
                    </span>
                  </div>
                  <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--lx-muted)]">{L.businessPublished}</p>
                  <h3 className="mt-1 text-lg font-bold leading-snug text-[color:var(--lx-text)] group-hover:underline">{p.businessName}</h3>
                  <p className="mt-2 flex-1 text-sm leading-snug text-[color:var(--lx-text-2)]">{p.tagline}</p>
                  <p className="mt-2 text-xs text-[color:var(--lx-muted)]">{p.destinationsLine}</p>
                  <span className="mt-4 text-sm font-bold text-[color:var(--lx-cta-dark)]">{L.viewProfile}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="mt-10 rounded-2xl border border-dashed border-[color:var(--lx-gold-border)]/65 bg-gradient-to-b from-[#fffdfb] to-[#f5f7fa]/85 p-5 sm:mt-12 sm:p-6">
        <ViajesSectionHeader
          title={L.editorialTitle}
          subtitle={L.editorialSubtitle}
          showRail
          eyebrow={ui.landing.tier3Eyebrow}
          headingScale="tertiary"
          className="mb-5 sm:mb-6"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {editorial.map((card) => (
            <Link
              key={card.id}
              href={setLangOnHref(card.href, ui.lang)}
              className="group min-w-0 overflow-hidden rounded-2xl border border-dashed border-[color:var(--lx-gold-border)]/80 bg-white/75 transition hover:bg-[color:var(--lx-section)]/85"
            >
              <div className="relative aspect-[16/10] w-full min-w-0 overflow-hidden">
                <ViajesSafeImage
                  src={card.imageSrc}
                  alt={card.imageAlt}
                  className="absolute inset-0 h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.02]"
                  sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                  mode="editorial"
                />
                <span className="absolute left-2 top-2 rounded-md bg-black/55 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                  {L.editorialPill}
                </span>
              </div>
              <div className="p-3 sm:p-4">
                <h3 className="text-base font-bold leading-snug text-[color:var(--lx-text)] group-hover:underline">{card.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-[color:var(--lx-text-2)]">{card.dek}</p>
                <p className="mt-2 text-xs font-semibold text-[color:var(--lx-muted)]">{L.readTime(card.readTime)}</p>
                <p className="mt-2 text-xs font-bold text-sky-900/85">{ui.cards.explore} →</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
