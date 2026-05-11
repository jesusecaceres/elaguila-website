"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { FiGlobe, FiMapPin, FiPhone, FiMail } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import type { ServiciosPublicListingRow } from "../lib/serviciosPublicListingsServer";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import { getServiciosProfileLabels } from "@/app/servicios/copy/serviciosProfileCopy";
import { serviciosImageUnoptimized } from "@/app/servicios/lib/serviciosMediaUrl";
import { isServiciosListingPromoted } from "../lib/serviciosResultsFilter";
import type { ServiciosProfileResolved } from "@/app/(site)/servicios/types/serviciosBusinessProfile";

/** Marketplace result row — low profile, warm Phase 9D palette (not tall preview canvas). */
const CARD =
  "overflow-hidden rounded-2xl border border-[#E4D4BC] bg-[#FFFDF9] shadow-sm transition-shadow duration-200 hover:shadow-md";

/** Desktop: ~Restaurants preview balance — left ~42%, right ~58%, natural column heights. */
const GRID =
  "grid min-w-0 grid-cols-1 md:grid-cols-[minmax(0,42%)_minmax(0,58%)] md:items-start md:gap-0";

/** Match Restaurants horizontal card media padding (RestaurantePreviewCard MEDIA). */
const MEDIA_CELL = "min-w-0 bg-[#F6F0E8] p-2.5 md:p-4 md:pr-3";
/**
 * Landscape stage sized like Restaurants preview (16:9 mobile, 16:10 desktop) — width drives height.
 * Full-bleed image with object-cover like Restaurants.
 */
const MEDIA_FRAME =
  "relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-[#E4D4BC]/80 bg-[#EFE7DA] md:aspect-[16/10] md:rounded-l-xl md:rounded-r-none";


const CONTENT =
  "flex min-w-0 flex-col gap-2.5 px-3 pb-3 pt-2.5 md:gap-3 md:px-5 md:pb-4 md:pt-4 md:pr-4";

const TITLE = "text-lg font-bold leading-snug tracking-tight text-[#2A2620] md:text-xl";
/** Business type / category — scan-friendly, slightly bolder than body. */
const CATEGORY =
  "text-[13px] font-extrabold uppercase leading-snug tracking-[0.06em] text-[#3d352c] md:text-[14px]";
const BODY = "text-[13px] leading-relaxed text-[#6F6254]";

/** Service chips — warm sand surface, espresso text (premium, readable). */
const CHIP =
  "inline-flex h-8 max-w-full shrink-0 items-center rounded-full border border-[#D4C4A8]/90 bg-[#EBDCC4] px-3 text-[13px] font-semibold leading-none text-[#1E1814]";

const META_PILL =
  "inline-flex h-9 max-w-full items-center gap-1.5 rounded-full border border-[#E0D0B8] bg-[#F9F4EC] px-3 text-[14px] font-bold leading-none text-[#4a4036]";

const STATUS_OPEN = "border-[#6F7A3A]/50 bg-[#6F7A3A]/12 text-[#4d5630]";
const STATUS_CLOSED = "border-[#B86A32]/45 bg-[#B86A32]/12 text-[#6b3f18]";

const ADDRESS_LINK =
  "group inline-flex min-h-[44px] w-full items-center gap-2 rounded-xl border border-[#E0D0B8] bg-[#F9F4EC] px-3 py-2.5 text-[14px] font-semibold text-[#2A2620] transition hover:border-[#C9A84A] hover:bg-[#FFF9EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/40";

const LOCATION_LINE =
  "flex min-h-[40px] items-start gap-2 rounded-xl border border-[#E8D9C4] bg-[#FFFCF7] px-3 py-2 text-[14px] font-semibold leading-snug text-[#2A2620]";


const CTA_ROW = "mt-auto flex flex-wrap gap-2 pt-0.5";
const CTA_PRIMARY =
  "inline-flex min-h-[40px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#6F7A3A] to-[#5a6a2f] px-4 text-[13px] font-bold text-[#FFFCF7] shadow-sm transition hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/50";
const CTA_SECONDARY =
  "inline-flex min-h-[40px] flex-1 min-w-[9rem] items-center justify-center gap-2 rounded-xl border border-[#E0D0B8] bg-white px-3 text-[13px] font-bold text-[#2A2620] shadow-sm transition hover:border-[#C9A84A] hover:bg-[#FFFCF7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/40 sm:flex-none";

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

