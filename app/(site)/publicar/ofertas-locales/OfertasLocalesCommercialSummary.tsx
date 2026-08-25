"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { validateRevenuePromoForCheckout } from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { getOfertaLocalCommercialProductForDraft } from "@/app/lib/ofertas-locales/ofertasLocalesCommercial";
import {
  clearOfertaLocalPromoSession,
  loadOfertaLocalPromoSession,
  saveOfertaLocalPromoSession,
} from "@/app/lib/ofertas-locales/ofertasLocalesDraftPersistence";
import type { OfertaLocalDraft } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { ofertasLocalesAppCopy } from "./ofertasLocalesApplicationCopy";

type Props = {
  draft: OfertaLocalDraft;
  lang: OfertasLocalesAppLang;
};

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.max(0, cents) / 100);
}

export function OfertasLocalesCommercialSummary({ draft, lang }: Props) {
  const c = ofertasLocalesAppCopy(lang);
  const product = getOfertaLocalCommercialProductForDraft(draft);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(() =>
    draft.applicationSessionId ? loadOfertaLocalPromoSession(draft.applicationSessionId) : null
  );

  useEffect(() => {
    if (!draft.applicationSessionId) return;
    setApplied(loadOfertaLocalPromoSession(draft.applicationSessionId));
  }, [draft.applicationSessionId, product?.packageKey]);

  const baseCents = product?.amountCents ?? 0;
  const isFreeProduct = baseCents === 0;
  const totalCents = isFreeProduct ? 0 : applied?.totalCents ?? baseCents;

  const durationNote = useMemo(
    () => `${c.step7Duration} · ${c.step7AiIncludedNote}`,
    [c.step7AiIncludedNote, c.step7Duration]
  );

  const applyPromo = useCallback(async () => {
    if (!product || !input.trim() || busy) return;
    setBusy(true);
    setError(null);
    const result = await validateRevenuePromoForCheckout({
      code: input.trim(),
      category: "ofertas-locales",
      packageKey: product.packageKey,
      subtotalCents: product.amountCents,
      locale: lang,
    });
    setBusy(false);
    if (!result.ok) {
      setApplied(null);
      clearOfertaLocalPromoSession();
      setError(result.userMessage || c.step7PromoInvalid);
      return;
    }
    const next = {
      applicationSessionId: draft.applicationSessionId,
      code: result.code,
      discountCents: result.discountCents,
      totalCents: result.totalCents,
      discountLabel: result.discountLabel,
      packageKey: product.packageKey,
    };
    setApplied(next);
    saveOfertaLocalPromoSession(next);
  }, [busy, c.step7PromoInvalid, draft.applicationSessionId, input, lang, product]);

  const removePromo = useCallback(() => {
    setApplied(null);
    setError(null);
    setInput("");
    clearOfertaLocalPromoSession();
  }, []);

  if (!product) {
    return (
      <p className="text-xs text-[#1E1814]/55">
        {lang === "en" ? "Select a product in Step 1." : "Elige un producto en el Paso 1."}
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-[#7A1E2C]/30 bg-white px-4 py-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[#1E1814]/70">
        {c.step7CommercialTitle}
      </h3>
      <p className="mt-3 text-base font-semibold text-[#1E1814]">
        {lang === "en" ? product.labelEn : product.labelEs}
      </p>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[#1E1814]/70">{c.step7BasePrice}</span>
          <span className="text-lg font-bold text-[#7A1E2C]">
            {isFreeProduct ? c.priceFreeLabel : formatMoney(baseCents)}
          </span>
        </div>
        {!isFreeProduct && applied ? (
          <div className="flex items-baseline justify-between gap-3 text-emerald-900">
            <span>
              {applied.discountLabel || c.step7Discount}
            </span>
            <span className="font-semibold">-{formatMoney(applied.discountCents)}</span>
          </div>
        ) : null}
        {!isFreeProduct ? (
          <div className="flex items-baseline justify-between gap-3 border-t border-[#D4C4A8]/60 pt-2">
            <span className="font-semibold text-[#1E1814]">{c.step7Total}</span>
            <span className="text-lg font-bold text-[#1E1814]">{formatMoney(totalCents)}</span>
          </div>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-[#1E1814]/70">{durationNote}</p>

      {isFreeProduct ? (
        // Owner lock 2026-08-25 (Package 4): free community coupon publishing — no promo code
        // field, no payment step of any kind.
        <p className="mt-4 text-sm font-semibold text-emerald-900">{c.step7NoPaymentRequired}</p>
      ) : (
        <div className="mt-4 space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-[#1E1814]/70">
            {c.step7PromoCode}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={applied?.code ?? input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              disabled={busy || Boolean(applied)}
              autoComplete="off"
              spellCheck={false}
              className="min-h-11 w-full rounded-xl border border-[#D4C4A8]/90 bg-white px-3 py-2.5 text-sm uppercase text-[#1E1814] focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/25 disabled:opacity-60"
            />
            {applied ? (
              <button
                type="button"
                className="min-h-11 rounded-xl border border-[#D4C4A8] bg-white px-4 py-2.5 text-sm font-semibold text-[#1E1814] hover:border-[#7A1E2C]/40"
                onClick={removePromo}
              >
                {c.step7PromoRemove}
              </button>
            ) : (
              <button
                type="button"
                className="min-h-11 rounded-xl bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6a1926] disabled:cursor-not-allowed disabled:opacity-45"
                disabled={busy || !input.trim()}
                onClick={() => void applyPromo()}
              >
                {busy ? c.step7PromoApplying : c.step7PromoApply}
              </button>
            )}
          </div>
          {error ? (
            <p className="text-xs font-medium text-red-800" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
