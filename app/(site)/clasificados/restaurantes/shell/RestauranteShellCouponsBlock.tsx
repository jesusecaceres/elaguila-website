"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { ShellCoupon, ShellCouponFlyer, ShellCouponMoreOffers } from "./restaurantDetailShellTypes";
import { RestauranteShellInlineDataAssetButton } from "./RestauranteShellInlineDataAssetButton";

const CARD =
  "rounded-xl border border-[#D8C2A0] bg-white p-3 shadow-sm";

export function RestauranteShellCouponsBlock({
  coupons,
  couponFlyer,
  couponMoreOffers,
}: {
  coupons: ShellCoupon[];
  couponFlyer?: ShellCouponFlyer;
  couponMoreOffers?: ShellCouponMoreOffers;
}) {
  const [expanded, setExpanded] = useState(false);
  const n = coupons.length;

  const { visible, showExpand } = useMemo(() => {
    if (n === 0) {
      return { visible: [] as ShellCoupon[], showExpand: false };
    }
    if (n === 1 || n === 2 || n === 4) {
      return { visible: coupons, showExpand: false };
    }
    if (n === 3) {
      return {
        visible: expanded ? coupons : coupons.slice(0, 2),
        showExpand: true,
      };
    }
    return { visible: coupons, showExpand: false };
  }, [coupons, expanded, n]);

  if (!n && !couponFlyer && !couponMoreOffers) return null;

  return (
    <section aria-labelledby="cupones-destacados-heading" className="scroll-mt-24">
      <div className="max-w-2xl">
        <h2 id="cupones-destacados-heading" className="text-2xl font-bold tracking-tight text-[color:var(--lx-text)]">
          Cupones y ofertas
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
          Guarda o comparte estas ofertas antes de visitar.
        </p>
      </div>
      {/* Mobile snap-x layout */}
      <div className="-mx-4 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] md:hidden">
        {visible.map((coupon: ShellCoupon, idx: number) => (
          <article key={`${coupon.title}-${idx}`} className="flex w-[min(82vw,300px)] shrink-0 snap-center flex-col rounded-2xl border border-[#D8C2A0] bg-white p-3 shadow-sm">
            <div className="relative mb-2 aspect-[5/4] w-full overflow-hidden rounded-lg bg-[#F5F0E8]">
              {coupon.imageUrl ? (
                <Image
                  src={coupon.imageUrl}
                  alt={coupon.title}
                  fill
                  unoptimized={coupon.imageUrl.startsWith("data:")}
                  className="object-cover"
                  sizes="85vw"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <span className="text-4xl opacity-50" aria-hidden>
                    🎫
                  </span>
                  <span className="text-xs font-semibold text-[#5A5148]">Sin foto aún</span>
                </div>
              )}
              <span className="absolute right-2 top-2 inline-block rounded-full bg-[#F6EBDD] px-2 py-0.5 text-[10px] font-semibold text-[#1F1A17]">
                Cupón Leonix
              </span>
            </div>
            <div>
              {coupon.couponCode ? (
                <div className="mb-2 inline-block rounded-full bg-[#F6EBDD] px-2 py-0.5 text-[10px] font-semibold text-[#1F1A17]">
                  <span>Código: </span>
                  <span className="font-mono">{coupon.couponCode}</span>
                </div>
              ) : null}
              <h3 className="line-clamp-1 text-sm font-semibold text-[#1F1A17]">{coupon.title}</h3>
              {coupon.description?.trim() ? (
                <p className="line-clamp-2 mt-1 text-xs leading-snug text-[#5A5148]">{coupon.description}</p>
              ) : null}
              {coupon.expirationDate ? (
                <p className="mt-1 text-[10px] text-[#8B7E70]">
                  Válido hasta {coupon.expirationDate}
                </p>
              ) : null}
              {coupon.redemptionNote ? (
                <p className="line-clamp-1 mt-1 text-[10px] text-[#5A5148]">
                  {coupon.redemptionNote}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {/* Desktop grid layout */}
      <div className="hidden gap-3 md:grid md:grid-cols-2 lg:grid-cols-4">
        {visible.map((coupon: ShellCoupon, idx: number) => (
          <article key={`${coupon.title}-${idx}`} className={CARD}>
            <div className="relative mb-2 aspect-[5/4] w-full overflow-hidden rounded-lg bg-[#F5F0E8]">
              {coupon.imageUrl ? (
                <Image
                  src={coupon.imageUrl}
                  alt={coupon.title}
                  fill
                  unoptimized={coupon.imageUrl.startsWith("data:")}
                  className="object-cover"
                  sizes="(max-width:1024px) 50vw, 25vw"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <span className="text-4xl opacity-50" aria-hidden>
                    🎫
                  </span>
                  <span className="text-xs font-semibold text-[#5A5148]">Sin foto aún</span>
                </div>
              )}
              <span className="absolute right-2 top-2 inline-block rounded-full bg-[#F6EBDD] px-2 py-0.5 text-[10px] font-semibold text-[#1F1A17]">
                Cupón Leonix
              </span>
            </div>
            <div>
              {coupon.couponCode ? (
                <div className="mb-2 inline-block rounded-full bg-[#F6EBDD] px-2 py-0.5 text-[10px] font-semibold text-[#1F1A17]">
                  <span>Código: </span>
                  <span className="font-mono">{coupon.couponCode}</span>
                </div>
              ) : null}
              <h3 className="line-clamp-1 text-sm font-semibold text-[#1F1A17]">{coupon.title}</h3>
              {coupon.description?.trim() ? (
                <p className="line-clamp-2 mt-1 text-xs leading-snug text-[#5A5148]">{coupon.description}</p>
              ) : null}
              {coupon.expirationDate ? (
                <p className="mt-1 text-[10px] text-[#8B7E70]">
                  Válido hasta {coupon.expirationDate}
                </p>
              ) : null}
              {coupon.redemptionNote ? (
                <p className="line-clamp-1 mt-1 text-[10px] text-[#5A5148]">
                  {coupon.redemptionNote}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {showExpand ? (
        <div className="mt-6 flex justify-center sm:justify-start">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="min-h-[44px] rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] px-6 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
          >
            {expanded ? "Mostrar menos" : "Ver tercer cupón"}
          </button>
        </div>
      ) : null}
      {couponFlyer?.imageUrl ? (
        <div className="mt-6 flex justify-center">
          <RestauranteShellInlineDataAssetButton
            href={couponFlyer.imageUrl}
            label="Ver flyer de promociones →"
            className="flex min-h-[44px] items-center justify-center rounded-full border-2 border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-6 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-active)]"
          />
        </div>
      ) : null}
      {couponMoreOffers?.url ? (
        <div className="mt-4 flex justify-center">
          <RestauranteShellInlineDataAssetButton
            href={couponMoreOffers.url}
            label={`${couponMoreOffers.buttonLabel || "Ver más ofertas"} →`}
            className="flex min-h-[44px] items-center justify-center rounded-full border-2 border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-6 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-active)]"
          />
        </div>
      ) : null}
    </section>
  );
}
