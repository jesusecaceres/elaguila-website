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
import { resolveServiciosProfileDirectWhatsAppHref } from "@/app/(site)/servicios/lib/serviciosWhatsAppHref";
import {
  LX,
  LX_CHIP,
  LX_COMPACT_CARD_TITLE,
  LX_CTA_MAP,
  LX_CTA_PRIMARY,
  LX_CTA_PRIMARY_LG,
  LX_CTA_SECONDARY,
  LX_CTA_WHATSAPP,
  collectHeroTrustChips,
  collectProfessionalServiceChips,
  getPrimaryCtaLabel,
  hasPhysicalAddress,
} from "@/app/servicios/components/serviciosLeonixBrand";

const CARD =
  "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#E4D4BC] bg-[#FFFDF9] shadow-sm transition hover:border-[#D4C4A8] hover:shadow-md sm:rounded-2xl";

function getProfileCtaSecondary(template: ServiciosListingTemplate, lang: ServiciosLang): string {
  if (template === "legal_provider") {
    return lang === "en" ? "View profile" : "Ver perfil";
  }
  return lang === "en" ? "View profile" : "Ver perfil";
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
  const primaryLabel = getPrimaryCtaLabel(template, lang);
  const secondaryLabel = getProfileCtaSecondary(template, lang);

  const href = `/clasificados/servicios/${encodeURIComponent(row.slug)}?lang=${lang}`;
  const thumb = profile.hero.logoUrl || null;
  const category = profile.hero.categoryLine?.trim();
  const location = profile.hero.locationSummary?.trim() || row.city?.trim();
  const tel = profile.contact.phoneTelHref;
  const waHrefNormalized = resolveServiciosProfileDirectWhatsAppHref(profile.contact) ?? "";
  const promoted = isServiciosListingPromoted(row);
  const showDirections = hasPhysicalAddress(profile);
  const serviceChips = useMemo(() => collectProfessionalServiceChips(profile, 4), [profile]);
  const trustChips = useMemo(() => collectHeroTrustChips(profile, 2), [profile]);

  const ratingValue =
    typeof profile.hero.rating === "number" && Number.isFinite(profile.hero.rating) && profile.hero.rating > 0
      ? profile.hero.rating
      : undefined;
  const reviewCount =
    typeof profile.hero.reviewCount === "number" && profile.hero.reviewCount > 0
      ? profile.hero.reviewCount
      : undefined;

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

  const onDirectionsClick = useCallback(() => {
    const mapsHref = profile.contact.mapsSearchHref?.trim();
    const addr = profile.contact.physicalAddressDisplay?.trim();
    trackServiciosListingCta(row.slug, "cta_maps_click", { source: "servicios_professional_card" });
    if (mapsHref && /^https?:\/\//i.test(mapsHref)) {
      window.open(mapsHref, "_blank", "noopener,noreferrer");
    } else if (addr) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  }, [profile.contact.mapsSearchHref, profile.contact.physicalAddressDisplay, row.slug]);

  const cardSurface = promoted
    ? `${CARD} ring-2 ring-[#C9A84A]/30 border-[#C9A84A]/55`
    : CARD;

  const body = (
    <>
      <article className={cardSurface}>
        <div className="flex gap-4 p-5 pb-3 sm:gap-5 sm:p-6 sm:pb-4">
          <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-lg border-2 border-[#E8D9C4] bg-[#FFFCF7] p-1.5 sm:h-20 sm:w-20">
            {thumb ? (
              <Image
                src={thumb}
                alt={profile.hero.logoAlt || profile.identity.businessName}
                fill
                className="object-contain"
                sizes="72px"
                unoptimized={serviciosImageUnoptimized(thumb)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-serif text-sm font-semibold uppercase tracking-wide text-[#3B2117]">
                {profile.identity.businessName.slice(0, 2)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-1">
              {promoted ? (
                <span className="rounded-md border border-[#C9A84A]/50 bg-[#F5F0E8] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#3B2117]">
                  {lang === "en" ? "Featured" : "Destacado"}
                </span>
              ) : null}
              {row.leonix_verified ? (
                <span
                  className="rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                  style={{
                    borderColor: "rgba(45, 90, 61, 0.4)",
                    backgroundColor: LX.trustGreenSoft,
                    color: LX.trustGreenText,
                  }}
                >
                  {lang === "en" ? "Verified" : "Verificado"}
                </span>
              ) : null}
            </div>

            <h3 className={LX_COMPACT_CARD_TITLE}>{profile.identity.businessName}</h3>

            {category ? (
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6F6254] sm:text-xs">{category}</p>
            ) : null}

            {location ? (
              <p className="flex items-start gap-1.5 text-xs text-[#4A4A4A]">
                <FiMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C9A84A]" aria-hidden />
                <span className="line-clamp-2">{location}</span>
              </p>
            ) : null}

            {ratingValue != null ? (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <StarRow rating={ratingValue} lang={lang} />
              </div>
            ) : null}
          </div>
        </div>

        {(serviceChips.length > 0 || trustChips.length > 0) && (
          <div className="flex flex-wrap gap-1.5 px-4 pb-2 sm:px-5">
            {serviceChips.map((chip) => (
              <span key={`s-${chip}`} className={LX_CHIP}>
                {chip}
              </span>
            ))}
            {trustChips.map((chip) => (
              <span key={`t-${chip}`} className={LX_CHIP}>
                {chip}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto border-t border-[#E8D9C4]/80 px-5 py-4 sm:px-6 sm:py-5">
          <div className="grid grid-cols-2 gap-2.5">
            {tel ? (
              <button
                type="button"
                onClick={onCallClick}
                className={`${LX_CTA_PRIMARY} ${LX_CTA_PRIMARY_LG} col-span-2 w-full`}
                style={{ backgroundColor: LX.burgundy }}
              >
                <FiPhone className="h-4 w-4 shrink-0" aria-hidden />
                {primaryLabel}
              </button>
            ) : waHrefNormalized ? (
              <button
                type="button"
                onClick={onWhatsAppClick}
                className={`${LX_CTA_WHATSAPP} ${LX_CTA_PRIMARY_LG} col-span-2 w-full`}
                style={{ backgroundColor: LX.whatsApp, boxShadow: LX.whatsAppShadow }}
              >
                <FaWhatsapp className="h-5 w-5 shrink-0" aria-hidden />
                WhatsApp
              </button>
            ) : showDirections ? (
              <button
                type="button"
                onClick={onDirectionsClick}
                className={`${LX_CTA_MAP} ${LX_CTA_PRIMARY_LG} col-span-2 w-full`}
              >
                <FiMapPin className="h-4 w-4 shrink-0" aria-hidden />
                {lang === "en" ? "Directions" : "Cómo llegar"}
              </button>
            ) : null}
            {tel && waHrefNormalized ? (
              <button
                type="button"
                onClick={onWhatsAppClick}
                className={`${LX_CTA_WHATSAPP} w-full`}
                style={{ backgroundColor: LX.whatsApp, boxShadow: LX.whatsAppShadow }}
              >
                <FaWhatsapp className="h-4 w-4 shrink-0" aria-hidden />
                WhatsApp
              </button>
            ) : null}
            {showDirections && (tel || waHrefNormalized) ? (
              <button type="button" onClick={onDirectionsClick} className={`${LX_CTA_MAP} w-full`}>
                <FiMapPin className="h-4 w-4 shrink-0" aria-hidden />
                {lang === "en" ? "Directions" : "Cómo llegar"}
              </button>
            ) : null}
          </div>
          <Link href={href} className={`${LX_CTA_SECONDARY} ${LX_CTA_PRIMARY_LG} mt-2.5 w-full`}>
            {secondaryLabel}
          </Link>
        </div>
      </article>
      <CtaActionSheet open={ctaOpen} onClose={closeCta} intent={ctaIntent} lang={lang} />
    </>
  );

  if (embedded) return body;
  return <li>{body}</li>;
}
