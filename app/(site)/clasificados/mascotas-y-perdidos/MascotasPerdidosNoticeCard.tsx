"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { MascotasPerdidosNoticeCardModel } from "./shared/mascotasPerdidosCardModel";

const LISTING_IMAGE_FALLBACK = "/logo.png";

const CTA = { es: "Ver aviso", en: "View notice" } as const;

const LABELS = {
  es: { city: "Ciudad" },
  en: { city: "City" },
} as const;

/** Gate 3 Section U — category-owned status treatments, Leonix brand language, accessible contrast. */
const STATUS_BADGE: Record<string, { es: string; en: string; className: string }> = {
  "mascota-perdida": { es: "PERDIDA", en: "LOST", className: "border-[#7A1E2C]/50 bg-[#F7E3E6] text-[#7A1E2C]" },
  "mascota-encontrada": { es: "ENCONTRADA", en: "FOUND", className: "border-emerald-900/40 bg-[#E8F3EA] text-[#1B4332]" },
  "adopcion-mascota": { es: "ADOPCIÓN", en: "ADOPTION", className: "border-[#8A6B1F]/45 bg-[#FBF3DA] text-[#6B5310]" },
  "objeto-perdido": { es: "OBJETO PERDIDO", en: "LOST ITEM", className: "border-[#5C5346]/45 bg-[#EDE8DF] text-[#3D3428]" },
  "objeto-encontrado": { es: "OBJETO ENCONTRADO", en: "FOUND ITEM", className: "border-emerald-900/40 bg-[#E8F3EA] text-[#1B4332]" },
};

type Props = {
  model: MascotasPerdidosNoticeCardModel;
  lang: Lang;
};

export function MascotasPerdidosNoticeCard({ model, lang }: Props) {
  const t = LABELS[lang];
  const cta = CTA[lang];
  const [photoFailed, setPhotoFailed] = useState(false);
  const badge = STATUS_BADGE[model.noticeType];

  useEffect(() => {
    setPhotoFailed(false);
  }, [model.id, model.imageUrl]);

  return (
    <article
      className="group flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-[#C9B46A]/40 bg-[#FFFCF7] shadow-[0_8px_28px_-18px_rgba(42,36,22,0.18)] ring-1 ring-[#C9B46A]/15 transition hover:border-[#C9B46A]/55 hover:shadow-[0_12px_36px_-20px_rgba(42,36,22,0.22)]"
      data-testid="mascotas-perdidos-notice-card"
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col sm:flex-row">
        <Link
          href={model.detailHref}
          className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#EDE8DF] sm:aspect-auto sm:h-auto sm:w-[min(44%,220px)] sm:min-h-[180px]"
          aria-label={`${cta}: ${model.title}`}
        >
          {model.imageUrl && !photoFailed ? (
            <img
              src={model.imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              data-testid="mascotas-perdidos-card-photo"
              className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              onError={() => setPhotoFailed(true)}
            />
          ) : (
            <img
              src={LISTING_IMAGE_FALLBACK}
              alt=""
              loading="lazy"
              decoding="async"
              data-testid="mascotas-perdidos-card-photo"
              className="absolute inset-0 h-full w-full object-contain object-center p-6 opacity-[0.92]"
            />
          )}
          <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1.5">
            {badge ? (
              <span className={`rounded-full border-2 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide shadow-sm backdrop-blur-sm ${badge.className}`}>
                {lang === "en" ? badge.en : badge.es}
              </span>
            ) : null}
            {model.reward ? (
              <span className="rounded-full border-2 border-[#B8860B]/60 bg-[#FFF3C4]/95 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#6B4E00] shadow-sm">
                {model.reward}
              </span>
            ) : null}
          </div>
        </Link>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4 sm:pl-3">
          <Link href={model.detailHref} className="block min-w-0">
            <h3 className="line-clamp-2 text-base font-bold leading-snug text-[#1E1810] transition group-hover:text-[#6B5A32] sm:text-[1.05rem]">
              {model.title}
            </h3>
          </Link>

          {model.keyFact ? <p className="line-clamp-1 text-xs font-medium text-[#5C5346]">{model.keyFact}</p> : null}

          {model.city ? (
            <p className="line-clamp-1 text-xs text-[#2a241c]/85">
              <span className="font-semibold">{t.city}:</span> {model.city}
              {model.lastSeenLocation ? ` · ${model.lastSeenLocation}` : ""}
              {model.dateLabel ? ` · ${model.dateLabel}` : ""}
            </p>
          ) : null}

          {model.excerpt ? <p className="line-clamp-2 text-sm leading-relaxed text-[#2a241c]/85">{model.excerpt}</p> : null}

          <div className="mt-auto pt-2">
            <Link
              href={model.detailHref}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-[#FFFCF7] transition hover:opacity-95 sm:w-auto sm:min-w-[10.5rem]"
            >
              {cta}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
