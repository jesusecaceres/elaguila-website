"use client";

import Link from "next/link";
import {
  FaFacebookF,
  FaGlobe,
  FaInstagram,
  FaTiktok,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import type { BusinessRailData, ListingData } from "./ListingView";

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

function buildSocialIconEntries(rail: BusinessRailData): Array<{ url: string; label: string; platform: SocialPlatform }> {
  const seen = new Set<string>();
  const out: Array<{ url: string; label: string; platform: SocialPlatform }> = [];
  const add = (rawUrl: string, label: string) => {
    const u = rawUrl.trim();
    if (!/^https?:\/\//i.test(u)) return;
    const key = u.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ url: u, label: label.trim() || "Social", platform: detectSocialPlatform(u, label) });
  };
  for (const s of rail.socialLinks ?? []) {
    if (s?.url) add(s.url, s.label ?? "");
  }
  const raw = (rail.rawSocials ?? "").trim();
  if (raw) {
    const urlLike = /https?:\/\/[^\s,]+/gi;
    const matches = raw.match(urlLike);
    if (matches) matches.forEach((u) => add(u, ""));
  }
  return out;
}

function SocialPlatformIcon({ platform, className }: { platform: SocialPlatform; className?: string }) {
  const cn = cx("h-[1.05rem] w-[1.05rem]", className);
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

export type BusinessListingIdentityRailProps = {
  businessRail: BusinessRailData;
  category: "bienes-raices" | "rentas";
  businessRailTier?: ListingData["businessRailTier"];
  lang: "es" | "en";
  /** Publisher id (`profiles.id`) for public agent profile; omit to hide BR agent CTA. */
  ownerId?: string | null;
  /**
   * `profile` = BR preview hero left column: no inline agent thumbnail (shown large beside card),
   * no duplicated long bio here (rendered as “About” in parent). `default` = existing rail everywhere else.
   */
  presentation?: "default" | "profile";
  /** Listing city for optional service-area line (preview). @deprecated prefer serviceAreaParts */
  listingCity?: string | null;
  /** Deduped cities / areas to show in profile layout (e.g. listing city + neighborhood). */
  serviceAreaParts?: string[];
};

/**
 * Shared business identity rail (BR negocio / Rentas negocio). Single source for ListingView and BR preview shell.
 */
export default function BusinessListingIdentityRail({
  businessRail,
  category,
  businessRailTier,
  lang,
  ownerId,
  presentation = "default",
  listingCity,
  serviceAreaParts,
}: BusinessListingIdentityRailProps) {
  const isBienesRaices = category === "bienes-raices";
  const isProfileLayout = presentation === "profile" && isBienesRaices;
  const showFullSocial =
    isBienesRaices || businessRailTier === "business_plus";
  const showVirtualTourRow =
    !isProfileLayout &&
    Boolean(businessRail.virtualTourUrl) &&
    (isBienesRaices ||
      businessRailTier === "business_plus" ||
      businessRailTier === "business_standard");

  const businessName = businessRail.name || (lang === "es" ? "Negocio" : "Business");
  const agentName = businessRail.agent?.trim() || businessName;
  const agentRole = businessRail.role?.trim() || "";
  const agentNameLen = agentName.length;
  const ownerIdTrim = (ownerId ?? "").trim();
  const agentProfileHref = ownerIdTrim ? `/agente/${encodeURIComponent(ownerIdTrim)}?lang=${lang}` : "";
  const imageBoxClass = "h-12 w-12 rounded-xl border border-black/10 object-cover bg-white shadow-sm shrink-0";
  const agentNameClass =
    agentNameLen > 72
      ? "text-[0.84rem] sm:text-[0.88rem]"
      : agentNameLen > 56
        ? "text-[0.88rem] sm:text-[0.92rem]"
        : agentNameLen > 42
          ? "text-[0.92rem] sm:text-[0.95rem]"
          : "text-sm sm:text-[0.98rem]";
  // One-line preference for short/medium names; long names wrap; only extreme values ellipsize.
  const agentNameLayoutClass =
    agentNameLen > 72
      ? "whitespace-nowrap overflow-hidden text-ellipsis"
      : agentNameLen > 56
        ? "whitespace-normal break-words"
        : "whitespace-nowrap";

  const cityLine = (listingCity ?? "").trim();
  const serviceAreas = (() => {
    if (Array.isArray(serviceAreaParts) && serviceAreaParts.length > 0) {
      return [...new Set(serviceAreaParts.map((s) => s.trim()).filter(Boolean))];
    }
    return cityLine ? [cityLine] : [];
  })();

  const licenseLine = (businessRail.agentLicense ?? "").trim();
  const socialIconEntries = isProfileLayout ? buildSocialIconEntries(businessRail) : [];
  const websiteHref = businessRail.website?.trim()
    ? businessRail.website.trim().startsWith("http")
      ? businessRail.website.trim()
      : `https://${businessRail.website.trim()}`
    : "";

  if (isProfileLayout) {
    const licenseDisplay = licenseLine
      ? lang === "es"
        ? `Licencia: ${licenseLine}`
        : `License: ${licenseLine}`
      : "";

    return (
      <div
        className={cx(
          "rounded-2xl border border-white/10 bg-gradient-to-b from-[#2f2d2a] to-[#1c1b19] p-7 sm:p-8 shadow-[0_24px_56px_-28px_rgba(0,0,0,0.55)] h-full flex flex-col min-h-0 text-[#F4F1EA]"
        )}
        data-section="preview-business-rail"
        data-presentation="profile"
      >
        {/* 1. Agent name */}
        <h2 className="font-serif text-[1.85rem] sm:text-[2.15rem] font-bold text-white leading-[1.12] tracking-tight break-words">
          {agentName}
        </h2>

        {/* 2. License (only when provided — no placeholder / no role substitute) */}
        {licenseDisplay ? (
          <p className="mt-3 text-sm sm:text-[0.95rem] text-[#F4F1EA]/80 font-normal leading-snug">{licenseDisplay}</p>
        ) : null}

        {/* 3. Service areas / cities */}
        {serviceAreas.length > 0 ? (
          <div className="mt-8 pt-6 border-t border-[#C9B46A]/35">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9B46A]/95 mb-2.5">
              {lang === "es" ? "Zonas de servicio" : "Service areas"}
            </p>
            <p className="text-[0.95rem] sm:text-base text-[#F4F1EA]/95 leading-relaxed font-medium">
              {serviceAreas.join(lang === "es" ? " · " : " · ")}
            </p>
          </div>
        ) : null}

        {/* 4. Website CTA */}
        {websiteHref ? (
          <div className={cx("mt-8", serviceAreas.length === 0 && "pt-6 border-t border-[#C9B46A]/35")}>
            <a
              href={websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3F5A43] px-4 py-3.5 text-sm font-semibold text-[#F7F4EC] shadow-[0_10px_24px_-14px_rgba(0,0,0,0.5)] transition hover:bg-[#36503A]"
            >
              <FaGlobe className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {lang === "es" ? "Visitar sitio web" : "Visit website"}
            </a>
          </div>
        ) : null}

        {/* 5. Social icon row */}
        {socialIconEntries.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2.5">
            {socialIconEntries.map((s, i) => (
              <a
                key={`${s.url}-${i}`}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                title={s.label}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#F4F1EA] transition hover:bg-white/18 hover:border-[#C9B46A]/40"
                aria-label={s.label}
              >
                <SocialPlatformIcon platform={s.platform} />
              </a>
            ))}
          </div>
        ) : null}

        <div className="mt-8 flex-1 min-h-0 space-y-6">
          {/* 6. Phone */}
          {businessRail.officePhone ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C9B46A]/90 mb-2">
                {lang === "es" ? "Teléfono" : "Phone"}
              </p>
              <a
                href={`tel:${businessRail.officePhone.replace(/\D/g, "")}`}
                className="text-lg sm:text-xl font-semibold text-white tracking-tight hover:text-[#C9B46A] transition"
              >
                {businessRail.officePhone}
              </a>
            </div>
          ) : null}

          {/* 7. Languages */}
          {businessRail.languages?.trim() ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9B46A] mb-2">
                {lang === "es" ? "Idiomas" : "Languages"}
              </p>
              <p className="text-base sm:text-[1.05rem] font-semibold text-[#F4F1EA] leading-snug">{businessRail.languages.trim()}</p>
            </div>
          ) : null}
        </div>

        {businessRail.availabilityRows && businessRail.availabilityRows.length > 0 && (
          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#C9B46A]/85 mb-2">
              {lang === "es" ? "Disponibilidad y precios" : "Availability & pricing"}
            </p>
            <div className="space-y-2">
              {businessRail.availabilityRows.map((row, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 text-xs text-[#F4F1EA]/90">
                  {row.title && <span className="font-semibold text-white">{row.title}</span>}
                  {row.price && <span>{row.price}</span>}
                  {row.size && <span className="text-[#F4F1EA]/65">{row.size}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-8 flex flex-col gap-2.5 border-t border-white/10">
          <button
            type="button"
            className="w-full px-4 py-3.5 rounded-xl font-semibold text-sm transition bg-[#9a6b4a] text-white hover:bg-[#8a5f42] shadow-[0_10px_22px_-14px_rgba(0,0,0,0.45)]"
          >
            {lang === "es" ? "Solicitar información" : "Request info"}
          </button>
          {agentProfileHref ? (
            <Link
              href={agentProfileHref}
              prefetch={false}
              className="block w-full px-4 py-3.5 rounded-xl font-semibold border border-white/20 bg-white/10 text-[#F4F1EA] text-sm hover:bg-white/[0.14] transition text-center"
            >
              {lang === "es" ? "Más información sobre este agente" : "More information about this agent"}
            </Link>
          ) : null}
          <button
            type="button"
            className="w-full px-4 py-3.5 rounded-xl font-semibold border border-[#C9B46A]/40 bg-transparent text-[#E8DCC8] text-sm hover:bg-white/5 transition"
          >
            {lang === "es" ? "Programar visita" : "Schedule visit"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cx(
        "rounded-[1.4rem] border p-5 sm:p-6",
        isBienesRaices || businessRailTier === "business_plus"
          ? "border-[#C9B46A]/55 bg-gradient-to-b from-[#F7F2E5] to-[#F2EBDD] ring-1 ring-[#C9B46A]/25 shadow-[0_14px_38px_-20px_rgba(17,17,17,0.35)]"
          : "border-[#C9B46A]/45 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-sm"
      )}
      data-section="preview-business-rail"
    >
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <h4 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide">
          {lang === "es" ? "Identidad del negocio" : "Business"}
        </h4>
      </div>
      <div className="flex flex-col gap-4 sm:gap-5">
        {/* Agent-first header row (matches requested reference direction). */}
        <div className={cx("rounded-2xl border p-4 sm:p-5", isBienesRaices ? "border-[#C9B46A]/40 bg-[#FFFEFB] shadow-[0_8px_22px_-16px_rgba(17,17,17,0.35)]" : "border-black/10 bg-white/75")}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#111111]/50 mb-2">
            {lang === "es" ? "Agente" : "Agent"}
          </p>
          <div className="flex items-center gap-3.5 sm:gap-4">
            {businessRail.agentPhotoUrl ? (
              <img
                src={businessRail.agentPhotoUrl}
                alt=""
                className={imageBoxClass}
              />
            ) : (
              <div className={cx(imageBoxClass, "bg-[#F5F5F5] flex items-center justify-center text-[#111111]/45 text-xs")}>
                {lang === "es" ? "Agente" : "Agent"}
              </div>
            )}
            <div className="min-w-0 flex-[1_1_0%]">
              <p className={cx(agentNameClass, agentNameLayoutClass, "font-semibold text-[#111111] leading-tight max-w-full")}>
                {agentName}
              </p>
              {agentRole ? <p className="mt-1 text-xs sm:text-[0.8rem] text-[#111111]/70 whitespace-nowrap overflow-hidden text-ellipsis">{agentRole}</p> : null}
            </div>
          </div>
          {(businessRail.logoUrl || businessName) && (
            <div className="mt-4 border-t border-black/10 pt-3.5 flex items-center gap-3">
              {businessRail.logoUrl ? (
                <img
                  src={businessRail.logoUrl}
                  alt=""
                  className={imageBoxClass}
                />
              ) : null}
              <p className="text-sm sm:text-[0.94rem] font-semibold text-[#111111] leading-tight break-words">{businessName}</p>
            </div>
          )}
        </div>

        {businessRail.officePhone && (
          <p className="text-sm text-[#111111]">
            <span className="text-[#111111]/70">{lang === "es" ? "Oficina:" : "Office:"} </span>
            <span className="font-medium">{businessRail.officePhone}</span>
          </p>
        )}
        {businessRail.website && (
          <p className="text-sm font-medium text-[#111111] break-all">
            {lang === "es" ? "Sitio web" : "Website"} → {businessRail.website}
          </p>
        )}
        {showVirtualTourRow && (
          <p className="text-sm font-medium text-[#111111] break-all">
            {lang === "es" ? "Recorrido virtual" : "Virtual tour"} →
          </p>
        )}
        {businessRail.socialLinks && businessRail.socialLinks.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {businessRail.socialLinks.slice(0, showFullSocial ? undefined : 2).map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-[#111111]"
              >
                {s.label} →
              </span>
            ))}
          </div>
        ) : businessRail.rawSocials ? (
          <p className="text-xs text-[#111111]/80 break-words">{businessRail.rawSocials}</p>
        ) : null}
        {businessRail.languages && (
          <p className="text-xs text-[#111111]/80">
            <span className="text-[#111111]/60">{lang === "es" ? "Idiomas:" : "Languages:"} </span>
            {businessRail.languages}
          </p>
        )}
        {businessRail.hours && (
          <p className="text-xs text-[#111111]/80">
            <span className="text-[#111111]/60">{lang === "es" ? "Horario:" : "Hours:"} </span>
            {businessRail.hours}
          </p>
        )}
        {businessRail.businessDescription && (
          <p className="text-xs text-[#111111]/80 whitespace-pre-wrap">{businessRail.businessDescription}</p>
        )}
        {businessRail.availabilityRows && businessRail.availabilityRows.length > 0 && (
          <div className="mt-3 rounded-xl border border-black/10 bg-white/60 p-3">
            <p className="text-[10px] font-semibold text-[#111111]/70 uppercase tracking-wide mb-2">
              {lang === "es" ? "Disponibilidad y precios" : "Availability & pricing"}
            </p>
            <div className="space-y-2">
              {businessRail.availabilityRows.map((row, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
                  {row.title && <span className="font-medium text-[#111111]">{row.title}</span>}
                  {row.price && <span className="text-[#111111]/90">{row.price}</span>}
                  {row.size && <span className="text-[#111111]/70">{row.size}</span>}
                  {(row.ctaText || row.ctaLink) && (
                    <span className="font-medium text-[#111111]">
                      {row.ctaText || (lang === "es" ? "Ver" : "View")} →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-2 flex flex-col gap-2.5 sm:gap-3">
          <button
            type="button"
            className={cx(
              "w-full px-4 py-3.5 rounded-xl font-semibold text-sm transition",
              isBienesRaices
                ? "border border-[#3F5A43]/70 bg-[#3F5A43] text-[#F7F4EC] hover:bg-[#36503A] shadow-[0_8px_18px_-12px_rgba(33,58,39,0.8)]"
                : "border border-[#111111]/18 bg-white text-[#111111] hover:bg-[#F5F5F5]"
            )}
          >
            {lang === "es" ? "Solicitar información" : "Request info"}
          </button>
          {isBienesRaices && agentProfileHref ? (
            <Link
              href={agentProfileHref}
              prefetch={false}
              className="block w-full px-4 py-3.5 rounded-xl font-semibold border border-[#6D826F]/45 bg-[#EEF3ED] text-[#2F4A33] text-sm hover:bg-[#E3EBDD] transition text-center"
            >
              {lang === "es" ? "Más información sobre este agente" : "More information about this agent"}
            </Link>
          ) : null}
          <button
            type="button"
            className={cx(
              "w-full px-4 py-3.5 rounded-xl font-semibold border text-sm transition",
              isBienesRaices
                ? "border-[#C9B46A]/65 bg-[#F8F2E3] text-[#4A4536] hover:bg-[#F2E9D4]"
                : "border-[#C9B46A]/55 bg-[#F8F6F0] text-[#111111] hover:bg-[#EFE7D8]"
            )}
          >
            {lang === "es" ? "Programar visita" : "Schedule visit"}
          </button>
        </div>
      </div>
    </div>
  );
}
