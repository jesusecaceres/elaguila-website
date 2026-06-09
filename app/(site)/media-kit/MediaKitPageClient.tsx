"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { GateDestinationShell } from "@/app/components/leonix/GateDestinationShell";
import { parseGateLang } from "@/app/(site)/lib/parseGateLang";
import { submitContactForm } from "@/app/(site)/lib/submitContactForm";
import { getLeadSuccessMessage, getPublicLeadErrorMessage } from "@/app/lib/leonix/leadConfirmationCopy";
import { getPublicLocaleCopy } from "@/app/lib/leonix/publicFormCopy";
import { getLanguageLabel } from "@/app/lib/language";

const inputClass =
  "w-full rounded-lg border border-[#D6C7AD] bg-[#FFFDF7] px-4 py-3 text-[#1F241C] placeholder:text-[#5F6258] focus:outline-none focus:ring-2 focus:ring-[#C9A84A]/40";

export default function MediaKitPageClient() {
  const searchParams = useSearchParams();
  const lang = useMemo(() => parseGateLang(searchParams?.get("lang")), [searchParams]);
  const locale = getPublicLocaleCopy(lang);
  const cf = locale.contactForm;
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    if (!consent) {
      setError(cf.consentError);
      return;
    }

    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const fd = new FormData(form);

    const result = await submitContactForm(
      {
        fullName: fd.get("name"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        businessName: fd.get("business"),
        message: fd.get("message") || locale.inquiryLabels.mediaKit,
        inquiryType: "mediaKit",
        sourcePage: "/media-kit",
        sourceCta: "media_kit_interest",
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
      <GateDestinationShell
        lang={lang}
        title={locale.newsletter.successTitle}
        subtitle=""
        body={getLeadSuccessMessage("mediaKit", lang)}
      >
        <p className="text-sm text-[#5F6258]">
          {locale.newsletter.languageLabel}:{" "}
          <span className="font-semibold text-[#3D3428]">{getLanguageLabel(lang)}</span>
        </p>
      </GateDestinationShell>
    );
  }

  return (
    <GateDestinationShell
      lang={lang}
      title={locale.inquiryLabels.mediaKit}
      subtitle={locale.contactPage.intro}
      body={locale.leads.leadSuccess.mediaKit}
    >
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 shadow-sm">
        <Field label={cf.fields.fullName}>
          <input
            name="name"
            type="text"
            required
            disabled={loading}
            autoComplete="name"
            className={inputClass}
            placeholder={cf.placeholders.fullName}
          />
        </Field>
        <Field label={cf.fields.email}>
          <input
            name="email"
            type="email"
            required
            disabled={loading}
            autoComplete="email"
            className={inputClass}
            placeholder={cf.placeholders.email}
          />
        </Field>
        <Field label={cf.fields.phone}>
          <input
            name="phone"
            type="tel"
            disabled={loading}
            autoComplete="tel"
            className={inputClass}
            placeholder={cf.placeholders.phone}
          />
        </Field>
        <Field label={cf.fields.businessName}>
          <input
            name="business"
            type="text"
            disabled={loading}
            autoComplete="organization"
            className={inputClass}
            placeholder={cf.placeholders.businessName}
          />
        </Field>
        <Field label={cf.fields.message}>
          <textarea
            name="message"
            rows={4}
            required
            disabled={loading}
            className={inputClass}
            placeholder={cf.placeholders.message}
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
          <span>{cf.consent}</span>
        </label>
        {error ? (
          <p className="rounded-lg border border-[#7A1E2C]/30 bg-[#7A1E2C]/10 px-3 py-2 text-sm text-[#7A1E2C]" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#7A1E2C] px-6 py-3 text-base font-bold text-white shadow-md transition hover:bg-[#5e1721] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? cf.sending : cf.send}
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
