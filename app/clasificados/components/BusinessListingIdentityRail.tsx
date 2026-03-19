"use client";

import Link from "next/link";
import type { BusinessRailData, ListingData } from "./ListingView";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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
  /** Listing city for optional service-area line (preview). */
  listingCity?: string | null;
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

  if (isProfileLayout) {
    return (
      <div
        className={cx(
          "rounded-2xl border border-[#C9B46A]/50 bg-[#FFFCF6] p-6 sm:p-8 shadow-[0_20px_50px_-28px_rgba(17,17,17,0.28)] ring-1 ring-[#C9B46A]/20 h-full flex flex-col min-h-0"
        )}
        data-section="preview-business-rail"
        data-presentation="profile"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8B6914]/90 mb-4">
          {lang === "es" ? "Agente inmobiliario" : "Real estate agent"}
        </p>

        <h2 className="font-serif text-3xl sm:text-[2.1rem] font-bold text-[#111111] leading-[1.15] tracking-tight break-words">
          {agentName}
        </h2>
        {agentRole ? (
          <p className="mt-3 text-sm sm:text-base text-[#111111]/72 font-medium leading-snug">{agentRole}</p>
        ) : null}

        {(businessRail.logoUrl || businessName) && (
          <div className="mt-6 flex items-center gap-3 pt-5 border-t border-[#C9B46A]/25">
            {businessRail.logoUrl ? (
              <img src={businessRail.logoUrl} alt="" className="h-11 w-11 rounded-xl border border-black/10 object-cover bg-white shadow-sm shrink-0" />
            ) : null}
            <p className="text-sm font-semibold text-[#111111] leading-snug break-words">{businessName}</p>
          </div>
        )}

        <div className="mt-6 space-y-3 text-sm text-[#111111]/90 flex-1 min-h-0">
          {businessRail.officePhone ? (
            <p>
              <span className="text-[#111111]/55 font-medium text-xs uppercase tracking-wide block mb-0.5">
                {lang === "es" ? "Teléfono de oficina" : "Office phone"}
              </span>
              <span className="font-semibold text-[#111111]">{businessRail.officePhone}</span>
            </p>
          ) : null}
          {cityLine ? (
            <p>
              <span className="text-[#111111]/55 font-medium text-xs uppercase tracking-wide block mb-0.5">
                {lang === "es" ? "Ciudad del anuncio" : "Listing city"}
              </span>
              <span className="font-medium text-[#111111]/85">{cityLine}</span>
            </p>
          ) : null}
          {businessRail.languages ? (
            <p className="text-sm">
              <span className="text-[#111111]/55 font-medium text-xs uppercase tracking-wide block mb-0.5">
                {lang === "es" ? "Idiomas" : "Languages"}
              </span>
              {businessRail.languages}
            </p>
          ) : null}
          {businessRail.hours ? (
            <p className="text-sm text-[#111111]/80">
              <span className="text-[#111111]/55 font-medium text-xs uppercase tracking-wide block mb-0.5">
                {lang === "es" ? "Horario" : "Hours"}
              </span>
              {businessRail.hours}
            </p>
          ) : null}
          {businessRail.website ? (
            <p className="pt-1">
              <a
                href={businessRail.website.startsWith("http") ? businessRail.website : `https://${businessRail.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[#2F4A33] hover:underline break-all"
              >
                {lang === "es" ? "Sitio web" : "Website"}
              </a>
            </p>
          ) : null}
          {businessRail.socialLinks && businessRail.socialLinks.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {businessRail.socialLinks.slice(0, showFullSocial ? undefined : 3).map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg border border-[#C9B46A]/35 bg-white px-3 py-1.5 text-xs font-semibold text-[#111111] hover:bg-[#FAF3E4]"
                >
                  {s.label}
                </a>
              ))}
            </div>
          ) : businessRail.rawSocials ? (
            <p className="text-xs text-[#111111]/75 break-words">{businessRail.rawSocials}</p>
          ) : null}
        </div>

        {businessRail.availabilityRows && businessRail.availabilityRows.length > 0 && (
          <div className="mt-6 rounded-xl border border-[#C9B46A]/30 bg-[#FAF3E4]/50 p-4">
            <p className="text-[10px] font-semibold text-[#111111]/60 uppercase tracking-wide mb-2">
              {lang === "es" ? "Disponibilidad y precios" : "Availability & pricing"}
            </p>
            <div className="space-y-2">
              {businessRail.availabilityRows.map((row, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 text-xs text-[#111111]">
                  {row.title && <span className="font-semibold">{row.title}</span>}
                  {row.price && <span>{row.price}</span>}
                  {row.size && <span className="text-[#111111]/65">{row.size}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-8 flex flex-col gap-2.5">
          <button
            type="button"
            className="w-full px-4 py-3.5 rounded-xl font-semibold text-sm transition border border-[#3F5A43]/70 bg-[#3F5A43] text-[#F7F4EC] hover:bg-[#36503A] shadow-[0_8px_18px_-12px_rgba(33,58,39,0.8)]"
          >
            {lang === "es" ? "Solicitar información" : "Request info"}
          </button>
          {agentProfileHref ? (
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
            className="w-full px-4 py-3.5 rounded-xl font-semibold border border-[#C9B46A]/65 bg-[#F8F2E3] text-[#4A4536] text-sm hover:bg-[#F2E9D4] transition"
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
