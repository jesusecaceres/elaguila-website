"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { resolveClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { RENTAS_LANDING_COPY } from "@/app/clasificados/rentas/rentasLandingCopy";
import type { RentasLandingLang } from "@/app/(site)/clasificados/rentas/rentasLandingLang";
import type { SupportedLang } from "@/app/lib/language";

export function useRentasLandingLang(): {
  lang: RentasLandingLang;
  routeLang: SupportedLang;
  copy: (typeof RENTAS_LANDING_COPY)["es"];
} {
  const searchParams = useSearchParams();
  const { routeLang, copyLang } = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")),
    [searchParams],
  );
  const copy = RENTAS_LANDING_COPY[copyLang];
  return { lang: copyLang, routeLang, copy };
}
