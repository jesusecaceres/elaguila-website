"use client";

import { useCallback } from "react";

import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { trackListingShare } from "@/app/lib/clasificadosAnalytics";

type Props = {
  listingId: string;
  lang: Lang;
  category: "clases" | "comunidad";
  ownerUserId?: string | null;
};

export function CommunityResultCardEngagement({ listingId, lang, category, ownerUserId }: Props) {
  const L = lang === "es";

  const onShare = useCallback(async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/clasificados/anuncio/${encodeURIComponent(listingId)}?lang=${lang}`
        : "";
    try {
      const nav = typeof navigator !== "undefined" ? navigator : null;
      const shareFn = nav && typeof (nav as { share?: unknown }).share === "function" ? (nav as { share: (o: unknown) => Promise<void> }).share : null;
      if (shareFn) {
        await shareFn({ title: document.title, url });
      } else if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        alert(L ? "Enlace copiado" : "Link copied");
      }
      void trackListingShare(listingId, {
        category,
        ownerUserId: ownerUserId ?? undefined,
        eventSource: "search_results",
        shareMethod: "community_results_card",
      });
    } catch {
      /* ignore */
    }
  }, [L, category, lang, listingId, ownerUserId]);

  return (
    <div className="flex flex-wrap items-center gap-1 border-t border-black/5 bg-[#FFFCF7] px-2 py-2">
      <button
        type="button"
        className="rounded-lg border border-black/10 bg-white px-2 py-1 text-[11px] font-semibold text-[#111111] hover:bg-[#F5F5F5]"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void onShare();
        }}
      >
        {L ? "Compartir" : "Share"}
      </button>
      <div onClick={(e) => e.stopPropagation()} className="inline-flex">
        <LeonixSaveButton
          listingId={listingId}
          lang={lang}
          category={category}
          ownerUserId={ownerUserId ?? undefined}
          variant="small"
          persistEngagement
        />
      </div>
      <div onClick={(e) => e.stopPropagation()} className="inline-flex">
        <LeonixLikeButton
          listingId={listingId}
          lang={lang}
          category={category}
          ownerUserId={ownerUserId ?? undefined}
          variant="small"
          persistEngagement
        />
      </div>
    </div>
  );
}
