"use client";

import { useState } from "react";
import { FaCalendarAlt, FaClock, FaEnvelope, FaFacebook, FaGlobe, FaInstagram, FaLinkedin, FaPhone, FaSms, FaSnapchat, FaUser, FaYoutube } from "react-icons/fa";
import { SiTiktok, SiWhatsapp, SiX } from "react-icons/si";
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
  /** Primary apply link — shown as top "Aplicar ahora" CTA when present. */
  applyLink?: string;
  phone?: string;
  whatsapp?: string;
  smsPhone?: string;
  email?: string;
  websiteUrl?: string;
  /** Recruiter / contact person name. */
  contactPerson?: string;
  /** Recruiter role / title (e.g. "Hiring Manager"). */
  contactTitle?: string;
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
  lang: "es" | "en";
  /** Optional company links for "Conoce al empleador" section. */
  companyLinkedIn?: string;
  companyFacebook?: string;
  companyInstagram?: string;
  companyTikTok?: string;
  companyYouTube?: string;
  companyX?: string;
  companySnapchat?: string;
  companyOtherLinkLabel?: string;
  companyOtherLinkUrl?: string;
};

const BURGUNDY_BTN = "border border-[#7A1E2C]/15 bg-[#7A1E2C] text-[#FFFCF7] shadow-[0_8px_20px_-6px_rgba(122,30,44,0.4)] hover:bg-[#5e1721]";
const GOLD_BTN = "border border-[#C9A84A]/55 bg-[#FFFDF7] text-[#3D3428] hover:border-[#C9A84A] hover:bg-[#FBF7EF]";
const SOFT_BTN = "border border-[#D6C7AD]/80 bg-[#FFFDF7] text-[#5C5346] hover:border-[#C9A84A]/40 hover:bg-[#FBF7EF]";

function digits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Format US 10-digit numbers as (XXX) XXX-XXXX; preserve others as-is. */
function formatPhone(raw: string): string {
  const d = digits(raw);
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d[0] === "1") return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return raw.trim();
}

/** Basic email shape guard — must contain @ and a dot after it. */
function looksLikeEmail(val: string): boolean {
  const v = val.trim();
  const at = v.indexOf("@");
  if (at < 1) return false;
  const afterAt = v.slice(at + 1);
  return afterAt.includes(".") && afterAt.length > 2;
}

/** Normalize pay: add $ to bare numbers, fix "$ 100" spacing, clean ranges. */
function formatPay(raw: string): string {
  const s = raw.trim();
  if (!s || s === "—") return s;
  // Already has $ — just fix double-space: "$ 100" -> "$100"
  const fixed = s.replace(/\$\s+/g, "$");
  // Pure number (possibly with decimal) — add $
  if (/^\d+(\.\d+)?$/.test(fixed)) return `$${fixed}`;
  // Range like "20-25" or "20 - 25"
  const rangeMatch = fixed.match(/^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)(.*)$/);
  if (rangeMatch) {
    const [, lo, hi, rest] = rangeMatch;
    return `$${lo}–$${hi}${rest}`;
  }
  return fixed;
}

