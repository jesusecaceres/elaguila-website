"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { CategoryStandardActiveFilterChips } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardActiveFilterChips";
import { CategoryStandardCompactSearchBar } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardCompactSearchBar";
import { BuscoDrawerFields } from "@/app/(site)/clasificados/components/categoryStandard/lightweightCategoryDrawerFields";
import { parseLightweightBrowseFromSearchParams } from "@/app/(site)/clasificados/components/categoryStandard/lightweightBrowseLocation";
import {
  buildLocationFilterChips,
  buildResultsFilterChipHref,
  cleanResultsFilterParams,
  type ResultsFilterParams,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardResultsFilterChips";
import { categoryStandardSearchPlaceholder } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";
import type { ActiveFilterChip } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardActiveFilterChips";
import { resolveBuscoTypePublicLabel } from "@/app/(site)/publicar/busco/shared/buscoTaxonomy";

function readBuscoDrawer(sp: URLSearchParams): Record<string, string> {
  return {
    tipo: (sp.get("tipo") ?? "all").trim(),
    zone: (sp.get("zone") ?? "").trim(),
    budget: (sp.get("budget") ?? "").trim(),
    contact: (sp.get("contact") ?? "all").trim(),
  };
}

function mergeBuscoParams(
  loc: { q: string; city: string; state: string; zip: string; country: string },
  drawer: Record<string, string>,
): ResultsFilterParams {
  const params: ResultsFilterParams = {
    q: loc.q || undefined,
    city: loc.city || undefined,
    state: loc.state || undefined,
    zip: loc.zip || undefined,
    country: loc.country || undefined,
  };
  for (const [k, v] of Object.entries(drawer)) {
    if (!v || v === "all") continue;
    params[k] = v;
  }
  return params;
}

function buscoDrawerChips(lang: Lang, drawer: Record<string, string>, allParams: ResultsFilterParams): ActiveFilterChip[] {
  const L = lang === "es";
  const chips: ActiveFilterChip[] = [];
  const push = (key: string, label: string) => {
    chips.push({ key, label, href: buildResultsFilterChipHref("busco", lang, allParams, key) });
  };
  if (drawer.tipo && drawer.tipo !== "all") {
    push("tipo", `${L ? "Tipo" : "Type"}: ${resolveBuscoTypePublicLabel(drawer.tipo, "", lang)}`);
  }
  if (drawer.zone) push("zone", `${L ? "Zona" : "Zone"}: ${drawer.zone}`);
  if (drawer.budget) push("budget", `${L ? "Presupuesto" : "Budget"}: ${drawer.budget}`);
  if (drawer.contact && drawer.contact !== "all") {
    const contactLabel =
      drawer.contact === "phone"
        ? L
          ? "Teléfono / WhatsApp"
          : "Phone / WhatsApp"
        : drawer.contact === "email"
          ? L
            ? "Correo"
            : "Email"
          : L
            ? "Teléfono o correo"
            : "Phone or email";
    push("contact", `${L ? "Contacto" : "Contact"}: ${contactLabel}`);
  }
  return chips;
}

export function BuscoResultsSearchPanel({ lang, clearHref }: { lang: Lang; clearHref: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const loc = parseLightweightBrowseFromSearchParams(sp ?? new URLSearchParams());
  const drawerFromUrl = useMemo(() => readBuscoDrawer(sp ?? new URLSearchParams()), [sp]);
  const [drawer, setDrawer] = useState(drawerFromUrl);

  useEffect(() => {
    setDrawer(drawerFromUrl);
  }, [drawerFromUrl]);

  const navigate = useCallback(
    (locValues: { q: string; city: string; state: string; zip: string; country: string }) => {
      router.push(buildCategoryResultsUrl("busco", lang, cleanResultsFilterParams(mergeBuscoParams(locValues, drawer))));
    },
    [drawer, lang, router],
  );

  const allParams = useMemo(() => mergeBuscoParams(loc, drawerFromUrl), [loc, drawerFromUrl]);

  const activeChips = useMemo(
    () => [...buildLocationFilterChips("busco", lang, loc, allParams), ...buscoDrawerChips(lang, drawerFromUrl, allParams)],
    [allParams, drawerFromUrl, lang, loc],
  );

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
