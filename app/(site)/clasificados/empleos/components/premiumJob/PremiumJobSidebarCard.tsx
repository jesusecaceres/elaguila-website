"use client";

import { useState } from "react";
import { FaClock, FaEnvelope, FaGlobe, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import { SiWhatsapp } from "react-icons/si";
import {
  buildCallIntent,
  buildSendEmailIntent,
  buildWebsiteIntent,
  buildWhatsAppMessageIntent,
  CtaActionSheet,
  type CtaSheetIntent,
} from "@/app/components/cta";

type Primary = "apply" | "phone" | "whatsapp" | "email" | "website";

type Props = {
  salaryPrimary: string;
  salarySecondary?: string;
  jobType: string;
  scheduleLabel?: string;
  locationLabel: string;
  featured: boolean;
  premium: boolean;
  phone?: string;
  whatsapp?: string;
  email?: string;
  websiteUrl?: string;
  primaryCta: Primary;
  applyLabel: string;
  websiteCtaLabel: string;
  emailLabel: string;
  phoneLabel: string;
  badgeFeatured: string;
  badgePremium: string;
};

const GOLD = "bg-[#B8943F] text-white hover:bg-[#9A7A32]";
const OUTLINE = "border border-[#C9A85A] bg-[#FFFBF7] text-[#6B5320] hover:bg-[#FFF5E6]";
const MUTED = "border border-[#E8DFD0] bg-white text-[#4A4744] hover:bg-[#FAF7F2]";

function digits(raw: string): string {
  return raw.replace(/\D/g, "");
}

type PrimaryAction =
  | { type: "apply"; url: string; label: string }
  | { type: "sheet"; label: string; onClick: () => void };

export function PremiumJobSidebarCard({
  salaryPrimary,
  salarySecondary,
  jobType,
  scheduleLabel,
  locationLabel,
  featured,
  premium,
  phone,
  whatsapp,
  email,
  websiteUrl,
  primaryCta,
  applyLabel,
  websiteCtaLabel,
  emailLabel,
  phoneLabel,
  badgeFeatured,
  badgePremium,
}: Props) {
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);
  const site = websiteUrl?.trim() ?? "";
  const contactShareExtras = { email: email ?? undefined, websiteUrl: site || undefined };

  const openSheet = (intent: CtaSheetIntent | null) => {
    if (intent) setCtaIntent(intent);
  };

  const openCallSheet = (rawPhone: string) => {
    openSheet(buildCallIntent({ phone: digits(rawPhone), contactShareExtras }));
  };

  const openWhatsAppSheet = (rawWa: string) => {
    openSheet(buildWhatsAppMessageIntent({ whatsappDigits: digits(rawWa), message: "", contactShareExtras }));
  };

  const openEmailSheet = (rawEmail: string) => {
    openSheet(
      buildSendEmailIntent({
        email: rawEmail,
        subject: "Consulta sobre vacante — Leonix Empleos",
        body: "",
        contactShareExtras,
      }),
    );
  };

  const openWebsiteSheet = (url: string, headline: string) => {
    openSheet(buildWebsiteIntent({ url, headline, kind: "website" }));
  };

  let primaryAction: PrimaryAction | null = null;

  if (primaryCta === "phone" && phone) {
    primaryAction = { type: "sheet", label: phoneLabel, onClick: () => openCallSheet(phone) };
  } else if (primaryCta === "whatsapp" && whatsapp) {
    primaryAction = { type: "sheet", label: "WhatsApp", onClick: () => openWhatsAppSheet(whatsapp) };
  } else if (primaryCta === "email" && email) {
    primaryAction = { type: "sheet", label: emailLabel, onClick: () => openEmailSheet(email) };
  } else if ((primaryCta === "website" || primaryCta === "apply") && site.startsWith("http")) {
    primaryAction = { type: "apply", url: site, label: applyLabel.trim() || websiteCtaLabel };
  } else if (site.startsWith("http")) {
    primaryAction = { type: "apply", url: site, label: applyLabel.trim() || websiteCtaLabel };
  } else if (phone) {
    primaryAction = { type: "sheet", label: phoneLabel, onClick: () => openCallSheet(phone) };
  } else if (whatsapp) {
    primaryAction = { type: "sheet", label: "WhatsApp", onClick: () => openWhatsAppSheet(whatsapp) };
  } else if (email) {
    primaryAction = { type: "sheet", label: emailLabel, onClick: () => openEmailSheet(email) };
  }

  const primaryClass = `flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] px-4 text-sm font-bold shadow-sm transition ${GOLD}`;
  const secClass = `flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] px-3 text-xs font-semibold shadow-sm transition sm:min-h-12 sm:text-[13px] ${OUTLINE}`;
  const terClass = `flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] px-3 text-xs font-semibold shadow-sm transition sm:min-h-12 sm:text-[13px] ${MUTED}`;

  const showPhone = Boolean(phone) && primaryCta !== "phone";
  const showWa = Boolean(whatsapp) && primaryCta !== "whatsapp";
  const showMail = Boolean(email) && primaryCta !== "email";
  const showSite = site.startsWith("http") && primaryCta !== "website" && primaryCta !== "apply";

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-[#E8DFD0] bg-[#FFFBF7] p-5 shadow-[0_12px_36px_rgba(42,40,38,0.08)] sm:p-6">
      {featured ? (
        <div className="absolute right-0 top-0 rounded-bl-lg bg-[#6B5320] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
          {badgeFeatured}
        </div>
      ) : null}

      <div className={featured ? "pr-16" : ""}>
        <p className="text-2xl font-bold text-[#8A5A18] sm:text-3xl">{salaryPrimary}</p>
        {salarySecondary ? (
          <p className="mt-1 text-sm font-medium text-[#5C564E]">{salarySecondary}</p>
        ) : null}

        <div className="mt-5 space-y-3 text-sm text-[#4A4744]">
          <div className="flex items-start gap-2">
            <FaClock className="mt-0.5 h-4 w-4 shrink-0 text-[#7A8899]" aria-hidden />
            <div>
              <span>{jobType}</span>
              {scheduleLabel ? <p className="mt-1 text-xs text-[#7A756E]">{scheduleLabel}</p> : null}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FaMapMarkerAlt className="mt-0.5 h-4 w-4 shrink-0 text-[#7A8899]" aria-hidden />
            <span className="leading-snug">{locationLabel}</span>
          </div>
        </div>

        {premium ? <p className="mt-4 text-xs font-semibold text-[#8A5A18]">+ {badgePremium}</p> : null}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {primaryAction ? (
          primaryAction.type === "apply" ? (
            <a
              href={primaryAction.url}
              target="_blank"
              rel="noopener noreferrer"
              className={primaryClass}
            >
              {primaryAction.label}
            </a>
          ) : (
            <button type="button" onClick={primaryAction.onClick} className={primaryClass}>
              {primaryAction.label}
            </button>
          )
        ) : (
          <span className={`${primaryClass} cursor-not-allowed opacity-60`} aria-disabled>
            {applyLabel}
          </span>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {showPhone ? (
            <button type="button" onClick={() => openCallSheet(phone!)} className={secClass}>
              <FaPhone className="h-4 w-4 shrink-0" aria-hidden />
              {phoneLabel}
            </button>
          ) : null}
          {showWa ? (
            <button type="button" onClick={() => openWhatsAppSheet(whatsapp!)} className={secClass}>
              <SiWhatsapp className="h-4 w-4 shrink-0" aria-hidden />
              WhatsApp
            </button>
          ) : null}
          {showMail ? (
            <button type="button" onClick={() => openEmailSheet(email!)} className={secClass}>
              <FaEnvelope className="h-4 w-4 shrink-0" aria-hidden />
              {emailLabel}
            </button>
          ) : null}
          {showSite ? (
            <button type="button" onClick={() => openWebsiteSheet(site, websiteCtaLabel)} className={terClass}>
              <FaGlobe className="h-4 w-4 shrink-0" aria-hidden />
              {websiteCtaLabel}
            </button>
          ) : null}
        </div>
      </div>

      <CtaActionSheet open={ctaIntent != null} onClose={() => setCtaIntent(null)} intent={ctaIntent} lang="es" />
    </div>
  );
}
