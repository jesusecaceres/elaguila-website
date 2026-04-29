"use client";

import Image from "next/image";
import { FiExternalLink, FiMail, FiMapPin, FiPhone, FiInstagram, FiFacebook, FiYoutube, FiHeart, FiBookmark, FiShare2, FiHome, FiMessageCircle, FiGlobe, FiCalendar, FiDollarSign } from "react-icons/fi";
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

const RENTAL_TYPE = "text-sm font-medium text-[#7A7A7A] uppercase tracking-wide";

const RENTAL_NAME = "text-2xl font-bold text-[#1A1A1A] leading-tight sm:text-3xl";

const MONTHLY_RENT_LINE = "text-2xl font-bold text-[#2A7F3E] leading-tight sm:text-3xl";

const LOCATION_ROW = "flex items-center gap-2 text-sm text-[#4A4A4A]";

const FACTS_ROW = "flex flex-wrap gap-3 mt-3";

const FACT_CHIP = "flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#D4A574]/10 text-[#D4A574] text-xs font-medium border border-[#D4A574]/20";

const AVAILABILITY_ROW = "flex items-center gap-2 text-sm text-[#4A4A4A] mt-2";

const AVAILABILITY_CHIP = "px-2 py-1 rounded-full text-xs font-medium";

const AVAILABILITY_AVAILABLE = "bg-[#2A7F3E]/10 text-[#2A7F3E] border border-[#2A7F3E]/20";

const AVAILABILITY_SOON = "bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20";

const AVAILABILITY_RENTED = "bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20";

const LEASE_INFO_ROW = "flex flex-wrap gap-2 mt-2";

const LEASE_CHIP = "px-2 py-1 rounded-full bg-[#E5E5E5]/50 text-[#4A4A4A] text-xs font-medium";

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

interface RentasPreviewCardProps {
  data: BienesRaicesNegocioPreviewVm;
  className?: string;
  lang?: "es" | "en";
  showEngagementMetrics?: boolean;
  listingId?: string;
}

/**
 * Premium Leonix Rentas Preview Card
 * Follows LEONIX_PREVIEW_CARD_CONTRACT.md with engagement metrics integration
 * Adapted for rentals inspired by Zillow Rentals / Apartments.com-style rental cards
 */
export function RentasPreviewCard({ 
  data, 
  className = "", 
  lang = "es",
  showEngagementMetrics = true,
  listingId
}: RentasPreviewCardProps) {
  const hasHeroImage = data.media.heroUrl;
  const hasLocation = data.addressLine || data.operationSummary;
  const hasMonthlyRent = data.priceDisplay;
  const hasFacts = data.quickFacts.length > 0;
  const hasCtas = data.contact.showLlamar || data.contact.showSolicitarInfo || data.contact.showProgramarVisita || data.contact.showWhatsapp;

  // Determine primary media
  const primaryMedia = data.media.heroUrl;

  // Extract rental-specific information from property details
  const rentalDetails = data.propertyDetailsRows || [];
  const availabilityInfo = rentalDetails.find(detail => detail.label === "Disponibilidad");
  const depositInfo = rentalDetails.find(detail => detail.label === "Depósito");
  const contractTermInfo = rentalDetails.find(detail => detail.label === "Plazo del contrato");
  const furnishedInfo = rentalDetails.find(detail => detail.label === "Amueblado");
  const petsInfo = rentalDetails.find(detail => detail.label === "Mascotas");

  // Determine availability status
  const getAvailabilityStatus = () => {
    if (!availabilityInfo) return null;
    const status = availabilityInfo.value.toLowerCase();
    if (status.includes("disponible") || status.includes("ahora")) return "available";
    if (status.includes("pronto") || status.includes("disponible pronto")) return "soon";
    if (status.includes("rentado") || status.includes("ocupado")) return "rented";
    return "available";
  };

  const availabilityStatus = getAvailabilityStatus();

  return (
    <div className={`${PREVIEW_CARD} ${className}`}>
      {/* Media Block */}
      <div className={MEDIA_CONTAINER}>
        {hasHeroImage ? (
          <Image
            src={primaryMedia!}
            alt={data.heroTitle || "Renta"}
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
          {/* Availability Status */}
          {availabilityStatus && (
            <div className="mb-2">
              <span className={`inline-flex items-center gap-1 ${AVAILABILITY_CHIP} ${
                availabilityStatus === "available" ? AVAILABILITY_AVAILABLE :
                availabilityStatus === "soon" ? AVAILABILITY_SOON :
                AVAILABILITY_RENTED
              }`}>
                {availabilityStatus === "available" && "Disponible ahora"}
                {availabilityStatus === "soon" && "Disponible pronto"}
                {availabilityStatus === "rented" && "Rentado"}
              </span>
            </div>
          )}

          {/* Rental Title */}
          <h1 className={RENTAL_NAME}>{data.heroTitle}</h1>

          {/* Rental Type */}
          {data.operationSummary && (
            <p className={RENTAL_TYPE}>{data.operationSummary}</p>
          )}

          {/* Monthly Rent */}
          {hasMonthlyRent && (
            <div className={MONTHLY_RENT_LINE}>
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

          {/* Availability Info */}
          {availabilityInfo && (
            <div className={AVAILABILITY_ROW}>
              <FiCalendar className="w-4 h-4 text-[#D4A574]" />
              <span>{availabilityInfo.value}</span>
            </div>
          )}

          {/* Lease Information */}
          <div className={LEASE_INFO_ROW}>
            {depositInfo && (
              <span className={LEASE_CHIP}>
                <FiDollarSign className="w-3 h-3" />
                Depósito: {depositInfo.value}
              </span>
            )}
            {contractTermInfo && (
              <span className={LEASE_CHIP}>
                Plazo: {contractTermInfo.value}
              </span>
            )}
            {furnishedInfo && (
              <span className={LEASE_CHIP}>
                {furnishedInfo.value}
              </span>
            )}
            {petsInfo && (
              <span className={LEASE_CHIP}>
                Mascotas: {petsInfo.value}
              </span>
            )}
          </div>
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
                Contactar arrendador
              </a>
            )}
            {data.contact.showProgramarVisita && data.contact.programarVisitaHref && (
              <a
                href={data.contact.programarVisitaHref}
                className={`${CTA_BUTTON} ${CTA_SECONDARY}`}
              >
                <FiCalendar className="w-4 h-4" />
                Agendar visita
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
