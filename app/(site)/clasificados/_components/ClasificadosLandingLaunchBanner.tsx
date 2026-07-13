"use client";

import { LeonixLaunchCouponCard } from "@/app/components/leonix/LeonixLaunchCouponCard";
import { launchUiCopyLang, type SupportedLang } from "@/app/lib/language";
import { buildClasificadosLandingNewsletterHref } from "../_lib/clasificadosLandingHubCopy";

type Props = {
  routeLang: SupportedLang;
};

export function ClasificadosLandingLaunchBanner({ routeLang }: Props) {
  const cardLang = launchUiCopyLang(routeLang);
  const href = buildClasificadosLandingNewsletterHref(routeLang);

  return (
    <LeonixLaunchCouponCard
      lang={cardLang}
      variant="public"
      href={href}
      openInNewTab
      finePrintMode="full"
    />
  );
}
