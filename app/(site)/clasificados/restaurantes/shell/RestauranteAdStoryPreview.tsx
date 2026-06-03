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
import { RestauranteProfileHeader } from "./RestauranteProfileHeader";
import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import { requestAdTranslation } from "@/app/lib/translation/requestAdTranslation";
import { useRestauranteShellTranslation } from "@/app/clasificados/restaurantes/lib/useRestauranteShellTranslation";

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

const SHELL_UI = {
  es: {
    contactHeading: "Contacto y Ubicación",
    readMore: "Leer más",
    readLess: "Leer menos",
  },
  en: {
    contactHeading: "Contact & location",
    readMore: "Read more",
    readLess: "Read less",
  },
} as const;

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
  const listingKeyResolved = (listingId ?? "").trim() || data.id;
  const shellTx = useRestauranteShellTranslation(data, lang, listingKeyResolved);
  const proseData = shellTx.displayData;
  const ui = SHELL_UI[lang];

  const translateControl = shellTx.offerTranslate ? (
    <div className="mb-3 flex justify-start" data-restaurantes-translate-ad="1">
      <TranslateAdControl
        siteLocale={lang}
        originalLocale={shellTx.sourceLocale}
        category="restaurantes"
        listingKey={listingKeyResolved}
        version="restaurantes-t9-v1"
        translatableContent={shellTx.translatableContent}
        onTranslated={shellTx.onTranslated}
        onShowOriginal={shellTx.onShowOriginal}
        requestTranslation={requestAdTranslation}
        className="w-full sm:w-auto"
      />
    </div>
  ) : null;

  const pathname = usePathname();
  const [shareAbs, setShareAbs] = useState("");
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [hoursFull, setHoursFull] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = pathname || "";
    setShareAbs(p ? `${window.location.origin}${p}` : window.location.href);
  }, [pathname]);

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
  const hasMenuHighlights = proseData.menuHighlights && proseData.menuHighlights.length > 0;
  const hasGallery = data.venueGallery || data.gallery;
  const hasHoursSection = Boolean(data.hoursPreview);
  const hasTrustInfo = data.trustRating || data.trustLight;
  const hasStackSections = proseData.stackSections && proseData.stackSections.length > 0;

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
      
      <RestauranteProfileHeader
        data={data}
        lang={lang}
        listingId={listingId}
        listingShareUrl={shareAbs || undefined}
        analyticsOwnerUserId={analyticsOwnerUserId}
        persistListingEngagement={persistListingEngagement}
      />
      {/* B. Story / About Zone */}
      {proseData.aboutBody ? (
        <section className={SECTION_CARD}>
          <div className={SECTION_PADDING}>
            {translateControl}
            <h2 className={SECTION_TITLE}>{lang === "en" ? "About us" : "Sobre nosotros"}</h2>
            <div className="prose prose-lg max-w-none">
              <div
                className={`text-sm leading-relaxed text-[color:var(--lx-text)] whitespace-pre-wrap md:text-base ${
                  aboutExpanded ? "" : "line-clamp-5 md:line-clamp-none"
                }`}
              >
                {proseData.aboutBody}
              </div>
              {proseData.aboutBody.length > 220 ? (
                <button
                  type="button"
                  onClick={() => setAboutExpanded((e) => !e)}
                  className="mt-2 text-sm font-semibold text-[color:var(--lx-olive)] underline underline-offset-2 md:hidden"
                >
                  {aboutExpanded ? ui.readLess : ui.readMore}
                </button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* C. Contact and Location Zone */}
      {hasContactInfo && (
        <section className="overflow-hidden rounded-3xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-card)] shadow-sm">
          <div className={SECTION_PADDING}>
            <h2 className="mb-4 text-xl font-bold tracking-tight text-[color:var(--lx-text)] md:mb-6 md:text-2xl">
              {ui.contactHeading}
            </h2>
            {data.contactHub ? (
              <RestaurantContactHub
                hub={data.contactHub}
                lang={lang}
                listingId={listingId}
                ownerUserId={analyticsOwnerUserId}
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
            {!proseData.aboutBody ? translateControl : null}
            <h2 className={SECTION_TITLE}>Especialidades de la Casa</h2>
            {/* Mobile: horizontal snap carousel */}
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] md:hidden">
              {proseData.menuHighlights!.map((dish, index) => (
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
              {proseData.menuHighlights!.map((dish, index) => (
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
                    {(proseData.hoursDetail?.specialNote ?? data.hoursDetail.specialNote) ? (
                      <div className="mt-4 rounded-xl bg-[#F6EBDD] p-4">
                        <p className="text-sm text-[#1F1A17]">
                          <strong>Nota especial:</strong>{" "}
                          {proseData.hoursDetail?.specialNote ?? data.hoursDetail.specialNote}
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
                        {(proseData.hoursDetail?.specialNote ?? data.hoursDetail.specialNote) ? (
                          <p className="mt-3 rounded-lg bg-[#F6EBDD] p-3 text-xs text-[#1F1A17]">
                            <strong>Nota:</strong>{" "}
                            {proseData.hoursDetail?.specialNote ?? data.hoursDetail.specialNote}
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
                  {proseData.trustLight?.summaryLine ?? data.trustLight.summaryLine}
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
              {proseData.stackSections!.map((stack) => (
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
