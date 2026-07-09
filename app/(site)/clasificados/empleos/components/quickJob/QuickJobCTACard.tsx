"use client";

import { useState } from "react";
import { FaCalendarAlt, FaClock, FaEnvelope, FaFacebook, FaGlobe, FaInstagram, FaLinkedin, FaPhone, FaSms, FaShareAlt, FaSnapchat, FaUser, FaYoutube } from "react-icons/fa";
import { SiTiktok, SiWhatsapp, SiX } from "react-icons/si";
import { normalizePayDisplayParts } from "@/app/publicar/empleos/shared/lib/empleosPayDisplay";
import { empleosPhoneDigits, formatEmpleosPhoneDisplay } from "@/app/publicar/empleos/shared/lib/empleosPhoneDisplay";
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
  payAmount?: string;
  payUnit?: string;
  payUnitCustom?: string;
  payNote?: string;
  jobType: string;
  jobTypeLabel?: string;
  /** Compact schedule for sidebar — not full multi-row dump. */
  scheduleSummary: string;
  workModalityLabel?: string;
  applyLink?: string;
  phone?: string;
  whatsapp?: string;
  smsPhone?: string;
  email?: string;
  websiteUrl?: string;
  contactPerson?: string;
  contactTitle?: string;
  preferredApplyMethod?: string;
  primaryCta?: Primary;
  emailLabel: string;
  websiteLabel: string;
  labels: {
    jobType: string;
    schedule: string;
    modality: string;
  };
  showContactRow: boolean;
  contactAnalyticsMeta?: EmpleosAnalyticsTrackMeta;
  lang: "es" | "en";
  companyLinkedIn?: string;
  companyFacebook?: string;
  companyInstagram?: string;
  companyTikTok?: string;
  companyYouTube?: string;
  companyX?: string;
  companySnapchat?: string;
  companyOtherLinkLabel?: string;
  companyOtherLinkUrl?: string;
  listingTitle?: string;
  businessName?: string;
};

const BURGUNDY_BTN = "border border-[#7A1E2C]/15 bg-[#7A1E2C] text-[#FFFCF7] shadow-[0_8px_20px_-6px_rgba(122,30,44,0.4)] hover:bg-[#5e1721]";
const GOLD_BTN = "border border-[#C9A84A]/55 bg-[#FFFDF7] text-[#3D3428] hover:border-[#C9A84A] hover:bg-[#FBF7EF]";
const SOFT_BTN = "border border-[#D6C7AD]/80 bg-[#FFFDF7] text-[#5C5346] hover:border-[#C9A84A]/40 hover:bg-[#FBF7EF]";

function digits(raw: string): string {
  return empleosPhoneDigits(raw);
}

function formatPhone(raw: string): string {
  return formatEmpleosPhoneDisplay(raw);
}

function looksLikeEmail(val: string): boolean {
  const v = val.trim();
  const at = v.indexOf("@");
  if (at < 1) return false;
  const afterAt = v.slice(at + 1);
  return afterAt.includes(".") && afterAt.length > 2;
}

