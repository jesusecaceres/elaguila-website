"use client";

import { useMemo } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { BuscoQuickAdCanvas } from "@/app/(site)/publicar/busco/components/BuscoQuickAdCanvas";
import { buscoViewModelFromPublished } from "@/app/(site)/publicar/busco/shared/buscoQuickAdViewModel";

export type BuscoPublishedListingLike = {
  id: string;
  title: { es: string; en: string };
  city: string;
  blurb: { es: string; en: string };
  images?: string[] | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  detailPairs?: unknown;
};

export function BuscoQuickPublishedAd({ listing, lang }: { listing: BuscoPublishedListingLike; lang: Lang }) {
  const vm = useMemo(() => buscoViewModelFromPublished(listing, lang), [listing, lang]);

  return (
    <BuscoQuickAdCanvas
      vm={vm}
      lang={lang}
      shell="embedded"
      contactSectionId="busco-contact-actions"
    />
  );
}
