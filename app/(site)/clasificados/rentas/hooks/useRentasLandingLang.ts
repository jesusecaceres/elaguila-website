"use client";

import { useEffect, useMemo, useState } from "react";
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
  const queryLang = searchParams?.get("lang") ?? null;

  // F4 fix: resolveClasificadosPublishLang falls back to a client-only stored preference
  // (localStorage/cookie via `document`/`window`) whenever the URL has no `?lang=`. That storage
  // read is unavailable during SSR (correctly returns null there) but IS available during React's
  // very first client render pass -- so with no query param and a real stored preference, the
  // server's first paint and the client's first paint disagreed, causing a genuine hydration
  // mismatch (React error #418) and, per its imperfect recovery for this failure shape, both
  // language variants of several controls staying in the DOM at once. Fix: always resolve from
  // the query param alone (SSR-safe, deterministic) for the render used during hydration, then
  // apply the stored preference in an effect -- after mount, once client and server have already
  // agreed on one render. This trades a same-render flip for the stored language (identical to
  // every other client-only personalization on the web) for eliminating the hydration error and
  // duplicate DOM outright.
  const ssrSafe = useMemo(() => resolveClasificadosPublishLang(queryLang), [queryLang]);
  const [resolved, setResolved] = useState(ssrSafe);

  useEffect(() => {
    setResolved(resolveClasificadosPublishLang(queryLang));
  }, [queryLang]);

  const copy = RENTAS_LANDING_COPY[resolved.copyLang];
  return { lang: resolved.copyLang, routeLang: resolved.routeLang, copy };
}
