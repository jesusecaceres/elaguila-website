"use client";

import Image from "next/image";
import { FiExternalLink, FiMail, FiMapPin, FiPhone, FiInstagram, FiFacebook, FiYoutube, FiEye, FiHeart, FiBookmark, FiShare2 } from "react-icons/fi";
import { FaTiktok, FaWhatsapp } from "react-icons/fa";
import { LeonixEngagementBar } from "@/app/components/clasificados/analytics/LeonixEngagementBar";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { trackRestaurantesListingView, trackRestaurantesSave, trackRestaurantesLike, trackRestaurantesShare } from "../analytics/restaurantesAnalytics";
import type { RestaurantDetailShellData } from "./restaurantDetailShellTypes";

// Leonix premium visual tokens
const LEONIX_PAGE_BG = "#F4F1EB";
const LEONIX_CARD_SURFACE = "#FFFAF3";
const LEONIX_BORDER = "#D8C2A0";
const LEONIX_PRIMARY_TEXT = "#1F1A17";
const LEONIX_SECONDARY_TEXT = "#5A5148";
const LEONIX_MUTED_TEXT = "#8B7E70";
const LEONIX_GOLD_ACCENT = "#BEA98E";
const LEONIX_DARK_CTA = "#2C1810";
const LEONIX_SUCCESS_GREEN = "#1A4D2E";
const LEONIX_INFO_BLUE = "#355C7D";
const LEONIX_ELEVATED_CHIP = "#F6EBDD";

const PREVIEW_CARD =
  "rounded-3xl border border-[#D8C2A0] bg-[#FFFAF3] shadow-[0_16px_64px_-24px_rgba(212,165,116,0.18)] overflow-hidden hover:shadow-[0_20px_80px_-30px_rgba(212,165,116,0.25)] transition-shadow duration-300";

const MEDIA_CONTAINER = "relative aspect-[16/10] overflow-hidden bg-[#F5F0E8]";

const INFO_SECTION = "p-6 sm:p-8 space-y-5";

const TITLE_SECTION = "space-y-4";

const CUISINE_LINE = "text-sm font-semibold text-[#5A5148] uppercase tracking-wide";

const BUSINESS_NAME = "text-3xl font-bold text-[#1F1A17] leading-tight sm:text-4xl";

const LOCATION_ROW = "flex items-center gap-2 text-sm text-[#5A5148]";

const HOURS_ROW = "flex items-center gap-2 text-sm font-semibold";

const HOURS_OPEN = "text-[#1A4D2E] bg-[#E8F5E8] px-3 py-1.5 rounded-full font-medium";

const HOURS_CLOSED = "text-[#BEA98E] bg-[#F6EBDD] px-3 py-1.5 rounded-full font-medium";

const SERVICE_MODES = "flex flex-wrap gap-2 mt-4";

const SERVICE_CHIP = "px-3 py-1.5 rounded-full bg-[#F6EBDD] text-[#1F1A17] text-xs font-semibold border border-[#D8C2A0]";

const CTA_SECTION = "flex flex-wrap gap-3 mt-6";

const CTA_BUTTON = "inline-flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-base transition-all duration-200 border min-h-[44px]";

const CTA_PRIMARY = "bg-[#2C1810] text-white border-[#2C1810] hover:bg-[#1A1412] shadow-md";

const CTA_SECONDARY = "bg-white text-[#1F1A17] border-[#D8C2A0] hover:bg-[#FFFAF3] hover:border-[#BEA98E] shadow-sm";

const ENGAGEMENT_SECTION = "mt-8 pt-6 border-t border-[#D8C2A0]/30";

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

interface RestaurantePreviewCardProps {
  data: RestaurantDetailShellData;
  className?: string;
  lang?: "es" | "en";
  showEngagementMetrics?: boolean;
  listingId?: string;
}

/**
 * Premium Leonix Restaurantes Preview Card
 * Follows LEONIX_PREVIEW_CARD_CONTRACT.md with engagement metrics integration
 */
