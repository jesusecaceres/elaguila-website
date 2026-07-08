"use client";

/**
 * Leonix shared Publish Checkout Checkpoint UI.
 * Gate PUBLISH-CHECKOUT-CHECKPOINT-STANDARD-01
 *
 * Preview is never blocked by this component. Final action requires confirmations.
 * No Stripe secrets, no payment activation, no fake promo/newsletter claims.
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  formatPublishCheckpointMoney,
  isRestaurantCouponCheckoutBlocked,
  publishCheckpointBlockReason,
  resolvePublishCheckoutCheckpoint,
  type PublishCheckpointConfig,
  type PublishCheckpointLanguage,
} from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import {
  publishCheckpointAddOnsTitle,
  publishCheckpointConfirmationsHelper,
  publishCheckpointConfirmationsTitle,
  publishCheckpointGenericError,
  publishCheckpointLoadingCheckout,
  publishCheckpointLoadingPublish,
  publishCheckpointPlanSummaryTitle,
  publishCheckpointPromoDeferredLabel,
  publishCheckpointTotalMonthlyLabel,
} from "@/app/lib/listingPlans/publishCheckoutCopy";

const LEONIX_CREAM = "#FFFAF3";
const LEONIX_BORDER = "#D8C2A0";
const LEONIX_GOLD = "#BEA98E";
const LEONIX_CHARCOAL = "#1F1A17";
const LEONIX_MUTED = "#5A5148";
const LEONIX_BURGUNDY = "#6B1E2E";
const LEONIX_BURGUNDY_HOVER = "#541724";
const LEONIX_SUCCESS = "#1A4D2E";

export type PublishCheckoutCheckpointProps = {
  config: PublishCheckpointConfig;
  lang: PublishCheckpointLanguage;
  busy?: boolean;
  errorMessage?: string | null;
  /** When false, final checkout stays disabled (e.g. draft incomplete). Default true. */
  draftReady?: boolean;
  draftReadyMessage?: string | null;
  /** When omitted, promo field is hidden (deferred — no fake Apply). */
  onPromoApply?: (code: string) => Promise<{ ok: boolean; discountCents?: number; message?: string }>;
  onCheckout?: (ctx: {
    newsletterOptIn: boolean;
    promoCode: string | null;
    checkedConfirmationIds: string[];
  }) => void | Promise<void>;
  onFreePublish?: (ctx: {
    newsletterOptIn: boolean;
    checkedConfirmationIds: string[];
  }) => void | Promise<void>;
  /** When set, shown as CTA when Restaurante coupon add-on blocks checkout. */
  editHref?: string;
  /** Optional "Ver reglas de Leonix" modal shown above confirmations (opt-in per category). */
  rulesModal?: {
    triggerLabelEn?: string;
    triggerLabelEs?: string;
    titleEn: string;
    titleEs: string;
    bulletsEn: string[];
    bulletsEs: string[];
  };
  className?: string;
  id?: string;
};

