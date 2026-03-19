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
  /** Current publish page path+query; passed to `/agente/[id]` as `returnTo` for back navigation. */
  agentProfileReturnUrl?: string | null;
};

/**
 * Shared business identity rail (BR negocio / Rentas negocio). Single source for ListingView and BR preview shell.
 * Premium agent layout lives on `/agente/[id]` only — not here.
 */
export default function BusinessListingIdentityRail({
  businessRail,
  category,
  businessRailTier,
  lang,
  ownerId,
  agentProfileReturnUrl,
}: BusinessListingIdentityRailProps) {
  const isBienesRaices = category === "bienes-raices";
  const showFullSocial =
    isBienesRaices || businessRailTier === "business_plus";
  const showVirtualTourRow =
    Boolean(businessRail.virtualTourUrl) &&
    (isBienesRaices ||
      businessRailTier === "business_plus" ||
      businessRailTier === "business_standard");

  const businessName = businessRail.name || (lang === "es" ? "Negocio" : "Business");
  const agentName = businessRail.agent?.trim() || businessName;
  const agentRole = businessRail.role?.trim() || "";
  const agentNameLen = agentName.length;
  const ownerIdTrim = (ownerId ?? "").trim();
  const returnToTrim = (agentProfileReturnUrl ?? "").trim();
  const agentProfileHref = ownerIdTrim
    ? `/agente/${encodeURIComponent(ownerIdTrim)}?lang=${lang}${
        returnToTrim ? `&returnTo=${encodeURIComponent(returnToTrim)}` : ""
      }`
    : "";
  const imageBoxClass = "h-12 w-12 rounded-xl border border-black/10 object-cover bg-white shadow-sm shrink-0";
  const agentNameClass =
    agentNameLen > 72
      ? "text-[0.84rem] sm:text-[0.88rem]"
      : agentNameLen > 56
        ? "text-[0.88rem] sm:text-[0.92rem]"
        : agentNameLen > 42
          ? "text-[0.92rem] sm:text-[0.95rem]"
          : "text-sm sm:text-[0.98rem]";
  const agentNameLayoutClass =
    agentNameLen > 72
      ? "whitespace-nowrap overflow-hidden text-ellipsis"
      : agentNameLen > 56
        ? "whitespace-normal break-words"
        : "whitespace-nowrap";

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
        {businessRail.agentEmail?.trim() ? (
          <p className="text-sm text-[#111111] break-all">
            <span className="text-[#111111]/70">{lang === "es" ? "Correo:" : "Email:"} </span>
            <span className="font-medium">{businessRail.agentEmail.trim()}</span>
          </p>
        ) : null}
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
