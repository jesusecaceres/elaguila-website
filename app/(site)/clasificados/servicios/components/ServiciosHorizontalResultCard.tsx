"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { FiGlobe, FiMapPin, FiPhone, FiMail } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import type { ServiciosPublicListingRow } from "../lib/serviciosPublicListingsServer";
import { serviciosEngagementListingKey } from "../lib/serviciosPublicListingSort";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import { getServiciosProfileLabels } from "@/app/servicios/copy/serviciosProfileCopy";
import { serviciosImageUnoptimized } from "@/app/servicios/lib/serviciosMediaUrl";
import { getServiciosPublicMonetizationBadges } from "../lib/serviciosDestacados";
import type { ServiciosProfileResolved } from "@/app/(site)/servicios/types/serviciosBusinessProfile";
import { CtaActionSheet } from "@/app/components/cta/CtaActionSheet";
import type { CtaSheetIntent } from "@/app/components/cta/types";
import {
  buildServiciosSendEmailIntentFromMailto,
  extractWaMeDigitsFromHref,
  serviciosContactShareExtras,
  trackServiciosListingCta,
} from "@/app/(site)/servicios/lib/serviciosCtaIntents";
import {
  isServiciosProfessionalTemplate,
  readServiciosProfileBusinessTypeId,
  resolveServiciosListingTemplate,
} from "../lib/serviciosTemplateRouting";
import { resolveServiciosProfileDirectWhatsAppHref } from "@/app/(site)/servicios/lib/serviciosWhatsAppHref";
import { ServiciosProfessionalResultCard } from "../ServiciosProfessionalResultCard";
import {
  LX,
  LX_CHIP,
  LX_COMPACT_CARD_TITLE,
  LX_CTA_CARD_PRIMARY,
  LX_CTA_CARD_SECONDARY,
  LX_CTA_CARD_WHATSAPP,
  cleanProfessionalChipLabel,
  isWeakProfessionalChipLabel,
} from "@/app/(site)/servicios/components/serviciosLeonixBrand";

/** Marketplace result row — low profile, warm Phase 9D palette (not tall preview canvas). */
const CARD =
  "overflow-hidden rounded-2xl border border-[#E4D4BC] bg-[#FFFDF9] shadow-sm transition duration-200 hover:border-[#D4C4A8] hover:shadow-md";

/** Desktop: ~Restaurants preview balance — left ~42%, right ~58%, natural column heights. */
const GRID =
  "grid min-w-0 grid-cols-1 md:grid-cols-[minmax(0,42%)_minmax(0,58%)] md:items-start md:gap-0";

/** Match Restaurants horizontal card media padding (RestaurantePreviewCard MEDIA). */
const MEDIA_CELL = "min-w-0 bg-[#F6F0E8] p-2 md:p-4 md:pr-3";
/**
 * Slightly shorter ratio on mobile so the card does not dominate the viewport; desktop stays roomy.
 */
const MEDIA_FRAME =
  "relative aspect-[21/8] w-full max-h-[155px] overflow-hidden rounded-xl border border-[#E4D4BC]/80 bg-[#EFE7DA] sm:aspect-[16/9] sm:max-h-none md:aspect-[16/10] md:min-h-[200px] md:rounded-l-xl md:rounded-r-none";

const CONTENT =
  "flex min-w-0 flex-col gap-1.5 px-3 pb-3 pt-2 md:gap-3 md:px-5 md:pb-4 md:pt-4 md:pr-4";

/** Business type / category — scan-friendly, slightly bolder than body. */
const CATEGORY =
  "text-[13px] font-extrabold uppercase leading-snug tracking-[0.06em] text-[#3d352c] md:text-[14px]";
const BODY = "text-[13px] leading-snug text-[#6F6254]";

const META_PILL =
  "inline-flex min-h-[30px] max-w-full items-center gap-1.5 rounded-full border border-[#E0D0B8] bg-[#F9F4EC] px-2.5 text-[12px] font-bold leading-none text-[#4a4036] md:h-9 md:px-3 md:text-[14px]";

