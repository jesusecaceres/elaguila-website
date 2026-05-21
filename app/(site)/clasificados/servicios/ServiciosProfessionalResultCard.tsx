"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiMapPin, FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import { serviciosImageUnoptimized } from "@/app/servicios/lib/serviciosMediaUrl";
import type { ServiciosPublicListingRow } from "./lib/serviciosPublicListingsServer";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { isServiciosListingPromoted } from "./lib/serviciosResultsFilter";
import {
  readServiciosProfileBusinessTypeId,
  resolveServiciosListingTemplate,
  type ServiciosListingTemplate,
} from "./lib/serviciosTemplateRouting";
import { CtaActionSheet } from "@/app/components/cta/CtaActionSheet";
import type { CtaSheetIntent } from "@/app/components/cta/types";
import {
  extractWaMeDigitsFromHref,
  serviciosContactShareExtras,
  trackServiciosListingCta,
} from "@/app/(site)/servicios/lib/serviciosCtaIntents";
import { appendWhatsAppPrefill, serviciosUniversalQuoteMessage } from "@/app/(site)/servicios/lib/serviciosContactActions";

const CARD =
  "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#E4D4BC] bg-[#FFFDF9] shadow-sm transition hover:border-[#D4C4A8] hover:shadow-md sm:rounded-3xl";

const CHIP =
  "inline-flex max-w-full shrink-0 items-center rounded-full border border-[#D4C4A8]/90 bg-[#EBDCC4] px-2.5 py-1 text-[11px] font-semibold leading-tight text-[#1E1814] sm:text-xs";

const CTA_PRIMARY =
  "inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6F7A3A] to-[#5a6a2f] px-4 text-sm font-bold text-[#FFFCF7] shadow-sm transition hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/50";

const CTA_SECONDARY =
  "inline-flex min-h-[42px] flex-1 items-center justify-center rounded-xl border border-[#E0D0B8] bg-white px-4 text-sm font-bold text-[#2A2620] shadow-sm transition hover:border-[#C9A84A] hover:bg-[#FFFCF7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/40";

const CTA_TERTIARY =
  "inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-[#E0D0B8] bg-[#FFFCF7] px-3 text-xs font-bold text-[#2A2620] transition hover:border-[#C9A84A]";

function cleanChipLabel(raw: string): string {
  const t = String(raw ?? "").trim();
  if (!t) return "";
  const lower = t.toLowerCase();
  if (lower === "otro" || lower === "other") return "";
  if (lower.startsWith("otro:") || lower.startsWith("other:")) {
    return t.split(":").slice(1).join(":").trim();
  }
  return t;
}

function isWeakChipLabel(label: string): boolean {
  const low = label.trim().toLowerCase();
  if (!low) return true;
  const weak = new Set([
    "innovacion constante",
    "innovación constante",
    "constant innovation",
    "etiqueta breve",
    "brief tag",
  ]);
  return weak.has(low);
}

function getProfessionalCtas(template: ServiciosListingTemplate, lang: ServiciosLang) {
  if (template === "legal_provider") {
    return lang === "en"
      ? { primary: "Call for Consultation", secondary: "View Legal Profile" }
      : { primary: "Llamar para consulta", secondary: "Ver perfil legal" };
  }
  if (template === "clinic_provider") {
    return lang === "en"
      ? { primary: "Request Appointment", secondary: "View Profile" }
      : { primary: "Solicitar cita", secondary: "Ver perfil" };
  }
  if (template === "financial_provider") {
    return lang === "en"
      ? { primary: "Request Help", secondary: "View Profile" }
      : { primary: "Solicitar ayuda", secondary: "Ver perfil" };
  }
  if (template === "advisor_provider") {
    return lang === "en"
      ? { primary: "Schedule Consultation", secondary: "View Profile" }
      : { primary: "Agendar consulta", secondary: "Ver perfil" };
  }
  return lang === "en"
    ? { primary: "Contact", secondary: "View Profile" }
    : { primary: "Contactar", secondary: "Ver perfil" };
}

function StarRow({ rating, lang }: { rating: number; lang: ServiciosLang }) {
  const aria =
    lang === "en" ? `${rating.toFixed(1)} out of 5 stars` : `${rating.toFixed(1)} de 5 estrellas`;
  return (
    <div className="flex items-center gap-1" role="img" aria-label={aria}>
      {Array.from({ length: 5 }, (_, i) => {
        const v = rating - i;
        const pct = Math.round(Math.min(1, Math.max(0, v)) * 100);
        return (
          <span key={i} className="relative h-3.5 w-[0.9em] text-[12px] leading-none">
            <span className="absolute text-[#d4cfc4]" aria-hidden>
              ★
            </span>
            <span className="absolute overflow-hidden text-[#C9A84A]" style={{ width: `${pct}%` }} aria-hidden>
              ★
            </span>
          </span>
        );
      })}
      <span className="ml-0.5 text-xs font-bold text-[#2A2620]">{rating.toFixed(1)}</span>
    </div>
  );
}

