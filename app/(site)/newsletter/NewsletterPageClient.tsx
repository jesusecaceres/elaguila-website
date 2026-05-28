"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { GateDestinationShell } from "@/app/components/leonix/GateDestinationShell";
import { parseGateLang } from "@/app/(site)/lib/parseGateLang";
import { submitLeadForm } from "@/app/(site)/lib/submitLeadForm";

const COPY = {
  es: {
    title: "Sé parte del lanzamiento",
    subtitle: "Recibe noticias, oportunidades y el lanzamiento oficial de Leonix Media.",
    body: "Únete a la lista de interés para recibir actualizaciones, oportunidades para negocios locales y novedades de Leonix Media.",
    fields: {
      email: "Correo electrónico",
      name: "Nombre",
      city: "Ciudad",
      zip: "Código postal",
      preferredLanguage: "Idioma preferido",
      interests: "Intereses",
    },
    preferredOptions: [
      { value: "es", label: "Español" },
      { value: "en", label: "English" },
      { value: "both", label: "Ambos / Both" },
    ],
    submit: "Notifícame",
    submitting: "Guardando…",
    successTitle: "Gracias",
    successBody: "Te avisaremos cuando Leonix Media lance oficialmente.",
    placeholders: {
      email: "tu@correo.com",
      name: "Tu nombre",
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
      city: "City",
      zip: "Zip code",
      preferredLanguage: "Preferred language",
      interests: "Interests",
    },
    preferredOptions: [
      { value: "es", label: "Español" },
      { value: "en", label: "English" },
      { value: "both", label: "Both" },
    ],
    submit: "Notify Me",
    submitting: "Saving…",
    successTitle: "Thank you",
    successBody: "We'll notify you when Leonix Media officially launches.",
    placeholders: {
      email: "you@example.com",
      name: "Your name",
      city: "San Jose",
      zip: "95112",
      interests: "Ads, magazine, classifieds…",
    },
    fromComingSoon: "You signed up from the coming soon page.",
  },
} as const;

const inputClass =
  "w-full rounded-lg border border-[#D6C7AD] bg-[#FFFDF7] px-4 py-3 text-[#1F241C] placeholder:text-[#5F6258] focus:outline-none focus:ring-2 focus:ring-[#C9A84A]/40";

export default function NewsletterPageClient() {
  const searchParams = useSearchParams();
  const lang = useMemo(() => parseGateLang(searchParams?.get("lang")), [searchParams]);
  const source = searchParams?.get("source") ?? "";
  const emailPrefill = searchParams?.get("email") ?? "";
  const t = COPY[lang];
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preserveQueryKeys = source ? (["source"] as const) : undefined;
  const resolvedSource = source.trim() || "newsletter_page";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const fd = new FormData(form);

    const result = await submitLeadForm(
      "/api/newsletter/subscribe",
      {
        email: fd.get("email"),
        name: fd.get("name"),
        city: fd.get("city"),
        zipCode: fd.get("zip"),
        preferredLanguage: fd.get("preferredLanguage"),
        interests: fd.get("interests"),
        source: resolvedSource,
        lang,
      },
      lang
    );

    setLoading(false);
    if (result.ok) {
      setSubmitted(true);
      return;
    }
    setError(result.message);
  }

  if (submitted) {
    return (
      <GateDestinationShell
        lang={lang}
        title={t.successTitle}
        subtitle=""
        body={t.successBody}
        preserveQueryKeys={preserveQueryKeys ? [...preserveQueryKeys] : undefined}
      >
        <p className="text-sm text-[#5F6258]">
          {lang === "es" ? "Idioma:" : "Language:"}{" "}
          <span className="font-semibold text-[#3D3428]">{lang === "es" ? "Español" : "English"}</span>
        </p>
        {source === "coming-soon" ? (
          <p className="mt-2 text-sm text-[#556B3E]">{t.fromComingSoon}</p>
        ) : null}
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
      {source === "coming-soon" ? (
        <p className="mb-4 text-sm font-medium text-[#556B3E]">{t.fromComingSoon}</p>
      ) : null}
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
        <Field label={t.fields.name}>
          <input
            name="name"
            type="text"
            disabled={loading}
            autoComplete="name"
            className={inputClass}
            placeholder={t.placeholders.name}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.fields.city}>
            <input
              name="city"
              type="text"
              disabled={loading}
              autoComplete="address-level2"
              className={inputClass}
              placeholder={t.placeholders.city}
            />
          </Field>
          <Field label={t.fields.zip}>
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
        <Field label={t.fields.preferredLanguage}>
          <select name="preferredLanguage" defaultValue={lang} disabled={loading} className={inputClass}>
            {t.preferredOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.fields.interests}>
          <textarea
            name="interests"
            rows={3}
            disabled={loading}
            className={inputClass}
            placeholder={t.placeholders.interests}
          />
        </Field>
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
