"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { CategoryStandardActiveFilterChips } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardActiveFilterChips";
import { CategoryStandardCompactSearchBar } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardCompactSearchBar";
import { ComunidadClasesDrawerFields } from "@/app/(site)/clasificados/components/categoryStandard/lightweightCategoryDrawerFields";
import { parseLightweightBrowseFromSearchParams } from "@/app/(site)/clasificados/components/categoryStandard/lightweightBrowseLocation";
import { categoryStandardSearchPlaceholder } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";

type Props = {
  category: "clases" | "comunidad";
  lang: Lang;
  resultsAction: string;
  clearHref: string;
};

function readDrawerParams(category: "clases" | "comunidad", sp: URLSearchParams): Record<string, string> {
  if (category === "clases") {
    return {
      classType: (sp.get("classType") ?? "").trim(),
      cost: (sp.get("cost") ?? "all").trim(),
      mode: (sp.get("mode") ?? "all").trim(),
      level: (sp.get("level") ?? "all").trim(),
      audience: (sp.get("audience") ?? "all").trim(),
      registration: (sp.get("registration") ?? "all").trim(),
    };
  }
  return {
    eventType: (sp.get("eventType") ?? "").trim(),
    eventCost: (sp.get("eventCost") ?? "all").trim(),
    dateFrom: (sp.get("dateFrom") ?? "").trim(),
    dateTo: (sp.get("dateTo") ?? "").trim(),
    audience: (sp.get("audience") ?? "all").trim(),
    registration: (sp.get("registration") ?? "all").trim(),
    accessibility: (sp.get("accessibility") ?? "all").trim(),
  };
}

function mergeNavigateParams(
  category: "clases" | "comunidad",
  lang: Lang,
  loc: { q: string; city: string; state: string; zip: string; country: string },
  drawer: Record<string, string>,
): Record<string, string | undefined> {
  const base: Record<string, string | undefined> = {
    q: loc.q || undefined,
    city: loc.city || undefined,
    state: loc.state || undefined,
    zip: loc.zip || undefined,
    country: loc.country || undefined,
  };
  for (const [k, v] of Object.entries(drawer)) {
    if (!v || v === "all") continue;
    base[k] = v;
  }
  return base;
}

export function CommunityResultsSearchPanel({ category, lang, resultsAction, clearHref }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const loc = parseLightweightBrowseFromSearchParams(sp ?? new URLSearchParams());
  const drawerFromUrl = useMemo(() => readDrawerParams(category, sp ?? new URLSearchParams()), [category, sp]);
  const [drawer, setDrawer] = useState(drawerFromUrl);

  useEffect(() => {
    setDrawer(drawerFromUrl);
  }, [drawerFromUrl]);

  const navigate = useCallback(
    (locValues: { q: string; city: string; state: string; zip: string; country: string }, drawerValues: Record<string, string>) => {
      router.push(buildCategoryResultsUrl(category, lang, mergeNavigateParams(category, lang, locValues, drawerValues)));
    },
    [category, lang, router],
  );

  const onDrawerChange = (key: string, value: string) => {
    setDrawer((prev) => ({ ...prev, [key]: value }));
  };

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; href: string }[] = [];
    const add = (key: string, label: string) => {
      const params = mergeNavigateParams(category, lang, loc, { ...drawerFromUrl, [key]: "" });
      delete params[key as keyof typeof params];
      chips.push({
        key,
        label,
        href: buildCategoryResultsUrl(category, lang, params),
      });
    };
    if (loc.q) add("q", `${lang === "es" ? "Palabra" : "Keyword"}: ${loc.q}`);
    if (loc.city) add("city", `${lang === "es" ? "Ciudad" : "City"}: ${loc.city}`);
    if (loc.state && loc.state !== "CA") add("state", `${lang === "es" ? "Estado" : "State"}: ${loc.state}`);
    if (loc.zip) add("zip", `ZIP: ${loc.zip}`);
    if (loc.country && loc.country !== "United States") add("country", loc.country);
    return chips;
  }, [category, drawerFromUrl, lang, loc]);

  return (
    <div className="space-y-3">
      <CategoryStandardCompactSearchBar
        lang={lang}
        routeLang={lang}
        keywordPlaceholder={categoryStandardSearchPlaceholder(category, lang)}
        defaultValues={loc}
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
