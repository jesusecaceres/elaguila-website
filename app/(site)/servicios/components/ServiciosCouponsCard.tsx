"use client";

import { useCallback, useState } from "react";
import { FaTicketAlt } from "react-icons/fa";
import type { ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import type { ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";

type CouponRow = ServiciosProfileResolved["coupons"][number];

const CARD_BASE =
  "overflow-hidden rounded-2xl border border-[#D8C2A0] bg-[#FFFAF3] shadow-[0_4px_20px_-8px_rgba(212,165,116,0.14)]";

function CouponInnerCard({
  coupon,
  lang,
  onImageOpen,
  featuredRow,
}: {
  coupon: CouponRow;
  lang: ServiciosLang;
  onImageOpen: (src: string) => void;
  featuredRow?: boolean;
}) {
  const hasImage = Boolean(coupon.imageUrl);
  const priceLine =
    coupon.specialPrice?.trim() ||
    (coupon.regularPrice?.trim() && coupon.savings?.trim()
      ? `${coupon.regularPrice} → ${coupon.savings}`
      : coupon.regularPrice?.trim()) ||
    coupon.savings?.trim();

  return (
    <article className={`${CARD_BASE} group flex h-full flex-col`}>
      {hasImage && coupon.imageUrl ? (
        <div className={`relative w-full overflow-hidden bg-[#F5F0E8] ${featuredRow ? "aspect-[4/3]" : "aspect-[5/4]"}`}>
          <button
            type="button"
            onClick={() => onImageOpen(coupon.imageUrl!)}
            className="h-full w-full"
            aria-label={lang === "en" ? "View coupon image" : "Ver imagen del cupón"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coupon.imageUrl}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            />
          </button>
        </div>
      ) : (
        <div className={`relative w-full overflow-hidden bg-gradient-to-b from-[#F6EBDD] to-[#FFFAF3] ${featuredRow ? "aspect-[4/3]" : "aspect-[5/4]"}`}>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <FaTicketAlt className="text-3xl text-[#9A7329]/70" aria-hidden />
            <span className="text-xs font-semibold text-[#5A5148]">
              {lang === "en" ? "Leonix featured offer" : "Oferta destacada Leonix"}
            </span>
          </div>
        </div>
      )}
      <div className={`flex flex-1 flex-col ${featuredRow ? "p-4" : "p-3"}`}>
        {coupon.couponCode ? (
          <div className="mb-2 inline-flex w-fit rounded-full bg-[#F6EBDD] px-2.5 py-0.5 text-[10px] font-semibold text-[#1F1A17]">
            <span>{lang === "en" ? "Code:" : "Código:"}</span>
            <span className="ml-1 font-mono">{coupon.couponCode}</span>
          </div>
        ) : null}
        {coupon.title ? (
          <h3 className={`font-bold leading-snug text-[#1F1A17] ${featuredRow ? "line-clamp-2 text-base" : "line-clamp-1 text-sm"}`}>
            {coupon.title}
          </h3>
        ) : null}
        {priceLine ? (
          <p className="mt-1 text-sm font-semibold text-[#9A7329]">{priceLine}</p>
        ) : null}
        {coupon.description ? (
          <p className={`mt-1.5 text-[#5A5148] ${featuredRow ? "line-clamp-3 text-sm leading-relaxed" : "line-clamp-2 text-xs leading-snug"}`}>
            {coupon.description}
          </p>
        ) : null}
        {coupon.expirationDate ? (
          <p className="mt-2 text-[11px] text-[#8B7E70]">
            {lang === "en" ? "Valid until" : "Válido hasta"} {coupon.expirationDate}
          </p>
        ) : null}
        {coupon.redemptionNote ? (
          <p className="mt-1 line-clamp-2 text-[11px] text-[#5A5148]">{coupon.redemptionNote}</p>
        ) : null}
        {coupon.hrefSafe ? (
          <a
            href={coupon.hrefSafe}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto pt-3 text-xs font-semibold text-[#3B66AD] underline underline-offset-2"
          >
            {coupon.ctaLabel?.trim() || (lang === "en" ? "View offer" : "Ver oferta")}
          </a>
        ) : null}
      </div>
    </article>
  );
}

export function ServiciosCouponsCard({
  coupons,
  lang,
  couponFlyer,
  couponMoreOffers,
  featuredRow = false,
}: {
  coupons: CouponRow[];
  lang: ServiciosLang;
  couponFlyer?: { imageUrl: string };
  couponMoreOffers?: { url: string; buttonLabel?: string };
  /** Restaurante-style top highlight row (GATE-04) */
  featuredRow?: boolean;
}) {
  const L = getServiciosProfileLabels(lang);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const openLightbox = useCallback((src: string) => setLightboxSrc(src), []);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

  const validCoupons = coupons.filter(
    (c) =>
      c.title?.trim() ||
      c.description?.trim() ||
      c.imageUrl?.trim() ||
      c.couponCode?.trim() ||
      c.expirationDate?.trim() ||
      c.redemptionNote?.trim() ||
      c.hrefSafe?.trim(),
  );

  if (validCoupons.length === 0) return null;

  return (
    <>
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal
          onClick={closeLightbox}
        >
          <img
            src={lightboxSrc}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <section
        className={`scroll-mt-24 ${featuredRow ? "rounded-2xl border border-[#D8C2A0] bg-[#FFFAF3] p-4 shadow-[0_4px_20px_-8px_rgba(212,165,116,0.14)] sm:p-5" : ""}`}
        aria-labelledby="cupones-destacados-heading"
      >
        <div className={featuredRow ? "" : "max-w-2xl"}>
          <h2
            id="cupones-destacados-heading"
            className={`font-bold tracking-tight text-[#1E1810] ${featuredRow ? "text-lg md:text-xl" : "text-2xl"}`}
          >
            {L.featuredCouponsTitle}
          </h2>
          <p className={`leading-relaxed text-[#5C5346] ${featuredRow ? "mt-1 text-sm" : "mt-2 text-sm"}`}>
            {L.featuredCouponsSubtitle}
          </p>
        </div>
        <div className="-mx-1 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] md:hidden">
          {validCoupons.map((c, i) => (
            <div key={`coupon-${i}`} className="flex w-[min(82vw,280px)] shrink-0 snap-center flex-col">
              <CouponInnerCard coupon={c} lang={lang} onImageOpen={openLightbox} featuredRow={featuredRow} />
            </div>
          ))}
        </div>
        <div className={`hidden gap-3 md:grid ${featuredRow ? "mt-4 grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2 lg:grid-cols-4"}`}>
          {validCoupons.map((c, i) => (
            <CouponInnerCard
              key={`coupon-${i}`}
              coupon={c}
              lang={lang}
              onImageOpen={openLightbox}
              featuredRow={featuredRow}
            />
          ))}
        </div>
        {couponFlyer?.imageUrl ? (
          <div className="mt-6 flex justify-center">
            <a
              href={couponFlyer.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] items-center justify-center rounded-full border-2 border-[#C9B46A]/45 bg-[#FFFCF7] px-6 py-2.5 text-sm font-semibold text-[#1E1810] transition hover:bg-[#FFF6E7]"
            >
              {lang === "en" ? "View promotions flyer →" : "Ver flyer de promociones →"}
            </a>
          </div>
        ) : null}
        {couponMoreOffers?.url ? (
          <div className="mt-4 flex justify-center">
            <a
              href={couponMoreOffers.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] items-center justify-center rounded-full border-2 border-[#C9B46A]/45 bg-[#FFFCF7] px-6 py-2.5 text-sm font-semibold text-[#1E1810] transition hover:bg-[#FFF6E7]"
            >
              {(couponMoreOffers.buttonLabel || (lang === "en" ? "See more offers" : "Ver más ofertas")) + " →"}
            </a>
          </div>
        ) : null}
      </section>
    </>
  );
}