export function PublishCheckoutCheckpoint({
  config,
  lang,
  busy = false,
  errorMessage,
  draftReady = true,
  draftReadyMessage,
  onPromoApply,
  onCheckout,
  onFreePublish,
  editHref,
  rulesModal,
  className = "",
  id = "publish-checkout-checkpoint",
}: PublishCheckoutCheckpointProps) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoDiscountCents, setPromoDiscountCents] = useState<number | null>(null);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);

  const resolved = useMemo(
    () =>
      resolvePublishCheckoutCheckpoint(config, {
        checkedConfirmationIds: checkedIds,
        newsletterOptIn,
        promoCode: appliedPromoCode,
        promoDiscountCents,
        promoUiEnabled: Boolean(onPromoApply),
      }),
    [config, checkedIds, newsletterOptIn, appliedPromoCode, promoDiscountCents, onPromoApply],
  );

  const requiredRemaining = resolved.confirmations.filter((c) => c.required && !checkedIds.has(c.id)).length;
  const blockReason = publishCheckpointBlockReason(resolved);
  const draftBlockMessage = !draftReady ? draftReadyMessage?.trim() || null : null;
  const showPromoDeferred = config.promoEligible && !onPromoApply;
  const finalButtonEnabled = resolved.finalActionEnabled && draftReady && !busy;
  const restaurantCouponBlocked = isRestaurantCouponCheckoutBlocked(config);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.debug("[publish-checkout-checkpoint]", {
      draftReady,
      finalActionEnabled: resolved.finalActionEnabled,
      finalButtonEnabled,
      blocked: resolved.blocked,
      blockReason,
      requiredRemaining,
      restaurantOffersAddonSelected: config.restaurantOffersAddonSelected,
      appliedPromoCode,
    });
  }, [
    draftReady,
    resolved.finalActionEnabled,
    resolved.blocked,
    finalButtonEnabled,
    blockReason,
    requiredRemaining,
    config.restaurantOffersAddonSelected,
    appliedPromoCode,
  ]);

  const toggleConfirmation = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePromoApply = async () => {
    if (!onPromoApply || !promoInput.trim()) return;
    setPromoBusy(true);
    setPromoMessage(null);
    try {
      const result = await onPromoApply(promoInput.trim());
      if (result.ok) {
        setAppliedPromoCode(promoInput.trim());
        setPromoDiscountCents(result.discountCents ?? null);
        setPromoMessage(result.message ?? null);
      } else {
        setAppliedPromoCode(null);
        setPromoDiscountCents(null);
        setPromoMessage(result.message ?? publishCheckpointGenericError(lang));
      }
    } catch {
      setAppliedPromoCode(null);
      setPromoDiscountCents(null);
      setPromoMessage(publishCheckpointGenericError(lang));
    } finally {
      setPromoBusy(false);
    }
  };

  const handleFinalAction = () => {
    if (!finalButtonEnabled) return;
    const ctx = {
      newsletterOptIn,
      promoCode: appliedPromoCode,
      checkedConfirmationIds: [...checkedIds],
    };
    if (resolved.mode === "checkout") {
      void onCheckout?.(ctx);
    } else {
      void onFreePublish?.(ctx);
    }
  };

  const loadingLabel =
    resolved.mode === "checkout"
      ? publishCheckpointLoadingCheckout(lang)
      : publishCheckpointLoadingPublish(lang);

  return (
    <section
      id={id}
      className={`rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 ${className}`}
      style={{ background: LEONIX_CREAM, borderColor: LEONIX_BORDER }}
    >
      {/* Plan summary */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: LEONIX_GOLD }}>
          {publishCheckpointPlanSummaryTitle(lang)}
        </p>
        <ul className="mt-3 space-y-2">
          {resolved.lineItems.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium" style={{ color: LEONIX_CHARCOAL }}>
                  {lang === "es" ? item.labelEs : item.labelEn}
                </p>
                {item.detailEn || item.detailEs ? (
                  <p className="mt-0.5 text-xs" style={{ color: LEONIX_MUTED }}>
                    {lang === "es" ? item.detailEs : item.detailEn}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 font-semibold tabular-nums" style={{ color: LEONIX_CHARCOAL }}>
                {formatPublishCheckpointMoney(item.priceCents, lang, { monthly: true })}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Add-ons */}
      {resolved.addOns.length > 0 ? (
        <div className="mt-4 border-t pt-4" style={{ borderColor: `${LEONIX_BORDER}99` }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: LEONIX_GOLD }}>
            {publishCheckpointAddOnsTitle(lang)}
          </p>
          <ul className="mt-2 space-y-2">
            {resolved.addOns.map((addon) => (
              <li key={addon.id} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium" style={{ color: LEONIX_CHARCOAL }}>
                    {lang === "es" ? addon.labelEs : addon.labelEn}
                    {!addon.selected && addon.priceCents > 0 ? (
                      <span className="ml-1 text-xs font-normal" style={{ color: LEONIX_MUTED }}>
                        ({lang === "es" ? "no incluido" : "not included"})
                      </span>
                    ) : null}
                  </p>
                  {addon.detailEn || addon.detailEs ? (
                    <p className="mt-0.5 text-xs" style={{ color: LEONIX_MUTED }}>
                      {lang === "es" ? addon.detailEs : addon.detailEn}
                    </p>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 font-semibold tabular-nums ${addon.selected ? "" : "opacity-60"}`}
                  style={{ color: LEONIX_CHARCOAL }}
                >
                  {formatPublishCheckpointMoney(addon.priceCents, lang, {
                    isAddOn: true,
                    monthly: true,
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Promo — enabled categories with real server validation */}
      {config.promoEligible && onPromoApply ? (
        <div className="mt-4 space-y-2 border-t pt-4" style={{ borderColor: `${LEONIX_BORDER}99` }}>
          <label className="block text-xs font-semibold" style={{ color: LEONIX_CHARCOAL }}>
            {lang === "es" ? "Código promocional" : "Promo code"}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              disabled={busy || promoBusy || Boolean(appliedPromoCode)}
              className="min-h-[44px] flex-1 rounded-xl border px-3 text-sm uppercase"
              style={{ borderColor: LEONIX_BORDER, color: LEONIX_CHARCOAL }}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              disabled={busy || promoBusy || !promoInput.trim() || Boolean(appliedPromoCode)}
              onClick={() => void handlePromoApply()}
              className="min-h-[44px] rounded-xl border px-4 text-sm font-semibold disabled:opacity-50"
              style={{ borderColor: LEONIX_BORDER, color: LEONIX_CHARCOAL, background: "#FFF" }}
            >
              {promoBusy ? "…" : lang === "es" ? "Aplicar" : "Apply"}
            </button>
            {appliedPromoCode ? (
              <button
                type="button"
                disabled={busy || promoBusy}
                onClick={() => {
                  setAppliedPromoCode(null);
                  setPromoDiscountCents(null);
                  setPromoMessage(null);
                  setPromoInput("");
                }}
                className="min-h-[44px] rounded-xl border px-4 text-sm font-semibold"
                style={{ borderColor: LEONIX_BORDER, color: LEONIX_CHARCOAL, background: "#FFF" }}
              >
                {lang === "es" ? "Quitar" : "Remove"}
              </button>
            ) : null}
          </div>
          {promoMessage ? (
            <p className="text-xs" style={{ color: appliedPromoCode ? LEONIX_SUCCESS : "#8B3A3A" }} role="status">
              {promoMessage}
            </p>
          ) : null}
        </div>
      ) : showPromoDeferred ? (
        <p className="mt-4 text-xs leading-relaxed" style={{ color: LEONIX_MUTED }}>
          {publishCheckpointPromoDeferredLabel(lang)}
        </p>
      ) : null}

      {/* Total */}
      <div
        className="mt-4 flex items-center justify-between border-t pt-3 text-sm font-bold"
        style={{ borderColor: `${LEONIX_BORDER}99`, color: LEONIX_CHARCOAL }}
      >
        <span>{publishCheckpointTotalMonthlyLabel(lang)}</span>
        <span className="tabular-nums">{resolved.monthlyTotalLabel}</span>
      </div>

      {resolved.discountCents > 0 ? (
        <p className="mt-1 text-xs" style={{ color: LEONIX_SUCCESS }}>
          {lang === "es" ? "Descuento promocional" : "Promo discount"}:{" "}
          {formatPublishCheckpointMoney(resolved.discountCents, lang, { monthly: false })}
          {appliedPromoCode ? ` (${appliedPromoCode})` : ""}
        </p>
      ) : null}

      {/* Newsletter opt-in — optional, never blocks */}
      {resolved.newsletterOptIn ? (
        <label className="mt-4 flex min-h-[44px] cursor-pointer items-start gap-3 text-xs leading-relaxed">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 rounded"
            style={{ accentColor: LEONIX_BURGUNDY }}
            checked={newsletterOptIn}
            onChange={(e) => setNewsletterOptIn(e.target.checked)}
            disabled={busy}
          />
          <span style={{ color: LEONIX_MUTED }}>
            {lang === "es" ? resolved.newsletterOptIn.labelEs : resolved.newsletterOptIn.labelEn}
          </span>
        </label>
      ) : null}

      {/* Required confirmations */}
      <div className="mt-5 space-y-2 border-t pt-4" style={{ borderColor: `${LEONIX_BORDER}99` }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold" style={{ color: LEONIX_CHARCOAL }}>
            {publishCheckpointConfirmationsTitle(lang)}
          </p>
          {rulesModal ? (
            <button
              type="button"
              onClick={() => setRulesOpen(true)}
              className="text-xs font-semibold underline underline-offset-2"
              style={{ color: LEONIX_BURGUNDY }}
            >
              {lang === "es"
                ? rulesModal.triggerLabelEs ?? "Ver reglas de Leonix"
                : rulesModal.triggerLabelEn ?? "See Leonix rules"}
            </button>
          ) : null}
        </div>
        {resolved.confirmations.map((c) => (
          <label
            key={c.id}
            className="flex min-h-[44px] cursor-pointer items-start gap-3 text-xs leading-relaxed"
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded"
              style={{ accentColor: LEONIX_BURGUNDY }}
              checked={checkedIds.has(c.id)}
              onChange={() => toggleConfirmation(c.id)}
              disabled={busy}
            />
            <span style={{ color: LEONIX_MUTED }}>{lang === "es" ? c.labelEs : c.labelEn}</span>
          </label>
        ))}
        {requiredRemaining > 0 ? (
          <p className="text-xs" style={{ color: "#8B6914" }}>
            {publishCheckpointConfirmationsHelper(lang, requiredRemaining)}
          </p>
        ) : null}
      </div>

      {/* Block reason */}
      {draftBlockMessage ? (
        <p className="mt-3 text-xs leading-relaxed" style={{ color: "#8B6914" }} role="status">
          {draftBlockMessage}
        </p>
      ) : null}
      {/* Error */}
      {errorMessage ? (
        <p className="mt-3 text-xs leading-relaxed" style={{ color: "#8B3A3A" }} role="alert">
          {errorMessage}
        </p>
      ) : null}

      {/* Final action */}
      <div className="mt-4">
        {blockReason ? (
          <div
            className="mb-3 rounded-xl border px-3 py-3 text-xs leading-relaxed"
            style={{ borderColor: "#D8A0A0", background: "#FFF5F5", color: "#8B3A3A" }}
            role="alert"
          >
            <p className="font-semibold">{blockReason}</p>
            {restaurantCouponBlocked && editHref ? (
              <Link
                href={editHref}
                className="mt-2 inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-xs font-bold"
                style={{ borderColor: LEONIX_BORDER, color: LEONIX_CHARCOAL, background: "#FFF" }}
              >
                {lang === "es" ? "Volver a editar y quitar complemento" : "Back to edit and remove add-on"}
              </Link>
            ) : null}
          </div>
        ) : null}
        <button
          type="button"
          disabled={!finalButtonEnabled}
          onClick={handleFinalAction}
          className="min-h-[48px] w-full touch-manipulation rounded-full px-6 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          style={{ background: busy ? LEONIX_MUTED : LEONIX_BURGUNDY }}
          onMouseEnter={(e) => {
            if (!busy && finalButtonEnabled) {
              (e.currentTarget as HTMLButtonElement).style.background = LEONIX_BURGUNDY_HOVER;
            }
          }}
          onMouseLeave={(e) => {
            if (!busy) (e.currentTarget as HTMLButtonElement).style.background = LEONIX_BURGUNDY;
          }}
        >
          {busy ? loadingLabel : resolved.finalActionLabel}
        </button>
      </div>

      {rulesModal && rulesOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setRulesOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6 shadow-xl"
            style={{ background: LEONIX_CREAM }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold" style={{ color: LEONIX_CHARCOAL }}>
              {lang === "es" ? rulesModal.titleEs : rulesModal.titleEn}
            </h2>
            <ul className="mt-4 space-y-2">
              {(lang === "es" ? rulesModal.bulletsEs : rulesModal.bulletsEn).map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: LEONIX_MUTED }}>
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: LEONIX_GOLD }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setRulesOpen(false)}
              className="mt-6 min-h-[44px] w-full rounded-full px-6 py-2.5 text-sm font-semibold text-white"
              style={{ background: LEONIX_BURGUNDY }}
            >
              {lang === "es" ? "Cerrar" : "Close"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
