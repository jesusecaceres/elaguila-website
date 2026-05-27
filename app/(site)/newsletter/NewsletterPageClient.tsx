"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { GateDestinationShell } from "@/app/components/leonix/GateDestinationShell";
import { parseGateLang } from "@/app/(site)/lib/parseGateLang";

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

  const preserveQueryKeys = source ? (["source"] as const) : undefined;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
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
        {source ? <input type="hidden" name="source" value={source} readOnly /> : null}
        <input type="hidden" name="lang" value={lang} readOnly />
        <Field label={t.fields.email}>
          <input
            name="email"
            type="email"
            required
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
              autoComplete="postal-code"
              className={inputClass}
              placeholder={t.placeholders.zip}
            />
          </Field>
        </div>
        <Field label={t.fields.preferredLanguage}>
          <select
            name="preferredLanguage"
            defaultValue={lang}
            className={inputClass}
          >
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
            className={inputClass}
            placeholder={t.placeholders.interests}
          />
        </Field>
        <button
          type="submit"
          className="w-full rounded-lg bg-[#556B3E] px-6 py-3 text-base font-bold text-white shadow-md transition hover:bg-[#445632]"
        >
          {t.submit}
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
