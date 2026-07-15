"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  LeonixCategorySearchCanvas,
  type Lang as V2Lang,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
import { CategoryStandardFiltersDrawerShell } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardFiltersDrawerShell";
import { ServiciosResultsAdvancedFilterFields } from "../resultados/ServiciosResultsAdvancedFilterFields";
import {
  buildServiciosResultsBrowseHref,
  emptyServiciosDrawerFilters,
  parseServiciosFilterFormData,
  SERVICIOS_DEFAULT_BROWSE_LOCATION,
  type ServiciosBrowseLocation,
} from "../lib/serviciosBrowseParams";
import type { ServiciosResultsFilterQuery } from "../lib/serviciosResultsFilter";

type Props = {
  lang: Lang;
  routeLang: Lang;
  resultsHref: string;
  publishHref: string;
  browseAllLabel: string;
  publishLabel: string;
  queryPlaceholder: string;
  searchButtonLabel: string;
};

const LANDING_DRAWER_FORM_ID = "servicios-landing-filters-form";

export function ServiciosLandingSearchPanel({
  lang,
  routeLang,
  publishHref,
  browseAllLabel,
  publishLabel,
  queryPlaceholder,
  searchButtonLabel,
}: Props) {
  const router = useRouter();
  const [loc, setLoc] = useState<ServiciosBrowseLocation>({ ...SERVICIOS_DEFAULT_BROWSE_LOCATION });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stateTouched, setStateTouched] = useState(false);
  const [countryTouched, setCountryTouched] = useState(false);
  const [drawerDefaults] = useState<Partial<ServiciosResultsFilterQuery>>(() => emptyServiciosDrawerFilters());

  const sanitizeOpts = { stateTouched, countryTouched };

  const navigate = useCallback(
    (drawerFd?: FormData) => {
      const parsed = drawerFd ? parseServiciosFilterFormData(drawerFd) : {};
      const {
        q: _dq,
        city: _dc,
        state: _ds,
        zip: _dz,
        country: _dco,
        ...drawerOnly
      } = parsed;
      router.push(buildServiciosResultsBrowseHref(routeLang, loc, drawerOnly, sanitizeOpts));
    },
    [loc, routeLang, router, stateTouched, countryTouched],
  );

  const onSearch = useCallback(() => navigate(), [navigate]);

  const onApplyDrawer = useCallback(() => {
    setDrawerOpen(false);
    const form = document.getElementById(LANDING_DRAWER_FORM_ID) as HTMLFormElement | null;
    navigate(form ? new FormData(form) : undefined);
  }, [navigate]);

  const onClearDrawer = useCallback(() => {
    setDrawerOpen(false);
    const form = document.getElementById(LANDING_DRAWER_FORM_ID) as HTMLFormElement | null;
    if (form) form.reset();
  }, []);

  const filtersLabel = lang === "es" ? "Filtros" : "Filters";

  return (
    <>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
      >
        <LeonixCategorySearchCanvas
          lang={lang as V2Lang}
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
          browseAllHref={buildServiciosResultsBrowseHref(routeLang, {}, {})}
          browseAllLabel={browseAllLabel}
          queryPlaceholder={queryPlaceholder}
          searchButtonLabel={searchButtonLabel}
          filtersButtonLabel={filtersLabel}
          publishHref={publishHref}
          publishLabel={publishLabel}
        />
        <button type="submit" className="sr-only" tabIndex={-1} aria-hidden>
          {searchButtonLabel}
        </button>
      </form>

      <CategoryStandardFiltersDrawerShell
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApply={onApplyDrawer}
        onClear={onClearDrawer}
        lang={lang}
        testId="servicios-landing-filters-drawer"
      >
        <form id={LANDING_DRAWER_FORM_ID} onSubmit={(e) => e.preventDefault()}>
          <ServiciosResultsAdvancedFilterFields
            lang={lang}
            current={drawerDefaults}
            formId={LANDING_DRAWER_FORM_ID}
          />
        </form>
      </CategoryStandardFiltersDrawerShell>
    </>
  );
}
