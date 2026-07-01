"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { formatLeonixAdId } from "@/app/(site)/clasificados/community/shared/communityLeonixAdId";

const COPY = {
  es: {
    share: "Compartir",
    copyLink: "Copiar enlace",
    copyInfo: "Copiar info",
    adId: "ID de anuncio",
    previewNote: "Compartir y copiar estarán disponibles al publicar.",
    views: "personas vieron este anuncio",
    manage: "Gestionar anuncio",
  },
  en: {
    share: "Share",
    copyLink: "Copy link",
    copyInfo: "Copy info",
    adId: "Ad ID",
    previewNote: "Share and copy will be available after publishing.",
    views: "people viewed this listing",
    manage: "Manage listing",
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

const BTN =
  "inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#D6C7AD]/80 bg-[#FFFDF7] px-3.5 py-2 text-xs font-semibold text-[#5C564E] shadow-sm transition hover:bg-[#F5EDD8] hover:text-[#3D3428]";

export function CommunityQuickPublicDetailSidebar({
  lang,
  mode,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  organizerName: _organizerName,
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

  useEffect(() => {
    if (isPreview || !listingId) return;
    fetch(`/api/clasificados/listings/${encodeURIComponent(listingId)}/views`)
      .then((res) => res.json())
      .then((data: { count?: number }) => {
        setViewCount(typeof data.count === "number" ? data.count : 0);
      })
      .catch(() => setViewCount(0));
  }, [isPreview, listingId]);

  if (isPreview) {
    return (
      <p className="text-center text-xs text-[#8A8278]">{t.previewNote}</p>
    );
  }

  return (
    <div
      className="rounded-xl border border-[#D6C7AD]/60 bg-[#FFFDF7] p-4 shadow-[0_8px_24px_-16px_rgba(31,36,28,0.15)]"
      data-testid="community-quick-sidebar-actions"
    >
      <div className="flex flex-wrap items-center gap-2">
        {onShare ? (
          <button type="button" onClick={onShare} className={BTN}>
            {t.share}
          </button>
        ) : null}
        {onCopyLink ? (
          <button type="button" onClick={onCopyLink} className={BTN}>
            {t.copyLink}
          </button>
        ) : null}
        {onCopyInfo ? (
          <button type="button" onClick={onCopyInfo} className={BTN}>
            {t.copyInfo}
          </button>
        ) : null}
        {isOwner ? (
          <Link
            href={`/dashboard/mis-anuncios?lang=${lang}`}
            className={BTN}
          >
            {t.manage}
          </Link>
        ) : null}
        {viewCount !== null && viewCount > 0 ? (
          <span className="ml-auto text-xs text-[#8A8278]">
            👁 {viewCount} {t.views}
          </span>
        ) : null}
        {leonixAdId ? (
          <span
            className="select-all font-mono text-[10px] text-[#9A948C]"
            data-testid="community-public-ad-id"
          >
            {leonixAdId}
          </span>
        ) : null}
      </div>
    </div>
  );
}
