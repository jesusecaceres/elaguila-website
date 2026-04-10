"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { RENTAS_LANDING_COPY } from "@/app/clasificados/rentas/rentasLandingCopy";
import { normalizeRentasLandingLang, type RentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";

export function useRentasLandingLang(): {
  lang: RentasLandingLang;
  copy: (typeof RENTAS_LANDING_COPY)["es"];
} {
  const searchParams = useSearchParams();
  const lang = useMemo(
    () => normalizeRentasLandingLang(searchParams?.get("lang")),
    [searchParams],
  );
  const copy = RENTAS_LANDING_COPY[lang];
  return { lang, copy };
}
