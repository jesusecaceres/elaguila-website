"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { LeonixCategorySearchCanvas } from "@/app/(site)/clasificados/components/categoryStandardV2";
import { CategoryStandardFiltersDrawerShell } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardFiltersDrawerShell";
import { categoryStandardSearchPlaceholder } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";
import {
  buildEnVentaBrowseHref,
  defaultEnVentaDrawerFilters,
  EN_VENTA_DEFAULT_BROWSE_LOCATION,
  type EnVentaBrowseLocation,
  type EnVentaDrawerFilterState,
} from "../enVentaBrowseParams";
import { EnVentaLandingDrawerFields } from "./EnVentaLandingDrawerFields";

type Props = {
  lang: Lang;
  routeLang: Lang;
  browseAllHref: string;
  browseAllLabel: string;
  publishHref: string;
  publishLabel: string;
  searchButtonLabel: string;
};

export function EnVentaLandingSearchPanel({
  lang,
  routeLang,
  browseAllHref,
  browseAllLabel,
  publishHref,
  publishLabel,
  searchButtonLabel,
}: Props) {
  const router = useRouter();
  const [loc, setLoc] = useState<EnVentaBrowseLocation>({ ...EN_VENTA_DEFAULT_BROWSE_LOCATION });
  const [drawer, setDrawer] = useState<EnVentaDrawerFilterState>(() => defaultEnVentaDrawerFilters());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stateTouched, setStateTouched] = useState(false);
  const [countryTouched, setCountryTouched] = useState(false);

  const locationSanitizeOpts = { stateTouched, countryTouched };

  const navigateToResults = useCallback(
    (locValues: EnVentaBrowseLocation, drawerValues: EnVentaDrawerFilterState) => {
      router.push(buildEnVentaBrowseHref(routeLang, locValues, drawerValues, locationSanitizeOpts));
    },
    [routeLang, router, stateTouched, countryTouched],
  );

  const onSearch = useCallback(() => {
    navigateToResults(loc, drawer);
  }, [drawer, loc, navigateToResults]);

  const onApplyDrawer = useCallback(() => {
    setDrawerOpen(false);
    navigateToResults(loc, drawer);
  }, [drawer, loc, navigateToResults]);

  const onClearDrawer = useCallback(() => {
    setDrawerOpen(false);
    setDrawer(defaultEnVentaDrawerFilters());
  }, []);

  const filtersLabel = lang === "es" ? "Filtros" : "Filters";

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
    >
      <LeonixCategorySearchCanvas
        lang={lang}
        surface="landing"
        query={loc.q}
        city={loc.city}
        state={loc.state}
        zip={loc.zip}
        country={loc.country}
        onQuery={(v) => setLoc((p) => ({ ...p, q: v }))}
        onCity={(v) => setLoc((p) => ({ ...p, city: v }))}
        onState={(v) => {
          setStateTouched(true);
          setLoc((p) => ({ ...p, state: v }));
        }}
        onZip={(v) => setLoc((p) => ({ ...p, zip: v }))}
        onCountry={(v) => {
          setCountryTouched(true);
          setLoc((p) => ({ ...p, country: v }));
        }}
        onSearch={onSearch}
        onOpenFilters={() => setDrawerOpen(true)}
        browseAllHref={browseAllHref}
        browseAllLabel={browseAllLabel}
        queryPlaceholder={categoryStandardSearchPlaceholder("en-venta", lang)}
        searchButtonLabel={searchButtonLabel}
        filtersButtonLabel={filtersLabel}
        publishHref={publishHref}
        publishLabel={publishLabel}
      />
      <button type="submit" className="sr-only" tabIndex={-1} aria-hidden>
        {searchButtonLabel}
      </button>
      <CategoryStandardFiltersDrawerShell
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApply={onApplyDrawer}
        onClear={onClearDrawer}
        lang={lang}
        testId="en-venta-landing-filters-drawer"
      >
        <EnVentaLandingDrawerFields
          lang={lang}
          values={drawer}
          onChange={(patch) => setDrawer((prev) => ({ ...prev, ...patch }))}
        />
      </CategoryStandardFiltersDrawerShell>
    </form>
  );
}
