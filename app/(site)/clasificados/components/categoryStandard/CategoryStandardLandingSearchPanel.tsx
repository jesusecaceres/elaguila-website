"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { LeonixCategorySearchCanvas } from "@/app/(site)/clasificados/components/categoryStandardV2";
import { CategoryStandardFiltersDrawerShell } from "./CategoryStandardFiltersDrawerShell";
import {
  BuscoDrawerFields,
  ComunidadClasesDrawerFields,
  MascotasDrawerFields,
} from "./lightweightCategoryDrawerFields";
import {
  buildCommunitySimpleResultsHref,
  DEFAULT_BROWSE_LOCATION,
  defaultDrawerForCategory,
  type BrowseLocationValues,
  type CommunitySimpleSlug,
} from "./categoryStandardCommunitySimpleBrowse";
import { categoryStandardSearchPlaceholder } from "./categoryStandardTheme";

type Props = {
  category: CommunitySimpleSlug;
  lang: Lang;
  routeLang: Lang;
  browseAllHref: string;
  browseAllLabel: string;
  publishHref: string;
  publishLabel: string;
};

export function CategoryStandardLandingSearchPanel({
  category,
  lang,
  routeLang,
  browseAllHref,
  browseAllLabel,
  publishHref,
  publishLabel,
}: Props) {
  const router = useRouter();
  const [loc, setLoc] = useState<BrowseLocationValues>({ ...DEFAULT_BROWSE_LOCATION });
  const [drawer, setDrawer] = useState(() => defaultDrawerForCategory(category));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stateTouched, setStateTouched] = useState(false);
  const [countryTouched, setCountryTouched] = useState(false);

  const locationSanitizeOpts = { stateTouched, countryTouched };

  const navigateToResults = useCallback(
    (locValues: BrowseLocationValues, drawerValues: Record<string, string>) => {
      router.push(buildCommunitySimpleResultsHref(category, routeLang, locValues, drawerValues, locationSanitizeOpts));
    },
    [category, routeLang, router, stateTouched, countryTouched],
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
    setLoc({ ...DEFAULT_BROWSE_LOCATION });
    setDrawer(defaultDrawerForCategory(category));
    setStateTouched(false);
    setCountryTouched(false);
  }, [category]);

  const onDrawerChange = (key: string, value: string) => {
    setDrawer((prev) => ({ ...prev, [key]: value }));
  };

  const drawerContent =
    category === "busco" ? (
      <BuscoDrawerFields lang={lang} values={drawer} onChange={onDrawerChange} />
    ) : category === "mascotas-y-perdidos" ? (
      <MascotasDrawerFields lang={lang} values={drawer} onChange={onDrawerChange} />
    ) : (
      <ComunidadClasesDrawerFields
        lang={lang}
        category={category}
        values={drawer}
        onChange={onDrawerChange}
      />
    );

  const filtersLabel = lang === "es" ? "Filtros" : "Filters";
  const searchLabel = lang === "es" ? "Buscar" : "Search";

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
        queryPlaceholder={categoryStandardSearchPlaceholder(category, lang)}
        searchButtonLabel={searchLabel}
        filtersButtonLabel={filtersLabel}
        publishHref={publishHref}
        publishLabel={publishLabel}
      />
      <button type="submit" className="sr-only" tabIndex={-1} aria-hidden>
        {searchLabel}
      </button>
      <CategoryStandardFiltersDrawerShell
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApply={onApplyDrawer}
        onClear={onClearDrawer}
        lang={lang}
      >
        {drawerContent}
      </CategoryStandardFiltersDrawerShell>
    </form>
  );
}
