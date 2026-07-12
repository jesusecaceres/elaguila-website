"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { CategoryStandardActiveFilterChips } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardActiveFilterChips";
import { CategoryStandardCompactSearchBar } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardCompactSearchBar";
import {
  activeFilterParamsFromUrl,
  mergeLocationAndDrawerParams,
  readMascotasDrawerFromParams,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardCommunitySimpleBrowse";
import { MascotasDrawerFields } from "@/app/(site)/clasificados/components/categoryStandard/lightweightCategoryDrawerFields";
import { parseLightweightBrowseFromSearchParams } from "@/app/(site)/clasificados/components/categoryStandard/lightweightBrowseLocation";
import {
  buildLocationFilterChips,
  buildResultsFilterChipHref,
  cleanResultsFilterParams,
  type ResultsFilterParams,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardResultsFilterChips";
import { categoryStandardSearchPlaceholder } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";
import type { ActiveFilterChip } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardActiveFilterChips";
import { resolveMascotasPerdidosNoticeLabel } from "@/app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosTaxonomy";

function mascotasDrawerChips(lang: Lang, drawer: Record<string, string>, allParams: ResultsFilterParams): ActiveFilterChip[] {
  const L = lang === "es";
  const chips: ActiveFilterChip[] = [];
  const push = (key: string, label: string) => {
    chips.push({ key, label, href: buildResultsFilterChipHref("mascotas-y-perdidos", lang, allParams, key) });
  };
  if (drawer.tipo && drawer.tipo !== "all") {
    push("tipo", `${L ? "Tipo" : "Type"}: ${resolveMascotasPerdidosNoticeLabel(drawer.tipo, lang)}`);
  }
  if (drawer.lastSeenArea) {
    push("lastSeenArea", `${L ? "Zona" : "Area"}: ${drawer.lastSeenArea}`);
  }
  if (drawer.hasPhoto === "1") {
    push("hasPhoto", L ? "Con foto" : "Has photo");
  }
  return chips;
}

export function MascotasResultsSearchPanel({ lang, clearHref }: { lang: Lang; clearHref: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const spObj = sp ?? new URLSearchParams();
  const loc = parseLightweightBrowseFromSearchParams(spObj);
  const drawerFromUrl = useMemo(() => readMascotasDrawerFromParams(spObj), [sp]);
  const [drawer, setDrawer] = useState(drawerFromUrl);

  useEffect(() => {
    setDrawer(drawerFromUrl);
  }, [drawerFromUrl]);

  const navigate = useCallback(
    (locValues: {
      q: string;
      city: string;
      state: string;
      zip: string;
      country: string;
      stateTouched?: boolean;
      countryTouched?: boolean;
    }) => {
      router.push(
        buildCategoryResultsUrl(
          "mascotas-y-perdidos",
          lang,
          cleanResultsFilterParams(
            mergeLocationAndDrawerParams(locValues, drawer, {
              urlHadState: spObj.has("state"),
              urlHadCountry: spObj.has("country"),
              stateTouched: locValues.stateTouched,
              countryTouched: locValues.countryTouched,
            }),
          ),
        ),
      );
    },
    [drawer, lang, router, spObj],
  );

  const allParams = useMemo(
    () => activeFilterParamsFromUrl(spObj, drawerFromUrl),
    [drawerFromUrl, spObj],
  );

  const activeChips = useMemo(
    () => [
      ...buildLocationFilterChips("mascotas-y-perdidos", lang, allParams),
      ...mascotasDrawerChips(lang, drawerFromUrl, allParams),
    ],
    [allParams, drawerFromUrl, lang],
  );

  return (
    <div className="space-y-3">
      <CategoryStandardCompactSearchBar
        lang={lang}
        routeLang={lang}
        keywordPlaceholder={categoryStandardSearchPlaceholder("mascotas-y-perdidos", lang)}
        defaultValues={loc}
        urlHadState={spObj.has("state")}
        urlHadCountry={spObj.has("country")}
        initialDrawerOpen={sp?.get("filters") === "1"}
        showBrowseAll={false}
        drawerContent={
          <MascotasDrawerFields lang={lang} values={drawer} onChange={(k, v) => setDrawer((p) => ({ ...p, [k]: v }))} />
        }
        onSearch={navigate}
        onClear={() => router.push(clearHref)}
      />
      <CategoryStandardActiveFilterChips lang={lang} chips={activeChips} />
    </div>
  );
}
