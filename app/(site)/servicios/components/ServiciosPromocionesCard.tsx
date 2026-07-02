"use client";

import { useCallback, useMemo, useState } from "react";
import { FaTicketAlt } from "react-icons/fa";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels, getServiciosPromocionesSectionCopy } from "../copy/serviciosProfileCopy";
import { hasOfferSectionResolved } from "../lib/serviciosProfilePresence";
import { SV } from "./serviciosDesignTokens";
import { LX, LX_SECTION_CARD, LX_SECTION_HEADING } from "./serviciosLeonixBrand";
import { ServiciosPromoImageLightbox } from "./ServiciosPromoImageLightbox";
import { serviciosAnalyticsTrackMeta, trackServiciosListingCta } from "../lib/serviciosCtaIntents";

type PromoRow = ServiciosProfileResolved["promotions"][number];
type ResourceKind = "image" | "pdf" | "link";
type PromoAction = { kind: ResourceKind; href: string };

function buildPromoActions(promo: PromoRow): { primary: PromoAction | null; secondary: PromoAction[] } {
  const ordered: PromoAction[] = [];
  if (promo.assetImageHrefSafe) ordered.push({ kind: "image", href: promo.assetImageHrefSafe });
  if (promo.assetPdfHrefSafe) ordered.push({ kind: "pdf", href: promo.assetPdfHrefSafe });
  if (promo.hrefSafe) ordered.push({ kind: "link", href: promo.hrefSafe });
  if (ordered.length === 0) return { primary: null, secondary: [] };
  return { primary: ordered[0]!, secondary: ordered.slice(1) };
}

/** Premium: image via thumbnail; buttons only for link/PDF (Gate 16). */
function buildPremiumPromoActions(
  promo: PromoRow,
  hasImage: boolean,
): { primary: PromoAction | null; secondary: PromoAction[] } {
  const secondary: PromoAction[] = [];
  let primary: PromoAction | null = null;
  if (promo.hrefSafe) primary = { kind: "link", href: promo.hrefSafe };
  if (promo.assetPdfHrefSafe) secondary.push({ kind: "pdf", href: promo.assetPdfHrefSafe });
  if (!hasImage && promo.assetImageHrefSafe) {
    primary = primary ?? { kind: "image", href: promo.assetImageHrefSafe };
  }
  return { primary, secondary };
}