const STATUS_OPEN = "border-[#6F7A3A]/50 bg-[#6F7A3A]/12 text-[#4d5630]";
const STATUS_CLOSED = "border-[#B86A32]/45 bg-[#B86A32]/12 text-[#6b3f18]";

const ADDRESS_LINK =
  "group inline-flex min-h-[38px] w-full items-center gap-2 rounded-lg border border-[#E8D9C4] bg-[#FFFCF7] px-2.5 py-1.5 text-left text-[13px] font-semibold text-[#2A2620] transition hover:border-[#C9A84A] hover:bg-[#FFF9EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/40 md:min-h-[44px] md:rounded-xl md:px-3 md:py-2.5 md:text-[14px]";

const LOCATION_LINE =
  "flex min-h-[36px] items-start gap-2 rounded-lg border border-[#E8D9C4] bg-[#FFFCF7] px-2.5 py-1.5 text-[13px] font-semibold leading-snug text-[#2A2620] md:min-h-[40px] md:rounded-xl md:px-3 md:py-2 md:text-[14px]";


const CTA_ROW = "mt-auto flex flex-wrap gap-1.5 pt-0.5 md:gap-2";

function contactCtaClass(key: string): string {
  if (key === "whatsapp") return LX_CTA_CARD_WHATSAPP;
  return LX_CTA_CARD_SECONDARY;
}

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

function StarRow({ rating, lang }: { rating: number; lang: "es" | "en" }) {
  const aria = lang === "en" ? `${rating.toFixed(1)} out of 5 stars` : `${rating.toFixed(1)} de 5 estrellas`;
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={aria}>
      {Array.from({ length: 5 }, (_, i) => {
        const v = rating - i;
        const pct = Math.round(Math.min(1, Math.max(0, v)) * 100);
        return (
          <span key={i} className="relative h-3.5 w-[0.95em] text-[13px] leading-none">
            <span className="absolute text-[#d4cfc4]" aria-hidden>
              ★
            </span>
            <span className="absolute overflow-hidden text-[#C9A84A]" style={{ width: `${pct}%` }} aria-hidden>
              ★
            </span>
          </span>
        );
      })}
    </div>
  );
}

export interface ServiciosHorizontalResultCardProps {
  /** Published discovery row — omit when `previewProfile` is set. */
  row?: ServiciosPublicListingRow;
  /** Draft / expert preview — same card shell as discovery (publish preview page). */
  previewProfile?: ServiciosProfileResolved;
  lang: "es" | "en";
  className?: string;
  publicDetailHref?: string;
  publicDetailLabel?: string;
  discoveryRefineHref?: string;
  discoveryRefineLabel?: string;
  /** Absolute vitrina URL for CTA sheet extras (optional). */
  listingShareUrl?: string;
}

/**
 * Servicios discovery result card — horizontal marketplace row (not vitrina canvas).
 * Engagement (like/save/share) belongs on the open profile only, not here.
 */
