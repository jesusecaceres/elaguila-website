"use client";

/**
 * Package C Build 2 (C4) — verified 15% introductory discount panel.
 *
 * Server is the sole authority: this panel only previews eligibility (GET .../status) and
 * drives the OTP verification flow; the actual discount is re-derived and atomically reserved
 * server-side at checkout. Mutually exclusive with the promo-code Apply field (RevenuePromoField)
 * — only one of the two may be active at a time; selecting one hides/disables the other.
 */

import { useEffect, useState } from "react";
import {
  fetchVerifiedIntroDiscountStatus,
  requestPhoneVerification,
  verifyPhoneCode,
} from "@/app/lib/listingPlans/verifiedIntroDiscountClient";

const E164_RE = /^\+[1-9]\d{7,14}$/;

export type VerifiedIntroDiscountVerifyPanelProps = {
  category: string;
  packageKey: string;
  listingId?: string | null;
  subtotalCents: number;
  lang: "es" | "en";
  disabled?: boolean;
  /** True while a promo code is applied elsewhere — hides this panel's Apply action. */
  promoCodeActive?: boolean;
  /** Reports whether the verified-15 discount is the customer's selected active discount, and
   * an estimated discount amount for display only (server always recomputes the real amount). */
  onActiveChange: (active: boolean, estimatedDiscountCents: number | null) => void;
  className?: string;
};

type PanelState =
  | { kind: "loading" }
  | { kind: "not_available" }
  | { kind: "excluded"; reasonCode: string }
  | { kind: "needs_verification"; emailVerified: boolean; phoneVerified: boolean; smsConfigured: boolean }
  | { kind: "eligible" }
  | { kind: "applied" };

const COPY = {
  es: {
    title: "Descuento de bienvenida verificado (15%)",
    excluded: {
      already_redeemed: "Ya usaste tu descuento de bienvenida.",
      package_excluded: "Este paquete no califica para el descuento de bienvenida.",
      billing_mode_ineligible: "Este paquete no califica para el descuento de bienvenida.",
      discount_already_active: "No puedes combinar este descuento con un código promocional.",
      not_verified: "",
    },
    needsVerification: "Verifica tu teléfono para desbloquear 15% de descuento en tu primer pago.",
    phoneLabel: "Número de teléfono",
    phonePlaceholder: "+1 555 555 5555",
    sendCode: "Enviar código",
    codeLabel: "Código de verificación",
    verify: "Verificar",
    smsUnavailable: "La verificación por SMS no está disponible en este momento. Verifica tu correo iniciando sesión con un correo confirmado.",
    apply: "Aplicar 15% de descuento",
    remove: "Quitar",
    applied: "Descuento de bienvenida (15%) aplicado.",
    renewalNote: "Las renovaciones se cobran al precio completo.",
    invalidPhone: "Ingresa un número de teléfono válido.",
    invalidCode: "Código incorrecto. Intenta de nuevo.",
    genericError: "Algo salió mal. Intenta de nuevo.",
  },
  en: {
    title: "Verified welcome discount (15%)",
    excluded: {
      already_redeemed: "You've already used your welcome discount.",
      package_excluded: "This package is not eligible for the welcome discount.",
      billing_mode_ineligible: "This package is not eligible for the welcome discount.",
      discount_already_active: "You can't combine this discount with a promo code.",
      not_verified: "",
    },
    needsVerification: "Verify your phone to unlock 15% off your first payment.",
    phoneLabel: "Phone number",
    phonePlaceholder: "+1 555 555 5555",
    sendCode: "Send code",
    codeLabel: "Verification code",
    verify: "Verify",
    smsUnavailable: "SMS verification is temporarily unavailable. You can qualify with a confirmed email instead — sign in with a verified email address.",
    apply: "Apply 15% discount",
    remove: "Remove",
    applied: "Welcome discount (15%) applied.",
    renewalNote: "Renewals are billed at the full price.",
    invalidPhone: "Enter a valid phone number.",
    invalidCode: "Incorrect code. Try again.",
    genericError: "Something went wrong. Try again.",
  },
} as const;

