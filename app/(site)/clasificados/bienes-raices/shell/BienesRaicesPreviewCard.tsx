"use client";

import Image from "next/image";
import { FiExternalLink, FiMail, FiMapPin, FiPhone, FiInstagram, FiFacebook, FiYoutube, FiHeart, FiBookmark, FiShare2, FiHome, FiMessageCircle, FiGlobe, FiCalendar } from "react-icons/fi";
import { FaTiktok, FaWhatsapp } from "react-icons/fa";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import type { BienesRaicesNegocioPreviewVm } from "@/app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";

const PREVIEW_CARD =
  "rounded-3xl border border-[#D4A574]/30 bg-[#FFFAF0] shadow-[0_12px_48px_-20px_rgba(212,165,116,0.15)] overflow-hidden";

const MEDIA_CONTAINER = "relative aspect-[16/10] overflow-hidden bg-[#F5F0E8]";

const INFO_SECTION = "p-6 space-y-4";

const TITLE_SECTION = "space-y-2";

const STATUS_LINE = "text-sm font-medium text-[#7A7A7A] uppercase tracking-wide";

const PROPERTY_TYPE = "text-sm font-medium text-[#7A7A7A] uppercase tracking-wide";

const PROPERTY_NAME = "text-2xl font-bold text-[#1A1A1A] leading-tight sm:text-3xl";

const PRICE_LINE = "text-2xl font-bold text-[#2A7F3E] leading-tight sm:text-3xl";

const LOCATION_ROW = "flex items-center gap-2 text-sm text-[#4A4A4A]";

const FACTS_ROW = "flex flex-wrap gap-3 mt-3";

const FACT_CHIP = "flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#D4A574]/10 text-[#D4A574] text-xs font-medium border border-[#D4A574]/20";

const CTA_SECTION = "flex flex-wrap gap-3 mt-6";

const CTA_BUTTON = "inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 border";

const CTA_PRIMARY = "bg-[#D4A574] text-white border-[#D4A574] hover:bg-[#C19A6B]";

const CTA_SECONDARY = "bg-white text-[#1A1A1A] border-[#E5E5E5] hover:bg-[#FFFAF0] hover:border-[#D4A574]";

const ENGAGEMENT_SECTION = "mt-6 pt-6 border-t border-[#E5E5E5]/50";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${rating.toFixed(1)} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => {
        const v = rating - i;
        const pct = Math.round(Math.min(1, Math.max(0, v)) * 100);
        return (
          <span key={i} className="relative h-4 w-[1.05em] text-[15px] leading-none">
            <span className="absolute text-white/35" aria-hidden>★</span>
            <span className="absolute overflow-hidden text-[#f0d78c]" style={{ width: `${pct}%` }} aria-hidden>★</span>
          </span>
        );
      })}
    </div>
  );
}

interface BienesRaicesPreviewCardProps {
  data: BienesRaicesNegocioPreviewVm;
  className?: string;
  lang?: "es" | "en";
  showEngagementMetrics?: boolean;
  listingId?: string;
}

/**
 * Premium Leonix Bienes Raíces Preview Card
 * Follows LEONIX_PREVIEW_CARD_CONTRACT.md with engagement metrics integration
 * Adapted for real estate inspired by Zillow/Homes.com/Realtor.com-style property cards
 */
