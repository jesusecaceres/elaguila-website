"use client";

import { useCallback, useState } from "react";
import { FaTag } from "react-icons/fa";
import type { ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import type { ServiciosLang } from "../types/serviciosBusinessProfile";
import { LX_SECTION_CARD, LX_SECTION_HEADING } from "./serviciosLeonixBrand";

type CouponRow = ServiciosProfileResolved["coupons"][number];

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
  const hasPricing = Boolean(coupon.regularPrice || coupon.specialPrice);
  const hasLink = Boolean(coupon.hrefSafe);

  return (
    <article className="relative overflow-hidden rounded-xl border-2 border-[#E8D9C4] bg-[#FFFDF7] p-5 shadow-sm transition hover:border-[#D4C4A8] hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        {hasImage && coupon.imageUrl ? (
          <div className="w-full shrink-0 sm:max-w-[44%] sm:min-w-[10.5rem] lg:min-w-[12.5rem]">
            <button
              type="button"
              onClick={() => onImageOpen(coupon.imageUrl!)}
              className="group relative aspect-[5/4] w-full min-h-[140px] overflow-hidden rounded-lg border-2 border-[#D4C4A8] bg-[#F5F0E8] shadow-inner sm:min-h-[160px]"
              aria-label={lang === "en" ? "View coupon image" : "Ver imagen del cupón"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coupon.imageUrl}
                alt=""
                className="h-full w-full object-cover transition group-hover:scale-[1.02] group-hover:opacity-95"
              />
            </button>
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <span className="mb-2 inline-flex w-fit items-center rounded-md border border-[#D4C4A8] bg-[#F5F0E8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1E1814]">
            {lang === "en" ? "COUPON" : "CUPÓN"}
          </span>

          {coupon.title ? (
            <h3 className={LX_SECTION_HEADING + " leading-snug"}>{coupon.title}</h3>
          ) : null}

          {coupon.description ? (
            <p className="mt-2.5 text-sm leading-relaxed text-[#4A4A4A] sm:text-base">
              {coupon.description}
            </p>
          ) : null}

          {hasPricing ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {coupon.regularPrice ? (
                <span className="text-sm text-[#6B5420] line-through">
                  {coupon.regularPrice}
                </span>
              ) : null}
              {coupon.specialPrice ? (
                <span className="text-lg font-bold text-[#C9782F]">
                  {coupon.specialPrice}
                </span>
              ) : null}
              {coupon.savings ? (
                <span className="rounded-full bg-[#FFF3DC] px-2 py-0.5 text-xs font-semibold text-[#6B5420]">
                  {lang === "en" ? "Save" : "Ahorra"} {coupon.savings}
                </span>
              ) : null}
            </div>
          ) : null}

          {coupon.couponCode ? (
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-xs font-semibold text-[#6B5420]">
                {lang === "en" ? "Code:" : "Código:"}
              </span>
              <code className="rounded border border-[#D4C4A8] bg-[#F5F0E8] px-2 py-0.5 text-xs font-mono text-[#1E1814]">
                {coupon.couponCode}
              </code>
            </div>
          ) : null}

          {coupon.expirationDate ? (
            <p className="mt-2 text-xs text-[#6B5420]">
              {lang === "en" ? "Expires:" : "Expira:"} {coupon.expirationDate}
            </p>
          ) : null}

          {coupon.redemptionNote ? (
            <p className="mt-2 text-xs text-[#6B5420] italic">
              {coupon.redemptionNote}
            </p>
          ) : null}

          {hasLink ? (
            <div className="mt-4 border-t border-[#E8D9C4] pt-4">
              <a
                href={coupon.hrefSafe}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border-0 px-4 py-2.5 text-sm font-bold text-[#FFFCF7] shadow-sm transition hover:brightness-[1.05]"
                style={{ backgroundColor: "#8B2A3D" }}
              >
                {coupon.ctaLabel || (lang === "en" ? "Get coupon" : "Obtener cupón")}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ServiciosCouponsCard({
  coupons,
  lang,
}: {
  coupons: CouponRow[];
  lang: ServiciosLang;
}) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const openLightbox = useCallback((src: string) => setLightboxSrc(src), []);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

  const validCoupons = coupons.filter((c) => c.title || c.description || c.imageUrl);

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
      <section className={LX_SECTION_CARD + " p-4 sm:p-6 lg:p-7"}>
        <h2 className={LX_SECTION_HEADING}>
          {lang === "en" ? "Featured Coupons" : "Cupones Destacados"}
        </h2>
        <div className="mt-5 flex flex-col gap-4">
          {validCoupons.map((c, i) => (
            <CouponInnerCard
              key={`coupon-${i}`}
              coupon={c}
              lang={lang}
              onImageOpen={openLightbox}
            />
          ))}
        </div>
      </section>
    </>
  );
}
