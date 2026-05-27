"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiExternalLink, FiMail, FiMapPin, FiPhone, FiInstagram, FiFacebook, FiYoutube, FiClock, FiStar } from "react-icons/fi";
import { FaTiktok, FaWhatsapp } from "react-icons/fa";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import type { RestaurantDetailShellData } from "./restaurantDetailShellTypes";
import { RestauranteAmenitiesShellSection } from "./RestauranteAmenitiesShellSection";
import { RestauranteGroupedFeaturesSection } from "./RestauranteGroupedFeaturesSection";
import { RestauranteLockedGallerySection } from "./RestauranteLockedGallerySection";
import { normalizeActionableUrl } from "../lib/urlNormalization";
import { RestaurantContactHub } from "./RestaurantContactHub";

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

const SECTION_CARD = "rounded-3xl border border-[#D8C2A0] bg-[#FFFAF3] shadow-[0_8px_32px_-8px_rgba(212,165,116,0.15)] overflow-hidden";
const SECTION_PADDING = "p-4 sm:p-6 md:p-8";
const SECTION_TITLE = "text-xl font-bold text-[#1F1A17] mb-4 tracking-tight md:mb-6 md:text-2xl";
const SECTION_DESCRIPTION = "text-base text-[#5A5148] leading-relaxed";
const SUBSECTION_TITLE = "text-lg font-semibold text-[#1F1A17] mb-4";
const DETAIL_LABEL = "text-sm font-semibold text-[#5A5148] mb-2";
const DETAIL_VALUE = "text-base text-[#1F1A17]";

const CTA_BUTTON = "inline-flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-base transition-all duration-200 border min-h-[44px]";
const CTA_PRIMARY = "bg-[#2C1810] text-white border-[#2C1810] hover:bg-[#1A1412] shadow-md";
const CTA_SECONDARY = "bg-white text-[#1F1A17] border-[#D8C2A0] hover:bg-[#FFFAF3] hover:border-[#BEA98E] shadow-sm";

const SERVICE_CHIP = "px-3 py-1.5 rounded-full bg-[#F6EBDD] text-[#1F1A17] text-xs font-semibold border border-[#D8C2A0] inline-flex items-center gap-1";

interface RestauranteAdStoryPreviewProps {
  data: RestaurantDetailShellData;
  listingId?: string;
  lang?: "es" | "en";
  /** Supabase listing owner — prefer over `data.id` (draft id) for analytics. */
  analyticsOwnerUserId?: string | null;
  /** When false, engagement buttons do not write analytics or saved/liked tables. */
  persistListingEngagement?: boolean;
}

