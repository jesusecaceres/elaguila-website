"use client";

import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";

type Props = {
  lang: Lang;
  listingId: string;
  ownerUserId?: string | null;
  listingTitle: string;
  shareUrl: string;
  persistEngagement: boolean;
};

export function EmpleosClasificadosEngagementRow({
  lang,
  listingId,
  ownerUserId,
  listingTitle,
  shareUrl,
  persistEngagement,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-[#E8DFD0] pt-4">
      <LeonixLikeButton
        listingId={listingId}
        ownerUserId={ownerUserId ?? undefined}
        variant="small"
        lang={lang}
        category="empleos"
        persistEngagement={persistEngagement}
      />
      <LeonixSaveButton
        listingId={listingId}
        ownerUserId={ownerUserId ?? undefined}
        variant="small"
        lang={lang}
        category="empleos"
        persistEngagement={persistEngagement}
      />
      <LeonixShareButton
        listingId={listingId}
        ownerUserId={ownerUserId ?? undefined}
        listingTitle={listingTitle}
        listingUrl={shareUrl}
        variant="small"
        lang={lang}
        category="empleos"
        persistEngagement={persistEngagement}
      />
    </div>
  );
}
