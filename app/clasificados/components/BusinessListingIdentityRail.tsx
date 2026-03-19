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
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h4 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide">
          {lang === "es" ? "Identidad del negocio" : "Business"}
        </h4>
      </div>
      <div className="flex flex-col gap-4">
        {(businessRail.logoUrl || businessRail.agentPhotoUrl) && (
          <div className="flex items-start gap-3">
            {businessRail.logoUrl && (
              <img
                src={businessRail.logoUrl}
                alt=""
                className="h-14 w-14 rounded-xl border border-black/10 object-cover bg-white"
              />
            )}
            {businessRail.agentPhotoUrl && (
              <img
                src={businessRail.agentPhotoUrl}
                alt=""
                className="h-14 w-14 rounded-xl border border-black/10 object-cover bg-white"
              />
            )}
          </div>
        )}
        <div>
          <p className="text-base font-semibold text-[#111111]">
            {businessRail.name || (lang === "es" ? "Negocio" : "Business")}
          </p>
          {businessRail.agent && (
            <p className="mt-0.5 text-sm text-[#111111]/90">{businessRail.agent}</p>
          )}
          {businessRail.role && (
            <p className="text-xs text-[#111111]/70">{businessRail.role}</p>
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
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            className="w-full px-4 py-3 rounded-xl font-semibold border border-[#111111]/20 bg-[#F5F5F5] text-[#111111] text-sm"
          >
            {lang === "es" ? "Solicitar información" : "Request info"}
          </button>
          <button
            type="button"
            className="w-full px-4 py-3 rounded-xl font-semibold border border-[#C9B46A]/50 bg-[#F8F6F0] text-[#111111] text-sm"
          >
            {lang === "es" ? "Programar visita" : "Schedule visit"}
          </button>
        </div>
      </div>
    </div>
  );
}
