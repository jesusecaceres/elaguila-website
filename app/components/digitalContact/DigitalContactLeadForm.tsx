"use client";

import { useId, useState, type FormEvent } from "react";
import type { DigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";
import { DIGITAL_CONTACT_HOW_MET_OPTIONS } from "@/app/lib/digitalContact/digitalContactHowMet";
import type { DigitalContactLang } from "@/app/lib/digitalContact/digitalContactTypes";
import { trackDigitalContactEvent } from "@/app/lib/digitalContact/digitalContactAnalyticsClient";

type Props = {
  profileSlug: string;
  lang: DigitalContactLang;
  copy: DigitalContactCopy;
};

type SubmitState = "idle" | "submitting" | "success" | "error";

const inputClass =
  "w-full rounded-lg border border-[#D6C7AD] bg-white px-3.5 py-2.5 text-sm text-[#1F241C] placeholder:text-[#9A9686] outline-none transition focus:border-[var(--dc-accent)] focus:ring-2 focus:ring-[var(--dc-accent-border)]";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#5F6258]";

/** Lead Exchange — server-validated, honeypot-protected, CRM-ready architecture (digital_contact_leads). */
export function DigitalContactLeadForm({ profileSlug, lang, copy }: Props) {
  const idBase = useId();
  const [state, setState] = useState<SubmitState>("idle");
  const [consent, setConsent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "submitting") return;
    const form = e.currentTarget;
    const fd = new FormData(form);

    setState("submitting");
    try {
      const res = await fetch("/api/digital-contact/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileSlug,
          senderName: String(fd.get("senderName") ?? ""),
          businessName: String(fd.get("businessName") ?? ""),
          senderPhone: String(fd.get("senderPhone") ?? ""),
          senderEmail: String(fd.get("senderEmail") ?? ""),
          message: String(fd.get("message") ?? ""),
          howMet: String(fd.get("howMet") ?? ""),
          consent: fd.get("consent") === "on",
          lang,
          website: String(fd.get("website") ?? ""),
        }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (res.ok && json?.ok) {
        setState("success");
        trackDigitalContactEvent(profileSlug, "lead_created");
        form.reset();
        setConsent(false);
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <section id="lead-exchange" aria-labelledby="dc-lead-title" className="mx-auto w-full max-w-2xl scroll-mt-6 px-5 pt-12 sm:px-6 sm:pt-14">
      <div className="rounded-3xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <h2 id="dc-lead-title" className="font-serif text-2xl font-bold text-[#1F241C] sm:text-3xl">
            {copy.leadTitle}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#3D3428]">{copy.leadSubtitle}</p>
        </div>

        {state === "success" ? (
          <p role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
            {copy.leadSuccess}
          </p>
        ) : (
          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            {/* Honeypot — hidden from real visitors; bots that autofill every field get silently rejected server-side. */}
            <div className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
              <label htmlFor={`${idBase}-website`}>Website</label>
              <input id={`${idBase}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`${idBase}-name`} className={labelClass}>
                  {copy.leadName} *
                </label>
                <input id={`${idBase}-name`} name="senderName" type="text" required minLength={2} maxLength={200} className={inputClass} autoComplete="name" />
              </div>
              <div>
                <label htmlFor={`${idBase}-business`} className={labelClass}>
                  {copy.leadBusiness}
                </label>
                <input id={`${idBase}-business`} name="businessName" type="text" maxLength={200} className={inputClass} autoComplete="organization" />
              </div>
              <div>
                <label htmlFor={`${idBase}-phone`} className={labelClass}>
                  {copy.leadPhone}
                </label>
                <input id={`${idBase}-phone`} name="senderPhone" type="tel" maxLength={32} className={inputClass} autoComplete="tel" />
              </div>
              <div>
                <label htmlFor={`${idBase}-email`} className={labelClass}>
                  {copy.leadEmail} *
                </label>
                <input id={`${idBase}-email`} name="senderEmail" type="email" required maxLength={320} className={inputClass} autoComplete="email" />
              </div>
            </div>

            <div>
              <label htmlFor={`${idBase}-message`} className={labelClass}>
                {copy.leadMessage}
              </label>
              <textarea
                id={`${idBase}-message`}
                name="message"
                rows={3}
                maxLength={4000}
                placeholder={copy.leadMessagePlaceholder}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label htmlFor={`${idBase}-how-met`} className={labelClass}>
                {copy.leadHowMet}
              </label>
              <select id={`${idBase}-how-met`} name="howMet" className={inputClass} defaultValue="">
                <option value="">{copy.leadHowMetPlaceholder}</option>
                {DIGITAL_CONTACT_HOW_MET_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {lang === "en" ? opt.labelEn : opt.labelEs}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-start gap-2.5 text-sm text-[#3D3428]">
              <input
                type="checkbox"
                name="consent"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#D6C7AD] text-[var(--dc-primary)] focus:ring-[var(--dc-accent)]"
              />
              <span>{copy.leadConsent} *</span>
            </label>

            {state === "error" ? (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-900">
                {copy.leadError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={state === "submitting" || !consent}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[var(--dc-button-primary)] px-6 py-3 text-sm font-bold text-[#FFFDF7] shadow-md transition hover:bg-[var(--dc-button-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {state === "submitting" ? copy.leadSubmitting : copy.leadSubmit}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
