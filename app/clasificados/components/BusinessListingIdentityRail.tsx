"use client";

import type { BusinessRailData, ListingData } from "./ListingView";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type BusinessListingIdentityRailProps = {
  businessRail: BusinessRailData;
  category: "bienes-raices" | "rentas";
  businessRailTier?: ListingData["businessRailTier"];
  lang: "es" | "en";
};

/**
 * Shared business identity rail (BR negocio / Rentas negocio). Single source for ListingView and BR preview shell.
 */
export default function BusinessListingIdentityRail({
  businessRail,
  category,
  businessRailTier,
  lang,
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

  return (
    <div
      className={cx(
        "rounded-2xl border p-5 sm:p-6",
        isBienesRaices || businessRailTier === "business_plus"
          ? "border-yellow-300/50 bg-[#FAFAF8] ring-1 ring-yellow-300/20 shadow-[0_2px_12px_-4px_rgba(250,204,21,0.12)]"
          : "border-[#C9B46A]/45 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-sm"
      )}
      data-section="preview-business-rail"
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <h4 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide">
          {lang === "es" ? "Identidad del negocio" : "Business"}
        </h4>
      </div>
      <div className="flex flex-col gap-4">
        {/* Agent-first header row (matches requested reference direction). */}
        <div className={cx("rounded-xl border p-3 sm:p-4", isBienesRaices ? "border-[#C9B46A]/35 bg-white shadow-sm" : "border-black/10 bg-white/75")}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#111111]/50 mb-2">
            {lang === "es" ? "Agente" : "Agent"}
          </p>
          <div className="flex items-center gap-3">
            {businessRail.agentPhotoUrl ? (
              <img
                src={businessRail.agentPhotoUrl}
                alt=""
                className="h-14 w-14 rounded-xl border border-black/10 object-cover bg-white"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl border border-black/10 bg-[#F5F5F5] flex items-center justify-center text-[#111111]/45 text-xs">
                {lang === "es" ? "Agente" : "Agent"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-base font-extrabold text-[#111111] leading-tight truncate">{agentName}</p>
              {agentRole ? <p className="mt-0.5 text-xs text-[#111111]/70 truncate">{agentRole}</p> : null}
            </div>
          </div>
          {(businessRail.logoUrl || businessName) && (
            <div className="mt-3 border-t border-black/10 pt-3 flex items-center gap-2">
              {businessRail.logoUrl ? (
                <img
                  src={businessRail.logoUrl}
                  alt=""
                  className="h-10 w-10 rounded-lg border border-black/10 object-cover bg-white"
                />
              ) : null}
              <p className="text-sm font-semibold text-[#111111] leading-tight break-words">{businessName}</p>
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
        <div className="mt-2 flex flex-col gap-2">
          <button
            type="button"
            className="w-full px-4 py-3 rounded-xl font-semibold border border-[#111111]/18 bg-white text-[#111111] text-sm hover:bg-[#F5F5F5] transition"
          >
            {lang === "es" ? "Solicitar información" : "Request info"}
          </button>
          <button
            type="button"
            className="w-full px-4 py-3 rounded-xl font-semibold border border-[#C9B46A]/55 bg-[#F8F6F0] text-[#111111] text-sm hover:bg-[#EFE7D8] transition"
          >
            {lang === "es" ? "Programar visita" : "Schedule visit"}
          </button>
          {isBienesRaices && (
            <button
              type="button"
              className="w-full px-4 py-3 rounded-xl font-semibold border border-[#C9B46A]/45 bg-white/90 text-[#111111] text-sm hover:bg-[#F8F6F0] transition"
            >
              {lang === "es" ? "Más información sobre este agente" : "More information about this agent"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
