"use client";

import Link from "next/link";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type { ViajesOfferDetailModel } from "../data/viajesOfferDetailSampleData";
import type { ViajesResultRow } from "../data/viajesResultsSampleData";
import type { ViajesOfferDetailModelV2Extras } from "../lib/v2/mapViajesOfferV2ToDetailModel";
import { getViajesUi, type ViajesUi } from "../data/viajesUiCopy";
import { ViajesOfferTranslationLayer } from "./ViajesOfferTranslationLayer";
import { getViajesOpenCardLane } from "../lib/viajesOpenCardStrategy";
import { isPlaceholderViajesCtaHref } from "../lib/viajesCtaHref";
import type { ViajesHeroVisualKind } from "../lib/viajesOfferHeroFallbacks";
import { inferViajesHeroVisualKind } from "../lib/viajesOfferHeroFallbacks";
import { ViajesOfferHeroBackdrop } from "./ViajesOfferHeroBackdrop";
import { ViajesSheetCtaLink } from "./ViajesSheetCtaLink";
import { ViajesOfferDetailGallery } from "./ViajesOfferDetailGallery";
import { ViajesOfferModuleCards, ViajesOfferItinerarySection } from "./ViajesOfferModuleCards";
import { ViajesOfferLocationsBlock } from "./ViajesOfferLocationsBlock";
import { ViajesOfferBusinessHub } from "./ViajesOfferBusinessHub";
import { ViajesOfferInquiryHub } from "./ViajesOfferInquiryHub";
import { ViajesOfferMoreFromProvider, ViajesOfferSimilarGetaways } from "./ViajesOfferRelatedRails";
import { ViajesOfferPillSection } from "./ViajesOfferPillSection";
import { ViajesContactChannelsRow } from "./ViajesContactChannelsRow";
import { ViajesPartnerLogo } from "./ViajesPartnerLogo";
import { ViajesPublicInquiryForm } from "./ViajesPublicInquiryForm";
import { isViajesDurableHttpsUrl } from "../lib/v2/viajesMediaDurableGuards";

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

export function ViajesOfferDetailLayout({
  offer,
  lang: langProp,
  listingLang = null,
  listingKey,
  backHref,
  backLabel = "Volver",
  preview = false,
  sparseSections = false,
  previewTone = "default",
  ui: uiProp,
  exploreViajesHref,
  stagedListingId = null,
  leonixAdId = null,
  moreFromProvider = [],
  similarGetaways = [],
}: {
  offer: ViajesOfferDetailModel;
  lang?: Lang;
  listingLang?: string | null;
  listingKey?: string;
  backHref: string;
  backLabel?: string;
  preview?: boolean;
  sparseSections?: boolean;
  previewTone?: "default" | "minimal";
  /** Prefer omitting from RSC — client resolves copy via lang to avoid serializing functions. */
  ui?: ViajesUi;
  exploreViajesHref: string;
  stagedListingId?: string | null;
  leonixAdId?: string | null;
  moreFromProvider?: ViajesResultRow[];
  similarGetaways?: ViajesResultRow[];
}) {
  const lang = langProp ?? uiProp?.lang ?? "es";
  const ui = uiProp ?? getViajesUi(lang);
  const body = (
    <ViajesOfferDetailLayoutBody
      offer={offer}
      translateControl={null}
      backHref={backHref}
      backLabel={backLabel}
      preview={preview}
      sparseSections={sparseSections}
      previewTone={previewTone}
      ui={ui}
      exploreViajesHref={exploreViajesHref}
      stagedListingId={stagedListingId}
      leonixAdId={leonixAdId}
      moreFromProvider={moreFromProvider}
      similarGetaways={similarGetaways}
    />
  );

  if (preview || !listingKey?.trim()) {
    return body;
  }

  return (
    <ViajesOfferTranslationLayer
      offer={offer}
      siteLocale={lang}
      listingLang={listingLang}
      listingKey={listingKey.trim()}
    >
      {(displayOffer, translateControl) => (
        <ViajesOfferDetailLayoutBody
          offer={displayOffer}
          translateControl={translateControl}
          backHref={backHref}
          backLabel={backLabel}
          preview={preview}
          sparseSections={sparseSections}
          previewTone={previewTone}
          ui={ui}
          exploreViajesHref={exploreViajesHref}
          stagedListingId={stagedListingId}
          leonixAdId={leonixAdId}
          moreFromProvider={moreFromProvider}
          similarGetaways={similarGetaways}
        />
      )}
    </ViajesOfferTranslationLayer>
  );
}

