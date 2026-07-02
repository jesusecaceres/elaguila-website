"use client";

import { useCallback, useState } from "react";
import type { ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import type { ServiciosLang } from "../types/serviciosBusinessProfile";

type CouponRow = ServiciosProfileResolved["coupons"][number];

const CARD =
  "rounded-xl border border-[#D8C2A0] bg-white p-3 shadow-sm";

function CouponInnerCard({
  coupon,
  lang,
  onImageOpen,
}: {
  coupon: CouponRow;
  lang: ServiciosLang;
  onImageOpen: (src: string) => void;
}) {
  const hasImage = Boolean(coupon.imageUrl);

  return (
    <article className={`${CARD} group overflow-hidden`}>
      {hasImage && coupon.imageUrl ? (
        <div className="relative mb-2 aspect-[5/4] w-full overflow-hidden rounded-lg bg-[#F5F0E8]">
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
          <span className="absolute right-2 top-2 inline-block rounded-full bg-[#F6EBDD] px-2 py-0.5 text-[10px] font-semibold text-[#1F1A17]">
            Cupón Leonix
          </span>
        </div>
      ) : (
        <div className="relative mb-2 aspect-[5/4] w-full overflow-hidden rounded-lg bg-[#F5F0E8]">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <span className="text-4xl opacity-50" aria-hidden>
              🎫
            </span>
            <span className="text-xs font-semibold text-[#5A5148]">
              {lang === "en" ? "No photo yet" : "Sin foto aún"}
            </span>
          </div>
          <span className="absolute right-2 top-2 inline-block rounded-full bg-[#F6EBDD] px-2 py-0.5 text-[10px] font-semibold text-[#1F1A17]">
            Cupón Leonix
          </span>
        </div>
      )}
      <div>
        {coupon.couponCode ? (
          <div className="mb-2 inline-block rounded-full bg-[#F6EBDD] px-2 py-0.5 text-[10px] font-semibold text-[#1F1A17]">
            <span>{lang === "en" ? "Code:" : "Código:"}</span>
            <span className="font-mono">{coupon.couponCode}</span>
          </div>
        ) : null}
        {coupon.title ? (
          <h3 className="line-clamp-1 text-sm font-semibold text-[#1F1A17]">{coupon.title}</h3>
        ) : null}
        {coupon.description ? (
          <p className="line-clamp-2 mt-1 text-xs leading-snug text-[#5A5148]">{coupon.description}</p>
        ) : null}
        {coupon.expirationDate ? (
          <p className="mt-1 text-[10px] text-[#8B7E70]">
            {lang === "en" ? "Valid until" : "Válido hasta"} {coupon.expirationDate}
          </p>
        ) : null}
        {coupon.redemptionNote ? (
          <p className="line-clamp-1 mt-1 text-[10px] text-[#5A5148]">
            {coupon.redemptionNote}
          </p>
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
}: {
  coupons: CouponRow[];
  lang: ServiciosLang;
  couponFlyer?: { imageUrl: string };
  couponMoreOffers?: { url: string; buttonLabel?: string };
}) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const openLightbox = useCallback((src: string) => setLightboxSrc(src), []);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

  const validCoupons = coupons.filter((c) => c.title || c.description || c.imageUrl);
  const n = validCoupons.length;

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
      <section className="scroll-mt-24" aria-labelledby="cupones-destacados-heading">
        <div className="max-w-2xl">
          <h2 id="cupones-destacados-heading" className="text-2xl font-bold tracking-tight text-[#1E1810]">
            {lang === "en" ? "Coupons and offers" : "Cupones y ofertas"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5C5346]">
            {lang === "en" ? "Save or share these offers before visiting." : "Guarda o comparte estas ofertas antes de visitar."}
          </p>
        </div>
        {/* Mobile snap-x layout */}
        <div className="-mx-4 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] md:hidden">
          {validCoupons.map((c, i) => (
            <div key={`coupon-${i}`} className="flex w-[min(82vw,300px)] shrink-0 snap-center flex-col">
              <CouponInnerCard
                coupon={c}
                lang={lang}
                onImageOpen={openLightbox}
              />
            </div>
          ))}
        </div>
        {/* Desktop grid layout */}
        <div className="hidden gap-3 md:grid md:grid-cols-2 lg:grid-cols-4">
          {validCoupons.map((c, i) => (
            <CouponInnerCard
              key={`coupon-${i}`}
              coupon={c}
              lang={lang}
              onImageOpen={openLightbox}
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
              {lang === "en" ? "Ver flyer de promociones →" : "Ver flyer de promociones →"}
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
              {(couponMoreOffers.buttonLabel || (lang === "en" ? "Ver más ofertas" : "Ver más ofertas")) + " →"}
            </a>
          </div>
        ) : null}
      </section>
    </>
  );
}
