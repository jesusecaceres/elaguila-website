"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { CategoryStandardActiveFilterChips } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardActiveFilterChips";
import { CategoryStandardCompactSearchBar } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardCompactSearchBar";
import { MascotasDrawerFields } from "@/app/(site)/clasificados/components/categoryStandard/lightweightCategoryDrawerFields";
import { parseLightweightBrowseFromSearchParams } from "@/app/(site)/clasificados/components/categoryStandard/lightweightBrowseLocation";
import { categoryStandardSearchPlaceholder } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";

export function MascotasResultsSearchPanel({ lang, clearHref }: { lang: Lang; clearHref: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const loc = parseLightweightBrowseFromSearchParams(sp ?? new URLSearchParams());

  const drawerFromUrl = useMemo(
    () => ({
      tipo: (sp?.get("tipo") ?? "all").trim(),
      lastSeenArea: (sp?.get("lastSeenArea") ?? "").trim(),
      hasPhoto: (sp?.get("hasPhoto") ?? "").trim(),
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
      router.push(buildCategoryResultsUrl("mascotas-y-perdidos", lang, params));
    },
    [drawer, lang, router],
  );

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; href: string }[] = [];
    if (loc.city) {
      chips.push({
        key: "city",
        label: `${lang === "es" ? "Ciudad" : "City"}: ${loc.city}`,
        href: buildCategoryResultsUrl("mascotas-y-perdidos", lang, { q: loc.q || undefined, state: loc.state, zip: loc.zip, country: loc.country }),
      });
    }
    return chips;
  }, [lang, loc]);

  return (
    <div className="space-y-3">
      <CategoryStandardCompactSearchBar
        lang={lang}
        routeLang={lang}
        keywordPlaceholder={categoryStandardSearchPlaceholder("mascotas-y-perdidos", lang)}
        defaultValues={loc}
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
