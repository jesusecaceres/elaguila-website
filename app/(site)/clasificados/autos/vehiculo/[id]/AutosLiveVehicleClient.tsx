"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AutoDealerListing } from "../../negocios/types/autoDealerListing";
import { normalizeLoadedListing } from "../../negocios/lib/autoDealerDraftDefaults";
import { AutoDealerPreviewPage } from "../../negocios/components/AutoDealerPreviewPage";
import { AutoPrivadoPreviewPage } from "../../privado/components/AutoPrivadoPreviewPage";
import { AutosNegociosPreviewLocaleProvider } from "../../negocios/lib/AutosNegociosPreviewLocaleContext";
import { AutosPrivadoPreviewLocaleProvider } from "../../privado/lib/AutosPrivadoPreviewLocaleContext";
import { serializeAutosBrowseUrl } from "../../filters/autosBrowseFilterContract";
import { emptyAutosPublicFilters } from "../../filters/autosPublicFilterTypes";
import type { AutosPublicLang } from "../../lib/autosPublicBlueprintCopy";
import { AUTOS_CLASSIFIEDS_EVENT } from "@/app/lib/clasificados/autos/autosClassifiedsEventTypes";
import type { AutosClassifiedsLane } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import { trackAutosListingEvent } from "../../lib/autosListingAnalyticsClient";

type PublicListingApiOk = {
  ok: true;
  listing: AutoDealerListing;
  lane: AutosClassifiedsLane;
  lang: "es" | "en";
};

export function AutosLiveVehicleClient({ listingId }: { listingId: string }) {
  const sp = useSearchParams();
  const qs = sp ?? new URLSearchParams();
  const lang: AutosPublicLang = qs.get("lang") === "en" ? "en" : "es";
  const [data, setData] = useState<AutoDealerListing | null>(null);
  const [lane, setLane] = useState<AutosClassifiedsLane | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const r = await fetch(
          `/api/clasificados/autos/public/listings/${encodeURIComponent(listingId)}?lang=${lang}`,
        );
        const j = (await r.json()) as PublicListingApiOk | { ok?: false };
        if (cancelled) return;
        if (r.ok && j && "ok" in j && j.ok && j.listing) {
          setData(normalizeLoadedListing({ ...j.listing, autosLane: j.lane }));
          setLane(j.lane);
        } else {
          setData(null);
          setLane(null);
        }
      } catch {
        if (!cancelled) {
          setData(null);
          setLane(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId, lang]);

  useEffect(() => {
    if (!data || !lane) return;
    trackAutosListingEvent(listingId, AUTOS_CLASSIFIEDS_EVENT.listingOpen, { lane });
  }, [listingId, data, lane]);

  useEffect(() => {
    if (!data) return;
    const t =
      data.vehicleTitle?.trim() || [data.year, data.make, data.model].filter(Boolean).join(" ");
    if (t) document.title = `${t} | Leonix Autos`;
  }, [data]);

  const resultsQs = serializeAutosBrowseUrl({
    filters: emptyAutosPublicFilters(),
    q: "",
    sort: "newest",
    page: 1,
    lang,
  });
  const resultsHref = `/clasificados/autos/resultados?${resultsQs}`;

  const notFound = useMemo(() => {
    const empty = lang === "es";
    return (
      <div className="min-h-screen bg-[color:var(--lx-page)] px-4 py-16 text-center text-[color:var(--lx-text)]">
        <p className="text-lg font-semibold">{empty ? "No encontramos este anuncio." : "We could not find this listing."}</p>
        <p className="mt-2 text-sm text-[color:var(--lx-muted)]">
          {empty ? "Puede haber sido vendido o retirado." : "It may have been sold or removed."}
        </p>
        <Link
          href={resultsHref}
          className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[color:var(--lx-cta-dark)] px-6 text-sm font-bold text-[#FFFCF7]"
        >
          {empty ? "Ver autos en venta" : "Browse vehicles for sale"}
        </Link>
      </div>
    );
  }, [lang, resultsHref]);

  if (loading) {
    return <div className="min-h-screen bg-[color:var(--lx-page)]" aria-busy="true" />;
  }

  if (!data || !lane) {
    return notFound;
  }

  if (lane === "privado") {
    return (
      <AutosPrivadoPreviewLocaleProvider>
        <AutoPrivadoPreviewPage data={data} editBackHref={undefined} />
        <div className="border-t border-[color:var(--lx-nav-border)] bg-[color:var(--lx-page)] px-[max(1rem,env(safe-area-inset-left))] py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pr-[max(1rem,env(safe-area-inset-right))] text-center">
          <Link href={resultsHref} className="text-sm font-semibold text-[color:var(--lx-gold)]">
            {lang === "es" ? "← Volver a resultados" : "← Back to results"}
          </Link>
        </div>
      </AutosPrivadoPreviewLocaleProvider>
    );
  }

  return (
    <AutosNegociosPreviewLocaleProvider>
      <AutoDealerPreviewPage data={data} editBackHref={undefined} />
      <div className="border-t border-[color:var(--lx-nav-border)] bg-[color:var(--lx-page)] px-[max(1rem,env(safe-area-inset-left))] py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pr-[max(1rem,env(safe-area-inset-right))] text-center">
        <Link href={resultsHref} className="text-sm font-semibold text-[color:var(--lx-gold)]">
          {lang === "es" ? "← Volver a resultados" : "← Back to results"}
        </Link>
      </div>
    </AutosNegociosPreviewLocaleProvider>
  );
}
