"use client";

import Image from "next/image";
import Link from "next/link";
import { FiMapPin, FiPhone, FiHeart, FiBookmark, FiShare2, FiClock, FiStar, FiExternalLink } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { trackRestaurantesCtaClick } from "../../analytics/restaurantesAnalytics";
import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";

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

const RESULT_CARD = "rounded-3xl border border-[#D8C2A0] bg-[#FFFAF3] shadow-[0_16px_64px_-24px_rgba(212,165,116,0.18)] overflow-hidden hover:shadow-[0_20px_80px_-30px_rgba(212,165,116,0.25)] transition-shadow duration-300";

const MEDIA_CONTAINER = "relative aspect-[16/10] overflow-hidden bg-[#F5F0E8]";

const INFO_SECTION = "p-6 sm:p-8 space-y-5";

const TITLE_SECTION = "space-y-4";

const CUISINE_CHIP = "px-3 py-1.5 rounded-full bg-[#F6EBDD] text-[#1F1A17] text-xs font-semibold border border-[#D8C2A0] inline-flex items-center gap-1";

const SERVICE_CHIP = "px-3 py-1.5 rounded-full bg-[#F6EBDD] text-[#1F1A17] text-xs font-semibold border border-[#D8C2A0]";

const RESTAURANT_NAME = "text-2xl sm:text-3xl font-bold text-[#1F1A17] leading-tight hover:text-[#BEA98E] transition-colors";

const STATUS_CHIP_OPEN = "px-3 py-1.5 rounded-full bg-[#1A4D2E] text-white text-xs font-semibold";

const STATUS_CHIP_CLOSED = "px-3 py-1.5 rounded-full bg-[#BEA98E] text-[#1F1A17] text-xs font-semibold";

const CTA_BUTTON = "inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 border min-h-[44px]";

const CTA_PRIMARY = "bg-[#2C1810] text-white border-[#2C1810] hover:bg-[#1A1412] shadow-md";

const CTA_SECONDARY = "bg-white text-[#1F1A17] border-[#D8C2A0] hover:bg-[#FFFAF3] hover:border-[#BEA98E] shadow-sm";

const ENGAGEMENT_SECTION = "mt-6 pt-6 border-t border-[#D8C2A0]/30";

interface RestauranteResultCardProps {
  listing: RestaurantesPublicBlueprintRow;
  className?: string;
  lang?: "es" | "en";
  showEngagementMetrics?: boolean;
}

/**
 * Premium Leonix Restaurante Result Card
 * Follows LEONIX_PREVIEW_CARD_CONTRACT.md with engagement metrics integration
 * Matches the approved RestaurantePreviewCard design system
 */
