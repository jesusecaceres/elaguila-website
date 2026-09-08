"use client";

import type { SupportedLang } from "@/app/lib/language";

type Props = {
  routeLang: SupportedLang;
};

/**
 * The Launch 25 (25% off) campaign this banner advertised has been retired.
 * Left as a no-op so its single call site in negocios-locales/page.tsx does
 * not need to change; renders nothing.
 */
export function NegociosLocalesLaunchBanner({ routeLang: _routeLang }: Props) {
  return null;
}
