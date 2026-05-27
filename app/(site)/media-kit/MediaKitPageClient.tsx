"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { GateDestinationShell } from "@/app/components/leonix/GateDestinationShell";
import { parseGateLang } from "@/app/(site)/lib/parseGateLang";

const COPY = {
  es: {
    title: "Media Kit de Leonix Media",
    subtitle: "Publicidad impresa en español. Exposición digital bilingüe. Acceso multilingüe por QR.",
    body: "Nuestro Media Kit está en preparación. Déjanos tu información y te enviaremos los detalles cuando esté listo.",
    fields: {
      name: "Nombre",
      email: "Correo electrónico",
      phone: "Teléfono",
      business: "Negocio",
      message: "Mensaje",
    },
    submit: "Solicitar Media Kit",
    successTitle: "¡Gracias!",
    successBody: "Recibimos tu solicitud. Te contactaremos cuando el Media Kit esté listo.",
    placeholders: {
      name: "Tu nombre",
      email: "tu@correo.com",
      phone: "(408) 000-0000",
      business: "Nombre del negocio",
      message: "Cuéntanos sobre tu interés en publicidad",
    },
  },
  en: {
    title: "Leonix Media Kit",
    subtitle: "Spanish print advertising. Bilingual digital exposure. Multilingual access through QR.",
    body: "Our Media Kit is being prepared. Leave your information and we'll send you the details when it's ready.",
    fields: {
      name: "Name",
      email: "Email",
      phone: "Phone",
      business: "Business",
      message: "Message",
    },
    submit: "Request Media Kit",
    successTitle: "Thank you!",
    successBody: "We received your request. We'll reach out when the Media Kit is ready.",
    placeholders: {
      name: "Your name",
      email: "you@example.com",
      phone: "(408) 000-0000",
      business: "Business name",
      message: "Tell us about your advertising interest",
    },
  },
} as const;

const inputClass =
  "w-full rounded-lg border border-[#D6C7AD] bg-[#FFFDF7] px-4 py-3 text-[#1F241C] placeholder:text-[#5F6258] focus:outline-none focus:ring-2 focus:ring-[#C9A84A]/40";

export default function MediaKitPageClient() {
  const searchParams = useSearchParams();
  const lang = useMemo(
    () => parseGateLang(searchParams?.get("lang")),
    [searchParams]
  );
  const t = COPY[lang];
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <GateDestinationShell lang={lang} title={t.successTitle} subtitle="" body={t.successBody}>
        <p className="text-sm text-[#5F6258]">
          {lang === "es" ? "Idioma:" : "Language:"}{" "}
          <span className="font-semibold text-[#3D3428]">{lang === "es" ? "Español" : "English"}</span>
        </p>
      </GateDestinationShell>
    );
  }

  return (
    <GateDestinationShell lang={lang} title={t.title} subtitle={t.subtitle} body={t.body}>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 shadow-sm">
        <Field label={t.fields.name}>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            className={inputClass}
            placeholder={t.placeholders.name}
          />
        </Field>
        <Field label={t.fields.email}>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
            placeholder={t.placeholders.email}
          />
        </Field>
        <Field label={t.fields.phone}>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            className={inputClass}
            placeholder={t.placeholders.phone}
          />
        </Field>
        <Field label={t.fields.business}>
          <input
            name="business"
            type="text"
            autoComplete="organization"
            className={inputClass}
            placeholder={t.placeholders.business}
          />
        </Field>
        <Field label={t.fields.message}>
          <textarea
            name="message"
            rows={4}
            className={inputClass}
            placeholder={t.placeholders.message}
          />
        </Field>
        <button
          type="submit"
          className="w-full rounded-lg bg-[#7A1E2C] px-6 py-3 text-base font-bold text-white shadow-md transition hover:bg-[#5e1721]"
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
