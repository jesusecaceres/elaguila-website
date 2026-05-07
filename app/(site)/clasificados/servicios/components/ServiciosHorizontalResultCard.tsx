"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { FiGlobe, FiMapPin, FiPhone, FiMessageCircle } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import type { ServiciosPublicListingRow } from "../lib/serviciosPublicListingsServer";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import { getServiciosProfileLabels } from "@/app/servicios/copy/serviciosProfileCopy";
import { isServiciosListingPromoted } from "../lib/serviciosResultsFilter";

const PREVIEW_CARD =
  "overflow-hidden rounded-[28px] border border-[#E8D7B8] bg-[#FFFDF7] shadow-[0_18px_70px_-30px_rgba(47,42,35,0.25)] transition-shadow duration-300 hover:shadow-[0_22px_90px_-36px_rgba(47,42,35,0.32)]";

/** Landscape results card: wide overall, left media ~40%, right content ~60%, media height capped by aspect (not stretched to content). */
const GRID =
  "grid min-w-0 grid-cols-1 gap-0 md:grid-cols-[minmax(0,42%)_minmax(0,58%)] md:items-start";
const MEDIA = "min-w-0 bg-[#FCF9F2] p-3 md:p-5 md:pr-3";
const MEDIA_FRAME =
  "relative aspect-[16/9] w-full overflow-hidden rounded-[22px] bg-[#E8D7B8] md:aspect-[16/10]";

const CONTENT = "flex min-w-0 flex-col gap-2.5 px-4 pb-4 pt-3 md:gap-4 md:px-7 md:pb-7 md:pt-6";

const TITLE =
  "text-[22px] font-bold leading-[1.12] tracking-tight text-[#2F2A23] sm:text-[24px] md:text-[32px] lg:text-[34px]";
const CHIP_ROW = "flex flex-wrap gap-2";
const CHIP =
  "inline-flex items-center rounded-full border border-[#E8D7B8] bg-white/70 px-3 py-1.5 text-[12px] font-semibold text-[#2F2A23] shadow-sm";

const META_ROW = "flex flex-wrap items-center gap-2.5 text-[13px] font-semibold text-[#6F6254]";
const META_PILL =
  "inline-flex items-center gap-2 rounded-full border border-[#E8D7B8] bg-[#FCF9F2] px-3 py-1.5 shadow-sm";

const STATUS_OPEN = "bg-[#6F7A3A]/20 text-[#6F7A3A] border-[#6F7A3A]/80";
const STATUS_CLOSED = "bg-[#B86A32]/20 text-[#B86A32] border-[#B86A32]/80";

const ADDRESS_LINK =
  "group inline-flex min-h-[44px] w-full items-center gap-2 rounded-2xl border border-[#E8D7B8] bg-[#FCF9F2] px-4 py-3 text-sm font-semibold text-[#2F2A23] shadow-sm transition hover:bg-[#D4AF37]/[0.08] hover:border-[#D4AF37] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/40";

const SUMMARY = "text-xs leading-snug text-[#6F6254] md:text-sm md:leading-relaxed";

const FEATURE_ROW = "flex flex-wrap gap-2";
const FEATURE_CHIP =
  "inline-flex items-center rounded-full border border-[#E8D7B8] bg-[#FCF9F2] px-3 py-1.5 text-[12px] font-semibold text-[#2F2A23]";

const CTA_ROW = "flex flex-wrap items-stretch gap-2.5 pt-1 md:items-center";
const CTA_BTN_BASE =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/40";
const CTA_SECONDARY = "border-[#E8D7B8] bg-white text-[#2F2A23] hover:bg-[#FCF9F2] hover:border-[#D4AF37]";

const ENGAGEMENT_SECTION = "mt-1 border-t border-[#E8D7B8]/50 pt-5";

function cleanOtherLabel(raw: string): string {
  const t = String(raw ?? "").trim();
  if (!t) return "";
  const lower = t.toLowerCase();
  if (lower === "otro" || lower === "other") return "";
  if (lower.startsWith("otro:") || lower.startsWith("other:")) {
    return t.split(":").slice(1).join(":").trim();
  }
  if (lower.startsWith("otro ")) return t.replace(/^otro\s+/i, "").trim();
  if (lower.startsWith("other ")) return t.replace(/^other\s+/i, "").trim();
  return t;
}

