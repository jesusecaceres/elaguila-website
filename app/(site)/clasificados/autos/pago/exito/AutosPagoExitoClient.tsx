"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { emptyAutosPublicFilters } from "@/app/clasificados/autos/filters/autosPublicFilterTypes";
import { serializeAutosBrowseUrl } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import { getAutosPublishFlowCopy } from "@/app/clasificados/autos/lib/autosPublishFlowCopy";
import type { AutosClassifiedsLane } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";

function laneFromParam(raw: string | null): AutosClassifiedsLane {
  return raw === "negocios" ? "negocios" : "privado";
}

export function AutosPagoExitoClient() {
  const sp = useSearchParams();
  const qs = sp ?? new URLSearchParams();
  const lang = qs.get("lang") === "en" ? "en" : "es";
  const sessionId = qs.get("session_id")?.trim() ?? "";
  const [laneOverride, setLaneOverride] = useState<AutosClassifiedsLane | null>(null);
  const lane = laneOverride ?? laneFromParam(qs.get("lane"));
  const c = getAutosPublishFlowCopy(lang, lane);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setErr(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      const r = await fetch(
        `/api/clasificados/autos/checkout/verify?session_id=${encodeURIComponent(sessionId)}&lang=${lang}`,
      );
      const j = (await r.json()) as { ok?: boolean; liveUrl?: string; lane?: string };
      if (cancelled) return;
      if (j.lane === "negocios" || j.lane === "privado") {
        setLaneOverride(j.lane);
      }
      if (r.ok && j.liveUrl) {
        setLiveUrl(j.liveUrl);
        return;
      }
      setErr(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, lang]);

  const resultsQs = serializeAutosBrowseUrl({
    filters: emptyAutosPublicFilters(),
    q: "",
    sort: "newest",
    page: 1,
    lang,
  });
  const resultsHref = `/clasificados/autos/resultados?${resultsQs}`;

  if (!sessionId || err) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-[color:var(--lx-text)]">
        <p className="font-semibold">{lang === "es" ? "No pudimos confirmar el pago." : "We could not confirm payment."}</p>
        <Link href={resultsHref} className="mt-6 inline-block text-sm font-bold text-[color:var(--lx-gold)]">
          {c.browseMore}
        </Link>
      </div>
    );
  }

  if (!liveUrl) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-[color:var(--lx-text)]">
        <p className="text-sm">{lang === "es" ? "Confirmando pago…" : "Confirming payment…"}</p>
      </div>
    );
  }

  let livePath = liveUrl;
  try {
    livePath = new URL(liveUrl).pathname + new URL(liveUrl).search;
  } catch {
    /* keep as-is */
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center text-[color:var(--lx-text)]">
      <h1 className="text-2xl font-bold">{c.successTitle}</h1>
      <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">{c.successBody}</p>
      <Link
        href={livePath}
        className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[color:var(--lx-cta-dark)] px-6 text-sm font-bold text-[#FFFCF7]"
      >
        {c.viewLive}
      </Link>
      <div className="mt-4">
        <Link href={resultsHref} className="text-sm font-semibold text-[color:var(--lx-gold)]">
          {c.browseMore}
        </Link>
      </div>
    </div>
  );
}