export function RestauranteAdStoryPreview({
  data,
  listingId = "",
  lang = "es",
  analyticsOwnerUserId,
  persistListingEngagement = true,
}: RestauranteAdStoryPreviewProps) {
  const ownerUid = (analyticsOwnerUserId ?? "").trim() || undefined;
  const pathname = usePathname();
  const [shareAbs, setShareAbs] = useState("");
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [hoursFull, setHoursFull] = useState(false);
  const [chipsExpanded, setChipsExpanded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = pathname || "";
    setShareAbs(p ? `${window.location.origin}${p}` : window.location.href);
  }, [pathname]);

  const mobileIdentityChips = useMemo(() => {
    const chips: string[] = [];
    if (data.cuisineTypeLine) {
      for (const raw of data.cuisineTypeLine.split(" · ")) {
        const t = raw.trim();
        if (t) chips.push(t);
      }
    }
    if (data.taxonomyChips?.length) {
      for (const tc of data.taxonomyChips) {
        const t = tc.label?.trim();
        if (t) chips.push(t);
      }
    }
    return Array.from(new Set(chips));
  }, [data.cuisineTypeLine, data.taxonomyChips]);

  // Helper functions
  const hasHeroImage = data.heroImageUrl;

  // Convert 24-hour time string to 12-hour format
  const convertTo12Hour = (timeString: string): string => {
    return timeString.replace(/\b(\d{1,2}):(\d{2})\b/g, (match, hours, minutes) => {
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
      return `${displayHour}:${minutes} ${ampm}`;
    });
  };
  const hasContactInfo = Boolean(data.contactHub?.hasAny);
  const hasMenuHighlights = data.menuHighlights && data.menuHighlights.length > 0;
  const hasGallery = data.venueGallery || data.gallery;
  const hasHoursSection = Boolean(data.hoursPreview);
  const hasTrustInfo = data.trustRating || data.trustLight;
  const hasStackSections = data.stackSections && data.stackSections.length > 0;

  const primaryCtas = data.primaryCtas || [];
  const hubHandlesContact = Boolean(data.contactHub?.hasAny);

  /** Mobile hero quick actions — omitted when contact hub owns contact CTAs. */
  const mobileHeroPrimaryCtas = useMemo(() => {
    if (hubHandlesContact) return [];
    const want = new Set(["call", "website", "directions", "whatsapp"]);
    const filtered = primaryCtas.filter(
      (c) => want.has(c.key) && c.href?.trim() && c.enabled !== false,
    );
    const byKey = new Map<string, (typeof filtered)[number]>();
    for (const c of filtered) {
      if (!byKey.has(c.key)) byKey.set(c.key, c);
    }
    const order = ["call", "website", "directions", "whatsapp"] as const;
    return order.map((k) => byKey.get(k)).filter(Boolean) as (typeof filtered)[number][];
  }, [primaryCtas, hubHandlesContact]);

  const desktopHeroPrimaryCtas = useMemo(() => {
    if (hubHandlesContact) return [];
    return primaryCtas
      .filter(
        (cta) =>
          ["call", "website", "directions", "whatsapp", "order", "reserve"].includes(cta.key) &&
          cta.href?.trim() &&
          cta.enabled !== false,
      )
      .slice(0, 6);
  }, [primaryCtas, hubHandlesContact]);

  const neighborhoodDisplay = data.quickInfo?.find((item) => item.key === "neighborhood")?.value || "";

  const todayHoursRow = useMemo(() => {
    const rows = data.hoursDetail?.rows;
    if (!rows?.length) return null;
    const idx = new Date().getDay();
    const label = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][idx];
    return rows.find((r) => r.dayLabel === label) ?? null;
  }, [data.hoursDetail]);

  const renderStackValue = (row: { label: string; value: string }) => {
    if (row.label === "Enlace" && data.contactHub?.findUs.some((b) => b.id === "current-location")) {
      return (
        <span className="break-words text-[color:var(--lx-text-2)]">
          {lang === "en" ? "Use “See where we are today” in contact." : "Usa «Ver dónde está hoy» en contacto."}
        </span>
      );
    }
    const isClickableField =
      row.label.includes("Ruta semanal") ||
      row.label.includes("Solicitud") ||
      row.label.includes("cotización");
    const actionableUrl = isClickableField ? normalizeActionableUrl(row.value) : null;
    if (actionableUrl) {
      return (
        <a
          href={actionableUrl}
          target={row.value.startsWith("http") ? "_blank" : undefined}
          rel={row.value.startsWith("http") ? "noopener noreferrer" : undefined}
          className="break-words text-[color:var(--lx-olive)] underline decoration-[color:var(--lx-border)] underline-offset-2 transition-colors hover:text-[color:var(--lx-text)] hover:decoration-[color:var(--lx-border)]"
        >
          {row.value}
        </a>
      );
    }
    return <span className="break-words text-[color:var(--lx-text)]">{row.value}</span>;
  };

  return (
    <div className="space-y-4 md:space-y-8" style={{ background: LEONIX_PAGE_BG }}>
      
      {/* A. Cover / Hero Zone */}
      <section className={SECTION_CARD}>
        {hasHeroImage ? (
          <>
            {/* Mobile: image only + compacted content below */}
            <div className="md:hidden">
              <div className="relative aspect-[5/4] w-full overflow-hidden bg-[#EFE7DA]">
                <Image
                  src={data.heroImageUrl!}
                  alt={data.heroImageAlt || data.businessName}
                  fill
                  className="object-cover"
                  priority
                  sizes="100vw"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" aria-hidden />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-2.5 pb-2.5 pt-10">
                  {neighborhoodDisplay ? (
                    <div className="min-w-0 max-w-[58%] rounded-md border border-white/25 bg-black/45 px-2 py-1 text-[10px] font-semibold leading-tight text-white shadow-sm backdrop-blur-sm">
                      <span className="block truncate">{neighborhoodDisplay}</span>
                    </div>
                  ) : (
                    <span className="min-w-0 max-w-[58%]" aria-hidden />
                  )}
                  <span
                    className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-semibold shadow-sm backdrop-blur-sm ${
                      data.hoursPreview.status === "open"
                        ? "border-emerald-300/40 bg-emerald-950/75 text-emerald-50"
                        : "border-rose-300/40 bg-rose-950/80 text-rose-50"
                    }`}
                  >
                    {data.hoursPreview.status === "open" ? "Abierto" : "Cerrado"}
                  </span>
                </div>
              </div>
              <div className="border-t border-[#D8C2A0] bg-[#FFFAF3] px-4 pb-3 pt-2.5">
                <h1 className="text-center text-2xl font-bold leading-[1.15] tracking-tight text-[#1F1A17]">
                  {data.businessName}
                </h1>

                {data.contactHub?.location?.addressLine1 ? (
                  <p className="mx-auto mt-1.5 max-w-full truncate text-center text-[13px] font-semibold leading-snug text-[color:var(--lx-text-2)]">
                    {data.contactHub.location.addressLine1}
                  </p>
                ) : null}

                {mobileIdentityChips.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap justify-center gap-1">
                      {mobileIdentityChips.slice(0, chipsExpanded ? undefined : 3).map((chip) => (
                        <span
                          key={chip}
                          className="shrink-0 whitespace-nowrap rounded-full border border-[#D8C2A0]/90 bg-[#F6EBDD] px-2 py-0.5 text-[10px] font-semibold text-[#1F1A17]"
                        >
                          {chip}
                        </span>
                      ))}
                      {!chipsExpanded && mobileIdentityChips.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setChipsExpanded(true)}
                          className="shrink-0 rounded-full border border-[#D8C2A0]/90 bg-white px-2 py-0.5 text-[10px] font-semibold text-[#5A5148] hover:bg-[#F6EBDD]"
                        >
                          +{mobileIdentityChips.length - 3}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                  {mobileHeroPrimaryCtas.map((cta, index) => {
                    const n = mobileHeroPrimaryCtas.length;
                    const aloneLast = n % 2 === 1 && index === n - 1;
                    const aloneFirst = n === 1;
                    const wrapClass =
                      aloneFirst || aloneLast ? "col-span-2 flex justify-center" : undefined;
                    return (
                      <div key={`m-${cta.key}`} className={wrapClass}>
                        <a
                          href={cta.href}
                          className={`inline-flex min-h-[36px] items-center justify-center gap-1 rounded-lg border border-[#D8C2A0] bg-white px-2 text-center text-[11px] font-semibold leading-tight text-[#1F1A17] shadow-sm ${
                            aloneFirst || aloneLast
                              ? "w-[calc((100%-0.375rem)/2)] max-w-[200px]"
                              : "w-full"
                          }`}
                          {...(cta.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                          {cta.key === "call" && <FiPhone className="h-3 w-3 shrink-0" aria-hidden />}
                          {cta.key === "website" && <FiExternalLink className="h-3 w-3 shrink-0" aria-hidden />}
                          {cta.key === "directions" && <FiMapPin className="h-3 w-3 shrink-0" aria-hidden />}
                          {cta.key === "whatsapp" && <FaWhatsapp className="h-3 w-3 shrink-0 text-emerald-700" aria-hidden />}
                          <span className="min-w-0 truncate">{cta.label}</span>
                        </a>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
                  {(data.contactHub?.social?.length ?? 0) === 0 && data.contact?.instagramHref ? (
                    <a
                      href={data.contact.instagramHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#D8C2A0] bg-white text-[#1F1A17] shadow-sm"
                      aria-label="Instagram"
                    >
                      <FiInstagram className="h-3 w-3" />
                    </a>
                  ) : null}
                  {(data.contactHub?.social?.length ?? 0) === 0 && data.contact?.facebookHref ? (
                    <a
                      href={data.contact.facebookHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#D8C2A0] bg-white text-[#1F1A17] shadow-sm"
                      aria-label="Facebook"
                    >
                      <FiFacebook className="h-3 w-3" />
                    </a>
                  ) : null}
                  {(data.contactHub?.social?.length ?? 0) === 0 && data.contact?.tiktokHref ? (
                    <a
                      href={data.contact.tiktokHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#D8C2A0] bg-white text-[#1F1A17] shadow-sm"
                      aria-label="TikTok"
                    >
                      <FaTiktok className="h-3 w-3" />
                    </a>
                  ) : null}
                  {(data.contactHub?.social?.length ?? 0) === 0 && data.contact?.youtubeHref ? (
                    <a
                      href={data.contact.youtubeHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#D8C2A0] bg-white text-[#1F1A17] shadow-sm"
                      aria-label="YouTube"
                    >
                      <FiYoutube className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>

                {listingId ? (
                  <div className="mt-2.5 flex flex-nowrap items-stretch gap-1 border-t border-[#D8C2A0]/40 pt-2">
                    <LeonixLikeButton
                      listingId={listingId}
                      ownerUserId={ownerUid}
                      variant="small"
                      lang={lang}
                      category="restaurantes"
                      persistEngagement={persistListingEngagement}
                      className="min-h-0 flex-1 min-w-0 basis-0 !px-2 !py-1 text-[11px] font-medium opacity-90 [&>span]:min-w-0 [&>span]:truncate"
                    />
                    <LeonixSaveButton
                      listingId={listingId}
                      ownerUserId={ownerUid}
                      variant="small"
                      lang={lang}
                      category="restaurantes"
                      persistEngagement={persistListingEngagement}
                      className="min-h-0 flex-1 min-w-0 basis-0 !px-2 !py-1 text-[11px] font-medium opacity-90 [&>span]:min-w-0 [&>span]:truncate"
                    />
                    <LeonixShareButton
                      listingId={listingId}
                      ownerUserId={ownerUid}
                      listingTitle={data.businessName}
                      listingUrl={shareAbs || undefined}
                      variant="small"
                      lang={lang}
                      category="restaurantes"
                      directNativeShare
                      persistEngagement={persistListingEngagement}
                      className="flex-1 min-w-0 basis-0 [&>button]:flex [&>button]:h-full [&>button]:w-full [&>button]:min-h-0 [&>button]:min-w-0 [&>button]:justify-center [&>button]:gap-1 [&>button]:!px-2 [&>button]:!py-1 [&>button]:text-[11px] [&>button]:font-medium [&>button]:opacity-90 [&>button>span]:min-w-0 [&>button>span]:truncate"
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Desktop: existing hero overlay */}
            <div className="relative hidden aspect-[16/10] overflow-hidden md:block">
            <Image
              src={data.heroImageUrl!}
              alt={data.heroImageAlt || data.businessName}
              fill
              className="object-cover"
              priority
            />
            {/* Premium dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
            
            {/* Hero content - centered */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-8 text-white text-center">
              <div className="max-w-4xl mx-auto space-y-4">
                {/* Business logo */}
                {data.businessLogo && (
                  <div className="mb-8 flex justify-center">
                    <Image
                      src={data.businessLogo}
                      alt={`${data.businessName} logo`}
                      width={320}
                      height={320}
                      className="w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-white/20 p-6 object-contain shadow-xl"
                    />
                  </div>
                )}
                
                {/* Business name */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight drop-shadow-2xl">
                  {data.businessName}
                </h1>
                
                {/* Cuisine and type */}
                {data.cuisineTypeLine && (
                  <div className="flex flex-wrap justify-center gap-2 text-lg sm:text-xl font-medium drop-shadow">
                    {data.cuisineTypeLine.split(' · ').map((cuisine, index) => (
                      <span key={index} className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                        {cuisine.trim()}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Status, hours, neighborhood row */}
                <div className="flex flex-wrap justify-center items-center gap-3 text-sm sm:text-base">
                  {/* Hours status */}
                  <span className={`px-4 py-2 rounded-full font-semibold backdrop-blur-sm ${
                    data.hoursPreview.status === 'open' 
                      ? 'bg-green-500/30 text-white border border-green-400/50' 
                      : 'bg-red-500/30 text-white border border-red-400/50'
                  }`}>
                    {data.hoursPreview.status === 'open' ? '🟢 Abierto ahora' : '🔴 Cerrado'}
                  </span>
                  
                  {/* Neighborhood/Zone */}
                  {(() => {
                    // Get neighborhood from quickInfo (priority: neighborhood -> nothing)
                    const neighborhoodItem = data.quickInfo?.find(item => item.key === 'neighborhood');
                    const locationDisplay = neighborhoodItem?.value || '';
                    
                    if (!locationDisplay) return null;
                    
                    return (
                      <span className="px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm flex items-center gap-1">
                        <FiMapPin className="w-4 h-4" />
                        {locationDisplay}
                      </span>
                    );
                  })()}
                  
                  {/* Rating */}
                  {data.trustRating && (
                    <span className="px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm flex items-center gap-1">
                      <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{data.trustRating.average.toFixed(1)}</span>
                      <span className="text-white/80">({data.trustRating.count})</span>
                    </span>
                  )}
                </div>
                
                {/* Public address only (hub privacy rules) */}
                {data.contactHub?.location?.addressLine1 ? (
                  <div className="text-base sm:text-lg drop-shadow">
                    <span className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm inline-block">
                      {data.contactHub.location.addressLine1}
                      {data.contactHub.location.addressLine2 ? `, ${data.contactHub.location.addressLine2}` : ""}
                    </span>
                  </div>
                ) : null}
                
                {desktopHeroPrimaryCtas.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-3 pt-4">
                  {desktopHeroPrimaryCtas.map((cta, index) => {
                      const isPrimary = index === 0;
                      const buttonClass = isPrimary 
                        ? "bg-white text-[#1F1A17] border-white hover:bg-gray-100 shadow-lg" 
                        : "bg-white/20 text-white border-white/50 hover:bg-white/30 backdrop-blur-sm";
                      
                      return (
                        <a
                          key={cta.key}
                          href={cta.href}
                          className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 border min-h-[44px] ${buttonClass}`}
                          {...(cta.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                          {cta.key === "call" && <FiPhone className="w-4 h-4" />}
                          {cta.key === "website" && <FiExternalLink className="w-4 h-4" />}
                          {cta.key === "directions" && <FiMapPin className="w-4 h-4" />}
                          {cta.key === "whatsapp" && <FaWhatsapp className="w-4 h-4" />}
                          {cta.key === "order" && <span>🛒</span>}
                          {cta.key === "reserve" && <span>📅</span>}
                          {cta.label}
                        </a>
                      );
                    })}
                </div>
                ) : null}
              </div>
            </div>
            <div className="absolute top-4 right-4 z-20 hidden md:block">
              <div className="flex flex-col gap-2">
                <div className="rounded-full bg-white/90 p-1 shadow-lg backdrop-blur-sm">
                  <LeonixLikeButton
                    listingId={listingId}
                    ownerUserId={ownerUid}
                    variant="small"
                    lang={lang}
                    category="restaurantes"
                    persistEngagement={persistListingEngagement}
                    className="border-0"
                  />
                </div>
                <div className="rounded-full bg-white/90 p-1 shadow-lg backdrop-blur-sm">
                  <LeonixSaveButton
                    listingId={listingId}
                    ownerUserId={ownerUid}
                    variant="small"
                    lang={lang}
                    category="restaurantes"
                    persistEngagement={persistListingEngagement}
                    className="border-0"
                  />
                </div>
                <div className="rounded-full bg-white/90 p-1 shadow-lg backdrop-blur-sm">
                  <LeonixShareButton
                    listingId={listingId}
                    ownerUserId={ownerUid}
                    listingTitle={data.businessName}
                    listingUrl={shareAbs || undefined}
                    variant="small"
                    lang={lang}
                    category="restaurantes"
                    directNativeShare
                    persistEngagement={persistListingEngagement}
                  />
                </div>
              </div>
            </div>
          </div>
          </>
        ) : (
          // Fallback hero without image
          <div className={`${SECTION_PADDING} text-center`}>
            <div className="max-w-4xl mx-auto space-y-6">
                            
              {/* Business name */}
              <h1 className="text-4xl sm:text-5xl font-bold text-[#1F1A17] leading-tight">
                {data.businessName}
              </h1>
              
              {/* Cuisine and type */}
              {data.cuisineTypeLine && (
                <div className="flex flex-wrap justify-center gap-2 text-lg sm:text-xl font-medium">
                  {data.cuisineTypeLine.split(' · ').map((cuisine, index) => (
                    <span key={index} className="px-3 py-1 bg-[#F6EBDD] rounded-full text-[#1F1A17]">
                      {cuisine.trim()}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Status, hours, neighborhood row */}
              <div className="flex flex-wrap justify-center items-center gap-3 text-sm sm:text-base">
                {/* Hours status */}
                <span className={`px-4 py-2 rounded-full font-semibold ${
                  data.hoursPreview.status === 'open' 
                    ? 'bg-[#1A4D2E] text-white' 
                    : 'bg-[#BEA98E] text-[#1F1A17]'
                }`}>
                  {data.hoursPreview.status === 'open' ? '🟢 Abierto ahora' : '🔴 Cerrado'}
                </span>
                
                {/* Neighborhood */}
                {(() => {
                  // Get neighborhood from quickInfo (priority: neighborhood -> nothing)
                  const neighborhoodItem = data.quickInfo?.find(item => item.key === 'neighborhood');
                  const locationDisplay = neighborhoodItem?.value || '';
                  
                  if (!locationDisplay) return null;
                  
                  return (
                    <span className="px-4 py-2 bg-[#F6EBDD] rounded-full text-[#1F1A17] flex items-center gap-1">
                      <FiMapPin className="w-4 h-4" />
                      {locationDisplay}
                    </span>
                  );
                })()}
                
                {/* Rating */}
                {data.trustRating && (
                  <span className="px-4 py-2 bg-[#F6EBDD] rounded-full text-[#1F1A17] flex items-center gap-1">
                    <FiStar className="w-4 h-4 text-yellow-600 fill-current" />
                    <span>{data.trustRating.average.toFixed(1)}</span>
                    <span className="text-[#5A5148]">({data.trustRating.count})</span>
                  </span>
                )}
              </div>
              
              {data.contactHub?.location?.addressLine1 ? (
                <div className="text-base sm:text-lg">
                  <span className="px-4 py-2 bg-[#F6EBDD] rounded-lg text-[#1F1A17] inline-block">
                    {data.contactHub.location.addressLine1}
                    {data.contactHub.location.addressLine2 ? `, ${data.contactHub.location.addressLine2}` : ""}
                  </span>
                </div>
              ) : null}
              
              {desktopHeroPrimaryCtas.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-3 pt-4">
                {desktopHeroPrimaryCtas.map((cta, index) => {
                    const isPrimary = index === 0;
                    const buttonClass = isPrimary 
                      ? "bg-[#2C1810] text-white border-[#2C1810] hover:bg-[#1A1412] shadow-md" 
                      : "bg-white text-[#1F1A17] border-[#D8C2A0] hover:bg-[#FFFAF3] hover:border-[#BEA98E] shadow-sm";
                    
                    return (
                      <a
                        key={cta.key}
                        href={cta.href}
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 border min-h-[44px] ${buttonClass}`}
                        {...(cta.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        {cta.key === "call" && <FiPhone className="w-4 h-4" />}
                        {cta.key === "website" && <FiExternalLink className="w-4 h-4" />}
                        {cta.key === "directions" && <FiMapPin className="w-4 h-4" />}
                        {cta.key === "whatsapp" && <FaWhatsapp className="w-4 h-4" />}
                        {cta.key === "order" && <span>🛒</span>}
                        {cta.key === "reserve" && <span>📅</span>}
                        {cta.label}
                      </a>
                    );
                  })}
              </div>
              ) : null}
            </div>
          </div>
        )}
      </section>

      {/* B. Story / About Zone */}
      {(data.aboutBody || data.summaryShort) && (
        <section className={SECTION_CARD}>
          <div className={SECTION_PADDING}>
            <h2 className={SECTION_TITLE}>Sobre el Negocio</h2>
            <div className="prose prose-lg max-w-none">
              {data.aboutBody ? (
                <>
                  <div
                    className={`text-sm leading-relaxed text-[color:var(--lx-text)] whitespace-pre-wrap md:text-base ${
                      aboutExpanded ? "" : "line-clamp-5 md:line-clamp-none"
                    }`}
                  >
                    {data.aboutBody}
                  </div>
                  {data.aboutBody.length > 220 ? (
                    <button
                      type="button"
                      onClick={() => setAboutExpanded((e) => !e)}
                      className="mt-2 text-sm font-semibold text-[color:var(--lx-olive)] underline underline-offset-2 md:hidden"
                    >
                      {aboutExpanded ? "Leer menos" : "Leer más"}
                    </button>
                  ) : null}
                </>
              ) : (
                <p className="text-base text-[color:var(--lx-text)] leading-relaxed">{data.summaryShort}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* C. Contact and Location Zone */}
      {hasContactInfo && (
        <section className="overflow-hidden rounded-3xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-card)] shadow-sm">
          <div className={SECTION_PADDING}>
            <h2 className="mb-4 text-xl font-bold tracking-tight text-[color:var(--lx-text)] md:mb-6 md:text-2xl">
              Contacto y Ubicación
            </h2>
            {data.contactHub ? (
              <RestaurantContactHub
                hub={data.contactHub}
                lang={lang}
                contactShareExtras={{
                  email: data.contact?.email,
                  websiteUrl: data.contact?.websiteHref,
                }}
              />
            ) : null}
          </div>
        </section>
      )}

      {/* D. Hook / Quick Understanding Zone */}
      {data.groupedFeatures && (
        <RestauranteGroupedFeaturesSection features={data.groupedFeatures} />
      )}

      {data.amenitiesSection && data.amenitiesSection.groups.length > 0 ? (
        <RestauranteAmenitiesShellSection section={data.amenitiesSection} lang={lang} />
      ) : null}

      
      {/* D. Proof / Featured Menu Zone */}
      {hasMenuHighlights && (
        <section className={SECTION_CARD}>
          <div className={SECTION_PADDING}>
            <h2 className={SECTION_TITLE}>Especialidades de la Casa</h2>
            {/* Mobile: horizontal snap carousel */}
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] md:hidden">
              {data.menuHighlights!.map((dish, index) => (
                <div
                  key={`m-dish-${index}`}
                  className="flex w-[min(82vw,300px)] shrink-0 snap-center flex-col rounded-2xl border border-[#D8C2A0] bg-white p-3 shadow-sm"
                >
                  {dish.imageUrl ? (
                    <div className="relative mb-2 aspect-[5/4] w-full overflow-hidden rounded-xl bg-[#F5F0E8]">
                      <Image src={dish.imageUrl} alt={dish.name} fill className="object-cover" sizes="85vw" />
                    </div>
                  ) : null}
                  <h3 className="line-clamp-1 text-sm font-bold text-[#1F1A17]">{dish.name}</h3>
                  {dish.supportingLine ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-snug text-[#5A5148]">{dish.supportingLine}</p>
                  ) : null}
                  {dish.badge ? (
                    <span className="mt-2 inline-flex max-w-full self-start truncate rounded-full border border-[#D8C2A0]/80 bg-[#F6EBDD] px-2.5 py-1 text-[10px] font-bold text-[#1F1A17]">
                      {dish.badge}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
            {/* Desktop: grid (md+) */}
            <div className="hidden gap-6 md:grid md:grid-cols-2">
              {data.menuHighlights!.map((dish, index) => (
                <div key={index} className="rounded-2xl border border-[#D8C2A0] bg-white p-4 shadow-sm">
                  {dish.imageUrl && (
                    <div className="relative mb-4 aspect-[16/10] w-full overflow-hidden rounded-xl">
                      <Image src={dish.imageUrl} alt={dish.name} fill className="object-cover" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-[#1F1A17]">{dish.name}</h3>
                    {dish.supportingLine && <p className="text-sm text-[#5A5148]">{dish.supportingLine}</p>}
                    {dish.badge && (
                      <span className="inline-block rounded-full bg-[#F6EBDD] px-2 py-1 text-xs font-semibold text-[#1F1A17]">
                        {dish.badge}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* E. Proof / Media Gallery Zone */}
      <RestauranteLockedGallerySection galleryBundle={data.venueGallery} />

      
      
      {/* H. Details / Hours Zone */}
      {hasHoursSection && (
        <section className={SECTION_CARD}>
          <div className={SECTION_PADDING}>
            <h2 className={SECTION_TITLE}>Horarios</h2>
            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold md:px-4 md:py-2 md:text-sm ${
                    data.hoursPreview.status === "open"
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {data.hoursPreview.status === "open" ? "Abierto ahora" : "Cerrado"}
                </span>
                <div className="min-w-0 text-sm text-[#5A5148] md:text-base">
                  <p className="font-medium text-[#1F1A17]">{data.hoursPreview.statusLine}</p>
                  <p className="mt-0.5 text-xs leading-snug md:text-sm">{data.hoursPreview.scheduleSummary}</p>
                </div>
              </div>

              {todayHoursRow ? (
                <div className="rounded-xl border border-[#D8C2A0]/80 bg-white/90 px-3 py-2.5 md:hidden">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8B7E70]">Hoy · {todayHoursRow.dayLabel}</p>
                  <p className="mt-1 text-sm font-medium text-[#1F1A17]">{convertTo12Hour(todayHoursRow.line)}</p>
                </div>
              ) : null}

              {data.hoursDetail ? (
                <>
                  <div className="hidden rounded-2xl border border-[#D8C2A0] bg-white p-4 md:block md:p-6">
                    <dl className="space-y-3">
                      {data.hoursDetail.rows.map((row, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-4 border-b border-[#D8C2A0]/30 py-2 last:border-0"
                        >
                          <dt className="shrink-0 font-semibold text-[#1F1A17]">{row.dayLabel}</dt>
                          <dd className="min-w-0 text-right text-[#5A5148]">{convertTo12Hour(row.line)}</dd>
                        </div>
                      ))}
                    </dl>
                    {data.hoursDetail.specialNote ? (
                      <div className="mt-4 rounded-xl bg-[#F6EBDD] p-4">
                        <p className="text-sm text-[#1F1A17]">
                          <strong>Nota especial:</strong> {data.hoursDetail.specialNote}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="md:hidden">
                    <button
                      type="button"
                      onClick={() => setHoursFull((v) => !v)}
                      className="w-full rounded-xl border border-[#D8C2A0] bg-white py-2.5 text-sm font-semibold text-[#1F1A17]"
                    >
                      {hoursFull ? "Ocultar horarios completos" : "Ver horarios completos"}
                    </button>
                    {hoursFull ? (
                      <div className="mt-3 rounded-2xl border border-[#D8C2A0] bg-white p-4">
                        <dl className="space-y-3">
                          {data.hoursDetail.rows.map((row, index) => (
                            <div key={index} className="border-b border-[#D8C2A0]/25 py-2 last:border-0">
                              <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#8B7E70]">
                                {row.dayLabel}
                              </dt>
                              <dd className="mt-1 break-words text-sm text-[#1F1A17]">{convertTo12Hour(row.line)}</dd>
                            </div>
                          ))}
                        </dl>
                        {data.hoursDetail.specialNote ? (
                          <p className="mt-3 rounded-lg bg-[#F6EBDD] p-3 text-xs text-[#1F1A17]">
                            <strong>Nota:</strong> {data.hoursDetail.specialNote}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </section>
      )}

      
      
      {/* J. Trust / External Proof Zone */}
      {hasTrustInfo && (
        <section className={SECTION_CARD}>
          <div className={SECTION_PADDING}>
            <h2 className={SECTION_TITLE}>Prueba Externa</h2>
            
            {/* Rating display */}
            {data.trustRating && (
              <div className="mb-4 rounded-2xl border border-[#D8C2A0] bg-white p-4 md:mb-6 md:p-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <FiStar 
                        key={i} 
                        className={`w-5 h-5 ${
                          i < Math.floor(data.trustRating!.average) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#1F1A17]">
                      {data.trustRating.average.toFixed(1)} de 5
                    </p>
                    <p className="text-sm text-[#5A5148]">
                      {data.trustRating.count} reseñas
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Trust light information */}
            {data.trustLight && (
              <div className="rounded-2xl border border-[#D8C2A0] bg-white p-4 md:p-6">
                <p className="text-base text-[#1F1A17] leading-relaxed mb-4">
                  {data.trustLight.summaryLine}
                </p>
                
                {data.trustLight.externalTrustHref && data.trustLight.externalTrustLabel && (
                  <a
                    href={data.trustLight.externalTrustHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#BEA98E] text-[#1F1A17] rounded-full font-semibold hover:bg-[#D8C2A0] transition-colors"
                  >
                    {data.trustLight.externalTrustLabel}
                    <FiExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* K. Conditional Stack Zones */}
      {hasStackSections && (
        <section className={SECTION_CARD}>
          <div className={SECTION_PADDING}>
            <h2 className={SECTION_TITLE}>Información Adicional</h2>
            <div className="space-y-3 md:space-y-6">
              {data.stackSections!.map((stack) => (
                <div key={stack.id}>
                  <div className="hidden rounded-2xl border border-[#D8C2A0] bg-white p-6 md:block">
                    <h3 className={SUBSECTION_TITLE}>{stack.title}</h3>
                    <dl className="mt-4 space-y-0">
                      {stack.rows.map((row, rowIndex) => (
                        <div
                          key={rowIndex}
                          className="flex items-start justify-between gap-4 border-b border-[#D8C2A0]/30 py-2.5 last:border-0"
                        >
                          <dt className="max-w-[40%] shrink-0 font-semibold text-[#1F1A17]">{row.label}</dt>
                          <dd className="min-w-0 text-right text-sm text-[#5A5148]">{renderStackValue(row)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <details className="group rounded-2xl border border-[#D8C2A0] bg-white md:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
                      <span className="text-base font-semibold text-[#1F1A17]">{stack.title}</span>
                      <span className="text-xs font-semibold text-[#8B7E70] group-open:hidden">Ver</span>
                      <span className="hidden text-xs font-semibold text-[#8B7E70] group-open:inline">Ocultar</span>
                    </summary>
                    <div className="border-t border-[#D8C2A0]/40 px-4 pb-4 pt-1">
                      <dl className="space-y-0">
                        {stack.rows.map((row, rowIndex) => (
                          <div
                            key={rowIndex}
                            className="border-b border-[#D8C2A0]/25 py-3 last:border-0"
                          >
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#8B7E70]">
                              {row.label}
                            </dt>
                            <dd className="mt-1.5 min-w-0 text-sm leading-snug text-[#5A5148]">{renderStackValue(row)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
