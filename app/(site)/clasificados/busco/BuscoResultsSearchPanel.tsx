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
  readBuscoDrawerFromParams,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardCommunitySimpleBrowse";
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
  const spObj = sp ?? new URLSearchParams();
  const loc = parseLightweightBrowseFromSearchParams(spObj);
  const drawerFromUrl = useMemo(() => readBuscoDrawerFromParams(spObj), [sp]);
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
          "busco",
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
    () => [...buildLocationFilterChips("busco", lang, allParams), ...buscoDrawerChips(lang, drawerFromUrl, allParams)],
    [allParams, drawerFromUrl, lang],
  );

  return (
    <div className="space-y-3">
      <CategoryStandardCompactSearchBar
        lang={lang}
        routeLang={lang}
        keywordPlaceholder={categoryStandardSearchPlaceholder("busco", lang)}
        defaultValues={loc}
        urlHadState={spObj.has("state")}
        urlHadCountry={spObj.has("country")}
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
