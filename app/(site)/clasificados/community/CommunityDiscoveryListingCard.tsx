"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import { requestAdTranslation } from "@/app/lib/translation/requestAdTranslation";
import type { AdTranslationResult, TranslatableAdFields } from "@/app/lib/translation/types";

import type { CommunityDiscoveryCardModel } from "./shared/communityDiscoveryListingCardModel";

const CHIP =
  "inline-flex max-w-full items-center truncate rounded-full border border-[#C9B46A]/45 bg-[#FFF9ED] px-2.5 py-0.5 text-[11px] font-semibold text-[#3d2e12]";

/** Shown only when the listing has no gallery image (matches landings’ reliable local asset). */
const LISTING_IMAGE_FALLBACK = "/logo.png";

type Props = {
  model: CommunityDiscoveryCardModel;
  lang: Lang;
  variant: "clases" | "comunidad";
};

const CTA = {
  clases: { es: "Ver clase", en: "View class" },
  comunidad: { es: "Ver evento", en: "View event" },
} as const;

export function CommunityDiscoveryListingCard({ model, lang, variant }: Props) {
  const L = lang === "es";
  const cta = CTA[variant][lang];
  const [listingPhotoFailed, setListingPhotoFailed] = useState(false);
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);
  const [showTranslated, setShowTranslated] = useState(false);

  const translatableContent = useMemo<TranslatableAdFields>(
    () => ({
      ...(model.title.trim() ? { title: model.title.trim() } : {}),
      ...(model.excerpt?.trim() ? { description: model.excerpt.trim() } : {}),
    }),
    [model.title, model.excerpt],
  );
  const displayTitle =
    showTranslated && translation?.translated.title?.trim()
      ? translation.translated.title.trim()
      : model.title;
  const displayExcerpt =
    showTranslated && translation?.translated.description?.trim()
      ? translation.translated.description.trim()
      : model.excerpt;

  useEffect(() => {
    setListingPhotoFailed(false);
  }, [model.id, model.imageUrl]);

  const chips = [
    model.typeChip,
    ...(model.secondaryChip ? model.secondaryChip.split(" · ").map((s) => s.trim()).filter(Boolean) : []),
  ].filter(Boolean) as string[];

  return (
    <article
      className="group flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-[#C9B46A]/35 bg-[#FFFCF7] shadow-[0_8px_28px_-18px_rgba(42,36,22,0.18)] ring-1 ring-[#C9B46A]/12 transition hover:border-[#C9B46A]/55 hover:shadow-[0_12px_36px_-20px_rgba(42,36,22,0.22)]"
      data-testid="community-discovery-listing-card"
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col sm:flex-row">
        <Link
          href={model.detailHref}
          className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#EDE8DF] sm:aspect-auto sm:h-auto sm:w-[min(44%,220px)] sm:min-h-[200px]"
          aria-label={`${cta}: ${model.title}`}
        >
          {/*
           Native <img> so Supabase Storage and other persisted URLs work in production without
           next/image remotePatterns. next/image optimizer rejects unknown hosts → blank panel.
          */}
          {model.imageUrl && !listingPhotoFailed ? (
            <img
              src={model.imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              data-testid="community-discovery-card-photo"
              className="absolute inset-0 h-full w-full object-contain p-3 transition duration-300 group-hover:scale-[1.02]"
              onError={() => setListingPhotoFailed(true)}
            />
          ) : (
            <>
              <img
                src={LISTING_IMAGE_FALLBACK}
                alt=""
                loading="lazy"
                decoding="async"
                data-testid="community-discovery-card-photo"
                className="absolute inset-0 h-full w-full object-contain object-center p-6 opacity-[0.92] transition duration-300 group-hover:scale-[1.02]"
              />
              {model.imageUrl && listingPhotoFailed ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#EDE8DF]/95 to-transparent px-3 pb-2 pt-8 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#5C564E]/90">
                    {L ? "Vista previa no disponible" : "Preview unavailable"}
                  </span>
                </div>
              ) : !model.imageUrl ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#EDE8DF]/95 to-transparent px-3 pb-2 pt-8 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#5C564E]/90">
                    {L ? "Sin foto del anuncio" : "No listing photo"}
                  </span>
                </div>
              ) : null}
            </>
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:p-4 sm:pl-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link href={model.detailHref} className="block min-w-0">
                <h3 className="line-clamp-2 text-base font-bold leading-snug text-[#1E1810] transition group-hover:text-[#A67C00] sm:text-[1.05rem]">
                  {displayTitle}
                </h3>
              </Link>
              {model.organizer ? (
                <p className="mt-1 line-clamp-1 text-sm font-medium text-[#5C564E]">{model.organizer}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              {model.costBadge ? (
                <span className="rounded-full bg-[#111111] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#FFFCF7]">
                  {model.costBadge}
                </span>
              ) : null}
              {model.title.trim() || model.excerpt?.trim() ? (
                <TranslateAdControl
                  siteLocale={lang}
                  originalLocale="unknown"
                  category={variant}
                  listingKey={`community-card:${model.id}`}
                  version="community-discovery-card-v1"
                  translatableContent={translatableContent}
                  onTranslated={(result) => {
                    setTranslation(result);
                    setShowTranslated(true);
                  }}
                  onShowOriginal={() => setShowTranslated(false)}
                  requestTranslation={requestAdTranslation}
                  className="w-fit"
                />
              ) : null}
            </div>
          </div>

          {model.locationLine ? (
            <p className="text-xs font-medium text-[#5C564E]">
              <span className="text-[#A67C00]" aria-hidden>
                ●
              </span>{" "}
              {model.locationLine}
            </p>
          ) : null}

          {chips.length ? (
            <div className="flex flex-wrap gap-1.5" data-testid="community-discovery-card-chips">
              {chips.map((c) => (
                <span key={c} className={CHIP}>
                  {c}
                </span>
              ))}
            </div>
          ) : null}

          {model.scheduleLine ? (
            <p className="line-clamp-2 text-[12px] font-medium leading-snug text-[#3d5a73]">
              {L ? "Horario: " : "Schedule: "}
              {model.scheduleLine}
            </p>
          ) : null}

          {model.excerpt ? (
            <p className="line-clamp-3 text-[13px] leading-relaxed text-[#4a453c]/95">{displayExcerpt}</p>
          ) : null}

          <div className="mt-auto flex pt-1">
            <Link
              href={model.detailHref}
              className="inline-flex min-h-[40px] min-w-0 items-center justify-center rounded-xl bg-[#E67E22] px-4 py-2 text-sm font-bold text-[#FFFCF7] shadow-sm transition hover:bg-[#d56f18]"
            >
              {cta}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
