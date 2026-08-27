"use client";

/**
 * Item 21 (Final Completion) — professional-only Community Trust adoption for BR Negocio and
 * Rentas Negocio. Never mount this in a BR Privado / Rentas Privado surface.
 *
 * Resolves the durable per-(owner, category) professional-identity target id (never a
 * disposable listing id — see leonixProfessionalIdentityServer.ts) and renders the shared
 * <LeonixCommunityTrust> widget once resolved. Renders nothing (no fetch even attempted) while
 * `isLeonixEndorsementCategoryLive(category)` is false — which it is today, since the
 * supporting migration is prepared but not yet applied. Flipping that one flag after the
 * migration lands is the only change needed to turn this on; no other code changes.
 */
import { useEffect, useState } from "react";
import { LeonixCommunityTrust } from "@/app/components/leonixCommunityTrust/LeonixCommunityTrust";
import { isLeonixEndorsementCategoryLive } from "@/app/lib/leonixCommunityTrust/leonixEndorsementRegistry";
import { fetchLeonixProfessionalIdentityId } from "@/app/lib/leonixCommunityTrust/leonixProfessionalIdentityClient";
import type { BrRentasCommunityTrustCategory } from "@/app/lib/leonixCommunityTrust/leonixProfessionalIdentityServer";

export function BrRentasCommunityTrustSection({
  category,
  ownerId,
  displayName,
  lang,
  surface,
}: {
  category: BrRentasCommunityTrustCategory;
  /** The listing owner's auth user id — the durable identity anchor, never the listing id. */
  ownerId: string | null | undefined;
  displayName?: string | null;
  lang: "es" | "en";
  surface: string;
}) {
  const [targetId, setTargetId] = useState<string | null>(null);

  useEffect(() => {
    setTargetId(null);
    if (!isLeonixEndorsementCategoryLive(category)) return;
    const trimmedOwnerId = ownerId?.trim();
    if (!trimmedOwnerId) return;
    let cancelled = false;
    (async () => {
      const result = await fetchLeonixProfessionalIdentityId(category, trimmedOwnerId, displayName);
      if (!cancelled && result.ok) setTargetId(result.id);
    })();
    return () => {
      cancelled = true;
    };
  }, [category, ownerId, displayName]);

  if (!isLeonixEndorsementCategoryLive(category) || !targetId) return null;

  return (
    <LeonixCommunityTrust
      category={category}
      targetId={targetId}
      ownerUserId={ownerId ?? null}
      lang={lang}
      surface={surface}
    />
  );
}
