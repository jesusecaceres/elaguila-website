"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  buildCategoryResultsUrl,
  type CatStdAllSlug,
} from "./categoryStandardRoutes";
import { categoryStandardSearchPlaceholder } from "./categoryStandardTheme";
import { CategoryStandardCompactSearchBar } from "./CategoryStandardCompactSearchBar";
import {
  BuscoDrawerFields,
  ComunidadClasesDrawerFields,
  MascotasDrawerFields,
} from "./lightweightCategoryDrawerFields";

type Props = {
  category: CatStdAllSlug;
  lang: Lang;
  searchAction: string;
  browseHref: string;
  browseLabel?: string;
  searchChips?: React.ReactNode;
};

function defaultDrawer(category: CatStdAllSlug): Record<string, string> {
  if (category === "comunidad") {
    return { eventType: "", eventCost: "all", dateFrom: "", dateTo: "", audience: "all", registration: "all", accessibility: "all" };
  }
  if (category === "clases") {
    return { classType: "", cost: "all", mode: "all", level: "all", audience: "all", registration: "all" };
  }
  if (category === "busco") {
    return { tipo: "all", zone: "", budget: "", contact: "all" };
  }
  if (category === "mascotas-y-perdidos") {
    return { tipo: "all", lastSeenArea: "", hasPhoto: "" };
  }
  return {};
}

export function CategoryStandardLandingSearch({
  category,
  lang,
  searchAction,
  browseHref,
  browseLabel,
  searchChips,
}: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [drawer, setDrawer] = useState(defaultDrawer(category));

  const drawerContent =
    category === "comunidad" || category === "clases" ? (
      <ComunidadClasesDrawerFields
        lang={lang}
        category={category}
        values={drawer}
        onChange={(k, v) => setDrawer((p) => ({ ...p, [k]: v }))}
      />
    ) : category === "busco" ? (
      <BuscoDrawerFields lang={lang} values={drawer} onChange={(k, v) => setDrawer((p) => ({ ...p, [k]: v }))} />
    ) : category === "mascotas-y-perdidos" ? (
      <MascotasDrawerFields lang={lang} values={drawer} onChange={(k, v) => setDrawer((p) => ({ ...p, [k]: v }))} />
    ) : null;

  const navigateWith = (loc: { q: string; city: string; state: string; zip: string; country: string }) => {
    const params: Record<string, string | undefined> = {
      q: loc.q || undefined,
      city: loc.city || undefined,
      state: loc.state || undefined,
      zip: loc.zip || undefined,
      country: loc.country || undefined,
    };
    for (const [k, v] of Object.entries(drawer)) {
      if (v && v !== "all") params[k] = v;
    }
    router.push(buildCategoryResultsUrl(category, lang, params));
  };

  return (
    <div className="space-y-2.5">
      <CategoryStandardCompactSearchBar
        lang={lang}
        routeLang={lang}
        keywordPlaceholder={categoryStandardSearchPlaceholder(category, lang)}
        browseAllHref={browseHref}
        browseAllLabel={browseLabel}
        initialDrawerOpen={sp?.get("filters") === "1"}
        drawerContent={drawerContent}
        onSearch={navigateWith}
        onClear={() => router.push(buildCategoryResultsUrl(category, lang))}
      />
      {searchChips}
    </div>
  );
}
