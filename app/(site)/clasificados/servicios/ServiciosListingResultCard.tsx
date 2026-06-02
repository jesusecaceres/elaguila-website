"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiMapPin, FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import { getServiciosProfileLabels } from "@/app/servicios/copy/serviciosProfileCopy";
import type { ServiciosPublicListingRow } from "./lib/serviciosPublicListingsServer";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { formatServiciosInternalGroupForDiscovery } from "./lib/serviciosInternalGroupDisplay";
import { inferServiciosSellerPresentation } from "./lib/serviciosSellerKind";
import { isServiciosListingPromoted } from "./lib/serviciosResultsFilter";
import { CtaActionSheet } from "@/app/components/cta/CtaActionSheet";
import type { CtaSheetIntent } from "@/app/components/cta/types";
import {
  extractWaMeDigitsFromHref,
  serviciosContactShareExtras,
  trackServiciosListingCta,
} from "@/app/(site)/servicios/lib/serviciosCtaIntents";
import { appendWhatsAppPrefill, serviciosUniversalQuoteMessage } from "@/app/(site)/servicios/lib/serviciosContactActions";
import {
  isServiciosProfessionalTemplate,
  readServiciosProfileBusinessTypeId,
  resolveServiciosListingTemplate,
} from "./lib/serviciosTemplateRouting";
import { ServiciosProfessionalResultCard } from "./ServiciosProfessionalResultCard";
import {
  LX,
  LX_COMPACT_CARD_TITLE,
  LX_CTA_INLINE_PRIMARY,
  LX_CTA_INLINE_SECONDARY,
  LX_CTA_INLINE_WHATSAPP,
} from "@/app/(site)/servicios/components/serviciosLeonixBrand";

/**
 * Discovery card — only fields that exist on the resolved profile; empty data hides cleanly.
 */
