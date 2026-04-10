import Image from "next/image";
import Link from "next/link";

import type { ViajesUi } from "../data/viajesUiCopy";
import { selectViajesEditorialFeed, selectViajesPartnerSpotlight, selectViajesSeasonalCampaigns } from "../data/viajesHomeFeedSelectors";
import { setLangOnHref } from "../lib/viajesLangHref";
import { withViajesOfferBackParam } from "../lib/viajesOfferLink";
import { ViajesSectionHeader } from "./ViajesSectionHeader";

type ViajesLowerSectionsProps = {
  /** Canonical return path when opening offers from seasonal rail (usually Viajes home + lang). */
  homeBackHref: string;
  ui: ViajesUi;
};

export function ViajesLowerSections({ homeBackHref, ui }: ViajesLowerSectionsProps) {
  const partners = selectViajesPartnerSpotlight();
  const editorial = selectViajesEditorialFeed();
  const seasonal = selectViajesSeasonalCampaigns();
  const L = ui.lower;

  return (
    <>
      <section className="mt-12 sm:mt-14 md:mt-16">
        <div className="rounded-2xl border border-[color:var(--lx-gold-border)] bg-[#fffdf9]/98 p-5 shadow-[0_14px_44px_-24px_rgba(30,50,70,0.12)] sm:p-7">
          <ViajesSectionHeader
            title={L.partnersTitle}
            subtitle={L.partnersSubtitle}
            showRail
            eyebrow={ui.landing.tier2Eyebrow}
            headingScale="secondary"
            className="mb-6 sm:mb-7"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {partners.map((p) => (
              <Link
                key={p.slug}
                href={setLangOnHref(p.profileHref, ui.lang)}
                className="group flex flex-col rounded-2xl border border-[color:var(--lx-gold-border)]/60 bg-[color:var(--lx-section)]/50 p-4 transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-section)]"
              >
                <span className="w-fit rounded-full bg-[color:var(--lx-section)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-text-2)]">
                  {ui.cards.businessListing}
                </span>
                <div className="mt-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--lx-muted)]">{L.businessPublished}</p>
                    <h3 className="mt-1 text-lg font-bold leading-snug text-[color:var(--lx-text)] group-hover:underline">{p.businessName}</h3>
                  </div>
                  {p.verifiedPlaceholder ? (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900">{L.verified}</span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-snug text-[color:var(--lx-text-2)]">{p.tagline}</p>
                <p className="mt-2 text-xs text-[color:var(--lx-muted)]">{p.destinationsLine}</p>
                <span className="mt-4 text-sm font-bold text-[color:var(--lx-cta-dark)]">{L.viewProfile}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-12 space-y-10 sm:mt-14 sm:space-y-11 md:mt-16">
        <div className="rounded-2xl border border-dashed border-[color:var(--lx-gold-border)]/70 bg-gradient-to-br from-[#fffdfb] to-[#f6f8fa]/90 p-5 sm:p-6">
          <ViajesSectionHeader
            title={L.editorialTitle}
            subtitle={L.editorialSubtitle}
            showRail
            eyebrow={ui.landing.tier3Eyebrow}
            headingScale="tertiary"
            className="mb-5 sm:mb-6"
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
            {editorial.map((card) => (
              <Link
                key={card.id}
                href={setLangOnHref(card.href, ui.lang)}
                className="group overflow-hidden rounded-2xl border border-dashed border-[color:var(--lx-gold-border)] bg-white/70 transition hover:bg-[color:var(--lx-section)]/80"
              >
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src={card.imageSrc}
                    alt={card.imageAlt}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width:768px) 100vw, 33vw"
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">{L.editorialPill}</span>
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="text-base font-bold leading-snug text-[color:var(--lx-text)] group-hover:underline">{card.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-[color:var(--lx-text-2)]">{card.dek}</p>
                  <p className="mt-2 text-xs font-semibold text-[color:var(--lx-muted)]">{L.readTime(card.readTime)}</p>
                  <p className="mt-3 text-xs font-bold text-sky-900/85">{ui.cards.explore} →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <section>
          <ViajesSectionHeader
            title={L.seasonalTitle}
            subtitle={L.seasonalSubtitle}
            showRail
            headingScale="tertiary"
            className="mb-5 sm:mb-6"
          />
          <ul className="space-y-4">
            {seasonal.map((camp) => (
              <li
                key={camp.id}
                className="rounded-2xl border border-[color:var(--lx-nav-border)] bg-[#fffefb]/95 p-4 shadow-[0_8px_28px_-18px_rgba(30,50,70,0.08)] sm:p-5"
              >
                <div className="mb-3">
                  <h3 className="text-base font-bold text-[color:var(--lx-text)] sm:text-lg">{camp.headline}</h3>
                  <p className="mt-1 text-sm text-[color:var(--lx-text-2)]">{camp.subline}</p>
                </div>
                <ul className="flex flex-col gap-2">
                  {camp.offers.map((o) => {
                    const isAffiliate = o.source === "affiliate";
                    const href = setLangOnHref(
                      o.href.includes("/oferta/") ? withViajesOfferBackParam(o.href, homeBackHref) : o.href,
                      ui.lang
                    );
                    const ctaHint = isAffiliate ? ui.cards.affiliateCta : ui.cards.businessMoreDetails;
                    return (
                      <li key={o.id}>
                        <Link
                          href={href}
                          className={`flex min-h-[48px] flex-col gap-1.5 rounded-xl border px-3 py-2.5 text-left transition sm:min-h-0 sm:flex-row sm:items-center sm:gap-3 sm:px-4 ${
                            isAffiliate
                              ? "border-amber-300/80 bg-amber-50/90 text-amber-950 hover:bg-amber-100"
                              : "border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)]"
                          }`}
                        >
                          <span
                            className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              isAffiliate ? "bg-amber-200/90 text-amber-950" : "bg-[color:var(--lx-section)] text-[color:var(--lx-text-2)]"
                            }`}
                          >
                            {isAffiliate ? L.sourcePartner : L.sourceBusiness}
                          </span>
                          <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">
                            {o.title}{" "}
                            <span className="font-normal text-[color:var(--lx-muted)]">({o.tag})</span>
                          </span>
                          <span className="text-[11px] font-bold text-sky-900/90 sm:shrink-0">{ctaHint} →</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
