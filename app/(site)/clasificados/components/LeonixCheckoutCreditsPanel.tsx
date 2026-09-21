"use client";

/**
 * LEONIX IX REWARDS — the checkout redemption control.
 *
 * WHAT THIS CLOSES. The server side of redemption has been complete and proven for some time:
 * `/api/revenue-os/checkout` accepts `requestedCreditsCents`, plans it against the live balance
 * under the one `planRedemption` policy, holds it for 30 minutes, charges the reduced amount and
 * commits only once payment succeeds. What did not exist was the affordance — a place for the
 * customer to say how many credits to use. The dashboard panel even promises it: "you can apply
 * your credits at checkout." This is that promise, drawn.
 *
 * WHAT IT WILL NOT DO
 *  - It never decides the discount. Every figure here is a PREVIEW; the server re-plans under a
 *    row lock and its answer wins. If the two disagree the checkout aborts rather than charging a
 *    price no hold backs.
 *  - It never claims credits expire, because they do not.
 *  - It never shows a phantom discount. Until the customer's balance loads, the control renders a
 *    loading state and contributes nothing to the total.
 *
 * Mobile first: one column, 44px touch targets, the checkpoint's own colour constants.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import {
  REDEMPTION_MINIMUM_CENTS,
  REDEMPTION_RESERVATION_MINUTES,
  checkoutCreditsCopy,
  formatCreditsCents,
  maxRedeemableForPurchaseCents,
  recoveryBalanceCopy,
  redemptionRulesCopy,
} from "@/app/lib/rewards/rewardsPolicy";

type Lang = "es" | "en";

export type LeonixCheckoutCreditsPanelProps = {
  lang: Lang;
  /** The eligible purchase this checkout is for, in cents, AFTER any promo discount. */
  eligiblePurchaseCents: number;
  /** The amount actually due at the rail, in cents. Credits can never exceed it. */
  amountDueCents: number;
  /** Reported upward on every change so the checkout body can carry it. Never negative. */
  onRequestedCentsChange: (cents: number) => void;
  disabled?: boolean;
  /**
   * The amount this plan bills EVERY month, when it is a subscription; null for a one-time
   * purchase. Credits reach a monthly plan through a first-invoice-only Stripe coupon, so the
   * renewal price is unchanged — and a customer spending credits on a subscription needs that
   * said plainly, not inferred.
   */
  recurringAmountCents?: number | null;
  borderColor: string;
  textColor: string;
  mutedColor: string;
  successColor: string;
};

type WalletView = {
  availableCents: number;
  availableDisplay: string;
  recoveryCents: number;
  recoveryDisplay: string;
};

type PanelState = "loading" | "ready" | "signed_out" | "empty" | "error";

