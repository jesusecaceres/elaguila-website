"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { MascotasPerdidosNoticeCardModel } from "./shared/mascotasPerdidosCardModel";

const LISTING_IMAGE_FALLBACK = "/logo.png";

const CTA = { es: "Ver aviso", en: "View notice" } as const;

const LABELS = {
  es: { city: "Ciudad", lastSeen: "Última ubicación vista / lugar", leonix: "Leonix Ad ID" },
  en: { city: "City", lastSeen: "Last seen / location", leonix: "Leonix Ad ID" },
} as const;

type Props = {
  model: MascotasPerdidosNoticeCardModel;
  lang: Lang;
};

export function MascotasPerdidosNoticeCard({ model, lang }: Props) {
  const t = LABELS[lang];
  const cta = CTA[lang];
  const [photoFailed, setPhotoFailed] = useState(false);

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
        </Link>

        <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:pl-3">
          <span className="inline-flex max-w-full truncate rounded-full bg-[#EDE8DF] px-2.5 py-0.5 text-[11px] font-semibold text-[#3D3428]">
            {model.typeBadge}
          </span>

          <Link href={model.detailHref} className="block min-w-0">
            <h3 className="line-clamp-2 text-base font-bold leading-snug text-[#1E1810] transition group-hover:text-[#6B5A32] sm:text-[1.05rem]">
              {model.title}
            </h3>
          </Link>

          {model.city ? (
            <p className="line-clamp-2 text-xs font-medium text-[#5C5346]">
              <span className="font-semibold">{t.city}:</span> {model.city}
            </p>
          ) : null}

          {model.lastSeenLocation ? (
            <p className="line-clamp-2 text-xs text-[#2a241c]/85">
              <span className="font-semibold">{t.lastSeen}:</span> {model.lastSeenLocation}
            </p>
          ) : null}

          {model.excerpt ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-[#2a241c]/85">{model.excerpt}</p>
          ) : null}

          {model.leonixAdId ? (
            <p className="font-mono text-[10px] text-[#6B5A32]/90" data-testid="mascotas-perdidos-card-leonix-id">
              {t.leonix}: {model.leonixAdId}
            </p>
          ) : null}

          <div className="mt-auto pt-2">
            <Link
              href={model.detailHref}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#111111] px-4 py-2.5 text-sm font-semibold text-[#F5F5F5] transition hover:opacity-95 sm:w-auto sm:min-w-[10.5rem]"
            >
              {cta}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
