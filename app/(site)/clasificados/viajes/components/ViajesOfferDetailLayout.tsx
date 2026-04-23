import Link from "next/link";

import type { ViajesOfferDetailModel } from "../data/viajesOfferDetailSampleData";
import type { ViajesUi } from "../data/viajesUiCopy";
import { getViajesOpenCardLane } from "../lib/viajesOpenCardStrategy";
import { isPlaceholderViajesCtaHref } from "../lib/viajesCtaHref";
import { setLangOnHref } from "../lib/viajesLangHref";
import type { ViajesHeroVisualKind } from "../lib/viajesOfferHeroFallbacks";
import { inferViajesHeroVisualKind } from "../lib/viajesOfferHeroFallbacks";
import { ViajesContactChannelsRow } from "./ViajesContactChannelsRow";
import { ViajesOfferHeroBackdrop } from "./ViajesOfferHeroBackdrop";
import { ViajesPartnerLogo } from "./ViajesPartnerLogo";

const ACCENT = "#D97706";

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/15 bg-white/[0.08] px-3 py-2.5 shadow-inner shadow-black/25 backdrop-blur-sm sm:px-4 sm:py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/75">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-snug text-white sm:text-[15px]">{value}</p>
    </div>
  );
}

function valueAccentLine(kind: ViajesHeroVisualKind, od: ViajesUi["offerDetail"]): string {
  switch (kind) {
    case "resort":
      return od.valueAccentResort;
    case "car":
      return od.valueAccentCar;
    case "itinerary":
      return od.valueAccentItinerary;
    default:
      return od.valueAccentDefault;
  }
}

function isExternalHref(href: string) {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("wa.me")
  );
}

