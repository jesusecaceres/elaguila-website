"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getAutosPublicListingById, AUTOS_PUBLIC_SAMPLE_LISTINGS } from "../../data/sampleAutosPublicInventory";
import { mapAutosPublicListingToAutoDealer } from "../../lib/mapAutosPublicListingToAutoDealer";
import { normalizeLoadedListing } from "../../negocios/lib/autoDealerDraftDefaults";
import { AutoDealerPreviewPage } from "../../negocios/components/AutoDealerPreviewPage";
import { AutoPrivadoPreviewPage } from "../../privado/components/AutoPrivadoPreviewPage";
import { AutosNegociosPreviewLocaleProvider } from "../../negocios/lib/AutosNegociosPreviewLocaleContext";
import { AutosPrivadoPreviewLocaleProvider } from "../../privado/lib/AutosPrivadoPreviewLocaleContext";
import { serializeAutosBrowseUrl } from "../../filters/autosBrowseFilterContract";
import { emptyAutosPublicFilters } from "../../filters/autosPublicFilterTypes";
import type { AutosPublicLang } from "../../lib/autosPublicBlueprintCopy";

export function AutosLiveVehicleClient({ listingId }: { listingId: string }) {
  const sp = useSearchParams();
  const lang: AutosPublicLang = sp?.get("lang") === "en" ? "en" : "es";

  const listing = getAutosPublicListingById(listingId);

  const data = useMemo(() => {
    if (!listing) return null;
    return normalizeLoadedListing(
      mapAutosPublicListingToAutoDealer(listing, { relatedPool: AUTOS_PUBLIC_SAMPLE_LISTINGS, lang }),
    );
  }, [listing, lang]);

  useEffect(() => {
    if (listing?.vehicleTitle) {
      document.title = `${listing.vehicleTitle} | Leonix Autos`;
    }
  }, [listing?.vehicleTitle]);

  const resultsQs = serializeAutosBrowseUrl({
    filters: emptyAutosPublicFilters(),
    q: "",
    sort: "newest",
    page: 1,
    lang,
  });
  const resultsHref = `/clasificados/autos/resultados?${resultsQs}`;

  if (!listing || !data) {
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
  }

  const lane = data.autosLane ?? (listing.sellerType === "dealer" ? "negocios" : "privado");

  if (lane === "privado") {
    return (
      <AutosPrivadoPreviewLocaleProvider>
        <AutoPrivadoPreviewPage data={data} editBackHref={undefined} />
        <div className="border-t border-[color:var(--lx-nav-border)] bg-[color:var(--lx-page)] px-4 py-6 text-center">
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
      <div className="border-t border-[color:var(--lx-nav-border)] bg-[color:var(--lx-page)] px-4 py-6 text-center">
        <Link href={resultsHref} className="text-sm font-semibold text-[color:var(--lx-gold)]">
          {lang === "es" ? "← Volver a resultados" : "← Back to results"}
        </Link>
      </div>
    </AutosNegociosPreviewLocaleProvider>
  );
}