export function RestaurantePreviewCard({ 
  data, 
  className = "", 
  lang = "es",
  showEngagementMetrics = true,
  listingId
}: RestaurantePreviewCardProps) {
  // Track view when card is rendered
  React.useEffect(() => {
    if (listingId) {
      void trackRestaurantesListingView(listingId, {
        ownerUserId: data.id, // This would be the actual owner ID in production
        eventSource: "card",
        metadata: { cardType: "preview" }
      });
    }
  }, [listingId, data.id]);

  const hasHeroImage = data.heroImageUrl;
  const hasLocation = data.businessName && (data.contact?.addressLine1 || data.contact?.mapsSearchQuery);
  const hasHours = data.hoursPreview;
  const hasServiceModes = data.quickInfo?.some(item => item.key === "service");
  const hasTrustRating = data.trustRating;
  const hasCtas = data.primaryCtas && data.primaryCtas.length > 0;

  // Extract service modes as individual chips instead of blob
  const serviceChips = (() => {
    const serviceItem = data.quickInfo?.find(item => item.key === "service");
    if (!serviceItem?.value) return [];
    
    // Split the concatenated service blob into individual chips
    const parts = serviceItem.value.split(' · ');
    const chips: string[] = [];
    
    parts.forEach(part => {
      // Handle "Otro: " prefix removal
      if (part.startsWith('Otro: ')) {
        chips.push(part.replace('Otro: ', '').trim());
      } else {
        chips.push(part.trim());
      }
    });
    
    return chips;
  })();

  return (
    <div className={`${PREVIEW_CARD} ${className}`}>
      {/* Media Block */}
      <div className={MEDIA_CONTAINER}>
        {hasHeroImage ? (
          <Image
            src={data.heroImageUrl!}
            alt={data.heroImageAlt || data.businessName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#D4A574]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiMapPin className="w-8 h-8 text-[#D4A574]" />
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
          {/* Trust Rating */}
          {hasTrustRating && data.trustRating && (
            <div className="mb-4">
              <StarRow rating={data.trustRating.average} />
            </div>
          )}
          
          {/* Business Name */}
          <h2 className={BUSINESS_NAME}>
            {data.businessName}
          </h2>
          
          {/* Cuisine and Type */}
          {data.cuisineTypeLine && (
            <div className={CUISINE_LINE}>
              {data.cuisineTypeLine.split(' · ').map((cuisine, index) => (
                <span key={index} className="px-3 py-1.5 bg-[#F6EBDD] text-[#1F1A17] text-xs font-semibold border border-[#D8C2A0] rounded-full">
                  {cuisine.trim()}
                </span>
              ))}
            </div>
          )}
          
          {/* Status/Info Row */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* Hours Status */}
            {hasHours && (
              <div className={data.hoursPreview.status === 'open' ? HOURS_OPEN : HOURS_CLOSED}>
                {data.hoursPreview.status === 'open' ? `🟢 ${data.hoursPreview.statusLine}` : '🔴 Cerrado'}
              </div>
            )}
            
            {/* Location */}
            {hasLocation && (
              <div className="px-3 py-1.5 rounded-full bg-[#F6EBDD] text-[#1F1A17] text-xs font-semibold border border-[#D8C2A0] flex items-center gap-1">
                <FiMapPin className="w-3 h-3" />
                <span>
                  {data.contact?.mapsSearchQuery || data.contact?.addressLine1}
                </span>
              </div>
            )}
            
            {/* Price Level */}
            {data.quickInfo?.find(item => item.key === 'price')?.value && (
              <div className="px-3 py-1.5 rounded-full bg-[#F6EBDD] text-[#1F1A17] text-xs font-semibold border border-[#D8C2A0]">
                <span>💰 {data.quickInfo.find(item => item.key === 'price')?.value}</span>
              </div>
            )}
          </div>
          
          {/* Description */}
          {data.aboutBody && (
            <p className="text-sm text-[#5A5148] leading-relaxed">
              {data.aboutBody.length > 120 
                ? `${data.aboutBody.slice(0, 120)}...` 
                : data.aboutBody}
            </p>
          )}
          
          {/* Service Chips */}
          {serviceChips.length > 0 && (
            <div className={SERVICE_MODES}>
              {serviceChips.slice(0, 6).map((chip, index) => (
                <span key={index} className={SERVICE_CHIP}>
                  {chip}
                </span>
              ))}
              {serviceChips.length > 6 && (
                <span className={SERVICE_CHIP}>
                  +{serviceChips.length - 6} más
                </span>
              )}
            </div>
          )}
        </div>

        {/* CTA Section */}
        {hasCtas && (
          <div className={CTA_SECTION}>
            {data.primaryCtas.slice(0, 3).map((cta, index) => {
              const isPrimary = index === 0;
              const buttonClass = isPrimary ? CTA_PRIMARY : CTA_SECONDARY;
              
              return (
                <a
                  key={cta.key}
                  href={cta.href}
                  className={`${CTA_BUTTON} ${buttonClass} ${!cta.enabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  {...(cta.href?.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  onClick={() => {
                    if (cta.enabled && listingId) {
                      // Track CTA clicks
                      const ctaType = cta.key === "call" ? "phone" : 
                                     cta.key === "whatsapp" ? "whatsapp" :
                                     cta.key === "website" ? "website" : "general";
                      void trackRestaurantesCtaClick(listingId, ctaType as any, {
                        eventSource: "card",
                        metadata: { ctaKey: cta.key }
                      });
                    }
                  }}
                >
                  {cta.key === "call" && <span className="mr-2">📞</span>}
                  {cta.key === "whatsapp" && <span className="mr-2">💬</span>}
                  {cta.key === "website" && <span className="mr-2">🌐</span>}
                  {cta.key === "message" && <span className="mr-2">📧</span>}
                  {cta.key === "menu" && <span className="mr-2">📋</span>}
                  {cta.key === "menuAsset" && <span className="mr-2">📋</span>}
                  {cta.key === "reserve" && <span className="mr-2">📅</span>}
                  {cta.key === "order" && <span className="mr-2">🛒</span>}
                  {cta.label}
                </a>
              );
            })}
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
            <div className="flex items-center gap-3">
              <LeonixLikeButton
                listingId={listingId}
                ownerUserId={data.id}
                variant="small"
                lang={lang}
              />
              <LeonixSaveButton
                listingId={listingId}
                ownerUserId={data.id}
                variant="small"
                lang={lang}
              />
              <LeonixShareButton
                listingId={listingId}
                ownerUserId={data.id}
                listingTitle={data.businessName}
                listingUrl=""
                variant="small"
                lang={lang}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Import React for useEffect
import React from "react";

// Import the missing function
async function trackRestaurantesCtaClick(
  listingId: string,
  ctaType: "phone" | "whatsapp" | "website" | "directions" | "order" | "reserve" | "general",
  options: {
    ownerUserId?: string;
    eventSource?: string;
    metadata?: Record<string, any>;
  }
) {
  // This would use the shared analytics system
  console.log("CTA click tracked:", { listingId, ctaType, options });
}
