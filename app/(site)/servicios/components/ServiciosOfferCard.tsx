"use client";

import { useCallback, useState } from "react";
import { FaTicketAlt } from "react-icons/fa";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { hasOfferSectionResolved } from "../lib/serviciosProfilePresence";
import { ServiciosPromoImageLightbox } from "./ServiciosPromoImageLightbox";
import { serviciosAnalyticsTrackMeta, trackServiciosListingCta } from "../lib/serviciosCtaIntents";

type PromoRow = ServiciosProfileResolved["promotions"][number];
type ResourceKind = "image" | "pdf" | "link";

function buildPromoActions(promo: PromoRow): { primary: { kind: ResourceKind; href: string } | null; secondary: { kind: ResourceKind; href: string }[] } {
  const ordered: { kind: ResourceKind; href: string }[] = [];
  if (promo.assetImageHrefSafe) ordered.push({ kind: "image", href: promo.assetImageHrefSafe });
  if (promo.assetPdfHrefSafe) ordered.push({ kind: "pdf", href: promo.assetPdfHrefSafe });
  if (promo.hrefSafe) ordered.push({ kind: "link", href: promo.hrefSafe });
  if (ordered.length === 0) return { primary: null, secondary: [] };
  return { primary: ordered[0]!, secondary: ordered.slice(1) };
}

function OfferHeadline({ text }: { text: string }) {
  const parts = text.split(/(\$\d+)/g);
  return (
    <h3 className="mt-1 text-lg font-bold leading-snug text-[#2C2214]">
      {parts.map((part, i) =>
        /^\$\d+$/.test(part) ? (
          <span key={i} className="text-[#9A7329]">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </h3>
  );
}

function SidebarPromoCta({
  kind,
  href,
  variant,
  L,
  onImageOpen,
  onTrack,
}: {
  kind: ResourceKind;
  href: string;
  variant: "primary" | "secondary";
  L: ReturnType<typeof getServiciosProfileLabels>;
  onImageOpen: (src: string) => void;
  onTrack: (kind: ResourceKind, variant: "primary" | "secondary") => void;
}) {
  const label = kind === "image" ? L.promoViewImage : kind === "pdf" ? L.promoViewPdf : L.visitWebsite;
  const base =
    variant === "primary"
      ? "inline-flex min-h-[40px] w-full items-center justify-center rounded-xl border border-[#B8935A]/55 bg-gradient-to-b from-[#F3E6C8] to-[#E8D4A8] px-3 py-2 text-xs font-bold text-[#2C2214] shadow-sm transition hover:border-[#9A7329]/70"
      : "inline-flex min-h-[40px] w-full items-center justify-center rounded-xl border border-[#C4A574]/45 bg-[#FFFAF0]/95 px-3 py-2 text-xs font-semibold text-[#3D2C12] transition hover:border-[#9A7329]/55 hover:bg-white";

  if (kind === "image") {
    return (
      <button
        type="button"
        className={base}
        onClick={() => {
          onTrack(kind, variant);
          onImageOpen(href);
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={base} onClick={() => onTrack(kind, variant)}>
      {label}
    </a>
  );
}

export function ServiciosOfferCard({
  profile,
  lang,
  listingSlug,
  listingSourceId = null,
  engagementListingId,
  engagementOwnerUserId,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  listingSlug?: string;
  listingSourceId?: string | null;
  engagementListingId?: string | null;
  engagementOwnerUserId?: string | null;
}) {
  const L = getServiciosProfileLabels(lang);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const openLightbox = useCallback((src: string) => setLightboxSrc(src), []);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);
  const analyticsMeta = serviciosAnalyticsTrackMeta({
    listingSlug,
    sourceId: listingSourceId,
    engagementListingId,
    ownerUserId: engagementOwnerUserId,
    source: "offer_sidebar",
  });

  if (!hasOfferSectionResolved(profile)) return null;
  /** Sidebar teaser: single-promo layouts keep the legacy sticky-panel offer; multiple promos render in main content only. */
  if (profile.promotions.length !== 1) return null;
  const promo = profile.promotions[0]!;
  const { primary, secondary } = buildPromoActions(promo);
  const hasImage = Boolean(promo.assetImageHrefSafe);
  const thumb = promo.assetImageHrefSafe;

  return (
    <>
      <ServiciosPromoImageLightbox
        src={lightboxSrc}
        onClose={closeLightbox}
        closeLabel={L.promoModalClose}
        dialogLabel={L.promoImageLightboxAria}
      />
      <div
        className="relative overflow-hidden rounded-2xl border border-[#D4A574]/45 px-4 py-5 shadow-[0_8px_28px_-12px_rgba(61,44,18,0.18)] transition hover:border-[#C9A84A]/55 hover:shadow-md sm:px-5 sm:py-6"
        style={{
          background: "linear-gradient(165deg, #FFFCF5 0%, #FFF8EC 45%, #FAF0E4 100%)",
        }}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#D4A574]/12" aria-hidden />

        <div className="relative flex min-w-0 flex-col gap-3">
          {hasImage && thumb ? (
            <button
              type="button"
              onClick={() => {
                if (listingSlug) {
                  trackServiciosListingCta(listingSlug, "cta_primary_click", {
                    ...analyticsMeta,
                    promoKind: "image",
                    promoIndex: 0,
                  });
                }
                openLightbox(thumb);
              }}
              className="group relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-[#D4A574]/40 bg-[#F5EFE3]"
              aria-label={L.promoViewImage}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb} alt="" className="h-full w-full object-cover transition group-hover:opacity-95" />
            </button>
          ) : (
            <div className="flex aspect-[16/10] max-h-[120px] w-full items-center justify-center rounded-xl border border-dashed border-[#C4A574]/50 bg-[#FAF4EA]">
              <FaTicketAlt className="h-8 w-8 text-[#9A7329]/85" aria-hidden />
            </div>
          )}

          <div className="flex min-w-0 flex-col gap-2">
            <span className="inline-flex w-fit rounded-full border border-[#C9A84A]/35 bg-[#FFF3DC] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B5420]">
              {L.promoCouponBadge}
            </span>
            <OfferHeadline text={promo.headline} />
            {promo.footnote ? <p className="mt-2 text-xs leading-relaxed text-[#5D4A38]/95">{promo.footnote}</p> : null}
          </div>

          {primary || secondary.length > 0 ? (
            <div className="mt-1 flex flex-col gap-2 border-t border-[#D4A574]/25 pt-3">
              {primary ? (
                <SidebarPromoCta
                  key={`p-${primary.kind}`}
                  kind={primary.kind}
                  href={primary.href}
                  variant="primary"
                  L={L}
                  onImageOpen={openLightbox}
                  onTrack={(kind, variant) => {
                    if (!listingSlug) return;
                    trackServiciosListingCta(listingSlug, "cta_primary_click", {
                      ...analyticsMeta,
                      promoKind: kind,
                      promoVariant: variant,
                      promoIndex: 0,
                    });
                  }}
                />
              ) : null}
              {secondary.map((s) => (
                <SidebarPromoCta
                  key={`s-${s.kind}`}
                  kind={s.kind}
                  href={s.href}
                  variant="secondary"
                  L={L}
                  onImageOpen={openLightbox}
                  onTrack={(kind, variant) => {
                    if (!listingSlug) return;
                    trackServiciosListingCta(listingSlug, "cta_secondary_click", {
                      ...analyticsMeta,
                      promoKind: kind,
                      promoVariant: variant,
                      promoIndex: 0,
                    });
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
