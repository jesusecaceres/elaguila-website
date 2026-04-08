"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { withLangParam } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { emptyAutosPublicFilters } from "@/app/clasificados/autos/filters/autosPublicFilterTypes";
import { serializeAutosBrowseUrl } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import { getAutosPublishFlowCopy } from "@/app/clasificados/autos/lib/autosPublishFlowCopy";
import type { AutosClassifiedsLane } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";

function parseLane(raw: string | null): AutosClassifiedsLane {
  return raw === "negocios" ? "negocios" : "privado";
}

export function AutosPagoErrorClient() {
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
  const confirmHref = listingId ? withLangParam(`/publicar/autos/${lane}/confirm`, lang) : null;

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center text-[color:var(--lx-text)]">
      <h1 className="text-2xl font-bold">{c.errorTitle}</h1>
      <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">{c.errorBody}</p>
      {confirmHref ? (
        <Link
          href={confirmHref}
          className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[color:var(--lx-cta-dark)] px-6 text-sm font-bold text-[#FFFCF7]"
        >
          {c.retryPay}
        </Link>
      ) : null}
      <div className="mt-6">
        <Link href={resultsHref} className="text-sm font-semibold text-[color:var(--lx-gold)]">
          {c.browseMore}
        </Link>
      </div>
    </div>
  );
}
