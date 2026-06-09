"use client";

import { useState, type FormEvent } from "react";
import { submitContactForm } from "@/app/(site)/lib/submitContactForm";
import { VisibleEmailWithCopy } from "@/app/components/contact/LeonixEmailContactBlock";
import { LEONIX_PHONE_DISPLAY, LEONIX_PHONE_TEL, LEONIX_TIENDA_EMAIL } from "../data/leonixContact";
import { getLeadSuccessMessage, getPublicLeadErrorMessage } from "@/app/lib/leonix/leadConfirmationCopy";
import { getPublicLocaleCopy, type PublicFormLang } from "@/app/lib/leonix/publicFormCopy";

function buildPromoMessage(fields: {
  inquiryType: string;
  service?: string;
  message: string;
  topicLabel: string;
  headerLine: string;
  topicPrefix: string;
  servicePrefix: string;
}): string {
  const lines = [
    fields.headerLine,
    `${fields.topicPrefix}: ${fields.topicLabel}`,
    fields.service ? `${fields.servicePrefix}: ${fields.service.replace(/-/g, " ")}` : "",
    "",
    fields.message,
  ].filter(Boolean);
  return lines.join("\n");
}

export function TiendaContactForm(props: {
  lang: PublicFormLang;
  service?: string;
  sourcePage?: string;
  sourceCta?: string;
}) {
  const { lang, service, sourcePage = "tienda_contacto", sourceCta = "promo_quote" } = props;
  const locale = getPublicLocaleCopy(lang);
  const t = locale.tiendaForm;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [cityArea, setCityArea] = useState("");
  const [inquiryType, setInquiryType] = useState(service ? "rep_catalog" : "general_tienda");
  const [message, setMessage] = useState("");
  const [consentToContact, setConsentToContact] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topicLabel =
    t.inquiryOptions.find((o) => o.value === inquiryType)?.label ?? inquiryType;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (!consentToContact) {
      setError(t.consentError);
      return;
    }

    setError(null);
    setLoading(true);

    const result = await submitContactForm(
      {
        fullName: name,
        email,
        phone: phone.trim(),
        businessName: businessName.trim(),
        cityArea: cityArea.trim(),
        inquiryType: "promotionalProducts",
        preferredContactMethod: phone.trim() ? "either" : "email",
        message: buildPromoMessage({
          inquiryType,
          service,
          message,
          topicLabel,
          headerLine: t.title,
          topicPrefix: t.productInterest,
          servicePrefix: locale.tiendaPage.serviceInterestPrefix.replace(":", "").trim(),
        }),
        sourcePage,
        sourceCta,
        consentToContact: true,
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
      <section className="mt-10 rounded-2xl border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] p-6 sm:p-8">
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-4 text-sm leading-relaxed text-emerald-900"
        >
          <p className="font-medium">{getLeadSuccessMessage("promotionalProducts", lang)}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10 rounded-2xl border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] p-6 sm:p-8">
      {service ? (
        <div className="mb-5 rounded-xl border border-[color:var(--lx-olive)]/30 bg-[color:var(--lx-olive)]/8 px-4 py-3 text-sm">
          <span className="font-semibold text-[color:var(--lx-text)]">
            {locale.tiendaPage.serviceInterestPrefix}{" "}
          </span>
          <span className="text-[color:var(--lx-text-2)]">{service.replace(/-/g, " ")}</span>
        </div>
      ) : null}
      <h2 className="text-lg font-semibold text-[color:var(--lx-text)]">{t.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-muted)]">
        {t.intro}{" "}
        <VisibleEmailWithCopy email={LEONIX_TIENDA_EMAIL} lang={lang} />
      </p>

      <form className="mt-6 space-y-5" onSubmit={onSubmit}>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-[color:var(--lx-lion)]">
            {t.productInterest}
          </label>
          <select
            value={inquiryType}
            onChange={(e) => setInquiryType(e.target.value)}
            disabled={loading}
            className="mt-1.5 w-full rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] px-4 py-3 text-sm text-[color:var(--lx-text)]"
          >
            {t.inquiryOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-[color:var(--lx-muted)]">{t.fullName}</label>
          <input
            type="text"
            required
            disabled={loading}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            className="mt-1.5 w-full rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] px-4 py-3 text-sm"
            autoComplete="name"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[color:var(--lx-muted)]">{t.email}</label>
          <input
            type="email"
            required
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] px-4 py-3 text-sm"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[color:var(--lx-muted)]">{t.phone}</label>
          <input
            type="tel"
            disabled={loading}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] px-4 py-3 text-sm"
            autoComplete="tel"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[color:var(--lx-muted)]">{t.business}</label>
          <input
            type="text"
            disabled={loading}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] px-4 py-3 text-sm"
            autoComplete="organization"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[color:var(--lx-muted)]">{t.cityArea}</label>
          <input
            type="text"
            disabled={loading}
            value={cityArea}
            onChange={(e) => setCityArea(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] px-4 py-3 text-sm"
            autoComplete="address-level2"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[color:var(--lx-muted)]">{t.message}</label>
          <textarea
            required
            disabled={loading}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={12000}
            className="mt-1.5 w-full rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] px-4 py-3 text-sm"
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-[color:var(--lx-text-2)]">
          <input
            type="checkbox"
            required
            checked={consentToContact}
            onChange={(e) => setConsentToContact(e.target.checked)}
            disabled={loading}
            className="mt-1 h-4 w-4 shrink-0 rounded"
          />
          <span>{t.consent}</span>
        </label>

        {error ? (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-950">
            <p>{error}</p>
            <p className="mt-2 text-xs">
              {t.errorOrCall}{" "}
              <a href={LEONIX_PHONE_TEL} className="font-semibold underline">
                {LEONIX_PHONE_DISPLAY}
              </a>
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className={[
            "w-full min-h-[44px] whitespace-nowrap text-center text-sm sm:text-base px-4 py-3.5 rounded-full font-semibold transition shadow-[0_14px_40px_rgba(201,168,74,0.22)] disabled:opacity-70",
            "bg-[color:var(--lx-gold)] text-[color:var(--lx-text)] hover:brightness-95",
          ].join(" ")}
        >
          {loading ? t.submitting : t.submit}
        </button>
      </form>
    </section>
  );
}
