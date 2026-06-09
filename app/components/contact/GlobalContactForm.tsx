"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { submitContactForm } from "@/app/(site)/lib/submitContactForm";
import {
  LEONIX_PHONE_DISPLAY,
  LEONIX_PHONE_TEL,
  LEONIX_TIENDA_CONTACT_PATH,
} from "@/app/(site)/tienda/data/leonixContact";
import { VisibleEmailWithCopy } from "@/app/components/contact/LeonixEmailContactBlock";
import { LEONIX_GLOBAL_EMAIL } from "@/app/data/leonixGlobalContact";
import {
  INQUIRY_TYPES,
  inquiryTypeLabel,
  parseInquiryType,
  PREFERRED_CONTACT_METHODS,
  type InquiryType,
} from "@/app/lib/leonix/inquiryTypes";

type Lang = "es" | "en";

const SUBMIT_BTN =
  "w-full min-h-[44px] whitespace-nowrap text-center text-sm sm:text-base px-4 py-3 rounded-xl font-semibold shadow-[0_18px_48px_rgba(42,36,22,0.18)] transition disabled:cursor-not-allowed disabled:opacity-70";

const INPUT =
  "w-full p-3 rounded-lg bg-white/70 border border-[color:var(--lx-nav-border)] text-[color:var(--lx-text)] placeholder:text-[color:var(--lx-muted)] focus:outline-none";

const COPY = {
  es: {
    successTitle: "Gracias. Recibimos tu información y el equipo de Leonix te contactará pronto.",
    emailWarning: "Guardamos tu consulta, pero la notificación por correo al equipo no se envió. El equipo la verá en el sistema.",
    storageWarning: "Enviamos tu mensaje por correo al equipo; el almacenamiento en lista está pendiente.",
    sending: "Enviando…",
    send: "Enviar a Leonix Media",
    consent:
      "Acepto que Leonix Media me contacte sobre esta consulta. Entiendo que puedo solicitar que dejen de contactarme.",
    wantsLaunch: "También quiero recibir actualizaciones del lanzamiento de Leonix Media.",
    fields: {
      inquiryType: "Tipo de consulta",
      fullName: "Nombre completo",
      email: "Correo electrónico",
      phone: "Teléfono",
      businessName: "Negocio u organización",
      preferredContact: "Forma de contacto preferida",
      cityArea: "Ciudad o zona",
      websiteOrSocial: "Sitio web o red social",
      businessCategory: "Categoría del negocio",
      message: "Mensaje",
    },
    preferred: { email: "Correo", phone: "Teléfono", either: "Correo o teléfono" },
    placeholders: {
      fullName: "Tu nombre",
      email: "tu@ejemplo.com",
      phone: "Si deseas que te llamemos",
      businessName: "Nombre del negocio",
      cityArea: "San José, Bay Area…",
      websiteOrSocial: "https://…",
      businessCategory: "Restaurante, servicios…",
      message: "¿En qué podemos ayudarte?",
    },
    promoHint:
      "Para cotizaciones de impresión y promoción más rápidas, también puedes usar la ",
    promoLink: "contacto de productos promocionales",
  },
  en: {
    successTitle: "Thank you. We received your information and the Leonix team will contact you soon.",
    emailWarning: "We saved your inquiry, but the team email notification could not be sent. The team will see it in the system.",
    storageWarning: "We emailed your message to the team; list storage is still pending.",
    sending: "Sending…",
    send: "Send to Leonix Media",
    consent:
      "I agree that Leonix Media may contact me about this inquiry. I understand I can ask to stop being contacted.",
    wantsLaunch: "I also want launch updates from Leonix Media.",
    fields: {
      inquiryType: "Inquiry type",
      fullName: "Full name",
      email: "Email",
      phone: "Phone",
      businessName: "Business or organization",
      preferredContact: "Preferred contact method",
      cityArea: "City or area",
      websiteOrSocial: "Website or social link",
      businessCategory: "Business category",
      message: "Message",
    },
    preferred: { email: "Email", phone: "Phone", either: "Email or phone" },
    placeholders: {
      fullName: "Your name",
      email: "you@example.com",
      phone: "If you'd like a callback",
      businessName: "Business name",
      cityArea: "San Jose, Bay Area…",
      websiteOrSocial: "https://…",
      businessCategory: "Restaurant, services…",
      message: "How can we help?",
    },
    promoHint: "For faster print and promotional quotes, you can also use our ",
    promoLink: "promotional products contact",
  },
} as const;

function tiendaQuoteHref(lang: Lang): string {
  const params = new URLSearchParams({ lang, service: "cotizacion-general" });
  return `${LEONIX_TIENDA_CONTACT_PATH}?${params.toString()}`;
}

