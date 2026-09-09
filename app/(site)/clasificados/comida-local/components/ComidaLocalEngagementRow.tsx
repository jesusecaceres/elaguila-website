"use client";

/**
 * Globalization Build D (Gate D5/D22) — Save/Like/Share adoption for Comida Local, live-only.
 * Composes the three EXISTING shared engagement buttons (LeonixLikeButton/LeonixSaveButton/
 * LeonixShareButton) with the new Comida Local G2A trackers (comidaLocalAnalytics.ts) — same
 * shape as the EnVentaEngagementRow reference pattern. No new engagement engine.
 */

import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { resolveListingsTableSavedListingKey } from "@/app/lib/listingSaveDbKey";
import {
  trackComidaLocalLikeGlobal,
  trackComidaLocalSaveGlobal,
  trackComidaLocalShareGlobal,
} from "@/app/lib/clasificados/comida-local/comidaLocalAnalytics";

const btnShell =
  "max-w-none w-auto [&>button]:min-h-[40px] [&>button]:rounded-lg [&>button]:border [&>button]:border-[#D4C4A8]/70 [&>button]:bg-[#FDF8F0] [&>button]:px-3 [&>button]:py-2 [&>button]:text-xs [&>button]:font-semibold [&>button]:text-[#1E1814] [&>button]:shadow-none";

export function ComidaLocalEngagementRow({
  listingId,
  leonixAdId,
  listingUrl,
  listingTitle,
  ownerUserId,
  lang,
}: {
  listingId: string;
  leonixAdId?: string | null;
  listingUrl?: string;
  listingTitle?: string;
  ownerUserId?: string | null;
  lang: "es" | "en";
}) {
  const id = listingId.trim();
  if (!id) return null;
  const saveKey = resolveListingsTableSavedListingKey(id, id);
  const ctx = { listingId: id, leonixAdId };

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <LeonixLikeButton
        listingId={id}
        ownerUserId={ownerUserId}
        variant="small"
        lang={lang}
        category="comida-local"
        persistEngagement
        recordLikeEvent={(isLike) => trackComidaLocalLikeGlobal(ctx, isLike)}
        className={btnShell}
      />
      <LeonixSaveButton
        listingId={id}
        savedListingKey={saveKey}
        ownerUserId={ownerUserId}
        variant="small"
        lang={lang}
        category="comida-local"
        persistEngagement
        recordSaveEvent={(isSave) => trackComidaLocalSaveGlobal(ctx, isSave)}
        iconStyle="bookmark"
        className={btnShell}
      />
      <LeonixShareButton
        listingId={id}
        listingUrl={listingUrl}
        listingTitle={listingTitle}
        lang={lang}
        variant="small"
        category="comida-local"
        ownerUserId={ownerUserId}
        persistEngagement
        recordShareEvent={(shareMethod) => trackComidaLocalShareGlobal(ctx, shareMethod)}
        className={btnShell}
      />
    </div>
  );
}
