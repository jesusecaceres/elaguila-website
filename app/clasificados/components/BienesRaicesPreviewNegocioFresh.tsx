"use client";

import type { ListingData } from "./ListingView";

export type BienesRaicesPreviewNegocioFreshProps = {
  listing: ListingData;
};

export default function BienesRaicesPreviewNegocioFresh({ listing }: BienesRaicesPreviewNegocioFreshProps) {
  void listing;
  return <div>BR negocio preview reset</div>;
}
