"use client";

import { useState, type FormEvent } from "react";
import { submitLaunchSignupForm } from "@/app/(site)/lib/submitLaunchSignupForm";
import { LEONIX_GLOBAL_EMAIL } from "@/app/data/leonixGlobalContact";
import { AUDIENCE_TYPES } from "@/app/lib/leonix/inquiryTypes";
import type { LeonixSiteLang } from "@/app/lib/lang";

const COPY = {
  es: {
    emailLabel: "Correo electrónico",
    nameLabel: "Nombre (opcional)",
    businessLabel: "Negocio (opcional)",
    cityLabel: "Ciudad o zona (opcional)",
    audienceLabel: "Me interesa como",
    audience: {
      "": "Seleccionar…",
      business: "Negocio",
      reader: "Lector/a",
      partner: "Aliado/a",
      advertiser: "Anunciante",
    },
    consent: "Acepto recibir actualizaciones del lanzamiento de Leonix Media.",
    submit: "Únete al lanzamiento",
    submitting: "Guardando…",
    success: "¡Gracias! Te avisaremos cuando Leonix Media lance oficialmente.",
    error: `No pudimos guardar tu registro. Intenta de nuevo o escríbenos a ${LEONIX_GLOBAL_EMAIL}.`,
    emailPlaceholder: "tu@correo.com",
  },
  en: {
    emailLabel: "Email",
    nameLabel: "Name (optional)",
    businessLabel: "Business (optional)",
    cityLabel: "City or area (optional)",
    audienceLabel: "I'm interested as",
    audience: {
      "": "Select…",
      business: "Business",
      reader: "Reader",
      partner: "Partner",
      advertiser: "Advertiser",
    },
    consent: "I agree to receive Leonix Media launch updates.",
    submit: "Join the launch",
    submitting: "Saving…",
    success: "Thank you! We'll notify you when Leonix Media officially launches.",
    error: `We could not save your signup. Please try again or email ${LEONIX_GLOBAL_EMAIL}.`,
    emailPlaceholder: "you@example.com",
  },
} as const;

type Props = {
  lang: LeonixSiteLang;
  source?: string;
  formAria: string;
  buttonLabel: string;
  placeholder: string;
  compact?: boolean;
};

export function ComingSoonLaunchSignupForm({
  lang,
  source = "coming-soon-v2",
  formAria,
  buttonLabel,
  placeholder,
  compact = false,
}: Props) {
  const t = COPY[lang === "en" ? "en" : "es"];
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [cityArea, setCityArea] = useState("");
  const [audienceType, setAudienceType] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (!consent) {
      setError(lang === "en" ? "Please confirm consent to receive updates." : "Confirma el consentimiento para recibir actualizaciones.");
      return;
    }

    setError(null);
    setWarning(null);
    setLoading(true);

    const result = await submitLaunchSignupForm(
      {
        email,
        name: name.trim() || undefined,
        businessName: businessName.trim() || undefined,
        city: cityArea.trim() || undefined,
        audienceType: audienceType || undefined,
        source,
        consentToReceiveUpdates: true,
      },
      lang === "en" ? "en" : "es"
    );

    setLoading(false);

    if (result.ok) {
      setSubmitted(true);
      if (result.warning) setWarning(result.warning);
      return;
    }

    setError(result.message);
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="mt-4 rounded-xl border border-emerald-300/50 bg-emerald-50/95 px-4 py-3 text-sm text-emerald-950 sm:mt-5"
      >
        <p className="font-semibold">{t.success}</p>
        {warning ? <p className="mt-2 text-amber-900">{warning}</p> : null}
      </div>
    );
  }

  const inputClass =
    "min-h-[3rem] min-w-0 w-full rounded-full border border-[#C9A84A]/45 bg-[#FFFDF7] px-4 text-sm text-[#1F241C] placeholder:text-[#3D3428]/55 focus:border-[#C9A84A] focus:outline-none focus:ring-2 focus:ring-[#C9A84A]/40 sm:text-[0.9375rem] disabled:opacity-70";

  return (
    <form
      onSubmit={onSubmit}
      className={`mt-4 flex min-w-0 flex-col gap-3 sm:mt-5 ${compact ? "" : "sm:gap-4"}`}
      aria-label={formAria}
    >
      <div className={`flex min-w-0 flex-col gap-3 ${compact ? "sm:flex-row sm:items-stretch" : "sm:grid sm:grid-cols-2"}`}>
        <label className="sr-only" htmlFor="coming-soon-v2-newsletter-email">
          {t.emailLabel}
        </label>
        <input
          id="coming-soon-v2-newsletter-email"
          type="email"
          required
          disabled={loading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder || t.emailPlaceholder}
          autoComplete="email"
          className={inputClass}
        />
        {!compact ? (
          <>
            <input
              type="text"
              disabled={loading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.nameLabel}
              autoComplete="name"
              className={inputClass}
            />
            <input
              type="text"
              disabled={loading}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder={t.businessLabel}
              autoComplete="organization"
              className={inputClass}
            />
            <input
              type="text"
              disabled={loading}
              value={cityArea}
              onChange={(e) => setCityArea(e.target.value)}
              placeholder={t.cityLabel}
              autoComplete="address-level2"
              className={inputClass}
            />
            <select
              disabled={loading}
              value={audienceType}
              onChange={(e) => setAudienceType(e.target.value)}
              className={inputClass}
              aria-label={t.audienceLabel}
            >
              <option value="">{t.audience[""]}</option>
              {AUDIENCE_TYPES.map((value) => (
                <option key={value} value={value}>
                  {t.audience[value]}
                </option>
              ))}
            </select>
          </>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-full bg-[#7A1E2C] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgba(122,30,44,0.5)] transition hover:bg-[#5e1721] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A84A] disabled:cursor-not-allowed disabled:opacity-70 sm:text-[0.9375rem]"
        >
          {loading ? t.submitting : buttonLabel}
        </button>
      </div>

      <label className="flex items-start gap-2 text-xs leading-snug text-[#EDE6D6] sm:text-sm">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={loading}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#C9A84A]/45"
        />
        <span>{t.consent}</span>
      </label>

      {error ? (
        <p role="alert" className="rounded-lg border border-rose-300/40 bg-rose-950/30 px-3 py-2 text-xs text-rose-100 sm:text-sm">
          {error}
        </p>
      ) : null}
    </form>
  );
}
