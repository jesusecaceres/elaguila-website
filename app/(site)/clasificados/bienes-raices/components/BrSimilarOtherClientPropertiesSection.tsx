"use client";

import { useEffect, useState } from "react";
import {
  fetchBrSimilarOtherClientListingsForDetail,
  type BrSimilarLane,
} from "../lib/fetchBrSimilarOtherClientListingsBrowser";
import { BrSimilarOtherClientProperties } from "./BrSimilarOtherClientProperties";
import type { BrPropertyInventoryLang } from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import type { BrNegocioListing } from "../resultados/cards/listingTypes";

export function BrSimilarOtherClientPropertiesSection({
  listingId,
  excludeGroupId,
  excludeOwnerId,
  city,
  price,
  propertyType,
  lang,
  lane,
  operation,
  bedrooms,
  bathrooms,
}: {
  listingId: string;
  excludeGroupId?: string | null;
  excludeOwnerId?: string | null;
  city?: string | null;
  price?: number | null;
  propertyType?: string | null;
  lang: BrPropertyInventoryLang;
  /** Gate BIENES-PRIVADO-2 — omitted keeps the original Negocio behavior exactly. */
  lane?: BrSimilarLane;
  operation?: "venta" | "renta" | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
}) {
  const [listings, setListings] = useState<BrNegocioListing[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const rows = await fetchBrSimilarOtherClientListingsForDetail({
        currentListingId: listingId,
        excludeGroupId,
        excludeOwnerId,
        city,
        price,
        propertyType,
        lane,
        operation,
        bedrooms,
        bathrooms,
        lang,
        limit: 6,
      });
      if (!cancelled) {
        setListings(rows);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId, excludeGroupId, excludeOwnerId, city, price, propertyType, lane, operation, bedrooms, bathrooms, lang]);

  if (loaded && !listings.length) return null;

  return (
    <BrSimilarOtherClientProperties
      listings={listings}
      lang={lang}
      loading={!loaded}
      sourceListingId={listingId}
      lane={lane}
    />
  );
}
