"use client";

import { useMemo } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { comunidadPublishedQuickToDraft, type ComunidadPublishedListingLike } from "../lib/comunidadPublishedQuickToDraft";
import { ComunidadQuickAdCanvas } from "./ComunidadQuickAdCanvas";

type Props = {
  lang: Lang;
  listing: ComunidadPublishedListingLike & { detailPairs?: unknown };
};

export function ComunidadPublishedQuickAd({ listing, lang }: Props) {
  const draft = useMemo(() => comunidadPublishedQuickToDraft(listing.detailPairs, listing, lang), [listing, lang]);
  if (!draft) return null;
  return (
    <ComunidadQuickAdCanvas
      draft={draft}
      lang={lang}
      shell="embedded"
      contactSectionId="contact-actions"
      heroTestId="community-anuncio-hero"
    />
  );
}
