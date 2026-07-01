"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { CategoryStandardActiveFilterChips } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardActiveFilterChips";
import { CategoryStandardCompactSearchBar } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardCompactSearchBar";
import { BuscoDrawerFields } from "@/app/(site)/clasificados/components/categoryStandard/lightweightCategoryDrawerFields";
import { parseLightweightBrowseFromSearchParams } from "@/app/(site)/clasificados/components/categoryStandard/lightweightBrowseLocation";
import { categoryStandardSearchPlaceholder } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";

export function BuscoResultsSearchPanel({ lang, clearHref }: { lang: Lang; clearHref: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const loc = parseLightweightBrowseFromSearchParams(sp ?? new URLSearchParams());

  const drawerFromUrl = useMemo(
    () => ({
      tipo: (sp?.get("tipo") ?? "all").trim(),
      zone: (sp?.get("zone") ?? "").trim(),
      budget: (sp?.get("budget") ?? "").trim(),
      contact: (sp?.get("contact") ?? "all").trim(),
    }),
    [sp],
  );
  const [drawer, setDrawer] = useState(drawerFromUrl);

  const navigate = useCallback(
    (locValues: { q: string; city: string; state: string; zip: string; country: string }) => {
      const params: Record<string, string | undefined> = {
        q: locValues.q || undefined,
        city: locValues.city || undefined,
        state: locValues.state || undefined,
        zip: locValues.zip || undefined,
        country: locValues.country || undefined,
      };
      for (const [k, v] of Object.entries(drawer)) {
        if (v && v !== "all") params[k] = v;
      }
      router.push(buildCategoryResultsUrl("busco", lang, params));
    },
    [drawer, lang, router],
  );

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; href: string }[] = [];
    const omit = (key: string) => {
      const params: Record<string, string | undefined> = {
        q: loc.q || undefined,
        city: loc.city || undefined,
        state: loc.state || undefined,
        zip: loc.zip || undefined,
        country: loc.country || undefined,
        ...Object.fromEntries(Object.entries(drawerFromUrl).filter(([k]) => k !== key && drawerFromUrl[k as keyof typeof drawerFromUrl] && drawerFromUrl[k as keyof typeof drawerFromUrl] !== "all")),
      };
      return buildCategoryResultsUrl("busco", lang, params);
    };
    if (loc.q) chips.push({ key: "q", label: `${lang === "es" ? "Palabra" : "Keyword"}: ${loc.q}`, href: omit("q") });
    if (loc.city) chips.push({ key: "city", label: `${lang === "es" ? "Ciudad" : "City"}: ${loc.city}`, href: omit("city") });
    return chips;
  }, [drawerFromUrl, lang, loc]);

  return (
    <div className="space-y-3">
      <CategoryStandardCompactSearchBar
        lang={lang}
        routeLang={lang}
        keywordPlaceholder={categoryStandardSearchPlaceholder("busco", lang)}
        defaultValues={loc}
        initialDrawerOpen={sp?.get("filters") === "1"}
        showBrowseAll={false}
        drawerContent={
          <BuscoDrawerFields lang={lang} values={drawer} onChange={(k, v) => setDrawer((p) => ({ ...p, [k]: v }))} />
        }
        onSearch={navigate}
        onClear={() => router.push(clearHref)}
      />
      <CategoryStandardActiveFilterChips lang={lang} chips={activeChips} />
    </div>
  );
}
