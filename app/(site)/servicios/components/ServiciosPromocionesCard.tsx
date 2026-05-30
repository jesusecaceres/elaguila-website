"use client";

import { useCallback, useState } from "react";
import { FaTicketAlt } from "react-icons/fa";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels, getServiciosPromocionesSectionCopy } from "../copy/serviciosProfileCopy";
import { hasOfferSectionResolved } from "../lib/serviciosProfilePresence";
import { SV } from "./serviciosDesignTokens";
import { LX, LX_SECTION_CARD } from "./serviciosLeonixBrand";
import { ServiciosPromoImageLightbox } from "./ServiciosPromoImageLightbox";

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

function OfferHeadline({ text, premiumLeonixTone }: { text: string; premiumLeonixTone?: boolean }) {
  const parts = text.split(/(\$\d+)/g);
  return (
    <h3
      className={
        premiumLeonixTone
          ? "font-serif text-lg font-semibold leading-snug tracking-tight text-[#1E1814] sm:text-xl"
          : "text-lg font-bold leading-snug tracking-tight text-[#2C2214] sm:text-xl"
      }
    >
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

function promoActionLabel(
  kind: ResourceKind,
  variant: "primary" | "secondary",
  lang: ServiciosLang,
  L: ReturnType<typeof getServiciosProfileLabels>,
  premiumLeonixTone: boolean,
): string {
  if (!premiumLeonixTone) {
    return kind === "image" ? L.promoViewImage : kind === "pdf" ? L.promoViewPdf : L.visitWebsite;
  }
  if (kind === "image") return lang === "en" ? "View image" : "Ver imagen";
  if (kind === "pdf") return lang === "en" ? "View PDF" : "Ver PDF";
  if (variant === "primary") return lang === "en" ? "View offer" : "Ver oferta";
  return lang === "en" ? "Visit site" : "Visitar sitio";
}

function PromoCtaButton({
  kind,
  href,
  variant,
  L,
  lang,
  premiumLeonixTone,
  onImageOpen,
}: {
  kind: ResourceKind;
  href: string;
  variant: "primary" | "secondary";
  L: ReturnType<typeof getServiciosProfileLabels>;
  lang: ServiciosLang;
  premiumLeonixTone?: boolean;
  onImageOpen: (src: string) => void;
}) {
  const label = promoActionLabel(kind, variant, lang, L, Boolean(premiumLeonixTone));
  const base = premiumLeonixTone
    ? variant === "primary"
      ? "inline-flex min-h-[40px] items-center justify-center rounded-lg border-0 px-3.5 py-2 text-xs font-bold text-[#FFFCF7] shadow-sm transition hover:brightness-[1.05]"
      : "inline-flex min-h-[40px] items-center justify-center rounded-lg border-2 border-[#D4C4A8] bg-[#FFFCF7] px-3 py-2 text-xs font-bold text-[#1E1814] transition hover:border-[#C9A84A] hover:bg-[#FFFDF9]"
    : variant === "primary"
      ? "inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#B8935A]/55 bg-gradient-to-b from-[#F3E6C8] to-[#E8D4A8] px-3.5 py-2 text-xs font-bold text-[#2C2214] shadow-sm transition hover:border-[#9A7329]/70 hover:shadow"
      : "inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#C4A574]/45 bg-[#FFFAF0]/90 px-3 py-2 text-xs font-semibold text-[#3D2C12] transition hover:border-[#9A7329]/55 hover:bg-white";
  const primaryStyle = premiumLeonixTone && variant === "primary" ? { backgroundColor: LX.burgundy } : undefined;

  if (kind === "image") {
    return (
      <button type="button" className={base} style={primaryStyle} onClick={() => onImageOpen(href)}>
        {label}
      </button>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={base} style={primaryStyle}>
      {label}
    </a>
  );
}

function PromoInnerCard({
  promo,
  lang,
  compact,
  premiumLeonixTone,
  onImageOpen,
}: {
  promo: PromoRow;
  lang: ServiciosLang;
  compact?: boolean;
  premiumLeonixTone?: boolean;
  onImageOpen: (src: string) => void;
}) {
  const L = getServiciosProfileLabels(lang);
  const { primary, secondary } = buildPromoActions(promo);
  const hasImage = Boolean(promo.assetImageHrefSafe);
  const thumb = promo.assetImageHrefSafe;
  const showThumbCol = hasImage || !premiumLeonixTone;
  const cardClass = premiumLeonixTone
    ? `relative overflow-hidden rounded-lg border border-[#E8D9C4] bg-[#FFFDF7] shadow-sm transition hover:border-[#D4C4A8] ${
        compact ? "px-3 py-3.5 sm:px-4 sm:py-4" : "px-4 py-5 sm:px-5 sm:py-5"
      }`
    : `relative overflow-hidden rounded-2xl border border-[#D4A574]/45 shadow-[0_8px_28px_-12px_rgba(61,44,18,0.18)] transition hover:border-[#C9A84A]/55 hover:shadow-md ${
        compact ? "px-3 py-3.5 sm:px-4 sm:py-4" : "px-4 py-5 sm:px-6 sm:py-6"
      }`;
  const cardStyle = premiumLeonixTone
    ? undefined
    : { background: "linear-gradient(165deg, #FFFCF5 0%, #FFF8EC 42%, #FAF0E4 100%)" };

  return (
    <article className={cardClass} style={cardStyle}>
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#D4A574]/12"
        aria-hidden
      />
      <div className="pointer-events-none absolute bottom-0 left-0 h-16 w-16 rounded-tr-[100%] bg-[#C9A84A]/[0.07]" aria-hidden />

      <div className={`relative flex flex-col gap-2.5 ${showThumbCol ? "sm:flex-row sm:gap-3" : ""}`}>
        {showThumbCol ? (
        <div className="flex shrink-0 flex-col gap-1.5 sm:w-[min(100%,6.75rem)]">
          {hasImage && thumb ? (
            <button
              type="button"
              onClick={() => onImageOpen(thumb)}
              className="group relative aspect-[4/3] w-full max-w-[180px] overflow-hidden rounded-xl border border-[#D4A574]/40 bg-[#F5EFE3] shadow-inner sm:max-w-none"
              aria-label={L.promoViewImage}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb} alt="" className="h-full w-full object-cover transition group-hover:opacity-95" />
            </button>
          ) : (
            <div
              className={`flex aspect-[4/3] w-full max-w-[200px] items-center justify-center rounded-xl border border-dashed border-[#C4A574]/50 bg-[#FAF4EA] sm:max-w-none ${
                compact ? "max-h-[82px]" : ""
              }`}
            >
              <FaTicketAlt className={`text-[#9A7329]/85 ${compact ? "h-7 w-7" : "h-9 w-9"}`} aria-hidden />
            </div>
          )}
          <span
            className={`inline-flex w-fit max-w-full items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
              premiumLeonixTone
                ? "border-[#D4C4A8] bg-[#F5F0E8] text-[#1E1814]"
                : "rounded-full border-[#C9A84A]/35 bg-[#FFF3DC] text-[#6B5420]"
            }`}
          >
            {L.promoCouponBadge}
          </span>
        </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <OfferHeadline text={promo.headline} premiumLeonixTone={premiumLeonixTone} />
          {promo.footnote ? (
            <p
              className="mt-1.5 text-sm leading-relaxed text-[#5D4A38]/95"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: compact ? 2 : 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {promo.footnote}
            </p>
          ) : null}

          {primary || secondary.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-2 border-t border-[#D4A574]/25 pt-2.5">
              {primary ? (
                <PromoCtaButton
                  key={`p-${primary.kind}`}
                  kind={primary.kind}
                  href={primary.href}
                  variant="primary"
                  L={L}
                  lang={lang}
                  premiumLeonixTone={premiumLeonixTone}
                  onImageOpen={onImageOpen}
                />
              ) : null}
              {secondary.map((s) => (
                <PromoCtaButton
                  key={`s-${s.kind}`}
                  kind={s.kind}
                  href={s.href}
                  variant="secondary"
                  L={L}
                  lang={lang}
                  premiumLeonixTone={premiumLeonixTone}
                  onImageOpen={onImageOpen}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ServiciosPromocionesCard({
  profile,
  lang,
  premiumLeonixTone = false,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  /** Leonix professional profile/preview polish (Gate 14). */
  premiumLeonixTone?: boolean;
}) {
  const copy = getServiciosPromocionesSectionCopy(lang);
  const L = getServiciosProfileLabels(lang);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const openLightbox = useCallback((src: string) => setLightboxSrc(src), []);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

  if (!hasOfferSectionResolved(profile)) return null;

  const n = profile.promotions.length;
  const listClass =
    n > 1
      ? "mt-4 flex flex-row flex-nowrap gap-3 overflow-x-auto pb-2 pt-0.5 [scrollbar-width:thin] snap-x snap-mandatory sm:mt-5 md:flex-col md:gap-3.5 md:overflow-visible md:pb-0 md:snap-none"
      : "mt-4 flex flex-col gap-3 sm:mt-5 sm:gap-3.5";

  return (
    <>
      <ServiciosPromoImageLightbox
        src={lightboxSrc}
        onClose={closeLightbox}
        closeLabel={L.promoModalClose}
        dialogLabel={L.promoImageLightboxAria}
      />
      <section
        className={premiumLeonixTone ? `${LX_SECTION_CARD} p-4 sm:p-6` : "rounded-2xl border p-3 shadow-sm sm:p-6 md:p-8"}
        style={
          premiumLeonixTone
            ? undefined
            : { backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }
        }
        aria-labelledby="servicios-promociones-heading"
      >
        <h2
          id="servicios-promociones-heading"
          className={
            premiumLeonixTone
              ? "font-serif text-xl font-semibold tracking-tight text-[#1E1814]"
              : "text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl"
          }
        >
          {copy.sectionTitle}
        </h2>
        <div className={listClass}>
          {profile.promotions.map((p) => (
            <div key={p.id} className={n > 1 ? "w-[min(100%,340px)] shrink-0 snap-start md:w-auto md:shrink" : ""}>
              <PromoInnerCard
                promo={p}
                lang={lang}
                compact={true}
                premiumLeonixTone={premiumLeonixTone}
                onImageOpen={openLightbox}
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