export function ServiciosProfessionalResultCard({
  row,
  lang,
  /** When true, omit outer `<li>` (parent list item already wraps this card). */
  embedded = false,
}: {
  row: ServiciosPublicListingRow;
  lang: ServiciosLang;
  embedded?: boolean;
}) {
  const wire = { ...row.profile_json };
  wire.identity = { ...wire.identity, leonixVerified: row.leonix_verified === true };
  if (
    (row.review_rating_count ?? 0) > 0 &&
    typeof row.review_rating_avg === "number" &&
    Number.isFinite(row.review_rating_avg)
  ) {
    wire.hero = {
      ...wire.hero,
      rating: row.review_rating_avg,
      reviewCount: row.review_rating_count ?? undefined,
    };
  }
  const profile = resolveServiciosProfile(wire, lang);

  const template = resolveServiciosListingTemplate({
    businessTypeId: readServiciosProfileBusinessTypeId(row.profile_json),
    internalGroup: row.internal_group,
    categoryLabel: profile.hero.categoryLine,
  });
  const ctas = getProfessionalCtas(template, lang);

  const href = `/clasificados/servicios/${encodeURIComponent(row.slug)}?lang=${lang}`;
  const thumb =
    profile.hero.logoUrl ||
    profile.gallery[0]?.url ||
    profile.hero.coverImageUrl ||
    null;
  const category = profile.hero.categoryLine?.trim();
  const location = profile.hero.locationSummary?.trim() || row.city?.trim();
  const snippet = profile.about?.text?.trim().slice(0, 120);
  const trustFact = profile.quickFacts[0]?.label?.trim();
  const tel = profile.contact.phoneTelHref;
  const wa = profile.contact.socialLinks?.whatsapp;
  const promoted = isServiciosListingPromoted(row);

  const ratingValue =
    typeof profile.hero.rating === "number" && Number.isFinite(profile.hero.rating) && profile.hero.rating > 0
      ? profile.hero.rating
      : undefined;
  const reviewCount =
    typeof profile.hero.reviewCount === "number" && profile.hero.reviewCount > 0
      ? profile.hero.reviewCount
      : undefined;

  const chips = useMemo(() => {
    const out: string[] = [];
    const seen = new Set<string>();
    const add = (raw: string) => {
      const c = cleanChipLabel(raw);
      if (!c || isWeakChipLabel(c)) return;
      const key = c.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(c);
    };
    for (const s of profile.services) add(s.title);
    const spec = profile.about?.specialtiesLine?.trim();
    if (spec) {
      for (const part of spec.split(/[,;|·]/)) add(part);
    }
    return out.slice(0, 4);
  }, [profile.about?.specialtiesLine, profile.services]);

  const [ctaOpen, setCtaOpen] = useState(false);
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);
  const [listingShareUrl, setListingShareUrl] = useState("");
  useEffect(() => {
    setListingShareUrl(`${window.location.origin}${href}`);
  }, [href]);

  const contactExtras = useMemo(
    () => serviciosContactShareExtras(profile, row.slug, listingShareUrl || undefined),
    [profile, row.slug, listingShareUrl],
  );

  const closeCta = useCallback(() => {
    setCtaOpen(false);
    setCtaIntent(null);
  }, []);

  const openOutbound = useCallback(
    (intent: CtaSheetIntent, eventType: string) => {
      trackServiciosListingCta(row.slug, eventType, { source: "servicios_professional_card" });
      setCtaIntent(intent);
      setCtaOpen(true);
    },
    [row.slug],
  );

  const waHrefNormalized = useMemo(() => {
    const raw = (wa ?? "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    const d = raw.replace(/\D/g, "");
    if (d.length < 8) return "";
    return `https://wa.me/${d}`;
  }, [wa]);

  const onCallClick = useCallback(() => {
    const raw = (tel ?? "").replace(/^tel:/i, "").trim();
    if (!raw) return;
    openOutbound({ kind: "call", phone: raw, contactShareExtras: contactExtras }, "cta_call_click");
  }, [contactExtras, openOutbound, tel]);

  const onWhatsAppClick = useCallback(() => {
    if (!waHrefNormalized) return;
    const prefilled = appendWhatsAppPrefill(waHrefNormalized, serviciosUniversalQuoteMessage(lang));
    const d = extractWaMeDigitsFromHref(prefilled);
    if (d.replace(/\D/g, "").length < 8) return;
    let message = "";
    try {
      const u = new URL(prefilled);
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
  }, [contactExtras, lang, openOutbound, waHrefNormalized]);

  const primaryIsCall = Boolean(tel);

  const cardSurface = promoted
    ? `${CARD} ring-2 ring-[#D4AF37]/25 border-[#D4AF37]/50`
    : CARD;

  const body = (
    <>
      <article className={cardSurface}>
        <div className="flex gap-3 p-4 pb-3 sm:gap-4 sm:p-5">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#E4D4BC]/80 bg-[#F6F0E8] sm:h-[4.5rem] sm:w-[4.5rem]">
            {thumb ? (
              <Image
                src={thumb}
                alt={profile.hero.logoAlt || profile.identity.businessName}
                fill
                className="object-cover"
                sizes="72px"
                unoptimized={serviciosImageUnoptimized(thumb)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase tracking-wide text-[#8B7E70]">
                {profile.identity.businessName.slice(0, 2)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-1">
              {promoted ? (
                <span className="rounded-full border border-[#D4AF37]/40 bg-gradient-to-r from-[#D4AF37] to-[#9A7329] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                  {lang === "en" ? "Featured" : "Destacado"}
                </span>
              ) : null}
              {row.leonix_verified ? (
                <span className="rounded-full border border-[#6F7A3A]/30 bg-[#6F7A3A]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#4d5630]">
                  {lang === "en" ? "Verified" : "Verificado"}
                </span>
              ) : null}
            </div>

            <h3 className="text-base font-bold leading-snug text-[#1A1A1A] sm:text-lg">
              {profile.identity.businessName}
            </h3>

            {category ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6F6254]">{category}</p>
            ) : null}

            {location ? (
              <p className="flex items-start gap-1.5 text-xs text-[#4A4A4A] sm:text-sm">
                <FiMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6F7A3A]" aria-hidden />
                <span className="line-clamp-2">{location}</span>
              </p>
            ) : null}

            {ratingValue != null ? (
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <StarRow rating={ratingValue} lang={lang} />
                {reviewCount != null ? (
                  <span className="text-[11px] font-medium text-[#6F6254]">
                    {lang === "en" ? `(${reviewCount} reviews)` : `(${reviewCount} reseñas)`}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {(chips.length > 0 || snippet || trustFact) && (
          <div className="space-y-2 px-4 pb-3 sm:px-5">
            {chips.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <span key={chip} className={CHIP}>
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
            {snippet ? (
              <p className="line-clamp-2 text-xs leading-relaxed text-[#4A4A4A] sm:text-sm">{snippet}</p>
            ) : null}
            {trustFact ? (
              <p className="text-[11px] font-medium text-[#6F6254] sm:text-xs">{trustFact}</p>
            ) : null}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 border-t border-[#E8D9C4]/80 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            {primaryIsCall ? (
              <button type="button" onClick={onCallClick} className={CTA_PRIMARY}>
                <FiPhone className="h-4 w-4 shrink-0" aria-hidden />
                {ctas.primary}
              </button>
            ) : waHrefNormalized ? (
              <button type="button" onClick={onWhatsAppClick} className={CTA_PRIMARY}>
                <FaWhatsapp className="h-4 w-4 shrink-0" aria-hidden />
                {ctas.primary}
              </button>
            ) : (
              <Link href={href} className={CTA_PRIMARY}>
                {ctas.primary}
              </Link>
            )}
            <Link href={href} className={CTA_SECONDARY}>
              {ctas.secondary}
            </Link>
          </div>
          {tel && waHrefNormalized ? (
            <div className="flex flex-wrap gap-2">
              {!primaryIsCall ? (
                <button type="button" onClick={onCallClick} className={CTA_TERTIARY}>
                  <FiPhone className="h-3.5 w-3.5" aria-hidden />
                  {lang === "en" ? "Call" : "Llamar"}
                </button>
              ) : (
                <button type="button" onClick={onWhatsAppClick} className={CTA_TERTIARY}>
                  <FaWhatsapp className="h-3.5 w-3.5" aria-hidden />
                  WhatsApp
                </button>
              )}
            </div>
          ) : null}
        </div>
      </article>
      <CtaActionSheet open={ctaOpen} onClose={closeCta} intent={ctaIntent} lang={lang} />
    </>
  );

  if (embedded) return body;
  return <li>{body}</li>;
}
