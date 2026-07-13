"use client";

import Link from "next/link";

import { ofertaLocalPublicDetailPath } from "@/app/lib/ofertas-locales/ofertasLocalesPublicDetailHelpers";
import type { OfertaLocalPublicOfferCard } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";

import {
  isOfertaLocalCouponOfferType,
  ofertaLocalPublicOfferCardCta,
  ofertaLocalPublicOfferTypeLabel,
  ofertasLocalesPublicSearchCopy,
} from "./ofertasLocalesPublicSearchCopy";

const CARD_BASE =
  "group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#B8860B]/55 bg-gradient-to-b from-[#FFFCF7] to-[#F5EBD8] text-left shadow-sm transition-all hover:border-[#B8860B]/85 hover:shadow-[0_8px_28px_rgba(30,24,20,0.12)] focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/25";

const FLYER_IMAGE_FRAME =
  "relative flex w-full items-center justify-center overflow-hidden bg-[#FDF8F0] px-3 py-3 sm:px-4 sm:py-4";
const FLYER_IMAGE_AREA =
  "relative aspect-[3/4] w-full max-h-[min(48vh,360px)] sm:max-h-[280px]";
const COUPON_IMAGE_AREA =
  "relative aspect-[16/10] w-full max-h-[180px] sm:max-h-[160px]";

const BADGE =
  "inline-flex rounded-full border border-[#B8860B]/60 bg-[#FDF8F0] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8A6B1F] sm:text-[11px]";
const CTA =
  "inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-[#7A1E2C] px-3 py-2 text-sm font-semibold text-white shadow-sm transition group-hover:bg-[#6a1926] sm:min-h-11";

type Props = {
  lang: OfertasLocalesAppLang;
  offer: OfertaLocalPublicOfferCard;
  surface?: "ofertas" | "cupones";
  /** When provided on the Cupones surface, the card opens the coupon drawer instead of navigating. */
  onSelect?: (offer: OfertaLocalPublicOfferCard) => void;
};

function businessInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

function OfferPreviewImage({
  href,
  label,
  unavailableLabel,
  variant,
}: {
  href: string | null;
  label: string;
  unavailableLabel: string;
  variant: "flyer" | "coupon";
}) {
  const areaClass = variant === "flyer" ? FLYER_IMAGE_AREA : COUPON_IMAGE_AREA;

  return (
    <div className={FLYER_IMAGE_FRAME} data-testid="ofertas-offer-card-preview">
      <div className={areaClass}>
        {href ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={href}
            alt={label || unavailableLabel}
            className="h-full w-full object-contain object-center"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#D4C4A8]/80 bg-[#FAF6F0]/80 px-4 text-center">
            <span className="font-serif text-sm font-semibold text-[#8A6B1F]/90">{unavailableLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function OfferCardBody({
  lang,
  offer,
  surface,
  ctaLabel,
  couponLayout,
}: {
  lang: OfertasLocalesAppLang;
  offer: OfertaLocalPublicOfferCard;
  surface: "ofertas" | "cupones";
  ctaLabel: string;
  couponLayout: boolean;
}) {
  const c = ofertasLocalesPublicSearchCopy(lang, surface);
  const location = [offer.city, offer.state, offer.zipCode].filter(Boolean).join(", ");
  const dates =
    offer.validFrom && offer.validUntil
      ? `${offer.validFrom} – ${offer.validUntil}`
      : offer.validFrom || offer.validUntil;
  const typeLabel = ofertaLocalPublicOfferTypeLabel(lang, offer.offerType);
  const initial = businessInitial(offer.businessName);

  return (
    <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className={BADGE}>{typeLabel}</span>
        {offer.businessCategory ? (
          <span className="text-[10px] font-medium uppercase tracking-wide text-[#2A4536]/75 sm:text-[11px]">
            {offer.businessCategory}
          </span>
        ) : null}
      </div>

      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#B8860B]/50 bg-[#FDF8F0] font-serif text-base font-bold text-[#7A1E2C]"
          aria-hidden
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#1E1814]">{offer.businessName}</p>
          <p
            className={`mt-0.5 font-serif font-bold leading-snug text-[#2A4536] ${
              couponLayout ? "text-base sm:text-lg" : "line-clamp-2 text-sm sm:text-base"
            }`}
          >
            {offer.title}
          </p>
        </div>
      </div>

      {location ? <p className="mt-2 text-xs text-[#1E1814]/65">{location}</p> : null}
      {dates ? (
        <p className="mt-1 text-xs text-[#1E1814]/55">
          {c.validDates}: {dates}
        </p>
      ) : null}

      <div className="mt-auto pt-4">
        <span className={CTA}>{ctaLabel}</span>
      </div>
    </div>
  );
}

export function OfertasLocalesPublicOfferCard({ lang, offer, surface = "ofertas", onSelect }: Props) {
  const c = ofertasLocalesPublicSearchCopy(lang, surface);
  const couponLayout = surface === "cupones" || isOfertaLocalCouponOfferType(offer.offerType);
  const ctaLabel = ofertaLocalPublicOfferCardCta(lang, surface, offer.offerType);
  const previewVariant = couponLayout && !offer.primaryAssetHref ? "coupon" : couponLayout ? "coupon" : "flyer";

  const inner = (
    <>
      <OfferPreviewImage
        href={offer.primaryAssetHref}
        label={offer.primaryAssetLabel || offer.title}
        unavailableLabel={
          surface === "cupones"
            ? ("couponImageUnavailable" in c ? String(c.couponImageUnavailable) : c.flyerUnavailable)
            : c.flyerUnavailable
        }
        variant={previewVariant}
      />
      <OfferCardBody
        lang={lang}
        offer={offer}
        surface={surface}
        ctaLabel={ctaLabel}
        couponLayout={couponLayout}
      />
    </>
  );

  if (surface === "cupones" && onSelect) {
    return (
      <button
        type="button"
        className={CARD_BASE}
        data-testid="cupones-public-offer-card"
        onClick={() => onSelect(offer)}
        aria-label={`${ctaLabel}: ${offer.title}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      href={ofertaLocalPublicDetailPath(offer.id, lang)}
      className={CARD_BASE}
      data-testid="ofertas-public-offer-card"
    >
      {inner}
    </Link>
  );
}
