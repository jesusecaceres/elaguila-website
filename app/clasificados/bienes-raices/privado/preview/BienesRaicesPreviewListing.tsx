"use client";

import type { ListingData } from "@/app/clasificados/components/ListingView";

export type BienesRaicesPreviewListingProps = {
  listing: ListingData;
};

export default function BienesRaicesPreviewListing({ listing }: BienesRaicesPreviewListingProps) {
  void listing;
  return <div>BR privado preview reset</div>;
}
