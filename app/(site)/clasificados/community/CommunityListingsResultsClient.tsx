"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  categoryResultsPath,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import {
  detailPairsToMap,
  isCommunityQuickListing,
  parseAccessibilityKeysCsv,
} from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";
import {
  buildCommunityDiscoveryCardModel,
  buildCommunityDiscoverySearchBlob,
} from "@/app/(site)/clasificados/community/shared/communityDiscoveryListingCardModel";
import {
  isCommunityEventActiveForDiscovery,
  sortComunidadDiscoveryRows,
} from "@/app/(site)/clasificados/community/shared/communityEventDiscoveryExpiration";
import {
  fetchPublishedCommunityCategoryListings,
  type CommunityListingBrowseRow,
} from "@/app/(site)/clasificados/community/shared/communityListingsBrowseClient";
import {
  resolveClasesCategoryPublicLabel,
  resolveComunidadEventTypePublicLabel,
} from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
import { CategoryStandardResultsHeader } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsHeader";
import { CategoryStandardResultsPageShell } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsPageShell";
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
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
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
      if (category === "comunidad" && !isCommunityEventActiveForDiscovery(pairs)) return false;
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

      const classTypeLine =
        category === "clases" && quick
          ? resolveClasesCategoryPublicLabel(
              pairs["Leonix:classCategory"] ?? "",
              pairs["Leonix:classCategoryCustom"] ?? "",
              lang,
            )
          : "";

      if (category === "clases") {
        if (cost !== "all") {
          const ct = (pairs["Leonix:classCostType"] ?? "").trim();
          if (cost === "gratis" && ct !== "gratis") return false;
          if (cost === "pagada" && ct !== "pagada") return false;
        }
        if (mode !== "all") {
          const m = (pairs["Leonix:mode"] ?? "").trim().toLowerCase();
          if (m !== mode.toLowerCase()) return false;
        }
        if (classType.trim()) {
          const catRaw =
            pairs["Leonix:classCategory"] === "otro"
              ? pairs["Leonix:classCategoryCustom"] || pairs["Leonix:classCategory"]
              : pairs["Leonix:classCategory"];
          const hay = `${String(catRaw ?? "")} ${classTypeLine}`.toLowerCase();
          if (!textMatch(hay, classType)) return false;
        }
        if (audienceF !== "all") {
          const a = (pairs["Leonix:audience"] ?? "").trim().toLowerCase();
          if (a !== audienceF) return false;
        }
        if (levelF !== "all") {
          const lv = (pairs["Leonix:skillLevel"] ?? "").trim().toLowerCase();
          if (lv !== levelF) return false;
        }
        if (registrationF !== "all") {
          const r = (pairs["Leonix:registrationRequired"] ?? "").trim().toLowerCase();
          if (r !== registrationF) return false;
        }
      } else {
        if (eventCost !== "all") {
          const ec = (pairs["Leonix:eventCost"] ?? "").trim().toLowerCase();
          if (ec !== eventCost) return false;
        }
        if (eventType.trim()) {
          const slug = (pairs["Leonix:eventCategory"] ?? pairs["Leonix:eventType"] ?? "").trim();
          const catRaw = slug === "otro" ? pairs["Leonix:eventCategoryCustom"] || slug : slug;
          const eventTypeLine = isCommunityQuickListing(pairs)
            ? resolveComunidadEventTypePublicLabel(
                pairs["Leonix:eventCategory"] ?? pairs["Leonix:eventType"] ?? "",
                pairs["Leonix:eventCategoryCustom"] ?? "",
                lang,
              )
            : "";
          const hay = `${String(catRaw ?? "")} ${eventTypeLine}`.toLowerCase();
          if (!textMatch(hay, eventType)) return false;
        }
        const isoLike = /^\d{4}-\d{2}-\d{2}/;
        const start = (pairs["Leonix:eventDate"] ?? "").trim();
        const startKey = isoLike.test(start) ? start.slice(0, 10) : "";
        if (dateFrom.trim() && startKey && startKey < dateFrom.trim()) return false;
        if (dateTo.trim() && startKey && startKey > dateTo.trim()) return false;
        if (audienceF !== "all") {
          const a = (pairs["Leonix:audience"] ?? "").trim().toLowerCase();
          if (a !== audienceF) return false;
        }
        if (registrationF !== "all") {
          const r = (pairs["Leonix:registrationRequired"] ?? "").trim().toLowerCase();
          if (r !== registrationF) return false;
        }
        if (accessibilityF !== "all") {
          const keys = parseAccessibilityKeysCsv(pairs["Leonix:accessibility"]);
          if (!keys.includes(accessibilityF)) return false;
        }
      }
      return true;
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
    category === "clases" ? "/clasificados/publicar/clases" : "/clasificados/publicar/comunidad",
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
      <div className="space-y-4">
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

        <CommunityResultsSearchPanel
          category={category}
          lang={lang}
          resultsAction={resultsAction}
          clearHref={clearHref}
        />

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