export function BienesRaicesPreviewCard({ 
  data, 
  className = "", 
  lang = "es",
  showEngagementMetrics = true,
  listingId
}: BienesRaicesPreviewCardProps) {
  const hasHeroImage = data.media.heroUrl;
  const hasLocation = data.addressLine || data.operationSummary;
  const hasPrice = data.priceDisplay;
  const hasFacts = data.quickFacts.length > 0;
  const hasCtas = data.contact.showLlamar || data.contact.showSolicitarInfo || data.contact.showProgramarVisita || data.contact.showWhatsapp;

  // Determine primary media
  const primaryMedia = data.media.heroUrl;

  return (
    <div className={`${PREVIEW_CARD} ${className}`}>
      {/* Media Block */}
      <div className={MEDIA_CONTAINER}>
        {hasHeroImage ? (
          <Image
            src={primaryMedia!}
            alt={data.heroTitle || "Propiedad"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#D4A574]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiHome className="w-8 h-8 text-[#D4A574]" />
              </div>
              <p className="text-sm font-medium text-[#7A7A7A]">Imagen no disponible</p>
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className={INFO_SECTION}>
        {/* Title Section */}
        <div className={TITLE_SECTION}>
          {/* Listing Status */}
          {data.listingStatusLabel && (
            <div className="mb-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#2A7F3E]/10 text-[#2A7F3E] text-xs font-medium border border-[#2A7F3E]/20">
                {data.listingStatusLabel}
              </span>
            </div>
          )}

          {/* Property Title */}
          <h1 className={PROPERTY_NAME}>{data.heroTitle}</h1>

          {/* Property Type */}
          {data.operationSummary && (
            <p className={PROPERTY_TYPE}>{data.operationSummary}</p>
          )}

          {/* Price */}
          {hasPrice && (
            <div className={PRICE_LINE}>
              {data.priceDisplay}
            </div>
          )}

          {/* Location Row */}
          {hasLocation && (
            <div className={LOCATION_ROW}>
              <FiMapPin className="w-4 h-4 text-[#D4A574]" />
              <span>
                {data.addressLine}
              </span>
            </div>
          )}

          {/* Property Facts */}
          {hasFacts && (
            <div className={FACTS_ROW}>
              {data.quickFacts.slice(0, 4).map((fact, index) => {
                const getIcon = (icon: string) => {
                  switch (icon) {
                    case "bed": return <FiHome className="w-3 h-3" />;
                    case "bath": return <FiHome className="w-3 h-3" />;
                    case "ruler": return <FiHome className="w-3 h-3" />;
                    case "car": return <FiHome className="w-3 h-3" />;
                    case "calendar": return <FiCalendar className="w-3 h-3" />;
                    default: return <FiHome className="w-3 h-3" />;
                  }
                };
                return (
                  <span key={index} className={FACT_CHIP}>
                    {getIcon(fact.icon)}
                    {fact.label}: {fact.value}
                  </span>
                );
              })}
              {data.quickFacts.length > 4 && (
                <span className={FACT_CHIP}>
                  +{data.quickFacts.length - 4} más
                </span>
              )}
            </div>
          )}
        </div>

        {/* CTA Section */}
        {hasCtas && (
          <div className={CTA_SECTION}>
            {data.contact.showLlamar && data.contact.llamarHref && (
              <a
                href={data.contact.llamarHref}
                className={`${CTA_BUTTON} ${CTA_PRIMARY}`}
              >
                <FiPhone className="w-4 h-4" />
                Llamar
              </a>
            )}
            {data.contact.showSolicitarInfo && data.contact.solicitarInfoHref && (
              <a
                href={data.contact.solicitarInfoHref}
                className={`${CTA_BUTTON} ${CTA_SECONDARY}`}
              >
                <FiMessageCircle className="w-4 h-4" />
                Solicitar información
              </a>
            )}
            {data.contact.showProgramarVisita && data.contact.programarVisitaHref && (
              <a
                href={data.contact.programarVisitaHref}
                className={`${CTA_BUTTON} ${CTA_SECONDARY}`}
              >
                <FiCalendar className="w-4 h-4" />
                Programar visita
              </a>
            )}
            {data.contact.showWhatsapp && data.contact.whatsappHref && (
              <a
                href={data.contact.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${CTA_BUTTON} ${CTA_SECONDARY}`}
              >
                <FaWhatsapp className="w-4 h-4" />
                WhatsApp
              </a>
            )}
          </div>
        )}

        {/* Engagement Section */}
        {showEngagementMetrics && listingId && (
          <div className={ENGAGEMENT_SECTION}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">
                Interacción
              </h3>
            </div>
            
            {/* Engagement Actions */}
            <div className="flex items-center gap-3 mb-4">
              <LeonixLikeButton
                listingId={listingId}
                ownerUserId={listingId}
                variant="small"
                lang={lang}
              />
              <LeonixSaveButton
                listingId={listingId}
                ownerUserId={listingId}
                variant="small"
                lang={lang}
              />
              <LeonixShareButton
                listingId={listingId}
                ownerUserId={listingId}
                listingTitle={data.heroTitle}
                listingUrl={typeof window !== "undefined" ? window.location.href : ""}
                variant="small"
                lang={lang}
              />
            </div>

            {/* Note about real metrics */}
            <div className="text-xs text-[#7A7A7A] italic">
              Las métricas de engagement se mostrarán cuando estén disponibles
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
