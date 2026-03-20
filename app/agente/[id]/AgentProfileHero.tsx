"use client";

import {
  FaEnvelope,
  FaFacebookF,
  FaGlobe,
  FaInstagram,
  FaTiktok,
  FaTwitter,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type SocialPlatform = "facebook" | "instagram" | "youtube" | "tiktok" | "whatsapp" | "twitter" | "other";

function detectSocialPlatform(url: string, label?: string): SocialPlatform {
  const u = url.toLowerCase();
  const l = (label ?? "").toLowerCase();
  if (/facebook\.com|fb\.com|fb\.me/.test(u) || l.includes("facebook")) return "facebook";
  if (/instagram\.com|instagr\.am/.test(u) || l.includes("instagram") || l === "ig") return "instagram";
  if (/youtube\.com|youtu\.be/.test(u) || l.includes("youtube")) return "youtube";
  if (/tiktok\.com/.test(u) || l.includes("tiktok")) return "tiktok";
  if (/wa\.me|whatsapp\.com|api\.whatsapp/.test(u) || l.includes("whatsapp")) return "whatsapp";
  if (/twitter\.com|\/\/x\.com\//i.test(u) || l.includes("twitter") || l === "x") return "twitter";
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
    case "twitter":
      return <FaTwitter className={cn} aria-hidden />;
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
  /** 10 digits for `tel:` when main office line is US-format; avoids extension digits in dial string. */
  officePhoneTelDigits?: string | null;
  agentEmail?: string | null;
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
  officePhoneTelDigits,
  agentEmail,
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
          websiteLabel: "Sitio web",
          phone: "Teléfono",
          email: "Correo electrónico",
          langs: "Idiomas",
          licenseLabel: "Licencia",
          socialHeading: "Redes sociales",
        }
      : {
          serviceAreas: "Service areas",
          websiteLabel: "Website",
          phone: "Phone",
          email: "Email",
          langs: "Languages",
          licenseLabel: "License",
          socialHeading: "Social links",
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

  const websiteLinkText = (() => {
    if (!websiteHref) return "";
    try {
      return new URL(websiteHref).hostname.replace(/^www\./i, "");
    } catch {
      const s = websiteHref.replace(/^https?:\/\//i, "").trim();
      return s.split("/")[0]?.replace(/^www\./i, "") ?? s;
    }
  })();

  return (
    <div
      className={cx(
        "w-full min-w-0 max-w-3xl overflow-x-hidden rounded-2xl border border-[#C9B46A]/22 bg-gradient-to-b from-[#FFFEFB] to-[#F8F5EE] shadow-[0_8px_32px_-20px_rgba(17,17,17,0.2)] ring-1 ring-[#C9B46A]/12",
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
        <div className="flex min-w-0 max-w-full flex-col items-stretch gap-3 text-left lg:pt-0">
          <div className="min-w-0 space-y-1.5">
            <h1 className="font-serif text-2xl sm:text-[1.65rem] font-bold leading-tight tracking-tight text-[#111111] break-words">
              {agentName}
            </h1>
            {licenseTrim ? (
              <p className="text-sm font-medium leading-snug text-[#111111]/88">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B6914]/80">{t.licenseLabel}: </span>
                <span className="break-words">{licenseTrim}</span>
              </p>
            ) : null}
          </div>

          {areas.length > 0 ? (
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8B6914]/85 mb-1.5">{t.serviceAreas}</p>
              <div className="flex flex-wrap gap-1.5">
                {areas.map((a) => (
                  <span
                    key={a}
                    className="inline-flex max-w-full items-center rounded-full border border-[#C9B46A]/35 bg-[#FFFCF7]/90 px-2.5 py-1 text-xs font-medium leading-snug text-[#111111]/90 break-words"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {officePhone ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8B6914]/85 mb-1">{t.phone}</p>
              <a
                href={`tel:${
                  (officePhoneTelDigits ?? "").length === 10
                    ? officePhoneTelDigits
                    : officePhone.replace(/\D/g, "").slice(0, 10)
                }`}
                className="text-base font-semibold text-[#2F4A33] hover:underline"
              >
                {officePhone}
              </a>
            </div>
          ) : null}

          {(agentEmail ?? "").trim() ? (
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8B6914]/85 mb-1">{t.email}</p>
              <a
                href={`mailto:${(agentEmail ?? "").trim()}`}
                className="inline-flex min-w-0 max-w-full items-start gap-1.5 text-sm font-semibold text-[#2F4A33] hover:underline break-words"
              >
                <FaEnvelope className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                <span className="min-w-0">{(agentEmail ?? "").trim()}</span>
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
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8B6914]/85 mb-1">{t.websiteLabel}</p>
              <a
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-sm font-semibold text-[#2F4A33] hover:underline"
              >
                <FaGlobe className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                <span className="min-w-0 truncate">{websiteLinkText || websiteHref}</span>
              </a>
            </div>
          ) : null}

          {validSocials.length > 0 ? (
            <div className="min-w-0">
              <p className="sr-only">{t.socialHeading}</p>
              <div className="flex flex-wrap gap-2" role="list" aria-label={t.socialHeading}>
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
                      role="listitem"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#C9B46A]/30 bg-white text-[#111111]/85 shadow-sm transition hover:border-[#C9B46A]/50 hover:bg-[#FFFCF7]"
                    >
                      <SocialPlatformIcon platform={platform} />
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
