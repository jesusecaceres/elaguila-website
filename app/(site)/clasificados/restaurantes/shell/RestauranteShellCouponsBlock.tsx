"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { ShellCoupon, ShellCouponFlyer, ShellCouponMoreOffers } from "./restaurantDetailShellTypes";
import { RestauranteShellInlineDataAssetButton } from "./RestauranteShellInlineDataAssetButton";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-[0_8px_32px_-8px_rgba(42,36,22,0.1)]";

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

  const gridClass =
    n === 1
      ? "mx-auto mt-6 max-w-lg grid grid-cols-1 gap-5"
      : "mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2";

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
      <div className={gridClass}>
        {visible.map((coupon: ShellCoupon, idx: number) => (
          <article key={`${coupon.title}-${idx}`} className={`${CARD} group overflow-hidden p-0`}>
            {coupon.imageUrl ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[color:var(--lx-section)]">
                <Image
                  src={coupon.imageUrl}
                  alt={coupon.title}
                  fill
                  unoptimized={coupon.imageUrl.startsWith("data:")}
                  className="object-contain transition duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width:640px) 100vw, 50vw"
                />
                <span className="absolute right-3 top-3 rounded-full bg-[color:var(--lx-gold)] px-2.5 py-1 text-[11px] font-semibold text-white">
                  Cupón Leonix
                </span>
              </div>
            ) : null}
            <div className="p-5 sm:p-6">
              {coupon.couponCode ? (
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--lx-section)] px-3 py-1 text-xs font-semibold text-[color:var(--lx-text)]">
                  <span>Código:</span>
                  <span className="font-mono">{coupon.couponCode}</span>
                </div>
              ) : null}
              <h3 className="text-lg font-bold text-[color:var(--lx-text)]">{coupon.title}</h3>
              {coupon.description?.trim() ? (
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{coupon.description}</p>
              ) : null}
              {coupon.expirationDate ? (
                <p className="mt-2 text-xs text-[color:var(--lx-muted)]">
                  Válido hasta {coupon.expirationDate}
                </p>
              ) : null}
              {coupon.redemptionNote ? (
                <p className="mt-2 text-xs text-[color:var(--lx-text-2)]">
                  <span className="font-semibold">Cómo usarlo:</span> {coupon.redemptionNote}
                </p>
              ) : null}
              {coupon.url ? (
                <div className="mt-4">
                  <RestauranteShellInlineDataAssetButton
                    href={coupon.url}
                    label={`${coupon.ctaLabel || "Ver oferta"} →`}
                    className="flex w-full min-h-[44px] items-center justify-center rounded-full border-2 border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-active)]"
                  />
                </div>
              ) : null}
            </div>
            <div className="border-t border-[color:var(--lx-nav-border)]/60 bg-[color:var(--lx-section)] px-5 py-2 text-[10px] font-medium text-[color:var(--lx-muted)]">
              Cupón publicado en Leonix
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
        <div className="mt-6 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4">
          <p className="text-xs font-semibold text-[color:var(--lx-text-2)]">Flyer de promociones</p>
          <div className="mt-3 relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-[color:var(--lx-section)]">
            <Image
              src={couponFlyer.imageUrl}
              alt="Flyer de promociones"
              fill
              unoptimized={couponFlyer.imageUrl.startsWith("data:")}
              className="object-contain"
              sizes="(max-width:640px) 100vw, 640px"
            />
          </div>
        </div>
      ) : null}
      {couponMoreOffers?.url ? (
        <div className="mt-4">
          <RestauranteShellInlineDataAssetButton
            href={couponMoreOffers.url}
            label={`${couponMoreOffers.buttonLabel || "Ver más cupones"} →`}
            className="flex w-full min-h-[44px] items-center justify-center rounded-full border-2 border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] px-6 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
          />
        </div>
      ) : null}
    </section>
  );
}
