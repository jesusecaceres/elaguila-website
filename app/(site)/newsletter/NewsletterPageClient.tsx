"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { GateDestinationShell } from "@/app/components/leonix/GateDestinationShell";
import { parseGateLang } from "@/app/(site)/lib/parseGateLang";
import { submitLaunchSignupForm } from "@/app/(site)/lib/submitLaunchSignupForm";
import { getNewsletterSuccessMessage, getPublicLeadErrorMessage } from "@/app/lib/leonix/leadConfirmationCopy";
import { AUDIENCE_TYPES } from "@/app/lib/leonix/inquiryTypes";

const COPY = {
  es: {
    title: "Sé parte del lanzamiento",
    subtitle: "Recibe noticias, oportunidades y el lanzamiento oficial de Leonix Media.",
    body: "Únete a la lista de interés para recibir actualizaciones, oportunidades para negocios locales y novedades de Leonix Media.",
    fields: {
      email: "Correo electrónico",
      name: "Nombre",
      business: "Negocio",
      city: "Ciudad o zona",
      zip: "Código postal",
      audienceType: "Me interesa como",
      preferredLanguage: "Idioma preferido",
      interests: "Intereses",
    },
    audienceOptions: {
      "": "Seleccionar…",
      business: "Negocio",
      reader: "Lector/a",
      partner: "Aliado/a",
      advertiser: "Anunciante",
      community: "Comunidad",
    },
    preferredOptions: [
      { value: "es", label: "Español" },
      { value: "en", label: "English" },
      { value: "both", label: "Ambos / Both" },
    ],
    consent: "Acepto recibir actualizaciones del lanzamiento de Leonix Media.",
    submit: "Únete al lanzamiento",
    submitting: "Guardando…",
    successTitle: "¡Gracias!",
    placeholders: {
      email: "tu@correo.com",
      name: "Tu nombre",
      business: "Nombre del negocio",
      city: "San José",
      zip: "95112",
      interests: "Anuncios, revista, clasificados…",
    },
    fromComingSoon: "Te registraste desde la página de próximamente.",
  },
  en: {
    title: "Be part of the launch",
    subtitle: "Receive news, opportunities and the official Leonix Media launch.",
    body: "Join the interest list to receive updates, local business opportunities and Leonix Media news.",
    fields: {
      email: "Email",
      name: "Name",
      business: "Business",
      city: "City or area",
      zip: "Zip code",
      audienceType: "I'm interested as",
      preferredLanguage: "Preferred language",
      interests: "Interests",
    },
    audienceOptions: {
      "": "Select…",
      business: "Business",
      reader: "Reader",
      partner: "Partner",
      advertiser: "Advertiser",
      community: "Community",
    },
    preferredOptions: [
      { value: "es", label: "Español" },
      { value: "en", label: "English" },
      { value: "both", label: "Both" },
    ],
    consent: "I agree to receive Leonix Media launch updates.",
    submit: "Join the launch",
    submitting: "Saving…",
    successTitle: "Thank you!",
    placeholders: {
      email: "you@example.com",
      name: "Your name",
      business: "Business name",
      city: "San Jose",
      zip: "95112",
      interests: "Ads, magazine, classifieds…",
    },
    fromComingSoon: "You signed up from the coming soon page.",
  },
} as const;

const inputClass =
  "w-full rounded-lg border border-[#D6C7AD] bg-[#FFFDF7] px-4 py-3 text-[#1F241C] placeholder:text-[#5F6258] focus:outline-none focus:ring-2 focus:ring-[#C9A84A]/40";

function isComingSoonSource(source: string): boolean {
  return source === "coming-soon" || source === "coming-soon-v2" || source.startsWith("coming-soon");
}