export function ServiciosHorizontalResultCard({
  row,
  previewProfile,
  lang,
  className = "",
  publicDetailHref,
  publicDetailLabel,
  discoveryRefineHref,
  discoveryRefineLabel,
  listingShareUrl,
}: ServiciosHorizontalResultCardProps) {
  const L = getServiciosProfileLabels(lang);

  const profile = useMemo((): ServiciosProfileResolved | null => {
    if (previewProfile) return previewProfile;
    if (!row) return null;
    const wire = { ...row.profile_json };
    wire.identity = { ...wire.identity, leonixVerified: row.leonix_verified === true };
    if ((row.review_rating_count ?? 0) > 0 && typeof row.review_rating_avg === "number" && Number.isFinite(row.review_rating_avg)) {
      wire.hero = {
        ...wire.hero,
        rating: row.review_rating_avg,
        reviewCount: row.review_rating_count ?? undefined,
      };
    }
    return resolveServiciosProfile(wire, lang);
  }, [previewProfile, row, lang]);

  const listingSlug = useMemo(() => {
    if (!profile) return (row?.slug || "").trim();
    return (row?.slug || "").trim() || profile.identity.slug;
  }, [row, profile]);

  /** Same key order as Like/Save (`leonix_ad_id` → row `id` → `slug`) so CTA analytics lines up with engagement rows. */
  const ctaAnalyticsListingKey = useMemo(() => {
    if (row) return serviciosEngagementListingKey(row);
    return listingSlug;
  }, [row, listingSlug]);

  const [ctaOpen, setCtaOpen] = useState(false);
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);

  const closeCta = useCallback(() => {
    setCtaOpen(false);
    setCtaIntent(null);
  }, []);

  const openOutbound = useCallback(
    (intent: CtaSheetIntent, eventType: string) => {
      trackServiciosListingCta(ctaAnalyticsListingKey, eventType, { source: "servicios_horizontal_card" });
      setCtaIntent(intent);
      setCtaOpen(true);
    },
    [ctaAnalyticsListingKey],
  );

  const contactExtras = useMemo(() => {
    if (!profile) return { email: undefined, websiteUrl: undefined, publicUrl: undefined };
    return serviciosContactShareExtras(profile, listingSlug, listingShareUrl);
  }, [profile, listingSlug, listingShareUrl]);

  const openContactKey = useCallback(
    (key: string, href: string) => {
      if (!profile) return;
      if (key === "maps") {
        openOutbound(
          { kind: "directions", addressOrUrl: href, isMapsUrl: /^https?:\/\//i.test(href), contactShareExtras: contactExtras },
          "cta_maps_click",
        );
        return;
      }
      if (key === "website") {
        openOutbound({ kind: "website", url: href }, "cta_website_click");
        return;
      }
      if (key === "whatsapp") {
        const d = extractWaMeDigitsFromHref(href);
        if (d.replace(/\D/g, "").length < 8) return;
        let message = "";
        try {
          const abs = /^https?:\/\//i.test(href) ? href : `https://${href.replace(/^\/\//, "")}`;
          const u = new URL(abs);
          const rawText = u.searchParams.get("text");
          if (rawText) {
            try {
              message = decodeURIComponent(rawText.replace(/\+/g, "%20"));
            } catch {
              message = rawText.replace(/\+/g, " ");
            }
          }
        } catch {
          message = "";
        }
        openOutbound(
          { kind: "send_message", message, phone: d, whatsappDigits: d, contactShareExtras: contactExtras },
          "cta_whatsapp_click",
        );
        return;
      }
      if (key === "email") {
        const intent = buildServiciosSendEmailIntentFromMailto(href, lang, listingSlug, listingShareUrl);
        if (!intent) return;
        openOutbound(intent, "cta_email_click");
        return;
      }
      if (key === "call" || key === "callOffice") {
        const raw = href.replace(/^tel:/i, "").trim();
        openOutbound({ kind: "call", phone: raw, contactShareExtras: contactExtras }, "cta_call_click");
      }
    },
    [contactExtras, lang, listingShareUrl, listingSlug, openOutbound, profile],
  );

  if (!profile) {
    return null;
  }

  if (row && !previewProfile) {
    const template = resolveServiciosListingTemplate({
      businessTypeId: readServiciosProfileBusinessTypeId(row.profile_json),
      internalGroup: row.internal_group,
      categoryLabel: profile.hero.categoryLine,
    });
    if (isServiciosProfessionalTemplate(template)) {
      return <ServiciosProfessionalResultCard row={row} lang={lang} embedded />;
    }
  }

  const cityFallback = (row?.city || "").trim();
  const logoUrl = (profile.hero.logoUrl || "").trim();
  const logoAlt = (profile.hero.logoAlt || "").trim() || profile.identity.businessName;

  const coverUrl = (profile.hero.coverImageUrl || "").trim();
  const galleryFirstUrl = (profile.gallery[0]?.url || "").trim();
  const backdropUrl =
    coverUrl ||
    (galleryFirstUrl && galleryFirstUrl !== logoUrl ? galleryFirstUrl : "") ||
    "";
  const backdropAlt =
    (profile.hero.coverImageAlt || "").trim() ||
    (profile.gallery[0]?.alt || "").trim() ||
    logoAlt ||
    profile.identity.businessName;

  const hasBackdrop = Boolean(backdropUrl);

  const categoryChip = useMemo(() => {
    const raw = (profile.hero.categoryLine || "").trim();
    return cleanOtherLabel(raw);
  }, [profile.hero.categoryLine]);

  const slogan = (profile.about?.specialtiesLine || "").trim();

  const locationLine = useMemo(() => {
    const fromHero = (profile.hero.locationSummary || "").trim();
    if (fromHero) return fromHero;
    return cityFallback;
  }, [profile.hero.locationSummary, cityFallback]);

  const serviceChipList = useMemo(() => {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const s of profile.services) {
      const c = cleanProfessionalChipLabel(cleanOtherLabel(s.title));
      if (!c || isWeakProfessionalChipLabel(c)) continue;
      const dedupeKey = c.toLowerCase();
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      out.push(c);
    }
    return out;
  }, [profile.services]);

  const serviceChipsVisible = serviceChipList.slice(0, 5);
  const serviceChipsMore = serviceChipList.length > 5 ? serviceChipList.length - 5 : 0;
  const serviceChipsMobileHidden = serviceChipList.length > 3 ? serviceChipList.length - 3 : 0;

  const addressQuery = (profile.contact?.physicalAddressDisplay || "").trim();
  const mapsHref = ((profile.contact?.mapsSearchHref || "").trim() || (addressQuery ? mapsSearchHref(addressQuery) : "")).trim();

  const summary = (profile.about?.text || "").trim();

  type ContactAction = { key: string; href: string; label: string };

  const contactActions = useMemo((): ContactAction[] => {
    const out: ContactAction[] = [];
    const officeTel = (profile.contact.phoneOfficeTelHref || "").trim();
    const officeDisplay = (profile.contact.phoneOfficeDisplay || "").trim();
    const tel = (profile.contact.phoneTelHref || "").trim();
    const phoneDisplay = (profile.contact.phoneDisplay || "").trim();
    if (officeTel && officeDisplay) {
      out.push({ key: "callOffice", href: officeTel, label: L.callOffice });
    }
    if (tel && phoneDisplay && tel !== officeTel) {
      out.push({ key: "call", href: tel, label: L.call });
    }
    const wa = resolveServiciosProfileDirectWhatsAppHref(profile.contact) ?? "";
    if (wa) {
      out.push({ key: "whatsapp", href: wa, label: L.whatsapp });
    }
    const mail = (profile.contact.emailMailtoHref || "").trim();
    if (mail) {
      out.push({ key: "email", href: mail, label: L.email });
    }
    const web = (profile.contact.websiteHref || "").trim();
    if (web) {
      out.push({ key: "website", href: web, label: L.visitWebsite });
    }
    if (mapsHref && !addressQuery) {
      out.push({ key: "maps", href: mapsHref, label: L.openInMaps });
    }
    return out;
  }, [L, profile.contact, mapsHref, addressQuery]);

  /** Móvil: máximo 4 CTAs fuertes en riel horizontal (sin apilar correo salvo único contacto). */
  const mobileContactRail = useMemo((): ContactAction[] => {
    const rail: ContactAction[] = [];
    const officeTel = (profile.contact.phoneOfficeTelHref || "").trim();
    const officeDisplay = (profile.contact.phoneOfficeDisplay || "").trim();
    const tel = (profile.contact.phoneTelHref || "").trim();
    const phoneDisplay = (profile.contact.phoneDisplay || "").trim();
    if (officeTel && officeDisplay) {
      rail.push({ key: "callOffice", href: officeTel, label: L.callOffice });
    } else if (tel && phoneDisplay) {
      rail.push({ key: "call", href: tel, label: L.call });
    }
    if (addressQuery && mapsHref) {
      rail.push({
        key: "maps",
        href: mapsHref,
        label: lang === "en" ? "Directions" : "Cómo llegar",
      });
    }
    const web = (profile.contact.websiteHref || "").trim();
    if (web) rail.push({ key: "website", href: web, label: L.visitWebsite });
    const wa = resolveServiciosProfileDirectWhatsAppHref(profile.contact) ?? "";
    if (wa) rail.push({ key: "whatsapp", href: wa, label: L.whatsapp });
    const mail = (profile.contact.emailMailtoHref || "").trim();
    if (rail.length === 0 && mail) {
      rail.push({ key: "email", href: mail, label: L.email });
    }
    return rail.slice(0, 4);
  }, [L, profile.contact, mapsHref, addressQuery, lang]);

  const vitrinaHref =
    (publicDetailHref || "").trim() || `/clasificados/servicios/${encodeURIComponent(listingSlug)}?lang=${lang}`;
  const vitrinaLabel = (publicDetailLabel || "").trim() || (lang === "en" ? "View showcase" : "Ver vitrina");

  const monetizationBadges = row ? getServiciosPublicMonetizationBadges(row, lang).slice(0, 3) : [];

  const ratingValue =
    typeof profile.hero.rating === "number" && Number.isFinite(profile.hero.rating) ? profile.hero.rating : undefined;
  const reviewCount =
    typeof profile.hero.reviewCount === "number" && profile.hero.reviewCount > 0 ? profile.hero.reviewCount : undefined;

  const likeBadgeCount =
    row && typeof row.public_like_net_count === "number" && row.public_like_net_count > 0
      ? Math.floor(row.public_like_net_count)
      : 0;
  const likeCueHasCount = likeBadgeCount > 0;
  const showLikeZeroCue = !likeCueHasCount;
  const showSocialProofRow = Boolean((ratingValue != null && ratingValue > 0) || likeCueHasCount || showLikeZeroCue);

  const hoursLine = profile.contact?.hours?.todayHoursLine?.trim() || "";
  const openLbl = profile.contact?.hours?.openNowLabel?.trim() || "";
  const hoursClosed =
    openLbl.toLowerCase().includes("cerrado") || openLbl.toLowerCase().includes("closed");
  const hoursPillText =
    openLbl && hoursLine ? `${openLbl} · ${hoursLine}` : openLbl || hoursLine || (lang === "en" ? "Hours" : "Horario");

  const showLocationServiceRow = Boolean(locationLine) && !addressQuery;

  return (
    <>
      <article className={`${CARD} w-full min-w-0 ${className}`.trim()}>
      <div className={GRID}>
        <div className={MEDIA_CELL}>
          <div className={MEDIA_FRAME}>
            {hasBackdrop ? (
              <>
                <Image
                  src={backdropUrl}
                  alt={backdropAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 92vw, 42vw"
                  unoptimized={serviciosImageUnoptimized(backdropUrl)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" aria-hidden />
                {logoUrl ? (
                  <div className="absolute bottom-2 left-2 z-[3] rounded-lg border border-white/80 bg-white/95 p-1 shadow-md md:bottom-3 md:left-3 md:p-1.5">
                    <div className="relative h-11 w-11 sm:h-14 sm:w-14 md:h-[4.5rem] md:w-[4.5rem]">
                      <Image
                        src={logoUrl}
                        alt={logoAlt}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 44px, 72px"
                        unoptimized={serviciosImageUnoptimized(logoUrl)}
                      />
                    </div>
                  </div>
                ) : null}
              </>
            ) : logoUrl ? (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#FFFDF9] via-[#FFF9F0] to-[#FFFAF3] py-3 md:py-8">
                <div className="relative h-24 w-24 sm:h-32 sm:w-32 md:h-60 md:w-60">
                  <Image
                    src={logoUrl}
                    alt={logoAlt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 96px, 240px"
                    unoptimized={serviciosImageUnoptimized(logoUrl)}
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FFFDF9] via-[#FFF9F0] to-[#FFFAF3]">
                <div className="flex flex-col items-center gap-2 text-center md:gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/5 md:h-16 md:w-16">
                    <FiMapPin className="h-6 w-6 text-[#8B7E70] md:h-8 md:w-8" aria-hidden />
                  </div>
                  <p className="text-xs font-semibold text-[#8B7E70] md:text-sm">
                    {lang === "en" ? "No logo yet" : "Sin logo"}
                  </p>
                </div>
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 top-0 z-[4] flex flex-wrap gap-1 p-1.5 md:p-2">
              {monetizationBadges.map((b) => (
                <span
                  key={b.key}
                  className={`rounded-full border border-white/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide shadow-sm md:px-2 md:text-[10px] ${
                    b.key === "destacado" || b.key === "patrocinado"
                      ? "bg-gradient-to-r from-[#D4AF37] to-[#9A7329] text-white"
                      : b.key === "leonix_advertiser"
                        ? "bg-[#1a3352]/90 text-white"
                        : b.key === "verificado_leonix"
                          ? "border-emerald-400/80 bg-emerald-50/95 text-emerald-950"
                          : "bg-white/95 text-[#5a4630]"
                  }`}
                >
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={CONTENT}>
          <div className="min-w-0 space-y-1 md:space-y-1.5">
            {showSocialProofRow ? (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {ratingValue != null && ratingValue > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StarRow rating={ratingValue} lang={lang} />
                    {reviewCount != null ? (
                      <span className={`${BODY} text-[12px] font-semibold md:text-[13px]`}>
                        {L.reviewsSuffix(reviewCount)}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {likeCueHasCount ? (
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full border border-rose-200/80 bg-rose-50/90 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-rose-900 md:text-[12px]"
                    data-servicios-like-badge="1"
                  >
                    <span aria-hidden>❤️</span>
                    <span>
                      {lang === "en"
                        ? `${likeBadgeCount} ${likeBadgeCount === 1 ? "like" : "likes"}`
                        : `${likeBadgeCount} me gusta`}
                    </span>
                  </span>
                ) : showLikeZeroCue ? (
                  <span
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#8a7a72] md:text-[12px]"
                    data-servicios-like-badge="1"
                  >
                    {lang === "en" ? "♡ Like" : "♡ Me gusta"}
                  </span>
                ) : null}
              </div>
            ) : null}
            <h2 className={LX_COMPACT_CARD_TITLE}>{profile.identity.businessName}</h2>
            {categoryChip ? <p className={`${CATEGORY} line-clamp-2`}>{categoryChip}</p> : null}
            {slogan ? <p className={`${BODY} line-clamp-2 text-[13px] font-semibold text-[#4a4036] md:text-[14px]`}>{slogan}</p> : null}
          </div>

          {serviceChipsVisible.length > 0 || serviceChipsMore > 0 || serviceChipsMobileHidden > 0 ? (
            <div className="flex min-w-0 flex-wrap gap-1 md:gap-1.5">
              {serviceChipsVisible.map((f, idx) => (
                <span
                  key={f}
                  className={`${LX_CHIP} ${idx >= 3 && serviceChipList.length > 3 ? "hidden md:inline-flex" : ""}`.trim()}
                >
                  {f}
                </span>
              ))}
              {serviceChipsMobileHidden > 0 ? (
                <span className={`${LX_CHIP} md:hidden`}>+{serviceChipsMobileHidden}</span>
              ) : null}
              {serviceChipsMore > 0 ? <span className={`${LX_CHIP} hidden md:inline-flex`}>+{serviceChipsMore}</span> : null}
            </div>
          ) : null}

          {showLocationServiceRow ? (
            <div className={LOCATION_LINE}>
              <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
              <span className="min-w-0 flex-1 leading-snug">{locationLine}</span>
            </div>
          ) : null}

          {profile.contact?.hours && (openLbl || hoursLine) ? (
            <div className="flex flex-wrap gap-1.5">
              <span className={[META_PILL, hoursClosed ? STATUS_CLOSED : STATUS_OPEN].join(" ")}>
                <span className="h-2 w-2 shrink-0 rounded-full bg-current opacity-70" aria-hidden />
                <span className="min-w-0 truncate font-extrabold">{hoursPillText}</span>
              </span>
            </div>
          ) : null}

          {addressQuery && mapsHref ? (
            <button
              type="button"
              className={ADDRESS_LINK}
              aria-label={lang === "en" ? "Open address in maps" : "Abrir dirección en mapas"}
              onClick={() => openContactKey("maps", mapsHref)}
            >
              <FiMapPin className="h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
              <span className="min-w-0 flex-1 leading-snug">{addressQuery}</span>
              <span className="ml-auto text-[12px] font-bold text-[#8A7E6E] group-hover:text-[#9A7329]">›</span>
            </button>
          ) : null}

          {summary ? <p className={`${BODY} line-clamp-2`}>{summary}</p> : null}

          <div className="flex min-w-0 flex-col gap-1.5 md:gap-2">
            <Link
              href={vitrinaHref}
              className={LX_CTA_CARD_PRIMARY}
              style={{ backgroundColor: LX.burgundy, boxShadow: "0 6px 16px rgba(92, 22, 34, 0.22)" }}
            >
              {vitrinaLabel}
            </Link>
            {discoveryRefineHref?.trim() && discoveryRefineLabel?.trim() ? (
              <Link
                href={discoveryRefineHref}
                className={`${BODY} text-center font-semibold underline underline-offset-4 hover:text-[#2A2620]`}
              >
                {discoveryRefineLabel}
              </Link>
            ) : null}
          </div>

          {mobileContactRail.length > 0 ? (
            <div
              className="-mx-0.5 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:thin] md:hidden"
              aria-label={lang === "en" ? "Contact" : "Contacto"}
            >
              {mobileContactRail.map(({ key, href, label }) => {
                const Icon =
                  key === "call" || key === "callOffice"
                    ? FiPhone
                    : key === "website"
                      ? FiGlobe
                      : key === "whatsapp"
                        ? FaWhatsapp
                        : key === "email"
                          ? FiMail
                          : FiMapPin;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`${contactCtaClass(key)} !max-w-[min(34vw,9.5rem)] shrink-0 snap-start !flex-none md:!max-w-none`}
                    style={key === "whatsapp" ? { backgroundColor: LX.whatsApp, boxShadow: LX.whatsAppShadow } : undefined}
                    onClick={() => openContactKey(key, href)}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="min-w-0 truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {contactActions.length ? (
            <div className={`${CTA_ROW} hidden md:flex`} aria-label={lang === "en" ? "Contact" : "Contacto"}>
              {contactActions.map(({ key, href, label }) => {
                const Icon =
                  key === "call" || key === "callOffice"
                    ? FiPhone
                    : key === "website"
                      ? FiGlobe
                      : key === "whatsapp"
                        ? FaWhatsapp
                        : key === "email"
                          ? FiMail
                          : FiMapPin;
                return (
                  <button
                    key={key}
                    type="button"
                    className={contactCtaClass(key)}
                    style={key === "whatsapp" ? { backgroundColor: LX.whatsApp, boxShadow: LX.whatsAppShadow } : undefined}
                    onClick={() => openContactKey(key, href)}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="min-w-0 truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </article>
    <CtaActionSheet open={ctaOpen} onClose={closeCta} intent={ctaIntent} lang={lang} />
    </>
  );
}
