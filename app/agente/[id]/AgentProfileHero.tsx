"use client";

import {
  FaFacebookF,
  FaGlobe,
  FaInstagram,
  FaTiktok,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type SocialPlatform = "facebook" | "instagram" | "youtube" | "tiktok" | "whatsapp" | "other";

function detectSocialPlatform(url: string, label?: string): SocialPlatform {
  const u = url.toLowerCase();
  const l = (label ?? "").toLowerCase();
  if (/facebook\.com|fb\.com|fb\.me/.test(u) || l.includes("facebook")) return "facebook";
  if (/instagram\.com|instagr\.am/.test(u) || l.includes("instagram") || l === "ig") return "instagram";
  if (/youtube\.com|youtu\.be/.test(u) || l.includes("youtube")) return "youtube";
  if (/tiktok\.com/.test(u) || l.includes("tiktok")) return "tiktok";
  if (/wa\.me|whatsapp\.com|api\.whatsapp/.test(u) || l.includes("whatsapp")) return "whatsapp";
  return "other";
}

function SocialPlatformIcon({ platform, className }: { platform: SocialPlatform; className?: string }) {
  const cn = cx("h-[1.1rem] w-[1.1rem]", className);
  switch (platform) {
    case "facebook":
      return <FaFacebookF className={cn} aria-hidden />;
    case "instagram":
      return <FaInstagram className={cn} aria-hidden />;
    case "youtube":
      return <FaYoutube className={cn} aria-hidden />;
    case "tiktok":
      return <FaTiktok className={cn} aria-hidden />;
    case "whatsapp":
      return <FaWhatsapp className={cn} aria-hidden />;
    default:
      return <FaGlobe className={cn} aria-hidden />;
  }
}

export type AgentProfileHeroProps = {
  lang: "es" | "en";
  agentName: string;
  agentLicense: string | null;
  serviceAreaLines: string[];
  website: string | null;
  socialLinks: Array<{ label: string; url: string }>;
  officePhone: string | null;
  languages: string | null;
  agentPhotoUrl: string | null;
};

/**
 * Premium agent profile hero: info column (left) + large portrait (right).
 * Used only on the public `/agente/[id]` page — not the clasificados preview rail.
 */
export default function AgentProfileHero({
  lang,
  agentName,
  agentLicense,
  serviceAreaLines,
  website,
  socialLinks,
  officePhone,
  languages,
  agentPhotoUrl,
}: AgentProfileHeroProps) {
  const t =
    lang === "es"
      ? {
          serviceAreas: "Zonas de servicio",
          visitWeb: "Visitar sitio web",
          phone: "Teléfono",
          langs: "Idiomas",
          licensePrefix: "Licencia:",
        }
      : {
          serviceAreas: "Service areas",
          visitWeb: "Visit website",
          phone: "Phone",
          langs: "Languages",
          licensePrefix: "License:",
        };

  const licenseTrim = (agentLicense ?? "").trim();
  const areas = [...new Set(serviceAreaLines.map((s) => s.trim()).filter(Boolean))];
  const websiteHref = website?.trim()
    ? website.trim().startsWith("http")
      ? website.trim()
      : `https://${website.trim()}`
    : "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-8 lg:gap-12 lg:items-stretch">
      <div
        className={cx(
          "rounded-2xl border border-white/10 bg-gradient-to-b from-[#2f2d2a] to-[#1c1b19] p-7 sm:p-9 shadow-[0_24px_56px_-28px_rgba(0,0,0,0.55)] flex flex-col min-h-[min(100%,420px)] lg:min-h-[520px] text-[#F4F1EA]"
        )}
        data-section="agent-profile-info"
      >
        <h1 className="font-serif text-[1.75rem] sm:text-[2.1rem] font-bold text-white leading-[1.12] tracking-tight break-words">
          {agentName}
        </h1>

        {licenseTrim ? (
          <p className="mt-3 text-sm sm:text-[0.95rem] text-[#F4F1EA]/80 leading-snug">
            {t.licensePrefix} {licenseTrim}
          </p>
        ) : null}

        {areas.length > 0 ? (
          <div className="mt-8 pt-6 border-t border-[#C9B46A]/35">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9B46A]/95 mb-2.5">{t.serviceAreas}</p>
            <p className="text-[0.95rem] sm:text-base text-[#F4F1EA]/95 leading-relaxed font-medium">{areas.join(" · ")}</p>
          </div>
        ) : null}

        {websiteHref ? (
          <div className={cx("mt-8", areas.length === 0 && "pt-6 border-t border-[#C9B46A]/35")}>
            <a
              href={websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3F5A43] px-4 py-3.5 text-sm font-semibold text-[#F7F4EC] shadow-[0_10px_24px_-14px_rgba(0,0,0,0.5)] transition hover:bg-[#36503A]"
            >
              <FaGlobe className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {t.visitWeb}
            </a>
          </div>
        ) : null}

        {socialLinks.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2.5">
            {socialLinks.map((s, i) => {
              const u = s.url.trim();
              if (!/^https?:\/\//i.test(u)) return null;
              const platform = detectSocialPlatform(u, s.label);
              const label = (s.label || "Social").trim();
              return (
                <a
                  key={`${u}-${i}`}
                  href={u}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  aria-label={label}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#F4F1EA] transition hover:bg-white/18 hover:border-[#C9B46A]/40"
                >
                  <SocialPlatformIcon platform={platform} />
                </a>
              );
            })}
          </div>
        ) : null}

        {officePhone || (languages ?? "").trim() ? (
          <div className="mt-auto pt-8 space-y-6">
            {officePhone ? (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C9B46A]/90 mb-2">{t.phone}</p>
                <a
                  href={`tel:${officePhone.replace(/\D/g, "")}`}
                  className="text-lg sm:text-xl font-semibold text-white tracking-tight hover:text-[#C9B46A] transition"
                >
                  {officePhone}
                </a>
              </div>
            ) : null}

            {(languages ?? "").trim() ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9B46A] mb-2">{t.langs}</p>
                <p className="text-base sm:text-[1.05rem] font-semibold text-[#F4F1EA] leading-snug">{(languages ?? "").trim()}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="relative min-h-[320px] sm:min-h-[400px] lg:min-h-[520px] rounded-2xl overflow-hidden border border-[#C9B46A]/35 bg-gradient-to-br from-[#3a3835] to-[#1c1b19] shadow-[0_20px_50px_-28px_rgba(0,0,0,0.45)]">
        {agentPhotoUrl ? (
          <img src={agentPhotoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#F4F1EA]/25 text-7xl font-serif font-light" aria-hidden>
            —
          </div>
        )}
      </div>
    </div>
  );
}