export default function NewsletterPageClient() {
  const searchParams = useSearchParams();
  const lang = useMemo(() => parseGateLang(searchParams?.get("lang")), [searchParams]);
  const source = searchParams?.get("source") ?? "";
  const emailPrefill = searchParams?.get("email") ?? "";
  const t = COPY[lang];
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  const preserveQueryKeys = source ? (["source"] as const) : undefined;
  const resolvedSource = source.trim() || "newsletter_page";
  const fromComingSoon = isComingSoonSource(resolvedSource);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    if (!consent) {
      setError(
        lang === "en"
          ? "Please confirm consent to receive launch updates."
          : "Confirma el consentimiento para recibir actualizaciones del lanzamiento."
      );
      return;
    }

    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const fd = new FormData(form);

    const result = await submitLaunchSignupForm(
      {
        email: fd.get("email"),
        name: fd.get("name"),
        businessName: fd.get("business"),
        city: fd.get("city"),
        zipCode: fd.get("zip"),
        audienceType: fd.get("audienceType"),
        preferredLanguage: fd.get("preferredLanguage"),
        interests: fd.get("interests"),
        source: resolvedSource,
        consentToReceiveUpdates: true,
      },
      lang
    );

    setLoading(false);
    if (result.ok) {
      setSubmitted(true);
      return;
    }
    setError(result.message || getPublicLeadErrorMessage(lang));
  }

  if (submitted) {
    return (
      <GateDestinationShell
        lang={lang}
        title={t.successTitle}
        subtitle=""
        body={getNewsletterSuccessMessage(lang)}
        preserveQueryKeys={preserveQueryKeys ? [...preserveQueryKeys] : undefined}
      >
        <p className="text-sm text-[#5F6258]">
          {lang === "es" ? "Idioma:" : "Language:"}{" "}
          <span className="font-semibold text-[#3D3428]">{lang === "es" ? "Español" : "English"}</span>
        </p>
        {fromComingSoon ? <p className="mt-2 text-sm text-[#556B3E]">{t.fromComingSoon}</p> : null}
      </GateDestinationShell>
    );
  }

  return (
    <GateDestinationShell
      lang={lang}
      title={t.title}
      subtitle={t.subtitle}
      body={t.body}
      preserveQueryKeys={preserveQueryKeys ? [...preserveQueryKeys] : undefined}
    >
      {fromComingSoon ? <p className="mb-4 text-sm font-medium text-[#556B3E]">{t.fromComingSoon}</p> : null}
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 shadow-sm">
        <Field label={t.fields.email}>
          <input
            name="email"
            type="email"
            required
            disabled={loading}
            autoComplete="email"
            defaultValue={emailPrefill}
            className={inputClass}
            placeholder={t.placeholders.email}
          />
        </Field>
        <Field label={`${t.fields.name} (${lang === "es" ? "opcional" : "optional"})`}>
          <input
            name="name"
            type="text"
            disabled={loading}
            autoComplete="name"
            className={inputClass}
            placeholder={t.placeholders.name}
          />
        </Field>
        <Field label={`${t.fields.business} (${lang === "es" ? "opcional" : "optional"})`}>
          <input
            name="business"
            type="text"
            disabled={loading}
            autoComplete="organization"
            className={inputClass}
            placeholder={t.placeholders.business}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`${t.fields.city} (${lang === "es" ? "opcional" : "optional"})`}>
            <input
              name="city"
              type="text"
              disabled={loading}
              autoComplete="address-level2"
              className={inputClass}
              placeholder={t.placeholders.city}
            />
          </Field>
          <Field label={`${t.fields.zip} (${lang === "es" ? "opcional" : "optional"})`}>
            <input
              name="zip"
              type="text"
              inputMode="numeric"
              disabled={loading}
              autoComplete="postal-code"
              className={inputClass}
              placeholder={t.placeholders.zip}
            />
          </Field>
        </div>
        <Field label={`${t.fields.audienceType} (${lang === "es" ? "opcional" : "optional"})`}>
          <select name="audienceType" disabled={loading} className={inputClass} defaultValue="">
            <option value="">{t.audienceOptions[""]}</option>
            {AUDIENCE_TYPES.map((value) => (
              <option key={value} value={value}>
                {t.audienceOptions[value]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.fields.preferredLanguage}>
          <select name="preferredLanguage" defaultValue={lang} disabled={loading} className={inputClass}>
            {t.preferredOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={`${t.fields.interests} (${lang === "es" ? "opcional" : "optional"})`}>
          <textarea
            name="interests"
            rows={3}
            disabled={loading}
            className={inputClass}
            placeholder={t.placeholders.interests}
          />
        </Field>
        <label className="flex items-start gap-3 text-sm text-[#3D3428]">
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            disabled={loading}
            className="mt-1 h-4 w-4 shrink-0 rounded border-[#D6C7AD]"
          />
          <span>{t.consent}</span>
        </label>
        {error ? (
          <p className="rounded-lg border border-[#7A1E2C]/30 bg-[#7A1E2C]/10 px-3 py-2 text-sm text-[#7A1E2C]" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#556B3E] px-6 py-3 text-base font-bold text-white shadow-md transition hover:bg-[#445632] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? t.submitting : t.submit}
        </button>
      </form>
    </GateDestinationShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-[#3D3428]">{label}</label>
      {children}
    </div>
  );
}
