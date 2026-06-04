"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { RENTAS_LANDING_COPY } from "@/app/clasificados/rentas/rentasLandingCopy";
import { normalizeRentasLandingLang, resolveRentasRouteLang, type RentasLandingLang } from "@/app/(site)/clasificados/rentas/rentasLandingLang";
import type { SupportedLang } from "@/app/lib/language";

export function useRentasLandingLang(): {
  lang: RentasLandingLang;
  routeLang: SupportedLang;
  copy: (typeof RENTAS_LANDING_COPY)["es"];
} {
  const searchParams = useSearchParams();
  const routeLang = useMemo(
    () => resolveRentasRouteLang(searchParams?.get("lang")),
    [searchParams],
  );
  const lang = useMemo(() => normalizeRentasLandingLang(searchParams?.get("lang")), [searchParams]);
  const copy = RENTAS_LANDING_COPY[lang];
  return { lang, routeLang, copy };
}
