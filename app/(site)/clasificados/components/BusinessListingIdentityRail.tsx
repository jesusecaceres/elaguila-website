"use client";

import type { BusinessRailData, ListingData } from "./ListingView";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type BusinessListingIdentityRailProps = {
  businessRail: BusinessRailData;
  businessRailTier?: ListingData["businessRailTier"];
  lang: "es" | "en";
  ownerId?: string | null;
  agentProfileReturnUrl?: string | null;
};

function hrefForTour(raw: string | null | undefined): string {
  const t = (raw ?? "").trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t) || t.startsWith("/")) return t;
  return `https://${t}`;
}

/** Rentas negocio business identity (ListingView preview + live data shape). */
export default function BusinessListingIdentityRail({
  businessRail,
  businessRailTier,
  lang,
  ownerId,
  agentProfileReturnUrl,
}: BusinessListingIdentityRailProps) {
  const showFullSocial = businessRailTier === "business_plus";
  const showVirtualTourRow =
    Boolean(businessRail.virtualTourUrl) &&
    (businessRailTier === "business_plus" || businessRailTier === "business_standard");

  const businessName = businessRail.name || (lang === "es" ? "Negocio" : "Business");
  const agentName = businessRail.agent?.trim() || businessName;
  const agentRole = businessRail.role?.trim() || "";
  const agentNameLen = agentName.length;
  void ownerId;
  void agentProfileReturnUrl;
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
        "w-full min-w-0 rounded-[1.4rem] border p-5 sm:p-6",
        businessRailTier === "business_plus"
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
        <div className="rounded-2xl border border-black/10 bg-white/75 p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#111111]/50 mb-2">
            {lang === "es" ? "Agente" : "Agent"}
          </p>
          <div className="flex items-center gap-3.5 sm:gap-4">
            {businessRail.agentPhotoUrl ? (
              <img src={businessRail.agentPhotoUrl} alt="" className={imageBoxClass} />
            ) : (
              <div className={cx(imageBoxClass, "bg-[#F5F5F5] flex items-center justify-center text-[#111111]/45 text-xs")}>
                {lang === "es" ? "Agente" : "Agent"}
              </div>
            )}
            <div className="min-w-0 flex-[1_1_0%]">
              <p className={cx(agentNameClass, agentNameLayoutClass, "font-semibold text-[#111111] leading-tight max-w-full")}>
                {agentName}
              </p>
              {agentRole ? (
                <p className="mt-1 text-xs sm:text-[0.8rem] text-[#111111]/70 whitespace-nowrap overflow-hidden text-ellipsis">
                  {agentRole}
                </p>
              ) : null}
              {businessRail.coAgentName?.trim() ? (
                <p className="mt-1.5 text-[11px] text-[#111111]/62">
                  <span className="font-semibold text-[#111111]/45">{lang === "es" ? "Co-agente" : "Co-agent"}:</span>{" "}
                  {businessRail.coAgentName.trim()}
                </p>
              ) : null}
              {businessRail.agentLicense?.trim() ? (
                <p className="mt-1.5 text-[11px] text-[#111111]/55">
                  {lang === "es" ? "Licencia" : "License"}: {businessRail.agentLicense.trim()}
                </p>
              ) : null}
            </div>
          </div>
          {(businessRail.logoUrl || businessName) && (
            <div className="border-t border-black/10 flex items-center gap-3 mt-4 pt-3.5">
              {businessRail.logoUrl ? <img src={businessRail.logoUrl} alt="" className={imageBoxClass} /> : null}
              <div className="min-w-0">
                <p className="text-sm sm:text-[0.94rem] font-semibold text-[#111111] leading-tight break-words">{businessName}</p>
                {businessRail.brokerageName?.trim() ? (
                  <p className="mt-1 text-xs text-[#111111]/62 leading-snug break-words">
                    {lang === "es" ? "Correduría" : "Brokerage"}: {businessRail.brokerageName.trim()}
                  </p>
                ) : null}
                {businessRail.lenderPartnerName?.trim() ? (
                  <p className="mt-1.5 text-[11px] text-[#111111]/58 leading-snug break-words">
                    <span className="font-semibold text-[#111111]/45">{lang === "es" ? "Financiamiento" : "Financing"}:</span>{" "}
                    {businessRail.lenderPartnerName.trim()}
                  </p>
                ) : null}
              </div>
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
          <a
            href={hrefForTour(businessRail.website)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[#2F4A33] underline-offset-2 hover:underline break-all"
          >
            {lang === "es" ? "Sitio web" : "Website"}
          </a>
        )}
        {showVirtualTourRow && businessRail.virtualTourUrl && (
          <a
            href={hrefForTour(businessRail.virtualTourUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[#2F4A33] underline-offset-2 hover:underline break-all"
          >
            {lang === "es" ? "Recorrido virtual" : "Virtual tour"}
          </a>
        )}
        {businessRail.socialLinks && businessRail.socialLinks.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {businessRail.socialLinks.slice(0, showFullSocial ? undefined : 2).map((s, i) => (
              <a
                key={i}
                href={hrefForTour(s.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-[#111111] hover:bg-[#FAFAFA]"
              >
                {s.label}
              </a>
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
          <p className="text-[#111111]/80 whitespace-pre-wrap text-xs">{businessRail.businessDescription}</p>
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
        <div className="flex flex-col mt-2 gap-2.5 sm:gap-3">
          <button
            type="button"
            className="w-full px-4 py-3.5 rounded-xl font-semibold text-sm transition border border-[#111111]/18 bg-white text-[#111111] hover:bg-[#F5F5F5]"
          >
            {lang === "es" ? "Solicitar información" : "Request info"}
          </button>
          <button
            type="button"
            className="w-full px-4 py-3.5 rounded-xl font-semibold border text-sm transition border-[#C9B46A]/55 bg-[#F8F6F0] text-[#111111] hover:bg-[#EFE7D8]"
          >
            {lang === "es" ? "Programar visita" : "Schedule visit"}
          </button>
        </div>
      </div>
    </div>
  );
}