export function ViajesOfferDetailLayout({
  offer,
  backHref,
  backLabel = "Volver",
  preview = false,
  sparseSections = false,
  previewTone = "default",
  ui,
  exploreViajesHref,
}: {
  offer: ViajesOfferDetailModel;
  backHref: string;
  backLabel?: string;
  preview?: boolean;
  sparseSections?: boolean;
  previewTone?: "default" | "minimal";
  ui: ViajesUi;
  exploreViajesHref: string;
}) {
  const { partner } = offer;
  const od = ui.offerDetail;
  const lane = getViajesOpenCardLane(offer);
  const visualKind = inferViajesHeroVisualKind({
    tags: offer.tags,
    title: offer.title,
    slug: offer.slug,
    partner: offer.partner,
    heroVisualKind: offer.heroVisualKind,
  });

  const laneSurface =
    lane === "affiliate"
      ? "border-l-[6px] border-amber-400 bg-gradient-to-br from-amber-50/90 via-[color:var(--lx-card)] to-[color:var(--lx-card)] shadow-[0_12px_40px_-16px_rgba(180,83,9,0.25)]"
      : lane === "business"
        ? "border-l-[6px] border-emerald-500/80 bg-gradient-to-br from-emerald-50/70 via-[color:var(--lx-card)] to-[color:var(--lx-card)] shadow-[0_12px_40px_-16px_rgba(5,150,105,0.2)]"
        : "border-l-[6px] border-slate-400 bg-gradient-to-br from-slate-50/90 via-[color:var(--lx-card)] to-[color:var(--lx-card)] shadow-[0_12px_40px_-16px_rgba(71,85,105,0.18)]";

  const identityBadge =
    lane === "affiliate" ? od.identityBadgeAffiliate : lane === "business" ? od.identityBadgeBusiness : od.identityBadgePrivate;

  const disclosurePanel =
    lane === "affiliate"
      ? "rounded-xl border border-amber-200/80 bg-amber-50/95 px-4 py-3 text-sm leading-relaxed text-amber-950"
      : lane === "private"
        ? "rounded-xl border border-slate-200/90 bg-slate-50/95 px-4 py-3 text-sm leading-relaxed text-slate-900"
        : "rounded-xl border border-emerald-100/90 bg-emerald-50/60 px-4 py-3 text-sm leading-relaxed text-[color:var(--lx-text-2)]";

  const metaItems: { label: string; value: string }[] = [];
  if (!sparseSections || offer.priceFrom.trim().length > 0) {
    const p = offer.priceFrom.trim();
    metaItems.push({
      label: od.metaPriceLabel,
      value: p ? (/\b(desde|from)\b/i.test(p) ? p : `${od.valueFraming} ${p}`) : "—",
    });
  }
  if (!sparseSections || offer.duration.trim().length > 0) {
    metaItems.push({ label: od.metaDurationLabel, value: offer.duration.trim() || "—" });
  }
  if (!sparseSections || offer.departureCity.trim().length > 0) {
    metaItems.push({ label: od.metaDepartureLabel, value: offer.departureCity.trim() || "—" });
  }

  const showMetaStrip = metaItems.length > 0 && metaItems.some((m) => m.value !== "—");
  const accentHint = valueAccentLine(visualKind, od);
  const mainCtaActionable = offer.mainCtaHref.trim().length > 0 && !isPlaceholderViajesCtaHref(offer.mainCtaHref);

  const mainCtaBlock = mainCtaActionable ? (
    <a
      href={offer.mainCtaHref}
      className="inline-flex min-h-[52px] w-full flex-1 touch-manipulation items-center justify-center rounded-2xl px-6 py-3.5 text-center text-sm font-bold text-white shadow-[0_10px_32px_rgba(217,119,6,0.5)] ring-2 ring-white/25 ring-offset-2 ring-offset-black/30 transition hover:brightness-110 active:scale-[0.99] sm:min-h-[48px] sm:max-w-md sm:flex-none"
      style={{ backgroundColor: ACCENT }}
    >
      {offer.mainCtaLabel}
    </a>
  ) : (
    <div
      className="inline-flex min-h-[52px] w-full flex-1 flex-col justify-center rounded-2xl border border-dashed border-white/50 bg-black/35 px-5 py-3.5 text-center sm:min-h-[48px] sm:max-w-md sm:flex-none"
      role="note"
    >
      <span className="text-sm font-bold text-white/95">{offer.mainCtaLabel}</span>
      <span className="mt-1 text-[11px] font-medium leading-snug text-white/75 sm:text-xs">{od.mainCtaUnavailableHint}</span>
    </div>
  );

  const mainCtaBlockSparse = mainCtaActionable ? (
    <a
      href={offer.mainCtaHref}
      className="inline-flex min-h-[52px] w-full flex-1 touch-manipulation items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-bold text-white shadow-lg ring-2 ring-white/20 ring-offset-2 ring-offset-black/25 transition hover:brightness-110 sm:max-w-md"
      style={{ backgroundColor: ACCENT }}
    >
      {offer.mainCtaLabel}
    </a>
  ) : (
    <div
      className="inline-flex min-h-[52px] w-full flex-1 flex-col justify-center rounded-2xl border border-dashed border-white/50 bg-black/35 px-5 py-3.5 text-center sm:max-w-md"
      role="note"
    >
      <span className="text-sm font-bold text-white/95">{offer.mainCtaLabel}</span>
      <span className="mt-1 text-[11px] font-medium leading-snug text-white/75 sm:text-xs">{od.mainCtaUnavailableHint}</span>
    </div>
  );

  const heroInner = (
    <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-5 pt-16 sm:px-5 sm:pb-8 sm:pt-24 lg:px-6">
      <Link
        href={backHref}
        className="mb-3 inline-flex min-h-[44px] items-center text-xs font-semibold text-white/90 underline-offset-4 hover:text-white hover:underline sm:mb-4"
      >
        ← {backLabel}
      </Link>
      {(!sparseSections || offer.tags.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {offer.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm sm:text-xs"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      <h1 className="mt-3 max-w-4xl text-[1.7rem] font-bold leading-[1.12] tracking-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.55)] sm:text-4xl lg:max-w-5xl lg:text-5xl">
        {offer.title}
      </h1>
      {(!sparseSections || offer.destination.trim().length > 0) && (
        <p className="mt-2 max-w-3xl text-base font-medium leading-snug text-white/95 sm:text-lg">{offer.destination}</p>
      )}

      {showMetaStrip || !sparseSections ? (
        <div className="mt-5 rounded-[1.35rem] border border-white/25 bg-black/50 p-4 shadow-[0_28px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-6">
          {showMetaStrip ? (
            <div
              className={`grid gap-2 sm:gap-3 ${
                metaItems.length >= 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {metaItems.map((m) => (
                <MetaCell key={m.label} label={m.label} value={m.value} />
              ))}
            </div>
          ) : null}
          {!sparseSections && showMetaStrip ? (
            <p className="mt-4 border-t border-white/15 pt-4 text-xs leading-relaxed text-white/80 sm:text-[13px]">{accentHint}</p>
          ) : null}
          <div className={`flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch ${showMetaStrip ? "mt-4" : ""}`}>
            {mainCtaBlock}
            <Link
              href={exploreViajesHref}
              className="inline-flex min-h-[52px] w-full flex-1 touch-manipulation items-center justify-center rounded-2xl border border-white/55 bg-white/12 px-5 py-3.5 text-center text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/22 sm:min-h-[48px] sm:w-auto sm:max-w-xs"
            >
              {od.exploreViajes}
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {mainCtaBlockSparse}
          <Link
            href={exploreViajesHref}
            className="inline-flex min-h-[52px] w-full flex-1 touch-manipulation items-center justify-center rounded-2xl border border-white/55 bg-white/12 px-5 py-3.5 text-sm font-bold text-white backdrop-blur-md sm:w-auto"
          >
            {od.exploreViajes}
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[color:var(--lx-page)] pb-16 text-[color:var(--lx-text)] sm:pb-20">
      {preview ? (
        <div
          className={
            previewTone === "minimal"
              ? "border-b border-amber-300/40 bg-gradient-to-r from-amber-50/95 to-amber-100/80 px-4 py-2 text-center text-xs font-semibold text-amber-950 sm:text-[13px]"
              : "border-b border-amber-400/35 bg-amber-100/95 px-4 py-2.5 text-center text-sm font-semibold text-amber-950"
          }
        >
          {previewTone === "minimal" ? od.previewBannerMinimal : od.previewBanner}
        </div>
      ) : null}

      <ViajesOfferHeroBackdrop
        heroImageSrc={offer.heroImageSrc}
        heroImageAlt={offer.heroImageAlt}
        heroUseNativeImg={offer.heroUseNativeImg}
        visualKind={visualKind}
        lane={lane}
      >
        {heroInner}
      </ViajesOfferHeroBackdrop>

      <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:space-y-9 sm:px-5 sm:py-10 lg:space-y-11 lg:px-6 lg:py-12">
        {(!sparseSections || offer.includes.length > 0) && (
          <section className="overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-[0_10px_44px_-18px_rgba(0,0,0,0.1)]">
            <div className="border-b border-[color:var(--lx-gold)]/30 bg-gradient-to-r from-[color:var(--lx-section)]/90 to-transparent px-5 py-4 sm:px-8 sm:py-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-[color:var(--lx-text)]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--lx-gold)]/20 text-sm text-[color:var(--lx-gold)]" aria-hidden>
                    ✓
                  </span>
                  {od.includes}
                </h2>
                {(!sparseSections || offer.includes.length > 0) && (
                  <p className="max-w-2xl text-xs text-[color:var(--lx-muted)] sm:text-sm">{od.includesSubline}</p>
                )}
              </div>
            </div>
            <ul className="grid gap-3 p-5 sm:grid-cols-2 sm:gap-4 sm:p-8">
              {offer.includes.map((line) => (
                <li
                  key={line}
                  className="flex gap-3 rounded-xl border border-[color:var(--lx-nav-border)]/70 bg-[color:var(--lx-section)]/40 p-3.5 text-sm leading-relaxed text-[color:var(--lx-text-2)] sm:p-4"
                >
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--lx-gold)]/18 text-[color:var(--lx-gold)]"
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(!sparseSections || offer.whoItsFor.length > 0) && (
          <section className="overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]/85 shadow-[0_8px_36px_-16px_rgba(0,0,0,0.08)]">
            <div className="border-b border-emerald-200/40 bg-gradient-to-r from-emerald-50/50 to-transparent px-5 py-4 sm:px-8 sm:py-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-[color:var(--lx-text)]">
                  <span className="text-[color:var(--lx-gold)]" aria-hidden>
                    ◆
                  </span>
                  {od.whoFor}
                </h2>
                {(!sparseSections || offer.whoItsFor.length > 0) && (
                  <p className="max-w-2xl text-xs text-[color:var(--lx-muted)] sm:text-sm">{od.whoForSubline}</p>
                )}
              </div>
            </div>
            <ul className="flex flex-wrap gap-2 p-5 sm:p-8">
              {offer.whoItsFor.map((p) => (
                <li
                  key={p}
                  className="inline-flex max-w-full rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-sm font-medium leading-snug text-[color:var(--lx-text-2)] shadow-sm"
                >
                  <span className="mr-2 text-[color:var(--lx-gold)]" aria-hidden>
                    ◆
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={`rounded-2xl border border-[color:var(--lx-nav-border)] p-5 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.12)] sm:p-8 ${laneSurface}`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-black/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
                  {identityBadge}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">
                  {partner.isAffiliate ? od.partnerCommercial : partner.privateSeller ? od.privatePostedBy : od.postedBy}
                </span>
              </div>
              {lane === "affiliate" ? (
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-900/85">{od.affiliateIdentityKicker}</p>
              ) : lane === "business" ? (
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-900/85">{od.businessIdentityKicker}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3">
                {partner.logoSrc ? (
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[color:var(--lx-nav-border)] bg-white shadow-sm">
                    <ViajesPartnerLogo src={partner.logoSrc} className="h-full w-full object-contain p-1" />
                  </div>
                ) : null}
                <h2 className="text-xl font-bold text-[color:var(--lx-text)] sm:text-2xl">{partner.name}</h2>
              </div>
              {lane === "affiliate" ? (
                <p className="text-sm leading-relaxed text-amber-950/90">{od.affiliateReferralHint}</p>
              ) : lane === "business" ? (
                <p className="text-sm leading-relaxed text-emerald-950/85">{od.businessOperatorHint}</p>
              ) : null}
              <div className={`${disclosurePanel}`}>
                {partner.isAffiliate ? (
                  <p>{partner.affiliateDisclosure ?? od.affiliateFallback}</p>
                ) : partner.privateSeller ? (
                  <p>{od.privateFallback}</p>
                ) : (
                  <p>{od.businessFallback}</p>
                )}
              </div>
              {partner.contactChannels && partner.contactChannels.length > 0 ? (
                <ViajesContactChannelsRow channels={partner.contactChannels} ariaLabel={od.contactChannelsHeading} />
              ) : null}
            </div>
            <div className="flex w-full flex-col gap-2.5 sm:max-w-sm sm:items-stretch lg:min-w-[240px] lg:items-end">
              <a
                href={partner.ctaHref}
                className="inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-105 lg:min-w-[220px]"
                style={{ backgroundColor: ACCENT }}
              >
                {partner.ctaLabel}
              </a>
              {partner.secondaryCtaLabel && partner.secondaryCtaHref ? (
                isExternalHref(partner.secondaryCtaHref) ? (
                  <a
                    href={partner.secondaryCtaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-3 text-sm font-bold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
                  >
                    {partner.secondaryCtaLabel}
                  </a>
                ) : (
                  <Link
                    href={setLangOnHref(partner.secondaryCtaHref, ui.lang)}
                    className="inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-3 text-center text-sm font-bold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
                  >
                    {partner.secondaryCtaLabel}
                  </Link>
                )
              ) : null}
            </div>
          </div>
        </section>

        <section className="space-y-4 overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_32px_-18px_rgba(0,0,0,0.08)] sm:p-8">
          <div className="flex items-start gap-3 border-b border-[color:var(--lx-nav-border)]/70 pb-4">
            <span
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--lx-gold)]/15 text-[color:var(--lx-gold)]"
              aria-hidden
            >
              ◈
            </span>
            <div>
              <h2 className="text-xl font-bold text-[color:var(--lx-text)]">{od.trustIntegratedTitle}</h2>
            </div>
          </div>
          {(!sparseSections || offer.description.trim().length > 0) && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-[color:var(--lx-text-2)] sm:text-[15px]">{offer.description}</p>
          )}
          {offer.dateRange && (!sparseSections || offer.dateRange.trim().length > 0) ? (
            <div className="flex flex-wrap items-baseline gap-2 rounded-xl border border-[color:var(--lx-nav-border)]/60 bg-[color:var(--lx-section)]/50 px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{od.calendar}</span>
              <span className="text-sm font-semibold text-[color:var(--lx-text)]">{offer.dateRange}</span>
            </div>
          ) : null}
          {offer.notes ? <p className="text-sm text-[color:var(--lx-muted)]">{offer.notes}</p> : null}
          {offer.trustNote ? (
            <div className="rounded-xl border border-dashed border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)]/90 p-4 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
              {offer.trustNote}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
