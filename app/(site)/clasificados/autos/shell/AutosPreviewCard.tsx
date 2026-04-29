"use client";

import Image from "next/image";
import { FiExternalLink, FiMail, FiMapPin, FiPhone, FiCalendar, FiGlobe, FiTrendingUp, FiEye, FiHeart, FiBookmark, FiShare2 } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { LeonixEngagementBar } from "@/app/components/clasificados/analytics/LeonixEngagementBar";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { trackClasificadosEvent } from "@/app/lib/clasificadosAnalytics";
import type { AutoDealerListing } from "../negocios/types/autoDealerListing";

const PREVIEW_CARD =
  "rounded-3xl border border-[#D4A574]/30 bg-[#FFFAF0] shadow-[0_12px_48px_-20px_rgba(212,165,116,0.15)] overflow-hidden";

const MEDIA_CONTAINER = "relative aspect-[16/10] overflow-hidden bg-[#F5F0E8]";

const INFO_SECTION = "p-6 space-y-4";

const TITLE_SECTION = "space-y-2";

const VEHICLE_TYPE_LINE = "text-sm font-medium text-[#7A7A7A] uppercase tracking-wide";

const VEHICLE_TITLE = "text-2xl font-bold text-[#1A1A1A] leading-tight sm:text-3xl";

const LOCATION_ROW = "flex items-center gap-2 text-sm text-[#4A4A4A]";

const PRICE_LINE = "text-3xl font-bold text-[#2A7F3E] leading-tight sm:text-4xl";

const MILEAGE_ROW = "flex items-center gap-2 text-sm text-[#4A4A4A]";

const FACTS_ROW = "flex flex-wrap gap-2 mt-3";

const FACT_CHIP = "flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#D4A574]/10 text-[#D4A574] text-xs font-medium border border-[#D4A574]/20";

const DEALER_ROW = "flex items-center gap-2 text-sm text-[#4A4A4A] mt-2";

const DEALER_CHIP = "px-2 py-1 rounded-full bg-[#D4A574]/20 text-[#D4A574] text-xs font-bold uppercase tracking-wide";

const CTA_SECTION = "flex flex-wrap gap-3 mt-6";

const CTA_BUTTON = "inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 border";

const CTA_PRIMARY = "bg-[#D4A574] text-white border-[#D4A574] hover:bg-[#C19A6B]";

const CTA_SECONDARY = "bg-white text-[#1A1A1A] border-[#E5E5E5] hover:bg-[#FFFAF0] hover:border-[#D4A574]";

const ENGAGEMENT_SECTION = "mt-6 pt-6 border-t border-[#E5E5E5]/50";

interface AutosPreviewCardProps {
  data: AutoDealerListing;
  className?: string;
  lang?: "es" | "en";
  showEngagementMetrics?: boolean;
  listingId?: string;
}

/**
 * Premium Leonix Autos Preview Card
 * Follows LEONIX_PREVIEW_CARD_CONTRACT.md with engagement metrics integration
 * Adapted for vehicle listings inspired by AutoTrader/Cars.com with Leonix styling
 */