function ViajesOfferDetailLayoutBody({
  offer,
  translateControl,
  backHref,
  backLabel = "Volver",
  preview = false,
  sparseSections = false,
  previewTone = "default",
  ui,
  exploreViajesHref,
  stagedListingId = null,
  leonixAdId = null,
  moreFromProvider = [],
  similarGetaways = [],
}: {
  offer: ViajesOfferDetailModel;
  translateControl: React.ReactNode;
  backHref: string;
  backLabel?: string;
  preview?: boolean;
  sparseSections?: boolean;
  previewTone?: "default" | "minimal";
  ui: ViajesUi;
  exploreViajesHref: string;
  stagedListingId?: string | null;
  leonixAdId?: string | null;
  moreFromProvider?: ViajesResultRow[];
  similarGetaways?: ViajesResultRow[];
}) {
  const { partner } = offer;
  const od = ui.offerDetail;
  const lane = getViajesOpenCardLane(offer);
  const extras = offer as ViajesOfferDetailModelV2Extras;
  const v2 = extras.v2Offer;
  const visualKind = inferViajesHeroVisualKind({
    tags: offer.tags,
    title: offer.title,
    slug: offer.slug,
    partner: offer.partner,
    heroVisualKind: offer.heroVisualKind,
  });

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
  const lx = (leonixAdId ?? "").trim();
  if (lx) {
    metaItems.push({
      label: "Leonix Ad ID",
      value: `# ${lx}`,
    });
  }

  const showMetaStrip = metaItems.length > 0 && metaItems.some((m) => m.value !== "—");
  const accentHint = valueAccentLine(visualKind, od);
  const mainCtaActionable = offer.mainCtaHref.trim().length > 0 && !isPlaceholderViajesCtaHref(offer.mainCtaHref);

  const mainCtaBlock = mainCtaActionable ? (
    <ViajesSheetCtaLink
      href={offer.mainCtaHref}
      lang={ui.lang}
      className="inline-flex min-h-[52px] w-full flex-1 touch-manipulation items-center justify-center rounded-2xl px-6 py-3.5 text-center text-sm font-bold text-white shadow-[0_10px_32px_rgba(217,119,6,0.5)] ring-2 ring-white/25 ring-offset-2 ring-offset-black/30 transition hover:brightness-110 active:scale-[0.99] sm:min-h-[48px] sm:max-w-md sm:flex-none"
      style={{ backgroundColor: ACCENT }}
    >
      {offer.mainCtaLabel}
    </ViajesSheetCtaLink>
  ) : (
    <div
      className="inline-flex min-h-[52px] w-full flex-1 flex-col justify-center rounded-2xl border border-dashed border-white/50 bg-black/35 px-5 py-3.5 text-center sm:min-h-[48px] sm:max-w-md sm:flex-none"
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
          {mainCtaBlock}
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

  const gallery = extras.v2Gallery?.filter((g) => g.src) ?? [];
  const modules = extras.v2Modules ?? [];
  const itinerary = extras.v2Itinerary ?? [];
  const videos = (v2?.media.videos ?? []).filter((v) => {
    const url = (v.url || "").trim();
    return url.startsWith("https://") || url.startsWith("http://");
  });
  const highlights = v2?.highlights ?? [];
  const exclusions = v2?.exclusions ?? [];
  const amenities = v2?.amenities ?? [];
  const accessibility = v2?.accessibility ?? [];
  const needToKnow = v2?.needToKnow ?? [];
  const policies = v2?.policies ?? [];

  const sourceLabel =
    lane === "affiliate"
      ? ui.lang === "en"
        ? "Travel partner"
        : "Socio de viaje"
      : lane === "editorial"
        ? ui.lang === "en"
          ? "Leonix guide"
          : "Guía Leonix"
        : lane === "private"
          ? ui.lang === "en"
            ? "Private seller"
            : "Particular"
          : ui.lang === "en"
            ? "Local business"
            : "Negocio local";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[color:var(--lx-page)] pb-16 text-[color:var(--lx-text)] sm:pb-20">
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

      <div className="border-b border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 sm:px-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 text-xs text-[color:var(--lx-muted)]">
          <span className="rounded-full bg-black/[0.05] px-2.5 py-1 font-bold uppercase tracking-wide text-[color:var(--lx-text)]">
            {sourceLabel}
          </span>
          {partner.affiliateDisclosure ? <span className="line-clamp-1">{partner.affiliateDisclosure}</span> : null}
        </div>
      </div>

      <ViajesOfferHeroBackdrop
        heroImageSrc={offer.heroImageSrc}
        heroImageAlt={offer.heroImageAlt}
        heroUseNativeImg={offer.heroUseNativeImg}
        visualKind={visualKind}
        lane={lane === "editorial" ? "business" : lane}
      >
        {heroInner}
      </ViajesOfferHeroBackdrop>

      <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:space-y-9 sm:px-5 sm:py-10 lg:space-y-11 lg:px-6 lg:py-12">
        {translateControl && !preview ? <div>{translateControl}</div> : null}

        {gallery.length ? <ViajesOfferDetailGallery images={gallery} title={offer.title} lang={ui.lang} /> : null}

        <ViajesOfferPillSection
          title={ui.lang === "en" ? "Highlights" : "Destacados"}
          items={highlights}
          tone="highlight"
        />

        {(!sparseSections || offer.includes.length > 0) && (
          <section className="overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-[0_10px_44px_-18px_rgba(0,0,0,0.1)]">
            <div className="border-b border-[color:var(--lx-gold)]/30 bg-gradient-to-r from-[color:var(--lx-section)]/90 to-transparent px-5 py-4 sm:px-8 sm:py-5">
              <h2 className="text-xl font-bold tracking-tight text-[color:var(--lx-text)]">{od.includes}</h2>
            </div>
            <ul className="grid gap-3 p-5 sm:grid-cols-2 sm:gap-4 sm:p-8">
              {offer.includes.map((line) => (
                <li
                  key={line}
                  className="flex gap-3 rounded-xl border border-[color:var(--lx-nav-border)]/70 bg-[color:var(--lx-section)]/40 p-3.5 text-sm leading-relaxed text-[color:var(--lx-text-2)]"
                >
                  <span className="mt-0.5 text-[color:var(--lx-gold)]" aria-hidden>
                    ✓
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <ViajesOfferPillSection
          title={ui.lang === "en" ? "Exclusions" : "No incluye"}
          items={exclusions}
          tone="exclude"
        />

        {(!sparseSections || offer.description.trim().length > 0) && (
          <section className="overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-[color:var(--lx-text)]">
              {ui.lang === "en" ? "The story" : "La historia"}
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[color:var(--lx-text-2)] sm:text-[15px]">
              {offer.description}
            </p>
            {offer.dateRange?.trim() ? (
              <p className="mt-4 text-sm font-semibold text-[color:var(--lx-text)]">
                <span className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{od.calendar} · </span>
                {offer.dateRange}
              </p>
            ) : null}
          </section>
        )}

        {modules.length ? <ViajesOfferModuleCards modules={modules} lang={ui.lang} /> : null}
        {itinerary.length ? <ViajesOfferItinerarySection items={itinerary} lang={ui.lang} /> : null}

        {videos.length ? (
          <section className="overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-[color:var(--lx-text)]">
              {ui.lang === "en" ? "Videos" : "Videos"}
            </h2>
            <ul className="mt-4 space-y-2">
              {videos.map((v) => (
                <li key={v.id}>
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[color:var(--lx-burgundy)] underline-offset-2 hover:underline"
                  >
                    {v.url}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <ViajesOfferPillSection title={ui.lang === "en" ? "Amenities" : "Amenidades"} items={amenities} />
        <ViajesOfferPillSection
          title={ui.lang === "en" ? "Need to know" : "Lo que debes saber"}
          items={needToKnow}
        />
        <ViajesOfferPillSection
          title={ui.lang === "en" ? "Policies" : "Políticas"}
          items={policies}
        />
        <ViajesOfferPillSection
          title={ui.lang === "en" ? "Accessibility" : "Accesibilidad"}
          items={accessibility}
        />

        {(!sparseSections || offer.whoItsFor.length > 0) && (
          <ViajesOfferPillSection title={od.whoFor} items={offer.whoItsFor} />
        )}

        {v2 ? <ViajesOfferLocationsBlock locations={v2.locations} lane={lane} lang={ui.lang} /> : null}

        {lane === "business" && v2 ? (
          <ViajesOfferBusinessHub
            offer={v2}
            channels={partner.contactChannels ?? []}
            lang={ui.lang}
            identityBadge={od.identityBadgeBusiness}
            disclosure={od.businessFallback}
            kicker={od.businessIdentityKicker}
            operatorHint={od.businessOperatorHint}
          />
        ) : null}

        {lane === "private" ? (
          <ViajesOfferInquiryHub
            displayName={partner.name}
            channels={partner.contactChannels ?? []}
            stagedListingId={stagedListingId}
            preview={preview}
            ui={ui}
            disclosure={od.privateFallback}
          />
        ) : null}

        {(lane === "affiliate" || lane === "editorial") && (
          <section
            className={`rounded-2xl border border-[color:var(--lx-nav-border)] p-5 shadow-sm sm:p-8 ${
              lane === "affiliate"
                ? "border-l-[6px] border-l-amber-400 bg-gradient-to-br from-amber-50/90 via-[color:var(--lx-card)] to-[color:var(--lx-card)]"
                : "border-l-[6px] border-l-sky-400 bg-gradient-to-br from-sky-50/80 via-[color:var(--lx-card)] to-[color:var(--lx-card)]"
            }`}
          >
            <div className="flex flex-wrap items-center gap-3">
              {partner.logoSrc && isViajesDurableHttpsUrl(partner.logoSrc) ? (
                <div className="h-14 w-14 overflow-hidden rounded-xl border border-[color:var(--lx-nav-border)] bg-white">
                  <ViajesPartnerLogo src={partner.logoSrc} className="h-full w-full object-contain p-1" />
                </div>
              ) : null}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
                  {lane === "affiliate" ? od.identityBadgeAffiliate : sourceLabel}
                </p>
                <h2 className="text-xl font-bold text-[color:var(--lx-text)]">{partner.name}</h2>
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
              {partner.affiliateDisclosure ?? (lane === "editorial" ? offer.trustNote ?? od.businessFallback : od.affiliateFallback)}
            </div>
            {partner.contactChannels?.length ? (
              <ViajesContactChannelsRow channels={partner.contactChannels} ariaLabel={od.contactChannelsHeading} lang={ui.lang} />
            ) : null}
            {mainCtaActionable ? (
              <div className="mt-4 sm:max-w-sm">
                <ViajesSheetCtaLink
                  href={partner.ctaHref || offer.mainCtaHref}
                  lang={ui.lang}
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  {partner.ctaLabel || offer.mainCtaLabel}
                </ViajesSheetCtaLink>
              </div>
            ) : null}
          </section>
        )}

        {lane === "business" && !preview && stagedListingId ? (
          <section className="overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-sm sm:p-8">
            <ViajesPublicInquiryForm stagedListingId={stagedListingId} copy={od.inquiry} />
          </section>
        ) : null}

        {lane === "business" || lane === "affiliate" ? (
          <ViajesOfferMoreFromProvider rows={moreFromProvider} lang={ui.lang} />
        ) : null}
        <ViajesOfferSimilarGetaways rows={similarGetaways} lang={ui.lang} />

        {offer.trustNote ? (
          <div className="rounded-xl border border-dashed border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)]/90 p-4 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
            {offer.trustNote}
          </div>
        ) : null}
      </div>
    </div>
  );
}