export function RestauranteResultCard({ 
  listing, 
  className = "", 
  lang = "es",
  showEngagementMetrics = true
}: RestauranteResultCardProps) {
  const hasImage = listing.imageSrc;
  const hasLogo = listing.logoUrl;
  const hasLocation = listing.city || listing.neighborhood;
  const hasServiceModes = listing.serviceModes && listing.serviceModes.length > 0;
  const hasRating = listing.rating && listing.rating > 0;
  const hasAddress = listing.addressLine1;
  const hasDescription = listing.description;
  
  // Build location line from available fields (priority: neighborhood -> city)
  const locationLine = listing.neighborhood 
    ? listing.neighborhood 
    : listing.city;

  // Build full address
  const fullAddress = listing.addressLine1 
    ? listing.addressLine2 
      ? `${listing.addressLine1}, ${listing.addressLine2}`
      : listing.addressLine1
    : undefined;

  // Build detail href
  const detailHref = listing.slug 
    ? `/clasificados/restaurantes/${encodeURIComponent(listing.slug)}`
    : `/clasificados/restaurantes/results?q=${encodeURIComponent(listing.name)}`;

  // Helper functions for CTAs
  const formatPhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  const generateMapsUrl = () => {
    if (!listing.addressLine1) return undefined;
    const addressQuery = [listing.addressLine1, listing.city, listing.state].filter(Boolean).join(", ");
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`;
  };

  const generateWhatsAppUrl = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 10) {
      return `https://wa.me/${digits.slice(-10)}`;
    }
    return undefined;
  };

  // Build CTA array in required order
  const ctas = [
    { key: 'call', label: 'Llamar', href: listing.phoneNumber ? `tel:${listing.phoneNumber}` : undefined, icon: FiPhone },
    { key: 'website', label: 'Sitio web', href: listing.websiteUrl, icon: FiExternalLink },
    { key: 'directions', label: 'Direcciones', href: generateMapsUrl(), icon: FiMapPin },
    { key: 'whatsapp', label: 'WhatsApp', href: listing.whatsAppNumber ? generateWhatsAppUrl(listing.whatsAppNumber) : undefined, icon: FaWhatsapp },
    { key: 'order', label: 'Ordenar', href: listing.orderUrl, icon: () => <span>🛒</span> },
    { key: 'reserve', label: 'Reservar', href: listing.reservationUrl, icon: () => <span>📅</span> }
  ].filter(cta => cta.href);

  // Build cuisine chips from actual cuisine data
  const cuisineChips = (() => {
    const chips: string[] = [];
    if (listing.primaryCuisineKey) {
      // Map cuisine keys to display names
      const cuisineLabels: Record<string, string> = {
        'mexican': 'Mexicana',
        'italian': 'Italiana',
        'japanese': 'Japonesa',
        'chinese': 'China',
        'thai': 'Tailandesa',
        'indian': 'India',
        'french': 'Francesa',
        'american': 'Americana',
        'spanish': 'Española',
        'greek': 'Griega',
        'mediterranean': 'Mediterránea',
        'other': listing.businessType || 'Otra'
      };
      const label = cuisineLabels[listing.primaryCuisineKey] || listing.primaryCuisineKey;
      chips.push(label);
    }
    if (listing.secondaryCuisineKey) {
      const cuisineLabels: Record<string, string> = {
        'mexican': 'Mexicana',
        'italian': 'Italiana',
        'japanese': 'Japonesa',
        'chinese': 'China',
        'thai': 'Tailandesa',
        'indian': 'India',
        'french': 'Francesa',
        'american': 'Americana',
        'spanish': 'Española',
        'greek': 'Griega',
        'mediterranean': 'Mediterránea',
        'other': 'Otra'
      };
      const label = cuisineLabels[listing.secondaryCuisineKey] || listing.secondaryCuisineKey;
      chips.push(label);
    }
    return chips;
  })();

  return (
    <div className={`${RESULT_CARD} ${className}`}>
      <div className="flex flex-col sm:flex-row">
        {/* LEFT COLUMN - Media Block */}
        <div className={`sm:w-2/5 ${MEDIA_CONTAINER}`}>
          {hasImage ? (
            <>
              <Image
                src={listing.imageSrc}
                alt={listing.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
              {/* Optional logo overlay */}
              {hasLogo && (
                <div className="absolute top-4 left-4">
                  <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                    <Image
                      src={listing.logoUrl!}
                      alt={`${listing.name} logo`}
                      width={32}
                      height={32}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#BEA98E]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiMapPin className="w-8 h-8 text-[#BEA98E]" />
                </div>
                <p className="text-sm font-medium text-[#8B7E70]">Imagen no disponible</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - Info Section */}
        <div className={`sm:w-3/5 ${INFO_SECTION}`}>
        {/* 1. Title Row */}
        <div className={TITLE_SECTION}>
          <Link href={detailHref} className="block">
            <h3 className={RESTAURANT_NAME}>
              {listing.name}
            </h3>
          </Link>
        </div>

        {/* 2. Cuisine/Type Row */}
        {cuisineChips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {cuisineChips.map((chip, index) => (
              <span key={index} className={CUISINE_CHIP}>
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* 3. Status/Info Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Open/Closed Status */}
          {listing.isOpenNow !== undefined && (
            <span className={listing.isOpenNow ? STATUS_CHIP_OPEN : STATUS_CHIP_CLOSED}>
              {listing.isOpenNow ? '🟢 Abierto ahora' : '🔴 Cerrado'}
              {listing.isOpenNow && listing.openUntil && ` hasta ${listing.openUntil}`}
            </span>
          )}
          
          {/* Neighborhood */}
          {hasLocation && (
            <span className="px-3 py-1.5 rounded-full bg-[#F6EBDD] text-[#1F1A17] text-xs font-semibold border border-[#D8C2A0] flex items-center gap-1">
              <FiMapPin className="w-3 h-3" />
              {locationLine}
            </span>
          )}
          
          {/* Price Level */}
          {listing.priceLevel && (
            <span className="px-3 py-1.5 rounded-full bg-[#F6EBDD] text-[#1F1A17] text-xs font-semibold border border-[#D8C2A0]">
              {listing.priceLevel}
            </span>
          )}
        </div>

        {/* 4. Address Row */}
        {fullAddress && (
          <div className="text-sm text-[#5A5148]">
            <span className="flex items-center gap-1">
              <FiMapPin className="w-4 h-4" />
              {fullAddress}
            </span>
          </div>
        )}

        {/* 5. Description Row */}
        {hasDescription && (
          <div className="text-sm text-[#5A5148] leading-relaxed">
            {listing.description!.length > 120 
              ? `${listing.description!.slice(0, 120)}...` 
              : listing.description
            }
          </div>
        )}

        {/* 6. Service Chips Row */}
        {hasServiceModes && (
          <div className="flex flex-wrap gap-2">
            {listing.serviceModes.map((mode, index) => {
              // Convert service mode keys to display labels
              const serviceLabels: Record<string, string> = {
                'dine_in': 'Comer en local',
                'takeout': 'Para llevar',
                'delivery': 'Entrega a domicilio',
                'catering': 'Catering',
                'events': 'Eventos',
                'pop_up': 'Pop-up',
                'food_truck': 'Food truck',
                'personal_chef': 'Chef personal',
                'meal_prep': 'Meal prep',
                'other': 'Otro'
              };
              
              const label = serviceLabels[mode] || mode;
              return (
                <span key={index} className={SERVICE_CHIP}>
                  {label}
                </span>
              );
            })}
          </div>
        )}

        {/* 7. CTA Row */}
        <div className="flex flex-wrap gap-3 pt-2">
          {ctas.slice(0, 6).map((cta, index) => {
            const isPrimary = index === 0;
            const IconComponent = cta.icon;
            const buttonClass = isPrimary ? CTA_PRIMARY : CTA_SECONDARY;
            
            return (
              <a
                key={cta.key}
                href={cta.href}
                className={`${CTA_BUTTON} ${buttonClass}`}
                onClick={async (e) => {
                  e.stopPropagation();
                  // Track CTA click analytics
                  const ctaType = cta.key === 'call' ? 'phone' : 
                                 cta.key === 'website' ? 'website' :
                                 cta.key === 'directions' ? 'directions' :
                                 cta.key === 'whatsapp' ? 'whatsapp' :
                                 cta.key === 'order' ? 'order' :
                                 cta.key === 'reserve' ? 'reserve' : 'general';
                  
                  try {
                    await trackRestaurantesCtaClick(listing.id, ctaType as any, {
                      metadata: { ctaKey: cta.key }
                    });
                  } catch (error) {
                    console.warn('CTA click tracking failed:', error);
                  }
                }}
                {...(cta.href?.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <IconComponent className="w-4 h-4" />
                {cta.label}
              </a>
            );
          })}
        </div>

        {/* Rating and Likes */}
        <div className="flex items-center justify-between pt-2">
          {hasRating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <FiStar 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.floor(listing.rating) ? "text-[#BEA98E] fill-current" : "text-[#D8C2A0]/30"}`}
                  />
                ))}
              </div>
              <span className="text-sm text-[#5A5148]">{listing.rating.toFixed(1)}</span>
              {listing.externalReviewCount && (
                <span className="text-xs text-[#8B7E70]">({listing.externalReviewCount})</span>
              )}
            </div>
          )}
          
          {/* Likes Display */}
          {listing.likesCount && listing.likesCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-[#F6EBDD] rounded-full">
              <span className="text-sm">❤️</span>
              <span className="text-xs font-medium text-[#1F1A17]">
                {listing.likesCount}
              </span>
            </div>
          )}
        </div>

        {/* Engagement Section */}
        {showEngagementMetrics && (
          <div className={ENGAGEMENT_SECTION}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-[#1F1A17] uppercase tracking-wide">
                Interacción
              </h4>
            </div>
            
            {/* Engagement Actions */}
            <div className="flex items-center gap-3 mb-4">
              <LeonixLikeButton
                listingId={listing.id}
                ownerUserId={listing.id}
                variant="small"
                lang={lang}
              />
              <LeonixSaveButton
                listingId={listing.id}
                ownerUserId={listing.id}
                variant="small"
                lang={lang}
              />
              <LeonixShareButton
                listingId={listing.id}
                ownerUserId={listing.id}
                variant="small"
                lang={lang}
              />
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