function OfferHeadline({ text, premiumLeonixTone }: { text: string; premiumLeonixTone?: boolean }) {
  const parts = text.split(/(\$\d+)/g);
  return (
    <h3
      className={
        premiumLeonixTone
          ? `${LX_SECTION_HEADING} leading-snug`
          : "text-lg font-bold leading-snug tracking-tight text-[#2C2214] sm:text-xl"
      }
    >
      {parts.map((part, i) =>
        /^\$\d+$/.test(part) ? (
          <span key={i} className="text-[#9A7329]">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </h3>
  );
}

function promoActionLabel(
  kind: ResourceKind,
  variant: "primary" | "secondary",
  lang: ServiciosLang,
  L: ReturnType<typeof getServiciosProfileLabels>,
  premiumLeonixTone: boolean,
): string {
  if (!premiumLeonixTone) {
    return kind === "image" ? L.promoViewImage : kind === "pdf" ? L.promoViewPdf : L.visitWebsite;
  }
  if (kind === "image") return lang === "en" ? "View image" : "Ver imagen";
  if (kind === "pdf") return lang === "en" ? "View PDF" : "Ver PDF";
  if (variant === "primary") return lang === "en" ? "View offer" : "Ver oferta";
  return lang === "en" ? "Visit site" : "Visitar sitio";
}

function PromoCtaButton({
  kind,
  href,
  variant,
  L,
  lang,
  premiumLeonixTone,
  onImageOpen,
  listingSlug,
  analyticsMeta,
}: {
  kind: ResourceKind;
  href: string;
  variant: "primary" | "secondary";
  L: ReturnType<typeof getServiciosProfileLabels>;
  lang: ServiciosLang;
  premiumLeonixTone?: boolean;
  onImageOpen: (src: string) => void;
  listingSlug?: string;
  analyticsMeta?: ReturnType<typeof serviciosAnalyticsTrackMeta>;
}) {
  const premium = Boolean(premiumLeonixTone);
  const label = promoActionLabel(kind, variant, lang, L, premium);
  const base = premium
    ? variant === "primary"
      ? "inline-flex min-h-[44px] items-center justify-center rounded-lg border-0 px-4 py-2.5 text-sm font-bold text-[#FFFCF7] shadow-sm transition hover:brightness-[1.05]"
      : "inline-flex min-h-[44px] items-center justify-center rounded-lg border-2 border-[#D4C4A8] bg-[#FFFCF7] px-4 py-2.5 text-sm font-bold text-[#1E1814] transition hover:border-[#C9A84A] hover:bg-[#FFFDF9]"
    : variant === "primary"
      ? "inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#B8935A]/55 bg-gradient-to-b from-[#F3E6C8] to-[#E8D4A8] px-3.5 py-2 text-xs font-bold text-[#2C2214] shadow-sm transition hover:border-[#9A7329]/70 hover:shadow"
      : "inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#C4A574]/45 bg-[#FFFAF0]/90 px-3 py-2 text-xs font-semibold text-[#3D2C12] transition hover:border-[#9A7329]/55 hover:bg-white";
  const primaryStyle = premium && variant === "primary" ? { backgroundColor: LX.burgundy } : undefined;

  const trackPromo = () => {
    if (!listingSlug) return;
    const eventType =
      kind === "pdf" ? "cta_secondary_click" : variant === "primary" ? "cta_primary_click" : "cta_secondary_click";
    trackServiciosListingCta(listingSlug, eventType, { ...analyticsMeta, source: "promo_card", promoKind: kind });
  };

  if (kind === "image") {
    return (
      <button
        type="button"
        className={base}
        style={primaryStyle}
        onClick={() => {
          trackPromo();
          onImageOpen(href);
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={base}
      style={primaryStyle}
      onClick={() => trackPromo()}
    >
      {label}
    </a>
  );
}

function PromoInnerCard({
  promo,
  lang,
  compact,
  premiumLeonixTone,
  onImageOpen,
  listingSlug,
  analyticsMeta,
}: {
  promo: PromoRow;
  lang: ServiciosLang;
  compact?: boolean;
  premiumLeonixTone?: boolean;
  onImageOpen: (src: string) => void;
  listingSlug?: string;
  analyticsMeta?: ReturnType<typeof serviciosAnalyticsTrackMeta>;
}) {
  const L = getServiciosProfileLabels(lang);
  const hasImage = Boolean(promo.assetImageHrefSafe);
  const thumb = promo.assetImageHrefSafe;
  const footnote = promo.footnote?.trim() ?? "";
  const headline = promo.headline?.trim() ?? "";

  const { primary, secondary } = useMemo(
    () =>
      premiumLeonixTone
        ? buildPremiumPromoActions(promo, hasImage)
        : buildPromoActions(promo),
    [promo, premiumLeonixTone, hasImage],
  );

  const showActions = Boolean(primary || secondary.length > 0);

  // Restaurant-style compact card
  const cardClass = premiumLeonixTone
    ? "rounded-[20px] border border-[#E8D9C4] bg-[#FFFCF7] shadow-[0_8px_32px_-8px_rgba(42,36,22,0.1)] group overflow-hidden p-0"
    : `relative overflow-hidden rounded-2xl border border-[#D4A574]/45 shadow-[0_8px_28px_-12px_rgba(61,44,18,0.18)] transition hover:border-[#C9A84A]/55 hover:shadow-md ${
        compact ? "px-3 py-3.5 sm:px-4 sm:py-4" : "px-4 py-5 sm:px-6 sm:py-6"
      }`;
  const cardStyle = premiumLeonixTone
    ? undefined
    : { background: "linear-gradient(165deg, #FFFCF5 0%, #FFF8EC 42%, #FAF0E4 100%)" };

  if (premiumLeonixTone) {
    // Restaurant-style compact card with image on top
    return (
      <article className={cardClass} style={cardStyle}>
        {hasImage && thumb ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F5F0E8]">
            <button
              type="button"
              onClick={() => onImageOpen(thumb)}
              className="h-full w-full"
              aria-label={L.promoViewImage}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumb}
                alt=""
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
              />
            </button>
          </div>
        ) : null}
        <div className="p-5 sm:p-6">
          {headline ? <OfferHeadline text={headline} premiumLeonixTone={premiumLeonixTone} /> : null}
          {footnote ? (
            <p className="mt-2 text-sm leading-relaxed text-[#4A4A4A]">
              {footnote}
            </p>
          ) : null}
          {showActions ? (
            <div className="mt-4 flex flex-wrap gap-2.5">
              {primary ? (
                <PromoCtaButton
                  key={`p-${primary.kind}`}
                  kind={primary.kind}
                  href={primary.href}
                  variant="primary"
                  L={L}
                  lang={lang}
                  premiumLeonixTone={premiumLeonixTone}
                  onImageOpen={onImageOpen}
                  listingSlug={listingSlug}
                  analyticsMeta={analyticsMeta}
                />
              ) : null}
              {secondary.map((s) => (
                <PromoCtaButton
                  key={`s-${s.kind}`}
                  kind={s.kind}
                  href={s.href}
                  variant="secondary"
                  L={L}
                  lang={lang}
                  premiumLeonixTone={premiumLeonixTone}
                  onImageOpen={onImageOpen}
                  listingSlug={listingSlug}
                  analyticsMeta={analyticsMeta}
                />
              ))}
            </div>
          ) : null}
        </div>
      </article>
    );
  }

  // Original non-premium card style
  return (
    <article className={cardClass} style={cardStyle}>
      {!premiumLeonixTone ? (
        <>
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#D4A574]/12"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-16 w-16 rounded-tr-[100%] bg-[#C9A84A]/[0.07]"
            aria-hidden
          />
        </>
      ) : null}

      <div
        className={`relative flex flex-col gap-4 ${hasImage ? "sm:flex-row sm:items-start sm:gap-5" : ""}`}
      >
        {hasImage && thumb ? (
          <div className="w-full shrink-0 sm:max-w-[44%] sm:min-w-[10.5rem] lg:min-w-[12.5rem]">
            <button
              type="button"
              onClick={() => onImageOpen(thumb)}
              className="group relative aspect-[5/4] w-full min-h-[140px] overflow-hidden rounded-lg border-2 border-[#D4C4A8] bg-[#F5F0E8] shadow-inner sm:min-h-[160px]"
              aria-label={L.promoViewImage}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumb}
                alt=""
                className="h-full w-full object-cover transition group-hover:scale-[1.02] group-hover:opacity-95"
              />
            </button>
          </div>
        ) : !premiumLeonixTone ? (
          <div className="flex shrink-0 flex-col gap-1.5 sm:w-[min(100%,6.75rem)]">
            <div
              className={`flex aspect-[4/3] w-full max-w-[200px] items-center justify-center rounded-xl border border-dashed border-[#C4A574]/50 bg-[#FAF4EA] sm:max-w-none ${
                compact ? "max-h-[82px]" : ""
              }`}
            >
              <FaTicketAlt className={`text-[#9A7329]/85 ${compact ? "h-7 w-7" : "h-9 w-9"}`} aria-hidden />
            </div>
            <span className="inline-flex w-fit max-w-full items-center rounded-full border border-[#C9A84A]/35 bg-[#FFF3DC] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B5420]">
              {L.promoCouponBadge}
            </span>
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          {headline ? <OfferHeadline text={headline} premiumLeonixTone={premiumLeonixTone} /> : null}

          {footnote ? (
            <p
              className="mt-1.5 text-sm leading-relaxed text-[#5D4A38]/95"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: compact ? 2 : 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {footnote}
            </p>
          ) : null}

          {showActions ? (
            <div className="mt-2.5 flex flex-wrap gap-2 border-t border-[#D4A574]/25 pt-2.5">
              {primary ? (
                <PromoCtaButton
                  key={`p-${primary.kind}`}
                  kind={primary.kind}
                  href={primary.href}
                  variant="primary"
                  L={L}
                  lang={lang}
                  premiumLeonixTone={premiumLeonixTone}
                  onImageOpen={onImageOpen}
                  listingSlug={listingSlug}
                  analyticsMeta={analyticsMeta}
                />
              ) : null}
              {secondary.map((s) => (
                <PromoCtaButton
                  key={`s-${s.kind}`}
                  kind={s.kind}
                  href={s.href}
                  variant="secondary"
                  L={L}
                  lang={lang}
                  premiumLeonixTone={premiumLeonixTone}
                  onImageOpen={onImageOpen}
                  listingSlug={listingSlug}
                  analyticsMeta={analyticsMeta}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ServiciosPromocionesCard({
  profile,
  lang,
  premiumLeonixTone = false,
  listingSlug,
  listingSourceId = null,
  engagementListingId,
  engagementOwnerUserId,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  premiumLeonixTone?: boolean;
  listingSlug?: string;
  listingSourceId?: string | null;
  engagementListingId?: string | null;
  engagementOwnerUserId?: string | null;
}) {
  const copy = getServiciosPromocionesSectionCopy(lang);
  const L = getServiciosProfileLabels(lang);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const openLightbox = useCallback((src: string) => setLightboxSrc(src), []);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);
  const analyticsMeta = serviciosAnalyticsTrackMeta({
    listingSlug,
    sourceId: listingSourceId,
    engagementListingId,
    ownerUserId: engagementOwnerUserId,
    source: "promo_card",
  });

  if (!hasOfferSectionResolved(profile)) return null;

  const n = profile.promotions.length;
  const listClass = premiumLeonixTone
    ? n === 1
      ? "mx-auto mt-6 max-w-lg grid grid-cols-1 gap-5"
      : "mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2"
    : n > 1
      ? "mt-4 flex flex-row flex-nowrap gap-3 overflow-x-auto pb-2 pt-0.5 [scrollbar-width:thin] snap-x snap-mandatory sm:mt-5 md:flex-col md:gap-3.5 md:overflow-visible md:pb-0 md:snap-none"
      : "mt-4 flex flex-col gap-3 sm:mt-5 sm:gap-3.5";

  return (
    <>
      <ServiciosPromoImageLightbox
        src={lightboxSrc}
        onClose={closeLightbox}
        closeLabel={L.promoModalClose}
        dialogLabel={L.promoImageLightboxAria}
      />
      <section
        className={premiumLeonixTone ? "scroll-mt-24" : "rounded-2xl border p-3 shadow-sm sm:p-6 md:p-8"}
        style={
          premiumLeonixTone
            ? undefined
            : { backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }
        }
        aria-labelledby="servicios-promociones-heading"
      >
        {premiumLeonixTone ? (
          <>
            <div className="max-w-2xl">
              <h2 id="servicios-promociones-heading" className="text-2xl font-bold tracking-tight text-[color:var(--lx-text)]">
                {copy.sectionTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
                {lang === "en" ? "Special offers and promotions from this business." : "Ofertas especiales y promociones de este negocio."}
              </p>
            </div>
            <div className={listClass}>
              {profile.promotions.map((p) => (
                <PromoInnerCard
                  key={p.id}
                  promo={p}
                  lang={lang}
                  compact={!premiumLeonixTone}
                  premiumLeonixTone={premiumLeonixTone}
                  onImageOpen={openLightbox}
                  listingSlug={listingSlug}
                  analyticsMeta={analyticsMeta}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <h2
              id="servicios-promociones-heading"
              className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl"
            >
              {copy.sectionTitle}
            </h2>
            <div className={listClass}>
              {profile.promotions.map((p) => (
                <div key={p.id} className={n > 1 ? "w-[min(100%,340px)] shrink-0 snap-start md:w-auto md:shrink" : ""}>
                  <PromoInnerCard
                    promo={p}
                    lang={lang}
                    compact={!premiumLeonixTone}
                    premiumLeonixTone={premiumLeonixTone}
                    onImageOpen={openLightbox}
                    listingSlug={listingSlug}
                    analyticsMeta={analyticsMeta}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
