"use client";

/**
 * Shared Revenue OS promo code field for non-checkpoint category checkout surfaces.
 * Gate WEBSITE-LAUNCH-25-CHECKOUT-REDEMPTION-WIRING-01
 *
 * Server-side is the source of truth: this field previews eligibility via
 * POST /api/revenue-os/promo/validate and forwards the applied code to
 * startRevenueCategoryCheckout, which revalidates before creating the Stripe session.
 * No placement / ranking / verification / entitlement claims. Redemption is webhook-only.
 */

import { useState } from "react";
import { validateRevenuePromoForCheckout } from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";

export type RevenuePromoFieldProps = {
  category: string;
  packageKey: string;
  subtotalCents: number;
  lang: "es" | "en";
  disabled?: boolean;
  listingId?: string | null;
  customerEmail?: string | null;
  /** Reports the currently applied (server-validated) code, or null when cleared/invalid. */
  onAppliedChange: (code: string | null, discountCents: number | null) => void;
  className?: string;
};

function money(cents: number, lang: "es" | "en"): string {
  return new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.max(0, cents) / 100);
}

export function RevenuePromoField({
  category,
  packageKey,
  subtotalCents,
  lang,
  disabled = false,
  listingId,
  customerEmail,
  onAppliedChange,
  className = "",
}: RevenuePromoFieldProps) {
  const [input, setInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountCents, setDiscountCents] = useState<number | null>(null);
  const [totalCents, setTotalCents] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const invalidCopy =
    lang === "es" ? "Este código no aplica a este pago." : "This code does not apply to this checkout.";

  const apply = async () => {
    const code = input.trim();
    if (!code || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await validateRevenuePromoForCheckout({
        code,
        category,
        packageKey,
        subtotalCents,
        listingId,
        customerEmail,
        locale: lang,
      });
      if (!result.ok) {
        setAppliedCode(null);
        setDiscountCents(null);
        setTotalCents(null);
        setError(result.userMessage || invalidCopy);
        onAppliedChange(null, null);
        return;
      }
      setAppliedCode(result.code);
      setDiscountCents(result.discountCents);
      setTotalCents(result.totalCents);
      setMessage(
        lang === "es"
          ? `${result.discountLabel} aplicado.`
          : `${result.discountLabel} applied.`,
      );
      onAppliedChange(result.code, result.discountCents);
    } catch {
      setAppliedCode(null);
      setDiscountCents(null);
      setTotalCents(null);
      setError(invalidCopy);
      onAppliedChange(null, null);
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setAppliedCode(null);
    setDiscountCents(null);
    setTotalCents(null);
    setMessage(null);
    setError(null);
    setInput("");
    onAppliedChange(null, null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-xs font-semibold text-[color:var(--lx-text,#2A2826)]">
        {lang === "es" ? "Código promocional" : "Promo code"}
      </label>
      <p className="text-[11px] leading-relaxed text-[color:var(--lx-muted,#7A7164)]">
        {lang === "es"
          ? "Usa tu código Leonix Launch 25 si aplica a este pago."
          : "Use your Leonix Launch 25 code if it applies to this checkout."}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          disabled={disabled || busy || Boolean(appliedCode)}
          className="min-h-[44px] flex-1 rounded-xl border border-black/15 px-3 text-sm uppercase"
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
        />
        {appliedCode ? (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={clear}
            className="min-h-[44px] rounded-xl border border-black/15 bg-white px-4 text-sm font-semibold disabled:opacity-50"
          >
            {lang === "es" ? "Quitar" : "Remove"}
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled || busy || !input.trim()}
            onClick={() => void apply()}
            className="min-h-[44px] rounded-xl border border-black/15 bg-white px-4 text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "…" : lang === "es" ? "Aplicar" : "Apply"}
          </button>
        )}
      </div>
      {appliedCode && discountCents != null ? (
        <p className="text-xs text-[#1A4D2E]" role="status">
          {message ? `${message} ` : ""}
          {lang === "es" ? "Descuento" : "Discount"}: −{money(discountCents, lang)}
          {totalCents != null
            ? ` · ${lang === "es" ? "Total" : "Total"}: ${money(totalCents, lang)}`
            : ""}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-[#8B3A3A]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