export function GlobalContactForm(props: {
  lang: Lang;
  initialMessage?: string;
  initialInquiryType?: string;
  sourcePage?: string;
  sourceCta?: string;
}) {
  const { lang, initialMessage, initialInquiryType, sourcePage = "/contacto", sourceCta = "" } = props;
  const t = COPY[lang];

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [inquiryType, setInquiryType] = useState<InquiryType>(
    parseInquiryType(initialInquiryType, "general")
  );
  const [preferredContactMethod, setPreferredContactMethod] = useState<(typeof PREFERRED_CONTACT_METHODS)[number]>("email");
  const [cityArea, setCityArea] = useState("");
  const [websiteOrSocial, setWebsiteOrSocial] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [message, setMessage] = useState(() => (initialMessage ?? "").slice(0, 12000));
  const [consentToContact, setConsentToContact] = useState(false);
  const [wantsLaunchUpdates, setWantsLaunchUpdates] = useState(initialInquiryType === "launch");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (!consentToContact) {
      setError(
        lang === "en"
          ? "Please confirm consent to be contacted."
          : "Confirma el consentimiento para que te contactemos."
      );
      return;
    }

    setError(null);
    setWarning(null);
    setLoading(true);

    const result = await submitContactForm(
      {
        fullName,
        email,
        phone: phone.trim(),
        businessName: businessName.trim(),
        inquiryType,
        preferredContactMethod,
        cityArea: cityArea.trim(),
        websiteOrSocial: websiteOrSocial.trim(),
        businessCategory: businessCategory.trim(),
        message,
        sourcePage,
        sourceCta,
        consentToContact: true,
        wantsLaunchUpdates,
      },
      lang
    );

    setLoading(false);

    if (result.ok) {
      setSubmitted(true);
      if (result.warning) {
        setWarning(result.warning);
      } else if (!result.emailSent && result.saved) {
        setWarning(t.emailWarning);
      } else if (result.emailSent && !result.saved) {
        setWarning(t.storageWarning);
      }
      return;
    }

    setError(result.message);
  }

  if (submitted) {
    return (
      <div className="bg-[color:var(--lx-card)] p-6 sm:p-8 rounded-2xl shadow-[0_18px_48px_rgba(42,36,22,0.10)] border border-[color:var(--lx-nav-border)]">
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-4 text-sm text-emerald-900"
        >
          <p className="font-medium">{t.successTitle}</p>
          {warning ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-amber-950">{warning}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[color:var(--lx-card)] p-6 sm:p-8 rounded-2xl shadow-[0_18px_48px_rgba(42,36,22,0.10)] border border-[color:var(--lx-nav-border)]">
      <h2 className="text-2xl font-semibold text-[color:var(--lx-text)] mb-4">
        {lang === "en" ? "Send a message" : "Envíanos un mensaje"}
      </h2>
      <p className="text-sm text-[color:var(--lx-muted)] mb-6 leading-relaxed">
        {lang === "en" ? (
          <>
            Messages are sent to our team at <VisibleEmailWithCopy email={LEONIX_GLOBAL_EMAIL} lang="en" />.
          </>
        ) : (
          <>
            Los mensajes se envían a nuestro equipo en <VisibleEmailWithCopy email={LEONIX_GLOBAL_EMAIL} lang="es" />.
          </>
        )}
      </p>

      <form className="space-y-6" onSubmit={onSubmit} noValidate>
        <div>
          <label className="block mb-1 text-[color:var(--lx-text-2)]/90">{t.fields.inquiryType}</label>
          <select
            value={inquiryType}
            onChange={(e) => setInquiryType(parseInquiryType(e.target.value, "general"))}
            disabled={loading}
            className={INPUT}
          >
            {INQUIRY_TYPES.map((value) => (
              <option key={value} value={value}>
                {inquiryTypeLabel(value, lang)}
              </option>
            ))}
          </select>
          {inquiryType === "promotionalProducts" ? (
            <p className="mt-2 text-xs leading-relaxed text-[color:var(--lx-muted)]">
              {t.promoHint}
              <Link href={tiendaQuoteHref(lang)} className="font-semibold text-[color:var(--lx-lion)] underline">
                {t.promoLink}
              </Link>
              .
            </p>
          ) : null}
        </div>

        <div>
          <label className="block mb-1 text-[color:var(--lx-text-2)]/90">{t.fields.fullName}</label>
          <input
            type="text"
            required
            disabled={loading}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={200}
            className={INPUT}
            placeholder={t.placeholders.fullName}
            autoComplete="name"
          />
        </div>

        <div>
          <label className="block mb-1 text-[color:var(--lx-text-2)]/90">{t.fields.email}</label>
          <input
            type="email"
            required
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT}
            placeholder={t.placeholders.email}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block mb-1 text-[color:var(--lx-text-2)]/90">
            {t.fields.phone} {lang === "en" ? "(optional)" : "(opcional)"}
          </label>
          <input
            type="tel"
            disabled={loading}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={INPUT}
            placeholder={t.placeholders.phone}
            autoComplete="tel"
          />
        </div>

        <div>
          <label className="block mb-1 text-[color:var(--lx-text-2)]/90">
            {t.fields.businessName} {lang === "en" ? "(optional)" : "(opcional)"}
          </label>
          <input
            type="text"
            disabled={loading}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            maxLength={200}
            className={INPUT}
            placeholder={t.placeholders.businessName}
            autoComplete="organization"
          />
        </div>

        <div>
          <label className="block mb-1 text-[color:var(--lx-text-2)]/90">{t.fields.preferredContact}</label>
          <select
            value={preferredContactMethod}
            onChange={(e) =>
              setPreferredContactMethod(e.target.value as (typeof PREFERRED_CONTACT_METHODS)[number])
            }
            disabled={loading}
            className={INPUT}
          >
            {PREFERRED_CONTACT_METHODS.map((value) => (
              <option key={value} value={value}>
                {t.preferred[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-[color:var(--lx-text-2)]/90">
            {t.fields.cityArea} {lang === "en" ? "(optional)" : "(opcional)"}
          </label>
          <input
            type="text"
            disabled={loading}
            value={cityArea}
            onChange={(e) => setCityArea(e.target.value)}
            maxLength={120}
            className={INPUT}
            placeholder={t.placeholders.cityArea}
            autoComplete="address-level2"
          />
        </div>

        <div>
          <label className="block mb-1 text-[color:var(--lx-text-2)]/90">
            {t.fields.websiteOrSocial} {lang === "en" ? "(optional)" : "(opcional)"}
          </label>
          <input
            type="url"
            disabled={loading}
            value={websiteOrSocial}
            onChange={(e) => setWebsiteOrSocial(e.target.value)}
            maxLength={300}
            className={INPUT}
            placeholder={t.placeholders.websiteOrSocial}
          />
        </div>

        <div>
          <label className="block mb-1 text-[color:var(--lx-text-2)]/90">
            {t.fields.businessCategory} {lang === "en" ? "(optional)" : "(opcional)"}
          </label>
          <input
            type="text"
            disabled={loading}
            value={businessCategory}
            onChange={(e) => setBusinessCategory(e.target.value)}
            maxLength={120}
            className={INPUT}
            placeholder={t.placeholders.businessCategory}
          />
        </div>

        <div>
          <label className="block mb-1 text-[color:var(--lx-text-2)]/90">{t.fields.message}</label>
          <textarea
            required
            disabled={loading}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={12000}
            className={INPUT}
            placeholder={t.placeholders.message}
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-[color:var(--lx-text-2)]/90 cursor-pointer">
          <input
            type="checkbox"
            required
            checked={consentToContact}
            onChange={(e) => setConsentToContact(e.target.checked)}
            disabled={loading}
            className="mt-1 h-4 w-4 shrink-0 rounded border-[color:var(--lx-nav-border)]"
          />
          <span>{t.consent}</span>
        </label>

        <label className="flex items-start gap-3 text-sm text-[color:var(--lx-text-2)]/90 cursor-pointer">
          <input
            type="checkbox"
            checked={wantsLaunchUpdates}
            onChange={(e) => setWantsLaunchUpdates(e.target.checked)}
            disabled={loading}
            className="mt-1 h-4 w-4 shrink-0 rounded border-[color:var(--lx-nav-border)]"
          />
          <span>{t.wantsLaunch}</span>
        </label>

        {error ? (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-950">
            <p>{error}</p>
            <p className="mt-2 text-xs">
              {lang === "en" ? "Or email " : "O escríbenos a "}
              <a href={`mailto:${LEONIX_GLOBAL_EMAIL}`} className="font-semibold underline">
                {LEONIX_GLOBAL_EMAIL}
              </a>
              {lang === "en" ? " or call " : " o llama al "}
              <a href={LEONIX_PHONE_TEL} className="font-semibold underline">
                {LEONIX_PHONE_DISPLAY}
              </a>
              .
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className={[
            SUBMIT_BTN,
            "bg-[color:var(--lx-cta-dark)] text-[color:var(--lx-cta-light)] hover:bg-[color:var(--lx-cta-dark-hover)]",
          ].join(" ")}
        >
          {loading ? t.sending : t.send}
        </button>
      </form>
    </div>
  );
}
