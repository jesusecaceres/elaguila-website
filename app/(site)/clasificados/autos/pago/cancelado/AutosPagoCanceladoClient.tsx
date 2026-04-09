"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { withLangParam } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { emptyAutosPublicFilters } from "@/app/clasificados/autos/filters/autosPublicFilterTypes";
import { serializeAutosBrowseUrl } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import { getAutosPublishFlowCopy } from "@/app/clasificados/autos/lib/autosPublishFlowCopy";
import type { AutosClassifiedsLane } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

function parseLane(raw: string | null): AutosClassifiedsLane {
  return raw === "negocios" ? "negocios" : "privado";
}

export function AutosPagoCanceladoClient() {
  const sp = useSearchParams();
  const qs = sp ?? new URLSearchParams();
  const lang = qs.get("lang") === "en" ? "en" : "es";
  const listingId = qs.get("listing_id")?.trim() ?? "";
  const lane = parseLane(qs.get("lane"));
  const c = getAutosPublishFlowCopy(lang, lane);

  const resultsQs = serializeAutosBrowseUrl({
    filters: emptyAutosPublicFilters(),
    q: "",
    sort: "newest",
    page: 1,
    lang,
  });
  const resultsHref = `/clasificados/autos/resultados?${resultsQs}`;
  const confirmHref = withLangParam(`/publicar/autos/${lane}/confirm`, lang);
  const editHref = withLangParam(lane === "negocios" ? "/publicar/autos/negocios" : "/publicar/autos/privado", lang);

  useEffect(() => {
    if (!listingId) return;
    let cancelled = false;
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token || cancelled) return;
      await fetch("/api/clasificados/autos/checkout/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ listingId }),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  return (
    <div className="mx-auto max-w-md px-[max(1rem,env(safe-area-inset-left))] py-16 pb-[max(4rem,env(safe-area-inset-bottom))] pr-[max(1rem,env(safe-area-inset-right))] pt-12 text-center text-[color:var(--lx-text)] sm:py-20">
      <h1 className="text-2xl font-bold tracking-tight">{c.cancelTitle}</h1>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{c.cancelBody}</p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        {listingId ? (
          <Link
            href={confirmHref}
            className="inline-flex min-h-[48px] w-full max-w-sm flex-1 items-center justify-center rounded-2xl bg-[color:var(--lx-cta-dark)] px-6 text-sm font-bold text-[#FFFCF7] transition active:opacity-90 sm:w-auto"
          >
            {c.retryPay}
          </Link>
        ) : null}
        <Link
          href={editHref}
          className="inline-flex min-h-[48px] w-full max-w-sm flex-1 items-center justify-center rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-6 text-sm font-bold text-[color:var(--lx-text)] transition active:opacity-90 sm:w-auto"
        >
          {c.backEdit}
        </Link>
      </div>
      <div className="mt-8">
        <Link
          href={resultsHref}
          className="inline-flex min-h-[44px] items-center justify-center text-sm font-semibold text-[color:var(--lx-gold)] underline-offset-4 transition hover:underline"
        >
          {c.browseMore}
        </Link>
      </div>
    </div>
  );
}
