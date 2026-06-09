"use client";

import { useEffect, useState } from "react";
import { fetchBrRelatedInventoryListingsForDetail } from "../lib/fetchBrRelatedInventoryListingsBrowser";
import { RelatedBrAgentProperties } from "./RelatedBrAgentProperties";
import type { BrPropertyInventoryLang } from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import type { BrNegocioListing } from "../resultados/cards/listingTypes";

export function BrRelatedAgentPropertiesSection({
  listingId,
  ownerId,
  brInventoryGroupId,
  brInventoryParentListingId,
  currentInventoryRole,
  sellerType,
  lang,
}: {
  listingId: string;
  ownerId?: string | null;
  brInventoryGroupId?: string | null;
  brInventoryParentListingId?: string | null;
  currentInventoryRole?: string | null;
  sellerType?: string | null;
  lang: BrPropertyInventoryLang;
}) {
  const [listings, setListings] = useState<BrNegocioListing[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const rows = await fetchBrRelatedInventoryListingsForDetail({
        currentListingId: listingId,
        ownerId,
        brInventoryGroupId,
        brInventoryParentListingId,
        currentInventoryRole,
        lang,
        limit: 6,
      });
      if (!cancelled) setListings(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId, ownerId, brInventoryGroupId, brInventoryParentListingId, currentInventoryRole, lang]);

  return (
    <RelatedBrAgentProperties
      listings={listings}
      lang={lang}
      groupId={brInventoryGroupId ?? undefined}
      brokerage={sellerType === "business"}
    />
  );
}