export function VerifiedIntroDiscountVerifyPanel({
  category,
  packageKey,
  listingId,
  subtotalCents,
  lang,
  disabled = false,
  promoCodeActive = false,
  onActiveChange,
  className = "",
}: VerifiedIntroDiscountVerifyPanelProps) {
  const t = COPY[lang];
  const [state, setState] = useState<PanelState>({ kind: "loading" });
  const [phone, setPhone] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    void fetchVerifiedIntroDiscountStatus({ category, packageKey, listingId }).then((result) => {
      if (cancelled) return;
      if (!result) {
        setState({ kind: "not_available" });
        return;
      }
      if (result.eligible) {
        setState({ kind: "eligible" });
        return;
      }
      if (result.reasonCode === "not_verified") {
        setState({
          kind: "needs_verification",
          emailVerified: result.emailVerified,
          phoneVerified: result.phoneVerified,
          smsConfigured: result.smsConfigured,
        });
        return;
      }
      setState({ kind: "excluded", reasonCode: result.reasonCode ?? "package_excluded" });
    });
    return () => {
      cancelled = true;
    };
  }, [category, packageKey, listingId]);

  const reportActive = (isActive: boolean) => {
    setApplied(isActive);
    onActiveChange(isActive, isActive ? Math.floor(subtotalCents * 0.15) : null);
  };

  const handleSendCode = async () => {
    const trimmed = phone.trim();
    if (!E164_RE.test(trimmed)) {
      setError(t.invalidPhone);
      return;
    }
    setBusy(true);
    setError(null);
    const result = await requestPhoneVerification(trimmed);
    setBusy(false);
    if (!result.ok) {
      if (result.code === "sms_not_configured") setError(t.smsUnavailable);
      else setError(t.genericError);
      return;
    }
    setOtpRequested(true);
  };

  const handleVerifyCode = async () => {
    const trimmed = phone.trim();
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    const result = await verifyPhoneCode(trimmed, code.trim());
    setBusy(false);
    if (!result.ok) {
      setError(t.genericError);
      return;
    }
    if (!result.verified) {
      setError(t.invalidCode);
      return;
    }
    setState({ kind: "eligible" });
  };

  const handleApplyToggle = () => {
    reportActive(!applied);
  };

  if (state.kind === "loading" || state.kind === "not_available") return null;
  if (promoCodeActive && !applied) return null;

  return (
    <div className={`space-y-2 border-t pt-4 ${className}`} style={{ borderColor: "#D8C2A099" }}>
      <p className="text-xs font-semibold" style={{ color: "#1F1A17" }}>
        {t.title}
      </p>

      {state.kind === "excluded" ? (
        <p className="text-xs" style={{ color: "#5A5148" }}>
          {t.excluded[state.reasonCode as keyof typeof t.excluded] ?? t.excluded.package_excluded}
        </p>
      ) : null}

      {state.kind === "needs_verification" ? (
        <div className="space-y-2">
          <p className="text-xs leading-relaxed" style={{ color: "#5A5148" }}>
            {t.needsVerification}
          </p>
          {!otpRequested ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.phonePlaceholder}
                disabled={disabled || busy}
                className="min-h-[44px] flex-1 rounded-xl border px-3 text-sm"
                style={{ borderColor: "#D8C2A0" }}
                aria-label={t.phoneLabel}
              />
              <button
                type="button"
                disabled={disabled || busy || !phone.trim()}
                onClick={() => void handleSendCode()}
                className="min-h-[44px] rounded-xl border px-4 text-sm font-semibold disabled:opacity-50"
                style={{ borderColor: "#D8C2A0", background: "#FFF", color: "#1F1A17" }}
              >
                {busy ? "…" : t.sendCode}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={disabled || busy}
                className="min-h-[44px] flex-1 rounded-xl border px-3 text-sm"
                style={{ borderColor: "#D8C2A0" }}
                aria-label={t.codeLabel}
              />
              <button
                type="button"
                disabled={disabled || busy || !code.trim()}
                onClick={() => void handleVerifyCode()}
                className="min-h-[44px] rounded-xl border px-4 text-sm font-semibold disabled:opacity-50"
                style={{ borderColor: "#D8C2A0", background: "#FFF", color: "#1F1A17" }}
              >
                {busy ? "…" : t.verify}
              </button>
            </div>
          )}
        </div>
      ) : null}

      {state.kind === "eligible" ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={handleApplyToggle}
            className="min-h-[44px] rounded-xl border px-4 text-sm font-semibold"
            style={{ borderColor: "#D8C2A0", background: applied ? "#1A4D2E" : "#FFF", color: applied ? "#FFF" : "#1F1A17" }}
          >
            {applied ? t.remove : t.apply}
          </button>
        </div>
      ) : null}

      {applied ? (
        <p className="text-xs" style={{ color: "#1A4D2E" }} role="status">
          {t.applied} {t.renewalNote}
        </p>
      ) : null}

      {error ? (
        <p className="text-xs" style={{ color: "#8B3A3A" }} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
