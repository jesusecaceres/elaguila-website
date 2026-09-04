"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  categoryResultsPath,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { navCopyLang, resolveRouteLang } from "@/app/lib/language";
import {
  detailPairsToMap,
  isCommunityQuickListing,
} from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";
import { buildCommunityDiscoverySearchBlob } from "@/app/(site)/clasificados/community/shared/communityDiscoveryListingCardModel";
import { buildCommunityDiscoveryCardModel } from "@/app/(site)/clasificados/community/shared/communityDiscoveryCardModelDispatch";
import {
  isCommunityEventActiveForDiscovery,
  sortComunidadDiscoveryRows,
} from "@/app/(site)/clasificados/community/shared/communityEventDiscoveryExpiration";
import {
  fetchPublishedCommunityCategoryListings,
  type CommunityListingBrowseRow,
} from "@/app/(site)/clasificados/community/shared/communityListingsBrowseClient";
import { comunidadMatchesResultsFilters } from "@/app/(site)/clasificados/comunidad/shared/comunidadResultsFilter";
import { clasesMatchesResultsFilters } from "@/app/(site)/clasificados/clases/shared/clasesResultsFilter";
import { CategoryStandardResultsHeader } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsHeader";
import { CategoryStandardResultsPageShell } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsPageShell";
import {
  CAT_STD_REFINE_EYEBROW,
  CAT_STD_RESULTS_REFINE_PANEL,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardStyles";
import { lightweightLocationMatchesFilter } from "@/app/(site)/clasificados/components/categoryStandard/lightweightBrowseLocation";
import { CommunityResultsSearchPanel } from "./CommunityResultsSearchPanel";

import { CommunityDiscoveryListingCard } from "./CommunityDiscoveryListingCard";

function textMatch(hay: string, needle: string): boolean {
  if (!needle.trim()) return true;
  return hay.toLowerCase().includes(needle.trim().toLowerCase());
}

type Props = {
  category: "clases" | "comunidad";
  pageTitleEs: string;
  pageTitleEn: string;
  backLandingHref: string;
  backLandingLabelEs: string;
  backLandingLabelEn: string;
};

export function CommunityListingsResultsClient({
  category,
  pageTitleEs,
  pageTitleEn,
  backLandingHref,
  backLandingLabelEs,
  backLandingLabelEn,
}: Props) {
  const sp = useSearchParams();
  const pathname = usePathname();
  // Globalization Build D-F5 — was a bare `?lang=` check that ignored the visitor's stored
  // leonix_lang cookie/localStorage preference.
  const lang: Lang = navCopyLang(resolveRouteLang(sp?.get("lang")));
  const [rows, setRows] = useState<CommunityListingBrowseRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const q = (sp?.get("q") ?? "").trim();
  const city = (sp?.get("city") ?? "").trim();
  const state = (sp?.get("state") ?? "").trim();
  const zip = (sp?.get("zip") ?? "").trim();
  const country = (sp?.get("country") ?? "").trim();
  const cost = (sp?.get("cost") ?? "all").trim().toLowerCase();
  const mode = (sp?.get("mode") ?? "all").trim().toLowerCase();
  const eventCost = (sp?.get("eventCost") ?? "all").trim().toLowerCase();
  const classType = (sp?.get("classType") ?? "").trim();
  const eventType = (sp?.get("eventType") ?? "").trim();
  const dateFrom = (sp?.get("dateFrom") ?? "").trim();
  const dateTo = (sp?.get("dateTo") ?? "").trim();
  const audienceF = (sp?.get("audience") ?? "all").trim().toLowerCase();
  const levelF = (sp?.get("level") ?? "all").trim().toLowerCase();
  const registrationF = (sp?.get("registration") ?? "all").trim().toLowerCase();
  const accessibilityF = (sp?.get("accessibility") ?? "all").trim().toLowerCase();

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadErr(null);
    const { rows: data, error } = await fetchPublishedCommunityCategoryListings(category, 160);
    if (error) setLoadErr(error);
    setRows(data);
    setLoading(false);
  }, [category]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = useMemo(() => {
    const list = rows.filter((row) => {
      const pairs = detailPairsToMap(row.detail_pairs);
      // Globalization Build D-F5 — this expiry check used to only apply to `comunidad`; Clases
      // (which has a real paid $24.99/30-day package) got no discovery-expiration filtering at
      // all. communityEventDiscoveryExpiryDateKey now reads both categories' own date keys.
      if (!isCommunityEventActiveForDiscovery(pairs)) return false;
      const quick = isCommunityQuickListing(pairs);
      const blob = buildCommunityDiscoverySearchBlob(row, category, pairs, lang);
      if (!textMatch(blob, q)) return false;
      if (
        !lightweightLocationMatchesFilter(
          {
            city: row.city,
            state: pairs["Leonix:state"],
            zip: pairs["Leonix:zip"],
            country: pairs["Leonix:country"],
          },
          { city, state, zip, country },
        )
      ) {
        return false;
      }

      if (!quick) return true;

      if (category === "clases") {
        return clasesMatchesResultsFilters(pairs, quick, lang, {
          cost,
          mode,
          classType,
          audienceF,
          levelF,
          registrationF,
        });
      }
      return comunidadMatchesResultsFilters(pairs, quick, lang, {
        eventCost,
        eventType,
        dateFrom,
        dateTo,
        audienceF,
        registrationF,
        accessibilityF,
      });
    });
    return category === "comunidad" ? sortComunidadDiscoveryRows(list) : list;
  }, [
    rows,
    q,
    city,
    state,
    zip,
    country,
    cost,
    mode,
    eventCost,
    category,
    classType,
    eventType,
    dateFrom,
    dateTo,
    lang,
    audienceF,
    levelF,
    registrationF,
    accessibilityF,
  ]);

  const L = lang === "es";
  const pageTitle = L ? pageTitleEs : pageTitleEn;
  const backLandingLabel = L ? backLandingLabelEs : backLandingLabelEn;
  const useResultsSegment = pathname?.includes("/results");
  const resultsAction = useResultsSegment
    ? categoryResultsPath(category, "results")
    : categoryResultsPath(category, "resultados");
  const clearHref = appendLangToPath(resultsAction, lang);
  const publishHref = appendLangToPath(
    category === "clases" ? "/publicar/clases/quick" : "/publicar/comunidad/quick",
    lang,
  );
  const publishLabel = L
    ? category === "clases"
      ? "Publicar en Clases"
      : "Publicar en Comunidad y Eventos"
    : category === "clases"
      ? "Post in Classes"
      : "Post in Community & Events";

  return (
    <CategoryStandardResultsPageShell>
      <div className="space-y-5">
        <CategoryStandardResultsHeader
          lang={lang}
          title={pageTitle}
          backHref={appendLangToPath(backLandingHref, lang)}
          backLabel={backLandingLabel}
          publishHref={publishHref}
          publishLabel={publishLabel}
          clearHref={clearHref}
          resultCount={loading ? undefined : filtered.length}
        />

        <section
          className={CAT_STD_RESULTS_REFINE_PANEL}
          aria-label={L ? "Afina tu búsqueda" : "Refine your search"}
        >
          <p className={CAT_STD_REFINE_EYEBROW}>{L ? "Afina tu búsqueda" : "Refine your search"}</p>
          <div className="mt-2">
            <CommunityResultsSearchPanel
              category={category}
              lang={lang}
              clearHref={clearHref}
            />
          </div>
        </section>

        {loadErr ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            {loadErr}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-[#5C564E]" aria-busy="true">
            {L ? "Cargando…" : "Loading…"}
          </p>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-black/10 bg-white/90 px-4 py-6 text-sm text-[#5C564E]">
            {L ? "No hay anuncios con estos filtros." : "No listings match these filters."}
          </p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-1 lg:grid-cols-2" data-testid="community-discovery-results-grid">
            {filtered.map((row) => {
              const href = appendLangToPath(`/clasificados/anuncio/${row.id}`, lang);
              const model = buildCommunityDiscoveryCardModel(row, category, lang, href);
              return (
                <li key={row.id} className="min-w-0">
                  <CommunityDiscoveryListingCard model={model} lang={lang} variant={category} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </CategoryStandardResultsPageShell>
  );
}
