"use client";

import { useCallback, useState } from "react";
import type { ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import type { ServiciosLang } from "../types/serviciosBusinessProfile";

type CouponRow = ServiciosProfileResolved["coupons"][number];

const CARD =
  "rounded-[20px] border border-[#E8D9C4] bg-[#FFFCF7] shadow-[0_8px_32px_-8px_rgba(42,36,22,0.1)]";

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
    <article className={`${CARD} group overflow-hidden p-0`}>
      {hasImage && coupon.imageUrl ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F5F0E8]">
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
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {lang === "en" ? "Cupón Leonix" : "Cupón Leonix"}
          </span>
        </div>
      ) : (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-[#F5F0E8] to-[#FFFCF7]">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <span className="text-4xl opacity-50" aria-hidden>
              🎫
            </span>
            <span className="text-xs font-semibold text-[#6B5420]">
              {lang === "en" ? "No photo yet" : "Sin foto aún"}
            </span>
          </div>
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {lang === "en" ? "Cupón Leonix" : "Cupón Leonix"}
          </span>
        </div>
      )}
      <div className="p-5 sm:p-6">
        {coupon.couponCode ? (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#F5F0E8] px-3 py-1 text-xs font-semibold text-[#1E1814]">
            <span>{lang === "en" ? "Code:" : "Código:"}</span>
            <span className="font-mono">{coupon.couponCode}</span>
          </div>
        ) : null}
        {coupon.title ? (
          <h3 className="text-lg font-bold text-[#1E1810]">{coupon.title}</h3>
        ) : null}
        {coupon.description ? (
          <p className="mt-2 text-sm leading-relaxed text-[#5C5346]">{coupon.description}</p>
        ) : null}
        {coupon.expirationDate ? (
          <p className="mt-2 text-xs text-[#6B5420]">
            {lang === "en" ? "Valid until" : "Válido hasta"} {coupon.expirationDate}
          </p>
        ) : null}
        {coupon.redemptionNote ? (
          <p className="mt-2 text-xs text-[#5C5346]">
            <span className="font-semibold">{lang === "en" ? "How to use:" : "Cómo usarlo:"} </span>
            {coupon.redemptionNote}
          </p>
        ) : null}
      </div>
      <div className="border-t border-[#E8D9C4]/60 bg-[#F5F0E8] px-5 py-2 text-[10px] font-medium text-[#6B5420]">
        {lang === "en" ? "Coupon published on Leonix" : "Cupón publicado en Leonix"}
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

  const gridClass =
    n === 1
      ? "mx-auto mt-6 max-w-lg grid grid-cols-1 gap-5"
      : "mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2";

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
        <div className={gridClass}>
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