function mapsSearchHref(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${rating.toFixed(1)} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => {
        const v = rating - i;
        const pct = Math.round(Math.min(1, Math.max(0, v)) * 100);
        return (
          <span key={i} className="relative h-4 w-[1.05em] text-[15px] leading-none">
            <span className="absolute text-white/35" aria-hidden>★</span>
            <span className="absolute overflow-hidden text-[#D4AF37]" style={{ width: `${pct}%` }} aria-hidden>★</span>
          </span>
        );
      })}
    </div>
  );
}

interface ServiciosHorizontalResultCardProps {
  row: ServiciosPublicListingRow;
  lang: "es" | "en";
  showEngagementMetrics?: boolean;
  listingId?: string;
  analyticsOwnerUserId?: string | null;
  shareListingAbsoluteUrl?: string;
  publicDetailHref?: string;
  publicDetailLabel?: string;
  discoveryRefineHref?: string;
  discoveryRefineLabel?: string;
  resultsSaved?: boolean;
  onResultsSavedToggle?: () => void;
  persistListingEngagement?: boolean;
}

/**
 * Servicios horizontal result card modeled after Restaurants pattern
 * Uses Phase 9D lion-habitat visual system
 */
export function ServiciosHorizontalResultCard({
  row,
  lang,
  showEngagementMetrics = true,
  listingId,
  analyticsOwnerUserId,
  shareListingAbsoluteUrl,
  publicDetailHref,
  publicDetailLabel,
  discoveryRefineHref,
  discoveryRefineLabel,
  resultsSaved,
  onResultsSavedToggle,
  persistListingEngagement = true,
}: ServiciosHorizontalResultCardProps) {
  const L = getServiciosProfileLabels(lang);
  const wire = { ...row.profile_json };
  wire.identity = { ...wire.identity, leonixVerified: row.leonix_verified === true };
  
  if ((row.review_rating_count ?? 0) > 0 && typeof row.review_rating_avg === "number" && Number.isFinite(row.review_rating_avg)) {
    wire.hero = {
      ...wire.hero,
      rating: row.review_rating_avg,
      reviewCount: row.review_rating_count ?? undefined,
    };
  }
  
  const profile = resolveServiciosProfile(wire, lang);
  const shareUrl = (shareListingAbsoluteUrl ?? "").trim();

  const identityChips = useMemo(() => {
    const chips: string[] = [];
    if (profile.hero.categoryLine?.trim()) {
      const cleaned = cleanOtherLabel(profile.hero.categoryLine);
      if (cleaned) chips.push(cleaned);
    }
    if (profile.quickFacts?.length) {
      for (const qf of profile.quickFacts.slice(0, 3)) {
        const cleaned = cleanOtherLabel(qf.label);
        if (cleaned) chips.push(cleaned);
      }
    }
    return Array.from(new Set(chips)).slice(0, 20);
  }, [profile.hero.categoryLine, profile.quickFacts]);

  const quick = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const item of profile.quickFacts ?? []) {
      const v = cleanOtherLabel(item.label);
      if (v) byKey.set(item.kind, v);
    }
    return {
      serviceArea: byKey.get("service_area") || "",
      responseTime: byKey.get("response_time") || "",
    };
  }, [profile.quickFacts]);

  const locationLine = useMemo(() => {
    const fromHero = (profile.hero.locationSummary || "").trim();
    if (fromHero) return fromHero;
    return (row.city || "").trim();
  }, [profile.hero.locationSummary, row.city]);

  const features = useMemo(() => {
    const serviceChips: string[] = [];
    if (quick.serviceArea) {
      for (const raw of quick.serviceArea.split(" · ")) {
        const cleaned = cleanOtherLabel(raw);
        if (cleaned) serviceChips.push(cleaned);
      }
    }
    for (const s of profile.services.slice(0, 6)) {
      const cleaned = cleanOtherLabel(s.title);
      if (cleaned) serviceChips.push(cleaned);
    }
    return Array.from(new Set(serviceChips));
  }, [quick.serviceArea, profile.services]);

  const addressQuery = (profile.contact?.physicalAddressDisplay || "").trim();
  const mapsHref = ((profile.contact?.mapsSearchHref || "").trim() || (addressQuery ? mapsSearchHref(addressQuery) : "")).trim();

  const summary = (profile.about?.text || "").trim();

  const mediaUrl =
    (profile.hero.coverImageUrl || "").trim() ||
    (profile.gallery[0]?.url || "").trim() ||
    (profile.hero.logoUrl || "").trim() ||
    "";
  const mediaAlt =
    (profile.hero.coverImageAlt || "").trim() ||
    (profile.gallery[0]?.alt || "").trim() ||
    (profile.hero.logoAlt || "").trim() ||
    profile.identity.businessName;

  type ContactAction = { key: string; href: string; label: string };

  const contactActions = useMemo((): ContactAction[] => {
    const out: ContactAction[] = [];
    const tel = (profile.contact.phoneTelHref || "").trim();
    if (tel && profile.contact.phoneDisplay) {
      out.push({ key: "call", href: tel, label: L.call });
    }
    const web = (profile.contact.websiteHref || "").trim();
    if (web) {
      out.push({ key: "website", href: web, label: L.visitWebsite });
    }
    const wa = (profile.contact.socialLinks?.whatsapp || "").trim();
    if (wa) {
      out.push({ key: "whatsapp", href: wa, label: L.whatsapp });
    }
    if (mapsHref && !addressQuery) {
      out.push({ key: "maps", href: mapsHref, label: L.openInMaps });
    }
    const mail = (profile.contact.emailMailtoHref || "").trim();
    if (mail) {
      out.push({ key: "email", href: mail, label: L.email });
    }
    return out;
  }, [L, profile.contact, mapsHref, addressQuery]);

  const vitrinaHref = (publicDetailHref || "").trim() || `/clasificados/servicios/${encodeURIComponent(row.slug)}?lang=${lang}`;
  const vitrinaLabel =
    (publicDetailLabel || "").trim() ||
    (lang === "en" ? "View showcase" : "Ver vitrina");

  const effectiveListingId = (listingId || "").trim() || (row.leonix_ad_id || "").trim() || row.slug;
  const effectiveOwnerUserId = (analyticsOwnerUserId || "").trim() || (row.owner_user_id || "").trim() || undefined;
  const promoted = isServiciosListingPromoted(row);

  const ratingValue =
    typeof profile.hero.rating === "number" && Number.isFinite(profile.hero.rating) ? profile.hero.rating : undefined;
  const reviewCount =
    typeof profile.hero.reviewCount === "number" && profile.hero.reviewCount > 0 ? profile.hero.reviewCount : undefined;

  return (
    <div className={`${PREVIEW_CARD} w-full min-w-0`}>
      <div className={GRID}>
        <div className={MEDIA}>
          <div className={MEDIA_FRAME}>
            {mediaUrl ? (
              <Image
                src={mediaUrl}
                alt={mediaAlt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 42vw, 520px"
                priority={false}
              />
            ) : (
              <div className="flex h-full min-h-[140px] w-full items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FCF9F2] border border-[#E8D7B8] shadow-sm">
                    <FiMapPin className="h-6 w-6 text-[#6F7A3A]" aria-hidden />
                  </div>
                  <p className="text-xs font-semibold text-[#6F6254]">{lang === "en" ? "No image yet" : "Sin imagen"}</p>
                </div>
              </div>
            )}
            <div className="absolute left-2 top-2 z-[2] flex max-w-[calc(100%-1rem)] flex-wrap gap-1">
              {promoted ? (
                <span className="rounded-full border border-white/70 bg-gradient-to-r from-[#D4AF37] to-[#9A7329] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                  {L.featured}
                </span>
              ) : null}
              {row.leonix_verified ? (
                <span className="rounded-full border border-white/80 bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2A7F3E] shadow-sm">
                  {lang === "en" ? "Verified" : "Verificado"}
                </span>
              ) : null}
            </div>
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent md:hidden"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 z-[1] flex items-end justify-between gap-2 px-2 pb-2 pt-8 md:hidden">
              {profile.contact?.hours?.openNowLabel ? (
                <div className="min-w-0 max-w-[58%] rounded-md border border-white/25 bg-black/45 px-2 py-1 text-[10px] font-semibold leading-tight text-white shadow-sm backdrop-blur-sm">
                  <span className="block truncate">{profile.contact.hours.openNowLabel}</span>
                </div>
              ) : (
                <span className="min-w-0 max-w-[58%]" aria-hidden />
              )}
              <span
                className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-semibold shadow-sm backdrop-blur-sm ${
                  profile.contact?.hours?.openNowLabel?.toLowerCase().includes('cerrado')
                    ? STATUS_CLOSED
                    : STATUS_OPEN
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-current opacity-70" aria-hidden />
                <span className="line-clamp-2 text-left leading-snug">
                  {profile.contact?.hours?.todayHoursLine?.trim() || (lang === "en" ? "Hours" : "Horario")}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className={CONTENT}>
          <div className="min-w-0 space-y-1.5 md:space-y-3">
            {ratingValue != null && ratingValue > 0 ? (
              <div className="flex items-center gap-2">
                <StarRow rating={ratingValue} />
                {reviewCount != null ? (
                  <span className="text-xs font-semibold text-[#6F6254]">{L.reviewsSuffix(reviewCount)}</span>
                ) : null}
              </div>
            ) : null}

            <h2 className={TITLE}>{profile.identity.businessName}</h2>

            {identityChips.length ? (
              <>
                <div
                  className={`${CHIP_ROW} md:hidden`}
                  aria-label={lang === "en" ? "Category and services" : "Categoría y servicios"}
                >
                  {identityChips.slice(0, 3).map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex items-center rounded-full border border-[#E8D7B8] bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-[#2F2A23] shadow-sm"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <div
                  className={`${CHIP_ROW} hidden md:flex`}
                  aria-label={lang === "en" ? "Category and services" : "Categoría y servicios"}
                >
                  {identityChips.slice(0, 6).map((chip) => (
                    <span key={chip} className={CHIP}>
                      {chip}
                    </span>
                  ))}
                </div>
              </>
            ) : null}

            <div className={`${META_ROW} hidden md:flex`}>
              <span
                className={[
                  META_PILL,
                  profile.contact?.hours?.openNowLabel?.toLowerCase().includes('cerrado') ? STATUS_CLOSED : STATUS_OPEN,
                ].join(" ")}
              >
                <span className="h-2 w-2 rounded-full bg-current opacity-70" aria-hidden />
                <span className="min-w-0 truncate">
                  {profile.contact?.hours?.todayHoursLine?.trim() || (lang === "en" ? "Hours" : "Horario")}
                </span>
              </span>

              {locationLine ? <span className={META_PILL}>{locationLine}</span> : null}
              {quick.serviceArea && quick.serviceArea !== locationLine ? (
                <span className={META_PILL}>{quick.serviceArea}</span>
              ) : null}
            </div>

            {addressQuery && mapsHref ? (
              <>
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full min-w-0 items-center gap-1.5 py-0.5 text-[12px] font-semibold leading-snug text-[#3B2117] md:hidden"
                  aria-label={lang === "en" ? "Open address in maps" : "Abrir dirección en mapas"}
                >
                  <FiMapPin className="h-3.5 w-3.5 shrink-0 text-[#6F7A3A]" aria-hidden />
                  <span className="min-w-0 truncate">{addressQuery}</span>
                </a>
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${ADDRESS_LINK} hidden md:inline-flex`}
                  aria-label={lang === "en" ? "Open address in maps" : "Abrir dirección en mapas"}
                >
                  <FiMapPin className="h-4 w-4 shrink-0 text-[#6F7A3A]" aria-hidden />
                  <span className="min-w-0 truncate">{addressQuery}</span>
                  <span className="ml-auto text-xs font-bold text-[#6F6254] group-hover:text-[#D4AF37]">›</span>
                </a>
              </>
            ) : null}

            {summary ? (
              <>
                <p className={`${SUMMARY} line-clamp-2 md:hidden`}>{summary}</p>
                <p className={`${SUMMARY} hidden md:block`}>
                  {summary.length > 180 ? `${summary.slice(0, 180).trim()}…` : summary}
                </p>
              </>
            ) : null}

            {features.length ? (
              <>
                <div className="relative md:hidden" aria-label={lang === "en" ? "Services" : "Servicios"}>
                  <div className="-mx-1 flex gap-1.5 overflow-x-auto overflow-y-hidden px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
                    {features.map((f) => (
                      <span
                        key={f}
                        className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-[#E8D7B8] bg-[#FCF9F2] px-2 py-0.5 text-[10px] font-semibold text-[#2F2A23]"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  <div
                    className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-9 bg-gradient-to-l from-[#FCF9F2] to-transparent"
                    aria-hidden
                  />
                </div>
                <div
                  className={`${FEATURE_ROW} hidden md:flex`}
                  aria-label={lang === "en" ? "Services" : "Servicios"}
                >
                  {features.slice(0, 5).map((f) => (
                    <span key={f} className={FEATURE_CHIP}>
                      {f}
                    </span>
                  ))}
                  {features.length > 5 ? (
                    <span className={FEATURE_CHIP}>+{features.length - 5}</span>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-col gap-1.5 md:gap-2">
            <Link
              href={vitrinaHref}
              className="flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#6F7A3A] to-[#5a6a2f] text-xs font-bold text-[#FFFCF7] shadow-[0_8px_22px_-10px_rgba(111,122,58,0.45)] transition hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 md:min-h-[48px] md:text-sm"
            >
              {vitrinaLabel}
            </Link>
            {discoveryRefineHref?.trim() && discoveryRefineLabel?.trim() ? (
              <Link
                href={discoveryRefineHref}
                className="text-center text-[10px] font-semibold text-[#6F6254] underline-offset-4 hover:underline md:text-xs"
              >
                {discoveryRefineLabel}
              </Link>
            ) : null}
          </div>

          {contactActions.length ? (
            <div className={`${CTA_ROW}`} aria-label={lang === "en" ? "Contact actions" : "Acciones de contacto"}>
              {contactActions.map(({ key, href, label }) => {
                const Icon =
                  key === "call"
                    ? FiPhone
                    : key === "website"
                      ? FiGlobe
                      : key === "whatsapp"
                        ? FaWhatsapp
                        : key === "email"
                          ? FiMessageCircle
                          : FiMapPin;
                const external = href.startsWith("http");
                return (
                  <a
                    key={key}
                    href={href}
                    className={[CTA_BTN_BASE, CTA_SECONDARY, "min-h-[44px] flex-1 min-w-[8.5rem] sm:min-w-[9.5rem] sm:flex-none"].join(" ")}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    <Icon className="h-[1.05rem] w-[1.05rem] shrink-0" aria-hidden />
                    <span className="min-w-0 truncate">{label}</span>
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {showEngagementMetrics && effectiveListingId ? (
        <div className={ENGAGEMENT_SECTION}>
          <div className="flex flex-wrap items-center gap-3">
            <LeonixLikeButton
              listingId={effectiveListingId}
              ownerUserId={effectiveOwnerUserId}
              variant="small"
              lang={lang}
              category="servicios"
              persistEngagement={persistListingEngagement}
            />
            <LeonixSaveButton
              key={onResultsSavedToggle ? `lx-sv-${effectiveListingId}-${String(resultsSaved)}` : `lx-sv-${effectiveListingId}`}
              listingId={effectiveListingId}
              ownerUserId={effectiveOwnerUserId}
              variant="small"
              lang={lang}
              category="servicios"
              persistEngagement={persistListingEngagement}
              {...(onResultsSavedToggle
                ? { isSaved: Boolean(resultsSaved), onToggle: () => onResultsSavedToggle() }
                : {})}
            />
            <LeonixShareButton
              listingId={effectiveListingId}
              ownerUserId={effectiveOwnerUserId}
              listingTitle={profile.identity.businessName}
              listingUrl={shareUrl || undefined}
              variant="small"
              lang={lang}
              category="servicios"
              preferNativeShareOnNarrowViewports
              persistEngagement={persistListingEngagement}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
