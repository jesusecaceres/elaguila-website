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
  getLeadSuccessMessage,
  getPublicLeadErrorMessage,
} from "@/app/lib/leonix/leadConfirmationCopy";
import {
  INQUIRY_TYPES,
  inquiryTypeLabel,
  parseInquiryType,
  PREFERRED_CONTACT_METHODS,
  type InquiryType,
} from "@/app/lib/leonix/inquiryTypes";
import { getPublicLocaleCopy, type PublicFormLang } from "@/app/lib/leonix/publicFormCopy";

const SUBMIT_BTN =
  "w-full min-h-[44px] whitespace-nowrap text-center text-sm sm:text-base px-4 py-3 rounded-xl font-semibold shadow-[0_18px_48px_rgba(42,36,22,0.18)] transition disabled:cursor-not-allowed disabled:opacity-70";

const INPUT =
  "w-full p-3 rounded-lg bg-white/70 border border-[color:var(--lx-nav-border)] text-[color:var(--lx-text)] placeholder:text-[color:var(--lx-muted)] focus:outline-none";

function tiendaQuoteHref(lang: PublicFormLang, sourcePage: string): string {
  const params = new URLSearchParams({
    lang,
    service: "cotizacion-general",
    sourceCta: "promo_quote",
    sourcePage: sourcePage === "/contacto" ? "contacto" : sourcePage,
  });
  return `${LEONIX_TIENDA_CONTACT_PATH}?${params.toString()}`;
}

export function GlobalContactForm(props: {
  lang: PublicFormLang;
  initialMessage?: string;
  initialInquiryType?: string;
  sourcePage?: string;
  sourceCta?: string;
}) {
  const { lang, initialMessage, initialInquiryType, sourcePage = "/contacto", sourceCta = "" } = props;
  const locale = getPublicLocaleCopy(lang);
  const t = locale.contactForm;

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
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

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
      setSuccessMessage(getLeadSuccessMessage(inquiryType, lang));
      setSubmitted(true);
      return;
    }

    setError(result.message || getPublicLeadErrorMessage(lang));
  }

  if (submitted) {
    return (
      <div className="bg-[color:var(--lx-card)] p-6 sm:p-8 rounded-2xl shadow-[0_18px_48px_rgba(42,36,22,0.10)] border border-[color:var(--lx-nav-border)]">
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-4 text-sm text-emerald-900"
        >
          <p className="font-medium leading-relaxed">{successMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[color:var(--lx-card)] p-6 sm:p-8 rounded-2xl shadow-[0_18px_48px_rgba(42,36,22,0.10)] border border-[color:var(--lx-nav-border)]">
      <h2 className="text-2xl font-semibold text-[color:var(--lx-text)] mb-4">{t.formTitle}</h2>
      <p className="text-sm text-[color:var(--lx-muted)] mb-6 leading-relaxed">
        {t.formIntro}{" "}
        <VisibleEmailWithCopy email={LEONIX_GLOBAL_EMAIL} lang={lang} />.
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
              <Link href={tiendaQuoteHref(lang, sourcePage)} className="font-semibold text-[color:var(--lx-lion)] underline">
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
            {t.fields.phone} ({t.optional})
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
            {t.fields.businessName} ({t.optional})
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
            {t.fields.cityArea} ({t.optional})
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
            {t.fields.websiteOrSocial} ({t.optional})
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
            {t.fields.businessCategory} ({t.optional})
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
              {t.errorOrEmail}{" "}
              <a href={`mailto:${LEONIX_GLOBAL_EMAIL}`} className="font-semibold underline">
                {LEONIX_GLOBAL_EMAIL}
              </a>{" "}
              {t.errorOrCall}{" "}
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