export function QuickJobCTACard({
  pay,
  jobType,
  schedule,
  workModalityLabel,
  description,
  applyLink,
  phone,
  whatsapp,
  smsPhone,
  email,
  websiteUrl,
  contactPerson,
  contactTitle,
  primaryCta,
  emailLabel,
  websiteLabel,
  labels,
  showContactRow,
  contactAnalyticsMeta,
  lang,
  companyLinkedIn,
  companyFacebook,
  companyInstagram,
  companyTikTok,
  companyYouTube,
  companyX,
  companySnapchat,
  companyOtherLinkLabel,
  companyOtherLinkUrl,
}: Props) {
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);
  const primary = primaryCta ?? "phone";
  const site = websiteUrl?.trim() ?? "";
  const validEmail = email && looksLikeEmail(email) ? email : undefined;
  const hasApplyLink = Boolean(applyLink?.trim().startsWith("http"));
  const hasSms = Boolean(smsPhone?.trim());
  const hasCompanyLinks = Boolean(
    companyLinkedIn || companyFacebook || companyInstagram ||
    companyTikTok || companyYouTube || companyX || companySnapchat ||
    (companyOtherLinkLabel && companyOtherLinkUrl)
  );
  const displayPay = formatPay(pay);
  const contactShareExtras = { email: validEmail, websiteUrl: site || undefined };

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
    if (!validEmail) return;
    trackEmpleosSidebarContactCta("email", contactAnalyticsMeta);
    openSheet(
      buildSendEmailIntent({
        email: validEmail,
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
      ? `flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition ${BURGUNDY_BTN}`
      : `flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${GOLD_BTN}`;

  return (
    <div className="rounded-xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-5 shadow-[0_14px_40px_-18px_rgba(31,36,28,0.2)] ring-1 ring-[#C9A84A]/10 sm:p-6">
      <p className="text-2xl font-bold text-[#7A1E2C]">{displayPay}</p>

      <div className="mt-4 space-y-2.5 text-sm text-[#4A4744]">
        <div className="flex gap-3">
          <FaCalendarAlt className="mt-0.5 h-4 w-4 shrink-0 text-[#7A8899]" aria-hidden />
          <span>
            <span className="sr-only">{labels.jobType}: </span>
            {jobType}
          </span>
        </div>
        {workModalityLabel ? (
          <div className="flex gap-3">
            <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center text-[10px] font-bold text-[#7A8899]" aria-hidden>●</span>
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
        {contactPerson ? (
          <div className="flex gap-3">
            <FaUser className="mt-0.5 h-4 w-4 shrink-0 text-[#7A8899]" aria-hidden />
            <div>
              <span className="font-medium text-[#2A2826]">{contactPerson}</span>
              {contactTitle ? (
                <span className="ml-1.5 text-xs text-[#5C564E]">· {contactTitle}</span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* Apply section header */}
      {hasApplyLink || showContactRow ? (
        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8A5A18]">
          {hasApplyLink
            ? (lang === "es" ? "Aplicar a este empleo" : "Apply for this job")
            : (lang === "es" ? "Contactar empleador" : "Contact employer")}
        </p>
      ) : null}

      {/* Primary apply link — shown first if employer provided one */}
      {hasApplyLink ? (
        <a
          href={applyLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition ${BURGUNDY_BTN}`}
          onClick={() => trackEmpleosSidebarContactCta("phone", contactAnalyticsMeta)}
        >
          {lang === "es" ? "Aplicar ahora" : "Apply now"}
        </a>
      ) : null}

      {showContactRow ? (
        <div className={`flex flex-col gap-3 ${hasApplyLink ? "mt-4" : "mt-3"}`}>
          {phone ? (
            <button type="button" onClick={openCallSheet} className={ctaClass("phone")}>
              <FaPhone className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{formatPhone(phone)}</span>
            </button>
          ) : null}

          <div className={`grid gap-3 ${whatsapp && email ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
            {whatsapp ? (
              <button type="button" onClick={openWhatsAppSheet} className={ctaClass("whatsapp")}>
                <SiWhatsapp className="h-4 w-4 shrink-0" aria-hidden />
                WhatsApp
              </button>
            ) : null}
            {validEmail ? (
              <button type="button" onClick={openEmailSheet} className={ctaClass("email")}>
                <FaEnvelope className="h-4 w-4 shrink-0" aria-hidden />
                {emailLabel}
              </button>
            ) : null}
          </div>

          {hasSms ? (
            <a
              href={`sms:${digits(smsPhone!)}`}
              className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${SOFT_BTN}`}
            >
              <FaSms className="h-4 w-4 shrink-0" aria-hidden />
              {lang === "es" ? "Enviar SMS" : "Send SMS"}
            </a>
          ) : null}

          {websiteUrl?.trim().startsWith("http") ? (
            <button
              type="button"
              onClick={openWebsiteSheet}
              className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${SOFT_BTN}`}
            >
              <FaGlobe className="h-4 w-4 shrink-0" aria-hidden />
              {websiteLabel}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Publicado en Leonix trust cue */}
      <p className="mt-5 border-l-[3px] border-[#2A4536]/45 border-t border-[#D6C7AD]/70 pl-3 pt-4 text-[11px] leading-snug text-[#7A7164]/95">
        {lang === "es" ? "Publicado en Leonix · Verifica la oferta antes de aplicar." : "Published on Leonix · Verify the offer before applying."}
      </p>

      {/* Conoce al empleador — company social/web links */}
      {hasCompanyLinks ? (
        <div className="mt-4 border-t border-[#D6C7AD]/70 pt-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-[#8A6B1F]">
            {lang === "es" ? "Conoce al empleador" : "Learn about the employer"}
          </p>
          <div className="flex flex-wrap gap-2">
            {companyLinkedIn ? (
              <a href={companyLinkedIn} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#D6C7AD]/80 bg-[#FFFDF7] px-3 text-xs font-semibold text-[#0A66C2] transition hover:border-[#C9A84A]/60 hover:bg-[#FBF7EF]">
                <FaLinkedin className="h-3.5 w-3.5" aria-hidden /> LinkedIn
              </a>
            ) : null}
            {companyFacebook ? (
              <a href={companyFacebook} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#D6C7AD]/80 bg-[#FFFDF7] px-3 text-xs font-semibold text-[#1877F2] transition hover:border-[#C9A84A]/60 hover:bg-[#FBF7EF]">
                <FaFacebook className="h-3.5 w-3.5" aria-hidden /> Facebook
              </a>
            ) : null}
            {companyInstagram ? (
              <a href={companyInstagram} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#D6C7AD]/80 bg-[#FFFDF7] px-3 text-xs font-semibold text-[#C13584] transition hover:border-[#C9A84A]/60 hover:bg-[#FBF7EF]">
                <FaInstagram className="h-3.5 w-3.5" aria-hidden /> Instagram
              </a>
            ) : null}
            {companyTikTok ? (
              <a href={companyTikTok} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#D6C7AD]/80 bg-[#FFFDF7] px-3 text-xs font-semibold text-[#3D3428] transition hover:border-[#C9A84A]/60 hover:bg-[#FBF7EF]">
                <SiTiktok className="h-3.5 w-3.5" aria-hidden /> TikTok
              </a>
            ) : null}
            {companyYouTube ? (
              <a href={companyYouTube} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#D6C7AD]/80 bg-[#FFFDF7] px-3 text-xs font-semibold text-[#CC0000] transition hover:border-[#C9A84A]/60 hover:bg-[#FBF7EF]">
                <FaYoutube className="h-3.5 w-3.5" aria-hidden /> YouTube
              </a>
            ) : null}
            {companyX ? (
              <a href={companyX} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#D6C7AD]/80 bg-[#FFFDF7] px-3 text-xs font-semibold text-[#3D3428] transition hover:border-[#C9A84A]/60 hover:bg-[#FBF7EF]">
                <SiX className="h-3.5 w-3.5" aria-hidden /> X
              </a>
            ) : null}
            {companySnapchat ? (
              <a href={companySnapchat} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#D6C7AD]/80 bg-[#FFFDF7] px-3 text-xs font-semibold text-[#8A7300] transition hover:border-[#C9A84A]/60 hover:bg-[#FBF7EF]">
                <FaSnapchat className="h-3.5 w-3.5" aria-hidden /> Snapchat
              </a>
            ) : null}
            {companyOtherLinkLabel && companyOtherLinkUrl ? (
              <a href={companyOtherLinkUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#D6C7AD]/80 bg-[#FFFDF7] px-3 text-xs font-semibold text-[#5C5346] transition hover:border-[#C9A84A]/60 hover:bg-[#FBF7EF]">
                <FaGlobe className="h-3.5 w-3.5" aria-hidden /> {companyOtherLinkLabel}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <CtaActionSheet open={ctaIntent != null} onClose={() => setCtaIntent(null)} intent={ctaIntent} lang={lang} />
    </div>
  );
}
