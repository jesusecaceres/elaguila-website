"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { serviciosImageUnoptimized } from "../lib/serviciosMediaUrl";
import { buildServiciosGetQuoteIntent, trackServiciosListingCta } from "../lib/serviciosCtaIntents";
import { SV } from "./serviciosDesignTokens";
import { ServiciosGalleryVideoTile } from "./ServiciosGalleryVideoTile";
import { CtaActionSheet } from "@/app/components/cta/CtaActionSheet";
import type { CtaSheetIntent } from "@/app/components/cta/types";

function FeaturedImage({
  g,
  aspectClass,
  onQuoteClick,
}: {
  g: { id: string; url: string; alt: string };
  aspectClass: string;
  onQuoteClick?: () => void;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-black/[0.06] bg-black/[0.03] shadow-sm ${aspectClass}`}
    >
      <Image
        src={g.url}
        alt={g.alt}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
        unoptimized={serviciosImageUnoptimized(g.url)}
      />
      {onQuoteClick ? (
        <div className="absolute inset-0 bg-black/0 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuoteClick();
              }}
              className="rounded-lg bg-white/95 px-4 py-2 text-sm font-semibold text-[#3B66AD] shadow-lg transition hover:bg-white"
            >
              Quiero algo como esto
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const featuredLargeAspect = "aspect-[16/11] sm:aspect-[5/3] max-h-[min(380px,62vh)] sm:max-h-[min(420px,58vh)]";
const featuredSmallAspect = "aspect-[5/4] sm:aspect-[4/3]";

export function ServiciosGallery({
  profile,
  lang,
  listingSlug,
  listingShareUrl,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  listingSlug?: string;
  listingShareUrl?: string;
}) {
  const L = getServiciosProfileLabels(lang);
  const mains = profile.gallery;
  const more = profile.galleryMore;
  const videos = profile.galleryVideos;

  const [ctaOpen, setCtaOpen] = useState(false);
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);

  const closeCta = useCallback(() => {
    setCtaOpen(false);
    setCtaIntent(null);
  }, []);

  const galleryQuoteMessage =
    lang === "en"
      ? "Hi, I saw your profile on Leonix and would like something like this."
      : "Hola, vi tu perfil en Leonix y quiero algo como esto.";

  const handleGalleryQuoteClick = () => {
    const intent = buildServiciosGetQuoteIntent(profile, lang, {
      listingSlug,
      listingShareUrl,
      quoteMessage: galleryQuoteMessage,
    });
    if (!intent) return;
    trackServiciosListingCta(listingSlug, "cta_quote_sms_click", { source: "gallery", href: "sheet" });
    setCtaIntent(intent);
    setCtaOpen(true);
  };

  if (mains.length === 0 && more.length === 0 && videos.length === 0) return null;

  const hasPhotos = mains.length > 0 || more.length > 0;

  const videoGrid =
    videos.length === 1
      ? "grid grid-cols-1 gap-3 md:gap-4 max-w-3xl mx-auto"
      : videos.length >= 2
        ? "grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4"
        : "";

  return (
    <>
      <section
        className="rounded-2xl border p-4 shadow-sm sm:p-6 md:p-8"
        style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
      >
        <h2 className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl">{L.gallery}</h2>

        {mains.length > 0 ? (
          <div className="mt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mains.map((g, index) => (
                <FeaturedImage
                  key={g.id}
                  g={g}
                  aspectClass={index === 0 && mains.length === 1 ? featuredLargeAspect : featuredSmallAspect}
                  onQuoteClick={handleGalleryQuoteClick}
                />
              ))}
            </div>
          </div>
        ) : null}

        {videos.length > 0 ? (
          <div className={`${hasPhotos ? "mt-10 border-t border-black/[0.06] pt-8" : "mt-6"}`}>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{L.videoTour}</p>
            <div className={videoGrid}>
              {videos.map((v) => (
                <div key={v.id}>
                  {videos.length > 1 && v.isPrimary ? (
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#3B66AD]/90">{L.videoTour}</p>
                  ) : null}
                  <ServiciosGalleryVideoTile v={v} lang={lang} />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {more.length > 0 ? (
          <div className={`${mains.length > 0 || videos.length > 0 ? "mt-10 border-t border-black/[0.06] pt-8" : "mt-6"}`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{L.galleryMore}</p>
              <button
                className="text-sm font-medium text-[#3B66AD] transition hover:text-[#2d528d]"
                type="button"
                onClick={() => {
                  console.log("View all photos clicked");
                }}
              >
                {lang === "en" ? "View all photos" : "Ver todas las fotos"}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {more.map((g) => (
                <div
                  key={g.id}
                  className="relative aspect-square overflow-hidden rounded-lg border border-black/[0.06] bg-black/[0.03]"
                >
                  <Image
                    src={g.url}
                    alt={g.alt}
                    fill
                    className="object-cover"
                    sizes="120px"
                    unoptimized={serviciosImageUnoptimized(g.url)}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
      <CtaActionSheet open={ctaOpen} onClose={closeCta} intent={ctaIntent} lang={lang} />
    </>
  );
}
