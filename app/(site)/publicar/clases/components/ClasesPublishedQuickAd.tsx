"use client";

import { useMemo } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { clasesPublishedQuickToDraft, type ClasesPublishedListingLike } from "../lib/clasesPublishedQuickToDraft";
import { ClasesQuickAdCanvas } from "./ClasesQuickAdCanvas";

type Props = {
  lang: Lang;
  listing: ClasesPublishedListingLike & { detailPairs?: unknown };
};

export function ClasesPublishedQuickAd({ listing, lang }: Props) {
  const draft = useMemo(() => clasesPublishedQuickToDraft(listing.detailPairs, listing, lang), [listing, lang]);
  if (!draft) return null;
  return (
    <ClasesQuickAdCanvas
      draft={draft}
      lang={lang}
      shell="embedded"
      contactSectionId="contact-actions"
      heroTestId="community-anuncio-hero"
    />
  );
}