export default function LeonixCheckoutCreditsPanel({
  lang,
  eligiblePurchaseCents,
  amountDueCents,
  onRequestedCentsChange,
  disabled,
  recurringAmountCents = null,
  borderColor,
  textColor,
  mutedColor,
  successColor,
}: LeonixCheckoutCreditsPanelProps) {
  const [state, setState] = useState<PanelState>("loading");
  const [wallet, setWallet] = useState<WalletView | null>(null);
  const [input, setInput] = useState("");
  const [applied, setApplied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const t = useCallback((es: string, en: string) => (lang === "en" ? en : es), [lang]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sb = createSupabaseBrowserClient();
        const { data } = await sb.auth.getSession();
        const token = data.session?.access_token;
        // Not signed in is not an error: the control simply has nothing to offer, and the
        // checkout below it must stay completely unaffected.
        if (!token) {
          if (!cancelled) setState("signed_out");
          return;
        }
        const res = await fetch(`/api/rewards/wallet?lang=${lang}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; wallet?: Partial<WalletView> | null }
          | null;
        if (cancelled) return;
        if (!res.ok || !body?.ok) {
          setState("error");
          return;
        }
        const w = body.wallet;
        if (!w) {
          setState("empty");
          return;
        }
        const view: WalletView = {
          availableCents: Math.max(0, Number(w.availableCents ?? 0) || 0),
          availableDisplay: String(w.availableDisplay ?? formatCreditsCents(0)),
          recoveryCents: Math.max(0, Number(w.recoveryCents ?? 0) || 0),
          recoveryDisplay: String(w.recoveryDisplay ?? formatCreditsCents(0)),
        };
        setWallet(view);
        setState(view.availableCents <= 0 && view.recoveryCents <= 0 ? "empty" : "ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  /**
   * The ceiling, computed from the SAME pure policy the server enforces: at most half of the
   * eligible purchase, never more than the balance, never more than is due, and never so much
   * that the payment rail is left with less than its minimum charge.
   */
  const maxCents = useMemo(() => {
    if (!wallet) return 0;
    const half = maxRedeemableForPurchaseCents(eligiblePurchaseCents);
    return Math.max(0, Math.min(wallet.availableCents, half, amountDueCents));
  }, [wallet, eligiblePurchaseCents, amountDueCents]);

  const parsedCents = useMemo(() => {
    const raw = input.trim().replace(/[^0-9.]/g, "");
    if (!raw) return 0;
    const dollars = Number(raw);
    if (!Number.isFinite(dollars) || dollars < 0) return 0;
    return Math.floor(dollars * 100);
  }, [input]);

  const appliedCents = applied ? Math.min(parsedCents, maxCents) : 0;
  const remainingDueCents = Math.max(0, amountDueCents - appliedCents);
  const copy = checkoutCreditsCopy(lang, {
    availableCents: wallet?.availableCents ?? 0,
    maxRedeemableCents: maxCents,
    appliedCents,
    remainingDueCents,
  });

  useEffect(() => {
    onRequestedCentsChange(appliedCents);
  }, [appliedCents, onRequestedCentsChange]);

  const apply = useCallback(() => {
    if (parsedCents <= 0) {
      setMessage(t("Escribe cuántos créditos quieres usar.", "Enter how many credits to use."));
      return;
    }
    if (parsedCents < REDEMPTION_MINIMUM_CENTS) {
      setMessage(
        t(
          `El mínimo para usar créditos es ${formatCreditsCents(REDEMPTION_MINIMUM_CENTS)}.`,
          `The minimum you can apply is ${formatCreditsCents(REDEMPTION_MINIMUM_CENTS)}.`,
        ),
      );
      return;
    }
    if (maxCents < REDEMPTION_MINIMUM_CENTS) {
      setMessage(
        t(
          "Esta compra no permite usar créditos todavía.",
          "This purchase cannot take credits yet.",
        ),
      );
      return;
    }
    const capped = Math.min(parsedCents, maxCents);
    setApplied(true);
    setInput((capped / 100).toFixed(2));
    setMessage(
      capped < parsedCents
        ? t(
            `Ajustado al máximo para esta compra: ${formatCreditsCents(capped)}.`,
            `Adjusted to the maximum for this purchase: ${formatCreditsCents(capped)}.`,
          )
        : t(`Aplicamos ${formatCreditsCents(capped)}.`, `Applied ${formatCreditsCents(capped)}.`),
    );
  }, [parsedCents, maxCents, t]);

  const remove = useCallback(() => {
    setApplied(false);
    setInput("");
    setMessage(null);
  }, []);

  // Nothing to offer, and nothing to explain: render nothing at all rather than an empty box that
  // makes a customer wonder what they are missing.
  if (state === "signed_out") return null;

  return (
    <div
      className="mt-4 space-y-2 border-t pt-4"
      style={{ borderColor: `${borderColor}99` }}
      data-testid="leonix-checkout-credits"
    >
      <p className="text-xs font-semibold" style={{ color: textColor }}>
        {t("Créditos Leonix", "Leonix credits")}
      </p>

      {state === "loading" ? (
        <p className="text-xs" style={{ color: mutedColor }} role="status">
          {t("Consultando tus créditos…", "Checking your credits…")}
        </p>
      ) : null}

      {state === "error" ? (
        <p className="text-xs" style={{ color: "#8B3A3A" }} role="status">
          {t(
            "No pudimos consultar tus créditos. Puedes continuar y pagar el total.",
            "We could not check your credits. You can continue and pay the full amount.",
          )}
        </p>
      ) : null}

      {state === "empty" ? (
        <p className="text-xs" style={{ color: mutedColor }}>
          {t(
            "Todavía no tienes créditos para usar. Ganas 9% en cada compra elegible.",
            "You have no credits to use yet. You earn 9% back on every eligible purchase.",
          )}
        </p>
      ) : null}

      {state === "ready" && wallet && wallet.recoveryCents > 0 ? (
        <div className="space-y-1" data-testid="leonix-checkout-credits-recovery">
          <p className="text-xs font-semibold" style={{ color: textColor }}>
            {recoveryBalanceCopy(lang, { recoveryCents: wallet.recoveryCents }).heading}
          </p>
          <p className="text-xs" style={{ color: mutedColor }}>
            {recoveryBalanceCopy(lang, { recoveryCents: wallet.recoveryCents }).detail}
          </p>
        </div>
      ) : null}

      {state === "ready" && wallet && wallet.recoveryCents <= 0 ? (
        <>
          <p className="text-xs" style={{ color: mutedColor }}>
            {copy.available} · {copy.maximum}
          </p>

          {maxCents >= REDEMPTION_MINIMUM_CENTS ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <input
                id="leonix-checkout-credits-amount"
                inputMode="decimal"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={disabled || applied}
                placeholder={(maxCents / 100).toFixed(2)}
                aria-label={t("Créditos a usar", "Credits to use")}
                className="min-h-[44px] flex-1 rounded-xl border px-3 text-sm"
                style={{ borderColor, color: textColor }}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={applied ? remove : apply}
                disabled={disabled || (!applied && parsedCents <= 0)}
                className="min-h-[44px] rounded-xl border px-4 text-sm font-semibold disabled:opacity-50"
                style={{ borderColor, color: textColor, background: "#FFF" }}
              >
                {applied ? t("Quitar", "Remove") : t("Aplicar", "Apply")}
              </button>
            </div>
          ) : (
            <p className="text-xs" style={{ color: mutedColor }}>
              {t(
                `Necesitas al menos ${formatCreditsCents(REDEMPTION_MINIMUM_CENTS)} en créditos aplicables a esta compra.`,
                `You need at least ${formatCreditsCents(REDEMPTION_MINIMUM_CENTS)} in credits applicable to this purchase.`,
              )}
            </p>
          )}

          {message ? (
            <p className="text-xs" style={{ color: applied ? successColor : "#8B3A3A" }} role="status">
              {message}
            </p>
          ) : null}

          {applied ? (
            <p className="text-xs font-semibold" style={{ color: successColor }} data-testid="leonix-checkout-credits-applied">
              {copy.applied} · {copy.remainingDue}
            </p>
          ) : null}

          {recurringAmountCents !== null && recurringAmountCents > 0 ? (
            <p className="text-xs" style={{ color: mutedColor }}>
              {t(
                `Tus créditos se aplican solo a este primer pago. Tu plan sigue en ${formatCreditsCents(recurringAmountCents)} al mes.`,
                `Your credits apply to this first payment only. Your plan stays at ${formatCreditsCents(recurringAmountCents)} a month.`,
              )}
            </p>
          ) : null}

          <p className="text-xs" style={{ color: mutedColor }}>
            {t(
              `Reservamos tus créditos ${REDEMPTION_RESERVATION_MINUTES} minutos mientras pagas. Si no completas el pago, vuelven a tu cuenta.`,
              `We hold your credits for ${REDEMPTION_RESERVATION_MINUTES} minutes while you pay. If you do not finish, they go back to your account.`,
            )}
          </p>
          <p className="text-xs" style={{ color: mutedColor }}>
            {redemptionRulesCopy(lang)}
          </p>
        </>
      ) : null}
    </div>
  );
}