export function QuickJobCTACard({
  pay,
  payAmount,
  payUnit,
  payUnitCustom,
  payNote,
  jobType,
  jobTypeLabel,
  scheduleSummary,
  workModalityLabel,
  applyLink,
  phone,
  whatsapp,
  smsPhone,
  email,
  websiteUrl,
  contactPerson,
  contactTitle,
  preferredApplyMethod,
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
  listingTitle,
  businessName,
}: Props) {
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const validEmail = email && looksLikeEmail(email) ? email : undefined;
  const hasApplyLink = Boolean(applyLink?.trim().startsWith("http"));
  const hasSms = Boolean(smsPhone?.trim());
  const hasCompanyLinks = Boolean(
    companyLinkedIn || companyFacebook || companyInstagram ||
    companyTikTok || companyYouTube || companyX || companySnapchat ||
    (companyOtherLinkLabel && companyOtherLinkUrl)
  );
  const payParts = normalizePayDisplayParts({ pay, payAmount, payUnit, payUnitCustom, payNote }, lang);
  const displayPay = payParts.headline;
  const payNoteDisplay = payParts.note;
  const typeLine = jobTypeLabel?.trim() || jobType;
  const contactShareExtras = { email: validEmail, websiteUrl: websiteUrl?.trim() || undefined };

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
        subject: lang === "es" ? "Consulta sobre vacante — Leonix Empleos" : "Job inquiry — Leonix Empleos",
        body: "",
        contactShareExtras,
      }),
    );
  };

  const openWebsiteSheet = () => {
    const site = websiteUrl?.trim() ?? "";
    if (!site.startsWith("http")) return;
    trackEmpleosSidebarContactCta("website", contactAnalyticsMeta);
    openSheet(buildWebsiteIntent({ url: site, headline: websiteLabel, kind: "website" }));
  };

  const handleNativeShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareTitle = listingTitle || businessName || "Leonix Media";

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          url: shareUrl,
        });
      } catch {
        // User canceled or share failed silently
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch {
        // Clipboard failed silently
      }
    }
  };

  const primaryIsApply = hasApplyLink;
  const primaryIsWhatsApp = !primaryIsApply && preferredApplyMethod === "whatsapp" && whatsapp;
  const primaryIsEmail = !primaryIsApply && preferredApplyMethod === "email" && validEmail;
  const primaryIsPhone = !primaryIsApply && (preferredApplyMethod === "phone" || primaryIsEmail === false) && phone;

  const ctaClass = (role: "phone" | "whatsapp" | "email", isPrimary: boolean) =>
    isPrimary
      ? `flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition ${BURGUNDY_BTN}`
      : `flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${GOLD_BTN}`;

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-5 shadow-[0_14px_40px_-18px_rgba(31,36,28,0.2)] ring-1 ring-[#C9A84A]/10 sm:p-6">
      <p className="text-2xl font-bold leading-tight text-[#7A1E2C] sm:text-[1.65rem]">{displayPay}</p>
      {payNoteDisplay ? (
        <p className="mt-1 text-sm leading-snug text-[#7A7164]">{payNoteDisplay}</p>
      ) : null}

      <div className="mt-4 space-y-2.5 text-sm text-[#4A4744]">
        {typeLine && typeLine !== "—" ? (
          <div className="flex gap-3">
            <FaCalendarAlt className="mt-0.5 h-4 w-4 shrink-0 text-[#7A8899]" aria-hidden />
            <span>
              <span className="sr-only">{labels.jobType}: </span>
              {typeLine}
            </span>
          </div>
        ) : null}
        {workModalityLabel ? (
          <div className="flex gap-3">
            <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center text-[10px] font-bold text-[#7A8899]" aria-hidden>●</span>
            <span>
              <span className="sr-only">{labels.modality}: </span>
              {workModalityLabel}
            </span>
          </div>
        ) : null}
        {scheduleSummary && scheduleSummary !== "—" ? (
          <div className="flex gap-3">
            <FaClock className="mt-0.5 h-4 w-4 shrink-0 text-[#7A8899]" aria-hidden />
            <span className="min-w-0 break-words">
              <span className="sr-only">{labels.schedule}: </span>
              {scheduleSummary}
            </span>
          </div>
        ) : null}
        {contactPerson ? (
          <div className="flex gap-3">
            <FaUser className="mt-0.5 h-4 w-4 shrink-0 text-[#7A8899]" aria-hidden />
            <div className="min-w-0">
              <span className="font-medium text-[#2A2826]">{contactPerson}</span>
              {contactTitle ? (
                <span className="ml-1.5 text-xs text-[#5C564E]">· {contactTitle}</span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {hasApplyLink || showContactRow ? (
        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8A5A18]">
          {hasApplyLink
            ? (lang === "es" ? "Aplicar a este empleo" : "Apply for this job")
            : (lang === "es" ? "Contactar empleador" : "Contact employer")}
        </p>
      ) : null}

      {hasApplyLink ? (
        <a
          href={applyLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition ${BURGUNDY_BTN}`}
        >
          {lang === "es" ? "Aplicar ahora" : "Apply now"}
        </a>
      ) : null}

      {showContactRow ? (
        <div className={`flex flex-col gap-2.5 ${hasApplyLink ? "mt-4" : "mt-3"}`}>
          {!hasApplyLink && primaryIsPhone ? (
            <button type="button" onClick={openCallSheet} className={ctaClass("phone", true)}>
              <FaPhone className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{formatPhone(phone!)}</span>
            </button>
          ) : null}
          {!hasApplyLink && primaryIsWhatsApp ? (
            <button type="button" onClick={openWhatsAppSheet} className={ctaClass("whatsapp", true)}>
              <SiWhatsapp className="h-4 w-4 shrink-0" aria-hidden />
              WhatsApp
            </button>
          ) : null}
          {!hasApplyLink && primaryIsEmail ? (
            <button type="button" onClick={openEmailSheet} className={ctaClass("email", true)}>
              <FaEnvelope className="h-4 w-4 shrink-0" aria-hidden />
              {emailLabel}
            </button>
          ) : null}

          {phone && (hasApplyLink || !primaryIsPhone) ? (
            <button type="button" onClick={openCallSheet} className={ctaClass("phone", false)}>
              <FaPhone className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{formatPhone(phone)}</span>
            </button>
          ) : null}
          {whatsapp && (hasApplyLink || !primaryIsWhatsApp) ? (
            <button type="button" onClick={openWhatsAppSheet} className={ctaClass("whatsapp", false)}>
              <SiWhatsapp className="h-4 w-4 shrink-0" aria-hidden />
              WhatsApp
            </button>
          ) : null}
          {validEmail && (hasApplyLink || !primaryIsEmail) ? (
            <button type="button" onClick={openEmailSheet} className={ctaClass("email", false)}>
              <FaEnvelope className="h-4 w-4 shrink-0" aria-hidden />
              {emailLabel}
            </button>
          ) : null}
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
            <button type="button" onClick={openWebsiteSheet} className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${SOFT_BTN}`}>
              <FaGlobe className="h-4 w-4 shrink-0" aria-hidden />
              {websiteLabel}
            </button>
          ) : null}
          <button type="button" onClick={handleNativeShare} className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${SOFT_BTN}`}>
            {shareCopied ? (
              <>
                <span className="text-xs">{lang === "es" ? "Enlace copiado" : "Link copied"}</span>
              </>
            ) : (
              <>
                <FaShareAlt className="h-4 w-4 shrink-0" aria-hidden />
                {lang === "es" ? "Compartir" : "Share"}
              </>
            )}
          </button>
        </div>
      ) : null}

      {hasCompanyLinks ? (
        <div className="mt-5 border-t border-[#D6C7AD]/70 pt-5">
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
