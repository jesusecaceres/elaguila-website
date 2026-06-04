"use client";

import { useState } from "react";
import { FaCalendarAlt, FaClock, FaEnvelope, FaGlobe, FaPhone } from "react-icons/fa";
import { SiWhatsapp } from "react-icons/si";
import type { EmpleosAnalyticsTrackMeta } from "../../lib/empleosAnalyticsIdentity";
import { trackEmpleosSidebarContactCta } from "../../lib/empleosCtaTracking";
import {
  buildCallIntent,
  buildSendEmailIntent,
  buildWebsiteIntent,
  buildWhatsAppMessageIntent,
  CtaActionSheet,
  type CtaSheetIntent,
} from "@/app/components/cta";

type Primary = "phone" | "whatsapp" | "email";

type Props = {
  pay: string;
  jobType: string;
  schedule: string;
  workModalityLabel?: string;
  description: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  websiteUrl?: string;
  primaryCta?: Primary;
  emailLabel: string;
  websiteLabel: string;
  labels: {
    jobType: string;
    schedule: string;
    modality: string;
  };
  /** When false, omit the entire contact button stack (pay/description still show). */
  showContactRow: boolean;
  contactAnalyticsMeta?: EmpleosAnalyticsTrackMeta;
};

const GOLD_BTN = "bg-[#B8943F] hover:bg-[#9A7A32]";
const SOFT_BTN = "border border-[#C9A85A] bg-[#FFFBF7] text-[#6B5320] hover:bg-[#FFF5E6]";

function digits(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function QuickJobCTACard({
  pay,
  jobType,
  schedule,
  workModalityLabel,
  description,
  phone,
  whatsapp,
  email,
  websiteUrl,
  primaryCta,
  emailLabel,
  websiteLabel,
  labels,
  showContactRow,
  contactAnalyticsMeta,
}: Props) {
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);
  const primary = primaryCta ?? "phone";
  const site = websiteUrl?.trim() ?? "";
  const contactShareExtras = { email: email ?? undefined, websiteUrl: site || undefined };

  const openSheet = (intent: CtaSheetIntent | null) => {
    if (intent) setCtaIntent(intent);
  };

  const openCallSheet = () => {
    if (!phone) return;
    trackEmpleosSidebarContactCta("phone", contactAnalyticsMeta);
    openSheet(buildCallIntent({ phone: digits(phone), contactShareExtras }));
  };

  const openWhatsAppSheet = () => {
    if (!whatsapp) return;
    trackEmpleosSidebarContactCta("whatsapp", contactAnalyticsMeta);
    openSheet(buildWhatsAppMessageIntent({ whatsappDigits: digits(whatsapp), message: "", contactShareExtras }));
  };

  const openEmailSheet = () => {
    if (!email) return;
    trackEmpleosSidebarContactCta("email", contactAnalyticsMeta);
    openSheet(
      buildSendEmailIntent({
        email,
        subject: "Consulta sobre vacante — Leonix Empleos",
        body: "",
        contactShareExtras,
      }),
    );
  };

  const openWebsiteSheet = () => {
    if (!site.startsWith("http")) return;
    trackEmpleosSidebarContactCta("website", contactAnalyticsMeta);
    openSheet(buildWebsiteIntent({ url: site, headline: websiteLabel, kind: "website" }));
  };

  const ctaClass = (role: "phone" | "whatsapp" | "email") =>
    primary === role
      ? `flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] px-4 text-sm font-bold text-white shadow-sm transition ${GOLD_BTN}`
      : `flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] px-4 text-sm font-semibold shadow-sm transition ${SOFT_BTN}`;

  return (
    <div className="rounded-[18px] border border-[#E8DFD0] bg-[#FFFBF7] p-5 shadow-[0_8px_28px_rgba(42,40,38,0.06)] sm:p-6">
      <p className="text-2xl font-bold text-[#8A5A18]">{pay}</p>

      <div className="mt-5 space-y-3 text-sm text-[#4A4744]">
        <div className="flex gap-3">
          <FaCalendarAlt className="mt-0.5 h-4 w-4 shrink-0 text-[#7A8899]" aria-hidden />
          <span>
            <span className="sr-only">{labels.jobType}: </span>
            {jobType}
          </span>
        </div>
        {workModalityLabel ? (
          <div className="flex gap-3">
            <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center text-[10px] font-bold text-[#7A8899]" aria-hidden>
              ●
            </span>
            <span>
              <span className="sr-only">{labels.modality}: </span>
              {workModalityLabel}
            </span>
          </div>
        ) : null}
        <div className="flex gap-3">
          <FaClock className="mt-0.5 h-4 w-4 shrink-0 text-[#7A8899]" aria-hidden />
          <span className="whitespace-pre-line">
            <span className="sr-only">{labels.schedule}: </span>
            {schedule}
          </span>
        </div>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-[#4A4744]">{description}</p>

      {showContactRow ? (
        <div className="mt-6 flex flex-col gap-3">
          {phone ? (
            <button type="button" onClick={openCallSheet} className={ctaClass("phone")}>
              <FaPhone className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{phone}</span>
            </button>
          ) : null}

          <div className={`grid gap-3 ${whatsapp && email ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
            {whatsapp ? (
              <button type="button" onClick={openWhatsAppSheet} className={ctaClass("whatsapp")}>
                <SiWhatsapp className="h-4 w-4 shrink-0" aria-hidden />
                WhatsApp
              </button>
            ) : null}
            {email ? (
              <button type="button" onClick={openEmailSheet} className={ctaClass("email")}>
                <FaEnvelope className="h-4 w-4 shrink-0" aria-hidden />
                {emailLabel}
              </button>
            ) : null}
          </div>

          {websiteUrl?.trim().startsWith("http") ? (
            <button
              type="button"
              onClick={openWebsiteSheet}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] px-3 text-sm font-semibold text-[#4F6B82] underline-offset-2 transition hover:underline"
            >
              <FaGlobe className="h-4 w-4 shrink-0" aria-hidden />
              {websiteLabel}
            </button>
          ) : null}
        </div>
      ) : null}

      <CtaActionSheet open={ctaIntent != null} onClose={() => setCtaIntent(null)} intent={ctaIntent} lang="es" />
    </div>
  );
}