export function AutosPreviewCard({ 
  data, 
  className = "", 
  lang = "es",
  showEngagementMetrics = true,
  listingId
}: AutosPreviewCardProps) {
  // Track view when card is rendered
  React.useEffect(() => {
    if (listingId) {
      void trackClasificadosEvent({
        listing_id: listingId,
        category: "autos",
        event_type: "listing_view",
        event_source: "card",
        owner_user_id: listingId, // This would be the actual owner ID in production
        metadata: { cardType: "preview", vehicleType: data.condition }
      });
    }
  }, [listingId, data.condition]);

  const hasHeroImage = data.mediaImages && data.mediaImages.length > 0;
  const hasLocation = data.city && data.state;
  const hasPrice = data.price !== undefined && Number.isFinite(data.price);
  const hasMileage = data.mileage !== undefined && Number.isFinite(data.mileage);
  const hasDealer = data.dealerName;
  const hasCtas = data.dealerPhoneOffice || data.dealerWhatsapp || data.dealerWebsite || data.dealerBookingUrl;

  // Build vehicle title if not provided
  const vehicleTitle = data.vehicleTitle || 
    [data.year, data.make, data.model, data.trim].filter(Boolean).join(" ");

  // Get primary image
  const primaryImage = data.mediaImages?.find(img => img.isPrimary) || data.mediaImages?.[0];

  // Build vehicle facts
  const vehicleFacts = [];
  if (data.condition) vehicleFacts.push({ label: data.condition === "new" ? "Nuevo" : data.condition === "used" ? "Usado" : "Certificado", icon: "condition" });
  if (data.bodyStyle) vehicleFacts.push({ label: data.bodyStyle, icon: "body" });
  if (data.transmission) vehicleFacts.push({ label: data.transmission, icon: "trans" });
  if (data.drivetrain) vehicleFacts.push({ label: data.drivetrain, icon: "drive" });
  if (data.fuelType) vehicleFacts.push({ label: data.fuelType, icon: "fuel" });

  // Format location
  const locationDisplay = hasLocation ? `${data.city}, ${data.state}` : "Ubicación no disponible";

  // Format mileage
  const formatMileage = (miles: number) => {
    if (miles >= 1000000) return `${(miles / 1000000).toFixed(1)}M mi`;
    if (miles >= 1000) return `${(miles / 1000).toFixed(0)}K mi`;
    return `${miles.toLocaleString()} mi`;
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={`${PREVIEW_CARD} ${className}`}>
      {/* Media Block */}
      <div className={MEDIA_CONTAINER}>
        {hasHeroImage && primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={vehicleTitle || "Vehículo"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#D4A574]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiTrendingUp className="w-8 h-8 text-[#D4A574]" />
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
          {/* Vehicle Title */}
          <h1 className={VEHICLE_TITLE}>{vehicleTitle}</h1>

          {/* Vehicle Type Line */}
          {data.condition && (
            <p className={VEHICLE_TYPE_LINE}>
              {data.condition === "new" ? "Vehículo Nuevo" : 
               data.condition === "used" ? "Vehículo Usado" : 
               "Vehículo Certificado"}
            </p>
          )}

          {/* Price */}
          {hasPrice && (
            <div className={PRICE_LINE}>
              {formatPrice(data.price!)}
            </div>
          )}

          {/* Monthly Estimate */}
          {data.monthlyEstimate && (
            <p className="text-sm font-semibold text-[#4A4A4A] mt-1">
              {data.monthlyEstimate}
            </p>
          )}

          {/* Location Row */}
          {hasLocation && (
            <div className={LOCATION_ROW}>
              <FiMapPin className="w-4 h-4 text-[#D4A574]" />
              <span>{locationDisplay}</span>
            </div>
          )}

          {/* Mileage Row */}
          {hasMileage && (
            <div className={MILEAGE_ROW}>
              <FiCalendar className="w-4 h-4 text-[#D4A574]" />
              <span>{formatMileage(data.mileage!)}</span>
            </div>
          )}

          {/* Vehicle Facts */}
          {vehicleFacts.length > 0 && (
            <div className={FACTS_ROW}>
              {vehicleFacts.slice(0, 4).map((fact, index) => (
                <span key={index} className={FACT_CHIP}>
                  {fact.label}
                </span>
              ))}
              {vehicleFacts.length > 4 && (
                <span className={FACT_CHIP}>
                  +{vehicleFacts.length - 4} más
                </span>
              )}
            </div>
          )}

          {/* Dealer Information */}
          {hasDealer && (
            <div className={DEALER_ROW}>
              <span className="font-semibold text-[#1A1A1A]">{data.dealerName}</span>
              <span className={DEALER_CHIP}>Concesionario</span>
            </div>
          )}
        </div>

        {/* CTA Section */}
        {hasCtas && (
          <div className={CTA_SECTION}>
            {data.dealerPhoneOffice && (
              <a
                href={`tel:${data.dealerPhoneOffice}`}
                className={`${CTA_BUTTON} ${CTA_PRIMARY}`}
                onClick={() => {
                  if (listingId) {
                    void trackClasificadosEvent({
                      listing_id: listingId,
                      category: "autos",
                      event_type: "phone_click",
                      event_source: "card",
                      owner_user_id: listingId,
                      metadata: { contactType: "office" }
                    });
                  }
                }}
              >
                <FiPhone className="w-4 h-4" />
                Llamar
              </a>
            )}
            {data.dealerWhatsapp && (
              <a
                href={`https://wa.me/${data.dealerWhatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${CTA_BUTTON} ${CTA_SECONDARY}`}
                onClick={() => {
                  if (listingId) {
                    void trackClasificadosEvent({
                      listing_id: listingId,
                      category: "autos",
                      event_type: "whatsapp_click",
                      event_source: "card",
                      owner_user_id: listingId,
                      metadata: { contactType: "whatsapp" }
                    });
                  }
                }}
              >
                <FaWhatsapp className="w-4 h-4" />
                WhatsApp
              </a>
            )}
            {data.dealerWebsite && (
              <a
                href={data.dealerWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className={`${CTA_BUTTON} ${CTA_SECONDARY}`}
                onClick={() => {
                  if (listingId) {
                    void trackClasificadosEvent({
                      listing_id: listingId,
                      category: "autos",
                      event_type: "website_click",
                      event_source: "card",
                      owner_user_id: listingId,
                      metadata: { contactType: "website" }
                    });
                  }
                }}
              >
                <FiGlobe className="w-4 h-4" />
                Sitio web
              </a>
            )}
            {data.dealerBookingUrl && (
              <a
                href={data.dealerBookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${CTA_BUTTON} ${CTA_SECONDARY}`}
                onClick={() => {
                  if (listingId) {
                    void trackClasificadosEvent({
                      listing_id: listingId,
                      category: "autos",
                      event_type: "cta_click",
                      event_source: "card",
                      owner_user_id: listingId,
                      metadata: { contactType: "booking" }
                    });
                  }
                }}
              >
                <FiCalendar className="w-4 h-4" />
                Agendar cita
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
                listingTitle={vehicleTitle}
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

// Import React for useEffect
import React from "react";
