"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { BuscoRequestCardModel } from "./shared/buscoCardModel";

const LISTING_IMAGE_FALLBACK = "/logo.png";

const CTA = { es: "Ver solicitud", en: "View request" } as const;

type Props = {
  model: BuscoRequestCardModel;
  lang: Lang;
};

export function BuscoRequestCard({ model, lang }: Props) {
  const L = lang === "es";
  const cta = CTA[lang];
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    setPhotoFailed(false);
  }, [model.id, model.imageUrl]);

  return (
    <article
      className="group flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-[#B8C8EA]/40 bg-[#FFFCF7] shadow-[0_8px_28px_-18px_rgba(42,36,22,0.18)] ring-1 ring-[#B8C8EA]/15 transition hover:border-[#B8C8EA]/60 hover:shadow-[0_12px_36px_-20px_rgba(42,36,22,0.22)]"
      data-testid="busco-request-card"
    >
      <BuscoCardLayout
        model={model}
        lang={lang}
        L={L}
        cta={cta}
        photoFailed={photoFailed}
        onPhotoError={() => setPhotoFailed(true)}
      />
    </article>
  );
}

function BuscoCardLayout({
  model,
  lang,
  L,
  cta,
  photoFailed,
  onPhotoError,
}: {
  model: BuscoRequestCardModel;
  lang: Lang;
  L: boolean;
  cta: string;
  photoFailed: boolean;
  onPhotoError: () => void;
}) {
  return (
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
            data-testid="busco-card-photo"
            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            onError={onPhotoError}
          />
        ) : (
          <img
            src={LISTING_IMAGE_FALLBACK}
            alt=""
            loading="lazy"
            decoding="async"
            data-testid="busco-card-photo"
            className="absolute inset-0 h-full w-full object-contain object-center p-6 opacity-[0.92]"
          />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:p-4 sm:pl-3">
        <div className="flex flex-wrap items-start gap-2">
          <span className="inline-flex max-w-full truncate rounded-full bg-[#D7E3F7] px-2.5 py-0.5 text-[11px] font-semibold text-[#1E3A5F]">
            {model.typeBadge}
          </span>
          {model.contactChip ? (
            <span className="inline-flex max-w-full truncate rounded-full border border-[#B8C8EA]/45 bg-[#F8FAFF] px-2.5 py-0.5 text-[10px] font-semibold text-[#3d5a73]">
              {model.contactChip}
            </span>
          ) : null}
        </div>

        <Link href={model.detailHref} className="block min-w-0">
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-[#1E1810] transition group-hover:text-[#1E3A5F] sm:text-[1.05rem]">
            {model.title}
          </h3>
        </Link>

        {model.locationLine ? (
          <p className="line-clamp-2 text-xs font-medium text-[#5C5346]">{model.locationLine}</p>
        ) : null}

        {model.budget ? (
          <p className="text-xs text-[#2a241c]/85">
            <span className="font-semibold">{L ? "Presupuesto:" : "Budget:"}</span> {model.budget}
          </p>
        ) : null}

        {model.excerpt ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-[#2a241c]/85">{model.excerpt}</p>
        ) : null}

        {model.leonixAdId ? (
          <p className="font-mono text-[10px] text-[#3d5a73]/90">{model.leonixAdId}</p>
        ) : null}

        <BuscoCardCta href={model.detailHref} cta={cta} />
      </div>
    </div>
  );
}

function BuscoCardCta({ href, cta }: { href: string; cta: string }) {
  return (
    <div className="mt-auto pt-2">
      <Link
        href={href}
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#111111] px-4 py-2.5 text-sm font-semibold text-[#F5F5F5] transition hover:opacity-95 sm:w-auto sm:min-w-[10.5rem]"
      >
        {cta}
      </Link>
    </div>
  );
}
