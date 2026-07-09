"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { resolveClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";

export type OfertasLocalesAppLang = "es" | "en";

/** UI copy lang (ES/EN fallback). */
export function useOfertasLocalesAppLang(): OfertasLocalesAppLang {
  const params = useSearchParams();
  return useMemo(
    () => resolveClasificadosPublishLang(params?.get("lang")).copyLang,
    [params],
  );
}

/** Route lang for hrefs + copy lang for UI. */
export function useOfertasLocalesPublishLang() {
  const params = useSearchParams();
  return useMemo(
    () => resolveClasificadosPublishLang(params?.get("lang")),
    [params],
  );
}