export function ServiciosListingResultCard({ row, lang }: { row: ServiciosPublicListingRow; lang: ServiciosLang }) {
  const routeWire = { ...row.profile_json };
  const routeProfile = resolveServiciosProfile(routeWire, lang);
  const template = resolveServiciosListingTemplate({
    businessTypeId: readServiciosProfileBusinessTypeId(row.profile_json),
    internalGroup: row.internal_group,
    categoryLabel: routeProfile.hero.categoryLine,
  });
  if (isServiciosProfessionalTemplate(template)) {
    return <ServiciosProfessionalResultCard row={row} lang={lang} />;
  }

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

  const href = `/clasificados/servicios/${encodeURIComponent(row.slug)}?lang=${lang}`;
  const thumb =
    profile.hero.logoUrl ||
    profile.gallery[0]?.url ||
    profile.hero.coverImageUrl ||
    null;
  const category = profile.hero.categoryLine?.trim();
  const location = profile.hero.locationSummary?.trim() || row.city?.trim();
  const snippet = profile.about?.text?.trim().slice(0, 140);
  const hasSnippet = Boolean(snippet && snippet.length > 0);
  const phone = profile.contact.phoneDisplay;
  const tel = profile.contact.phoneTelHref;
  const wa = profile.contact.socialLinks?.whatsapp;
  const promo = profile.promotions[0]?.headline?.trim();
  const qf = profile.quickFacts[0]?.label;
  const groupDiscovery = formatServiciosInternalGroupForDiscovery(row.internal_group, lang);
  const groupLabel = groupDiscovery?.trim() ?? "";
  const showGroupChip = Boolean(groupLabel) && (!category || groupLabel !== category.trim());
  const sellerKind = inferServiciosSellerPresentation(row.profile_json);
  const promoted = isServiciosListingPromoted(row);

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
      trackServiciosListingCta(row.slug, eventType, { source: "servicios_listing_card" });
      setCtaIntent(intent);
      setCtaOpen(true);
    },
    [row.slug],
  );

  const waHref = (wa ?? "").trim();

  const onCallClick = useCallback(() => {
    const raw = (tel ?? "").replace(/^tel:/i, "").trim();
    if (!raw) return;
    openOutbound({ kind: "call", phone: raw, contactShareExtras: contactExtras }, "cta_call_click");
  }, [contactExtras, openOutbound, tel]);

  const onWhatsAppClick = useCallback(() => {
    if (!waHref) return;
    const prefilled = appendWhatsAppPrefill(waHref, serviciosUniversalQuoteMessage(lang));
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
  }, [contactExtras, lang, openOutbound, waHref]);

  const cardSurface = promoted
    ? "border-[#D4A574]/45 bg-[#FFFAF0] shadow-[0_12px_48px_-20px_rgba(212,165,116,0.15)] ring-2 ring-[#D4A574]/20 transition hover:border-[#D4A574]/55 hover:shadow-[0_16px_56px_-18px_rgba(212,165,116,0.2)]"
    : "border-[#D4A574]/30 bg-[#FFFAF0] shadow-[0_12px_48px_-20px_rgba(212,165,116,0.15)] transition hover:border-[#D4A574]/45 hover:shadow-[0_16px_56px_-18px_rgba(212,165,116,0.2)]";

  return (
    <li>
      <div className={`flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border ${cardSurface}`}>
          <Link
            href={href}
            className="flex min-h-0 flex-1 flex-col overflow-hidden text-left text-inherit no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/40 focus-visible:ring-offset-2"
          >
            <div className="relative aspect-[16/10] w-full bg-[#F5F0E8]">
              {thumb ? (
                <Image src={thumb} alt="" fill className="object-cover" unoptimized sizes="(max-width:640px) 100vw, (max-width:1280px) 50vw, 33vw" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-wide text-[#C9A84A]/50">
                  Leonix
                </div>
              )}
              <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1">
                {promoted ? (
                  <span className="rounded-full border border-white/70 bg-gradient-to-r from-[#D4A574] to-[#C19A6B] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                    {lang === "en" ? "Featured" : "Destacado"}
                  </span>
                ) : null}
                {row.leonix_verified ? (
                  <span className="rounded-full border border-white/80 bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2A7F3E] shadow-sm">
                    {lang === "en" ? "Verified" : "Verificado"}
                  </span>
                ) : null}
                <span
                  className={
                    sellerKind === "business"
                      ? "rounded-full border border-white/80 bg-[#1A1A1A]/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm"
                      : "rounded-full border border-white/80 bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#4A4A4A] shadow-sm"
                  }
                >
                  {sellerKind === "business"
                    ? lang === "en"
                      ? "Business"
                      : "Negocio"
                    : lang === "en"
                      ? "Independent"
                      : "Independiente"}
                </span>
              </div>
              {promo ? (
                <span className="absolute bottom-2 left-2 right-2 truncate rounded-lg bg-black/55 px-2 py-1 text-center text-[11px] font-semibold text-white backdrop-blur-sm">
                  {promo}
                </span>
              ) : null}
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4 p-6 pb-4">
              {showGroupChip ? (
                <span className="w-fit rounded-full bg-[#D4A574]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#D4A574] border border-[#D4A574]/20">
                  {groupLabel}
                </span>
              ) : null}
              {category ? (
                <span className="text-sm font-medium text-[#7A7A7A] uppercase tracking-wide">{category}</span>
              ) : null}
              <span className={LX_COMPACT_CARD_TITLE}>{profile.identity.businessName}</span>
              {row.city?.trim() ? (
                <span className="text-[11px] font-medium uppercase tracking-wide text-[#7A7A7A]">
                  {lang === "en" ? "Listing base:" : "Base del anuncio:"}{" "}
                  <span className="font-semibold text-[#4A4A4A]">{row.city.trim()}</span>
                </span>
              ) : null}
              {location ? (
                <span className="flex items-start gap-2 text-sm text-[#4A4A4A]">
                  <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A574]" aria-hidden />
                  <span className="line-clamp-2">{location}</span>
                </span>
              ) : null}
              {qf ? <span className="text-xs font-medium text-[#7A7A7A]">{qf}</span> : null}
              {hasSnippet ? <p className="line-clamp-3 text-sm leading-relaxed text-[#4A4A4A]">{snippet}</p> : null}
            </div>
          </Link>

          <div className="flex min-h-0 flex-col gap-4 px-6 pb-6">
            {/* CTA Section */}
            <div className="mt-auto flex flex-wrap gap-2.5">
              <Link
                href={href}
                className={LX_CTA_INLINE_PRIMARY}
                style={{ backgroundColor: LX.burgundy, boxShadow: "0 6px 16px rgba(92, 22, 34, 0.22)" }}
              >
                {lang === "en" ? "View showcase" : "Ver vitrina"}
              </Link>
              {phone && tel ? (
                <button type="button" onClick={onCallClick} className={LX_CTA_INLINE_SECONDARY}>
                  <FiPhone className="h-4 w-4 shrink-0" aria-hidden />
                  {L.call}
                </button>
              ) : null}
              {waHref ? (
                <button
                  type="button"
                  onClick={onWhatsAppClick}
                  className={LX_CTA_INLINE_WHATSAPP}
                  style={{ backgroundColor: LX.whatsApp, boxShadow: LX.whatsAppShadow }}
                >
                  <FaWhatsapp className="h-4 w-4 shrink-0" aria-hidden />
                  WhatsApp
                </button>
              ) : null}
            </div>

            {/* Engagement Section */}
            <div className="mt-6 border-t border-[#E8D9C4]/80 pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wide text-[#1E1814]">
                  {lang === "en" ? "Engagement" : "Interacción"}
                </h4>
              </div>

              <div className="flex items-center gap-3">
                <LeonixLikeButton
                  listingId={(row.leonix_ad_id ?? "").trim() || row.slug}
                  ownerUserId={row.owner_user_id ?? undefined}
                  variant="small"
                  lang={lang}
                  category="servicios"
                  persistEngagement={Boolean((row.leonix_ad_id ?? "").trim())}
                />
                <LeonixSaveButton
                  listingId={(row.leonix_ad_id ?? "").trim() || row.slug}
                  ownerUserId={row.owner_user_id ?? undefined}
                  variant="small"
                  lang={lang}
                  category="servicios"
                  persistEngagement={Boolean((row.leonix_ad_id ?? "").trim())}
                />
                <LeonixShareButton
                  listingId={(row.leonix_ad_id ?? "").trim() || row.slug}
                  ownerUserId={row.owner_user_id ?? undefined}
                  listingTitle={profile.identity.businessName}
                  listingUrl={listingShareUrl}
                  variant="small"
                  lang={lang}
                  category="servicios"
                  persistEngagement={Boolean((row.leonix_ad_id ?? "").trim())}
                />
              </div>
            </div>
          </div>
        </div>
      <CtaActionSheet open={ctaOpen} onClose={closeCta} intent={ctaIntent} lang={lang} />
    </li>
  );
}
