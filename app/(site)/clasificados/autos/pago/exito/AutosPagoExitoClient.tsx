"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { emptyAutosPublicFilters } from "@/app/clasificados/autos/filters/autosPublicFilterTypes";
import { serializeAutosBrowseUrl, autosLiveVehiclePath } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import { getAutosPublishFlowCopy } from "@/app/clasificados/autos/lib/autosPublishFlowCopy";
import type { AutosClassifiedsLane } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { clearInventoryAddContextFromSession } from "@/app/lib/clasificados/autos/autosDealerInventoryAddFlow";
import {
  AUTOS_BUNDLE_PUBLISH_RESULT_SESSION_KEY,
  type AutosBundlePublishSessionResult,
} from "@/app/lib/clasificados/autos/autosNegociosBundlePublish";
import {
  autosBundlePublishSuccessIntro,
  autosQaPublishSuccessLabel,
} from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";

function laneFromParam(raw: string | null): AutosClassifiedsLane {
  return raw === "negocios" ? "negocios" : "privado";
}

function readBundleResult(): AutosBundlePublishSessionResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(AUTOS_BUNDLE_PUBLISH_RESULT_SESSION_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as AutosBundlePublishSessionResult;
    if (!j?.mainListingId || !Array.isArray(j.published)) return null;
    return j;
  } catch {
    return null;
  }
}

export function AutosPagoExitoClient() {
  const sp = useSearchParams();
  const qs = sp ?? new URLSearchParams();
  const lang = qs.get("lang") === "en" ? "en" : "es";
  const sessionId = qs.get("session_id")?.trim() ?? "";
  const internal = qs.get("internal") === "1";
  const testPublish = qs.get("test_publish") === "1";
  const internalListingId = qs.get("listing_id")?.trim() ?? "";
  const bundleQuery = qs.get("bundle") === "1";
  const [laneOverride, setLaneOverride] = useState<AutosClassifiedsLane | null>(null);
  const lane = laneOverride ?? laneFromParam(qs.get("lane"));
  const c = getAutosPublishFlowCopy(lang, lane);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const [bundleResult, setBundleResult] = useState<AutosBundlePublishSessionResult | null>(null);

  useEffect(() => {
    if (bundleQuery) {
      const stored = readBundleResult();
      if (stored) setBundleResult(stored);
    }
  }, [bundleQuery]);

  useEffect(() => {
    if (internal && internalListingId) {
      let cancelled = false;
      void (async () => {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          if (!cancelled) setErr(true);
          return;
        }
        const r = await fetch(
          `/api/clasificados/autos/checkout/verify-internal?listing_id=${encodeURIComponent(internalListingId)}&lang=${lang}`,
          { headers: { Authorization: `Bearer ${token}` } },
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
    }

    if (internal && !internalListingId) {
      setErr(true);
      return;
    }

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
  }, [sessionId, lang, internal, internalListingId, testPublish]);

  const resultsQs = serializeAutosBrowseUrl({
    filters: emptyAutosPublicFilters(),
    q: "",
    sort: "newest",
    page: 1,
    lang,
    routeLang: lang,
  });
  const resultsHref = `/clasificados/autos/resultados?${resultsQs}`;
  const dashboardHref = `/dashboard/mis-anuncios?lang=${lang}&cat=autos`;
  const returnToListingId = qs.get("return_to")?.trim() ?? "";
  const returnToHref = returnToListingId
    ? `${autosLiveVehiclePath(returnToListingId)}?lang=${lang}`
    : null;

  useEffect(() => {
    if (returnToListingId) clearInventoryAddContextFromSession();
  }, [returnToListingId]);

  if ((!sessionId && !(internal && internalListingId)) || err) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-[color:var(--lx-text)]">
        <p className="font-semibold">
          {internal
            ? lang === "es"
              ? "No pudimos confirmar la publicación interna."
              : "We could not confirm the internal publish."
            : lang === "es"
              ? "No pudimos confirmar el pago."
              : "We could not confirm payment."}
        </p>
        <Link href={resultsHref} className="mt-6 inline-block text-sm font-bold text-[color:var(--lx-gold)]">
          {c.browseMore}
        </Link>
      </div>
    );
  }

  if (!liveUrl) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-[color:var(--lx-text)]">
        <p className="text-sm">
          {internal
            ? lang === "es"
              ? "Confirmando publicación…"
              : "Confirming listing…"
            : lang === "es"
              ? "Confirmando pago…"
              : "Confirming payment…"}
        </p>
      </div>
    );
  }

  let livePath = liveUrl;
  try {
    livePath = new URL(liveUrl).pathname + new URL(liveUrl).search;
  } catch {
    /* keep as-is */
  }

  const qaBypass = internal && (testPublish || bundleResult?.qaBypass);
  const publishedList = bundleResult?.published ?? [];
  const totalPublished = bundleResult?.totalPublished ?? 1;
  const inventoryLimit = bundleResult?.inventoryLimit ?? 10;

  return (
    <div className="mx-auto max-w-lg px-[max(1rem,env(safe-area-inset-left))] py-16 pb-[max(4rem,env(safe-area-inset-bottom))] pr-[max(1rem,env(safe-area-inset-right))] pt-12 text-center text-[color:var(--lx-text)] sm:py-20">
      <h1 className="text-2xl font-bold tracking-tight">
        {internal && testPublish ? c.successTitleTest : internal ? c.successTitleInternal : c.successTitle}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
        {internal && testPublish ? c.successBodyTest : internal ? c.successBodyInternal : c.successBody}
      </p>
      {qaBypass ? (
        <p className="mt-3 inline-flex rounded-full border border-amber-300/80 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-950">
          {autosQaPublishSuccessLabel(lang)}
        </p>
      ) : null}
      {bundleResult && publishedList.length > 1 ? (
        <p className="mt-4 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
          {autosBundlePublishSuccessIntro(lang, totalPublished, inventoryLimit)}
        </p>
      ) : null}
      <Link
        href={returnToHref ?? livePath}
        className="mt-8 inline-flex min-h-[48px] w-full max-w-sm items-center justify-center rounded-2xl bg-[color:var(--lx-cta-dark)] px-6 text-sm font-bold text-[#FFFCF7] transition active:opacity-90"
      >
        {returnToHref
          ? lang === "es"
            ? "Volver al inventario del dealer"
            : "Back to dealer inventory"
          : c.viewLive}
      </Link>
      {publishedList.length > 1 ? (
        <ul className="mt-6 space-y-2 text-left text-sm">
          {publishedList.map((v) => (
            <li key={v.id}>
              <Link
                href={`${autosLiveVehiclePath(v.id)}?lang=${lang}`}
                className="font-semibold text-[color:var(--lx-gold)] underline"
              >
                {v.title}
                {v.leonix_ad_id ? ` · ${v.leonix_ad_id}` : ""}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-5 flex flex-col gap-3 sm:items-center">
        <Link href={resultsHref} className="text-sm font-semibold text-[color:var(--lx-gold)]">
          {c.browseMore}
        </Link>
        <Link href={dashboardHref} className="text-sm font-semibold text-[color:var(--lx-text-2)] underline">
          {lang === "es" ? "Ir a mis anuncios" : "Go to my listings"}
        </Link>
      </div>
    </div>
  );
}
