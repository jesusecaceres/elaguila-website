"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { FiGlobe, FiMapPin, FiPhone, FiMessageCircle } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import type { ServiciosPublicListingRow } from "../lib/serviciosPublicListingsServer";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import { getServiciosProfileLabels } from "@/app/servicios/copy/serviciosProfileCopy";
import { serviciosImageUnoptimized } from "@/app/servicios/lib/serviciosMediaUrl";
import { isServiciosListingPromoted } from "../lib/serviciosResultsFilter";

/** Marketplace result row — low profile, warm Phase 9D palette (not tall preview canvas). */
const CARD =
  "overflow-hidden rounded-2xl border border-[#E4D4BC] bg-[#FFFDF9] shadow-sm transition-shadow duration-200 hover:shadow-md";

/** Desktop: fixed-height media band so the row reads as a horizontal listing, not a tall card. */
const GRID =
  "grid min-w-0 grid-cols-1 md:grid-cols-[minmax(0,34%)_minmax(0,1fr)] md:items-stretch md:gap-0";

const MEDIA_CELL = "min-w-0 bg-[#F6F0E8] p-2.5 md:p-0 md:pl-2.5 md:pt-2.5 md:pb-2.5";
const MEDIA_FRAME =
  "relative h-[min(200px,48vw)] w-full min-h-[140px] overflow-hidden rounded-xl border border-[#E4D4BC]/80 bg-[#EDE4D8] md:h-[168px] md:min-h-[168px] md:rounded-l-xl md:rounded-r-none";

const CONTENT =
  "flex min-w-0 flex-col gap-2.5 px-3 pb-3 pt-2.5 md:gap-3 md:px-5 md:pb-4 md:pt-3.5 md:pr-4";

const TITLE = "text-lg font-bold leading-snug tracking-tight text-[#2A2620] md:text-xl";
const SUBTITLE = "text-[13px] font-semibold leading-snug text-[#5c5147]";
const BODY = "text-[13px] leading-relaxed text-[#6F6254]";

const CHIP =
  "inline-flex h-7 max-w-full items-center rounded-full border border-[#E0D0B8] bg-[#FFFCF7] px-2.5 text-[12px] font-semibold leading-none text-[#2A2620]";

const META_PILL =
  "inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border border-[#E0D0B8] bg-[#F9F4EC] px-2.5 text-[12px] font-semibold leading-none text-[#5c5147]";

const STATUS_OPEN = "border-[#6F7A3A]/50 bg-[#6F7A3A]/12 text-[#4d5630]";
const STATUS_CLOSED = "border-[#B86A32]/45 bg-[#B86A32]/12 text-[#6b3f18]";

