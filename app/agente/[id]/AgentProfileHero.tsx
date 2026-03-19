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
  const cn = cx("h-[1rem] w-[1rem]", className);
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
  logoUrl?: string | null;
  businessName?: string | null;
  className?: string;
};

/**
 * Single unified hero card for `/agente/[id]`: light beige panel, photo top-left, details top-aligned on the right.
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
  logoUrl,
  businessName,
  className,
}: AgentProfileHeroProps) {
  const t =
    lang === "es"
      ? {
          serviceAreas: "Zonas de servicio",
          visitWeb: "Sitio web",
          phone: "Teléfono",
          langs: "Idiomas",
          licensePrefix: "Licencia",
        }
      : {
          serviceAreas: "Service areas",
          visitWeb: "Website",
          phone: "Phone",
          langs: "Languages",
          licensePrefix: "License",
        };

  const licenseTrim = (agentLicense ?? "").trim();
  const areas = [...new Set(serviceAreaLines.map((s) => s.trim()).filter(Boolean))];
  const websiteHref = website?.trim()
    ? website.trim().startsWith("http")
      ? website.trim()
      : `https://${website.trim()}`
    : "";
  const logoTrim = (logoUrl ?? "").trim();
  const bizTrim = (businessName ?? "").trim();

  const validSocials = socialLinks.filter((s) => /^https?:\/\//i.test(s.url.trim()));

  return (
    <div
      className={cx(
        "w-full max-w-3xl rounded-2xl border border-[#C9B46A]/22 bg-gradient-to-b from-[#FFFEFB] to-[#F8F5EE] shadow-[0_8px_32px_-20px_rgba(17,17,17,0.2)] ring-1 ring-[#C9B46A]/12",
        "p-4 sm:p-5 lg:p-6",
        className
      )}
      data-section="agent-profile-hero"
    >
      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-[minmax(0,13.5rem)_1fr] lg:items-start lg:gap-8">
        {/* Left: photo + logo — pinned to top of card (self-start); strong but bounded size */}
        <div className="flex flex-col items-center gap-3 self-start lg:items-start">
          <div
            className={cx(
              "relative w-full max-w-[200px] sm:max-w-[220px] lg:max-w-none lg:w-[13.5rem]",
              "aspect-[3/4] max-h-[240px] sm:max-h-[260px] shrink-0 overflow-hidden rounded-xl",
              "border border-[#C9B46A]/28 bg-[#F0EBE3]"
            )}
          >
            {agentPhotoUrl ? (
              <img src={agentPhotoUrl} alt="" className="h-full w-full object-cover object-top" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-[#111111]/20 text-4xl font-light"
                aria-hidden
              >
                —
              </div>
            )}
          </div>
          {logoTrim ? (
            <img
              src={logoTrim}
              alt=""
              className="h-11 w-11 rounded-lg border border-[#C9B46A]/20 bg-white object-cover shadow-sm"
            />
          ) : null}
          {bizTrim ? (
            <p className="max-w-[13.5rem] text-center text-[11px] font-semibold uppercase tracking-wide text-[#111111]/55 lg:text-left">
              {bizTrim}
            </p>
          ) : null}
        </div>

        {/* Right: content starts high, compact vertical rhythm */}
        <div className="flex min-w-0 flex-col items-stretch gap-3 text-left lg:pt-0">
          <h1 className="font-serif text-2xl sm:text-[1.65rem] font-bold leading-tight tracking-tight text-[#111111]">
            {agentName}
          </h1>

          {licenseTrim ? (
            <p className="text-sm text-[#111111]/70">
              <span className="font-medium text-[#111111]/55">{t.licensePrefix}: </span>
              {licenseTrim}
            </p>
          ) : null}

          {areas.length > 0 ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8B6914]/85 mb-1">{t.serviceAreas}</p>
              <p className="text-sm font-medium leading-snug text-[#111111]/90">{areas.join(" · ")}</p>
            </div>
          ) : null}

          {officePhone ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8B6914]/85 mb-1">{t.phone}</p>
              <a
                href={`tel:${officePhone.replace(/\D/g, "")}`}
                className="text-base font-semibold text-[#2F4A33] hover:underline"
              >
                {officePhone}
              </a>
            </div>
          ) : null}

          {(languages ?? "").trim() ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8B6914]/85 mb-1">{t.langs}</p>
              <p className="text-sm font-semibold text-[#111111]/90 leading-snug">{(languages ?? "").trim()}</p>
            </div>
          ) : null}

          {websiteHref ? (
            <div className="pt-0.5">
              <a
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[#3F5A43]/35 bg-[#EEF4EF] px-3 py-2 text-sm font-semibold text-[#2F4A33] transition hover:bg-[#E3EBE0]"
              >
                <FaGlobe className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                {t.visitWeb}
              </a>
            </div>
          ) : null}

          {validSocials.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {validSocials.map((s, i) => {
                const u = s.url.trim();
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
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#C9B46A]/30 bg-white text-[#111111]/85 shadow-sm transition hover:border-[#C9B46A]/50 hover:bg-[#FFFCF7]"
                  >
                    <SocialPlatformIcon platform={platform} />
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