/** Exclude filler / trust-style labels from “Nuestros servicios” chip row. */
function isWeakServiceChipLabel(label: string): boolean {
  const low = label.trim().toLowerCase();
  if (!low) return true;
  const weak = new Set([
    "innovación constante",
    "innovacion constante",
    "etiqueta breve",
    "constant innovation",
    "brief tag",
    "brief label",
  ]);
  return weak.has(low);
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

  if (!profile) {
    return null;
  }

  const listingSlug = (row?.slug || "").trim() || profile.identity.slug;
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
  const mediaIsLogoOnly = Boolean(logoUrl && !hasBackdrop);

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
      const c = cleanOtherLabel(s.title);
      if (!c || isWeakServiceChipLabel(c)) continue;
      const dedupeKey = c.toLowerCase();
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      out.push(c);
    }
    return out;
  }, [profile.services]);

  const serviceChipsVisible = serviceChipList.slice(0, 5);
  const serviceChipsMore = serviceChipList.length > 5 ? serviceChipList.length - 5 : 0;

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
    const wa = (profile.contact.socialLinks?.whatsapp || "").trim();
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

  const vitrinaHref =
    (publicDetailHref || "").trim() || `/clasificados/servicios/${encodeURIComponent(listingSlug)}?lang=${lang}`;
  const vitrinaLabel = (publicDetailLabel || "").trim() || (lang === "en" ? "View showcase" : "Ver vitrina");

  const promoted = row ? isServiciosListingPromoted(row) : false;
  const verifiedListing = row ? row.leonix_verified === true : profile.hero.badges.some((b) => b.kind === "verified");

  const ratingValue =
    typeof profile.hero.rating === "number" && Number.isFinite(profile.hero.rating) ? profile.hero.rating : undefined;
  const reviewCount =
    typeof profile.hero.reviewCount === "number" && profile.hero.reviewCount > 0 ? profile.hero.reviewCount : undefined;

  const hoursLine = profile.contact?.hours?.todayHoursLine?.trim() || "";
  const openLbl = profile.contact?.hours?.openNowLabel?.trim() || "";
  const hoursClosed =
    openLbl.toLowerCase().includes("cerrado") || openLbl.toLowerCase().includes("closed");
  const hoursPillText =
    openLbl && hoursLine ? `${openLbl} · ${hoursLine}` : openLbl || hoursLine || (lang === "en" ? "Hours" : "Horario");

  const showLocationServiceRow = Boolean(locationLine) && !addressQuery;

  return (
    <article className={`${CARD} w-full min-w-0 ${className}`.trim()}>
      <div className={GRID}>
        <div className={MEDIA_CELL}>
          <div className={MEDIA_FRAME}>
            {/* Logo-led hero canvas - large dominant logo with premium neutral background */}
            {logoUrl ? (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#FFFDF9] via-[#FFF9F0] to-[#FFFAF3]">
                <div className="flex flex-col items-center gap-4 text-center px-6">
                  {/* Large dominant logo as hero element */}
                  <div className="relative h-48 w-48 md:h-60 md:w-60">
                    <Image
                      src={logoUrl}
                      alt={logoAlt}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 192px, 240px"
                      unoptimized={serviciosImageUnoptimized(logoUrl)}
                    />
                  </div>
                  {/* Slogan inside media canvas under logo */}
                  {slogan ? (
                    <p className="max-w-full text-center text-sm font-medium leading-snug text-[#6F6254] md:text-base">
                      {slogan}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              /* No logo fallback with premium background */
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FFFDF9] via-[#FFF9F0] to-[#FFFAF3]">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/5">
                    <FiMapPin className="h-8 w-8 text-[#8B7E70]" aria-hidden />
                  </div>
                  <p className="text-sm font-semibold text-[#8B7E70]">{lang === "en" ? "No logo yet" : "Sin logo"}</p>
                </div>
              </div>
            )}
            
            {/* Status badges */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[4] flex flex-wrap gap-1 p-2">
              {promoted ? (
                <span className="rounded-full border border-white/70 bg-gradient-to-r from-[#D4AF37] to-[#9A7329] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                  {L.featured}
                </span>
              ) : null}
              {verifiedListing ? (
                <span className="rounded-full border border-white/80 bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2A7F3E] shadow-sm">
                  {lang === "en" ? "Verified" : "Verificado"}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className={CONTENT}>
          <div className="min-w-0 space-y-1">
            {ratingValue != null && ratingValue > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <StarRow rating={ratingValue} lang={lang} />
                {reviewCount != null ? <span className={`${BODY} font-semibold`}>{L.reviewsSuffix(reviewCount)}</span> : null}
              </div>
            ) : null}
            <h2 className={TITLE}>{profile.identity.businessName}</h2>
            {categoryChip ? <p className={`${CATEGORY} line-clamp-2`}>{categoryChip}</p> : null}
            {slogan ? <p className={`${BODY} line-clamp-2 text-[14px] font-semibold text-[#4a4036]`}>{slogan}</p> : null}
          </div>

          {serviceChipsVisible.length > 0 || serviceChipsMore > 0 ? (
            <div className="flex min-w-0 flex-wrap gap-1.5">
              {serviceChipsVisible.map((f) => (
                <span key={f} className={CHIP}>
                  {f}
                </span>
              ))}
              {serviceChipsMore > 0 ? <span className={CHIP}>+{serviceChipsMore}</span> : null}
            </div>
          ) : null}

          {showLocationServiceRow ? (
            <div className={LOCATION_LINE}>
              <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#6F7A3A]" aria-hidden />
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
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className={ADDRESS_LINK}
              aria-label={lang === "en" ? "Open address in maps" : "Abrir dirección en mapas"}
            >
              <FiMapPin className="h-4 w-4 shrink-0 text-[#6F7A3A]" aria-hidden />
              <span className="min-w-0 flex-1 leading-snug">{addressQuery}</span>
              <span className="ml-auto text-[12px] font-bold text-[#8A7E6E] group-hover:text-[#9A7329]">›</span>
            </a>
          ) : null}

          {summary ? <p className={`${BODY} line-clamp-2`}>{summary}</p> : null}

          <div className="flex min-w-0 flex-col gap-2">
            <Link href={vitrinaHref} className={CTA_PRIMARY}>
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

          {contactActions.length ? (
            <div className={CTA_ROW} aria-label={lang === "en" ? "Contact" : "Contacto"}>
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
                const external = href.startsWith("http");
                return (
                  <a
                    key={key}
                    href={href}
                    className={CTA_SECONDARY}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="min-w-0 truncate">{label}</span>
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
