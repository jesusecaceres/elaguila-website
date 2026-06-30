"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { formatLeonixAdId } from "@/app/(site)/clasificados/community/shared/communityLeonixAdId";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const RAIL_CARD =
  "rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]";

const COPY = {
  es: {
    actionsTitle: "Acciones",
    share: "Compartir",
    copyLink: "Copiar enlace",
    copyInfo: "Copiar info",
    organizedBy: "Organizado por",
    adId: "ID de anuncio",
    previewNote:
      "Vista previa: compartir, copiar enlace y copiar info estarán disponibles cuando publiques el anuncio.",
    views: "personas vieron este anuncio",
    viewsToday: "visitas hoy",
  },
  en: {
    actionsTitle: "Actions",
    share: "Share",
    copyLink: "Copy link",
    copyInfo: "Copy info",
    organizedBy: "Organized by",
    adId: "Ad ID",
    previewNote: "Preview: share, copy link, and copy info will be available after you publish.",
    views: "people viewed this listing",
    viewsToday: "views today",
  },
} as const;

type Props = {
  lang: Lang;
  mode: "preview" | "published";
  organizerName: string;
  listingId?: string;
  isOwner?: boolean;
  onShare?: () => void;
  onCopyLink?: () => void;
  onCopyInfo?: () => void;
};

export function CommunityQuickPublicDetailSidebar({
  lang,
  mode,
  organizerName,
  listingId,
  isOwner = false,
  onShare,
  onCopyLink,
  onCopyInfo,
}: Props) {
  const t = COPY[lang];
  const isPreview = mode === "preview";
  const leonixAdId = !isPreview ? formatLeonixAdId(listingId) : null;

  const [viewCount, setViewCount] = useState<number | null>(null);
  const [viewsToday, setViewsToday] = useState<number | null>(null);

  useEffect(() => {
    if (isPreview || !listingId) return;
    fetch(`/api/clasificados/listings/${encodeURIComponent(listingId)}/views`)
      .then((res) => res.json())
      .then((data: { count?: number; todayCount?: number }) => {
        setViewCount(typeof data.count === "number" ? data.count : 0);
        setViewsToday(typeof data.todayCount === "number" ? data.todayCount : 0);
      })
      .catch(() => {
        setViewCount(0);
        setViewsToday(0);
      });
  }, [isPreview, listingId]);

  return (
    <>
      {!isPreview && viewCount !== null ? (
        <div className={cx(RAIL_CARD, "p-4 space-y-1")}>
          <p className="text-sm text-[#111111]">
            👁 {viewCount} {t.views}
          </p>
          {viewsToday !== null && viewsToday >= 0 ? (
            <p className="text-sm text-[#111111]">
              🔥 {viewsToday} {t.viewsToday}
            </p>
          ) : null}
        </div>
      ) : null}

      {leonixAdId ? (
        <div className={cx(RAIL_CARD, "p-4")} data-testid="community-public-ad-id">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#111111]/65">{t.adId}</p>
          <p className="mt-1 select-all font-mono text-sm font-bold text-[#111111]">{leonixAdId}</p>
        </div>
      ) : null}

      <div className={cx(RAIL_CARD, "p-6")} data-testid="community-quick-sidebar-actions">
        <div className="text-xl font-bold text-[#111111]">{t.actionsTitle}</div>

        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={onShare}
            className="w-full px-5 py-3 rounded-full font-semibold transition border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]/40 text-[#111111] hover:bg-[#D9D9D9]/55"
          >
            {t.share}
          </button>

          <button
            type="button"
            onClick={onCopyLink}
            className="w-full px-5 py-3 rounded-full font-semibold transition border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]/40 text-[#111111] hover:bg-[#D9D9D9]/55"
          >
            {t.copyLink}
          </button>

          <button
            type="button"
            onClick={onCopyInfo}
            className="w-full px-5 py-3 rounded-full font-semibold transition border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]/40 text-[#111111] hover:bg-[#D9D9D9]/55"
          >
            {t.copyInfo}
          </button>

          {!isPreview && isOwner ? (
            <Link
              href={`/dashboard/mis-anuncios?lang=${lang}`}
              className="flex w-full items-center justify-center rounded-full border border-[#A98C2A]/55 bg-[#FFFCF7] px-5 py-3 text-center text-sm font-semibold text-[#2A2626] transition hover:bg-[#F4EBD8]"
            >
              {lang === "es" ? "Gestionar anuncio" : "Manage listing"}
            </Link>
          ) : null}

          {isPreview ? <p className="text-xs text-[#111111]/75 pt-1">{t.previewNote}</p> : null}
        </div>
      </div>

      {organizerName.trim() ? (
        <div className={cx("seller-card", RAIL_CARD, "p-6")} data-testid="community-quick-sidebar-organizer">
          <h4 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide mb-2">{t.organizedBy}</h4>
          <p className="text-base font-bold text-[#111111]">{organizerName.trim()}</p>
          <p className="mt-3 text-xs leading-relaxed text-[#111111]/70">
            {lang === "es"
              ? "Teléfono, mensajes, correo y mapa están en la sección de contacto debajo del volante."
              : "Phone, messages, email, and map are in the contact section below the flyer."}
          </p>
        </div>
      ) : null}
    </>
  );
}