const ADDRESS_LINK =
  "group inline-flex min-h-[40px] w-full items-center gap-2 rounded-xl border border-[#E0D0B8] bg-[#F9F4EC] px-3 py-2 text-[13px] font-semibold text-[#2A2620] transition hover:border-[#C9A84A] hover:bg-[#FFF9EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/40";

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
  row: ServiciosPublicListingRow;
  lang: "es" | "en";
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
  lang,
  publicDetailHref,
  publicDetailLabel,
  discoveryRefineHref,
  discoveryRefineLabel,
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

  const logoUrl = (profile.hero.logoUrl || "").trim();
  const logoAlt = (profile.hero.logoAlt || "").trim() || profile.identity.businessName;

  const mediaUrl =
    (profile.hero.coverImageUrl || "").trim() ||
    (profile.gallery[0]?.url || "").trim() ||
    logoUrl ||
    "";
  const mediaAlt =
    (profile.hero.coverImageAlt || "").trim() ||
    (profile.gallery[0]?.alt || "").trim() ||
    logoAlt ||
    profile.identity.businessName;

  const mediaIsLogoOnly = Boolean(logoUrl && mediaUrl === logoUrl);

  const categoryChip = useMemo(() => {
    const raw = (profile.hero.categoryLine || "").trim();
    return cleanOtherLabel(raw);
  }, [profile.hero.categoryLine]);

  const slogan = (profile.about?.specialtiesLine || "").trim();

  const trustChips = useMemo(() => {
    const out: string[] = [];
    const seen = new Set<string>();
    const cat = categoryChip.toLowerCase();
    for (const qf of profile.quickFacts ?? []) {
      const v = cleanOtherLabel(qf.label);
      if (!v || seen.has(v)) continue;
      if (cat && v.toLowerCase() === cat) continue;
      seen.add(v);
      out.push(v);
      if (out.length >= 2) break;
    }
    return out;
  }, [profile.quickFacts, categoryChip]);

  const quick = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const item of profile.quickFacts ?? []) {
      const v = cleanOtherLabel(item.label);
      if (v) byKey.set(item.kind, v);
    }
    return { serviceArea: byKey.get("service_area") || "" };
  }, [profile.quickFacts]);

  const locationLine = useMemo(() => {
    const fromHero = (profile.hero.locationSummary || "").trim();
    if (fromHero) return fromHero;
    return (row.city || "").trim();
  }, [profile.hero.locationSummary, row.city]);

  const serviceChips = useMemo(() => {
    const out: string[] = [];
    const seen = new Set<string>();
    if (quick.serviceArea) {
      for (const raw of quick.serviceArea.split(" · ")) {
        const c = cleanOtherLabel(raw);
        if (c && !seen.has(c)) {
          seen.add(c);
          out.push(c);
        }
      }
    }
    for (const s of profile.services) {
      const c = cleanOtherLabel(s.title);
      if (c && !seen.has(c)) {
        seen.add(c);
        out.push(c);
      }
      if (out.length >= 4) break;
    }
    return out;
  }, [quick.serviceArea, profile.services]);

  const addressQuery = (profile.contact?.physicalAddressDisplay || "").trim();
  const mapsHref = ((profile.contact?.mapsSearchHref || "").trim() || (addressQuery ? mapsSearchHref(addressQuery) : "")).trim();

  const summary = (profile.about?.text || "").trim();

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
  const vitrinaLabel = (publicDetailLabel || "").trim() || (lang === "en" ? "View showcase" : "Ver vitrina");

  const promoted = isServiciosListingPromoted(row);

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

  const showLogoOverlay = Boolean(logoUrl && mediaUrl && !mediaIsLogoOnly);

  return (
    <article className={`${CARD} w-full min-w-0`}>
      <div className={GRID}>
        <div className={MEDIA_CELL}>
          <div className={MEDIA_FRAME}>
            {mediaUrl ? (
              <Image
                src={mediaUrl}
                alt={mediaAlt}
                fill
                className={mediaIsLogoOnly ? "object-contain p-6" : "object-cover"}
                sizes="(max-width: 768px) 100vw, 34vw"
                priority={false}
                unoptimized={serviciosImageUnoptimized(mediaUrl)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <FiMapPin className="h-8 w-8 text-[#9A8F82]" aria-hidden />
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] flex flex-wrap gap-1 p-2">
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
            {showLogoOverlay ? (
              <div className="absolute bottom-2 left-2 z-[3] rounded-lg border border-white/80 bg-white/95 p-1 shadow-md">
                <Image
                  src={logoUrl}
                  alt={logoAlt}
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-md object-contain"
                  unoptimized={serviciosImageUnoptimized(logoUrl)}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className={CONTENT}>
          <div className="flex min-w-0 gap-3">
            {logoUrl && mediaIsLogoOnly ? (
              <div className="hidden shrink-0 rounded-lg border border-[#E4D4BC] bg-white p-1 md:block">
                <Image
                  src={logoUrl}
                  alt={logoAlt}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded object-contain"
                  unoptimized={serviciosImageUnoptimized(logoUrl)}
                />
              </div>
            ) : null}
            <div className="min-w-0 flex-1 space-y-1">
              {ratingValue != null && ratingValue > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <StarRow rating={ratingValue} lang={lang} />
                  {reviewCount != null ? <span className={`${BODY} font-semibold`}>{L.reviewsSuffix(reviewCount)}</span> : null}
                </div>
              ) : null}
              <h2 className={TITLE}>{profile.identity.businessName}</h2>
              {slogan ? <p className={`${SUBTITLE} line-clamp-2`}>{slogan}</p> : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {categoryChip ? <span className={CHIP}>{categoryChip}</span> : null}
              {locationLine ? <span className={CHIP}>{locationLine}</span> : null}
              {trustChips.map((t) => (
                <span key={t} className={CHIP}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {profile.contact?.hours && (openLbl || hoursLine) ? (
            <div className="flex flex-wrap gap-1.5">
              <span className={[META_PILL, hoursClosed ? STATUS_CLOSED : STATUS_OPEN].join(" ")}>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" aria-hidden />
                <span className="min-w-0 truncate">{hoursPillText}</span>
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
              <span className="min-w-0 truncate">{addressQuery}</span>
              <span className="ml-auto text-[12px] font-bold text-[#8A7E6E] group-hover:text-[#9A7329]">›</span>
            </a>
          ) : null}

          {summary ? <p className={`${BODY} line-clamp-3`}>{summary}</p> : null}

          {serviceChips.length ? (
            <div className="flex flex-col gap-1.5">
              <p className={`${SUBTITLE} text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A7E6E]`}>
                {lang === "en" ? "Services" : "Servicios"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {serviceChips.map((f) => (
                  <span key={f} className={CHIP}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

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
