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
  readCommunityDrawerFromParams,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardCommunitySimpleBrowse";
import { ComunidadClasesDrawerFields } from "@/app/(site)/clasificados/components/categoryStandard/lightweightCategoryDrawerFields";
import { parseLightweightBrowseFromSearchParams } from "@/app/(site)/clasificados/components/categoryStandard/lightweightBrowseLocation";
import {
  buildLocationFilterChips,
  buildResultsFilterChipHref,
  cleanResultsFilterParams,
  type ResultsFilterParams,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardResultsFilterChips";
import { categoryStandardSearchPlaceholder } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";
import type { ActiveFilterChip } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardActiveFilterChips";
import {
  COMMUNITY_AUDIENCE_OPTIONS,
  COMMUNITY_REGISTRATION_OPTIONS,
} from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
import { optionLabel } from "@/app/(site)/clasificados/community/shared/communityOptionLabel";
import { pushComunidadDrawerFilterChips } from "@/app/(site)/clasificados/comunidad/shared/comunidadResultsFilterChips";
import { pushClasesDrawerFilterChips } from "@/app/(site)/clasificados/clases/shared/clasesResultsFilterChips";

type Props = {
  category: "clases" | "comunidad";
  lang: Lang;
  clearHref: string;
};

function drawerFilterChips(
  category: "clases" | "comunidad",
  lang: Lang,
  drawer: Record<string, string>,
  allParams: ResultsFilterParams,
): ActiveFilterChip[] {
  const L = lang === "es";
  const chips: ActiveFilterChip[] = [];
  const push = (key: string, label: string) => {
    chips.push({
      key,
      label,
      href: buildResultsFilterChipHref(category, lang, allParams, key),
    });
  };

  if (category === "clases") {
    pushClasesDrawerFilterChips(lang, drawer, push);
  } else {
    pushComunidadDrawerFilterChips(lang, drawer, push);
  }

  if (drawer.audience && drawer.audience !== "all") {
    push("audience", `${L ? "Audiencia" : "Audience"}: ${optionLabel(COMMUNITY_AUDIENCE_OPTIONS, drawer.audience, lang)}`);
  }
  if (drawer.registration && drawer.registration !== "all") {
    push(
      "registration",
      `${L ? "Registro" : "Registration"}: ${optionLabel(COMMUNITY_REGISTRATION_OPTIONS, drawer.registration, lang)}`,
    );
  }

  return chips;
}

export function CommunityResultsSearchPanel({ category, lang, clearHref }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const spObj = sp ?? new URLSearchParams();
  const loc = parseLightweightBrowseFromSearchParams(spObj);
  const drawerFromUrl = useMemo(() => readCommunityDrawerFromParams(category, spObj), [category, sp]);
  const [drawer, setDrawer] = useState(drawerFromUrl);

  useEffect(() => {
    setDrawer(drawerFromUrl);
  }, [drawerFromUrl]);

  const navigate = useCallback(
    (
      locValues: {
        q: string;
        city: string;
        state: string;
        zip: string;
        country: string;
        stateTouched?: boolean;
        countryTouched?: boolean;
      },
      drawerValues: Record<string, string>,
    ) => {
      router.push(
        buildCategoryResultsUrl(
          category,
          lang,
          cleanResultsFilterParams(
            mergeLocationAndDrawerParams(locValues, drawerValues, {
              urlHadState: spObj.has("state"),
              urlHadCountry: spObj.has("country"),
              stateTouched: locValues.stateTouched,
              countryTouched: locValues.countryTouched,
            }),
          ),
        ),
      );
    },
    [category, lang, router, spObj],
  );

  const onDrawerChange = (key: string, value: string) => {
    setDrawer((prev) => ({ ...prev, [key]: value }));
  };

  const allParams = useMemo(
    () => activeFilterParamsFromUrl(spObj, drawerFromUrl),
    [drawerFromUrl, spObj],
  );

  const activeChips = useMemo(() => {
    return [
      ...buildLocationFilterChips(category, lang, allParams),
      ...drawerFilterChips(category, lang, drawerFromUrl, allParams),
    ];
  }, [allParams, category, drawerFromUrl, lang]);

  return (
    <div className="space-y-3">
      <CategoryStandardCompactSearchBar
        lang={lang}
        routeLang={lang}
        keywordPlaceholder={categoryStandardSearchPlaceholder(category, lang)}
        defaultValues={loc}
        urlHadState={spObj.has("state")}
        urlHadCountry={spObj.has("country")}
        initialDrawerOpen={sp?.get("filters") === "1"}
        showBrowseAll={false}
        drawerContent={
          <ComunidadClasesDrawerFields
            lang={lang}
            category={category}
            values={drawer}
            onChange={onDrawerChange}
          />
        }
        onSearch={(locValues) => navigate(locValues, drawer)}
        onClear={() => router.push(clearHref)}
      />
      <CategoryStandardActiveFilterChips lang={lang} chips={activeChips} />
    </div>
  );
}
