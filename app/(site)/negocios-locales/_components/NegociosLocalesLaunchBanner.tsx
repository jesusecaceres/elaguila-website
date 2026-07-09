"use client";

import { LeonixLaunchCouponCard } from "@/app/components/leonix/LeonixLaunchCouponCard";
import type { SupportedLang } from "@/app/lib/language";
import { buildNegociosLocalesNewsletterHref } from "../_lib/negociosLocalesLandingHubCopy";

type Props = {
  routeLang: SupportedLang;
};

export function NegociosLocalesLaunchBanner({ routeLang }: Props) {
  const cardLang: "es" | "en" = routeLang === "en" ? "en" : "es";
  const href = buildNegociosLocalesNewsletterHref(routeLang);

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
