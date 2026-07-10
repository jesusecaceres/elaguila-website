"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { CategoryStandardActiveFilterChips } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardActiveFilterChips";
import { CategoryStandardCompactSearchBar } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardCompactSearchBar";
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
  CLASES_SKILL_LEVEL_OPTIONS,
  COMUNIDAD_ACCESSIBILITY_OPTIONS,
  COMMUNITY_AUDIENCE_OPTIONS,
  COMMUNITY_REGISTRATION_OPTIONS,
} from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";

type Props = {
  category: "clases" | "comunidad";
  lang: Lang;
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
  loc: { q: string; city: string; state: string; zip: string; country: string },
  drawer: Record<string, string>,
): ResultsFilterParams {
  const base: ResultsFilterParams = {
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

function optionLabel(
  options: readonly { value: string; labelEs: string; labelEn: string }[],
  value: string,
  lang: Lang,
): string {
  const row = options.find((o) => o.value === value);
  if (!row) return value;
  return lang === "en" ? row.labelEn : row.labelEs;
}

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
    if (drawer.classType) push("classType", `${L ? "Tipo" : "Type"}: ${drawer.classType}`);
    if (drawer.cost && drawer.cost !== "all") {
      const costLabel =
        drawer.cost === "gratis" ? (L ? "Gratis" : "Free") : drawer.cost === "pagada" ? (L ? "Pagada" : "Paid") : drawer.cost;
      push("cost", `${L ? "Costo" : "Cost"}: ${costLabel}`);
    }
    if (drawer.mode && drawer.mode !== "all") {
      const modeLabel =
        drawer.mode === "presencial"
          ? L
            ? "Presencial"
            : "In person"
          : drawer.mode === "enLinea"
            ? L
              ? "En línea"
              : "Online"
            : drawer.mode === "hibrida"
              ? L
                ? "Híbrida"
                : "Hybrid"
              : drawer.mode;
      push("mode", `${L ? "Modalidad" : "Mode"}: ${modeLabel}`);
    }
    if (drawer.level && drawer.level !== "all") {
      push("level", `${L ? "Nivel" : "Level"}: ${optionLabel(CLASES_SKILL_LEVEL_OPTIONS, drawer.level, lang)}`);
    }
  } else {
    if (drawer.eventType) push("eventType", `${L ? "Tipo" : "Type"}: ${drawer.eventType}`);
    if (drawer.eventCost && drawer.eventCost !== "all") {
      push("eventCost", `${L ? "Costo" : "Cost"}: ${drawer.eventCost}`);
    }
    if (drawer.dateFrom) push("dateFrom", `${L ? "Desde" : "From"}: ${drawer.dateFrom}`);
    if (drawer.dateTo) push("dateTo", `${L ? "Hasta" : "To"}: ${drawer.dateTo}`);
    if (drawer.accessibility && drawer.accessibility !== "all") {
      push(
        "accessibility",
        `${L ? "Acceso" : "Access"}: ${optionLabel(COMUNIDAD_ACCESSIBILITY_OPTIONS, drawer.accessibility, lang)}`,
      );
    }
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
  const loc = parseLightweightBrowseFromSearchParams(sp ?? new URLSearchParams());
  const drawerFromUrl = useMemo(() => readDrawerParams(category, sp ?? new URLSearchParams()), [category, sp]);
  const [drawer, setDrawer] = useState(drawerFromUrl);

  useEffect(() => {
    setDrawer(drawerFromUrl);
  }, [drawerFromUrl]);

  const navigate = useCallback(
    (locValues: { q: string; city: string; state: string; zip: string; country: string }, drawerValues: Record<string, string>) => {
      router.push(buildCategoryResultsUrl(category, lang, cleanResultsFilterParams(mergeNavigateParams(locValues, drawerValues))));
    },
    [category, lang, router],
  );

  const onDrawerChange = (key: string, value: string) => {
    setDrawer((prev) => ({ ...prev, [key]: value }));
  };

  const allParams = useMemo(() => mergeNavigateParams(loc, drawerFromUrl), [loc, drawerFromUrl]);

  const activeChips = useMemo(() => {
    return [...buildLocationFilterChips(category, lang, loc, allParams), ...drawerFilterChips(category, lang, drawerFromUrl, allParams)];
  }, [allParams, category, drawerFromUrl, lang, loc]);

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
